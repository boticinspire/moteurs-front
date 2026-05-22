import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
export default function NotFound() {
  const t = useTranslations('NotFound')
  return (
    <div style={{ textAlign: 'center', padding: '80px 24px' }}>
      <h1 style={{ fontSize: '1.4rem', marginBottom: 12 }}>{t('title')}</h1>
      <p style={{ color: 'var(--color-text-soft)', marginBottom: 24 }}>
        {t('description')}
      </p>
      <Link href="/" className="btn btn-primary">
        {t('back_home')} →
      </Link>
    </div>
  )
}
