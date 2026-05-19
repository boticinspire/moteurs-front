'use client'

import { useState, useEffect, useMemo } from 'react'

// ── Types ─────────────────────────────────────────────────────────────────────

interface Tarifs {
  ac_slow?:   { modele?: string; prix?: number; frais_session?: number }
  dc_rapide?: { modele?: string; prix?: number; frais_session?: number }
  dc_ultra?:  { modele?: string; prix?: number; frais_session?: number }
}

interface Roaming {
  disponible?: boolean
  pays_couverts?: string[]
  tarif_dc_rapide?: { prix?: number }
  tarif_dc_ultra?:  { prix?: number }
}

interface Carte {
  id: string
  nom: string
  operateur: string
  pays_origine: string[]
  ideal_voyage: boolean
  ideal_quotidien: boolean
  flotte_pro: boolean
  points_forts: string[]
  points_faibles: string[]
  donnees: {
    abonnement?: { mensuel_eur?: number; annuel_eur?: number; engagement_mois?: number }
    tarifs_fr?: Tarifs
    tarifs_be?: Tarifs
    roaming?: Roaming
  }
}

interface ProfilParticulier {
  kmMoisPublic: number
  pctDC: number
  voyagesEU: number   // 0 = jamais, 1 = 1-2/an, 2 = 3+/an
}

interface ProfilFlotte {
  nbVehicules: number
  kmMoisPublicParVehicule: number
  pctDC: number
  voyagesEU: number
}

// ── Calcul coût mensuel ────────────────────────────────────────────────────────

function getTarifs(carte: Carte): Tarifs {
  return carte.donnees?.tarifs_fr || carte.donnees?.tarifs_be || {}
}

function calculerCoutParticulier(carte: Carte, p: ProfilParticulier): number | null {
  const tarifs = getTarifs(carte)
  const roaming = carte.donnees?.roaming || {}
  const abo = carte.donnees?.abonnement?.mensuel_eur || 0

  const kwhTotal = p.kmMoisPublic * 0.20
  const kwhAC = kwhTotal * (1 - p.pctDC / 100)
  const kwhDC = kwhTotal * (p.pctDC / 100)

  // AC
  const tarifAC = tarifs.ac_slow?.prix
  const fraisAC = tarifs.ac_slow?.frais_session || 0
  const sessionsAC = kwhAC > 0 ? Math.ceil(kwhAC / 15) : 0
  const coutAC = tarifAC != null ? kwhAC * tarifAC + sessionsAC * fraisAC : 0

  // DC
  const tarifDC = tarifs.dc_rapide?.prix ?? tarifs.dc_ultra?.prix
  const fraisDC = tarifs.dc_rapide?.frais_session || 0
  const sessionsDC = kwhDC > 0 ? Math.ceil(kwhDC / 45) : 0
  const coutDC = tarifDC != null ? kwhDC * tarifDC + sessionsDC * fraisDC : 0

  // Roaming (voyages EU)
  const sessionsRoamingMois = p.voyagesEU === 0 ? 0 : p.voyagesEU === 1 ? 1.5 * 6 / 12 : 3 * 6 / 12
  // 6 sessions DC par voyage, ramené en mensuel
  let coutRoaming = 0
  if (sessionsRoamingMois > 0) {
    if (roaming.disponible && roaming.tarif_dc_rapide?.prix != null) {
      coutRoaming = sessionsRoamingMois * 45 * roaming.tarif_dc_rapide.prix
    } else if (!roaming.disponible) {
      // Pas de roaming → tarif spot moyen marché pénalisé
      coutRoaming = sessionsRoamingMois * 45 * 0.75
    }
  }

  return Math.round((abo + coutAC + coutDC + coutRoaming) * 10) / 10
}

function calculerCoutFlotte(carte: Carte, p: ProfilFlotte): number | null {
  const individuel = calculerCoutParticulier(carte, {
    kmMoisPublic: p.kmMoisPublicParVehicule,
    pctDC: p.pctDC,
    voyagesEU: p.voyagesEU,
  })
  if (individuel === null) return null
  // Abonnement : certaines cartes flotte ont un abonnement par véhicule
  return Math.round(individuel * p.nbVehicules * 10) / 10
}

