'use client'

import { useMemo, useState } from 'react'
import { Link } from '@/i18n/navigation'
import {
  type EV, type Saison,
  autonomieReelle, consoReelle, tempsCharge1080,
  DRIVE_LABEL, fmtKm, fmtKwh, fmtKw, fmtEur, nomComplet,
} from '@/lib/vehicules'

const CSS = `
.evc{--bg:var(--color-bg);--surface:var(--color-bg-card);--surface-2:var(--color-bg-alt);
 --text:var(--color-text);--soft:var(--color-text-soft);--faint:var(--color-text-muted);
 --line:var(--color-border);--accent:var(--color-primary);--green:#10b981;--green-s:rgba(16,185,129,.14);--stripe:rgba(120,120,140,.06);
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
.evc label{display:block;font-size:.72rem;font-weight:700;color:var(--soft);margin:0 0 4px;text-transform:uppercase;letter-spacing:.03em}
.evc input,.evc select{width:100%;font:inherit;font-size:.9rem;color:var(--text);background:var(--bg);
 border:1.5px solid var(--line);border-radius:9px;padding:9px 11px;outline:none}
.evc input:focus,.evc select:focus{border-color:var(--accent)}
.evc .row{display:flex;gap:10px;flex-wrap:wrap;align-items:center}
.evc .between{display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap}
.evc .count{font-size:.85rem;color:var(--faint);font-weight:600}
.evc .results{margin-top:6px;border:1.5px solid var(--line);border-radius:12px;overflow:hidden}
.evc .resrow{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:11px 14px;border-bottom:1px solid var(--line)}
.evc .resrow:last-child{border-bottom:none}
.evc .resrow:nth-child(odd){background:var(--stripe)}
.evc .resrow .nm{font-weight:700;font-size:.92rem}
.evc .resrow .mt{font-size:.76rem;color:var(--faint);margin-top:1px}
.evc .resrow .mt b{color:var(--soft);font-weight:700}
.evc .hint{text-align:center;color:var(--soft);padding:26px 14px;font-size:.92rem}
.evc .chips{display:flex;gap:8px;flex-wrap:wrap;margin:2px 0 4px}
.evc .selchip{display:inline-flex;align-items:center;gap:7px;background:var(--surface);border:1.5px solid var(--accent);
 border-radius:999px;padding:6px 8px 6px 13px;font-size:.85rem;font-weight:700}
.evc .btn{display:inline-flex;align-items:center;justify-content:center;gap:7px;font:inherit;font-weight:700;font-size:.86rem;border:none;border-radius:10px;padding:9px 15px;cursor:pointer}
.evc .btn-p{background:var(--accent);color:#fff}
.evc .btn-o{background:transparent;color:var(--accent);border:1.5px solid var(--line)}
.evc .btn-sm{padding:6px 11px;font-size:.8rem}
.evc .btn:disabled{opacity:.45;cursor:not-allowed}
.evc .cmp{margin-top:14px;border:1.5px solid var(--line);border-radius:14px;overflow:hidden}
.evc .cmp-scroll{overflow-x:auto}
.evc .cmp table{width:100%;border-collapse:separate;border-spacing:0;font-size:.9rem;min-width:560px;background:transparent}
.evc .cmp th,.evc .cmp td{text-align:left;padding:13px 16px;border-bottom:1px solid var(--line);background:transparent;vertical-align:middle;font-size:.9rem;color:var(--text)}
.evc .cmp thead th{position:sticky;top:0;z-index:2;background:var(--surface-2);border-bottom:1.5px solid var(--line);font-weight:800}
.evc .cmp thead th:first-child{font-size:.68rem;text-transform:uppercase;letter-spacing:.05em;color:var(--faint)}
.evc .vh{display:flex;flex-direction:column;gap:1px}
.evc .vh .nm{font-size:.95rem;font-weight:800;line-height:1.2}
.evc .vh .vr{font-size:.74rem;font-weight:600;color:var(--faint);display:flex;align-items:center;gap:6px}
.evc .cmp tbody tr:nth-child(odd) td{background:var(--stripe)}
.evc .cmp tbody th{font-size:.8rem;color:var(--soft);font-weight:700;white-space:nowrap;position:sticky;left:0;z-index:1;background:var(--surface);border-right:1px solid var(--line)}
.evc .cmp tbody td.best{color:var(--green);font-weight:800;background:var(--green-s)!important}
.evc .cmp tbody tr:last-child td,.evc .cmp tbody tr:last-child th{border-bottom:none}
.evc .x{background:none;border:none;color:var(--faint);cursor:pointer;font-size:1rem;padding:2px 4px}
.evc .x:hover{color:#ef4444}
.evc .src{font-size:.78rem;color:var(--faint);margin-top:24px;text-align:center;line-height:1.6}
.evc .src a{color:var(--accent)}
.evc .seed{background:rgba(245,158,11,.12);border:1px solid rgba(245,158,11,.35);color:var(--text);
 border-radius:10px;padding:10px 14px;font-size:.84rem;margin-bottom:16px}
`

