import asyncio
import logging
from fastapi import APIRouter, HTTPException
from database import get_supabase
from agents.seo.agent import enrichir_article_seo

router = APIRouter()
logger = logging.getLogger(__name__)


@router.post("/enrichir/{article_id}", summary="Enrichissement SEO d'un article")
async def enrichir_seo(article_id: int):
    """
    Déclenche manuellement l'enrichissement SEO d'un article déjà validé :
    - Génération JSON-LD (Article + FAQPage)
    - Vérification meta title/description
    - Injection du maillage interne (2-3 liens contextuels)
    """
    result = await enrichir_article_seo(article_id)
    if not result.get("succes"):
        raise HTTPException(status_code=500, detail=result.get("erreur", "Erreur inconnue"))
    return result


@router.post("/traiter-valides", summary="Rattrapage SEO — traite tous les articles VALIDE bloqués")
async def traiter_articles_valides():
    """
    Déclenche l'enrichissement SEO en arrière-plan pour tous les articles
    en statut VALIDE (i.e. validés par Oliver mais SEO non encore appliqué).
    Répond immédiatement — le traitement tourne en async.
    """
    supabase = get_supabase()
    res = (
        supabase.table("articles")
        .select("id, titre_provisoire")
        .eq("etat_code", "VALIDE")
        .order("id")
        .execute()
    )
    articles = res.data or []

    if not articles:
        return {"status": "ok", "message": "Aucun article VALIDE à traiter", "count": 0}

    async def _batch_seo():
        ok, ko = 0, 0
        for a in articles:
            try:
                result = await enrichir_article_seo(a["id"])
                if result.get("succes"):
                    ok += 1
                    logger.info(f"[SEO Rattrapage] ✅ #{a['id']} → PUBLIE")
                else:
                    ko += 1
                    logger.warning(f"[SEO Rattrapage] ⚠️ #{a['id']} : {result.get('erreur')}")
            except Exception as e:
                ko += 1
                logger.error(f"[SEO Rattrapage] ❌ #{a['id']} : {e}")
        logger.info(f"[SEO Rattrapage] Terminé — {ok} publiés, {ko} erreurs")

    asyncio.create_task(_batch_seo())

    return {
        "status": "ok",
        "message": f"Traitement SEO lancé en arrière-plan pour {len(articles)} article(s)",
        "count": len(articles),
        "ids": [a["id"] for a in articles],
    }
