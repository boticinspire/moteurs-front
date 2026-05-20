'use client'

import { useState, useMemo, useEffect, useRef } from 'react'
import {
  calculerTousVehicules, calculerLocation,
  fmtEur, fmtDuree, economieVsGagnant,
  PRIX_ENERGIE, CATEGORIES_LOCATION,
  type Route, type ResultatTrajet, type ResultatLocation,
  type CategorieLocation,
} from '@/lib/trajet'
import { geocoderEtCalculer } from '@/lib/openrouteservice'
import { getRouteFromCache, saveRouteToCache, normaliserVille } from '@/lib/trajets-cache'
import { type Coords } from '@/lib/openchargemaps'
import StationsRecharge from './StationsRecharge'
import routesData from '@/data/routes-vacances.json'
import villesData from '@/data/villes.json'
import { useUserContext } from '@/context/UserContextProvider'
import { makeTrajetCtx } from '@/lib/user-context'

const ROUTES = routesData as Route[]
const REGIONS = ['Toutes', ...Array.from(new Set(ROUTES.map(r => r.region).filter(Boolean)))]

interface Ville { nom: string; region: string; pays: string; pays_code: string }
const VILLES = villesData as Ville[]

// Normalise pour matching insensible aux accents/casse
function norm(s: string): string {
  return s.toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9 -]/g, '')
    .trim()
}

// Cherche une route pré-calculée pour une paire départ/arrivée (dans les 2 sens)
function findRoute(depart: string, arrivee: string): Route | null {
  const nd = norm(depart), na = norm(arrivee)
  if (!nd || !na) return null
  return ROUTES.find(r =>
    (norm(r.depart) === nd && norm(r.arrivee) === na) ||
    (norm(r.depart) === na && norm(r.arrivee) === nd)
  ) ?? null
}

// ─── État ORS ─────────────────────────────────────────────────────────────────

type OrsEtat = 'idle' | 'loading' | 'erreur_ville' | 'erreur_ors' | 'manuel'

// ─── Persistance recherches récentes ─────────────────────────────────────────
const RECENT_KEY = 'moteurs_trajets_recents'
function loadRecents(): { depart: string; arrivee: string }[] {
  if (typeof window === 'undefined') return []
  try { return JSON.parse(localStorage.getItem(RECENT_KEY) || '[]') } catch { return [] }
}
function saveRecent(depart: string, arrivee: string) {
  if (typeof window === 'undefined') return
  const current = loadRecents().filter(r => !(norm(r.depart) === norm(depart) && norm(r.arrivee) === norm(arrivee)))
  const next = [{ depart, arrivee }, ...current].slice(0, 5)
  try { localStorage.setItem(RECENT_KEY, JSON.stringify(next)) } catch {}
}

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
  background: 'var(--color-bg-alt)', color: 'var(--color-text)',
  border: '1.5px solid var(--color-border)', outline: 'none',
}
const thStyle: React.CSSProperties = { padding: '10px 12px', textAlign: 'left', color: 'var(--color-text-muted)', fontWeight: 600, fontSize: '0.8rem' }
const tdStyle: React.CSSProperties = { padding: '12px 12px' }

// ─── Composant principal ──────────────────────────────────────────────────────

// ─── Champ ville avec autocomplétion ──────────────────────────────────────────

