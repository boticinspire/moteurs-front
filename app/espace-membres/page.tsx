'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'
import { useUserContext } from '@/context/UserContextProvider'

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

type Profil = {
  prenom: string
  type_profil: string
  pays: string
}

type Alerte = {
  id?: number
  pays: string[]
  segments: string[]
  mots_cles: string
  actif: boolean
}

export default function EspaceMembresPage() {
  // Contexte utilisateur global (voiture, trajet mémorisé, préférences)
  const {
    context, isReady,
    updateVoiture, updatePreferences,
    resetTrajet, resetSinistre, resetAll,
    sinistreExpireSoon: sinExpire,
  } = useUserContext()

  const [session, setSession]   = useState<any>(null)
  const [loading, setLoading]   = useState(true)
  const [email, setEmail]       = useState('')
  const [sending, setSending]   = useState(false)
  const [status, setStatus]     = useState<{ msg: string; ok: boolean } | null>(null)
  const [profil, setProfil]     = useState<Profil>({ prenom: '', type_profil: 'B2B', pays: 'FR' })
  const [alerte, setAlerte]     = useState<Alerte>({ pays: ['FR'], segments: [], mots_cles: '', actif: true })
  const [saveStatus, setSaveStatus] = useState('')
  const [articles, setArticles] = useState<any[]>([])

  useEffect(() => {
    sb.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
      if (session) chargerDonnees(session.user.id)
    })
    const { data: { subscription } } = sb.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (session) chargerDonnees(session.user.id)
    })
    return () => subscription.unsubscribe()
  }, [])

  async function chargerDonnees(userId: string) {
    // Profil
    const { data: p } = await sb.from('profils_membres').select('*').eq('user_id', userId).single()
    if (p) setProfil({ prenom: p.prenom || '', type_profil: p.type_profil || 'B2B', pays: p.pays || 'FR' })

    // Alertes
    const { data: a } = await sb.from('alertes_utilisateurs').select('*').eq('user_id', userId).single()
    if (a) setAlerte({
      id: a.id,
      pays: a.pays || ['FR'],
      segments: a.segments || [],
      mots_cles: (a.mots_cles || []).join(', '),
      actif: a.actif !== false,
    })

    // Articles récents selon profil
    const paysUser = p?.pays || 'FR'
    const { data: arts } = await sb
      .from('articles')
      .select('slug, titre_provisoire, resume_50mots, published_at')
      .eq('etat_code', 'PUBLIE')
      .eq('pays_cible', paysUser)
      .order('published_at', { ascending: false })
      .limit(5)
    if (arts) setArticles(arts)
  }

  async function envoyerMagicLink() {
    setSending(true)
    setStatus(null)
    const { error } = await sb.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/espace-membres` }
    })
    setSending(false)
    if (error) setStatus({ msg: 'Erreur : ' + error.message, ok: false })
    else setStatus({ msg: '✓ Lien envoyé ! Vérifiez votre boîte mail.', ok: true })
  }

  async function sauvegarderProfil() {
    if (!session) return
    setSaveStatus('…')
    const { error } = await sb.from('profils_membres').upsert({
      user_id: session.user.id,
      email: session.user.email,
      prenom: profil.prenom,
      type_profil: profil.type_profil,
      pays: profil.pays,
    }, { onConflict: 'user_id' })
    setSaveStatus(error ? '✗ Erreur' : '✓ Enregistré')
    setTimeout(() => setSaveStatus(''), 2000)
    if (!error) chargerDonnees(session.user.id)
  }

  async function sauvegarderAlerte() {
    if (!session) return
    setSaveStatus('…')
    const mots_cles = alerte.mots_cles.split(',').map(s => s.trim()).filter(Boolean)
    const payload: any = {
      user_id: session.user.id,
      pays: alerte.pays,
      segments: alerte.segments,
      mots_cles,
      actif: alerte.actif,
    }
    if (alerte.id) payload.id = alerte.id

    const { error } = await sb.from('alertes_utilisateurs').upsert(payload, { onConflict: 'user_id' })
    setSaveStatus(error ? '✗ Erreur' : '✓ Enregistré')
    setTimeout(() => setSaveStatus(''), 2000)
  }

  async function seDeconnecter() {
    await sb.auth.signOut()
    window.location.href = '/espace-membres'
  }

  function togglePays(p: string) {
    setAlerte(prev => ({
      ...prev,
      pays: prev.pays.includes(p) ? prev.pays.filter(x => x !== p) : [...prev.pays, p]
    }))
  }

  function toggleSegment(s: string) {
    setAlerte(prev => ({
      ...prev,
      segments: prev.segments.includes(s) ? prev.segments.filter(x => x !== s) : [...prev.segments, s]
    }))
  }

  if (loading) return (
    <div style={{ textAlign: 'center', padding: '80px 24px' }}>
      <div className="loader" />
      <p style={{ color: 'var(--color-text-soft)', marginTop: 16 }}>Vérification de votre session…</p>
    </div>
  )

  // ── VUE LOGIN ──
  if (!session) return (
    <div className="membre-wrapper">
      <div className="login-card">
        <div className="logo-sm">Moteurs<span>.com</span></div>
        <h1>Votre espace personnel</h1>
        <p>Alertes sur mesure, articles selon votre profil, simulateur sauvegardé.</p>
        <input
          className="login-input"
          type="email"
          placeholder="votre@email.pro"
          value={email}
          onChange={e => setEmail(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && envoyerMagicLink()}
        />
        <button className="btn-login" onClick={envoyerMagicLink} disabled={sending || !email}>
          {sending ? 'Envoi…' : 'Recevoir le lien de connexion →'}
        </button>
        {status && (
          <div className={`login-status ${status.ok ? 'ok' : 'err'}`} style={{ display: 'block' }}>
            {status.msg}
          </div>
        )}
        <div className="login-divider">Connexion sans mot de passe — lien valable 1h</div>
        <p style={{ fontSize: '0.75rem', color: 'var(--color-text-soft)' }}>Vos données ne sont jamais revendues.</p>
      </div>
    </div>
  )

  // ── VUE DASHBOARD ──
  const prenom = profil.prenom || session.user.email.split('@')[0]
  const PAYS_LIST = [{ v: 'FR', l: 'France' }, { v: 'BE', l: 'Belgique' }, { v: 'CH', l: 'Suisse' }, { v: 'CA', l: 'Canada' }]
  const SEG_LIST = [{ v: 'B2B', l: 'B2B / Flottes' }, { v: 'Particulier', l: 'Particuliers' }, { v: 'ZFE', l: 'ZFE' }, { v: 'Aides', l: 'Aides & Fiscalité' }]

  return (
    <div className="membre-wrapper">
      <div className="dashboard">
        <div className="dashboard-header">
          <div>
            <h1>👋 Bonjour {prenom} !</h1>
            <div className="user-info">{session.user.email}</div>
          </div>
          <button className="btn-logout" onClick={seDeconnecter}>Déconnexion</button>
        </div>

        <div className="dash-grid">
          {/* Carte profil */}
          <div className="dash-card">
            <h2>👤 Mon profil</h2>
            <div className="profil-field">
              <label>Prénom</label>
              <input value={profil.prenom} onChange={e => setProfil(p => ({ ...p, prenom: e.target.value }))} placeholder="Votre prénom" />
            </div>
            <div className="profil-field">
              <label>Je suis</label>
              <select value={profil.type_profil} onChange={e => setProfil(p => ({ ...p, type_profil: e.target.value }))}>
                <option value="B2B">Professionnel (PME, artisan, flotte)</option>
                <option value="Particulier">Particulier</option>
              </select>
            </div>
            <div className="profil-field">
              <label>Mon pays</label>
              <select value={profil.pays} onChange={e => setProfil(p => ({ ...p, pays: e.target.value }))}>
                {PAYS_LIST.map(p => <option key={p.v} value={p.v}>{p.l}</option>)}
              </select>
            </div>
            <button className="btn-save" onClick={sauvegarderProfil}>
              Enregistrer <span className="save-status">{saveStatus}</span>
            </button>
          </div>

          {/* Carte alertes */}
          <div className="dash-card">
            <h2>🔔 Mes alertes email</h2>
            <p style={{ fontSize: '0.82rem', color: 'var(--color-text-soft)', marginBottom: 16 }}>
              Recevez un email quand de nouveaux articles correspondent à vos critères.
            </p>
            <div className="alerte-label">Pays suivis</div>
            <div className="alerte-options">
              {PAYS_LIST.map(p => (
                <span
                  key={p.v}
                  className={`alerte-chip${alerte.pays.includes(p.v) ? ' active' : ''}`}
                  onClick={() => togglePays(p.v)}
                >{p.l}</span>
              ))}
            </div>
            <div className="alerte-label" style={{ marginTop: 12 }}>Thématiques</div>
            <div className="alerte-options">
              {SEG_LIST.map(s => (
                <span
                  key={s.v}
                  className={`alerte-chip${alerte.segments.includes(s.v) ? ' active' : ''}`}
                  onClick={() => toggleSegment(s.v)}
                >{s.l}</span>
              ))}
            </div>
            <div className="profil-field" style={{ marginTop: 14 }}>
              <label>Mots-clés (séparés par des virgules)</label>
              <input value={alerte.mots_cles} onChange={e => setAlerte(a => ({ ...a, mots_cles: e.target.value }))} placeholder="ZFE, bonus, CEE…" />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '12px 0' }}>
              <input type="checkbox" id="alerte-actif" checked={alerte.actif} onChange={e => setAlerte(a => ({ ...a, actif: e.target.checked }))} />
              <label htmlFor="alerte-actif" style={{ cursor: 'pointer' }}>Recevoir les alertes email (chaque vendredi)</label>
            </div>
            <button className="btn-save" onClick={sauvegarderAlerte}>
              Enregistrer <span className="save-status">{saveStatus}</span>
            </button>
          </div>


          {/* ── Mon contexte mémorisé ─────────────────────────────────────── */}
          {isReady && (context.voiture || context.preferences || context.trajet || context.sinistre) && (
            <div className="dash-card dash-card-full">
              <h2>🧠 Mon contexte mémorisé</h2>
              <p style={{ fontSize: '0.82rem', color: 'var(--color-text-soft)', marginBottom: 18 }}>
                Ces données sont pré-remplies automatiquement dans les outils. Modifiez-les ou effacez-les à tout moment.
              </p>
              <div style={{ display: 'grid', gap: 14, gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))' }}>

                {/* Voiture principale */}
                {context.voiture && (
                  <div style={{ background: 'var(--color-bg-alt)', borderRadius: 12, padding: '14px 16px', border: '1px solid var(--color-border)' }}>
                    <div style={{ fontWeight: 700, fontSize: '0.88rem', marginBottom: 10 }}>🚗 Voiture principale</div>
                    <div style={{ fontSize: '0.82rem', color: 'var(--color-text-soft)', lineHeight: 1.7 }}>
                      {context.voiture.marque && <div><strong>Marque :</strong> {context.voiture.marque}</div>}
                      {context.voiture.modele && <div><strong>Modèle :</strong> {context.voiture.modele}</div>}
                      <div><strong>Motorisation :</strong> {context.voiture.motorisation}</div>
                      {context.voiture.autonomie_km && <div><strong>Autonomie :</strong> {context.voiture.autonomie_km} km</div>}
                    </div>
                    <div style={{ marginTop: 10 }}>
                      <select
                        value={context.voiture.motorisation}
                        onChange={e => updateVoiture({ motorisation: e.target.value as any })}
                        style={{ fontSize: '0.78rem', padding: '4px 8px', borderRadius: 6, border: '1px solid var(--color-border)', background: 'var(--color-bg-card)', color: 'var(--color-text)', cursor: 'pointer' }}
                      >
                        {['BEV','PHEV','Hybride','Essence','Diesel','GNV'].map(m => <option key={m} value={m}>{m}</option>)}
                      </select>
                    </div>
                  </div>
                )}

                {/* Préférences pays */}
                {context.preferences && (
                  <div style={{ background: 'var(--color-bg-alt)', borderRadius: 12, padding: '14px 16px', border: '1px solid var(--color-border)' }}>
                    <div style={{ fontWeight: 700, fontSize: '0.88rem', marginBottom: 10 }}>⚙️ Préférences</div>
                    <div style={{ fontSize: '0.82rem', color: 'var(--color-text-soft)', lineHeight: 1.7 }}>
                      <div><strong>Pays :</strong> {context.preferences.pays}</div>
                      {context.voiture?.carte_recharge && <div><strong>Carte recharge :</strong> {context.voiture.carte_recharge}</div>}
                    </div>
                    <div style={{ marginTop: 10 }}>
                      <select
                        value={context.preferences.pays}
                        onChange={e => updatePreferences({ pays: e.target.value as any })}
                        style={{ fontSize: '0.78rem', padding: '4px 8px', borderRadius: 6, border: '1px solid var(--color-border)', background: 'var(--color-bg-card)', color: 'var(--color-text)', cursor: 'pointer' }}
                      >
                        {[['FR','🇫🇷 France'],['BE','🇧🇪 Belgique'],['CH','🇨🇭 Suisse'],['CA','🇨🇦 Canada']].map(([v,l]) => <option key={v} value={v}>{l}</option>)}
                      </select>
                    </div>
                  </div>
                )}

                {/* Trajet mémorisé */}
                {context.trajet && (
                  <div style={{ background: 'var(--color-bg-alt)', borderRadius: 12, padding: '14px 16px', border: '1px solid var(--color-border)' }}>
                    <div style={{ fontWeight: 700, fontSize: '0.88rem', marginBottom: 10 }}>🗺️ Trajet planifié</div>
                    <div style={{ fontSize: '0.82rem', color: 'var(--color-text-soft)', lineHeight: 1.7 }}>
                      <div><strong>Départ :</strong> {context.trajet.depart}</div>
                      <div><strong>Arrivée :</strong> {context.trajet.arrivee}</div>
                      <div><strong>Date :</strong> {context.trajet.date_depart}</div>
                      <div style={{ fontSize: '0.75rem', opacity: 0.7 }}>Expire après cette date</div>
                    </div>
                    <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
                      <Link href="/comparer-trajet" style={{ fontSize: '0.78rem', padding: '5px 12px', borderRadius: 6, background: 'var(--color-primary)', color: '#0a1628', fontWeight: 700, textDecoration: 'none' }}>
                        Revoir ce trajet →
                      </Link>
                      <button onClick={() => resetTrajet()} style={{ fontSize: '0.78rem', padding: '5px 12px', borderRadius: 6, border: '1px solid var(--color-border)', background: 'transparent', color: 'var(--color-text-soft)', cursor: 'pointer' }}>
                        ✕ Effacer
                      </button>
                    </div>
                  </div>
                )}

                {/* Sinistre */}
                {context.sinistre && (
                  <div style={{ background: sinExpire ? 'rgba(245,158,11,0.06)' : 'var(--color-bg-alt)', borderRadius: 12, padding: '14px 16px', border: `1px solid ${sinExpire ? 'rgba(245,158,11,0.35)' : 'var(--color-border)'}` }}>
                    <div style={{ fontWeight: 700, fontSize: '0.88rem', marginBottom: 6, color: sinExpire ? '#f59e0b' : 'inherit' }}>
                      📋 Constat en cours {sinExpire && '⚠️ expire bientôt'}
                    </div>
                    <div style={{ fontSize: '0.82rem', color: 'var(--color-text-soft)', lineHeight: 1.7 }}>
                      {context.sinistre.date_sinistre && <div>Déclaré le : {new Date(context.sinistre.date_sinistre).toLocaleDateString('fr-FR')}</div>}
                      {context.sinistre.expires_at && <div>Expire le : {new Date(context.sinistre.expires_at).toLocaleDateString('fr-FR')}</div>}
                    </div>
                    <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
                      <Link href="/constat" style={{ fontSize: '0.78rem', padding: '5px 12px', borderRadius: 6, background: '#ef4444', color: '#fff', fontWeight: 700, textDecoration: 'none' }}>
                        Reprendre le constat →
                      </Link>
                      <button onClick={() => resetSinistre()} style={{ fontSize: '0.78rem', padding: '5px 12px', borderRadius: 6, border: '1px solid var(--color-border)', background: 'transparent', color: 'var(--color-text-soft)', cursor: 'pointer' }}>
                        ✕ Clôturer
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div style={{ marginTop: 18, paddingTop: 14, borderTop: '1px solid var(--color-border)' }}>
                <button
                  onClick={() => { if (confirm('Effacer toutes les données mémorisées ?')) resetAll() }}
                  style={{ fontSize: '0.78rem', padding: '6px 14px', borderRadius: 8, border: '1px solid rgba(239,68,68,0.35)', background: 'rgba(239,68,68,0.06)', color: '#ef4444', cursor: 'pointer', fontWeight: 600 }}
                >
                  🗑️ Tout effacer
                </button>
              </div>
            </div>
          )}

          {/* Articles récents */}
          <div className="dash-card dash-card-full">
            <h2>📰 Articles récents pour vous</h2>
            {articles.length === 0 ? (
              <p style={{ color: 'var(--color-text-soft)' }}>Aucun article récent pour votre profil.</p>
            ) : (
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {articles.map(a => (
                  <li key={a.slug} style={{ padding: '12px 0', borderBottom: '1px solid var(--color-border)' }}>
                    <Link href={`/article/${a.slug}`} style={{ fontWeight: 600, color: 'var(--color-text)' }}>
                      {a.titre_provisoire}
                    </Link>
                    {a.resume_50mots && <p style={{ margin: '4px 0 0', color: 'var(--color-text-soft)', fontSize: '0.85rem' }}>{a.resume_50mots}</p>}
                  </li>
                ))}
              </ul>
            )}
            <div style={{ marginTop: 20 }}>
              <Link href="/articles" className="btn btn-secondary btn-sm">Voir tous les décryptages →</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
