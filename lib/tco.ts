/**
 * Moteurs.com — Moteur de calcul TCO (TypeScript)
 * Portage du simulateur.js pour usage côté client React / Server.
 * Données fallback intégrées, surchargeables via simulateur-data.json.
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export type Pays    = 'FR' | 'BE' | 'CH' | 'CA' | 'DE' | 'ES' | 'IT' | 'NL' | 'AT' | 'PT' | 'PL' | 'SE' | 'DK' | 'IE' | 'FI' | 'LU'
export type Profil  = 'B2B' | 'Particulier'
export type Motor   = 'diesel' | 'essence' | 'elec' | 'phev' | 'h2' | 'gnv' | 'efuel'
export type Segment = 'voiture' | 'vul_petit' | 'vul_moyen' | 'vul_grand' | 'camion' | 'poids_lourd' | 'vae' | 'trottinette' | 'moto'

export interface TcoInput {
  segment:            Segment
  motor:              Motor
  profil:             Profil
  pays:               Pays
  km_an:              number
  duree_mois:         number
  profil_conduite:    'urbain' | 'mixte' | 'route' | 'autoroute'
  charge:             'vide' | 'standard' | 'pleine'
  pct_hiver:          number   // 0-100
  taux_recharge_phev: number   // 0-100
  prix_custom?:       number   // Prix HT personnalisé
  prix_remise?:       number   // Remise globale
}

export interface TcoResult {
  available:      boolean
  motor:          Motor
  label:          string
  prixCatalogue:  number
  aides:          number
  suramort:       number
  prixNet:        number
  coutEnergie:    number
  coutMaint:      number
  total:          number
  coutMensuel:    number
  vatApplied:     number
  isCustomPrice:  boolean
  reason?:        string
}

// ─── Données stables ──────────────────────────────────────────────────────────

const VAT_RATES: Record<Pays, number> = {
  FR: 0.20, BE: 0.21, CH: 0.081, CA: 0.14975,
  DE: 0.19, ES: 0.21, IT: 0.22, NL: 0.21,
  AT: 0.20, PT: 0.23, PL: 0.23, SE: 0.25,
  DK: 0.25, IE: 0.23, FI: 0.255, LU: 0.17,
}

export const REF_CONSO: Partial<Record<Segment, Partial<Record<Motor, number>>>> = {
  voiture:     { diesel: 5.5,  essence: 7.0,  elec: 16,  phev: 7.5,  h2: 1.0, efuel: 6.0,  gnv: 5.5  },
  vul_petit:   { diesel: 6.5,  essence: 8.5,  elec: 18,  phev: 8.5,  h2: 1.1, efuel: 7.0,  gnv: 6.5  },
  vul_moyen:   { diesel: 8.5,  essence: 11.0, elec: 24,  phev: 10.0, h2: 1.3, efuel: 9.0,  gnv: 8.5  },
  vul_grand:   { diesel: 10.5, essence: 13.5, elec: 32,  phev: 12.5, h2: 1.5, efuel: 11.0, gnv: 10.5 },
  camion:      { diesel: 18.0,               elec: 95,              h2: 8.0, efuel: 19.0, gnv: 18.0 },
  poids_lourd: { diesel: 32.0,               elec: 130,             h2: 9.5, efuel: 33.0, gnv: 32.0 },
  vae:         { elec: 0.8 },
  trottinette: { elec: 1.2 },
  moto:        { diesel: 4.5, elec: 8.0 },
}

const MAINT_ANNUAL: Partial<Record<Segment, Partial<Record<Motor, number>>>> = {
  voiture:     { diesel: 1100, essence: 1000, elec: 480,  phev: 950,  h2: 1400, efuel: 1100, gnv: 1050 },
  vul_petit:   { diesel: 1400, essence: 1300, elec: 600,  phev: 1200, h2: 1800, efuel: 1400, gnv: 1350 },
  vul_moyen:   { diesel: 1900, essence: 1750, elec: 850,  phev: 0,    h2: 2200, efuel: 1900, gnv: 1850 },
  vul_grand:   { diesel: 2300, essence: 2150, elec: 1100, phev: 0,    h2: 2600, efuel: 2300, gnv: 2250 },
  camion:      { diesel: 4200,               elec: 2500,             h2: 4500, efuel: 4200, gnv: 4000 },
  poids_lourd: { diesel: 7500,               elec: 4800,             h2: 7800, efuel: 7500, gnv: 7000 },
  vae:         { elec: 120 },
  trottinette: { elec: 80 },
  moto:        { diesel: 600, elec: 280 },
}

// ─── Données volatiles (fallback) ─────────────────────────────────────────────

// ⚠ Les 4 blocs ci-dessous sont régénérés par `scripts/sync-fallbacks.mjs`
//   depuis `public/data/simulateur-data.json` au `prebuild`. NE PAS éditer
//   manuellement : modifier le JSON, puis `npm run build` (ou `npm run sync-fallbacks`).

export const ENERGY_PRICES_FALLBACK: Record<Pays, Partial<Record<string, number>>> = {
  // >>> SYNC:ENERGY_PRICES_FALLBACK START
  FR: { diesel: 2.12, essence: 2.08, elec: 0.194, gnv: 1.45, h2: 13.5, efuel: 4.2 },
  BE: { diesel: 2.11, essence: 1.89, elec: 0.30,  gnv: 1.55, h2: 14.0, efuel: 4.4 },
  CH: { diesel: 1.85, essence: 1.92, elec: 0.27,  gnv: 1.85, h2: 15.5, efuel: 5.0 },
  CA: { diesel: 1.45, essence: 1.40, elec: 0.13,  gnv: 1.25, h2: 12.0, efuel: 4.0 },
  DE: { diesel: 1.97, essence: 2.04, elec: 0.30,  gnv: 1.45, h2: 12.0, efuel: 4.5 },
  ES: { diesel: 1.69, essence: 1.55, elec: 0.18,  gnv: 1.35, h2: 11.0, efuel: 4.0 },
  IT: { diesel: 1.98, essence: 1.94, elec: 0.28,  gnv: 1.40, h2: 12.0, efuel: 4.5 },
  NL: { diesel: 2.29, essence: 2.39, elec: 0.32,  gnv: 1.55, h2: 12.0, efuel: 5.0 },
  AT: { diesel: 1.91, essence: 1.81, elec: 0.28,  gnv: 1.50, h2: 12.0, efuel: 4.5 },
  PT: { diesel: 1.95, essence: 2.01, elec: 0.22,  gnv: 1.40, h2: 12.0, efuel: 4.3 },
  PL: { diesel: 1.58, essence: 1.49, elec: 0.17,  gnv: 1.20, h2: 11.0, efuel: 3.8 },
  SE: { diesel: 1.90, essence: 1.72, elec: 0.18,  gnv: 1.60, h2: 13.0, efuel: 4.5 },
  DK: { diesel: 2.18, essence: 2.34, elec: 0.35,  gnv: 1.80, h2: 14.0, efuel: 5.0 },
  IE: { diesel: 1.95, essence: 1.83, elec: 0.32,  gnv: 1.60, h2: 13.0, efuel: 4.6 },
  FI: { diesel: 2.14, essence: 2.03, elec: 0.18,  gnv: 1.70, h2: 13.0, efuel: 4.8 },
  LU: { diesel: 1.82, essence: 1.82, elec: 0.20,  gnv: 1.45, h2: 12.0, efuel: 4.2 },
  // >>> SYNC:ENERGY_PRICES_FALLBACK END
}

export const REF_PRICES_FALLBACK: Partial<Record<Segment, Partial<Record<Motor, number>>>> = {
  // >>> SYNC:REF_PRICES_FALLBACK START
  voiture:     { diesel: 28000, essence: 24000, elec: 35000, phev: 38000, h2: 70000, efuel: 32000, gnv: 27000 },
  vul_petit:   { diesel: 22000, essence: 20000, elec: 32000, phev: 34000, h2: 60000, efuel: 24000, gnv: 23000 },
  vul_moyen:   { diesel: 32000, essence: 29000, elec: 45000, phev: 0, h2: 75000, efuel: 34000, gnv: 33000 },
  vul_grand:   { diesel: 42000, essence: 38000, elec: 62000, phev: 0, h2: 90000, efuel: 44000, gnv: 43000 },
  camion:      { diesel: 70000, elec: 145000, phev: 0, h2: 220000, efuel: 72000, gnv: 80000 },
  poids_lourd: { diesel: 110000, elec: 380000, phev: 0, h2: 480000, efuel: 115000, gnv: 130000 },
  vae:         { elec: 1800 },
  trottinette: { elec: 600 },
  moto:        { diesel: 5500, elec: 9000 },
  // >>> SYNC:REF_PRICES_FALLBACK END
}

const AIDES_B2B_FALLBACK: Record<Pays, Partial<Record<Segment, number>>> = {
  // >>> SYNC:AIDES_B2B_FALLBACK START
  FR: { vul_petit: 4000, vul_moyen: 6500, vul_grand: 8600, camion: 10000, poids_lourd: 12000 },
  BE: { vul_petit: 2500, vul_moyen: 3500, vul_grand: 5000, camion: 6000,  poids_lourd: 8000  },
  CH: { vul_petit: 0,    vul_moyen: 0,    vul_grand: 0,    camion: 0,     poids_lourd: 0     },
  CA: { vul_petit: 5000, vul_moyen: 7000, vul_grand: 7000, camion: 7000,  poids_lourd: 7000  },
  DE: { vul_petit: 0,    vul_moyen: 0,    vul_grand: 0,    camion: 0,     poids_lourd: 0     },
  ES: { vul_petit: 0,    vul_moyen: 0,    vul_grand: 0,    camion: 0,     poids_lourd: 0     },
  IT: { vul_petit: 0,    vul_moyen: 0,    vul_grand: 0,    camion: 0,     poids_lourd: 0     },
  NL: { vul_petit: 0,    vul_moyen: 0,    vul_grand: 0,    camion: 0,     poids_lourd: 0     },
  AT: { vul_petit: 0,    vul_moyen: 0,    vul_grand: 0,    camion: 0,     poids_lourd: 0     },
  PT: { vul_petit: 0,    vul_moyen: 0,    vul_grand: 0,    camion: 0,     poids_lourd: 0     },
  PL: { vul_petit: 0,    vul_moyen: 0,    vul_grand: 0,    camion: 0,     poids_lourd: 0     },
  SE: { vul_petit: 0,    vul_moyen: 0,    vul_grand: 0,    camion: 0,     poids_lourd: 0     },
  DK: { vul_petit: 0,    vul_moyen: 0,    vul_grand: 0,    camion: 0,     poids_lourd: 0     },
  IE: { vul_petit: 3500, vul_moyen: 3500, vul_grand: 3500, camion: 3500,  poids_lourd: 0     },
  FI: { vul_petit: 0,    vul_moyen: 0,    vul_grand: 0,    camion: 0,     poids_lourd: 0     },
  LU: { vul_petit: 0,    vul_moyen: 0,    vul_grand: 0,    camion: 0,     poids_lourd: 0     },
  // >>> SYNC:AIDES_B2B_FALLBACK END
}

const AIDES_PARTICULIER_FALLBACK: Record<Pays, Partial<Record<Segment, number>>> = {
  // >>> SYNC:AIDES_PARTICULIER_FALLBACK START
  FR: { voiture: 4000, vae: 400, trottinette: 0, moto: 900 },
  BE: { voiture: 2500, vae: 300, trottinette: 0, moto: 500 },
  CH: { voiture: 0,    vae: 0,   trottinette: 0, moto: 0   },
  CA: { voiture: 5000, vae: 200, trottinette: 0, moto: 0   },
  DE: { voiture: 4000, vae: 300, trottinette: 0, moto: 0   },
  ES: { voiture: 7000, vae: 500, trottinette: 0, moto: 0   },
  IT: { voiture: 6000, vae: 200, trottinette: 0, moto: 0   },
  NL: { voiture: 0,    vae: 250, trottinette: 0, moto: 0   },
  AT: { voiture: 0,    vae: 200, trottinette: 0, moto: 0   },
  PT: { voiture: 3000, vae: 250, trottinette: 0, moto: 0   },
  PL: { voiture: 4000, vae: 200, trottinette: 0, moto: 0   },
  SE: { voiture: 3000, vae: 200, trottinette: 0, moto: 0   },
  DK: { voiture: 0,    vae: 300, trottinette: 0, moto: 0   },
  IE: { voiture: 5000, vae: 300, trottinette: 0, moto: 0   },
  FI: { voiture: 2000, vae: 200, trottinette: 0, moto: 0   },
  LU: { voiture: 5000, vae: 300, trottinette: 0, moto: 0   },
  // >>> SYNC:AIDES_PARTICULIER_FALLBACK END
}

// ─── Labels ────────────────────────────────────────────────────────────────────

export const MOTOR_LABELS: Record<Motor, string> = {
  diesel:  'Diesel',
  essence: 'Essence',
  elec:    'Électrique',
  phev:    'PHEV hybride',
  h2:      'Hydrogène',
  gnv:     'Bio-GNV',
  efuel:   'E-fuel',
}

export const SEGMENT_LABELS: Record<Segment, string> = {
  voiture:     'Voiture',
  vul_petit:   'Petit VUL',
  vul_moyen:   'Fourgon moyen',
  vul_grand:   'Grand fourgon',
  camion:      'Camion 3,5–7,5 t',
  poids_lourd: 'Poids-lourd',
  vae:         'Vélo électrique',
  trottinette: 'Trottinette',
  moto:        'Moto / scooter',
}

export const MOTOR_COLORS: Record<Motor, string> = {
  diesel:  '#6b7280',
  essence: '#92400e',
  elec:    '#059669',
  phev:    '#d97706',
  h2:      '#2563eb',
  gnv:     '#7c3aed',
  efuel:   '#dc2626',
}

// ─── Moteurs disponibles par segment/profil ──────────────────────────────────

export function getMotors(segment: Segment, profil: Profil): Motor[] {
  if (segment === 'vae' || segment === 'trottinette') return ['elec']
  if (segment === 'moto')     return ['diesel', 'elec']
  if (segment === 'voiture')  return profil === 'B2B' ? ['diesel', 'essence', 'elec', 'phev'] : ['diesel', 'essence', 'elec', 'phev']
  if (segment === 'camion' || segment === 'poids_lourd') return ['diesel', 'elec', 'h2', 'gnv', 'efuel']
  // VUL (petit, moyen, grand)
  return profil === 'B2B'
    ? ['diesel', 'elec', 'phev', 'h2', 'gnv', 'efuel']
    : ['diesel', 'elec', 'phev']
}

export function getSegments(profil: Profil): Segment[] {
  return profil === 'B2B'
    ? ['vul_petit', 'vul_moyen', 'vul_grand', 'camion', 'poids_lourd']
    : ['voiture', 'vae', 'trottinette', 'moto']
}

// ─── Correcteurs ──────────────────────────────────────────────────────────────

function correcteurConduite(motor: Motor, profil_conduite: string): number {
  if (motor === 'diesel') {
    if (profil_conduite === 'urbain')    return 1.18
    if (profil_conduite === 'route')     return 0.92
    if (profil_conduite === 'autoroute') return 0.95
  }
  if (motor === 'elec') {
    if (profil_conduite === 'urbain')    return 0.95
    if (profil_conduite === 'route')     return 1.12
    if (profil_conduite === 'autoroute') return 1.28
  }
  if (motor === 'phev' && profil_conduite === 'autoroute') return 1.20
  return 1.0
}

function correcteurCharge(charge: string): number {
  if (charge === 'vide')   return 0.97
  if (charge === 'pleine') return 1.12
  return 1.0
}

function correcteurHiver(motor: Motor, pct_hiver: number): number {
  if (motor !== 'elec' && motor !== 'phev') return 1.0
  return 1 + 0.28 * (pct_hiver / 100)
}

// ─── Calcul TCO principal ─────────────────────────────────────────────────────

export function calculTCO(input: TcoInput): TcoResult {
  const {
    segment, motor, profil, pays,
    km_an, duree_mois,
    profil_conduite, charge, pct_hiver, taux_recharge_phev,
    prix_custom, prix_remise = 0,
  } = input

  const refConso = REF_CONSO[segment]?.[motor]
  const catPrix  = REF_PRICES_FALLBACK[segment]?.[motor]
  const refMaint = MAINT_ANNUAL[segment]?.[motor]

  if (!refConso || !catPrix) {
    return { available: false, motor, label: MOTOR_LABELS[motor], reason: 'DATA_MISSING',
             prixCatalogue: 0, aides: 0, suramort: 0, prixNet: 0,
             coutEnergie: 0, coutMaint: 0, total: 0, coutMensuel: 0,
             vatApplied: 0, isCustomPrice: false }
  }

  const refPrix     = (prix_custom && prix_custom > 0) ? prix_custom : catPrix
  const isCustom    = refPrix !== catPrix
  const vatRate     = profil === 'Particulier' ? (VAT_RATES[pays] ?? 0) : 0
  const prixTTC     = refPrix * (1 + vatRate)

  const energyKey: string = motor === 'phev' ? 'diesel' : motor === 'essence' ? 'essence' : motor
  const energyPrices      = ENERGY_PRICES_FALLBACK[pays]
  const prixEnergie       = energyPrices[energyKey] ?? 0

  const consoReel = refConso
    * correcteurConduite(motor, profil_conduite)
    * correcteurCharge(charge)
    * correcteurHiver(motor, pct_hiver)

  const annees   = duree_mois / 12
  const totalKm  = km_an * annees

  let coutEnergie: number
  if (motor === 'phev') {
    const taux     = taux_recharge_phev / 100
    const consoE   = (REF_CONSO[segment]?.elec ?? 20) * 0.7
    const partElec = (consoE / 100) * totalKm * taux * (energyPrices.elec ?? 0.21)
    const partDsl  = (consoReel / 100) * totalKm * (1 - taux) * (energyPrices.diesel ?? 1.72)
    coutEnergie    = partElec + partDsl
  } else {
    coutEnergie = (consoReel / 100) * totalKm * prixEnergie
  }

  // Aides
  let aides = 0
  if (!['diesel', 'essence', 'efuel'].includes(motor)) {
    const table = profil === 'B2B' ? AIDES_B2B_FALLBACK[pays] : AIDES_PARTICULIER_FALLBACK[pays]
    aides = table?.[segment] ?? 0
  }

  // Suramortissement FR B2B
  let suramort = 0
  if (profil === 'B2B' && pays === 'FR' && ['elec', 'h2', 'gnv'].includes(motor)) {
    suramort = Math.min(refPrix, 30000) * 0.25
  }

  const prixNet  = Math.max(0, prixTTC - prix_remise - aides - suramort)
  const coutMaint = (refMaint ?? 0) * annees
  const total     = prixNet + coutEnergie + coutMaint

  return {
    available:     true,
    motor,
    label:         MOTOR_LABELS[motor],
    prixCatalogue: prixTTC,
    aides,
    suramort,
    prixNet,
    coutEnergie,
    coutMaint,
    total,
    coutMensuel:   Math.round(total / duree_mois),
    vatApplied:    vatRate,
    isCustomPrice: isCustom,
  }
}

// ─── Utilitaires ──────────────────────────────────────────────────────────────

export function fmtEur(v: number): string {
  return Math.round(v).toLocaleString('fr-FR') + ' €'
}

export function fmtEurM(v: number): string {
  return Math.round(v).toLocaleString('fr-FR') + ' €/mois'
}
