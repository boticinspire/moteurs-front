'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'
import { Suspense } from 'react'

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

function DesinscriptionContent() {
  const params = useSearchParams()
  const email = params.get('email') || ''
  const [status, setStatus] = useState<'idle' | 'loading' | 'ok' | 'notfound' | 'error'>('idle')

  // Si email dans l'URL, proposer directement la confirmation
  async function seDesinscrire() {
    if (!email) return
    setStatus('loading')

    const { error, count } = await sb
      .from('leads')
      .delete({ count: 'exact' })
      .eq('email', email)
      .eq('source_lead', 'NEWSLETTER')

    if (error) {
      setStatus('error')
    } else if (count === 0) {
      setStatus('notfound')
    } else {
      setStatus('ok')
    }
  }

  return (
    <div style={{ textAlign: 'center', padding: '80px 24px', maxWidth: 520, margin: '0 auto' }}>
      <div style={{ fontSize: '2.5rem', marginBottom: 16 }}>📭</div>
      <h1 style={{ fontSize: '1.5rem', marginBottom: 12 }}>Désinscription newsletter</h1>

      {status === 'idle' && email && (
        <>
          <p style={{ color: 'var(--color-text-soft)', marginBottom: 28 }}>
            Vous allez vous désinscrire de la veille hebdomadaire Moteurs.com pour l&apos;adresse :<br />
            <strong style={{ color: 'var(--color-text)' }}>{email}</strong>
          </p>
          <button className="btn btn-primary" onClick={seDesinscrire} style={{ marginBottom: 16 }}>
            Confirmer la désinscription
          </button>
          <br />
          <Link href="/" style={{ fontSize: '0.85rem', color: 'var(--color-text-soft)' }}>
            Annuler — garder mon inscription
          </Link>
        </>
      )}

      {status === 'idle' && !email && (
        <p style={{ color: 'var(--color-text-soft)' }}>
          Lien invalide. Utilisez le lien de désinscription présent dans nos emails.
        </p>
      )}

      {status === 'loading' && (
        <p style={{ color: 'var(--color-text-soft)' }}>Traitement en cours…</p>
      )}

      {status === 'ok' && (
        <>
          <p style={{ color: '#10b981', fontWeight: 600, marginBottom: 16 }}>
            ✓ Vous avez bien été désinscrit·e. Nous ne vous enverrons plus d&apos;emails.
          </p>
          <p style={{ color: 'var(--color-text-soft)', fontSize: '0.85rem', marginBottom: 24 }}>
            Conformément au RGPD, vos données ont été supprimées de notre liste.
            Vous pouvez vous réinscrire à tout moment depuis la page d&apos;accueil.
          </p>
          <Link href="/" className="btn btn-secondary">Retour à l&apos;accueil</Link>
        </>
      )}

      {status === 'notfound' && (
        <p style={{ color: 'var(--color-text-soft)' }}>
          Cette adresse n&apos;est pas dans notre liste — vous êtes peut-être déjà désinscrit·e.
        </p>
      )}

      {status === 'error' && (
        <p style={{ color: '#ef4444' }}>
          Une erreur est survenue. Contactez-nous à contact@moteurs.com.
        </p>
      )}
    </div>
  )
}

export default function DesinscriptionPage() {
  return (
    <Suspense fallback={<div style={{ textAlign: 'center', padding: 80 }}>Chargement…</div>}>
      <DesinscriptionContent />
    </Suspense>
  )
}
