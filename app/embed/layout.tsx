import type { Metadata, Viewport } from 'next'
import type { ReactNode } from 'react'
import localFont from 'next/font/local'
import '../globals.css'

// Inter auto-hébergée (@fontsource-variable/inter) — voir app/[locale]/layout.tsx
const inter = localFont({
  src: '../../node_modules/@fontsource-variable/inter/files/inter-latin-wght-normal.woff2',
  variable: '--font-inter',
  display: 'swap',
  weight: '100 900',
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
