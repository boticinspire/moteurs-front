"""
Agent Recharge — Moteurs.com
Scraping et mise à jour automatique des tarifs des cartes de recharge électrique.

Pipeline par carte :
  1. Fetch HTML de la page tarifaire (httpx, headers réalistes)
  2. Extraction structurée via Claude Haiku (parser universel, résistant aux redesigns)
  3. Sanity check des valeurs extraites (fourchettes raisonnables)
  4. Diff SHA-256 avec la version stockée en Supabase
  5. Upsert Supabase si changement + création d'un event de traçabilité
  6. Export du JSON consolidé pour le front Next.js

Cartes méthode="manuel" : pas de scraping, données figées jusqu'à MAJ manuelle.
Cartes méthode="httpx" : scraping tenté — si Haiku ne trouve pas les tarifs clés,
  la carte est marquée needs_review=True et Oliver reçoit une alerte.
"""

import hashlib
import json
import logging
from datetime import datetime, timezone

import httpx

from config import get_settings
from database import get_supabase
from agents.recharge.sources import CARTES, CARTES_BY_ID

logger = logging.getLogger(__name__)
settings = get_settings()

# ── Constantes ────────────────────────────────────────────────────────────────

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/124.0.0.0 Safari/537.36"
    ),
    "Accept-Language": "fr-FR,fr;q=0.9,en;q=0.8",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
}

# Fourchettes de sanity check (en €)
SANITY = {
    "abonnement_mensuel":  (0.0,  50.0),
    "prix_kwh_ac":         (0.05,  1.20),
    "prix_kwh_dc":         (0.10,  1.50),
    "frais_session":       (0.0,   5.0),
}

PROMPT_EXTRACTION = """
Tu es un extracteur de données tarifaires pour les cartes de recharge de véhicules électriques.
Voici le HTML (tronqué si nécessaire) de la page tarifaire de "{nom_carte}".

Extrais UNIQUEMENT les informations suivantes sous forme de JSON strict.
Si une valeur est introuvable, mets `null`. Ne devine jamais un tarif.

{{
  "abonnement_mensuel_eur": <float ou null — 0 si gratuit/sans abonnement>,
  "abonnement_annuel_eur":  <float ou null>,
  "ac_slow_modele":  <"kwh" | "min" | "session" | null — ≤22 kW>,
  "ac_slow_prix":    <float ou null — prix unitaire selon le modèle>,
  "ac_slow_frais_session": <float ou null — 0 si aucun>,
  "dc_rapide_modele": <"kwh" | "min" | "session" | null — 50–149 kW>,
  "dc_rapide_prix":   <float ou null>,
  "dc_rapide_frais_session": <float ou null>,
  "dc_ultra_modele":  <"kwh" | "min" | "session" | null — ≥150 kW>,
  "dc_ultra_prix":    <float ou null>,
  "dc_ultra_frais_session": <float ou null>,
  "roaming_disponible": <true | false | null>,
  "roaming_dc_rapide_prix": <float ou null — tarif kWh roaming DC rapide>,
  "roaming_dc_ultra_prix":  <float ou null — tarif kWh roaming DC ultra>,
  "pays_roaming": <liste ISO-2 string[] ou null>
}}

Réponds UNIQUEMENT avec le JSON, sans aucun commentaire.

HTML :
{html}
"""


# ── Fetch HTML ────────────────────────────────────────────────────────────────

async def _fetch_html(url: str) -> str | None:
    """Récupère le HTML brut d'une page tarifaire. Timeout 20s."""
    try:
        async with httpx.AsyncClient(
            headers=HEADERS, timeout=20, follow_redirects=True
        ) as client:
            r = await client.get(url)
            r.raise_for_status()
            content_type = r.headers.get("content-type", "")
            if "text" not in content_type and "html" not in content_type:
                logger.warning(f"[Recharge] Type inattendu ({content_type}) pour {url}")
                return None
            return r.text
    except httpx.HTTPStatusError as e:
        logger.warning(f"[Recharge] HTTP {e.response.status_code} — {url}")
    except httpx.TimeoutException:
        logger.warning(f"[Recharge] Timeout — {url}")
    except Exception as e:
        logger.error(f"[Recharge] Erreur fetch {url} : {e}")
    return None


# ── Extraction Claude Haiku ───────────────────────────────────────────────────

