import type { Metadata, Viewport } from 'next'
import type { ReactNode } from 'react'
import { Inter } from 'next/font/google'
import '../globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

/**
 * Layout des pages embed (iframe partenaires).
 *
 *  - Hors arborescence [locale] : pas de Header/Footer Moteurs.com
 *  - Pas de NextIntlClientProvider : la langue est passee par query string
 *  - Robots non-indexable (les pages embed ne doivent pas se ranker)
 *  - <html lang> reste 'fr' par defaut, surcharge cote page si besoin
 */
export const metadata: Metadata = {
  robots: { index: false, follow: false },
  title: 'Moteurs.com — Outil embeddable',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
}

export default function EmbedLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fr" className={inter.variable}>
      <body style={{ margin: 0, padding: 0, background: 'transparent' }}>
        {children}
      </body>
    </html>
  )
}
