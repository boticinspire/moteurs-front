/**
 * Bloc "résultat de calcul" pour les pages /trajet/[slug].
 * Server component — calcule au build, pas d'interactivité ici.
 */

import { calculerTousVehicules, fmtEur, fmtDuree, type Route, type MotorisationTrajet } from '@/lib/trajet'

interface Props {
  route: Route
  /** Si défini, filtre l'affichage sur cette motorisation et la met en avant. */
  motorisationFocus?: MotorisationTrajet
  /** Si true, retire les péages du calcul (variante "sans-peage"). */
  sansPeages?: boolean
}

export default function CalculTrajet({ route, motorisationFocus, sansPeages = false }: Props) {
  const routeCalc: Route = sansPeages ? { ...route, peages_eur: 0, duree_base_min: route.duree_base_min + 60 } : route
  const resultats = calculerTousVehicules(routeCalc)
  const gagnant = resultats[0]
  const focus = motorisationFocus ? resultats.find(r => r.id === motorisationFocus) : undefined
  const principal = focus ?? gagnant

  // CO2 approximatif par motorisation (kgCO2/L ou kgCO2/kWh)
  const co2Factor: Record<MotorisationTrajet, { unit: 'L' | 'kWh'; conso100: number; factor: number }> = {
    diesel:  { unit: 'L', conso100: 6.0,  factor: 2.65 },
    essence: { unit: 'L', conso100: 7.5,  factor: 2.31 },
    elec:    { unit: 'kWh', conso100: 20, factor: 0.06 }, // mix EU 2026 ≈ 60 gCO2/kWh
    phev:    { unit: 'L', conso100: 5.0,  factor: 1.80 },
  }
  const co2Kg = (mot: MotorisationTrajet): number => {
    const f = co2Factor[mot]
    return Math.round((f.conso100 / 100) * route.distance_km * f.factor)
  }

  return (
    <section style={{ marginTop: 28, marginBottom: 36 }}>
      {/* Résumé principal */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(122,240,194,0.06), rgba(122,240,194,0.02))',
        border: '1px solid rgba(122,240,194,0.2)',
        borderRadius: 14, padding: '22px 24px', marginBottom: 24,
      }}>
        <div style={{ fontSize: '0.8rem', color: 'var(--color-primary)', fontWeight: 600, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {focus ? `Coût en ${principal.label}` : 'Motorisation la plus économique'}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 16 }}>
          <Stat label="Distance"  value={`${route.distance_km} km`} />
          <Stat label="Durée"     value={fmtDuree(principal.duree_min)} />
          <Stat label="Énergie"   value={fmtEur(principal.cout_energie)} />
          <Stat label="Péages"    value={sansPeages ? 'Évités' : fmtEur(principal.cout_peages)} />
          <Stat label="Total"     value={fmtEur(principal.cout_total)} highlight />
          <Stat label="CO₂ trajet" value={`${co2Kg(principal.id)} kg`} />
        </div>
        {principal.nb_arrets_recharge > 0 && (
          <div style={{ marginTop: 14, fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
            ⚡ {principal.nb_arrets_recharge} arrêt(s) de recharge prévu(s) sur le trajet — {fmtDuree(principal.temps_recharge_min)} ajouté(s) à la durée.
          </div>
        )}
      </div>

      {/* Tableau comparatif */}
      <h2 style={{ fontSize: '1.1rem', marginBottom: 14 }}>
        Comparatif détaillé toutes motorisations
      </h2>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid var(--color-border)' }}>
              <th style={th}>Motorisation</th>
              <th style={thRight}>Énergie</th>
              <th style={thRight}>Péages</th>
              <th style={thRight}>CO₂</th>
              <th style={thRight}>Durée</th>
              <th style={thRight}>Total aller</th>
            </tr>
          </thead>
          <tbody>
            {resultats.map(r => (
              <tr key={r.id} style={{
                borderBottom: '1px solid var(--color-border)',
                background: r.gagnant ? 'rgba(5,150,105,0.05)' : 'transparent',
              }}>
                <td style={{ ...td, fontWeight: r.gagnant ? 700 : 400 }}>
                  {r.emoji} {r.label}
                  {r.gagnant && <span style={{ marginLeft: 6, color: '#059669', fontSize: '0.74rem' }}>✓ moins cher</span>}
                </td>
                <td style={tdRight}>{fmtEur(r.cout_energie)}</td>
                <td style={tdRight}>{sansPeages ? '—' : fmtEur(r.cout_peages)}</td>
                <td style={tdRight}>{co2Kg(r.id)} kg</td>
                <td style={tdRight}>{fmtDuree(r.duree_min)}</td>
                <td style={{ ...tdRight, fontWeight: 700 }}>{fmtEur(r.cout_total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', marginTop: 12, lineHeight: 1.5 }}>
        Calculs basés sur les consommations autoroute réelles (cycle WLTP + correctif) et les prix énergie 2026
        mis à jour par notre Agent Simulateur. CO₂ : facteurs d\'émission moyens européens 2026 (ADEME / EEA).
      </p>
    </section>
  )
}

// ─── Sous-composants ──────────────────────────────────────────────────────────

function Stat({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div>
      <div style={{ fontSize: '0.74rem', color: 'var(--color-text-muted)', marginBottom: 4 }}>{label}</div>
      <div style={{ fontWeight: 700, fontSize: highlight ? '1.25rem' : '1rem', color: highlight ? 'var(--color-primary)' : undefined }}>
        {value}
      </div>
    </div>
  )
}

const th: React.CSSProperties        = { padding: '10px 12px', textAlign: 'left',  color: 'var(--color-text-muted)', fontWeight: 600 }
const thRight: React.CSSProperties   = { padding: '10px 12px', textAlign: 'right', color: 'var(--color-text-muted)', fontWeight: 600 }
const td: React.CSSProperties        = { padding: '11px 12px' }
const tdRight: React.CSSProperties   = { padding: '11px 12px', textAlign: 'right' }
