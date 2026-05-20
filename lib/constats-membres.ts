/**
 * Moteurs.com — Persistence des constats amiables sauvegardés par les membres.
 *
 * Table Supabase : `constats_membres` (migration : supabase/migrations/2026-05-20…).
 * RLS : un utilisateur ne voit / modifie / supprime QUE ses propres constats.
 *
 * Schéma hybride :
 *   - `data` (jsonb) : dump complet du ConstantData (source de vérité)
 *   - `date_accident`, `lieu`, `pays`, `vehicule_a_immat`, `vehicule_b_immat`
 *     extraits du JSON pour permettre la liste rapide sans parser tout le blob.
 */

import { getSupabaseClient } from './user-context'
import type { ConstantData } from './constat'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ConstatMembreRow {
  id:                 string
  user_id:            string
  created_at:         string
  updated_at:         string
  data:               ConstantData
  date_accident:      string | null
  lieu:               string | null
  pays:               string | null
  vehicule_a_immat:   string | null
  vehicule_b_immat:   string | null
  statut:             'draft' | 'sauvegarde' | 'envoye'
}

/** Sous-ensemble retourné par la liste (sans le `data` complet — économise la BP). */
export interface ConstatMembreItem {
  id:                 string
  created_at:         string
  date_accident:      string | null
  lieu:               string | null
  pays:               string | null
  vehicule_a_immat:   string | null
  vehicule_b_immat:   string | null
  statut:             ConstatMembreRow['statut']
}

// ─── Extracts depuis ConstantData ─────────────────────────────────────────────

/** Construit le dict des champs extraits pour la colonne hybride. */
function extractsFromConstat(c: ConstantData) {
  return {
    date_accident:    c.date || null,
    lieu:             c.lieu?.trim() || null,
    pays:             c.pays || null,
    vehicule_a_immat: c.vehicule_a.immatriculation?.trim() || null,
    vehicule_b_immat: c.vehicule_b.immatriculation?.trim() || null,
  }
}

// ─── CRUD ─────────────────────────────────────────────────────────────────────

/**
 * Enregistre un nouveau constat ou met à jour un existant (si `id` fourni).
 * Retourne l'id du constat (créé ou mis à jour).
 */
export async function saveConstat(
  userId: string,
  constat: ConstantData,
  options?: { id?: string; statut?: ConstatMembreRow['statut'] },
): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  try {
    const sb = getSupabaseClient()
    const row = {
      user_id: userId,
      data:    constat as unknown as Record<string, unknown>,
      statut:  options?.statut ?? 'sauvegarde',
      ...extractsFromConstat(constat),
    }

    if (options?.id) {
      // Update
      const { error } = await sb
        .from('constats_membres')
        .update(row)
        .eq('id', options.id)
        .eq('user_id', userId)  // double-vérif RLS côté client
      if (error) return { ok: false, error: error.message }
      return { ok: true, id: options.id }
    }

    // Insert
    const { data, error } = await sb
      .from('constats_membres')
      .insert(row)
      .select('id')
      .single()
    if (error || !data) return { ok: false, error: error?.message || 'unknown' }
    return { ok: true, id: data.id as string }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return { ok: false, error: msg }
  }
}

/** Liste les constats du user (champs extraits seulement, sans `data`). */
export async function listConstats(userId: string): Promise<ConstatMembreItem[]> {
  try {
    const sb = getSupabaseClient()
    const { data, error } = await sb
      .from('constats_membres')
      .select('id, created_at, date_accident, lieu, pays, vehicule_a_immat, vehicule_b_immat, statut')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50)
    if (error || !data) return []
    return data as ConstatMembreItem[]
  } catch {
    return []
  }
}

/** Récupère le constat complet pour rouvrir / imprimer. */
export async function getConstat(
  userId: string,
  id: string,
): Promise<ConstantData | null> {
  try {
    const sb = getSupabaseClient()
    const { data, error } = await sb
      .from('constats_membres')
      .select('data')
      .eq('id', id)
      .eq('user_id', userId)
      .maybeSingle()
    if (error || !data) return null
    return data.data as ConstantData
  } catch {
    return null
  }
}

/** Supprime un constat. */
export async function deleteConstat(userId: string, id: string): Promise<boolean> {
  try {
    const sb = getSupabaseClient()
    const { error } = await sb
      .from('constats_membres')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)
    return !error
  } catch {
    return false
  }
}
