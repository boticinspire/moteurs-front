'use client'

import { useState, useRef } from 'react'
import { Link } from '@/i18n/navigation'
import { useUserContext } from '@/context/UserContextProvider'

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface VehicleSpecs {
  prix_base: string
  puissance: string
  autonomie_wltp: string | null
  consommation: string
  recharge_max_kw: string | null
  capacite_batterie_kwh: string | null
  coffre_litres: string
  longueur_mm: string
  poids_kg: string
  garantie: string
}

interface VehicleResult {
  nom: string
  annee_modele: string
  specs: VehicleSpecs
  points_forts: string[]
  points_faibles: string[]
  pour_qui: string
  verdict: string
  note_globale: number
}

interface ComparaisonResult {
  motorisation: string
  modeles: VehicleResult[]
  synthese: {
    meilleur_rapport_qp: string
    meilleur_autonomie: string | null
    meilleur_recharge: string | null
    meilleur_espace: string
    conclusion: string
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Données statiques
// ─────────────────────────────────────────────────────────────────────────────

const MOTORISATIONS = [
  { id: 'Électrique', label: '⚡ Électrique', emoji: '⚡' },
  { id: 'Hybride rechargeable (PHEV)', label: '🔋 Hybride PHEV', emoji: '🔋' },
  { id: 'Hybride (HEV)', label: '♻️ Hybride HEV', emoji: '♻️' },
  { id: 'Essence', label: '⛽ Essence', emoji: '⛽' },
  { id: 'Diesel', label: '🛢️ Diesel', emoji: '🛢️' },
  { id: 'GNV / Hydrogène', label: '💨 GNV / H₂', emoji: '💨' },
]

const SUGGESTIONS: Record<string, string[]> = {
  'Électrique': ['Tesla Model 3', 'Renault Mégane E-Tech', 'Volkswagen ID.4', 'Peugeot e-208', 'BMW iX1', 'Hyundai Ioniq 6', 'Kia EV6', 'Tesla Model Y'],
  'Hybride rechargeable (PHEV)': ['Toyota RAV4 PHEV', 'Peugeot 3008 PHEV', 'Renault Captur E-Tech', 'BMW X1 xDrive25e', 'Volvo XC60 T6', 'Mitsubishi Outlander PHEV'],
  'Hybride (HEV)': ['Toyota Yaris Hybrid', 'Toyota Corolla Hybrid', 'Renault Clio E-Tech', 'Honda Jazz e:HEV', 'Lexus UX 250h'],
  'Essence': ['Volkswagen Golf', 'Renault Clio', 'Peugeot 308', 'Ford Focus', 'BMW Série 1'],
  'Diesel': ['Peugeot 308 BlueHDi', 'Volkswagen Golf TDI', 'Renault Megane dCi', 'BMW Série 3 320d'],
  'GNV / Hydrogène': ['Toyota Mirai', 'Hyundai Nexo', 'Volkswagen Caddy TGI', 'Seat Leon TGI'],
}

const CARD_COLORS = [
  { bg: 'rgba(14,165,233,0.07)', border: 'rgba(14,165,233,0.3)', accent: '#0ea5e9' },
  { bg: 'rgba(234,88,12,0.07)', border: 'rgba(234,88,12,0.3)', accent: '#ea580c' },
  { bg: 'rgba(139,92,246,0.07)', border: 'rgba(139,92,246,0.3)', accent: '#8b5cf6' },
  { bg: 'rgba(16,185,129,0.07)', border: 'rgba(16,185,129,0.3)', accent: '#10b981' },
  { bg: 'rgba(245,158,11,0.07)', border: 'rgba(245,158,11,0.3)', accent: '#f59e0b' },
]

// ─────────────────────────────────────────────────────────────────────────────
// CSS scopé .cm-tool
// ─────────────────────────────────────────────────────────────────────────────

const CSS = `
.cm{
  --bg:var(--color-bg);--surface:var(--color-bg-card);--surface-2:var(--color-bg-alt);
  --text:var(--color-text);--text-soft:var(--color-text-soft);--text-muted:var(--color-text-muted);
  --line:var(--color-border);--line-2:rgba(128,128,128,.09);
  --accent:var(--color-primary);--accent-deep:var(--color-primary-dark);--accent-soft:rgba(239,108,26,.13);
  --green:#10b981;--green-soft:rgba(16,185,129,.12);
  --red:#ef4444;--red-soft:rgba(239,68,68,.10);
  --shadow:0 1px 3px rgba(16,24,43,.06),0 12px 32px -14px rgba(16,24,43,.18);
  background:var(--bg);color:var(--text);font-size:16px;line-height:1.55;
  -webkit-font-smoothing:antialiased;
}
html[data-theme="dark"] .cm{
  --shadow:0 1px 3px rgba(0,0,0,.4),0 16px 36px -16px rgba(0,0,0,.55);
  --line-2:rgba(255,255,255,.05);
}
.cm *{box-sizing:border-box;margin:0;padding:0}
.cm-wrap{max-width:1140px;margin:0 auto;padding:26px 20px 80px}
.cm-crumb{font-size:.82rem;color:var(--text-muted);margin-bottom:20px}
.cm-crumb a{color:var(--text-soft);text-decoration:none}
.cm-crumb a:hover{color:var(--accent)}
.cm-crumb span{margin:0 6px;opacity:.5}
.cm-head{border-bottom:1px solid var(--line);padding-bottom:22px;margin-bottom:32px}
.cm-meta{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin-bottom:14px}
.cm-chip{display:inline-flex;gap:6px;align-items:center;font-size:.73rem;font-weight:700;
  letter-spacing:.05em;text-transform:uppercase;padding:5px 11px;border-radius:999px;
  background:var(--surface-2);border:1px solid var(--line);color:var(--text-soft)}
.cm-chip.accent{background:var(--accent-soft);color:var(--accent);border-color:transparent}
.cm h1{font-size:clamp(1.8rem,4vw,2.6rem);font-weight:800;line-height:1.08;letter-spacing:-.02em;margin-bottom:.3em}
.cm-lede{color:var(--text-soft);font-size:1rem;max-width:62ch}
/* Config panel */
.cm-panel{background:var(--surface);border:1px solid var(--line);border-radius:18px;box-shadow:var(--shadow);padding:26px 28px;margin-bottom:30px}
.cm-panel h2{font-size:1.1rem;font-weight:700;margin-bottom:18px}
.cm-label{display:block;font-weight:700;font-size:.88rem;margin-bottom:10px;color:var(--text)}
.cm-mot{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:28px}
.cm-mot-btn{padding:9px 16px;border:1.5px solid var(--line);border-radius:10px;
  font:inherit;font-size:.87rem;font-weight:600;background:var(--surface-2);color:var(--text-soft);
  cursor:pointer;transition:all .15s}
.cm-mot-btn:hover{border-color:var(--accent);color:var(--accent)}
.cm-mot-btn.active{background:var(--accent-deep);border-color:var(--accent-deep);color:#fff}
.cm-inputs{display:flex;flex-direction:column;gap:10px;margin-bottom:20px}
.cm-input-row{display:flex;gap:8px;align-items:center}
.cm-num{width:28px;height:28px;border-radius:50%;background:var(--accent-deep);color:#fff;
  font-size:.78rem;font-weight:800;display:flex;align-items:center;justify-content:center;flex-shrink:0}
.cm-input{flex:1;font:inherit;color:var(--text);background:var(--surface-2);
  border:1.3px solid var(--line);border-radius:10px;padding:10px 14px;font-size:.95rem;
  transition:border-color .15s,box-shadow .15s}
.cm-input:focus{outline:none;border-color:var(--accent);box-shadow:0 0 0 3px var(--accent-soft)}
.cm-input::placeholder{color:var(--text-muted)}
.cm-input-del{width:34px;height:34px;border:1.3px solid var(--line);border-radius:8px;background:var(--surface-2);
  color:var(--text-muted);cursor:pointer;font-size:1.1rem;display:flex;align-items:center;justify-content:center;
  transition:all .15s;flex-shrink:0}
.cm-input-del:hover{border-color:var(--red);color:var(--red)}
.cm-add-btn{display:inline-flex;align-items:center;gap:7px;padding:8px 15px;
  border:1.5px dashed var(--line);border-radius:10px;background:transparent;
  color:var(--text-muted);font:inherit;font-size:.87rem;cursor:pointer;transition:all .15s;margin-top:4px}
.cm-add-btn:hover{border-color:var(--accent);color:var(--accent)}
.cm-sugg{margin-top:14px}
.cm-sugg-label{font-size:.77rem;font-weight:700;text-transform:uppercase;letter-spacing:.05em;
  color:var(--text-muted);margin-bottom:8px}
.cm-sugg-chips{display:flex;flex-wrap:wrap;gap:6px}
.cm-sugg-chip{padding:5px 11px;border:1px solid var(--line);border-radius:20px;
  font:inherit;font-size:.82rem;background:var(--surface-2);color:var(--text-soft);cursor:pointer;transition:all .12s}
.cm-sugg-chip:hover{border-color:var(--accent);color:var(--accent)}
.cm-cta{display:flex;align-items:center;gap:14px;margin-top:24px;padding-top:22px;border-top:1px solid var(--line)}
.cm-submit{padding:13px 28px;background:var(--accent-deep);color:#fff;border:none;border-radius:11px;
  font:inherit;font-size:1rem;font-weight:800;cursor:pointer;transition:opacity .15s;white-space:nowrap}
.cm-submit:hover:not(:disabled){opacity:.88}
.cm-submit:disabled{opacity:.5;cursor:not-allowed}
.cm-cta-note{font-size:.82rem;color:var(--text-muted)}
/* Loading */
.cm-loading{text-align:center;padding:60px 24px}
.cm-spinner{width:44px;height:44px;border:3px solid var(--line);border-top-color:var(--accent);
  border-radius:50%;animation:cm-spin .8s linear infinite;margin:0 auto 18px}
@keyframes cm-spin{to{transform:rotate(360deg)}}
.cm-loading p{color:var(--text-muted);font-size:.95rem}
/* Error */
.cm-error{padding:20px 24px;background:var(--red-soft);border:1px solid rgba(239,68,68,.25);
  border-radius:13px;color:var(--red);font-size:.9rem;margin-bottom:20px}
/* Results */
.cm-results{animation:cm-fadein .35s ease}
@keyframes cm-fadein{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
.cm-synthese{background:var(--surface);border:1px solid var(--line);border-radius:18px;
  box-shadow:var(--shadow);padding:26px 28px;margin-bottom:28px}
.cm-synthese h2{font-size:1.15rem;font-weight:700;margin-bottom:16px}
.cm-badges{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:18px}
.cm-badge{display:inline-flex;gap:7px;align-items:center;padding:6px 13px;border-radius:20px;
  font-size:.78rem;font-weight:700;background:var(--surface-2);border:1px solid var(--line);color:var(--text-soft)}
.cm-badge.winner{background:var(--accent-soft);border-color:transparent;color:var(--accent)}
.cm-conclusion{font-size:.95rem;color:var(--text-soft);line-height:1.7;
  background:var(--surface-2);border-radius:12px;padding:16px 18px;border-left:3px solid var(--accent)}
/* Tableau comparatif */
.cm-table-wrap{overflow-x:auto;border:1px solid var(--line);border-radius:14px;background:var(--surface);
  box-shadow:var(--shadow);margin-bottom:28px}
.cm-table-wrap table{border-collapse:collapse;width:100%;min-width:500px;font-size:.88rem}
.cm-table-wrap th,.cm-table-wrap td{padding:11px 16px;text-align:right}
.cm-table-wrap th:first-child,.cm-table-wrap td:first-child{text-align:left;font-weight:600;color:var(--text-soft)}
.cm-table-wrap thead tr{background:linear-gradient(90deg,rgba(14,165,233,.08) 0%,rgba(234,88,12,.06) 100%)}
.cm-table-wrap thead th{font-size:.8rem;font-weight:800;letter-spacing:.03em}
.cm-table-wrap thead th:first-child{color:var(--text-muted)}
.cm-table-wrap tbody tr{border-top:1px solid var(--line-2)}
.cm-table-wrap tbody tr:hover{background:var(--surface-2)}
.cm-table-wrap .cm-note-cell{font-weight:800;font-size:1rem}
.cm-table-wrap .cm-best{color:var(--green);font-weight:800}
.cm-table-wrap .null-val{color:var(--text-muted);font-size:.8rem}
/* Grille de cartes modèles */
.cm-cards{display:grid;gap:20px;margin-bottom:30px}
@media(min-width:640px){.cm-cards.n2{grid-template-columns:repeat(2,1fr)}}
@media(min-width:640px){.cm-cards.n3{grid-template-columns:repeat(3,1fr)}}
@media(min-width:640px){.cm-cards.n4{grid-template-columns:repeat(2,1fr)}}
@media(min-width:960px){.cm-cards.n4{grid-template-columns:repeat(4,1fr)}}
@media(min-width:640px){.cm-cards.n5{grid-template-columns:repeat(2,1fr)}}
@media(min-width:1000px){.cm-cards.n5{grid-template-columns:repeat(5,1fr)}}
.cm-card{border-radius:16px;border:1px solid var(--line);background:var(--surface);overflow:hidden;display:flex;flex-direction:column}
.cm-card-top{padding:18px 18px 14px}
.cm-card-year{font-size:.72rem;font-weight:700;text-transform:uppercase;letter-spacing:.06em;
  color:var(--text-muted);margin-bottom:6px}
.cm-card-name{font-size:1rem;font-weight:800;line-height:1.2;margin-bottom:10px}
.cm-card-note{display:inline-flex;align-items:center;gap:6px;font-size:1.3rem;font-weight:800;
  font-variant-numeric:tabular-nums}
.cm-card-note .cm-stars{font-size:.9rem;letter-spacing:-2px}
.cm-card-specs{padding:0 18px 14px;border-bottom:1px solid var(--line-2)}
.cm-spec-row{display:flex;justify-content:space-between;gap:8px;padding:5px 0;
  border-bottom:1px solid var(--line-2);font-size:.84rem}
.cm-spec-row:last-child{border-bottom:none}
.cm-spec-row .sl{color:var(--text-muted)}
.cm-spec-row .sv{font-weight:600;text-align:right}
.cm-card-body{padding:14px 18px 18px;flex:1;display:flex;flex-direction:column;gap:14px}
.cm-card-section h4{font-size:.72rem;font-weight:800;text-transform:uppercase;letter-spacing:.07em;margin-bottom:8px}
.cm-card-section.forts h4{color:var(--green)}
.cm-card-section.faibles h4{color:var(--red)}
.cm-card-section.verdict h4{color:var(--accent)}
.cm-fort-item,.cm-faible-item{display:flex;gap:7px;align-items:flex-start;font-size:.84rem;margin-bottom:5px;line-height:1.4}
.cm-fort-item:last-child,.cm-faible-item:last-child{margin-bottom:0}
.cm-fort-item .ico{color:var(--green);font-weight:800;flex-shrink:0;margin-top:1px}
.cm-faible-item .ico{color:var(--red);flex-shrink:0;margin-top:1px}
.cm-pour-qui{font-size:.82rem;color:var(--text-muted);font-style:italic;
  background:var(--surface-2);border-radius:8px;padding:9px 11px;margin-top:2px}
.cm-verdict-text{font-size:.86rem;color:var(--text-soft);line-height:1.6}
/* Reset btn */
.cm-reset{display:inline-flex;align-items:center;gap:6px;padding:9px 18px;
  border:1.5px solid var(--line);border-radius:10px;background:transparent;
  color:var(--text-muted);font:inherit;font-size:.87rem;cursor:pointer;transition:all .15s}
.cm-reset:hover{border-color:var(--accent);color:var(--accent)}
/* Disclaimer */
.cm-disc{margin-top:28px;padding:14px 18px;background:var(--surface-2);border:1px solid var(--line);
  border-radius:12px;font-size:.8rem;color:var(--text-muted);line-height:1.6}
`

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function NoteStars({ note }: { note: number }) {
  const full = Math.floor(note / 2)
  const half = (note / 2 - full) >= 0.4 ? 1 : 0
  const empty = 5 - full - half
  return (
    <span className="cm-stars" title={`${note}/10`}>
      {'★'.repeat(full)}{'½'.repeat(half)}{'☆'.repeat(empty)}
    </span>
  )
}

function getBestIndex(modeles: VehicleResult[], key: keyof VehicleSpecs): number {
  // Pour les specs numériques : trouve l'index avec la valeur la plus haute
  let best = -1
  let bestVal = -Infinity
  modeles.forEach((m, i) => {
    const raw = m.specs[key]
    if (!raw) return
    const num = parseFloat(String(raw).replace(/[^\d.,]/g, '').replace(',', '.'))
    if (!isNaN(num) && num > bestVal) { bestVal = num; best = i }
  })
  return best
}

// ─────────────────────────────────────────────────────────────────────────────
// Composant principal
// ─────────────────────────────────────────────────────────────────────────────

export default function ComparateurModeles() {
  const { userId, isBootstrapped } = useUserContext()

  const [motorisation, setMotorisation] = useState('Électrique')
  const [modeles, setModeles] = useState<string[]>(['', ''])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<ComparaisonResult | null>(null)
  const resultsRef = useRef<HTMLDivElement>(null)

  const suggestions = SUGGESTIONS[motorisation] ?? []
  const filledModeles = modeles.filter(m => m.trim().length > 0)
  const canCompare = filledModeles.length >= 2

  function addModele() {
    if (modeles.length < 5) setModeles([...modeles, ''])
  }

  function removeModele(i: number) {
    if (modeles.length <= 2) return
    setModeles(modeles.filter((_, idx) => idx !== i))
  }

  function updateModele(i: number, val: string) {
    const next = [...modeles]
    next[i] = val
    setModeles(next)
  }

  function addSuggestion(s: string) {
    const emptyIdx = modeles.findIndex(m => m.trim() === '')
    if (emptyIdx >= 0) {
      updateModele(emptyIdx, s)
    } else if (modeles.length < 5) {
      setModeles([...modeles, s])
    }
  }

  async function handleCompare() {
    if (!canCompare) return
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const res = await fetch('/api/comparer-modeles', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ modeles: filledModeles, motorisation }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? `Erreur ${res.status}`)
      setResult(data)
      setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur inconnue')
    } finally {
      setLoading(false)
    }
  }

