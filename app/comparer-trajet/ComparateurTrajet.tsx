'use client'

import { useState, useMemo } from 'react'
import {
  calculerTousVehicules, calculerLocation,
  fmtEur, fmtDuree, economieVsGagnant,
  PRIX_ENERGIE, CATEGORIES_LOCATION,
  type Route, type ResultatTrajet, type ResultatLocation,
  type CategorieLocation,
} from '@/lib/trajet'
import routesData from '@/data/routes-vacances.json'

const ROUTES = routesData as Route[]
const REGIONS = ['Toutes', ...Array.from(new Set(ROUTES.map(r => r.region).filter(Boolean)))]

// ─── Carte motorisation (voiture perso) ───────────────────────────────────────

function CarteMotorisation({ res, gagnant }: { res: ResultatTrajet; gagnant: ResultatTrajet }) {
  const economie = economieVsGagnant(res, gagnant)
  const isWinner = res.gagnant
  return (
    <div style={{
      background: isWinner ? 'rgba(5,150,105,0.08)' : 'var(--color-bg-card)',
      border: isWinner ? '2px solid #059669' : '1.5px solid var(--color-border)',
      borderRadius: 14, padding: '20px 18px', position: 'relative',
    }}>
      {isWinner
        ? <BadgeTop color="#059669" text="🏆 MOINS CHER" />
        : <BadgeTop color="var(--color-bg-dark)" text={`+${fmtEur(economie)}`} border />
      }
      <div style={{ textAlign: 'center', marginTop: 12, marginBottom: 16 }}>
        <div style={{ fontSize: '1.8rem', marginBottom: 4 }}>{res.emoji}</div>
        <div style={{ fontWeight: 700, fontSize: '1rem', color: res.couleur }}>{res.label}</div>
      </div>
      <div style={{ textAlign: 'center', marginBottom: 16 }}>
        <div style={{ fontSize: '2rem', fontWeight: 800, color: isWinner ? '#059669' : 'var(--color-text)', lineHeight: 1.1 }}>
          {fmtEur(res.cout_total)}
        </div>
        <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', marginTop: 2 }}>aller simple</div>
      </div>
      <BarreDecomposition segments={[
        { value: res.cout_energie, color: '#f59e0b' },
        { value: res.cout_peages, color: '#8b5cf6' },
      ]} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 14 }}>
        <LigneDetail label="Énergie" value={fmtEur(res.cout_energie)} color="#f59e0b" />
        <LigneDetail label="Péages" value={fmtEur(res.cout_peages)} color="#8b5cf6" />
        <LigneDetail label="Durée" value={fmtDuree(res.duree_min)} color="#3b82f6" />
        {res.nb_arrets_recharge > 0 && (
          <div style={{ marginTop: 4, padding: '6px 10px', background: 'rgba(5,150,105,0.08)', borderRadius: 8, fontSize: '0.78rem', color: '#059669', textAlign: 'center' }}>
            ⚡ {res.nb_arrets_recharge} arrêt{res.nb_arrets_recharge > 1 ? 's' : ''} recharge (~{res.temps_recharge_min} min)
          </div>
        )}
      </div>
      <div style={{ marginTop: 12, fontSize: '0.72rem', color: 'var(--color-text-muted)', textAlign: 'center', borderTop: '1px solid var(--color-border)', paddingTop: 10 }}>
        {res.conso_detail}
      </div>
    </div>
  )
}

// ─── Carte location ────────────────────────────────────────────────────────────

