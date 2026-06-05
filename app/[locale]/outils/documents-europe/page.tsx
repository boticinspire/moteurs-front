import type { Metadata } from 'next'
import { setRequestLocale } from 'next-intl/server'
import { routing } from '@/i18n/routing'
import { buildAlternates } from '@/lib/seo-utils'
import DocumentsEuropeContent from './DocumentsEuropeContent'

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  return {
    title: 'Documents & équipements obligatoires en Europe 2026 — 22 pays | Moteurs.com',
    description: 'Tableau complet des documents et équipements à emporter dans 22 pays européens : permis, carte grise, vignettes, gilet, triangle, extincteur. Imprimable A4.',
    alternates: buildAlternates(locale, '/outils/documents-europe'),
  }
}

export default async function DocumentsEuropePage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)
  return <DocumentsEuropeContent />
}
