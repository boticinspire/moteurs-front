"""
Migration one-shot : peuple la table tarifs_carte_pays depuis sources.py

Lit chaque carte du catalogue et insère/upsert une ligne par pays dans la
nouvelle table dédiée. Idempotent (UPSERT sur clé unique carte_id + pays_iso).

Lancement (depuis le dossier orchestrateur, avec .env chargé) :
    python -m scripts.migrate_tarifs_pays
ou :
    python scripts/migrate_tarifs_pays.py
"""

import sys
from pathlib import Path

# Ajoute le dossier orchestrateur au path pour importer ses modules
ROOT = Path(__file__).resolve().parent.parent
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from agents.recharge.sources import CARTES  # noqa: E402
from database import get_supabase            # noqa: E402


def _safe(d, *keys):
    """Lecture imbriquée tolérante aux None et clés absentes."""
    for k in keys:
        if not isinstance(d, dict):
            return None
        d = d.get(k)
        if d is None:
            return None
    return d


def _ligne_depuis_tarifs_fr_be_ch(carte: dict, pays: str, devise: str, tarifs: dict, abo_mensuel: float, source: str) -> dict:
    """
    Construit une ligne de la table à partir d'un bloc tarifs_fr / tarifs_be / tarifs_ch
    (format MSP classique : ac_slow + dc_rapide + dc_ultra).
    """
    return {
        "carte_id":      carte["id"],
        "pays_iso":      pays,
        "devise":        devise,
        "ac_slow_kwh":   _safe(tarifs, "ac_slow", "prix"),
        "dc_rapide_kwh": _safe(tarifs, "dc_rapide", "prix"),
        "dc_ultra_kwh":  _safe(tarifs, "dc_ultra", "prix"),
        # Pour les cartes type IONITY : champs supplémentaires si présents
        "plan_principal_kwh":   _safe(tarifs, "dc_ultra", "prix"),  # défaut = dc_ultra
        "plan_premium_kwh":     tarifs.get("_tarif_power_kwh"),
        "plan_sans_abo_app":    tarifs.get("_tarif_app_sans_abo"),
        "plan_sans_abo_direct": tarifs.get("_tarif_direct_sans_abo"),
        "abo_mensuel":          abo_mensuel,
        "source":               source,
        "needs_review":         False,
        "actif":                True,
    }


def _ligne_depuis_tarifs_par_pays(carte: dict, pays: str, donnees_pays: dict, abo_mensuel: float, source: str) -> dict:
    """
    Construit une ligne à partir du format tarifs_par_pays (IONITY) :
    {devise, motion_kwh, power_kwh, app_kwh, direct_kwh}
    """
    return {
        "carte_id":             carte["id"],
        "pays_iso":             pays,
        "devise":               donnees_pays.get("devise", "EUR"),
        "plan_principal_kwh":   donnees_pays.get("motion_kwh"),
        "plan_premium_kwh":     donnees_pays.get("power_kwh"),
        "plan_sans_abo_app":    donnees_pays.get("app_kwh"),
        "plan_sans_abo_direct": donnees_pays.get("direct_kwh"),
        "abo_mensuel":          abo_mensuel,
        "source":               source,
        "notes":                {"_note": donnees_pays["_note"]} if "_note" in donnees_pays else {},
        "needs_review":         False,
        "actif":                True,
    }


def construire_lignes(carte: dict) -> list[dict]:
    """Retourne la liste de toutes les lignes tarifs pour une carte."""
    lignes = []
    donnees = carte.get("donnees_init", {}) or {}
    abo_mensuel = _safe(donnees, "abonnement", "mensuel_eur") or 0
    source = donnees.get("_source") or carte.get("url_tarifs") or carte.get("url_officielle")

    # 1) Tarifs fixes par pays (format historique tarifs_fr/be/ch)
    if "tarifs_fr" in donnees:
        lignes.append(_ligne_depuis_tarifs_fr_be_ch(carte, "FR", "EUR", donnees["tarifs_fr"], abo_mensuel, source))
    if "tarifs_be" in donnees:
        lignes.append(_ligne_depuis_tarifs_fr_be_ch(carte, "BE", "EUR", donnees["tarifs_be"], abo_mensuel, source))
    if "tarifs_ch" in donnees:
        devise = donnees["tarifs_ch"].get("devise", "CHF")
        lignes.append(_ligne_depuis_tarifs_fr_be_ch(carte, "CH", devise, donnees["tarifs_ch"], abo_mensuel, source))

    # 2) Format extensible tarifs_par_pays (IONITY, Electra)
    tpp = donnees.get("tarifs_par_pays") or {}
    pays_deja_couverts = {l["pays_iso"] for l in lignes}
    for pays, dp in tpp.items():
        # Skip si format Electra ancien (avec prix_app/prix_cb) — on traite séparément
        if not isinstance(dp, dict):
            continue
        if pays in pays_deja_couverts:
            # Si la carte a aussi tarifs_par_pays pour FR/BE/CH, on enrichit la ligne existante
            ligne = next(l for l in lignes if l["pays_iso"] == pays)
            if "motion_kwh" in dp:
                ligne["plan_principal_kwh"] = dp["motion_kwh"]
            if "power_kwh" in dp:
                ligne["plan_premium_kwh"] = dp["power_kwh"]
            if "app_kwh" in dp:
                ligne["plan_sans_abo_app"] = dp["app_kwh"]
            if "direct_kwh" in dp:
                ligne["plan_sans_abo_direct"] = dp["direct_kwh"]
            continue
        if "motion_kwh" in dp or "power_kwh" in dp:
            lignes.append(_ligne_depuis_tarifs_par_pays(carte, pays, dp, abo_mensuel, source))
        else:
            # Format Electra : prix_app / prix_cb
            lignes.append({
                "carte_id":             carte["id"],
                "pays_iso":             pays,
                "devise":               "EUR",
                "plan_principal_kwh":   dp.get("prix_app"),
                "plan_sans_abo_direct": dp.get("prix_cb"),
                "abo_mensuel":          abo_mensuel,
                "source":               source,
                "notes":                {k: v for k, v in dp.items() if k not in ("prix_app", "prix_cb")},
                "needs_review":         False,
                "actif":                True,
            })

    return lignes


def main():
    supabase = get_supabase()
    total_insert = 0
    par_carte = {}

    for carte in CARTES:
        lignes = construire_lignes(carte)
        if not lignes:
            print(f"⚠️  {carte['id']}: aucune ligne tarifaire à insérer")
            continue

        # UPSERT par batch (on_conflict sur la clé unique carte_id + pays_iso)
        r = supabase.table("tarifs_carte_pays").upsert(
            lignes,
            on_conflict="carte_id,pays_iso"
        ).execute()

        nb = len(r.data) if r.data else len(lignes)
        par_carte[carte["id"]] = nb
        total_insert += nb
        print(f"✅ {carte['id']:25s} → {nb:3d} pays")

    print()
    print(f"━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
    print(f"Total : {total_insert} lignes upsert dans tarifs_carte_pays")
    print(f"Cartes traitées : {len(par_carte)} / {len(CARTES)}")


if __name__ == "__main__":
    main()
