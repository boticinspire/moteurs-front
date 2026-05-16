'use client'

import { useState, useMemo } from 'react'
import {
  calculerTousVehicules, calculerTrajet,
  fmtEur, fmtDuree, economieVsGagnant,
  PRIX_ENERGIE,
  type Route, type ResultatTrajet, type MotorisationTrajet,
} from '@/lib/trajet'
import routesData from '@/data/routes-vacances.json'

const ROUTES = routesData as Route[]

// ─── Régions pour le filtre ───────────────────────────────────────────────────

const REGIONS = ['Toutes', ...Array.from(new Set(ROUTES.map(r => r.region).filter(Boolean)))]

// ─── Carte résultat motorisation ──────────────────────────────────────────────

function CarteMotorisation({ res, gagnant, rang }: { res: ResultatTrajet; gagnant: ResultatTrajet; rang: number }) {
  const economie = economieVsGagnant(res, gagnant)
  const isWinner = res.gagnant

  return (
    <div style={{
      background: isWinner ? 'rgba(5,150,105,0.08)' : 'var(--color-bg-card)',
      border: isWinner ? '2px solid #059669' : '1.5px solid var(--color-border)',
      borderRadius: 14,
      padding: '20px 18px',
      position: 'relative',
      transition: 'transform .15s',
    }}>
      {/* Badge gagnant */}
      {isWinner && (
        <div style={{
          position: 'absolute', top: -13, left: '50%', transform: 'translateX(-50%)',
          background: '#059669', color: 'white', borderRadius: 20,
          padding: '3px 14px', fontSize: '0.72rem', fontWeight: 700, whiteSpace: 'nowrap',
          letterSpacing: '0.04em',
        }}>
          🏆 MOINS CHER
        </div>
      )}

      {/* Badge rang */}
      {!isWinner && (
        <div style={{
          position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)',
          background: 'var(--color-bg-dark)', color: 'var(--color-text-muted)',
          border: '1px solid var(--color-border)',
          borderRadius: 20, padding: '2px 12px', fontSize: '0.7rem', fontWeight: 600, whiteSpace: 'nowrap',
        }}>
          +{fmtEur(economie)}
        </div>
      )}

      {/* En-tête */}
      <div style={{ textAlign: 'center', marginTop: 12, marginBottom: 16 }}>
        <div style={{ fontSize: '1.8rem', marginBottom: 4 }}>{res.emoji}</div>
        <div style={{ fontWeight: 700, fontSize: '1rem', color: res.couleur }}>{res.label}</div>
      </div>

      {/* Coût total — chiffre principal */}
      <div style={{ textAlign: 'center', marginBottom: 16 }}>
        <div style={{
          fontSize: '2rem', fontWeight: 800,
          color: isWinner ? '#059669' : 'var(--color-text)',
          lineHeight: 1.1,
        }}>
          {fmtEur(res.cout_total)}
        </div>
        <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', marginTop: 2 }}>
          aller simple
        </div>
      </div>

      {/* Barre décomposition */}
      <div style={{ marginBottom: 14 }}>
        <DecompositionBarre res={res} />
      </div>

      {/* Détails */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <LigneDetail
          label="Énergie"
          value={fmtEur(res.cout_energie)}
          color="#f59e0b"
        />
        <LigneDetail
          label="Péages"
          value={fmtEur(res.cout_peages)}
          color="#8b5cf6"
        />
        <LigneDetail
          label="Durée"
          value={fmtDuree(res.duree_min)}
          color="#3b82f6"
        />
        {res.nb_arrets_recharge > 0 && (
          <div style={{
            marginTop: 4, padding: '6px 10px',
            background: 'rgba(5,150,105,0.08)', borderRadius: 8,
            fontSize: '0.78rem', color: '#059669', textAlign: 'center',
          }}>
            ⚡ {res.nb_arrets_recharge} arrêt{res.nb_arrets_recharge > 1 ? 's' : ''} de recharge (~{res.temps_recharge_min} min)
          </div>
        )}
      </div>

      {/* Détail conso */}
      <div style={{
        marginTop: 12, fontSize: '0.72rem',
        color: 'var(--color-text-muted)', textAlign: 'center',
        borderTop: '1px solid var(--color-border)', paddingTop: 10,
      }}>
        {res.conso_detail}
      </div>
    </div>
  )
}

