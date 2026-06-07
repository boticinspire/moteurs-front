import type { MetadataRoute } from 'next'

// Robots IA — politique « droits voisins » (décidée 07/06/2026) :
//  • BLOQUÉ : robots d'ENTRAÎNEMENT (aspiration de contenu pour entraîner des modèles).
//  • AUTORISÉ : robots de CITATION live (réponses d'assistants IA qui lient nos articles
//    = trafic + reconnaissance presse).
const AI_TRAINING_BOTS = [
  'Google-Extended',
  'GPTBot',
  'CCBot',
  'ClaudeBot',
  'anthropic-ai',
  'Claude-Web',
  'Applebot-Extended',
  'Bytespider',
  'meta-externalagent',
  'Meta-ExternalAgent',
  'FacebookBot',
  'Amazonbot',
  'cohere-ai',
  'Diffbot',
  'AI2Bot',
  'Timpibot',
  'omgilibot',
  'ImagesiftBot',
  'PanguBot',
  'Webzio-Extended',
]

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: [
          '/',
          '/articles',
          '/recharge-electrique',
          '/vacances-voiture',
          '/cout-voiture',
          '/depannage',
          '/documents-auto',
          '/outils',
        ],
        disallow: [
          '/simulateur',
          '/espace-membres',
          '/api/',
          '/api-internal/',
          '/admin/',
          '/wp-admin/',
          '/_next/',
          '/static/chunks/',
          '/cdn-cgi/',
        ],
        crawlDelay: 10,
      },
      { userAgent: 'Googlebot', allow: '/', crawlDelay: 0 },
      { userAgent: 'Bingbot', allow: '/', crawlDelay: 0 },
      { userAgent: 'Slurp', allow: '/', crawlDelay: 2 },

      // Robots de CITATION IA explicitement autorisés (visibilité presse)
      { userAgent: 'OAI-SearchBot', allow: '/' },
      { userAgent: 'ChatGPT-User', allow: '/' },
      { userAgent: 'PerplexityBot', allow: '/' },
      { userAgent: 'Perplexity-User', allow: '/' },
      { userAgent: 'DuckAssistBot', allow: '/' },

      // SEO scrapers bloqués
      { userAgent: 'AhrefsBot', disallow: '/' },
      { userAgent: 'SemrushBot', disallow: '/' },
      { userAgent: 'MJ12bot', disallow: '/' },
      { userAgent: 'DotBot', disallow: '/' },
      { userAgent: 'BLEXBot', disallow: '/' },
      { userAgent: 'DataForSeoBot', disallow: '/' },
      { userAgent: 'PetalBot', disallow: '/' },

      // Robots d'ENTRAÎNEMENT IA bloqués (opt-out droits voisins)
      ...AI_TRAINING_BOTS.map((ua) => ({ userAgent: ua, disallow: '/' })),
    ],
    sitemap: ['https://moteurs.com/sitemap.xml', 'https://moteurs.com/api/sitemap-news'],
    host: 'https://moteurs.com',
  }
}
