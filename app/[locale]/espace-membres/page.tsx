'use client'

import { useEffect, useState } from 'react'
import { Link } from '@/i18n/navigation'
import { useUserContext } from '@/context/UserContextProvider'
import { getSupabaseClient } from '@/lib/user-context'
import {
  listConstats, deleteConstat,
  type ConstatMembreItem,
} from '@/lib/constats-membres'

const sb = getSupabaseClient()

type Profil = {
  prenom: string
  type_profil: string
  pays: string
  cible_preferee: '' | 'particulier' | 'pro'
}

type Installateur = {
  id:      string
  nom:     string
  formule: 'abonnement' | 'cpl'
}

type LeadItem = {
  id:                 string
  type_projet:        string
  puissance_kw:       number | null
  pays:               string
  code_postal:        string
  nom_contact:        string
  email_contact:      string
  telephone_contact:  string | null
  message:            string | null
  statut:             string
  created_at:         string
}

type Alerte = {
  id?: number
  pays: string[]
  segments: string[]
  mots_cles: string
  actif: boolean
}

export default function EspaceMembresPage() {
  // Auth et contexte viennent exclusivement du Provider global
  // → zéro onAuthStateChange ni getSession() ici, plus de double _recoverAndRefresh
  const {
    context,
    userId, userEmail,
    updateVoiture, updateConducteur, updateAssurance, updatePreferences,
    resetTrajet, resetSinistre, resetAll,
    signOut,
    sinistreExpireSoon: sinExpire,
  } = useUserContext()

  // mounted : 1er render SSR + 1er render client = meme HTML (placeholder vide)
  // -> zero risque de mismatch d'hydratation React 18 / Next.js 15
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])

  const [email, setEmail]       = useState('')
  const [sending, setSending]   = useState(false)
  const [status, setStatus]     = useState<{ msg: string; ok: boolean } | null>(null)
  const [profil, setProfil]     = useState<Profil>({ prenom: '', type_profil: 'B2B', pays: 'FR', cible_preferee: '' })
  const [alerte, setAlerte]     = useState<Alerte>({ pays: ['FR'], segments: [], mots_cles: '', actif: true })
  const [saveStatus, setSaveStatus] = useState('')
  const [articles, setArticles] = useState<any[]>([])

  // ── Form "Mon profil personnel" (conducteur + assurance + immatriculation) ──
  const [profilPerso, setProfilPerso] = useState({
    nom:               '',
    prenom:            '',
    adresse:           '',
    telephone:         '',
    immatriculation:   '',
    assurance_nom:     '',
    numero_police:     '',
    agence:            '',
    assurance_tel:     '',
  })
  const [profilPersoStatus, setProfilPersoStatus] = useState('')

  // Initialise le form depuis le contexte (au montage + à chaque update)
  useEffect(() => {
    setProfilPerso({
      nom:             context.conducteur?.nom            ?? '',
      prenom:          context.conducteur?.prenom         ?? '',
      adresse:         context.conducteur?.adresse        ?? '',
      telephone:       context.conducteur?.telephone      ?? '',
      immatriculation: context.voiture?.immatriculation   ?? '',
      assurance_nom:   context.assurance?.nom_assureur    ?? '',
      numero_police:   context.assurance?.numero_police   ?? '',
      agence:          context.assurance?.agence          ?? '',
      assurance_tel:   context.assurance?.telephone       ?? '',
    })
  }, [context.conducteur, context.voiture?.immatriculation, context.assurance])

  const sauvegarderProfilPerso = () => {
    setProfilPersoStatus('Enregistrement…')
    updateConducteur({
      nom:       profilPerso.nom.trim()       || undefined,
      prenom:    profilPerso.prenom.trim()    || undefined,
      adresse:   profilPerso.adresse.trim()   || undefined,
      telephone: profilPerso.telephone.trim() || undefined,
      email:     userEmail ?? undefined,
    })
    updateAssurance({
      nom_assureur:  profilPerso.assurance_nom.trim() || undefined,
      numero_police: profilPerso.numero_police.trim() || undefined,
      agence:        profilPerso.agence.trim()        || undefined,
      telephone:     profilPerso.assurance_tel.trim() || undefined,
    })
    // Mise à jour immatriculation dans le voiture existant
    updateVoiture({
      ...(context.voiture ?? {}),
      immatriculation: profilPerso.immatriculation.trim() || undefined,
    })
    setTimeout(() => setProfilPersoStatus('✓ Enregistré'), 100)
    setTimeout(() => setProfilPersoStatus(''), 2500)
  }

  // ── Liste des constats sauvegardés ──
  const [constatsList,   setConstatsList]   = useState<ConstatMembreItem[]>([])
  const [constatsLoaded, setConstatsLoaded] = useState(false)

  // Espace pro installateur
  const [installateur, setInstallateur] = useState<Installateur | null>(null)
  const [leadsItems,   setLeadsItems]   = useState<LeadItem[]>([])
  const [leadsLoaded,  setLeadsLoaded]  = useState(false)
  const chargerConstats = async () => {
    if (!userId) return
    const list = await listConstats(userId)
    setConstatsList(list)
    setConstatsLoaded(true)
  }
  const supprimerConstat = async (id: string) => {
    if (!userId) return
    if (!confirm('Supprimer définitivement ce constat ?')) return
    const ok = await deleteConstat(userId, id)
    if (ok) setConstatsList(prev => prev.filter(c => c.id !== id))
  }
  useEffect(() => {
    if (userId) chargerConstats()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId])

  // Charger les données dès que l'utilisateur est identifié
  useEffect(() => {
    if (userId) chargerDonnees(userId)
  }, [userId])

  // Fetch helper : bypass SDK Supabase (qui stalle sur navigator.locks au 1er render)
  async function pgFetch(path: string): Promise<any[]> {
    const token = getAccessToken()
    const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/${path}`
    const res = await fetch(url, {
      headers: {
        'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
      },
    })
    if (!res.ok) {
      console.warn('[chargerDonnees] HTTP', res.status, path)
      return []
    }
    return res.json()
  }

  async function chargerDonnees(userId: string) {
    console.log('[chargerDonnees] START userId=', userId)
    // Profil
    const profils = await pgFetch(`profils_membres?select=*&id=eq.${userId}`)
    const p = profils[0]
    if (p) setProfil({ prenom: p.prenom || '', type_profil: p.profil_type || 'B2B', pays: p.pays || 'FR', cible_preferee: (p.cible_preferee as ''|'particulier'|'pro') || '' })

    // Alertes
    const alertes = await pgFetch(`alertes_utilisateurs?select=*&user_id=eq.${userId}`)
    const a = alertes[0]
    if (a) setAlerte({
      id: a.id,
      pays: a.pays || ['FR'],
      segments: a.segments || [],
      mots_cles: (a.mots_cles || []).join(', '),
      actif: a.actif !== false,
    })

    // Articles récents selon profil
    const paysUser = p?.pays || 'FR'
    const ciblePref = (p?.cible_preferee as ''|'particulier'|'pro') || ''
    const cibleFilter = ciblePref
      ? `&cible=in.(${ciblePref},mixte)`
      : ''
    const arts = await pgFetch(`articles?select=slug,titre_provisoire,resume_50mots,published_at,cible&etat_code=eq.PUBLIE&pays_cible=eq.${paysUser}${cibleFilter}&order=published_at.desc&limit=5`)
    if (arts) setArticles(arts)
    // Espace pro : vérifier si cet email est un installateur partenaire
    if (userEmail) {
      const emailEnc = encodeURIComponent(userEmail)
      const instRows = await pgFetch(`installateurs?email=eq.${emailEnc}&actif=eq.true&select=id,nom,formule`)
      if (instRows.length > 0) {
        const inst = instRows[0]
        setInstallateur({ id: inst.id, nom: inst.nom, formule: inst.formule ?? 'abonnement' })
        // Leads adressés à cet installateur (RLS vérifie le JWT)
        const leadsData = await pgFetch(`leads_installateurs?installateur_ids=cs.%7B${inst.id}%7D&order=created_at.desc&limit=50`)
        setLeadsItems(leadsData)
      }
      setLeadsLoaded(true)
    }
    console.log('[chargerDonnees] DONE')
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

  // Récupère le token JWT depuis localStorage (clé sb-moteurs-auth) sans passer par sb.auth.getSession()
  // (qui peut rester bloqué sur navigator.locks malgré le bypass)
  function getAccessToken(): string | null {
    try {
      const raw = localStorage.getItem('sb-moteurs-auth')
      if (!raw) return null
      const parsed = JSON.parse(raw)
      return parsed?.access_token || parsed?.currentSession?.access_token || null
    } catch { return null }
  }

  async function mettreAJourStatutLead(leadId: string, statut: string) {
    const token = getAccessToken()
    if (!token) return
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/leads_installateurs?id=eq.${leadId}`,
      {
        method:  'PATCH',
        headers: {
          'apikey':        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          'Authorization': `Bearer ${token}`,
          'Content-Type':  'application/json',
          'Prefer':        'return=minimal',
        },
        body: JSON.stringify({ statut }),
      }
    )
    if (res.ok) {
      setLeadsItems(prev => prev.map(l => l.id === leadId ? { ...l, statut } : l))
    }
  }

  async function sauvegarderProfil() {
    console.log('[profil save] START userId=', userId, 'profil=', profil)
    if (!userId) { console.warn('[profil save] userId NULL, abort'); return }
    setSaveStatus('…')
    try {
      // FETCH DIRECT vers PostgREST (bypass complet le SDK Supabase qui bloque)
      const token = getAccessToken()
      const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/profils_membres?on_conflict=id`
      const body = {
        id: userId,
        email: userEmail,
        prenom: profil.prenom,
        profil_type: profil.type_profil,
        pays: profil.pays,
        cible_preferee: profil.cible_preferee || null,
      }
      console.log('[profil save] fetch direct AVANT, token present=', !!token)
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Prefer': 'resolution=merge-duplicates,return=minimal',
        },
        body: JSON.stringify(body),
      })
      console.log('[profil save] fetch APRES, status=', res.status)
      if (!res.ok) {
        const errText = await res.text()
        console.error('[profil save] HTTP error:', res.status, errText)
        setSaveStatus(`✗ HTTP ${res.status}`)
      } else {
        console.log('[profil save] OK')
        setSaveStatus('✓ Enregistré')
        chargerDonnees(userId)
      }
    } catch (e: any) {
      console.error('[profil save] EXCEPTION:', e)
      setSaveStatus(`✗ ${(e?.message || 'exception').slice(0, 40)}`)
    }
    setTimeout(() => setSaveStatus(''), 4000)
  }

  async function sauvegarderAlerte() {
    if (!userId) return
    setSaveStatus('…')
    const mots_cles = alerte.mots_cles.split(',').map(s => s.trim()).filter(Boolean)
    const payload: any = {
      user_id: userId,
      email: userEmail,            // NOT NULL dans le schema
      pays: alerte.pays,
      segments: alerte.segments,
      mots_cles,
      actif: alerte.actif,
    }
    if (alerte.id) payload.id = alerte.id

    try {
      const token = getAccessToken()
      const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/alertes_utilisateurs?on_conflict=user_id`
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Prefer': 'resolution=merge-duplicates,return=minimal',
        },
        body: JSON.stringify(payload),
      })
      console.log('[alerte save] fetch APRES, status=', res.status)
      if (!res.ok) {
        const errText = await res.text()
        console.error('[alerte save] HTTP error:', res.status, errText)
        setSaveStatus(`✗ HTTP ${res.status}`)
      } else {
        console.log('[alerte save] OK')
        setSaveStatus('✓ Enregistré')
      }
    } catch (e: any) {
      console.error('[alerte save] EXCEPTION:', e)
      setSaveStatus(`✗ ${(e?.message || 'exception').slice(0, 40)}`)
    }
    setTimeout(() => setSaveStatus(''), 4000)
  }

  async function seDeconnecter() {
    // signOut() du SDK peut bloquer sur navigator.locks — on clear directement le localStorage
    try {
      localStorage.removeItem('sb-moteurs-auth')
      localStorage.removeItem('moteurs_user_context')
    } catch {}
    // Tente quand même un signOut() en arrière-plan, sans attendre
    signOut().catch(() => {})
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

  // Avant mount client : afficher la structure du formulaire en SSR pour les crawlers
  // (disabled -> aucune interaction possible, pas de mismatch d'hydratation)
  if (!mounted) return (
    <div className="membre-wrapper">
      <div className="login-card">
        <div className="logo-sm">Moteurs<span>.com</span></div>
        <h1>Votre espace personnel</h1>
        <p>Alertes sur mesure, articles selon votre profil, simulateur sauvegardé.</p>
        <input className="login-input" type="email" placeholder="votre@email.pro" disabled />
        <button className="btn-login" disabled>Recevoir le lien de connexion →</button>
        <div className="login-divider">Connexion sans mot de passe — lien valable 1h</div>
        <p style={{ fontSize: '0.75rem', color: 'var(--color-text-soft)' }}>Vos données ne sont jamais revendues.</p>
      </div>
    </div>
  )

  // ── VUE LOGIN ──
  if (!userId) return (
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
  const prenom = profil.prenom || (userEmail ?? '').split('@')[0]
  const PAYS_LIST = [{ v: 'FR', l: 'France' }, { v: 'BE', l: 'Belgique' }, { v: 'CH', l: 'Suisse' }, { v: 'CA', l: 'Canada' }]
  const SEG_LIST = [{ v: 'B2B', l: 'B2B / Flottes' }, { v: 'Particulier', l: 'Particuliers' }, { v: 'ZFE', l: 'ZFE' }, { v: 'Aides', l: 'Aides & Fiscalité' }]

  return (
    <div className="membre-wrapper">
      <div className="dashboard">
        <div className="dashboard-header">
          <div>
            <h1>👋 Bonjour {prenom} !</h1>
            <div className="user-info">{userEmail}</div>
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
              <label>Mes décryptages préférés</label>
              <select
                value={profil.cible_preferee}
                onChange={e => setProfil(p => ({ ...p, cible_preferee: e.target.value as ''|'particulier'|'pro' }))}
              >
                <option value="">Tous (pas de préférence)</option>
                <option value="particulier">👥 Plutôt pour les particuliers</option>
                <option value="pro">🏢 Plutôt pour les pros</option>
              </select>
              <p style={{ fontSize: '0.74rem', color: 'var(--color-text-soft)', marginTop: 4 }}>
                Sert à filtrer votre feed et vos alertes. Les décryptages «&nbsp;mixtes&nbsp;» restent affichés dans tous les cas.
              </p>
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


          {/* ── Mon profil personnel (pré-remplit le constat amiable) ─────── */}
          <div className="dash-card dash-card-full">
            <h2>🪪 Mon profil personnel</h2>
            <p style={{ fontSize: '0.82rem', color: 'var(--color-text-soft)', marginBottom: 18 }}>
              Ces données pré-remplissent automatiquement le constat amiable et autres formulaires. Modifiables à tout moment.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12, marginBottom: 14 }}>
              {[
                { key: 'nom',             label: 'Nom',                placeholder: 'Dupont' },
                { key: 'prenom',          label: 'Prénom',             placeholder: 'Jean' },
                { key: 'adresse',         label: 'Adresse complète',   placeholder: '12 rue de la Paix, 75001 Paris' },
                { key: 'telephone',       label: 'Téléphone',          placeholder: '+33 6 12 34 56 78' },
                { key: 'immatriculation', label: 'Immatriculation',    placeholder: 'AB-123-CD' },
                { key: 'assurance_nom',   label: 'Nom de l\'assureur', placeholder: 'AXA, MAAF, Allianz…' },
                { key: 'numero_police',   label: 'N° de police',       placeholder: '123456789' },
                { key: 'agence',          label: 'Agence / Contrat',   placeholder: 'Agence Paris Centre' },
                { key: 'assurance_tel',   label: 'Tél. assurance',     placeholder: '+33 1 …' },
              ].map(({ key, label, placeholder }) => (
                <div key={key}>
                  <label style={{ display: 'block', fontWeight: 600, fontSize: '0.78rem', marginBottom: 4, color: 'var(--color-text-soft)' }}>{label}</label>
                  <input
                    type="text"
                    placeholder={placeholder}
                    value={profilPerso[key as keyof typeof profilPerso]}
                    onChange={e => setProfilPerso(p => ({ ...p, [key]: e.target.value }))}
                    style={{
                      width: '100%', boxSizing: 'border-box',
                      padding: '8px 11px', borderRadius: 7, fontSize: '0.86rem',
                      background: 'var(--color-bg-alt)', color: 'var(--color-text)',
                      border: '1.5px solid var(--color-border)', outline: 'none',
                    }}
                  />
                </div>
              ))}
            </div>
            <button className="btn-save" onClick={sauvegarderProfilPerso}>
              Enregistrer <span className="save-status">{profilPersoStatus}</span>
            </button>
            <p style={{ marginTop: 10, fontSize: '0.74rem', color: 'var(--color-text-soft)' }}>
              💡 L&apos;email du conducteur est récupéré de votre compte ({userEmail || '—'}).
            </p>
          </div>

          {/* ── Espace pro : Mes leads (visible si installateur partenaire) ── */}
          {leadsLoaded && installateur && (
            <div className="dash-card dash-card-full">
              <h2>⚡ Mes leads — {installateur.nom}</h2>
              <p style={{ fontSize: '0.82rem', color: 'var(--color-text-soft)', marginBottom: 16 }}>
                Leads reçus via Moteurs.com · Formule&nbsp;
                <strong>{installateur.formule === 'cpl' ? 'Paiement au lead' : 'Abonnement mensuel'}</strong>
              </p>

              {/* Résumé mois en cours */}
              {(() => {
                const now = new Date()
                const debutMois = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
                const leadsMonth = leadsItems.filter(l => l.created_at >= debutMois)
                const convertis = leadsMonth.filter(l => l.statut === 'CONVERTI').length
                return leadsMonth.length > 0 ? (
                  <div style={{ display: 'flex', gap: 16, marginBottom: 20, flexWrap: 'wrap' }}>
                    {[
                      { label: 'Leads ce mois', val: leadsMonth.length, color: 'var(--color-primary)' },
                      { label: 'Convertis',     val: convertis,          color: '#10b981' },
                      { label: 'Taux convers.', val: leadsMonth.length ? `${Math.round(convertis/leadsMonth.length*100)} %` : '—', color: '#f59e0b' },
                    ].map(m => (
                      <div key={m.label} style={{ background: 'var(--color-bg-alt)', border: '1px solid var(--color-border)', borderRadius: 10, padding: '10px 18px', textAlign: 'center', minWidth: 110 }}>
                        <div style={{ fontSize: '1.4rem', fontWeight: 800, color: m.color }}>{m.val}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-soft)', marginTop: 2 }}>{m.label}</div>
                      </div>
                    ))}
                  </div>
                ) : null
              })()}

              {leadsItems.length === 0 ? (
                <p style={{ fontSize: '0.85rem', color: 'var(--color-text-soft)', margin: 0 }}>
                  Aucun lead reçu pour l&apos;instant. Votre profil est actif — les prochaines demandes correspondant à votre zone vous seront transmises automatiquement.
                </p>
              ) : (
                <div style={{ display: 'grid', gap: 10 }}>
                  {leadsItems.map(lead => {
                    const typeLabel: Record<string, string> = {
                      borne_maison:     '🏠 Borne domicile',
                      borne_entreprise: '🏢 Borne entreprise',
                      panneaux:         '☀️ Panneaux solaires',
                      batterie:         '🔋 Batterie stockage',
                      audit:            '📋 Audit énergétique',
                    }
                    const statutColor: Record<string, string> = {
                      NOUVEAU:  '#f59e0b',
                      TRANSMIS: '#3b82f6',
                      CONVERTI: '#10b981',
                      PERDU:    '#ef4444',
                    }
                    return (
                      <div key={lead.id} style={{ background: 'var(--color-bg-alt)', borderRadius: 10, padding: '14px 16px', border: '1px solid var(--color-border)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
                          <div style={{ flex: 1, minWidth: 200 }}>
                            <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: 4 }}>
                              {typeLabel[lead.type_projet] ?? lead.type_projet}
                              {lead.puissance_kw ? ` · ${lead.puissance_kw} kW` : ''}
                            </div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--color-text-soft)', lineHeight: 1.6 }}>
                              📍 {lead.code_postal} ({lead.pays}) · {new Date(lead.created_at).toLocaleDateString('fr-FR')}
                            </div>
                            <div style={{ fontSize: '0.8rem', marginTop: 4 }}>
                              👤 {lead.nom_contact}
                              {lead.telephone_contact ? ` · 📞 ${lead.telephone_contact}` : ''}
                            </div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--color-primary)' }}>
                              ✉️ {lead.email_contact}
                            </div>
                            {lead.message && (
                              <div style={{ fontSize: '0.78rem', color: 'var(--color-text-soft)', marginTop: 6, fontStyle: 'italic' }}>
                                &ldquo;{lead.message}&rdquo;
                              </div>
                            )}
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-end' }}>
                            <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '3px 10px', borderRadius: 999, background: `${statutColor[lead.statut] ?? '#64748b'}22`, color: statutColor[lead.statut] ?? '#64748b' }}>
                              {lead.statut}
                            </span>
                            {lead.statut !== 'CONVERTI' && lead.statut !== 'PERDU' && (
                              <div style={{ display: 'flex', gap: 6 }}>
                                <button
                                  onClick={() => mettreAJourStatutLead(lead.id, 'CONVERTI')}
                                  style={{ fontSize: '0.75rem', padding: '4px 10px', borderRadius: 6, border: 'none', background: '#10b981', color: '#fff', cursor: 'pointer', fontWeight: 700 }}
                                >
                                  ✓ Converti
                                </button>
                                <button
                                  onClick={() => mettreAJourStatutLead(lead.id, 'PERDU')}
                                  style={{ fontSize: '0.75rem', padding: '4px 10px', borderRadius: 6, border: '1px solid rgba(239,68,68,0.4)', background: 'rgba(239,68,68,0.06)', color: '#ef4444', cursor: 'pointer', fontWeight: 600 }}
                                >
                                  ✕ Perdu
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* ── Mes constats sauvegardés ───────────────────────────────────── */}
          <div className="dash-card dash-card-full">
            <h2>📋 Mes constats sauvegardés</h2>
            {!constatsLoaded && (
              <p style={{ fontSize: '0.85rem', color: 'var(--color-text-soft)' }}>Chargement…</p>
            )}
            {constatsLoaded && constatsList.length === 0 && (
              <p style={{ fontSize: '0.85rem', color: 'var(--color-text-soft)', margin: 0 }}>
                Aucun constat sauvegardé pour l&apos;instant. Quand vous compléterez un{' '}
                <Link href="/constat" style={{ color: 'var(--color-primary)', fontWeight: 700 }}>constat amiable</Link>,
                vous pourrez le stocker dans cet espace.
              </p>
            )}
            {constatsList.length > 0 && (
              <div style={{ display: 'grid', gap: 10 }}>
                {constatsList.map(c => (
                  <div key={c.id} style={{
                    background: 'var(--color-bg-alt)', borderRadius: 10,
                    padding: '12px 14px', border: '1px solid var(--color-border)',
                    display: 'grid', gridTemplateColumns: '1fr auto', gap: 10, alignItems: 'center',
                  }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: 3 }}>
                        🚗 {c.vehicule_a_immat || '—'} contre {c.vehicule_b_immat || '—'}
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--color-text-soft)' }}>
                        {c.date_accident || '—'} {c.lieu ? `· ${c.lieu}` : ''} {c.pays ? `· ${c.pays}` : ''}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <Link
                        href={`/constat?id=${c.id}`}
                        style={{
                          padding: '6px 12px', borderRadius: 6,
                          background: 'var(--color-primary)', color: '#0a1628',
                          fontWeight: 700, fontSize: '0.78rem', textDecoration: 'none',
                        }}
                      >
                        Voir →
                      </Link>
                      <button
                        onClick={() => supprimerConstat(c.id)}
                        style={{
                          padding: '6px 10px', borderRadius: 6, border: '1px solid rgba(239,68,68,0.35)',
                          background: 'rgba(239,68,68,0.06)', color: '#ef4444',
                          fontSize: '0.78rem', cursor: 'pointer', fontWeight: 600,
                        }}
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── Mon contexte mémorisé ─────────────────────────────────────── */}
          {(context.voiture || context.preferences || context.trajet || context.sinistre) && (
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
