'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from '@/i18n/navigation'
import { useUserContext } from '@/context/UserContextProvider'
import {
  type AutopulseState, type Vehicule, type Echeance, type Depense, type Carburant,
  type Usure, type UsureCalc, type HistoriqueItem,
  CARBURANTS, CATEGORIES_DEPENSE,
  loadState, saveState, emptyState, uid, echeancesParDefaut, usuresParDefaut,
  calcEcheance, trierUrgence, scoreSante, resumeCouts, calcUsure, tendanceCouts,
  exportJSON, importJSON, syncRemote,
} from '@/lib/suivi-vehicule'

// ─────────────────────────────────────────────────────────────────────────────
// Helpers UI
// ─────────────────────────────────────────────────────────────────────────────
const todayISO = () => new Date().toISOString().slice(0, 10)
const fmtEur = (n: number) => n.toLocaleString('fr-FR', { maximumFractionDigits: 0 }) + ' €'
const fmtEur2 = (n: number) => n.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €'
const fmtKm = (n: number) => n.toLocaleString('fr-FR') + ' km'
const carbMeta = (c: Carburant) => CARBURANTS.find((x) => x.value === c)!

const STATUT_COLOR: Record<string, string> = {
  en_retard: 'var(--apx-red)',
  bientot: 'var(--apx-amber)',
  a_jour: 'var(--apx-green)',
  inconnu: 'var(--apx-faint)',
}
const STATUT_LABEL: Record<string, string> = {
  en_retard: 'En retard', bientot: 'Bientôt', a_jour: 'À jour', inconnu: 'À renseigner',
}

