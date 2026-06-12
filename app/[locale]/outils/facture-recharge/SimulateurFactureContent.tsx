'use client'

/**
 * Simulateur de facture de recharge — « outil de choc » viral.
 *
 * L'utilisateur saisit ce qu'il a payé (kWh + montant) sur une borne publique,
 * l'outil calcule son prix réel au kWh et le compare au tarif public le moins
 * cher que nous suivons (table tarifs_carte_pays via Railway). Il en ressort
 * une économie potentielle « sur cette recharge » + une carte partageable.
 *
 * Cadrage juridique : on compare deux tarifs PUBLICS datés (ce que l'utilisateur
 * a payé vs le meilleur tarif carte connu). Aucune accusation nominative ; le
 * réseau où l'utilisateur a rechargé est une donnée de contexte facultative.
 */

import { useState, useRef, useCallback } from 'react'
import { Link } from '@/i18n/navigation'

// ─── Types ───────────────────────────────────────────────────────────────────

interface Offre {
  rang: number
  carte_id: string
  nom: string
  operateur: string
  devise: string
  prix_kwh: number
  abo_mensuel: number
}

interface Verdict {
  prixPayeKwh: number
  meilleur: Offre
  coutMeilleur: number
  economie: number
  ecartPct: number
  devise: string
  niveau: 'bon' | 'correct' | 'cher' | 'arnaque'
}

// ─── Constantes ──────────────────────────────────────────────────────────────

const PAYS = [
  { code: 'FR', label: '🇫🇷 France' },
  { code: 'BE', label: '🇧🇪 Belgique' },
  { code: 'CH', label: '🇨🇭 Suisse' },
] as const

const BORNES = [
  { id: 'dc_ultra',  label: '⚡ Ultra-rapide (≥150 kW)', hint: 'autoroute, station DC' },
  { id: 'dc_rapide', label: '🔌 Rapide (50–150 kW)',     hint: 'DC en ville / hub' },
  { id: 'ac_slow',   label: '🅿️ Lente AC (≤22 kW)',       hint: 'parking, voirie' },
] as const

// Cartes à exclure d'un type de borne incompatible (garde-fou anti-artefact backend).
const EXCLURE: Record<string, string[]> = {
  dc_ultra:  ['lidl-plus'], // Lidl = AC 22 kW uniquement
  dc_rapide: ['lidl-plus'],
}

const SYMB: Record<string, string> = {
  EUR: '€', CHF: 'CHF', GBP: '£', NOK: 'kr', SEK: 'kr', DKK: 'kr',
}

function symb(devise: string) { return SYMB[devise] ?? devise }
function fmtEur(v: number, devise = 'EUR') { return `${v.toFixed(2)} ${symb(devise)}` }
function fmtKwh(v: number, devise = 'EUR') { return `${v.toFixed(2)} ${symb(devise)}/kWh` }

// ─── CSS scopé ───────────────────────────────────────────────────────────────

