'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import {
  calculTCO, getMotors, getSegments,
  MOTOR_COLORS, SEGMENT_LABELS,
  fmtEur, fmtEurM,
  type Segment, type Profil, type Pays, type Motor, type TcoResult,
} from '@/lib/tco'

// ---------- Types props ----------

export type EmbedTheme = 'light' | 'dark' | 'auto'
export type EmbedLang = 'fr' | 'en'

export interface ComparateurTCOEmbedProps {
  partner?: string
  lang?: EmbedLang
  theme?: EmbedTheme
  accent?: string // couleur hex partenaire, ex '#ef6c1a'
  embedId?: string // identifiant unique de l'iframe (genere par le loader)
}

// ---------- Mini i18n ----------

const STRINGS: Record<EmbedLang, Record<string, string>> = {
  fr: {
    title: 'Comparez le vrai coût total',
    subtitle: 'Estimation TCO sur la durée d\'exploitation',
    profil: 'Profil',
    b2b: 'B2B',
    particulier: 'Particulier',
    pays: 'Pays',
    segment: 'Segment',
    duree: 'Durée',
    months: 'mois',
    km: 'Km / an',
    cheapest: 'Moins cher',
    total: 'TCO total',
    monthly: 'Mensuel',
    summary_winner: 'est la motorisation la moins chère',
    over: 'sur',
    save: 'soit',
    vs: 'vs',
    not_available: 'Non disponible sur ce segment',
    powered_by: 'Propulsé par',
    disclaimer: 'Estimation indicative basée sur des moyennes 2026.',
    cta: 'Calculer en détail sur Moteurs.com',
  },
  en: {
    title: 'Compare real total cost',
    subtitle: 'TCO estimate over the ownership period',
    profil: 'Profile',
    b2b: 'Business',
    particulier: 'Personal',
    pays: 'Country',
    segment: 'Vehicle type',
    duree: 'Period',
    months: 'months',
    km: 'Km / year',
    cheapest: 'Cheapest',
    total: 'Total TCO',
    monthly: 'Monthly',
    summary_winner: 'is the cheapest powertrain',
    over: 'over',
    save: 'saving',
    vs: 'vs',
    not_available: 'Not available on this segment',
    powered_by: 'Powered by',
    disclaimer: 'Indicative estimate based on 2026 averages.',
    cta: 'Run a full calculation on Moteurs.com',
  },
}

// ---------- Palettes thème ----------

interface Palette {
  bg: string
  bgAlt: string
  border: string
  text: string
  textSoft: string
  accent: string
}

const LIGHT: Palette = {
  bg: '#ffffff',
  bgAlt: '#f4f7fb',
  border: '#dde5f0',
  text: '#111827',
  textSoft: '#4b5e78',
  accent: '#ef6c1a',
}

const DARK: Palette = {
  bg: '#0b1320',
  bgAlt: '#131e2f',
  border: '#27354a',
  text: '#f0f4fa',
  textSoft: '#9aa9bc',
  accent: '#ff8a3d',
}

function resolvePalette(theme: EmbedTheme, accent?: string): Palette {
  const base = theme === 'dark' ? DARK : LIGHT
  return accent ? { ...base, accent } : base
}

// ---------- Helpers UI ----------

const PAYS_OPTIONS: { value: Pays; label: string }[] = [
  { value: 'FR', label: 'France' },
  { value: 'BE', label: 'Belgique' },
  { value: 'CH', label: 'Suisse' },
  { value: 'CA', label: 'Canada' },
]

const DUREES = [36, 48, 60]

function ToggleGroup<T extends string>({
  options, value, onChange, palette,
}: {
  options: { value: T; label: string }[]
  value: T
  onChange: (v: T) => void
  palette: Palette
}) {
  return (
    <div style={{ display: 'inline-flex', borderRadius: 8, overflow: 'hidden', border: `1px solid ${palette.border}` }}>
      {options.map((o) => {
        const active = o.value === value
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            style={{
              padding: '8px 14px',
              fontSize: 13,
              fontWeight: 600,
              border: 'none',
              cursor: 'pointer',
              background: active ? palette.accent : palette.bgAlt,
              color: active ? '#fff' : palette.text,
              transition: 'background 0.15s',
            }}
          >
            {o.label}
          </button>
        )
      })}
    </div>
  )
}