const CSS = `
.apx{--bg:var(--color-bg);--surface:var(--color-bg-card);--surface-2:var(--color-bg-alt);
 --text:var(--color-text);--soft:var(--color-text-soft);--faint:var(--color-text-muted);
 --line:var(--color-border);--accent:var(--color-primary);--accent-deep:var(--color-primary-dark);
 --apx-green:#10b981;--apx-amber:#f59e0b;--apx-red:#ef4444;--apx-faint:#9aa5bb;
 --apx-green-s:rgba(16,185,129,.12);--apx-amber-s:rgba(245,158,11,.13);--apx-red-s:rgba(239,68,68,.12);
 --shadow:0 1px 3px rgba(16,24,43,.06),0 12px 30px -16px rgba(16,24,43,.18);
 color:var(--text);font-size:16px;line-height:1.55;-webkit-font-smoothing:antialiased}
html[data-theme="dark"] .apx{--shadow:0 1px 3px rgba(0,0,0,.4),0 16px 36px -16px rgba(0,0,0,.55)}
.apx *{box-sizing:border-box}
.apx .wrap{max-width:960px;margin:0 auto;padding:0 18px 80px}
.apx .hero{text-align:center;padding:46px 18px 30px}
.apx .chip{display:inline-flex;align-items:center;gap:7px;font-size:.74rem;font-weight:700;
 letter-spacing:.06em;text-transform:uppercase;color:var(--accent);background:var(--accent-soft,rgba(239,108,26,.1));
 border:1px solid var(--line);border-radius:999px;padding:5px 13px;margin-bottom:16px}
.apx h1{font-size:clamp(1.7rem,4vw,2.5rem);font-weight:800;line-height:1.1;margin:0 0 14px;letter-spacing:-.02em}
.apx h1 .g{color:var(--accent)}
.apx .lead{max-width:560px;margin:0 auto;color:var(--soft);font-size:1.02rem}
.apx .card{background:var(--surface);border:1.5px solid var(--line);border-radius:16px;box-shadow:var(--shadow)}
.apx .pad{padding:22px}
.apx .grid{display:grid;gap:16px}
@media(min-width:720px){.apx .g2{grid-template-columns:1fr 1fr}.apx .g3{grid-template-columns:repeat(3,1fr)}}
.apx label{display:block;font-size:.78rem;font-weight:700;color:var(--soft);margin:0 0 5px;letter-spacing:.01em}
.apx input,.apx select{width:100%;font:inherit;font-size:.92rem;color:var(--text);background:var(--bg);
 border:1.5px solid var(--line);border-radius:10px;padding:10px 12px;outline:none;transition:border-color .15s}
.apx input:focus,.apx select:focus{border-color:var(--accent)}
.apx .btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;font:inherit;font-weight:700;
 font-size:.92rem;border:none;border-radius:11px;padding:11px 18px;cursor:pointer;transition:filter .15s,transform .05s}
.apx .btn:active{transform:translateY(1px)}
.apx .btn-p{background:var(--accent);color:#fff}
.apx .btn-p:hover{filter:brightness(1.06)}
.apx .btn-o{background:transparent;color:var(--accent);border:1.5px solid var(--line)}
.apx .btn-o:hover{border-color:var(--accent)}
.apx .btn-sm{padding:7px 12px;font-size:.82rem;border-radius:9px}
.apx .btn-ghost{background:transparent;color:var(--faint);border:1px solid var(--line)}
.apx .btn-ghost:hover{color:var(--text);border-color:var(--accent)}
.apx .row{display:flex;gap:10px;flex-wrap:wrap;align-items:center}
.apx .between{display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap}
.apx .vsel{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:18px}
.apx .vpill{display:inline-flex;align-items:center;gap:8px;background:var(--surface);border:1.5px solid var(--line);
 border-radius:12px;padding:8px 14px;cursor:pointer;font-weight:600;font-size:.9rem;color:var(--text);transition:border-color .15s}
.apx .vpill.on{border-color:var(--accent);background:var(--accent-soft,rgba(239,108,26,.08))}
.apx .gauge{position:relative;width:104px;height:104px;flex:0 0 auto}
.apx .gauge svg{transform:rotate(-90deg)}
.apx .gauge .val{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center}
.apx .gauge .num{font-size:1.7rem;font-weight:800;line-height:1}
.apx .gauge .den{font-size:.7rem;color:var(--faint);font-weight:600}
.apx .metrics{display:grid;grid-template-columns:repeat(2,1fr);gap:10px;margin-top:4px}
@media(min-width:560px){.apx .metrics{grid-template-columns:repeat(4,1fr)}}
.apx .metric{background:var(--surface-2);border:1px solid var(--line);border-radius:12px;padding:12px 14px}
.apx .metric .k{font-size:.72rem;color:var(--faint);font-weight:700;text-transform:uppercase;letter-spacing:.04em}
.apx .metric .v{font-size:1.18rem;font-weight:800;margin-top:3px}
.apx .sec-title{font-size:.82rem;font-weight:800;text-transform:uppercase;letter-spacing:.06em;color:var(--faint);margin:34px 0 14px}
.apx .ech{display:flex;align-items:center;gap:14px;padding:13px 16px;border:1.5px solid var(--line);
 border-radius:13px;background:var(--surface);margin-bottom:9px}
.apx .ech .dot{width:11px;height:11px;border-radius:50%;flex:0 0 auto}
.apx .ech .lbl{font-weight:700;font-size:.93rem}
.apx .ech .meta{font-size:.79rem;color:var(--faint);margin-top:2px}
.apx .badge{font-size:.72rem;font-weight:800;padding:3px 10px;border-radius:999px;white-space:nowrap}
.apx .ech .act{margin-left:auto;display:flex;gap:6px;flex-wrap:wrap;justify-content:flex-end}
.apx .empty{text-align:center;padding:40px 20px;color:var(--soft)}
.apx .empty .ic{font-size:3rem;margin-bottom:10px}
.apx table{width:100%;border-collapse:collapse;font-size:.88rem}
.apx th{text-align:left;font-size:.72rem;text-transform:uppercase;letter-spacing:.04em;color:var(--faint);
 font-weight:700;padding:8px 10px;border-bottom:1.5px solid var(--line)}
.apx td{padding:10px;border-bottom:1px solid var(--line);vertical-align:middle}
.apx tr:last-child td{border-bottom:none}
.apx .muted{color:var(--faint);font-size:.84rem}
.apx .syncbar{display:flex;align-items:center;gap:10px;justify-content:center;font-size:.84rem;
 color:var(--soft);background:var(--surface-2);border:1px solid var(--line);border-radius:12px;padding:10px 16px;margin:0 auto 8px;max-width:560px}
.apx .x{background:none;border:none;color:var(--faint);cursor:pointer;font-size:1rem;padding:4px;line-height:1}
.apx .x:hover{color:var(--apx-red)}
.apx .modal-bg{position:fixed;inset:0;background:rgba(2,6,20,.55);display:flex;align-items:flex-start;
 justify-content:center;padding:34px 16px;z-index:60;overflow:auto}
.apx .modal{background:var(--surface);border:1.5px solid var(--line);border-radius:18px;max-width:540px;width:100%;box-shadow:var(--shadow)}
.apx .note{font-size:.8rem;color:var(--faint);margin-top:6px}
.apx .bar{height:9px;border-radius:6px;background:var(--surface-2);overflow:hidden;border:1px solid var(--line)}
.apx .bar .fill{height:100%;border-radius:6px;transition:width .3s}
.apx .usu{padding:14px 16px;border:1.5px solid var(--line);border-radius:13px;background:var(--surface);margin-bottom:9px}
.apx .usu .top{display:flex;justify-content:space-between;align-items:center;gap:10px;margin-bottom:9px}
.apx .tools{display:flex;gap:8px;flex-wrap:wrap;justify-content:center;margin-top:12px}
.apx .hist .hi{display:flex;justify-content:space-between;gap:10px;align-items:baseline;padding:10px 0;border-bottom:1px solid var(--line);font-size:.9rem}
.apx .hist .hi:last-child{border-bottom:none}
.apx .flag{font-size:.72rem;font-weight:800;color:var(--apx-red);background:var(--apx-red-s);padding:2px 8px;border-radius:999px}
`

