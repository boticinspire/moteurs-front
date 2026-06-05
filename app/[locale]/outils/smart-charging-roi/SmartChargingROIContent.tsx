'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Link } from '@/i18n/navigation'
import { useUserContext } from '@/context/UserContextProvider'

// ─── TYPES ───────────────────────────────────────────────────────────────────
type VehicleId = 'ioniq6' | 'model3' | 'e208' | 'megane' | 'zoe' | 'id4' | 'ix3' | 'custom'
type ProfileId = 'nuit' | 'solaire' | 'mix' | 'public' | 'custom'

interface State {
  vehicleId: VehicleId
  customConso: number
  km: number
  profileId: ProfileId
  pSolar: number
  pHC: number
  pHP: number
  pPublic: number
  hasSolar: boolean
  hasSmart: boolean
}

// ─── STATIC DATA ─────────────────────────────────────────────────────────────
const VEHICLES: { id: VehicleId; label: string; conso: number }[] = [
  { id: 'ioniq6',  label: 'Hyundai IONIQ 6',              conso: 13 },
  { id: 'model3',  label: 'Tesla Model 3 SR+',             conso: 14 },
  { id: 'e208',    label: 'Peugeot e-208 / DS 3 E-Tense',  conso: 14 },
  { id: 'megane',  label: 'Renault Mégane E-Tech',          conso: 15 },
  { id: 'zoe',     label: 'Renault Zoé R135',               conso: 16 },
  { id: 'id4',     label: 'VW ID.4 / ID.5 Pro',             conso: 17 },
  { id: 'ix3',     label: 'BMW iX3 / BMW iX',               conso: 18 },
  { id: 'custom',  label: 'Autre véhicule (saisie manuelle)', conso: 16 },
]

const KM_OPTS = [
  { v: 5000,  label: '< 5 000 km/an',        desc: 'Usage occasionnel ou 2e véhicule' },
  { v: 10000, label: '5 000 – 10 000 km/an', desc: 'Usage modéré — semaine + weekend' },
  { v: 15000, label: '10 000 – 20 000 km/an', desc: 'Usage quotidien standard' },
  { v: 25000, label: '20 000 – 30 000 km/an', desc: 'Fort kilométrage' },
  { v: 35000, label: '> 30 000 km/an',        desc: 'Usage intensif / professionnel' },
]

const PROFILES: {
  id: ProfileId; icon: string; label: string; desc: string
  pSolar: number; pHC: number; pHP: number; pPublic: number
}[] = [
  { id: 'nuit',    icon: '🌙', label: 'Recharge nocturne (HC)',      desc: 'Borne chez soi, programmation nuit — pas de solaire.',       pSolar: 0,  pHC: 80, pHP: 15, pPublic: 5  },
  { id: 'solaire', icon: '☀️', label: 'Avec panneaux solaires',       desc: 'Recharge le jour couplée à la production PV.',               pSolar: 30, pHC: 35, pHP: 25, pPublic: 10 },
  { id: 'mix',     icon: '⚖️', label: 'Mix équilibré',                desc: 'Un peu de tout — profil standard.',                          pSolar: 15, pHC: 50, pHP: 25, pPublic: 10 },
  { id: 'public',  icon: '🏙️', label: 'Beaucoup en public',           desc: 'Fréquentation régulière des bornes publiques.',              pSolar: 5,  pHC: 25, pHP: 25, pPublic: 45 },
  { id: 'custom',  icon: '✏️', label: 'Personnalisé',                 desc: 'Saisissez vos pourcentages réels.',                          pSolar: 20, pHC: 50, pHP: 20, pPublic: 10 },
]

// Tariffs €/kWh — marché belge référence
const T = { solar: 0.08, hc: 0.11, hp: 0.26, public: 0.48, dynamic: 0.07 }

const N_STEPS = 4
const fmt = (n: number, dec = 0) =>
  n.toLocaleString('fr-BE', { minimumFractionDigits: dec, maximumFractionDigits: dec })

function calcCost(kwhYear: number, pS: number, pH: number, pP: number, pU: number) {
  const tot = pS + pH + pP + pU || 100
  const n = (p: number) => (p / tot) * kwhYear
  const solar = n(pS) * T.solar
  const hc    = n(pH) * T.hc
  const hp    = n(pP) * T.hp
  const pub   = n(pU) * T.public
  return { solar, hc, hp, pub, total: solar + hc + hp + pub }
}

