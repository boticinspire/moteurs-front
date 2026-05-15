import type { Metadata } from 'next'
import { supabase, type Article } from '@/lib/supabase'
import ArticleSearch from './ArticleSearch'

export const revalidate = 300

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
      <section className="page-hero">
        <div className="container">
          <h1>Décryptages</h1>
          <p>Veille triangulée · 2 sources minimum par fait publié · niveaux de confiance affichés.</p>
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
