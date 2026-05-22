'use client'

import { useState, useRef, useEffect } from 'react'
import {
  type Ville, type MeteoJour,
  fetchMeteo, geocoderVille, rechercherVille,
  VILLES_POPULAIRES, couleurScore, labelScore, formatDateFr,
} from '@/lib/assistance-meteo'

// ── Styles ─────────────────────────────────────────────────────────────────────

const COULEUR = '#7c3aed'

const cardStyle: React.CSSProperties = {
  background: 'var(--color-bg-card)',
  border: '1.5px solid var(--color-border)',
  borderRadius: 16, padding: '28px 24px',
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 14px', borderRadius: 8,
  border: '1.5px solid var(--color-border)',
  background: 'var(--color-bg-alt)',
  color: 'var(--color-text)', fontSize: '0.95rem',
  boxSizing: 'border-box' as const,
}

const btnStyle = (primary: boolean): React.CSSProperties => ({
  padding: '11px 24px', borderRadius: 8, fontWeight: 700,
  fontSize: '0.95rem', cursor: 'pointer', border: 'none',
  background: primary ? COULEUR : 'var(--color-bg-alt)',
  color: primary ? '#fff' : 'var(--color-text)',
})

function badgeAlerte(niveau: MeteoJour['niveauAlerte']): React.CSSProperties {
  const colors = {
    ok:        { bg: 'rgba(5,150,105,0.1)',    color: '#059669' },
    attention: { bg: 'rgba(234,179,8,0.12)',   color: '#b45309' },
    danger:    { bg: 'rgba(239,68,68,0.12)',   color: '#dc2626' },
  }
  const c = colors[niveau]
  return {
    display: 'inline-block', padding: '3px 10px', borderRadius: 20,
    fontSize: '0.75rem', fontWeight: 700,
    background: c.bg, color: c.color,
  }
}

// ── Autocomplete input ──────────────────────────────────────────────────────────