function MotorCard({
  result, isBest, palette, labels,
}: {
  result: TcoResult
  isBest: boolean
  palette: Palette
  labels: typeof STRINGS['fr']
}) {
  const color = MOTOR_COLORS[result.motor] ?? '#6b7280'

  if (!result.available) {
    return (
      <div style={{
        padding: 14, borderRadius: 8, border: `1px solid ${palette.border}`,
        background: palette.bgAlt, opacity: 0.5,
      }}>
        <strong style={{ fontSize: 13, color: palette.text }}>{result.label}</strong>
        <p style={{ fontSize: 12, color: palette.textSoft, margin: '4px 0 0' }}>
          {labels.not_available}
        </p>
      </div>
    )
  }

  return (
    <div style={{
      position: 'relative',
      padding: 14,
      borderRadius: 8,
      border: isBest ? `2px solid ${color}` : `1px solid ${palette.border}`,
      background: isBest ? `${color}14` : palette.bgAlt,
    }}>
      {isBest && (
        <span style={{
          position: 'absolute', top: -1, right: 10,
          background: color, color: '#fff',
          fontSize: 10, fontWeight: 700, letterSpacing: '0.04em',
          padding: '2px 8px', borderRadius: '0 0 6px 6px',
          textTransform: 'uppercase',
        }}>
          ✓ {labels.cheapest}
        </span>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
        <span style={{
          width: 10, height: 10, borderRadius: '50%',
          background: color, flexShrink: 0,
        }} />
        <strong style={{ fontSize: 13, color: palette.text }}>{result.label}</strong>
      </div>

      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
        paddingTop: 8, borderTop: `1px solid ${palette.border}`,
      }}>
        <div>
          <div style={{ fontSize: 10, color: palette.textSoft, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            {labels.total}
          </div>
          <div style={{ fontSize: 16, fontWeight: 800, color: palette.text }}>
            {fmtEur(result.total)}
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 10, color: palette.textSoft, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            {labels.monthly}
          </div>
          <div style={{ fontSize: 14, fontWeight: 700, color: isBest ? color : palette.text }}>
            {fmtEurM(result.coutMensuel)}
          </div>
        </div>
      </div>
    </div>
  )
}

// ---------- Composant principal ----------

export default function ComparateurTCOEmbed({
  partner,
  lang = 'fr',
  theme = 'light',
  accent,
  embedId,
}: ComparateurTCOEmbedProps) {
  const labels = STRINGS[lang] ?? STRINGS.fr
  const palette = resolvePalette(theme, accent)

  const [profil, setProfil] = useState<Profil>('B2B')
  const [pays, setPays] = useState<Pays>('FR')
  const [segment, setSegment] = useState<Segment>('vul_moyen')
  const [duree, setDuree] = useState(48)
  const [kmAn, setKmAn] = useState(25000)

  const segments = useMemo(() => getSegments(profil), [profil])
  const motors = useMemo(() => getMotors(segment, profil), [segment, profil])

  const handleProfilChange = (p: Profil) => {
    setProfil(p)
    const segs = getSegments(p)
    if (!segs.includes(segment)) setSegment(segs[0])
  }

  const results = useMemo<TcoResult[]>(() => {
    return motors.map((motor: Motor) =>
      calculTCO({
        segment, motor, profil, pays,
        km_an: kmAn, duree_mois: duree,
        profil_conduite: 'mixte', charge: 'standard',
        pct_hiver: 25, taux_recharge_phev: 50,
      })
    )
  }, [segment, profil, pays, kmAn, duree, motors])

  const availableResults = results.filter((r) => r.available)
  const bestTotal = availableResults.length > 0
    ? Math.min(...availableResults.map((r) => r.total))
    : 0
  const sorted = [...results].sort((a, b) => {
    if (!a.available) return 1
    if (!b.available) return -1
    return a.total - b.total
  })

  // ----- Auto-resize via postMessage -----
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (window === window.parent) return // pas dans une iframe
    if (!rootRef.current) return

    const sendHeight = () => {
      const h = rootRef.current?.scrollHeight ?? document.body.scrollHeight
      window.parent.postMessage(
        { source: 'moteurs-embed', id: embedId, type: 'resize', height: h },
        '*'
      )
    }

    sendHeight()
    const ro = new ResizeObserver(sendHeight)
    ro.observe(rootRef.current)

    // Tracking load (best-effort)
    if (partner) {
      window.parent.postMessage(
        { source: 'moteurs-embed', id: embedId, type: 'event', name: 'load', partner },
        '*'
      )
    }

    return () => ro.disconnect()
  }, [embedId, partner])

  // ----- UTMs sur le CTA -----
  const ctaUrl = useMemo(() => {
    const u = new URL('https://moteurs.com/comparer')
    u.searchParams.set('utm_source', 'embed')
    u.searchParams.set('utm_medium', 'iframe')
    u.searchParams.set('utm_campaign', 'tco_v1')
    if (partner) u.searchParams.set('utm_content', partner)
    return u.toString()
  }, [partner])

  // ----- Styles container -----
  const winner = sorted[0]
  const runnerup = sorted.find((r) => r.available && r.total !== bestTotal)
  const gap = runnerup ? runnerup.total - bestTotal : 0

  return (
    <div
      ref={rootRef}
      style={{
        fontFamily: 'var(--font-inter, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif)',
        background: palette.bg,
        color: palette.text,
        padding: 20,
        boxSizing: 'border-box',
        minHeight: 200,
      }}
    >
      {/* En-tete */}
      <div style={{ marginBottom: 18 }}>
        <h2 style={{
          margin: 0, fontSize: 18, fontWeight: 800, color: palette.text,
          letterSpacing: '-0.01em',
        }}>
          {labels.title}
        </h2>
        <p style={{ margin: '4px 0 0', fontSize: 13, color: palette.textSoft }}>
          {labels.subtitle}
        </p>
      </div>

      {/* Controles compacts */}
      <div style={{
        display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'flex-end',
        marginBottom: 18,
      }}>
        <div>
          <Label palette={palette}>{labels.profil}</Label>
          <ToggleGroup<Profil>
            options={[
              { value: 'B2B', label: labels.b2b },
              { value: 'Particulier', label: labels.particulier },
            ]}
            value={profil}
            onChange={handleProfilChange}
            palette={palette}
          />
        </div>

        <div>
          <Label palette={palette}>{labels.pays}</Label>
          <select
            value={pays}
            onChange={(e) => setPays(e.target.value as Pays)}
            style={selectStyle(palette)}
          >
            {PAYS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>

        <div>
          <Label palette={palette}>{labels.segment}</Label>
          <select
            value={segment}
            onChange={(e) => setSegment(e.target.value as Segment)}
            style={selectStyle(palette)}
          >
            {segments.map((s) => (
              <option key={s} value={s}>{SEGMENT_LABELS[s]}</option>
            ))}
          </select>
        </div>

        <div>
          <Label palette={palette}>{labels.duree}</Label>
          <select
            value={duree}
            onChange={(e) => setDuree(Number(e.target.value))}
            style={selectStyle(palette)}
          >
            {DUREES.map((d) => (
              <option key={d} value={d}>{d} {labels.months}</option>
            ))}
          </select>
        </div>

        <div>
          <Label palette={palette}>{labels.km}</Label>
          <input
            type="number"
            min={1000}
            step={1000}
            value={kmAn}
            onChange={(e) => setKmAn(Number(e.target.value))}
            style={{ ...selectStyle(palette), width: 100 }}
          />
        </div>
      </div>

      {/* Resume gagnant */}
      {availableResults.length > 0 && winner.available && (
        <div style={{
          padding: '12px 14px', borderRadius: 8,
          background: palette.bgAlt,
          borderLeft: `3px solid ${palette.accent}`,
          marginBottom: 16, fontSize: 13, color: palette.text,
        }}>
          <strong>{winner.label}</strong> {labels.summary_winner} —{' '}
          <strong>{fmtEur(bestTotal)}</strong> {labels.over} {duree} {labels.months}
          {runnerup && gap > 0 && (
            <>
              {', '}{labels.save}{' '}
              <strong style={{ color: '#16a34a' }}>−{fmtEur(gap)}</strong>{' '}
              {labels.vs} {runnerup.label}
            </>
          )}
        </div>
      )}

      {/* Grille resultats */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
        gap: 12,
      }}>
        {sorted.map((r) => (
          <MotorCard
            key={r.motor}
            result={r}
            isBest={r.available && r.total === bestTotal}
            palette={palette}
            labels={labels}
          />
        ))}
      </div>

      {/* Footer : CTA + disclaimer + branding */}
      <div style={{
        marginTop: 20, paddingTop: 14,
        borderTop: `1px solid ${palette.border}`,
        display: 'flex', flexWrap: 'wrap', gap: 12,
        alignItems: 'center', justifyContent: 'space-between',
        fontSize: 11, color: palette.textSoft,
      }}>
        <div style={{ flex: '1 1 220px', minWidth: 0 }}>
          {labels.disclaimer}
        </div>
        <a
          href={ctaUrl}
          target="_blank"
          rel="noopener"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '8px 14px', borderRadius: 6,
            background: palette.accent, color: '#fff',
            fontSize: 12, fontWeight: 700, textDecoration: 'none',
          }}
        >
          {labels.cta} →
        </a>
      </div>

      {/* Badge Powered by */}
      <div style={{
        marginTop: 10, textAlign: 'right',
        fontSize: 10, color: palette.textSoft,
      }}>
        {labels.powered_by}{' '}
        <a
          href={ctaUrl}
          target="_blank"
          rel="noopener"
          style={{ color: palette.accent, textDecoration: 'none', fontWeight: 600 }}
        >
          Moteurs.com
        </a>
      </div>
    </div>
  )
}

// ---------- Mini sous-composants stylises ----------

function Label({ children, palette }: { children: React.ReactNode; palette: Palette }) {
  return (
    <div style={{
      fontSize: 10, fontWeight: 700, textTransform: 'uppercase',
      letterSpacing: '0.05em', color: palette.textSoft,
      marginBottom: 5,
    }}>
      {children}
    </div>
  )
}

function selectStyle(palette: Palette): React.CSSProperties {
  return {
    padding: '7px 10px',
    fontSize: 13,
    borderRadius: 6,
    border: `1px solid ${palette.border}`,
    background: palette.bg,
    color: palette.text,
    cursor: 'pointer',
    fontFamily: 'inherit',
  }
}
