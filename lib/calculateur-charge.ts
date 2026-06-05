/**
 * Moteurs.com — Calculateur de charge VE
 * Calcul : temps de charge, coût, comparatif bornes
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ChargeInput {
  capacite_kwh:   number   // kWh — capacité batterie nette
  soc_initial:    number   // % 0–99
  soc_cible:      number   // % 1–100
  puissance_borne: number  // kW
  puissance_obc:  number   // kW — chargeur embarqué du véhicule
  tarif_kwh:      number   // €/kWh
}

export interface ChargeResult {
  kwh_needed:     number   // kWh à recharger
  puissance_eff:  number   // kW réelle (min borne/OBC × rendement)
  duree_h:        number   // heures
  cout_eur:       number   // €
  cout_100km:     number   // € aux 100 km (conso 17 kWh/100)
  borne_surdi:    boolean  // true si borne > OBC véhicule
}

export interface BorneRef {
  id:      string
  label:   string
  pow:     number
  type:    'AC' | 'DC'
  icon:    string
}

// ─── Constantes ───────────────────────────────────────────────────────────────

export const RENDEMENT_AC = 0.95

export const CONSO_REF_KWH_100 = 17 // kWh/100 km — hypothèse véhicule moyen

export const BORNES_REF: BorneRef[] = [
  { id: 'prise-std',     label: 'Prise standard 2,3 kW',  pow: 2.3,  type: 'AC', icon: '🔌' },
  { id: 'prise-renf',    label: 'Prise renforcée 3,7 kW', pow: 3.7,  type: 'AC', icon: '🔌' },
  { id: 'wallbox-74',    label: 'Wallbox mono 7,4 kW',    pow: 7.4,  type: 'AC', icon: '🏠' },
  { id: 'wallbox-11',    label: 'Wallbox tri 11 kW',      pow: 11,   type: 'AC', icon: '🏠' },
  { id: 'wallbox-22',    label: 'Wallbox tri 22 kW',      pow: 22,   type: 'AC', icon: '🏠' },
  { id: 'rapide-50',     label: 'Rapide DC 50 kW',        pow: 50,   type: 'DC', icon: '⚡' },
  { id: 'ultra-150',     label: 'Ultra-rapide 150 kW',    pow: 150,  type: 'DC', icon: '⚡' },
]

export const TARIFS_PAYS: Record<string, number> = {
  FR: 0.23,
  BE: 0.28,
  CH: 0.32,
  CA: 0.14,
}

// ─── Calcul ───────────────────────────────────────────────────────────────────

export function calculerCharge(input: ChargeInput): ChargeResult {
  const kwh_needed   = Math.max(0, (input.soc_cible - input.soc_initial) / 100 * input.capacite_kwh)
  const puissance_eff = Math.min(input.puissance_borne, input.puissance_obc) * RENDEMENT_AC
  const duree_h       = puissance_eff > 0 ? kwh_needed / puissance_eff : 0
  const cout_eur      = kwh_needed * input.tarif_kwh
  const km_equivalent = kwh_needed / (CONSO_REF_KWH_100 / 100)
  const cout_100km    = km_equivalent > 0 ? (cout_eur / km_equivalent) * 100 : 0

  return {
    kwh_needed,
    puissance_eff,
    duree_h,
    cout_eur,
    cout_100km,
    borne_surdi: input.puissance_borne > input.puissance_obc,
  }
}

// ─── Formatage ────────────────────────────────────────────────────────────────

export function fmtDuree(h: number): string {
  if (h < 1 / 60) return '< 1 min'
  const hh = Math.floor(h)
  const mm = Math.round((h - hh) * 60)
  if (hh === 0) return `${mm} min`
  if (mm === 0) return `${hh}h00`
  return `${hh}h${String(mm).padStart(2, '0')}`
}

export function fmtEur(n: number, dec = 2): string {
  return n.toLocaleString('fr-FR', { minimumFractionDigits: dec, maximumFractionDigits: dec }) + ' €'
}

export function fmtKwh(n: number): string {
  return n.toLocaleString('fr-FR', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + ' kWh'
}