function CarteLocation({ res, gagnantPerso }: { res: ResultatLocation; gagnantPerso?: ResultatTrajet }) {
  const isWinner = res.gagnant
  const diff = gagnantPerso ? res.cout_total - gagnantPerso.cout_total : null

  return (
    <div style={{
      background: isWinner ? 'rgba(59,130,246,0.07)' : 'var(--color-bg-card)',
      border: isWinner ? '2px solid #3b82f6' : '1.5px solid var(--color-border)',
      borderRadius: 14, padding: '20px 18px', position: 'relative',
    }}>
      {isWinner
        ? <BadgeTop color="#3b82f6" text="🏆 MOINS CHER" />
        : <BadgeTop color="var(--color-bg-dark)" text={`+${fmtEur(res.cout_total - 0)}`} border />
      }
      <div style={{ textAlign: 'center', marginTop: 12, marginBottom: 16 }}>
        <div style={{ fontSize: '1.8rem', marginBottom: 4 }}>{res.emoji}</div>
        <div style={{ fontWeight: 700, fontSize: '1rem', color: res.couleur }}>{res.label}</div>
      </div>
      <div style={{ textAlign: 'center', marginBottom: 16 }}>
        <div style={{ fontSize: '2rem', fontWeight: 800, color: isWinner ? '#3b82f6' : 'var(--color-text)', lineHeight: 1.1 }}>
          {fmtEur(res.cout_total)}
        </div>
        <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', marginTop: 2 }}>
          {res.nb_jours} jour{res.nb_jours > 1 ? 's' : ''} · aller simple
        </div>
      </div>
      <BarreDecomposition segments={[
        { value: res.cout_location, color: '#3b82f6' },
        { value: res.cout_carburant, color: '#f59e0b' },
        { value: res.cout_peages, color: '#8b5cf6' },
      ]} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 14 }}>
        <LigneDetail label={`Location (${res.nb_jours}j × ${fmtEur(res.tarif_jour)}/j)`} value={fmtEur(res.cout_location)} color="#3b82f6" />
        <LigneDetail label="Carburant / recharge" value={fmtEur(res.cout_carburant)} color="#f59e0b" />
        <LigneDetail label="Péages" value={fmtEur(res.cout_peages)} color="#8b5cf6" />
      </div>
      {diff !== null && (
        <div style={{
          marginTop: 12, padding: '7px 10px',
          background: diff > 0 ? 'rgba(239,68,68,0.07)' : 'rgba(5,150,105,0.07)',
          borderRadius: 8, fontSize: '0.78rem', textAlign: 'center',
          color: diff > 0 ? '#ef4444' : '#059669',
          border: `1px solid ${diff > 0 ? 'rgba(239,68,68,0.2)' : 'rgba(5,150,105,0.2)'}`,
        }}>
          {diff > 0
            ? `${fmtEur(diff)} de plus que votre ${gagnantPerso?.label}`
            : `${fmtEur(-diff)} de moins que votre ${gagnantPerso?.label}`
          }
        </div>
      )}
      {res.nb_arrets_recharge > 0 && (
        <div style={{ marginTop: 8, padding: '5px 10px', background: 'rgba(5,150,105,0.07)', borderRadius: 8, fontSize: '0.75rem', color: '#059669', textAlign: 'center' }}>
          ⚡ {res.nb_arrets_recharge} arrêt{res.nb_arrets_recharge > 1 ? 's' : ''} de recharge inclus
        </div>
      )}
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
          ✅ En {gagnant.label}, l'aller-retour complet vous coûte{' '}
          <span style={{ color: '#059669' }}>{fmtEur(gagnant.cout_total * 2)}</span>
        </div>
        <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
          Soit <strong>{fmtEur(econAR)}</strong> d'économie vs {perdant.label} sur l'aller-retour
        </div>
      </div>
      <div style={{ fontSize: '1.5rem' }}>{gagnant.emoji}</div>
    </div>
  )
}

// ─── Tableau récap ─────────────────────────────────────────────────────────────

