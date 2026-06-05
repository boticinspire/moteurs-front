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
  const t = await getTranslations({ locale, namespace: 'CGU' })
  return {
    title: t('title'),
    description: t('meta_description'),
    robots: { index: false },
  }
}

export default async function CGUPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)
  return <CGUContent />
}

function CGUContent() {
  const t = useTranslations('CGU')

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

            <h2>{t('s1_title')}</h2>
            <p>{t('s1_body')}</p>

            <h2>{t('s2_title')}</h2>
            <p>{t('s2_body')}</p>

            <h2>{t('s3_title')}</h2>
            <p>{t('s3_body')}</p>

            <h2>{t('s4_title')}</h2>
            <p>{t('s4_body')}</p>

            <h2>{t('s5_title')}</h2>
            <p>{t('s5_body')}</p>
            <ul>
              <li>{t('s5_li1')}</li>
              <li>{t('s5_li2')}</li>
              <li>{t('s5_li3')}</li>
            </ul>

            <h2>{t('s6_title')}</h2>
            <p>{t('s6_body')}</p>

            <h2>{t('s7_title')}</h2>
            <p>{t('s7_body')}</p>
            <ul>
              <li>{t('s7_li1')}</li>
              <li>{t('s7_li2')}</li>
              <li>{t('s7_li3')}</li>
            </ul>
            <p>{t('s7_rights')}</p>

            <h2>{t('s8_title')}</h2>
            <p>{t('s8_body')}</p>

            <h2>{t('s9_title')}</h2>
            <p>{t('s9_body')}</p>

            <h2>{t('s10_title')}</h2>
            <p>{t('s10_body')}</p>

            <h2>{t('s11_title')}</h2>
            <p>{t('s11_body')}</p>

            <h2>{t('s12_title')}</h2>
            <p>{t('s12_body')}</p>

            <p style={{ marginTop: '48px', color: 'var(--color-text-soft)', fontSize: '0.9rem' }}>
              {t('footer_line')}
            </p>

          </div>
        </div>
      </section>
    </>
  )
}
