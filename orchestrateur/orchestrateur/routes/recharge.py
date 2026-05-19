"""
Routes FastAPI — Agent Recharge
"""
from fastapi import APIRouter, HTTPException, Query
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
async def lancer_batch():
    """Scrape toutes les cartes de recharge et met à jour Supabase."""
    result = await run_recharge_batch()
    return result


@router.post("/lancer/{carte_id}")
async def lancer_une_carte(carte_id: str):
    """Scrape une carte spécifique par son ID."""
    if carte_id not in CARTES_BY_ID:
        raise HTTPException(status_code=404, detail=f"Carte inconnue : {carte_id}")
    result = await scraper_carte(carte_id)
    return result


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
