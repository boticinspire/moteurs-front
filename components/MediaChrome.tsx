'use client'

import type { ReactNode } from 'react'
import { usePathname } from '@/i18n/navigation'

/**
 * Affiche le header/footer du média Moteurs.com partout SAUF sur la page
 * d'accueil (`/`), qui est la vitrine produits (gabarits de soupape) et
 * embarque son propre header/footer (VitrineHeader / VitrineFooter).
 *
 * `usePathname` de next-intl renvoie le chemin sans préfixe de locale :
 * `/`, `/en`, `/de` → `/`.
 */
export default function MediaChrome({ children }: { children: ReactNode }) {
  const path = usePathname()
  if (path === '/') return null
  return <>{children}</>
}
