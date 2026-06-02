'use client'

import { useState, useMemo } from 'react'
import { Link } from '@/i18n/navigation'
import {
  calculTCOPL, getDefaultInput,
  carburantUnit, prixCarburantUnit, fmtEurPL,
  MOTORISATION_LABELS, VEHICULE_LABELS,
  type TypeVehicule, type Motorisation, type ModeFinancement, type TCOPLInput,
} from '@/lib/tco-poids-lourds'

// ─── CSS ─────────────────────────────────────────────────────────────────────

const TOOL_CSS = `
.m-tool{
  --bg:var(--color-bg);--surface:var(--color-bg-card);--surface-2:var(--color-bg-alt);
  --text:var(--color-text);--text-soft:var(--color-text-soft);--text-faint:var(--color-text-muted);
  --line:var(--color-border);--accent:var(--color-primary);--accent-deep:var(--color-primary-dark);
  --accent-soft:rgba(239,108,26,.14);
  --shadow:0 1px 2px rgba(16,24,43,.05),0 14px 34px -16px rgba(16,24,43,.2);
  background:var(--bg);color:var(--text);font-size:16px;line-height:1.55;
  -webkit-font-smoothing:antialiased;font-family:inherit;
}
html[data-theme="dark"] .m-tool{--shadow:0 1px 2px rgba(0,0,0,.4),0 18px 40px -18px rgba(0,0,0,.6);}
.m-tool *{box-sizing:border-box;margin:0;padding:0}
.m-tool .wrap{max-width:1200px;margin:0 auto;padding:26px 22px 80px}
.m-tool .crumb{font-size:.82rem;color:var(--text-faint);margin-bottom:18px}
.m-tool .crumb a{color:var(--text-soft);text-decoration:none}
.m-tool .crumb a:hover{color:var(--accent)}
.m-tool .crumb span{margin:0 7px;opacity:.5}
.m-tool .head{border-bottom:1px solid var(--line);padding-bottom:22px;margin-bottom:28px}
.m-tool .meta-row{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin-bottom:14px}
.m-tool .chip{display:inline-flex;gap:6px;align-items:center;font-size:.74rem;font-weight:700;
  letter-spacing:.04em;text-transform:uppercase;padding:5px 11px;border-radius:999px;
  background:var(--surface-2);border:1px solid var(--line);color:var(--text-soft)}
.m-tool .chip.maj{color:var(--accent)}
.m-tool h1{font-family:Georgia,"Times New Roman",serif;font-weight:600;
  font-size:clamp(1.8rem,4.2vw,2.7rem);line-height:1.06;letter-spacing:-.01em;
  max-width:24ch;margin-bottom:.3em}
.m-tool .lede{color:var(--text-soft);max-width:64ch;font-size:1.02rem}
/* Grid */
.m-tool .tpl-grid{display:grid;grid-template-columns:1fr;gap:24px;align-items:start}
@media(min-width:1040px){.m-tool .tpl-grid{grid-template-columns:1.25fr 1fr}}
.m-tool .tpl-form{}
.m-tool .tpl-results{}
.m-tool .results-sticky{
  background:var(--surface);border:1.5px solid var(--line);border-radius:16px;
  box-shadow:var(--shadow);padding:22px;
}
@media(min-width:1040px){.m-tool .results-sticky{position:sticky;top:80px;max-height:calc(100vh - 100px);overflow-y:auto;}}
/* Cards */
.m-tool .card{background:var(--surface);border:1px solid var(--line);border-radius:16px;
  box-shadow:var(--shadow);overflow:hidden;margin-bottom:16px}
.m-tool .card-h{padding:18px 22px 16px}
.m-tool .card-h h2{font-family:Georgia,"Times New Roman",serif;font-weight:600;font-size:1.1rem}
.m-tool .card-h p{color:var(--text-soft);font-size:.88rem;margin-top:3px}
.m-tool .card-b{padding:4px 22px 22px}
/* Details/Summary accordion */
.m-tool details.card>summary{cursor:pointer;list-style:none;user-select:none}
.m-tool details.card>summary::-webkit-details-marker{display:none}
.m-tool .card-summary{display:flex;justify-content:space-between;align-items:center}
.m-tool .card-summary::after{content:'▼';font-size:.75rem;opacity:.5;margin-left:8px;transition:transform .2s}
.m-tool details[open]>.card-summary::after{content:'▲'}
/* Vehicle selector */
.m-tool .profil-cards{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:4px}
.m-tool .profil-card{background:var(--surface-2);border:1.5px solid var(--line);border-radius:12px;
  padding:14px 10px;cursor:pointer;text-align:center;transition:all .15s;
  display:flex;flex-direction:column;align-items:center;gap:5px;width:100%}
.m-tool .profil-card:hover{border-color:var(--accent)}
.m-tool .profil-card.active{border-color:var(--accent-deep);background:var(--accent-soft)}
.m-tool .pcard-icon{font-size:1.8rem;line-height:1}
.m-tool .pcard-title{font-size:.82rem;font-weight:700;color:var(--text)}
.m-tool .pcard-sub{font-size:.72rem;color:var(--text-faint)}
/* Tabs */
.m-tool .motor-tabs,.m-tool .fin-tabs{display:flex;flex-wrap:wrap;gap:7px;margin-top:6px}
.m-tool .motor-tab,.m-tool .fin-tab{
  flex:1 1 auto;min-width:fit-content;background:var(--surface-2);
  border:1.3px solid var(--line);border-radius:10px;padding:8px 14px;
  font:inherit;font-size:.85rem;font-weight:600;color:var(--text-soft);
  cursor:pointer;transition:all .15s;white-space:nowrap}
.m-tool .motor-tab:hover,.m-tool .fin-tab:hover{border-color:var(--accent)}
.m-tool .motor-tab.active,.m-tool .fin-tab.active{
  background:var(--accent-deep);border-color:var(--accent-deep);color:#fff}
/* Form fields */
.m-tool .field{margin-top:16px}
.m-tool .flabel{display:block;font-weight:600;font-size:.9rem;margin-bottom:7px}
.m-tool .hint{font-weight:400;color:var(--text-soft);font-size:.78rem;display:block;margin-top:2px}
.m-tool input[type=number]{width:100%;font:inherit;color:var(--text);background:var(--surface-2);
  border:1.3px solid var(--line);border-radius:10px;padding:10px 12px;
  transition:border-color .15s,box-shadow .15s}
.m-tool input:focus{outline:none;border-color:var(--accent);box-shadow:0 0 0 3px var(--accent-soft)}
.m-tool .row2{display:grid;grid-template-columns:1fr 1fr;gap:11px;margin-top:16px}
.m-tool .isuf{position:relative}
.m-tool .isuf .suf{position:absolute;right:11px;top:50%;transform:translateY(-50%);
  color:var(--text-faint);font-size:.78rem;font-weight:600;pointer-events:none;white-space:nowrap}
.m-tool .isuf input{padding-right:70px}
.m-tool .note-inline{font-size:.82rem;color:var(--text-soft);background:var(--surface-2);
  border-left:3px solid var(--accent);padding:9px 12px;border-radius:0 8px 8px 0;margin-top:10px}
/* Results */
.m-tool .res-kpis{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:20px}
.m-tool .res-kpi{background:var(--surface-2);border:1px solid var(--line);border-radius:12px;padding:14px}
.m-tool .res-kpi.primary{border-color:var(--accent-deep);background:var(--accent-soft)}
.m-tool .res-kpi-label{font-size:.72rem;font-weight:700;text-transform:uppercase;
  letter-spacing:.06em;color:var(--text-faint);margin-bottom:4px}
.m-tool .res-kpi-value{font-size:1.5rem;font-weight:800;color:var(--text);line-height:1.1}
.m-tool .res-kpi.primary .res-kpi-value{color:var(--accent-deep)}
.m-tool .res-kpi-sub{font-size:.78rem;color:var(--text-faint);margin-top:3px}
/* Breakdown bar */
.m-tool .brkbar{display:flex;height:18px;border-radius:999px;overflow:hidden;margin:10px 0 12px;
  background:var(--surface-2)}
.m-tool .brkbar-seg{height:100%;transition:width .4s;flex-shrink:0}
.m-tool .brklegend{display:grid;grid-template-columns:1fr 1fr;gap:5px 12px}
.m-tool .brkleg-item{display:flex;align-items:center;gap:6px;font-size:.76rem;color:var(--text-soft)}
.m-tool .brkleg-dot{width:10px;height:10px;border-radius:50%;flex-shrink:0}
.m-tool .brkleg-label{flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.m-tool .brkleg-pct{font-weight:700;color:var(--text);min-width:28px;text-align:right}
/* Detail table */
.m-tool .detail-table{width:100%;border-collapse:collapse;font-size:.82rem;margin-top:8px}
.m-tool .detail-table th{text-align:left;font-size:.74rem;text-transform:uppercase;
  letter-spacing:.05em;color:var(--text-faint);padding:6px 8px;border-bottom:1px solid var(--line)}
.m-tool .detail-table th:not(:first-child){text-align:right}
.m-tool .detail-table td{padding:5px 8px;border-bottom:1px solid rgba(128,128,128,.07)}
.m-tool .detail-table td:not(:first-child){text-align:right;font-variant-numeric:tabular-nums;white-space:nowrap}
.m-tool .tr-section td{font-weight:700;font-size:.78rem;text-transform:uppercase;
  letter-spacing:.05em;color:var(--text-faint);padding-top:12px;padding-bottom:3px;
  border-bottom:none}
.m-tool .tr-total td{font-weight:800;font-size:.9rem;color:var(--text);
  padding-top:10px;border-top:2px solid var(--line);border-bottom:none}
.m-tool .tr-corrige td{color:var(--accent-deep);font-weight:700}
`

