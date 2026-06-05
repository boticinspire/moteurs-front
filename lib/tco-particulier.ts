/**
 * Moteurs.com — Simulateur TCO Particulier
 * Électrique vs Thermique (essence / diesel) sur 1–10 ans
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export type Motorisation = 'essence' | 'diesel'

export interface TCOParticulierInput {
  // Véhicule électrique
  ve_prix:          number   // € prix d'achat
  ve_conso_kwh:     number   // kWh/100 km
  ve_tarif_kwh:     number   // €/kWh
  ve_entretien_an:  number   // €/an
  ve_depreciation:  number   // %/an
  ve_fiscal_an:     number   // €/an — avantage fiscal net (ATN réduit, etc.)

  // Véhicule thermique
  th_prix:          number   // €
  th_motorisation:  Motorisation
  th_conso_l:       number   // L/100 km
  th_carburant:     number   // €/L
  th_entretien_an:  number   // €/an
  th_depreciation:  number   // %/an

  // Usage
  km_annuel:        number   // km/an
}

export interface TCOAnnee {
  annee:     number
  ve_cumul:  number   // € TCO cumulatif net de valeur résiduelle
  th_cumul:  number
}

export interface TCOParticulierResult {
  courbe:        TCOAnnee[]
  break_even:    number | null   // année de rentabilité (null si > 10 ans)
  gain_5ans:     number          // € économie à 5 ans (positif = VE gagnant)
  gain_10ans:    number
  ckm_ve:        number          // €/km énergie
  ckm_th:        number
  valeur_ve_5ans: number         // € valeur résiduelle VE à 5 ans
  // Postes annuels pour graphique barres
  postes: {
    label:  string
    ve_val: number
    th_val: number
  }[]
}

// ─── Présets pays ─────────────────────────────────────────────────────────────

export const PRESETS_PAYS: Record<string, {
  kwh: number; essence: number; diesel: number; fiscal_ve: number
}> = {
  FR: { kwh: 0.23, essence: 1.72, diesel: 1.65, fiscal_ve: 0    },
  BE: { kwh: 0.28, essence: 1.80, diesel: 1.70, fiscal_ve: 1200 },
  CH: { kwh: 0.32, essence: 1.90, diesel: 1.80, fiscal_ve: 0    },
  CA: { kwh: 0.14, essence: 1.60, diesel: 1.55, fiscal_ve: 0    },
}

// ─── Calcul ───────────────────────────────────────────────────────────────────

export function calculTCOParticulier(input: TCOParticulierInput): TCOParticulierResult {
  const {
    ve_prix, ve_conso_kwh, ve_tarif_kwh, ve_entretien_an, ve_depreciation, ve_fiscal_an,
    th_prix, th_conso_l, th_carburant, th_entretien_an, th_depreciation,
    km_annuel,
  } = input

  const depr_ve = ve_depreciation / 100
  const depr_th = th_depreciation / 100

  // Coût énergie au km
  const ckm_ve = (ve_conso_kwh / 100) * ve_tarif_kwh
  const ckm_th = (th_conso_l   / 100) * th_carburant

  // Charges annuelles hors amortissement
  const ve_annuel = ckm_ve * km_annuel + ve_entretien_an - ve_fiscal_an
  const th_annuel = ckm_th * km_annuel + th_entretien_an

  const courbe: TCOAnnee[] = []
  let ve_val = ve_prix
  let th_val = th_prix
  let ve_cumul = ve_prix
  let th_cumul = th_prix
  let break_even: number | null = null

  for (let y = 0; y <= 10; y++) {
    if (y > 0) {
      ve_val   *= (1 - depr_ve)
      th_val   *= (1 - depr_th)
      ve_cumul += ve_annuel
      th_cumul += th_annuel
    }
    const ve_net = Math.round(ve_cumul - ve_val)
    const th_net = Math.round(th_cumul - th_val)
    courbe.push({ annee: y, ve_cumul: ve_net, th_cumul: th_net })

    if (break_even === null && y > 0 && ve_net <= th_net) {
      break_even = y
    }
  }

  const gain_5ans  = courbe[5].th_cumul  - courbe[5].ve_cumul
  const gain_10ans = courbe[10].th_cumul - courbe[10].ve_cumul
  const valeur_ve_5ans = Math.round(ve_prix * Math.pow(1 - depr_ve, 5))

  const postes = [
    { label: 'Énergie / carburant',  ve_val: Math.round(ckm_ve * km_annuel),  th_val: Math.round(ckm_th * km_annuel)  },
    { label: 'Entretien annuel',      ve_val: ve_entretien_an,                 th_val: th_entretien_an                 },
    { label: 'Dépréciation / an',     ve_val: Math.round(ve_prix * depr_ve),   th_val: Math.round(th_prix * depr_th)   },
    { label: 'Avantage fiscal / an',  ve_val: -ve_fiscal_an,                   th_val: 0                               },
  ]

  return { courbe, break_even, gain_5ans, gain_10ans, ckm_ve, ckm_th, valeur_ve_5ans, postes }
}

// ─── Formatage ────────────────────────────────────────────────────────────────

export function fmtEurTCO(n: number, dec = 0): string {
  return n.toLocaleString('fr-FR', { minimumFractionDigits: dec, maximumFractionDigits: dec }) + ' €'
}

export function fmtSignEur(n: number): string {
  const sign = n >= 0 ? '+' : ''
  return sign + n.toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) + ' €'
}
