/**
 * user-context.ts — Moteurs.com
 * Types, helpers localStorage et Supabase pour le contexte utilisateur mémorisé.
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js'

// ─── Types ────────────────────────────────────────────────────────────────────

export type Motorisation =
  | 'BEV'
  | 'PHEV'
  | 'HEV'
  | 'DIESEL'
  | 'ESSENCE'
  | 'GNV'
  | 'HYDROGENE'

export interface VoitureCtx {
  marque?: string
  modele?: string
  motorisation?: Motorisation
  annee?: number
  autonomie_km?: number          // pour BEV/PHEV
  conso_l100?: number            // pour thermique
  conso_kwh100?: number          // pour BEV
  carte_recharge?: string        // ex. "Ionity", "Chargemap"
}

export interface PreferencesCtx {
  pays?: 'FR' | 'BE' | 'CH' | 'CA'
  profil?: 'B2B' | 'Particulier'
  segment?: string               // vul_petit, vul_moyen…
  profil_conduite?: 'urbain' | 'mixte' | 'route' | 'autoroute'
  km_an?: number
}

export interface TrajetCtx {
  depart?: string                // adresse ou coords "lat,lng"
  arrivee?: string
  date_depart?: string           // ISO yyyy-mm-dd — expiry trigger
  profil_route?: 'fastest' | 'shortest' | 'recommended'
  expires_at?: string            // ISO datetime
}

export interface SinistreCtx {
  type?: 'accident' | 'panne' | 'voyant' | 'autre'
  description?: string
  date_sinistre?: string         // ISO yyyy-mm-dd
  expires_at?: string            // ISO datetime (date_sinistre + 30 days)
  reference?: string
}

export interface UserContext {
  voiture?: VoitureCtx | null
  preferences?: PreferencesCtx | null
  trajet?: TrajetCtx | null
  sinistre?: SinistreCtx | null
}

// ─── Constants ────────────────────────────────────────────────────────────────

const LS_KEY = 'moteurs_user_context'

// ─── Supabase client (browser) ────────────────────────────────────────────────

// Singleton — une seule instance partagée dans tout le front
let _client: SupabaseClient | null = null

export function getSupabaseClient(): SupabaseClient {
  if (!_client) {
    _client = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        auth: {
          flowType: 'pkce',
          autoRefreshToken: true,
          persistSession: true,
          // detectSessionInUrl: false → on prend la main sur l'exchange dans le Provider
          // (évite le deadlock du navigator lock observé en prod sur certains navigateurs)
          detectSessionInUrl: false,
          storageKey: 'sb-moteurs-auth',
          // lock bypass : désactive navigator.locks (cause requêtes Supabase "Stalled" indéfiniment)
          lock: async (_name: string, _acquireTimeout: number, fn: () => Promise<any>) => fn(),
        },
      }
    )
  }
  return _client
}

// ─── Expiry ───────────────────────────────────────────────────────────────────

/**
 * Supprime trajet si date_depart < aujourd'hui,
 * supprime sinistre si expires_at < maintenant.
 * Retourne un nouveau contexte sans muter l'original.
 */
export function expireContext(ctx: UserContext): UserContext {
  const now = new Date()
  const today = now.toISOString().slice(0, 10) // yyyy-mm-dd

  let trajet = ctx.trajet
  if (trajet?.date_depart && trajet.date_depart < today) {
    trajet = null
  }

  let sinistre = ctx.sinistre
  if (sinistre?.expires_at && new Date(sinistre.expires_at) < now) {
    sinistre = null
  }

  return { ...ctx, trajet, sinistre }
}

// ─── localStorage ─────────────────────────────────────────────────────────────

export function loadContextLocal(): UserContext {
  if (typeof window === 'undefined') return {}
  try {
    const raw = localStorage.getItem(LS_KEY)
    if (!raw) return {}
    return JSON.parse(raw) as UserContext
  } catch {
    return {}
  }
}

export function saveContextLocal(ctx: UserContext): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(ctx))
  } catch {
    // quota exceeded — silently ignore
  }
}

export function clearContextLocal(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(LS_KEY)
}

// ─── Supabase remote ──────────────────────────────────────────────────────────

export async function loadContextRemote(userId: string): Promise<UserContext | null> {
  try {
    const supabase = getSupabaseClient()
    const { data, error } = await supabase
      .from('user_context')
      .select('voiture, preferences, trajet, sinistre')
      .eq('user_id', userId)
      .maybeSingle()

    if (error || !data) return null
    return data as UserContext
  } catch {
    return null
  }
}

export async function saveContextRemote(userId: string, ctx: UserContext): Promise<void> {
  try {
    const supabase = getSupabaseClient()
    await supabase
      .from('user_context')
      .upsert(
        {
          user_id: userId,
          voiture: ctx.voiture ?? null,
          preferences: ctx.preferences ?? null,
          trajet: ctx.trajet ?? null,
          sinistre: ctx.sinistre ?? null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' }
      )
  } catch {
    // silently ignore — local state remains source of truth
  }
}

// ─── Merge ────────────────────────────────────────────────────────────────────

/**
 * Fusionne deux contextes.
 * - voiture/preferences : remote gagne si existe
 * - trajet/sinistre : local gagne si existe (plus récent côté client)
 */
export function mergeContexts(local: UserContext, remote: UserContext): UserContext {
  return {
    voiture: remote.voiture ?? local.voiture ?? null,
    preferences: remote.preferences ?? local.preferences ?? null,
    trajet: local.trajet ?? remote.trajet ?? null,
    sinistre: local.sinistre ?? remote.sinistre ?? null,
  }
}

// ─── Factories ────────────────────────────────────────────────────────────────

export function makeTrajetCtx(
  depart: string,
  arrivee: string,
  dateDepart?: string,
  profilRoute?: TrajetCtx['profil_route']
): TrajetCtx {
  // expires à la date de départ (ou dans 7 jours si non renseignée)
  const base = dateDepart
    ? new Date(dateDepart)
    : new Date(Date.now() + 7 * 24 * 3600 * 1000)
  // On expire à 23h59 du jour de départ
  base.setHours(23, 59, 59, 999)

  return {
    depart,
    arrivee,
    date_depart: dateDepart,
    profil_route: profilRoute ?? 'recommended',
    expires_at: base.toISOString(),
  }
}

export function makeSinistreCtx(
  type: SinistreCtx['type'],
  description?: string,
  reference?: string
): SinistreCtx {
  const date_sinistre = new Date().toISOString().slice(0, 10)
  const exp = new Date()
  exp.setDate(exp.getDate() + 30)

  return {
    type,
    description,
    date_sinistre,
    expires_at: exp.toISOString(),
    reference,
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Retourne true si le sinistre expire dans moins de 3 jours */
export function isSinistreExpiringSoon(ctx: UserContext): boolean {
  if (!ctx.sinistre?.expires_at) return false
  const diff = new Date(ctx.sinistre.expires_at).getTime() - Date.now()
  return diff > 0 && diff < 3 * 24 * 3600 * 1000
}
