'use client'

/**
 * Coût d'une recharge rapide 10→80 % pour un modèle, selon la carte et le pays.
 * Croise la batterie du véhicule × tarifs €/kWh (table tarifs_carte_pays via
 * /api/tarifs-recharge). Estimation indicative.
 */
import { useEffect, useState } from 'react'

type Tarif = {
  carte_id: string
  carte_nom: string
  operateur: string | null
  devise: string
  plan_principal_kwh: number | null
  dc_rapide_kwh: number | null
  dc_ultra_kwh: number | null
}

const PAYS = [
  { code: 'FR', label: '🇫🇷 France' },
  { code: 'BE', label: '🇧🇪 Belgique' },
  { code: 'CH', label: '🇨🇭 Suisse' },
]

export default function CoutRechargeModele({ battKwh, dcMax }: { battKwh: number; dcMax: number | null }) {
  const [pays, setPays] = useState('FR')
  const [tarifs, setTarifs] = useState<Tarif[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let cancel = false
    setLoading(true)
    fetch(`/api/tarifs-recharge?pays=${pays}`)
      .then((r) => r.json())
      .then((j) => { if (!cancel) setTarifs(j.tarifs || []) })
      .catch(() => { if (!cancel) setTarifs([]) })
      .finally(() => { if (!cancel) setLoading(false) })
    return () => { cancel = true }
  }, [pays])

  const energie = Math.round(battKwh * 0.7 * 10) / 10 // kWh ajoutés sur 10→80 %
  const ultra = dcMax != null && dcMax >= 150

  const lignes = tarifs
    .map((t) => {
      const kwh =
        (ultra && t.dc_ultra_kwh) ? t.dc_ultra_kwh
        : t.dc_rapide_kwh ?? t.dc_ultra_kwh ?? t.plan_principal_kwh
      const prix = kwh != null ? Math.round(energie * Number(kwh) * 100) / 100 : null
      return { ...t, kwh: kwh != null ? Number(kwh) : null, prix }
    })
    .filter((l) => l.prix != null)
    .sort((a, b) => (a.prix as number) - (b.prix as number))

  const cell: React.CSSProperties = { padding: '8px 10px', borderBottom: '1px solid var(--color-border)', fontSize: 14 }

  return (
    <section style={{ marginBottom: 28 }}>
      <h2 style={{ fontSize: '1.1rem', marginBottom: 6 }}>Coût d’une recharge rapide (10→80 %)</h2>
      <p style={{ fontSize: 13, color: 'var(--color-text-muted)', marginBottom: 10 }}>
        Pour ~{energie} kWh ajoutés (10→80 % de la batterie), selon la carte de recharge utilisée.
      </p>
      <div style={{ marginBottom: 10 }}>
        {PAYS.map((p) => (
          <button
            key={p.code}
            type="button"
            onClick={() => setPays(p.code)}
            style={{
              marginRight: 8, padding: '6px 12px', borderRadius: 999, cursor: 'pointer', fontSize: 13,
              border: pays === p.code ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
              background: pays === p.code ? 'var(--color-primary)' : 'var(--color-bg-card)',
              color: pays === p.code ? '#0a1628' : 'var(--color-text)',
              fontWeight: pays === p.code ? 700 : 400,
            }}
          >
            {p.label}
          </button>
        ))}
      </div>
      {loading ? (
        <p style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>Chargement des tarifs…</p>
      ) : lignes.length === 0 ? (
        <p style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>Aucun tarif disponible pour ce pays.</p>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ ...cell, textAlign: 'left', color: 'var(--color-text-muted)', fontWeight: 600, fontSize: 12 }}>Carte</th>
                <th style={{ ...cell, textAlign: 'right', color: 'var(--color-text-muted)', fontWeight: 600, fontSize: 12 }}>€/kWh</th>
                <th style={{ ...cell, textAlign: 'right', color: 'var(--color-text-muted)', fontWeight: 600, fontSize: 12 }}>Recharge 10→80 %</th>
              </tr>
            </thead>
            <tbody>
              {lignes.map((l, i) => (
                <tr key={l.carte_id}>
                  <td style={{ ...cell, fontWeight: i === 0 ? 700 : 400 }}>
                    {l.carte_nom}{i === 0 && <span style={{ color: 'var(--color-primary)', fontSize: 12 }}> · le moins cher</span>}
                  </td>
                  <td style={{ ...cell, textAlign: 'right' }}>{l.kwh?.toFixed(2)} €</td>
                  <td style={{ ...cell, textAlign: 'right', fontWeight: 700 }}>≈ {(l.prix as number).toFixed(2)} €</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 8 }}>
        Tarifs €/kWh issus du comparateur de cartes Moteurs.com (indicatifs). Recharge réelle facturée à l’énergie.
      </p>
    </section>
  )
}
