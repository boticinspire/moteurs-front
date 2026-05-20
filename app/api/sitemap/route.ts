import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET() {
  try {
    // Fetch all published articles with slug and update date
    const { data: articles, error } = await supabase
      .from('articles')
      .select('slug, updated_at, statut')
      .eq('statut', 'PUBLIE')
      .order('updated_at', { ascending: false });

    if (error) throw error;

    // Static pages with priority
    const staticPages = [
      { url: 'https://moteurs.com/', priority: '1.0', changefreq: 'weekly' },
      { url: 'https://moteurs.com/b2b', priority: '0.9', changefreq: 'weekly' },
      { url: 'https://moteurs.com/particulier', priority: '0.9', changefreq: 'weekly' },
      { url: 'https://moteurs.com/articles', priority: '0.8', changefreq: 'daily' },
      { url: 'https://moteurs.com/articles/fr', priority: '0.8', changefreq: 'daily' },
      { url: 'https://moteurs.com/articles/be', priority: '0.8', changefreq: 'daily' },
      { url: 'https://moteurs.com/articles/ch', priority: '0.8', changefreq: 'daily' },
      { url: 'https://moteurs.com/articles/ca', priority: '0.8', changefreq: 'daily' },
      { url: 'https://moteurs.com/comparer', priority: '0.7', changefreq: 'monthly' },
      { url: 'https://moteurs.com/comparer-trajet', priority: '0.7', changefreq: 'monthly' },
      { url: 'https://moteurs.com/espace-membres', priority: '0.6', changefreq: 'monthly' },
      { url: 'https://moteurs.com/a-propos', priority: '0.5', changefreq: 'yearly' },
      { url: 'https://moteurs.com/mentions-legales', priority: '0.3', changefreq: 'yearly' },
    ];

    // Generate sitemap XML
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
${staticPages
  .map(
    page => `  <url>
    <loc>${page.url}</loc>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`
  )
  .join('\n')}
${articles
  .map(
    article => `  <url>
    <loc>https://moteurs.com/article/${article.slug}</loc>
    <lastmod>${new Date(article.updated_at).toISOString().split('T')[0]}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>`
  )
  .join('\n')}
</urlset>`;

    return new Response(xml, {
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200',
      },
    });
  } catch (error) {
    console.error('Sitemap generation error:', error);
    return new Response('Error generating sitemap', { status: 500 });
  }
}