function DecompositionBarre({ res }: { res: ResultatTrajet }) {
  if (res.cout_total === 0) return null
  const pctEnergie = Math.round((res.cout_energie / res.cout_total) * 100)
  const pctPeages  = 100 - pctEnergie
  return (
    <div style={{ height: 8, display: 'flex', borderRadius: 4, overflow: 'hidden', gap: 1 }}>
      <div style={{ width: `${pctEnergie}%`, background: '#f59e0b' }} title={`Énergie ${pctEnergie}%`} />
      <div style={{ width: `${pctPeages}%`, background: '#8b5cf6' }} title={`Péages ${pctPeages}%`} />
    </div>
  )
}

function LigneDetail({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.84rem' }}>
      <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--color-text-muted)' }}>
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: color, display: 'inline-block', flexShrink: 0 }} />
        {label}
      </span>
      <span style={{ fontWeight: 600 }}>{value}</span>
    </div>
  )
}

// ─── Résumé aller-retour ──────────────────────────────────────────────────────

function ResumeAllerRetour({ resultats }: { resultats: ResultatTrajet[] }) {
  const gagnant = resultats[0]
  const perdant = resultats[resultats.length - 1]
  const econAR = (perdant.cout_total - gagnant.cout_total) * 2
  return (
    <div style={{
      background: 'linear-gradient(135deg, rgba(5,150,105,0.08), rgba(59,130,246,0.06))',
      border: '1px solid rgba(5,150,105,0.25)',
      borderRadius: 14, padding: '18px 22px', marginBottom: 28,
      display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'center', justifyContent: 'space-between',
    }}>
      <div>
        <div style={{ fontWeight: 700, marginBottom: 3 }}>
          ✅ En {gagnant.label}, ce trajet aller-retour vous coûte{' '}
          <span style={{ color: '#059669' }}>{fmtEur(gagnant.cout_total * 2)}</span>
        </div>
        <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
          Soit <strong>{fmtEur(econAR)}</strong> d'économie vs {perdant.label} sur l'aller-retour complet
        </div>
      </div>
      <div style={{ fontSize: '1.5rem' }}>{gagnant.emoji}</div>
    </div>
  )
}

// ─── Composant principal ──────────────────────────────────────────────────────

