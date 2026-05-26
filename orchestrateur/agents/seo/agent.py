"""
Agent SEO — Moteurs.com
Enrichit automatiquement les articles validés avec :
  1. JSON-LD Schema.org (Article + FAQPage)
  2. Vérification / log des balises meta
  3. Maillage interne (2-3 liens contextuels vers articles publiés)
Déclenché après validation manuelle d'un article.
"""

import json
import logging
import re
from datetime import datetime, timezone

import anthropic

from config import get_settings
from database import get_supabase

logger = logging.getLogger(__name__)

SITE_URL = "https://moteurs.com"

# ── Articles statiques existants (publiés avant le pipeline IA) ───────────────
# Utilisés comme cibles de maillage interne.

ARTICLES_STATIQUES = [
    {
        "slug": "article-zfe-lyon-fr",
        "titre": "ZFE Lyon : ce qui change pour votre véhicule",
        "mots_cles": ["zfe", "zone à faibles émissions", "zones à faibles émissions",
                      "crit'air", "interdiction diesel", "vignette crit"],
    },
    {
        "slug": "article-phev-recharge-fr",
        "titre": "PHEV et recharge : tout ce qu'il faut savoir",
        "mots_cles": ["phev", "hybride rechargeable", "plug-in", "taux de recharge"],
    },
    {
        "slug": "article-recharge-copro-fr",
        "titre": "Recharge en copropriété : le droit à la prise",
        "mots_cles": ["copropriété", "droit à la prise", "recharge domicile",
                      "borne copropriété", "installation borne"],
    },
    {
        "slug": "article-cee-vul-fr",
        "titre": "CEE pour VUL : financez votre borne de recharge",
        "mots_cles": ["cee", "certificats d'économie d'énergie",
                      "certificats économie énergie", "prime énergie"],
    },
    {
        "slug": "article-camion-elec-gnv-fr",
        "titre": "Camions électriques et GNV : comparatif TCO",
        "mots_cles": ["gnv", "bio-gnv", "gaz naturel", "poids-lourd",
                      "poids lourd", "camion électrique"],
    },
    {
        "slug": "article-bonus-vae-fr",
        "titre": "Bonus VAE 2024 : toutes les aides pour votre vélo électrique",
        "mots_cles": ["vae", "vélo électrique", "vélo à assistance électrique",
                      "bonus vélo", "aide vélo"],
    },
    {
        "slug": "article-deductibilite-be-be",
        "titre": "Déductibilité fiscale en Belgique pour les véhicules propres",
        "mots_cles": ["déductibilité", "belgique", "fiscalité belge",
                      "atn", "avantage toute nature"],
    },
    {
        "slug": "article-suisse-cantons-ch",
        "titre": "Aides cantonales en Suisse pour les véhicules électriques",
        "mots_cles": ["bonus cantonal", "aide cantonale", "suisse",
                      "vaud", "genève", "berne", "zürich"],
    },
    {
        "slug": "article-roulez-vert-izev-ca",
        "titre": "Programme IZEV et Roulez Vert : aides fédérales Canada",
        "mots_cles": ["izev", "roulez vert", "iVZEV", "canada",
                      "programme fédéral canada", "rabais canada"],
    },
]


# ── 1. JSON-LD ────────────────────────────────────────────────────────────────

def _build_audience(cible: str) -> dict:
    """
    Construit Schema.org/Audience pour le JSON-LD Article selon la cible.
    - particulier → PeopleAudience (grand public)
    - pro         → BusinessAudience (entreprises, PME, flottes)
    - mixte / autre → PeopleAudience générique sans restriction
    """
    cible = (cible or "mixte").lower()
    if cible == "pro":
        return {
            "@type": "BusinessAudience",
            "audienceType": "PME, artisans, gestionnaires de flottes",
            "name": "Professionnels du transport routier",
        }
    if cible == "particulier":
        return {
            "@type": "PeopleAudience",
            "audienceType": "Particuliers, foyers, automobilistes individuels",
            "name": "Grand public — particuliers",
        }
    return {
        "@type": "PeopleAudience",
        "audienceType": "Tous publics — particuliers et professionnels",
        "name": "Grand public et professionnels",
    }


