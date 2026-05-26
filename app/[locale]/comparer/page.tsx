import type { Metadata } from 'next'
import { useTranslations } from 'next-intl'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import ComparateurTCO from './ComparateurTCO'
import FaqAccordion from '@/components/FaqAccordion'
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
  const t = await getTranslations({ locale, namespace: 'Comparer' })
  return {
    alternates: buildAlternates(locale, '/comparer'),
    title: t('meta_title'),
    description: t('meta_desc'),
  }
}

export default async function ComparerPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)
  return <ComparerContent />
}

function ComparerContent() {
  const t = useTranslations('Comparer')

  const faq = [
    { question: t('faq_q1'), answer: t('faq_a1') },
    { question: t('faq_q2'), answer: t('faq_a2') },
    { question: t('faq_q3'), answer: t('faq_a3') },
    { question: t('faq_q4'), answer: t('faq_a4') },
    { question: t('faq_q5'), answer: t('faq_a5') },
    { question: t('faq_q6'), answer: t('faq_a6') },
  ]

  return (
    <>
      <section className="page-hero">
        <div className="container">
          <h1>{t('h1')}</h1>
          <p>{t('lead')}</p>
        </div>
      </section>

      <section style={{ padding: '32px 0 80px' }}>
        <div className="container">
          <ComparateurTCO />
          <FaqAccordion items={faq} />
        </div>
      </section>
    </>
  )
}
