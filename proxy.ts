import createMiddleware from 'next-intl/middleware'
import { routing } from './i18n/routing'

/**
 * Proxy Next.js 16 - detection et persistance de la locale via next-intl.
 *
 *   - Prefixe URL > cookie NEXT_LOCALE > Accept-Language
 *   - Cookie 1 an, SameSite=Lax (configure dans i18n/routing.ts)
 *   - Mode "as-needed" : la locale par defaut (fr) n'a pas de prefixe
 *
 * Le matcher exclut :
 *   - /api/*    (routes API neutres)
 *   - /_next/*  (assets Next.js)
 *   - /_vercel/*
 *   - les fichiers avec extension (favicon, robots.txt, sitemap.xml...)
 *
 * NB : Next.js 16 a renomme `middleware.ts` en `proxy.ts`. La fonction
 * exportee par defaut est appelee par Next a chaque requete routee.
 */
export default createMiddleware(routing)

export const config = {
  matcher: [
    '/((?!api|_next|_vercel|.*\\..*).*)',
  ],
}