// ── Helpers UI ────────────────────────────────────────────────────────────────

const PRIMARY = 'var(--color-primary)'
const BORDER  = 'var(--color-border)'
const BG_CARD = 'var(--color-bg-card)'
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

function Slider({ label, min, max, step, value, onChange, unit = '' }:
  { label: string; min: number; max: number; step: number; value: number; onChange: (v: number) => void; unit?: string }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: '0.88rem' }}>
        <span style={{ color: 'var(--color-text)', fontWeight: 500 }}>{label}</span>
        <span style={{ color: PRIMARY, fontWeight: 700 }}>{value}{unit}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(Number(e.target.value))}
        style={{ width: '100%', accentColor: 'var(--color-primary)' }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: MUTED, marginTop: 2 }}>
        <span>{min}{unit}</span><span>{max}{unit}</span>
      </div>
    </div>
  )
}

function PrixCell({ prix }: { prix?: number | null }) {
  if (prix == null) return <span style={{ color: MUTED, fontSize: '0.8rem' }}>—</span>
  return <span style={{ fontWeight: 600 }}>{prix.toFixed(2)} €/kWh</span>
}

// ── Composant principal ────────────────────────────────────────────────────────

export default function ComparateurCartes() {
  const [cartes, setCartes] = useState<Carte[]>([])
  const [loading, setLoading] = useState(true)
  const [onglet, setOnglet] = useState<'particulier' | 'flotte'>('particulier')
  const [vue, setVue] = useState<'calcul' | 'tableau'>('calcul')

  // Profil particulier
  const [kmMois, setKmMois] = useState(200)
  const [pctDC, setPctDC] = useState(30)
  const [voyages, setVoyages] = useState(1) // 0/1/2

  // Profil flotte
  const [nbVeh, setNbVeh] = useState(5)
  const [kmVeh, setKmVeh] = useState(500)
  const [pctDCFlotte, setPctDCFlotte] = useState(40)
  const [voyagesFlotte, setVoyagesFlotte] = useState(0)

  // Filtre tableau
  const [filtrePays, setFiltrePays] = useState<'FR' | 'BE' | 'tous'>('FR')

  useEffect(() => {
    fetch('/api/cartes-recharge')
      .then(r => r.json())
      .then(d => { setCartes(d.cartes || []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  // Calcul et classement
  const resultats = useMemo(() => {
    if (!cartes.length) return []
    return cartes
      .map(c => {
        const cout = onglet === 'particulier'
          ? calculerCoutParticulier(c, { kmMoisPublic: kmMois, pctDC, voyagesEU: voyages })
          : calculerCoutFlotte(c, { nbVehicules: nbVeh, kmMoisPublicParVehicule: kmVeh, pctDC: pctDCFlotte, voyagesEU: voyagesFlotte })
        return { carte: c, cout }
      })
      .filter(r => r.cout !== null)
      .sort((a, b) => (a.cout ?? 999) - (b.cout ?? 999))
  }, [cartes, onglet, kmMois, pctDC, voyages, nbVeh, kmVeh, pctDCFlotte, voyagesFlotte])

  const cartesFiltrees = useMemo(() => {
    if (filtrePays === 'tous') return cartes
    return cartes.filter(c => c.pays_origine?.includes(filtrePays))
  }, [cartes, filtrePays])

  const voyagesLabel = ['Jamais', '1–2 fois/an', '3+ fois/an']

  if (loading) return (
    <div style={{ textAlign: 'center', padding: '60px 0', color: MUTED }}>
      Chargement des cartes de recharge…
    </div>
  )

  if (!cartes.length) return (
    <div style={{ textAlign: 'center', padding: '60px 0', color: MUTED }}>
      Données temporairement indisponibles. Réessayez dans quelques instants.
    </div>
  )

  return (
    <div>
      {/* ── Onglets Particulier / Flotte ─────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 32 }}>
        {(['particulier', 'flotte'] as const).map(o => (
          <button key={o} onClick={() => setOnglet(o)} style={{
            padding: '10px 24px', borderRadius: 8, fontWeight: 600, fontSize: '0.9rem',
            border: `1.5px solid ${onglet === o ? PRIMARY : BORDER}`,
            background: onglet === o ? `color-mix(in srgb, ${PRIMARY} 10%, transparent)` : 'transparent',
            color: onglet === o ? PRIMARY : MUTED, cursor: 'pointer',
          }}>
            {o === 'particulier' ? '👤 Particulier' : '🏢 Flotte Pro'}
          </button>
        ))}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          {(['calcul', 'tableau'] as const).map(v => (
            <button key={v} onClick={() => setVue(v)} style={{
              padding: '10px 18px', borderRadius: 8, fontWeight: 500, fontSize: '0.85rem',
              border: `1px solid ${vue === v ? PRIMARY : BORDER}`,
              background: vue === v ? `color-mix(in srgb, ${PRIMARY} 8%, transparent)` : 'transparent',
              color: vue === v ? PRIMARY : MUTED, cursor: 'pointer',
            }}>
              {v === 'calcul' ? '🧮 Calculateur' : '📊 Tableau'}
            </button>
          ))}
        </div>
      </div>

      {/* ── Vue Calculateur ──────────────────────────────────────────────── */}
      {vue === 'calcul' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(260px,320px) 1fr', gap: 32, alignItems: 'start' }}>

          {/* Panneau paramètres */}
          <div style={{ background: BG_CARD, border: `1px solid ${BORDER}`, borderRadius: 14, padding: 24 }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 20 }}>
              {onglet === 'particulier' ? '👤 Votre profil' : '🏢 Votre flotte'}
            </h3>

            {onglet === 'particulier' ? (
              <>
                <Slider label="km/mois en recharge publique" min={0} max={1500} step={25} value={kmMois} onChange={setKmMois} unit=" km" />
                <Slider label="Part de recharge DC rapide" min={0} max={100} step={5} value={pctDC} onChange={setPctDC} unit="%" />
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: '0.88rem', fontWeight: 500, marginBottom: 8 }}>Voyages UE en voiture</div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {voyagesLabel.map((l, i) => (
                      <button key={i} onClick={() => setVoyages(i)} style={{
                        flex: 1, padding: '7px 4px', borderRadius: 6, fontSize: '0.75rem', fontWeight: 600,
                        border: `1.5px solid ${voyages === i ? PRIMARY : BORDER}`,
                        background: voyages === i ? `color-mix(in srgb, ${PRIMARY} 10%, transparent)` : 'transparent',
                        color: voyages === i ? PRIMARY : MUTED, cursor: 'pointer',
                      }}>
                        {l}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <>
                <Slider label="Nombre de véhicules" min={1} max={50} step={1} value={nbVeh} onChange={setNbVeh} unit=" véh." />
                <Slider label="km/mois en public par véhicule" min={0} max={2000} step={50} value={kmVeh} onChange={setKmVeh} unit=" km" />
                <Slider label="Part DC rapide" min={0} max={100} step={5} value={pctDCFlotte} onChange={setPctDCFlotte} unit="%" />
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: '0.88rem', fontWeight: 500, marginBottom: 8 }}>Missions EU régulières</div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {['Non', 'Occasionnel', 'Fréquent'].map((l, i) => (
                      <button key={i} onClick={() => setVoyagesFlotte(i)} style={{
                        flex: 1, padding: '7px 4px', borderRadius: 6, fontSize: '0.75rem', fontWeight: 600,
                        border: `1.5px solid ${voyagesFlotte === i ? PRIMARY : BORDER}`,
                        background: voyagesFlotte === i ? `color-mix(in srgb, ${PRIMARY} 10%, transparent)` : 'transparent',
                        color: voyagesFlotte === i ? PRIMARY : MUTED, cursor: 'pointer',
                      }}>
                        {l}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            <div style={{ fontSize: '0.75rem', color: MUTED, lineHeight: 1.5, padding: '12px', background: 'var(--color-bg-alt)', borderRadius: 8 }}>
              💡 Hypothèses : 20 kWh/100 km, sessions AC = 15 kWh, sessions DC = 45 kWh.
              Estimation indicative — vérifiez les tarifs officiels avant de souscrire.
            </div>
          </div>

          {/* Résultats classés */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {resultats.map((r, i) => {
              const isWinner = i === 0
              const tarifs = getTarifs(r.carte)
              const roaming = r.carte.donnees?.roaming
              return (
                <div key={r.carte.id} style={{
                  background: BG_CARD,
                  border: `${isWinner ? '2px' : '1px'} solid ${isWinner ? PRIMARY : BORDER}`,
                  borderRadius: 12, padding: '18px 20px',
                  display: 'grid', gridTemplateColumns: '1fr auto', gap: 12, alignItems: 'center',
                }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                      {isWinner && <span style={{ fontSize: '1rem' }}>🏆</span>}
                      <span style={{ fontWeight: 700, fontSize: '1rem' }}>{r.carte.nom}</span>
                      <span style={{ fontSize: '0.78rem', color: MUTED }}>{r.carte.operateur}</span>
                    </div>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {r.carte.ideal_voyage && <Badge>✈️ Voyage EU</Badge>}
                      {r.carte.flotte_pro && <Badge color="#8b5cf6">🏢 Flotte</Badge>}
                      {(r.carte.donnees?.abonnement?.mensuel_eur || 0) === 0 && <Badge color="#f59e0b">Sans abo</Badge>}
                      {roaming?.disponible && <Badge color="#06b6d4">Roaming {roaming.pays_couverts?.length || 0} pays</Badge>}
                    </div>
                    {r.carte.points_forts?.length > 0 && (
                      <div style={{ fontSize: '0.8rem', color: MUTED, marginTop: 6 }}>
                        {r.carte.points_forts[0]}
                      </div>
                    )}
                  </div>
                  <div style={{ textAlign: 'right', minWidth: 110 }}>
                    <div style={{ fontSize: '1.5rem', fontWeight: 800, color: isWinner ? PRIMARY : 'var(--color-text)' }}>
                      {r.cout?.toFixed(0)} €
                    </div>
                    <div style={{ fontSize: '0.75rem', color: MUTED }}>
                      {onglet === 'flotte' ? `/ mois (${nbVeh} véh.)` : '/ mois estimé'}
                    </div>
                    <a href={`https://${r.carte.url_officielle?.replace('https://', '')}`}
                      target="_blank" rel="noopener noreferrer"
                      style={{ fontSize: '0.78rem', color: PRIMARY, fontWeight: 600, textDecoration: 'none', display: 'block', marginTop: 4 }}>
                      Voir l'offre →
                    </a>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Vue Tableau ──────────────────────────────────────────────────── */}
      {vue === 'tableau' && (
        <div>
          {/* Filtres */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.85rem', color: MUTED, alignSelf: 'center' }}>Pays :</span>
            {(['FR', 'BE', 'tous'] as const).map(p => (
              <button key={p} onClick={() => setFiltrePays(p)} style={{
                padding: '5px 14px', borderRadius: 20, fontSize: '0.8rem', fontWeight: 600,
                border: `1px solid ${filtrePays === p ? PRIMARY : BORDER}`,
                background: filtrePays === p ? `color-mix(in srgb, ${PRIMARY} 10%, transparent)` : 'transparent',
                color: filtrePays === p ? PRIMARY : MUTED, cursor: 'pointer',
              }}>
                {p === 'tous' ? '🌍 Tous' : p === 'FR' ? '🇫🇷 France' : '🇧🇪 Belgique'}
              </button>
            ))}
          </div>

          {/* Tableau */}
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ borderBottom: `2px solid ${BORDER}` }}>
                  {['Carte', 'Abo/mois', 'AC ≤22 kW', 'DC 50–150 kW', 'DC ≥150 kW', 'Roaming DC', 'Idéal pour'].map(h => (
                    <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 600, color: MUTED, fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {cartesFiltrees.map((c, i) => {
                  const tarifs = getTarifs(c)
                  const roaming = c.donnees?.roaming
                  const abo = c.donnees?.abonnement?.mensuel_eur || 0
                  return (
                    <tr key={c.id} style={{ borderBottom: `1px solid ${BORDER}`, background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)' }}>
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ fontWeight: 700 }}>{c.nom}</div>
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
          <p style={{ fontSize: '0.78rem', color: MUTED, marginTop: 16 }}>
            Tarifs indicatifs 2026 — vérifiez les conditions sur le site de chaque opérateur avant de souscrire.
          </p>
        </div>
      )}
    </div>
  )
}