function VilleInput({
  label, placeholder, value, onSelect,
}: {
  label: string
  placeholder: string
  value: Ville | null
  onSelect: (v: Ville) => void
}) {
  const [query, setQuery] = useState(value?.nom ?? '')
  const [suggestions, setSuggestions] = useState<Ville[]>([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (value) setQuery(value.nom)
  }, [value])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  async function handleChange(q: string) {
    setQuery(q)
    if (q.length < 2) { setSuggestions([]); setOpen(false); return }
    const local = rechercherVille(q)
    if (local.length > 0) {
      setSuggestions(local); setOpen(true); return
    }
    setLoading(true)
    try {
      const v = await geocoderVille(q)
      setSuggestions(v ? [v] : [])
      setOpen(true)
    } finally {
      setLoading(false)
    }
  }

  function select(v: Ville) {
    setQuery(`${v.flag} ${v.nom}`)
    setSuggestions([])
    setOpen(false)
    onSelect(v)
  }

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: '0.88rem', color: 'var(--color-text-muted)' }}>
        {label}
      </label>
      <input
        type="text"
        value={query}
        placeholder={placeholder}
        onChange={e => handleChange(e.target.value)}
        onFocus={() => query.length >= 2 && suggestions.length > 0 && setOpen(true)}
        style={inputStyle}
        autoComplete="off"
      />
      {loading && (
        <div style={{ position: 'absolute', right: 12, top: 38, fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>⟳</div>
      )}
      {open && suggestions.length > 0 && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50,
          background: 'var(--color-bg-card)', border: '1px solid var(--color-border)',
          borderRadius: 8, boxShadow: '0 4px 16px rgba(0,0,0,0.15)', marginTop: 4,
        }}>
          {suggestions.map((v, i) => (
            <div
              key={i}
              onClick={() => select(v)}
              style={{
                padding: '10px 14px', cursor: 'pointer', display: 'flex', gap: 10, alignItems: 'center',
                borderBottom: i < suggestions.length - 1 ? '1px solid var(--color-border)' : 'none',
              }}
            >
              <span style={{ fontSize: '1.2rem' }}>{v.flag}</span>
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{v.nom}</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>{v.pays}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Carte météo 1 jour ─────────────────────────────────────────────────────────

function CarteJour({ jour, highlight = false }: { jour: MeteoJour; highlight?: boolean }) {
  const [open, setOpen] = useState(false)
  const scoreColor = couleurScore(jour.scoreConducte)

  return (
    <div
      style={{
        border: highlight ? `2px solid ${COULEUR}` : '1.5px solid var(--color-border)',
        borderRadius: 12,
        background: highlight ? `${COULEUR}0a` : 'var(--color-bg-card)',
        overflow: 'hidden',
      }}
    >
      {/* En-tête */}
      <div
        onClick={() => jour.alertes.length > 0 || jour.conseilsConduite.length > 0 ? setOpen(!open) : null}
        style={{
          padding: '14px 16px',
          cursor: jour.alertes.length > 0 ? 'pointer' : 'default',
          display: 'flex', alignItems: 'center', gap: 12,
        }}
      >
        <div style={{ fontSize: '2rem', flexShrink: 0 }}>{jour.emoji}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
            <span style={{ fontWeight: 700, fontSize: '0.88rem' }}>{jour.jourSemaine}</span>
            <span style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>{formatDateFr(jour.date)}</span>
            {highlight && <span style={{ fontSize: '0.72rem', fontWeight: 800, color: COULEUR, background: `${COULEUR}18`, padding: '2px 8px', borderRadius: 20 }}>⭐ Meilleur départ</span>}
          </div>
          <div style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>{jour.labelMeteo}</div>
        </div>
        <div style={{ textAlign: 'right' as const, flexShrink: 0 }}>
          <div style={{ fontWeight: 800, fontSize: '1rem' }}>
            <span style={{ color: '#dc2626' }}>{Math.round(jour.tempMax)}°</span>
            <span style={{ color: 'var(--color-text-muted)', fontWeight: 400 }}> / </span>
            <span style={{ color: '#0891b2' }}>{Math.round(jour.tempMin)}°</span>
          </div>
          <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end', marginTop: 2 }}>
            {jour.precipitations > 0.5 && <span style={{ fontSize: '0.72rem', color: '#0891b2' }}>💧{Math.round(jour.precipitations)}mm</span>}
            {jour.ventMax > 30 && <span style={{ fontSize: '0.72rem', color: '#6366f1' }}>💨{Math.round(jour.ventMax)}km/h</span>}
          </div>
        </div>
        <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
          <div style={{ width: 36, height: 36, borderRadius: '50%', background: scoreColor, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: '0.9rem' }}>
            {jour.scoreConducte}
          </div>
          <span style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)' }}>/10</span>
        </div>
        {(jour.alertes.length > 0 || jour.conseilsConduite.length > 0) && (
          <div style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>{open ? '▲' : '▼'}</div>
        )}
      </div>

      {/* Détails dépliables */}
      {open && (
        <div style={{ padding: '0 16px 16px', borderTop: '1px solid var(--color-border)' }}>
          {jour.alertes.length > 0 && (
            <div style={{ marginTop: 12 }}>
              {jour.alertes.map((a, i) => (
                <div key={i} style={{ padding: '8px 12px', borderRadius: 6, background: jour.niveauAlerte === 'danger' ? 'rgba(239,68,68,0.08)' : 'rgba(234,179,8,0.08)', fontSize: '0.84rem', color: jour.niveauAlerte === 'danger' ? '#dc2626' : '#b45309', marginBottom: 6 }}>
                  {a}
                </div>
              ))}
            </div>
          )}
          {jour.conseilsConduite.length > 0 && (
            <div style={{ marginTop: 10 }}>
              <div style={{ fontSize: '0.78rem', fontWeight: 700, color: COULEUR, marginBottom: 6 }}>Conseils de conduite</div>
              {jour.conseilsConduite.map((c, i) => (
                <div key={i} style={{ fontSize: '0.84rem', color: 'var(--color-text)', paddingLeft: 12, marginBottom: 4 }}>• {c}</div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Composant principal ─────────────────────────────────────────────────────────

type Phase = 'form' | 'loading' | 'result' | 'error'

export default function AssistanceMeteo() {
  const [depart, setDepart] = useState<Ville | null>(null)
  const [destination, setDestination] = useState<Ville | null>(null)
  const [previsionsDepart, setPrevisionsDepart] = useState<MeteoJour[]>([])
  const [previsionsDest, setPrevisionsDest] = useState<MeteoJour[]>([])
  const [phase, setPhase] = useState<Phase>('form')
  const [erreur, setErreur] = useState('')
  const [onglet, setOnglet] = useState<'depart' | 'destination'>('depart')

  const VILLES_SUGGERES = VILLES_POPULAIRES.slice(0, 12)

  async function lancerRecherche() {
    if (!depart) return
    setPhase('loading')
    setErreur('')
    try {
      const [prevDep, prevDest] = await Promise.all([
        fetchMeteo(depart.lat, depart.lon),
        destination ? fetchMeteo(destination.lat, destination.lon) : Promise.resolve([]),
      ])
      setPrevisionsDepart(prevDep)
      setPrevisionsDest(prevDest)
      setOnglet('depart')
      setPhase('result')
    } catch {
      setErreur("Impossible de récupérer les données météo. Vérifiez votre connexion et réessayez.")
      setPhase('error')
    }
  }

  function reset() {
    setPhase('form')
    setPrevisionsDepart([])
    setPrevisionsDest([])
    setErreur('')
  }

  // ── Formulaire ──────────────────────────────────────────────────────────────

  if (phase === 'form' || phase === 'error') {
    return (
      <div style={{ maxWidth: 680, margin: '0 auto' }}>
        <div style={cardStyle}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: 8 }}>
            🗺️ Vos lieux de départ et destination
          </h2>
          <p style={{ fontSize: '0.88rem', color: 'var(--color-text-muted)', marginBottom: 24 }}>
            Obtenez les prévisions météo 7 jours et le meilleur jour pour partir.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <VilleInput
              label="Ville de départ *"
              placeholder="Paris, Lyon, Bordeaux…"
              value={depart}
              onSelect={setDepart}
            />
            <VilleInput
              label="Destination (optionnel)"
              placeholder="Biarritz, Rome, Barcelone…"
              value={destination}
              onSelect={setDestination}
            />
          </div>

          {/* Suggestions rapides */}
          <div style={{ marginTop: 20 }}>
            <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: 10 }}>
              Destinations populaires
            </div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {VILLES_SUGGERES.map((v, i) => (
                <button
                  key={i}
                  onClick={() => destination ? setDestination(v) : depart ? setDestination(v) : setDepart(v)}
                  style={{
                    padding: '5px 12px', borderRadius: 20, border: '1px solid var(--color-border)',
                    background: 'var(--color-bg-alt)', cursor: 'pointer', fontSize: '0.8rem',
                    color: 'var(--color-text)',
                  }}
                >
                  {v.flag} {v.nom}
                </button>
              ))}
            </div>
          </div>

          {erreur && (
            <div style={{ marginTop: 16, padding: '10px 14px', borderRadius: 8, background: 'rgba(239,68,68,0.08)', color: '#dc2626', fontSize: '0.88rem' }}>
              ⚠️ {erreur}
            </div>
          )}

          <div style={{ marginTop: 24, display: 'flex', justifyContent: 'flex-end' }}>
            <button
              style={btnStyle(true)}
              disabled={!depart}
              onClick={lancerRecherche}
            >
              Voir les prévisions météo →
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── Loading ─────────────────────────────────────────────────────────────────

  if (phase === 'loading') {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px' }}>
        <div style={{ fontSize: '3rem', marginBottom: 16 }}>🌤️</div>
        <div style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: 8 }}>Récupération des prévisions…</div>
        <div style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>Connexion à Open-Meteo</div>
      </div>
    )
  }

  // ── Résultats ───────────────────────────────────────────────────────────────

  const prevActives = onglet === 'depart' ? previsionsDepart : previsionsDest
  const villeActive = onglet === 'depart' ? depart! : destination!

  // Meilleur jour = score max
  const meilleurJour = [...prevActives].sort((a, b) => b.scoreConducte - a.scoreConducte)[0]

  // Alertes globales
  const joursAvecDanger = prevActives.filter(j => j.niveauAlerte === 'danger')
  const alertesGlobales: string[] = []
  if (joursAvecDanger.length >= 3) alertesGlobales.push(`⚠️ ${joursAvecDanger.length} jours à conditions difficiles cette semaine — planifiez soigneusement.`)
  if (prevActives.some(j => j.ventMax >= 90)) alertesGlobales.push("💨 Vents violents prévus — déconseillé pour camping-cars et remorques.")
  if (prevActives.some(j => j.tempMax >= 40)) alertesGlobales.push("🌡️ Canicule extrême prévue — eau et climatisation indispensables.")

  return (
    <div style={{ maxWidth: 680, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* En-tête résultat */}
      <div style={{ ...cardStyle, padding: '16px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: '1rem' }}>
              {depart?.flag} {depart?.nom}
              {destination && <span style={{ color: 'var(--color-text-muted)', fontWeight: 400 }}> → {destination.flag} {destination.nom}</span>}
            </div>
            <div style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', marginTop: 2 }}>
              Prévisions 7 jours · Open-Meteo
            </div>
          </div>
          <button style={btnStyle(false)} onClick={reset}>← Nouvelle recherche</button>
        </div>
      </div>

      {/* Onglets départ / destination */}
      {destination && (
        <div style={{ display: 'flex', borderBottom: '2px solid var(--color-border)' }}>
          {(['depart', 'destination'] as const).map(t => (
            <button
              key={t}
              onClick={() => setOnglet(t)}
              style={{
                padding: '10px 20px', border: 'none', background: 'none', cursor: 'pointer',
                fontWeight: onglet === t ? 700 : 400, fontSize: '0.9rem',
                color: onglet === t ? COULEUR : 'var(--color-text-muted)',
                borderBottom: onglet === t ? `2px solid ${COULEUR}` : '2px solid transparent',
                marginBottom: -2,
              }}
            >
              {t === 'depart' ? `${depart?.flag} ${depart?.nom}` : `${destination?.flag} ${destination?.nom}`}
            </button>
          ))}
        </div>
      )}

      {/* Alertes globales */}
      {alertesGlobales.length > 0 && (
        <div style={{ ...cardStyle, background: 'rgba(239,68,68,0.05)', borderColor: 'rgba(239,68,68,0.25)', padding: '16px 20px' }}>
          {alertesGlobales.map((a, i) => (
            <div key={i} style={{ fontSize: '0.88rem', color: '#dc2626', marginBottom: i < alertesGlobales.length - 1 ? 6 : 0 }}>{a}</div>
          ))}
        </div>
      )}

      {/* Meilleur jour départ */}
      {meilleurJour && (
        <div>
          <div style={{ fontSize: '0.82rem', fontWeight: 700, color: COULEUR, marginBottom: 8, textTransform: 'uppercase' as const, letterSpacing: '0.04em' }}>
            ⭐ Meilleur jour pour partir depuis {villeActive.nom}
          </div>
          <CarteJour jour={meilleurJour} highlight={true} />
        </div>
      )}

      {/* Prévisions 7 jours */}
      <div>
        <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--color-text-muted)', marginBottom: 10, textTransform: 'uppercase' as const, letterSpacing: '0.04em' }}>
          Prévisions 7 jours — {villeActive.flag} {villeActive.nom}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {prevActives.map((jour, i) => (
            <CarteJour key={i} jour={jour} />
          ))}
        </div>
      </div>

      {/* Légende score */}
      <div style={{ ...cardStyle, padding: '16px 20px' }}>
        <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--color-text-muted)', marginBottom: 10 }}>Score conditions de conduite</div>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          {[
            { min: 8, max: 10, label: 'Excellent', color: '#059669' },
            { min: 5, max: 7,  label: 'Bon / Moyen', color: '#f59e0b' },
            { min: 0, max: 4,  label: 'Difficile', color: '#dc2626' },
          ].map(item => (
            <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 24, height: 24, borderRadius: '50%', background: item.color, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '0.7rem', fontWeight: 800 }}>
                {item.min}
              </div>
              <span style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>{item.label}</span>
            </div>
          ))}
        </div>
        <p style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', marginTop: 10 }}>
          Cliquez sur un jour pour voir les alertes et conseils de conduite détaillés.
        </p>
      </div>
    </div>
  )
}
