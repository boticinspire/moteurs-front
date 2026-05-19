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
"""

import logging
from datetime import datetime, timezone

import anthropic

from config import get_settings
from database import get_supabase

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

# ── Génération via Claude Haiku ───────────────────────────────────────────────

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

    # Hashtags pays
    base_pays = HASHTAGS_PAYS.get(pays, HASHTAGS_PAYS["FR"])

    # Hashtags thématiques selon mots détectés
    thematiques = []
    for moteur, tags in HASHTAGS_MOTEUR.items():
        if moteur in texte:
            thematiques.extend(tags[:2])
            break

    # LinkedIn : 4-6 hashtags
    tous_li = list(dict.fromkeys(thematiques + base_pays))[:5]
    hashtags_li = " ".join(tous_li)

    # X : 2-3 hashtags (courts)
    tous_x = list(dict.fromkeys(thematiques[:1] + base_pays[:2]))[:3]
    hashtags_x = " ".join(tous_x)

    return hashtags_li, hashtags_x


def _pays_label(code: str) -> str:
    return {"FR": "France", "BE": "Belgique", "CH": "Suisse", "CA": "Canada"}.get(code, code)


def _generer_posts_haiku(article: dict) -> dict:
    """
    Appelle Claude Haiku pour générer le post LinkedIn et le post X.
    Retourne {"linkedin": str, "x": str}.
    """
    client = anthropic.Anthropic(api_key=settings.anthropic_api_key)

    slug = article.get("slug", "")
    url  = f"{SITE_URL}/article/{slug}" if slug else SITE_URL
    titre   = article.get("titre_provisoire", "")
    resume  = article.get("resume_50mots", "") or article.get("meta_description", "") or titre
    pays    = article.get("pays_cible", "FR")

    hashtags_li, hashtags_x = _selectionner_hashtags(article)

    # ── LinkedIn ──
    prompt_li = PROMPT_LINKEDIN.format(
        titre=titre, resume=resume, pays_label=_pays_label(pays),
        url=url, hashtags=hashtags_li,
    )
    resp_li = client.messages.create(
        model="claude-haiku-4-5-20251001",
        max_tokens=600,
        messages=[{"role": "user", "content": prompt_li}],
    )
    post_linkedin = resp_li.content[0].text.strip()

    # ── X / Twitter ──
    prompt_x = PROMPT_X.format(
        titre=titre, resume=resume, url=url, hashtags=hashtags_x,
    )
    resp_x = client.messages.create(
        model="claude-haiku-4-5-20251001",
        max_tokens=120,
        messages=[{"role": "user", "content": prompt_x}],
    )
    post_x = resp_x.content[0].text.strip()

    return {"linkedin": post_linkedin, "x": post_x}


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

    if article.get("etat_code") not in ("PUBLIE", "VALIDE"):
        logger.warning(f"[AgentSocial] Article #{article_id} non publié — état : {article.get('etat_code')}")
        return {"succes": False, "erreur": f"Article non publié (état : {article.get('etat_code')})"}

    titre = article.get("titre_provisoire", "")
    logger.info(f"[AgentSocial] Génération posts sociaux — article #{article_id} : {titre[:60]}")

    try:
        posts = _generer_posts_haiku(article)
    except Exception as e:
        logger.error(f"[AgentSocial] Erreur Haiku : {e}")
        return {"succes": False, "erreur": str(e)}

    ids = _sauvegarder_posts(article_id, posts, supabase)

    logger.info(f"[AgentSocial] ✅ {len(ids)} posts générés — article #{article_id}")
    return {
        "succes": True,
        "article_id": article_id,
        "posts_generes": list(posts.keys()),
        "ids_supabase": ids,
        "apercu_linkedin": posts["linkedin"][:120] + "…",
        "apercu_x": posts["x"],
    }


async def generer_posts_batch(limite: int = 20) -> dict:
    """
    Génère les posts manquants pour les N derniers articles publiés
    qui n'ont pas encore de posts sociaux.
    """
    supabase = get_supabase()

    # Articles publiés sans posts sociaux
    articles = (
        supabase.table("articles")
        .select("id, titre_provisoire")
        .eq("etat_code", "PUBLIE")
        .order("published_at", desc=True)
        .limit(limite)
        .execute()
        .data or []
    )

    ids_avec_posts = set()
    existants = supabase.table("social_posts").select("article_id").execute().data or []
    for e in existants:
        ids_avec_posts.add(e["article_id"])

    a_traiter = [a for a in articles if a["id"] not in ids_avec_posts]

    resultats = []
    for article in a_traiter:
        res = await generer_posts_sociaux(article["id"])
        resultats.append(res)

    return {
        "traites": len(resultats),
        "succes": sum(1 for r in resultats if r.get("succes")),
        "echecs": sum(1 for r in resultats if not r.get("succes")),
        "details": resultats,
    }
