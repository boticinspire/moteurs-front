import { useTranslations } from 'next-intl'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import type { Metadata } from 'next'
import { routing } from '@/i18n/routing'

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'About' })
  return {
    title: t('title'),
    description: t('lead'),
  }
}

export default async function AProposPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)
  return <AboutContent />
}

function AboutContent() {
  const t = useTranslations('About')

  const aboutJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'AboutPage',
    name: t('title'),
    url: 'https://moteurs.com/a-propos',
    description: t('lead'),
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(aboutJsonLd) }} />
      <section className="page-hero">
        <div className="container">
          <h1>{t('title')}</h1>
          <p>{t('lead')}</p>
        </div>
      </section>
      <section style={{ padding: '56px 0' }}>
        <div className="container">
          <div className="article-content">
            <h2>{t('section_mission_title')}</h2>
            <p>{t('section_mission_body')}</p>

            <h2>{t('section_method_title')}</h2>
            <p>{t('section_method_body')}</p>

            <h2>{t('section_team_title')}</h2>
            <p>{t('section_team_body')}</p>

            <h2>{t('section_countries_title')}</h2>
            <p>{t('section_countries_body')}</p>

            <h2>{t('section_contact_title')}</h2>
            <p>
              {t('section_contact_body')}{' '}
              <a href={`mailto:${t('section_contact_email')}`}>{t('section_contact_email')}</a>.
            </p>
          </div>
        </div>
      </section>
    </>
  )
}
