import type { MetadataRoute } from 'next'
import routesData from '@/data/routes-vacances.json'
import { TRAJETS_SEO, variantesForTrajet } from '@/lib/trajets-seo'
import { routing } from '@/i18n/routing'

const BASE = 'https://moteurs.com'

/**
 * Construit l'objet `alternates.languages` pour un chemin donne,
 * en respectant la strategie "as-needed" :
 *   - la locale par defaut (fr) n'a PAS de prefixe (/comparer)
 *   - les autres locales ont leur prefixe (/en/comparer, /de/comparer...)
 */
function altLanguages(pathname: string): Record<string, string> {
  const langs: Record<string, string> = {}
  for (const l of routing.locales) {
    langs[l] = l === routing.defaultLocale ? `${BASE}${pathname}` : `${BASE}/${l}${pathname}`
  }
  langs['x-default'] = `${BASE}${pathname}`
  return langs
}

const TRAJET_SLUGS = (routesData as { slug: string }[]).map(r => r.slug)

const TRAJET_SEO_URLS: string[] = [
  '/trajet',
  ...TRAJETS_SEO.map(t => `/trajet/${t.slug}`),
  ...TRAJETS_SEO.flatMap(t =>
    variantesForTrajet(t).map(v => `/trajet/${t.slug}/${v}`)
  ),
]

const TCO_PAYS    = ['fr', 'be', 'ch', 'ca']
const TCO_SEGMENTS = [
  'voiture', 'vae', 'trottinette', 'moto',
  'vul-petit', 'vul-moyen', 'vul-grand', 'camion', 'poids-lourd',
]

const PAGES_STATIQUES: { url: string; priority: number; changeFreq: MetadataRoute.Sitemap[0]['changeFrequency'] }[] = [
  { url: '/',              priority: 1.0,  changeFreq: 'weekly'  },
  { url: '/articles',      priority: 0.9,  changeFreq: 'daily'   },
  { url: '/outils',              priority: 0.85, changeFreq: 'weekly'  },
  { url: '/outils/tco-poids-lourds', priority: 0.85, changeFreq: 'monthly' },
  { url: '/assistance',    priority: 0.85, changeFreq: 'weekly'  },
  { url: '/simulateur',    priority: 0.85, changeFreq: 'monthly' },
  { url: '/comparer',      priority: 0.85, changeFreq: 'monthly' },
  { url: '/comparer-trajet', priority: 0.8, changeFreq: 'monthly' },
  { url: '/tco',           priority: 0.8,  changeFreq: 'monthly' },
  { url: '/recharge-electrique', priority: 0.9, changeFreq: 'weekly' },
  { url: '/vacances-voiture',    priority: 0.9, changeFreq: 'weekly' },
  { url: '/vacances-voiture/checklist-ev', priority: 0.85, changeFreq: 'monthly' },
  { url: '/cout-voiture',        priority: 0.9, changeFreq: 'weekly' },
  { url: '/depannage',           priority: 0.9, changeFreq: 'weekly' },
  { url: '/documents-auto',      priority: 0.85, changeFreq: 'monthly' },
  { url: '/assistant-vacances',      priority: 0.8, changeFreq: 'monthly' },
  { url: '/checklist-depart',        priority: 0.8, changeFreq: 'monthly' },
  { url: '/assistance/couts',        priority: 0.8, changeFreq: 'monthly' },
  { url: '/assistance/recharge',     priority: 0.8, changeFreq: 'monthly' },
  { url: '/assistance/achat',        priority: 0.8, changeFreq: 'monthly' },
  { url: '/assistance/panne',        priority: 0.8, changeFreq: 'monthly' },
  { url: '/assistance/location',     priority: 0.8, changeFreq: 'monthly' },
  { url: '/assistance/sante',        priority: 0.8, changeFreq: 'monthly' },
  { url: '/assistance/meteo',        priority: 0.8, changeFreq: 'monthly' },
  { url: '/assistance/surprises',    priority: 0.8, changeFreq: 'monthly' },
  { url: '/assistance/admin',        priority: 0.7, changeFreq: 'monthly' },
  { url: '/outils/immatriculation-france',  priority: 0.75, changeFreq: 'monthly' },
  { url: '/outils/immatriculation-belgique', priority: 0.75, changeFreq: 'monthly' },
  { url: '/outils/convertisseur',           priority: 0.7,  changeFreq: 'monthly' },
  { url: '/articles/fr', priority: 0.8, changeFreq: 'daily'   },
  { url: '/articles/be', priority: 0.8, changeFreq: 'daily'   },
  { url: '/articles/ch', priority: 0.8, changeFreq: 'daily'   },
  { url: '/articles/ca', priority: 0.8, changeFreq: 'daily'   },
  { url: '/b2b',        priority: 0.7, changeFreq: 'monthly' },
  { url: '/particulier', priority: 0.7, changeFreq: 'monthly' },
  { url: '/assistant-depannage',          priority: 0.85, changeFreq: 'weekly'  },
  { url: '/assistant-depannage/voyants',  priority: 0.75, changeFreq: 'monthly' },
  { url: '/constat',                       priority: 0.8,  changeFreq: 'monthly' },
  { url: '/outils/comparer-modeles',        priority: 0.8,  changeFreq: 'weekly'  },
  { url: '/outils/cartes-recharge',        priority: 0.85, changeFreq: 'weekly'  },
  { url: '/outils/documents-europe',       priority: 0.75, changeFreq: 'monthly' },
  { url: '/outils/recharge-domicile-voiture-societe-belgique', priority: 0.7, changeFreq: 'monthly' },
  { url: '/outils/amende-pv',               priority: 0.85, changeFreq: 'monthly'  },
  { url: '/a-propos',       priority: 0.4, changeFreq: 'yearly' },
  { url: '/mentions-legales', priority: 0.3, changeFreq: 'yearly' },
]

