"""
Migration de tarifs_carte_pays — peut être lancé en CLI ou appelé via route HTTP.

CLI :
    python -m scripts.migrate_tarifs_pays

Module :
    from scripts.migrate_tarifs_pays import migrer_tous_tarifs
    resume = migrer_tous_tarifs()
"""

import sys
from pathlib import Path

# Permet l'import depuis le dossier orchestrateur quel que soit le cwd
ROOT = Path(__file__).resolve().parent.parent
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from agents.recharge.sources import CARTES  # noqa: E402


def _safe(d, *keys):
    """Lecture imbriquée tolérante aux None et clés absentes."""
    for k in keys:
        if not isinstance(d, dict):
            return None
        d = d.get(k)
        if d is None:
            return None
    return d


def _ligne_msp(carte: dict, pays: str, devise: str, tarifs: dict, abo_mensuel: float, source: str) -> dict:
    """Format MSP classique : ac_slow + dc_rapide + dc_ultra."""
    return {
        "carte_id":      carte["id"],
        "pays_iso":      pays,
        "devise":        devise,
        "ac_slow_kwh":   _safe(tarifs, "ac_slow", "prix"),
        "dc_rapide_kwh": _safe(tarifs, "dc_rapide", "prix"),
        "dc_ultra_kwh":  _safe(tarifs, "dc_ultra", "prix"),
        "plan_principal_kwh":   _safe(tarifs, "dc_ultra", "prix"),
        "plan_premium_kwh":     tarifs.get("_tarif_power_kwh"),
        "plan_sans_abo_app":    tarifs.get("_tarif_app_sans_abo"),
        "plan_sans_abo_direct": tarifs.get("_tarif_direct_sans_abo"),
        "abo_mensuel":          abo_mensuel,
        "source":               source,
        "needs_review":         False,
        "actif":                True,
    }


def _ligne_par_pays(carte: dict, pays: str, dp: dict, abo_mensuel: float, source: str) -> dict:
    """Format tarifs_par_pays (IONITY) : {devise, motion_kwh, power_kwh, app_kwh, direct_kwh}."""
    return {
        "carte_id":             carte["id"],
        "pays_iso":             pays,
        "devise":               dp.get("devise", "EUR"),
        "plan_principal_kwh":   dp.get("motion_kwh"),
        "plan_premium_kwh":     dp.get("power_kwh"),
        "plan_sans_abo_app":    dp.get("app_kwh"),
        "plan_sans_abo_direct": dp.get("direct_kwh"),
        "abo_mensuel":          abo_mensuel,
        "source":               source,
        "notes":                {"_note": dp["_note"]} if "_note" in dp else {},
        "needs_review":         False,
        "actif":                True,
    }


def construire_lignes(carte: dict) -> list[dict]:
    """Retourne la liste de toutes les lignes tarifs pour une carte."""
    lignes = []
    donnees = carte.get("donnees_init", {}) or {}
    abo_mensuel = _safe(donnees, "abonnement", "mensuel_eur") or 0
    source = donnees.get("_source") or carte.get("url_tarifs") or carte.get("url_officielle")

    # Tarifs fixes par pays (format historique)
    if "tarifs_fr" in donnees:
        lignes.append(_ligne_msp(carte, "FR", "EUR", donnees["tarifs_fr"], abo_mensuel, source))
    if "tarifs_be" in donnees:
        lignes.append(_ligne_msp(carte, "BE", "EUR", donnees["tarifs_be"], abo_mensuel, source))
    if "tarifs_ch" in donnees:
        devise = donnees["tarifs_ch"].get("devise", "CHF")
        lignes.append(_ligne_msp(carte, "CH", devise, donnees["tarifs_ch"], abo_mensuel, source))

    # Format extensible tarifs_par_pays (IONITY, Electra, etc.)
    tpp = donnees.get("tarifs_par_pays") or {}
    pays_deja_couverts = {l["pays_iso"] for l in lignes}
    for pays, dp in tpp.items():
        if not isinstance(dp, dict):
            continue
        if pays in pays_deja_couverts:
            # Enrichir la ligne existante avec les champs IONITY
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
            lignes.append(_ligne_par_pays(carte, pays, dp, abo_mensuel, source))
        else:
            # Format Electra : prix_app / prix_cb / tva_pct / dynamique
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


def migrer_tous_tarifs() -> dict:
    """
    Lance la migration. Retourne un résumé :
      { "total": int, "par_carte": {carte_id: nb}, "erreurs": [str] }
    """
    # Import différé pour permettre l'usage du module sans avoir supabase configuré
    from database import get_supabase

    supabase = get_supabase()
    total = 0
    par_carte = {}
    erreurs = []

    for carte in CARTES:
        try:
            lignes = construire_lignes(carte)
            if not lignes:
                par_carte[carte["id"]] = 0
                continue
            r = supabase.table("tarifs_carte_pays").upsert(
                lignes, on_conflict="carte_id,pays_iso"
            ).execute()
            nb = len(r.data) if r.data else len(lignes)
            par_carte[carte["id"]] = nb
            total += nb
        except Exception as e:
            erreurs.append(f"{carte['id']}: {type(e).__name__}: {e}")

    return {"total": total, "cartes_traitees": len(par_carte), "par_carte": par_carte, "erreurs": erreurs}


if __name__ == "__main__":
    r = migrer_tous_tarifs()
    for cid, nb in sorted(r["par_carte"].items()):
        print(f"  {cid:25s} → {nb:3d} pays")
    print()
    print(f"Total : {r['total']} lignes upsert ({r['cartes_traitees']} cartes traitées)")
    if r["erreurs"]:
        print("\n⚠️  Erreurs :")
        for e in r["erreurs"]:
            print(f"  - {e}")
