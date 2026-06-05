'use client'

import { useState } from 'react'
import { Link } from '@/i18n/navigation'
import {
  calculerCharge, fmtDuree, fmtEur, fmtKwh,
  BORNES_REF, TARIFS_PAYS, RENDEMENT_AC,
  type ChargeInput, type ChargeResult,
} from '@/lib/calculateur-charge'

// ─── CSS ─────────────────────────────────────────────────────────────────────

const CSS = `
.cc-tool{
  --bg:var(--color-bg);--surface:var(--color-bg-card);--surface-2:var(--color-bg-alt);
  --text:var(--color-text);--text-soft:var(--color-text-soft);--text-faint:var(--color-text-muted);
  --line:var(--color-border);--accent:var(--color-primary);--accent-dark:var(--color-primary-dark);
  --green:var(--color-accent);--shadow:var(--shadow-md);
  font-family:inherit;color:var(--text);background:var(--bg);
}
.cc-tool *{box-sizing:border-box;margin:0;padding:0}
.cc-wrap{max-width:1100px;margin:0 auto;padding:32px 20px 80px}
.cc-crumb{font-size:.8rem;color:var(--text-faint);margin-bottom:20px}
.cc-crumb a{color:var(--text-soft);text-decoration:none}
.cc-crumb a:hover{color:var(--accent)}
.cc-crumb span{margin:0 6px;opacity:.4}

.cc-head{margin-bottom:32px}
.cc-tag{display:inline-block;font-size:.72rem;font-weight:700;letter-spacing:.06em;
  text-transform:uppercase;padding:4px 12px;border-radius:999px;
  background:rgba(0,184,135,.1);border:1px solid rgba(0,184,135,.25);
  color:var(--green);margin-bottom:12px}
.cc-head h1{font-size:clamp(1.6rem,3.5vw,2.2rem);line-height:1.1;margin-bottom:10px}
.cc-head p{color:var(--text-soft);max-width:580px;font-size:.97rem;line-height:1.6}

.cc-grid{display:grid;grid-template-columns:1fr;gap:20px;align-items:start}
@media(min-width:960px){.cc-grid{grid-template-columns:400px 1fr}}

.cc-card{background:var(--surface);border:1px solid var(--line);border-radius:16px;
  box-shadow:var(--shadow);overflow:hidden;margin-bottom:0}
.cc-card-h{padding:18px 22px 14px;border-bottom:1px solid var(--line)}
.cc-card-h h2{font-size:1rem;font-weight:700}
.cc-card-h p{font-size:.83rem;color:var(--text-soft);margin-top:3px}
.cc-card-b{padding:18px 22px 22px;display:flex;flex-direction:column;gap:16px}

.cc-field label{display:flex;justify-content:space-between;align-items:baseline;
  font-size:.83rem;font-weight:600;color:var(--text);margin-bottom:6px}
.cc-field label strong{font-size:.97rem;color:var(--accent)}
.cc-field input[type=range]{
  -webkit-appearance:none;appearance:none;width:100%;height:5px;
  border-radius:3px;background:var(--line);outline:none;cursor:pointer}
.cc-field input[type=range]::-webkit-slider-thumb{
  -webkit-appearance:none;width:18px;height:18px;border-radius:50%;
  background:var(--accent);cursor:pointer;box-shadow:0 1px 4px rgba(0,0,0,.2)}
.cc-field input[type=number],.cc-field select{
  width:100%;padding:9px 12px;border:1.5px solid var(--line);border-radius:8px;
  font:inherit;font-size:.95rem;background:var(--surface-2);color:var(--text);outline:none;
  transition:border-color .15s}
.cc-field input[type=number]:focus,.cc-field select:focus{border-color:var(--accent)}
.cc-field .hint{font-size:.74rem;color:var(--text-faint);margin-top:3px}
.cc-row2{display:grid;grid-template-columns:1fr 1fr;gap:12px}

.cc-soc{background:var(--surface-2);border-radius:10px;padding:12px 14px}
.cc-soc-bar{position:relative;background:var(--line);border-radius:5px;height:18px;
  margin:8px 0 4px;overflow:visible}
.cc-soc-fill{height:100%;background:var(--color-primary);opacity:.4;
  border-radius:5px;transition:width .25s}
.cc-soc-marker{position:absolute;top:-4px;width:4px;height:26px;
  background:var(--green);border-radius:2px;transform:translateX(-2px);transition:left .25s}
.cc-soc-axis{display:flex;justify-content:space-between;font-size:.7rem;color:var(--text-faint)}
.cc-soc-legend{display:flex;gap:14px;font-size:.75rem;color:var(--text-soft);margin-top:6px}
.cc-soc-legend span{display:flex;align-items:center;gap:4px}
.dot-blue{width:10px;height:8px;border-radius:2px;background:var(--color-primary);opacity:.4}
.dot-green{width:4px;height:12px;border-radius:2px;background:var(--green)}

.cc-btn{width:100%;padding:13px;background:var(--accent);color:#fff;border:none;
  border-radius:10px;font:inherit;font-size:.97rem;font-weight:700;cursor:pointer;
  transition:background .15s;margin-top:4px}
.cc-btn:hover{background:var(--accent-dark)}

/* Résultats */
.cc-kpis{display:grid;grid-template-columns:repeat(2,1fr);gap:12px;margin-bottom:20px}
@media(min-width:560px){.cc-kpis{grid-template-columns:repeat(4,1fr)}}
.cc-kpi{background:var(--surface-2);border-radius:12px;padding:14px 12px;
  border:1px solid var(--line)}
.cc-kpi .lbl{font-size:.72rem;font-weight:700;text-transform:uppercase;
  letter-spacing:.04em;color:var(--text-faint);margin-bottom:5px}
.cc-kpi .val{font-size:1.5rem;font-weight:800;line-height:1;color:var(--text)}
.cc-kpi.hl .val{color:var(--accent)}

.cc-alert{padding:12px 16px;border-radius:10px;font-size:.87rem;line-height:1.55;
  margin-bottom:20px;border-left:4px solid}
.cc-alert.warn{background:rgba(217,119,6,.07);border-color:var(--color-warning)}
.cc-alert.ok{background:rgba(0,184,135,.07);border-color:var(--green)}

.cc-table-wrap{overflow-x:auto}
.cc-table{width:100%;border-collapse:collapse;font-size:.87rem}
.cc-table th{font-size:.72rem;font-weight:700;text-transform:uppercase;
  letter-spacing:.04em;color:var(--text-faint);padding:8px 10px;
  border-bottom:2px solid var(--line);text-align:left}
.cc-table th:last-child{text-align:right}
.cc-table td{padding:9px 10px;border-bottom:1px solid var(--line);vertical-align:middle}
.cc-table td:last-child{text-align:right;font-weight:700;color:var(--accent)}
.cc-table tr.active-row{background:rgba(239,108,26,.05)}
.cc-bar-track{background:var(--line);border-radius:4px;height:12px;min-width:60px}
.cc-bar-fill{height:100%;border-radius:4px;background:var(--accent);transition:width .4s}

.cc-links{margin-top:32px;padding:20px 22px;background:var(--surface-2);
  border-radius:14px;border:1px solid var(--line)}
.cc-links h3{font-size:.9rem;font-weight:700;margin-bottom:12px}
.cc-links-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:10px}
.cc-link-card{display:block;padding:12px 14px;background:var(--surface);
  border-radius:10px;border:1px solid var(--line);color:var(--text);
  font-size:.85rem;font-weight:600;text-decoration:none;transition:border-color .15s}
.cc-link-card:hover{border-color:var(--accent);color:var(--accent)}

.cc-disclaimer{margin-top:24px;font-size:.78rem;color:var(--text-faint);
  background:var(--surface-2);padding:12px 16px;border-radius:8px;line-height:1.55}
`

