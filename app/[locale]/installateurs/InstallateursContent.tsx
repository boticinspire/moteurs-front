'use client'

/**
 * Moteurs.com — InstallateursContent
 *
 * 1. Hero avec formulaire de demande de devis (lead)
 * 2. Annuaire des installateurs actifs (lecture Supabase anon)
 *
 * Aucune authentification requise — formulaire public.
 */

import { useState, useEffect, useCallback } from 'react'
import { Link } from '@/i18n/navigation'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Installateur {
  id: string
  nom: string
  telephone: string | null
  pays: string[]
  regions: string[]
  codes_postaux: string[]
  specialites: string[]
  certifications: string[]
}

interface LeadForm {
  type_projet: string
  puissance_kw: string
  pays: string
  code_postal: string
  nom_contact: string
  email_contact: string
  telephone_contact: string
  message: string
}

// ─── Constantes ───────────────────────────────────────────────────────────────

const SUPABASE_URL      = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''

const TYPES_PROJET = [
  { value: 'borne_maison',     label: 'Borne de recharge (domicile)',    icon: '🏠' },
  { value: 'borne_entreprise', label: 'Borne de recharge (entreprise)',  icon: '🏢' },
  { value: 'panneaux',         label: 'Panneaux solaires',               icon: '☀️' },
  { value: 'batterie',         label: 'Batterie de stockage',            icon: '🔋' },
  { value: 'audit',            label: 'Audit énergétique',               icon: '📋' },
]

const PAYS_OPTIONS = [
  { value: 'FR', label: '🇫🇷 France'   },
  { value: 'BE', label: '🇧🇪 Belgique' },
  { value: 'CH', label: '🇨🇭 Suisse'   },
  { value: 'LU', label: '🇱🇺 Luxembourg' },
]

const CERT_LABELS: Record<string, string> = {
  IRVE:       'IRVE',
  QualiPV:    'QualiPV',
  RGE:        'RGE',
  Qualifelec: 'Qualifelec',
}

const CERT_COLORS: Record<string, string> = {
  IRVE:       '#16a34a',
  QualiPV:    '#ca8a04',
  RGE:        '#0ea5e9',
  Qualifelec: '#8b5cf6',
}

const SPEC_LABELS: Record<string, string> = {
  borne_irve: 'Borne IRVE',
  panneaux:   'Panneaux solaires',
  batterie:   'Batterie',
  audit:      'Audit',
}

// ─── Composant badge certification ────────────────────────────────────────────

function CertBadge({ cert }: { cert: string }) {
  const color = CERT_COLORS[cert] ?? '#64748b'
  return (
    <span
      style={{
        display:       'inline-block',
        padding:       '2px 8px',
        borderRadius:  '4px',
        fontSize:      '0.72rem',
        fontWeight:    700,
        letterSpacing: '0.04em',
        color:         '#fff',
        background:    color,
        marginRight:   4,
        marginBottom:  4,
      }}
    >
      {CERT_LABELS[cert] ?? cert}
    </span>
  )
}

// ─── Composant carte installateur ─────────────────────────────────────────────

