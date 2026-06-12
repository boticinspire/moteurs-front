'use client'

import { useEffect, useState } from 'react'

const PRIMARY = 'var(--color-primary)'
const BORDER  = 'var(--color-border)'
const MUTED   = 'var(--color-text-muted)'

/**
 * Filtre pays pour le tableau rendu côté serveur.
 * Progressive enhancement : les lignes <tr data-pays> sont toutes visibles
 * dans le HTML initial (bon pour le SEO). Le filtre masque/affiche via le DOM.
 */
export default function FiltrePaysCartes() {
  const [pays, setPays] = useState<'FR' | 'BE' | 'tous'>('tous')

  useEffect(() => {
    const rows = document.querySelectorAll<HTMLTableRowElement>('tr[data-pays]')
    rows.forEach((tr) => {
      const list = (tr.dataset.pays || '').split(',')
      const show = pays === 'tous' || list.includes(pays)
      tr.style.display = show ? '' : 'none'
    })
  }, [pays])

  return (
    <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
      <span style={{ fontSize: '0.85rem', color: MUTED, alignSelf: 'center' }}>Pays :</span>
      {(['FR', 'BE', 'tous'] as const).map((p) => (
        <button key={p} onClick={() => setPays(p)} style={{
          padding: '5px 14px', borderRadius: 20, fontSize: '0.8rem', fontWeight: 600,
          border: `1px solid ${pays === p ? PRIMARY : BORDER}`,
          background: pays === p ? `color-mix(in srgb, ${PRIMARY} 10%, transparent)` : 'transparent',
          color: pays === p ? PRIMARY : MUTED, cursor: 'pointer',
        }}>
          {p === 'tous' ? '🌍 Tous' : p === 'FR' ? '🇫🇷 France' : '🇧🇪 Belgique'}
        </button>
      ))}
    </div>
  )
}
