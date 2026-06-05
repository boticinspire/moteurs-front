'use client'

/**
 * SearchBox — Recherche intelligente Moteurs.com
 * Champ langage naturel → Claude Haiku → réponse courte + CTA vers la bonne page
 * À placer dans le hero de la home, entre le lead et les onglets.
 */

import { useState, useRef, useEffect } from 'react'
import { useRouter } from '@/i18n/navigation'

interface SearchResult {
  answer: string
  url: string
  label: string
}

interface SearchBoxProps {
  /** Thème courant pour adapter les couleurs ('light' | 'dark') */
  theme?: 'light' | 'dark'
  /** Placeholder du champ texte */
  placeholder?: string
}

export default function SearchBox({
  theme = 'light',
  placeholder = 'Posez votre question… ex: combien coûte Paris-Nice en électrique ?',
}: SearchBoxProps) {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<SearchResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const resultRef = useRef<HTMLDivElement>(null)

  // Scroll doux vers le résultat quand il apparaît
  useEffect(() => {
    if (result && resultRef.current) {
      resultRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }
  }, [result])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!query.trim() || loading) return

    setLoading(true)
    setResult(null)
    setError(null)

    try {
      const res = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: query.trim() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Erreur')
      setResult(data as SearchResult)
    } catch (err) {
      setError('Impossible de traiter votre question. Réessayez.')
      console.error('[SearchBox]', err)
    } finally {
      setLoading(false)
    }
  }

  function handleCTA() {
    if (!result) return
    router.push(result.url as Parameters<typeof router.push>[0])
  }

  // CSS variables issues du design system home-v2
  const isLight = theme === 'light'
  const toolBg = isLight ? 'rgba(255,253,249,0.92)' : 'rgba(14,19,34,0.85)'
  const lineStrong = isLight ? 'rgba(12,20,34,0.16)' : 'rgba(255,255,255,0.12)'
  const textStrong = isLight ? '#0c1422' : '#ffffff'
  const textMuted = isLight ? '#5a6378' : '#7a8499'
  const accentColor = isLight ? '#ef6c1a' : '#5b8def'
  const accentHover = isLight ? '#c95211' : '#3b82f6'
  const successBg = isLight ? '#f0fdf4' : 'rgba(16,217,122,0.08)'
  const successBorder = isLight ? '#bbf7d0' : 'rgba(16,217,122,0.2)'

  return (
    <>
      {/* Scoped styles : hover + animations impossibles à faire en inline */}
      <style>{`
        .sb-wrap { position: relative; margin-top: 28px; margin-bottom: 4px; }
        .sb-label {
          display: inline-flex; align-items: center; gap: 6px;
          font-size: .72rem; font-weight: 700; letter-spacing: .08em;
          text-transform: uppercase; margin-bottom: 10px;
          color: ${textMuted}; opacity: .85;
        }
        .sb-label svg { width: 12px; height: 12px; }
        .sb-form {
          display: flex; align-items: center; gap: 0;
          background: ${toolBg}; border: 1.5px solid ${lineStrong};
          border-radius: 16px; padding: 5px 5px 5px 18px;
          backdrop-filter: blur(16px) saturate(160%);
          box-shadow: 0 8px 32px -12px rgba(0,0,0,.18);
          transition: border-color .2s, box-shadow .2s;
        }
        .sb-form:focus-within {
          border-color: ${accentColor};
          box-shadow: 0 0 0 3px ${isLight ? 'rgba(239,108,26,.14)' : 'rgba(91,141,239,.18)'}, 0 8px 32px -12px rgba(0,0,0,.22);
        }
        .sb-input {
          flex: 1; background: transparent; border: none; outline: none;
          font: inherit; font-size: .97rem; color: ${textStrong};
          padding: 10px 0; min-width: 0;
        }
        .sb-input::placeholder { color: ${textMuted}; opacity: .7; }
        .sb-btn {
          flex-shrink: 0; padding: 10px 20px; border-radius: 12px;
          font: inherit; font-size: .88rem; font-weight: 700;
          cursor: pointer; border: none; white-space: nowrap;
          background: linear-gradient(135deg, ${accentColor} 0%, ${accentHover} 100%);
          color: #fff; transition: opacity .2s, transform .1s;
          display: flex; align-items: center; gap: 7px;
        }
        .sb-btn:hover:not(:disabled) { opacity: .9; transform: translateY(-1px); }
        .sb-btn:active { transform: translateY(0); }
        .sb-btn:disabled { opacity: .6; cursor: not-allowed; }
        /* Spinner */
        .sb-spinner {
          width: 15px; height: 15px; border: 2px solid rgba(255,255,255,.3);
          border-top-color: #fff; border-radius: 50%;
          animation: sb-spin .7s linear infinite; flex-shrink: 0;
        }
        @keyframes sb-spin { to { transform: rotate(360deg); } }
        /* Carte résultat */
        .sb-result {
          margin-top: 12px; padding: 16px 20px;
          background: ${successBg}; border: 1px solid ${successBorder};
          border-radius: 14px; display: flex; align-items: center;
          gap: 16px; animation: sb-fadein .3s ease;
        }
        @keyframes sb-fadein { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }
        .sb-result-icon {
          width: 36px; height: 36px; border-radius: 10px; flex-shrink: 0;
          display: flex; align-items: center; justify-content: center;
          background: ${isLight ? 'rgba(239,108,26,.12)' : 'rgba(91,141,239,.15)'};
          color: ${accentColor};
        }
        .sb-result-icon svg { width: 18px; height: 18px; }
        .sb-result-body { flex: 1; min-width: 0; }
        .sb-result-answer {
          font-size: .92rem; color: ${textStrong}; line-height: 1.45;
          font-weight: 500; margin: 0;
        }
        .sb-cta {
          flex-shrink: 0; padding: 9px 18px; border-radius: 10px;
          font: inherit; font-size: .84rem; font-weight: 700; cursor: pointer;
          border: 1.5px solid ${accentColor}; color: ${accentColor};
          background: transparent; transition: background .15s, color .15s;
          white-space: nowrap;
        }
        .sb-cta:hover { background: ${accentColor}; color: #fff; }
        .sb-error {
          margin-top: 8px; font-size: .83rem;
          color: #dc2626; padding: 0 4px;
        }
        @media (max-width: 640px) {
          .sb-result { flex-wrap: wrap; }
          .sb-result-icon { display: none; }
          .sb-cta { width: 100%; text-align: center; }
          .sb-btn span.sb-btn-text { display: none; }
        }
      `}</style>

      <div className="sb-wrap">
        <div className="sb-label">
          <svg stroke="currentColor" fill="none" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
          </svg>
          Question libre
        </div>

        <form className="sb-form" onSubmit={handleSubmit} role="search">
          <input
            ref={inputRef}
            className="sb-input"
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={placeholder}
            aria-label="Posez votre question"
            maxLength={300}
            autoComplete="off"
          />
          <button type="submit" className="sb-btn" disabled={loading || !query.trim()}>
            {loading ? (
              <span className="sb-spinner" aria-hidden="true" />
            ) : (
              <svg width="15" height="15" stroke="currentColor" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            )}
            <span className="sb-btn-text">{loading ? 'Analyse…' : 'Chercher'}</span>
          </button>
        </form>

        {error && <p className="sb-error" role="alert">{error}</p>}

        {result && (
          <div className="sb-result" ref={resultRef} role="status" aria-live="polite">
            <div className="sb-result-icon" aria-hidden="true">
              <svg stroke="currentColor" fill="none" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            </div>
            <p className="sb-result-answer">{result.answer}</p>
            <button className="sb-cta" onClick={handleCTA} type="button">
              {result.label} →
            </button>
          </div>
        )}
      </div>
    </>
  )
}
