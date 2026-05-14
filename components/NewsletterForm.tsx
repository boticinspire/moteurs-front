'use client'

import { useState } from 'react'
import { createClient } from '@supabase/supabase-js'

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function NewsletterForm() {
  const [email, setEmail]     = useState('')
  const [consent, setConsent] = useState(false)
  const [status, setStatus]   = useState<'idle' | 'loading' | 'ok' | 'error'>('idle')
  const [msg, setMsg]         = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!consent) { setMsg('Veuillez cocher la case de consentement.'); setStatus('error'); return }
    setStatus('loading')

    const { error } = await sb.from('leads').insert({
      email,
      source_lead: 'newsletter',
      message: `Consentement RGPD donné le ${new Date().toISOString()}`,
    })

    if (error) {
      setStatus('error')
      setMsg(error.code === '23505' ? 'Vous êtes déjà inscrit·e !' : 'Erreur — réessayez dans quelques instants.')
    } else {
      setStatus('ok')
      setEmail('')
      setConsent(false)
    }
  }

  if (status === 'ok') return (
    <p style={{ color: '#10b981', fontWeight: 600, fontSize: '1.05rem', textAlign: 'center' }}>
      ✓ Inscription confirmée ! Vous recevrez votre première veille vendredi.
    </p>
  )

  return (
    <div style={{ maxWidth: 520, margin: '0 auto' }}>
      <form className="newsletter-form" onSubmit={handleSubmit} style={{ marginBottom: 12 }}>
        <input
          type="email"
          placeholder="votre@email.fr"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
          disabled={status === 'loading'}
        />
        <button type="submit" disabled={status === 'loading' || !email || !consent}>
          {status === 'loading' ? 'Envoi…' : "S'inscrire"}
        </button>
      </form>

      {/* Consentement RGPD — en dehors du flex pour aller sur toute la largeur */}
      <label style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 8,
        fontSize: '0.75rem',
        color: 'rgba(255,255,255,0.65)',
        cursor: 'pointer',
        lineHeight: 1.5,
        textAlign: 'left',
      }}>
        <input
          type="checkbox"
          checked={consent}
          onChange={e => setConsent(e.target.checked)}
          style={{ marginTop: 3, flexShrink: 0 }}
        />
        <span>
          J&apos;accepte de recevoir la veille hebdomadaire de Moteurs.com. Email uniquement,
          sans partage tiers. Désinscription en 1 clic. Droits d&apos;accès, rectification
          et suppression garantis (RGPD).
        </span>
      </label>

      {status === 'error' && (
        <p style={{ color: '#fca5a5', fontSize: '0.82rem', marginTop: 8, textAlign: 'center' }}>
          {msg}
        </p>
      )}
    </div>
  )
}
