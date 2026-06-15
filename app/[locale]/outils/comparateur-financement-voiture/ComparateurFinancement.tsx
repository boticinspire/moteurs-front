'use client'

import { useMemo, useState } from 'react'
import { Link } from '@/i18n/navigation'
import {
  comparerFinancement,
  reventeEstimee,
  fmtMoney,
  DEVISE_SYMBOLE,
  defautsPays,
  PAYS_LISTE,
  PAYS_LABELS,
  SOURCES_PAYS,
  type FinInput,
  type ModeFin,
  type Pays,
} from '@/lib/financement-auto'

// ─── CSS (scopé .fin-tool, sur les tokens --color-* du site) ──────────────────

const CSS = `
.fin-tool{
  --bg:var(--color-bg);--surface:var(--color-bg-card);--surface-2:var(--color-bg-alt);
  --text:var(--color-text);--text-soft:var(--color-text-soft);--text-faint:var(--color-text-muted);
  --line:var(--color-border);--accent:var(--color-primary);--accent-dark:var(--color-primary-dark);
  --green:var(--color-accent);--red:var(--color-danger);--shadow:var(--shadow-md);
  font-family:inherit;color:var(--text);background:var(--bg);
}
.fin-tool *{box-sizing:border-box;margin:0;padding:0}
.fin-wrap{max-width:1200px;margin:0 auto;padding:32px 20px 80px}
.fin-crumb{font-size:.8rem;color:var(--text-faint);margin-bottom:20px}
.fin-crumb a{color:var(--text-soft);text-decoration:none}
.fin-crumb a:hover{color:var(--accent)}
.fin-crumb span{margin:0 6px;opacity:.4}

.fin-head{margin-bottom:30px}
.fin-tag{display:inline-block;font-size:.72rem;font-weight:700;letter-spacing:.06em;
  text-transform:uppercase;padding:4px 12px;border-radius:999px;
  background:rgba(239,108,26,.1);border:1px solid rgba(239,108,26,.25);
  color:var(--accent);margin-bottom:12px}
.fin-head h1{font-size:clamp(1.6rem,3.5vw,2.25rem);line-height:1.12;margin-bottom:10px}
.fin-head p{color:var(--text-soft);max-width:640px;font-size:.97rem;line-height:1.6}

.fin-disclaim{display:flex;gap:11px;align-items:flex-start;background:rgba(239,108,26,.07);
  border:1px solid rgba(239,108,26,.28);border-radius:12px;padding:13px 16px;margin-bottom:24px;
  font-size:.86rem;line-height:1.5;color:var(--text-soft)}
.fin-disclaim b{color:var(--text)}
.fin-disclaim .ic{font-size:1.1rem;line-height:1.2}
.fin-src{margin-top:8px;display:flex;flex-wrap:wrap;gap:6px}
.fin-src span{font-size:.74rem;background:var(--surface-2);border:1px solid var(--line);
  border-radius:6px;padding:2px 8px;color:var(--text-faint)}
.fin-grid{display:grid;grid-template-columns:1fr;gap:22px;align-items:start}
@media(min-width:1040px){.fin-grid{grid-template-columns:430px 1fr}}

.fin-card{background:var(--surface);border:1px solid var(--line);border-radius:16px;
  box-shadow:var(--shadow)}
@media(min-width:1040px){.fin-form-sticky{position:sticky;top:84px;max-height:calc(100vh - 104px);overflow-y:auto}}
.fin-card-h{padding:16px 20px 12px;border-bottom:1px solid var(--line)}
.fin-card-h h2{font-size:1rem;font-weight:700}
.fin-card-h p{font-size:.82rem;color:var(--text-soft);margin-top:3px}
.fin-card-b{padding:16px 20px 20px;display:flex;flex-direction:column;gap:13px}

.fin-section-title{font-size:.73rem;font-weight:700;text-transform:uppercase;
  letter-spacing:.06em;color:var(--text-faint);padding:6px 0 7px;
  border-bottom:1px solid var(--line);margin-bottom:2px;display:flex;
  align-items:center;justify-content:space-between;gap:8px}
.fin-field label{display:block;font-size:.83rem;font-weight:600;color:var(--text);margin-bottom:5px}
.fin-field .hint{font-weight:400;color:var(--text-faint);font-size:.76rem}
.fin-field input[type=number],.fin-field select{
  width:100%;padding:9px 12px;border:1.5px solid var(--line);border-radius:8px;
  font:inherit;font-size:.95rem;background:var(--surface-2);color:var(--text);
  outline:none;transition:border-color .15s}
.fin-field input:focus,.fin-field select:focus{border-color:var(--accent)}
.fin-row2{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.fin-row3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px}

.fin-toggle{display:flex;align-items:center;gap:8px;cursor:pointer;font-size:.85rem;font-weight:600}
.fin-toggle input{width:16px;height:16px;accent-color:var(--accent);cursor:pointer}
.fin-mode-box{border:1.5px solid var(--line);border-radius:12px;padding:14px;
  display:flex;flex-direction:column;gap:11px;transition:border-color .15s,opacity .15s}
.fin-mode-box.off{opacity:.5}
.fin-mode-box.on{border-color:rgba(239,108,26,.4)}
.fin-mode-head{display:flex;align-items:center;justify-content:space-between}
.fin-mode-head .ttl{font-size:.95rem;font-weight:700}

.fin-seg{display:inline-flex;border:1.5px solid var(--line);border-radius:8px;overflow:hidden}
.fin-seg button{padding:7px 12px;font:inherit;font-size:.82rem;font-weight:600;
  background:var(--surface-2);color:var(--text-soft);border:none;cursor:pointer}
.fin-seg button.sel{background:var(--accent);color:#fff}

.fin-pays{display:grid;grid-template-columns:repeat(5,1fr);gap:6px}
.fin-pays button{display:flex;flex-direction:column;align-items:center;gap:3px;
  padding:9px 4px;border:1.5px solid var(--line);border-radius:9px;background:var(--surface-2);
  color:var(--text-soft);font:inherit;font-size:.72rem;font-weight:600;cursor:pointer;transition:.15s}
.fin-pays button .fl{font-size:1.15rem;line-height:1}
.fin-pays button.sel{border-color:var(--accent);background:rgba(239,108,26,.1);color:var(--text)}

/* Résultats */
.fin-res-head{display:flex;align-items:baseline;justify-content:space-between;
  flex-wrap:wrap;gap:8px;margin-bottom:6px}
.fin-res-head h2{font-size:1.05rem;font-weight:700}
.fin-winner{background:linear-gradient(135deg,rgba(239,108,26,.12),rgba(239,108,26,.04));
  border:1px solid rgba(239,108,26,.3);border-radius:14px;padding:18px 20px;margin-bottom:18px}
.fin-winner .lbl{font-size:.74rem;font-weight:700;letter-spacing:.05em;text-transform:uppercase;color:var(--accent)}
.fin-winner .name{font-size:1.4rem;font-weight:800;margin:4px 0 2px}
.fin-winner .sub{font-size:.9rem;color:var(--text-soft)}

.fin-ranks{display:flex;flex-direction:column;gap:12px;margin-bottom:22px}
.fin-rank{border:1px solid var(--line);border-radius:14px;background:var(--surface);
  overflow:hidden}
.fin-rank.best{border-color:rgba(239,108,26,.45);box-shadow:0 0 0 1px rgba(239,108,26,.25)}
.fin-rank.inactive{opacity:.45}
.fin-rank-top{display:flex;align-items:center;gap:12px;padding:14px 16px;cursor:pointer}
.fin-pos{width:30px;height:30px;border-radius:50%;background:var(--surface-2);
  display:grid;place-items:center;font-weight:800;font-size:.9rem;flex-shrink:0}
.fin-rank.best .fin-pos{background:var(--accent);color:#fff}
.fin-rank-name{flex:1;min-width:0}
.fin-rank-name .n{font-weight:700;font-size:.98rem}
.fin-rank-name .t{font-size:.78rem;color:var(--text-faint)}
.fin-rank-cost{text-align:right}
.fin-rank-cost .big{font-weight:800;font-size:1.15rem}
.fin-rank-cost .small{font-size:.76rem;color:var(--text-faint)}
.fin-detail{padding:0 16px 14px 58px;display:flex;flex-direction:column;gap:5px}
.fin-detail li{font-size:.82rem;color:var(--text-soft);line-height:1.45;list-style:disc;margin-left:14px}
.fin-badge{display:inline-block;font-size:.68rem;font-weight:700;padding:2px 8px;border-radius:6px;
  background:var(--surface-2);color:var(--text-faint);margin-left:8px}
.fin-badge.own{background:rgba(34,160,90,.12);color:var(--green)}

.fin-table{width:100%;border-collapse:collapse;font-size:.85rem;margin-bottom:8px}
.fin-table th,.fin-table td{padding:9px 10px;text-align:right;border-bottom:1px solid var(--line)}
.fin-table th:first-child,.fin-table td:first-child{text-align:left}
.fin-table thead th{font-size:.72rem;text-transform:uppercase;letter-spacing:.04em;color:var(--text-faint);font-weight:700}
.fin-table tbody tr.best td{background:rgba(239,108,26,.06);font-weight:600}

.fin-note{font-size:.8rem;color:var(--text-faint);line-height:1.55;
  background:var(--surface-2);border:1px solid var(--line);border-radius:10px;padding:13px 15px;margin-top:14px}
.fin-note b{color:var(--text-soft)}

.fin-seo{max-width:820px;margin:54px auto 0;line-height:1.65}
.fin-seo h2{font-size:1.3rem;margin:34px 0 12px}
.fin-seo h3{font-size:1.05rem;margin:22px 0 7px}
.fin-seo p{color:var(--text-soft);margin-bottom:12px}
.fin-seo ul{color:var(--text-soft);margin:0 0 14px 20px;display:flex;flex-direction:column;gap:6px}
.fin-faq details{border:1px solid var(--line);border-radius:10px;padding:13px 16px;margin-bottom:10px;background:var(--surface)}
.fin-faq summary{font-weight:700;cursor:pointer;font-size:.94rem}
.fin-faq p{margin:9px 0 0;font-size:.9rem}
`

