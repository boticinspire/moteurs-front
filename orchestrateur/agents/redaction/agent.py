import anthropic
import logging
import re
import unicodedata
from datetime import datetime

from config import get_settings
from database import get_supabase

logger = logging.getLogger(__name__)
settings = get_settings()

# Mapping segment nom → id Supabase
SEGMENTS = {"B2B": 1, "Particulier": 2}

# ── Contextes réglementaires par pays cible ───────────────────────────────────

CONTEXTES_PAYS = {
    "FR": {
        "nom": "France",
        "contexte_reglementaire": """\
• ZFE-m dans 43 agglomérations (Paris, Lyon, Marseille…) — Crit'Air 3 progressivement interdits
• Bonus écologique : jusqu'à 7 000 € particuliers, 9 000 € entreprises (sous conditions de revenus)
• Suramortissement 40 % sur véhicules propres en entreprise (base plafonnée à 30 000 €)
• Leasing social à partir de 100 €/mois pour ménages modestes éligibles
• CEE (Certificats d'Économie d'Énergie) finançant les bornes de recharge en entreprise
• TVS remplacée par taxe annuelle sur émissions CO₂ (avantage fort pour véhicules < 20 g/km)""",
    },
    "BE": {
        "nom": "Belgique",
        "contexte_reglementaire": """\
• Déductibilité fiscale 100 % pour véhicules zéro émission achetés jusqu'en 2027
• Avantage ATN fortement réduit pour voitures de société électriques
• Wallonie : prime PIVERT jusqu'à 4 500 € pour véhicule électrique neuf
• Bruxelles : prime régionale jusqu'à 4 000 € pour véhicule électrique
• Flandre : prime Ecoscore progressive selon émissions
• LEZ (Low Emission Zones) à Bruxelles, Anvers et Gand — extension prévue
• Obligation d'infrastructure de recharge en entreprise dès 2030""",
    },
    "CH": {
        "nom": "Suisse",
        "contexte_reglementaire": """\
• Bonus cantonaux variables : Vaud 3 000 CHF, Genève 3 000 CHF, Berne 2 000 CHF
• Exonération ou réduction de l'impôt sur les véhicules dans de nombreux cantons
• Pas de ZFE nationale, mais pression forte sur les importateurs (objectif CO₂ fédéral)
• CHF fort : prix à l'achat compétitifs pour les véhicules importés de la zone euro
• Réseau de recharge dense dans les grandes agglomérations (SwissCharge, EVPASS…)
• Objectif national : 50 % de nouveaux véhicules électriques d'ici 2030""",
    },
    "CA": {
        "nom": "Canada",
        "contexte_reglementaire": """\
• Programme fédéral iVZEV : jusqu'à 5 000 CAD pour VE < 55 000 CAD, 2 500 CAD pour PHEV
• Québec — Roulez vert : jusqu'à 8 000 CAD (cumulable avec fédéral)
• Colombie-Britannique — CleanBC : jusqu'à 4 000 CAD de rabais
• Ontario : programme supprimé en 2018, pression politique pour réintroduction
• Réseau de recharge en expansion rapide (CAA, Petro-Canada, Tesla Supercharger)
• Défis spécifiques : autonomie par grand froid (-30 °C), longues distances inter-villes""",
    },
    "LU": {
        "nom": "Luxembourg",
        "contexte_reglementaire": """\
• Prime d'État : 8 000 € pour véhicule électrique neuf (sous conditions de revenus)
• Déductibilité TVA à 100 % pour véhicules zéro émission en entreprise
• Pas de vignette autoroutière (routes gratuites) — avantage logistique transfrontalier
• Forte proportion de travailleurs frontaliers (FR, BE, DE) : enjeux recharge domicile hors LU
• Réseau de recharge public dense (Chargy 400+ bornes) avec tarif social
• Objectif national : 49 % de VE dans les nouvelles immatriculations d'ici 2030
• ZFE en discussion pour Luxembourg-Ville ; interdiction thermique neuf prévue 2035 (UE)""",
    },
}

