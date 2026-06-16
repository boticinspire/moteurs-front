/**
 * lib/open-ev-data.ts — Moteurs.com / Autopulse
 * Accès au catalogue de véhicules électriques (snapshot Open EV Data).
 * Données : Open EV Data (https://open-ev-data.github.io) — CDLA-Permissive-2.0.
 * Le snapshot est rafraîchi via scripts/refresh-open-ev-data.mjs.
 */

import dataset from '@/data/open-ev-data.json'

export interface EV {
  id: string
  brand: string
  model: string
  variant?: string
  year: number | null
  battery_kwh: number | null
  range_km: number | null
  consumption_wh_km: number | null
  dc_kw: number | null
  ac_kw: number | null
  drivetrain?: string
  body?: string
  seats?: number
  v2l?: boolean
  price_eur?: number | null
}

export interface EVDataset {
  source: 'seed' | 'open-ev-data'
  dataset_version: string | null
  generated_at: string
  attribution: string
  count: number
  vehicles: EV[]
}

export const DATA = dataset as unknown as EVDataset
export const VEHICLES: EV[] = DATA.vehicles

export function brands(): string[] {
  return Array.from(new Set(VEHICLES.map((v) => v.brand))).sort((a, b) => a.localeCompare(b, 'fr'))
}

export function bodies(): string[] {
  return Array.from(new Set(VEHICLES.map((v) => v.body).filter(Boolean) as string[])).sort((a, b) => a.localeCompare(b, 'fr'))
}

export type Saison = 'ete' | 'mixte' | 'hiver'
const FACTEUR: Record<Saison, number> = { ete: 0.90, mixte: 0.82, hiver: 0.68 }

export function autonomieReelle(ev: EV, saison: Saison = 'mixte'): number | null {
  if (!ev.range_km) return null
  return Math.round(ev.range_km * FACTEUR[saison])
}

export function consoReelle(ev: EV): number | null {
  if (ev.consumption_wh_km) return Math.round(ev.consumption_wh_km * 1.15)
  if (ev.battery_kwh && ev.range_km) return Math.round((ev.battery_kwh * 1000) / ev.range_km * 1.15)
  return null
}

export function tempsCharge1080(ev: EV): number | null {
  if (!ev.battery_kwh || !ev.dc_kw) return null
  const energie = ev.battery_kwh * 0.7
  const puissanceMoyenne = ev.dc_kw * 0.55
  return Math.round((energie / puissanceMoyenne) * 60)
}

export function coutAux100(ev: EV, prixKwh: number): number | null {
  const c = consoReelle(ev)
  if (c == null) return null
  return (c / 1000) * 100 * prixKwh
}

export const DRIVE_LABEL: Record<string, string> = { fwd: 'Traction', rwd: 'Propulsion', awd: '4 roues motrices', '4wd': '4×4' }
export const fmtKm = (n: number | null) => (n == null ? '—' : `${n.toLocaleString('fr-FR')} km`)
export const fmtKwh = (n: number | null) => (n == null ? '—' : `${n.toLocaleString('fr-FR')} kWh`)
export const fmtKw = (n: number | null) => (n == null ? '—' : `${n.toLocaleString('fr-FR')} kW`)
export const fmtEur = (n: number | null | undefined) => (n == null ? '—' : `${Math.round(n).toLocaleString('fr-FR')} €`)
export const nomComplet = (ev: EV) => `${ev.brand} ${ev.model}${ev.variant ? ` ${ev.variant}` : ''}`