export default function ComparateurTrajet({ routeInitiale }: { routeInitiale?: Route }) {
  const [mode, setMode] = useState<'populaire' | 'libre'>(routeInitiale ? 'populaire' : 'populaire')
  const [routeSlug, setRouteSlug] = useState<string>(routeInitiale?.slug ?? ROUTES[0].slug)
  const [filtreRegion, setFiltreRegion] = useState('Toutes')

  // Mode libre
  const [libreDepart, setLibreDepart] = useState('')
  const [libreArrivee, setLibreArrivee] = useState('')
  const [libreDistance, setLibreDistance] = useState('')
  const [librePeages, setLibrePeages] = useState('')

  const routeSelectionnee = useMemo<Route | null>(() => {
    if (mode === 'populaire') {
      return ROUTES.find(r => r.slug === routeSlug) ?? ROUTES[0]
    }
    const dist = parseFloat(libreDistance)
    if (!dist || dist <= 0) return null
    return {
      slug: 'libre',
      depart: libreDepart || 'Départ',
      arrivee: libreArrivee || 'Arrivée',
      distance_km: dist,
      peages_eur: parseFloat(librePeages) || Math.round(dist * 0.07),
      duree_base_min: Math.round((dist / 110) * 60),
      pays_depart: 'FR',
    }
  }, [mode, routeSlug, libreDepart, libreArrivee, libreDistance, librePeages])

  const resultats = useMemo<ResultatTrajet[]>(() => {
    if (!routeSelectionnee) return []
    return calculerTousVehicules(routeSelectionnee)
  }, [routeSelectionnee])

  const routesFiltrees = filtreRegion === 'Toutes'
    ? ROUTES
    : ROUTES.filter(r => r.region === filtreRegion)

  return (
    <div>
      {/* ── Sélecteur de mode ── */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        {[
          { value: 'populaire', label: '🗺️ Routes populaires' },
          { value: 'libre',     label: '✏️ Saisie libre' },
        ].map(opt => (
          <button
            key={opt.value}
            onClick={() => setMode(opt.value as 'populaire' | 'libre')}
            style={{
              padding: '10px 18px', borderRadius: 10, cursor: 'pointer',
              fontWeight: 600, fontSize: '0.9rem', transition: 'all .15s',
              background: mode === opt.value ? 'var(--color-primary)' : 'var(--color-bg-card)',
              color: mode === opt.value ? '#0a1628' : 'var(--color-text)',
              border: mode === opt.value ? '2px solid var(--color-primary)' : '1.5px solid var(--color-border)',
            }}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* ── Mode routes populaires ── */}
      {mode === 'populaire' && (
        <div style={{ marginBottom: 28 }}>
          {/* Filtre région */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
            {REGIONS.map(r => (
              <button
                key={r}
                onClick={() => setFiltreRegion(r as string)}
                style={{
                  padding: '5px 12px', borderRadius: 20, fontSize: '0.8rem',
                  cursor: 'pointer', fontWeight: filtreRegion === r ? 700 : 400,
                  background: filtreRegion === r ? 'rgba(122,240,194,0.15)' : 'transparent',
                  color: filtreRegion === r ? 'var(--color-primary)' : 'var(--color-text-muted)',
                  border: filtreRegion === r ? '1.5px solid var(--color-primary)' : '1.5px solid var(--color-border)',
                  transition: 'all .15s',
                }}
              >
                {r}
              </button>
            ))}
          </div>

          {/* Grille routes */}
          <div style={{
            display: 'grid', gap: 8,
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
          }}>
            {routesFiltrees.map(route => (
              <button
                key={route.slug}
                onClick={() => setRouteSlug(route.slug)}
                style={{
                  textAlign: 'left', padding: '12px 14px', borderRadius: 10,
                  cursor: 'pointer', transition: 'all .15s',
                  background: routeSlug === route.slug ? 'rgba(122,240,194,0.1)' : 'var(--color-bg-card)',
                  border: routeSlug === route.slug ? '2px solid var(--color-primary)' : '1.5px solid var(--color-border)',
                  color: 'var(--color-text)',
                }}
              >
                <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>
                  {route.depart} → {route.arrivee}
                </div>
                <div style={{ fontSize: '0.76rem', color: 'var(--color-text-muted)', marginTop: 3 }}>
                  {route.distance_km} km · {fmtDuree(route.duree_base_min)}
                  {route.popular && <span style={{ marginLeft: 6, color: 'var(--color-primary)' }}>⭐</span>}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Mode saisie libre ── */}
      {mode === 'libre' && (
        <div style={{
          background: 'var(--color-bg-card)', border: '1.5px solid var(--color-border)',
          borderRadius: 14, padding: 24, marginBottom: 28,
        }}>
          <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', color: 'var(--color-text-muted)', marginBottom: 6, fontWeight: 600 }}>
                Ville de départ
              </label>
              <input
                type="text"
                value={libreDepart}
                onChange={e => setLibreDepart(e.target.value)}
                placeholder="ex : Paris"
                style={inputStyle}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', color: 'var(--color-text-muted)', marginBottom: 6, fontWeight: 600 }}>
                Ville d'arrivée
              </label>
              <input
                type="text"
                value={libreArrivee}
                onChange={e => setLibreArrivee(e.target.value)}
                placeholder="ex : Barcelone"
                style={inputStyle}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', color: 'var(--color-text-muted)', marginBottom: 6, fontWeight: 600 }}>
                Distance (km) *
              </label>
              <input
                type="number"
                value={libreDistance}
                onChange={e => setLibreDistance(e.target.value)}
                placeholder="ex : 750"
                min="1"
                style={inputStyle}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', color: 'var(--color-text-muted)', marginBottom: 6, fontWeight: 600 }}>
                Péages estimés (€)
              </label>
              <input
                type="number"
                value={librePeages}
                onChange={e => setLibrePeages(e.target.value)}
                placeholder="auto-calculé"
                min="0"
                style={inputStyle}
              />
            </div>
          </div>
          <p style={{ fontSize: '0.76rem', color: 'var(--color-text-muted)', marginTop: 12, marginBottom: 0 }}>
            * Distance disponible sur Google Maps. Les péages sont estimés à 0,07 €/km si non renseignés.
          </p>
        </div>
      )}

      {/* ── Résultats ── */}
      {routeSelectionnee && resultats.length > 0 && (
        <>
          {/* Titre trajet */}
          <div style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <h2 style={{ margin: 0, fontSize: '1.25rem' }}>
              {routeSelectionnee.depart} → {routeSelectionnee.arrivee}
            </h2>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <Chip icon="🛣️" label={`${routeSelectionnee.distance_km} km`} />
              <Chip icon="⏱️" label={fmtDuree(routeSelectionnee.duree_base_min)} />
              <Chip icon="🛣️" label={`Péages ${fmtEur(routeSelectionnee.peages_eur)}`} />
            </div>
          </div>

          {/* Résumé aller-retour */}
          <ResumeAllerRetour resultats={resultats} />

          {/* Grille des 4 motorisations */}
          <div style={{
            display: 'grid', gap: 16,
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            marginBottom: 28,
          }}>
            {resultats.map((res, i) => (
              <CarteMotorisation key={res.id} res={res} gagnant={resultats[0]} rang={i + 1} />
            ))}
          </div>

          {/* Tableau récap */}
          <TableauRecap resultats={resultats} />

          {/* Note légale */}
          <p style={{
            fontSize: '0.76rem', color: 'var(--color-text-muted)',
            marginTop: 24, padding: '12px 16px',
            background: 'rgba(255,255,255,0.03)', borderRadius: 8,
            border: '1px solid var(--color-border)',
          }}>
            <strong>Estimation indicative.</strong> Les coûts sont calculés sur la base des prix moyens en vigueur (diesel {PRIX_ENERGIE.diesel} €/L, essence {PRIX_ENERGIE.essence} €/L, électricité {PRIX_ENERGIE.elec_blended} €/kWh en moyenne trajet).
            Les consommations réelles varient selon le véhicule, les conditions météo et le style de conduite.
            Péages basés sur les tarifs standard 2026 — abonnements télépéage non inclus.
          </p>
        </>
      )}

      {/* ── État vide mode libre ── */}
      {mode === 'libre' && !routeSelectionnee && (
        <div style={{
          textAlign: 'center', padding: '48px 24px',
          color: 'var(--color-text-muted)', border: '2px dashed var(--color-border)',
          borderRadius: 14,
        }}>
          <div style={{ fontSize: '2rem', marginBottom: 12 }}>🗺️</div>
          <div>Saisissez au minimum la distance pour calculer</div>
        </div>
      )}
    </div>
  )
}

// ─── Tableau récapitulatif ────────────────────────────────────────────────────

function TableauRecap({ resultats }: { resultats: ResultatTrajet[] }) {
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid var(--color-border)' }}>
            <th style={thStyle}>Motorisation</th>
            <th style={{ ...thStyle, textAlign: 'right' }}>Énergie</th>
            <th style={{ ...thStyle, textAlign: 'right' }}>Péages</th>
            <th style={{ ...thStyle, textAlign: 'right' }}>Total</th>
            <th style={{ ...thStyle, textAlign: 'right' }}>Durée</th>
            <th style={{ ...thStyle, textAlign: 'right' }}>Arrêts ⚡</th>
          </tr>
        </thead>
        <tbody>
          {resultats.map((res) => (
            <tr
              key={res.id}
              style={{
                borderBottom: '1px solid var(--color-border)',
                background: res.gagnant ? 'rgba(5,150,105,0.05)' : 'transparent',
              }}
            >
              <td style={{ ...tdStyle, fontWeight: res.gagnant ? 700 : 400 }}>
                {res.emoji} {res.label}
                {res.gagnant && <span style={{ marginLeft: 6, color: '#059669', fontSize: '0.75rem' }}>✓ moins cher</span>}
              </td>
              <td style={{ ...tdStyle, textAlign: 'right' }}>{fmtEur(res.cout_energie)}</td>
              <td style={{ ...tdStyle, textAlign: 'right' }}>{fmtEur(res.cout_peages)}</td>
              <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 700 }}>{fmtEur(res.cout_total)}</td>
              <td style={{ ...tdStyle, textAlign: 'right' }}>{fmtDuree(res.duree_min)}</td>
              <td style={{ ...tdStyle, textAlign: 'right', color: res.nb_arrets_recharge > 0 ? '#059669' : 'var(--color-text-muted)' }}>
                {res.nb_arrets_recharge > 0 ? `${res.nb_arrets_recharge} (${res.temps_recharge_min} min)` : '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ─── Composants utilitaires ───────────────────────────────────────────────────

function Chip({ icon, label }: { icon: string; label: string }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      background: 'var(--color-bg-card)', border: '1px solid var(--color-border)',
      borderRadius: 20, padding: '4px 10px', fontSize: '0.78rem', color: 'var(--color-text-muted)',
    }}>
      {icon} {label}
    </span>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%', boxSizing: 'border-box',
  padding: '10px 12px', borderRadius: 8, fontSize: '0.9rem',
  background: 'var(--color-bg-dark)', color: 'var(--color-text)',
  border: '1.5px solid var(--color-border)',
  outline: 'none',
}

const thStyle: React.CSSProperties = {
  padding: '10px 12px', textAlign: 'left',
  color: 'var(--color-text-muted)', fontWeight: 600, fontSize: '0.8rem',
}

const tdStyle: React.CSSProperties = {
  padding: '12px 12px',
}
