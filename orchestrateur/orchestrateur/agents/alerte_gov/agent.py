"""
Agent Alerte Gov. — Moteurs.com
Surveille les sources officielles gouvernementales pour détecter tout changement
sur les aides, bonus, ZFE et réglementations liées aux véhicules propres.

Pipeline :
  1. Scrape les URLs officielles (legifrance, service-public, gouv.fr, etc.)
  2. Calcule une empreinte SHA-256 du contenu significatif
  3. Compare avec l'empreinte stockée en Supabase (table `alertes_gov`)
  4. Si changement détecté : insère une alerte + déclenche optionnellement l'Agent Veille
  5. Scheduler : 1x/jour à 06h30 Paris (avant le cycle Veille de 07h)

Modèle : Claude Haiku pour l'analyse du changement (résumé du delta)
"""

import hashlib
import logging
import re
from datetime import datetime, timezone
from typing import Optional

import anthropic
import httpx

from config import get_settings
from database import get_supabase

logger = logging.getLogger(__name__)
settings = get_settings()

# ── Sources officielles surveillées ──────────────────────────────────────────

SOURCES_GOV = [
    # ── France ──
    {
        "pays": "FR",
        "nom": "Bonus écologique — service-public.fr",
        "url": "https://www.service-public.fr/particuliers/vosdroits/F34014",
        "selecteur_texte": "article",   # balise HTML à extraire
        "mots_cles_alerte": ["bonus", "montant", "plafond", "conditions", "supprimé", "prolongé"],
    },
    {
        "pays": "FR",
        "nom": "Aides aux entreprises VUL — bpifrance",
        "url": "https://www.bpifrance.fr/nos-solutions/financement/aides-a-linnovation",
        "selecteur_texte": "main",
        "mots_cles_alerte": ["véhicule", "électrique", "aide", "subvention", "vul"],
    },
    {
        "pays": "FR",
        "nom": "ZFE-m — ecologie.gouv.fr",
        "url": "https://www.ecologie.gouv.fr/zones-faibles-emissions-mobilite-zfe-m",
        "selecteur_texte": "article",
        "mots_cles_alerte": ["zone", "emission", "crit'air", "interdiction", "calendrier"],
    },
    {
        "pays": "FR",
        "nom": "Suramortissement — impots.gouv.fr",
        "url": "https://www.impots.gouv.fr/professionnel/suramortissement",
        "selecteur_texte": "main",
        "mots_cles_alerte": ["suramortissement", "40%", "taux", "plafond", "véhicule"],
    },
    # ── Belgique ──
    {
        "pays": "BE",
        "nom": "Déductibilité véhicules — fisconet.be",
        "url": "https://finances.belgium.be/fr/entreprises/impots_sur_les_revenus/deductions/vehicules",
        "selecteur_texte": "main",
        "mots_cles_alerte": ["déductibilité", "100%", "2027", "2028", "2029", "taux", "voiture"],
    },
    # ── Suisse ──
    {
        "pays": "CH",
        "nom": "Aides cantonales — energieschweiz.ch",
        "url": "https://www.energieschweiz.ch/elektromobilitaet/elektrofahrzeuge/foerderprogramme/",
        "selecteur_texte": "main",
        "mots_cles_alerte": ["förderung", "subvention", "prime", "aide", "canton"],
    },
    # ── Canada ──
    {
        "pays": "CA",
        "nom": "Programme iVZEV — tc.canada.ca",
        "url": "https://tc.canada.ca/fr/transport-terrestre/vehicules/technologies-nouvelles-avancees/mesures-incitatives-achat-vehicules-zero-emission",
        "selecteur_texte": "main",
        "mots_cles_alerte": ["incitatif", "rabais", "5000", "2500", "admissible", "programme"],
    },
]

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (compatible; MoteursBot/1.0; +https://moteurs.com)"
    ),
    "Accept-Language": "fr-FR,fr;q=0.9,en;q=0.8",
}

# ── Scraping ──────────────────────────────────────────────────────────────────

def _scraper_texte(url: str, selecteur: str = "main") -> Optional[str]:
    """
    Récupère le texte brut de la zone principale d'une page HTML.
    Retourne None en cas d'erreur.
    """
    try:
        with httpx.Client(timeout=20, follow_redirects=True, headers=HEADERS) as client:
            resp = client.get(url)
            resp.raise_for_status()
            html = resp.text
    except Exception as e:
        logger.warning(f"[AlerteGov] Erreur scraping {url} : {e}")
        return None

    # Extraction simple sans BeautifulSoup (pas de dep supplémentaire)
    # On cherche la balise `selecteur` et on extrait son texte
    pattern = re.compile(
        rf'<{selecteur}[^>]*>(.*?)</{selecteur}>',
        re.IGNORECASE | re.DOTALL,
    )
    match = pattern.search(html)
    if not match:
        # Fallback : prendre le <body>
        body_match = re.search(r'<body[^>]*>(.*?)</body>', html, re.IGNORECASE | re.DOTALL)
        texte_brut = body_match.group(1) if body_match else html
    else:
        texte_brut = match.group(1)

    # Nettoyage : suppression balises HTML, espaces multiples
    texte = re.sub(r'<[^>]+>', ' ', texte_brut)
    texte = re.sub(r'\s+', ' ', texte).strip()

    return texte[:8000]  # On tronque à 8000 car pour l'empreinte


def _empreinte(texte: str) -> str:
    """SHA-256 d'un texte normalisé (minuscules + sans ponctuation)."""
    normalise = re.sub(r'[^a-z0-9àâäéèêëîïôùûüÿæœç ]', '', texte.lower())
    return hashlib.sha256(normalise.encode()).hexdigest()


