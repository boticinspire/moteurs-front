from fastapi import APIRouter, HTTPException, BackgroundTasks
from database import get_supabase
from agents.veille.agent import run_veille_toutes_sources, run_veille_source

router = APIRouter()


@router.get("/sources")
async def liste_sources():
    """Liste toutes les sources de veille."""
    supabase = get_supabase()
    result = supabase.table("sources").select("*").order("nom").execute()
    return result.data


@router.post("/sources/{source_id}/activer")
async def activer_source(source_id: int, actif: bool = True):
    """Active ou désactive une source."""
    supabase = get_supabase()
    supabase.table("sources").update({"actif": actif}).eq("id", source_id).execute()
    return {"status": "ok", "source_id": source_id, "actif": actif}


@router.post("/lancer")
async def lancer_veille(background_tasks: BackgroundTasks):
    """Déclenche manuellement un cycle de veille complet."""
    background_tasks.add_task(run_veille_toutes_sources)
    return {"status": "lancé", "message": "Cycle de veille en cours en arrière-plan"}


@router.post("/lancer/{source_id}")
async def lancer_veille_source(source_id: int, background_tasks: BackgroundTasks):
    """Déclenche la veille sur une source précise."""
    supabase = get_supabase()
    result = supabase.table("sources").select("*").eq("id", source_id).single().execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Source introuvable")
    background_tasks.add_task(run_veille_source, result.data)
    return {"status": "lancé", "source": result.data["nom"]}


@router.get("/items")
async def liste_items(statut: str = "NOUVEAU", limit: int = 50):
    """Liste les items de veille, filtrables par statut."""
    supabase = get_supabase()
    result = (
        supabase.table("veille_items")
        .select("*, sources(nom, pays)")
        .eq("statut", statut)
        .order("date_detection", desc=True)
        .limit(limit)
        .execute()
    )
    return result.data


@router.patch("/items/{item_id}/statut")
async def maj_statut_item(item_id: int, statut: str):
    """Met à jour le statut d'un item (ex: IGNORE, EN_TRAITEMENT)."""
    statuts_valides = ["NOUVEAU", "EN_TRAITEMENT", "TRAITE", "IGNORE"]
    if statut not in statuts_valides:
        raise HTTPException(status_code=400, detail=f"Statut invalide. Valeurs : {statuts_valides}")
    supabase = get_supabase()
    supabase.table("veille_items").update({"statut": statut}).eq("id", item_id).execute()
    return {"status": "ok", "item_id": item_id, "nouveau_statut": statut}
