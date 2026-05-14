'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { FLAGS, CONF_CLASS, CONF_LABEL, type Article } from '@/lib/supabase'

type ArticleRow = Pick<Article, 'slug' | 'titre_provisoire' | 'resume_50mots' | 'pays_cible' | 'published_at' | 'niveau_confiance'>

const PAYS_LIST = ['FR', 'BE', 'CH', 'CA'] as const

export default function ArticleSearch({ articles }: { articles: ArticleRow[] }) {
  const [query, setQuery] = useState('')
  const [pays, setPays]   = useState<string>('')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return articles.filter((a) => {
      const matchPays = !pays || a.pays_cible === pays
      if (!matchPays) return false
      if (!q) return true
      return (
        (a.titre_provisoire?.toLowerCase().includes(q)) ||
        (a.resume_50mots?.toLowerCase().includes(q))
      )
    })
  }, [articles, query, pays])

  return (
    <>
      {/* Barre de recherche + filtres */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center', marginBottom: 28 }}>
        {/* Champ de recherche */}
        <div style={{ flex: '1 1 260px', position: 'relative' }}>
          <span style={{
            position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
            color: 'var(--color-text-soft)', fontSize: '1rem', pointerEvents: 'none',
          }}>
            🔍
          </span>
          <input
            type="search"
            placeholder="Rechercher un décryptage…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 14px 10px 40px',
              border: '1.5px solid var(--color-border)',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.95rem',
              fontFamily: 'inherit',
              background: 'white',
              color: 'var(--color-text)',
              outline: 'none',
              transition: 'border-color 0.15s',
            }}
            onFocus={(e) => (e.target.style.borderColor = 'var(--color-primary)')}
            onBlur={(e) => (e.target.style.borderColor = 'var(--color-border)')}
          />
        </div>

        {/* Filtres pays */}
        <div className="filters" style={{ margin: 0, flex: '0 0 auto', padding: '8px 12px' }}>
          <button
            onClick={() => setPays('')}
            className={`filter-btn${!pays ? ' active' : ''}`}
          >
            Tous
          </button>
          {PAYS_LIST.map((p) => (
            <button
              key={p}
              onClick={() => setPays(pays === p ? '' : p)}
              className={`filter-btn${pays === p ? ' active' : ''}`}
            >
              {FLAGS[p]} {p}
            </button>
          ))}
        </div>
      </div>

      {/* Compteur résultats */}
      {(query || pays) && (
        <p style={{
          fontSize: '0.82rem', color: 'var(--color-text-soft)',
          marginBottom: 16, paddingLeft: 2,
        }}>
          {filtered.length} résultat{filtered.length !== 1 ? 's' : ''} {query && <>pour «&nbsp;<strong>{query}</strong>&nbsp;»</>}{pays && <> · {FLAGS[pays]} {pays}</>}
          {' '}—{' '}
          <button
            onClick={() => { setQuery(''); setPays('') }}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-primary)', fontSize: '0.82rem', padding: 0, textDecoration: 'underline' }}
          >
            réinitialiser
          </button>
        </p>
      )}

      {/* Liste articles */}
      <div className="article-list">
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '64px 24px', color: 'var(--color-text-soft)' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>🔍</div>
            <p style={{ fontSize: '1rem', marginBottom: 8 }}>Aucun résultat pour «&nbsp;<strong>{query}</strong>&nbsp;»</p>
            <p style={{ fontSize: '0.85rem' }}>
              Essayez des mots-clés différents ou{' '}
              <button
                onClick={() => setQuery('')}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-primary)', fontSize: '0.85rem', padding: 0, textDecoration: 'underline' }}
              >
                afficher tous les articles
              </button>
            </p>
          </div>
        ) : (
          filtered.map((a) => {
            const p    = a.pays_cible as string
            const flag = FLAGS[p] ?? ''
            const conf = a.niveau_confiance ?? 'MOYEN'
            const date = a.published_at
              ? new Date(a.published_at).toLocaleDateString('fr-FR', {
                  day: 'numeric', month: 'long', year: 'numeric',
                })
              : ''

            return (
              <article key={a.slug} className="article-row">
                <div className="thumb">{flag}</div>
                <div>
                  <h3>
                    <Link href={`/article/${a.slug}`}>
                      {highlightMatch(a.titre_provisoire ?? '', query)}
                    </Link>
                  </h3>
                  {a.resume_50mots && (
                    <p>{highlightMatch(a.resume_50mots, query)}</p>
                  )}
                  <div className="meta">
                    {date && <span>📅 {date}</span>}
                    <span className={`confidence ${CONF_CLASS[conf] ?? 'conf-medium'}`}>
                      {CONF_LABEL[conf] ?? 'Confiance MOYEN'}
                    </span>
                  </div>
                </div>
                <div>
                  <span className="tag">{flag} {p}</span>
                </div>
              </article>
            )
          })
        )}
      </div>
    </>
  )
}

/** Surligne les occurrences du terme recherché dans le texte */
function highlightMatch(text: string, query: string) {
  if (!query.trim()) return <>{text}</>
  const q = query.trim()
  const regex = new RegExp(`(${q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')
  const parts = text.split(regex)
  return (
    <>
      {parts.map((part, i) =>
        regex.test(part) ? (
          <mark key={i} style={{ background: 'rgba(0,184,135,0.18)', color: 'inherit', borderRadius: 2, padding: '0 1px' }}>
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  )
}
