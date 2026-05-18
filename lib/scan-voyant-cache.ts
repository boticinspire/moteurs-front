/**
 * Moteurs.com — Cache + logs Supabase pour le scan voyant par photo
 *
 * Clé de cache : SHA-256 du base64 de l'image
 *   → même photo soumise deux fois → résultat instantané, 0 token Claude
 *
 * Analytics : GROUP BY voyant_nom pour identifier les voyants les plus scannés
 */

import { createClient } from '@supabase/supabase-js'
import { createHash }   from 'crypto'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface VoyantResult {
  voyant_nom:   string
  description:  string
  urgence:      'stop' | 'attention' | 'info'
  peut_rouler:  boolean
  actions:      string[]
  article_lien: string | null
  confiance:    'haute' | 'moyenne' | 'faible'
}

// ─── Clé de cache ─────────────────────────────────────────────────────────────

export function hashImage(image_base64: string): string {
  return createHash('sha256').update(image_base64).digest('hex')
}

// ─── Lecture cache ────────────────────────────────────────────────────────────

export async function getScanFromCache(imageHash: string): Promise<VoyantResult | null> {
  const sb = getSupabase()

  const { data, error } = await sb
    .from('scan_voyants_logs')
    .select('id, nb_requetes, voyant_nom, description, urgence, peut_rouler, actions, confiance')
    .eq('image_hash', imageHash)
    .maybeSingle()

  if (error || !data) return null

  // Mise à jour silencieuse des stats
  sb.from('scan_voyants_logs')
    .update({
      nb_requetes: data.nb_requetes + 1,
      last_used:   new Date().toISOString(),
    })
    .eq('id', data.id)
    .then(() => {})

  return {
    voyant_nom:   data.voyant_nom,
    description:  data.description  ?? '',
    urgence:      data.urgence       as VoyantResult['urgence'],
    peut_rouler:  data.peut_rouler,
    actions:      data.actions       ?? [],
    article_lien: null,
    confiance:    data.confiance     as VoyantResult['confiance'],
  }
}

// ─── Écriture cache ───────────────────────────────────────────────────────────

export async function saveScanToCache(
  imageHash: string,
  result:    VoyantResult,
): Promise<void> {
  const sb = getSupabase()

  const { error } = await sb
    .from('scan_voyants_logs')
    .upsert(
      {
        image_hash:  imageHash,
        voyant_nom:  result.voyant_nom,
        description: result.description,
        urgence:     result.urgence,
        peut_rouler: result.peut_rouler,
        actions:     result.actions,
        confiance:   result.confiance,
        nb_requetes: 1,
        last_used:   new Date().toISOString(),
      },
      { onConflict: 'image_hash', ignoreDuplicates: false },
    )

  if (error) {
    console.error('[ScanVoyantCache] Erreur upsert', error.message)
  }
}

// ─── Analytics ────────────────────────────────────────────────────────────────

/** Top N voyants les plus scannés (pour orienter le contenu éditorial) */
export async function getTopVoyants(limit = 20) {
  const sb = getSupabase()
  const { data } = await sb
    .from('scan_voyants_logs')
    .select('voyant_nom, urgence, nb_requetes, last_used')
    .order('nb_requetes', { ascending: false })
    .limit(limit)
  return data ?? []
}