function InstCard({ inst }: { inst: Installateur }) {
  return (
    <div
      style={{
        background:   'var(--color-bg-card)',
        border:       '1px solid var(--color-border)',
        borderRadius: 'var(--radius-lg)',
        padding:      '20px 24px',
        display:      'flex',
        flexDirection:'column',
        gap:           12,
      }}
    >
      {/* Nom + pays */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0, color: 'var(--color-text)' }}>
          {inst.nom}
        </h3>
        <span style={{ fontSize: '0.8rem', color: 'var(--color-text-soft)', whiteSpace: 'nowrap' }}>
          {inst.pays.join(' · ')}
        </span>
      </div>

      {/* Spécialités */}
      {inst.specialites.length > 0 && (
        <div style={{ fontSize: '0.85rem', color: 'var(--color-text-soft)' }}>
          {inst.specialites.map((s) => SPEC_LABELS[s] ?? s).join(' · ')}
        </div>
      )}

      {/* Certifications */}
      {inst.certifications.length > 0 && (
        <div>
          {inst.certifications.map((c) => (
            <CertBadge key={c} cert={c} />
          ))}
        </div>
      )}

      {/* Zone d'intervention */}
      {inst.regions.length > 0 && (
        <div style={{ fontSize: '0.8rem', color: 'var(--color-text-soft)' }}>
          📍 {inst.regions.join(', ')}
        </div>
      )}

      {/* CTA */}
      <div style={{ marginTop: 4 }}>
        <a
          href="#demande"
          className="btn btn-primary btn-sm"
          onClick={() => {
            const el = document.getElementById('demande')
            if (el) el.scrollIntoView({ behavior: 'smooth' })
          }}
        >
          Demander un devis →
        </a>
      </div>
    </div>
  )
}

// ─── Composant principal ──────────────────────────────────────────────────────

