'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
)

interface MembreGateProps {
  children: React.ReactNode
  /** Titre du module affiché dans la page d'invite */
  titre: string
  /** Description courte des bénéfices */
  description: string
  /** Emoji/icône du module */
  icon?: string
  /** Avantages listés */
  avantages?: string[]
}

export default function MembreGate({
  children, titre, description, icon = '🔒', avantages = [],
}: MembreGateProps) {
  const [session, setSession] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    sb.auth.getSession().then(({ data }) => {
      setSession(data.session ?? null)
      setLoading(false)
    })
    const { data: listener } = sb.auth.onAuthStateChange((_e, s) => {
      setSession(s ?? null)
      setLoading(false)
    })
    return () => listener.subscription.unsubscribe()
  }, [])

  // Chargement
  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 24px', color: 'var(--color-text-muted)' }}>
        <div style={{ fontSize: '1.5rem', marginBottom: 12 }}>⏳</div>
        Vérification de votre accès…
      </div>
    )
  }

  // Connecté → accès libre
  if (session) return <>{children}</>

  // Non connecté → page d'invite
  return (
    <div style={{ maxWidth: 560, margin: '0 auto', padding: '16px 0 48px' }}>
      <div style={{
        background: 'var(--color-bg-card)',
        border: '1.5px solid var(--color-border)',
        borderRadius: 20, overflow: 'hidden',
        textAlign: 'center',
      }}>
        {/* Bandeau haut */}
        <div style={{
          padding: '32px 32px 24px',
          background: 'linear-gradient(135deg, rgba(14,165,233,0.08) 0%, rgba(122,240,194,0.08) 100%)',
          borderBottom: '1px solid var(--color-border)',
        }}>
          <div style={{ fontSize: '3rem', marginBottom: 16 }}>{icon}</div>
          <div style={{
            display: 'inline-block', marginBottom: 14,
            fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.08em',
            padding: '4px 12px', borderRadius: 20,
            background: 'rgba(14,165,233,0.12)', color: 'var(--color-primary)',
            border: '1px solid rgba(14,165,233,0.25)',
            textTransform: 'uppercase',
          }}>
            Réservé aux membres
          </div>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: 10 }}>{titre}</h2>
          <p style={{ fontSize: '0.92rem', color: 'var(--color-text-muted)', lineHeight: 1.6, margin: 0 }}>
            {description}
          </p>
        </div>

        {/* Corps */}
        <div style={{ padding: '24px 32px 32px' }}>
          {avantages.length > 0 && (
            <div style={{ marginBottom: 24, textAlign: 'left' }}>
              <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--color-text-muted)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Ce module inclut
              </div>
              {avantages.map((a, i) => (
                <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 8, fontSize: '0.88rem', color: 'var(--color-text)' }}>
                  <span style={{ color: 'var(--color-primary)', fontWeight: 700, flexShrink: 0, marginTop: 1 }}>✓</span>
                  {a}
                </div>
              ))}
            </div>
          )}

          {/* CTA principal */}
          <a
            href={`/espace-membres?redirect=${typeof window !== 'undefined' ? encodeURIComponent(window.location.pathname) : ''}`}
            style={{
              display: 'block', width: '100%', padding: '14px 24px',
              background: 'var(--color-primary)', color: '#0a1628',
              borderRadius: 10, fontWeight: 800, fontSize: '1rem',
              textDecoration: 'none', marginBottom: 12,
              transition: 'opacity .15s',
            }}
          >
            Créer mon compte gratuit →
          </a>
          <a
            href="/espace-membres"
            style={{
              display: 'block', width: '100%', padding: '12px 24px',
              background: 'transparent', color: 'var(--color-text-muted)',
              border: '1.5px solid var(--color-border)',
              borderRadius: 10, fontWeight: 600, fontSize: '0.92rem',
              textDecoration: 'none',
            }}
          >
            J&apos;ai déjà un compte — me connecter
          </a>

          {/* Réassurance */}
          <div style={{ marginTop: 20, fontSize: '0.78rem', color: 'var(--color-text-muted)', lineHeight: 1.6 }}>
            ✦ Connexion sans mot de passe · Gratuit · Sans engagement<br />
            Vos données ne sont jamais revendues.
          </div>
        </div>
      </div>
    </div>
  )
}