// ─── État initial ─────────────────────────────────────────────────────────────

const DEFAULT: ChargeInput = {
  capacite_kwh:    75,
  soc_initial:     20,
  soc_cible:       80,
  puissance_borne: 7.4,
  puissance_obc:   11,
  tarif_kwh:       0.23,
}

// ─── Composant principal ──────────────────────────────────────────────────────

export default function CalculateurChargeContent() {
  const [input, setInput]   = useState<ChargeInput>(DEFAULT)
  const [result, setResult] = useState<ChargeResult | null>(null)

  const set = (k: keyof ChargeInput, v: number) => setInput(p => ({ ...p, [k]: v }))

  const deltaKwh = Math.max(0, input.soc_cible - input.soc_initial)

  function onCalculer() {
    setResult(calculerCharge(input))
  }

  function onPaysChange(code: string) {
    const t = TARIFS_PAYS[code]
    if (t) set('tarif_kwh', t)
  }

  // Tableau comparatif toutes bornes
  const maxH = Math.max(...BORNES_REF.map(b => {
    const kwh = Math.max(0, (input.soc_cible - input.soc_initial) / 100 * input.capacite_kwh)
    const eff = Math.min(b.pow, input.puissance_obc) * RENDEMENT_AC
    return kwh / eff
  }))

  return (
    <div className="cc-tool">
      <style>{CSS}</style>
      <div className="cc-wrap">

        {/* Fil d'Ariane */}
        <nav className="cc-crumb" aria-label="Fil d'Ariane">
          <Link href="/">Accueil</Link>
          <span>›</span>
          <Link href="/outils">Outils</Link>
          <span>›</span>
          Calculateur de charge
        </nav>

        {/* En-tête */}
        <header className="cc-head">
          <div className="cc-tag">⚡ Outil gratuit</div>
          <h1>Calculateur de charge VE</h1>
          <p>Temps de charge exact, coût et comparatif de toutes les bornes selon votre véhicule et votre installation.</p>
        </header>

        <div className="cc-grid">

          {/* ── Formulaire ── */}
          <div>
            <div className="cc-card">
              <div className="cc-card-h">
                <h2>Votre configuration</h2>
                <p>Batterie, état de charge et installation</p>
              </div>
              <div className="cc-card-b">

                {/* Pays */}
                <div className="cc-field">
                  <label>Pays <span style={{ fontSize: '.8rem', fontWeight: 400, color: 'var(--text-faint)' }}>pré-remplit le tarif kWh</span></label>
                  <select onChange={e => onPaysChange(e.target.value)}>
                    <option value="FR">🇫🇷 France</option>
                    <option value="BE">🇧🇪 Belgique</option>
                    <option value="CH">🇨🇭 Suisse</option>
                    <option value="CA">🇨🇦 Canada</option>
                  </select>
                </div>

                {/* Capacité */}
                <div className="cc-field">
                  <label>Capacité batterie <strong>{input.capacite_kwh} kWh</strong></label>
                  <input type="range" min={20} max={120} step={1} value={input.capacite_kwh}
                    onChange={e => set('capacite_kwh', +e.target.value)} />
                </div>

                {/* SoC visuel */}
                <div className="cc-soc">
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.8rem' }}>
                    <span style={{ fontWeight: 600 }}>État de charge</span>
                    <span style={{ color: 'var(--green)', fontWeight: 700 }}>+{deltaKwh} % à recharger</span>
                  </div>
                  <div className="cc-soc-bar">
                    <div className="cc-soc-fill" style={{ width: `${input.soc_initial}%` }} />
                    <div className="cc-soc-marker" style={{ left: `${input.soc_cible}%` }} />
                  </div>
                  <div className="cc-soc-axis">
                    <span>0 %</span><span>25 %</span><span>50 %</span><span>75 %</span><span>100 %</span>
                  </div>
                  <div className="cc-soc-legend">
                    <span><span className="dot-blue" />SoC initial</span>
                    <span><span className="dot-green" />SoC cible</span>
                  </div>
                </div>

                <div className="cc-row2">
                  <div className="cc-field">
                    <label>SoC initial <strong>{input.soc_initial} %</strong></label>
                    <input type="range" min={0} max={99} step={1} value={input.soc_initial}
                      onChange={e => set('soc_initial', +e.target.value)} />
                  </div>
                  <div className="cc-field">
                    <label>SoC cible <strong>{input.soc_cible} %</strong></label>
                    <input type="range" min={1} max={100} step={1} value={input.soc_cible}
                      onChange={e => set('soc_cible', +e.target.value)} />
                  </div>
                </div>

                {/* Borne */}
                <div className="cc-field">
                  <label>Type de borne</label>
                  <select value={input.puissance_borne}
                    onChange={e => set('puissance_borne', +e.target.value)}>
                    {BORNES_REF.map(b => (
                      <option key={b.id} value={b.pow}>{b.icon} {b.label}</option>
                    ))}
                  </select>
                </div>

                <div className="cc-row2">
                  <div className="cc-field">
                    <label>OBC véhicule <strong>{input.puissance_obc} kW</strong></label>
                    <input type="range" min={3} max={350} step={1} value={input.puissance_obc}
                      onChange={e => set('puissance_obc', +e.target.value)} />
                    <span className="hint">Chargeur embarqué</span>
                  </div>
                  <div className="cc-field">
                    <label>Tarif kWh (€)</label>
                    <input type="number" min={0.01} max={2} step={0.01} value={input.tarif_kwh}
                      onChange={e => set('tarif_kwh', +e.target.value)} />
                  </div>
                </div>

                <button className="cc-btn" onClick={onCalculer}>Calculer →</button>
              </div>
            </div>
          </div>

          {/* ── Résultats ── */}
          <div>
            {!result ? (
              <div className="cc-card" style={{ minHeight: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ textAlign: 'center', color: 'var(--text-soft)', padding: 32 }}>
                  <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>🔌</div>
                  <p style={{ fontWeight: 600, marginBottom: 6 }}>Configurez votre scénario</p>
                  <p style={{ fontSize: '.85rem' }}>Renseignez votre batterie et votre borne, puis cliquez sur <strong>Calculer</strong>.</p>
                </div>
              </div>
            ) : (
              <>
                {/* KPIs */}
                <div className="cc-kpis">
                  <div className="cc-kpi hl">
                    <div className="lbl">Durée de charge</div>
                    <div className="val">{fmtDuree(result.duree_h)}</div>
                  </div>
                  <div className="cc-kpi">
                    <div className="lbl">Coût de la charge</div>
                    <div className="val">{fmtEur(result.cout_eur)}</div>
                  </div>
                  <div className="cc-kpi">
                    <div className="lbl">Énergie ajoutée</div>
                    <div className="val">{fmtKwh(result.kwh_needed)}</div>
                  </div>
                  <div className="cc-kpi">
                    <div className="lbl">Coût / 100 km*</div>
                    <div className="val">{fmtEur(result.cout_100km)}</div>
                  </div>
                </div>

                {/* Alerte borne surdimensionnée */}
                {result.borne_surdi ? (
                  <div className="cc-alert warn">
                    ⚠️ <strong>Borne surdimensionnée :</strong> votre véhicule accepte {input.puissance_obc} kW maximum.
                    Une borne {input.puissance_borne} kW n'apporte rien de plus.
                    Puissance effective : <strong>{result.puissance_eff.toFixed(1)} kW</strong>.
                  </div>
                ) : (
                  <div className="cc-alert ok">
                    ✅ Configuration optimale — puissance effective <strong>{result.puissance_eff.toFixed(1)} kW</strong> (rendement AC {Math.round(RENDEMENT_AC * 100)} %).
                  </div>
                )}

                {/* Tableau comparatif */}
                <div className="cc-card">
                  <div className="cc-card-h">
                    <h2>Comparatif — toutes bornes</h2>
                  </div>
                  <div style={{ padding: '4px 0' }}>
                    <div className="cc-table-wrap">
                      <table className="cc-table">
                        <thead>
                          <tr>
                            <th>Borne</th>
                            <th>Durée relative</th>
                            <th style={{ textAlign: 'right' }}>Durée</th>
                            <th style={{ textAlign: 'right' }}>Coût</th>
                          </tr>
                        </thead>
                        <tbody>
                          {BORNES_REF.map(b => {
                            const kwh = result.kwh_needed
                            const eff = Math.min(b.pow, input.puissance_obc) * RENDEMENT_AC
                            const h   = kwh / eff
                            const pct = maxH > 0 ? (h / maxH) * 100 : 0
                            const isActive = Math.abs(b.pow - input.puissance_borne) < 0.1
                            return (
                              <tr key={b.id} className={isActive ? 'active-row' : ''}>
                                <td style={{ fontWeight: isActive ? 700 : 400 }}>{b.icon} {b.label}</td>
                                <td style={{ width: 120 }}>
                                  <div className="cc-bar-track">
                                    <div className="cc-bar-fill" style={{ width: `${pct}%` }} />
                                  </div>
                                </td>
                                <td>{fmtDuree(h)}</td>
                                <td>{fmtEur(kwh * input.tarif_kwh)}</td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                <p className="cc-disclaimer">
                  * Hypothèse : consommation de 17 kWh/100 km. Durées AC limitées par le chargeur embarqué (OBC), pas par la borne. Rendement supposé : 95 %. Charges DC : courbe constructeur non modélisée.
                </p>
              </>
            )}

            {/* Liens maillage interne */}
            <div className="cc-links">
              <h3>📚 Aller plus loin</h3>
              <div className="cc-links-grid">
                <Link href="/outils/tco-particulier" className="cc-link-card">⚡ TCO Particulier →</Link>
                <Link href="/assistance/recharge" className="cc-link-card">🔌 Assistance Recharge →</Link>
                <Link href="/outils/simulateur-borne-recharge" className="cc-link-card">🏠 Choisir sa borne →</Link>
              </div>
            </div>
          </div>

        </div>

        <div className="cc-disclaimer" style={{ marginTop: 32 }}>
          <strong>Disclaimer —</strong> Estimations indicatives. Les temps réels varient selon la température batterie, l'état de santé (SoH) et la courbe de charge constructeur. Moteurs.com n'est pas responsable des décisions prises sur la base de ces calculs.
        </div>
      </div>
    </div>
  )
}
