'use client'

import { useState } from 'react'
import { Link } from '@/i18n/navigation'
import {
  calculTCOParticulier, fmtEurTCO, fmtSignEur,
  PRESETS_PAYS,
  type TCOParticulierInput, type TCOParticulierResult,
} from '@/lib/tco-particulier'

// ─── CSS ─────────────────────────────────────────────────────────────────────

const CSS = `
.tco-tool{
  --bg:var(--color-bg);--surface:var(--color-bg-card);--surface-2:var(--color-bg-alt);
  --text:var(--color-text);--text-soft:var(--color-text-soft);--text-faint:var(--color-text-muted);
  --line:var(--color-border);--accent:var(--color-primary);--accent-dark:var(--color-primary-dark);
  --green:var(--color-accent);--red:var(--color-danger);--shadow:var(--shadow-md);
  font-family:inherit;color:var(--text);background:var(--bg);
}
.tco-tool *{box-sizing:border-box;margin:0;padding:0}
.tco-wrap{max-width:1200px;margin:0 auto;padding:32px 20px 80px}
.tco-crumb{font-size:.8rem;color:var(--text-faint);margin-bottom:20px}
.tco-crumb a{color:var(--text-soft);text-decoration:none}
.tco-crumb a:hover{color:var(--accent)}
.tco-crumb span{margin:0 6px;opacity:.4}

.tco-head{margin-bottom:32px}
.tco-tag{display:inline-block;font-size:.72rem;font-weight:700;letter-spacing:.06em;
  text-transform:uppercase;padding:4px 12px;border-radius:999px;
  background:rgba(239,108,26,.1);border:1px solid rgba(239,108,26,.25);
  color:var(--accent);margin-bottom:12px}
.tco-head h1{font-size:clamp(1.6rem,3.5vw,2.2rem);line-height:1.1;margin-bottom:10px}
.tco-head p{color:var(--text-soft);max-width:600px;font-size:.97rem;line-height:1.6}

.tco-grid{display:grid;grid-template-columns:1fr;gap:20px;align-items:start}
@media(min-width:1020px){.tco-grid{grid-template-columns:420px 1fr}}

.tco-card{background:var(--surface);border:1px solid var(--line);border-radius:16px;
  box-shadow:var(--shadow);margin-bottom:0}
@media(min-width:1020px){.tco-form-sticky{position:sticky;top:84px;max-height:calc(100vh - 104px);overflow-y:auto}}
.tco-card-h{padding:18px 22px 14px;border-bottom:1px solid var(--line)}
.tco-card-h h2{font-size:1rem;font-weight:700}
.tco-card-h p{font-size:.83rem;color:var(--text-soft);margin-top:3px}
.tco-card-b{padding:18px 22px 22px;display:flex;flex-direction:column;gap:14px}

.tco-section-title{font-size:.75rem;font-weight:700;text-transform:uppercase;
  letter-spacing:.06em;color:var(--text-faint);padding:4px 0 8px;
  border-bottom:1px solid var(--line);margin-bottom:2px}
.tco-field label{display:block;font-size:.83rem;font-weight:600;color:var(--text);margin-bottom:5px}
.tco-field input[type=number],.tco-field select{
  width:100%;padding:9px 12px;border:1.5px solid var(--line);border-radius:8px;
  font:inherit;font-size:.95rem;background:var(--surface-2);color:var(--text);
  outline:none;transition:border-color .15s}
.tco-field input:focus,.tco-field select:focus{border-color:var(--accent)}
.tco-row2{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.tco-row3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px}

.tco-btn{width:100%;padding:13px;background:var(--accent);color:#fff;border:none;
  border-radius:10px;font:inherit;font-size:.97rem;font-weight:700;cursor:pointer;
  transition:background .15s}
.tco-btn:hover{background:var(--accent-dark)}

/* KPIs */
.tco-kpis{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:20px}
@media(max-width:600px){.tco-kpis{grid-template-columns:1fr 1fr}}
.tco-kpi{background:var(--surface-2);border-radius:12px;padding:14px 12px;border:1px solid var(--line)}
.tco-kpi .lbl{font-size:.72rem;font-weight:700;text-transform:uppercase;
  letter-spacing:.04em;color:var(--text-faint);margin-bottom:5px}
.tco-kpi .val{font-size:1.4rem;font-weight:800;line-height:1}
.tco-kpi.hl{background:var(--color-bg-dark)}
.tco-kpi.hl .lbl{color:rgba(255,255,255,.55)}
.tco-kpi.hl .val{color:var(--accent)}
.tco-kpi .pos{color:var(--green)}
.tco-kpi .neg{color:var(--red)}

/* Verdict */
.tco-verdict{padding:14px 16px;border-radius:10px;font-size:.88rem;line-height:1.6;
  margin-bottom:20px;border-left:4px solid}
.tco-verdict.ok{background:rgba(0,184,135,.07);border-color:var(--green)}
.tco-verdict.warn{background:rgba(217,119,6,.07);border-color:var(--color-warning)}

/* Graphique SVG */
.tco-chart-wrap{background:var(--surface);border:1px solid var(--line);
  border-radius:14px;padding:18px 20px;margin-bottom:16px}
.tco-chart-wrap h3{font-size:.85rem;color:var(--text-soft);margin-bottom:14px}

/* Graphique barres postes */
.tco-bars{display:flex;flex-direction:column;gap:10px}
.tco-bar-row{display:grid;grid-template-columns:140px 1fr 80px;gap:10px;align-items:center;font-size:.84rem}
.tco-bar-label{color:var(--text-soft);font-weight:500}
.tco-bar-group{display:flex;flex-direction:column;gap:4px}
.tco-bar-track{background:var(--line);border-radius:4px;height:10px}
.tco-bar-fill-ve{height:100%;border-radius:4px;background:var(--accent);transition:width .5s}
.tco-bar-fill-th{height:100%;border-radius:4px;background:var(--red);opacity:.6;transition:width .5s}
.tco-bar-vals{font-size:.76rem;color:var(--text-faint)}

/* Liens */
.tco-links{margin-top:24px;padding:18px 20px;background:var(--surface-2);
  border-radius:14px;border:1px solid var(--line)}
.tco-links h3{font-size:.9rem;font-weight:700;margin-bottom:12px}
.tco-links-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:10px}
.tco-link-card{display:block;padding:12px 14px;background:var(--surface);
  border-radius:10px;border:1px solid var(--line);color:var(--text);
  font-size:.85rem;font-weight:600;text-decoration:none;transition:border-color .15s}
.tco-link-card:hover{border-color:var(--accent);color:var(--accent)}

.tco-disclaimer{font-size:.77rem;color:var(--text-faint);background:var(--surface-2);
  padding:12px 16px;border-radius:8px;line-height:1.55;margin-top:20px}
`