# Pays cibles générés selon la provenance du signal
PAYS_DECLINATIONS: dict[str, list[str]] = {
    "FR": ["FR", "BE", "CH", "CA"],
    "EU": ["FR", "BE", "CH", "CA", "LU"],
    "BE": ["BE", "FR", "CH", "LU"],
    "CH": ["CH", "FR", "BE"],
    "CA": ["CA", "FR"],
    "DE": ["FR", "BE", "CH", "LU"],
}


# ── Étape 1 : extraction de faits (Claude Haiku) ─────────────────────────────
# On ne transmet JAMAIS le texte brut à l'étape rédaction.
# Seuls des faits synthétisés (chiffres, acteurs, décisions) passent la frontière.

PROMPT_EXTRACTION_FAITS = """\
Tu es un extracteur de faits journalistiques. Ton rôle est d'identifier \
les informations factuelles clés dans un texte source, SANS paraphraser ni reproduire le contenu.

TEXTE SOURCE (langue : {langue}) :
{contenu}

---

Extrait UNIQUEMENT les faits objectifs et vérifiables :
- Chiffres, pourcentages, montants en euros/CHF/CAD
- Dates, délais ou échéances annoncées
- Noms d'entreprises, modèles de véhicules, décisions officielles
- Réglementations, aides ou politiques mentionnées

FORMAT DE RÉPONSE : liste de 5 à 8 faits en français, un fait par ligne commençant par "•".
Chaque fait = 1 phrase courte et factuelle.
Ne reproduis AUCUNE phrase du texte source. Synthétise uniquement les données brutes.
Si le texte ne contient pas assez d'informations factuelles concrètes, réponds : INSUFFISANT
"""


async def _extraire_faits(contenu_brut: str, langue: str) -> str | None:
    """
    Étape 1 — Claude Haiku extrait les faits clés du contenu scrapé.
    Retourne une liste de faits en texte, ou None si contenu insuffisant.
    Partagé entre toutes les déclinaisons géographiques d'un même signal.
    """
    client = anthropic.Anthropic(api_key=settings.anthropic_api_key)
    contenu_tronque = contenu_brut[:3000]  # Haiku, on limite

    try:
        message = client.messages.create(
            model="claude-haiku-4-5-20251001",
            max_tokens=400,
            messages=[{
                "role": "user",
                "content": PROMPT_EXTRACTION_FAITS.format(
                    langue=langue,
                    contenu=contenu_tronque,
                ),
            }],
        )
        texte = message.content[0].text.strip()
        if "INSUFFISANT" in texte or not texte.startswith("•"):
            logger.info("[AgentRédaction] Extraction faits : contenu insuffisant")
            return None
        return texte

    except Exception as e:
        logger.error(f"[AgentRédaction] Erreur extraction faits Haiku : {e}")
        return None


# ── Étape 2 : rédaction originale par pays cible (Claude Sonnet) ─────────────
# Le prompt ne contient AUCUN extrait du texte source.
# Claude écrit à partir des faits extraits + son expertise éditoriale locale.

PROMPT_REDACTION = """\
Tu es le rédacteur expert de Moteurs.com, un média de référence sur la \
transition énergétique des transports routiers.

SIGNAL DE VEILLE :
- Titre du sujet : {titre}
- Source d'information : {source_nom} ({pays_source}, langue originale : {langue_source})
- URL de la source : {url_origine}

FAITS CLÉS EXTRAITS DE LA SOURCE :
{faits_extraits}

PAYS CIBLE : {pays_nom}
CONTEXTE RÉGLEMENTAIRE ET FISCAL LOCAL :
{contexte_reglementaire}

---

MISSION : Rédige un article ORIGINAL et COMPLET pour Moteurs.com, OBLIGATOIREMENT EN FRANÇAIS, \
ciblant spécifiquement les lecteurs {pays_nom}s.

⚠️ RÈGLE ABSOLUE : tu n'as PAS accès au texte source original. Les faits ci-dessus sont \
les seules données issues de la source. Tout le reste de l'article — analyse, mise en contexte, \
comparaisons, conseils pratiques — doit être ta propre production originale.

Public cible : {public_cible} basés en {pays_nom}
Angle éditorial : décryptage par les chiffres, avec focus sur les implications concrètes \
pour le marché {pays_nom} (TCO local, aides disponibles, réglementation en vigueur).
Ton : expert mais accessible, direct, concret et utile.

CONSIGNES RÉDACTIONNELLES :
1. Chapeau (2-3 phrases) : l'essentiel du sujet et pourquoi c'est important pour nos lecteurs {pays_nom}s
2. 3 à 4 sections <h2> dont obligatoirement une section "{pays_nom} : ce que ça change" \
   intégrant le contexte réglementaire local ci-dessus
3. Ajoute des éléments de valeur : impact TCO avec les prix et aides locaux, comparaisons pratiques
4. Note de source en fin d'article : "D'après <a href='{url_origine}'>{source_nom}</a>"
5. Conclusion actionnable pour les lecteurs {pays_nom}s
6. 550 à 750 mots au total
7. Pas de titre répété dans le corps de l'article
8. N'invente pas de chiffres — si tu n'as pas l'info, dis "selon les estimations" ou pose la \
question dans la FAQ
"""

