// lib/articleSchema.ts
// Génère le JSON-LD presse (NewsArticle) pour les décryptages, et nettoie
// le JSON-LD générique "Article" historiquement injecté par l'Agent SEO dans contenu_html.
//
// Pourquoi : @type "Article" = contenu générique ; @type "AnalysisNewsArticle"
// (sous-type de NewsArticle) = signal "presse / actualité" lu par Google,
// Google News/Discover et les agrégateurs.

const SITE = 'https://moteurs.com'
const LOGO = `${SITE}/assets/img/logo.png`

// Variante de NewsArticle selon la nature éditoriale.
// Les décryptages Moteurs.com sont des analyses -> AnalysisNewsArticle.
export type NewsArticleType =
  | 'NewsArticle'
  | 'AnalysisNewsArticle'
  | 'ReportageNewsArticle'
  | 'OpinionNewsArticle'
  | 'BackgroundNewsArticle'

type SourceJson = {
  source_nom?: string | null
  url_origine?: string | null
  pays_source?: string | null
  langue?: string | null
} | null

export type ArticleSchemaInput = {
  slug: string
  titre: string
  meta_title?: string | null
  description?: string | null
  resume?: string | null
  pays_cible?: string | null
  published_at?: string | null
  updated_at?: string | null
  sources_json?: SourceJson
  faq?: { question: string; reponse: string }[] | null
  type?: NewsArticleType
}

const LANG_BY_PAYS: Record<string, string> = {
  FR: 'fr-FR',
  BE: 'fr-BE',
  CH: 'fr-CH',
  CA: 'fr-CA',
  LU: 'fr-LU',
}

/**
 * Supprime tous les blocs <script type="application/ld+json">…</script>
 * présents dans le HTML d'article (JSON-LD "Article" générique de l'Agent SEO),
 * pour éviter tout doublon avec le NewsArticle réinjecté côté Next.js.
 */
export function stripJsonLd(html: string): string {
  if (!html) return html
  return html.replace(
    /<script[^>]*type=["']application\/ld\+json["'][^>]*>[\s\S]*?<\/script>/gi,
    ''
  )
}

/**
 * Construit le JSON-LD NewsArticle (presse) d'un décryptage.
 */
export function buildNewsArticleJsonLd(a: ArticleSchemaInput) {
  const url = `${SITE}/article/${a.slug}`
  const lang = LANG_BY_PAYS[(a.pays_cible ?? 'FR').toUpperCase()] ?? 'fr-FR'
  const published = a.published_at ?? undefined
  const modified = a.updated_at ?? a.published_at ?? undefined

  // citation structurée à partir de la source d'origine (triangulation)
  const citation: Record<string, string>[] = []
  const s = a.sources_json
  if (s && (s.source_nom || s.url_origine)) {
    const c: Record<string, string> = { '@type': 'CreativeWork' }
    if (s.source_nom) c.name = s.source_nom
    if (s.url_origine) c.url = s.url_origine
    if (s.langue) c.inLanguage = s.langue
    citation.push(c)
  }

  const jsonLd: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': a.type ?? 'AnalysisNewsArticle',
    headline: (a.meta_title || a.titre || '').slice(0, 110),
    description: a.description ?? a.resume ?? undefined,
    image: [`${url}/opengraph-image`],
    inLanguage: lang,
    articleSection: 'Décryptages',
    isAccessibleForFree: true,
    datePublished: published,
    dateModified: modified,
    author: {
      '@type': 'Person',
      name: 'Olivier Lory',
      url: `${SITE}/auteurs/olivier-lory`,
    },
    publisher: {
      '@type': 'NewsMediaOrganization',
      name: 'Moteurs.com',
      url: SITE,
      logo: { '@type': 'ImageObject', url: LOGO },
      ethicsPolicy: `${SITE}/charte-editoriale`,
      diversityPolicy: `${SITE}/charte-editoriale`,
      masthead: `${SITE}/a-propos`,
    },
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
  }

  if (citation.length) jsonLd.citation = citation

  // nettoyage des undefined pour un JSON-LD propre
  return JSON.parse(JSON.stringify(jsonLd))
}

/**
 * JSON-LD FAQPage à partir de faq_json (≥ 2 questions).
 */
export function buildFaqJsonLd(faq?: { question: string; reponse: string }[] | null) {
  if (!faq || faq.length < 2) return null
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faq.map((f) => ({
      '@type': 'Question',
      name: f.question,
      acceptedAnswer: { '@type': 'Answer', text: f.reponse },
    })),
  }
}
