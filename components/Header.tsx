'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const navLinks = [
  { href: '/',            label: 'Accueil' },
  { href: '/articles',    label: 'Décryptages' },
  { href: '/b2b',         label: 'PME & Artisans' },
  { href: '/particulier', label: 'Particuliers' },
  { href: '/simulateur',  label: 'Simulateur' },
  { href: '/comparer',    label: 'Comparateur' },
  { href: '/tco',         label: 'TCO' },
  { href: '/outils',      label: 'Outils ⚡' },
]

export default function Header() {
  const path = usePathname()
  const [open, setOpen] = useState(false)

  // Ferme le menu si la route change
  useEffect(() => { setOpen(false) }, [path])

  // Empêche le scroll du body quand le menu est ouvert
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  return (
    <>
      {/* ── Styles responsives header ── */}
      <style>{`
        .burger-btn { display: none !important; }
        @media (max-width: 900px) {
          .main-nav { display: none !important; }
          .header-cta .btn-secondary { display: none !important; }
          .burger-btn { display: flex !important; align-items: center; justify-content: center;
            width: 40px; height: 40px; background: none;
            border: 1.5px solid var(--color-border); border-radius: 8px;
            cursor: pointer; font-size: 1.25rem; color: var(--color-text); transition: all .15s; }
          .burger-btn:hover { border-color: var(--color-primary); color: var(--color-primary); }
        }
        .mobile-overlay {
          position: fixed; inset: 0; z-index: 200;
          background: var(--color-bg-dark);
          display: flex; flex-direction: column;
          padding: 0;
          overflow-y: auto;
          animation: slideDown .2s ease;
        }
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .mobile-overlay-header {
          display: flex; align-items: center; justify-content: space-between;
          padding: 16px 20px;
          border-bottom: 1px solid rgba(255,255,255,0.08);
          height: var(--header-h);
          flex-shrink: 0;
        }
        .mobile-nav-links { padding: 12px 12px 24px; display: flex; flex-direction: column; gap: 4px; }
        .mobile-nav-link {
          display: block; padding: 13px 16px; border-radius: 10px;
          color: rgba(255,255,255,0.8); font-size: 1.05rem; font-weight: 500;
          text-decoration: none; transition: all .15s;
        }
        .mobile-nav-link:hover, .mobile-nav-link.active {
          background: rgba(255,255,255,0.08); color: var(--color-primary);
        }
        .mobile-nav-link.active { font-weight: 700; }
        .mobile-nav-cta { padding: 16px 12px; border-top: 1px solid rgba(255,255,255,0.08); margin-top: 8px; display: flex; flex-direction: column; gap: 10px; }
      `}</style>

      {/* ── Header ── */}
      <header className="site-header">
        <div className="container">
          <Link href="/" className="logo">
            <span className="logo-dot" />
            <span>Moteurs<span style={{ color: 'var(--color-primary)' }}>.com</span></span>
          </Link>

          {/* Nav desktop */}
          <nav className="main-nav">
            {navLinks.map(({ href, label }) => (
              <Link key={href} href={href} className={path === href ? 'active' : ''}>
                {label}
              </Link>
            ))}
          </nav>

          {/* CTAs desktop */}
          <div className="header-cta">
            <Link href="/espace-membres" className="btn btn-secondary btn-sm" style={{ fontWeight: 600 }}>
              👤 Mon espace
            </Link>
            <Link href="/simulateur" className="btn btn-primary btn-sm">
              Simulateur
            </Link>
          </div>

          {/* Burger mobile */}
          <button
            className="burger-btn"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? 'Fermer le menu' : 'Ouvrir le menu'}
            aria-expanded={open}
          >
            {open ? '✕' : '☰'}
          </button>
        </div>
      </header>

      {/* ── Menu mobile overlay ── */}
      {open && (
        <div className="mobile-overlay" role="dialog" aria-modal="true">
          {/* Haut : logo + fermer */}
          <div className="mobile-overlay-header">
            <Link href="/" className="logo" style={{ color: 'white' }}>
              <span className="logo-dot" />
              <span>Moteurs<span style={{ color: 'var(--color-primary)' }}>.com</span></span>
            </Link>
            <button
              onClick={() => setOpen(false)}
              style={{ background: 'none', border: 'none', color: 'white', fontSize: '1.4rem', cursor: 'pointer', padding: 8 }}
              aria-label="Fermer"
            >
              ✕
            </button>
          </div>

          {/* Liens */}
          <nav className="mobile-nav-links">
            {navLinks.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={`mobile-nav-link${path === href ? ' active' : ''}`}
              >
                {label}
              </Link>
            ))}
          </nav>

          {/* CTAs mobile */}
          <div className="mobile-nav-cta">
            <Link href="/espace-membres" className="btn btn-secondary" style={{ textAlign: 'center' }}>
              👤 Mon espace
            </Link>
            <Link href="/simulateur" className="btn btn-primary" style={{ textAlign: 'center' }}>
              Simulateur TCO
            </Link>
          </div>
        </div>
      )}
    </>
  )
}
