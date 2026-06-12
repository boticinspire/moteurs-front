import { useTranslations } from 'next-intl'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import type { Metadata } from 'next'
import { routing } from '@/i18n/routing'
import { buildAlternates } from '@/lib/seo-utils'

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'Legal' })
  return {
    title: t('title'),
    description: t('section_data_body').slice(0, 160),
    alternates: buildAlternates(locale, '/mentions-legales'),
  }
}

export default async function MentionsLegalesPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)
  return <LegalContent />
}

function LegalContent() {
  const t = useTranslations('Legal')

  return (
    <>
      <section className="page-hero">
        <div className="container">
          <h1>{t('title')}</h1>
          <p>{t('last_updated')}</p>
        </div>
      </section>
      <section style={{ padding: '56px 0' }}>
        <div className="container">
          <div className="article-content">
            <h2>{t('section_editor_title')}</h2>
            <p>{t('section_editor_body')}</p>

            <h2>{t('section_hosting_title')}</h2>
            <p>{t('section_hosting_body')}</p>

            <h2>{t('section_data_title')}</h2>
            <p>{t('section_data_body')}</p>

            <h2>{t('section_cookies_title')}</h2>
            <p>{t('section_cookies_body')}</p>

            <h2>{t('section_ip_title')}</h2>
            <p>{t('section_ip_body')}</p>
          </div>
        </div>
      </section>
    </>
  )
}
