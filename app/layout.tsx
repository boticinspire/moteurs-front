import type { Metadata } from 'next'
import './globals.css'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

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
  children: React.ReactNode
}) {
  return (
    <html lang="fr">
      <body>
        <Header />
        {children}
        <Footer />
      </body>
    </html>
  )
}