async def _extraire_avec_haiku(html: str, nom_carte: str) -> dict | None:
    """
    Envoie le HTML (15 000 premiers caractères) à Claude Haiku.
    Retourne un dict structuré ou None si l'extraction échoue.
    """
    import anthropic
    client = anthropic.AsyncAnthropic(api_key=settings.anthropic_api_key)

    # On prend les 15 000 premiers caractères : contient presque toujours le tableau de prix
    html_tronque = html[:15000]

    prompt = PROMPT_EXTRACTION.format(nom_carte=nom_carte, html=html_tronque)

    try:
        response = await client.messages.create(
            model="claude-haiku-4-5-20251001",
            max_tokens=600,
            messages=[{"role": "user", "content": prompt}],
        )
        raw = response.content[0].text.strip()

        # Nettoyer les éventuels backticks markdown
        if raw.startswith("```"):
            raw = raw.split("```")[1]
            if raw.startswith("json"):
                raw = raw[4:]

        return json.loads(raw)

    except json.JSONDecodeError as e:
        logger.warning(f"[Recharge] Haiku JSON invalide pour {nom_carte} : {e}")
    except Exception as e:
        logger.error(f"[Recharge] Erreur Haiku pour {nom_carte} : {e}")
    return None


# ── Sanity check ──────────────────────────────────────────────────────────────

def _valider(valeur: float | None, cle: str) -> bool:
    """Retourne True si la valeur est dans la fourchette acceptable."""
    if valeur is None:
        return True  # null est autorisé
    lo, hi = SANITY.get(cle, (0.0, 9999.0))
    return lo <= valeur <= hi


def _sanity_check(extrait: dict) -> tuple[bool, list[str]]:
    """
    Vérifie que les valeurs extraites sont cohérentes.
    Retourne (ok, liste_anomalies).
    """
    anomalies = []

    checks = [
        ("abonnement_mensuel_eur", "abonnement_mensuel"),
        ("ac_slow_prix",           "prix_kwh_ac"),
        ("dc_rapide_prix",         "prix_kwh_dc"),
        ("dc_ultra_prix",          "prix_kwh_dc"),
        ("roaming_dc_rapide_prix", "prix_kwh_dc"),
        ("roaming_dc_ultra_prix",  "prix_kwh_dc"),
        ("ac_slow_frais_session",  "frais_session"),
        ("dc_rapide_frais_session","frais_session"),
    ]
    for champ, categorie in checks:
        val = extrait.get(champ)
        if not _valider(val, categorie):
            anomalies.append(f"{champ}={val} hors fourchette {SANITY[categorie]}")

    # Si tous les prix sont null → probablement page JS non rendue
    prix_cles = ["ac_slow_prix", "dc_rapide_prix", "dc_ultra_prix"]
    if all(extrait.get(p) is None for p in prix_cles):
        anomalies.append("Tous les prix sont null — page probablement JS-rendue (besoin Playwright)")

    return len(anomalies) == 0, anomalies


# ── Conversion extraction → schema stocké ────────────────────────────────────

def _construire_donnees(source: dict, extrait: dict) -> dict:
    """
    Fusionne les données initiales (source.donnees_init) avec l'extraction Haiku.
    Les champs null de l'extraction ne remplacent PAS les données init existantes.
    """
    # Clone profond des données init comme base
    donnees = json.loads(json.dumps(source.get("donnees_init", {})))

    # Clé pays pour les tarifs (fr ou be selon pays_origine)
    pays_key = "tarifs_be" if source["pays_origine"][0] == "BE" else "tarifs_fr"
    if pays_key not in donnees:
        pays_key = "tarifs_fr"

    def _maj_si_non_null(cible: dict, champ: str, val):
        if val is not None:
            cible[champ] = val

    # Abonnement
    abo = donnees.setdefault("abonnement", {})
    _maj_si_non_null(abo, "mensuel_eur", extrait.get("abonnement_mensuel_eur"))
    _maj_si_non_null(abo, "annuel_eur",  extrait.get("abonnement_annuel_eur"))

    # Tarifs AC slow
    ac = donnees.setdefault(pays_key, {}).setdefault("ac_slow", {})
    _maj_si_non_null(ac, "modele", extrait.get("ac_slow_modele"))
    _maj_si_non_null(ac, "prix",   extrait.get("ac_slow_prix"))
    _maj_si_non_null(ac, "frais_session", extrait.get("ac_slow_frais_session"))

    # Tarifs DC rapide
    dc_r = donnees[pays_key].setdefault("dc_rapide", {})
    _maj_si_non_null(dc_r, "modele", extrait.get("dc_rapide_modele"))
    _maj_si_non_null(dc_r, "prix",   extrait.get("dc_rapide_prix"))
    _maj_si_non_null(dc_r, "frais_session", extrait.get("dc_rapide_frais_session"))

    # Tarifs DC ultra
    dc_u = donnees[pays_key].setdefault("dc_ultra", {})
    _maj_si_non_null(dc_u, "modele", extrait.get("dc_ultra_modele"))
    _maj_si_non_null(dc_u, "prix",   extrait.get("dc_ultra_prix"))
    _maj_si_non_null(dc_u, "frais_session", extrait.get("dc_ultra_frais_session"))

    # Roaming
    roaming = donnees.setdefault("roaming", {})
    if extrait.get("roaming_disponible") is not None:
        roaming["disponible"] = extrait["roaming_disponible"]
    if extrait.get("pays_roaming"):
        roaming["pays_couverts"] = extrait["pays_roaming"]
    if extrait.get("roaming_dc_rapide_prix") is not None:
        roaming.setdefault("tarif_dc_rapide", {})["prix"] = extrait["roaming_dc_rapide_prix"]
    if extrait.get("roaming_dc_ultra_prix") is not None:
        roaming.setdefault("tarif_dc_ultra", {})["prix"] = extrait["roaming_dc_ultra_prix"]

    return donnees