// ─── Sub-components ───────────────────────────────────────────────────────────

function NumField({
  label, value, onChange, suffix, hint, min = 0, max, step = 1,
}: {
  label: string; value: number; onChange: (v: number) => void;
  suffix?: string; hint?: string; min?: number; max?: number; step?: number;
}) {
  return (
    <div className="field">
      <label className="flabel">
        {label}
        {hint && <span className="hint">{hint}</span>}
      </label>
      <div className="isuf">
        <input
          type="number"
          value={value}
          min={min}
          max={max}
          step={step}
          onChange={e => {
            const v = parseFloat(e.target.value)
            onChange(isNaN(v) ? 0 : v)
          }}
        />
        {suffix && <span className="suf">{suffix}</span>}
      </div>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function TCOPoidslourdsContent() {
  const [inp, setInp] = useState<TCOPLInput>(() => getDefaultInput('tracteur_44t', 'diesel'))

  const upd = (patch: Partial<TCOPLInput>) => setInp(prev => ({ ...prev, ...patch }))

  const handleVehicule = (v: TypeVehicule) => {
    const validMots: Motorisation[] = v === 'porteur_elec' ? ['elec'] : ['diesel', 'gnv', 'hvo']
    const mot = validMots.includes(inp.motorisation) ? inp.motorisation : validMots[0]
    setInp(getDefaultInput(v, mot))
  }

  const handleMot   = (m: Motorisation)    => setInp(getDefaultInput(inp.type_vehicule, m))
  const handleFin   = (f: ModeFinancement) => upd({ mode_financement: f })

  const r = useMemo(() => calculTCOPL(inp), [inp])

  const total = r.tco_nominal_annuel
  const cats = [
    { label: 'Capital & financement', val: r.cat_capital,         color: '#3b82f6' },
    { label: 'Énergie',               val: r.cat_energie,         color: '#f59e0b' },
    { label: 'Entretien',             val: r.cat_entretien,       color: '#10b981' },
    { label: 'Conducteur',            val: r.cat_conducteur,      color: '#8b5cf6' },
    { label: 'Péages & taxes',        val: r.cat_peages,          color: '#ef4444' },
    { label: 'Assurance & admin',     val: r.cat_assurance_admin, color: '#6b7280' },
  ]

  const isElec     = inp.motorisation === 'elec'
  const hasAdblue  = inp.motorisation === 'diesel' || inp.motorisation === 'gnv'
  const showLoyer  = inp.mode_financement === 'credit_bail' || inp.mode_financement === 'lld'
  const showCredit = inp.mode_financement === 'credit'
  const isLLD      = inp.mode_financement === 'lld'
  const isCB       = inp.mode_financement === 'credit_bail'
  const pct = (v: number) => total > 0 ? ((v / total) * 100).toFixed(0) : '0'
  const km  = inp.km_annuel

  return (
    <div className="m-tool">
      <style>{TOOL_CSS}</style>
      <div className="wrap">

        {/* Breadcrumb */}
        <div className="crumb">
          <Link href="/">Accueil</Link><span>›</span>
          <Link href="/outils">Outils</Link><span>›</span>
          <span>TCO Poids Lourds</span>
        </div>

        {/* Header */}
        <div className="head">
          <div className="meta-row">
            <span className="chip">🚛 Transport & Logistique</span>
            <span className="chip">🇪🇺 Europe</span>
            <span className="chip maj">↻ Benchmarks IRU/ACEA 2025</span>
          </div>
          <h1>Calculateur TCO Poids Lourds</h1>
          <p className="lede">
            Coût total de possession complet pour tracteurs longue distance, porteurs régionaux et porteurs électriques.
            Capital, énergie, AdBlue, maintenance, conducteur, péages, downtime — conforme au guide de référence européen.
          </p>
        </div>

        {/* Main grid */}
        <div className="tpl-grid">

          {/* ── FORM COLUMN ─────────────────────────────────────────── */}
          <div className="tpl-form">

            {/* ═══ Panel 1 : Profil véhicule ═══ */}
            <div className="card">
              <div className="card-h">
                <h2>1. Profil du véhicule</h2>
                <p>Les valeurs par défaut se mettent à jour automatiquement selon le profil sélectionné.</p>
              </div>
              <div className="card-b">
                {/* Vehicle type */}
                <div className="profil-cards">
                  {(['tracteur_44t', 'porteur_19t', 'porteur_elec'] as TypeVehicule[]).map(v => {
                    const lbl = VEHICULE_LABELS[v]
                    return (
                      <button key={v}
                        className={`profil-card${inp.type_vehicule === v ? ' active' : ''}`}
                        onClick={() => handleVehicule(v)}>
                        <span className="pcard-icon">{lbl.icon}</span>
                        <span className="pcard-title">{lbl.title}</span>
                        <span className="pcard-sub">{lbl.sub}</span>
                      </button>
                    )
                  })}
                </div>

                {/* Motorisation (tracteur + porteur 19t seulement) */}
                {inp.type_vehicule !== 'porteur_elec' && (
                  <div className="field">
                    <div className="flabel">Motorisation</div>
                    <div className="motor-tabs">
                      {(['diesel', 'gnv', 'hvo'] as Motorisation[]).map(m => (
                        <button key={m}
                          className={`motor-tab${inp.motorisation === m ? ' active' : ''}`}
                          onClick={() => handleMot(m)}>
                          {m === 'diesel' ? '🛢️' : m === 'gnv' ? '🌿' : '🌱'} {MOTORISATION_LABELS[m]}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Km + durée */}
                <div className="row2">
                  <NumField label="Km annuels" value={inp.km_annuel}
                    onChange={v => upd({ km_annuel: v })}
                    suffix="km/an" min={10000} step={5000} />
                  <NumField label="Durée de détention" value={inp.duree_detention}
                    onChange={v => upd({ duree_detention: v })}
                    suffix="ans" min={1} max={15} step={1} />
                </div>
              </div>
            </div>

            {/* ═══ Panel 2 : Acquisition & financement ═══ */}
            <div className="card">
              <div className="card-h">
                <h2>2. Acquisition & financement</h2>
              </div>
              <div className="card-b">
                <div className="row2">
                  <NumField label="Prix catalogue HT" value={inp.prix_achat_ht}
                    onChange={v => upd({ prix_achat_ht: v })} suffix="€" step={1000} />
                  <NumField label="Remise négociée" value={inp.remise_pct}
                    onChange={v => upd({ remise_pct: v })} suffix="%" min={0} max={30} step={0.5} />
                </div>
                <div className="note-inline">
                  Prix net d&apos;acquisition :&nbsp;<strong>{fmtEurPL(r.prix_acquisition_net)}</strong>
                </div>

                <NumField label="Valeur de revente estimée (marché)" value={inp.valeur_revente_estimee}
                  onChange={v => upd({ valeur_revente_estimee: v })} suffix="€" step={1000}
                  hint="Benchmarks : 22–28 % du prix net pour tracteur Diesel à 5 ans ; 30–45 % pour VE" />

                {/* Mode financement */}
                <div className="field">
                  <div className="flabel">Mode de financement</div>
                  <div className="fin-tabs">
                    {(['comptant', 'credit', 'credit_bail', 'lld'] as ModeFinancement[]).map(f => (
                      <button key={f}
                        className={`fin-tab${inp.mode_financement === f ? ' active' : ''}`}
                        onClick={() => handleFin(f)}>
                        {f === 'comptant' ? 'Comptant' : f === 'credit' ? 'Crédit' : f === 'credit_bail' ? 'Crédit-bail' : 'LLD'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Crédit champs */}
                {showCredit && (
                  <div className="row2">
                    <NumField label="Taux annuel" value={inp.taux_interet_annuel}
                      onChange={v => upd({ taux_interet_annuel: v })} suffix="%" step={0.1} />
                    <NumField label="Durée financement" value={inp.duree_financement_mois}
                      onChange={v => upd({ duree_financement_mois: v })} suffix="mois" step={12} />
                  </div>
                )}

                {/* Loyer (CB / LLD) */}
                {showLoyer && (
                  <>
                    <NumField label="Loyer mensuel HT" value={inp.loyer_mensuel}
                      onChange={v => upd({ loyer_mensuel: v })} suffix="€/mois" step={50}
                      hint={isLLD ? 'En LLD : entretien + pneus souvent inclus — réduire les coûts de maintenance en conséquence' : undefined} />
                    {isCB && (
                      <NumField label="Valeur résiduelle contractuelle (option d'achat)" value={inp.valeur_residuelle_contractuelle}
                        onChange={v => upd({ valeur_residuelle_contractuelle: v })} suffix="€" step={1000}
                        hint="Réduit le coût net du crédit-bail proratisé sur la durée" />
                    )}
                  </>
                )}
              </div>
            </div>

            {/* ═══ Panel 3 : Coûts fixes ═══ */}
            <details className="card" open>
              <summary className="card-h card-summary">
                <h2>3. Coûts fixes annuels</h2>
              </summary>
              <div className="card-b">
                <div className="row2">
                  <NumField label="Assurance RC" value={inp.assurance_rc}
                    onChange={v => upd({ assurance_rc: v })} suffix="€/an" step={100} />
                  <NumField label="Tous risques" value={inp.assurance_tous_risques}
                    onChange={v => upd({ assurance_tous_risques: v })} suffix="€/an" step={100} />
                </div>
                <div className="row2">
                  <NumField label="Taxe à l'essieu (FR)" value={inp.taxe_essieu}
                    onChange={v => upd({ taxe_essieu: v })} suffix="€/an" step={50} />
                  <NumField label="Vignette / Eurovignette" value={inp.vignette}
                    onChange={v => upd({ vignette: v })} suffix="€/an" step={50} />
                </div>
                <NumField label="Conducteur — salaire + charges + formation" value={inp.cout_conducteur}
                  onChange={v => upd({ cout_conducteur: v })} suffix="€/an" step={500}
                  hint="30–40 % du TCO total · FR : 48–58 k€ · DE : 52–65 k€ · BE : 45–55 k€" />
                <div className="row2">
                  <NumField label="Contrôle technique" value={inp.controle_technique}
                    onChange={v => upd({ controle_technique: v })} suffix="€/an" step={50} />
                  <NumField label="Télémat. + tachygraphe" value={inp.telematics}
                    onChange={v => upd({ telematics: v })} suffix="€/an" step={50} />
                </div>
                <NumField label="Frais généraux (admin, TMS)" value={inp.frais_generaux}
                  onChange={v => upd({ frais_generaux: v })} suffix="€/an" step={100} />
                {isElec && (
                  <NumField label="Infrastructure recharge (amortie /an)" value={inp.infra_recharge_annuel}
                    onChange={v => upd({ infra_recharge_annuel: v })} suffix="€/an" step={500}
                    hint="Borne DC 150 kW (40–120 k€) + raccordement (15–60 k€) amortis sur 10–15 ans · abonnement puissance" />
                )}
              </div>
            </details>

            {/* ═══ Panel 4 : Coûts variables ═══ */}
            <details className="card" open>
              <summary className="card-h card-summary">
                <h2>4. Coûts variables</h2>
              </summary>
              <div className="card-b">
                <div className="row2">
                  <NumField label={`Consommation réelle`} value={inp.consommation}
                    onChange={v => upd({ consommation: v })}
                    suffix={carburantUnit(inp.motorisation)} step={0.5} />
                  <NumField label={isElec ? 'Prix électricité HT' : 'Prix carburant HT'} value={inp.prix_carburant}
                    onChange={v => upd({ prix_carburant: v })}
                    suffix={prixCarburantUnit(inp.motorisation)} step={0.01} />
                </div>
                <div className="note-inline">
                  Coût énergie :&nbsp;
                  <strong>{(r.cout_carburant_km).toFixed(4)} €/km</strong>
                  &nbsp;·&nbsp;
                  <strong>{fmtEurPL(r.cout_carburant_km * km)}/an</strong>
                </div>

                {hasAdblue && (
                  <>
                    <div className="row2">
                      <NumField label="AdBlue — conso" value={inp.conso_adblue}
                        onChange={v => upd({ conso_adblue: v })}
                        suffix="l/100 km" step={0.1}
                        hint="≈ 4–6 % de la consommation diesel en volume" />
                      <NumField label="AdBlue — prix HT" value={inp.prix_adblue}
                        onChange={v => upd({ prix_adblue: v })} suffix="€/l" step={0.05} />
                    </div>
                    <div className="note-inline">
                      Coût AdBlue :&nbsp;
                      <strong>{fmtEurPL(r.cout_adblue_km * km)}/an</strong>
                    </div>
                  </>
                )}

                <div className="row2">
                  <NumField label="Maintenance préventive" value={inp.cout_maint_prev}
                    onChange={v => upd({ cout_maint_prev: v })} suffix="€/km" step={0.005} />
                  <NumField label="Maintenance corrective" value={inp.cout_maint_correctif}
                    onChange={v => upd({ cout_maint_correctif: v })} suffix="€/km" step={0.005} />
                </div>
                <div className="row2">
                  <NumField label="Pneumatiques" value={inp.cout_pneus}
                    onChange={v => upd({ cout_pneus: v })} suffix="€/km" step={0.005}
                    hint="Direction + moteur + suiveurs ; inclure le rechapage" />
                  <NumField label="Péages & taxes kilométriques" value={inp.peages_km}
                    onChange={v => upd({ peages_km: v })} suffix="€/km" step={0.01}
                    hint="LKW-Maut DE : 0,19–0,30 €/km · Viapass BE : 0,09–0,16 €/km" />
                </div>
                <div className="row2">
                  <NumField label="Conducteur — HS & indemnités" value={inp.conducteur_variable}
                    onChange={v => upd({ conducteur_variable: v })} suffix="€/km" step={0.005} />
                  <NumField label="Divers (lavage, route…)" value={inp.autres_variables}
                    onChange={v => upd({ autres_variables: v })} suffix="€/km" step={0.005} />
                </div>
              </div>
            </details>

            {/* ═══ Panel 5 : Facteurs avancés ═══ */}
            <details className="card">
              <summary className="card-h card-summary">
                <h2>⚙ Facteur de disponibilité (downtime)</h2>
              </summary>
              <div className="card-b">
                <NumField label="Taux de disponibilité opérationnelle" value={inp.taux_disponibilite * 100}
                  onChange={v => upd({ taux_disponibilite: Math.min(1, Math.max(0.01, v / 100)) })}
                  suffix="%" min={80} max={100} step={0.5}
                  hint="Cible flotte performante ≥ 95 % · 8–18 jours d'immobilisation/an en moyenne (Euro VI bien entretenu)" />
                <div className="note-inline" style={{ marginTop: 8 }}>
                  Avec {(inp.taux_disponibilite * 100).toFixed(1)} % de disponibilité,
                  le TCO réel est majoré de&nbsp;
                  <strong>+{((1 / inp.taux_disponibilite - 1) * 100).toFixed(1)} %</strong>
                  &nbsp;pour couvrir le coût des immobilisations (location substitut : 300–600 €/jour).
                </div>
              </div>
            </details>
          </div>

          {/* ── RESULTS COLUMN ──────────────────────────────────────── */}
          <div className="tpl-results">
            <div className="results-sticky">

              {/* KPI cards */}
              <div className="res-kpis">
                <div className="res-kpi primary">
                  <div className="res-kpi-label">TCO total</div>
                  <div className="res-kpi-value">
                    {r.tco_nominal_km.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €/km
                  </div>
                  <div className="res-kpi-sub">{fmtEurPL(r.tco_nominal_annuel)} / an</div>
                </div>
                <div className={`res-kpi${inp.taux_disponibilite < 1 ? '' : ''}`}>
                  <div className="res-kpi-label">Corrigé downtime</div>
                  <div className="res-kpi-value">
                    {r.tco_corrige_km.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €/km
                  </div>
                  <div className="res-kpi-sub">
                    {fmtEurPL(r.tco_corrige_annuel)} / an
                    &nbsp;· ÷&nbsp;{inp.taux_disponibilite.toFixed(2)}
                  </div>
                </div>
              </div>

              {/* Breakdown bar */}
              <div>
                <div className="flabel" style={{ marginBottom: 4 }}>Répartition du TCO</div>
                <div className="brkbar">
                  {cats.map(c => (
                    <div key={c.label} className="brkbar-seg"
                      style={{ width: `${total > 0 ? (c.val / total * 100) : 0}%`, background: c.color }}
                      title={`${c.label} : ${fmtEurPL(c.val)} (${pct(c.val)} %)`} />
                  ))}
                </div>
                <div className="brklegend">
                  {cats.map(c => (
                    <div key={c.label} className="brkleg-item">
                      <span className="brkleg-dot" style={{ background: c.color }} />
                      <span className="brkleg-label">{c.label}</span>
                      <span className="brkleg-pct">{pct(c.val)} %</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Detail table */}
              <div style={{ marginTop: 20 }}>
                <div className="flabel" style={{ marginBottom: 4 }}>Détail annuel</div>
                <table className="detail-table">
                  <thead>
                    <tr>
                      <th>Poste</th>
                      <th style={{ textAlign: 'right' }}>€ / an</th>
                      <th style={{ textAlign: 'right' }}>€ / km</th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* Capital */}
                    <tr className="tr-section"><td colSpan={3}>Capital & financement</td></tr>
                    {(isCB || isLLD) ? (
                      <tr>
                        <td>Loyer {isLLD ? 'LLD' : 'crédit-bail'} net</td>
                        <td>{fmtEurPL(r.cout_financement_annuel)}</td>
                        <td>{(r.cout_financement_annuel / km).toFixed(3)}</td>
                      </tr>
                    ) : (
                      <>
                        <tr>
                          <td>Amortissement</td>
                          <td>{fmtEurPL(r.amortissement_annuel)}</td>
                          <td>{(r.amortissement_annuel / km).toFixed(3)}</td>
                        </tr>
                        {r.cout_financement_annuel > 1 && (
                          <tr>
                            <td>Intérêts crédit</td>
                            <td>{fmtEurPL(r.cout_financement_annuel)}</td>
                            <td>{(r.cout_financement_annuel / km).toFixed(3)}</td>
                          </tr>
                        )}
                      </>
                    )}

                    {/* Énergie */}
                    <tr className="tr-section"><td colSpan={3}>Énergie</td></tr>
                    <tr>
                      <td>Carburant / Énergie</td>
                      <td>{fmtEurPL(r.cout_carburant_km * km)}</td>
                      <td>{r.cout_carburant_km.toFixed(4)}</td>
                    </tr>
                    {r.cout_adblue_km > 0 && (
                      <tr>
                        <td>AdBlue</td>
                        <td>{fmtEurPL(r.cout_adblue_km * km)}</td>
                        <td>{r.cout_adblue_km.toFixed(4)}</td>
                      </tr>
                    )}

                    {/* Entretien */}
                    <tr className="tr-section"><td colSpan={3}>Entretien</td></tr>
                    <tr>
                      <td>Maintenance</td>
                      <td>{fmtEurPL(r.cout_maint_km * km)}</td>
                      <td>{r.cout_maint_km.toFixed(3)}</td>
                    </tr>
                    <tr>
                      <td>Pneumatiques</td>
                      <td>{fmtEurPL(r.cout_pneus_km * km)}</td>
                      <td>{r.cout_pneus_km.toFixed(3)}</td>
                    </tr>

                    {/* Conducteur */}
                    <tr className="tr-section"><td colSpan={3}>Conducteur</td></tr>
                    <tr>
                      <td>Salaire + charges</td>
                      <td>{fmtEurPL(r.cout_conducteur_fixe)}</td>
                      <td>{(r.cout_conducteur_fixe / km).toFixed(3)}</td>
                    </tr>
                    <tr>
                      <td>Indemnités & HS</td>
                      <td>{fmtEurPL(r.cout_conducteur_var_km * km)}</td>
                      <td>{r.cout_conducteur_var_km.toFixed(3)}</td>
                    </tr>

                    {/* Péages */}
                    <tr className="tr-section"><td colSpan={3}>Péages & taxes km</td></tr>
                    <tr>
                      <td>Péages autoroutes</td>
                      <td>{fmtEurPL(r.cout_peages_km * km)}</td>
                      <td>{r.cout_peages_km.toFixed(3)}</td>
                    </tr>
                    <tr>
                      <td>Taxe essieu + vignette</td>
                      <td>{fmtEurPL(r.taxes_annuelles)}</td>
                      <td>{(r.taxes_annuelles / km).toFixed(3)}</td>
                    </tr>

                    {/* Assurance & admin */}
                    <tr className="tr-section"><td colSpan={3}>Assurance & administration</td></tr>
                    <tr>
                      <td>Assurances</td>
                      <td>{fmtEurPL(r.assurance_annuelle)}</td>
                      <td>{(r.assurance_annuelle / km).toFixed(3)}</td>
                    </tr>
                    <tr>
                      <td>CT + télémat + généraux</td>
                      <td>{fmtEurPL(r.frais_generaux_annuels)}</td>
                      <td>{(r.frais_generaux_annuels / km).toFixed(3)}</td>
                    </tr>
                    {r.infra_recharge_annuel > 0 && (
                      <tr>
                        <td>Infrastructure recharge</td>
                        <td>{fmtEurPL(r.infra_recharge_annuel)}</td>
                        <td>{(r.infra_recharge_annuel / km).toFixed(3)}</td>
                      </tr>
                    )}
                    <tr>
                      <td>Divers</td>
                      <td>{fmtEurPL(r.cout_autres_km * km)}</td>
                      <td>{r.cout_autres_km.toFixed(3)}</td>
                    </tr>

                    {/* Totals */}
                    <tr className="tr-total">
                      <td>TCO NOMINAL</td>
                      <td>{fmtEurPL(r.tco_nominal_annuel)}</td>
                      <td>{r.tco_nominal_km.toFixed(3)} €</td>
                    </tr>
                    {inp.taux_disponibilite < 0.999 && (
                      <tr className="tr-total tr-corrige">
                        <td>TCO CORRIGÉ (÷ {inp.taux_disponibilite.toFixed(2)})</td>
                        <td>{fmtEurPL(r.tco_corrige_annuel)}</td>
                        <td>{r.tco_corrige_km.toFixed(3)} €</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Source note */}
              <p style={{ marginTop: 16, fontSize: '0.75rem', color: 'var(--text-faint)', lineHeight: 1.5 }}>
                Sources : IRU 2024 · ACEA · IFPEN · Argus du Transporteur · constructeurs (Volvo, DAF, MAN, Mercedes, Traton).
                Révision recommandée annuellement pour les postes carburant et péages.
              </p>
            </div>
          </div>

        </div>{/* /tpl-grid */}
      </div>{/* /wrap */}
    </div>
  )
}
