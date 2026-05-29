'use client'

import React, { useState, useRef, useEffect } from 'react'

export default function ArticleActions({ titre, url, compact = false }: { titre: string; url: string; compact?: boolean }) {
  const [copied, setCopied] = useState(false)
  const [shareOpen, setShareOpen] = useState(false)
  const shareRef = useRef<HTMLDivElement>(null)

  // Fermer le menu si clic hors
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (shareRef.current && !shareRef.current.contains(e.target as Node)) {
        setShareOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  function imprimer() {
    window.print()
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => { setCopied(false); setShareOpen(false) }, 2000)
    } catch {
      prompt('Copiez ce lien :', url)
    }
  }

  async function shareNative() {
    if (navigator.share) {
      try {
        await navigator.share({ title: titre, url })
        setShareOpen(false)
        return
      } catch { /* annulé */ }
    }
    // Pas de Web Share API → copier directement
    copyLink()
  }

  function shareLinkedIn() {
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`, '_blank', 'noopener,width=600,height=500')
    setShareOpen(false)
  }

  function shareX() {
    window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(titre)}`, '_blank', 'noopener,width=600,height=500')
    setShareOpen(false)
  }

  if (compact) {
    return (
      <div className="no-print" style={{ display: 'flex', gap: 6 }}>
        <button onClick={imprimer} title="Imprimer" style={btnCompact}>🖨️</button>
        <button onClick={shareNative} title={copied ? 'Lien copié !' : 'Partager'} style={btnCompact}>
          {copied ? '✓' : '🔗'}
        </button>
      </div>
    )
  }

  return (
    <div className="article-actions no-print" style={{
      display: 'flex', gap: 12, flexWrap: 'wrap',
      padding: '28px 0 8px',
      marginTop: 8,
    }}>
      {/* Bouton Imprimer */}
      <button onClick={imprimer} style={btnPrimary}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/>
        </svg>
        Imprimer
      </button>

      {/* Bouton Partager avec dropdown */}
      <div style={{ position: 'relative' }} ref={shareRef}>
        <button
          onClick={() => setShareOpen(o => !o)}
          style={{ ...btnSecondary, ...(shareOpen ? btnSecondaryActive : {}) }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
          </svg>
          Partager
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: 2, transition: 'transform 0.2s', transform: shareOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </button>

        {shareOpen && (
          <div style={{
            position: 'absolute', top: 'calc(100% + 8px)', left: 0,
            background: 'var(--color-bg-alt)',
            border: '1px solid var(--color-border)',
            borderRadius: 10,
            boxShadow: '0 8px 24px rgba(0,0,0,0.18)',
            minWidth: 220,
            zIndex: 100,
            overflow: 'hidden',
          }}>
            <button onClick={copyLink} style={dropdownItem}>
              {copied
                ? <><span style={{ color: '#22c55e' }}>✓</span> Lien copié !</>
                : <><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg> Copier le lien</>
              }
            </button>
            <div style={{ height: 1, background: 'var(--color-border)', margin: '0 12px' }} />
            <button onClick={shareLinkedIn} style={dropdownItem}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></svg>
              Partager sur LinkedIn
            </button>
            <button onClick={shareX} style={dropdownItem}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
              Partager sur X
            </button>
            {'share' in navigator && (
              <>
                <div style={{ height: 1, background: 'var(--color-border)', margin: '0 12px' }} />
                <button onClick={shareNative} style={dropdownItem}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>
                  Plus d'options…
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

const btnCompact: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 32,
  height: 32,
  background: 'rgba(255,255,255,0.12)',
  border: '1px solid rgba(255,255,255,0.25)',
  borderRadius: 6,
  cursor: 'pointer',
  fontSize: '0.9rem',
  color: 'white',
  transition: 'background 0.15s',
}

const btnPrimary: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
  padding: '11px 22px',
  background: 'var(--color-primary, #16a34a)',
  border: '1px solid transparent',
  borderRadius: 10,
  cursor: 'pointer',
  fontSize: '0.95rem',
  fontWeight: 600,
  color: 'white',
  fontFamily: 'inherit',
  transition: 'opacity 0.15s',
  letterSpacing: '-0.01em',
}

const btnSecondary: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
  padding: '11px 22px',
  background: 'var(--color-bg-alt)',
  border: '1px solid var(--color-border)',
  borderRadius: 10,
  cursor: 'pointer',
  fontSize: '0.95rem',
  fontWeight: 600,
  color: 'var(--color-text)',
  fontFamily: 'inherit',
  transition: 'border-color 0.15s',
  letterSpacing: '-0.01em',
}

const btnSecondaryActive: React.CSSProperties = {
  borderColor: 'var(--color-primary, #16a34a)',
}

const dropdownItem: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  width: '100%',
  padding: '12px 16px',
  background: 'transparent',
  border: 'none',
  cursor: 'pointer',
  fontSize: '0.9rem',
  color: 'var(--color-text)',
  fontFamily: 'inherit',
  textAlign: 'left',
  transition: 'background 0.12s',
}