export default function InstallateursContent() {
  const [form, setForm] = useState<LeadForm>({
    type_projet:       'borne_maison',
    puissance_kw:      '',
    pays:              'FR',
    code_postal:       '',
    nom_contact:       '',
    email_contact:     '',
    telephone_contact: '',
    message:           '',
  })
  const [sending,  setSending]  = useState(false)
  const [success,  setSuccess]  = useState(false)
  const [error,    setError]    = useState<string | null>(null)
  const [installateurCount, setInstallateurCount] = useState<number | null>(null)

  const [installateurs, setInstallateurs] = useState<Installateur[]>([])
  const [loadingInst,   setLoadingInst]   = useState(true)
  const [filterSpec,    setFilterSpec]    = useState<string>('all')
  const [filterPays,    setFilterPays]    = useState<string>('all')

  // ── Chargement annuaire ──────────────────────────────────────────────────
  const fetchInstallateurs = useCallback(async () => {
    setLoadingInst(true)
    try {
      const params = new URLSearchParams({
        actif:   'eq.true',
        select:  'id,nom,telephone,pays,regions,codes_postaux,specialites,certifications',
        order:   'nom.asc',
      })
      const res = await fetch(
        `${SUPABASE_URL}/rest/v1/installateurs?${params}`,
        {
          headers: {
            'apikey':        SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          },
        }
      )
      if (res.ok) {
        const data = await res.json()
        setInstallateurs(data)
      }
    } catch {
      // silencieux — l'annuaire reste vide
    } finally {
      setLoadingInst(false)
    }
  }, [])

  useEffect(() => { fetchInstallateurs() }, [fetchInstallateurs])

  // ── Filtrage annuaire ────────────────────────────────────────────────────
  const filtered = installateurs.filter((inst) => {
    const okSpec = filterSpec === 'all' || inst.specialites.includes(filterSpec)
    const okPays = filterPays === 'all' || inst.pays.includes(filterPays)
    return okSpec && okPays
  })

  // ── Soumission formulaire ────────────────────────────────────────────────
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSending(true)
    try {
      const res = await fetch('/api/leads-installateurs', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          puissance_kw: form.puissance_kw ? parseFloat(form.puissance_kw) : null,
          source_page:  '/installateurs',
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Erreur serveur')
      setSuccess(true)
      setInstallateurCount(data.installateurs_count ?? 0)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
    } finally {
      setSending(false)
    }
  }

  const needsPuissance = form.type_projet === 'borne_maison' || form.type_projet === 'borne_entreprise'

  // ─── Rendu ───────────────────────────────────────────────────────────────

  return (
    <div style={{ minHeight: '100vh' }}>

      {/* ── Hero ── */}
      <section className="page-hero">
        <div className="container">
          <nav className="breadcrumb" aria-label="Fil d'Ariane">
            <Link href="/">Accueil</Link>
            <span> › </span>
            <span>Installateurs certifiés</span>
          </nav>
          <h1>
            Trouvez un installateur certifié
            <span className="accent"> près de chez vous</span>
          </h1>
          <p>
            Bornes de recharge IRVE · Panneaux solaires QualiPV · Batteries de stockage ·
            Audit énergétique — devis gratuit en 24h.
          </p>
          <div className="page-hero-badges">
            <span className="page-hero-badge">✅ Certifiés RGE / IRVE</span>
            <span className="page-hero-badge">📍 France, Belgique, Suisse</span>
            <span className="page-hero-badge">⚡ Réponse sous 24h</span>
          </div>
        </div>
      </section>

      {/* ── Formulaire lead ── */}
      <section
        id="demande"
        style={{
          padding:    '56px 0',
          background: 'var(--color-bg-alt)',
        }}
      >
        <div className="container" style={{ maxWidth: 680 }}>
          <h2 className="section-title" style={{ textAlign: 'center' }}>
            Décrivez votre projet
          </h2>
          <p
            className="section-subtitle"
            style={{ textAlign: 'center', marginBottom: 36 }}
          >
            Nous identifions les installateurs certifiés qui correspondent à votre
            projet et à votre zone géographique.
          </p>

          {success ? (
            <div
              style={{
                background:   'var(--color-bg-card)',
                border:       '2px solid var(--color-primary)',
                borderRadius: 'var(--radius-lg)',
                padding:      '40px 32px',
                textAlign:    'center',
              }}
            >
              <div style={{ fontSize: '3rem', marginBottom: 16 }}>✅</div>
              <h3 style={{ fontSize: '1.4rem', marginBottom: 12 }}>
                Demande envoyée avec succès !
              </h3>
              <p style={{ color: 'var(--color-text-soft)', lineHeight: 1.6 }}>
                {installateurCount != null && installateurCount > 0
                  ? `${installateurCount} installateur${installateurCount > 1 ? 's' : ''} certifié${installateurCount > 1 ? 's ont' : ' a'} été notifié${installateurCount > 1 ? 's' : ''}. Vous recevrez leurs devis par email sous 24h.`
                  : 'Votre demande a été enregistrée. Nous la transmettrons dès qu\'un installateur partenaire sera disponible dans votre zone.'}
              </p>
              <button
                className="btn btn-secondary"
                style={{ marginTop: 24 }}
                onClick={() => { setSuccess(false); setError(null) }}
              >
                Nouvelle demande
              </button>
            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              style={{
                background:   'var(--color-bg-card)',
                border:       '1px solid var(--color-border)',
                borderRadius: 'var(--radius-lg)',
                padding:      '36px 32px',
                display:      'flex',
                flexDirection:'column',
                gap:           20,
              }}
            >
              {/* Type de projet */}
              <div className="form-group">
                <label htmlFor="type_projet">Type de projet *</label>
                <select
                  id="type_projet"
                  value={form.type_projet}
                  onChange={(e) => setForm({ ...form, type_projet: e.target.value })}
                  required
                >
                  {TYPES_PROJET.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.icon} {t.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Puissance (borne uniquement) */}
              {needsPuissance && (
                <div className="form-group">
                  <label htmlFor="puissance_kw">Puissance souhaitée (kW)</label>
                  <input
                    id="puissance_kw"
                    type="number"
                    min={3}
                    max={350}
                    step={0.1}
                    placeholder="Ex : 7.4"
                    value={form.puissance_kw}
                    onChange={(e) => setForm({ ...form, puissance_kw: e.target.value })}
                  />
                </div>
              )}

              {/* Pays + Code postal */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div className="form-group">
                  <label htmlFor="pays">Pays *</label>
                  <select
                    id="pays"
                    value={form.pays}
                    onChange={(e) => setForm({ ...form, pays: e.target.value })}
                    required
                  >
                    {PAYS_OPTIONS.map((p) => (
                      <option key={p.value} value={p.value}>{p.label}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="code_postal">Code postal *</label>
                  <input
                    id="code_postal"
                    type="text"
                    placeholder="Ex : 75011"
                    value={form.code_postal}
                    onChange={(e) => setForm({ ...form, code_postal: e.target.value })}
                    required
                    maxLength={10}
                  />
                </div>
              </div>

              {/* Nom + Email */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div className="form-group">
                  <label htmlFor="nom_contact">Nom / Société *</label>
                  <input
                    id="nom_contact"
                    type="text"
                    placeholder="Votre nom ou raison sociale"
                    value={form.nom_contact}
                    onChange={(e) => setForm({ ...form, nom_contact: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="email_contact">Email *</label>
                  <input
                    id="email_contact"
                    type="email"
                    placeholder="votre@email.com"
                    value={form.email_contact}
                    onChange={(e) => setForm({ ...form, email_contact: e.target.value })}
                    required
                  />
                </div>
              </div>

              {/* Téléphone */}
              <div className="form-group">
                <label htmlFor="telephone_contact">Téléphone</label>
                <input
                  id="telephone_contact"
                  type="tel"
                  placeholder="+33 6 00 00 00 00"
                  value={form.telephone_contact}
                  onChange={(e) => setForm({ ...form, telephone_contact: e.target.value })}
                />
              </div>

              {/* Message */}
              <div className="form-group">
                <label htmlFor="message">Précisions sur votre projet</label>
                <textarea
                  id="message"
                  rows={4}
                  placeholder="Type de logement, contraintes d'accès, délai souhaité…"
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  style={{
                    width:        '100%',
                    padding:      '10px 14px',
                    border:       '1.5px solid var(--color-border)',
                    borderRadius: 'var(--radius)',
                    background:   'var(--color-bg)',
                    color:        'var(--color-text)',
                    fontSize:     '0.9rem',
                    resize:       'vertical',
                    fontFamily:   'inherit',
                  }}
                />
              </div>

              {/* Erreur */}
              {error && (
                <div
                  style={{
                    padding:      '12px 16px',
                    background:   '#fef2f2',
                    border:       '1px solid #fca5a5',
                    borderRadius: 'var(--radius)',
                    color:        '#dc2626',
                    fontSize:     '0.9rem',
                  }}
                >
                  ⚠️ {error}
                </div>
              )}

              <button
                type="submit"
                className="btn btn-primary btn-lg"
                disabled={sending}
                style={{ width: '100%', marginTop: 4 }}
              >
                {sending ? 'Envoi en cours…' : '📩 Recevoir des devis gratuits'}
              </button>

              <p style={{ fontSize: '0.78rem', color: 'var(--color-text-soft)', textAlign: 'center', margin: 0 }}>
                Vos données sont transmises uniquement aux installateurs correspondant à
                votre projet. Aucun démarchage commercial. Conformité RGPD.
              </p>
            </form>
          )}
        </div>
      </section>

      {/* ── Annuaire des pros ── */}
      <section style={{ padding: '56px 0' }}>
        <div className="container">
          <h2 className="section-title" style={{ textAlign: 'center' }}>
            Nos installateurs partenaires
          </h2>
          <p className="section-subtitle" style={{ textAlign: 'center', marginBottom: 36 }}>
            Tous certifiés, contrôlés, actifs sur le territoire.
          </p>

          {/* Filtres */}
          <div
            style={{
              display:      'flex',
              gap:           12,
              flexWrap:     'wrap',
              justifyContent: 'center',
              marginBottom: 32,
            }}
          >
            <select
              value={filterSpec}
              onChange={(e) => setFilterSpec(e.target.value)}
              style={{
                padding:      '8px 14px',
                border:       '1.5px solid var(--color-border)',
                borderRadius: 'var(--radius)',
                background:   'var(--color-bg-card)',
                color:        'var(--color-text)',
                fontSize:     '0.9rem',
              }}
            >
              <option value="all">Toutes spécialités</option>
              {Object.entries(SPEC_LABELS).map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </select>

            <select
              value={filterPays}
              onChange={(e) => setFilterPays(e.target.value)}
              style={{
                padding:      '8px 14px',
                border:       '1.5px solid var(--color-border)',
                borderRadius: 'var(--radius)',
                background:   'var(--color-bg-card)',
                color:        'var(--color-text)',
                fontSize:     '0.9rem',
              }}
            >
              <option value="all">Tous les pays</option>
              {PAYS_OPTIONS.map((p) => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
          </div>

          {/* Grille */}
          {loadingInst ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--color-text-soft)' }}>
              Chargement de l'annuaire…
            </div>
          ) : filtered.length === 0 ? (
            <div
              style={{
                textAlign:    'center',
                padding:      '48px 24px',
                background:   'var(--color-bg-alt)',
                borderRadius: 'var(--radius-lg)',
                color:        'var(--color-text-soft)',
              }}
            >
              <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>🔍</div>
              <p style={{ marginBottom: 16 }}>
                {installateurs.length === 0
                  ? 'L\'annuaire des partenaires est en cours de constitution.'
                  : 'Aucun installateur ne correspond aux filtres sélectionnés.'}
              </p>
              <a href="#demande" className="btn btn-primary">
                Déposer une demande →
              </a>
            </div>
          ) : (
            <>
              <p
                style={{
                  fontSize: '0.85rem',
                  color: 'var(--color-text-soft)',
                  textAlign: 'center',
                  marginBottom: 24,
                }}
              >
                {filtered.length} installateur{filtered.length > 1 ? 's' : ''} trouvé{filtered.length > 1 ? 's' : ''}
              </p>
              <div
                style={{
                  display:             'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                  gap:                  20,
                }}
              >
                {filtered.map((inst) => (
                  <InstCard key={inst.id} inst={inst} />
                ))}
              </div>
            </>
          )}
        </div>
      </section>

      {/* ── Bloc confiance ── */}
      <section
        style={{
          padding:    '48px 0',
          background: 'var(--color-bg-alt)',
        }}
      >
        <div className="container">
          <div
            style={{
              display:             'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap:                  24,
              textAlign:           'center',
            }}
          >
            {[
              { icon: '🏅', title: 'Certifications vérifiées', desc: 'IRVE, RGE, QualiPV, Qualifelec — chaque partenaire est audité avant référencement.' },
              { icon: '⚡', title: 'Réponse sous 24h',         desc: 'Les installateurs matchés sont notifiés immédiatement et s\'engagent à répondre rapidement.' },
              { icon: '💶', title: 'Devis gratuit',             desc: 'Aucun frais pour obtenir plusieurs devis comparatifs. Vous choisissez librement.' },
              { icon: '🔒', title: 'Données protégées',         desc: 'Vos coordonnées ne sont transmises qu\'aux pros sélectionnés. Conformité RGPD totale.' },
            ].map((item) => (
              <div key={item.title}>
                <div style={{ fontSize: '2rem', marginBottom: 12 }}>{item.icon}</div>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 8 }}>{item.title}</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--color-text-soft)', lineHeight: 1.5 }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Vous êtes un installateur ? ── */}
      <section style={{ padding: '56px 0' }}>
        <div className="container" style={{ maxWidth: 680, textAlign: 'center' }}>
          <h2 style={{ marginBottom: 16 }}>Vous êtes un installateur certifié ?</h2>
          <p style={{ color: 'var(--color-text-soft)', lineHeight: 1.6, marginBottom: 28 }}>
            Rejoignez notre réseau et recevez des leads qualifiés dans votre zone
            d'intervention. Deux formules : abonnement mensuel ou paiement au lead.
          </p>
          <a
            href="mailto:pro@moteurs.com?subject=Référencement installateur"
            className="btn btn-accent btn-lg"
          >
            📨 Nous contacter pour rejoindre le réseau
          </a>
        </div>
      </section>

    </div>
  )
}
