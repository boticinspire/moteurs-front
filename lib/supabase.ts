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
  langue?: string
  cible: 'particulier' | 'pro' | 'mixte'
  niveau_confiance: 'ÉLEVÉ' | 'MOYEN' | 'FAIBLE' | 'DATA_MISSING' | null
  etat_code: string
  published_at: string | null
}

export const FLAGS: Record<string, string> = {
  FR: '🇫🇷', BE: '🇧🇪', CH: '🇨🇭', CA: '🇨🇦', LU: '🇱🇺',
}

/**
 * Drapeau d'un article = sa LANGUE (et non son pays cible).
 * Un article traduit en italien affiche 🇮🇹, en allemand 🇩🇪, etc.
 * Mappe le code langue ISO 639-1 vers le code drapeau (fichier public/flags/<code>.svg).
 */
export const LANG_FLAG: Record<string, string> = {
  fr: 'fr', en: 'gb', nl: 'nl', de: 'de', es: 'es', it: 'it',
}

export const LANG_CODE: Record<string, string> = {
  fr: 'FR', en: 'EN', nl: 'NL', de: 'DE', es: 'ES', it: 'IT',
}

/** Code drapeau à utiliser pour la langue d'un article (fallback FR). */
export function flagForLang(langue?: string | null): string {
  return LANG_FLAG[(langue ?? 'fr').toLowerCase()] ?? 'fr'
}

/** Libellé court de la langue (fallback code en majuscules, ou FR). */
export function labelForLang(langue?: string | null): string {
  const l = (langue ?? 'fr').toLowerCase()
  return LANG_CODE[l] ?? l.toUpperCase()
}

export const CONF_CLASS: Record<string, string> = {
  'ÉLEVÉ': 'conf-high', 'MOYEN': 'conf-medium',
  'FAIBLE': 'conf-low', 'DATA_MISSING': 'conf-low',
}

export const CONF_LABEL: Record<string, string> = {
  'ÉLEVÉ': 'Confiance ÉLEVÉ', 'MOYEN': 'Confiance MOYEN',
  'FAIBLE': 'À vérifier', 'DATA_MISSING': 'À vérifier',
}

export type Cible = 'particulier' | 'pro' | 'mixte'

export const CIBLE_LABEL: Record<Cible, string> = {
  particulier: 'Pour les particuliers',
  pro: 'Pour les pros',
  mixte: 'Particuliers et pros',
}

export const CIBLE_LABEL_COURT: Record<Cible, string> = {
  particulier: 'Particulier',
  pro: 'Pro',
  mixte: 'Mixte',
}

export const CIBLE_COLOR: Record<Cible, { bg: string; fg: string; border: string }> = {
  particulier: { bg: 'rgba(59,130,246,0.10)',  fg: '#1d4ed8', border: 'rgba(59,130,246,0.35)' },
  pro:         { bg: 'rgba(0,184,135,0.10)',   fg: '#047857', border: 'rgba(0,184,135,0.35)' },
  mixte:       { bg: 'rgba(148,163,184,0.12)', fg: '#475569', border: 'rgba(148,163,184,0.35)' },
}
