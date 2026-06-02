import type { ReactNode } from 'react'
import Providers from '@/components/Providers'

/**
 * Layout racine.
 *
 * UserContextProvider (auth Supabase) est ici — au-dessus du segment [locale] —
 * pour qu'il NE se remonte PAS lors d'un changement de langue.
 * L'état auth survit ainsi aux navigations inter-locales.
 *
 * Le vrai layout HTML (<html>/<body>) est dans app/[locale]/layout.tsx
 * pour que la balise lang={locale} reflète la langue de la page.
 */
export default function RootLayout({ children }: { children: ReactNode }) {
  return <Providers>{children}</Providers>
}