# Schéma tool_use — Claude encode le JSON, pas de problème d'échappement HTML
TOOL_ARTICLE = {
    "name": "creer_article",
    "description": "Crée un article structuré et original pour Moteurs.com",
    "input_schema": {
        "type": "object",
        "properties": {
            "titre": {
                "type": "string",
                "description": "Titre accrocheur et original, 60 caractères maximum",
            },
            "slug": {
                "type": "string",
                "description": "Slug URL sans accents ni caractères spéciaux, tirets uniquement, SANS suffixe de pays",
            },
            "contenu_html": {
                "type": "string",
                "description": "Corps complet de l'article en HTML : <p>, <h2>, <ul>, <strong> autorisées. Contenu 100% original.",
            },
            "resume_50mots": {
                "type": "string",
                "description": "Résumé original de l'article en 50 mots maximum",
            },
            "meta_title": {
                "type": "string",
                "description": "Titre SEO optimisé, 55 à 60 caractères",
            },
            "meta_description": {
                "type": "string",
                "description": "Description SEO incitative, 150 à 160 caractères",
            },
            "segment": {
                "type": "string",
                "enum": ["B2B", "Particulier"],
                "description": "Public cible principal de cet article",
            },
            "faq": {
                "type": "array",
                "description": "2 à 3 questions-réponses originales sur le sujet, adaptées au contexte local",
                "items": {
                    "type": "object",
                    "properties": {
                        "question": {"type": "string"},
                        "reponse": {"type": "string"},
                    },
                    "required": ["question", "reponse"],
                },
            },
        },
        "required": [
            "titre", "slug", "contenu_html", "resume_50mots",
            "meta_title", "meta_description", "segment", "faq",
        ],
    },
}


def _slugify(texte: str) -> str:
    """Convertit un texte en slug URL (sans accents, minuscules, tirets)."""
    slug = unicodedata.normalize("NFKD", texte.lower())
    slug = slug.encode("ascii", "ignore").decode("ascii")
    slug = re.sub(r"[^a-z0-9]+", "-", slug).strip("-")
    return slug[:80]


def _detecter_segment(item: dict) -> str:
    """Heuristique : B2B si le contenu évoque les professionnels."""
    mots_b2b = [
        "flotte", "flottes", "pme", "artisan", "artisans",
        "camion", "camions", "van", "vul", "utilitaire", "utilitaires",
        "entreprise", "entreprises", "professionnel", "professionnels",
        "livraison", "transport routier", "chauffeur", "chauffeurs",
    ]
    texte = " ".join([
        item.get("titre", ""),
        item.get("resume_ia", ""),
    ]).lower()
    return "B2B" if any(m in texte for m in mots_b2b) else "Particulier"


