'use client'

import { useState, useMemo, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { CONF_CLASS, CONF_LABEL, type Article } from '@/lib/supabase'
import Flag from '@/components/Flag'

const PAYS_LABELS: Record<string, string> = { FR: 'France', BE: 'Belgique', CH: 'Suisse', CA: 'Canada', LU: 'Luxembourg' }

type ArticleRow = Pick<Article, 'slug' | 'titre_provisoire' | 'resume_50mots' | 'pays_cible' | 'published_at' | 'niveau_confiance'>

const PAYS_LIST = ['FR', 'BE', 'CH', 'CA', 'LU'] as const
const PAYS_STORAGE_KEY = 'moteurs_pays_filter'
const PAGE_SIZE = 25

function ArticleSearchInner({ articles }: { articles: ArticleRow[] }) {
  const searchParams = useSearchParams()
  const [query,      setQuery]      = useState('')
  const [pays,       setPays]       = useState('')
  const [confiance,  setConfiance]  = useState('')
  const [page,       setPage]       = useState(1)

  // Priorité : param URL > localStorage
  useEffect(() => {
    const urlPays = searchParams.get('pays')?.toUpperCase() ?? ''
    if (urlPays && PAYS_LIST.includes(urlPays as typeof PAYS_LIST[number])) {
      setPays(urlPays)
      return
    }
    try {
      const saved = localStorage.getItem(PAYS_STORAGE_KEY)
      if (saved && PAYS_LIST.includes(saved as typeof PAYS_LIST[number])) {
        setPays(saved)
      }
    } catch { /* ignore */ }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Persiste le filtre pays dans localStorage
  function handlePaysChange(value: string) {
    setPays(value)
    try {
      if (value) localStorage.setItem(PAYS_STORAGE_KEY, value)
      else localStorage.removeItem(PAYS_STORAGE_KEY)
    } catch { /* ignore */ }
  }

  // Remise à la page 1 dès qu'un filtre change
  useEffect(() => { setPage(1) }, [query, pays, confiance])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return articles.filter((a) => {
      if (pays && a.pays_cible !== pays) return false
      if (confiance && a.niveau_confiance !== confiance) return false
      if (q) {
        const inTitre   = a.titre_provisoire?.toLowerCase().includes(q)
        const inResume  = a.resume_50mots?.toLowerCase().includes(q)
        if (!inTitre && !inResume) return false
      }
      return true
    })
  }, [articles, query, pays, confiance])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const paginated   = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  const hasFilters = query || pays || confiance

  function reset() {
    setQuery(''); setConfiance(''); setPage(1)
    handlePaysChange('')
  }

  return (
    <>
      {/* ── Barre de recherche + filtres ── */}
      <div style={{
        display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center',
        marginBottom: 20,
        padding: '16px 18px',
        background: 'var(--color-bg-alt)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-lg)',
      }}>
        {/* Champ texte */}
        <div style={{ flex: '1 1 220px', position: 'relative', minWidth: 180 }}>
          <span style={{
            position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)',
            fontSize: '0.9rem', pointerEvents: 'none', color: 'var(--color-text-soft)',
          }}>🔍</span>
          <input
            type="search"
            placeholder="Rechercher…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '9px 12px 9px 34px',
              border: '1.5px solid var(--color-border)',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.9rem',
              fontFamily: 'inherit',
              background: 'white',
              color: 'var(--color-text)',
              outline: 'none',
            }}
            onFocus={(e)  => (e.target.style.borderColor = 'var(--color-primary)')}
            onBlur={(e)   => (e.target.style.borderColor = 'var(--color-border)')}
          />
        </div>

        {/* Sélecteur pays */}
        <select
          value={pays}
          onChange={(e) => handlePaysChange(e.target.value)}
          style={selectStyle}
        >
          <option value="">Tous les pays</option>
          {PAYS_LIST.map((p) => (
            <option key={p} value={p}>{PAYS_LABELS[p]}</option>
          ))}
        </select>

        {/* Sélecteur confiance */}
        <select
          value={confiance}
          onChange={(e) => setConfiance(e.target.value)}
          style={selectStyle}
        >
          <option value="">● Toutes confiances</option>
          <option value="ÉLEVÉ">● Confiance ÉLEVÉ</option>
          <option value="MOYEN">● Confiance MOYEN</option>
          <option value="FAIBLE">● À vérifier</option>
        </select>

        {/* Reset */}
        {hasFilters && (
          <button onClick={reset} style={{
            background: 'none', border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-md)', padding: '9px 14px',
            cursor: 'pointer', fontSize: '0.82rem', color: 'var(--color-text-soft)',
            whiteSpace: 'nowrap', transition: 'all 0.15s',
          }}
          onMouseEnter={(e) => { (e.currentTarget.style.borderColor = 'var(--color-primary)'); (e.currentTarget.style.color = 'var(--color-primary)') }}
          onMouseLeave={(e) => { (e.currentTarget.style.borderColor = 'var(--color-border)'); (e.currentTarget.style.color = 'var(--color-text-soft)') }}
          >
            ✕ Réinitialiser
          </button>
        )}
      </div>

      {/* ── Barre de résultats + pagination ── */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: 16, flexWrap: 'wrap', gap: 8,
      }}>
        <p style={{ fontSize: '0.82rem', color: 'var(--color-text-soft)', margin: 0 }}>
          {filtered.length === 0
            ? 'Aucun résultat'
            : <>
                <strong>{(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, filtered.length)}</strong>
                {' '}sur <strong>{filtered.length}</strong> décryptage{filtered.length > 1 ? 's' : ''}
                {query && <> · «&nbsp;<em>{query}</em>&nbsp;»</>}
                {pays && <> · <Flag code={pays.toLowerCase()} size={14} /> {PAYS_LABELS[pays]}</>}
                {confiance && <> · {CONF_LABEL[confiance] ?? confiance}</>}
              </>
          }
        </p>

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
            <PaginationBtn onClick={() => setPage(1)}      disabled={currentPage === 1}       label="«" title="Première page" />
            <PaginationBtn onClick={() => setPage(p => p - 1)} disabled={currentPage === 1}   label="‹" title="Page précédente" />

            {pageRange(currentPage, totalPages).map((p, i) =>
              p === '…'
                ? <span key={`e${i}`} style={{ padding: '0 4px', color: 'var(--color-text-soft)', fontSize: '0.8rem' }}>…</span>
                : <button
                    key={p}
                    onClick={() => setPage(Number(p))}
                    style={{
                      width: 32, height: 32, border: '1px solid',
                      borderColor: currentPage === p ? 'var(--color-primary)' : 'var(--color-border)',
                      borderRadius: 'var(--radius-sm)',
                      background: currentPage === p ? 'var(--color-primary)' : 'white',
                      color: currentPage === p ? 'white' : 'var(--color-text)',
                      fontSize: '0.82rem', fontWeight: currentPage === p ? 700 : 400,
                      cursor: 'pointer', transition: 'all 0.15s',
                    }}
                  >{p}</button>
            )}

            <PaginationBtn onClick={() => setPage(p => p + 1)} disabled={currentPage === totalPages} label="›" title="Page suivante" />
            <PaginationBtn onClick={() => setPage(totalPages)} disabled={currentPage === totalPages}  label="»" title="Dernière page" />
          </div>
        )}
      </div>

      {/* ── Liste articles ── */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '64px 24px', color: 'var(--color-text-soft)' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>🔍</div>
          <p style={{ fontSize: '1rem', marginBottom: 8 }}>Aucun article ne correspond à ces critères.</p>
          <button onClick={reset} style={{
            marginTop: 8, background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--color-primary)', fontSize: '0.9rem', textDecoration: 'underline',
          }}>Réinitialiser les filtres</button>
        </div>
      ) : (
        <div className="article-list">
          {paginated.map((a) => {
            const p    = a.pays_cible as string
            const conf = a.niveau_confiance ?? 'MOYEN'
            const date = a.published_at
              ? new Date(a.published_at).toLocaleDateString('fr-FR', {
                  day: 'numeric', month: 'long', year: 'numeric',
                })
              : ''

            return (
              <article key={a.slug} className="article-row">
                <div className="thumb"><Flag code={p.toLowerCase()} size={40} /></div>
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
                  <span className="tag" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><Flag code={p.toLowerCase()} size={14} /> {p}</span>
                </div>
              </article>
            )
          })}
        </div>
      )}

      {/* ── Pagination bas de page ── */}
      {totalPages > 1 && filtered.length > 0 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 4, marginTop: 32 }}>
          <PaginationBtn onClick={() => setPage(p => p - 1)} disabled={currentPage === 1}          label="&#8249; Précédent" />
          <span style={{ padding: '8px 14px', fontSize: '0.82rem', color: 'var(--color-text-soft)', alignSelf: 'center' }}>
            Page {currentPage} / {totalPages}
          </span>
          <PaginationBtn onClick={() => setPage(p => p + 1)} disabled={currentPage === totalPages}  label="Suivant &#8250;" />
        </div>
      )}
    </>
  )
}

export default function ArticleSearch({ articles }: { articles: ArticleRow[] }) {
  return (
    <Suspense fallback={null}>
      <ArticleSearchInner articles={articles} />
    </Suspense>
  )
}

/* ── Styles partagés ── */

const selectStyle: React.CSSProperties = {
  flex: '0 0 auto',
  padding: '9px 12px',
  border: '1.5px solid var(--color-border)',
  borderRadius: 'var(--radius-md)',
  fontSize: '0.88rem',
  fontFamily: 'inherit',
  background: 'white',
  color: 'var(--color-text)',
  cursor: 'pointer',
  outline: 'none',
  minWidth: 160,
}

/* ── Bouton pagination ── */
function PaginationBtn({
  onClick, disabled, label, title,
}: {
  onClick: () => void; disabled: boolean; label: string; title?: string
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      style={{
        padding: '7px 12px',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-sm)',
        background: disabled ? 'var(--color-bg-alt)' : 'white',
        color: disabled ? 'var(--color-border)' : 'var(--color-text)',
        fontSize: '0.82rem',
        cursor: disabled ? 'default' : 'pointer',