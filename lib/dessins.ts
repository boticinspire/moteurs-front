/**
 * lib/dessins.ts — Galerie de dessins / illustrations éditoriales
 * Table Supabase `dessins` + bucket Storage public `dessins`.
 */
import { supabase } from '@/lib/supabase'

export type CategorieDessin = 'humour' | 'illustration' | 'article'

export type Dessin = {
  id: number
  slug: string
  titre: string
  legende: string | null
  description: string | null
  image_path: string
  image_url: string
  largeur: number | null
  hauteur: number | null
  auteur: string
  categorie: CategorieDessin | string
  article_slug: string | null
  pays_cible: string | null
  tags: string[]
  alt: string | null
  publie: boolean
  date_publication: string
}

export const CATEGORIES: { value: CategorieDessin; label: string; emoji: string }[] = [
  { value: 'humour',       label: 'Humour',       emoji: '😄' },
  { value: 'illustration', label: 'Illustrations', emoji: '🎨' },
  { value: 'article',      label: "Visuels d'articles", emoji: '📰' },
]

export const CATEGORIE_LABEL: Record<string, string> = Object.fromEntries(
  CATEGORIES.map((c) => [c.value, c.label]),
)

const SELECT =
  'id,slug,titre,legende,description,image_path,image_url,largeur,hauteur,auteur,categorie,article_slug,pays_cible,tags,alt,publie,date_publication'

/** Liste les dessins publiés, optionnellement filtrés par catégorie. */
export async function getDessins(categorie?: string): Promise<Dessin[]> {
  let q = supabase
    .from('dessins')
    .select(SELECT)
    .eq('publie', true)
    .order('date_publication', { ascending: false })
  if (categorie) q = q.eq('categorie', categorie)
  const { data, error } = await q
  if (error || !data) return []
  return data as unknown as Dessin[]
}

/** Récupère un dessin par slug. */
export async function getDessin(slug: string): Promise<Dessin | null> {
  const { data, error } = await supabase
    .from('dessins')
    .select(SELECT)
    .eq('slug', slug)
    .eq('publie', true)
    .single()
  if (error || !data) return null
  return data as unknown as Dessin
}

/** Tous les slugs publiés (generateStaticParams). */
export async function getDessinSlugs(): Promise<string[]> {
  const { data } = await supabase
    .from('dessins')
    .select('slug')
    .eq('publie', true)
    .not('slug', 'is', null)
  return (data ?? []).map((d) => d.slug as string)
}
