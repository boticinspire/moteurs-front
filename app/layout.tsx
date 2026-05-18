import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { Inter } from 'next/font/google'
import './globals.css'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import CookieBanner from '@/components/CookieBanner'

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

export default function RootLayout({
  children,
}: {
  children: ReactNode
}) {
  return (
    <html lang="fr" className={inter.variable}>
      <body>
        <Header />
        {children}
        <Footer />
        <CookieBanner />
      </body>
    </html>
  )
}