// ─── CSS ─────────────────────────────────────────────────────────────────────
const TOOL_CSS = `
.m-tool{--bg:var(--color-bg);--surface:var(--color-bg-card);--surface-2:var(--color-bg-alt);--text:var(--color-text);--text-soft:var(--color-text-muted,#4a5b70);--text-faint:var(--color-text-muted);--line:var(--color-border);--line2:rgba(128,128,128,.10);--accent:var(--color-primary);--accent-deep:var(--color-primary-dark);--accent-soft:rgba(239,108,26,.14);--warn:#b0510c;--warn-soft:rgba(176,81,12,.12);--green:#16a34a;--green-soft:rgba(22,163,74,.12);--shadow:0 1px 2px rgba(16,24,43,.05),0 14px 34px -16px rgba(16,24,43,.2);--font-d:Georgia,"Times New Roman",serif;background:var(--bg);color:var(--text);font-size:16px;line-height:1.55;-webkit-font-smoothing:antialiased}
html[data-theme="dark"] .m-tool{--green:#4ade80;--green-soft:rgba(74,222,128,.12);--warn:#f2a65a;--warn-soft:rgba(242,166,90,.15);--line2:rgba(255,255,255,.05);--shadow:0 1px 2px rgba(0,0,0,.4),0 18px 40px -18px rgba(0,0,0,.6)}
.m-tool *{box-sizing:border-box;margin:0;padding:0}
.m-tool .wrap{max-width:820px;margin:0 auto;padding:26px 22px 70px}
.m-tool .crumb{font-size:.82rem;color:var(--text-faint);margin-bottom:18px}
.m-tool .crumb a{color:var(--text-soft);text-decoration:none}.m-tool .crumb a:hover{color:var(--accent)}
.m-tool .crumb span{margin:0 7px;opacity:.5}
.m-tool .head{border-bottom:1px solid var(--line);padding-bottom:22px;margin-bottom:28px}
.m-tool .meta-row{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:14px}
.m-tool .chip{font-size:.74rem;font-weight:700;letter-spacing:.04em;text-transform:uppercase;padding:5px 11px;border-radius:999px;background:var(--surface-2);border:1px solid var(--line);color:var(--text-soft)}
.m-tool .chip-acc{color:var(--accent)}
.m-tool h1{font-family:var(--font-d);font-weight:600;font-size:clamp(1.8rem,4.2vw,2.6rem);line-height:1.1;letter-spacing:-.01em;max-width:30ch;margin-bottom:.3em}
.m-tool .lede{color:var(--text-soft);max-width:66ch;font-size:1.02rem}
.m-tool .card{background:var(--surface);border:1px solid var(--line);border-radius:16px;box-shadow:var(--shadow);padding:26px;margin-bottom:20px}
.m-tool .progress{display:flex;gap:5px;margin-bottom:8px}
.m-tool .ps{flex:1;height:5px;border-radius:3px;background:var(--line);transition:background .25s}
.m-tool .ps.done{background:var(--accent)}.m-tool .ps.active{background:var(--accent);opacity:.5}
.m-tool .step-ctr{font-size:.8rem;color:var(--text-soft);font-weight:600;margin-bottom:20px}
.m-tool .step-q{font-family:var(--font-d);font-size:clamp(1.18rem,3vw,1.42rem);font-weight:600;line-height:1.3;margin-bottom:6px}
.m-tool .step-hint{font-size:.87rem;color:var(--text-soft);margin-bottom:22px;line-height:1.55;max-width:64ch}
.m-tool .opts{display:grid;grid-template-columns:1fr;gap:10px;margin-bottom:28px}
@media(min-width:540px){.m-tool .opts.col2{grid-template-columns:1fr 1fr}}
.m-tool .opt{display:flex;align-items:flex-start;gap:13px;padding:14px 16px;border:1.5px solid var(--line);border-radius:12px;cursor:pointer;background:var(--surface-2);transition:border-color .15s,background .15s;text-align:left;width:100%;font:inherit}
.m-tool .opt:hover{border-color:var(--accent);background:var(--accent-soft)}
.m-tool .opt.sel{border-color:var(--accent-deep);background:var(--accent-soft)}
.m-tool .oi{font-size:1.45rem;flex-shrink:0;line-height:1.1;margin-top:1px}
.m-tool .ot{display:block;font-weight:700;font-size:.95rem;color:var(--text)}
.m-tool .od{display:block;font-size:.8rem;color:var(--text-soft);margin-top:3px;line-height:1.4}
.m-tool .opt.sel .ot{color:var(--accent-deep)}
.m-tool .wnav{display:flex;gap:12px;flex-wrap:wrap}
.m-tool .btn-p{padding:12px 28px;background:var(--accent);color:#fff;border:none;border-radius:10px;font:inherit;font-weight:700;font-size:.95rem;cursor:pointer;transition:background .15s}
.m-tool .btn-p:hover{background:var(--accent-deep)}
.m-tool .btn-g{padding:12px 20px;background:transparent;color:var(--text-soft);border:1.5px solid var(--line);border-radius:10px;font:inherit;font-weight:600;font-size:.95rem;cursor:pointer;transition:all .15s}
.m-tool .btn-g:hover{border-color:var(--text-soft);color:var(--text)}
.m-tool .rc{background:var(--surface);border:1px solid var(--line);border-radius:16px;box-shadow:var(--shadow);padding:22px 24px;margin-bottom:18px}
.m-tool .rh{font-family:var(--font-d);font-size:1.08rem;font-weight:600;margin-bottom:14px;display:flex;align-items:center;gap:9px}
.m-tool .rn{display:inline-flex;width:24px;height:24px;border-radius:50%;background:var(--accent);color:#fff;font-size:.7rem;font-weight:800;align-items:center;justify-content:center;flex-shrink:0}
.m-tool .kpi{display:grid;grid-template-columns:repeat(auto-fit,minmax(155px,1fr));gap:12px;margin-bottom:16px}
.m-tool .kpi-item{background:var(--surface-2);border:1px solid var(--line);border-radius:12px;padding:14px 16px;text-align:center}
.m-tool .kpi-val{font-family:var(--font-d);font-size:1.65rem;font-weight:700;color:var(--accent-deep);line-height:1.1}
.m-tool .kpi-lbl{font-size:.78rem;color:var(--text-soft);margin-top:4px}
.m-tool .kpi-item.green .kpi-val{color:var(--green)}
.m-tool .btab{width:100%;border-collapse:collapse;font-size:.88rem}
.m-tool .btab th{text-align:left;padding:8px 10px;font-size:.72rem;text-transform:uppercase;letter-spacing:.04em;color:var(--text-soft);border-bottom:1.5px solid var(--line);font-weight:700}
.m-tool .btab th.r{text-align:right}
.m-tool .btab td{padding:9px 10px;border-bottom:1px solid var(--line2);vertical-align:middle}
.m-tool .btab td.r{text-align:right;font-variant-numeric:tabular-nums;font-weight:600;white-space:nowrap}
.m-tool .btab tr.tot td{border-top:2px solid var(--text);border-bottom:none;font-weight:700;padding-top:12px}
.m-tool .srow{display:flex;align-items:center;justify-content:space-between;padding:10px 14px;border-radius:10px;background:var(--green-soft);border:1px solid rgba(22,163,74,.2);margin-bottom:8px;font-size:.9rem}
.m-tool .sval{font-weight:700;color:var(--green);font-size:1.05rem}
.m-tool .abox{border-radius:11px;padding:14px 16px;margin-bottom:11px;border:1px solid}
.m-tool .abox.warn{background:var(--warn-soft);border-color:rgba(176,81,12,.28)}
.m-tool .abox.info{background:var(--surface-2);border-color:var(--line)}
.m-tool .at{font-weight:700;font-size:.88rem;margin-bottom:6px;display:flex;align-items:baseline;gap:6px}
.m-tool .ab{font-size:.83rem;color:var(--text-soft);line-height:1.55}
.m-tool .pb-bar{height:10px;border-radius:5px;background:var(--line);margin:14px 0 6px;overflow:hidden}
.m-tool .pb-fill{height:100%;border-radius:5px;background:var(--green);transition:width .6s ease}
.m-tool .disc{margin-top:26px;background:var(--warn-soft);border:1px solid var(--line);border-radius:13px;padding:15px 17px;font-size:.82rem;line-height:1.5}
.m-tool .disc b{color:var(--warn)}
.m-tool .restart{display:inline-flex;align-items:center;gap:6px;padding:10px 18px;background:var(--surface-2);border:1.5px solid var(--line);border-radius:10px;font:inherit;font-size:.9rem;font-weight:600;cursor:pointer;color:var(--text-soft);transition:all .15s;margin-top:14px}
.m-tool .restart:hover{border-color:var(--accent);color:var(--accent)}
.m-tool .pct-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:10px}
@media(max-width:480px){.m-tool .pct-grid{grid-template-columns:1fr}}
.m-tool .pct-item label{display:flex;justify-content:space-between;font-size:.85rem;font-weight:600;margin-bottom:5px;color:var(--text-soft)}
.m-tool .pct-item label span{color:var(--accent-deep);font-variant-numeric:tabular-nums}
.m-tool .pct-item input[type=range]{width:100%;accent-color:var(--accent)}
.m-tool .pct-sum{text-align:center;font-size:.82rem;padding:8px 12px;border-radius:8px;background:var(--surface-2);margin-bottom:18px}
.m-tool .pct-sum.ok{color:var(--green)}.m-tool .pct-sum.bad{color:#dc2626}
.m-tool .conso-inp{display:flex;align-items:center;gap:10px;padding:10px 14px;border:1.5px solid var(--line);border-radius:10px;background:var(--surface-2);margin-bottom:20px}
.m-tool .conso-inp input{width:72px;border:none;background:transparent;font:inherit;font-size:1.1rem;font-weight:700;color:var(--accent-deep);text-align:right;outline:none}
.m-tool .hint-box{font-size:.83rem;color:var(--text-soft);padding:10px 14px;border-radius:10px;background:var(--surface-2);border:1px solid var(--line);margin-bottom:18px;line-height:1.55}
`

