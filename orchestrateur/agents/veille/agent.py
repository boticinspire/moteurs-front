import logging
import re
from datetime import datetime

from config import get_settings
from database import get_supabase
from agents.common import dedup
from agents.veille.scraper import scrape_source
from safe_agent import get_veille_agent

logger = logging.getLogger(__name__)
settings = get_settings()


PROMPT_ANALYSE = """
Tu es l'Agent Veille de Moteurs.com, un média spécialisé dans la transition énergétique des transports routiers.

Analyse le contenu suivant provenant de la source : {source_nom} ({pays})
URL : {url}

CONTENU BRUT :
{contenu}

---
Ta mission :
1. Détermine si ce contenu contient une information NOUVELLE et PERTINENTE pour nos lecteurs (aides, ZFE, réglementation, prix énergie, motorisations alternatives).
2. Si oui, extrais un titre clair et un résumé de 3 à 5 phrases maximum.
3. Attribue un score de pertinence entre 0.0 (hors sujet) et 1.0 (très pertinent).

Réponds UNIQUEMENT en JSON avec ce format :
{{
  "pertinent": true/false,
  "titre": "...",
  "resume_ia": "...",
  "pertinence_score": 0.0
}}
"""


async def analyser_avec_claude(contenu: dict, source: dict) -> dict:
    """
    Envoie le contenu à Claude pour analyse et scoring.
    ✅ PROTECTION : SafeAgent wrapper (timeout 10 min, max 10 itérations)
    """
    import json
    agent = get_veille_agent(api_key=settings.anthropic_api_key)

    prompt = PROMPT_ANALYSE.format(
        source_nom=source["nom"],
        pays=source["pays"],
        url=contenu["url_origine"],
        contenu=contenu["contenu_brut"][:4000],
    )

    result = agent.call(
        messages=[{"role": "user", "content": prompt}],
        max_tokens=512
    )

    if not result['success']:
        logger.error(f"[AgentVeille] Erreur agent : {result['error_type']} — {result['content']}")
        return {"pertinent": False, "pertinence_score": 0.0}

    texte = result['content'].strip()
    try:
        # Extraction robuste : Claude ajoute parfois du texte autour du JSON
        match = re.search(r'\{.*\}', texte, re.DOTALL)
        if not match:
            logger.warning("[AgentVeille] Réponse Claude sans JSON détectable")
            return {"pertinent": False, "pertinence_score": 0.0}
        return json.loads(match.group())
    except json.JSONDecodeError as e:
        logger.error(f"[AgentVeille] Erreur parsing JSON : {e}")
        return {"pertinent": False, "pertinence_score": 0.0}


async def _stocker_item(supabase, source: dict, contenu: dict, analyse: dict) -> bool:
    """Insère un item pertinent dans veille_items. Retourne True si inséré."""
    # -- Dedup cross-source / cross-langue (0 token) -------------------------
    # Le meme evenement scrape depuis 2 sources (ex. EN + DE) cree 2 items et
    # double le fan-out de redaction. On compare via resume_ia (pivot FR)
    # contre les items des dernieres 72 h (hors items deja IGNORE).
    _nouvel = {
        "titre": analyse.get("titre", contenu.get("titre", "")),
        "resume_ia": analyse.get("resume_ia", "") or "",
    }
    try:
        _recents = (
            supabase.table("veille_items")
            .select("id,titre,resume_ia,date_detection,statut")
            .gte("date_detection", dedup._since_iso(dedup.RECENCY_HOURS))
            .neq("statut", "IGNORE")
            .execute()
            .data
        ) or []
        _dup = dedup.find_duplicate(_nouvel, _recents)
        if _dup is not None:
            logger.info(
                f"[AgentVeille] Doublon cross-langue ignore : "
                f"{_nouvel['titre'][:60]!r} ~ item #{_dup['id']}"
            )
            return False
    except Exception as e:
        logger.error(f"[AgentVeille] Erreur dedup (non bloquant) : {e}")
    # ------------------------------------------------------------------------
    try:
        supabase.table("veille_items").insert({
            "source_id": source["id"],
            "titre": analyse.get("titre", contenu["titre"]),
            "contenu_brut": contenu["contenu_brut"],
            "url_origine": contenu["url_origine"],
            "resume_ia": analyse.get("resume_ia"),
            "pertinence_score": analyse.get("pertinence_score", 0.5),
            "statut": "NOUVEAU",
            "langue": source.get("langue", "fr"),
        }).execute()
        logger.info(f"[AgentVeille] ✅ Item stocké : {analyse.get('titre', '—')}")
        return True
    except Exception as e:
        logger.error(f"[AgentVeille] Erreur insertion Supabase : {e}")
        return False


async def run_veille_source(source: dict) -> int:
    """
    Lance la veille sur une source.
    Supporte les pages HTML (1 item) et les flux RSS/Atom (N items).
    Retourne le nombre de nouveaux items détectés et stockés.
    """
    supabase = get_supabase()
    logger.info(f"[AgentVeille] Scraping : {source['nom']} ({source['url']})")

    try:
        # 1. Scraping — retourne une liste d'items
        items = await scrape_source(source["url"])
        if not items:
            logger.warning(f"[AgentVeille] Impossible de scraper {source['url']}")
            return 0

        # 2. Mise à jour date dernière visite (une seule fois par cycle)
        supabase.table("sources").update(
            {"derniere_visite_at": datetime.utcnow().isoformat()}
        ).eq("id", source["id"]).execute()

        # 3. Analyse + stockage de chaque item
        nouveaux = 0
        for contenu in items:
            # ── Guard URL doublon (0 token) — skip avant tout appel Claude ──
            url = contenu.get("url_origine", "")
            if url:
                try:
                    deja_vu = (
                        supabase.table("veille_items")
                        .select("id")
                        .eq("url_origine", url)
                        .limit(1)
                        .execute()
                        .data
                    )
                    if deja_vu:
                        logger.debug(f"[AgentVeille] URL déjà connue, skip : {url[:70]}")
                        continue
                except Exception:
                    pass  # En cas d'erreur DB, on laisse passer pour ne pas bloquer
            # ─────────────────────────────────────────────────────────────────

            analyse = await analyser_avec_claude(contenu, source)
            if not analyse.get("pertinent"):
                logger.debug(
                    f"[AgentVeille] Non pertinent ({source['nom']}) : {contenu['titre'][:60]}"
                )
                continue
            if await _stocker_item(supabase, source, contenu, analyse):
                nouveaux += 1

        logger.info(
            f"[AgentVeille] {source['nom']} : {nouveaux}/{len(items)} items retenus"
        )
        return nouveaux

    except Exception as e:
        logger.error(f"[AgentVeille] Erreur sur {source['nom']} : {e}")
        return 0


async def run_veille_toutes_sources() -> dict:
    """Lance la veille sur toutes les sources actives."""
    supabase = get_supabase()
    sources = supabase.table("sources").select("*").eq("actif", True).execute()

    total = 0
    erreurs = 0
    for source in sources.data:
        try:
            total += await run_veille_source(source)
        except Exception as e:
            logger.error(f"[AgentVeille] Source ignorée ({source['nom']}) : {e}")
            erreurs += 1

    logger.info(f"[AgentVeille] Cycle terminé — {total} nouveaux items, {erreurs} erreurs")
    return {
        "items_detectes": total,
        "sources_traitees": len(sources.data),
        "erreurs": erreurs,
    }
