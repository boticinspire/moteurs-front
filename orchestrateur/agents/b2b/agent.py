"""
Agent B2B — Moteurs.com
Qualification automatique des leads entrants + préparation d'une réponse personnalisée.

Pipeline :
  1. Claude Haiku → qualification rapide (score 1-5, profil, urgence, points clés)
  2. Claude Sonnet → brouillon de réponse email personnalisée pour Oliver
  3. Stockage en base (qualification_json + reponse_preparee)

Déclenché de façon non-bloquante après chaque soumission de formulaire B2B.
"""

import anthropic
import json
import logging
from datetime import datetime, timezone

from config import get_settings
from database import get_supabase

logger = logging.getLogger(__name__)
settings = get_settings()

# ── Contexte métier embarqué ──────────────────────────────────────────────────

CONTEXTE_MOTEURS = """\
Moteurs.com est un média de référence sur la transition énergétique des transports routiers.
Cibles : PME, artisans, gestionnaires de flottes (B2B) — France, Belgique, Suisse, Canada.
Expertise : TCO (coût total de possession), ZFE, aides 2026, suramortissement, déductibilité.
Ton éditorial : expert, direct, chiffré, sans jargon inutile.
Oliver est le fondateur — il répond personnellement aux leads qualifiés.
"""

PROFILS_FLOTTE = {
    "vul_leger":   "VUL léger (Kangoo, Berlingo, Transit Connect…)",
    "vul_lourd":   "VUL lourd (Transit, Sprinter, Master…)",
    "camion":      "Camion 3,5–19 t",
    "poids_lourd": "Poids-lourd > 19 t",
    "voiture":     "Voitures de société",
    "mix":         "Mix de véhicules",
}

PROBLEMATIQUES = {
    "zfe":         "Passage en ZFE / conformité réglementaire",
    "tco":         "Optimisation TCO / arbitrage motorisation",
    "aides":       "Maximisation des aides et subventions",
    "financement": "Plan de financement / leasing",
    "recharge":    "Infrastructure de recharge",
    "autre":       "Autre",
}


# ── Étape 1 : qualification Haiku ─────────────────────────────────────────────

PROMPT_QUALIFICATION = """\
Tu es un expert en qualification de leads B2B pour Moteurs.com, spécialiste de la transition \
énergétique des flottes professionnelles.

LEAD ENTRANT :
- Nom : {nom}
- Entreprise : {entreprise}
- Pays : {pays}
- Type de flotte : {type_flotte}
- Taille de flotte : {taille_flotte}
- Problématique principale : {problematique}
- Message : {message}

{contexte}

MISSION : Qualifie ce lead en JSON structuré. Sois factuel et concis.

Réponds UNIQUEMENT avec un JSON valide (pas de markdown, pas de texte autour) :
{{
  "score": <1 à 5 — 5 = lead chaud, fort potentiel, 1 = très froid ou hors cible>,
  "niveau_urgence": "<URGENT|MOYEN|FAIBLE>",
  "profil_detecte": "<description courte du profil en 1 phrase>",
  "points_cles": ["<point 1>", "<point 2>", "<point 3>"],
  "angle_commercial": "<quel angle d'approche privilégier avec ce lead>",
  "risques": "<points de vigilance ou d'incertitude sur ce lead>",
  "recommandation": "<que faire : appel rapide / email informatif / newsletter / ne pas suite>",
  "articles_pertinents": ["<slug ou thème d'article utile à envoyer>"]
}}
"""


async def _qualifier_lead(lead: dict) -> dict | None:
    """
    Étape 1 — Claude Haiku qualifie le lead et retourne un dict structuré.
    """
    client = anthropic.Anthropic(api_key=settings.anthropic_api_key)

    prompt = PROMPT_QUALIFICATION.format(
        nom=lead.get("nom") or "Non renseigné",
        entreprise=lead.get("entreprise") or "Non renseignée",
        pays=lead.get("pays", "FR"),
        type_flotte=PROFILS_FLOTTE.get(lead.get("type_flotte", ""), lead.get("type_flotte") or "Non renseigné"),
        taille_flotte=lead.get("taille_flotte") or "Non renseignée",
        problematique=PROBLEMATIQUES.get(lead.get("problematique", ""), lead.get("problematique") or "Non renseignée"),
        message=lead.get("message") or "Aucun message",
        contexte=CONTEXTE_MOTEURS,
    )

    try:
        message = client.messages.create(
            model="claude-haiku-4-5-20251001",
            max_tokens=600,
            messages=[{"role": "user", "content": prompt}],
        )
        texte = message.content[0].text.strip()

        # Extraire le JSON si entouré de markdown
        if "```" in texte:
            texte = texte.split("```")[1].lstrip("json").strip()

        qualification = json.loads(texte)
        logger.info(
            f"[AgentB2B] Lead qualifié — score {qualification.get('score')}/5 "
            f"({qualification.get('niveau_urgence')})"
        )
        return qualification

    except json.JSONDecodeError as e:
        logger.error(f"[AgentB2B] JSON invalide de Haiku : {e} — {texte[:200]}")
        return None
    except Exception as e:
        logger.error(f"[AgentB2B] Erreur qualification Haiku : {e}")
        return None


