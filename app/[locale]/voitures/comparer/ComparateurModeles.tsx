'use client'

/**
 * Comparateur de modèles côte à côte (2-3 véhicules).
 * Utilise le sélecteur catalogue + le modèle de charge paramétrique.
 */
import { useState } from 'react'
import SelecteurModele, { consoReelleKwh100, type EvModeleLite } from '@/components/SelecteurModele'
import { chargeTimeMin, type VoltageClass } from '@/lib/ev-charge-model'

const MAX = 3

function tpsCharge(m: EvModeleLite): number | null {
  const batt = m.batt_kwh_net ?? m.batt_kwh_gross
  if (!batt || !m.dc_kw) return null
  return chargeTimeMin({ battKwhNet: batt, dcPeakKw: m.dc_kw, voltageClass: (m.voltage_class as VoltageClass) ?? undefined, stationKw: 150 }, 10, 80)
}

export default function ComparateurModeles() {
  const [sel, setSel] = useState<EvModeleLite[]>([])

  function add(m: EvModeleLite) {
    setSel((prev) => (prev.length >= MAX || prev.some((x) => x.id === m.id) ? prev : [...prev, m]))
  }
  function remove(id: number) {
    setSel((prev) => prev.filter((x) => x.id !== id))
  }

  const lignes: { k: string; v: (m: EvModeleLite) => string; best?: 'max' | 'min' }[] = [
    { k: 'Batterie', v: (m) => `${m.batt_kwh_net ?? m.batt_kwh_gross ?? '—'} kWh`, best: 'max' },
    { k: 'Autonomie WLTP', v: (m) => (m.wltp_km ? `${m.wltp_km} km` : '—'), best: 'max' },
    { k: 'Conso réelle', v: (m) => { const c = consoReelleKwh100(m); return c ? `${c} kWh/100 km` : '—' }, best: 'min' },
    { k: 'Charge DC', v: (m) => (m.dc_kw ? `${m.dc_kw} kW${m.voltage_class === '800v' ? ' · 800V' : ''}` : '—'), best: 'max' },
    { k: 'Recharge 10→80 %', v: (m) => { const t = tpsCharge(m); return t ? `~${t} min` : '—' }, best: 'min' },
    { k: 'Places', v: (m) => (m.seats ? `${m.seats}` : '—') },
    { k: 'Transmission', v: (m) => (m.drivetrain ? m.drivetrain.toUpperCase() : '—') },
  ]

  // valeurs numériques pour surligner le meilleur
  const num: Record<string, (m: EvModeleLite) => number | null> = {
    'Batterie': (m) => m.batt_kwh_net ?? m.batt_kwh_gross,
    'Autonomie WLTP': (m) => m.wltp_km,
    'Conso réelle': (m) => consoReelleKwh100(m),
    'Charge DC': (m) => m.dc_kw,
    'Recharge 10→80 %': (m) => tpsCharge(m),
  }

  const cell: React.CSSProperties = { padding: '10px 12px', borderBottom: '1px solid var(--color-border)', fontSize: 14, textAlign: 'center' }

  return (
    <div>
      {sel.length < MAX && (
        <div style={{ maxWidth: 520, marginBottom: 20 }}>
          <SelecteurModele label={`Ajouter un modèle (${sel.length}/${MAX})`} onSelect={add} />
        </div>
      )}

      {sel.length === 0 ? (
        <p style={{ color: 'var(--color-text-muted)' }}>Ajoutez 2 ou 3 modèles pour les comparer.</p>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 480 }}>
            <thead>
              <tr>
                <th style={{ ...cell, textAlign: 'left' }}></th>
                {sel.map((m) => (
                  <th key={m.id} style={{ ...cell, fontSize: 15 }}>
                    {m.make} {m.model}
                    <div>
                      <button type="button" onClick={() => remove(m.id)} style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer', fontSize: 12, textDecoration: 'underline' }}>retirer</button>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {lignes.map((row) => {
                let bestId: number | null = null
                if (row.best && num[row.k]) {
                  const vals = sel.map((m) => ({ id: m.id, n: num[row.k](m) })).filter((x) => x.n != null) as { id: number; n: number }[]
                  if (vals.length > 1) {
                    bestId = vals.reduce((a, b) => (row.best === 'max' ? (b.n > a.n ? b : a) : (b.n < a.n ? b : a))).id
                  }
                }
                return (
                  <tr key={row.k}>
                    <td style={{ ...cell, textAlign: 'left', color: 'var(--color-text-muted)', fontWeight: 600, fontSize: 13 }}>{row.k}</td>
                    {sel.map((m) => (
                      <td key={m.id} style={{ ...cell, fontWeight: bestId === m.id ? 700 : 400, color: bestId === m.id ? 'var(--color-primary)' : 'var(--color-text)' }}>
                        {row.v(m)}
                      </td>
                    ))}
                  </tr>
                )
              })}
              <tr>
                <td style={{ ...cell, textAlign: 'left' }}></td>
                {sel.map((m) => (
                  <td key={m.id} style={cell}>
                    <a href={`/comparer-trajet`} style={{ fontSize: 12, color: 'var(--color-primary)' }}>Coût trajet →</a>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
