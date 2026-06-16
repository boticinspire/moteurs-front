'use client'

import { useMemo, useState } from 'react'
import { Link } from '@/i18n/navigation'
import {
  type EV, type Saison,
  VEHICLES, brands, bodies,
  autonomieReelle, consoReelle, tempsCharge1080,
  DRIVE_LABEL, fmtKm, fmtKwh, fmtKw, fmtEur, nomComplet,
} from '@/lib/open-ev-data'

type SortKey = 'autonomie' | 'batterie' | 'conso' | 'prix' | 'charge'

const CSS = `
.evc{--bg:var(--color-bg);--surface:var(--color-bg-card);--surface-2:var(--color-bg-alt);
 --text:var(--color-text);--soft:var(--color-text-soft);--faint:var(--color-text-muted);
 --line:var(--color-border);--accent:var(--color-primary);--green:#10b981;
 --shadow:0 1px 3px rgba(16,24,43,.06),0 12px 30px -16px rgba(16,24,43,.18);
 color:var(--text);font-size:16px;line-height:1.5}
html[data-theme="dark"] .evc{--shadow:0 1px 3px rgba(0,0,0,.4),0 16px 36px -16px rgba(0,0,0,.55)}
.evc *{box-sizing:border-box}
.evc .wrap{max-width:1080px;margin:0 auto;padding:0 18px 90px}
.evc .hero{text-align:center;padding:42px 18px 22px}
.evc .chip{display:inline-flex;align-items:center;gap:7px;font-size:.72rem;font-weight:800;letter-spacing:.06em;
 text-transform:uppercase;color:var(--accent);border:1px solid var(--line);border-radius:999px;padding:5px 13px;margin-bottom:14px}
.evc h1{font-size:clamp(1.6rem,4vw,2.3rem);font-weight:800;letter-spacing:-.02em;margin:0 0 12px}
.evc .lead{max-width:600px;margin:0 auto;color:var(--soft);font-size:1rem}
.evc .panel{background:var(--surface);border:1.5px solid var(--line);border-radius:14px;padding:16px;box-shadow:var(--shadow);margin-bottom:18px}
.evc .filters{display:grid;gap:12px;grid-template-columns:1fr}
@media(min-width:640px){.evc .filters{grid-template-columns:2fr 1fr 1fr}}
@media(min-width:980px){.evc .filters{grid-template-columns:2fr 1fr 1fr 1fr 1fr}}
.evc label{display:block;font-size:.72rem;font-weight:700;color:var(--soft);margin:0 0 4px;text-transform:uppercase;letter-spacing:.03em}
.evc input,.evc select{width:100%;font:inherit;font-size:.9rem;color:var(--text);background:var(--bg);
 border:1.5px solid var(--line);border-radius:9px;padding:9px 11px;outline:none}
.evc input:focus,.evc select:focus{border-color:var(--accent)}
.evc .row{display:flex;gap:10px;flex-wrap:wrap;align-items:center}
.evc .between{display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap}
.evc .count{font-size:.85rem;color:var(--faint);font-weight:600}
.evc .grid{display:grid;gap:14px;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));margin-top:6px}
.evc .card{background:var(--surface);border:1.5px solid var(--line);border-radius:14px;padding:16px;display:flex;flex-direction:column;gap:10px;transition:border-color .15s;position:relative}
.evc .card.sel{border-color:var(--accent);box-shadow:0 0 0 1px var(--accent)}
.evc .card h3{font-size:1rem;font-weight:800;margin:0;line-height:1.25}
.evc .yr{font-size:.76rem;color:var(--faint);font-weight:600}
.evc .specs{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:2px}
.evc .sp{background:var(--surface-2);border:1px solid var(--line);border-radius:9px;padding:7px 9px}
.evc .sp .k{font-size:.66rem;color:var(--faint);font-weight:700;text-transform:uppercase;letter-spacing:.03em}
.evc .sp .v{font-size:.92rem;font-weight:800;margin-top:1px}
.evc .tags{display:flex;gap:5px;flex-wrap:wrap}
.evc .tag{font-size:.68rem;font-weight:700;padding:2px 7px;border-radius:5px;background:rgba(239,108,26,.1);color:var(--accent);border:1px solid var(--line)}
.evc .cmpbtn{margin-top:auto;display:flex;align-items:center;gap:7px;font-size:.84rem;font-weight:700;cursor:pointer;color:var(--soft)}
.evc .cmpbtn input{width:auto}
.evc .btn{display:inline-flex;align-items:center;justify-content:center;gap:7px;font:inherit;font-weight:700;font-size:.86rem;border:none;border-radius:10px;padding:9px 15px;cursor:pointer}
.evc .btn-p{background:var(--accent);color:#fff}
.evc .btn-o{background:transparent;color:var(--accent);border:1.5px solid var(--line)}
.evc .btn-sm{padding:6px 11px;font-size:.8rem}
.evc .dock{position:sticky;bottom:0;z-index:30;background:var(--surface);border:1.5px solid var(--accent);border-radius:14px;
 padding:12px 16px;box-shadow:var(--shadow);margin-top:18px;display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap}
.evc .cmp-table{overflow-x:auto;margin-top:10px}
.evc table{width:100%;border-collapse:collapse;font-size:.86rem;min-width:520px}
.evc th,.evc td{text-align:left;padding:10px 12px;border-bottom:1px solid var(--line)}
.evc thead th{font-size:.7rem;text-transform:uppercase;letter-spacing:.03em;color:var(--faint);font-weight:800;vertical-align:bottom}
.evc tbody th{font-size:.78rem;color:var(--soft);font-weight:700;white-space:nowrap}
.evc td.best{color:var(--green);font-weight:800}
.evc .x{background:none;border:none;color:var(--faint);cursor:pointer;font-size:1rem;padding:2px 4px}
.evc .x:hover{color:#ef4444}
.evc .src{font-size:.78rem;color:var(--faint);margin-top:24px;text-align:center;line-height:1.6}
.evc .src a{color:var(--accent)}
.evc .seed{background:rgba(245,158,11,.12);border:1px solid rgba(245,158,11,.35);color:var(--text);
 border-radius:10px;padding:10px 14px;font-size:.84rem;margin-bottom:16px}
.evc .empty{text-align:center;padding:40px;color:var(--soft)}
`

