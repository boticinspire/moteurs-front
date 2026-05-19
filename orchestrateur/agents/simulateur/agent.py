"""
Agent Simulateur — Moteurs.com
Mise à jour automatique des prix énergie et aides financières.

Pipeline :
  1. Scrape les sources officielles (DGEC, Commission Européenne)
  2. Compare avec les valeurs stockées en Supabase
  3. Si écart > seuil → met à jour Supabase + génère simulateur-data.json
  4. Stocke un log de la mise à jour dans workflow_logs
"""
import json
import logging
import re
from datetime import datetime, timezone

import httpx

from config import get_settings
from database import get_supabase

logger = logging.getLogger(__name__)
settings = get_settings()

# ── Valeurs de fallback (identiques à simulateur-data.json initial) ───────────
FALLBACK_DATA = {
    "energy_prices": {
        "FR": {"diesel": 1.72, "elec": 0.21, "gnv": 1.45, "h2": 13.5,  "efuel": 4.20},
        "BE": {"diesel": 1.78, "elec": 0.30, "gnv": 1.55, "h2": 14.0,  "efuel": 4.40},
        "CH": {"diesel": 1.85, "elec": 0.27, "gnv": 1.85, "h2": 15.5,  "efuel": 5.00},
        "CA": {"diesel": 1.45, "elec": 0.13, "gnv": 1.25, "h2": 12.0,  "efuel": 4.00},
    },
    "aides_b2b": {
        "FR": {"vul_petit": 4000, "vul_moyen": 6500, "vul_grand": 8600, "camion": 10000, "poids_lourd": 12000},
        "BE": {"vul_petit": 2500, "vul_moyen": 3500, "vul_grand": 5000, "camion":  6000, "poids_lourd":  8000},
        "CH": {"vul_petit":    0, "vul_moyen":    0, "vul_grand":    0, "camion":     0, "poids_lourd":     0},
        "CA": {"vul_petit": 5000, "vul_moyen": 7000, "vul_grand": 7000, "camion":  7000, "poids_lourd":  7000},
    },
    "aides_particulier": {
        "FR": {"voiture": 4000, "vae": 400, "trottinette": 0, "moto": 900},
        "BE": {"voiture": 2500, "vae": 300, "trottinette": 0, "moto": 500},
        "CH": {"voiture":    0, "vae":   0, "trottinette": 0, "moto":   0},
        "CA": {"voiture": 5000, "vae": 200, "trottinette": 0, "moto":   0},
    },
    "ref_prices": {
        "voiture":     {"diesel": 28000, "elec": 35000, "phev": 38000, "h2":  70000, "efuel": 32000, "gnv":  27000},
        "vul_petit":   {"diesel": 22000, "elec": 32000, "phev": 34000, "h2":  60000, "efuel": 24000, "gnv":  23000},
        "vul_moyen":   {"diesel": 32000, "elec": 45000, "phev":     0, "h2":  75000, "efuel": 34000, "gnv":  33000},
        "vul_grand":   {"diesel": 42000, "elec": 62000, "phev":     0, "h2":  90000, "efuel": 44000, "gnv":  43000},
        "camion":      {"diesel": 70000, "elec": 145000,"phev":     0, "h2": 220000, "efuel": 72000, "gnv":  80000},
        "poids_lourd": {"diesel":110000, "elec": 380000,"phev":     0, "h2": 480000, "efuel":115000, "gnv": 130000},
        "vae":         {"elec": 1800},
        "trottinette": {"elec":  600},
        "moto":        {"diesel": 5500, "elec": 9000},
    },
}

HEADERS = {
    "User-Agent": "Mozilla/5.0 (compatible; Moteurs.com-bot/1.0; +https://moteurs.com)",
    "Accept-Language": "fr-FR,fr;q=0.9",
}


# ── Scraping prix énergie ─────────────────────────────────────────────────────

async def _scrape_diesel_fr() -> float | None:
    """
    Scrape le prix moyen national du diesel en France depuis prix-carburants.gouv.fr
    ou l'API statistiques du SDES/DGEC (données hebdomadaires).
    """
    urls = [
        # API JSON du gouvernement — prix moyens nationaux (SP95, Gazole, etc.)
        "https://data.economie.gouv.fr/api/explore/v2.1/catalog/datasets/prix_carburants_france_flux_instantane_v2/records?limit=1&order_by=date%20desc&where=nom%3D%22Gazole%22",
    ]
    async with httpx.AsyncClient(timeout=15, headers=HEADERS) as client:
        for url in urls:
            try:
                r = await client.get(url)
                if r.status_code == 200:
                    data = r.json()
                    records = data.get("results", [])
                    if records:
                        prix = records[0].get("prix")
                        if prix:
                            return round(float(prix), 3)
            except Exception as e:
                logger.debug(f"[Simulateur] Diesel FR scrape échoué ({url}) : {e}")
    return None


