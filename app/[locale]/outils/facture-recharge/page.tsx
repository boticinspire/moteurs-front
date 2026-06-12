import { getStaticMetadata } from '@/lib/seo-keywords'
import { setRequestLocale } from 'next-intl/server'
import { routing } from '@/i18n/routing'
import SimulateurFactureContent from './SimulateurFactureContent'

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }))
}

export const metadata = getStaticMetadata('/outils/facture-recharge')

export default async function FactureRechargePage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)
  return (
    <main style={{ paddingTop: 8 }}>
      <SimulateurFactureContent />
    </main>
  )
}
