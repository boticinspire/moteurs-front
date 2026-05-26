import type { ReactNode } from 'react'

/**
 * Layout racine pass-through.
 *
 * Le vrai layout HTML (<html>/<body>) est dans app/[locale]/layout.tsx
 * pour que la balise lang={locale} reflète la langue de la page.
 *
 * Avec Next.js 16, ce pattern est officiellement supporté quand
 * un segment imbriqué (ici [locale]) fournit <html> et <body>.
 */
export default function RootLayout({ children }: { children: ReactNode }) {
  return children
}
