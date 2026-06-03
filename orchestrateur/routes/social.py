"""
Routes FastAPI — Agent Social
"""
import logging
from fastapi import APIRouter, HTTPException, Query
from database import get_supabase
from agents.social.agent import generer_posts_sociaux, generer_posts_batch

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("/generer/{article_id}")
async def generer_post(article_id: int):
    """
    Génère les posts LinkedIn + X pour un article donné.
    L'article doit être en état PUBLIE ou VALIDE.
    """
    result = await generer_posts_sociaux(article_id)
    if not result.get("succes"):
        raise HTTPException(status_code=400, detail=result.get("erreur", "Erreur inconnue"))
    return result


@router.post("/generer-batch")
async def generer_batch(limite: int = Query(default=20, ge=1, le=100)):
    """
    Génère les posts manquants pour les N derniers articles publiés
    qui n'ont pas encore de posts sociaux.
    """
    return await generer_posts_batch(limite=limite)


@router.get("/")
async def liste_posts(
    plateforme: str = None,
    publie: bool = None,
    article_id: int = None,
    limit: int = 50,
):
    """
    Liste les posts sociaux.
    Filtres optionnels : plateforme (linkedin|x), publie (true|false), article_id.
    """
    supabase = get_supabase()
    query = (
        supabase.table("social_posts")
        .select("id, article_id, plateforme, contenu, publie, date_programmee")
        .order("id", desc=True)
        .limit(limit)
    )
    if plateforme:
        query = query.eq("plateforme", plateforme)
    if publie is not None:
        query = query.eq("publie", publie)
    if article_id:
        query = query.eq("article_id", article_id)

    return query.execute().data


@router.patch("/{post_id}/publier")
async def marquer_publie(post_id: int):
    """Marque un post social comme publié."""
    supabase = get_supabase()
    result = supabase.table("social_posts").update({"publie": True}).eq("id", post_id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Post introuvable")
    return {"succes": True, "post_id": post_id, "publie": True}


@router.delete("/{post_id}")
async def supprimer_post(post_id: int):
    """Supprime un brouillon de post social."""
    supabase = get_supabase()
    supabase.table("social_posts").delete().eq("id", post_id).execute()
    return {"succes": True, "post_id": post_id}
