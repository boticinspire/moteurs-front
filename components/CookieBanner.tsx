'use client'

import { useState, useEffect } from 'react'

const STORAGE_KEY = 'moteurs_cookies_consent'

export default function CookieBanner() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    // Affiche la bannière uniquement si l'utilisateur n'a pas encore répondu
    try {
      const consent = localStorage.getItem(STORAGE_KEY)
      if (!consent) setVisible(true)
    } catch {
      // localStorage indisponible (navigation privée stricte) → ne pas afficher
    }
  }, [])

  function accepter() {
    try { localStorage.setItem(STORAGE_KEY, 'necessary') } catch { /* ignore */ }
    setVisible(false)
  }

  if (!visible) return null

  return (
    <>
      <style>{`
        .cookie-banner {
          position: fixed;
          bottom: 0; left: 0; right: 0;
          z-index: 999;
          background: var(--color-bg-dark);
          border-top: 1px solid rgba(255,255,255,0.12);
          padding: 16px 24px;
          display: flex;
          align-items: center;
          gap: 16px;
          flex-wrap: wrap;
          animation: slideUp .3s ease;
        }
        @keyframes slideUp {
          from { transform: translateY(100%); opacity: 0; }
          to   { transform: translateY(0); opacity: 1; }
        }
        .cookie-banner p {
          flex: 1 1 300px;
          font-size: 0.83rem;
          color: rgba(255,255,255,0.75);
          margin: 0;
          line-height: 1.5;
        }
        .cookie-banner a { color: var(--color-primary); }
        .cookie-banner-actions { display: flex; gap: 10px; flex-shrink: 0; flex-wrap: wrap; }
        .cookie-btn-accept {
          padding: 9px 20px; background: var(--color-primary); color: #000;
          border: none; border-radius: 8px; font-weight: 700;
          font-size: 0.85rem; cursor: pointer; font-family: inherit; white-space: nowrap;
        }
        .cookie-btn-accept:hover { opacity: 0.88; }
        .cookie-btn-info {
          padding: 9px 14px; background: transparent; color: rgba(255,255,255,0.6);
          border: 1px solid rgba(255,255,255,0.2); border-radius: 8px;
          font-size: 0.82rem; cursor: pointer; font-family: inherit; white-space: nowrap;
          text-decoration: none; display: inline-flex; align-items: center;
        }
        .cookie-btn-info:hover { border-color: rgba(255,255,255,0.5); color: white; }
      `}</style>

      <div className="cookie-banner" role="banner" aria-label="Information sur les cookies">
        <p>
          🍪 <strong style={{ color: 'white' }}>Cookies</strong> — Ce site utilise uniquement des cookies{' '}
          <strong style={{ color: 'white' }}>strictement nécessaires</strong> au fonctionnement
          (session d'authentification Supabase). Aucun cookie publicitaire ni de tracking tiers n'est utilisé.{' '}
          <a href="/mentions-legales" style={{ color: 'var(--color-primary)' }}>En savoir plus</a>
        </p>
        <div className="cookie-banner-actions">
          <a href="/mentions-legales" className="cookie-btn-info">
            Politique cookies
          </a>
          <button onClick={accepter} className="cookie-btn-accept">
            J'ai compris
          </button>
        </div>
      </div>
    </>
  )
}