function AutocompleteVille({
  label, value, onChange, onSelect, placeholder,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  onSelect?: (v: string) => void
  placeholder: string
}) {
  const [open, setOpen] = useState(false)
  const [highlighted, setHighlighted] = useState(-1)
  const ref = useRef<HTMLDivElement>(null)

  const matches = useMemo(() => {
    const q = norm(value)
    if (!q) return VILLES.slice(0, 8)
    return VILLES.filter(v => norm(v.nom).includes(q)).slice(0, 8)
  }, [value])

  // Ferme au clic extérieur
  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const pick = (v: string) => {
    onChange(v)
    onSelect?.(v)
    setOpen(false)
    setHighlighted(-1)
  }

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: 'var(--color-text-muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
        {label}
      </label>
      <input
        type="text"
        value={value}
        placeholder={placeholder}
        onFocus={() => setOpen(true)}
        onChange={e => { onChange(e.target.value); setOpen(true); setHighlighted(-1) }}
        onKeyDown={e => {
          if (e.key === 'ArrowDown') { e.preventDefault(); setOpen(true); setHighlighted(h => Math.min(h + 1, matches.length - 1)) }
          else if (e.key === 'ArrowUp') { e.preventDefault(); setHighlighted(h => Math.max(h - 1, 0)) }
          else if (e.key === 'Enter' && highlighted >= 0 && matches[highlighted]) { e.preventDefault(); pick(matches[highlighted].nom) }
          else if (e.key === 'Escape') { setOpen(false) }
        }}
        autoComplete="off"
        style={{
          width: '100%', boxSizing: 'border-box',
          padding: '12px 14px', borderRadius: 10, fontSize: '0.95rem',
          background: 'var(--color-bg-alt)', color: 'var(--color-text)',
          border: '2px solid var(--color-border)', outline: 'none',
          transition: 'border-color .15s',
        }}
        onBlur={e => { e.currentTarget.style.borderColor = 'var(--color-border)' }}
        onFocusCapture={e => { e.currentTarget.style.borderColor = 'var(--color-primary)' }}
      />
      {open && matches.length > 0 && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 4,
          background: 'var(--color-bg-card)', border: '1.5px solid var(--color-border)',
          borderRadius: 10, maxHeight: 320, overflowY: 'auto', zIndex: 100,
          boxShadow: '0 12px 32px rgba(0,0,0,0.18)',
        }}>
          {matches.map((v, i) => (
            <div key={v.nom}
              onMouseDown={e => { e.preventDefault(); pick(v.nom) }}
              onMouseEnter={() => setHighlighted(i)}
              style={{
                padding: '10px 14px', cursor: 'pointer',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                background: highlighted === i ? 'rgba(122,240,194,0.08)' : 'transparent',
                borderBottom: i < matches.length - 1 ? '1px solid var(--color-border)' : 'none',
              }}
            >
              <span style={{ fontWeight: 500, fontSize: '0.92rem' }}>{v.nom}</span>
              <span style={{ fontSize: '0.74rem', color: 'var(--color-text-muted)' }}>
                {v.region || v.pays}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Composant principal ──────────────────────────────────────────────────────

export default function ComparateurTrajet({ routeInitiale }: { routeInitiale?: Route }) {
  // ── Contexte utilisateur global ──
  const { context, isReady, setTrajet, updateVoiture } = useUserContext()

  // ── Sélection trajet ──
  const [depart, setDepart] = useState(routeInitiale?.depart ?? '')
  const [arrivee, setArrivee] = useState(routeInitiale?.arrivee ?? '')
  const [confirmed, setConfirmed] = useState(!!routeInitiale)
  const [recents, setRecents] = useState<{ depart: string; arrivee: string }[]>([])

  // ── Date de départ (optionnelle — déclenche l'expiration auto du contexte) ──
  const [dateDepart, setDateDepart] = useState('')

  // ── Trajet ORS (routes inconnues) ──
  const [orsEtat, setOrsEtat] = useState<OrsEtat>('idle')
  const [orsRoute, setOrsRoute] = useState<Route | null>(null)

  // ── Coordonnées GPS (pour les stations de recharge) ──
  const [routeCoords, setRouteCoords] = useState<{ depart: Coords; arrivee: Coords } | null>(null)

  // ── Labels normalisés renvoyés par ORS — permet à l'utilisateur de vérifier
  //    qu'une saisie ambiguë (ex. "varena") a été résolue où il pensait.
  const [resolvedLabels, setResolvedLabels] = useState<{ depart: string; arrivee: string } | null>(null)

  // ── Fallback manuel ──
  const [customDistance, setCustomDistance] = useState('')
  const [customPeages, setCustomPeages] = useState('')

  // ── Suggestions populaires ──
  const [filtreRegion, setFiltreRegion] = useState('Toutes')

  // ── Onglet résultats & location ──
  const [onglet, setOnglet] = useState<'voiture' | 'location'>('voiture')
  const [categorieId, setCategorieId] = useState<CategorieLocation>('berline')
  const [nbJours, setNbJours] = useState(7)

  // Charge les recherches récentes au montage
  useEffect(() => { setRecents(loadRecents()) }, [])

  // ── Pré-remplissage depuis le contexte (une seule fois, quand isReady) ──
  const prefilledRef = useRef(false)
  useEffect(() => {
    if (!isReady || prefilledRef.current || routeInitiale) return
    prefilledRef.current = true
    const t = context.trajet
    if (t?.depart)      setDepart(t.depart)
    if (t?.arrivee)     setArrivee(t.arrivee)
    if (t?.date_depart) setDateDepart(t.date_depart)
  }, [isReady, context.trajet, routeInitiale])

  // Cherche un trajet pré-calculé dans routes-vacances.json
  const routeMatch = useMemo(() => findRoute(depart, arrivee), [depart, arrivee])
  const needsOrs = !!depart.trim() && !!arrivee.trim() && !routeMatch

  // ── Résolution ORS (cache → API) ──────────────────────────────────────────
  async function resoudreViaORS() {
    setOrsEtat('loading')
    setOrsRoute(null)
    setResolvedLabels(null)

    const d = depart.trim()
    const a = arrivee.trim()

    // 1. Cherche dans le cache Supabase
    try {
      const cached = await getRouteFromCache(d, a)
      if (cached) {
        const route: Route = {
          slug: `${normaliserVille(d)}-${normaliserVille(a)}`,
          depart: cached.depart,
          arrivee: cached.arrivee,
          distance_km: cached.distance_km,
          peages_eur: cached.peages_eur,
          duree_base_min: cached.duree_base_min,
          pays_depart: 'FR',
        }
        setOrsRoute(route)
        setOrsEtat('idle')
        setConfirmed(true)
        saveRecent(d, a)
        setRecents(loadRecents())
        return
      }
    } catch { /* cache indisponible — continue vers ORS */ }

    // 2. Appel ORS
    try {
      const result = await geocoderEtCalculer(d, a, 'recommended')
      if (!result) {
        setOrsEtat('erreur_ors')
        return
      }
      const { itineraire, coordDepart, coordArrivee } = result
      const peages = Math.round(itineraire.distance_km * 0.07)

      const route: Route = {
        slug: `${normaliserVille(d)}-${normaliserVille(a)}`,
        depart: d,
        arrivee: a,
        distance_km: itineraire.distance_km,
        peages_eur: peages,
        duree_base_min: itineraire.duree_min,
        pays_depart: 'FR',
      }

      // 3. Sauvegarde en cache (fire & forget)
      saveRouteToCache({
        depart: d,
        arrivee: a,
        coordDepart,
        coordArrivee,
        itineraire,
        peages_eur: peages,
      }).catch(() => {})

      setOrsRoute(route)
      // ORSCoordonnees utilise `lon`, Coords utilise `lng`
      setRouteCoords({
        depart:  { lat: coordDepart.lat,  lng: coordDepart.lon },
        arrivee: { lat: coordArrivee.lat, lng: coordArrivee.lon },
      })
      setResolvedLabels({ depart: coordDepart.label, arrivee: coordArrivee.label })
      setOrsEtat('idle')
      setConfirmed(true)
      saveRecent(d, a)
      setRecents(loadRecents())
    } catch {
      setOrsEtat('erreur_ors')
    }
  }

  // Construit la Route à utiliser pour les calculs
  const routeSelectionnee = useMemo<Route | null>(() => {
    if (!depart.trim() || !arrivee.trim()) return null
    if (routeMatch) return routeMatch
    if (orsRoute) return orsRoute
    // Fallback manuel
    const dist = parseFloat(customDistance)
    if (!dist || dist <= 0) return null
    return {
      slug: 'libre',
      depart: depart.trim(),
      arrivee: arrivee.trim(),
      distance_km: dist,
      peages_eur: parseFloat(customPeages) || Math.round(dist * 0.07),
      duree_base_min: Math.round((dist / 105) * 60),
      pays_depart: 'FR',
    }
  }, [depart, arrivee, routeMatch, orsRoute, customDistance, customPeages])

  const resultatsVoiture = useMemo<ResultatTrajet[]>(() => {
    if (!routeSelectionnee || !confirmed) return []
    return calculerTousVehicules(routeSelectionnee)
  }, [routeSelectionnee, confirmed])

  const resultatsLocation = useMemo<ResultatLocation[]>(() => {
    if (!routeSelectionnee || !confirmed) return []
    return calculerLocation(routeSelectionnee, categorieId, nbJours)
  }, [routeSelectionnee, confirmed, categorieId, nbJours])

  // Trajets populaires filtrés (en suggestions sous le formulaire)
  const popularRoutes = useMemo(() => {
    if (filtreRegion === 'Toutes') return ROUTES.filter(r => r.popular)
    return ROUTES.filter(r => r.region === filtreRegion)
  }, [filtreRegion])

  // ── Sauvegarde trajet dans le contexte utilisateur ──
  function sauvegarderTrajetCtx(dep: string, arr: string) {
    const date = dateDepart || new Date().toISOString().slice(0, 10)
    setTrajet(makeTrajetCtx(dep.trim(), arr.trim(), date))
  }

  // ── Handlers ──
  const handleCalculer = () => {
    if (!depart.trim() || !arrivee.trim()) return
    if (routeMatch) {
      // Trajet connu localement — résultat immédiat
      setConfirmed(true)
      saveRecent(depart.trim(), arrivee.trim())
      setRecents(loadRecents())
      sauvegarderTrajetCtx(depart, arrivee)
    } else if (orsRoute) {
      // Trajet ORS déjà calculé, on reconfirme
      setConfirmed(true)
      sauvegarderTrajetCtx(depart, arrivee)
    } else {
      // Lance la résolution ORS (cache → API)
      resoudreViaORS()
    }
  }
  const handleSwap = () => {
    setDepart(arrivee)
    setArrivee(depart)
    setConfirmed(false)
    setOrsRoute(null)
    setOrsEtat('idle')
    setRouteCoords(null)
    setResolvedLabels(null)
  }
  const handlePickPopular = (r: Route) => {
    setDepart(r.depart); setArrivee(r.arrivee)
    setCustomDistance(''); setCustomPeages('')
    setOrsRoute(null); setOrsEtat('idle')
    setConfirmed(true)
    saveRecent(r.depart, r.arrivee)
    setRecents(loadRecents())
    sauvegarderTrajetCtx(r.depart, r.arrivee)
  }
  const handlePickRecent = (r: { depart: string; arrivee: string }) => {
    setDepart(r.depart); setArrivee(r.arrivee)
    setCustomDistance(''); setCustomPeages('')
    setOrsRoute(null); setOrsEtat('idle')
    setConfirmed(true)
  }
  const handleChangeDepart = (v: string) => {
    setDepart(v); setConfirmed(false); setOrsRoute(null); setOrsEtat('idle'); setRouteCoords(null); setResolvedLabels(null)
  }
  const handleChangeArrivee = (v: string) => {
    setArrivee(v); setConfirmed(false); setOrsRoute(null); setOrsEtat('idle'); setRouteCoords(null); setResolvedLabels(null)
  }

  return (
    <div>
      {/* ───── Carte de recherche principale ───── */}
      <div style={{
        background: 'var(--color-bg-card)', border: '1.5px solid var(--color-border)',
        borderRadius: 16, padding: '22px 24px', marginBottom: 24,
      }}>
        <div className="trajet-fields-grid with-action">
          <AutocompleteVille
            label="Départ"
            value={depart}
            onChange={handleChangeDepart}
            placeholder="Paris"
          />
          <button
            type="button"
            onClick={handleSwap}
            aria-label="Inverser départ et arrivée"
            title="Inverser"
            className="trajet-swap-btn"
            style={{
              width: 44, height: 44, borderRadius: '50%',
              background: 'var(--color-bg-alt)', border: '1.5px solid var(--color-border)',
              cursor: 'pointer', fontSize: '1.1rem', color: 'var(--color-text-muted)',
              transition: 'transform .4s ease, color .15s',
              marginBottom: 4,
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'rotate(180deg)'; e.currentTarget.style.color = 'var(--color-primary)' }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'rotate(0deg)'; e.currentTarget.style.color = 'var(--color-text-muted)' }}
          >
            ⇄
          </button>
          <AutocompleteVille
            label="Arrivée"
            value={arrivee}
            onChange={handleChangeArrivee}
            placeholder="Marseille"
          />
          <button
            onClick={handleCalculer}
            disabled={!depart.trim() || !arrivee.trim() || orsEtat === 'loading'}
            className="trajet-action-btn"
            style={{
              padding: '12px 24px', borderRadius: 10,
              cursor: (!depart.trim() || !arrivee.trim() || orsEtat === 'loading') ? 'not-allowed' : 'pointer',
              fontWeight: 700, fontSize: '0.95rem', height: 50, marginBottom: 0,
              background: (!depart.trim() || !arrivee.trim()) ? 'var(--color-border)' : 'var(--color-primary)',
              color: (!depart.trim() || !arrivee.trim()) ? 'var(--color-text-muted)' : '#0a1628',
              border: 'none', transition: 'background .15s',
              whiteSpace: 'nowrap',
            }}
          >
            {orsEtat === 'loading' ? '⏳ Calcul…' : 'Calculer →'}
          </button>
        </div>

        {/* Statut ORS — loading */}
        {orsEtat === 'loading' && (
          <div style={{
            marginTop: 14, padding: '12px 16px',
            background: 'rgba(8,145,178,0.07)', border: '1px solid rgba(8,145,178,0.25)',
            borderRadius: 10, display: 'flex', alignItems: 'center', gap: 10,
            fontSize: '0.85rem', color: '#0891b2',
          }}>
            <span style={{ animation: 'spin 1s linear infinite', display: 'inline-block' }}>⏳</span>
            Géocodage et calcul d&apos;itinéraire en cours via OpenRouteService…
          </div>
        )}

        {/* ── Labels résolus : l'utilisateur peut vérifier que "varena" a bien
             été interprété comme Varena (Italie) et pas Varėna (Lituanie). */}
        {resolvedLabels && orsEtat === 'idle' && orsRoute && (
          <div style={{
            marginTop: 14, padding: '10px 14px',
            background: 'rgba(34,197,94,0.07)', border: '1px solid rgba(34,197,94,0.25)',
            borderRadius: 10, fontSize: '0.82rem', color: 'var(--color-text)',
          }}>
            <div style={{ fontSize: '0.74rem', color: '#16a34a', fontWeight: 700, marginBottom: 4 }}>
              ✓ Itinéraire résolu
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', gap: 8 }}>
              <span><strong>Départ :</strong> {resolvedLabels.depart}</span>
              <span style={{ color: 'var(--color-text-muted)' }}>→</span>
              <span style={{ textAlign: 'right' }}><strong>Arrivée :</strong> {resolvedLabels.arrivee}</span>
            </div>
            <div style={{ marginTop: 6, fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>
              Ce n&apos;est pas la bonne ville ? Précisez (ex. <em>« Verona, Italie »</em>) ou choisissez dans la liste de suggestions.
            </div>
          </div>
        )}

        {/* Statut ORS — erreur → fallback manuel */}
        {(orsEtat === 'erreur_ors' || orsEtat === 'erreur_ville' || orsEtat === 'manuel') && needsOrs && (
          <div style={{
            marginTop: 16, padding: '14px 16px',
            background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.25)',
            borderRadius: 10,
          }}>
            <div style={{ fontSize: '0.82rem', color: '#f59e0b', fontWeight: 600, marginBottom: 10 }}>
              {orsEtat === 'erreur_ville'
                ? '⚠️ Ville introuvable — saisissez la distance manuellement'
                : '⚠️ Calcul automatique indisponible — saisissez la distance manuellement'}
            </div>
            <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--color-text-muted)', marginBottom: 5, fontWeight: 600 }}>Distance (km) *</label>
                <input type="number" value={customDistance}
                  onChange={e => { setCustomDistance(e.target.value); setConfirmed(false) }}
                  placeholder="ex : 750" style={inputStyle} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--color-text-muted)', marginBottom: 5, fontWeight: 600 }}>Péages estimés (€)</label>
                <input type="number" value={customPeages}
                  onChange={e => { setCustomPeages(e.target.value); setConfirmed(false) }}
                  placeholder="auto (0,07 €/km)" style={inputStyle} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 10, alignItems: 'center' }}>
              <button
                onClick={() => {
                  const dist = parseFloat(customDistance)
                  if (!dist) return
                  setConfirmed(true)
                }}
                disabled={!customDistance || parseFloat(customDistance) <= 0}
                style={{
                  padding: '8px 18px', borderRadius: 8, border: 'none', cursor: 'pointer',
                  background: 'var(--color-primary)', color: '#0a1628',
                  fontWeight: 700, fontSize: '0.85rem',
                  opacity: (!customDistance || parseFloat(customDistance) <= 0) ? 0.5 : 1,
                }}
              >
                Calculer avec ces valeurs →
              </button>
              <button
                onClick={() => resoudreViaORS()}
                style={{
                  padding: '8px 14px', borderRadius: 8,
                  border: '1px solid var(--color-border)', cursor: 'pointer',
                  background: 'transparent', color: 'var(--color-text-muted)',
                  fontSize: '0.82rem',
                }}
              >
                🔄 Réessayer ORS
              </button>
            </div>
            <p style={{ fontSize: '0.74rem', color: 'var(--color-text-muted)', margin: '8px 0 0' }}>
              Trouvez la distance sur{' '}
              <a href="https://maps.google.com" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-primary)' }}>Google Maps</a>.
            </p>
          </div>
        )}


        {/* Date de départ + puce voiture habituelle */}
        <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <label style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', fontWeight: 500, whiteSpace: 'nowrap' }}>
            📅 Date de départ <span style={{ opacity: 0.6 }}>(optionnel — mémorisé)</span>
          </label>
          <input
            type="date"
            value={dateDepart}
            min={new Date().toISOString().slice(0, 10)}
            onChange={e => setDateDepart(e.target.value)}
            style={{ padding: '6px 10px', borderRadius: 8, fontSize: '0.85rem', border: '1.5px solid var(--color-border)', background: 'var(--color-bg-alt)', color: 'var(--color-text)', cursor: 'pointer' }}
          />
          {context.voiture && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 12px', borderRadius: 999, fontSize: '0.78rem', fontWeight: 600, background: 'rgba(8,145,178,0.08)', border: '1px solid rgba(8,145,178,0.25)', color: '#0891b2' }}>
              🚗 {context.voiture.marque ? `${context.voiture.marque} ` : ''}{context.voiture.motorisation}
            </span>
          )}
        </div>

        {/* Recherches récentes */}
        {recents.length > 0 && !confirmed && (
          <div style={{ marginTop: 14, display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', fontWeight: 500 }}>Récents :</span>
            {recents.map((r, i) => (
              <button key={i} onClick={() => handlePickRecent(r)} style={{
                background: 'var(--color-bg-alt)', border: '1px solid var(--color-border)',
                padding: '5px 12px', borderRadius: 999, fontSize: '0.78rem', cursor: 'pointer',
                color: 'var(--color-text)', transition: 'all .15s',
              }}>
                {r.depart} → {r.arrivee}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ───── Résultats (si confirmé) ───── */}
      {routeSelectionnee && confirmed && (
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

          {/* Onglets résultats */}
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

          {/* Onglet Ma voiture */}
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

          {/* Onglet Location */}
          {onglet === 'location' && (
            <>
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

          {/* ── Stations de recharge ── */}
          {routeSelectionnee && (
            <StationsRecharge
              coordDepart={routeCoords?.depart}
              coordArrivee={routeCoords?.arrivee}
              villeDepart={routeSelectionnee.depart}
              villeArrivee={routeSelectionnee.arrivee}
              distanceTrajet={routeSelectionnee.distance_km}
            />
          )}
        </>
      )}

      {/* ───── Trajets populaires (suggestions toujours visibles) ───── */}
      <div style={{ marginTop: confirmed ? 36 : 8 }}>
        <h3 style={{ margin: '0 0 12px', fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: 10 }}>
          🗺️ Trajets populaires
          <span style={{
            background: 'var(--color-bg-alt)', color: 'var(--color-text-muted)',
            padding: '2px 10px', borderRadius: 999, fontSize: '0.72rem', fontWeight: 500,
          }}>
            {popularRoutes.length} trajet{popularRoutes.length > 1 ? 's' : ''}
          </span>
        </h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
          {REGIONS.map(r => (
            <button key={r} onClick={() => setFiltreRegion(r as string)} style={{
              padding: '5px 12px', borderRadius: 20, fontSize: '0.78rem', cursor: 'pointer',
              fontWeight: filtreRegion === r ? 700 : 400,
              background: filtreRegion === r ? 'rgba(122,240,194,0.15)' : 'transparent',
              color: filtreRegion === r ? 'var(--color-primary)' : 'var(--color-text-muted)',
              border: filtreRegion === r ? '1.5px solid var(--color-primary)' : '1.5px solid var(--color-border)',
              transition: 'all .15s',
            }}>{r}</button>
          ))}
        </div>
        {popularRoutes.length === 0 ? (
          <div style={{
            textAlign: 'center', padding: '28px 20px',
            color: 'var(--color-text-muted)', fontSize: '0.88rem',
            border: '1.5px dashed var(--color-border)', borderRadius: 12,
          }}>
            Aucun trajet populaire dans cette catégorie. Utilisez les champs ci-dessus pour calculer un autre itinéraire.
          </div>
        ) : (
          <div style={{ display: 'grid', gap: 8, gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))' }}>
            {popularRoutes.map(route => {
              const isSelected = norm(route.depart) === norm(depart) && norm(route.arrivee) === norm(arrivee)
              return (
                <button key={route.slug} onClick={() => handlePickPopular(route)} style={{
                  textAlign: 'left', padding: '12px 14px', borderRadius: 10,
                  cursor: 'pointer', transition: 'all .15s',
                  background: isSelected ? 'rgba(122,240,194,0.1)' : 'var(--color-bg-card)',
                  border: isSelected ? '2px solid var(--color-primary)' : '1.5px solid var(--color-border)',
                  color: 'var(--color-text)',
                }}>
                  <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>
                    {route.depart} → {route.arrivee}
                    {route.popular && <span style={{ marginLeft: 6, color: 'var(--color-primary)' }}>⭐</span>}
                  </div>
                  <div style={{ fontSize: '0.74rem', color: 'var(--color-text-muted)', marginTop: 3 }}>
                    {route.distance_km} km · {fmtDuree(route.duree_base_min)} · {route.peages_eur === 0 ? 'sans péage' : `${route.peages_eur} € péages`}
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
