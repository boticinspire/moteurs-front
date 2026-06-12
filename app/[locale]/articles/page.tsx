import type { Metadata } from 'next'
import { Link } from '@/i18n/navigation'
import { supabase, type Article } from '@/lib/supabase'
import ArticleSearch from './ArticleSearch'
import { getStaticMetadata } from '@/lib/seo-keywords'

export const metadata = getStaticMetadata('/articles')


export const revalidate = 3600

export default async function ArticlesPage() {
  const { data: articles } = await supabase
    .from('articles')
    .select('slug, titre_provisoire, resume_50mots, pays_cible, langue, cible, published_at, niveau_confiance')
    .eq('etat_code', 'PUBLIE')
    .order('published_at', { ascending: false })
    .limit(1000)

  return (
    <>
      <section className="page-hero">
        <div className="container">
          <h1>Décryptages</h1>
          <p>Veille triangulée · 2 sources minimum par fait publié · niveaux de confiance affichés.</p>
        </div>
      </section>

      <section style={{ padding: '32px 0 80px' }}>
        <div className="container">
          <ArticleSearch articles={(articles ?? []) as Article[]} />

          {/* Index SSR : rend TOUS les liens articles dans le HTML pour le crawl.
              ArticleSearch (client, Suspense) n'émet aucun lien en SSR ; ce bloc
              garantit que les 1000+ décryptages restent atteignables par les bots
              et que le jus de lien interne circule. Replié pour rester propre. */}
          <details style={{ marginTop: 40 }}>
            <summary style={{ cursor: 'pointer', fontSize: '0.9rem', color: 'var(--color-text-soft)', fontWeight: 600 }}>
              Tous les décryptages ({(articles ?? []).length})
            </summary>
            <ul style={{ columns: '2 280px', gap: 24, marginTop: 16, fontSize: '0.88rem', lineHeight: 1.7, listStyle: 'none', padding: 0 }}>
              {(articles ?? []).map((a) => (
                <li key={a.slug} style={{ breakInside: 'avoid', marginBottom: 4 }}>
                  <Link href={`/article/${a.slug}`}>{a.titre_provisoire}</Link>
                </li>
              ))}
            </ul>
          </details>
        </div>
      </section>
    </>
  )
}