// ─────────────────────────────────────────────────────────────────────────────
// Composant principal
// ─────────────────────────────────────────────────────────────────────────────
export default function CarnetEntretien() {
  const { userId } = useUserContext()
  const [state, setState] = useState<AutopulseState>(emptyState())
  const [hydrated, setHydrated] = useState(false)
  const [showAdd, setShowAdd] = useState(false)
  const firstSave = useRef(true)

  // hydrate depuis localStorage
  useEffect(() => {
    const s = loadState()
    setState(s)
    setHydrated(true)
  }, [])

  // persistance (localStorage + hook sync membres si connecté)
  useEffect(() => {
    if (!hydrated) return
    if (firstSave.current) { firstSave.current = false; return }
    saveState(state)
    if (userId) { void syncRemote(userId, state) }
  }, [state, hydrated, userId])

  const actif = useMemo(
    () => state.vehicules.find((v) => v.id === state.actifId) ?? state.vehicules[0] ?? null,
    [state]
  )

  function mutateVehicule(id: string, fn: (v: Vehicule) => Vehicule) {
    setState((s) => ({ ...s, vehicules: s.vehicules.map((v) => (v.id === id ? fn(v) : v)) }))
  }

  function addVehicule(v: Vehicule) {
    setState((s) => ({ ...s, vehicules: [...s.vehicules, v], actifId: v.id }))
    setShowAdd(false)
  }

  function removeVehicule(id: string) {
    setState((s) => {
      const rest = s.vehicules.filter((v) => v.id !== id)
      return { ...s, vehicules: rest, actifId: rest[0]?.id ?? null }
    })
  }

  const fileRef = useRef<HTMLInputElement>(null)
  function doExport() {
    const blob = new Blob([exportJSON(state)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `autopulse-carnet-${todayISO()}.json`; a.click()
    URL.revokeObjectURL(url)
  }
  function onImportFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]; if (!f) return
    const reader = new FileReader()
    reader.onload = () => {
      const imported = importJSON(String(reader.result))
      if (imported) setState(imported)
      else alert('Fichier non reconnu. Importez un export Autopulse (.json).')
    }
    reader.readAsText(f)
    e.target.value = ''
  }

  if (!hydrated) {
    return (
      <div className="apx"><style>{CSS}</style>
        <div className="wrap"><div className="empty"><div className="ic">⏳</div>Chargement…</div></div>
      </div>
    )
  }

  return (
    <div className="apx">
      <style>{CSS}</style>

      <header className="hero">
        <div className="chip">● Autopulse · votre carnet d’entretien</div>
        <h1>Votre voiture, <span className="g">enfin comprise.</span></h1>
        <p className="lead">
          Ajoutez n’importe quel véhicule — essence, diesel, hybride ou électrique — et
          Autopulse calcule vos prochaines échéances d’entretien, au kilomètre comme à la date,
          et suit vos coûts. Sans matériel, sans marque imposée.
        </p>
      </header>

      <div className="wrap">
        <div className="syncbar">
          {userId
            ? <>🔓 Connecté — vos données sont sauvegardées sur cet appareil. <span className="muted">(synchronisation multi-appareils bientôt)</span></>
            : <>🔒 Vos données restent <strong style={{ margin: '0 4px' }}>sur cet appareil</strong> (aucun envoi). <Link href="/espace-membres" style={{ color: 'var(--color-primary)', fontWeight: 700 }}>Se connecter</Link> pour la future synchro.</>}
        </div>
        {state.vehicules.length > 0 && (
          <div className="tools">
            <button className="btn btn-ghost btn-sm" onClick={doExport}>⤓ Exporter (.json)</button>
            <button className="btn btn-ghost btn-sm" onClick={() => fileRef.current?.click()}>⤒ Importer</button>
            <input ref={fileRef} type="file" accept="application/json,.json" onChange={onImportFile} style={{ display: 'none' }} />
          </div>
        )}

        {state.vehicules.length > 1 && (
          <div className="vsel" role="tablist" aria-label="Mes véhicules" style={{ marginTop: 16 }}>
            {state.vehicules.map((v) => (
              <button key={v.id} className={'vpill' + (actif?.id === v.id ? ' on' : '')}
                onClick={() => setState((s) => ({ ...s, actifId: v.id }))}>
                <span>{carbMeta(v.carburant).emoji}</span>{v.marque} {v.modele}
              </button>
            ))}
            <button className="vpill" onClick={() => setShowAdd(true)}>＋ Véhicule</button>
          </div>
        )}

        {!actif ? (
          <div className="card pad" style={{ marginTop: 16 }}>
            <div className="empty">
              <div className="ic">🚗</div>
              <h2 style={{ margin: '0 0 6px', fontSize: '1.2rem' }}>Ajoutez votre premier véhicule</h2>
              <p style={{ maxWidth: 420, margin: '0 auto 18px' }}>
                Renseignez la marque, le modèle, le kilométrage et le carburant.
                Autopulse génère automatiquement le plan d’entretien adapté.
              </p>
              <button className="btn btn-p" onClick={() => setShowAdd(true)}>＋ Ajouter mon véhicule</button>
            </div>
          </div>
        ) : (
          <VehiculeDashboard
            key={actif.id}
            v={actif}
            onChange={(fn) => mutateVehicule(actif.id, fn)}
            onDelete={() => removeVehicule(actif.id)}
          />
        )}
      </div>

      {showAdd && <AddVehiculeModal onClose={() => setShowAdd(false)} onAdd={addVehicule} />}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Dashboard d'un véhicule
// ─────────────────────────────────────────────────────────────────────────────
function VehiculeDashboard({ v, onChange, onDelete }: {
  v: Vehicule
  onChange: (fn: (v: Vehicule) => Vehicule) => void
  onDelete: () => void
}) {
  const [editKm, setEditKm] = useState(false)
  const [kmInput, setKmInput] = useState(String(v.kmActuel))
  const [showEch, setShowEch] = useState(false)
  const [showDep, setShowDep] = useState(false)

  const calcs = useMemo(() => trierUrgence(v.echeances.map((e) => calcEcheance(v, e))), [v])
  const sante = useMemo(() => scoreSante(calcs), [calcs])
  const couts = useMemo(() => resumeCouts(v), [v])
  const usures = useMemo(() => v.usures.map((u) => calcUsure(v, u)), [v])
  const tendance = useMemo(() => tendanceCouts(v, 'Carburant/Recharge'), [v])
  const [editUsure, setEditUsure] = useState<Usure | null>(null)
  const meta = carbMeta(v.carburant)

  const enRetard = calcs.filter((c) => c.statut === 'en_retard').length
  const bientot = calcs.filter((c) => c.statut === 'bientot').length
  const gaugeColor = sante.score >= 85 ? 'var(--apx-green)' : sante.score >= 65 ? 'var(--apx-amber)' : 'var(--apx-red)'
  const R = 46, C = 2 * Math.PI * R, off = C * (1 - sante.score / 100)

  function saveKm() {
    const n = parseInt(kmInput.replace(/\D/g, ''), 10)
    if (!isNaN(n)) onChange((x) => ({ ...x, kmActuel: n, kmActuelDate: todayISO() }))
    setEditKm(false)
  }
  function marquerFait(echId: string) {
    onChange((x) => {
      const e = x.echeances.find((y) => y.id === echId)
      const hist: HistoriqueItem = { id: uid('h'), label: e ? e.label : 'Entretien', km: x.kmActuel, date: todayISO(), cout: null }
      return {
        ...x,
        echeances: x.echeances.map((y) => y.id === echId ? { ...y, dernierKm: x.kmActuel, derniereDate: todayISO() } : y),
        historique: [hist, ...x.historique],
      }
    })
  }
  function remplacerUsure(usuId: string) {
    onChange((x) => {
      const u = x.usures.find((y) => y.id === usuId)
      const hist: HistoriqueItem = { id: uid('h'), label: u ? `Remplacement — ${u.label}` : 'Remplacement', km: x.kmActuel, date: todayISO(), cout: null }
      return {
        ...x,
        usures: x.usures.map((y) => y.id === usuId ? { ...y, installKm: x.kmActuel, installDate: todayISO() } : y),
        historique: [hist, ...x.historique],
      }
    })
  }
  function saveUsure(u: Usure) { onChange((x) => ({ ...x, usures: x.usures.map((y) => y.id === u.id ? u : y) })); setEditUsure(null) }
  function supprHist(id: string) { onChange((x) => ({ ...x, historique: x.historique.filter((h) => h.id !== id) })) }
  function supprEch(echId: string) {
    onChange((x) => ({ ...x, echeances: x.echeances.filter((e) => e.id !== echId) }))
  }
  function addEch(e: Echeance) { onChange((x) => ({ ...x, echeances: [...x.echeances, e] })); setShowEch(false) }
  function addDep(d: Depense) { onChange((x) => ({ ...x, depenses: [d, ...x.depenses] })); setShowDep(false) }
  function supprDep(id: string) { onChange((x) => ({ ...x, depenses: x.depenses.filter((d) => d.id !== id) })) }

  return (
    <>
      {/* ── Carte santé ── */}
      <div className="card pad" style={{ marginTop: 16 }}>
        <div className="between" style={{ marginBottom: 18 }}>
          <div className="row" style={{ gap: 12 }}>
            <span style={{ fontSize: '2rem' }}>{meta.emoji}</span>
            <div>
              <div style={{ fontWeight: 800, fontSize: '1.15rem' }}>{v.marque} {v.modele}</div>
              <div className="muted">{[v.annee || null, meta.label, v.immatriculation].filter(Boolean).join(' · ')}</div>
            </div>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={onDelete} aria-label="Supprimer ce véhicule">🗑 Supprimer</button>
        </div>

        <div className="row" style={{ gap: 22, alignItems: 'center' }}>
          <div className="gauge" aria-label={`Score de santé ${sante.score} sur 100`}>
            <svg width="104" height="104" viewBox="0 0 104 104">
              <circle cx="52" cy="52" r={R} fill="none" stroke="var(--line)" strokeWidth="9" />
              <circle cx="52" cy="52" r={R} fill="none" stroke={gaugeColor} strokeWidth="9"
                strokeLinecap="round" strokeDasharray={C} strokeDashoffset={off} />
            </svg>
            <div className="val"><span className="num" style={{ color: gaugeColor }}>{sante.score}</span><span className="den">/ 100</span></div>
          </div>
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ fontWeight: 800, fontSize: '1.05rem' }}>{sante.label}</div>
            <div className="muted" style={{ marginBottom: 10 }}>
              {enRetard > 0 ? `${enRetard} opération${enRetard > 1 ? 's' : ''} en retard` : bientot > 0 ? `${bientot} échéance${bientot > 1 ? 's' : ''} proche${bientot > 1 ? 's' : ''}` : 'Aucune échéance urgente'}
            </div>
            <div className="row" style={{ gap: 10 }}>
              {editKm ? (
                <>
                  <input style={{ maxWidth: 140 }} inputMode="numeric" value={kmInput}
                    onChange={(e) => setKmInput(e.target.value)} aria-label="Kilométrage actuel" />
                  <button className="btn btn-p btn-sm" onClick={saveKm}>OK</button>
                </>
              ) : (
                <>
                  <span style={{ fontWeight: 700 }}>{fmtKm(v.kmActuel)}</span>
                  <button className="btn btn-o btn-sm" onClick={() => { setKmInput(String(v.kmActuel)); setEditKm(true) }}>Mettre à jour le km</button>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="metrics">
          <div className="metric"><div className="k">Échéances suivies</div><div className="v">{v.echeances.length}</div></div>
          <div className="metric"><div className="k">En retard</div><div className="v" style={{ color: enRetard ? 'var(--apx-red)' : undefined }}>{enRetard}</div></div>
          <div className="metric"><div className="k">Coût total suivi</div><div className="v">{fmtEur(couts.total)}</div></div>
          <div className="metric"><div className="k">Coût / km</div><div className="v">{couts.parKm != null ? fmtEur2(couts.parKm) : '—'}</div></div>
        </div>
      </div>

      {/* ── Échéances ── */}
      <div className="between"><div className="sec-title">Prochaines échéances</div>
        <button className="btn btn-o btn-sm" onClick={() => setShowEch(true)} style={{ marginTop: 28 }}>＋ Ajouter une opération</button>
      </div>
      {calcs.length === 0 ? (
        <div className="card pad muted">Aucune opération. Ajoutez-en une pour suivre vos entretiens.</div>
      ) : calcs.map((c) => (
        <div className="ech" key={c.echeance.id}>
          <span className="dot" style={{ background: STATUT_COLOR[c.statut] }} />
          <div style={{ minWidth: 0 }}>
            <div className="lbl">{c.echeance.label}</div>
            <div className="meta">
              {c.echeance.intervalleKm > 0 && `${c.echeance.intervalleKm.toLocaleString('fr-FR')} km`}
              {c.echeance.intervalleKm > 0 && c.echeance.intervalleMois > 0 && ' · '}
              {c.echeance.intervalleMois > 0 && `${c.echeance.intervalleMois} mois`}
              {c.prochaineDate && ` · échéance ~${new Date(c.prochaineDate).toLocaleDateString('fr-FR')}`}
              {c.statut === 'inconnu' && ' · dernier passage à renseigner'}
            </div>
          </div>
          <div className="act">
            <span className="badge" style={{ background: STATUT_COLOR[c.statut] + '22', color: STATUT_COLOR[c.statut] }}>
              {STATUT_LABEL[c.statut]}{c.detail ? ` · ${c.detail}` : ''}
            </span>
            <button className="btn btn-p btn-sm" onClick={() => marquerFait(c.echeance.id)}>Fait ✓</button>
            <button className="x" onClick={() => supprEch(c.echeance.id)} aria-label="Supprimer">✕</button>
          </div>
        </div>
      ))}

      {/* ── Prédiction d'usure ── */}
      <div className="sec-title">Prévisions d’usure — pneus & freins</div>
      {usures.map((c) => <UsureRow key={c.usure.id} c={c} onRemplace={() => remplacerUsure(c.usure.id)} onEdit={() => setEditUsure(c.usure)} />)}
      <p className="note">Estimations basées sur des durées de vie moyennes et votre kilométrage annuel. Réglez le km de montage de chaque pièce pour une prévision juste.</p>

      {/* ── Coûts ── */}
      <div className="between"><div className="sec-title">Suivi des coûts</div>
        <button className="btn btn-o btn-sm" onClick={() => setShowDep(true)} style={{ marginTop: 28 }}>＋ Ajouter une dépense</button>
      </div>
      <div className="card pad">
        <div className="metrics" style={{ marginBottom: v.depenses.length ? 16 : 0 }}>
          <div className="metric"><div className="k">Total</div><div className="v">{fmtEur(couts.total)}</div></div>
          <div className="metric"><div className="k">Estimé / an</div><div className="v">{couts.parAn ? fmtEur(couts.parAn) : '—'}</div></div>
          <div className="metric"><div className="k">/ km</div><div className="v">{couts.parKm != null ? fmtEur2(couts.parKm) : '—'}</div></div>
          <div className="metric"><div className="k">Carburant — trim.</div><div className="v" style={{ color: tendance.pct != null ? (tendance.pct > 0 ? 'var(--apx-red)' : 'var(--apx-green)') : undefined }}>{tendance.pct != null ? `${tendance.pct > 0 ? '+' : ''}${tendance.pct}%` : '—'}</div></div>
        </div>
        {v.depenses.length === 0 ? (
          <div className="muted">Ajoutez vos factures (entretien, carburant, pneus…) pour suivre le coût réel de votre véhicule et le coût au kilomètre.</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table>
              <thead><tr><th>Date</th><th>Catégorie</th><th>Libellé</th><th style={{ textAlign: 'right' }}>Montant</th><th></th></tr></thead>
              <tbody>
                {v.depenses.map((d) => (
                  <tr key={d.id}>
                    <td className="muted">{new Date(d.date).toLocaleDateString('fr-FR')}</td>
                    <td>{d.categorie}</td>
                    <td>{d.libelle || <span className="muted">—</span>}</td>
                    <td style={{ textAlign: 'right', fontWeight: 700 }}>{fmtEur2(d.montant)}</td>
                    <td style={{ textAlign: 'right' }}><button className="x" onClick={() => supprDep(d.id)} aria-label="Supprimer">✕</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Historique ── */}
      <div className="sec-title">Historique d’entretien</div>
      <div className="card pad">
        {v.historique.length === 0 ? (
          <div className="muted">Chaque opération marquée « Fait ✓ » ou « Remplacé ✓ » est consignée ici, avec le km et la date.</div>
        ) : (
          <div className="hist">
            {v.historique.map((h) => (
              <div className="hi" key={h.id}>
                <span style={{ fontWeight: 700 }}>{h.label}</span>
                <span className="muted" style={{ whiteSpace: 'nowrap' }}>
                  {h.km != null ? `${h.km.toLocaleString('fr-FR')} km · ` : ''}{new Date(h.date).toLocaleDateString('fr-FR')}
                  <button className="x" onClick={() => supprHist(h.id)} aria-label="Supprimer" style={{ marginLeft: 8 }}>✕</button>
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <p className="note" style={{ marginTop: 22 }}>
        Une échéance reste « à renseigner » tant qu’Autopulse n’a pas de point de départ : marquez « Fait ✓ » lorsque
        vous réalisez l’opération, ou indiquez la date de mise en circulation (les échéances calendaires d’un véhicule
        récent sont alors estimées). Les intervalles proposés sont indicatifs : le carnet constructeur prévaut. Autopulse
        vous aide à ne rien oublier — il ne remplace pas un professionnel.
      </p>

      {showEch && <AddEcheanceModal onClose={() => setShowEch(false)} onAdd={addEch} />}
      {showDep && <AddDepenseModal kmActuel={v.kmActuel} onClose={() => setShowDep(false)} onAdd={addDep} />}
      {editUsure && <EditUsureModal usure={editUsure} kmActuel={v.kmActuel} onClose={() => setEditUsure(null)} onSave={saveUsure} />}
    </>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Modales
// ─────────────────────────────────────────────────────────────────────────────
function Modal({ children, onClose, title }: { children: React.ReactNode; onClose: () => void; title: string }) {
  return (
    <div className="modal-bg" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="pad">
          <div className="between" style={{ marginBottom: 16 }}>
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>{title}</h3>
            <button className="x" onClick={onClose} aria-label="Fermer" style={{ fontSize: '1.3rem' }}>✕</button>
          </div>
          {children}
        </div>
      </div>
    </div>
  )
}

function AddVehiculeModal({ onClose, onAdd }: { onClose: () => void; onAdd: (v: Vehicule) => void }) {
  const [marque, setMarque] = useState('')
  const [modele, setModele] = useState('')
  const [annee, setAnnee] = useState('')
  const [carburant, setCarburant] = useState<Carburant>('ESSENCE')
  const [km, setKm] = useState('')
  const [kmAn, setKmAn] = useState('15000')
  const [mes, setMes] = useState('')
  const [immat, setImmat] = useState('')

  const ok = marque.trim() && modele.trim() && km.trim()

  function submit() {
    if (!ok) return
    const v: Vehicule = {
      id: uid('veh'),
      marque: marque.trim(), modele: modele.trim(),
      annee: annee ? parseInt(annee, 10) : null,
      carburant,
      kmActuel: parseInt(km.replace(/\D/g, ''), 10) || 0,
      kmActuelDate: todayISO(),
      kmParAn: parseInt(kmAn.replace(/\D/g, ''), 10) || 15000,
      miseEnService: mes || null,
      immatriculation: immat.trim() || undefined,
      echeances: echeancesParDefaut(carburant),
      depenses: [],
      usures: usuresParDefaut(carburant),
      historique: [],
      creeLe: new Date().toISOString(),
    }
    onAdd(v)
  }

  return (
    <Modal title="Ajouter un véhicule" onClose={onClose}>
      <div className="grid g2">
        <div><label>Marque *</label><input value={marque} onChange={(e) => setMarque(e.target.value)} placeholder="Renault" /></div>
        <div><label>Modèle *</label><input value={modele} onChange={(e) => setModele(e.target.value)} placeholder="Clio" /></div>
        <div><label>Année</label><input inputMode="numeric" value={annee} onChange={(e) => setAnnee(e.target.value)} placeholder="2021" /></div>
        <div><label>Carburant *</label>
          <select value={carburant} onChange={(e) => setCarburant(e.target.value as Carburant)}>
            {CARBURANTS.map((c) => <option key={c.value} value={c.value}>{c.emoji} {c.label}</option>)}
          </select>
        </div>
        <div><label>Kilométrage actuel *</label><input inputMode="numeric" value={km} onChange={(e) => setKm(e.target.value)} placeholder="62000" /></div>
        <div><label>Km / an (estimation)</label><input inputMode="numeric" value={kmAn} onChange={(e) => setKmAn(e.target.value)} placeholder="15000" /></div>
        <div><label>Mise en circulation</label><input type="date" value={mes} onChange={(e) => setMes(e.target.value)} /></div>
        <div><label>Immatriculation</label><input value={immat} onChange={(e) => setImmat(e.target.value)} placeholder="AB-123-CD" /></div>
      </div>
      <p className="note">Le plan d’entretien par défaut s’adapte au carburant choisi (ex. pas de vidange pour un électrique). Vous pourrez tout personnaliser.</p>
      <div className="row" style={{ justifyContent: 'flex-end', marginTop: 10 }}>
        <button className="btn btn-ghost" onClick={onClose}>Annuler</button>
        <button className="btn btn-p" disabled={!ok} onClick={submit} style={{ opacity: ok ? 1 : .5 }}>Créer le carnet</button>
      </div>
    </Modal>
  )
}

function AddEcheanceModal({ onClose, onAdd }: { onClose: () => void; onAdd: (e: Echeance) => void }) {
  const [label, setLabel] = useState('')
  const [km, setKm] = useState('')
  const [mois, setMois] = useState('')
  const [dernierKm, setDernierKm] = useState('')
  const [derniereDate, setDerniereDate] = useState('')
  const ok = label.trim() && (km.trim() || mois.trim())
  function submit() {
    if (!ok) return
    onAdd({
      id: uid('ech'), label: label.trim(),
      intervalleKm: parseInt(km.replace(/\D/g, ''), 10) || 0,
      intervalleMois: parseInt(mois.replace(/\D/g, ''), 10) || 0,
      dernierKm: dernierKm ? parseInt(dernierKm.replace(/\D/g, ''), 10) : null,
      derniereDate: derniereDate || null,
    })
  }
  return (
    <Modal title="Ajouter une opération d’entretien" onClose={onClose}>
      <div className="grid">
        <div><label>Intitulé *</label><input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Vidange, pneus hiver…" /></div>
        <div className="grid g2">
          <div><label>Tous les … km</label><input inputMode="numeric" value={km} onChange={(e) => setKm(e.target.value)} placeholder="15000" /></div>
          <div><label>… ou tous les … mois</label><input inputMode="numeric" value={mois} onChange={(e) => setMois(e.target.value)} placeholder="12" /></div>
          <div><label>Dernier passage (km)</label><input inputMode="numeric" value={dernierKm} onChange={(e) => setDernierKm(e.target.value)} placeholder="optionnel" /></div>
          <div><label>Dernier passage (date)</label><input type="date" value={derniereDate} onChange={(e) => setDerniereDate(e.target.value)} /></div>
        </div>
      </div>
      <p className="note">Renseignez au moins un intervalle (km ou mois). Le dernier passage sert de point de départ au calcul.</p>
      <div className="row" style={{ justifyContent: 'flex-end', marginTop: 10 }}>
        <button className="btn btn-ghost" onClick={onClose}>Annuler</button>
        <button className="btn btn-p" disabled={!ok} onClick={submit} style={{ opacity: ok ? 1 : .5 }}>Ajouter</button>
      </div>
    </Modal>
  )
}

function AddDepenseModal({ kmActuel, onClose, onAdd }: { kmActuel: number; onClose: () => void; onAdd: (d: Depense) => void }) {
  const [date, setDate] = useState(todayISO())
  const [categorie, setCategorie] = useState<Depense['categorie']>('Entretien')
  const [libelle, setLibelle] = useState('')
  const [montant, setMontant] = useState('')
  const [km, setKm] = useState(String(kmActuel))
  const ok = montant.trim() && parseFloat(montant.replace(',', '.')) > 0
  function submit() {
    if (!ok) return
    onAdd({
      id: uid('dep'), date, categorie, libelle: libelle.trim(),
      montant: parseFloat(montant.replace(',', '.')) || 0,
      km: km ? parseInt(km.replace(/\D/g, ''), 10) : null,
    })
  }
  return (
    <Modal title="Ajouter une dépense" onClose={onClose}>
      <div className="grid g2">
        <div><label>Date</label><input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></div>
        <div><label>Catégorie</label>
          <select value={categorie} onChange={(e) => setCategorie(e.target.value as Depense['categorie'])}>
            {CATEGORIES_DEPENSE.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div><label>Libellé</label><input value={libelle} onChange={(e) => setLibelle(e.target.value)} placeholder="Vidange + filtres" /></div>
        <div><label>Montant (€) *</label><input inputMode="decimal" value={montant} onChange={(e) => setMontant(e.target.value)} placeholder="189" /></div>
        <div><label>Km (optionnel)</label><input inputMode="numeric" value={km} onChange={(e) => setKm(e.target.value)} placeholder={String(kmActuel)} /></div>
      </div>
      <div className="row" style={{ justifyContent: 'flex-end', marginTop: 14 }}>
        <button className="btn btn-ghost" onClick={onClose}>Annuler</button>
        <button className="btn btn-p" disabled={!ok} onClick={submit} style={{ opacity: ok ? 1 : .5 }}>Ajouter</button>
      </div>
    </Modal>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Ligne d'usure (pneus / freins) avec barre de progression et prévision
// ─────────────────────────────────────────────────────────────────────────────
const USURE_COLOR: Record<string, string> = {
  ok: 'var(--apx-green)', bientot: 'var(--apx-amber)', remplacer: 'var(--apx-red)', inconnu: 'var(--apx-faint)',
}
function UsureRow({ c, onRemplace, onEdit }: { c: UsureCalc; onRemplace: () => void; onEdit: () => void }) {
  const col = USURE_COLOR[c.statut]
  const inconnu = c.statut === 'inconnu'
  return (
    <div className="usu">
      <div className="top">
        <div className="row" style={{ gap: 10 }}>
          <span className="dot" style={{ width: 11, height: 11, borderRadius: '50%', background: col }} />
          <span style={{ fontWeight: 700 }}>{c.usure.label}</span>
          {c.rythmeRapide && <span className="flag">S’use vite</span>}
        </div>
        <div className="row" style={{ gap: 6 }}>
          <button className="btn btn-o btn-sm" onClick={onEdit}>Réglages</button>
          <button className="btn btn-p btn-sm" onClick={onRemplace}>Remplacé ✓</button>
        </div>
      </div>
      {inconnu ? (
        <div className="muted" style={{ fontSize: '.84rem' }}>
          Renseignez le km de montage (Réglages) pour activer la prévision — durée de vie estimée {c.usure.dureeVieKm.toLocaleString('fr-FR')} km.
        </div>
      ) : (
        <>
          <div className="bar"><div className="fill" style={{ width: `${c.pct}%`, background: col }} /></div>
          <div className="between" style={{ marginTop: 7 }}>
            <span className="muted" style={{ fontSize: '.82rem' }}>{c.pct}% usé · {c.usure.dureeVieKm.toLocaleString('fr-FR')} km de durée de vie</span>
            <span style={{ fontWeight: 800, color: col, fontSize: '.88rem' }}>
              {c.restantKm != null && c.restantKm > 0
                ? `${c.restantKm.toLocaleString('fr-FR')} km restants`
                : 'À remplacer'}
              {c.projDate && c.restantKm != null && c.restantKm > 0 ? ` · ~${new Date(c.projDate).toLocaleDateString('fr-FR')}` : ''}
            </span>
          </div>
        </>
      )}
    </div>
  )
}

function EditUsureModal({ usure, kmActuel, onClose, onSave }: {
  usure: Usure; kmActuel: number; onClose: () => void; onSave: (u: Usure) => void
}) {
  const [installKm, setInstallKm] = useState(usure.installKm ? String(usure.installKm) : '')
  const [installDate, setInstallDate] = useState(usure.installDate || '')
  const [dureeVie, setDureeVie] = useState(String(usure.dureeVieKm))
  function submit() {
    onSave({
      ...usure,
      installKm: installKm ? parseInt(installKm.replace(/\D/g, ''), 10) : 0,
      installDate: installDate || null,
      dureeVieKm: parseInt(dureeVie.replace(/\D/g, ''), 10) || usure.dureeVieKm,
    })
  }
  return (
    <Modal title={`Réglages — ${usure.label}`} onClose={onClose}>
      <div className="grid g2">
        <div><label>Km au montage</label><input inputMode="numeric" value={installKm} onChange={(e) => setInstallKm(e.target.value)} placeholder={`ex. ${Math.max(0, kmActuel - 10000).toLocaleString('fr-FR')}`} /></div>
        <div><label>Date de montage</label><input type="date" value={installDate} onChange={(e) => setInstallDate(e.target.value)} /></div>
        <div><label>Durée de vie (km)</label><input inputMode="numeric" value={dureeVie} onChange={(e) => setDureeVie(e.target.value)} placeholder="40000" /></div>
      </div>
      <p className="note">Le km de montage est le point de départ : Autopulse en déduit le pourcentage d’usure et le kilométrage restant avant remplacement.</p>
      <div className="row" style={{ justifyContent: 'flex-end', marginTop: 10 }}>
        <button className="btn btn-ghost" onClick={onClose}>Annuler</button>
        <button className="btn btn-p" onClick={submit}>Enregistrer</button>
      </div>
    </Modal>
  )
}
