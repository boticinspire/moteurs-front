import httpx
import feedparser
from bs4 import BeautifulSoup
from typing import Optional
import logging

logger = logging.getLogger(__name__)

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (compatible; MoteursBot/1.0; "
        "+https://moteurs.com/bot)"
    )
}

# Types MIME indiquant un flux RSS/Atom
RSS_CONTENT_TYPES = {
    "application/rss+xml",
    "application/atom+xml",
    "text/xml",
    "application/xml",
    "application/rdf+xml",
}

# Fragments d'URL indiquant un flux
RSS_URL_PATTERNS = ("/feed", "/rss", "/atom", ".rss", ".xml", ".rdf")


def _is_feed(url: str, content_type: str) -> bool:
    """Détecte si une URL/réponse correspond à un flux RSS ou Atom."""
    if any(p in url.lower() for p in RSS_URL_PATTERNS):
        return True
    ct = content_type.lower().split(";")[0].strip()
    return ct in RSS_CONTENT_TYPES


async def _fetch(url: str, timeout: int = 20) -> tuple[Optional[str], str]:
    """Récupère le contenu brut + content-type d'une URL."""
    try:
        async with httpx.AsyncClient(
            headers=HEADERS, timeout=timeout, follow_redirects=True
        ) as client:
            r = await client.get(url)
            r.raise_for_status()
            return r.text, r.headers.get("content-type", "")
    except httpx.HTTPStatusError as e:
        logger.warning(f"[Scraper] HTTP {e.response.status_code} sur {url}")
        return None, ""
    except httpx.HTTPError as e:
        logger.warning(f"[Scraper] Erreur réseau sur {url} : {e}")
        return None, ""
    except Exception as e:
        logger.error(f"[Scraper] Erreur inattendue sur {url} : {e}")
        return None, ""


def _parse_feed(content: str, url: str) -> list[dict]:
    """
    Parse un flux RSS/Atom et retourne jusqu'à 5 items récents.
    Chaque item contient {titre, contenu_brut, url_origine}.
    """
    feed = feedparser.parse(content)

    if feed.bozo and not feed.entries:
        logger.warning(f"[Scraper] Flux non parsable (bozo) : {url}")
        return []

    items = []
    for entry in feed.entries[:5]:
        titre = entry.get("title", "Sans titre")
        lien = entry.get("link", url)

        # Contenu : content > summary > description
        raw_html = ""
        if hasattr(entry, "content") and entry.content:
            raw_html = entry.content[0].get("value", "")
        elif "summary" in entry:
            raw_html = entry.get("summary", "")
        elif "description" in entry:
            raw_html = entry.get("description", "")

        # Nettoyer le HTML embarqué dans le flux
        if raw_html:
            soup = BeautifulSoup(raw_html, "lxml")
            contenu = soup.get_text(separator="\n", strip=True)
        else:
            contenu = ""

        if not contenu.strip():
            contenu = titre  # fallback minimal

        items.append({
            "titre": titre[:255],
            "contenu_brut": contenu[:10000],
            "url_origine": lien,
        })

    logger.info(f"[Scraper] RSS/Atom : {len(items)} items depuis {url}")
    return items


def _extract_html(html: str, url: str) -> dict:
    """Extrait titre + contenu principal d'une page HTML."""
    soup = BeautifulSoup(html, "lxml")

    for tag in soup(["script", "style", "nav", "footer", "header", "aside", "form"]):
        tag.decompose()

    titre = soup.title.string.strip() if soup.title and soup.title.string else "Sans titre"
    main = soup.find("main") or soup.find("article") or soup.body
    contenu_brut = main.get_text(separator="\n", strip=True) if main else ""

    return {
        "titre": titre[:255],
        "contenu_brut": contenu_brut[:10000],
        "url_origine": url,
    }


async def scrape_source(url: str) -> Optional[list[dict]]:
    """
    Point d'entrée principal.
    - URL RSS/Atom → retourne jusqu'à 5 items
    - URL HTML      → retourne 1 item (la page)
    Retourne None si la source est inaccessible.
    """
    content, content_type = await _fetch(url)
    if content is None:
        return None

    if _is_feed(url, content_type):
        items = _parse_feed(content, url)
        return items if items else None
    else:
        item = _extract_html(content, url)
        return [item]