# ── Supabase — lecture / écriture ─────────────────────────────────────────────

def _hash_donnees(donnees: dict) -> str:
    return hashlib.sha256(
        json.dumps(donnees, sort_keys=True, ensure_ascii=False).encode()
    ).hexdigest()


def _lire_carte(carte_id: str) -> dict | None:
    supabase = get_supabase()
    try:
        r = (
            supabase.table("cartes_recharge")
            .select("donnees, hash_donnees")
            .eq("id", carte_id)
            .single()
            .execute()
        )
        return r.data
    except Exception:
        return None


def _upsert_carte(source: dict, donnees: dict, needs_review: bool, anomalies: list[str]) -> None:
    supabase = get_supabase()
    now = datetime.now(timezone.utc).isoformat()
    supabase.table("cartes_recharge").upsert({
        "id":             source["id"],
        "nom":            source["nom"],
        "operateur":      source["operateur"],
        "pays_origine":   source["pays_origine"],
        "url_officielle": source.get("url_officielle"),
        "url_tarifs":     source.get("url_tarifs"),
        "methode_source": source.get("methode", "httpx"),
        "ideal_voyage":   source.get("ideal_voyage", False),
        "ideal_quotidien":source.get("ideal_quotidien", False),
        "flotte_pro":     source.get("flotte_pro", False),
        "points_forts":   source.get("points_forts", []),
        "points_faibles": source.get("points_faibles", []),
        "donnees":        donnees,
        "hash_donnees":   _hash_donnees(donnees),
        "needs_review":   needs_review,
        "anomalies":      anomalies,
        "derniere_maj":   now,
        "actif":          True,
    }, on_conflict="id").execute()


def _creer_event(carte_id: str, type_event: str, ancien: dict | None,
                 nouveau: dict | None, note: str = "") -> None:
    """Crée un événement de traçabilité. Silencieux en cas d'erreur FK."""
    try:
        supabase = get_supabase()
        supabase.table("recharge_events").insert({
            "carte_id":  carte_id,
            "type":      type_event,
            "ancien":    ancien,
            "nouveau":   nouveau,
            "note":      note,
        }).execute()
    except Exception as e:
        logger.warning(f"[AgentRecharge] Event non créé pour {carte_id} : {e}")


# ── Scraping d'une carte ──────────────────────────────────────────────────────