const MAX_CMP = 4

export default function CatalogueElectriques({ vehicles, isSeed, version, count }: {
  vehicles: EV[]; isSeed: boolean; version: string | null; count: number
}) {
  const [q, setQ] = useState('')
  const [marque, setMarque] = useState('')
  const [saison, setSaison] = useState<Saison>('mixte')
  const [sel, setSel] = useState<string[]>([])

  const lesMarques = useMemo(
    () => Array.from(new Set(vehicles.map((v) => v.brand))).sort((a, b) => a.localeCompare(b, 'fr')),
    [vehicles]
  )

  // On n'affiche AUCUNE liste tant que l'utilisateur n'a pas cherché ou choisi une marque.
  const matches = useMemo(() => {
    const needle = q.trim().toLowerCase()
    if (!needle && !marque) return []
    return vehicles
      .filter((v) => {
        if (marque && v.brand !== marque) return false
        if (needle && !nomComplet(v).toLowerCase().includes(needle)) return false
        return true
      })
      .sort((a, b) => (b.range_km ?? 0) - (a.range_km ?? 0))
      .slice(0, 24)
  }, [q, marque, vehicles])

  const selVehicles = sel.map((id) => vehicles.find((v) => v.id === id)).filter(Boolean) as EV[]
  const full = sel.length >= MAX_CMP
  function add(id: string) {
    setSel((s) => (s.includes(id) || s.length >= MAX_CMP ? s : [...s, id]))
  }
  function remove(id: string) {
    setSel((s) => s.filter((x) => x !== id))
  }

  return (
    <div className="evc">
      <style>{CSS}</style>

      <header className="hero">
        <div className="chip">⚡ Autopulse · catalogue électriques</div>
        <h1>Comparez les voitures électriques</h1>
        <p className="lead">
          Cherchez vos modèles, ajoutez-en jusqu’à {MAX_CMP}, et comparez batterie, autonomie réelle,
          consommation et charge rapide. Plus de {count.toLocaleString('fr-FR')} versions — sans marque imposée.
        </p>
      </header>

      <div className="wrap">
        {isSeed && (
          <div className="seed">
            ⚠️ <strong>Jeu de démarrage</strong> : catalogue partiel (valeurs WLTP indicatives). Chargez le dataset
            complet avec <code>node scripts/refresh-open-ev-data.mjs</code> puis{' '}
            <code>node scripts/ingest-vehicules-supabase.mjs</code>.
          </div>
        )}

        {/* Recherche / sélection */}
        <div className="panel">
          <div className="filters">
            <div>
              <label>Rechercher un modèle</label>
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Ex. Tesla Model 3, Renault 5…" />
            </div>
            <div>
              <label>Marque</label>
              <select value={marque} onChange={(e) => setMarque(e.target.value)}>
                <option value="">Toutes</option>
                {lesMarques.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
            <div>
              <label>Autonomie réelle</label>
              <select value={saison} onChange={(e) => setSaison(e.target.value as Saison)} title="Saison de référence pour l'autonomie réelle">
                <option value="ete">Été</option>
                <option value="mixte">Mixte</option>
                <option value="hiver">Hiver</option>
              </select>
            </div>
          </div>

          {(q.trim() || marque) ? (
            matches.length === 0 ? (
              <div className="hint">Aucun modèle ne correspond. Essayez un autre nom ou une autre marque.</div>
            ) : (
              <div className="results">
                {matches.map((v) => {
                  const on = sel.includes(v.id)
                  return (
                    <div key={v.id} className="resrow">
                      <div>
                        <div className="nm">{nomComplet(v)}</div>
                        <div className="mt">
                          {[v.year, fmtKwh(v.battery_kwh), `${fmtKm(v.range_km)} WLTP`, v.dc_kw ? `${v.dc_kw} kW DC` : null]
                            .filter(Boolean)
                            .join(' · ')}
                        </div>
                      </div>
                      <button
                        className={'btn btn-sm ' + (on ? 'btn-o' : 'btn-p')}
                        disabled={!on && full}
                        onClick={() => (on ? remove(v.id) : add(v.id))}
                      >
                        {on ? 'Retiré ✓' : full ? 'Max atteint' : '+ Ajouter'}
                      </button>
                    </div>
                  )
                })}
              </div>
            )
          ) : (
            <div className="hint">Commencez à taper le nom d’un modèle pour l’ajouter à la comparaison.</div>
          )}
        </div>

        {/* Sélection courante */}
        {selVehicles.length > 0 && (
          <>
            <div className="between">
              <span className="count">
                {selVehicles.length} véhicule{selVehicles.length > 1 ? 's' : ''} sélectionné{selVehicles.length > 1 ? 's' : ''}
                {full ? ` (max ${MAX_CMP})` : ''}
              </span>
              <button className="btn btn-o btn-sm" onClick={() => setSel([])}>Tout retirer</button>
            </div>
            <div className="chips">
              {selVehicles.map((v) => (
                <span key={v.id} className="selchip">
                  {nomComplet(v)}
                  <button className="x" onClick={() => remove(v.id)} aria-label="Retirer">✕</button>
                </span>
              ))}
            </div>
            <CmpTable vehicles={selVehicles} saison={saison} onRemove={remove} />
          </>
        )}

        <p className="src">
          Données : <a href="https://open-ev-data.github.io" target="_blank" rel="noopener noreferrer">Open EV Data</a> — licence CDLA-Permissive-2.0.
          {version ? ` Version ${version}.` : ''} Autonomies réelles et temps de charge estimés par Moteurs.com.
          {' '}<Link href="/outils/carnet-entretien" style={{ color: 'var(--color-primary)' }}>Suivre l’entretien de votre véhicule →</Link>
        </p>
      </div>
    </div>
  )
}

function CmpTable({ vehicles, saison, onRemove }: {
  vehicles: EV[]; saison: Saison; onRemove: (id: string) => void
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
    <div className="cmp">
      <div className="cmp-scroll">
        <table>
          <thead>
            <tr>
              <th>Critère</th>
              {vehicles.map((v) => (
                <th key={v.id}>
                  <div className="vh">
                    <span className="nm">{v.brand} {v.model}</span>
                    <span className="vr">
                      {[v.variant, v.year].filter(Boolean).join(' · ') || '—'}
                      <button className="x" onClick={() => onRemove(v.id)} title="Retirer" style={{ fontSize: '.85rem' }}>✕</button>
                    </span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr><th>Batterie</th>{vehicles.map((v, i) => <td key={v.id} className={batt[i] != null && batt[i] === max(batt) ? 'best' : ''}>{fmtKwh(v.battery_kwh)}</td>)}</tr>
            <tr><th>Autonomie WLTP</th>{vehicles.map((v, i) => <td key={v.id} className={wltp[i] != null && wltp[i] === max(wltp) ? 'best' : ''}>{fmtKm(v.range_km)}</td>)}</tr>
            <tr><th>Autonomie réelle ({saison})</th>{vehicles.map((v, i) => <td key={v.id} className={reel[i] != null && reel[i] === max(reel) ? 'best' : ''}>{fmtKm(reel[i])}</td>)}</tr>
            <tr><th>Conso réelle estimée</th>{vehicles.map((v, i) => <td key={v.id} className={conso[i] != null && conso[i] === min(conso) ? 'best' : ''}>{conso[i] != null ? `${conso[i]} Wh/km` : '—'}</td>)}</tr>
            <tr><th>Charge rapide (pic)</th>{vehicles.map((v, i) => <td key={v.id} className={dc[i] != null && dc[i] === max(dc) ? 'best' : ''}>{fmtKw(v.dc_kw)}</td>)}</tr>
            <tr><th>Charge 10→80 %</th>{vehicles.map((v, i) => <td key={v.id} className={tps[i] != null && tps[i] === min(tps) ? 'best' : ''}>{tps[i] != null ? `${tps[i]} min` : '—'}</td>)}</tr>
            <tr><th>Charge AC</th>{vehicles.map((v) => <td key={v.id}>{fmtKw(v.ac_kw)}</td>)}</tr>
            <tr><th>Transmission</th>{vehicles.map((v) => <td key={v.id}>{v.drivetrain ? (DRIVE_LABEL[v.drivetrain] ?? v.drivetrain) : '—'}</td>)}</tr>
            <tr><th>Places</th>{vehicles.map((v) => <td key={v.id}>{v.seats ?? '—'}</td>)}</tr>
            <tr><th>V2L</th>{vehicles.map((v) => <td key={v.id}>{v.v2l ? 'Oui' : '—'}</td>)}</tr>
            <tr><th>Prix indicatif</th>{vehicles.map((v, i) => <td key={v.id} className={prix[i] != null && prix[i] === min(prix) ? 'best' : ''}>{fmtEur(v.price_eur)}</td>)}</tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}
