import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';
import { Metadata } from 'next';

// Countries mapping
const paysMap: Record<string, { label: string; long: string }> = {
  fr: { label: 'France', long: 'Articles pour la France' },
  be: { label: 'Belgique', long: 'Articles pour la Belgique' },
  ch: { label: 'Suisse', long: 'Articles pour la Suisse' },
  ca: { label: 'Canada', long: 'Articles pour le Canada' },
};

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  // Prefer service role key (server-only); fall back to anon key at build time
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient(url, key);
}

export async function generateStaticParams() {
  return Object.keys(paysMap).map(pays => ({ pays }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ pays: string }>;
}): Promise<Metadata> {
  const { pays } = await params;
  const paysConfig = paysMap[pays];
  if (!paysConfig) {
    return {
      title: 'Articles - Moteurs.com',
      description: 'Tous les articles Moteurs.com sur la transition énergétique',
    };
  }

  return {
    title: `Articles ${paysConfig.label} - Moteurs.com`,
    description: `${paysConfig.long} : décryptage TCO, ZFE, aides gouvernementales et comparatifs énergétiques.`,
    openGraph: {
      title: `Articles ${paysConfig.label} - Moteurs.com`,
      description: `${paysConfig.long} : décryptage TCO, ZFE, aides gouvernementales.`,
      url: `https://moteurs.com/articles/${pays}`,
    },
  };
}

export default async function ArticlesByCountry({
  params,
}: {
  params: Promise<{ pays: string }>;
}) {
  const { pays } = await params;
  const paysConfig = paysMap[pays];

  if (!paysConfig) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1>Pays non trouvé</h1>
        <p>
          <Link href="/articles" className="text-blue-600 hover:underline">
            ← Retour aux articles
          </Link>
        </p>
      </div>
    );
  }

  // Fetch articles for this country
  const supabase = getSupabase();
  const { data: articles, error } = await supabase
    .from('articles')
    .select('id, titre:titre_provisoire, slug, resume:resume_50mots, created_at, pays:pays_cible')
    .eq('statut', 'PUBLIE')
    .eq('pays_cible', pays.toUpperCase())
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching articles:', error);
  }

  const articleList = articles || [];

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <nav className="mb-6 text-sm text-gray-600">
        <Link href="/" className="hover:text-gray-900">
          Accueil
        </Link>
        {' > '}
        <Link href="/articles" className="hover:text-gray-900">
          Articles
        </Link>
        {' > '}
        <span>{paysConfig.label}</span>
      </nav>

      {/* Header */}
      <h1 className="mb-4 text-4xl font-bold">{paysConfig.long}</h1>
      <p className="mb-8 text-lg text-gray-700">
        Décryptage de la transition énergétique des transports routiers : TCO,
        aides gouvernementales, ZFE, et comparatifs d'énergie.
      </p>

      {/* Article count */}
      <p className="mb-6 text-sm text-gray-500">
        {articleList.length} article{articleList.length !== 1 ? 's' : ''} publié
        {articleList.length !== 1 ? 's' : ''}
      </p>

      {/* Articles Grid */}
      {articleList.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {articleList.map(article => (
            <article
              key={article.id}
              className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm hover:shadow-md transition-shadow"
            >
<div className="p-4">
<h2 className="mb-3 text-xl font-bold">
                  <Link
                    href={`/article/${article.slug}`}
                    className="text-gray-900 hover:text-blue-600"
                  >
                    {article.titre}
                  </Link>
                </h2>
                <p className="mb-4 text-sm text-gray-600">{article.resume}</p>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <time dateTime={article.created_at}>
                    {new Date(article.created_at).toLocaleDateString('fr-FR')}
                  </time>
                  <Link
                    href={`/article/${article.slug}`}
                    className="text-blue-600 hover:underline"
                  >
                    Lire →
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-8 text-center">
          <p className="text-gray-600">
            Aucun article publié pour {paysConfig.label} pour le moment.
          </p>
          <Link
            href="/articles"
            className="mt-4 inline-block text-blue-600 hover:underline"
          >
            Voir tous les articles
          </Link>
        </div>
      )}

      {/* CTA Section */}
      <div className="mt-12 rounded-lg bg-gradient-to-r from-blue-50 to-blue-100 p-8">
        <h2 className="mb-4 text-2xl font-bold">Pas trouvé ce que tu cherches?</h2>
        <p className="mb-6 text-gray-700">
          Utilise le comparateur TCO ou le calculateur de trajet pour analyser
          votre transition énergétique.
        </p>
        <div className="flex gap-4">
          <Link
            href="/comparer"
            className="inline-block rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700"
          >
            Comparateur TCO
          </Link>
          <Link
            href="/comparer-trajet"
            className="inline-block rounded-lg bg-gray-600 px-6 py-3 font-semibold text-white hover:bg-gray-700"
          >
            Coût de trajet
          </Link>
        </div>
      </div>
    </div>
  );
}