// ─── MAIN EXPORT ─────────────────────────────────────────────────────────────
export default function SmartChargingROIContent() {
  const { isReady, isBootstrapped, userId } = useUserContext()
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])

  if (!mounted || !isReady) return <div style={{ minHeight: '60vh' }} />
  if (!isBootstrapped) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
        <div style={{ width: 36, height: 36, borderRadius: '50%', border: '3px solid var(--color-border)', borderTopColor: 'var(--color-primary)', animation: 'spin .7s linear infinite' }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        <span style={{ color: 'var(--color-text-muted)', fontSize: '.88rem' }}>Chargement…</span>
      </div>
    )
  }

  if (!userId) {
    return (
      <section style={{ maxWidth: 560, margin: '0 auto', padding: '64px 22px', textAlign: 'center' }}>
        <div style={{ fontSize: '2.6rem', marginBottom: 14 }}>🔒</div>
        <h1 style={{ fontSize: '1.6rem', fontWeight: 700, marginBottom: 12, color: 'var(--color-text)' }}>
          Outil réservé aux membres Moteurs.com
        </h1>
        <p style={{ color: 'var(--color-text-muted)', lineHeight: 1.6, marginBottom: 26 }}>
          Gratuit et sans publicité. Créez un compte en 30 secondes — aucune carte bancaire.
        </p>
        <Link
          href="/espace-membres"
          style={{ display: 'inline-block', background: 'var(--color-primary)', color: '#fff', fontWeight: 700, padding: '12px 26px', borderRadius: 10, textDecoration: 'none' }}
        >
          Accéder / Créer un compte
        </Link>
        <div style={{ marginTop: 18 }}>
          <Link href="/outils" style={{ color: 'var(--color-text-muted)', fontSize: '.88rem' }}>← Retour aux outils</Link>
        </div>
      </section>
    )
  }

  return (
    <div className="m-tool">
      <style dangerouslySetInnerHTML={{ __html: TOOL_CSS }} />
      <div className="wrap">
        <nav className="crumb" aria-label="Fil d'Ariane">
          <a href="/">Accueil</a><span>›</span>
          <a href="/outils">Outils</a><span>›</span>
          Rentabilité borne — Smart Charging
        </nav>
        <header className="head">
          <div className="meta-row">
            <span className="chip">☀️ Smart Charging</span>
            <span className="chip chip-acc">ROI & Tarifs Dynamiques</span>
            <span className="chip">🇧🇪 Marché belge</span>
          </div>
          <h1>Retour sur investissement borne — Solaire & tarifs dynamiques</h1>
          <p className="lede">
            Simulez en 4 étapes l'économie réelle du Smart Charging : autoconsommation solaire optimisée,
            tarifs spot Belpex, coût au kilomètre réel et temps de retour sur investissement.
          </p>
        </header>
        <Suspense fallback={<div style={{ minHeight: 200 }} />}>
          <WizardWithParams />
        </Suspense>
      </div>
    </div>
  )
}

