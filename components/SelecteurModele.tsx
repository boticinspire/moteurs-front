'use client'

/**
 * SelecteurModele — combobox de recherche d'un véhicule électrique (catalogue OpenEV Data).
 * Réutilisable dans /comparer, /comparer-trajet, /simulateur, outil société BE.
 *
 * Usage :
 *   <SelecteurModele onSelect={(m) => { ... }} />
 *
 * Au choix d'un modèle, renvoie un objet EvModeleLite (batterie, WLTP, dc_kw,
 * voltage_class, conso…) que le calculateur mappe sur ses propres champs.
 * Le calculateur garde la main : l'utilisateur peut ensuite ajuster les valeurs.
 */
import { useEffect, useRef, useState } from 'react'

export type EvModeleLite = {
  id: number
  slug: string
  make: string
  model: string
  trim: string | null
  year: number | null
  batt_kwh_net: number | null
  batt_kwh_gross: number | null
  wltp_km: number | null
  conso_wh_km: number | null
  dc_kw: number | null
  ac_kw: number | null
  ac_phases: number | null
  voltage_class: string | null
  seats: number | null
  drivetrain: string | null
  vehicle_type: string | null
}

type Props = {
  onSelect: (m: EvModeleLite) => void
  marche?: 'eu' | 'all'
  placeholder?: string
  label?: string
}

/** Conso réelle estimée en kWh/100 km (rated × 1,15) — utilitaire pratique. */
export function consoReelleKwh100(m: EvModeleLite): number | null {
  const batt = m.batt_kwh_net || m.batt_kwh_gross
  let wh = m.conso_wh_km
  if (wh == null && batt && m.wltp_km) wh = (batt / m.wltp_km) * 1000
  return wh != null ? Math.round((wh / 1000) * 100 * 1.15 * 10) / 10 : null
}

function libelle(m: EvModeleLite): string {
  const t = m.trim && m.trim.toLowerCase() !== 'base' ? ` ${m.trim}` : ''
  const y = m.year ? ` (${m.year})` : ''
  return `${m.make} ${m.model}${t}${y}`
}

export default function SelecteurModele({
  onSelect,
  marche = 'eu',
  placeholder = 'Rechercher un modèle (ex. Renault 5, ID.4, Model Y)…',
  label = 'Partir d’un modèle réel',
}: Props) {
  const [q, setQ] = useState('')
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<EvModeleLite[]>([])
  const [choisi, setChoisi] = useState<EvModeleLite | null>(null)
  const boxRef = useRef<HTMLDivElement>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(async () => {
      if (q.trim().length < 2) {
        setResults([])
        return
      }
      setLoading(true)
      try {
        const r = await fetch(
          `/api/ev-modeles?marche=${marche}&limit=40&q=${encodeURIComponent(q.trim())}`
        )
        const j = await r.json()
        setResults(j.modeles || [])
        setOpen(true)
      } catch {
        setResults([])
      } finally {
        setLoading(false)
      }
    }, 250)
    return () => {
      if (timer.current) clearTimeout(timer.current)
    }
  }, [q, marche])

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  function pick(m: EvModeleLite) {
    setChoisi(m)
    setQ(libelle(m))
    setOpen(false)
    onSelect(m)
  }

  return (
    <div ref={boxRef} style={{ position: 'relative', width: '100%' }}>
      {label && (
        <label
          style={{
            display: 'block',
            fontSize: 13,
            fontWeight: 600,
            marginBottom: 6,
            color: 'var(--color-text, #1a1a1a)',
          }}
        >
          ⚡ {label}
        </label>
      )}
      <input
        type="text"
        value={q}
        placeholder={placeholder}
        onChange={(e) => {
          setQ(e.target.value)
          setChoisi(null)
        }}
        onFocus={() => results.length && setOpen(true)}
        style={{
          width: '100%',
          padding: '10px 12px',
          borderRadius: 10,
          border: '1px solid var(--color-border, #d8d8d8)',
          background: 'var(--color-surface, #fff)',
          color: 'var(--color-text, #1a1a1a)',
          fontSize: 15,
        }}
      />
      {choisi && (
        <div style={{ fontSize: 12, marginTop: 6, color: 'var(--color-text-muted, #666)' }}>
          {choisi.batt_kwh_net ?? choisi.batt_kwh_gross} kWh · {choisi.wltp_km} km WLTP ·{' '}
          {choisi.dc_kw} kW DC{choisi.voltage_class ? ` · ${choisi.voltage_class}` : ''} ·{' '}
          {consoReelleKwh100(choisi)} kWh/100 km (estimé)
        </div>
      )}
      {open && (results.length > 0 || loading) && (
        <ul
          style={{
            position: 'absolute',
            zIndex: 30,
            top: '100%',
            left: 0,
            right: 0,
            marginTop: 4,
            maxHeight: 280,
            overflowY: 'auto',
            listStyle: 'none',
            padding: 4,
            borderRadius: 10,
            border: '1px solid var(--color-border, #d8d8d8)',
            background: 'var(--color-surface, #fff)',
            boxShadow: '0 8px 24px rgba(0,0,0,.12)',
          }}
        >
          {loading && (
            <li style={{ padding: '8px 10px', color: 'var(--color-text-muted, #666)', fontSize: 13 }}>
              Recherche…
            </li>
          )}
          {!loading &&
            results.map((m) => (
              <li key={m.id}>
                <button
                  type="button"
                  onClick={() => pick(m)}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    padding: '8px 10px',
                    border: 'none',
                    background: 'transparent',
                    cursor: 'pointer',
                    borderRadius: 8,
                    color: 'var(--color-text, #1a1a1a)',
                    fontSize: 14,
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--color-bg-soft, #f3f3f3)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <strong>{libelle(m)}</strong>
                  <span style={{ color: 'var(--color-text-muted, #666)' }}>
                    {' '}— {m.batt_kwh_net ?? m.batt_kwh_gross} kWh · {m.wltp_km} km · {m.dc_kw} kW
                  </span>
                </button>
              </li>
            ))}
        </ul>
      )}
    </div>
  )
}