// ─── Champ numérique réutilisable ─────────────────────────────────────────────

function Num({
  label, hint, value, onChange, suffix, step = 1, min = 0,
}: {
  label: string; hint?: string; value: number; onChange: (n: number) => void
  suffix?: string; step?: number; min?: number
}) {
  return (
    <div className="fin-field">
      <label>{label} {hint && <span className="hint">· {hint}</span>}</label>
      <div style={{ position: 'relative' }}>
        <input
          type="number" inputMode="decimal" step={step} min={min} value={Number.isFinite(value) ? value : 0}
          onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
          style={suffix ? { paddingRight: 44 } : undefined}
        />
        {suffix && (
          <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
            fontSize: '.82rem', color: 'var(--color-text-muted)', pointerEvents: 'none' }}>{suffix}</span>
        )}
      </div>
    </div>
  )
}

// ─── Composant principal ──────────────────────────────────────────────────────

const POS = ['1', '2', '3', '4']

export default function ComparateurFinancement() {
  const [pays, setPays] = useState<Pays>('FR')
  const [f, setF] = useState<FinInput>(defautsPays('FR'))
  const [openMode, setOpenMode] = useState<ModeFin | null>('comptant')
  const set = <K extends keyof FinInput>(k: K, v: FinInput[K]) => setF((p) => ({ ...p, [k]: v }))
  const changerPays = (p: Pays) => { setPays(p); setF(defautsPays(p)) }
  const E = (n: number) => fmtMoney(n, f.devise)
  const sym = DEVISE_SYMBOLE[f.devise]
  const src = SOURCES_PAYS[pays]
  const nomPays = PAYS_LABELS[pays].nom

  const res = useMemo(() => comparerFinancement(f), [f])
  const reventeAuto = useMemo(
    () => reventeEstimee(f.prix_vehicule, f.decote_annuelle, f.duree_mois),
    [f.prix_vehicule, f.decote_annuelle, f.duree_mois],
  )
  const actifs = res.resultats.filter((r) => r.actif)

  // JSON-LD
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebApplication',
        name: 'Comparateur de financement automobile — LOA, LLD, crédit, comptant',
        applicationCategory: 'FinanceApplication',
        operatingSystem: 'Web',
        offers: { '@type': 'Offer', price: '0', priceCurrency: 'EUR' },
        url: 'https://moteurs.com/outils/comparateur-financement-voiture',
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Accueil', item: 'https://moteurs.com/' },
          { '@type': 'ListItem', position: 2, name: 'Outils', item: 'https://moteurs.com/outils' },
          { '@type': 'ListItem', position: 3, name: 'Comparateur de financement', item: 'https://moteurs.com/outils/comparateur-financement-voiture' },
        ],
      },
      {
        '@type': 'FAQPage',
        mainEntity: FAQ.map((q) => ({
          '@type': 'Question', name: q.q,
          acceptedAnswer: { '@type': 'Answer', text: q.a },
        })),
      },
    ],
  }

  return (
    <div className="fin-tool">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <div className="fin-wrap">
        <nav className="fin-crumb">
          <Link href="/">Accueil</Link><span>›</span>
          <Link href="/outils">Outils</Link><span>›</span>
          Comparateur de financement
        </nav>

        <header className="fin-head">
          <span className="fin-tag">Achat · Crédit · LOA · LLD</span>
          <h1>LOA, LLD, crédit ou comptant : le vrai coût de votre voiture</h1>
          <p>
            Comparez les quatre façons de financer une voiture sur une même durée. L&apos;outil calcule le
            déboursé total, le coût net après revente, et surtout le <b>coût réel actualisé</b> — qui intègre
            le coût d&apos;opportunité de votre capital — pour révéler l&apos;option la plus avantageuse selon votre situation.
          </p>
        </header>

        <div className="fin-disclaim">
          <span className="ic">⚠️</span>
          <div>
            <b>Valeurs d&apos;exemple — remplacez-les par vos devis.</b> Les montants pré-remplis sont des
            ordres de grandeur du marché ({nomPays}) vérifiés le {src.date}, pas des offres réelles
            d&apos;une banque ou d&apos;un loueur. Saisissez les chiffres exacts de vos propositions pour un verdict fiable.
            <div className="fin-src">
              {src.items.map((s, i) => (
                <span key={i} title={s.detail}>{s.label}</span>
              ))}
            </div>
          </div>
        </div>

        <div className="fin-grid">
          {/* ───────── FORMULAIRE ───────── */}
          <div className="fin-card fin-form-sticky">
            <div className="fin-card-h">
              <h2>Votre situation</h2>
              <p>Renseignez le véhicule, votre usage et les offres reçues.</p>
            </div>
            <div className="fin-card-b">
              <div className="fin-section-title">Pays</div>
              <div className="fin-pays">
                {PAYS_LISTE.map((p) => (
                  <button key={p} type="button" className={pays === p ? 'sel' : ''} onClick={() => changerPays(p)}>
                    <span className="fl">{PAYS_LABELS[p].drapeau}</span>
                    {PAYS_LABELS[p].nom}
                  </button>
                ))}
              </div>
              <div className="fin-section-title">Véhicule &amp; usage</div>
              <Num label="Prix du véhicule" value={f.prix_vehicule} onChange={(v) => set('prix_vehicule', v)} suffix={sym} step={500} />
              <div className="fin-row2">
                <Num label="Durée" hint="mois" value={f.duree_mois} onChange={(v) => set('duree_mois', v)} suffix="mois" step={6} min={1} />
                <Num label="Kilométrage" hint="par an" value={f.km_annuel} onChange={(v) => set('km_annuel', v)} suffix="km" step={1000} />
              </div>
              <div className="fin-row2">
                <Num label="Taux de placement" hint="coût d'opportunité" value={f.taux_placement} onChange={(v) => set('taux_placement', v)} suffix="%" step={0.5} />
                <Num label="Décote annuelle" hint="estime la revente" value={f.decote_annuelle} onChange={(v) => set('decote_annuelle', v)} suffix="%" step={1} />
              </div>
              <Num
                label="Valeur de revente en fin"
                hint={f.valeur_revente > 0 ? 'saisie manuelle' : `auto ≈ ${E(reventeAuto)}`}
                value={f.valeur_revente} onChange={(v) => set('valeur_revente', v)} suffix={sym} step={500}
              />

              <div className="fin-section-title">Coûts d&apos;usage annuels</div>
              <div className="fin-row3">
                <Num label="Énergie" value={f.energie_an} onChange={(v) => set('energie_an', v)} suffix={sym} step={100} />
                <Num label="Assurance" value={f.assurance_an} onChange={(v) => set('assurance_an', v)} suffix={sym} step={50} />
                <Num label="Entretien" value={f.entretien_an} onChange={(v) => set('entretien_an', v)} suffix={sym} step={50} />
              </div>

              <div className="fin-section-title">Modes à comparer</div>

              {/* COMPTANT */}
              <ModeBox
                mode="comptant" titre="Achat comptant" actif={f.comptant_actif}
                onToggle={(v) => set('comptant_actif', v)} open={openMode === 'comptant'} onOpen={() => setOpenMode(openMode === 'comptant' ? null : 'comptant')}
              >
                <p style={{ fontSize: '.82rem', color: 'var(--color-text-soft)' }}>
                  Vous payez {E(f.prix_vehicule)} immédiatement. Aucun paramètre supplémentaire — le coût
                  d&apos;opportunité du capital est calculé via le taux de placement ci-dessus.
                </p>
              </ModeBox>

              {/* CREDIT */}
              <ModeBox
                mode="credit" titre="Crédit auto" actif={f.credit_actif}
                onToggle={(v) => set('credit_actif', v)} open={openMode === 'credit'} onOpen={() => setOpenMode(openMode === 'credit' ? null : 'credit')}
              >
                <div className="fin-row2">
                  <Num label="Apport" value={f.credit_apport} onChange={(v) => set('credit_apport', v)} suffix={sym} step={500} />
                  <Num label="TAEG" value={f.credit_taux} onChange={(v) => set('credit_taux', v)} suffix="%" step={0.1} />
                </div>
                <Num label="Frais de dossier" value={f.credit_frais} onChange={(v) => set('credit_frais', v)} suffix={sym} step={50} />
              </ModeBox>

              {/* LOA */}
              <ModeBox
                mode="loa" titre="LOA (leasing)" actif={f.loa_actif}
                onToggle={(v) => set('loa_actif', v)} open={openMode === 'loa'} onOpen={() => setOpenMode(openMode === 'loa' ? null : 'loa')}
              >
                <div className="fin-row2">
                  <Num label="1er loyer majoré" value={f.loa_premier_loyer} onChange={(v) => set('loa_premier_loyer', v)} suffix={sym} step={500} />
                  <Num label="Loyer mensuel" value={f.loa_loyer} onChange={(v) => set('loa_loyer', v)} suffix={sym} step={10} />
                </div>
                <Num label="Option d'achat" hint="valeur résiduelle" value={f.loa_option_achat} onChange={(v) => set('loa_option_achat', v)} suffix={sym} step={500} />
                <div className="fin-field">
                  <label>En fin de contrat</label>
                  <div className="fin-seg">
                    <button type="button" className={!f.loa_lever_option ? 'sel' : ''} onClick={() => set('loa_lever_option', false)}>Je restitue</button>
                    <button type="button" className={f.loa_lever_option ? 'sel' : ''} onClick={() => set('loa_lever_option', true)}>Je lève l&apos;option</button>
                  </div>
                </div>
                {!f.loa_lever_option && (
                  <Num label="Frais de restitution" hint="remise en état" value={f.loa_frais_restitution} onChange={(v) => set('loa_frais_restitution', v)} suffix={sym} step={50} />
                )}
                <label className="fin-toggle"><input type="checkbox" checked={f.loa_entretien_inclus} onChange={(e) => set('loa_entretien_inclus', e.target.checked)} /> Entretien inclus dans le loyer</label>
                <label className="fin-toggle"><input type="checkbox" checked={f.loa_assurance_incluse} onChange={(e) => set('loa_assurance_incluse', e.target.checked)} /> Assurance incluse dans le loyer</label>
              </ModeBox>

              {/* LLD */}
              <ModeBox
                mode="lld" titre="LLD (location longue durée)" actif={f.lld_actif}
                onToggle={(v) => set('lld_actif', v)} open={openMode === 'lld'} onOpen={() => setOpenMode(openMode === 'lld' ? null : 'lld')}
              >
                <div className="fin-row2">
                  <Num label="1er loyer" value={f.lld_premier_loyer} onChange={(v) => set('lld_premier_loyer', v)} suffix={sym} step={500} />
                  <Num label="Loyer mensuel" value={f.lld_loyer} onChange={(v) => set('lld_loyer', v)} suffix={sym} step={10} />
                </div>
                <Num label="Frais de restitution" value={f.lld_frais_restitution} onChange={(v) => set('lld_frais_restitution', v)} suffix={sym} step={50} />
                <label className="fin-toggle"><input type="checkbox" checked={f.lld_entretien_inclus} onChange={(e) => set('lld_entretien_inclus', e.target.checked)} /> Entretien inclus dans le loyer</label>
                <label className="fin-toggle"><input type="checkbox" checked={f.lld_assurance_incluse} onChange={(e) => set('lld_assurance_incluse', e.target.checked)} /> Assurance incluse dans le loyer</label>
              </ModeBox>
            </div>
          </div>

          {/* ───────── RÉSULTATS ───────── */}
          <div>
            {actifs.length === 0 ? (
              <div className="fin-card" style={{ padding: 40, textAlign: 'center', color: 'var(--color-text-muted)' }}>
                Activez au moins un mode de financement pour lancer la comparaison.
              </div>
            ) : (
              <>
                {res.gagnant && (
                  <div className="fin-winner">
                    <div className="lbl">★ Option la plus avantageuse</div>
                    <div className="name">{res.gagnant.label}</div>
                    <div className="sub">
                      Coût réel actualisé : <b>{E(res.gagnant.cout_reel)}</b> sur {(f.duree_mois / 12).toFixed(1)} ans
                      {actifs.length >= 2 && res.ecart_vs_2e > 0 && (
                        <> · soit {E(res.ecart_vs_2e)} de moins que la 2ᵉ option</>
                      )}
                    </div>
                  </div>
                )}

                <div className="fin-res-head">
                  <h2>Classement par coût réel</h2>
                  <span style={{ fontSize: '.8rem', color: 'var(--color-text-muted)' }}>{(res.km_total).toLocaleString('fr-FR')} km au total</span>
                </div>

                <div className="fin-ranks">
                  {res.resultats.map((r, i) => {
                    const rank = actifs.findIndex((a) => a.mode === r.mode)
                    const isOpen = openMode === r.mode
                    return (
                      <div key={r.mode} className={`fin-rank ${r.actif && rank === 0 ? 'best' : ''} ${!r.actif ? 'inactive' : ''}`}>
                        <div className="fin-rank-top" onClick={() => setOpenMode(isOpen ? null : r.mode)}>
                          <div className="fin-pos">{r.actif && rank >= 0 ? POS[rank] : '—'}</div>
                          <div className="fin-rank-name">
                            <div className="n">
                              {r.label}
                              {r.proprietaire ? <span className="fin-badge own">Propriétaire</span> : <span className="fin-badge">Location</span>}
                            </div>
                            <div className="t">{r.actif ? `Déboursé ${E(r.debourse_brut)} · net ${E(r.cout_net)}` : 'Désactivé'}</div>
                          </div>
                          <div className="fin-rank-cost">
                            <div className="big">{r.actif ? E(r.cout_reel) : '—'}</div>
                            <div className="small">coût réel</div>
                          </div>
                        </div>
                        {isOpen && r.actif && (
                          <ul className="fin-detail">
                            {r.detail.map((d, k) => <li key={k}>{d}</li>)}
                          </ul>
                        )}
                      </div>
                    )
                  })}
                </div>

                <div className="fin-card" style={{ padding: '16px 18px' }}>
                  <h2 style={{ fontSize: '.95rem', marginBottom: 10 }}>Tableau comparatif</h2>
                  <div style={{ overflowX: 'auto' }}>
                    <table className="fin-table">
                      <thead>
                        <tr>
                          <th>Mode</th><th>Mensualité</th><th>Déboursé brut</th><th>Revente</th><th>Coût net</th><th>Coût réel</th>
                        </tr>
                      </thead>
                      <tbody>
                        {actifs.map((r, i) => (
                          <tr key={r.mode} className={i === 0 ? 'best' : ''}>
                            <td>{r.label}</td>
                            <td>{r.mensualite > 0 ? E(r.mensualite) : '—'}</td>
                            <td>{E(r.debourse_brut)}</td>
                            <td>{r.revente > 0 ? E(r.revente) : '—'}</td>
                            <td>{E(r.cout_net)}</td>
                            <td>{E(r.cout_reel)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="fin-note">
                    <b>Coût réel actualisé</b> = somme de tous les versements ramenés à leur valeur d&apos;aujourd&apos;hui
                    (taux de placement {f.taux_placement}%/an), moins la revente actualisée pour les options où vous
                    devenez propriétaire. C&apos;est l&apos;indicateur le plus juste pour départager des stratégies qui
                    sortent l&apos;argent à des moments différents. Les loyers LOA/LLD et la mensualité du crédit sont
                    indicatifs : saisissez les montants exacts de vos offres pour un verdict fiable.
                  </div>
                </div>
              </>
            )}

            {/* SEO / pédagogie */}
            <div className="fin-seo">
              <h2>Comment lire les 4 options</h2>
              <h3>Achat comptant</h3>
              <p>Vous payez tout, tout de suite. C&apos;est souvent le coût brut le plus bas (zéro intérêt, zéro loyer) mais votre capital est immobilisé : c&apos;est le <b>coût d&apos;opportunité</b> que l&apos;outil chiffre via le taux de placement. Vous récupérez la valeur de revente en fin.</p>
              <h3>Crédit auto</h3>
              <p>Vous devenez propriétaire en empruntant. Vous ajoutez des intérêts (TAEG) mais conservez votre épargne disponible et la revente du véhicule. Plus le taux de placement de votre épargne est élevé, plus le crédit devient compétitif face au comptant.</p>
              <h3>LOA — Location avec Option d&apos;Achat</h3>
              <p>Vous louez avec la possibilité d&apos;acheter en fin de contrat (valeur résiduelle). Si vous levez l&apos;option, vous récupérez de la valeur ; si vous restituez, vous ne gardez rien et pouvez payer des frais de remise en état ou de dépassement kilométrique.</p>
              <h3>LLD — Location Longue Durée</h3>
              <p>Pure location, sans option d&apos;achat. Souvent tout compris (entretien, assistance, parfois assurance), mais vous ne récupérez aucun capital et restituez obligatoirement le véhicule. Idéal pour la visibilité budgétaire et le zéro souci, plus cher sur le long terme.</p>

              <h2>Questions fréquentes</h2>
              <div className="fin-faq">
                {FAQ.map((q, i) => (
                  <details key={i}>
                    <summary>{q.q}</summary>
                    <p>{q.a}</p>
                  </details>
                ))}
              </div>

              <p style={{ fontSize: '.8rem', color: 'var(--color-text-muted)', marginTop: 24 }}>
                Outil informatif. Les résultats dépendent des montants saisis et reposent sur des hypothèses simplifiées
                (TAEG converti en taux mensuel proportionnel, décote géométrique pour la revente). Ils ne constituent pas
                un conseil financier. Vérifiez toujours les conditions exactes de chaque offre.
              </p>

              <p style={{ marginTop: 18 }}>
                À voir aussi : <Link href="/outils/tco-particulier">Simulateur TCO électrique vs thermique</Link> ·{' '}
                <Link href="/comparer">Comparateur de motorisations</Link> ·{' '}
                <Link href="/cout-voiture">Tout savoir sur le coût d&apos;une voiture</Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Sous-composant : boîte de mode pliable ───────────────────────────────────

function ModeBox({
  mode, titre, actif, onToggle, open, onOpen, children,
}: {
  mode: ModeFin; titre: string; actif: boolean; onToggle: (v: boolean) => void
  open: boolean; onOpen: () => void; children: React.ReactNode
}) {
  return (
    <div className={`fin-mode-box ${actif ? 'on' : 'off'}`}>
      <div className="fin-mode-head">
        <label className="fin-toggle">
          <input type="checkbox" checked={actif} onChange={(e) => onToggle(e.target.checked)} />
          <span className="ttl">{titre}</span>
        </label>
        <button type="button" onClick={onOpen} aria-label="Détails"
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', fontSize: '.85rem', fontWeight: 700 }}>
          {open ? '▲' : '▼'}
        </button>
      </div>
      {open && actif && children}
    </div>
  )
}

// ─── FAQ ──────────────────────────────────────────────────────────────────────

const FAQ = [
  {
    q: 'LOA ou crédit : quel est le moins cher ?',
    a: "Sur le coût brut, le crédit l'emporte souvent car vous gardez le véhicule et sa revente. La LOA peut redevenir intéressante si vous changez de voiture tous les 3-4 ans, si les loyers sont subventionnés par le constructeur, ou si vous ne levez pas l'option. Comparez le coût réel actualisé, qui tient compte de la revente et du moment des paiements.",
  },
  {
    q: 'Pourquoi intégrer un taux de placement ?',
    a: "Parce que l'argent payé aujourd'hui (comptant, gros apport) n'a pas la même valeur que celui payé dans 4 ans. Le capital immobilisé aurait pu être placé. Le taux de placement chiffre ce coût d'opportunité : plus il est élevé, plus étaler les paiements (location, crédit) devient avantageux face au comptant.",
  },
  {
    q: 'La LLD est-elle vraiment plus chère ?',
    a: "Sur la durée, presque toujours : vous ne récupérez aucun capital et payez la dépréciation + une marge. Mais elle inclut souvent l'entretien et l'assistance, lisse le budget et évite le risque de revente. Pour un usage intensif ou un besoin de tranquillité, le surcoût peut être justifié.",
  },
  {
    q: 'Que se passe-t-il si je dépasse le kilométrage en LOA/LLD ?',
    a: "Les contrats de location fixent un plafond kilométrique. Au-delà, chaque kilomètre est facturé (souvent 0,10 à 0,30 €/km), et la remise en état peut être facturée à la restitution. Si vous roulez beaucoup, l'achat (comptant ou crédit) est généralement plus sûr.",
  },
  {
    q: 'Comment estimer la valeur de revente ?',
    a: "L'outil applique par défaut une décote annuelle (15 %/an) au prix d'achat. Vous pouvez saisir une valeur précise issue d'une cote (Argus, La Centrale) pour le modèle et le kilométrage visés. C'est un paramètre clé : il pèse lourd dans la comparaison entre achat et location.",
  },
]
