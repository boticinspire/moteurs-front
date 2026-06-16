'use client'

import { useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import { Link } from '@/i18n/navigation'

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const CSS = `
.apm{position:relative;overflow:hidden;background:#05070d;color:#e6eaf2;border-radius:20px;
 border:1px solid rgba(255,255,255,.08);margin:8px 0 36px;
 background-image:radial-gradient(60% 80% at 12% -10%,rgba(239,108,26,.16),transparent 60%),radial-gradient(50% 70% at 100% 0,rgba(239,108,26,.10),transparent 55%)}
.apm .in{padding:42px 30px}
@media(min-width:760px){.apm .in{padding:54px 48px}}
.apm .chip{display:inline-flex;align-items:center;gap:8px;font-size:.72rem;font-weight:800;letter-spacing:.07em;
 text-transform:uppercase;color:#f7a35a;border:1px solid rgba(247,163,90,.3);border-radius:999px;padding:5px 13px;margin-bottom:18px}
.apm .dotlive{width:7px;height:7px;border-radius:50%;background:#10b981;box-shadow:0 0 0 0 rgba(16,185,129,.6);animation:apmpulse 2s infinite}
@keyframes apmpulse{0%{box-shadow:0 0 0 0 rgba(16,185,129,.5)}70%{box-shadow:0 0 0 7px rgba(16,185,129,0)}100%{box-shadow:0 0 0 0 rgba(16,185,129,0)}}
.apm h2{font-size:clamp(1.9rem,4.4vw,3rem);font-weight:800;line-height:1.05;letter-spacing:-.02em;margin:0 0 16px;color:#fff}
.apm h2 .g{color:#ef6c1a}
.apm .lead{max-width:620px;font-size:1.06rem;line-height:1.6;color:#bdc6d8;margin:0 0 26px}
.apm .stats{display:flex;gap:30px;flex-wrap:wrap;margin:0 0 30px}
.apm .stat .n{font-size:1.5rem;font-weight:800;color:#fff}
.apm .stat .l{font-size:.78rem;color:#8b97ad;margin-top:2px}
.apm .cta{display:flex;gap:12px;flex-wrap:wrap;align-items:center}
.apm .btnp{display:inline-flex;align-items:center;gap:8px;background:#ef6c1a;color:#fff;font-weight:800;font-size:.95rem;
 border:none;border-radius:12px;padding:13px 22px;text-decoration:none;cursor:pointer;transition:filter .15s}
.apm .btnp:hover{filter:brightness(1.08)}
.apm form{display:flex;gap:8px;flex-wrap:wrap;align-items:center}
.apm input[type=email]{background:rgba(255,255,255,.06);border:1.5px solid rgba(255,255,255,.14);border-radius:11px;
 color:#fff;font:inherit;font-size:.92rem;padding:12px 14px;min-width:230px;outline:none}
.apm input[type=email]:focus{border-color:#ef6c1a}
.apm input::placeholder{color:#6c7689}
.apm .btno{background:transparent;color:#fff;border:1.5px solid rgba(255,255,255,.22);border-radius:11px;
 font-weight:700;font-size:.92rem;padding:12px 18px;cursor:pointer;transition:border-color .15s}
.apm .btno:hover{border-color:#ef6c1a}
.apm .consent{display:flex;align-items:flex-start;gap:8px;font-size:.76rem;color:#8b97ad;margin-top:10px;max-width:520px}
.apm .consent a{color:#bdc6d8}
.apm .ok{color:#10b981;font-weight:700;font-size:1rem}
.apm .err{color:#f87171;font-size:.85rem;margin-top:8px}
.apm .divider{height:1px;background:rgba(255,255,255,.08);margin:26px 0}
.apm .sub{font-size:.82rem;color:#8b97ad;margin:0 0 10px;font-weight:700;text-transform:uppercase;letter-spacing:.05em}
`

export default function AutopulseManifesto() {
  const [email, setEmail] = useState('')
  const [consent, setConsent] = useState(false)
  const [status, setStatus] = useState<'idle' | 'loading' | 'ok' | 'error'>('idle')
  const [msg, setMsg] = useState('')

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!email) return
    if (!consent) { setMsg('Veuillez cocher la case de consentement.'); setStatus('error'); return }
    setStatus('loading'); setMsg('')
    const { error } = await sb.from('leads').insert({
      email,
      source_lead: 'AUTOPULSE_WAITLIST',
      message: `Liste d'attente Autopulse — consentement RGPD donné le ${new Date().toISOString()}`,
    })
    if (error) {
      setStatus('error')
      setMsg(error.code === '23505' ? 'Vous êtes déjà inscrit·e — merci !' : 'Erreur — réessayez dans un instant.')
    } else {
      setStatus('ok'); setEmail(''); setConsent(false)
    }
  }

  return (
    <section className="apm" aria-label="Autopulse">
      <style>{CSS}</style>
      <div className="in">
        <div className="chip"><span className="dotlive" /> Autopulse · plateforme conducteur européenne</div>
        <h2>Votre voiture, <span className="g">enfin comprise.</span></h2>
        <p className="lead">
          Autopulse suit l’entretien, anticipe les pannes et surveille les coûts de
          <strong style={{ color: '#e6eaf2' }}> n’importe quel véhicule</strong> — essence, diesel, hybride ou électrique.
          Sans boîtier, sans marque imposée, sans notice à lire. Vous l’ouvrez, vous comprenez votre voiture.
        </p>

        <div className="stats">
          <div className="stat"><div className="n">13 Mds €</div><div className="l">marché européen de la voiture connectée</div></div>
          <div className="stat"><div className="n">+8,3 %/an</div><div className="l">croissance annuelle</div></div>
          <div className="stat"><div className="n">4 carburants</div><div className="l">thermique · hybride · électrique · gaz</div></div>
        </div>

        <div className="cta">
          <Link href="/outils/carnet-entretien" className="btnp">Ouvrir mon carnet d’entretien →</Link>
        </div>

        <div className="divider" />

        <p className="sub">Suivez la construction d’Autopulse</p>
        {status === 'ok' ? (
          <p className="ok">✓ Inscription confirmée — vous serez prévenu·e des nouveautés Autopulse.</p>
        ) : (
          <>
            <form onSubmit={submit}>
              <input type="email" required placeholder="votre@email.fr" value={email}
                onChange={(e) => setEmail(e.target.value)} aria-label="Votre email" />
              <button type="submit" className="btno" disabled={status === 'loading'}>
                {status === 'loading' ? 'Envoi…' : 'Me tenir au courant'}
              </button>
            </form>
            <label className="consent">
              <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} style={{ marginTop: 2 }} />
              <span>J’accepte de recevoir les actualités d’Autopulse / Moteurs.com par email. Désinscription en un clic à tout moment (RGPD).</span>
            </label>
            {status === 'error' && <p className="err">{msg}</p>}
          </>
        )}
      </div>
    </section>
  )
}