def _generer_json_ld(article: dict) -> str:
    """
    Génère un bloc <script type='application/ld+json'> avec :
    - Schema.org/Article
    - Schema.org/FAQPage si l'article contient une FAQ
    """
    pays = article.get("pays_cible", "FR")
    lang_map = {"FR": "fr-FR", "BE": "fr-BE", "CH": "fr-CH", "CA": "fr-CA", "LU": "fr-LU"}
    slug = article.get("slug", "")
    url_article = f"{SITE_URL}/article/{slug}"

    published = article.get("published_at") or article.get("created_at") or datetime.now(timezone.utc).isoformat()
    modified = datetime.now(timezone.utc).isoformat()

    schemas = []

    # Schema Article
    schemas.append({
        "@context": "https://schema.org",
        "@type": "Article",
        "headline": article.get("titre_provisoire", "")[:110],
        "description": (
            article.get("meta_description")
            or article.get("resume_50mots", "")
        )[:200],
        "author": {
            "@type": "Organization",
            "name": "La Rédaction Moteurs.com",
            "url": f"{SITE_URL}/a-propos",
            "description": (
                "Équipe éditoriale spécialisée en transition énergétique des transports routiers — "
                "triangulation systématique, sources officielles, niveaux de confiance affichés."
            ),
        },
        "publisher": {
            "@type": "Organization",
            "name": "Moteurs.com",
            "url": SITE_URL,
            "logo": {
                "@type": "ImageObject",
                "url": f"{SITE_URL}/assets/img/logo.png",
            },
        },
        "about": {
            "@type": "Thing",
            "name": "Transition énergétique des transports routiers",
            "description": "TCO, ZFE, aides à l'achat de véhicules propres, fiscalité automobile France Belgique Suisse Canada",
        },
        "audience": _build_audience(article.get("cible", "mixte")),
        "datePublished": published,
        "dateModified": modified,
        "inLanguage": lang_map.get(pays, "fr-FR"),
        "url": url_article,
        "mainEntityOfPage": {
            "@type": "WebPage",
            "@id": url_article,
        },
    })

    # Schema FAQPage (si FAQ présente et >= 2 questions)
    faq = article.get("faq_json") or []
    if len(faq) >= 2:
        schemas.append({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "mainEntity": [
                {
                    "@type": "Question",
                    "name": f.get("question", ""),
                    "acceptedAnswer": {
                        "@type": "Answer",
                        "text": f.get("reponse", ""),
                    },
                }
                for f in faq
                if f.get("question") and f.get("reponse")
            ],
        })

    blocs = "\n".join(
        f'<script type="application/ld+json">\n{json.dumps(s, ensure_ascii=False, indent=2)}\n</script>'
        for s in schemas
    )
    return blocs


# ── 2. Vérification meta ──────────────────────────────────────────────────────

def _verifier_meta(article: dict) -> dict:
    """
    Vérifie que meta_title et meta_description respectent les plages SEO.
    Retourne un dict avec les éventuels avertissements (pas de correction LLM ici).
    """
    avertissements = []
    mt = article.get("meta_title", "") or ""
    md = article.get("meta_description", "") or ""

    if len(mt) < 30:
        avertissements.append(f"meta_title trop court ({len(mt)} car.) — cible : 55-60")
    elif len(mt) > 65:
        avertissements.append(f"meta_title trop long ({len(mt)} car.) — cible : 55-60")

    if len(md) < 100:
        avertissements.append(f"meta_description trop courte ({len(md)} car.) — cible : 150-160")
    elif len(md) > 170:
        avertissements.append(f"meta_description trop longue ({len(md)} car.) — cible : 150-160")

    if avertissements:
        logger.warning(
            f"[AgentSEO] Meta warnings article #{article.get('id')} : "
            + " | ".join(avertissements)
        )

    return {"avertissements": avertissements, "meta_ok": len(avertissements) == 0}


# ── 2bis. Correction meta via Claude Haiku ────────────────────────────────────

_PROMPT_CORRECTION_META = """\
Tu corriges des balises meta SEO pour un article publié sur moteurs.com (média transition énergétique des transports).

Article :
- Titre : {titre}
- Résumé : {resume}
- Pays cible : {pays}

Balises actuelles HORS PLAGE :
- meta_title : "{mt}" ({len_mt} car.)
- meta_description : "{md}" ({len_md} car.)

CONTRAINTES STRICTES (à respecter à la lettre) :
- meta_title : entre 55 et 60 caractères inclus (jamais plus de 60, jamais moins de 50)
- meta_description : entre 150 et 160 caractères inclus (jamais plus de 160, jamais moins de 140)
- Garder les mots-clés SEO principaux et le sens initial
- Pas de guillemets typographiques, pas de retours à la ligne
- Le titre doit rester accrocheur, la description doit donner envie de cliquer

Réponds UNIQUEMENT en JSON strict (aucun commentaire, aucun bloc markdown) :
{{"meta_title": "...", "meta_description": "..."}}
"""