# ── Étape 2 : brouillon de réponse Sonnet ────────────────────────────────────

PROMPT_REPONSE = """\
Tu es Oliver, fondateur de Moteurs.com, expert en transition énergétique des flottes \
professionnelles. Tu dois rédiger un email de réponse personnalisé à un lead B2B.

PROFIL DU LEAD :
- Nom : {nom}
- Entreprise : {entreprise}
- Pays : {pays}
- Flotte : {type_flotte} — {taille_flotte}
- Problématique : {problematique}
- Message original : {message}

ANALYSE (confidentielle, ne pas mentionner dans l'email) :
- Score : {score}/5
- Profil détecté : {profil_detecte}
- Angle commercial recommandé : {angle_commercial}
- Articles pertinents à mentionner : {articles_pertinents}

{contexte}

MISSION : Rédige un email de réponse en français, naturel et professionnel.

CONSIGNES :
1. Objet de l'email en première ligne : "Objet : ..."
2. Accroche personnalisée (montre que tu as lu leur message)
3. 1 à 2 éléments de valeur concrets liés à leur problématique (chiffres, aides, TCO)
4. Mention naturelle d'un ou deux articles Moteurs.com pertinents si applicable
5. Proposition d'action claire : appel, réponse, simulateur…
6. Signature : "Oliver — Moteurs.com"
7. Ton : expert mais humain, pas de jargon commercial, pas de bullet points excessifs
8. Longueur : 150 à 250 mots maximum

Écris uniquement l'email, rien d'autre.
"""


async def _preparer_reponse(lead: dict, qualification: dict) -> str | None:
    """
    Étape 2 — Claude Sonnet prépare un brouillon de réponse personnalisé.
    """
    client = anthropic.Anthropic(api_key=settings.anthropic_api_key)

    articles = ", ".join(qualification.get("articles_pertinents", [])) or "aucun spécifique"

    prompt = PROMPT_REPONSE.format(
        nom=lead.get("nom") or "équipe",
        entreprise=lead.get("entreprise") or "votre entreprise",
        pays=lead.get("pays", "FR"),
        type_flotte=PROFILS_FLOTTE.get(lead.get("type_flotte", ""), lead.get("type_flotte") or "flotte"),
        taille_flotte=lead.get("taille_flotte") or "non renseignée",
        problematique=PROBLEMATIQUES.get(lead.get("problematique", ""), lead.get("problematique") or "transition énergétique"),
        message=lead.get("message") or "Aucun message",
        score=qualification.get("score", "?"),
        profil_detecte=qualification.get("profil_detecte", ""),
        angle_commercial=qualification.get("angle_commercial", ""),
        articles_pertinents=articles,
        contexte=CONTEXTE_MOTEURS,
    )

    try:
        message = client.messages.create(
            model="claude-sonnet-4-6",
            max_tokens=800,
            messages=[{"role": "user", "content": prompt}],
        )
        reponse = message.content[0].text.strip()
        logger.info(f"[AgentB2B] Brouillon réponse généré ({len(reponse)} car.)")
        return reponse

    except Exception as e:
        logger.error(f"[AgentB2B] Erreur préparation réponse Sonnet : {e}")
        return None


# ── Orchestration ─────────────────────────────────────────────────────────────

async def traiter_lead(lead_id: int) -> dict:
    """
    Point d'entrée principal.
    1. Charge le lead depuis Supabase
    2. Qualifie avec Haiku
    3. Prépare la réponse avec Sonnet
    4. Met à jour le lead en base
    """
    supabase = get_supabase()

    res = supabase.table("leads").select("*").eq("id", lead_id).single().execute()
    lead = res.data
    if not lead:
        logger.error(f"[AgentB2B] Lead #{lead_id} introuvable")
        return {"succes": False, "erreur": "Lead introuvable"}

    logger.info(
        f"[AgentB2B] Traitement lead #{lead_id} — "
        f"{lead.get('entreprise') or lead.get('email', '?')}"
    )

    # Étape 1 : qualification
    qualification = await _qualifier_lead(lead)
    if not qualification:
        qualification = {
            "score": 0,
            "niveau_urgence": "INCONNU",
            "profil_detecte": "Qualification échouée",
            "recommandation": "Vérifier manuellement",
        }

    # Étape 2 : brouillon de réponse (seulement si score >= 2)
    reponse = None
    if qualification.get("score", 0) >= 2:
        reponse = await _preparer_reponse(lead, qualification)

    # Mise à jour en base
    try:
        supabase.table("leads").update({
            "score_potentiel": qualification.get("score"),
            "qualification_json": qualification,
            "reponse_preparee": reponse,
        }).eq("id", lead_id).execute()

        logger.info(
            f"[AgentB2B] ✅ Lead #{lead_id} traité — "
            f"score {qualification.get('score')}/5, "
            f"réponse {'prête' if reponse else 'non générée (score < 2)'}"
        )
        return {
            "succes": True,
            "lead_id": lead_id,
            "score": qualification.get("score"),
            "urgence": qualification.get("niveau_urgence"),
            "reponse_prete": reponse is not None,
        }

    except Exception as e:
        logger.error(f"[AgentB2B] Erreur mise à jour Supabase : {e}")
        return {"succes": False, "erreur": str(e)}
