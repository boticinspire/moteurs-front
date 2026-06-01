"""
Agent Social — Moteurs.com
Génère automatiquement des posts LinkedIn et X (Twitter) pour chaque article publié.

Pipeline :
  1. Charge l'article depuis Supabase (titre, résumé, URL, pays)
  2. Génère un post LinkedIn (1 200–1 500 car.) avec hashtags + CTA
  3. Génère un post X (240 car. max) avec hashtags + lien court
  4. Stocke les brouillons dans la table `social_posts` (statut BROUILLON)

Modèle : Claude Haiku (économique — tâche de reformatage, pas de rédaction complexe)
Déclenchement : manuel via POST /social/generer/{article_id} ou batch /social/generer-batch
Protection : SafeAgent wrapper (timeout 2 min, max 3 itérations)
"""

import logging
from datetime import datetime, timezone

from config import get_settings
from database import get_supabase
from safe_agent import get_social_agent

logger = logging.getLogger(__name__)
settings = get_settings()

SITE_URL = "https://moteurs.com"

# ── Hashtags par pays et par thème ────────────────────────────────────────────

HASHTAGS_PAYS = {
    "FR": ["#MobilitéPropre", "#TransitionÉnergétique", "#ZFE", "#France"],
    "BE": ["#MobilitéDurable", "#Belgique", "#VéhiculesPropres", "#TransitionVerte"],
    "CH": ["#MobilitéElectrique", "#Suisse", "#Décarbonation", "#Innovation"],
    "CA": ["#MobilitéVerte", "#Canada", "#Électrique", "#TransitionÉnergétique"],
}

HASHTAGS_MOTEUR = {
    "électrique": ["#Électrique", "#VE", "#BEV"],
    "diesel":     ["#Diesel", "#TCO"],
    "hydrogène":  ["#Hydrogène", "#H2", "#PileCombustible"],
    "gnv":        ["#GNV", "#BioGNV", "#GazNaturel"],
    "phev":       ["#PHEV", "#HybrideRechargeable"],
    "efuel":      ["#Efuel", "#CarburantSynthétique"],
}

# ── Prompts ───────────────────────────────────────────────────────────────────

PROMPT_LINKEDIN = """\
Tu es chargé(e) de créer un post LinkedIn professionnel pour le média Moteurs.com.

ARTICLE À PROMOUVOIR :
- Titre : {titre}
- Résumé : {resume}
- Pays cible : {pays_label}
- URL : {url}

CONSIGNES STRICTES :
1. Longueur : 1 200 à 1 500 caractères (espaces compris)
2. Ton : expert, direct, factuel — jamais de jargon marketing vague
3. Structure : accroche (chiffre ou question) → contexte rapide → 2-3 points clés → CTA
4. CTA obligatoire : "Lire l'analyse complète → {url}"
5. Terminer avec 4-5 hashtags pertinents : {hashtags}
6. Interdits : "révolutionnaire", "game changer", "incroyable", "fascinant"
7. Langue : français

Génère uniquement le texte du post, sans balises ni commentaires.
"""

PROMPT_X = """\
Tu es chargé(e) de créer un post X (Twitter) pour le média Moteurs.com.

ARTICLE À PROMOUVOIR :
- Titre : {titre}
- Résumé : {resume}
- URL : {url}

CONSIGNES STRICTES :
1. Maximum 240 caractères (URL incluse, lien compté pour 23 car. par Twitter)
2. Ton : factuel, percutant, 1 chiffre ou fait marquant si possible
3. Le lien doit figurer à la fin
4. 2-3 hashtags maximum : {hashtags}
5. Pas d'emojis excessifs — 1 max si vraiment pertinent
6. Langue : français

Génère uniquement le texte du post, sans balises ni commentaires.
"""

# ── Génération via Claude Haiku avec SafeAgent ────────────────────────────────

def _selectionner_hashtags(article: dict) -> tuple[str, str]:
    """
    Construit les chaînes de hashtags pour LinkedIn et X.
    Combine hashtags pays + thématiques détectées dans le titre/résumé.
    """
    pays = article.get("pays_cible", "FR")
    texte = (
        (article.get("titre_provisoire") or "") + " " +
        (article.get("resume_50mots") or "")
    ).lower()

    hashtags_li = HASHTAGS_PAYS.get(pays, HASHTAGS_PAYS["FR"]).copy()
    hashtags_x = HASHTAGS_PAYS.get(pays, HASHTAGS_PAYS["FR"])[:2]

    for moteur, tags in HASHTAGS_MOTEUR.items():
        if moteur in texte:
            hashtags_li.extend(tags[:2])
            if len(hashtags_x) < 3:
                hashtags_x = hashtags_x + tags[:1]

    return " ".join(hashtags_li[:6]), " ".join(hashtags_x[:3])


def _pays_label(code: str) -> str:
    return {"FR": "France", "BE": "Belgique", "CH": "Suisse", "CA": "Canada"}.get(code, code)


