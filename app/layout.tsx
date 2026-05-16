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
    default: 'Moteurs.com — Transition énergétique des transports',
    template: '%s — Moteurs.com',
  },
  description:
    'Décryptage de la transition énergétique des transports routiers : TCO, ZFE, aides 2026 pour PME, artisans, flottes et particuliers en France, Belgique, Suisse et Canada.',
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