async def _scrape_elec_fr() -> float | None:
    """
    Prix moyen du kWh électricité résidentielle FR (tarif réglementé EDF).
    Source : CRE (Commission de Régulation de l'Énergie) ou données publiques.
    """
    try:
        async with httpx.AsyncClient(timeout=15, headers=HEADERS) as client:
            r = await client.get(
                "https://www.prix-elec.com/tarif-reglemente/",
                follow_redirects=True,
            )
            if r.status_code == 200:
                # Cherche un pattern type "0,2516 €/kWh" ou "25,16 c€/kWh"
                match = re.search(r'(\d+[,\.]\d+)\s*[€c]?/kWh', r.text)
                if match:
                    val = float(match.group(1).replace(",", "."))
                    # Si en centimes (>1.0), convertir en €
                    if val > 1.0:
                        val = val / 100
                    return round(val, 4)
    except Exception as e:
        logger.debug(f"[Simulateur] Elec FR scrape échoué : {e}")
    return None


async def _scraper_prix() -> dict:
    """
    Tente de scraper les prix réels. Retourne un dict partiel des prix mis à jour.
    Les valeurs non trouvées ne sont pas incluses (on garde le fallback Supabase).
    """
    mises_a_jour = {}

    diesel_fr = await _scrape_diesel_fr()
    if diesel_fr and 1.20 < diesel_fr < 2.50:  # sanity check
        mises_a_jour.setdefault("FR", {})["diesel"] = diesel_fr
        logger.info(f"[Simulateur] Diesel FR scrapé : {diesel_fr} €/L")

    elec_fr = await _scrape_elec_fr()
    if elec_fr and 0.10 < elec_fr < 0.50:
        mises_a_jour.setdefault("FR", {})["elec"] = elec_fr
        logger.info(f"[Simulateur] Électricité FR scrapée : {elec_fr} €/kWh")

    return mises_a_jour


# ── Supabase — lecture / écriture des données ─────────────────────────────────

def _charger_depuis_supabase() -> dict:
    """
    Charge les données simulateur depuis la table `config_workflow` (clé=simulateur_data)
    ou retourne le fallback si absent.
    """
    supabase = get_supabase()
    try:
        result = (
            supabase.table("config_workflow")
            .select("valeur")
            .eq("cle", "simulateur_data")
            .single()
            .execute()
        )
        if result.data and result.data.get("valeur"):
            return json.loads(result.data["valeur"])
    except Exception as e:
        logger.debug(f"[Simulateur] Pas de données en base : {e}")
    return FALLBACK_DATA.copy()


def _sauvegarder_en_supabase(data: dict) -> None:
    """Persist les données simulateur dans config_workflow."""
    supabase = get_supabase()
    supabase.table("config_workflow").upsert({
        "cle": "simulateur_data",
        "valeur": json.dumps(data, ensure_ascii=False),
        "description": "Données simulateur TCO — mises à jour automatiquement",
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }, on_conflict="cle").execute()


# ── Génération du JSON export ─────────────────────────────────────────────────

def generer_json_export(data: dict) -> str:
    """Génère le contenu du fichier simulateur-data.json pour déploiement."""
    export = {
        "_meta": {
            "version": datetime.now(timezone.utc).strftime("%Y-%m-%d"),
            "updated_at": datetime.now(timezone.utc).isoformat(),
            "sources": {
                "energy_prices_fr": "https://www.prix-carburants.gouv.fr/",
                "aides_fr": "https://www.service-public.fr/particuliers/vosdroits/F34318",
            },
        },
        **data,
    }
    return json.dumps(export, ensure_ascii=False, indent=2)


# ── Batch principal ───────────────────────────────────────────────────────────

async def run_simulateur_update() -> dict:
    """
    Cycle complet de mise à jour :
    1. Charge les données actuelles depuis Supabase
    2. Scrape les nouvelles valeurs
    3. Fusionne et détecte les changements
    4. Sauvegarde en Supabase si changements
    5. Retourne le résumé + le JSON à déployer
    """
    logger.info("[AgentSimulateur] Démarrage cycle de mise à jour")

    # 1. Données actuelles
    data_actuelle = _charger_depuis_supabase()

    # 2. Scraping
    prix_scrapes = await _scraper_prix()

    # 3. Fusion et détection des changements
    changements = []
    data_nouvelle = {k: (v.copy() if isinstance(v, dict) else v) for k, v in data_actuelle.items()}

    if "energy_prices" not in data_nouvelle:
        data_nouvelle["energy_prices"] = FALLBACK_DATA["energy_prices"].copy()

    for pays, prix in prix_scrapes.items():
        for carburant, valeur in prix.items():
            ancienne = data_nouvelle["energy_prices"].get(pays, {}).get(carburant)
            if ancienne is None or abs(valeur - ancienne) > 0.01:  # seuil 1 centime
                data_nouvelle["energy_prices"].setdefault(pays, {})[carburant] = valeur
                changements.append(f"{pays} {carburant}: {ancienne} → {valeur} €")

    # 4. Sauvegarde si changements
    if changements:
        _sauvegarder_en_supabase(data_nouvelle)
        logger.info(f"[AgentSimulateur] {len(changements)} changement(s) enregistré(s) : {changements}")
    else:
        logger.info("[AgentSimulateur] Aucun changement de prix détecté")

    # 5. Retourner résumé
    json_export = generer_json_export(data_nouvelle)
    return {
        "changements": changements,
        "nb_changements": len(changements),
        "data": data_nouvelle,
        "json_export": json_export,
    }