function TableauRecap({ resultats }: { resultats: ResultatTrajet[] }) {
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid var(--color-border)' }}>
            {['Motorisation', 'Énergie', 'Péages', 'Total', 'Durée', 'Arrêts ⚡'].map((h, i) => (
              <th key={h} style={{ ...thStyle, textAlign: i > 0 ? 'right' : 'left' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {resultats.map(res => (
            <tr key={res.id} style={{ borderBottom: '1px solid var(--color-border)', background: res.gagnant ? 'rgba(5,150,105,0.05)' : 'transparent' }}>
              <td style={{ ...tdStyle, fontWeight: res.gagnant ? 700 : 400 }}>
                {res.emoji} {res.label}
                {res.gagnant && <span style={{ marginLeft: 6, color: '#059669', fontSize: '0.75rem' }}>✓</span>}
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

function TableauRecapLocation({ resultats }: { resultats: ResultatLocation[] }) {
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid var(--color-border)' }}>
            {['Motorisation', 'Location', 'Carburant', 'Péages', 'Total'].map((h, i) => (
              <th key={h} style={{ ...thStyle, textAlign: i > 0 ? 'right' : 'left' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {resultats.map(res => (
            <tr key={res.motorisation} style={{ borderBottom: '1px solid var(--color-border)', background: res.gagnant ? 'rgba(59,130,246,0.05)' : 'transparent' }}>
              <td style={{ ...tdStyle, fontWeight: res.gagnant ? 700 : 400 }}>
                {res.emoji} {res.label}
                {res.gagnant && <span style={{ marginLeft: 6, color: '#3b82f6', fontSize: '0.75rem' }}>✓</span>}
              </td>
              <td style={{ ...tdStyle, textAlign: 'right' }}>{fmtEur(res.cout_location)}</td>
              <td style={{ ...tdStyle, textAlign: 'right' }}>{fmtEur(res.cout_carburant)}</td>
              <td style={{ ...tdStyle, textAlign: 'right' }}>{fmtEur(res.cout_peages)}</td>
              <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 700 }}>{fmtEur(res.cout_total)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ─── Sous-composants utilitaires ─────────────────────────────────────────────

function BadgeTop({ color, text, border }: { color: string; text: string; border?: boolean }) {
  return (
    <div style={{
      position: 'absolute', top: -13, left: '50%', transform: 'translateX(-50%)',
      background: color, color: border ? 'var(--color-text-muted)' : 'white',
      border: border ? '1px solid var(--color-border)' : 'none',
      borderRadius: 20, padding: '3px 14px',
      fontSize: '0.72rem', fontWeight: 700, whiteSpace: 'nowrap', letterSpacing: '0.04em',
    }}>
      {text}
    </div>
  )
}

function BarreDecomposition({ segments }: { segments: { value: number; color: string }[] }) {
  const total = segments.reduce((s, seg) => s + seg.value, 0)
  if (total === 0) return null
  return (
    <div style={{ height: 8, display: 'flex', borderRadius: 4, overflow: 'hidden', gap: 1 }}>
      {segments.map((seg, i) => (
        <div key={i} style={{ width: `${Math.round((seg.value / total) * 100)}%`, background: seg.color }} />
      ))}
    </div>
  )
}

function LigneDetail({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.82rem' }}>
      <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--color-text-muted)' }}>
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: color, display: 'inline-block', flexShrink: 0 }} />
        {label}
      </span>
      <span style={{ fontWeight: 600 }}>{value}</span>
    </div>
  )
}

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
  border: '1.5px solid var(--color-border)', outline: 'none',
}
const thStyle: React.CSSProperties = { padding: '10px 12px', textAlign: 'left', color: 'var(--color-text-muted)', fontWeight: 600, fontSize: '0.8rem' }
const tdStyle: React.CSSProperties = { padding: '12px 12px' }

// ─── Composant principal ──────────────────────────────────────────────────────

export default function ComparateurTrajet({ routeInitiale }: { routeInitiale?: Route }) {
  // ── Route ──
  const [mode, setMode] = useState<'populaire' | 'libre'>('populaire')
  const [routeSlug, setRouteSlug] = useState<string>(routeInitiale?.slug ?? ROUTES[0].slug)
  const [filtreRegion, setFiltreRegion] = useState('Toutes')
  const [libreDepart, setLibreDepart] = useState('')
  const [libreArrivee, setLibreArrivee] = useState('')
  const [libreDistance, setLibreDistance] = useState('')
  const [librePeages, setLibrePeages] = useState('')

  // ── Onglet résultats ──
  const [onglet, setOnglet] = useState<'voiture' | 'location'>('voiture')

  // ── Saisie libre : confirmation explicite ──
  const [libreConfirme, setLibreConfirme] = useState(false)

  // ── Location ──
  const [categorieId, setCategorieId] = useState<CategorieLocation>('berline')
  const [nbJours, setNbJours] = useState(7)

  const routeSelectionnee = useMemo<Route | null>(() => {
    if (mode === 'populaire') return ROUTES.find(r => r.slug === routeSlug) ?? ROUTES[0]
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

  const resultatsVoiture = useMemo<ResultatTrajet[]>(() => {
    if (!routeSelectionnee) return []
    return calculerTousVehicules(routeSelectionnee)
  }, [routeSelectionnee])

  const resultatsLocation = useMemo<ResultatLocation[]>(() => {
    if (!routeSelectionnee) return []
    return calculerLocation(routeSelectionnee, categorieId, nbJours)
  }, [routeSelectionnee, categorieId, nbJours])

  const routesFiltrees = filtreRegion === 'Toutes' ? ROUTES : ROUTES.filter(r => r.region === filtreRegion)

  return (
    <div>
      {/* ── Sélecteur de mode route ── */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        {[
          { value: 'populaire', label: '🗺️ Routes populaires' },
          { value: 'libre', label: '✏️ Saisie libre' },
        ].map(opt => (
          <button key={opt.value} onClick={() => setMode(opt.value as 'populaire' | 'libre')} style={{
            padding: '10px 18px', borderRadius: 10, cursor: 'pointer',
            fontWeight: 600, fontSize: '0.9rem', transition: 'all .15s',
            background: mode === opt.value ? 'var(--color-primary)' : 'var(--color-bg-card)',
            color: mode === opt.value ? '#0a1628' : 'var(--color-text)',
            border: mode === opt.value ? '2px solid var(--color-primary)' : '1.5px solid var(--color-border)',
          }}>
            {opt.label}
          </button>
        ))}
      </div>

      {/* ── Routes populaires ── */}
      {mode === 'populaire' && (
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
            {REGIONS.map(r => (
              <button key={r} onClick={() => setFiltreRegion(r as string)} style={{
                padding: '5px 12px', borderRadius: 20, fontSize: '0.8rem', cursor: 'pointer',
                fontWeight: filtreRegion === r ? 700 : 400,
                background: filtreRegion === r ? 'rgba(122,240,194,0.15)' : 'transparent',
                color: filtreRegion === r ? 'var(--color-primary)' : 'var(--color-text-muted)',
                border: filtreRegion === r ? '1.5px solid var(--color-primary)' : '1.5px solid var(--color-border)',
                transition: 'all .15s',
              }}>{r}</button>
            ))}
          </div>
          <div style={{ display: 'grid', gap: 8, gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))' }}>
            {routesFiltrees.map(route => (
              <button key={route.slug} onClick={() => setRouteSlug(route.slug)} style={{
                textAlign: 'left', padding: '12px 14px', borderRadius: 10,
                cursor: 'pointer', transition: 'all .15s',
                background: routeSlug === route.slug ? 'rgba(122,240,194,0.1)' : 'var(--color-bg-card)',
                border: routeSlug === route.slug ? '2px solid var(--color-primary)' : '1.5px solid var(--color-border)',
                color: 'var(--color-text)',
              }}>
                <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>{route.depart} → {route.arrivee}</div>
                <div style={{ fontSize: '0.76rem', color: 'var(--color-text-muted)', marginTop: 3 }}>
                  {route.distance_km} km · {fmtDuree(route.duree_base_min)}
                  {route.popular && <span style={{ marginLeft: 6, color: 'var(--color-primary)' }}>⭐</span>}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Saisie libre ── */}
      {mode === 'libre' && (
        <div style={{ background: 'var(--color-bg-card)', border: '1.5px solid var(--color-border)', borderRadius: 14, padding: 24, marginBottom: 28 }}>
          <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
            {[
              { label: 'Ville de départ', value: libreDepart, set: (v: string) => { setLibreDepart(v); setLibreConfirme(false) }, placeholder: 'ex : Paris', type: 'text' },
              { label: "Ville d'arrivée", value: libreArrivee, set: (v: string) => { setLibreArrivee(v); setLibreConfirme(false) }, placeholder: 'ex : Barcelone', type: 'text' },
              { label: 'Distance (km) *', value: libreDistance, set: (v: string) => { setLibreDistance(v); setLibreConfirme(false) }, placeholder: 'ex : 750', type: 'number' },
              { label: 'Péages estimés (€)', value: librePeages, set: (v: string) => { setLibrePeages(v); setLibreConfirme(false) }, placeholder: 'auto-calculé (0,07 €/km)', type: 'number' },
            ].map(f => (
              <div key={f.label}>
                <label style={{ display: 'block', fontSize: '0.82rem', color: 'var(--color-text-muted)', marginBottom: 6, fontWeight: 600 }}>{f.label}</label>
                <input type={f.type} value={f.value} onChange={e => f.set(e.target.value)} placeholder={f.placeholder} style={inputStyle} />
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 18, flexWrap: 'wrap', gap: 10 }}>
            <p style={{ fontSize: '0.76rem', color: 'var(--color-text-muted)', margin: 0 }}>
              * Trouvez la distance sur <a href="https://maps.google.com" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-primary)' }}>Google Maps</a>. Péages estimés à 0,07 €/km si non renseignés.
            </p>
            <button
              onClick={() => {
                const dist = parseFloat(libreDistance)
                if (dist > 0) setLibreConfirme(true)
              }}
              disabled={!libreDistance || parseFloat(libreDistance) <= 0}
              style={{
                padding: '11px 28px', borderRadius: 10, cursor: 'pointer',
                fontWeight: 700, fontSize: '0.95rem',
                background: libreDistance && parseFloat(libreDistance) > 0 ? 'var(--color-primary)' : 'var(--color-border)',
                color: libreDistance && parseFloat(libreDistance) > 0 ? '#0a1628' : 'var(--color-text-muted)',
                border: 'none', transition: 'all .15s',
              }}
            >
              Calculer →
            </button>
          </div>
        </div>
      )}

      {/* ── Résultats ── */}
      {routeSelectionnee && (mode === 'populaire' || libreConfirme) && (
        <>
          {/* Titre trajet */}
          <div style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <h2 style={{ margin: 0, fontSize: '1.25rem' }}>
              {routeSelectionnee.depart} → {routeSelectionnee.arrivee}
            </h2>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <Chip icon="🛣️" label={`${routeSelectionnee.distance_km} km`} />
              <Chip icon="⏱️" label={fmtDuree(routeSelectionnee.duree_base_min)} />
              <Chip icon="💳" label={`Péages ${fmtEur(routeSelectionnee.peages_eur)}`} />
            </div>
          </div>

          {/* ── Sélecteur d'onglet ── */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 24, borderBottom: '2px solid var(--color-border)', paddingBottom: 0 }}>
            {[
              { value: 'voiture', label: '🚗 Ma voiture' },
              { value: 'location', label: '🔑 Louer une voiture' },
            ].map(opt => (
              <button key={opt.value} onClick={() => setOnglet(opt.value as 'voiture' | 'location')} style={{
                padding: '10px 20px', cursor: 'pointer', fontWeight: 600, fontSize: '0.92rem',
                background: 'transparent', transition: 'all .15s',
                border: 'none', borderBottom: onglet === opt.value ? '3px solid var(--color-primary)' : '3px solid transparent',
                color: onglet === opt.value ? 'var(--color-primary)' : 'var(--color-text-muted)',
                marginBottom: -2,
              }}>
                {opt.label}
              </button>
            ))}
          </div>

          {/* ── Onglet Ma voiture ── */}
          {onglet === 'voiture' && resultatsVoiture.length > 0 && (
            <>
              <ResumeAllerRetour resultats={resultatsVoiture} />
              <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', marginBottom: 28 }}>
                {resultatsVoiture.map(res => (
                  <CarteMotorisation key={res.id} res={res} gagnant={resultatsVoiture[0]} />
                ))}
              </div>
              <TableauRecap resultats={resultatsVoiture} />
            </>
          )}

          {/* ── Onglet Location ── */}
          {onglet === 'location' && (
            <>
              {/* Paramètres location */}
              <div style={{ background: 'var(--color-bg-card)', border: '1.5px solid var(--color-border)', borderRadius: 14, padding: '20px 24px', marginBottom: 24 }}>
                <div style={{ display: 'grid', gap: 20, gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', color: 'var(--color-text-muted)', marginBottom: 8, fontWeight: 600 }}>
                      Catégorie de véhicule
                    </label>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {CATEGORIES_LOCATION.map(cat => (
                        <button key={cat.id} onClick={() => setCategorieId(cat.id)} style={{
                          textAlign: 'left', padding: '10px 14px', borderRadius: 10, cursor: 'pointer',
                          transition: 'all .15s',
                          background: categorieId === cat.id ? 'rgba(122,240,194,0.1)' : 'transparent',
                          border: categorieId === cat.id ? '2px solid var(--color-primary)' : '1.5px solid var(--color-border)',
                          color: 'var(--color-text)',
                        }}>
                          <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>{cat.label}</div>
                          <div style={{ fontSize: '0.74rem', color: 'var(--color-text-muted)', marginTop: 2 }}>{cat.exemples}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', color: 'var(--color-text-muted)', marginBottom: 8, fontWeight: 600 }}>
                      Durée de location
                    </label>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {[3, 5, 7, 10, 14].map(j => (
                        <button key={j} onClick={() => setNbJours(j)} style={{
                          padding: '10px 14px', borderRadius: 10, cursor: 'pointer',
                          fontWeight: j === nbJours ? 700 : 400, fontSize: '0.88rem',
                          transition: 'all .15s',
                          background: j === nbJours ? 'rgba(122,240,194,0.1)' : 'transparent',
                          border: j === nbJours ? '2px solid var(--color-primary)' : '1.5px solid var(--color-border)',
                          color: j === nbJours ? 'var(--color-primary)' : 'var(--color-text)',
                        }}>
                          {j} jours
                        </button>
                      ))}
                    </div>
                    <div style={{ marginTop: 12, fontSize: '0.76rem', color: 'var(--color-text-muted)', lineHeight: 1.5 }}>
                      Kilométrage illimité · Carburant non inclus (payé à la pompe / borne)
                    </div>
                  </div>
                </div>
              </div>

              {/* Résumé location */}
              {resultatsLocation.length > 0 && (
                <>
                  <div style={{
                    background: 'linear-gradient(135deg, rgba(59,130,246,0.08), rgba(139,92,246,0.06))',
                    border: '1px solid rgba(59,130,246,0.25)',
                    borderRadius: 14, padding: '16px 22px', marginBottom: 24,
                    display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center', justifyContent: 'space-between',
                  }}>
                    <div>
                      <div style={{ fontWeight: 700, marginBottom: 3 }}>
                        🔑 En {resultatsLocation[0].label}, louer pour {nbJours} jours vous coûte{' '}
                        <span style={{ color: '#3b82f6' }}>{fmtEur(resultatsLocation[0].cout_total)}</span>
                      </div>
                      {resultatsVoiture.length > 0 && (() => {
                        const diff = resultatsLocation[0].cout_total - resultatsVoiture[0].cout_total
                        return (
                          <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                            {diff > 0
                              ? <>Soit <strong style={{ color: '#ef4444' }}>{fmtEur(diff)} de plus</strong> que partir avec votre {resultatsVoiture[0].label}</>
                              : <>Soit <strong style={{ color: '#059669' }}>{fmtEur(-diff)} de moins</strong> que partir avec votre {resultatsVoiture[0].label}</>
                            }
                          </div>
                        )
                      })()}
                    </div>
                    <div style={{ fontSize: '1.5rem' }}>{resultatsLocation[0].emoji}</div>
                  </div>

                  <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', marginBottom: 28 }}>
                    {resultatsLocation.map(res => (
                      <CarteLocation key={res.motorisation} res={res} gagnantPerso={resultatsVoiture[0]} />
                    ))}
                  </div>
                  <TableauRecapLocation resultats={resultatsLocation} />
                </>
              )}
            </>
          )}

          {/* Note légale */}
          <p style={{
            fontSize: '0.76rem', color: 'var(--color-text-muted)',
            marginTop: 24, padding: '12px 16px',
            background: 'rgba(255,255,255,0.03)', borderRadius: 8,
            border: '1px solid var(--color-border)',
          }}>
            <strong>Estimation indicative.</strong>{' '}
            {onglet === 'voiture'
              ? `Coûts calculés sur la base des prix 2026 (diesel ${PRIX_ENERGIE.diesel} €/L, essence ${PRIX_ENERGIE.essence} €/L, électricité ${PRIX_ENERGIE.elec_blended} €/kWh en moyenne trajet). Consommations réelles autoroute.`
              : `Tarifs location haute saison juillet-août 2026, kilométrage illimité (moyennes Europcar, Hertz, Sixt). Carburant non inclus dans le tarif de location. Péages à la charge du locataire.`
            }
          </p>
        </>
      )}

      {/* État vide mode libre */}
      {mode === 'libre' && (!routeSelectionnee || !libreConfirme) && (
        <div style={{ textAlign: 'center', padding: '48px 24px', color: 'var(--color-text-muted)', border: '2px dashed var(--color-border)', borderRadius: 14 }}>
          <div style={{ fontSize: '2rem', marginBottom: 12 }}>🗺️</div>
          <div>Saisissez au minimum la distance pour calculer</div>
        </div>
      )}
    </div>
  )
}