// ─── État initial ─────────────────────────────────────────────────────────────

const DEFAULT: TCOParticulierInput = {
  ve_prix: 42000, ve_conso_kwh: 17, ve_tarif_kwh: 0.23,
  ve_entretien_an: 400, ve_depreciation: 12, ve_fiscal_an: 0,
  th_prix: 32000, th_motorisation: 'essence', th_conso_l: 6.5,
  th_carburant: 1.72, th_entretien_an: 900, th_depreciation: 15,
  km_annuel: 15000,
}

// ─── Graphique SVG lignes TCO ─────────────────────────────────────────────────

function TCOLineChart({ result }: { result: TCOParticulierResult }) {
  const W = 560, H = 220, PAD = { top: 10, right: 20, bottom: 30, left: 60 }
  const iW = W - PAD.left - PAD.right
  const iH = H - PAD.top  - PAD.bottom

  const allVals = result.courbe.flatMap(p => [p.ve_cumul, p.th_cumul])
  const minV = Math.min(...allVals)
  const maxV = Math.max(...allVals)
  const range = maxV - minV || 1

  const xOf = (i: number) => PAD.left + (i / 10) * iW
  const yOf = (v: number) => PAD.top  + iH - ((v - minV) / range) * iH

  const vePoints = result.courbe.map((p, i) => `${xOf(i)},${yOf(p.ve_cumul)}`).join(' ')
  const thPoints = result.courbe.map((p, i) => `${xOf(i)},${yOf(p.th_cumul)}`).join(' ')

  const breakX = result.break_even !== null ? xOf(result.break_even) : null

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', maxHeight: 240 }}>
      {/* Axes */}
      <line x1={PAD.left} y1={PAD.top} x2={PAD.left} y2={PAD.top + iH} stroke="var(--line)" />
      <line x1={PAD.left} y1={PAD.top + iH} x2={PAD.left + iW} y2={PAD.top + iH} stroke="var(--line)" />

      {/* Grille horizontale */}
      {[0, 0.25, 0.5, 0.75, 1].map(t => {
        const y = PAD.top + iH * (1 - t)
        const v = minV + range * t
        return (
          <g key={t}>
            <line x1={PAD.left} y1={y} x2={PAD.left + iW} y2={y} stroke="var(--line)" strokeDasharray="3,4" />
            <text x={PAD.left - 5} y={y + 4} textAnchor="end" fontSize={10} fill="var(--color-text-muted)">
              {Math.round(v / 1000)}k
            </text>
          </g>
        )
      })}

      {/* Labels X */}
      {[0, 2, 4, 6, 8, 10].map(i => (
        <text key={i} x={xOf(i)} y={H - 6} textAnchor="middle" fontSize={10} fill="var(--color-text-muted)">
          {i === 0 ? 'Achat' : `An ${i}`}
        </text>
      ))}

      {/* Ligne break-even */}
      {breakX !== null && (
        <line x1={breakX} y1={PAD.top} x2={breakX} y2={PAD.top + iH}
          stroke="var(--color-accent)" strokeWidth={1.5} strokeDasharray="4,3" />
      )}

      {/* Zones */}
      <polyline points={vePoints} fill="rgba(239,108,26,.08)" stroke="none"
        strokeLinejoin="round" />
      <polyline points={thPoints} fill="rgba(220,38,38,.05)" stroke="none" />

      {/* Courbes */}
      <polyline points={thPoints} fill="none" stroke="var(--color-danger)"
        strokeWidth={2} strokeLinejoin="round" opacity={0.7} />
      <polyline points={vePoints} fill="none" stroke="var(--color-primary)"
        strokeWidth={2.5} strokeLinejoin="round" />

      {/* Légende */}
      <rect x={PAD.left + 4} y={PAD.top + 4} width={10} height={10} rx={2} fill="var(--color-primary)" />
      <text x={PAD.left + 18} y={PAD.top + 13} fontSize={10} fill="var(--color-text-soft)">⚡ Électrique</text>
      <rect x={PAD.left + 90} y={PAD.top + 4} width={10} height={10} rx={2} fill="var(--color-danger)" opacity={0.7} />
      <text x={PAD.left + 104} y={PAD.top + 13} fontSize={10} fill="var(--color-text-soft)">⛽ Thermique</text>
    </svg>
  )
}

