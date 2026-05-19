import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { Inter } from 'next/font/google'
import './globals.css'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import CookieBanner from '@/components/CookieBanner'
import Providers from '@/components/Providers'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: 'Calculateur TCO & Coût de Trajet par Motorisation | Moteurs.com — France, Belgique, Suisse',
    template: '%s — Moteurs.com',
  },
  description:
    'Comparez le coût total (TCO) et le coût de trajet selon votre motorisation : diesel, essence, électrique, hybride. Péages inclus, aides 2026, ZFE — pour particuliers, PME et flottes en France, Belgique, Suisse et Canada.',
  metadataBase: new URL('https://moteurs.com'),
}

const orgJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Moteurs.com',
  url: 'https://moteurs.com',
  logo: 'https://moteurs.com/logo.png',
  description:
    'Média éditorial de référence sur la transition énergétique des transports routiers. Calculateurs TCO, comparateur de motorisations, décryptage des aides 2026 pour PME, artisans, flottes et particuliers.',
  knowsAbout: [
    'Transition énergétique des transports routiers',
    'Coût Total de Possession (TCO) automobile',
    'Véhicules électriques et hybrides',
    'Zones à Faibles Émissions (ZFE)',
    "Aides à l'achat de véhicules propres 2026",
    'Bonus écologique France',
    'Déductibilité fiscale véhicules électriques Belgique',
    'Subventions cantonales véhicules électriques Suisse',
    'Programme iZEV Canada',
    'Recharge électrique infrastructure',
    'Calculateur coût trajet motorisation',
  ],
  areaServed: [
    { '@type': 'Country', name: 'France' },
    { '@type': 'Country', name: 'Belgique' },
    { '@type': 'Country', name: 'Suisse' },
    { '@type': 'Country', name: 'Canada' },
  ],
  sameAs: [],
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fr" className={inter.variable}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }}
        />
      </head>
      <body>
        <Providers>
          <Header />
          {children}
          <Footer />
          <CookieBanner />
        </Providers>
      </body>
    </html>
  )
}
