/**
 * seo-utils.ts — Helpers SEO partagés pour Next.js App Router
 * Centralise la génération de canonical + hreflang (alternates.languages)
 * pour les pages multilingues (next-intl, 6 locales).
 */
import { routing } from '@/i18n/routing'

const BASE = 'https://moteurs.com'

/**
 * Retourne l'objet `alternates` Next.js-ready pour une route et une locale donnée.
 * - canonical → URL FR (sans préfixe) si locale par défaut, sinon /{locale}/path
 * - languages → toutes les 6 locales + x-default (toujours FR)
 *
 * Usage dans generateMetadata :
 *   alternates: buildAlternates(locale, '/comparer'),
 */
export function buildAlternates(locale: string, path: string) {
  const languages: Record<string, string> = {}
  for (const l of routing.locales) {
    languages[l] = l === routing.defaultLocale
      ? `${BASE}${path}`
      : `${BASE}/${l}${path}`
  }
  languages['x-default'] = `${BASE}${path}`

  return {
    canonical: locale === routing.defaultLocale
      ? `${BASE}${path}`
      : `${BASE}/${locale}${path}`,
    languages,
  }
}
