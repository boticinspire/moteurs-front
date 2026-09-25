'use client'

import { useState, useRef, useEffect, useTransition } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { usePathname, useRouter } from '@/i18n/navigation'
import { LOCALE_LABELS, type Locale } from '@/i18n/routing'
import Flag from '@/components/Flag'

/**
 * Ordre d'affichage : la Belgique d'abord (FR, NL), puis les autres langues.
 * Drapeaux en SVG locaux (les emoji drapeaux ne s'affichent pas sous Windows).
 */
const GROUPS: { key: 'group_be' | 'group_other'; locales: Locale[] }[] = [
  { key: 'group_be', locales: ['fr', 'nl'] },
  { key: 'group_other', locales: ['de', 'en', 'es', 'it'] },
]
const FLAG_CODE: Record<Locale, string> = { fr: 'be', nl: 'be', de: 'de', en: 'gb', es: 'es', it: 'it' }

type Variant = 'desktop' | 'mobile'

/**
 * Sélecteur de langue.
 *
 * - Persistance automatique du choix via le cookie NEXT_LOCALE (configuré
 *   dans i18n/routing.ts) — géré par le middleware next-intl.
 * - Variante "desktop" : bouton compact + dropdown.
 * - Variante "mobile"  : liste pleine largeur dans l'overlay du burger.
 */
