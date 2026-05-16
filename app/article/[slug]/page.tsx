import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { supabase, FLAGS, CONF_CLASS, CONF_LABEL, type Article } from '@/lib/supabase'
import Flag from '@/components/Flag'
import ArticleActions from './ArticleActions'

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
    <article>
      {/* ── En-tête sombre ── */}
      <header className="page-hero">
        <div className="container" style={{ maxWidth: 820, margin: '0 auto' }}>
          <nav className="breadcrumb">
            <a href="/articles">← Décryptages</a>
          </nav>
          <div className="page-hero-badges">
            <span className="page-hero-badge" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><Flag code={pays.toLowerCase()} size={16} /> {pays}</span>
            {dateStr && <span className="page-hero-badge">📅 {dateStr}</span>}
            <span className={`confidence ${confCls}`} style={{ fontSize: '0.72rem' }}>{confLbl}</span>
          </div>
          <h1 style={{ position: 'relative', lineHeight: 1.18, maxWidth: 720 }}>
            {article.titre_provisoire}
          </h1>
          {article.resume_50mots && (
            <p style={{ marginTop: 14, maxWidth: 680, fontSize: '1.02rem' }}>
              {article.resume_50mots}
            </p>
          )}
        </div>
      </header>

      {/* ── Corps ── */}
      <div style={{ padding: '56px 0 80px' }}>
      <div className="container">
        <div className="article-content" style={{ maxWidth: 780, margin: '0 auto' }}>

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

          {/* ── Copyright impression uniquement ── */}
          <div className="print-copyright">
            © {new Date().getFullYear()} Moteurs.com — Tous droits réservés. Article rédigé par la rédaction Moteurs.com.
            URL : https://moteurs.com/article/{article.slug}
          </div>

          {/* ── Actions : imprimer / partager ── */}
          <ArticleActions
            titre={article.titre_provisoire ?? ''}
            url={`https://moteurs.com/article/${article.slug}`}
          />

          {/* ── Copyright ── */}
          <div className="no-print" style={{
            marginTop: 8,
            padding: '14px 18px',
            background: 'var(--color-bg-alt)',
            border: '1px solid var(--color-border)',
            borderRadius: 8,
            fontSize: '0.78rem',
            color: 'var(--color-text-soft)',
            lineHeight: 1.6,
          }}>
            © {new Date().getFullYear()} <strong>Moteurs.com</strong> — Tous droits réservés.
            Cet article a été rédigé par la rédaction Moteurs.com. Toute reproduction, même partielle,
            est interdite sans autorisation écrite préalable.
          </div>

        </div>
      </div>
      </div>
    </article>
  )
}
