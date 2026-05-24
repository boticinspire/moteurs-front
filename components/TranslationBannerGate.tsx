'use client'

import { useLocale, useTranslations } from 'next-intl'
import { usePathname } from '@/i18n/navigation'
import { routing } from '@/i18n/routing'

/**
 * Liste des routes dont le contenu est *déjà traduit* dans toutes les locales.
 * Le bandeau "page non traduite" ne s'affiche PAS sur ces routes.
 *
 * Pour /simulateur : la page elle-même est traduite (hero/FAQ/disclaimer)
 * mais le formulaire interactif reste en FR — un mini-bandeau local
 * s'affiche depuis la page sur les non-FR.
 */
const TRANSLATED_ROUTES = new Set<string>([
  '/',
  '/a-propos',
  '/mentions-legales',
  '/comparer',
  '/comparer-trajet',
  '/simulateur',
  '/recharge-electrique',
  '/vacances-voiture',
  '/depannage',
  '/cout-voiture',
  '/documents-auto',
  '/assistant-depannage',
  '/assistant-depannage/voyants',
])

/**
 * Préfixes de routes dont la nature dynamique rend la traduction
 * UI non pertinente (admin, espace membre privé).
 */
const SUPPRESS_BANNER_PREFIXES = ['/admin', '/espace-membres', '/desinscription']

export default function TranslationBannerGate() {
  const locale = useLocale()
  const path = usePathname()
  const t = useTranslations('TranslationBanner')

  if (locale === routing.defaultLocale) return null
  if (TRANSLATED_ROUTES.has(path)) return null
  if (SUPPRESS_BANNER_PREFIXES.some((p) => path.startsWith(p))) return null

  return (
    <div
      role="status"
      style={{
        background: 'rgba(255, 199, 0, 0.10)',
        borderBottom: '1px solid rgba(255, 199, 0, 0.25)',
        padding: '10px 16px',
        textAlign: 'center',
        fontSize: '0.88rem',
        color: 'var(--color-text)',
      }}
    >
      <span aria-hidden="true" style={{ marginRight: 8 }}>ℹ️</span>
      <span>{t('message')}</span>
    </div>
  )
}
