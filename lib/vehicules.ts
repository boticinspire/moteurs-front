/**
 * lib/vehicules.ts — Moteurs.com / Autopulse
 * FAÇADE UNIQUE des données véhicules pour tous les outils.
 *
 *  - vehicules_ev        : catalogue électrique (source Open EV Data, CDLA-Permissive-2.0)
 *  - vehicules_thermique : modèles thermiques/hybrides/PHEV/GNV repères (sélection éditoriale)
 *
 * Lecture côté serveur via Supabase REST (clé anon). Repli (fallback) sur le snapshot
 * JSON bundlé `data/open-ev-data.json` si Supabase est indisponible ou vide.
 *
 * Règle projet : un seul endroit définit les specs véhicule + les helpers de calcul.
 * Aucun composant ne doit redéfinir de liste de véhicules en dur.
 */

import seed from '@/data/open-ev-data.json'

// ─── Types ──────────────────────────────────────────────────────────────────
export interface EV {
  id: string
  brand: string
  model: string
  variant?: string | null
  year: number | null
  battery_kwh: number | null
  range_km: number | null
  consumption_wh_km: number | null
  dc_kw: number | null
  ac_kw: number | null
  drivetrain?: string | null
  body?: string | null
  seats?: number | null
  v2l?: boolean | null
  price_eur?: number | null
}

export type Carburant = 'essence' | 'diesel' | 'hybride' | 'phev' | 'gnv' | 'gpl'
export type Segment = 'citadine' | 'compacte' | 'berline' | 'suv' | 'monospace' | 'vul'

export interface Thermique {
  id: string
  brand: string
  model: string
  variant?: string | null
  year: number | null
  segment: Segment
  carburant: Carburant
  conso_l_100: number | null
  conso_kwh_100: number | null
  co2_g_km: number | null
  price_eur: number | null
  body?: string | null
  seats?: number | null
  drivetrain?: string | null
}

// ─── Accès Supabase REST (serveur) ───────────────────────────────────────────
const SB_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SB_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

async function sbSelect<T>(path: string): Promise<T[]> {
  if (!SB_URL || !SB_ANON) return []
  try {
    const res = await fetch(`${SB_URL}/rest/v1/${path}`, {
      headers: { apikey: SB_ANON, Authorization: `Bearer ${SB_ANON}` },
      // ISR : le catalogue change rarement (refresh manuel) → revalidation 1 h.
      next: { revalidate: 3600 },
    })
    if (!res.ok) return []
    return (await res.json()) as T[]
  } catch {
    return []
  }
}

/** Catalogue EV — Supabase d'abord, repli sur le snapshot JSON bundlé. */
export async function getVehiculesEV(): Promise<EV[]> {
  const rows = await sbSelect<EV>(
    'vehicules_ev?actif=eq.true&select=*&order=brand.asc,model.asc'
  )
  const ds = seed as unknown as { vehicles: EV[] }
  const bundled = ds.vehicles ?? []
  // On garde la source la PLUS complète : tant que l'ingestion Supabase n'est pas
  // aussi fournie que le snapshot bundlé, on sert le snapshot (évite de n'afficher
  // que le jeu de démarrage). Une fois Supabase peuplé (>= snapshot), il prend la main.
  return rows.length >= bundled.length ? rows : bundled
}

/** Modèles thermiques repères — Supabase uniquement (pas de fallback JSON). */
export async function getVehiculesThermique(): Promise<Thermique[]> {
  return sbSelect<Thermique>(
    'vehicules_thermique?actif=eq.true&select=*&order=segment.asc,brand.asc'
  )
}

/** Indique si l'EV provient encore du jeu de démarrage bundlé (bandeau d'avertissement). */
export async function evIsSeed(): Promise<boolean> {
  const rows = await sbSelect<{ id: string }>('vehicules_ev?actif=eq.true&select=id&limit=1')
  return rows.length === 0
}

// ─── Helpers de dérivation (source unique) ────────────────────────────────────
export type Saison = 'ete' | 'mixte' | 'hiver'
const FACTEUR: Record<Saison, number> = { ete: 0.9, mixte: 0.82, hiver: 0.68 }

export function autonomieReelle(ev: EV, saison: Saison = 'mixte'): number | null {
  if (!ev.range_km) return null
  return Math.round(ev.range_km * FACTEUR[saison])
}

/** Conso réelle EV (Wh/km), majorée ~15 % vs WLTP. */
export function consoReelle(ev: EV): number | null {
  if (ev.consumption_wh_km) return Math.round(ev.consumption_wh_km * 1.15)
  if (ev.battery_kwh && ev.range_km) return Math.round(((ev.battery_kwh * 1000) / ev.range_km) * 1.15)
  return null
}

/** Temps de charge 10→80 % estimé (min), à ~55 % de la puissance DC crête. */
export function tempsCharge1080(ev: EV): number | null {
  if (!ev.battery_kwh || !ev.dc_kw) return null
  const energie = ev.battery_kwh * 0.7
  const puissanceMoyenne = ev.dc_kw * 0.55
  return Math.round((energie / puissanceMoyenne) * 60)
}

export function coutAux100EV(ev: EV, prixKwh: number): number | null {
  const c = consoReelle(ev)
  if (c == null) return null
  return (c / 1000) * 100 * prixKwh
}

/** Coût aux 100 km d'un thermique (carburant liquide ; PHEV = part thermique seule). */
export function coutAux100Thermique(v: Thermique, prixLitre: number): number | null {
  if (v.conso_l_100 == null) return null
  return (v.conso_l_100 / 100) * 100 * prixLitre
}

// ─── Dérivés de liste ─────────────────────────────────────────────────────────
export const brands = (list: EV[]): string[] =>
  Array.from(new Set(list.map((v) => v.brand))).sort((a, b) => a.localeCompare(b, 'fr'))

export const bodies = (list: EV[]): string[] =>
  Array.from(new Set(list.map((v) => v.body).filter(Boolean) as string[])).sort((a, b) =>
    a.localeCompare(b, 'fr')
  )

// ─── Formatage ─────────────────────────────────────────────────────────────
export const DRIVE_LABEL: Record<string, string> = {
  fwd: 'Traction', rwd: 'Propulsion', awd: '4 roues motrices', '4wd': '4×4',
}
export const CARBURANT_LABEL: Record<Carburant, string> = {
  essence: 'Essence', diesel: 'Diesel', hybride: 'Hybride',
  phev: 'Hybride rechargeable', gnv: 'GNV', gpl: 'GPL',
}
export const fmtKm = (n: number | null) => (n == null ? '—' : `${n.toLocaleString('fr-FR')} km`)
export const fmtKwh = (n: number | null) => (n == null ? '—' : `${n.toLocaleString('fr-FR')} kWh`)
export const fmtKw = (n: number | null) => (n == null ? '—' : `${n.toLocaleString('fr-FR')} kW`)
export const fmtL = (n: number | null) => (n == null ? '—' : `${n.toLocaleString('fr-FR')} L/100`)
export const fmtEur = (n: number | null | undefined) =>
  n == null ? '—' : `${Math.round(n).toLocaleString('fr-FR')} €`
export const nomComplet = (v: { brand: string; model: string; variant?: string | null }) =>
  `${v.brand} ${v.model}${v.variant ? ` ${v.variant}` : ''}`

export const ATTRIBUTION =
  'Données EV : Open EV Data (open-ev-data.github.io) — CDLA-Permissive-2.0. Thermiques : sélection éditoriale Moteurs.com, valeurs WLTP indicatives.'
