import type { Metadata } from 'next'
import { supabase, type Article } from '@/lib/supabase'
import ArticleSearch from './ArticleSearch'

export const revalidate = 1800

export const metadata: Metadata = {
  title: 'Décryptages',
  description: 'Tous les décryptages Moteurs.com : TCO, aides, ZFE, motorisations 2026. Filtrables et recherchables par mots-clés.',
}

export default async function ArticlesPage() {
  const { data: articles } = await supabase
    .from('articles')
    .select('slug, titre_provisoire, resume_50mots, pays_cible, published_at, niveau_confiance')
    .eq('etat_code', 'PUBLIE')
    .order('published_at', { ascending: false })
    .limit(200)

  return (
    <>
      <section style={{ padding: '48px 0 24px', borderBottom: '1px solid var(--color-border)' }}>
        <div className="container">
          <h1 style={{ fontSize: '2.2rem', color: 'var(--color-bg-dark)', letterSpacing: '-0.025em', fontWeight: 800 }}>
            Décryptages
          </h1>
          <p style={{ color: 'var(--color-text-soft)', maxWidth: 640, marginTop: 8, fontSize: '1rem', lineHeight: 1.6 }}>
            Veille triangulée · 2 sources minimum par fait publié · niveaux de confiance affichés.
          </p>
        </div>
      </section>

      <section style={{ padding: '32px 0 80px' }}>
        <div className="container">
          <ArticleSearch articles={(articles ?? []) as Article[]} />
        </div>
      </section>
    </>
  )
}
