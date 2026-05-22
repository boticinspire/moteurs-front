import { useLocale, useTranslations } from 'next-intl'
import { routing } from '@/i18n/routing'

/**
 * Bandeau indiquant qu'une page n'est pas encore traduite dans la locale active.
 *
 * À placer en tête des pages dont le contenu reste en FR pour les autres langues.
 * Ne s'affiche pas pour la locale par défaut (FR).
 */
export default function TranslationBanner() {
  const locale = useLocale()
  const t = useTranslations('TranslationBanner')

  if (locale === routing.defaultLocale) return null

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
