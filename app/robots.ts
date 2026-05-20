import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin', '/espace-membres', '/desinscription'],
      },
    ],
    sitemap: [
      'https://moteurs.com/sitemap.xml',
      'https://moteurs.com/api/sitemap-news',
    ],
    host: 'https://moteurs.com',
  }
}
