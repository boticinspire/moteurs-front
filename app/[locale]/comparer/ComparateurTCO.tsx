'use client'

import { useState, useMemo } from 'react'
import {
  calculTCO, getMotors, getSegments,
  MOTOR_LABELS, MOTOR_COLORS, SEGMENT_LABELS,
  fmtEur, fmtEurM,
  type Segment, type Profil, type Pays, type Motor, type TcoResult,
} from '@/lib/tco'

// ─── Constantes ───────────────────────────────────────────────────────────────

const PAYS_OPTIONS: { value: Pays; label: string }[] = [
  { value: 'FR', label: 'France' },
  { value: 'BE', label: 'Belgique' },
  { value: 'CH', label: 'Suisse' },
  { value: 'CA', label: 'Canada' },
]

const DUREES = [36, 48, 60]
const KM_DEFAULT = 25000

// ─── Sous-composants ──────────────────────────────────────────────────────────

function ToggleGroup<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[]
  value: T
  onChange: (v: T) => void
}) {
  return (
    <div className="toggle-group">
      {options.map((o) => (
        <button
          key={o.value}
          className={value === o.value ? 'active' : ''}
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

// Barre stacked pour la décomposition du TCO
function TcoBars({ result, maxTotal }: { result: TcoResult; maxTotal: number }) {
  if (!result.available) return null
  const pct = (v: number) => Math.round((v / maxTotal) * 100)
  const bars = [
    { label: 'Achat net', value: result.prixNet,     color: '#3b82f6' },
    { label: 'Énergie',   value: result.coutEnergie, color: '#f59e0b' },
    { label: 'Entretien', value: result.coutMaint,   color: '#8b5cf6' },
  ]
  return (
    <div style={{ height: 10, display: 'flex', borderRadius: 6, overflow: 'hidden', gap: 1 }}>
      {bars.map((b) => (
        <div
          key={b.label}
          title={`${b.label} : ${fmtEur(b.value)}`}
          style={{
            width: `${pct(b.value)}%`,
            background: b.color,
            minWidth: pct(b.value) > 0 ? 4 : 0,
          }}
        />
      ))}
    </div>
  )
}

// Carte d'une motorisation
function MotorCard({
  result,
  maxTotal,
  isBest,
}: {
  result: TcoResult
  maxTotal: number
  isBest: boolean
}) {
  const color = MOTOR_COLORS[result.motor] ?? '#6b7280'

  if (!result.available) {
    return (
      <div
        style={{
          padding: '18px 20px',
          borderRadius: 10,
          border: '1px solid var(--color-border)',
          background: 'var(--color-bg-alt)',
          opacity: 0.5,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
          <span
            style={{
              display: 'inline-block',
              width: 12,
              height: 12,
              borderRadius: '50%',
              background: color,
            }}
          />
          <strong style={{ fontSize: '0.95rem' }}>{result.label}</strong>
        </div>
        <p style={{ fontSize: '0.8rem', color: 'var(--color-text-soft)', margin: 0 }}>
          Non disponible sur ce segment
        </p>
      </div>
    )
  }

  return (
    <div
      style={{
        padding: '18px 20px',
        borderRadius: 10,
        border: isBest
          ? `2px solid ${color}`
          : '1px solid var(--color-border)',
        background: isBest ? `${color}12` : 'var(--color-bg-alt)',
        position: 'relative',
      }}
    >
      {isBest && (
        <span
          style={{
            position: 'absolute',
            top: -1,
            right: 12,
            background: color,
            color: '#fff',
            fontSize: '0.68rem',
            fontWeight: 700,
            padding: '2px 8px',
            borderRadius: '0 0 6px 6px',
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
          }}
        >
          ✓ Moins cher
        </span>
      )}

      {/* En-tête motorisation */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
        <span
          style={{
            display: 'inline-block',
            width: 12,
            height: 12,
            borderRadius: '50%',
            background: color,
            flexShrink: 0,
          }}
        />
        <strong style={{ fontSize: '0.95rem' }}>{result.label}</strong>
      </div>

      {/* Chiffres clés */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '8px 16px',
          marginBottom: 14,
          fontSize: '0.82rem',
        }}
      >
        <div>
          <div style={{ color: 'var(--color-text-soft)', marginBottom: 1 }}>Achat net</div>
          <div style={{ fontWeight: 600 }}>{fmtEur(result.prixNet)}</div>
        </div>
        <div>
          <div style={{ color: 'var(--color-text-soft)', marginBottom: 1 }}>Énergie</div>
          <div style={{ fontWeight: 600 }}>{fmtEur(result.coutEnergie)}</div>
        </div>
        <div>
          <div style={{ color: 'var(--color-text-soft)', marginBottom: 1 }}>Entretien</div>
          <div style={{ fontWeight: 600 }}>{fmtEur(result.coutMaint)}</div>
        </div>
        {result.aides > 0 && (
          <div>
            <div style={{ color: 'var(--color-text-soft)', marginBottom: 1 }}>Aides</div>
            <div style={{ fontWeight: 600, color: '#059669' }}>−{fmtEur(result.aides)}</div>
          </div>
        )}
      </div>

      {/* Barre de composition */}
      <TcoBars result={result} maxTotal={maxTotal} />

      {/* Total */}
      <div
        style={{
          marginTop: 14,
          paddingTop: 12,
          borderTop: '1px solid var(--color-border)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
        }}
      >
        <div>
          <div style={{ fontSize: '0.72rem', color: 'var(--color-text-soft)', marginBottom: 2 }}>
            TCO total
          </div>
          <div style={{ fontWeight: 800, fontSize: '1.15rem' }}>{fmtEur(result.total)}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '0.72rem', color: 'var(--color-text-soft)', marginBottom: 2 }}>
            Mensuel
          </div>
          <div
            style={{
              fontWeight: 700,
              fontSize: '1.05rem',
              color: isBest ? color : 'inherit',
            }}
          >
            {fmtEurM(result.coutMensuel)}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Composant principal ───────────────────────────────────────────────────────

export default function ComparateurTCO() {
  const [profil, setProfil]       = useState<Profil>('B2B')
  const [pays, setPays]           = useState<Pays>('FR')
  const [segment, setSegment]     = useState<Segment>('vul_moyen')
  const [duree, setDuree]         = useState(48)
  const [kmAn, setKmAn]           = useState(KM_DEFAULT)
  const [profilCond, setProfilCond] = useState<'urbain'|'mixte'|'route'|'autoroute'>('mixte')
  const [charge, setCharge]       = useState<'vide'|'standard'|'pleine'>('standard')
  const [pctHiver, setPctHiver]   = useState(25)
  const [tauxPhev, setTauxPhev]   = useState(50)

  // Quand le profil change → réinitialise le segment au premier disponible
  const segments = useMemo(() => getSegments(profil), [profil])

  const handleProfilChange = (p: Profil) => {
    setProfil(p)
    const segs = getSegments(p)
    if (!segs.includes(segment as Segment)) setSegment(segs[0])
  }

  const motors = useMemo(() => getMotors(segment, profil), [segment, profil])

  const results = useMemo<TcoResult[]>(() => {
    return motors.map((motor: Motor) =>
      calculTCO({
        segment,
        motor,
        profil,
        pays,
        km_an: kmAn,
        duree_mois: duree,
        profil_conduite: profilCond,
        charge,
        pct_hiver: pctHiver,
        taux_recharge_phev: tauxPhev,
      })
    )
  }, [segment, profil, pays, kmAn, duree, profilCond, charge, pctHiver, tauxPhev, motors])

  const availableResults = results.filter((r) => r.available)
  const maxTotal = Math.max(...availableResults.map((r) => r.total), 1)
  const bestTotal = Math.min(...availableResults.map((r) => r.total))

  const sorted = [...results].sort((a, b) => {
    if (!a.available) return 1
    if (!b.available) return -1
    return a.total - b.total
  })

  return (
    <div className="simulator-grid">
      {/* ── Contrôles ── */}
      <aside className="simulator-controls">
        <h3>Profil</h3>
        <ToggleGroup<Profil>
          options={[{ value: 'B2B', label: 'B2B' }, { value: 'Particulier', label: 'Particulier' }]}
          value={profil}
          onChange={handleProfilChange}
        />

        <div className="form-group" style={{ marginTop: 18 }}>
          <label htmlFor="cmp-pays">Pays</label>
          <select id="cmp-pays" value={pays} onChange={(e) => setPays(e.target.value as Pays)}>
            {PAYS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="cmp-segment">Segment</label>
          <select
            id="cmp-segment"
            value={segment}
            onChange={(e) => setSegment(e.target.value as Segment)}
          >
            {segments.map((s) => (
              <option key={s} value={s}>{SEGMENT_LABELS[s]}</option>
            ))}
          </select>
        </div>

        <h3 style={{ marginTop: 20 }}>Durée d&apos;exploitation</h3>
        <ToggleGroup<string>
          options={DUREES.map((d) => ({ value: String(d), label: `${d} mois` }))}
          value={String(duree)}
          onChange={(v) => setDuree(Number(v))}
        />

        <div className="form-group" style={{ marginTop: 18 }}>
          <label htmlFor="cmp-km">Kilométrage annuel</label>
          <input
            id="cmp-km"
            type="number"
            min={1000}
            step={1000}
            value={kmAn}
            onChange={(e) => setKmAn(Number(e.target.value))}
          />
        </div>

        <h3 style={{ marginTop: 20 }}>Profil d&apos;usage</h3>

        <div className="form-group">
          <label htmlFor="cmp-cond">Profil de conduite</label>
          <select
            id="cmp-cond"
            value={profilCond}
            onChange={(e) => setProfilCond(e.target.value as typeof profilCond)}
          >
            <option value="urbain">Urbain pur</option>
            <option value="mixte">Mixte (référence)</option>
            <option value="route">Route</option>
            <option value="autoroute">Autoroute</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="cmp-charge">Charge utile</label>
          <select
            id="cmp-charge"
            value={charge}
            onChange={(e) => setCharge(e.target.value as typeof charge)}
          >
            <option value="vide">Vide (&lt; 20 %)</option>
            <option value="standard">Standard (50 %)</option>
            <option value="pleine">Pleine (&gt; 80 %)</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="cmp-hiver">
            Roulage hivernal : <strong>{pctHiver} %</strong>
          </label>
          <input
            id="cmp-hiver"
            type="range"
            min={0}
            max={100}
            step={5}
            value={pctHiver}
            onChange={(e) => setPctHiver(Number(e.target.value))}
            style={{ width: '100%' }}
          />
        </div>

        <div className="form-group">
          <label htmlFor="cmp-phev">
            Taux recharge PHEV : <strong>{tauxPhev} %</strong>
          </label>
          <input
            id="cmp-phev"
            type="range"
            min={0}
            max={100}
            step={5}
            value={tauxPhev}
            onChange={(e) => setTauxPhev(Number(e.target.value))}
            style={{ width: '100%' }}
          />
        </div>

        {/* Légende barres */}
        <div
          style={{
            marginTop: 20,
            padding: '12px 14px',
            background: 'var(--color-bg-alt)',
            borderRadius: 8,
            fontSize: '0.78rem',
          }}
        >
          <div style={{ fontWeight: 600, marginBottom: 8 }}>Légende des barres</div>
          {[
            { color: '#3b82f6', label: 'Achat net (après aides)' },
            { color: '#f59e0b', label: 'Énergie sur la durée' },
            { color: '#8b5cf6', label: 'Entretien sur la durée' },
          ].map((b) => (
            <div key={b.label} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <span
                style={{
                  display: 'inline-block',
                  width: 10,
                  height: 10,
                  borderRadius: 2,
                  background: b.color,
                  flexShrink: 0,
                }}
              />
              <span style={{ color: 'var(--color-text-soft)' }}>{b.label}</span>
            </div>
          ))}
        </div>

        <div
          style={{
            marginTop: 12,
            fontSize: '0.75rem',
            color: 'var(--color-text-soft)',
            lineHeight: 1.5,
          }}
        >
          <strong>Disclaimer —</strong> Estimation indicative basée sur des moyennes 2026.
          Vérifiez votre éligibilité aux aides auprès d&apos;un professionnel.
        </div>
      </aside>

      {/* ── Résultats ── */}
      <main className="simulator-results">
        {/* Résumé du gagnant */}
        {availableResults.length > 0 && (() => {
          const winner   = sorted[0]
          const runnerup = sorted.find((r) => r.available && r.total !== bestTotal)
          const gap      = runnerup ? runnerup.total - bestTotal : 0
          return (
            <div
              style={{
                marginBottom: 24,
                padding: '14px 18px',
                background: 'var(--color-bg-alt)',
                borderRadius: 10,
                borderLeft: '3px solid var(--color-primary)',
                fontSize: '0.88rem',
              }}
            >
              <strong>{winner.label}</strong>{' '}
              est la motorisation la moins chère sur ce segment —{' '}
              <strong>{fmtEur(bestTotal)}</strong> sur {duree} mois
              {runnerup && gap > 0 && (
                <>
                  {', soit '}
                  <strong style={{ color: '#059669' }}>−{fmtEur(gap)}</strong>
                  {' par rapport au '}
                  {runnerup.label}
                </>
              )}
            </div>
          )
        })()}

        {/* Grille de cartes */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
            gap: 16,
          }}
        >
          {sorted.map((result) => (
            <MotorCard
              key={result.motor}
              result={result}
              maxTotal={maxTotal}
              isBest={result.available && result.total === bestTotal}
            />
          ))}
        </div>

        {/* Tableau récapitulatif */}
        {availableResults.length > 1 && (
          <div style={{ marginTop: 32, overflowX: 'auto' }}>
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: '0.82rem',
              }}
            >
              <thead>
                <tr style={{ background: 'var(--color-bg-alt)' }}>
                  <th style={{ textAlign: 'left', padding: '10px 12px', fontWeight: 700 }}>
                    Motorisation
                  </th>
                  <th style={{ textAlign: 'right', padding: '10px 12px' }}>Achat net</th>
                  <th style={{ textAlign: 'right', padding: '10px 12px' }}>Énergie</th>
                  <th style={{ textAlign: 'right', padding: '10px 12px' }}>Entretien</th>
                  <th style={{ textAlign: 'right', padding: '10px 12px', fontWeight: 700 }}>
                    TCO total
                  </th>
                  <th style={{ textAlign: 'right', padding: '10px 12px' }}>Mensuel</th>
                </tr>
              </thead>
              <tbody>
                {sorted
                  .filter((r) => r.available)
                  .map((r, i) => (
                    <tr
                      key={r.motor}
                      style={{
                        borderTop: '1px solid var(--color-border)',
                        background: i === 0 ? `${MOTOR_COLORS[r.motor]}0d` : 'transparent',
                      }}
                    >
                      <td style={{ padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span
                          style={{
                            display: 'inline-block',
                            width: 10,
                            height: 10,
                            borderRadius: '50%',
                            background: MOTOR_COLORS[r.motor],
                          }}
                        />
                        {r.label}
                        {i === 0 && (
                          <span
                            style={{
                              fontSize: '0.68rem',
                              background: MOTOR_COLORS[r.motor],
                              color: '#fff',
                              padding: '1px 6px',
                              borderRadius: 4,
                              fontWeight: 700,
                            }}
                          >
                            ✓
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '10px 12px', textAlign: 'right' }}>
                        {fmtEur(r.prixNet)}
                      </td>
                      <td style={{ padding: '10px 12px', textAlign: 'right' }}>
                        {fmtEur(r.coutEnergie)}
                      </td>
                      <td style={{ padding: '10px 12px', textAlign: 'right' }}>
                        {fmtEur(r.coutMaint)}
                      </td>
                      <td
                        style={{
                          padding: '10px 12px',
                          textAlign: 'right',
                          fontWeight: 700,
                        }}
                      >
                        {fmtEur(r.total)}
                      </td>
                      <td style={{ padding: '10px 12px', textAlign: 'right' }}>
                        {fmtEurM(r.coutMensuel)}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  )
}
