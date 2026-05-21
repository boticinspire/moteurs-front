import type { MetadataRoute } from 'next'
import routesData from '@/data/routes-vacances.json'
import { TRAJETS_SEO, variantesForTrajet } from '@/lib/trajets-seo'

const BASE = 'https://moteurs.com'

// ── Slugs trajets vacances (comparateur libre) ─────────────────────────────────
const TRAJET_SLUGS = (routesData as { slug: string }[]).map(r => r.slug)

// ── Slugs trajets SEO (/trajet/[slug] + /trajet/[slug]/[variante]) ─────────────
const TRAJET_SEO_URLS: string[] = [
  '/trajet',
  ...TRAJETS_SEO.map(t => `/trajet/${t.slug}`),
  ...TRAJETS_SEO.flatMap(t =>
    variantesForTrajet(t).map(v => `/trajet/${t.slug}/${v}`)
  ),
]

// ── Combos TCO /tco/[pays]/[segment] ──────────────────────────────────────────
const TCO_PAYS    = ['fr', 'be', 'ch', 'ca']
const TCO_SEGMENTS = [
  'voiture', 'vae', 'trottinette', 'moto',          // particuliers
  'vul-petit', 'vul-moyen', 'vul-grand', 'camion', 'poids-lourd', // B2B
]

// ── Pages statiques ────────────────────────────────────────────────────────────
const PAGES_STATIQUES: { url: string; priority: number; changeFreq: MetadataRoute.Sitemap[0]['changeFrequency'] }[] = [
  // Cœur du site
  { url: '/',              priority: 1.0,  changeFreq: 'weekly'  },
  { url: '/articles',      priority: 0.9,  changeFreq: 'daily'   },
  { url: '/outils',        priority: 0.85, changeFreq: 'weekly'  },
  { url: '/assistance',    priority: 0.85, changeFreq: 'weekly'  },
  { url: '/simulateur',    priority: 0.85, changeFreq: 'monthly' },
  { url: '/comparer',      priority: 0.85, changeFreq: 'monthly' },
  { url: '/comparer-trajet', priority: 0.8, changeFreq: 'monthly' },
  { url: '/tco',           priority: 0.8,  changeFreq: 'monthly' },

  // Hubs SEO thématiques
  { url: '/recharge-electrique', priority: 0.9, changeFreq: 'weekly' },
  { url: '/vacances-voiture',    priority: 0.9, changeFreq: 'weekly' },
  { url: '/cout-voiture',        priority: 0.9, changeFreq: 'weekly' },
  { url: '/depannage',           priority: 0.9, changeFreq: 'weekly' },

  // Assistances
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

  // Outils
  { url: '/outils/immatriculation-france',  priority: 0.75, changeFreq: 'monthly' },
  { url: '/outils/immatriculation-belgique', priority: 0.75, changeFreq: 'monthly' },
  { url: '/outils/convertisseur',           priority: 0.7,  changeFreq: 'monthly' },

  // Articles par pays (SSG)
  { url: '/articles/fr', priority: 0.8, changeFreq: 'daily'   },
  { url: '/articles/be', priority: 0.8, changeFreq: 'daily'   },
  { url: '/articles/ch', priority: 0.8, changeFreq: 'daily'   },
  { url: '/articles/ca', priority: 0.8, changeFreq: 'daily'   },

  // Segments
  { url: '/b2b',        priority: 0.7, changeFreq: 'monthly' },
  { url: '/particulier', priority: 0.7, changeFreq: 'monthly' },

  // Légal / info
  { url: '/a-propos',       priority: 0.4, changeFreq: 'yearly' },
  { url: '/mentions-legales', priority: 0.3, changeFreq: 'yearly' },
]

// ── Fetch articles publiés depuis Supabase ────────────────────────────────────
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
        next: { revalidate: 3600 }, // revalide 1x/heure
      }
    )
    if (!res.ok) return []
    const data: { slug: string; updated_at: string }[] = await res.json()
    return data
  } catch {
    return []
  }
}

// ── Sitemap principal ─────────────────────────────────────────────────────────
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date().toISOString()

  // 1. Pages statiques
  const staticEntries: MetadataRoute.Sitemap = PAGES_STATIQUES.map(p => ({
    url: `${BASE}${p.url}`,
    lastModified: now,
    changeFrequency: p.changeFreq,
    priority: p.priority,
  }))

  // 2. Pages trajets vacances (25 routes) — comparateur libre
  const trajetEntries: MetadataRoute.Sitemap = TRAJET_SLUGS.map(slug => ({
    url: `${BASE}/comparer-trajet/${slug}`,
    lastModified: now,
    changeFrequency: 'monthly' as const,
    priority: 0.75,
  }))

  // 2bis. Pages trajets SEO (/trajet/[slug] + variantes) — 15 routes × ~5 variantes
  const trajetSeoEntries: MetadataRoute.Sitemap = TRAJET_SEO_URLS.map(url => ({
    url: `${BASE}${url}`,
    lastModified: now,
    changeFrequency: 'monthly' as const,
    priority: url === '/trajet' ? 0.85 : url.split('/').length === 3 ? 0.82 : 0.78,
  }))

  // 3. Pages TCO par pays / segment (4 x 9 = 36 pages)
  const tcoEntries: MetadataRoute.Sitemap = TCO_PAYS.flatMap(pays =>
    TCO_SEGMENTS.map(segment => ({
      url: `${BASE}/tco/${pays}/${segment}`,
      lastModified: now,
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    }))
  )

  // 4. Articles publies depuis Supabase
  const articles = await fetchArticlesSlugs()
  const articleEntries: MetadataRoute.Sitemap = articles.map(a => ({
    url: `${BASE}/article/${a.slug}`,
    lastModified: new Date(a.updated_at).toISOString(),
    changeFrequency: 'weekly' as const,
    priority: 0.85,
  }))

  return [
    ...staticEntries,
    ...trajetEntries,
    ...trajetSeoEntries,
    ...tcoEntries,
    ...articleEntries,
  ]
}
