import { getStaticMetadata } from '@/lib/seo-keywords'
import { setRequestLocale } from 'next-intl/server'
import { routing } from '@/i18n/routing'
import CarnetEntretien from './CarnetEntretien'

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }))
}

export const metadata = getStaticMetadata('/outils/carnet-entretien')

export default async function CarnetEntretienPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)
  return <CarnetEntretien />
}
