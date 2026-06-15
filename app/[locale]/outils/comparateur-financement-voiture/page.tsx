import { getStaticMetadata } from '@/lib/seo-keywords'
import { setRequestLocale } from 'next-intl/server'
import { routing } from '@/i18n/routing'
import ComparateurFinancement from './ComparateurFinancement'

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }))
}

export const metadata = getStaticMetadata('/outils/comparateur-financement-voiture')

export default async function ComparateurFinancementPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)
  return <ComparateurFinancement />
}