def _generer_posts_haiku(article: dict) -> dict:
    """
    Appelle Claude Haiku pour générer le post LinkedIn et le post X.
    ✅ PROTECTION : SafeAgent wrapper (timeout 2 min, max 3 itérations)
    Retourne {"linkedin": str, "x": str}.
    """
    agent = get_social_agent(api_key=settings.anthropic_api_key)

    slug = article.get("slug", "")
    url  = f"{SITE_URL}/article/{slug}" if slug else SITE_URL
    titre   = article.get("titre_provisoire", "")
    resume  = article.get("resume_50mots", "") or article.get("meta_description", "") or titre
    pays    = article.get("pays_cible", "FR")

    hashtags_li, hashtags_x = _selectionner_hashtags(article)

    result = {
        "linkedin": "",
        "x": ""
    }

    # ── LinkedIn ──
    prompt_li = PROMPT_LINKEDIN.format(
        titre=titre, resume=resume, pays_label=_pays_label(pays),
        url=url, hashtags=hashtags_li,
    )
    result_li = agent.call(
        messages=[{"role": "user", "content": prompt_li}],
        max_tokens=600
    )
    if result_li['success']:
        result["linkedin"] = result_li['content'].strip()
    else:
        logger.error(f"[AgentSocial] Erreur LinkedIn : {result_li['error_type']}")

    # ── X / Twitter ──
    prompt_x = PROMPT_X.format(
        titre=titre, resume=resume, url=url, hashtags=hashtags_x,
    )
    result_x = agent.call(
        messages=[{"role": "user", "content": prompt_x}],
        max_tokens=120
    )
    if result_x['success']:
        result["x"] = result_x['content'].strip()
    else:
        logger.error(f"[AgentSocial] Erreur X : {result_x['error_type']}")

    return result


# ── Sauvegarde Supabase ───────────────────────────────────────────────────────

def _sauvegarder_posts(article_id: int, posts: dict, supabase) -> list[int]:
    """
    Upsert dans `social_posts` — un enregistrement par plateforme.
    Schéma réel : plateforme (text), contenu, publie (bool), date_programmee, media_url.
    Retourne les IDs insérés/mis à jour.
    """
    ids = []

    for plateforme, contenu in posts.items():
        if not contenu:
            continue
        # Supprime d'abord l'éventuel brouillon existant pour éviter les doublons
        supabase.table("social_posts").delete().eq("article_id", article_id).eq("plateforme", plateforme).eq("publie", False).execute()

        result = supabase.table("social_posts").insert(
            {
                "article_id": article_id,
                "plateforme": plateforme,   # 'linkedin' ou 'x'
                "contenu": contenu,
                "publie": False,            # brouillon — Oliver publie manuellement
            }
        ).execute()
        if result.data:
            ids.append(result.data[0].get("id"))
            logger.debug(f"[AgentSocial] Post {plateforme} sauvegardé — article #{article_id}")

    return ids


# ── Point d'entrée principal ──────────────────────────────────────────────────

async def generer_posts_sociaux(article_id: int) -> dict:
    """
    Génère et stocke les posts LinkedIn + X pour un article donné.
    Retourne un rapport de l'opération.
    """
    supabase = get_supabase()

    # Charger l'article
    res = (
        supabase.table("articles")
        .select("id, titre_provisoire, resume_50mots, meta_description, slug, pays_cible, etat_code")
        .eq("id", article_id)
        .single()
        .execute()
    )
    article = res.data
    if not article:
        logger.error(f"[AgentSocial] Article #{article_id} introuvable")
        return {"succes": False, "erreur": "Article introuvable"}

    logger.info(f"[AgentSocial] Génération posts pour article #{article_id}")

    # Générer les posts
    posts = _generer_posts_haiku(article)

    # Valider que au moins un post a été généré
    if not posts.get("linkedin") and not posts.get("x"):
        logger.error(f"[AgentSocial] Aucun post généré pour #{article_id}")
        return {"succes": False, "erreur": "Génération échouée"}

    # Sauvegarder
    ids = _sauvegarder_posts(article_id, posts, supabase)
    logger.info(f"[AgentSocial] ✅ {len(ids)} post(s) sauvegardé(s)")

    return {
        "succes": True,
        "article_id": article_id,
        "posts_generes": {
            "linkedin": bool(posts.get("linkedin")),
            "x": bool(posts.get("x")),
        },
        "ids_sociaux": ids,
    }


async def generer_posts_batch(article_ids: list[int] = None) -> dict:
    """
    Génère les posts pour une liste d'articles (ou les derniers articles PUBLIE).
    """
    supabase = get_supabase()

    if not article_ids:
        res = (
            supabase.table("articles")
            .select("id")
            .eq("etat_code", "PUBLIE")
            .order("created_at", desc=True)
            .limit(5)
            .execute()
        )
        article_ids = [a["id"] for a in res.data] if res.data else []

    if not article_ids:
        logger.info("[AgentSocial] Aucun article PUBLIE trouvé")
        return {"succes": True, "articles_traites": 0, "posts_generes": 0}

    total_posts = 0
    for article_id in article_ids:
        try:
            result = await generer_posts_sociaux(article_id)
            if result.get("succes"):
                total_posts += len(result.get("ids_sociaux", []))
        except Exception as e:
            logger.error(f"[AgentSocial] Erreur article #{article_id} : {e}")

    logger.info(f"[AgentSocial] Batch terminé — {total_posts} posts générés")
    return {
        "succes": True,
        "articles_traites": len(article_ids),
        "posts_generes": total_posts,
    }