// ─── Composant principal ──────────────────────────────────────────────────────

export default function TCOParticulierContent() {
  const [input, setInput]   = useState<TCOParticulierInput>(DEFAULT)
  const [result, setResult] = useState<TCOParticulierResult | null>(null)

  const set = (k: keyof TCOParticulierInput, v: number | string) =>
    setInput(p => ({ ...p, [k]: typeof DEFAULT[k] === 'number' ? +v : v }))

  function onPaysChange(code: string) {
    const p = PRESETS_PAYS[code]
    if (!p) return
    setInput(prev => ({
      ...prev,
      ve_tarif_kwh:  p.kwh,
      th_carburant:  prev.th_motorisation === 'diesel' ? p.diesel : p.essence,
      ve_fiscal_an:  p.fiscal_ve,
    }))
  }

  function onCalculer() {
    setResult(calculTCOParticulier(input))
  }

  // Valeur max pour les barres
  const maxPosteVal = result
    ? Math.max(...result.postes.flatMap(p => [Math.abs(p.ve_val), Math.abs(p.th_val)]))
    : 1

  return (
    <div className="tco-tool">
      <style>{CSS}</style>
      <div className="tco-wrap">

        {/* Fil d'Ariane */}
        <nav className="tco-crumb" aria-label="Fil d'Ariane">
          <Link href="/">Accueil</Link>
          <span>›</span>
          <Link href="/outils">Outils</Link>
          <span>›</span>
          TCO Particulier
        </nav>

        {/* En-tête */}
        <header className="tco-head">
          <div className="tco-tag">⚡ Outil gratuit</div>
          <h1>TCO Particulier — Électrique vs Thermique</h1>
          <p>Calculez le coût total de possession réel sur 10 ans : achat, énergie, entretien, dépréciation et aides fiscales. Point de rentabilité inclus.</p>
        </header>

        <div className="tco-grid">

          {/* ── Formulaire ── */}
          <div className="tco-form-sticky">
            <div className="tco-card">
              <div className="tco-card-h">
                <h2>Vos véhicules</h2>
                <p>Comparez électrique et thermique sur votre profil</p>
              </div>
              <div className="tco-card-b">

                {/* Pays */}
                <div className="tco-field">
                  <label>Pays</label>
                  <select onChange={e => onPaysChange(e.target.value)}>
                    <option value="FR">🇫🇷 France</option>
                    <option value="BE">🇧🇪 Belgique</option>
                    <option value="CH">🇨🇭 Suisse</option>
                    <option value="CA">🇨🇦 Canada</option>
                  </select>
                </div>

                <div className="tco-section-title">⚡ Véhicule électrique</div>

                <div className="tco-row2">
                  <div className="tco-field">
                    <label>Prix d'achat (€)</label>
                    <input type="number" value={input.ve_prix} min={0} step={500}
                      onChange={e => set('ve_prix', e.target.value)} />
                  </div>
                  <div className="tco-field">
                    <label>Aide fiscale / an (€)</label>
                    <input type="number" value={input.ve_fiscal_an} min={0} step={100}
                      onChange={e => set('ve_fiscal_an', e.target.value)} />
                  </div>
                </div>

                <div className="tco-row3">
                  <div className="tco-field">
                    <label>kWh/100 km</label>
                    <input type="number" value={input.ve_conso_kwh} min={5} max={40} step={0.5}
                      onChange={e => set('ve_conso_kwh', e.target.value)} />
                  </div>
                  <div className="tco-field">
                    <label>€/kWh</label>
                    <input type="number" value={input.ve_tarif_kwh} min={0.01} max={1} step={0.01}
                      onChange={e => set('ve_tarif_kwh', e.target.value)} />
                  </div>
                  <div className="tco-field">
                    <label>Entretien/an (€)</label>
                    <input type="number" value={input.ve_entretien_an} min={0} step={50}
                      onChange={e => set('ve_entretien_an', e.target.value)} />
                  </div>
                </div>

                <div className="tco-field">
                  <label>Dépréciation annuelle (%)</label>
                  <input type="number" value={input.ve_depreciation} min={0} max={50} step={0.5}
                    onChange={e => set('ve_depreciation', e.target.value)} />
                </div>

                <div className="tco-section-title">⛽ Véhicule thermique</div>

                <div className="tco-row2">
                  <div className="tco-field">
                    <label>Prix d'achat (€)</label>
                    <input type="number" value={input.th_prix} min={0} step={500}
                      onChange={e => set('th_prix', e.target.value)} />
                  </div>
                  <div className="tco-field">
                    <label>Motorisation</label>
                    <select value={input.th_motorisation}
                      onChange={e => set('th_motorisation', e.target.value)}>
                      <option value="essence">Essence</option>
                      <option value="diesel">Diesel</option>
                    </select>
                  </div>
                </div>

                <div className="tco-row3">
                  <div className="tco-field">
                    <label>L/100 km</label>
                    <input type="number" value={input.th_conso_l} min={3} max={25} step={0.1}
                      onChange={e => set('th_conso_l', e.target.value)} />
                  </div>
                  <div className="tco-field">
                    <label>€/L</label>
                    <input type="number" value={input.th_carburant} min={0.5} max={4} step={0.01}
                      onChange={e => set('th_carburant', e.target.value)} />
                  </div>
                  <div className="tco-field">
                    <label>Entretien/an (€)</label>
                    <input type="number" value={input.th_entretien_an} min={0} step={50}
                      onChange={e => set('th_entretien_an', e.target.value)} />
                  </div>
                </div>

                <div className="tco-field">
                  <label>Dépréciation annuelle (%)</label>
                  <input type="number" value={input.th_depreciation} min={0} max={50} step={0.5}
                    onChange={e => set('th_depreciation', e.target.value)} />
                </div>

                <div className="tco-section-title">📍 Usage</div>

                <div className="tco-field">
                  <label>Kilométrage annuel (km)</label>
                  <input type="number" value={input.km_annuel} min={1000} max={100000} step={1000}
                    onChange={e => set('km_annuel', e.target.value)} />
                </div>

                <button className="tco-btn" onClick={onCalculer}>Calculer mon TCO →</button>

              </div>
            </div>
          </div>

          {/* ── Résultats ── */}
          <div>
            {!result ? (
              <div className="tco-card" style={{ minHeight: 320, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ textAlign: 'center', color: 'var(--text-soft)', padding: 32 }}>
                  <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>⚡</div>
                  <p style={{ fontWeight: 600, marginBottom: 6 }}>Renseignez vos véhicules</p>
                  <p style={{ fontSize: '.85rem' }}>Entrez les caractéristiques des deux véhicules à comparer, puis cliquez sur <strong>Calculer</strong>.</p>
                </div>
              </div>
            ) : (
              <>
                {/* KPIs */}
                <div className="tco-kpis">
                  <div className="tco-kpi hl">
                    <div className="lbl">Point de rentabilité</div>
                    <div className="val">{result.break_even ? `${result.break_even} an${result.break_even > 1 ? 's' : ''}` : '> 10 ans'}</div>
                  </div>
                  <div className="tco-kpi">
                    <div className="lbl">Économie à 5 ans</div>
                    <div className={`val ${result.gain_5ans >= 0 ? 'pos' : 'neg'}`}>{fmtSignEur(result.gain_5ans)}</div>
                  </div>
                  <div className="tco-kpi">
                    <div className="lbl">Économie à 10 ans</div>
                    <div className={`val ${result.gain_10ans >= 0 ? 'pos' : 'neg'}`}>{fmtSignEur(result.gain_10ans)}</div>
                  </div>
                  <div className="tco-kpi">
                    <div className="lbl">Coût/km ⚡</div>
                    <div className="val" style={{ color: 'var(--accent)' }}>{(result.ckm_ve * 100).toFixed(1)} c€</div>
                  </div>
                  <div className="tco-kpi">
                    <div className="lbl">Coût/km ⛽</div>
                    <div className="val" style={{ color: 'var(--red)' }}>{(result.ckm_th * 100).toFixed(1)} c€</div>
                  </div>
                  <div className="tco-kpi">
                    <div className="lbl">Val. résiduelle VE à 5 ans</div>
                    <div className="val" style={{ color: 'var(--green)' }}>{fmtEurTCO(result.valeur_ve_5ans)}</div>
                  </div>
                </div>

                {/* Verdict */}
                <div className={`tco-verdict ${result.break_even ? 'ok' : 'warn'}`}>
                  {result.break_even
                    ? <>✅ <strong>Rentable dès l'année {result.break_even}</strong> (~{(result.break_even * input.km_annuel).toLocaleString('fr-FR')} km). Sur 10 ans : <strong>{fmtSignEur(result.gain_10ans)}</strong> d'économie. Énergie : <strong>{(result.ckm_ve * 100).toFixed(1)} c€/km</strong> contre <strong>{(result.ckm_th * 100).toFixed(1)} c€/km</strong> soit <strong>{Math.round((1 - result.ckm_ve / result.ckm_th) * 100)} % moins cher</strong>.</>
                    : <>⚠️ <strong>Sur 10 ans, le VE revient {fmtEurTCO(Math.abs(result.gain_10ans))} plus cher</strong> avec ces paramètres. Causes probables : différentiel de prix élevé et/ou kilométrage faible. Intégrez les aides fiscales disponibles dans votre pays.</>
                  }
                </div>

                {/* Graphique TCO */}
                <div className="tco-chart-wrap">
                  <h3>Coût total cumulé sur 10 ans (achat + énergie + entretien − valeur résiduelle)</h3>
                  <TCOLineChart result={result} />
                </div>

                {/* Graphique barres postes annuels */}
                <div className="tco-chart-wrap">
                  <h3>Coûts annuels par poste</h3>
                  <div className="tco-bars">
                    {result.postes.map(p => (
                      <div key={p.label} className="tco-bar-row">
                        <div className="tco-bar-label">{p.label}</div>
                        <div className="tco-bar-group">
                          <div className="tco-bar-track">
                            <div className="tco-bar-fill-ve"
                              style={{ width: `${Math.abs(p.ve_val) / maxPosteVal * 100}%` }} />
                          </div>
                          <div className="tco-bar-track">
                            <div className="tco-bar-fill-th"
                              style={{ width: `${Math.abs(p.th_val) / maxPosteVal * 100}%` }} />
                          </div>
                        </div>
                        <div className="tco-bar-vals">
                          <div style={{ color: 'var(--accent)' }}>{fmtEurTCO(p.ve_val)}</div>
                          <div style={{ color: 'var(--red)', opacity: .7 }}>{fmtEurTCO(p.th_val)}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <p className="tco-disclaimer">
                  Dépréciation calculée de façon linéaire. Tarifs énergie supposés constants. Les avantages fiscaux (ATN réduit BE, déductibilité...) sont à renseigner manuellement. Outil indicatif.
                </p>
              </>
            )}

            {/* Maillage interne */}
            <div className="tco-links">
              <h3>📚 Aller plus loin</h3>
              <div className="tco-links-grid">
                <Link href="/outils/calculateur-charge" className="tco-link-card">🔌 Calculateur de charge →</Link>
                <Link href="/assistance/couts" className="tco-link-card">💰 Assistance coûts →</Link>
                <Link href="/outils/tco-poids-lourds" className="tco-link-card">🚛 TCO Poids Lourds →</Link>
              </div>
            </div>

          </div>
        </div>

        <div className="tco-disclaimer" style={{ marginTop: 32 }}>
          <strong>Disclaimer —</strong> Ce simulateur produit des estimations indicatives. Les montants réels varient selon le modèle, le concessionnaire, votre éligibilité aux aides et l'évolution des tarifs énergie. Moteurs.com n'est pas conseiller financier.
        </div>
      </div>
    </div>
  )
}
