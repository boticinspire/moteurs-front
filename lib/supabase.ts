import { createClient } from '@supabase/supabase-js'

const supabaseUrl  = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Client côté serveur (Server Components, generateStaticParams)
export const supabase = createClient(supabaseUrl, supabaseAnon)

// Types article
export type Article = {
  id: number
  slug: string
  titre_provisoire: string
  resume_50mots: string | null
  meta_description: string | null
  contenu_html: string | null
  faq_json: { question: string; reponse: string }[] | null
  pays_cible: 'FR' | 'BE' | 'CH' | 'CA' | 'LU'
  niveau_confiance: 'ÉLEVÉ' | 'MOYEN' | 'FAIBLE' | 'DATA_MISSING' | null
  etat_code: string
  published_at: string | null
}

export const FLAGS: Record<string, string> = {
  FR: '🇫🇷', BE: '🇧🇪', CH: '🇨🇭', CA: '🇨🇦', LU: '🇱🇺',
}

export const CONF_CLASS: Record<string, string> = {
  'ÉLEVÉ': 'conf-high', 'MOYEN': 'conf-medium',
  'FAIBLE': 'conf-low', 'DATA_MISSING': 'conf-low',
}

export const CONF_LABEL: Record<string, string> = {
  'ÉLEVÉ': 'Confiance ÉLEVÉ', 'MOYEN': 'Confiance MOYEN',
  'FAIBLE': 'À vérifier', 'DATA_MISSING': 'À vérifier',
}
