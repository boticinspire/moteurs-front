'use client'

import { useState } from 'react'
import { createClient } from '@supabase/supabase-js'

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function NewsletterForm() {
  const [email, setEmail]       = useState('')
  const [consent, setConsent]   = useState(false)
  const [status, setStatus]     = useState<'idle' | 'loading' | 'ok' | 'error'>('idle')
  const [msg, setMsg]           = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!consent) { setMsg('Veuillez accepter la politique de confidentialité.'); setStatus('error'); return }
    setStatus('loading')

    const { error } = await sb.from('leads').insert({
      email,
      source: 'newsletter',
      segment: 'newsletter',
      notes: `Inscription newsletter — consentement RGPD donné le ${new Date().toISOString()}`,
      statut: 'nouveau',
    })

    if (error) {
      // Doublon = déjà inscrit
      if (error.code === '23505') {
        setStatus('ok')
        setMsg('Vous êtes déjà inscrit·e à notre veille hebdomadaire.')
      } else {
        setStatus('error')
        setMsg('Une erreur est survenue. Réessayez dans quelques instants.')
      }
    } else {
      setStatus('ok')
      setMsg('✓ Inscription confirmée ! Vous recevrez votre première veille vendredi.')
      setEmail('')
      setConsent(false)
    }
  }

  if (status === 'ok') return (
    <p style={{ color: '#10b981', fontWeight: 600, fontSize: '1rem', margin: 0 }}>
      {msg}
    </p>
  )

  return (
    <form className="newsletter-form" onSubmit={handleSubmit}>
      <input
        type="email"
        placeholder="votre@email.fr"
        value={email}
        onChange={e => setEmail(e.target.value)}
        required
        disabled={status === 'loading'}
      />
      <button type="submit" disabled={status === 'loading' || !email}>
        {status === 'loading' ? 'Envoi…' : "S'inscrire"}
      </button>

      {/* Consentement RGPD */}
      <div style={{
        gridColumn: '1 / -1',
        display: 'flex',
        alignItems: 'flex-start',
        gap: 10,
        marginTop: 8,
        fontSize: '0.78rem',
        color: 'rgba(255,255,255,0.7)',
        textAlign: 'left',
      }}>
        <input
          type="checkbox"
          id="rgpd-consent"
          checked={consent}
          onChange={e => setConsent(e.target.checked)}
          required
          style={{ marginTop: 2, flexShrink: 0, cursor: 'pointer' }}
        />
        <label htmlFor="rgpd-consent" style={{ cursor: 'pointer', lineHeight: 1.4 }}>
          J&apos;accepte de recevoir la veille hebdomadaire de Moteurs.com. Mes données (email uniquement)
          sont utilisées exclusivement à cette fin, sans partage avec des tiers.
          Désinscription en 1 clic à tout moment. Conformément au RGPD, je dispose d&apos;un droit
          d&apos;accès, de rectification et de suppression.
        </label>
      </div>

      {status === 'error' && (
        <p style={{ gridColumn: '1 / -1', color: '#fca5a5', fontSize: '0.82rem', margin: '4px 0 0' }}>
          {msg}
        </p>
      )}
    </form>
  )
}