async function fetchArticlesSlugs(): Promise<{ slug: string; updated_at: string }[]> {
  const supabaseUrl  = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey  = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!supabaseUrl || !supabaseKey) return []

  try {
    const res = await fetch(
      `${supabaseUrl}/rest/v1/articles?select=slug,updated_at&statut=eq.PUBLIE&order=updated_at.desc`,
      {
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
        },
        next: { revalidate: 3600 },
      }
    )
    if (!res.ok) return []
    const data: { slug: string; updated_at: string }[] = await res.json()
    return data
  } catch {
    return []
  }
}

/**
 * Liste les cartes de recharge actives via le backend Railway (memoire identique
 * a celle utilisee par /api/cartes-recharge → ComparateurCartes).
 * Sert a generer dynamiquement les URLs /outils/cartes-recharge/[carte_id].
 */
async function fetchCartesIds(): Promise<{ id: string; updated_at: string }[]> {
  try {
    const res = await fetch(
      'https://orchestrateur-production.up.railway.app/recharge/cartes',
      {
        headers: { Accept: 'application/json' },
        next: { revalidate: 3600 },
      }
    )
    if (!res.ok) return []
    const data: { nb?: number; cartes?: { id: string; actif?: boolean; updated_at?: string }[] } = await res.json()
    return (data.cartes ?? [])
      .filter(c => c.actif !== false && typeof c.id === 'string' && c.id.length > 0)
      .map(c => ({ id: c.id, updated_at: c.updated_at ?? new Date().toISOString() }))
  } catch {
    return []
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date().toISOString()

  const staticEntries: MetadataRoute.Sitemap = PAGES_STATIQUES.map(p => ({
    url: `${BASE}${p.url}`,
    lastModified: now,
    changeFrequency: p.changeFreq,
    priority: p.priority,
    alternates: { languages: altLanguages(p.url) },
  }))

  const trajetEntries: MetadataRoute.Sitemap = TRAJET_SLUGS.map(slug => ({
    url: `${BASE}/comparer-trajet/${slug}`,
    lastModified: now,
    changeFrequency: 'monthly' as const,
    priority: 0.75,
    alternates: { languages: altLanguages(`/comparer-trajet/${slug}`) },
  }))

  const trajetSeoEntries: MetadataRoute.Sitemap = TRAJET_SEO_URLS.map(url => ({
    url: `${BASE}${url}`,
    lastModified: now,
    changeFrequency: 'monthly' as const,
    priority: url === '/trajet' ? 0.85 : url.split('/').length === 3 ? 0.82 : 0.78,
    alternates: { languages: altLanguages(url) },
  }))

  const tcoEntries: MetadataRoute.Sitemap = TCO_PAYS.flatMap(pays =>
    TCO_SEGMENTS.map(segment => ({
      url: `${BASE}/tco/${pays}/${segment}`,
      lastModified: now,
      changeFrequency: 'monthly' as const,
      priority: 0.7,
      alternates: { languages: altLanguages(`/tco/${pays}/${segment}`) },
    }))
  )

  const [articles, cartes] = await Promise.all([fetchArticlesSlugs(), fetchCartesIds()])
  const articleEntries: MetadataRoute.Sitemap = articles.map(a => ({
    url: `${BASE}/article/${a.slug}`,
    lastModified: new Date(a.updated_at).toISOString(),
    changeFrequency: 'weekly' as const,
    priority: 0.85,
  }))

  const carteEntries: MetadataRoute.Sitemap = cartes.map(c => ({
    url: `${BASE}/outils/cartes-recharge/${c.id}`,
    lastModified: new Date(c.updated_at).toISOString(),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
    alternates: { languages: altLanguages(`/outils/cartes-recharge/${c.id}`) },
  }))

  return [
    ...staticEntries,
    ...trajetEntries,
    ...trajetSeoEntries,
    ...tcoEntries,
    ...articleEntries,
    ...carteEntries,
  ]
}