  function handleReset() {
    setResult(null)
    setError(null)
  }

  // ── Attente bootstrap ────────────────────────────────────────────────────
  if (!isBootstrapped) {
    return (
      <div className="cm">
        <style>{CSS}</style>
        <div className="cm-wrap">
          <div className="cm-loading">
            <div className="cm-spinner" />
            <p>Vérification de votre accès…</p>
          </div>
        </div>
      </div>
    )
  }

  // ── Gate membres ─────────────────────────────────────────────────────────
  if (!userId) {
    return (
      <div className="cm">
        <style>{CSS}</style>
        <div className="cm-wrap">
          <nav className="cm-crumb">
            <Link href="/">Moteurs.com</Link>
            <span>/</span>
            <Link href="/outils/cartes-recharge">Outils</Link>
            <span>/</span>
            Comparateur de modèles
          </nav>
          <div style={{ maxWidth: 560, margin: '0 auto', padding: '16px 0 48px' }}>
            <div style={{ background: 'var(--color-bg-card)', border: '1.5px solid var(--color-border)', borderRadius: 20, overflow: 'hidden', textAlign: 'center' }}>
              <div style={{ padding: '32px 32px 24px', background: 'linear-gradient(135deg,rgba(14,165,233,.08),rgba(122,240,194,.08))', borderBottom: '1px solid var(--color-border)' }}>
                <div style={{ fontSize: '3rem', marginBottom: 16 }}>🚗</div>
                <div style={{ display: 'inline-block', marginBottom: 14, fontSize: '.72rem', fontWeight: 700, letterSpacing: '.08em', padding: '4px 12px', borderRadius: 20, background: 'rgba(14,165,233,.12)', color: 'var(--color-primary)', border: '1px solid rgba(14,165,233,.25)', textTransform: 'uppercase' }}>Réservé aux membres</div>
                <h2 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: 10 }}>Comparateur de modèles</h2>
                <p style={{ fontSize: '.92rem', color: 'var(--color-text-muted)', lineHeight: 1.6, margin: 0 }}>Comparez jusqu&apos;à 5 véhicules de même motorisation côte à côte : specs, points forts, points faibles, verdict IA.</p>
              </div>
              <div style={{ padding: '24px 32px 32px' }}>
                <div style={{ marginBottom: 24, textAlign: 'left' }}>
                  <div style={{ fontSize: '.82rem', fontWeight: 700, color: 'var(--color-text-muted)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '.05em' }}>Ce module inclut</div>
                  {['Comparaison instantanée de 2 à 5 modèles','Données 2024/2025 : autonomie, recharge, prix, coffre…','Points forts & faibles générés par IA','Tableau récapitulatif avec meilleurs scores','Toutes motorisations : électrique, hybride, diesel, essence…'].map((a, i) => (
                    <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 8, fontSize: '.88rem', color: 'var(--color-text)' }}>
                      <span style={{ color: 'var(--color-primary)', fontWeight: 700, flexShrink: 0, marginTop: 1 }}>✓</span>
                      {a}
                    </div>
                  ))}
                </div>
                <a href={`/espace-membres?redirect=${typeof window !== 'undefined' ? encodeURIComponent(window.location.pathname) : '/outils/comparer-modeles'}`} style={{ display: 'block', width: '100%', padding: '14px 24px', background: 'var(--color-primary)', color: '#0a1628', borderRadius: 10, fontWeight: 800, fontSize: '1rem', textDecoration: 'none', marginBottom: 12 }}>Créer mon compte gratuit →</a>
                <a href="/espace-membres" style={{ display: 'block', width: '100%', padding: '12px 24px', background: 'transparent', color: 'var(--color-text-muted)', border: '1.5px solid var(--color-border)', borderRadius: 10, fontWeight: 600, fontSize: '.92rem', textDecoration: 'none' }}>J&apos;ai déjà un compte — me connecter</a>
                <div style={{ marginTop: 20, fontSize: '.78rem', color: 'var(--color-text-muted)', lineHeight: 1.6 }}>✦ Connexion sans mot de passe · Gratuit · Sans engagement</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ── Interface principale ─────────────────────────────────────────────────
  return (
    <div className="cm">
      <style>{CSS}</style>
      <div className="cm-wrap">

        {/* Fil d'ariane */}
        <nav className="cm-crumb">
          <Link href="/">Moteurs.com</Link>
          <span>/</span>
          <Link href="/outils/cartes-recharge">Outils</Link>
          <span>/</span>
          Comparateur de modèles
        </nav>

        {/* En-tête */}
        <header className="cm-head">
          <div className="cm-meta">
            <span className="cm-chip accent">🚗 Outil membres</span>
            <span className="cm-chip">IA · Données 2024–2025</span>
          </div>
          <h1>Comparez jusqu'à 5 véhicules</h1>
          <p className="cm-lede">
            Sélectionnez une motorisation, entrez les modèles à comparer — l'IA analyse specs, points forts et points faibles en quelques secondes.
          </p>
        </header>

        {/* Panneau de configuration */}
        <div className="cm-panel">
          <h2>⚙️ Configuration de la comparaison</h2>

          {/* Motorisation */}
          <label className="cm-label">1. Choisissez la motorisation</label>
          <div className="cm-mot">
            {MOTORISATIONS.map(m => (
              <button
                key={m.id}
                className={`cm-mot-btn${motorisation === m.id ? ' active' : ''}`}
                onClick={() => { setMotorisation(m.id); setResult(null); setError(null) }}
              >
                {m.label}
              </button>
            ))}
          </div>

          {/* Modèles */}
          <label className="cm-label">2. Entrez les modèles à comparer ({modeles.length}/5)</label>
          <div className="cm-inputs">
            {modeles.map((m, i) => (
              <div className="cm-input-row" key={i}>
                <div className="cm-num">{i + 1}</div>
                <input
                  className="cm-input"
                  type="text"
                  value={m}
                  onChange={e => updateModele(i, e.target.value)}
                  placeholder={`Ex. : ${suggestions[i] ?? 'Marque + Modèle'}`}
                  onKeyDown={e => { if (e.key === 'Enter' && canCompare) handleCompare() }}
                />
                {modeles.length > 2 && (
                  <button className="cm-input-del" onClick={() => removeModele(i)} title="Supprimer">✕</button>
                )}
              </div>
            ))}
          </div>

          {modeles.length < 5 && (
            <button className="cm-add-btn" onClick={addModele}>
              <span style={{ fontSize: '1.1rem', fontWeight: 700 }}>+</span>
              Ajouter un modèle
            </button>
          )}

          {/* Suggestions */}
          <div className="cm-sugg">
            <div className="cm-sugg-label">Suggestions {motorisation}</div>
            <div className="cm-sugg-chips">
              {suggestions.map(s => (
                <button key={s} className="cm-sugg-chip" onClick={() => addSuggestion(s)}>{s}</button>
              ))}
            </div>
          </div>

          {/* CTA */}
          <div className="cm-cta">
            <button
              className="cm-submit"
              disabled={!canCompare || loading}
              onClick={handleCompare}
            >
              {loading ? 'Analyse en cours…' : `Comparer ${filledModeles.length} modèle${filledModeles.length > 1 ? 's' : ''} →`}
            </button>
            <span className="cm-cta-note">
              {filledModeles.length < 2
                ? 'Saisissez au moins 2 modèles'
                : `${filledModeles.length} modèle${filledModeles.length > 1 ? 's' : ''} · Analyse IA ~10s`}
            </span>
          </div>
        </div>

        {/* Erreur */}
        {error && <div className="cm-error">⚠️ {error}</div>}

        {/* Chargement */}
        {loading && (
          <div className="cm-loading">
            <div className="cm-spinner" />
            <p>Claude analyse les véhicules…<br /><span style={{ fontSize: '.8rem' }}>Comparaison des specs, forces et faiblesses</span></p>
          </div>
        )}

        {/* Résultats */}
        {result && (
          <div className="cm-results" ref={resultsRef}>

            {/* Synthèse */}
            <div className="cm-synthese">
              <h2>📊 Synthèse comparative — {result.motorisation}</h2>
              <div className="cm-badges">
                {result.synthese.meilleur_rapport_qp && (
                  <span className="cm-badge winner">🏆 Meilleur rapport Q/P · {result.synthese.meilleur_rapport_qp}</span>
                )}
                {result.synthese.meilleur_autonomie && (
                  <span className="cm-badge winner">⚡ Meilleure autonomie · {result.synthese.meilleur_autonomie}</span>
                )}
                {result.synthese.meilleur_recharge && (
                  <span className="cm-badge winner">🔌 Recharge la plus rapide · {result.synthese.meilleur_recharge}</span>
                )}
                {result.synthese.meilleur_espace && (
                  <span className="cm-badge">📦 Plus spacieux · {result.synthese.meilleur_espace}</span>
                )}
              </div>
              <div className="cm-conclusion">{result.synthese.conclusion}</div>
            </div>

            {/* Tableau comparatif */}
            <div className="cm-table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Critère</th>
                    {result.modeles.map((m, i) => (
                      <th key={i} style={{ color: CARD_COLORS[i % CARD_COLORS.length].accent }}>
                        {m.nom}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {/* Ligne prix */}
                  <tr>
                    <td>Prix de base</td>
                    {result.modeles.map((m, i) => <td key={i}>{m.specs.prix_base}</td>)}
                  </tr>
                  {/* Ligne puissance */}
                  <tr>
                    <td>Puissance</td>
                    {result.modeles.map((m, i) => <td key={i}>{m.specs.puissance}</td>)}
                  </tr>
                  {/* Autonomie (si applicable) */}
                  {result.modeles.some(m => m.specs.autonomie_wltp) && (
                    <tr>
                      <td>Autonomie WLTP</td>
                      {result.modeles.map((m, i) => {
                        const best = getBestIndex(result.modeles, 'autonomie_wltp')
                        return (
                          <td key={i} className={best === i ? 'cm-best' : ''}>
                            {m.specs.autonomie_wltp ?? <span className="null-val">N/A</span>}
                          </td>
                        )
                      })}
                    </tr>
                  )}
                  {/* Consommation */}
                  <tr>
                    <td>Consommation</td>
                    {result.modeles.map((m, i) => <td key={i}>{m.specs.consommation}</td>)}
                  </tr>
                  {/* Recharge (si applicable) */}
                  {result.modeles.some(m => m.specs.recharge_max_kw) && (
                    <tr>
                      <td>Recharge max DC</td>
                      {result.modeles.map((m, i) => {
                        const best = getBestIndex(result.modeles, 'recharge_max_kw')
                        return (
                          <td key={i} className={best === i ? 'cm-best' : ''}>
                            {m.specs.recharge_max_kw ?? <span className="null-val">N/A</span>}
                          </td>
                        )
                      })}
                    </tr>
                  )}
                  {/* Coffre */}
                  <tr>
                    <td>Coffre</td>
                    {result.modeles.map((m, i) => {
                      const best = getBestIndex(result.modeles, 'coffre_litres')
                      return (
                        <td key={i} className={best === i ? 'cm-best' : ''}>{m.specs.coffre_litres}</td>
                      )
                    })}
                  </tr>
                  {/* Poids */}
                  <tr>
                    <td>Poids</td>
                    {result.modeles.map((m, i) => <td key={i}>{m.specs.poids_kg}</td>)}
                  </tr>
                  {/* Garantie */}
                  <tr>
                    <td>Garantie</td>
                    {result.modeles.map((m, i) => <td key={i}>{m.specs.garantie}</td>)}
                  </tr>
                  {/* Note */}
                  <tr style={{ borderTop: '2px solid var(--line)' }}>
                    <td style={{ fontWeight: 700 }}>Note globale /10</td>
                    {result.modeles.map((m, i) => {
                      const isTop = m.note_globale === Math.max(...result.modeles.map(x => x.note_globale))
                      return (
                        <td key={i} className={`cm-note-cell${isTop ? ' cm-best' : ''}`}>
                          {m.note_globale.toFixed(1)}{isTop ? ' 🏆' : ''}
                        </td>
                      )
                    })}
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Cartes modèles */}
            <div className={`cm-cards n${result.modeles.length}`}>
              {result.modeles.map((m, i) => {
                const color = CARD_COLORS[i % CARD_COLORS.length]
                return (
                  <div
                    className="cm-card"
                    key={i}
                    style={{ borderColor: color.border, background: `linear-gradient(160deg, ${color.bg} 0%, var(--surface) 60%)` }}
                  >
                    {/* Top */}
                    <div className="cm-card-top" style={{ borderBottom: `2px solid ${color.border}` }}>
                      <div className="cm-card-year">{m.annee_modele}</div>
                      <div className="cm-card-name" style={{ color: color.accent }}>{m.nom}</div>
                      <div className="cm-card-note">
                        <span style={{ color: color.accent }}>{m.note_globale.toFixed(1)}</span>
                        <span style={{ fontSize: '.9rem', color: 'var(--text-muted)', fontWeight: 400 }}>/10</span>
                        <NoteStars note={m.note_globale} />
                      </div>
                    </div>

                    {/* Specs */}
                    <div className="cm-card-specs">
                      <div className="cm-spec-row"><span className="sl">💶 Prix</span><span className="sv">{m.specs.prix_base}</span></div>
                      <div className="cm-spec-row"><span className="sl">⚡ Puissance</span><span className="sv">{m.specs.puissance}</span></div>
                      {m.specs.autonomie_wltp && <div className="cm-spec-row"><span className="sl">🛣️ Autonomie</span><span className="sv">{m.specs.autonomie_wltp}</span></div>}
                      <div className="cm-spec-row"><span className="sl">⛽ Conso.</span><span className="sv">{m.specs.consommation}</span></div>
                      {m.specs.recharge_max_kw && <div className="cm-spec-row"><span className="sl">🔌 Recharge max</span><span className="sv">{m.specs.recharge_max_kw}</span></div>}
                      <div className="cm-spec-row"><span className="sl">📦 Coffre</span><span className="sv">{m.specs.coffre_litres}</span></div>
                    </div>

                    {/* Corps */}
                    <div className="cm-card-body">
                      {/* Points forts */}
                      <div className="cm-card-section forts">
                        <h4>✅ Points forts</h4>
                        {m.points_forts.map((f, j) => (
                          <div className="cm-fort-item" key={j}>
                            <span className="ico">+</span>
                            <span>{f}</span>
                          </div>
                        ))}
                      </div>

                      {/* Points faibles */}
                      <div className="cm-card-section faibles">
                        <h4>⚠️ Points faibles</h4>
                        {m.points_faibles.map((f, j) => (
                          <div className="cm-faible-item" key={j}>
                            <span className="ico">−</span>
                            <span>{f}</span>
                          </div>
                        ))}
                      </div>

                      {/* Pour qui */}
                      <div className="cm-pour-qui">👤 {m.pour_qui}</div>

                      {/* Verdict */}
                      <div className="cm-card-section verdict">
                        <h4>Verdict</h4>
                        <p className="cm-verdict-text">{m.verdict}</p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Bouton reset */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: 12 }}>
              <button className="cm-reset" onClick={handleReset}>
                ↺ Nouvelle comparaison
              </button>
            </div>

            {/* Disclaimer */}
            <div className="cm-disc">
              <strong>ℹ️ Note :</strong> Les données affichées sont générées par l'IA Claude (Anthropic) sur la base de son entraînement et ne constituent pas une offre commerciale. Vérifiez les prix et disponibilités directement auprès des constructeurs ou concessionnaires. Données indicatives pour millésime 2024–2025.
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