async def scraper_carte(carte_id: str) -> dict:
    """
    Scrape et met à jour une carte de recharge.
    Retourne un résumé de l'opération.
    """
    source = CARTES_BY_ID.get(carte_id)
    if not source:
        return {"erreur": f"Carte inconnue : {carte_id}"}

    nom = source["nom"]
    logger.info(f"[AgentRecharge] Traitement : {nom}")

    # ── Cartes manuelles : init en base si absentes, sinon rien ──────────────
    if source["methode"] == "manuel":
        existant = _lire_carte(carte_id)
        if not existant:
            _upsert_carte(source, source["donnees_init"], False, [])
            _creer_event(carte_id, "init_manuel", None, source["donnees_init"], "Init manuelle")
            logger.info(f"[AgentRecharge] {nom} — initialisée manuellement")
            return {"carte": carte_id, "statut": "init_manuel", "changement": True}
        return {"carte": carte_id, "statut": "manuel_inchange", "changement": False}

    # ── Cartes httpx : initialiser en base si première fois ──────────────────
    # Garantit que la carte existe avant toute création d'event (contrainte FK)
    existant = _lire_carte(carte_id)
    if not existant:
        _upsert_carte(source, source["donnees_init"], True,
                      ["Init automatique — scraping en cours"])
        logger.info(f"[AgentRecharge] {nom} — initialisée avec données par défaut")

    # ── Cartes httpx : scraping ───────────────────────────────────────────────
    url_tarifs = source.get("url_tarifs")
    if not url_tarifs:
        return {"carte": carte_id, "statut": "pas_url", "changement": False}

    html = await _fetch_html(url_tarifs)
    if not html:
        logger.warning(f"[AgentRecharge] {nom} — fetch échoué")
        _creer_event(carte_id, "scrape_error", None, None, f"Fetch échoué : {url_tarifs}")
        return {"carte": carte_id, "statut": "fetch_error", "changement": False}

    # ── Extraction Haiku ──────────────────────────────────────────────────────
    extrait = await _extraire_avec_haiku(html, nom)
    if not extrait:
        logger.warning(f"[AgentRecharge] {nom} — extraction Haiku échouée")
        _creer_event(carte_id, "extraction_error", None, None, "Haiku n'a pas retourné de JSON valide")
        return {"carte": carte_id, "statut": "extraction_error", "changement": False}

    # ── Sanity check ─────────────────────────────────────────────────────────
    ok, anomalies = _sanity_check(extrait)
    if not ok:
        logger.warning(f"[AgentRecharge] {nom} — anomalies : {anomalies}")

    # ── Fusion avec données init ──────────────────────────────────────────────
    nouvelles_donnees = _construire_donnees(source, extrait)

    # ── Diff vs Supabase ──────────────────────────────────────────────────────
    # Note : existant a déjà été chargé en début de fonction
    nouveau_hash = _hash_donnees(nouvelles_donnees)

    if existant and existant.get("hash_donnees") == nouveau_hash:
        logger.info(f"[AgentRecharge] {nom} — aucun changement")
        return {"carte": carte_id, "statut": "inchange", "changement": False, "anomalies": anomalies}

    ancien_donnees = existant.get("donnees") if existant else None

    # ── Upsert ────────────────────────────────────────────────────────────────
    _upsert_carte(source, nouvelles_donnees, not ok, anomalies)
    _creer_event(
        carte_id,
        "tarif_change" if existant else "init",
        ancien_donnees,
        nouvelles_donnees,
        f"Anomalies: {anomalies}" if anomalies else "OK",
    )

    logger.info(f"[AgentRecharge] {nom} — mis à jour (needs_review={not ok})")
    return {
        "carte":      carte_id,
        "statut":     "mis_a_jour",
        "changement": True,
        "anomalies":  anomalies,
        "needs_review": not ok,
    }


# ── Batch complet ─────────────────────────────────────────────────────────────

async def run_recharge_batch(carte_ids: list[str] | None = None) -> dict:
    """
    Scrape toutes les cartes (ou une sélection) et retourne un résumé consolidé.
    """
    cibles = carte_ids or [c["id"] for c in CARTES]
    logger.info(f"[AgentRecharge] Démarrage batch — {len(cibles)} carte(s)")

    resultats = []
    for carte_id in cibles:
        res = await scraper_carte(carte_id)
        resultats.append(res)

    nb_maj     = sum(1 for r in resultats if r.get("changement"))
    nb_erreurs = sum(1 for r in resultats if "error" in r.get("statut", ""))
    nb_review  = sum(1 for r in resultats if r.get("needs_review"))

    logger.info(
        f"[AgentRecharge] Batch terminé — "
        f"{nb_maj} maj, {nb_erreurs} erreurs, {nb_review} à vérifier"
    )

    return {
        "total":       len(cibles),
        "maj":         nb_maj,
        "erreurs":     nb_erreurs,
        "needs_review":nb_review,
        "detail":      resultats,
    }


# ── Export JSON pour le front ─────────────────────────────────────────────────

def exporter_cartes_json() -> str:
    """
    Exporte toutes les cartes actives depuis Supabase en JSON
    pour consommation par le front Next.js.
    """
    supabase = get_supabase()
    r = (
        supabase.table("cartes_recharge")
        .select("*")
        .eq("actif", True)
        .order("nom")
        .execute()
    )
    export = {
        "_meta": {
            "version":    datetime.now(timezone.utc).strftime("%Y-%m-%d"),
            "updated_at": datetime.now(timezone.utc).isoformat(),
            "nb_cartes":  len(r.data),
        },
        "cartes": r.data,
    }
    return json.dumps(export, ensure_ascii=False, indent=2)
