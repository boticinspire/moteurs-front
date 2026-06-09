'use client'

import { useState, useEffect } from 'react'
import { Link, usePathname } from '@/i18n/navigation'
import { useTranslations } from 'next-intl'
import LanguageSwitcher from './LanguageSwitcher'

type NavHref = '/' | '/articles' | '/recharge-electrique' | '/vacances-voiture' | '/cout-voiture' | '/depannage' | '/documents-auto' | '/outils' | '/dessins' | '/b2b' | '/particulier'

export default function Header() {
  const t = useTranslations('Header')
  const path = usePathname()
  const [open, setOpen] = useState(false)

  // Liens principaux visibles dans la nav desktop
  const mainLinks: { href: NavHref; label: string; urgent?: boolean }[] = [
    { href: '/',                     label: t('nav_home') },
    { href: '/articles',             label: t('nav_articles') },
    { href: '/recharge-electrique',  label: t('nav_recharge') },
    { href: '/vacances-voiture',     label: t('nav_vacances') },
    { href: '/cout-voiture',         label: t('nav_tco') },
    { href: '/depannage',            label: t('nav_depannage'), urgent: true },
  ]

  // Liens regroupés sous le menu « Plus » (desktop) — listés à plat en mobile
  const moreLinks: { href: NavHref; label: string; urgent?: boolean }[] = [
    { href: '/documents-auto', label: t('nav_documents') },
    { href: '/outils',         label: t('nav_outils') },
    { href: '/dessins',        label: t('nav_dessins') },
  ]

  // Liens audience — menu compte (desktop) + section profil (mobile)
  const audienceLinks: { href: NavHref; label: string }[] = [
    { href: '/b2b',         label: t('nav_b2b') },
    { href: '/particulier', label: t('nav_particulier') },
  ]

  const allNav = [...mainLinks, ...moreLinks]

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
          .hdr-acct { display: none !important; }
          .burger-btn { display: flex !important; align-items: center; justify-content: center;
            width: 40px; height: 40px; background: none;
            border: 1.5px solid var(--color-border); border-radius: 8px;
            cursor: pointer; font-size: 1.25rem; color: var(--color-text); transition: all .15s; }
          .burger-btn:hover { border-color: var(--color-primary); color: var(--color-primary); }
        }

        /* ===== Menu déroulant « Plus » + menu compte (desktop) ===== */
        .nav-grp { position: relative; }
        .nav-grp > button {
          display: inline-flex; align-items: center; gap: 5px;
          font: inherit; font-size: .9rem; font-weight: 500;
          color: var(--color-bg-dark); background: none; border: none;
          cursor: pointer; padding: 8px 4px; opacity: .78; transition: opacity .2s;
        }
        .nav-grp:hover > button, .nav-grp:focus-within > button { opacity: 1; }
        .nav-grp .chev { width: 13px; height: 13px; stroke: currentColor; fill: none; stroke-width: 2.2; transition: transform .2s; }
        .nav-grp:hover .chev, .nav-grp:focus-within .chev { transform: rotate(180deg); }
        .nav-menu {
          position: absolute; top: calc(100% + 10px); left: 0; min-width: 224px;
          background: #fff; border: 1px solid rgba(11,30,56,.1); border-radius: 14px;
          box-shadow: 0 18px 50px -18px rgba(11,30,56,.32); padding: 8px;
          opacity: 0; visibility: hidden; transform: translateY(-6px);
          transition: opacity .18s, transform .18s, visibility .18s; z-index: 120;
        }
        .nav-grp:hover .nav-menu, .nav-grp:focus-within .nav-menu { opacity: 1; visibility: visible; transform: none; }
        .nav-menu a {
          display: flex; align-items: center; gap: 10px; padding: 10px 12px;
          border-radius: 9px; font-size: .88rem; font-weight: 500;
          color: var(--color-text); white-space: nowrap; text-decoration: none;
        }
        .nav-menu a:hover, .nav-menu a.active { background: var(--color-bg-alt); color: var(--color-primary); }
        .nav-menu a svg { width: 16px; height: 16px; stroke: var(--color-primary); fill: none; stroke-width: 2; flex-shrink: 0; }
        .nav-menu .menu-lbl { font-size: .68rem; font-weight: 700; text-transform: uppercase; letter-spacing: .08em; color: var(--color-text-soft); padding: 8px 12px 4px; }
        .nav-menu .menu-sep { height: 1px; background: rgba(11,30,56,.08); margin: 6px 4px; }

        .hdr-acct { position: relative; }
        .hdr-acct > button {
          display: inline-flex; align-items: center; gap: 7px;
          padding: 5px 10px 5px 6px; border-radius: 9px;
          border: 1.5px solid var(--color-border); background: none;
          color: var(--color-text); font: inherit; cursor: pointer; transition: border-color .2s;
        }
        .hdr-acct:hover > button, .hdr-acct:focus-within > button { border-color: var(--color-bg-dark); }
        .hdr-acct > button .av { width: 24px; height: 24px; border-radius: 50%; background: rgba(239,108,26,.14); display: grid; place-items: center; color: var(--color-primary); }
        .hdr-acct > button .av svg { width: 15px; height: 15px; stroke: currentColor; fill: none; stroke-width: 2; }
        .hdr-acct .chev { width: 12px; height: 12px; stroke: currentColor; fill: none; stroke-width: 2.2; transition: transform .2s; }
        .hdr-acct:hover .chev, .hdr-acct:focus-within .chev { transform: rotate(180deg); }
        .hdr-acct .nav-menu { left: auto; right: 0; min-width: 232px; }

        /* ===== Adaptation thème sombre de la home v2 ===== */
        body:has(.home-v2[data-theme="dark"]) .nav-grp > button { color: #cdd5e4; }
        body:has(.home-v2[data-theme="dark"]) .nav-grp:hover > button,
        body:has(.home-v2[data-theme="dark"]) .nav-grp:focus-within > button { color: #fff; }
        body:has(.home-v2[data-theme="dark"]) .hdr-acct > button { color: #fff; border-color: rgba(255,255,255,.15); }
        body:has(.home-v2[data-theme="dark"]) .hdr-acct:hover > button { border-color: rgba(255,255,255,.3); }
        body:has(.home-v2[data-theme="dark"]) .hdr-acct > button .av { background: rgba(239,108,26,.22); }

        .mobile-overlay {
          position: fixed; inset: 0; z-index: 200;
          background: var(--color-bg-dark);
          display: flex; flex-direction: column;
          padding: 0; overflow-y: auto; animation: slideDown .2s ease;
        }
        @keyframes slideDown { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }
        .mobile-overlay-header {
          display: flex; align-items: center; justify-content: space-between;
          padding: 16px 20px; border-bottom: 1px solid rgba(255,255,255,0.08);
          height: var(--header-h); flex-shrink: 0;
        }
        .mobile-nav-links { padding: 12px 12px 24px; display: flex; flex-direction: column; gap: 4px; }
        .mobile-nav-link {
          display: block; padding: 13px 16px; border-radius: 10px;
          color: rgba(255,255,255,0.8); font-size: 1.05rem; font-weight: 500;
          text-decoration: none; transition: all .15s;
        }
        .mobile-nav-link:hover, .mobile-nav-link.active { background: rgba(255,255,255,0.08); color: var(--color-primary); }
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
            {mainLinks.map(({ href, label, urgent }) => (
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

            <div className="nav-grp">
              <button type="button" aria-haspopup="true">
                {t('nav_more')}
                <svg className="chev" viewBox="0 0 24 24"><path d="m6 9 6 6 6-6"/></svg>
              </button>
              <div className="nav-menu" role="menu">
                <Link href="/documents-auto" className={path === '/documents-auto' ? 'active' : ''} role="menuitem">
                  <svg viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                  {t('nav_documents')}
                </Link>
                <Link href="/outils" className={path === '/outils' ? 'active' : ''} role="menuitem">
                  <svg viewBox="0 0 24 24"><rect width="16" height="20" x="4" y="2" rx="2"/><line x1="8" x2="16" y1="6" y2="6"/><line x1="16" x2="16" y1="14" y2="18"/></svg>
                  {t('nav_outils')}
                </Link>
                <Link href="/dessins" className={path === '/dessins' ? 'active' : ''} role="menuitem">
                  <svg viewBox="0 0 24 24"><path d="M12 19l7-7 3 3-7 7-3-3z"/><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18z"/></svg>
                  {t('nav_dessins')}
                </Link>
              </div>
            </div>
          </nav>

          <div className="header-cta" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <LanguageSwitcher variant="desktop" />

            <div className="hdr-acct">
              <button type="button" aria-haspopup="true" aria-label={t('aria_account')}>
                <span className="av" aria-hidden="true">
                  <svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg>
                </span>
                <svg className="chev" viewBox="0 0 24 24"><path d="m6 9 6 6 6-6"/></svg>
              </button>
              <div className="nav-menu" role="menu">
                <div className="menu-lbl">{t('account_profile')}</div>
                {audienceLinks.map(({ href, label }) => (
                  <Link key={href} href={href} className={path === href ? 'active' : ''} role="menuitem">
                    {href === '/b2b' ? (
                      <svg viewBox="0 0 24 24"><rect width="20" height="14" x="2" y="7" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
                    ) : (
                      <svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg>
                    )}
                    {label}
                  </Link>
                ))}
                <div className="menu-sep" />
                <Link href="/espace-membres" role="menuitem">
                  <svg viewBox="0 0 24 24"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                  {t('cta_my_space')}
                </Link>
              </div>
            </div>

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
            {allNav.map(({ href, label, urgent }) => (
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

          <div style={{ padding: '8px 12px 4px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)', padding: '4px 16px 8px' }}>
              {t('account_profile')}
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
