'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import LanguageSwitcher from '@/components/LanguageSwitcher'
import s from './vitrine.module.css'

export default function VitrineHeader() {
  const t = useTranslations('Vitrine')
  const [open, setOpen] = useState(false)

  const links = [
    { href: '#produit', label: t('nav_product') },
    { href: '#principe', label: t('nav_how') },
    { href: '#tailles', label: t('nav_sizes') },
    { href: '#faq', label: t('nav_faq') },
  ]

  return (
    <header className={s.header}>
      <div className={s.headerInner}>
        <Link href="/" className={s.logo} aria-label="Moteurs.com">
          <span className={s.logoMark} aria-hidden="true" />
          <span>Moteurs<span className={s.logoAccent}>.com</span></span>
          <span className={s.logoTag}>{t('brand_tag')}</span>
        </Link>

        <nav className={`${s.nav} ${open ? s.navOpen : ''}`} aria-label={t('nav_aria')}>
          {links.map(l => (
            <a key={l.href} href={l.href} onClick={() => setOpen(false)}>{l.label}</a>
          ))}
          <Link href="/media" className={s.navMedia} onClick={() => setOpen(false)}>
            {t('nav_media')} <span aria-hidden="true">→</span>
          </Link>
        </nav>

        <div className={s.headerActions}>
          <LanguageSwitcher variant="desktop" />
          <a href="#devis" className={s.btnPrimary}>{t('cta_quote')}</a>
          <button
            type="button"
            className={s.burger}
            aria-expanded={open}
            aria-label={open ? t('nav_close') : t('nav_open')}
            onClick={() => setOpen(o => !o)}
          >
            <span /><span /><span />
          </button>
        </div>
      </div>
    </header>
  )
}
