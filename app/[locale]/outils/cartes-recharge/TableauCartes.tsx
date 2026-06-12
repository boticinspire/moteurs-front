import type { Carte, Tarifs } from '@/lib/cartes-recharge'
import { getTarifs } from '@/lib/cartes-recharge'
import FiltrePaysCartes from './FiltrePaysCartes'

// Server Component : le tableau est rendu en HTML statique (indexable).
// Seul le filtre pays est un îlot client (optionnel).

const PRIMARY = 'var(--color-primary)'
const BORDER  = 'var(--color-border)'
const MUTED   = 'var(--color-text-muted)'

function Badge({ children, color = PRIMARY }: { children: React.ReactNode; color?: string }) {
  return (
    <span style={{
      fontSize: '0.72rem', fontWeight: 600, padding: '2px 8px', borderRadius: 4,
      background: `color-mix(in srgb, ${color} 12%, transparent)`,
      color, border: `1px solid color-mix(in srgb, ${color} 30%, transparent)`,
    }}>
      {children}
    </span>
  )
}

function PrixCell({ prix }: { prix?: number | null }) {
  if (prix == null) return <span style={{ color: MUTED, fontSize: '0.8rem' }}>—</span>
  return <span style={{ fontWeight: 600 }}>{prix.toFixed(2)} €/kWh</span>
}

interface TableauCartesProps {
  cartes: Carte[]
  heading?: string
  subtitle?: string
  showFiltrePays?: boolean
}

export default function TableauCartes({
  cartes,
  heading = 'Tableau comparatif des cartes de recharge',
  subtitle,
  showFiltrePays = true,
}: TableauCartesProps) {
  if (!cartes.length) return null

  const defaultSubtitle = `Tarifs au kWh par type de borne (AC lent, DC rapide, DC ultra-rapide) et abonnement mensuel, pour ${cartes.length} cartes en France et en Belgique.`

  return (
    <section style={{ marginTop: 56 }}>
      <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: 6 }}>
        {heading}
      </h2>
      <p style={{ color: MUTED, fontSize: '0.9rem', marginBottom: 18 }}>
        {subtitle ?? defaultSubtitle}
      </p>

      {showFiltrePays && <FiltrePaysCartes />}

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
          <thead>
            <tr style={{ borderBottom: `2px solid ${BORDER}` }}>
              {['Carte', 'Abo/mois', 'AC ≤22 kW', 'DC 50–150 kW', 'DC ≥150 kW', 'Roaming DC', 'Idéal pour'].map((h) => (
                <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 600, color: MUTED, fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {cartes.map((c, i) => {
              const tarifs: Tarifs = getTarifs(c)
              const roaming = c.donnees?.roaming
              const abo = c.donnees?.abonnement?.mensuel_eur || 0
              return (
                <tr key={c.id} data-pays={(c.pays_origine || []).join(',')} style={{ borderBottom: `1px solid ${BORDER}`, background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)' }}>
                  <td style={{ padding: '12px 14px' }}>
                    <div style={{ fontWeight: 700 }}>
                      <a href={`/outils/cartes-recharge/${c.id}`} style={{ color: 'var(--color-text)', textDecoration: 'none' }}>{c.nom}</a>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: MUTED }}>{c.operateur}</div>
                  </td>
                  <td style={{ padding: '12px 14px' }}>
                    {abo === 0 ? <span style={{ color: '#22c55e', fontWeight: 600 }}>Gratuit</span> : <span style={{ fontWeight: 600 }}>{abo} €</span>}
                  </td>
                  <td style={{ padding: '12px 14px' }}><PrixCell prix={tarifs.ac_slow?.prix} /></td>
                  <td style={{ padding: '12px 14px' }}><PrixCell prix={tarifs.dc_rapide?.prix} /></td>
                  <td style={{ padding: '12px 14px' }}><PrixCell prix={tarifs.dc_ultra?.prix} /></td>
                  <td style={{ padding: '12px 14px' }}>
                    {roaming?.disponible
                      ? <PrixCell prix={roaming.tarif_dc_rapide?.prix} />
                      : <span style={{ color: MUTED, fontSize: '0.8rem' }}>Non</span>}
                  </td>
                  <td style={{ padding: '12px 14px' }}>
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                      {c.ideal_voyage && <Badge>✈️ Voyage</Badge>}
                      {c.ideal_quotidien && <Badge color="#f59e0b">🏠 Quotidien</Badge>}
                      {c.flotte_pro && <Badge color="#8b5cf6">🏢 Flotte</Badge>}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </section>
  )
}
