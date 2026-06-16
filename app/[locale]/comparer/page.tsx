import type { Metadata } from 'next'
import { useTranslations } from 'next-intl'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import ComparerTabs, { type ComparerMode } from './ComparerTabs'
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
  searchParams,
}: {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const { locale } = await params
  const sp = await searchParams
  setRequestLocale(locale)
  const raw = Array.isArray(sp?.mode) ? sp.mode[0] : sp?.mode
  const mode: ComparerMode = raw === 'mensuel' || raw === 'rentabilite' ? raw : 'motorisations'
  return <ComparerContent mode={mode} />
}

function ComparerContent({ mode }: { mode: ComparerMode }) {
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
          <ComparerTabs initialMode={mode} />
          <FaqAccordion items={faq} />
        </div>
      </section>
    </>
  )
}
