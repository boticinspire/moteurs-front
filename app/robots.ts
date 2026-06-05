import type { MetadataRoute } from 'next'

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
      { userAgent: 'AhrefsBot', disallow: '/' },
      { userAgent: 'SemrushBot', disallow: '/' },
      { userAgent: 'MJ12bot', disallow: '/' },
      { userAgent: 'DotBot', disallow: '/' },
      { userAgent: 'BLEXBot', disallow: '/' },
      { userAgent: 'DataForSeoBot', disallow: '/' },
      { userAgent: 'PetalBot', disallow: '/' },
      { userAgent: 'GPTBot', disallow: '/' },
      { userAgent: 'ChatGPT-User', disallow: '/' },
      { userAgent: 'CCBot', disallow: '/' },
      { userAgent: 'anthropic-ai', disallow: '/' },
      { userAgent: 'Claude-Web', disallow: '/' },
    ],
    sitemap: 'https://moteurs.com/sitemap.xml',
    host: 'https://moteurs.com',
  }
}
