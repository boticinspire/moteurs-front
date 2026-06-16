import asyncio
import logging
from fastapi import APIRouter, HTTPException, Query
from database import get_supabase
from agents.redaction.agent import run_redaction_batch, generer_declinaisons_post_validation
from agents.seo.agent import enrichir_article_seo

logger = logging.getLogger(__name__)
router = APIRouter()

@router.get("/")
async def liste_articles(etat: str = None, limit: int = 50):
    """Liste les articles, filtrables par état de workflow."""
    supabase = get_supabase()
    query = (
        supabase.table("articles")
        .select("id, titre_provisoire, slug, etat_code, etat_updated_at, profil_id, segment_id, pays_cible, created_at")
        .order("created_at", desc=True)
        .limit(limit)
    )
    if etat:
        query = query.eq("etat_code", etat)
    return query.execute().data


@router.get("/{article_id}")
async def get_article(article_id: int):
    """Détail complet d'un article."""
    supabase = get_supabase()
    result = supabase.table("articles").select("*").eq("id", article_id).single().execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Article introuvable")
    return result.data


@router.patch("/{article_id}/valider")
async def valider_article(article_id: int, commentaire: str = ""):
    """
    Valide un article :
    1. Enregistre la validation manuelle
    2. Passe l'état à VALIDE
    3. Déclenche l'Agent SEO en arrière-plan (JSON-LD + maillage + -> PUBLIE)
    """
    supabase = get_supabase()

    # Enregistrement de la validation
    supabase.table("validations").upsert({
        "article_id": article_id,
        "valide": True,
        "commentaire": commentaire,
        "valide_par": "oliver",
    }, on_conflict="article_id").execute()

    # Passage en VALIDE
    supabase.table("articles").update({
        "etat_code": "VALIDE",
    }).eq("id", article_id).execute()

    # Enrichissement SEO en arriere-plan (non bloquant pour l'admin)
    async def _seo_bg():
        try:
            result = await enrichir_article_seo(article_id)
            logger.info(f"[Validation] SEO enrichissement article #{article_id} : {result}")
        except Exception as e:
            logger.error(f"[Validation] Erreur SEO article #{article_id} : {e}")

    asyncio.create_task(_seo_bg())

    # Déclinaison géographique BE/CH/CA en arrière-plan (politique 1-article/signal) :
    # on ne décline un signal vers les autres pays qu'une fois l'article validé.
    async def _decliner_bg():
        try:
            res = await generer_declinaisons_post_validation(article_id)
            logger.info(f"[Validation] Déclinaisons article #{article_id} : {res}")
        except Exception as e:
            logger.error(f"[Validation] Erreur déclinaison article #{article_id} : {e}")

    asyncio.create_task(_decliner_bg())

    return {"status": "ok", "article_id": article_id, "etat": "VALIDE",
            "seo": "en_cours", "declinaisons": "en_cours"}


@router.patch("/{article_id}/rejeter")
async def rejeter_article(article_id: int, motif: str = ""):
    """Rejette un article avec un motif."""
    supabase = get_supabase()

    supabase.table("validations").upsert({
        "article_id": article_id,
        "valide": False,
        "commentaire": motif,
        "valide_par": "oliver",
    }, on_conflict="article_id").execute()

    supabase.table("articles").update({
        "etat_code": "REJETE",
        "motif_rejet": motif,
    }).eq("id", article_id).execute()

    return {"status": "ok", "article_id": article_id, "etat": "REJETE"}


@router.post("/lancer-redaction")
async def lancer_redaction(limit: int = Query(default=3, ge=1, le=10)):
    """Alias admin -> declenche l'Agent Redaction (meme logique que /generer)."""
    async def _batch_bg():
        try:
            result = await run_redaction_batch(limit)
            logger.info(f"[Redaction manuelle] Terminee : {result}")
        except Exception as e:
            logger.error(f"[Redaction manuelle] Erreur : {e}")

    asyncio.create_task(_batch_bg())

    return {
        "status": "ok",
        "message": f"Redaction lancee pour {limit} item(s) -- jusqu'a {limit * 4} articles possibles",
    }


@router.post("/generer")
async def generer_articles(limit: int = Query(default=3, ge=1, le=10)):
    """
    Declenche l'Agent Redaction manuellement en arriere-plan (non bloquant).
    Chaque item peut generer jusqu'a 4 articles (declinaisons geo).
    Repond immediatement -- l'admin doit rafraichir la liste apres ~2 min.
    """
    async def _batch_bg():
        try:
            result = await run_redaction_batch(limit)
            logger.info(f"[Redaction manuelle] Terminee : {result}")
        except Exception as e:
            logger.error(f"[Redaction manuelle] Erreur : {e}")

    asyncio.create_task(_batch_bg())

    return {
        "status": "ok",
        "message": f"Redaction lancee pour {limit} item(s) -- jusqu'a {limit * 4} articles possibles",
    }
