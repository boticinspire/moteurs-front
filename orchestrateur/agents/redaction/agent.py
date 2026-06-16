import logging
import re
import unicodedata
from datetime import datetime

from config import get_settings
from database import get_supabase
from safe_agent import get_veille_agent, get_redaction_agent
from agents.common import dedup

logger = logging.getLogger(__name__)
settings = get_settings()

# Mapping segment nom → id Supabase
SEGMENTS = {"B2B": 1, "Particulier": 2}

# ── Politique de génération (2026-06-16) ──────────────────────────────────────
# True  : l'Agent Rédaction ne génère qu'UN SEUL article (pays + audience
#         primaires) par signal de veille. Les déclinaisons géographiques BE/CH/CA
#         sont créées APRÈS validation éditoriale d'Oliver, via
#         generer_declinaisons_post_validation(). Objectif : ~80 % d'appels Sonnet
#         en moins et une file de validation sans quasi-doublons (un même signal
#         ne remplit plus la file de 6 reformulations 3 pays × 2 audiences).
# False : ancien comportement (fan-out 1→N à la génération).
GENERER_UN_SEUL_ARTICLE = True

# ── Contextes réglementaires par pays cible ───────────────────────────────────
# ⚠️ MAINTENANCE CRITIQUE : ces chaînes sont injectées telles quelles dans le prompt
# et traitées par le modèle comme SOURCE DE VÉRITÉ. Toute aide / montant / date faux
# ici se propage à TOUS les articles du pays. À auditer et dater régulièrement.
# Ne jamais inscrire un nom de dispositif non vérifié (ex. l'ancienne fausse « prime
# PIVERT » en BE a contaminé 248 articles avant correction le 08/06/2026).