const CSS = `
.sf-tool{
  --surface:var(--color-bg-card);--surface-2:var(--color-bg-alt);
  --text:var(--color-text);--text-soft:var(--color-text-soft);--text-faint:var(--color-text-muted);
  --line:var(--color-border);--accent:var(--color-primary);--accent-dark:var(--color-primary-dark);
  font-family:inherit;color:var(--text);
}
.sf-tool *{box-sizing:border-box}
.sf-wrap{max-width:980px;margin:0 auto;padding:28px 20px 80px}
.sf-crumb{font-size:.8rem;color:var(--text-faint);margin-bottom:18px}
.sf-crumb a{color:var(--text-soft);text-decoration:none}
.sf-crumb a:hover{color:var(--accent)}
.sf-crumb span{margin:0 6px;opacity:.4}

.sf-head{text-align:center;margin-bottom:28px}
.sf-tag{display:inline-block;font-size:.72rem;font-weight:700;letter-spacing:.06em;
  text-transform:uppercase;padding:4px 13px;border-radius:999px;
  background:rgba(239,108,26,.1);border:1px solid rgba(239,108,26,.28);
  color:#ef6c1a;margin-bottom:14px}
.sf-head h1{font-size:clamp(1.6rem,4vw,2.3rem);line-height:1.12;margin-bottom:12px}
.sf-head p{color:var(--text-soft);max-width:600px;margin:0 auto;font-size:1rem;line-height:1.6}

.sf-card{background:var(--surface);border:1px solid var(--line);border-radius:16px;
  box-shadow:var(--shadow-md);overflow:hidden}
.sf-card-b{padding:22px;display:flex;flex-direction:column;gap:16px}

.sf-row{display:grid;grid-template-columns:1fr 1fr;gap:14px}
@media(max-width:560px){.sf-row{grid-template-columns:1fr}}
.sf-field label{display:block;font-size:.83rem;font-weight:600;margin-bottom:6px}
.sf-field input,.sf-field select{
  width:100%;padding:11px 13px;border:1.5px solid var(--line);border-radius:10px;
  font:inherit;font-size:1rem;background:var(--surface-2);color:var(--text);outline:none;
  transition:border-color .15s}
.sf-field input:focus,.sf-field select:focus{border-color:var(--accent)}
.sf-field .hint{font-size:.74rem;color:var(--text-faint);margin-top:4px}

.sf-btn{width:100%;padding:14px;background:#ef6c1a;color:#fff;border:none;border-radius:12px;
  font:inherit;font-size:1.02rem;font-weight:800;cursor:pointer;transition:background .15s}
.sf-btn:hover{background:#d35e12}
.sf-btn:disabled{opacity:.5;cursor:not-allowed}

.sf-result{margin-top:24px;display:flex;flex-direction:column;gap:18px}
.sf-verdict{border-radius:16px;padding:22px 24px;border:1px solid;text-align:center}
.sf-verdict h2{font-size:clamp(1.3rem,3.4vw,1.8rem);line-height:1.15;margin-bottom:6px}
.sf-verdict p{font-size:.95rem;line-height:1.55;opacity:.92;margin:0}
.sf-v-arnaque{background:rgba(220,38,38,.08);border-color:rgba(220,38,38,.4);color:#ef4444}
.sf-v-cher{background:rgba(217,119,6,.08);border-color:rgba(217,119,6,.4);color:#f59e0b}
.sf-v-correct{background:rgba(59,130,246,.08);border-color:rgba(59,130,246,.35);color:#60a5fa}
.sf-v-bon{background:rgba(16,185,129,.08);border-color:rgba(16,185,129,.4);color:#10b981}
.sf-verdict h2,.sf-verdict p{color:var(--text)}

.sf-kpis{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}
@media(max-width:560px){.sf-kpis{grid-template-columns:1fr}}
.sf-kpi{background:var(--surface-2);border:1px solid var(--line);border-radius:12px;padding:16px 14px;text-align:center}
.sf-kpi .lbl{font-size:.72rem;font-weight:700;text-transform:uppercase;letter-spacing:.04em;
  color:var(--text-faint);margin-bottom:6px}
.sf-kpi .val{font-size:1.7rem;font-weight:800;line-height:1;color:var(--text)}
.sf-kpi.eco .val{color:#ef6c1a}

.sf-reco{background:var(--surface-2);border:1px solid var(--line);border-radius:12px;padding:16px 18px;
  display:flex;align-items:center;gap:14px;flex-wrap:wrap}
.sf-reco .who{font-weight:700}
.sf-reco .px{margin-left:auto;font-weight:800;color:var(--accent)}

.sf-share{background:var(--surface);border:1px solid var(--line);border-radius:16px;padding:20px;
  display:flex;flex-direction:column;gap:14px;align-items:center}
.sf-share h3{font-size:1rem;font-weight:700;text-align:center}
.sf-share img{width:100%;max-width:520px;border-radius:12px;border:1px solid var(--line)}
.sf-share-btns{display:flex;gap:10px;flex-wrap:wrap;justify-content:center}
.sf-sbtn{padding:11px 18px;border-radius:10px;font:inherit;font-size:.9rem;font-weight:700;
  cursor:pointer;border:1px solid var(--line);background:var(--surface-2);color:var(--text);
  display:inline-flex;align-items:center;gap:7px;transition:border-color .15s}
.sf-sbtn:hover{border-color:var(--accent);color:var(--accent)}
.sf-sbtn.primary{background:var(--accent);color:#fff;border-color:var(--accent)}
.sf-sbtn.primary:hover{background:var(--accent-dark);color:#fff}

.sf-cta{display:flex;gap:12px;flex-wrap:wrap;justify-content:center}
.sf-cta a{padding:12px 18px;border-radius:10px;font-weight:700;font-size:.92rem;text-decoration:none}
.sf-cta .a1{background:var(--accent);color:#fff}
.sf-cta .a2{background:var(--surface-2);color:var(--text);border:1px solid var(--line)}

.sf-disc{font-size:.78rem;color:var(--text-faint);background:var(--surface-2);
  padding:13px 16px;border-radius:10px;line-height:1.55}
.sf-err{font-size:.88rem;color:#ef4444;text-align:center;padding:8px}
`