# ── Analyse du delta via Claude Haiku ────────────────────────────────────────

def _analyser_delta(source: dict, ancien_texte: str, nouveau_texte: str) -> str:
    """
    Demande à Claude Haiku de résumer les changements entre deux versions de texte.
    Retourne un résumé court (2-4 phrases) du delta détecté.
    """
    client = anthropic.Anthropic(api_key=settings.anthropic_api_key)

    prompt = f"""Tu analyses deux versions d'une page officielle sur les aides aux véhicules propres.

SOURCE : {source['nom']} ({source['pays']})
URL : {source['url']}

VERSION PRÉCÉDENTE (extrait) :
{ancien_texte[:1500]}

VERSION ACTUELLE (extrait) :
{nouveau_texte[:1500]}

Identifie les changements significatifs : montants modifiés, conditions nouvelles, suppression ou création d'aides, nouvelles dates. Résume en 2-4 phrases courtes et factuelles. Si le changement semble mineur (style, navigation), indique "Changement non substantiel". Réponds en français."""

    try:
        resp = client.messages.create(
            model="claude-haiku-4-5-20251001",
            max_tokens=200,
            messages=[{"role": "user", "content": prompt}],
        )
        return resp.content[0].text.strip()
    except Exception as e:
        logger.error(f"[AlerteGov] Erreur Haiku analyse delta : {e}")
        return "Analyse du changement indisponible."


# ── Gestion Supabase ──────────────────────────────────────────────────────────

def _get_etat_precedent(supabase, url: str) -> Optional[dict]:
    """Récupère l'état précédent (empreinte + texte) pour une URL donnée."""
    res = (
        supabase.table("alertes_gov")
        .select("id, empreinte, texte_snapshot, updated_at")
        .eq("url", url)
        .order("updated_at", desc=True)
        .limit(1)
        .execute()
    )
    return res.data[0] if res.data else None


def _upsert_snapshot(supabase, source: dict, texte: str, empreinte: str):
    """Met à jour ou crée le snapshot pour une source."""
    supabase.table("alertes_gov").upsert(
        {
            "url": source["url"],
            "nom": source["nom"],
            "pays": source["pays"],
            "empreinte": empreinte,
            "texte_snapshot": texte[:3000],
            "updated_at": datetime.now(timezone.utc).isoformat(),
        },
        on_conflict="url",
    ).execute()


def _inserer_alerte(supabase, source: dict, resume_delta: str):
    """Insère une alerte de changement dans la table `alertes_gov_events`."""
    supabase.table("alertes_gov_events").insert(
        {
            "url": source["url"],
            "nom": source["nom"],
            "pays": source["pays"],
            "resume_changement": resume_delta,
            "statut": "NON_LU",
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
    ).execute()
    logger.info(f"[AlerteGov] 🔔 Alerte insérée — {source['nom']}")


# ── Orchestration principale ──────────────────────────────────────────────────

async def surveiller_sources_gov() -> dict:
    """
    Cycle complet de surveillance.
    Pour chaque source : scrape → compare empreinte → alerte si changement.
    Retourne un rapport de l'exécution.
    """
    supabase = get_supabase()
    rapport = {
        "sources_verifiees": 0,
        "changements_detectes": 0,
        "erreurs": 0,
        "alertes": [],
    }

    for source in SOURCES_GOV:
        logger.info(f"[AlerteGov] Vérification : {source['nom']} ({source['pays']})")

        # 1. Scraping
        texte_actuel = _scraper_texte(source["url"], source.get("selecteur_texte", "main"))
        if not texte_actuel:
            rapport["erreurs"] += 1
            continue

        rapport["sources_verifiees"] += 1
        empreinte_actuelle = _empreinte(texte_actuel)

        # 2. Récupération état précédent
        precedent = _get_etat_precedent(supabase, source["url"])

        if precedent is None:
            # Première fois : on stocke sans alerte
            _upsert_snapshot(supabase, source, texte_actuel, empreinte_actuelle)
            logger.info(f"[AlerteGov] 📸 Snapshot initial — {source['nom']}")
            continue

        # 3. Comparaison empreinte
        if precedent["empreinte"] == empreinte_actuelle:
            logger.debug(f"[AlerteGov] Pas de changement — {source['nom']}")
            continue

        # 4. Changement détecté → analyse du delta
        logger.info(f"[AlerteGov] ⚡ Changement détecté — {source['nom']}")
        resume = _analyser_delta(source, precedent.get("texte_snapshot", ""), texte_actuel)

        if "non substantiel" not in resume.lower():
            # 5. Insertion alerte + mise à jour snapshot
            _inserer_alerte(supabase, source, resume)
            rapport["changements_detectes"] += 1
            rapport["alertes"].append({
                "source": source["nom"],
                "pays": source["pays"],
                "resume": resume,
            })
        else:
            logger.info(f"[AlerteGov] Changement non substantiel ignoré — {source['nom']}")

        # Toujours mettre à jour le snapshot
        _upsert_snapshot(supabase, source, texte_actuel, empreinte_actuelle)

    logger.info(
        f"[AlerteGov] Cycle terminé — "
        f"{rapport['sources_verifiees']} sources, "
        f"{rapport['changements_detectes']} alertes, "
        f"{rapport['erreurs']} erreurs"
    )
    return rapport


async def get_alertes_non_lues() -> list[dict]:
    """Retourne les alertes gov non lues pour l'admin."""
    supabase = get_supabase()
    res = (
        supabase.table("alertes_gov_events")
        .select("*")
        .eq("statut", "NON_LU")
        .order("created_at", desc=True)
        .execute()
    )
    return res.data or []
