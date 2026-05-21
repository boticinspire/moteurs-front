"""
Routes FastAPI — Agent Recharge
"""
from fastapi import APIRouter, BackgroundTasks, HTTPException, Query
from pydantic import BaseModel

from agents.recharge.agent import (
    run_recharge_batch,
    scraper_carte,
    exporter_cartes_json,
)
from agents.recharge.sources import CARTES, CARTES_BY_ID
from database import get_supabase

router = APIRouter()


# ── Lancer le batch complet ───────────────────────────────────────────────────

@router.post("/lancer")
async def lancer_batch(background_tasks: BackgroundTasks):
    """Lance le scraping de toutes les cartes en arrière-plan — retourne immédiatement."""
    background_tasks.add_task(run_recharge_batch)
    return {
        "statut": "démarré",
        "message": "Scraping lancé en arrière-plan. Vérifiez /recharge/cartes dans 3-5 minutes.",
        "nb_cartes": len(CARTES),
    }


@router.post("/lancer/{carte_id}")
async def lancer_une_carte(carte_id: str, background_tasks: BackgroundTasks):
    """Lance le scraping d'une carte spécifique en arrière-plan."""
    if carte_id not in CARTES_BY_ID:
        raise HTTPException(status_code=404, detail=f"Carte inconnue : {carte_id}")
    background_tasks.add_task(scraper_carte, carte_id)
    return {"statut": "démarré", "carte": carte_id}


# ── Lecture des cartes ────────────────────────────────────────────────────────

@router.get("/cartes")
def lister_cartes(
    pays: str | None = Query(None, description="Filtre ISO pays (ex: FR, BE)"),
    voyage: bool | None = Query(None, description="Filtre ideal_voyage"),
    flotte: bool | None = Query(None, description="Filtre flotte_pro"),
):
    """
    Retourne les cartes actives depuis Supabase avec filtres optionnels.
    """
    supabase = get_supabase()
    q = supabase.table("cartes_recharge").select("*").eq("actif", True)

    if voyage is not None:
        q = q.eq("ideal_voyage", voyage)
    if flotte is not None:
        q = q.eq("flotte_pro", flotte)

    r = q.order("nom").execute()
    cartes = r.data

    if pays:
        pays_upper = pays.upper()
        cartes = [c for c in cartes if pays_upper in (c.get("pays_origine") or [])]

    return {"nb": len(cartes), "cartes": cartes}


@router.get("/cartes/{carte_id}")
def detail_carte(carte_id: str):
    """Retourne le détail complet d'une carte."""
    supabase = get_supabase()
    try:
        r = (
            supabase.table("cartes_recharge")
            .select("*")
            .eq("id", carte_id)
            .single()
            .execute()
        )
        return r.data
    except Exception:
        raise HTTPException(status_code=404, detail=f"Carte non trouvée : {carte_id}")


# ── Événements / historique ───────────────────────────────────────────────────

@router.get("/events")
def lister_events(
    carte_id: str | None = Query(None),
    limit: int = Query(50, le=200),
):
    """Retourne l'historique des changements de tarifs."""
    supabase = get_supabase()
    q = (
        supabase.table("recharge_events")
        .select("*")
        .order("created_at", desc=True)
        .limit(limit)
    )
    if carte_id:
        q = q.eq("carte_id", carte_id)
    r = q.execute()
    return {"nb": len(r.data), "events": r.data}


@router.get("/needs-review")
def cartes_a_verifier():
    """Retourne les cartes marquées needs_review=True (scraping incomplet)."""
    supabase = get_supabase()
    r = (
        supabase.table("cartes_recharge")
        .select("id, nom, operateur, anomalies, derniere_maj")
        .eq("needs_review", True)
        .eq("actif", True)
        .execute()
    )
    return {"nb": len(r.data), "cartes": r.data}


# ── Export JSON pour le front ─────────────────────────────────────────────────

@router.get("/export-json")
def export_json():
    """Retourne le JSON consolidé de toutes les cartes (pour Next.js)."""
    return exporter_cartes_json()


# ── Catalogue sources (statique) ──────────────────────────────────────────────

@router.get("/sources")
def lister_sources():
    """Retourne le catalogue de sources défini dans sources.py (sans données tarifaires)."""
    return {
        "nb": len(CARTES),
        "sources": [
            {
                "id":           c["id"],
                "nom":          c["nom"],
                "operateur":    c["operateur"],
                "pays_origine": c["pays_origine"],
                "methode":      c.get("methode"),
                "ideal_voyage": c.get("ideal_voyage"),
                "ideal_quotidien": c.get("ideal_quotidien"),
                "flotte_pro":   c.get("flotte_pro"),
            }
            for c in CARTES
        ],
    }


