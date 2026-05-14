import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { supabase, FLAGS, CONF_CLASS, CONF_LABEL, type Article } from '@/lib/supabase'

// ISR : revalidation toutes les heures
export const revalidate = 3600

// Pré-génère les slugs de tous les articles publiés au build
export async function generateStaticParams() {
  const { data } = await supabase
    .from('articles')
    .select('slug')
    .eq('etat_code', 'PUBLIE')
    .not('slug', 'is', null)

  return (data ?? []).map((a) => ({ slug: a.slug as string }))
}

// Métadonnées dynamiques par article
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const { data: article } = await supabase
    .from('articles')
    .select('titre_provisoire, meta_description, pays_cible')
    .eq('slug', slug)
    .eq('etat_code', 'PUBLIE')
    .single()

  if (!article) return { title: 'Article introuvable' }

  const pays = article.pays_cible as string
  return {
    title: article.titre_provisoire,
    description: article.meta_description ?? undefined,
    openGraph: {
      title: `${FLAGS[pays] ?? ''} ${article.titre_provisoire}`,
      description: article.meta_description ?? undefined,
      type: 'article',
    },
  }
}

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params

  const { data: article, error } = await supabase
    .from('articles')
    .select('*')
    .eq('slug', slug)
    .eq('etat_code', 'PUBLIE')
    .single<Article>()

  if (error || !article) notFound()

  const pays     = article.pays_cible
  const flag     = FLAGS[pays] ?? ''
  const conf     = article.niveau_confiance ?? 'MOYEN'
  const confCls  = CONF_CLASS[conf] ?? 'conf-medium'
  const confLbl  = CONF_LABEL[conf] ?? 'Confiance MOYEN'
  const dateStr  = article.published_at
    ? new Date(article.published_at).toLocaleDateString('fr-FR', {
        day: 'numeric', month: 'long', year: 'numeric',
      })
    : ''

  const faq = article.faq_json ?? []

  return (
    <article style={{ padding: '56px 0 80px' }}>
      <div className="container">
        <div className="article-content" style={{ maxWidth: 780, margin: '0 auto' }}>

          {/* Breadcrumb */}
          <nav className="breadcrumb">
            <a href="/articles">Décryptages</a>
            {' › '}
            {flag} {pays}
          </nav>

          {/* Meta */}
          <div className="article-meta" style={{ display: 'flex', gap: 10, marginBottom: 28, flexWrap: 'wrap', alignItems: 'center' }}>
            <span className={`tag-pays ${pays.toLowerCase()}`}>
              {flag} {pays}
            </span>
            {dateStr && (
              <span className="article-date">📅 {dateStr}</span>
            )}
            <span className={`confidence ${confCls}`}>{confLbl}</span>
          </div>

          {/* Titre */}
          <h1 style={{ fontSize: '2rem', fontWeight: 800, lineHeight: 1.2, marginBottom: 16 }}>
            {article.titre_provisoire}
          </h1>

          {/* Résumé */}
          {article.resume_50mots && (
            <p style={{
              fontSize: '1.05rem',
              color: 'var(--color-text-soft)',
              lineHeight: 1.6,
              marginBottom: 36,
              paddingBottom: 36,
              borderBottom: '1px solid var(--color-border)',
            }}>
              {article.resume_50mots}
            </p>
          )}

          {/* Corps de l'article */}
          {article.contenu_html && (
            <div
              className="article-body"
              dangerouslySetInnerHTML={{ __html: article.contenu_html }}
            />
          )}

          {/* FAQ */}
          {faq.length >= 2 && (
            <div className="article-faq" style={{ marginTop: 48, paddingTop: 32, borderTop: '1px solid var(--color-border)' }}>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: 20 }}>
                Questions fréquentes
              </h2>
              {faq.map((item, i) => (
                <div key={i} className="faq-item" style={{ marginBottom: 20 }}>
                  <div style={{ fontWeight: 600, marginBottom: 6 }}>❓ {item.question}</div>
                  <div style={{ fontSize: '0.9rem', color: 'var(--color-text-soft)', lineHeight: 1.6 }}>
                    {item.reponse}
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>
      </div>
    </article>
  )
}