async def generer_article(
    item: dict,
    source: dict,
    pays_cible: str,
    faits_extraits: str,
) -> dict | None:
    """
    Étape 2 — Claude Sonnet rédige un article original pour un pays cible donné.
    Les faits extraits sont partagés (calculés une seule fois en amont).
    Retourne le dict de l'article, ou None en cas d'échec.
    """
    client = anthropic.Anthropic(api_key=settings.anthropic_api_key)
    segment = _detecter_segment(item)
    public = (
        "professionnels : PME, artisans, gestionnaires de flottes"
        if segment == "B2B"
        else "particuliers souhaitant passer à un véhicule à énergie alternative"
    )

    contexte = CONTEXTES_PAYS.get(pays_cible, CONTEXTES_PAYS["FR"])

    prompt = PROMPT_REDACTION.format(
        titre=item.get("titre", ""),
        source_nom=source.get("nom", "Source externe"),
        pays_source=source.get("pays", "EU"),
        langue_source=source.get("langue", "fr"),
        url_origine=item.get("url_origine", ""),
        faits_extraits=faits_extraits,
        pays_nom=contexte["nom"],
        contexte_reglementaire=contexte["contexte_reglementaire"],
        public_cible=public,
    )

    try:
        message = client.messages.create(
            model="claude-sonnet-4-6",
            max_tokens=2800,
            tools=[TOOL_ARTICLE],
            tool_choice={"type": "any"},
            messages=[{"role": "user", "content": prompt}],
        )

        tool_block = next(
            (b for b in message.content if b.type == "tool_use"),
            None,
        )
        if not tool_block:
            logger.warning(f"[AgentRédaction] Aucun tool_use dans la réponse Sonnet ({pays_cible})")
            return None

        data = tool_block.input
        data["_segment_detecte"] = segment
        data["_faits_extraits"] = faits_extraits
        data["_pays_cible"] = pays_cible
        return data

    except anthropic.APIError as e:
        logger.error(f"[AgentRédaction] Erreur API Anthropic Sonnet ({pays_cible}) : {e}")
        return None
    except Exception as e:
        logger.error(f"[AgentRédaction] Erreur inattendue ({pays_cible}) : {e}")
        return None


async def generer_declinaisons(item: dict, source: dict) -> list[dict]:
    """
    Génère toutes les déclinaisons géographiques d'un signal.
    1 seul appel Haiku (extraction faits) partagé entre toutes les déclinaisons.
    N appels Sonnet (un par pays cible).
    Retourne une liste de dicts articles (éventuellement vide).
    """
    # ── Étape 1 : extraction des faits — une seule fois ──
    langue_source = source.get("langue", "fr")
    contenu_brut = item.get("contenu_brut", "")
    resume_ia = item.get("resume_ia", "")
    texte_source = contenu_brut if len(contenu_brut) > 100 else resume_ia

    faits_extraits = await _extraire_faits(texte_source, langue_source)

    if not faits_extraits:
        if resume_ia:
            faits_extraits = f"• {resume_ia}"
            logger.info("[AgentRédaction] Fallback : résumé IA utilisé comme base de faits")
        else:
            logger.warning(f"[AgentRédaction] Aucun fait extractible : {item.get('titre', '')[:60]}")
            return []

    # ── Déterminer les pays cibles selon la provenance ──
    pays_source = source.get("pays", "EU").upper()
    pays_cibles = PAYS_DECLINATIONS.get(pays_source, ["FR", "BE", "CH", "CA"])
    logger.info(f"[AgentRédaction] Signal {pays_source} → déclinaisons : {pays_cibles}")

    # ── Étape 2 : rédaction originale par pays cible ──
    articles = []
    for pays in pays_cibles:
        logger.info(f"[AgentRédaction] Génération {pays} : {item.get('titre', '')[:50]}")
        article = await generer_article(item, source, pays, faits_extraits)
        if article:
            articles.append(article)
        else:
            logger.warning(f"[AgentRédaction] Échec génération {pays}")

    logger.info(f"[AgentRédaction] {len(articles)}/{len(pays_cibles)} déclinaisons générées")
    return articles


