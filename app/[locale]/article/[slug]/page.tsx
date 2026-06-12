import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { supabase, FLAGS, CONF_CLASS, CONF_LABEL, CIBLE_LABEL, CIBLE_COLOR, flagForLang, labelForLang, type Article } from '@/lib/supabase'

// Emoji drapeau par langue d'article (pour le titre Open Graph)
const LANG_EMOJI: Record<string, string> = { fr: '🇫🇷', en: '🇬🇧', nl: '🇳🇱', de: '🇩🇪', es: '🇪🇸', it: '🇮🇹' }
import Flag from '@/components/Flag'
import ArticleActions from './ArticleActions'
import { buildNewsArticleJsonLd, buildFaqJsonLd, stripJsonLd } from '@/lib/articleSchema'

// ISR : revalidation toutes les heures
export const revalidate = 86400

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
    .select('titre_provisoire, meta_description, pays_cible, langue')
    .eq('slug', slug)
    .eq('etat_code', 'PUBLIE')
    .single()

  if (!article) return { title: 'Article introuvable' }

  const langue = ((article.langue as string | null) ?? 'fr').toLowerCase()
  // Hybride : emoji de la langue si traduit (≠ fr), sinon emoji du pays cible
  const emoji = (langue !== 'fr' && LANG_EMOJI[langue])
    ? LANG_EMOJI[langue]
    : (FLAGS[(article.pays_cible as string)] ?? '')
  return {
    title: article.titre_provisoire,
    description: article.meta_description ?? undefined,
    alternates: { canonical: `https://moteurs.com/article/${slug}` },
    openGraph: {
      title: `${emoji} ${article.titre_provisoire}`.trim(),
      description: article.meta_description ?? undefined,
      type: 'article',
      url: `https://moteurs.com/article/${slug}`,
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

  const conf     = article.niveau_confiance ?? 'MOYEN'
  const confCls  = CONF_CLASS[conf] ?? 'conf-medium'
  const confLbl  = CONF_LABEL[conf] ?? 'Confiance MOYEN'
  const dateStr  = article.published_at
    ? new Date(article.published_at).toLocaleDateString('fr-FR', {
        day: 'numeric', month: 'long', year: 'numeric',
      })
    : ''

  const faq = article.faq_json ?? []

  // ── JSON-LD BreadcrumbList ──
  // NB : le JSON-LD Article + FAQPage est généré par l'Agent SEO et injecté dans contenu_html.
  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Accueil', item: 'https://moteurs.com' },
      { '@type': 'ListItem', position: 2, name: 'Décryptages', item: 'https://moteurs.com/articles' },
      { '@type': 'ListItem', position: 3, name: article.titre_provisoire, item: `https://moteurs.com/article/${article.slug}` },
    ],
  }

  // ── JSON-LD NewsArticle (presse) ──
  // Remplace le JSON-LD "Article" générique injecté par l'Agent SEO dans contenu_html.
  const a = article as unknown as {
    slug: string; titre_provisoire: string; meta_title?: string | null
    meta_description?: string | null; resume_50mots?: string | null
    pays_cible?: string | null; published_at?: string | null
    etat_updated_at?: string | null
    sources_json?: { source_nom?: string | null; url_origine?: string | null; pays_source?: string | null; langue?: string | null } | null
  }
  const newsJsonLd = buildNewsArticleJsonLd({
    slug: a.slug,
    titre: a.titre_provisoire,
    meta_title: a.meta_title,
    description: a.meta_description,
    resume: a.resume_50mots,
    pays_cible: a.pays_cible,
    published_at: a.published_at,
    updated_at: a.etat_updated_at,
    sources_json: a.sources_json,
    type: 'AnalysisNewsArticle',
  })
  const faqJsonLd = buildFaqJsonLd(faq)

  // Corps nettoyé de tout JSON-LD legacy (anti-doublon de @type Article)
  const corpsHtml = article.contenu_html ? stripJsonLd(article.contenu_html) : ''

  return (
    <article>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(newsJsonLd) }} />
      {faqJsonLd && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />}

      {/* ── En-tête sombre ── */}
      <header className="page-hero">
        <div className="container" style={{ maxWidth: 820, margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <nav aria-label="Fil d'Ariane">
              <a href="/articles">← Décryptages</a>
            </nav>
            <ArticleActions
              titre={article.titre_provisoire ?? ''}
              url={`https://moteurs.com/article/${article.slug}`}
              compact
            />
          </div>
          <div className="page-hero-badges">
            <span className="page-hero-badge" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><Flag code={flagForLang(article.langue, article.pays_cible)} size={16} /> {labelForLang(article.langue, article.pays_cible)}</span>
            {dateStr && <span className="page-hero-badge">📅 {dateStr}</span>}
            <span className={`confidence ${confCls}`} style={{ fontSize: '0.72rem' }}>{confLbl}</span>
            {article.cible && article.cible !== 'mixte' && (
              <span className="page-hero-badge" style={{
                background: CIBLE_COLOR[article.cible].bg,
                color: CIBLE_COLOR[article.cible].fg,
                border: `1px solid ${CIBLE_COLOR[article.cible].border}`,
              }}>
                {article.cible === 'particulier' ? '👥' : '🏢'} {CIBLE_LABEL[article.cible]}
              </span>
            )}
          </div>
          <h1 style={{ position: 'relative', lineHeight: 1.18, maxWidth: 720 }}>
            {article.titre_provisoire}
          </h1>

          {/* ── Byline auteur YMYL ── */}
          <div style={{
            display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 10,
            marginTop: 14, marginBottom: 4,
            fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)',
          }}>
            <a href="/auteurs/olivier-lory" style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              background: 'rgba(255,255,255,0.08)', borderRadius: 20,
              padding: '4px 13px', border: '1px solid rgba(255,255,255,0.15)',
              color: 'rgba(255,255,255,0.85)', fontWeight: 600, textDecoration: 'none',
            }}>
              ✍️ Olivier Lory
            </a>
            <span>· <a href="/charte-editoriale" style={{ color: 'rgba(255,255,255,0.78)', textDecoration: 'underline' }}>Triangulation systématique</a> · Sources officielles · Niveaux de confiance affichés</span>
          </div>

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
          {corpsHtml && (
            <div
              className="article-body"
              dangerouslySetInnerHTML={{ __html: corpsHtml }}
            />
          )}

          {/* ── Voir tous les décryptages pour cette cible ── */}
          {article.cible && article.cible !== 'mixte' && (
            <div className="no-print" style={{
              marginTop: 32, padding: '20px 22px',
              background: CIBLE_COLOR[article.cible].bg,
              border: `1px solid ${CIBLE_COLOR[article.cible].border}`,
              borderRadius: 12,
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              flexWrap: 'wrap', gap: 12,
            }}>
              <div>
                <div style={{ fontSize: '0.78rem', color: CIBLE_COLOR[article.cible].fg, fontWeight: 700, marginBottom: 4 }}>
                  {article.cible === 'particulier' ? '👥 PARTICULIERS' : '🏢 PROFESSIONNELS'}
                </div>
                <div style={{ fontSize: '0.95rem', color: 'var(--color-text)' }}>
                  Découvrez tous nos décryptages {article.cible === 'particulier' ? 'pour les particuliers' : 'pour les pros'}.
                </div>
              </div>
              <a href={`/articles?cible=${article.cible}`} style={{
                padding: '10px 18px',
                background: CIBLE_COLOR[article.cible].fg,
                color: 'white',
                borderRadius: 8,
                textDecoration: 'none',
                fontWeight: 600,
                fontSize: '0.9rem',
                whiteSpace: 'nowrap',
              }}>
                Voir les décryptages →
              </a>
            </div>
          )}

          {/* ── Actions : imprimer / partager ── */}
          <ArticleActions
            titre={article.titre_provisoire ?? ''}
            url={`https://moteurs.com/article/${article.slug}`}
          />

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

          {/* ── Transparence IA (AI Act art. 50) ── */}
          <div className="no-print" style={{
            marginTop: 40,
            padding: '14px 18px',
            background: 'var(--color-bg-alt)',
            border: '1px solid var(--color-border)',
            borderLeft: '3px solid var(--color-primary)',
            borderRadius: 8,
            fontSize: '0.8rem',
            color: 'var(--color-text-soft)',
            lineHeight: 1.6,
          }}>
            🤖 <strong>Transparence</strong> — Cet article a été produit avec l&apos;assistance
            d&apos;outils d&apos;intelligence artificielle, puis vérifié et validé par la rédaction
            avant publication. La responsabilité éditoriale incombe au directeur de la publication.{' '}
            <a href="/charte-editoriale" style={{ color: 'var(--color-primary)' }}>Notre charte &amp; déontologie</a>.
          </div>

          {/* ── Copyright impression uniquement ── */}
          <div className="print-copyright">
            © {new Date().getFullYear()} Moteurs.com — Tous droits réservés. Article rédigé par la rédaction Moteurs.com.
            URL : https://moteurs.com/article/{article.slug}
          </div>



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