export default function LanguageSwitcher({ variant = 'desktop' }: { variant?: Variant }) {
  const t = useTranslations('LanguageSwitcher')
  const locale = useLocale() as Locale
  const router = useRouter()
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const wrapperRef = useRef<HTMLDivElement>(null)

  // Ferme le menu si on clique en dehors
  useEffect(() => {
    if (variant !== 'desktop' || !open) return
    function onClick(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [open, variant])

  function switchTo(next: Locale) {
    if (next === locale) {
      setOpen(false)
      return
    }
    startTransition(() => {
      router.replace(pathname, { locale: next })
      setOpen(false)
    })
  }

  const current = LOCALE_LABELS[locale]

  if (variant === 'mobile') {
    return (
      <div className="lang-switcher-mobile">
        <div className="lang-switcher-mobile-label">{t('label')}</div>
        {GROUPS.map((g) => (
        <div key={g.key}>
        <div className="lang-switcher-mobile-group">{g.key === 'group_be' && <Flag code="be" size={16} />} {t(g.key)}</div>
        <div className="lang-switcher-mobile-grid">
          {g.locales.map((l) => {
            const info = LOCALE_LABELS[l]
            const active = l === locale
            return (
              <button
                key={l}
                type="button"
                onClick={() => switchTo(l)}
                disabled={isPending}
                aria-current={active ? 'true' : undefined}
                aria-label={active ? t('current', { language: info.native }) : t('switch_to', { language: info.native })}
                className={`lang-switcher-mobile-item${active ? ' active' : ''}`}
              >
                <Flag code={FLAG_CODE[l]} size={18} />
                <span>{info.native}</span>
              </button>
            )
          })}
        </div>
        </div>
        ))}
        <style>{`
          .lang-switcher-mobile { padding: 16px 12px 8px; }
          .lang-switcher-mobile-label {
            font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.06em;
            color: rgba(255,255,255,0.5); margin-bottom: 10px; padding-left: 4px;
          }
          .lang-switcher-mobile-group {
            display: flex; align-items: center; gap: 6px;
            font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.06em;
            color: rgba(255,255,255,0.45); margin: 10px 0 6px 4px;
          }
          .lang-switcher-mobile-grid {
            display: grid; grid-template-columns: 1fr 1fr; gap: 6px;
          }
          .lang-switcher-mobile-item {
            display: flex; align-items: center; gap: 10px;
            padding: 11px 14px; border-radius: 10px;
            background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08);
            color: rgba(255,255,255,0.85); font-size: 0.95rem; font-weight: 500;
            cursor: pointer; transition: all .15s; text-align: left;
          }
          .lang-switcher-mobile-item:hover:not(:disabled) {
            background: rgba(255,255,255,0.08); border-color: rgba(255,255,255,0.18);
          }
          .lang-switcher-mobile-item.active {
            background: rgba(122,240,194,0.12); border-color: rgba(122,240,194,0.35);
            color: #7af0c2; font-weight: 600;
          }
          .lang-switcher-mobile-item:disabled { opacity: 0.6; cursor: wait; }
        `}</style>
      </div>
    )
  }

  return (
    <div ref={wrapperRef} className="lang-switcher" style={{ position: 'relative' }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        disabled={isPending}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={t('current', { language: current.native })}
        className="lang-switcher-trigger"
      >
        <Flag code={FLAG_CODE[locale]} size={16} />
        <span className="lang-switcher-code">{locale.toUpperCase()}</span>
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.7 }} aria-hidden="true">
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {open && (
        <ul role="listbox" aria-label={t('label')} className="lang-switcher-menu">
          {GROUPS.flatMap((g, gi) => [
            <li key={g.key} role="presentation" className={`lang-switcher-group${gi > 0 ? ' sep' : ''}`}>
              {g.key === 'group_be' && <Flag code="be" size={14} />}
              <span>{t(g.key)}</span>
            </li>,
            ...g.locales.map((l) => {
            const info = LOCALE_LABELS[l]
            const active = l === locale
            return (
              <li key={l} role="option" aria-selected={active}>
                <button
                  type="button"
                  onClick={() => switchTo(l)}
                  disabled={isPending}
                  className={`lang-switcher-option${active ? ' active' : ''}`}
                >
                  <Flag code={FLAG_CODE[l]} size={16} />
                  <span>{info.native}</span>
                  {active && (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: 'auto', color: 'var(--color-primary)' }} aria-hidden="true">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </button>
              </li>
            )
          }),
          ])}
        </ul>
      )}

      <style>{`
        .lang-switcher-trigger {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 7px 10px; border-radius: 8px;
          background: transparent; border: 1.5px solid var(--color-border);
          color: var(--color-text); font-size: 0.92rem; font-weight: 600;
          cursor: pointer; transition: all .15s; line-height: 1;
        }
        .lang-switcher-trigger:hover:not(:disabled) {
          border-color: var(--color-primary); color: var(--color-primary);
        }
        .lang-switcher-trigger:disabled { opacity: 0.6; cursor: wait; }
        .lang-switcher-code { font-size: 0.78rem; letter-spacing: 0.02em; }
        .lang-switcher-menu {
          position: absolute; top: calc(100% + 6px); right: 0;
          background: var(--color-bg, #fff);
          border: 1px solid var(--color-border);
          border-radius: 10px;
          box-shadow: 0 8px 24px rgba(0,0,0,.12);
          padding: 6px; margin: 0; list-style: none;
          min-width: 180px; z-index: 100;
        }
        .lang-switcher-group {
          display: flex; align-items: center; gap: 6px;
          padding: 6px 12px 4px; font-size: 0.68rem; font-weight: 700;
          text-transform: uppercase; letter-spacing: 0.07em; color: var(--color-text-soft, #64748b);
        }
        .lang-switcher-group.sep { border-top: 1px solid var(--color-border); margin-top: 4px; padding-top: 8px; }
        .lang-switcher-option {
          width: 100%; display: flex; align-items: center; gap: 10px;
          padding: 8px 12px; border-radius: 6px;
          background: transparent; border: none;
          color: var(--color-text); font-size: 0.92rem; font-weight: 500;
          cursor: pointer; transition: background .12s; text-align: left;
        }
        .lang-switcher-option:hover:not(:disabled) {
          background: var(--color-bg-soft, rgba(0,0,0,0.04));
        }
        .lang-switcher-option.active { font-weight: 600; }
        .lang-switcher-option:disabled { opacity: 0.6; cursor: wait; }
        @media (max-width: 900px) { .lang-switcher { display: none !important; } }
      `}</style>
    </div>
  )
}
