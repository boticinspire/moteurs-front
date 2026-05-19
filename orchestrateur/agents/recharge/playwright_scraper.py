"""
Scraper Playwright — Agent Recharge
Utilisé en fallback quand httpx retourne une page vide ou trop courte
(sites React/Vue/Angular qui ne rendent pas de contenu côté serveur).

Anti-détection :
  - User-Agent desktop Chrome récent
  - Locale fr-FR
  - Blocage images/fonts/vidéos (accélère le chargement)
  - Attente networkidle + délai rendu JS
"""

import logging
from playwright.async_api import async_playwright

logger = logging.getLogger(__name__)

# Taille minimale d'un HTML utile (pages vides / loading spinners < 3 000 chars)
HTML_MIN_LENGTH = 3000


async def scrape_with_playwright(url: str, timeout_ms: int = 25000) -> str | None:
    """
    Scrape une page JS-rendue avec Playwright/Chromium headless.
    Retourne le HTML complet après rendu, ou None en cas d'échec.
    """
    try:
        async with async_playwright() as p:
            browser = await p.chromium.launch(
                headless=True,
                args=[
                    "--no-sandbox",
                    "--disable-setuid-sandbox",
                    "--disable-dev-shm-usage",
                    "--disable-accelerated-2d-canvas",
                    "--no-first-run",
                    "--no-zygote",
                    "--single-process",
                    "--disable-gpu",
                    "--disable-background-networking",
                    "--disable-default-apps",
                    "--disable-extensions",
                    "--disable-sync",
                    "--disable-translate",
                ],
            )

            context = await browser.new_context(
                user_agent=(
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                    "AppleWebKit/537.36 (KHTML, like Gecko) "
                    "Chrome/124.0.0.0 Safari/537.36"
                ),
                locale="fr-FR",
                extra_http_headers={
                    "Accept-Language": "fr-FR,fr;q=0.9,en;q=0.8",
                    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
                },
                viewport={"width": 1280, "height": 800},
            )

            page = await context.new_page()

            # Bloquer les ressources inutiles pour accélérer
            await page.route(
                "**/*.{png,jpg,jpeg,gif,svg,ico,woff,woff2,ttf,eot,mp4,webm,ogg}",
                lambda route: route.abort(),
            )
            # Bloquer analytics et pubs
            await page.route(
                "**/{analytics,gtm,googletagmanager,facebook,hotjar,intercom}*",
                lambda route: route.abort(),
            )

            logger.info(f"[Playwright] Navigation vers {url}")
            await page.goto(url, wait_until="networkidle", timeout=timeout_ms)

            # Délai supplémentaire pour les SPA qui chargent les tarifs en async
            await page.wait_for_timeout(2500)

            html = await page.content()
            await browser.close()

            if len(html) < HTML_MIN_LENGTH:
                logger.warning(
                    f"[Playwright] HTML trop court ({len(html)} chars) — "
                    f"protection anti-bot probable sur {url}"
                )
                return None

            logger.info(f"[Playwright] Succès {url} — {len(html):,} chars")
            return html

    except Exception as e:
        logger.error(f"[Playwright] Erreur sur {url} : {e}")
        return None


def html_est_probablement_vide(html: str | None) -> bool:
    """
    Retourne True si le HTML récupéré par httpx est probablement une page
    non-rendue (taille trop petite ou contenu JS-only sans données tarifaires).
    """
    if not html or len(html) < HTML_MIN_LENGTH:
        return True
    # Indices qu'on a récupéré un shell React/Vue sans contenu
    suspects = [
        "<div id=\"root\"></div>",
        "<div id=\"app\"></div>",
        "window.__NUXT__",
        "You need to enable JavaScript",
        "Please enable JavaScript",
        "enable cookies",
        "__NEXT_DATA__",   # Next.js SSR vide = pas de données utiles
    ]
    html_lower = html.lower()
    return any(s.lower() in html_lower for s in suspects)
