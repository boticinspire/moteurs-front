import { createNavigation } from 'next-intl/navigation'
import { routing } from './routing'

/**
 * Wrappers Link / useRouter / usePathname / redirect / getPathname
 * qui ajoutent automatiquement le préfixe de locale courante.
 *
 * À utiliser à la place des imports équivalents depuis `next/link`
 * ou `next/navigation` dans les composants côté client/serveur.
 */
export const { Link, useRouter, usePathname, redirect, getPathname } =
  createNavigation(routing)
