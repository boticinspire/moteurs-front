"""
Routes FastAPI — Agent Alerte Gov.
"""
import logging
from fastapi import APIRouter, HTTPException, Query
from database import get_supabase
from agents.alerte_gov.agent import surveiller_sources_gov, get_alertes_non_lues

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("/lancer")
async def lancer_surveillance():
    """
    Déclenche manuellement un cycle de surveillance des sources gouvernementales.
    Retourne le rapport complet (sources vérifiées, changements, alertes).
    """
    return await surveiller_sources_gov()


@router.get("/alertes")
async def liste_alertes(statut: str = None, pays: str = None, limit: int = 50):
    """
    Liste les alertes de changement détectées.
    Filtrables par statut (NON_LU|LU|ARCHIVE) et pays (FR|BE|CH|CA).
    """
    supabase = get_supabase()
    query = (
        supabase.table("alertes_gov_events")
        .select("*")
        .order("created_at", desc=True)
        .limit(limit)
    )
    if statut:
        query = query.eq("statut", statut)
    if pays:
        query = query.eq("pays", pays)
    return query.execute().data


@router.get("/alertes/non-lues")
async def alertes_non_lues():
    """Alertes gov. non lues — pour le badge admin."""
    return await get_alertes_non_lues()


@router.patch("/alertes/{alerte_id}/lire")
async def marquer_lue(alerte_id: int):
    """Marque une alerte comme lue."""
    supabase = get_supabase()
    result = (
        supabase.table("alertes_gov_events")
        .update({"statut": "LU"})
        .eq("id", alerte_id)
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=404, detail="Alerte introuvable")
    return {"succes": True, "alerte_id": alerte_id}


@router.get("/sources")
async def liste_sources():
    """Liste les sources surveillées et leur dernier snapshot."""
    supabase = get_supabase()
    return (
        supabase.table("alertes_gov")
        .select("nom, pays, url, updated_at")
        .order("pays", desc=False)
        .execute()
        .data
    )
