import type { Metadata } from 'next'
import { setRequestLocale } from 'next-intl/server'
import { routing } from '@/i18n/routing'
import { buildAlternates } from '@/lib/seo-utils'
import ConvertisseurContent from './ConvertisseurContent'

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
    title: 'Convertisseur technique auto — kW/ch, Nm/lb-ft, Autonomie batterie | Moteurs.com',
    description: 'Convertisseur technique gratuit : kW ↔ ch (CV), Nm ↔ lb·ft, autonomie batterie selon poids et consommation, malus CO₂ France 2026.',
    alternates: buildAlternates(locale, '/outils/convertisseur'),
  }
}

export default async function ConvertisseurPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)
  return <ConvertisseurContent />
}