# ── Tarifs par pays (table tarifs_carte_pays) ─────────────────────────────────

@router.get("/tarifs")
def lister_tarifs(
    carte_id: str | None = Query(None, description="Filtre par carte_id (ex: 'ionity-passport')"),
    pays:     str | None = Query(None, description="Filtre ISO pays (ex: 'FR', 'DE')"),
    devise:   str | None = Query(None, description="Filtre devise (ex: 'EUR')"),
    limit:    int = Query(500, le=2000),
):
    """
    Liste les tarifs par carte et par pays depuis tarifs_carte_pays.
    Tous filtres optionnels. Utilise la vue v_tarifs_complet qui joint le nom carte.
    """
    supabase = get_supabase()
    q = supabase.table("v_tarifs_complet").select("*").limit(limit)
    if carte_id:
        q = q.eq("carte_id", carte_id)
    if pays:
        q = q.eq("pays_iso", pays.upper())
    if devise:
        q = q.eq("devise", devise.upper())
    r = q.execute()
    return {"nb": len(r.data), "tarifs": r.data}


@router.get("/cartes/{carte_id}/tarifs")
def tarifs_carte(carte_id: str):
    """Retourne tous les tarifs pays pour une carte donnée."""
    if carte_id not in CARTES_BY_ID:
        # On laisse passer car la carte peut exister en base sans être dans sources.py
        pass
    supabase = get_supabase()
    r = (
        supabase.table("tarifs_carte_pays")
        .select("*")
        .eq("carte_id", carte_id)
        .eq("actif", True)
        .order("pays_iso")
        .execute()
    )
    return {"carte_id": carte_id, "nb": len(r.data), "tarifs": r.data}


@router.get("/cartes/{carte_id}/tarifs/{pays_iso}")
def tarif_carte_pays(carte_id: str, pays_iso: str):
    """Retourne le tarif spécifique d'une carte pour un pays donné."""
    supabase = get_supabase()
    try:
        r = (
            supabase.table("tarifs_carte_pays")
            .select("*")
            .eq("carte_id", carte_id)
            .eq("pays_iso", pays_iso.upper())
            .eq("actif", True)
            .single()
            .execute()
        )
        return r.data
    except Exception:
        raise HTTPException(
            status_code=404,
            detail=f"Aucun tarif pour {carte_id} en {pays_iso.upper()}"
        )


@router.get("/tarifs/comparer/{pays_iso}")
def comparer_tarifs_pays(pays_iso: str, type_borne: str = Query("dc_ultra")):
    """
    Classement des cartes les moins chères pour un pays donné, sur un type de borne.
    type_borne ∈ {plan_principal_kwh, plan_premium_kwh, plan_sans_abo_app, ac_slow_kwh, dc_rapide_kwh, dc_ultra_kwh}
    """
    champs_valides = {
        "plan_principal", "plan_premium", "plan_sans_abo_app", "plan_sans_abo_direct",
        "ac_slow", "dc_rapide", "dc_ultra"
    }
    if type_borne not in champs_valides:
        raise HTTPException(status_code=400, detail=f"type_borne invalide. Valides: {sorted(champs_valides)}")
    col = type_borne + "_kwh"
    supabase = get_supabase()
    r = (
        supabase.table("v_tarifs_complet")
        .select("*")
        .eq("pays_iso", pays_iso.upper())
        .not_.is_(col, "null")
        .order(col)
        .execute()
    )
    classement = [
        {
            "rang": i + 1,
            "carte_id": row["carte_id"],
            "nom": row["carte_nom"],
            "operateur": row["operateur"],
            "devise": row["devise"],
            "prix_kwh": row.get(col),
            "abo_mensuel": row.get("abo_mensuel"),
        }
        for i, row in enumerate(r.data)
    ]
    return {"pays": pays_iso.upper(), "type_borne": type_borne, "nb": len(classement), "classement": classement}


# ── Migration one-shot : peuple tarifs_carte_pays depuis sources.py ──────────

@router.post("/tarifs/migrate")
def migrer_tarifs():
    """
    Lance la migration des tarifs depuis sources.py vers la table
    tarifs_carte_pays. Idempotent (UPSERT sur carte_id + pays_iso).
    À utiliser une fois après création de la table, puis à chaque ajout/maj
    de tarifs_par_pays dans sources.py.
    """
    from scripts.migrate_tarifs_pays import migrer_tous_tarifs
    return migrer_tous_tarifs()