def _corriger_meta_via_haiku(article: dict) -> dict | None:
    """
    Appelle Claude Haiku pour raccourcir meta_title et meta_description quand
    ils sont hors plage. Retourne {"meta_title": ..., "meta_description": ...}
    ou None si la correction a échoué.
    """
    mt = article.get("meta_title", "") or ""
    md = article.get("meta_description", "") or ""
    try:
        settings = get_settings()
        client = anthropic.Anthropic(api_key=settings.anthropic_api_key)

        prompt = _PROMPT_CORRECTION_META.format(
            titre=(article.get("titre_provisoire") or "")[:200],
            resume=(article.get("resume_50mots") or "")[:400],
            pays=article.get("pays_cible", "FR"),
            mt=mt,
            md=md,
            len_mt=len(mt),
            len_md=len(md),
        )

        resp = client.messages.create(
            model="claude-haiku-4-5-20251001",
            max_tokens=400,
            messages=[{"role": "user", "content": prompt}],
        )
        raw = (resp.content[0].text or "").strip()

        # Tolérer un éventuel fence ```json ... ```
        if raw.startswith("```"):
            raw = raw.strip("`")
            if raw.lower().startswith("json"):
                raw = raw[4:].strip()

        data = json.loads(raw)
        nouveau_mt = (data.get("meta_title") or "").strip()
        nouveau_md = (data.get("meta_description") or "").strip()

        # Garde-fous : tronquer doucement si Haiku déborde encore (rare)
        if len(nouveau_mt) > 60:
            nouveau_mt = nouveau_mt[:60].rstrip(" ,.;:-—")
        if len(nouveau_md) > 160:
            nouveau_md = nouveau_md[:160].rstrip(" ,.;:-—")

        # Refuser si Haiku a renvoyé vide ou des valeurs absurdes
        if not nouveau_mt or not nouveau_md:
            logger.warning(
                f"[AgentSEO] Haiku a renvoyé une valeur vide pour article #{article.get('id')} — correction ignorée"
            )
            return None

        return {"meta_title": nouveau_mt, "meta_description": nouveau_md}

    except json.JSONDecodeError as e:
        logger.warning(
            f"[AgentSEO] Réponse Haiku non JSON pour article #{article.get('id')} : {e} — correction ignorée"
        )
        return None
    except Exception as e:
        logger.error(
            f"[AgentSEO] Erreur correction Haiku article #{article.get('id')} : {e}"
        )
        return None


# ── 3. Maillage interne ───────────────────────────────────────────────────────

def _construire_cibles_maillage(articles_publies_db: list[dict]) -> list[dict]:
    """
    Fusionne les articles statiques hardcodés avec les articles publiés en base.
    Retourne une liste unifiée de cibles de maillage.
    """
    cibles = list(ARTICLES_STATIQUES)  # articles existants avant le pipeline IA

    for a in articles_publies_db:
        slug = a.get("slug", "")
        titre = a.get("titre_provisoire", "")
        resume = a.get("resume_50mots", "") or ""
        meta = a.get("meta_title", "") or ""

        # Mots-clés extraits du titre + résumé (tokens de 3+ caractères)
        texte = f"{titre} {meta} {resume}".lower()
        tokens = re.findall(r'\b[a-zàâäéèêëîïôùûüÿæœç]{3,}\b', texte)
        mots_cles = list(dict.fromkeys(tokens))[:12]  # dédupliqués, max 12

        cibles.append({
            "slug": slug,
            "titre": titre,
            "mots_cles": mots_cles,
        })

    return cibles


def _injecter_maillage(
    contenu_html: str,
    slug_article: str,
    cibles: list[dict],
    max_liens: int = 3,
) -> tuple[str, int]:
    """
    Injecte des liens internes dans les balises <p> du contenu HTML.
    - Première occurrence uniquement par cible
    - Ne touche pas les textes déjà dans <a>
    - Évite les <h1>/<h2>/<h3>
    Retourne (html_enrichi, nombre_liens_injectés).
    """
    liens_injectes = 0
    slugs_lies = {slug_article}  # ne pas se lier à soi-même

    for cible in cibles:
        if liens_injectes >= max_liens:
            break

        slug_cible = cible.get("slug", "")
        if slug_cible in slugs_lies:
            continue

        titre_affiche = cible.get("titre", slug_cible)
        url_cible = f"/article/{slug_cible}"

        for mot_cle in cible.get("mots_cles", []):
            if liens_injectes >= max_liens:
                break
            if len(mot_cle) < 4:
                continue

            # Cherche le mot-clé dans un <p> mais pas dans <a ...>...</a>
            pattern = re.compile(
                r'(<p[^>]*>(?:(?!</p>).)*?)'       # début de <p>
                r'(?<!href=")(?<!</a>)'             # pas dans un href
                r'(' + re.escape(mot_cle) + r')'   # le mot-clé
                r'(?![^<]*</a>)',                   # pas déjà dans <a>
                re.IGNORECASE | re.DOTALL,
            )

            def remplacer(m, _url=url_cible, _label=mot_cle):
                return m.group(1) + f'<a href="{_url}">{m.group(2)}</a>'

            nouveau_html, n = pattern.subn(remplacer, contenu_html, count=1)
            if n > 0:
                contenu_html = nouveau_html
                liens_injectes += 1
                slugs_lies.add(slug_cible)
                logger.debug(
                    f"[AgentSEO] Lien injecté : '{mot_cle}' → {url_cible}"
                )
                break  # un seul lien par cible, on passe à la suivante

    return contenu_html, liens_injectes