const MAX_CMP = 4

export default function CatalogueElectriques({ source, version, count }: {
  source: 'seed' | 'open-ev-data'; version: string | null; count: number
}) {
  const [q, setQ] = useState('')
  const [marque, setMarque] = useState('')
  const [carross, setCarross] = useState('')
  const [autoMin, setAutoMin] = useState(0)
  const [chargeMin, setChargeMin] = useState(0)
  const [v2lOnly, setV2lOnly] = useState(false)
  const [sort, setSort] = useState<SortKey>('autonomie')
  const [saison, setSaison] = useState<Saison>('mixte')
  const [sel, setSel] = useState<string[]>([])
  const [showCmp, setShowCmp] = useState(false)

  const lesMarques = useMemo(() => brands(), [])
  const lesCarross = useMemo(() => bodies(), [])

  const filtres = useMemo(() => {
    const needle = q.trim().toLowerCase()
    let list = VEHICLES.filter((v) => {
      if (needle && !nomComplet(v).toLowerCase().includes(needle)) return false
      if (marque && v.brand !== marque) return false
      if (carross && v.body !== carross) return false
      if (autoMin && (v.range_km ?? 0) < autoMin) return false
      if (chargeMin && (v.dc_kw ?? 0) < chargeMin) return false
      if (v2lOnly && !v.v2l) return false
      return true
    })
    const by: Record<SortKey, (a: EV, b: EV) => number> = {
      autonomie: (a, b) => (b.range_km ?? 0) - (a.range_km ?? 0),
      batterie: (a, b) => (b.battery_kwh ?? 0) - (a.battery_kwh ?? 0),
      conso: (a, b) => (consoReelle(a) ?? 1e9) - (consoReelle(b) ?? 1e9),
      prix: (a, b) => (a.price_eur ?? 1e12) - (b.price_eur ?? 1e12),
      charge: (a, b) => (b.dc_kw ?? 0) - (a.dc_kw ?? 0),
    }
    return [...list].sort(by[sort])
  }, [q, marque, carross, autoMin, chargeMin, v2lOnly, sort])

  function toggleSel(id: string) {
    setSel((s) => s.includes(id) ? s.filter((x) => x !== id) : (s.length >= MAX_CMP ? s : [...s, id]))
  }
  const selVehicles = sel.map((id) => VEHICLES.find((v) => v.id === id)).filter(Boolean) as EV[]

  return (
    <div className="evc">
      <style>{CSS}</style>

      <header className="hero">
        <div className="chip">⚡ Autopulse · catalogue électriques</div>
        <h1>Comparez toutes les voitures électriques</h1>
        <p className="lead">
          Batterie, autonomie WLTP, autonomie réelle estimée, consommation et charge rapide.
          {' '}{count.toLocaleString('fr-FR')} versions — données ouvertes, sans marque imposée.
        </p>
      </header>

      <div className="wrap">
        {source === 'seed' && (
          <div className="seed">
            ⚠️ <strong>Jeu de démarrage</strong> : ce catalogue affiche un échantillon de véhicules avec des valeurs WLTP indicatives.
            Lancez <code>node scripts/refresh-open-ev-data.mjs</code> pour charger le dataset officiel Open EV Data complet et sourcé.
          </div>
        )}

        {/* Filtres */}
        <div className="panel">
          <div className="filters">
            <div><label>Recherche</label><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Marque ou modèle…" /></div>
            <div><label>Marque</label>
              <select value={marque} onChange={(e) => setMarque(e.target.value)}>
                <option value="">Toutes</option>
                {lesMarques.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div><label>Carrosserie</label>
              <select value={carross} onChange={(e) => setCarross(e.target.value)}>
                <option value="">Toutes</option>
                {lesCarross.map((b) => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
            <div><label>Autonomie min.</label>
              <select value={autoMin} onChange={(e) => setAutoMin(Number(e.target.value))}>
                {[0, 300, 400, 500, 600].map((n) => <option key={n} value={n}>{n === 0 ? 'Indifférent' : `${n}+ km`}</option>)}
              </select>
            </div>
            <div><label>Charge rapide min.</label>
              <select value={chargeMin} onChange={(e) => setChargeMin(Number(e.target.value))}>
                {[0, 100, 150, 200].map((n) => <option key={n} value={n}>{n === 0 ? 'Indifférent' : `${n}+ kW`}</option>)}
              </select>
            </div>
          </div>
          <div className="between" style={{ marginTop: 12 }}>
            <div className="row">
              <label style={{ margin: 0, textTransform: 'none', fontSize: '.82rem' }}>
                <input type="checkbox" checked={v2lOnly} onChange={(e) => setV2lOnly(e.target.checked)} style={{ width: 'auto', marginRight: 6 }} />
                V2L (alimenter des appareils)
              </label>
            </div>
            <div className="row">
              <span style={{ fontSize: '.76rem', color: 'var(--color-text-muted)', fontWeight: 700 }}>Trier&nbsp;:</span>
              <select value={sort} onChange={(e) => setSort(e.target.value as SortKey)} style={{ width: 'auto' }}>
                <option value="autonomie">Autonomie ↓</option>
                <option value="batterie">Batterie ↓</option>
                <option value="charge">Charge rapide ↓</option>
                <option value="conso">Consommation ↑</option>
                <option value="prix">Prix ↑</option>
              </select>
              <select value={saison} onChange={(e) => setSaison(e.target.value as Saison)} style={{ width: 'auto' }} title="Saison pour l'autonomie réelle estimée">
                <option value="ete">Été</option>
                <option value="mixte">Mixte</option>
                <option value="hiver">Hiver</option>
              </select>
            </div>
          </div>
        </div>

        <div className="between">
          <span className="count">{filtres.length} véhicule{filtres.length > 1 ? 's' : ''}</span>
          {sel.length > 0 && <button className="btn btn-o btn-sm" onClick={() => setShowCmp(true)}>Comparer ({sel.length})</button>}
        </div>

        {filtres.length === 0 ? (
          <div className="panel empty">Aucun véhicule ne correspond. Élargissez les filtres.</div>
        ) : (
          <div className="grid">
            {filtres.map((v) => {
              const reel = autonomieReelle(v, saison)
              const t = tempsCharge1080(v)
              const on = sel.includes(v.id)
              return (
                <div key={v.id} className={'card' + (on ? ' sel' : '')}>
                  <div>
                    <h3>{v.brand} {v.model}</h3>
                    <div className="yr">{[v.variant, v.year, v.body && v.drivetrain ? `${v.body} · ${DRIVE_LABEL[v.drivetrain] ?? v.drivetrain}` : v.body].filter(Boolean).join(' · ')}</div>
                  </div>
                  <div className="specs">
                    <div className="sp"><div className="k">Batterie</div><div className="v">{fmtKwh(v.battery_kwh)}</div></div>
                    <div className="sp"><div className="k">Autonomie WLTP</div><div className="v">{fmtKm(v.range_km)}</div></div>
                    <div className="sp"><div className="k">Réelle ({saison})</div><div className="v">{fmtKm(reel)}</div></div>
                    <div className="sp"><div className="k">Charge {t ? `(10→80%)` : 'rapide'}</div><div className="v">{t ? `${t} min` : fmtKw(v.dc_kw)}</div></div>
                  </div>
                  <div className="tags">
                    {v.dc_kw != null && <span className="tag">DC {v.dc_kw} kW</span>}
                    {v.v2l && <span className="tag">V2L</span>}
                    {v.price_eur != null && <span className="tag">dès {fmtEur(v.price_eur)}</span>}
                  </div>
                  <label className="cmpbtn">
                    <input type="checkbox" checked={on} onChange={() => toggleSel(v.id)} disabled={!on && sel.length >= MAX_CMP} />
                    {on ? 'Sélectionné' : 'Comparer'}
                  </label>
                </div>
              )
            })}
          </div>
        )}

        {/* Dock comparaison */}
        {sel.length > 0 && (
          <div className="dock">
            <span style={{ fontWeight: 700, fontSize: '.9rem' }}>{sel.length} véhicule{sel.length > 1 ? 's' : ''} à comparer{sel.length >= MAX_CMP ? ` (max ${MAX_CMP})` : ''}</span>
            <div className="row">
              <button className="btn btn-o btn-sm" onClick={() => setSel([])}>Vider</button>
              <button className="btn btn-p btn-sm" onClick={() => setShowCmp(true)}>Comparer →</button>
            </div>
          </div>
        )}

        <p className="src">
          Données : <a href="https://open-ev-data.github.io" target="_blank" rel="noopener noreferrer">Open EV Data</a> — licence CDLA-Permissive-2.0.
          {version ? ` Version ${version}.` : ''} Autonomies réelles et temps de charge estimés par Moteurs.com.
          {' '}<Link href="/outils/carnet-entretien" style={{ color: 'var(--color-primary)' }}>Suivre l’entretien de votre véhicule →</Link>
        </p>
      </div>

      {showCmp && selVehicles.length > 0 && (
        <ComparaisonModal vehicles={selVehicles} saison={saison} onClose={() => setShowCmp(false)} onRemove={toggleSel} />
      )}
    </div>
  )
}

function ComparaisonModal({ vehicles, saison, onClose, onRemove }: {
  vehicles: EV[]; saison: Saison; onClose: () => void; onRemove: (id: string) => void
}) {
  const max = (xs: (number | null | undefined)[]) => Math.max(...xs.map((x) => x ?? -Infinity))
  const min = (xs: (number | null | undefined)[]) => Math.min(...xs.map((x) => x ?? Infinity))
  const batt = vehicles.map((v) => v.battery_kwh)
  const wltp = vehicles.map((v) => v.range_km)
  const reel = vehicles.map((v) => autonomieReelle(v, saison))
  const conso = vehicles.map((v) => consoReelle(v))
  const dc = vehicles.map((v) => v.dc_kw)
  const tps = vehicles.map((v) => tempsCharge1080(v))
  const prix = vehicles.map((v) => v.price_eur ?? null)

  return (
    <div className="evc" onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(2,6,20,.55)', zIndex: 60, overflow: 'auto', padding: '30px 14px' }}>
      <style>{CSS}</style>
      <div onClick={(e) => e.stopPropagation()} style={{ maxWidth: 860, margin: '0 auto', background: 'var(--color-bg-card)', border: '1.5px solid var(--color-border)', borderRadius: 16, padding: 20 }}>
        <div className="between" style={{ marginBottom: 8 }}>
          <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>Comparaison</h2>
          <button className="x" onClick={onClose} aria-label="Fermer" style={{ fontSize: '1.3rem' }}>✕</button>
        </div>
        <div className="cmp-table">
          <table>
            <thead>
              <tr>
                <th>Critère</th>
                {vehicles.map((v) => (
                  <th key={v.id}>{v.brand} {v.model}<br /><span style={{ fontWeight: 600, color: 'var(--color-text-muted)' }}>{v.variant ?? ''}</span>
                    <button className="x" onClick={() => onRemove(v.id)} title="Retirer">✕</button>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr><th>Batterie</th>{vehicles.map((v, i) => <td key={v.id} className={batt[i] === max(batt) ? 'best' : ''}>{fmtKwh(v.battery_kwh)}</td>)}</tr>
              <tr><th>Autonomie WLTP</th>{vehicles.map((v, i) => <td key={v.id} className={wltp[i] === max(wltp) ? 'best' : ''}>{fmtKm(v.range_km)}</td>)}</tr>
              <tr><th>Autonomie réelle ({saison})</th>{vehicles.map((v, i) => <td key={v.id} className={reel[i] === max(reel) ? 'best' : ''}>{fmtKm(reel[i])}</td>)}</tr>
              <tr><th>Conso réelle estimée</th>{vehicles.map((v, i) => <td key={v.id} className={conso[i] === min(conso) ? 'best' : ''}>{conso[i] != null ? `${conso[i]} Wh/km` : '—'}</td>)}</tr>
              <tr><th>Charge rapide (pic)</th>{vehicles.map((v, i) => <td key={v.id} className={dc[i] === max(dc) ? 'best' : ''}>{fmtKw(v.dc_kw)}</td>)}</tr>
              <tr><th>Charge 10→80 %</th>{vehicles.map((v, i) => <td key={v.id} className={tps[i] === min(tps) ? 'best' : ''}>{tps[i] != null ? `${tps[i]} min` : '—'}</td>)}</tr>
              <tr><th>Charge AC</th>{vehicles.map((v) => <td key={v.id}>{fmtKw(v.ac_kw)}</td>)}</tr>
              <tr><th>Transmission</th>{vehicles.map((v) => <td key={v.id}>{v.drivetrain ? (DRIVE_LABEL[v.drivetrain] ?? v.drivetrain) : '—'}</td>)}</tr>
              <tr><th>Places</th>{vehicles.map((v) => <td key={v.id}>{v.seats ?? '—'}</td>)}</tr>
              <tr><th>V2L</th>{vehicles.map((v) => <td key={v.id}>{v.v2l ? 'Oui' : '—'}</td>)}</tr>
              <tr><th>Prix indicatif</th>{vehicles.map((v, i) => <td key={v.id} className={prix[i] != null && prix[i] === min(prix) ? 'best' : ''}>{fmtEur(v.price_eur)}</td>)}</tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
