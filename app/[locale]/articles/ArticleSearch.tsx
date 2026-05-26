'use client'

import { useState, useMemo, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Link } from '@/i18n/navigation'
import { CONF_CLASS, CONF_LABEL, CIBLE_LABEL_COURT, CIBLE_COLOR, type Article, type Cible } from '@/lib/supabase'
import Flag from '@/components/Flag'

const PAYS_LABELS: Record<string, string> = { FR: 'France', BE: 'Belgique', CH: 'Suisse', CA: 'Canada', LU: 'Luxembourg' }

type ArticleRow = Pick<Article, 'slug' | 'titre_provisoire' | 'resume_50mots' | 'pays_cible' | 'cible' | 'published_at' | 'niveau_confiance'>

const PAYS_LIST = ['FR', 'BE', 'CH', 'CA', 'LU'] as const
const PAYS_STORAGE_KEY = 'moteurs_pays_filter'
const CIBLE_STORAGE_KEY = 'moteurs_cible_filter'
const CIBLES_VALIDES: Cible[] = ['particulier', 'pro']
const PAGE_SIZE = 25

function ArticleSearchInner({ articles }: { articles: ArticleRow[] }) {
  const searchParams = useSearchParams()
  const [query,      setQuery]      = useState('')
  const [pays,       setPays]       = useState('')
  const [cible,      setCible]      = useState<'' | Cible>('')
  const [confiance,  setConfiance]  = useState('')
  const [page,       setPage]       = useState(1)

  // Priorité : param URL > localStorage
  useEffect(() => {
    const urlPays = searchParams.get('pays')?.toUpperCase() ?? ''
    if (urlPays && PAYS_LIST.includes(urlPays as typeof PAYS_LIST[number])) {
      setPays(urlPays)
    } else {
      try {
        const saved = localStorage.getItem(PAYS_STORAGE_KEY)
        if (saved && PAYS_LIST.includes(saved as typeof PAYS_LIST[number])) {
          setPays(saved)
        }
      } catch { /* ignore */ }
    }

    const urlCible = searchParams.get('cible')?.toLowerCase() ?? ''
    if (CIBLES_VALIDES.includes(urlCible as Cible)) {
      setCible(urlCible as Cible)
    } else {
      try {
        const savedCible = localStorage.getItem(CIBLE_STORAGE_KEY)
        if (savedCible && CIBLES_VALIDES.includes(savedCible as Cible)) {
          setCible(savedCible as Cible)
        }
      } catch { /* ignore */ }
    }
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

  function handleCibleChange(value: '' | Cible) {
    setCible(value)
    try {
      if (value) localStorage.setItem(CIBLE_STORAGE_KEY, value)
      else localStorage.removeItem(CIBLE_STORAGE_KEY)
    } catch { /* ignore */ }
  }

  // Remise à la page 1 dès qu'un filtre change
  useEffect(() => { setPage(1) }, [query, pays, cible, confiance])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return articles.filter((a) => {
      if (pays && a.pays_cible !== pays) return false
      if (cible && a.cible !== cible && a.cible !== 'mixte') return false
      if (confiance && a.niveau_confiance !== confiance) return false
      if (q) {
        const inTitre   = a.titre_provisoire?.toLowerCase().includes(q)
        const inResume  = a.resume_50mots?.toLowerCase().includes(q)
        if (!inTitre && !inResume) return false
      }
      return true
    })
  }, [articles, query, pays, cible, confiance])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const paginated   = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  const hasFilters = query || pays || cible || confiance

  function reset() {
    setQuery(''); setConfiance(''); setPage(1)
    handlePaysChange('')
    handleCibleChange('')
  }

  return (
    <>
      {/* ── Toggle cible audience ── */}
      <div role="tablist" aria-label="Filtrer par audience" style={{
        display: 'flex', gap: 6, marginBottom: 14, flexWrap: 'wrap',
      }}>
        {([
          { value: '' as const, label: 'Tous', emoji: '📋' },
          { value: 'particulier' as Cible, label: CIBLE_LABEL_COURT.particulier, emoji: '🚗' },
          { value: 'pro' as Cible, label: CIBLE_LABEL_COURT.pro, emoji: '🚚' },
        ]).map((opt) => {
          const active = cible === opt.value
          return (
            <button
              key={opt.value || 'all'}
              role="tab"
              aria-selected={active}
              onClick={() => handleCibleChange(opt.value)}
              style={{
                padding: '8px 16px',
                borderRadius: 'var(--radius-md)',
                border: '1.5px solid',
                borderColor: active ? 'var(--color-primary)' : 'var(--color-border)',
                background: active ? 'var(--color-primary)' : 'white',
                color: active ? 'white' : 'var(--color-text)',
                fontSize: '0.88rem',
                fontWeight: active ? 700 : 500,
                cursor: 'pointer',
                transition: 'all 0.15s',
                display: 'inline-flex', alignItems: 'center', gap: 6,
              }}
            >
              <span aria-hidden style={{ fontSize: '0.95rem' }}>{opt.emoji}</span>
              {opt.label}
            </button>
          )
        })}
      </div>

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
                {cible && <> · {CIBLE_LABEL_COURT[cible]}</>}
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
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-end' }}>
                  <span className="tag" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><Flag code={p.toLowerCase()} size={14} /> {p}</span>
                  {a.cible && a.cible !== 'mixte' && (
                    <span style={{
                      fontSize: '0.7rem', fontWeight: 600,
                      padding: '3px 8px', borderRadius: 999,
                      background: CIBLE_COLOR[a.cible].bg,
                      color: CIBLE_COLOR[a.cible].fg,
                      border: `1px solid ${CIBLE_COLOR[a.cible].border}`,
                      whiteSpace: 'nowrap',
                    }}>{CIBLE_LABEL_COURT[a.cible]}</span>
                  )}
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
        cursor: disabled ? 'default' : 'pointer',        transition: 'all 0.15s',
      }}
    >
      {label}
    </button>
  )
}

/* ── Calcul des pages à afficher (avec ellipses) ── */
function pageRange(current: number, total: number): (number | '…')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  const pages: (number | '…')[] = []
  pages.push(1)
  if (current > 3)          pages.push('…')
  for (let p = Math.max(2, current - 1); p <= Math.min(total - 1, current + 1); p++) pages.push(p)
  if (current < total - 2)  pages.push('…')
  pages.push(total)
  return pages
}

/* ── Surlignage des termes trouvés ── */
function highlightMatch(text: string, query: string) {
  if (!query.trim()) return <>{text}</>
  const q = query.trim()
  const regex = new RegExp(`(${q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')
  const parts = text.split(regex)
  return (
    <>
      {parts.map((part, i) =>
        regex.test(part) ? (
          <mark key={i} style={{ background: 'rgba(0,184,135,0.2)', color: 'inherit', borderRadius: 2, padding: '0 2px' }}>
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  )
}