# ── Orchestration principale ──────────────────────────────────────────────────

async def enrichir_article_seo(article_id: int) -> dict:
    """
    Point d'entrée principal.
    1. Charge l'article depuis Supabase
    2. Génère le JSON-LD et vérifie les meta
    3. Injecte le maillage interne
    4. Sauvegarde le HTML enrichi en base
    Retourne un résumé des opérations.
    """
    supabase = get_supabase()

    # Charger l'article
    res = supabase.table("articles").select("*").eq("id", article_id).single().execute()
    article = res.data
    if not article:
        logger.error(f"[AgentSEO] Article #{article_id} introuvable")
        return {"succes": False, "erreur": "Article introuvable"}

    logger.info(f"[AgentSEO] Enrichissement SEO article #{article_id} : {article.get('titre_provisoire', '')[:60]}")

    # ── Étape 1 : JSON-LD ──
    json_ld = _generer_json_ld(article)

    # ── Étape 2 : vérification meta + correction Haiku si hors plage ──
    meta_rapport = _verifier_meta(article)
    meta_corrigee = None
    if not meta_rapport["meta_ok"]:
        logger.info(
            f"[AgentSEO] Tentative de correction meta via Haiku pour article #{article_id}"
        )
        meta_corrigee = _corriger_meta_via_haiku(article)
        if meta_corrigee:
            # Mettre à jour l'article local pour les étapes suivantes (JSON-LD déjà généré,
            # on régénère pour bénéficier de la nouvelle meta_description)
            article["meta_title"] = meta_corrigee["meta_title"]
            article["meta_description"] = meta_corrigee["meta_description"]
            # Re-vérification
            meta_rapport = _verifier_meta(article)
            # Re-générer le JSON-LD avec la nouvelle description
            json_ld = _generer_json_ld(article)
            logger.info(
                f"[AgentSEO] ✅ Meta corrigées via Haiku pour article #{article_id} : "
                f"title={len(meta_corrigee['meta_title'])} car., "
                f"desc={len(meta_corrigee['meta_description'])} car. — "
                f"meta_ok={meta_rapport['meta_ok']}"
            )

    # ── Étape 3 : maillage interne ──
    # Charger les articles publiés en base (hors article courant)
    res_publies = (
        supabase.table("articles")
        .select("slug, titre_provisoire, resume_50mots, meta_title")
        .eq("etat_code", "PUBLIE")
        .neq("id", article_id)
        .limit(50)
        .execute()
    )
    articles_publies_db = res_publies.data or []
    cibles = _construire_cibles_maillage(articles_publies_db)

    contenu_original = article.get("contenu_html", "")
    contenu_enrichi, nb_liens = _injecter_maillage(
        contenu_original,
        slug_article=article.get("slug", ""),
        cibles=cibles,
    )

    # ── Étape 4 : HTML final = JSON-LD + contenu avec maillage ──
    # On préfixe le contenu avec le bloc JSON-LD
    contenu_final = f"{json_ld}\n\n{contenu_enrichi}"

    # ── Étape 5 : sauvegarde en base ──
    try:
        update_payload = {
            "contenu_html": contenu_final,
            "etat_code": "PUBLIE",
            "etat_updated_at": datetime.now(timezone.utc).isoformat(),
            "published_at": datetime.now(timezone.utc).isoformat(),
            "niveau_confiance": "ÉLEVÉ" if meta_rapport["meta_ok"] else "MOYEN",
        }
        if meta_corrigee:
            update_payload["meta_title"] = meta_corrigee["meta_title"]
            update_payload["meta_description"] = meta_corrigee["meta_description"]
        supabase.table("articles").update(update_payload).eq("id", article_id).execute()

        logger.info(
            f"[AgentSEO] ✅ Article #{article_id} enrichi — "
            f"{nb_liens} lien(s) injecté(s), "
            f"meta {'OK' if meta_rapport['meta_ok'] else 'WARN'}"
        )
    except Exception as e:
        logger.error(f"[AgentSEO] Erreur sauvegarde Supabase : {e}")
        return {"succes": False, "erreur": str(e)}

    return {
        "succes": True,
        "article_id": article_id,
        "liens_internes": nb_liens,
        "meta_ok": meta_rapport["meta_ok"],
        "meta_avertissements": meta_rapport["avertissements"],
        "meta_corrigee_via_haiku": meta_corrigee is not None,
        "schemas_generes": ["Article"] + (["FAQPage"] if article.get("faq_json") else []),
    }