async def run_redaction_item(item: dict, source: dict) -> int:
    """
    Traite un veille_item : génère toutes les déclinaisons et les insère en base.
    Retourne le nombre d'articles créés.
    """
    supabase = get_supabase()
    logger.info(f"[AgentRédaction] Traitement : {item.get('titre', '')[:70]}")

    articles_data = await generer_declinaisons(item, source)
    if not articles_data:
        return 0

    crees = 0
    premier_article_id = None

    for article_data in articles_data:
        pays_cible = article_data.get("_pays_cible", "FR")
        segment_nom = article_data.get("segment", article_data.get("_segment_detecte", "Particulier"))
        segment_id = SEGMENTS.get(segment_nom, 2)

        # Slug suffixé par pays : aide-vul-electrique-fr, aide-vul-electrique-be…
        base_slug = article_data.get("slug") or _slugify(
            article_data.get("titre", item.get("titre", ""))
        )
        slug = f"{base_slug}-{pays_cible.lower()}"

        try:
            result = supabase.table("articles").insert({
                "titre_provisoire": article_data.get("titre", item.get("titre", ""))[:255],
                "slug": slug,
                "profil_id": 1,
                "segment_id": segment_id,
                "pays_cible": pays_cible,
                "etat_code": "EN_ATTENTE_VALIDATION",
                "etat_updated_at": datetime.utcnow().isoformat(),
                "contenu_html": article_data.get("contenu_html", ""),
                "resume_50mots": article_data.get("resume_50mots", "")[:300],
                "meta_title": article_data.get("meta_title", "")[:70],
                "meta_description": article_data.get("meta_description", "")[:200],
                "faq_json": article_data.get("faq", []),
                "sources_json": {
                    "veille_item_id": item["id"],
                    "url_origine": item.get("url_origine"),
                    "source_nom": source.get("nom"),
                    "pays_source": source.get("pays"),
                    "langue": source.get("langue"),
                    "pertinence_score": float(item.get("pertinence_score", 0)),
                    "faits_extraits": article_data.get("_faits_extraits", ""),
                },
            }).execute()

            article_id = result.data[0]["id"]
            if premier_article_id is None:
                premier_article_id = article_id

            logger.info(
                f"[AgentRédaction] ✅ Article #{article_id} ({pays_cible}) : "
                f"{article_data.get('titre', '')[:60]}"
            )
            crees += 1

        except Exception as e:
            err_str = str(e)
            # Slug déjà existant (23505) → article déjà généré, ce n'est pas une erreur bloquante
            if "23505" in err_str or "duplicate key" in err_str.lower():
                logger.info(f"[AgentRédaction] Slug '{slug}' déjà existant ({pays_cible}) — ignoré")
                # Compter comme "traité" pour que le veille_item soit marqué TRAITE
                crees += 1
            else:
                logger.error(f"[AgentRédaction] Erreur insertion Supabase ({pays_cible}) : {e}")

    # Marquer le veille_item comme traité (lien vers le premier article FR)
    if crees > 0:
        try:
            supabase.table("veille_items").update({
                "statut": "TRAITE",
                "article_id": premier_article_id,
            }).eq("id", item["id"]).execute()
        except Exception as e:
            logger.error(f"[AgentRédaction] Erreur mise à jour veille_item : {e}")

    return crees


async def run_redaction_batch(limit: int = 3) -> dict:
    """
    Traite les veille_items en attente (statut=NOUVEAU, score >= 0.7).
    Limite à `limit` items par cycle pour maîtriser les coûts Sonnet.
    Chaque item peut générer jusqu'à 4 articles (déclinaisons géo).
    """
    supabase = get_supabase()

    result = (
        supabase.table("veille_items")
        .select("*, sources(*)")
        .eq("statut", "NOUVEAU")
        .gte("pertinence_score", 0.7)
        .order("pertinence_score", desc=True)
        .limit(limit)
        .execute()
    )

    items = result.data
    if not items:
        logger.info("[AgentRédaction] Aucun item éligible (NOUVEAU, score >= 0.7)")
        return {"articles_generes": 0, "items_traites": 0}

    logger.info(f"[AgentRédaction] {len(items)} items éligibles, génération en cours...")
    total_articles = 0

    for item in items:
        source = item.pop("sources", None) or {}
        try:
            n = await run_redaction_item(item, source)
            total_articles += n
        except Exception as e:
            logger.error(f"[AgentRédaction] Erreur item #{item.get('id')}: {e}")
            continue

    logger.info(f"[AgentRédaction] Batch terminé : {total_articles} article(s) généré(s) sur {len(items)} item(s)")
    return {"articles_generes": total_articles, "items_traites": len(items)}
