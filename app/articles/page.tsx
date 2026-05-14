import type { Metadata } from 'next'
import Link from 'next/link'
import { supabase, FLAGS, CONF_CLASS, CONF_LABEL, type Article } from '@/lib/supabase'

export const revalidate = 1800

export const metadata: Metadata = {
  title: 'Décryptages',
  description: 'Tous les décryptages Moteurs.com : TCO, aides, ZFE, motorisations 2026. Filtrables par pays et segment.',
}

type SearchParams = { pays?: string }

export default async function ArticlesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const { pays } = await searchParams

  let query = supabase
    .from('articles')
    .select('slug, titre_provisoire, resume_50mots, pays_cible, published_at, niveau_confiance')
    .eq('etat_code', 'PUBLIE')
    .order('published_at', { ascending: false })
    .limit(100)

  if (pays && ['FR', 'BE', 'CH', 'CA'].includes(pays)) {
    query = query.eq('pays_cible', pays)
  }

  const { data: articles } = await query

  const PAYS_LIST = ['FR', 'BE', 'CH', 'CA']

  return (
    <>
      <section style={{ padding: '48px 0 24px' }}>
        <div className="container">
          <h1 style={{ fontSize: '2.4rem', color: 'var(--color-bg-dark)', letterSpacing: '-0.02em' }}>
            Décryptages
          </h1>
          <p style={{ color: 'var(--color-text-soft)', maxWidth: 720, marginTop: 8 }}>
            Veille triangulée · 2 sources minimum par fait publié · niveaux de confiance affichés.
          </p>
        </div>
      </section>

      <section style={{ padding: '0 0 80px' }}>
        <div className="container">

          {/* Filtres pays */}
          <div className="filters" style={{ marginBottom: 32 }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-soft)', padding: '8px 6px', alignSelf: 'center' }}>
              Pays&nbsp;:
            </span>
            <Link
              href="/articles"
              className={`filter-btn${!pays ? ' active' : ''}`}
            >
              Tous
            </Link>
            {PAYS_LIST.map((p) => (
              <Link
                key={p}
                href={`/articles?pays=${p}`}
                className={`filter-btn${pays === p ? ' active' : ''}`}
              >
                {FLAGS[p]} {p}
              </Link>
            ))}
          </div>

          {/* Liste articles */}
          <div className="article-list">
            {(articles ?? []).length === 0 ? (
              <p style={{ textAlign: 'center', padding: '48px', color: 'var(--color-text-soft)' }}>
                Aucun article ne correspond à ces filtres.
              </p>
            ) : (
              (articles ?? []).map((a) => {
                const p    = a.pays_cible as string
                const flag = FLAGS[p] ?? ''
                const conf = (a as Article).niveau_confiance ?? 'MOYEN'
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
                          {a.titre_provisoire}
                        </Link>
                      </h3>
                      {a.resume_50mots && <p>{a.resume_50mots}</p>}
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

        </div>
      </section>
    </>
  )
}