// ─── WIZARD (needs Suspense for useSearchParams) ──────────────────────────────
function WizardWithParams() {
  const params = useSearchParams()
  const coutTvac = parseInt(params.get('cout') || '0', 10)

  const [step, setStep] = useState(0)
  const [state, setState] = useState<State>({
    vehicleId: 'model3',
    customConso: 16,
    km: 15000,
    profileId: 'mix',
    pSolar: 15, pHC: 50, pHP: 25, pPublic: 10,
    hasSolar: false,
    hasSmart: false,
  })

  function set<K extends keyof State>(k: K, v: State[K]) {
    setState(prev => ({ ...prev, [k]: v }))
  }

  function applyProfile(id: ProfileId) {
    const p = PROFILES.find(x => x.id === id)!
    if (id !== 'custom') {
      setState(prev => ({ ...prev, profileId: id, pSolar: p.pSolar, pHC: p.pHC, pHP: p.pHP, pPublic: p.pPublic }))
    } else {
      setState(prev => ({ ...prev, profileId: 'custom' }))
    }
  }

  if (step >= N_STEPS) return <ROIResults state={state} coutTvac={coutTvac} onRestart={() => setStep(0)} />

  const segs = Array.from({ length: N_STEPS }, (_, i) => i < step ? 'done' : i === step ? 'active' : '')
  const labels = ['Véhicule électrique', 'Kilométrage annuel', 'Profil de recharge', 'Équipement actuel']

  return (
    <div className="card">
      <div className="progress" aria-label="Progression">
        {segs.map((c, i) => <div key={i} className={`ps ${c}`} />)}
      </div>
      <div className="step-ctr">Étape {step + 1} / {N_STEPS} — {labels[step]}</div>

      {step === 0 && (
        <>
          <div className="step-q">Quel est votre véhicule électrique ?</div>
          <div className="step-hint">Sélectionnez votre modèle pour utiliser sa consommation WLTP mixte.</div>
          <div className="opts">
            {VEHICLES.map(v => (
              <button key={v.id} type="button" className={`opt${state.vehicleId === v.id ? ' sel' : ''}`}
                onClick={() => set('vehicleId', v.id)}>
                <span className="oi">🚗</span>
                <span>
                  <span className="ot">{v.label}</span>
                  <span className="od">{v.id !== 'custom' ? `${v.conso} kWh / 100 km (WLTP mixte)` : 'Je saisis ma consommation réelle'}</span>
                </span>
              </button>
            ))}
          </div>
          {state.vehicleId === 'custom' && (
            <div className="conso-inp">
              <span>Consommation :</span>
              <input type="number" min={8} max={30} step={0.5} value={state.customConso}
                onChange={e => set('customConso', parseFloat(e.target.value) || 16)} />
              <span>kWh / 100 km</span>
            </div>
          )}
        </>
      )}

      {step === 1 && (
        <>
          <div className="step-q">Combien de kilomètres faites-vous par an ?</div>
          <div className="step-hint">Incluez tous les trajets — domicile/travail, vacances, déplacements occasionnels.</div>
          <div className="opts">
            {KM_OPTS.map(o => (
              <button key={o.v} type="button" className={`opt${state.km === o.v ? ' sel' : ''}`}
                onClick={() => set('km', o.v)}>
                <span className="oi">📍</span>
                <span><span className="ot">{o.label}</span><span className="od">{o.desc}</span></span>
              </button>
            ))}
          </div>
        </>
      )}

      {step === 2 && (
        <>
          <div className="step-q">Quel est votre profil de recharge actuel ?</div>
          <div className="step-hint">Estimez comment vous répartissez vos recharges en moyenne sur l'année.</div>
          <div className="opts">
            {PROFILES.map(p => (
              <button key={p.id} type="button" className={`opt${state.profileId === p.id ? ' sel' : ''}`}
                onClick={() => applyProfile(p.id)}>
                <span className="oi">{p.icon}</span>
                <span>
                  <span className="ot">{p.label}</span>
                  <span className="od">
                    {p.desc}
                    {p.id !== 'custom' && ` — Solaire ${p.pSolar} % · HC ${p.pHC} % · HP ${p.pHP} % · Public ${p.pPublic} %`}
                  </span>
                </span>
              </button>
            ))}
          </div>
          {state.profileId === 'custom' && (
            <>
              <div className="pct-grid">
                {([
                  { k: 'pSolar'  as const, icon: '☀️', label: 'Solaire (autoconsommation)' },
                  { k: 'pHC'     as const, icon: '🌙', label: 'Heures Creuses (nuit)' },
                  { k: 'pHP'     as const, icon: '⚡', label: 'Heures Pleines (jour)' },
                  { k: 'pPublic' as const, icon: '🏙️', label: 'Bornes publiques (AC/DC)' },
                ]).map(({ k, icon, label }) => (
                  <div key={k} className="pct-item">
                    <label>
                      {icon} {label}
                      <span>{state[k]} %</span>
                    </label>
                    <input type="range" min={0} max={100} value={state[k]}
                      onChange={e => set(k, parseInt(e.target.value))} />
                  </div>
                ))}
              </div>
              {(() => {
                const s = state.pSolar + state.pHC + state.pHP + state.pPublic
                return (
                  <div className={`pct-sum ${s === 100 ? 'ok' : 'bad'}`}>
                    Total : {s} %
                    {s === 100 ? ' ✓ parfait' : ` — ajustez pour atteindre 100 % (${s > 100 ? '+' : ''}${s - 100} %)`}
                  </div>
                )
              })()}
            </>
          )}
        </>
      )}

      {step === 3 && (
        <>
          <div className="step-q">Quel équipement avez-vous actuellement ?</div>
          <div className="step-hint">Sélectionnez tout ce qui s'applique — vous pouvez cocher les deux.</div>
          <div className="opts">
            <button type="button" className={`opt${state.hasSolar ? ' sel' : ''}`}
              onClick={() => set('hasSolar', !state.hasSolar)}>
              <span className="oi">{state.hasSolar ? '✅' : '☀️'}</span>
              <span>
                <span className="ot">Panneaux solaires (PV) installés</span>
                <span className="od">Toiture ou carport solaire avec onduleur connecté au réseau domestique.</span>
              </span>
            </button>
            <button type="button" className={`opt${state.hasSmart ? ' sel' : ''}`}
              onClick={() => set('hasSmart', !state.hasSmart)}>
              <span className="oi">{state.hasSmart ? '✅' : '📱'}</span>
              <span>
                <span className="ot">Borne connectée / intelligente déjà installée (OCPP)</span>
                <span className="od">Borne avec app, programmation HC et/ou délestage dynamique.</span>
              </span>
            </button>
          </div>
          {coutTvac > 0 && (
            <div className="hint-box">
              💡 Votre investissement de <strong>{fmt(coutTvac)} € TVAC</strong> estimé dans le Simulateur borne
              est pris en compte pour le calcul du temps de retour total.
            </div>
          )}
        </>
      )}

      <div className="wnav">
        {step > 0 && (
          <button type="button" className="btn-g" onClick={() => setStep(s => s - 1)}>← Retour</button>
        )}
        <button type="button" className="btn-p" onClick={() => setStep(s => s + 1)}>
          {step === N_STEPS - 1 ? 'Voir mon analyse →' : 'Suivant →'}
        </button>
      </div>
    </div>
  )
}

