import asyncio
import logging
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr
from typing import Optional
from database import get_supabase
from agents.b2b.agent import traiter_lead

router = APIRouter()
logger = logging.getLogger(__name__)


class LeadIn(BaseModel):
    email: EmailStr
    nom: Optional[str] = None
    entreprise: Optional[str] = None
    telephone: Optional[str] = None
    segment_id: Optional[int] = None
    pays: Optional[str] = "FR"
    type_flotte: Optional[str] = None
    taille_flotte: Optional[str] = None
    problematique: Optional[str] = None
    source_lead: str = "FORMULAIRE_B2B"
    message: Optional[str] = None


@router.post("/")
async def creer_lead(lead: LeadIn):
    """
    Enregistre un lead B2B et déclenche l'Agent B2B en arrière-plan.
    Répond immédiatement — la qualification tourne en async.
    """
    supabase = get_supabase()
    result = supabase.table("leads").insert(lead.model_dump()).execute()
    lead_id = result.data[0]["id"]

    # Qualification + préparation réponse en arrière-plan (non bloquant)
    async def _qualifier_bg():
        try:
            res = await traiter_lead(lead_id)
            logger.info(f"[Leads] Agent B2B terminé pour lead #{lead_id} : {res}")
        except Exception as e:
            logger.error(f"[Leads] Erreur Agent B2B lead #{lead_id} : {e}")

    asyncio.create_task(_qualifier_bg())

    return {"status": "ok", "lead_id": lead_id, "qualification": "en_cours"}


@router.get("/")
async def liste_leads(traite: bool = False, limit: int = 50):
    """Liste les leads avec leur qualification, filtrables par statut."""
    supabase = get_supabase()
    return (
        supabase.table("leads")
        .select("id, email, nom, entreprise, pays, type_flotte, taille_flotte, "
                "problematique, score_potentiel, qualification_json, "
                "reponse_preparee, traite, created_at")
        .eq("traite", traite)
        .order("score_potentiel", desc=True)
        .order("created_at", desc=True)
        .limit(limit)
        .execute()
        .data
    )


@router.get("/{lead_id}")
async def get_lead(lead_id: int):
    """Détail complet d'un lead."""
    supabase = get_supabase()
    result = supabase.table("leads").select("*").eq("id", lead_id).single().execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Lead introuvable")
    return result.data


@router.patch("/{lead_id}/traiter")
async def marquer_traite(lead_id: int):
    """Marque un lead comme traité."""
    supabase = get_supabase()
    supabase.table("leads").update({"traite": True}).eq("id", lead_id).execute()
    return {"status": "ok", "lead_id": lead_id}


@router.post("/{lead_id}/requalifier")
async def requalifier_lead(lead_id: int):
    """Relance l'Agent B2B sur un lead existant (utile si la qualification a échoué)."""
    async def _bg():
        await traiter_lead(lead_id)

    asyncio.create_task(_bg())
    return {"status": "ok", "lead_id": lead_id, "qualification": "en_cours"}
