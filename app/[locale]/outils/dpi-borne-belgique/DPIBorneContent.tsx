'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Link } from '@/i18n/navigation'
import { useUserContext } from '@/context/UserContextProvider'

// ─── TYPES ───────────────────────────────────────────────────────────────────
type Statut = 'independant' | 'pme' | 'grande'
type TauxImp = 20 | 25

interface DPIState {
  statut: Statut
  investHTVA: number
  tauxImp: TauxImp
}

// ─── DATA ────────────────────────────────────────────────────────────────────
const DPI: Record<Statut, { rate: number; label: string; totalPct: number }> = {
  independant: { rate: 0.40, label: '40 %', totalPct: 140 },
  pme:         { rate: 0.40, label: '40 %', totalPct: 140 },
  grande:      { rate: 0.30, label: '30 %', totalPct: 130 },
}

const STATUT_LABELS: Record<Statut, string> = {
  independant: 'Indépendant / Profession libérale',
  pme:         'PME / Société de taille restreinte',
  grande:      'Grande entreprise',
}

const N_STEPS = 3
const fmt = (n: number, dec = 0) =>
  n.toLocaleString('fr-BE', { minimumFractionDigits: dec, maximumFractionDigits: dec })

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
.m-tool h1{font-family:var(--font-d);font-weight:600;font-size:clamp(1.8rem,4.2vw,2.6rem);line-height:1.1;letter-spacing:-.01em;max-width:32ch;margin-bottom:.3em}
.m-tool .lede{color:var(--text-soft);max-width:66ch;font-size:1.02rem}
.m-tool .card{background:var(--surface);border:1px solid var(--line);border-radius:16px;box-shadow:var(--shadow);padding:26px;margin-bottom:20px}
.m-tool .progress{display:flex;gap:5px;margin-bottom:8px}
.m-tool .ps{flex:1;height:5px;border-radius:3px;background:var(--line);transition:background .25s}
.m-tool .ps.done{background:var(--accent)}.m-tool .ps.active{background:var(--accent);opacity:.5}
.m-tool .step-ctr{font-size:.8rem;color:var(--text-soft);font-weight:600;margin-bottom:20px}
.m-tool .step-q{font-family:var(--font-d);font-size:clamp(1.18rem,3vw,1.42rem);font-weight:600;line-height:1.3;margin-bottom:6px}
.m-tool .step-hint{font-size:.87rem;color:var(--text-soft);margin-bottom:22px;line-height:1.55;max-width:64ch}
.m-tool .opts{display:grid;grid-template-columns:1fr;gap:10px;margin-bottom:28px}
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
/* DPI table */
.m-tool .dpi-table{width:100%;border-collapse:collapse;font-size:.9rem;margin-bottom:4px}
.m-tool .dpi-table td{padding:11px 14px;border-bottom:1px solid var(--line2);vertical-align:middle}
.m-tool .dpi-table td:first-child{color:var(--text-soft);font-size:.86rem;width:58%}
.m-tool .dpi-table td:last-child{font-weight:700;text-align:right;font-variant-numeric:tabular-nums}
.m-tool .dpi-table tr.hi td{background:var(--green-soft);border-top:2px solid rgba(22,163,74,.25);border-bottom:2px solid rgba(22,163,74,.25)}
.m-tool .dpi-table tr.hi td:first-child{color:var(--text);font-weight:600;font-size:.9rem}
.m-tool .dpi-table tr.hi td:last-child{color:var(--green);font-size:1.15rem}
/* amort blocks */
.m-tool .amort-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin:14px 0}
@media(max-width:440px){.m-tool .amort-grid{grid-template-columns:1fr}}
.m-tool .amort-box{padding:12px 14px;border-radius:10px;border:1px solid var(--line);text-align:center}
.m-tool .amort-val{font-family:var(--font-d);font-size:1.45rem;font-weight:700;line-height:1.1}
.m-tool .amort-lbl{font-size:.76rem;color:var(--text-soft);margin-top:4px}
.m-tool .amort-total{padding:12px 14px;border-radius:10px;background:var(--accent-soft);border:1px solid rgba(239,108,26,.25);text-align:center;margin-top:4px}
.m-tool .amort-total .amort-val{color:var(--accent-deep);font-size:1.7rem}
/* checklist */
.m-tool .checklist{list-style:none;display:flex;flex-direction:column;gap:12px}
.m-tool .checklist li{display:flex;align-items:flex-start;gap:12px;font-size:.9rem;line-height:1.5}
.m-tool .cb{width:22px;height:22px;border-radius:6px;border:2px solid var(--accent);display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:.75rem;color:var(--accent);font-weight:800;margin-top:1px}
.m-tool .cl-title{font-weight:600;margin-bottom:3px}
.m-tool .cl-detail{font-size:.82rem;color:var(--text-soft);line-height:1.5}
/* invest input */
.m-tool .invest-row{display:flex;align-items:center;gap:10px;padding:12px 16px;border:1.5px solid var(--line);border-radius:10px;background:var(--surface-2);font-size:1.1rem;margin-bottom:16px}
.m-tool .invest-row input{flex:1;border:none;background:transparent;font:inherit;font-size:1.2rem;font-weight:700;color:var(--accent-deep);outline:none;min-width:0}
.m-tool .invest-row span{color:var(--text-soft);font-size:.9rem;white-space:nowrap}
.m-tool .shortcuts{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:24px}
.m-tool .sc-btn{padding:10px 6px;border:1.5px solid var(--line);border-radius:9px;background:var(--surface-2);font:inherit;font-weight:600;font-size:.85rem;cursor:pointer;transition:border-color .15s,background .15s;text-align:center}
.m-tool .sc-btn:hover{border-color:var(--accent);background:var(--accent-soft)}
.m-tool .sc-btn.sel{border-color:var(--accent-deep);background:var(--accent-soft);color:var(--accent-deep)}
.m-tool .hint-box{font-size:.83rem;color:var(--text-soft);padding:10px 14px;border-radius:10px;background:var(--surface-2);border:1px solid var(--line);margin-bottom:18px;line-height:1.55}
.m-tool .disc{margin-top:26px;background:var(--warn-soft);border:1px solid var(--line);border-radius:13px;padding:15px 17px;font-size:.82rem;line-height:1.5}
.m-tool .disc b{color:var(--warn)}
.m-tool .restart{display:inline-flex;align-items:center;gap:6px;padding:10px 18px;background:var(--surface-2);border:1.5px solid var(--line);border-radius:10px;font:inherit;font-size:.9rem;font-weight:600;cursor:pointer;color:var(--text-soft);transition:all .15s;margin-top:14px}
.m-tool .restart:hover{border-color:var(--accent);color:var(--accent)}
`

// ─── MAIN EXPORT ─────────────────────────────────────────────────────────────
export default function DPIBorneContent() {
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
          DPI Borne — Gain Fiscal 2026
        </nav>
        <header className="head">
          <div className="meta-row">
            <span className="chip">💼 Professionnel</span>
            <span className="chip chip-acc">🇧🇪 Belgique — DPI Énergie</span>
            <span className="chip">Réservé aux membres</span>
          </div>
          <h1>Déduction pour Investissement (DPI) borne de recharge — Gain fiscal 2026</h1>
          <p className="lede">
            Calculez en 3 étapes le <strong>gain fiscal réel</strong> de la DPI environnementale
            pour votre installation de borne connectée — indépendant, PME ou grande entreprise.
          </p>
        </header>
        <Suspense fallback={<div style={{ minHeight: 200 }} />}>
          <DPIWizardWithParams />
        </Suspense>
      </div>
    </div>
  )
}

// ─── WIZARD ──────────────────────────────────────────────────────────────────
function DPIWizardWithParams() {
  const params = useSearchParams()
  const coutTvac = parseInt(params.get('cout') || '0', 10)
  // Estimate HTVA from TVAC assuming 21 % TVA (professional BE default)
  const coutHTVAFromParam = coutTvac > 0 ? Math.round(coutTvac / 1.21) : 0

  const [step, setStep] = useState(0)
  const [state, setState] = useState<DPIState>({
    statut: 'pme',
    investHTVA: coutHTVAFromParam > 0 ? coutHTVAFromParam : 2000,
    tauxImp: 25,
  })

  function set<K extends keyof DPIState>(k: K, v: DPIState[K]) {
    setState(prev => ({ ...prev, [k]: v }))
  }

  if (step >= N_STEPS) return <DPIResults state={state} coutTvac={coutTvac} onRestart={() => setStep(0)} />

  const segs = Array.from({ length: N_STEPS }, (_, i) => i < step ? 'done' : i === step ? 'active' : '')
  const labels = ['Statut juridique', 'Investissement HTVA', "Taux d'imposition"]
  const SHORTCUTS = [1000, 1500, 2000, 2500, 3000, 5000]

  return (
    <div className="card">
      <div className="progress" aria-label="Progression">
        {segs.map((c, i) => <div key={i} className={`ps ${c}`} />)}
      </div>
      <div className="step-ctr">Étape {step + 1} / {N_STEPS} — {labels[step]}</div>

      {step === 0 && (
        <>
          <div className="step-q">Quel est votre statut juridique ?</div>
          <div className="step-hint">Le taux de DPI applicable dépend de la taille de l'entreprise (circ. SPF Finances 2026).</div>
          <div className="opts">
            {([
              { v: 'independant' as Statut, icon: '🧑‍💼', t: 'Indépendant / Profession libérale',  d: 'En personne physique ou société unipersonnelle (SRL à associé unique). DPI énergie 40 %.' },
              { v: 'pme'         as Statut, icon: '🏢',    t: 'PME / Société de taille restreinte', d: 'Moins de 250 salariés et CA < 50 M€. DPI énergie 40 % selon la réglementation en vigueur.' },
              { v: 'grande'      as Statut, icon: '🏭',    t: 'Grande entreprise',                   d: 'Au-delà des seuils PME. DPI énergie 30 % selon la réglementation en vigueur.' },
            ]).map(({ v, icon, t, d }) => (
              <button key={v} type="button" className={`opt${state.statut === v ? ' sel' : ''}`}
                onClick={() => set('statut', v)}>
                <span className="oi">{icon}</span>
                <span><span className="ot">{t}</span><span className="od">{d}</span></span>
              </button>
            ))}
          </div>
        </>
      )}

      {step === 1 && (
        <>
          <div className="step-q">Quel est le montant de l'investissement hors TVA ?</div>
          <div className="step-hint">La TVA est récupérable pour les assujettis belges — seule la base HTVA est éligible à la DPI.</div>
          {coutHTVAFromParam > 0 && (
            <div className="hint-box">
              💡 Pré-rempli depuis le Simulateur borne : <strong>{fmt(coutHTVAFromParam)} € HTVA</strong>
              {' '}(TVA 21 % déduite de {fmt(coutTvac)} € TVAC). Ajustez si nécessaire.
            </div>
          )}
          <label style={{ display: 'block', fontSize: '.88rem', fontWeight: 600, color: 'var(--text-soft)', marginBottom: 8 }}>
            Montant HTVA — matériel + pose + inspection
          </label>
          <div className="invest-row">
            <input
              type="number" min={100} max={100000} step={50}
              value={state.investHTVA}
              onChange={e => set('investHTVA', parseInt(e.target.value) || 0)}
            />
            <span>€ HTVA</span>
          </div>
          <div className="shortcuts">
            {SHORTCUTS.map(v => (
              <button key={v} type="button"
                className={`sc-btn${state.investHTVA === v ? ' sel' : ''}`}
                onClick={() => set('investHTVA', v)}>
                {fmt(v)} €
              </button>
            ))}
          </div>
        </>
      )}

      {step === 2 && (
        <>
          <div className="step-q">Quel est votre taux d'imposition estimé ?</div>
          <div className="step-hint">
            En Belgique : 25 % (taux normal ISOC) ou 20 % (taux réduit PME sur la 1ère tranche de bénéfices jusqu'à 100 000 €).
          </div>
          <div className="opts">
            {([
              { v: 25 as TauxImp, icon: '📊', t: '25 % — Taux normal ISOC',       d: 'Applicable à la majorité des sociétés en Belgique.' },
              { v: 20 as TauxImp, icon: '🟢', t: '20 % — Taux réduit PME',         d: 'Conditions : PME, bénéfices ≤ 100 000 €, dirigeant rémunéré ≥ 45 000 €/an.' },
            ]).map(({ v, icon, t, d }) => (
              <button key={v} type="button" className={`opt${state.tauxImp === v ? ' sel' : ''}`}
                onClick={() => set('tauxImp', v)}>
                <span className="oi">{icon}</span>
                <span><span className="ot">{t}</span><span className="od">{d}</span></span>
              </button>
            ))}
          </div>
        </>
      )}

      <div className="wnav">
        {step > 0 && (
          <button type="button" className="btn-g" onClick={() => setStep(s => s - 1)}>← Retour</button>
        )}
        <button type="button" className="btn-p" onClick={() => setStep(s => s + 1)}>
          {step === N_STEPS - 1 ? 'Calculer mon gain fiscal →' : 'Suivant →'}
        </button>
      </div>
    </div>
  )
}

// ─── RESULTS ─────────────────────────────────────────────────────────────────
function DPIResults({ state, coutTvac, onRestart }: { state: DPIState; coutTvac: number; onRestart: () => void }) {
  const dpi = DPI[state.statut]
  const invest    = state.investHTVA
  const dpiBase   = Math.round(invest * dpi.rate)
  const gainCash  = Math.round(dpiBase * (state.tauxImp / 100))
  const totalAmort = invest + dpiBase
  const netCost   = coutTvac > 0 ? coutTvac - gainCash : invest * 1.21 - gainCash

  return (
    <>
      {/* ── Section 1 : Fiche de gain fiscal ──────────────────────────── */}
      <div className="rc">
        <div className="rh"><span className="rn">1</span>Votre Fiche de Gain Fiscal — DPI Énergie 2026</div>
        <table className="dpi-table">
          <tbody>
            <tr>
              <td>Investissement initial éligible (HTVA)</td>
              <td>{fmt(invest)} € HTVA</td>
            </tr>
            <tr>
              <td>Statut retenu</td>
              <td>{STATUT_LABELS[state.statut]}</td>
            </tr>
            <tr>
              <td>Taux de DPI applicable</td>
              <td>{dpi.label}</td>
            </tr>
            <tr>
              <td>Base déductible supplémentaire créée par la DPI</td>
              <td>+ {fmt(dpiBase)} €</td>
            </tr>
            <tr>
              <td>Taux d'imposition retenu</td>
              <td>{state.tauxImp} %</td>
            </tr>
            <tr className="hi">
              <td>💰 Économie d'impôt nette directe (Gain Cash)</td>
              <td>− {fmt(gainCash)} €</td>
            </tr>
            <tr>
              <td>
                Coût net réel après gain fiscal
                {coutTvac > 0 ? ` (base TVAC ${fmt(coutTvac)} €)` : ' (base TVAC estimée)'}
              </td>
              <td>{fmt(Math.max(0, netCost))} €</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* ── Section 2 : Amortissement ─────────────────────────────────── */}
      <div className="rc">
        <div className="rh"><span className="rn">2</span>Impact sur votre Amortissement (sur 5 ans minimum)</div>
        <p style={{ fontSize: '.88rem', color: 'var(--text-soft)', lineHeight: 1.6, marginBottom: 14 }}>
          La DPI s'ajoute à l'amortissement classique à <strong>100 %</strong> du matériel.
          Votre borne sera déduite fiscalement à hauteur de <strong>{dpi.totalPct} % au total</strong>,
          soit <strong>{fmt(totalAmort)} € de base déductible cumulée</strong> sur la durée
          d'amortissement (minimum 5 exercices comptables en Belgique).
        </p>
        <div className="amort-grid">
          <div className="amort-box" style={{ background: 'var(--surface)' }}>
            <div className="amort-val">{fmt(invest)} €</div>
            <div className="amort-lbl">Amortissement de base (100 %)</div>
          </div>
          <div className="amort-box" style={{ background: 'var(--green-soft)', borderColor: 'rgba(22,163,74,.25)' }}>
            <div className="amort-val" style={{ color: 'var(--green)' }}>+ {fmt(dpiBase)} €</div>
            <div className="amort-lbl">DPI énergie supplémentaire ({dpi.label})</div>
          </div>
        </div>
        <div className="amort-total">
          <div className="amort-val">{fmt(totalAmort)} €</div>
          <div className="amort-lbl">Base totale déductible ({dpi.totalPct} % de l'investissement initial)</div>
        </div>
      </div>

      {/* ── Section 3 : Checklist conformité ─────────────────────────── */}
      <div className="rc">
        <div className="rh"><span className="rn">3</span>Critères de Conformité — Checklist Fisc Belge</div>
        <p style={{ fontSize: '.88rem', color: 'var(--text-soft)', marginBottom: 16, lineHeight: 1.55 }}>
          Pour que la DPI thématique soit acceptée par le SPF Finances, votre dossier doit satisfaire ces conditions :
        </p>
        <ul className="checklist">
          {[
            {
              title: 'Borne neuve et intelligente (Smart Charging)',
              detail: "La borne doit être acquise à l'état neuf et disposer de fonctionnalités de charge intelligente : protocole OCPP, délestage dynamique, programmation horaire.",
            },
            {
              title: 'Amortissement étalé sur 5 ans minimum',
              detail: "L'amortissement dégressif accéléré n'est pas applicable ici. La déduction s'étale sur la durée d'usage réelle du bien (minimum 5 exercices comptables).",
            },
            {
              title: "Justification de l'optimisation énergétique",
              detail: "Conservez les preuves : rapport onduleur solaire (couplage PV), car policy avec gestion de charge active, ou attestation du GRD sur la gestion des pointes.",
            },
            {
              title: 'Usage professionnel documenté',
              detail: "La borne doit être utilisée pour les besoins de l'activité. Si usage mixte pro/privé, tenez un registre des chargements pour justifier la quote-part professionnelle.",
            },
            {
              title: "Dossier d'achat complet",
              detail: "Conservez : facture détaillée (référence borne, mention OCPP / Smart Charging), rapport de contrôle RGIE (obligatoire en Belgique), certificat fabricant si demandé.",
            },
          ].map((item, i) => (
            <li key={i}>
              <div className="cb">✓</div>
              <div>
                <div className="cl-title">{item.title}</div>
                <div className="cl-detail">{item.detail}</div>
              </div>
            </li>
          ))}
        </ul>
        <div style={{ marginTop: 18, padding: '12px 16px', borderRadius: 10, background: 'var(--warn-soft)', border: '1px solid rgba(176,81,12,.2)', fontSize: '.83rem', lineHeight: 1.55 }}>
          ⚠️ <strong>Note 2026</strong> : La déduction majorée à 150 % (jusqu'au 31/03/2023) puis 100 %
          (jusqu'au 31/12/2024) est expirée. Les taux présentés (30 % ou 40 %) correspondent à la DPI
          thématique environnementale restante. <strong>Consultez votre comptable-fiscaliste agréé</strong> pour
          valider l'éligibilité exacte de votre dossier au regard de votre situation individuelle.
        </div>
      </div>

      <div className="disc">
        <b>Avertissement</b> — Cet outil est fourni à titre indicatif et informatif uniquement.
        Il ne constitue pas un conseil fiscal ou comptable. Les montants sont calculés selon la
        réglementation en vigueur au 01/06/2026 et peuvent évoluer. Consultez votre comptable ou
        conseiller fiscal agréé IEC/IPCF avant toute décision d'investissement.
      </div>

      <button type="button" className="restart" onClick={onRestart}>↺ Refaire un calcul</button>
    </>
  )
}
