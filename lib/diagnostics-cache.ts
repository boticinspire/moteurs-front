/**
 * Moteurs.com — Cache Supabase pour les diagnostics IA
 * Évite de reconsommer des tokens Claude pour des combinaisons symptôme/réponses déjà traitées.
 * La clé de cache est un SHA-256 déterministe de (motorisation + symptome + réponses normalisées).
 */

import { createClient } from '@supabase/supabase-js'
import { createHash } from 'crypto'

// ─── Client Supabase (server-side only — utilisé dans les API routes) ─────────

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface DiagnostiqueReponse {
  question: string
  reponse:  string
}

export interface DiagnosticCache {
  id:             number
  cache_key:      string
  motorisation:   string
  symptome_label: string
  reponses_json:  DiagnostiqueReponse[]
  diagnostic_json: Record<string, unknown>
  nb_requetes:    number
  created_at:     string
  last_used:      string
}

// ─── Génération de la clé de cache ───────────────────────────────────────────

/**
 * Génère une clé SHA-256 déterministe à partir de la combinaison motorisation + symptôme + réponses.
 * Normalise les textes (lowercase, trim) pour éviter les doublons sur différences de casse.
 */
export function genererCacheKey(
  motorisation:   string,
  symptome_label: string,
  reponses:       DiagnostiqueReponse[],
): string {
  const norm = (s: string) => s.toLowerCase().trim().replace(/\s+/g, ' ')

  const raw = [
    norm(motorisation),
    norm(symptome_label),
    ...reponses.map(r => `${norm(r.question)}::${norm(r.reponse)}`),
  ].join('||')

  return createHash('sha256').update(raw).digest('hex')
}

// ─── Lecture cache ────────────────────────────────────────────────────────────

/**
 * Cherche un diagnostic en cache.
 * Si trouvé, incrémente nb_requetes + met à jour last_used (fire & forget).
 */
export async function getDiagnosticFromCache(
  cacheKey: string,
): Promise<Record<string, unknown> | null> {
  const sb = getSupabase()

  const { data, error } = await sb
    .from('diagnostics_cache')
    .select('id, nb_requetes, diagnostic_json')
    .eq('cache_key', cacheKey)
    .maybeSingle()

  if (error || !data) return null

  // Mise à jour silencieuse des stats
  sb.from('diagnostics_cache')
    .update({
      nb_requetes: data.nb_requetes + 1,
      last_used:   new Date().toISOString(),
    })
    .eq('id', data.id)
    .then(() => {})

  return data.diagnostic_json as Record<string, unknown>
}

// ─── Écriture cache ───────────────────────────────────────────────────────────

/**
 * Sauvegarde un diagnostic Claude dans le cache.
 * Utilise upsert sur cache_key pour éviter les doublons en cas de race condition.
 */
export async function saveDiagnosticToCache(params: {
  cacheKey:       string
  motorisation:   string
  symptome_label: string
  reponses:       DiagnostiqueReponse[]
  diagnostic:     Record<string, unknown>
}): Promise<void> {
  const sb = getSupabase()

  const { error } = await sb
    .from('diagnostics_cache')
    .upsert(
      {
        cache_key:       params.cacheKey,
        motorisation:    params.motorisation,
        symptome_label:  params.symptome_label,
        reponses_json:   params.reponses,
        diagnostic_json: params.diagnostic,
        nb_requetes:     1,
        last_used:       new Date().toISOString(),
      },
      { onConflict: 'cache_key', ignoreDuplicates: false },
    )

  if (error) {
    console.error('[DiagnosticsCache] Erreur upsert', error.message)
  }
}

// ─── Stats ────────────────────────────────────────────────────────────────────

/** Retourne les N diagnostics les plus demandés (pour audit et optimisation) */
export async function getTopDiagnostics(limit = 20): Promise<DiagnosticCache[]> {
  const sb = getSupabase()
  const { data } = await sb
    .from('diagnostics_cache')
    .select('*')
    .order('nb_requetes', { ascending: false })
    .limit(limit)
  return (data ?? []) as DiagnosticCache[]
}
