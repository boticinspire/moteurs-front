/**
 * Moteurs.com — /installateurs
 * Annuaire + formulaire de mise en relation avec des installateurs certifiés
 * (bornes IRVE, batteries, panneaux solaires, audit)
 *
 * Server component : metadata + JSON-LD
 * Client component : formulaire lead + annuaire interactif
 */

import type { Metadata } from 'next'
import { setRequestLocale } from 'next-intl/server'
import { routing } from '@/i18n/routing'
import InstallateursContent from './InstallateursContent'

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const isDefault = locale === routing.defaultLocale
  const canonical = isDefault
    ? 'https://moteurs.com/installateurs'
    : `https://moteurs.com/${locale}/installateurs`

  return {
    title: 'Trouver un installateur certifié (IRVE, panneaux, batterie) — Moteurs.com',
    description:
      'Annuaire d\'installateurs certifiés pour borne de recharge (IRVE, RGE), panneaux solaires (QualiPV), batterie de stockage et audit énergétique. Devis gratuit en 24h en France, Belgique et Suisse.',
    openGraph: {
      title: 'Installateurs certifiés IRVE & solaire — Moteurs.com',
      description:
        'Trouvez un pro certifié près de chez vous et obtenez un devis gratuit pour votre borne de recharge ou installation solaire.',
      type: 'website',
    },
    alternates: {
      canonical,
    },
  }
}

export default async function InstallateursPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        '@id': 'https://moteurs.com/installateurs',
        url: 'https://moteurs.com/installateurs',
        name: 'Trouver un installateur certifié IRVE, panneaux, batterie',
        description:
          'Annuaire d\'installateurs certifiés (IRVE, QualiPV, RGE, Qualifelec) pour borne de recharge, panneaux solaires et batterie.',
        inLanguage: locale,
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: 'Accueil',
            item: 'https://moteurs.com/',
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: 'Installateurs certifiés',
            item: 'https://moteurs.com/installateurs',
          },
        ],
      },
    ],
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <InstallateursContent />
    </>
  )
}