CONTEXTES_PAYS = {
    "FR": {
        "nom": "France",
        "contexte_reglementaire": """\
• ZFE : la suppression votée en avril 2026 a été ANNULÉE par le Conseil constitutionnel (21 mai 2026) — les ZFE RESTENT en vigueur dans 43 agglomérations. Verbalisation variable : Paris (pas de PV en 2026), Lyon (dès le 1er juillet 2026), Grenoble (déjà active, 68 €). Crit'Air 3 et au-delà visés.
• Bonus écologique 2026 — voitures 100 % ÉLECTRIQUES NEUVES uniquement (prix < 47 000 €, poids < 2 400 kg, score environnemental ADEME ≥ 60/80) : jusqu'à 5 700 € (ménages très modestes), 4 700 € (modestes), 3 500 € (autres) + surbonus batterie européenne de 1 200 à 2 000 €. ⚠️ Les hybrides rechargeables (PHEV) ne sont PLUS éligibles depuis le 1er juillet 2025.
• Prime à la conversion : SUPPRIMÉE fin 2024 — ne jamais la citer comme aide active.
• Leasing social 2026 : location d'un VE neuf à partir de 82 à 200 €/mois pour ménages modestes éligibles (critère « gros rouleur »), ouverture le 16 juillet 2026, NON cumulable avec le bonus écologique.
• Entreprises : suramortissement 40 % sur véhicules lourds électriques (jusqu'à fin 2026), TVA récupérable à 100 % sur VE et VUL.
• Bornes de recharge : crédit d'impôt jusqu'à 500 €/borne (particuliers) + primes CEE (Certificats d'Économie d'Énergie).
• TVS remplacée par taxe annuelle sur émissions CO₂ (avantage fort pour véhicules < 20 g/km)
• (Contexte réglementaire vérifié et daté du 12/06/2026 — à réauditer régulièrement.)""",
    },
    "BE": {
        "nom": "Belgique",
        "contexte_reglementaire": """\
• Voitures de société : déductibilité fiscale avantageuse (jusqu'à 100 %) pour les modèles zéro émission, dégressive dans le temps ; les véhicules thermiques perdent progressivement leurs avantages fiscaux
• Avantage de toute nature (ATN) fortement réduit pour les voitures de société électriques
• AUCUNE prime régionale à l'achat pour les particuliers en 2026 : la prime flamande a pris fin en 2025 ; la Wallonie et Bruxelles n'accordent pas de prime d'achat aux particuliers. ⚠️ Il n'existe PAS de « prime PIVERT » pour les véhicules électriques — PIVERT est un ancien plan wallon de voiries, à ne jamais citer comme aide VE
• Wallonie et Bruxelles : taxe de mise en circulation (TMC) et taxe de circulation annuelle plafonnées au minimum légal pour un véhicule 100 % électrique
• Flandre : fin des exonérations TMC / taxe de circulation pour les VE neufs immatriculés à partir du 1er janvier 2026 (les immatriculations antérieures conservent l'exonération)
• LEZ (zones de basses émissions) à Bruxelles, Anvers et Gand — extension prévue
• Des aides locales (communes) peuvent exister : à vérifier au cas par cas auprès de la commune, sans citer de montant non vérifié""",
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
• Programme fédéral PAVE (Programme d'abordabilité des véhicules électriques), lancé en février 2026 : jusqu'à 5 000 CAD pour un VE, 2 500 CAD pour un PHEV (l'ancien iVZEV est clos depuis le 31 mars 2025)
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
    # Réduit pour maîtriser les coûts Sonnet (−50% appels)
    # Priorité aux marchés FR + BE ; CH/CA/LU en manuel via ?limit=10
    "FR": ["FR", "BE"],
    "EU": ["FR", "BE", "CH"],
    "BE": ["BE", "FR"],
    "CH": ["CH", "FR"],
    "CA": ["CA", "FR"],
    "DE": ["FR", "BE"],
}


# ── Étape 0 : classification cible audience (Claude Haiku) ────────────────────
# Détermine si le signal cible "particulier" (B2C), "pro" (B2B) ou "mixte"
# (mérite 2 versions distinctes). Réutilisé par toutes les déclinaisons pays.

CIBLES_VALIDES = ("particulier", "pro", "mixte")

PROMPT_CLASSIFIER_CIBLE = """\
Tu classifies un signal de veille selon son audience principale chez Moteurs.com,
un média sur la transition énergétique des transports routiers.

TITRE : {titre}
RÉSUMÉ : {resume}

Détermine l'audience principale :
- "particulier" : intéresse d'abord les ménages (achat voiture perso, bonus écologique,
  prime conversion, recharge maison/copro, ZFE pour particuliers, vélo électrique,
  scooter perso, vacances en VE, autonomie réelle, ergonomie habitacle...)
- "pro" : intéresse d'abord les entreprises (flottes, VUL, camions, déductibilité
  fiscale entreprise, suramortissement, ATN voiture de société, leasing pro, IK,
  transport routier, livraison, artisan, PME, infrastructure de recharge entreprise)
- "mixte" : mérite 2 traitements distincts car concerne fortement les 2 audiences
  (ZFE qui touche pros ET particuliers, infrastructure de recharge publique,
  fin du thermique 2035, prix de l'énergie, accord politique majeur)

Réponds STRICTEMENT par un seul mot : particulier, pro, ou mixte
"""


def _detecter_cible_heuristique(item: dict) -> str:
    """Fallback heuristique sur mots-clés B2B classiques."""
    mots_pro = [
        "flotte", "flottes", "pme", "artisan", "artisans",
        "camion", "camions", "van", "vul", "utilitaire", "utilitaires",
        "entreprise", "entreprises", "professionnel", "professionnels",
        "livraison", "transport routier", "chauffeur", "chauffeurs",
        "fleet", "atn", "déductibilité", "deductibilite", "suramortissement",
        "leasing pro", "ik", "indemnité kilométrique",
    ]
    texte = " ".join([item.get("titre", ""), item.get("resume_ia", "")]).lower()
    return "pro" if any(m in texte for m in mots_pro) else "particulier"


async def _classifier_cible(item: dict) -> str:
    """
    Classifier Haiku : particulier / pro / mixte.
    Fallback heuristique mot-clés en cas d'erreur.
    ✅ PROTECTION : SafeAgent wrapper (timeout 2 min, max 3 itérations)
    """
    titre = (item.get("titre", "") or "")[:200]
    resume = (item.get("resume_ia", "") or "")[:500]

    agent = get_veille_agent(api_key=settings.anthropic_api_key)
    result = agent.call(
        messages=[{
            "role": "user",
            "content": PROMPT_CLASSIFIER_CIBLE.format(titre=titre, resume=resume),
        }],
        max_tokens=10
    )

    if result['success']:
        reponse = result['content'].strip().lower()
        for c in CIBLES_VALIDES:
            if c in reponse:
                logger.info(f"[AgentRédaction] Cible classifiée : {c} (titre={titre[:50]!r})")
                return c
        logger.warning(
            f"[AgentRédaction] Classifier réponse inattendue : {reponse!r} → fallback heuristique"
        )
    else:
        logger.error(f"[AgentRédaction] Erreur classifier : {result['error_type']} → fallback heuristique")

    fallback = _detecter_cible_heuristique(item)
    logger.info(f"[AgentRédaction] Cible (heuristique) : {fallback}")
    return fallback


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
    ✅ PROTECTION : SafeAgent wrapper (timeout 5 min, max 10 itérations)
    """
    agent = get_veille_agent(api_key=settings.anthropic_api_key)
    contenu_tronque = contenu_brut[:3000]  # Haiku, on limite

    result = agent.call(
        messages=[{
            "role": "user",
            "content": PROMPT_EXTRACTION_FAITS.format(
                langue=langue,
                contenu=contenu_tronque,
            ),
        }],
        max_tokens=400
    )

    if not result['success']:
        logger.error(f"[AgentRédaction] Erreur extraction faits : {result['error_type']}")
        return None

    texte = result['content'].strip()
    if "INSUFFISANT" in texte or not texte.startswith("•"):
        logger.info("[AgentRédaction] Extraction faits : contenu insuffisant")
        return None
    return texte


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
9. N'invente PAS le nom d'une aide publique (prime, bonus, subvention, programme) — ne cite \
un dispositif spécifique QUE si son nom exact figure dans les faits extraits ou le contexte \
réglementaire ci-dessus. Pour toute aide non citée : formulation générique ("des aides \
régionales peuvent exister") + renvoi vers le site officiel.
"""


# ── Étape 2 bis : rédaction PARTICULIER (Claude Sonnet) ──────────────────────
# Variante grand public : ton « vous », profils-types chiffrés, vocabulaire
# sans jargon B2B, CTA orientés outils (simulateur, comparateur), pas formulaire commercial.

PROMPT_REDACTION_PARTICULIER = """\
Tu es le rédacteur expert de Moteurs.com qui parle aux PARTICULIERS de transition énergétique
avec clarté, précision et pédagogie. Pas de jargon B2B.

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

MISSION : Rédige un article ORIGINAL et COMPLET pour Moteurs.com, EN FRANÇAIS,
ciblant spécifiquement les PARTICULIERS basés en {pays_nom}.

⚠️ RÈGLE ABSOLUE : tu n'as PAS accès au texte source original. Les faits ci-dessus sont
les seules données issues de la source. Tout le reste — analyse, exemples chiffrés,
conseils pratiques — est ta propre production originale.

PUBLIC : ménages, familles, jeunes actifs, retraités. PAS des pros, PAS des gestionnaires de flotte.

TON ET STYLE :
- Tu t'adresses au lecteur en « vous », jamais à « votre entreprise » ou « votre flotte »
- Vocabulaire interdit sans définition simple en parenthèses : TCO, flotte, IK, déductibilité,
  amortissement, lease, super-bonus pro, ATN
- Tu emploies au moins UN exemple chiffré centré sur un profil-type concret, par exemple :
  • Couple avec 2 enfants, ~12 000 km/an, mix urbain/route
  • Retraité, ~8 000 km/an, principalement urbain
  • Jeune actif urbain, ~6 000 km/an, sans place de parking attitrée
  • Famille rurale, ~18 000 km/an, maison avec garage
- Quand tu chiffres : impact en €/mois, €/an ou payback (années). Pas en €/km abstrait.
- Si tu emploies un sigle (ZFE, VE, PHEV, BEV, CEE), explique-le en une phrase à la 1re occurrence

CONSIGNES RÉDACTIONNELLES :
1. Chapeau (2-3 phrases) : ce qui change CONCRÈTEMENT pour vous, lecteur {pays_nom}s
2. 3 à 4 sections <h2>, dont obligatoirement une intitulée « {pays_nom} : ce que vous gagnez
   (ou perdez) » qui intègre le contexte réglementaire local ci-dessus
3. Au moins UN bloc « Exemple chiffré » avec un profil-type complet :
   profil + kilométrage annuel + situation recharge + calcul €/an d'économie ou de surcoût
4. Une section finale « Concrètement, qu'est-ce que je fais ? » avec 2-3 actions actionnables
   (vérifier votre éligibilité au bonus, simuler votre trajet, etc.)
5. Note de source en fin : « D'après <a href='{url_origine}'>{source_nom}</a> »
6. 550 à 750 mots au total
7. Pas de titre répété dans le corps de l'article
8. N'invente pas de chiffres — si tu n'as pas l'info, dis « selon les estimations » ou pose
   la question dans la FAQ
9. N'invente PAS le nom d'une aide publique (prime, bonus, subvention, programme) — ne cite
   un dispositif spécifique QUE si son nom exact figure dans les faits extraits ou le contexte
   réglementaire ci-dessus. Pour toute aide non citée : formulation générique
   (« des aides régionales peuvent exister ») + renvoi vers le site officiel.
10. CTA naturel vers les outils Moteurs.com : /simulateur (TCO perso),
    /comparer-trajet (coût d'un trajet), /espace-membres (alertes aides personnalisées).
    ⚠️ JAMAIS de CTA vers un formulaire commercial ou une démo B2B.
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


def _tronquer_aux_mots(texte: str, maxlen: int) -> str:
    """
    Tronque `texte` à <= maxlen caractères sans couper un mot.
    La coupe au dernier espace n'est acceptée que si elle conserve au moins
    75 % de maxlen (évite de tomber sous le seuil SEO « trop court »).
    Garantit que les meta arrivent déjà dans les plages avant l'étape SEO.
    """
    texte = " ".join((texte or "").split())  # normalise espaces / retours ligne
    if len(texte) <= maxlen:
        return texte
    coupe = texte[:maxlen]
    espace = coupe.rfind(" ")
    if espace >= maxlen * 3 // 4:
        coupe = coupe[:espace]
    return coupe.rstrip(" ,.;:-—…")


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


# ── Guard anti-doublon (0 token) ──────────────────────────────────────────────
# Vérifie avant chaque appel Sonnet si un article similaire existe déjà
# en base pour le même (pays_cible × cible), via deux critères :
#   1. Même URL source → doublon certain
#   2. Similarité de Jaccard sur mots-clés du titre ≥ seuil → doublon probable
# Aucun appel LLM, aucun token consommé.

_STOP_WORDS_FR = {
    "de", "du", "des", "la", "le", "les", "en", "un", "une", "et", "ou",
    "pour", "par", "sur", "dans", "au", "aux", "ce", "qui", "que", "avec",
    "est", "son", "sa", "ses", "l", "d", "a", "on", "il", "ils", "elle",
    "elles", "nous", "vous", "se", "si", "ne", "pas", "plus", "bien",
    "tout", "tous", "mais", "car", "donc", "or", "ni", "cet", "cette",
}


def _mots_cles(titre: str) -> set[str]:
    """Normalise un titre en ensemble de mots significatifs (sans accents, sans stop words)."""
    norm = unicodedata.normalize("NFKD", titre.lower()).encode("ascii", "ignore").decode()
    mots = re.findall(r"[a-z][a-z0-9]+", norm)  # min 2 chars, commence par lettre
    return {m for m in mots if m not in _STOP_WORDS_FR}


def _jaccard(a: set, b: set) -> float:
    """Similarité de Jaccard entre deux ensembles."""
    if not a or not b:
        return 0.0
    return len(a & b) / len(a | b)


def _doublon_detecte(
    supabase,
    titre_signal: str,
    url_signal: str,
    pays_cible: str,
    cible: str,
    seuil_titre: float = 0.50,
) -> tuple[bool, str]:
    """
    Vérifie si un article similaire existe déjà pour ce pays+cible.
    Deux critères (OR) :
      1. Même URL source déjà utilisée → doublon certain
      2. Titre trop similaire (Jaccard ≥ seuil) → doublon probable
    Retourne (True, raison) si doublon détecté, (False, "") sinon.
    Coût : 0 token — SQL + Python pur.
    """
    try:
        existants = (
            supabase.table("articles")
            .select("titre_provisoire, sources_json")
            .eq("pays_cible", pays_cible)
            .eq("cible", cible)
            .order("created_at", desc=True)
            .limit(300)  # Optimisation : 300 derniers suffisent pour détecter les doublons
            .execute()
            .data
        )
    except Exception as e:
        logger.error(f"[Guard] Erreur lecture articles ({pays_cible}/{cible}) : {e}")
        return False, ""  # En cas d'erreur, on laisse passer

    mots_signal = _mots_cles(titre_signal)

    for art in existants:
        # Critère 1 : même URL source
        sources = art.get("sources_json") or {}
        if url_signal and sources.get("url_origine") == url_signal:
            return True, f"URL source identique ({url_signal[:70]})"

        # Critère 2 : titre trop similaire
        score = _jaccard(mots_signal, _mots_cles(art.get("titre_provisoire", "")))
        if score >= seuil_titre:
            return True, (
                f"Titre similaire (Jaccard={score:.2f}) : "
                f"'{art['titre_provisoire'][:60]}'"
            )

    return False, ""


async def generer_article(
    item: dict,
    source: dict,
    pays_cible: str,
    faits_extraits: str,
    cible: str = "pro",
) -> dict | None:
    """
    Étape 2 — Claude Sonnet rédige un article original pour un pays cible donné.
    Les faits extraits sont partagés (calculés une seule fois en amont).
    cible : "particulier" ou "pro" (jamais "mixte" — celui-là explose en 2 appels en amont).
    Retourne le dict de l'article, ou None en cas d'échec.
    ✅ PROTECTION : SafeAgent wrapper (timeout 5 min, max 5 itérations)
    """
    agent = get_redaction_agent(api_key=settings.anthropic_api_key)
    cible = cible if cible in ("particulier", "pro") else "pro"
    segment = "B2B" if cible == "pro" else "Particulier"
    public = (
        "professionnels : PME, artisans, gestionnaires de flottes"
        if cible == "pro"
        else "particuliers, familles, jeunes actifs et retraités"
    )

    contexte = CONTEXTES_PAYS.get(pays_cible, CONTEXTES_PAYS["FR"])

    if cible == "particulier":
        prompt = PROMPT_REDACTION_PARTICULIER.format(
            titre=item.get("titre", ""),
            source_nom=source.get("nom", "Source externe"),
            pays_source=source.get("pays", "EU"),
            langue_source=source.get("langue", "fr"),
            url_origine=item.get("url_origine", ""),
            faits_extraits=faits_extraits,
            pays_nom=contexte["nom"],
            contexte_reglementaire=contexte["contexte_reglementaire"],
        )
    else:
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

    result = agent.call(
        messages=[{"role": "user", "content": prompt}],
        tools=[TOOL_ARTICLE],
        max_tokens=2800
    )

    if not result['success']:
        logger.error(f"[AgentRédaction] Erreur agent Sonnet ({pays_cible}) : {result['error_type']}")
        return None

    tool_use = result.get('tool_use')
    if not tool_use:
        logger.warning(f"[AgentRédaction] Aucun tool_use dans la réponse Sonnet ({pays_cible})")
        return None

    data = tool_use.input
    data["_segment_detecte"] = segment
    data["_faits_extraits"] = faits_extraits
    data["_pays_cible"] = pays_cible
    data["_cible"] = cible
    return data


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

    # ── Étape 1bis : classification audience (Haiku) ──
    cible_globale = await _classifier_cible(item)
    cibles_a_generer = (
        ["particulier", "pro"] if cible_globale == "mixte" else [cible_globale]
    )

    # -- Declinaison conditionnelle (anti sur-declinaison) -------------------
    # Mesure UE / industrielle sans levier conso direct : la version
    # 'particulier' est interchangeable entre pays et finit rejetee. On la
    # retire quand un angle 'pro' existe deja.
    _plan = dedup.classify_signal(
        f"{item.get('titre', '')} {item.get('resume_ia', '')}"
    )
    if _plan["scope"] == "europeen" and "pro" in cibles_a_generer \
            and "particulier" in cibles_a_generer:
        cibles_a_generer = ["pro"]
        logger.info(
            "[AgentRedaction] Signal UE/industriel -> cibles reduites a %s",
            cibles_a_generer,
        )
    # ------------------------------------------------------------------------
    logger.info(
        f"[AgentRédaction] Classification audience : {cible_globale} "
        f"→ versions à générer : {cibles_a_generer}"
    )

    # ── Garde anti-doublon NIVEAU ARTICLE (cross-langue, fenetre longue) ──────
    # Backstop ajoute 2026-06-13. Compare le signal (resume_ia FR + titre) aux
    # ARTICLES recents (titre+resume FR) sur 14 jours. Rattrape un MEME evenement
    # capte via une autre source / un autre veille_item au titre different, que
    # les gardes "titre exact" et "dedup veille 72 h" laissent passer. Si couvert,
    # on saute TOUT le signal (aucune declinaison) -> l'item sera marque TRAITE.
    try:
        _signal_txt = f"{item.get('resume_ia', '')} {item.get('titre', '')}"
        _supa_guard = get_supabase()
        if dedup.is_recently_covered(
            _supa_guard, _signal_txt,
            hours=dedup.ARTICLE_COVERAGE_HOURS,
            threshold=dedup.ARTICLE_COVERAGE_THRESHOLD,
        ):
            logger.info(
                "[Guard] Signal déjà couvert par un article récent (<=%dj) "
                "→ skip total : %s",
                dedup.ARTICLE_COVERAGE_HOURS // 24,
                item.get("titre", "")[:60],
            )
            return []
    except Exception as e:
        logger.error("[Guard] Erreur is_recently_covered (non bloquant) : %s", e)
    # ─────────────────────────────────────────────────────────────────────────

    # ── Politique 1-article/signal (2026-06-16) ──────────────────────────────
    # On ne produit qu'UN article (pays primaire + audience primaire) à ce stade.
    # Les autres pays sont déclinés après validation (économie de tokens + file
    # de validation lisible). Voir generer_declinaisons_post_validation().
    if GENERER_UN_SEUL_ARTICLE:
        pays_primaire = "FR" if "FR" in pays_cibles else (pays_cibles[0] if pays_cibles else "FR")
        cible_primaire = cibles_a_generer[0] if cibles_a_generer else "pro"
        _differes = [p for p in pays_cibles if p != pays_primaire]
        if _differes or len(cibles_a_generer) > 1:
            logger.info(
                "[AgentRédaction] Politique 1-article/signal : génère %s/%s "
                "— déclinaisons différées à la validation : %s",
                pays_primaire, cible_primaire, _differes or "—",
            )
        pays_cibles = [pays_primaire]
        cibles_a_generer = [cible_primaire]

    # ── Étape 2 : rédaction originale par (pays × cible) ──
    articles = []
    total_attendu = len(pays_cibles) * len(cibles_a_generer)
    supabase = get_supabase()
    titre_signal = item.get("titre", "")
    url_signal = item.get("url_origine", "")

    for pays in pays_cibles:
        for c in cibles_a_generer:
            # ── Guard anti-doublon (0 token) ──────────────────────────────
            doublon, raison = _doublon_detecte(supabase, titre_signal, url_signal, pays, c)
            if doublon:
                logger.info(f"[Guard] Skip {pays}/{c} — {raison}")
                continue
            # ──────────────────────────────────────────────────────────────

            logger.info(
                f"[AgentRédaction] Génération {pays}/{c} : {item.get('titre', '')[:50]}"
            )
            article = await generer_article(item, source, pays, faits_extraits, c)
            if article:
                articles.append(article)
            else:
                logger.warning(f"[AgentRédaction] Échec génération {pays}/{c}")

    logger.info(f"[AgentRédaction] {len(articles)}/{total_attendu} déclinaisons générées")
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
        # Fix bug : marquer TRAITE même si aucun article généré (doublons détectés)
        # Sans ce fix, l'item reste NOUVEAU indéfiniment et bloque la queue
        try:
            supabase.table("veille_items").update({
                "statut": "TRAITE",
                "article_id": None,
            }).eq("id", item["id"]).execute()
            logger.info(
                f"[AgentRédaction] Item #{item['id']} marqué TRAITE "
                f"(aucun article — tout en doublon)"
            )
        except Exception as e:
            logger.error(f"[AgentRédaction] Erreur TRAITE (no article) : {e}")
        return 0

    crees = 0
    premier_article_id = None

    for article_data in articles_data:
        pays_cible = article_data.get("_pays_cible", "FR")
        cible_audience = article_data.get("_cible", "pro")
        if cible_audience not in ("particulier", "pro"):
            cible_audience = "pro"
        segment_nom = article_data.get("segment", article_data.get("_segment_detecte", "Particulier"))
        segment_id = SEGMENTS.get(segment_nom, 2)

        # Slug suffixé par pays + suffixe audience pour différencier mixte (-par / -pro)
        base_slug = article_data.get("slug") or _slugify(
            article_data.get("titre", item.get("titre", ""))
        )
        suffixe_cible = "par" if cible_audience == "particulier" else "pro"
        slug = f"{base_slug}-{pays_cible.lower()}-{suffixe_cible}"

        # ── Garde anti-doublon EXACT (titre+pays+cible+langue) ──────────────
        # Évite la cannibalisation : si un article actif a déjà ce titre pour
        # ce pays/cible/langue, on saute la déclinaison (cf. dédup 2026-06-12).
        langue_art = article_data.get("_langue", "fr")
        titre_art = article_data.get("titre", item.get("titre", ""))
        try:
            if dedup.is_exact_duplicate(supabase, titre_art, pays_cible, cible_audience, langue_art):
                logger.info(
                    f"[Guard] Doublon exact ignoré : '{titre_art[:60]}' "
                    f"({pays_cible}/{cible_audience}/{langue_art})"
                )
                continue
        except Exception as e:
            logger.error(f"[Guard] Erreur anti-doublon exact : {e}")

        try:
            result = supabase.table("articles").insert({
                "titre_provisoire": article_data.get("titre", item.get("titre", ""))[:255],
                "slug": slug,
                "profil_id": 1,
                "segment_id": segment_id,
                "cible": cible_audience,
                "pays_cible": pays_cible,
                # Langue de l'ARTICLE (≠ pays cible). L'Agent Rédaction écrit TOUJOURS
                # en français (prompts « OBLIGATOIREMENT EN FRANÇAIS »), y compris pour
                # les signaux sources en EN/DE. Toutes les déclinaisons FR/BE/CH/CA sont
                # donc en 'fr'. Si un futur pipeline de traduction produit une autre
                # langue, renseigner ici le code ISO 639-1 (en, nl, de, es, it).
                "langue": article_data.get("_langue", "fr"),
                "etat_code": "EN_ATTENTE_VALIDATION",
                "etat_updated_at": datetime.utcnow().isoformat(),
                "contenu_html": article_data.get("contenu_html", ""),
                "resume_50mots": article_data.get("resume_50mots", "")[:300],
                "meta_title": _tronquer_aux_mots(article_data.get("meta_title", ""), 60),
                "meta_description": _tronquer_aux_mots(article_data.get("meta_description", ""), 160),
                "faq_json": article_data.get("faq", []),
                "sources_json": {
                    "veille_item_id": item["id"],
                    "url_origine": item.get("url_origine"),
                    "source_nom": source.get("nom"),
                    "pays_source": source.get("pays"),
                    "langue": source.get("langue"),
                    "pertinence_score": float(item.get("pertinence_score", 0)),
                    "faits_extraits": article_data.get("_faits_extraits", ""),
                    # role : "primaire" (1er article du signal) ou "declinaison"
                    # (généré post-validation). Sert à ne décliner que les primaires.
                    "role": article_data.get("_role", "primaire"),
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

    # -- Garde-fou cross-langue (ceinture + bretelles) -----------------------
    # Si la dedup veille a laisse passer un doublon, on le rattrape ici en
    # comparant chaque item aux items recents deja TRAITE (+ a ceux deja vus
    # dans ce batch) via resume_ia.
    try:
        _seen = (
            supabase.table("veille_items")
            .select("id,titre,resume_ia,article_id,date_detection,statut")
            .gte("date_detection", dedup._since_iso(dedup.RECENCY_HOURS))
            .in_("statut", ["TRAITE", "EN_TRAITEMENT"])
            .execute()
            .data
        ) or []
    except Exception:
        _seen = []
    # ------------------------------------------------------------------------

    for item in items:
        source = item.pop("sources", None) or {}
        _dup = dedup.find_duplicate(item, _seen)
        if _dup is not None:
            try:
                supabase.table("veille_items").update(
                    {"statut": "IGNORE", "article_id": _dup.get("article_id")}
                ).eq("id", item["id"]).execute()
            except Exception as e:
                logger.error(f"[AgentRédaction] Erreur IGNORE doublon : {e}")
            logger.info(
                f"[AgentRédaction] Item #{item.get('id')} ignore : doublon de "
                f"#{_dup['id']}"
            )
            continue
        _seen.append(item)
        try:
            n = await run_redaction_item(item, source)
            total_articles += n
        except Exception as e:
            logger.error(f"[AgentRédaction] Erreur item #{item.get('id')}: {e}")
            continue

    # Résumé coût du batch — surveiller dans Railway pour détecter une dérive
    # Chaque appel Sonnet loggue déjà "tokens — in=X out=Y" ; ce log donne le total déclinaisons
    logger.info(
        f"[AgentRédaction] Batch terminé : {total_articles} article(s) généré(s) "
        f"sur {len(items)} item(s). "
        f"Consultez les lignes '[redaction] tokens' ci-dessus pour le détail coûts."
    )
    return {"articles_generes": total_articles, "items_traites": len(items)}


async def generer_declinaisons_post_validation(article_id: int) -> dict:
    """
    Décline un article VALIDÉ (le « primaire » d'un signal) vers les autres pays.

    Appelé après la validation d'Oliver (cf. routes/articles.py::valider_article).
    Respecte la politique 1-article/signal : à la génération on ne crée qu'un
    article FR ; ici, une fois l'article retenu par l'humain, on produit les
    versions BE/CH/CA pour conserver la couverture géographique — SANS relancer
    l'extraction Haiku (les faits sont réutilisés depuis sources_json).

    Idempotent : ne décline qu'un primaire non déjà décliné, et saute toute
    cible (pays, cible, langue) déjà couverte (garde anti-doublon exact).
    Les déclinaisons sont créées en EN_ATTENTE_VALIDATION pour relecture.
    """
    supabase = get_supabase()
    art = (
        supabase.table("articles").select("*").eq("id", article_id).single().execute().data
    )
    if not art:
        return {"status": "introuvable", "article_id": article_id, "declinaisons": 0}

    src = art.get("sources_json") or {}
    if src.get("role") not in (None, "primaire"):
        logger.info(
            "[Déclinaison] Article #%s n'est pas un primaire (role=%s) — skip",
            article_id, src.get("role"),
        )
        return {"status": "skip_non_primaire", "article_id": article_id, "declinaisons": 0}
    if src.get("declinaisons_faites"):
        logger.info("[Déclinaison] Article #%s déjà décliné — skip", article_id)
        return {"status": "deja_decline", "article_id": article_id, "declinaisons": 0}

    pays_primaire = art.get("pays_cible", "FR")
    cible = art.get("cible", "pro")
    cible = cible if cible in ("particulier", "pro") else "pro"
    langue = art.get("langue", "fr")
    faits = src.get("faits_extraits", "")
    veille_item_id = src.get("veille_item_id")

    # Reconstruire item + source d'origine (sans nouvel appel Haiku)
    item = {
        "titre": art.get("titre_provisoire", ""),
        "url_origine": src.get("url_origine"),
        "resume_ia": art.get("resume_50mots", ""),
        "contenu_brut": "",
    }
    if veille_item_id:
        try:
            vi = (
                supabase.table("veille_items")
                .select("titre,url_origine,resume_ia,contenu_brut")
                .eq("id", veille_item_id).single().execute().data
            )
            if vi:
                item.update({
                    "titre": vi.get("titre") or item["titre"],
                    "url_origine": vi.get("url_origine") or item["url_origine"],
                    "resume_ia": vi.get("resume_ia") or item["resume_ia"],
                    "contenu_brut": vi.get("contenu_brut") or "",
                })
        except Exception as e:
            logger.warning("[Déclinaison] veille_item #%s illisible : %s", veille_item_id, e)

    source = {
        "nom": src.get("source_nom", "Source externe"),
        "pays": src.get("pays_source", "EU"),
        "langue": src.get("langue", "fr"),
    }
    if not faits:
        faits = f"• {item.get('resume_ia', '')}" if item.get("resume_ia") else ""

    pays_pool = PAYS_DECLINATIONS.get(str(source["pays"]).upper(), ["FR", "BE", "CH"])
    pays_a_decliner = [p for p in pays_pool if p != pays_primaire]
    if not pays_a_decliner:
        return {"status": "aucun_pays", "article_id": article_id, "declinaisons": 0}

    crees = 0
    for pays in pays_a_decliner:
        try:
            if dedup.is_exact_duplicate(supabase, item.get("titre", ""), pays, cible, langue):
                logger.info("[Déclinaison] %s/%s déjà couvert — skip", pays, cible)
                continue
        except Exception:
            pass

        data = await generer_article(item, source, pays, faits, cible)
        if not data:
            logger.warning(
                "[Déclinaison] échec génération %s/%s (art #%s)", pays, cible, article_id
            )
            continue
        data["_role"] = "declinaison"
        titre_decl = data.get("titre", item.get("titre", ""))

        try:
            if dedup.is_exact_duplicate(supabase, titre_decl, pays, cible, langue):
                logger.info(
                    "[Déclinaison] doublon exact après génération %s/%s — skip", pays, cible
                )
                continue
        except Exception:
            pass

        segment_nom = data.get("_segment_detecte", "Particulier")
        segment_id = SEGMENTS.get(segment_nom, 2)
        base_slug = data.get("slug") or _slugify(titre_decl)
        suffixe = "par" if cible == "particulier" else "pro"
        slug = f"{base_slug}-{pays.lower()}-{suffixe}"

        try:
            supabase.table("articles").insert({
                "titre_provisoire": titre_decl[:255],
                "slug": slug,
                "profil_id": 1,
                "segment_id": segment_id,
                "cible": cible,
                "pays_cible": pays,
                "langue": langue,
                "etat_code": "EN_ATTENTE_VALIDATION",
                "etat_updated_at": datetime.utcnow().isoformat(),
                "contenu_html": data.get("contenu_html", ""),
                "resume_50mots": data.get("resume_50mots", "")[:300],
                "meta_title": _tronquer_aux_mots(data.get("meta_title", ""), 60),
                "meta_description": _tronquer_aux_mots(data.get("meta_description", ""), 160),
                "faq_json": data.get("faq", []),
                "sources_json": {
                    "veille_item_id": veille_item_id,
                    "url_origine": item.get("url_origine"),
                    "source_nom": source.get("nom"),
                    "pays_source": source.get("pays"),
                    "langue": source.get("langue"),
                    "faits_extraits": faits,
                    "role": "declinaison",
                    "derive_de": article_id,
                },
            }).execute()
            crees += 1
            logger.info("[Déclinaison] ✅ %s/%s créée depuis art #%s", pays, cible, article_id)
        except Exception as e:
            err = str(e)
            if "23505" in err or "duplicate key" in err.lower():
                logger.info("[Déclinaison] slug '%s' déjà existant — ignoré", slug)
            else:
                logger.error("[Déclinaison] erreur insert %s : %s", pays, e)

    # Marqueur anti-redéclinaison sur le primaire
    try:
        new_src = dict(src)
        new_src["declinaisons_faites"] = True
        supabase.table("articles").update(
            {"sources_json": new_src}
        ).eq("id", article_id).execute()
    except Exception as e:
        logger.warning("[Déclinaison] maj marqueur primaire échouée : %s", e)

    logger.info(
        "[Déclinaison] Article #%s → %s déclinaison(s) créée(s) %s",
        article_id, crees, pays_a_decliner,
    )
    return {
        "status": "ok",
        "article_id": article_id,
        "declinaisons": crees,
        "pays": pays_a_decliner,
    }
