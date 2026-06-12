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
