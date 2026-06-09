'use client'

import { useState } from 'react'

export default function DessinActions({
  url,
  titre,
  imageUrl,
}: {
  url: string
  titre: string
  imageUrl: string
}) {
  const [copie, setCopie] = useState(false)

  async function partager() {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({ title: titre, text: `${titre} — Moteurs.com`, url })
        return
      } catch {
        /* annulé ou non supporté → fallback copie */
      }
    }
    try {
      await navigator.clipboard.writeText(url)
      setCopie(true)
      setTimeout(() => setCopie(false), 2200)
    } catch {
      /* ignore */
    }
  }

  const btn: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    padding: '10px 18px',
    borderRadius: 10,
    fontSize: '0.9rem',
    fontWeight: 600,
    cursor: 'pointer',
    textDecoration: 'none',
    border: '1px solid var(--color-border)',
    background: 'var(--color-bg-alt)',
    color: 'var(--color-text)',
  }

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 8 }}>
      <button type="button" onClick={partager} style={{ ...btn, borderColor: 'var(--color-primary)', color: 'var(--color-primary)' }}>
        🔗 {copie ? 'Lien copié !' : 'Partager'}
      </button>
      <a href={imageUrl} download target="_blank" rel="noopener noreferrer" style={btn}>
        ⬇️ Télécharger l&apos;image
      </a>
    </div>
  )
}
