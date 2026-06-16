import { getStaticMetadata } from '@/lib/seo-keywords'
import { setRequestLocale } from 'next-intl/server'
import { routing } from '@/i18n/routing'
import { getVehiculesEV } from '@/lib/vehicules'
import CatalogueElectriques from './CatalogueElectriques'

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }))
}

export const metadata = getStaticMetadata('/outils/catalogue-electriques')
export const revalidate = 3600

export default async function CatalogueElectriquesPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)

  const vehicles = await getVehiculesEV()
  // Jeu de démarrage tant que le dataset complet (~1149) n'a pas été ingéré.
  const isSeed = vehicles.length < 300

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Catalogue des voitures électriques',
    description: 'Comparez les voitures électriques : batterie, autonomie WLTP, consommation, charge rapide.',
    url: 'https://moteurs.com/outils/catalogue-electriques',
    isBasedOn: 'https://open-ev-data.github.io',
    license: 'https://cdla.dev/permissive-2-0/',
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <CatalogueElectriques vehicles={vehicles} isSeed={isSeed} version={null} count={vehicles.length} />
    </>
  )
}