// ─── Helpers calcul ──────────────────────────────────────────────────────────

function niveauPour(ecartPct: number, economie: number): Verdict['niveau'] {
  if (economie <= 0.5) return 'bon'
  if (ecartPct < 0.15) return 'correct'
  if (ecartPct < 0.45) return 'cher'
  return 'arnaque'
}

const TITRES: Record<Verdict['niveau'], string> = {
  bon:     'Bonne nouvelle : vous étiez au bon prix 👏',
  correct: 'Tarif correct, mais vous pouviez faire mieux',
  cher:    'Vous avez payé trop cher 😬',
  arnaque: 'Aïe… vous vous êtes fait pigeonner 🫠',
}

// ─── Composant ───────────────────────────────────────────────────────────────

export default function SimulateurFactureContent() {
  const [pays, setPays]     = useState<string>('FR')
  const [borne, setBorne]   = useState<string>('dc_ultra')
  const [kwh, setKwh]       = useState<string>('35')
  const [montant, setMontant] = useState<string>('28')
  const [operateur, setOperateur] = useState<string>('')

  const [verdict, setVerdict] = useState<Verdict | null>(null)
  const [offres, setOffres]   = useState<Offre[]>([])
  const [loading, setLoading] = useState(false)
  const [erreur, setErreur]   = useState<string>('')
  const [shareUrl, setShareUrl] = useState<string>('')
  const [copie, setCopie] = useState(false)

  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  const deviseSaisie = pays === 'CH' ? 'CHF' : 'EUR'

  // ── Dessin de la carte partageable ──
  const dessinerCarte = useCallback((v: Verdict) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const W = 1200, H = 630
    canvas.width = W; canvas.height = H

    // Fond
    const grad = ctx.createLinearGradient(0, 0, W, H)
    grad.addColorStop(0, '#0a0e1a'); grad.addColorStop(1, '#14182a')
    ctx.fillStyle = grad; ctx.fillRect(0, 0, W, H)

    // Bandeau accent
    const accent = v.niveau === 'bon' ? '#10b981'
                 : v.niveau === 'correct' ? '#60a5fa'
                 : v.niveau === 'cher' ? '#f59e0b' : '#ef4444'
    ctx.fillStyle = accent; ctx.fillRect(0, 0, 14, H)

    // Logo
    ctx.fillStyle = '#7af0c2'; ctx.beginPath(); ctx.arc(78, 74, 8, 0, Math.PI * 2); ctx.fill()
    ctx.font = '700 30px sans-serif'; ctx.fillStyle = '#ffffff'
    ctx.fillText('Moteurs', 96, 84)
    ctx.fillStyle = '#7af0c2'; ctx.fillText('.com', 96 + ctx.measureText('Moteurs').width, 84)

    // Verdict
    ctx.font = '800 30px sans-serif'; ctx.fillStyle = accent
    ctx.fillText(v.niveau === 'arnaque' ? 'JE ME SUIS FAIT PIGEONNER' :
                 v.niveau === 'cher' ? "J'AI PAYÉ TROP CHER" :
                 v.niveau === 'correct' ? 'TARIF CORRECT' : "J'ÉTAIS AU BON PRIX", 70, 180)

    if (v.economie > 0.5) {
      // Gros chiffre économie
      ctx.font = '800 150px sans-serif'; ctx.fillStyle = '#ffffff'
      ctx.fillText(`${v.economie >= 10 ? Math.round(v.economie) : v.economie.toFixed(1)} ${symb(v.devise)}`, 66, 330)
      ctx.font = '600 38px sans-serif'; ctx.fillStyle = '#9ca3af'
      ctx.fillText('de trop sur UNE seule recharge', 70, 392)
    } else {
      ctx.font = '800 110px sans-serif'; ctx.fillStyle = '#ffffff'
      ctx.fillText('Au bon prix ✓', 66, 320)
    }

    // Détail bas
    ctx.font = '600 32px sans-serif'; ctx.fillStyle = '#e5e7eb'
    ctx.fillText(`Payé : ${fmtKwh(v.prixPayeKwh, v.devise)}`, 70, 500)
    ctx.fillStyle = '#7af0c2'
    ctx.fillText(`Meilleur tarif : ${fmtKwh(v.meilleur.prix_kwh, v.devise)} (${v.meilleur.nom})`, 70, 548)

    ctx.font = '500 26px sans-serif'; ctx.fillStyle = '#6b7280'
    ctx.fillText('Calculez votre recharge sur moteurs.com', 70, 596)

    setShareUrl(canvas.toDataURL('image/png'))
  }, [])

  // ── Calcul ──
  async function calculer() {
    setErreur(''); setVerdict(null); setShareUrl('')
    const kwhN = parseFloat(kwh.replace(',', '.'))
    const montantN = parseFloat(montant.replace(',', '.'))
    if (!kwhN || kwhN <= 0 || !montantN || montantN <= 0) {
      setErreur('Renseignez un nombre de kWh et un montant valides.')
      return
    }
    setLoading(true)
    try {
      const res = await fetch(`/api/recharge/comparer/${pays}?type_borne=${borne}`)
      const data = await res.json()
      const exclus = EXCLURE[borne] ?? []
      const liste: Offre[] = (data.classement ?? []).filter(
        (o: Offre) => o.prix_kwh > 0 && !exclus.includes(o.carte_id),
      )
      if (liste.length === 0) {
        setErreur("Aucun tarif de référence disponible pour cette combinaison. Réessayez plus tard.")
        setLoading(false)
        return
      }
      const devise = liste[0].devise || 'EUR'
      const meilleur = liste[0]
      const prixPayeKwh = montantN / kwhN
      const coutMeilleur = kwhN * meilleur.prix_kwh
      const economie = Math.max(0, montantN - coutMeilleur)
      const ecartPct = (prixPayeKwh - meilleur.prix_kwh) / meilleur.prix_kwh
      const niveau = niveauPour(ecartPct, economie)
      const v: Verdict = { prixPayeKwh, meilleur, coutMeilleur, economie, ecartPct, devise, niveau }
      setOffres(liste)
      setVerdict(v)
      // dessin après rendu du canvas
      setTimeout(() => dessinerCarte(v), 30)
    } catch {
      setErreur('Impossible de récupérer les tarifs de référence pour le moment.')
    } finally {
      setLoading(false)
    }
  }

  // ── Partage ──
  async function partager() {
    const canvas = canvasRef.current
    if (!canvas) return
    canvas.toBlob(async (blob) => {
      if (!blob) return
      const file = new File([blob], 'moteurs-facture-recharge.png', { type: 'image/png' })
      const texte = verdict && verdict.economie > 0.5
        ? `Je me suis fait facturer ${verdict.economie >= 10 ? Math.round(verdict.economie) : verdict.economie.toFixed(1)} ${symb(verdict.devise)} de trop sur une recharge 😤 Vérifiez la vôtre :`
        : 'Vérifiez si votre dernière recharge était au bon prix :'
      const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean }
      try {
        if (nav.canShare && nav.canShare({ files: [file] })) {
          await navigator.share({ files: [file], title: 'Moteurs.com', text: texte })
          return
        }
      } catch { /* annulé → on retombe sur le téléchargement */ }
      telecharger()
    }, 'image/png')
  }

  function telecharger() {
    if (!shareUrl) return
    const a = document.createElement('a')
    a.href = shareUrl
    a.download = 'moteurs-facture-recharge.png'
    a.click()
  }

  // ── Partage réseaux (desktop + mobile) ──
  function lienPartage() {
    if (typeof window !== 'undefined') return window.location.origin + window.location.pathname
    return 'https://moteurs.com/outils/facture-recharge'
  }

  function textePartage() {
    if (verdict && verdict.economie > 0.5) {
      const e = verdict.economie >= 10 ? Math.round(verdict.economie) : verdict.economie.toFixed(1)
      return `Je me suis fait facturer ${e} ${symb(verdict.devise)} de trop sur UNE recharge 😤 Vérifie la tienne :`
    }
    return 'Vérifie si ta dernière recharge était au bon prix :'
  }

  function ouvrirReseau(reseau: 'x' | 'facebook' | 'linkedin' | 'whatsapp') {
    const url = encodeURIComponent(lienPartage())
    const txt = encodeURIComponent(textePartage())
    const liens: Record<typeof reseau, string> = {
      x:        `https://twitter.com/intent/tweet?text=${txt}&url=${url}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${url}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${url}`,
      whatsapp: `https://wa.me/?text=${txt}%20${url}`,
    }
    window.open(liens[reseau], '_blank', 'noopener,noreferrer,width=600,height=560')
  }

  async function copierLien() {
    try {
      await navigator.clipboard.writeText(`${textePartage()} ${lienPartage()}`)
      setCopie(true)
      setTimeout(() => setCopie(false), 2000)
    } catch { /* clipboard indisponible */ }
  }

  const operateursDispo = offres.length > 0 ? offres : []

  return (
    <div className="sf-tool">
      <style>{CSS}</style>
      <div className="sf-wrap">

        <nav className="sf-crumb" aria-label="Fil d'Ariane">
          <Link href="/">Accueil</Link><span>›</span>
          <Link href="/outils">Outils</Link><span>›</span>
          Simulateur de facture
        </nav>

        <header className="sf-head">
          <div className="sf-tag">🔥 Outil gratuit · sans inscription</div>
          <h1>On vous a facturé un prix fou&nbsp;?<br />Vérifiez en 10 secondes.</h1>
          <p>
            Entrez ce que vous avez payé sur votre dernière recharge publique. On le compare
            au tarif le moins cher que nous suivons et on vous dit combien vous auriez pu
            économiser avec la bonne carte.
          </p>
        </header>

        {/* ── Formulaire ── */}
        <div className="sf-card">
          <div className="sf-card-b">
            <div className="sf-row">
              <div className="sf-field">
                <label>Pays</label>
                <select value={pays} onChange={e => { setPays(e.target.value); setVerdict(null) }}>
                  {PAYS.map(p => <option key={p.code} value={p.code}>{p.label}</option>)}
                </select>
              </div>
              <div className="sf-field">
                <label>Type de borne</label>
                <select value={borne} onChange={e => { setBorne(e.target.value); setVerdict(null) }}>
                  {BORNES.map(b => <option key={b.id} value={b.id}>{b.label}</option>)}
                </select>
                <span className="hint">{BORNES.find(b => b.id === borne)?.hint}</span>
              </div>
            </div>

            <div className="sf-row">
              <div className="sf-field">
                <label>Énergie rechargée (kWh)</label>
                <input type="number" inputMode="decimal" min="0" step="0.1" value={kwh}
                  onChange={e => setKwh(e.target.value)} placeholder="ex : 35" />
                <span className="hint">Indiqué sur votre reçu / l&apos;app</span>
              </div>
              <div className="sf-field">
                <label>Montant payé ({symb(deviseSaisie)})</label>
                <input type="number" inputMode="decimal" min="0" step="0.01" value={montant}
                  onChange={e => setMontant(e.target.value)} placeholder="ex : 28" />
                <span className="hint">Total débité pour cette session</span>
              </div>
            </div>

            <div className="sf-field">
              <label>Où avez-vous rechargé&nbsp;? <span style={{ fontWeight: 400, color: 'var(--color-text-muted)' }}>(facultatif)</span></label>
              <select value={operateur} onChange={e => setOperateur(e.target.value)}>
                <option value="">— Paiement CB sans carte / autre réseau</option>
                {operateursDispo.map(o => (
                  <option key={o.carte_id} value={o.operateur}>{o.operateur}</option>
                ))}
              </select>
            </div>

            <button className="sf-btn" onClick={calculer} disabled={loading}>
              {loading ? 'Calcul en cours…' : 'Me dire si j\'ai payé trop cher →'}
            </button>
            {erreur && <div className="sf-err">{erreur}</div>}
          </div>
        </div>

        {/* ── Résultat ── */}
        {verdict && (
          <div className="sf-result">
            <div className={`sf-verdict sf-v-${verdict.niveau}`}>
              <h2>{TITRES[verdict.niveau]}</h2>
              <p>
                Vous avez payé <strong>{fmtKwh(verdict.prixPayeKwh, verdict.devise)}</strong>.
                {' '}Le tarif {BORNES.find(b => b.id === borne)?.label.replace(/^[^ ]+ /, '').toLowerCase()} le
                moins cher que nous suivons en {PAYS.find(p => p.code === pays)?.label} est de{' '}
                <strong>{fmtKwh(verdict.meilleur.prix_kwh, verdict.devise)}</strong> avec {verdict.meilleur.nom}
                {verdict.meilleur.abo_mensuel > 0
                  ? ` (abonnement ${verdict.meilleur.abo_mensuel} ${symb(verdict.devise)}/mois).`
                  : ' (sans abonnement).'}
              </p>
            </div>

            <div className="sf-kpis">
              <div className="sf-kpi">
                <div className="lbl">Votre prix réel</div>
                <div className="val">{verdict.prixPayeKwh.toFixed(2)}</div>
                <div className="lbl" style={{ marginTop: 4, fontWeight: 600 }}>{symb(verdict.devise)}/kWh</div>
              </div>
              <div className="sf-kpi">
                <div className="lbl">Meilleur tarif</div>
                <div className="val">{verdict.meilleur.prix_kwh.toFixed(2)}</div>
                <div className="lbl" style={{ marginTop: 4, fontWeight: 600 }}>{symb(verdict.devise)}/kWh</div>
              </div>
              <div className="sf-kpi eco">
                <div className="lbl">Économie sur cette recharge</div>
                <div className="val">{fmtEur(verdict.economie, verdict.devise)}</div>
                <div className="lbl" style={{ marginTop: 4, fontWeight: 600 }}>
                  {verdict.ecartPct > 0 ? `+${Math.round(verdict.ecartPct * 100)}% payé` : 'au meilleur prix'}
                </div>
              </div>
            </div>

            <div className="sf-reco">
              <span style={{ fontSize: '1.5rem' }}>💳</span>
              <span>
                <span className="who">{verdict.meilleur.nom}</span>
                <span style={{ color: 'var(--color-text-muted)' }}> · {verdict.meilleur.operateur}</span>
              </span>
              <span className="px">{fmtKwh(verdict.meilleur.prix_kwh, verdict.devise)}</span>
            </div>

            {/* Carte partageable */}
            <div className="sf-share">
              <h3>📸 Partagez votre résultat</h3>
              {shareUrl
                ? <img src={shareUrl} alt="Carte de résultat à partager" />
                : <p style={{ color: 'var(--color-text-muted)', fontSize: '.85rem' }}>Génération de l&apos;image…</p>}
              <div className="sf-share-btns">
                <button className="sf-sbtn primary" onClick={partager}>📤 Partager</button>
                <button className="sf-sbtn" onClick={() => ouvrirReseau('x')}>𝕏</button>
                <button className="sf-sbtn" onClick={() => ouvrirReseau('whatsapp')}>💬 WhatsApp</button>
                <button className="sf-sbtn" onClick={() => ouvrirReseau('facebook')}>f Facebook</button>
                <button className="sf-sbtn" onClick={() => ouvrirReseau('linkedin')}>in LinkedIn</button>
                <button className="sf-sbtn" onClick={copierLien}>{copie ? '✓ Lien copié' : '🔗 Copier le lien'}</button>
                <button className="sf-sbtn" onClick={telecharger}>⬇️ Image</button>
              </div>
              <p style={{ fontSize: '.78rem', color: 'var(--color-text-muted)', textAlign: 'center', margin: 0, lineHeight: 1.5 }}>
                Astuce : <strong>télécharge l&apos;image</strong> puis attache-la à ton post pour plus d&apos;impact.
                Le bouton « Partager » ouvre le partage natif sur mobile.
              </p>
            </div>

            {/* CTA */}
            <div className="sf-cta">
              <Link href="/outils/cartes-recharge" className="a1">⚡ Trouver ma meilleure carte →</Link>
              <Link href="/recharge-electrique" className="a2">📚 Guide recharge VE</Link>
            </div>

            <div className="sf-disc">
              <strong>Comment on calcule —</strong> votre prix réel = montant payé ÷ kWh rechargés.
              Le « meilleur tarif » est le prix public au kWh le plus bas que nous suivons pour ce
              type de borne dans ce pays (tarifs cartes mis à jour automatiquement, hors abonnement
              mensuel éventuel). Les prix réels en station varient selon l&apos;opérateur, l&apos;heure et
              les frais de session&nbsp;: ces chiffres sont indicatifs et datés. Moteurs.com n&apos;est pas
              responsable des décisions prises sur cette base.
            </div>
          </div>
        )}

        {/* Canvas masqué pour la génération d'image */}
        <canvas ref={canvasRef} style={{ display: 'none' }} aria-hidden="true" />
      </div>
    </div>
  )
}
