import { defineRouting } from 'next-intl/routing'

/**
 * Configuration de routing i18n pour Moteurs.com.
 *
 * - Langue par défaut : FR (URL nue : /comparer, /simulateur…)
 * - Autres langues : préfixe (/en/comparer, /de/simulateur…)
 * - Mode "as-needed" : pas de redirection forcée vers /fr/…
 * - Cookie de persistance géré automatiquement par le middleware next-intl
 *   (cookie NEXT_LOCALE, durée 1 an).
 */
export const routing = defineRouting({
  locales: ['fr', 'en', 'nl', 'de', 'es', 'it'],
  defaultLocale: 'fr',
  localePrefix: 'as-needed',
  localeCookie: {
    name: 'NEXT_LOCALE',
    maxAge: 60 * 60 * 24 * 365, // 1 an
    sameSite: 'lax',
  },
})

export type Locale = (typeof routing.locales)[number]

export const LOCALE_LABELS: Record<Locale, { native: string; flag: string; english: string }> = {
  fr: { native: 'Français', flag: '🇫🇷', english: 'French' },
  en: { native: 'English', flag: '🇬🇧', english: 'English' },
  nl: { native: 'Nederlands', flag: '🇳🇱', english: 'Dutch' },
  de: { native: 'Deutsch', flag: '🇩🇪', english: 'German' },
  es: { native: 'Español', flag: '🇪🇸', english: 'Spanish' },
  it: { native: 'Italiano', flag: '🇮🇹', english: 'Italian' },
}