// ─── RESULTS ─────────────────────────────────────────────────────────────────
function ROIResults({ state, coutTvac, onRestart }: { state: State; coutTvac: number; onRestart: () => void }) {
  const vehicle = state.vehicleId === 'custom'
    ? { label: 'Véhicule personnalisé', conso: state.customConso }
    : VEHICLES.find(v => v.id === state.vehicleId)!
  const conso = vehicle.conso
  const kwhYear = (conso / 100) * state.km

  // Normalize profile to 100 %
  const rawTot = state.pSolar + state.pHC + state.pHP + state.pPublic || 100
  const pS = state.pSolar / rawTot * 100
  const pH = state.pHC   / rawTot * 100
  const pP = state.pHP   / rawTot * 100
  const pU = state.pPublic / rawTot * 100

  // Current cost
  const curr = calcCost(kwhYear, pS, pH, pP, pU)
  const costPer100 = (curr.total / state.km) * 100

  // Optimised — step 1: solar +15 % (shift from HP, then HC)
  const boost = Math.min(15, pP + pH) // can't exceed remaining
  const pSopt = Math.min(100, pS + boost)
  const pPopt = Math.max(0, pP - boost)
  const pHopt = pH
  const pUopt = pU

  // Optimised — step 2: 40 % of HC shifted to dynamic spot
  const kwhHC = kwhYear * (pHopt / 100)
  const dynamicSaving = kwhHC * 0.40 * (T.hc - T.dynamic)

  const opt = calcCost(kwhYear, pSopt, pHopt, pPopt, pUopt)
  const optTotal = opt.total - dynamicSaving

  const saving     = Math.max(0, curr.total - optTotal)
  const saving5y   = saving * 5
  const costPer100opt = (optTotal / state.km) * 100

  // Payback — smart charger premium (basique → smart ≈ 250 € extra)
  const smartPremium = state.hasSmart ? 0 : 250
  const paybackSmart = saving > 0 ? smartPremium / saving : 0
  const investTotal  = coutTvac > 0 ? coutTvac : (state.hasSmart ? 900 : 700)
  const paybackTotal = saving > 0 ? investTotal / saving : 0

  return (
    <>
      {/* ── 1. Diagnostic ───────────────────────────────────────────────── */}
      <div className="rc">
        <div className="rh"><span className="rn">1</span>Diagnostic — Votre coût de recharge actuel</div>
        <div className="kpi">
          <div className="kpi-item">
            <div className="kpi-val">{fmt(curr.total, 0)} €</div>
            <div className="kpi-lbl">Coût annuel total de recharge</div>
          </div>
          <div className="kpi-item">
            <div className="kpi-val">{fmt(costPer100, 2)} €</div>
            <div className="kpi-lbl">Coût réel / 100 km</div>
          </div>
          <div className="kpi-item">
            <div className="kpi-val">{fmt(kwhYear, 0)} kWh</div>
            <div className="kpi-lbl">Consommation annuelle</div>
          </div>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table className="btab">
            <thead>
              <tr>
                <th>Source de recharge</th>
                <th className="r">Part</th>
                <th className="r">Tarif</th>
                <th className="r">Coût / an</th>
              </tr>
            </thead>
            <tbody>
              {[
                { label: '☀️ Solaire (autoconsommation)', pct: pS, tariff: T.solar,  cost: curr.solar },
                { label: '🌙 Heures Creuses (nuit)',       pct: pH, tariff: T.hc,     cost: curr.hc },
                { label: '⚡ Heures Pleines (jour)',        pct: pP, tariff: T.hp,     cost: curr.hp },
                { label: '🏙️ Bornes publiques (moy.)',    pct: pU, tariff: T.public,  cost: curr.pub },
              ].map(r => (
                <tr key={r.label}>
                  <td>{r.label}</td>
                  <td className="r">{fmt(r.pct, 0)} %</td>
                  <td className="r">{fmt(r.tariff * 100, 0)} ct/kWh</td>
                  <td className="r">{fmt(r.cost, 0)} €</td>
                </tr>
              ))}
              <tr className="tot">
                <td colSpan={3}><strong>Total — {vehicle.label} — {fmt(state.km)} km</strong></td>
                <td className="r"><strong>{fmt(curr.total, 0)} €</strong></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* ── 2. Scénario optimisé ────────────────────────────────────────── */}
      <div className="rc">
        <div className="rh"><span className="rn">2</span>Scénario optimisé "Smart Charging"</div>
        <p style={{ fontSize: '.88rem', color: 'var(--text-soft)', marginBottom: 16, lineHeight: 1.55 }}>
          Deux leviers combinés : <strong>+{fmt(boost, 0)} % d'autoconsommation solaire</strong> via le délestage dynamique,
          et <strong>déplacement de 40 % des charges nocturnes</strong> vers les créneaux les moins chers
          du tarif dynamique (marché Spot / Belpex ≈ {fmt(T.dynamic * 100, 0)} ct/kWh vs {fmt(T.hc * 100, 0)} ct HC).
        </p>

        <div className="srow"><span>💰 Économie nette annuelle</span><span className="sval">− {fmt(saving, 0)} € / an</span></div>
        <div className="srow"><span>📅 Gain cumulé sur 5 ans</span><span className="sval">− {fmt(saving5y, 0)} €</span></div>
        <div className="srow">
          <span>⚡ Nouveau coût au 100 km</span>
          <span className="sval">{fmt(costPer100opt, 2)} € / 100 km{saving > 0 ? ` (−${fmt(costPer100 - costPer100opt, 2)} €)` : ''}</span>
        </div>

        {!state.hasSmart && saving > 0 && (
          <div style={{ marginTop: 18 }}>
            <p style={{ fontSize: '.85rem', fontWeight: 600, marginBottom: 6 }}>
              Rentabilisation du surcoût borne intelligente (≈ {fmt(smartPremium)} €)
            </p>
            <div className="pb-bar">
              <div className="pb-fill"
                style={{ width: `${Math.min(100, paybackSmart > 0 ? Math.max(5, (3 / paybackSmart) * 100) : 100)}%` }} />
            </div>
            <p style={{ fontSize: '.85rem', color: 'var(--text-soft)' }}>
              Retour sur le surcoût Smart Charging :{' '}
              <strong>{paybackSmart < 1 ? '< 1 an' : `${fmt(paybackSmart, 1)} ans`}</strong>
            </p>
          </div>
        )}

        {saving > 0 && (
          <div style={{ marginTop: 16, padding: '14px 16px', borderRadius: 12, background: 'var(--surface-2)', border: '1px solid var(--line)', fontSize: '.88rem' }}>
            <strong>Retour sur investissement total</strong>
            {coutTvac > 0 ? ` (installation ${fmt(coutTvac)} € TVAC)` : ` (estimation installation ${fmt(investTotal)} €)`} :<br />
            <span style={{ color: 'var(--accent-deep)', fontWeight: 700, fontSize: '1.15rem' }}>
              {paybackTotal < 1 ? '< 1 an' : paybackTotal > 30 ? '> 30 ans' : `${fmt(paybackTotal, 1)} ans`}
            </span>
            {paybackTotal > 0 && paybackTotal <= 30 && (
              <span style={{ color: 'var(--text-soft)', marginLeft: 10 }}>
                — soit {fmt((1 / paybackTotal) * 100, 0)} % de rentabilité annuelle sur l'économie d'énergie
              </span>
            )}
          </div>
        )}
      </div>

      {/* ── 3. Alerte capacitaire ───────────────────────────────────────── */}
      <div className="rc">
        <div className="rh"><span className="rn">3</span>Alerte — Tarif capacitaire &amp; pointes de puissance (Belgique)</div>
        {!state.hasSmart ? (
          <>
            <div className="abox warn">
              <div className="at">⚠️ Charge à pleine puissance sans borne intelligente</div>
              <div className="ab">
                En Belgique, les GRD (Fluvius, ORES, Sibelga) appliquent depuis 2023 un <strong>tarif
                capacitaire</strong> basé sur votre pic de puissance mensuel (kVA). Une borne 7,4 kW non
                bridée qui charge simultanément aux autres gros appareils peut faire augmenter votre
                facture réseau de <strong>150 à 400 € / an</strong> selon votre profil de consommation.
              </div>
            </div>
            <div className="abox info">
              <div className="at">💡 Solution : délestage dynamique via le port P1</div>
              <div className="ab">
                Une borne connectée (OCPP) configurée en mode <strong>« délestage P1 »</strong> lit en
                temps réel le compteur intelligent et ajuste sa puissance pour ne jamais dépasser votre
                calibre. Résultat : aucun disjonctage, aucune pointe capacitaire superflue sur votre
                facture réseau.
              </div>
            </div>
          </>
        ) : (
          <div className="abox info">
            <div className="at">✅ Borne intelligente — tarif capacitaire maîtrisé</div>
            <div className="ab">
              Votre borne connectée avec délestage dynamique protège déjà votre pic de puissance.
              Vérifiez que le mode <strong>délestage P1</strong> est bien activé dans l'application
              de votre borne et que votre compteur intelligent est raccordé au port S1/P1.
            </div>
          </div>
        )}
      </div>

      <div className="disc">
        <b>Note méthodologique</b> — Simulation basée sur les tarifs moyens du marché belge (CREG, Belpex
        spot 2025-2026 : solaire 8 ct, HC 11 ct, HP 26 ct, public 48 ct, dynamique 7 ct). Les tarifs
        réels varient selon votre fournisseur et la saisonnalité. Économies indicatives, à valider
        avec votre installateur et fournisseur d'énergie.
      </div>

      <button type="button" className="restart" onClick={onRestart}>↺ Refaire une simulation</button>
    </>
  )
}
