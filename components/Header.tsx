'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function Header() {
  const path = usePathname()

  const navLinks = [
    { href: '/',            label: 'Accueil' },
    { href: '/b2b',         label: 'PME & Artisans' },
    { href: '/particulier', label: 'Particuliers' },
    { href: '/articles',    label: 'Décryptages' },
    { href: '/simulateur',  label: 'Simulateur TCO' },
    { href: '/comparer',    label: 'Comparateur' },
    { href: '/tco',         label: 'TCO par segment' },
  ]

  return (
    <header className="site-header">
      <div className="container">
        {/* Logo — pas d'espace entre les éléments inline */}
        <Link href="/" className="logo"><span className="logo-dot" /><span>Moteurs<span style={{ color: 'var(--color-primary)' }}>.com</span></span></Link>

        <nav className="main-nav">
          {navLinks.map(({ href, label }) => (
            <Link key={href} href={href} className={path === href ? 'active' : ''}>
              {label}
            </Link>
          ))}
        </nav>

        <div className="header-cta">
          <Link href="/espace-membres" className="btn btn-secondary btn-sm" style={{ fontWeight: 600 }}>
            👤 Mon espace
          </Link>
          <Link href="/simulateur" className="btn btn-primary btn-sm">
            Simulateur
          </Link>
        </div>
      </div>
    </header>
  )
}
