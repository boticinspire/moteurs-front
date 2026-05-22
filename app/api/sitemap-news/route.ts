import { createClient } from '@supabase/supabase-js';

export async function GET() {
  try {
    // Read env vars at runtime (not build time)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.error('Missing Supabase env vars');
      return new Response('Sitemap generation error', { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch articles published in the last 2 days
    const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString();

    const { data: articles, error } = await supabase
      .from('articles')
      .select('titre:titre_provisoire, slug, created_at, pays:pays_cible, segment')
      .eq('statut', 'PUBLIE')
      .gte('created_at', twoDaysAgo)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Generate Google News Sitemap
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
${articles
  .map(
    article => `  <url>
    <loc>https://moteurs.com/article/${article.slug}</loc>
    <news:news>
      <news:publication>
        <news:name>Moteurs.com</news:name>
        <news:language>fr</news:language>
      </news:publication>
      <news:publication_date>${new Date(article.created_at).toISOString()}</news:publication_date>
      <news:title>${escapeXml(article.titre)}</news:title>
      <news:keywords>transition énergétique, TCO, ZFE, électrique</news:keywords>
    </news:news>
  </url>`
  )
  .join('\n')}
</urlset>`;

    return new Response(xml, {
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, s-maxage=1800, stale-while-revalidate=3600',
      },
    });
  } catch (error) {
    console.error('News sitemap generation error:', error);
    return new Response('Error generating news sitemap', { status: 500 });
  }
}

function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
