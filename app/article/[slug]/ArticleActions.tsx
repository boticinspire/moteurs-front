'use client'

import React, { useState } from 'react'

export default function ArticleActions({ titre, url }: { titre: string; url: string }) {
  const [copied, setCopied] = useState(false)

  function imprimer() {
    window.print()
  }

  async function partager() {
    // Web Share API (mobile + navigateurs modernes)
    if (navigator.share) {
      try {
        await navigator.share({ title: titre, url })
        return
      } catch { /* annulé par l'utilisateur */ }
    }
    // Fallback : copier le lien
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    } catch {
      prompt('Copiez ce lien :', url)
    }
  }

  return (
    <div className="article-actions no-print" style={{
      display: 'flex', gap: 10, flexWrap: 'wrap',
      padding: '18px 0',
      borderTop: '1px solid var(--color-border)',
      marginTop: 32,
    }}>
      <button onClick={imprimer} style={btnStyle}>
        🖨️ Imprimer
      </button>
      <button onClick={partager} style={btnStyle}>
        {copied ? '✓ Lien copié !' : '🔗 Partager'}
      </button>
    </div>
  )
}

const btnStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  padding: '8px 16px',
  background: 'var(--color-bg-alt)',
  border: '1px solid var(--color-border)',
  borderRadius: 8,
  cursor: 'pointer',
  fontSize: '0.85rem',
  color: 'var(--color-text)',
  fontFamily: 'inherit',
  transition: 'border-color 0.15s',
}
