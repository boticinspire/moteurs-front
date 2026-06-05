'use client'

import { useState, useEffect } from 'react'
import { Link, usePathname } from '@/i18n/navigation'
import { useTranslations } from 'next-intl'
import LanguageSwitcher from './LanguageSwitcher'

type NavHref = '/' | '/articles' | '/recharge-electrique' | '/vacances-voiture' | '/cout-voiture' | '/depannage' | '/documents-auto' | '/outils' | '/b2b' | '/particulier'

export default function Header() {
  const t = useTranslations('Header')
  const path = usePathname()
  const [open, setOpen] = useState(false)

  // Liens principaux (desktop + mobile)
  const navLinks: { href: NavHref; label: string; urgent?: boolean }[] = [
    { href: '/',                     label: t('nav_home') },
    { href: '/articles',             label: t('nav_articles') },
    { href: '/recharge-electrique',  label: t('nav_recharge') },
    { href: '/vacances-voiture',     label: t('nav_vacances') },
    { href: '/cout-voiture',         label: t('nav_tco') },
    { href: '/depannage',            label: t('nav_depannage'), urgent: true },
    { href: '/documents-auto',       label: t('nav_documents') },
    { href: '/outils',               label: t('nav_outils') },
  ]

  // Liens audience — visibles dans le menu mobile et en petite taille desktop
  const audienceLinks: { href: NavHref; label: string }[] = [
    { href: '/b2b',         label: t('nav_b2b') },
    { href: '/particulier', label: t('nav_particulier') },
  ]

  useEffect(() => { setOpen(false) }, [path])
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  return (
    <>
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

      <header className="site-header">
        <div className="container">
          <Link href="/" className="logo" aria-label={t('aria_logo')}>
            <span className="logo-mark" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 3v18M3 12h18"/></svg>
            </span>
            <span><span className="logo-text">Moteurs</span><span className="logo-text-dim">.com</span></span>
          </Link>

          <nav className="main-nav">
            {navLinks.map(({ href, label, urgent }) => (
              <Link
                key={href}
                href={href}
                className={path === href ? 'active' : ''}
                style={urgent ? {
                  color: '#f97316',
                  fontWeight: 700,
                  background: 'rgba(249,115,22,0.10)',
                  padding: '3px 10px',
                  borderRadius: '6px',
                } : undefined}
              >
                {urgent ? '🔧 ' : ''}{label}
              </Link>
            ))}
          </nav>

          <div className="header-cta" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <LanguageSwitcher variant="desktop" />
            {/* Liens audience visibles sur desktop (discrets, taille réduite) */}
            {audienceLinks.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={path === href ? 'active' : ''}
                style={{
                  fontSize: '0.78rem', fontWeight: 600,
                  padding: '3px 9px', borderRadius: '6px',
                  background: 'var(--color-bg-alt)',
                  border: '1px solid var(--color-border)',
                  color: 'var(--color-text-soft)',
                  textDecoration: 'none',
                  whiteSpace: 'nowrap',
                }}
              >
                {label}
              </Link>
            ))}
            <Link href="/espace-membres" className="btn btn-secondary btn-sm" style={{ fontWeight: 600 }}>
              {t('cta_my_space')}
            </Link>
            <Link href="/simulateur" className="btn btn-primary btn-sm">
              {t('cta_simulator')}
            </Link>
          </div>

          <button
            className="burger-btn"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? t('aria_close_menu') : t('aria_open_menu')}
            aria-expanded={open}
          >
            {open ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
            ) : (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="18" y2="18"/></svg>
            )}
          </button>
        </div>
      </header>

      {open && (
        <div className="mobile-overlay" role="dialog" aria-modal="true">
          <div className="mobile-overlay-header">
            <Link href="/" className="logo" style={{ color: 'white' }} aria-label={t('aria_logo')}>
              <span className="logo-mark" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 3v18M3 12h18"/></svg>
              </span>
              <span><span className="logo-text" style={{ color: '#fff' }}>Moteurs</span><span className="logo-text-dim" style={{ color: 'rgba(255,255,255,.55)' }}>.com</span></span>
            </Link>
            <button
              onClick={() => setOpen(false)}
              style={{ background: 'none', border: 'none', color: 'white', fontSize: '1.4rem', cursor: 'pointer', padding: 8 }}
              aria-label={t('aria_close')}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
            </button>
          </div>

          <nav className="mobile-nav-links">
            {navLinks.map(({ href, label, urgent }) => (
              <Link
                key={href}
                href={href}
                className={`mobile-nav-link${path === href ? ' active' : ''}`}
                style={urgent ? { color: '#f97316', fontWeight: 700 } : undefined}
              >
                {urgent ? '🔧 ' : ''}{label}
              </Link>
            ))}
          </nav>

          <LanguageSwitcher variant="mobile" />

          {/* Section audience mobile */}
          <div style={{ padding: '8px 12px 4px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)', padding: '4px 16px 8px' }}>
              Votre profil
            </div>
            {audienceLinks.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={`mobile-nav-link${path === href ? ' active' : ''}`}
              >
                {label}
              </Link>
            ))}
          </div>

          <div className="mobile-nav-cta">
            <Link href="/espace-membres" className="btn btn-secondary" style={{ textAlign: 'center' }}>
              {t('cta_my_space')}
            </Link>
            <Link href="/simulateur" className="btn btn-primary" style={{ textAlign: 'center' }}>
              {t('cta_simulator_tco')}
            </Link>
          </div>
        </div>
      )}
    </>
  )
}
