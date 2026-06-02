/**
 * Moteurs.com — Moteur de calcul TCO Poids Lourds (Marché Européen)
 * Référence : Guide de Modélisation TCO Poids Lourds v1.0
 * Sources : IRU 2024, constructeurs (Volvo/DAF/MAN/Mercedes), IFPEN, ACEA.
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export type TypeVehicule    = 'tracteur_44t' | 'porteur_19t' | 'porteur_elec'
export type Motorisation    = 'diesel' | 'gnv' | 'elec' | 'hvo'
export type ModeFinancement = 'comptant' | 'credit' | 'credit_bail' | 'lld'

export interface TCOPLInput {
  // Profil
  type_vehicule:   TypeVehicule
  motorisation:    Motorisation
  km_annuel:       number   // km/an
  duree_detention: number   // années

  // Acquisition
  prix_achat_ht:           number   // € HT catalogue
  remise_pct:              number   // % remise négociée
  valeur_revente_estimee:  number   // € valeur de marché à la revente

  // Financement
  mode_financement:                ModeFinancement
  taux_interet_annuel:             number   // % taux nominal annuel (crédit)
  duree_financement_mois:          number   // mois (crédit)
  loyer_mensuel:                   number   // €/mois (crédit-bail / LLD)
  valeur_residuelle_contractuelle: number   // € option d'achat (crédit-bail)

  // Coûts fixes annuels (€/an)
  assurance_rc:           number
  assurance_tous_risques: number
  taxe_essieu:            number
  vignette:               number
  cout_conducteur:        number   // salaire + charges + formation
  frais_generaux:         number   // admin, TMS
  controle_technique:     number
  telematics:             number   // GPS, tachygraphe numérique
  infra_recharge_annuel:  number   // borne + raccordement amortis (VE)

  // Coûts variables
  consommation:           number   // l/100 km, kg/100 km ou kWh/100 km
  prix_carburant:         number   // €/l, €/kg ou €/kWh
  conso_adblue:           number   // l/100 km (diesel/gnv)
  prix_adblue:            number   // €/l
  cout_maint_prev:        number   // €/km — entretien préventif
  cout_maint_correctif:   number   // €/km — pannes non planifiées
  cout_pneus:             number   // €/km — amortissement + renouvellement
  peages_km:              number   // €/km — péages + taxes kilométriques
  conducteur_variable:    number   // €/km — HS, indemnités km
  autres_variables:       number   // €/km — lavage, divers

  // Facteurs avancés
  taux_disponibilite: number   // 0–1  (ex: 0.96 = 4 % d'immobilisation)
}

export interface TCOPLResult {
  prix_acquisition_net: number

  // Capital / financement
  amortissement_annuel:    number
  cout_financement_annuel: number

  // Fixes détaillés
  assurance_annuelle:      number
  taxes_annuelles:         number
  cout_conducteur_fixe:    number
  frais_generaux_annuels:  number   // CT + télémat + frais généraux
  infra_recharge_annuel:   number

  total_fixes_annuel: number

  // Variables /km
  cout_carburant_km:      number
  cout_adblue_km:         number
  cout_maint_km:          number   // prev + corrective
  cout_pneus_km:          number
  cout_peages_km:         number
  cout_conducteur_var_km: number
  cout_autres_km:         number

  total_variables_km:     number
  total_variables_annuel: number

  // TCO
  tco_nominal_annuel:  number
  tco_nominal_km:      number
  tco_corrige_annuel:  number
  tco_corrige_km:      number

  // Breakdown pour graphique (€/an, 6 catégories)
  cat_capital:         number
  cat_energie:         number
  cat_entretien:       number
  cat_conducteur:      number
  cat_peages:          number
  cat_assurance_admin: number
}

// ─── Calcul ───────────────────────────────────────────────────────────────────

export function calculTCOPL(inp: TCOPLInput): TCOPLResult {
  const { km_annuel, duree_detention } = inp
  const D = Math.max(1, duree_detention)

  // 1. Prix net
  const prix_acquisition_net = inp.prix_achat_ht * (1 - inp.remise_pct / 100)

  // 2. Capital & financement selon mode
  let amortissement_annuel = 0
  let cout_financement_annuel = 0

  switch (inp.mode_financement) {
    case 'comptant':
      amortissement_annuel = (prix_acquisition_net - inp.valeur_revente_estimee) / D
      cout_financement_annuel = 0
      break

    case 'credit': {
      amortissement_annuel = (prix_acquisition_net - inp.valeur_revente_estimee) / D
      const i = inp.taux_interet_annuel / 12 / 100
      const n = inp.duree_financement_mois
      if (i > 0 && n > 0) {
        const M = prix_acquisition_net * (i * Math.pow(1 + i, n)) / (Math.pow(1 + i, n) - 1)
        const total_interet = n * M - prix_acquisition_net
        cout_financement_annuel = total_interet / D
      }
      break
    }

    case 'credit_bail':
      // Loyer annualisé — VR contractuelle récupérée réduit le coût net
      amortissement_annuel = 0
      cout_financement_annuel =
        12 * inp.loyer_mensuel - inp.valeur_residuelle_contractuelle / D
      break

    case 'lld':
      amortissement_annuel = 0
      cout_financement_annuel = 12 * inp.loyer_mensuel
      break
  }

  // 3. Coûts fixes
  const assurance_annuelle     = inp.assurance_rc + inp.assurance_tous_risques
  const taxes_annuelles        = inp.taxe_essieu + inp.vignette
  const cout_conducteur_fixe   = inp.cout_conducteur
  const frais_generaux_annuels = inp.frais_generaux + inp.controle_technique + inp.telematics
  const infra_recharge_annuel  = inp.infra_recharge_annuel

  const total_fixes_annuel =
    amortissement_annuel + cout_financement_annuel +
    assurance_annuelle + taxes_annuelles +
    cout_conducteur_fixe + frais_generaux_annuels +
    infra_recharge_annuel

  // 4. Coûts variables /km
  const cout_carburant_km    = (inp.consommation * inp.prix_carburant) / 100
  const hasAdblue            = inp.motorisation === 'diesel' || inp.motorisation === 'gnv'
  const cout_adblue_km       = hasAdblue ? (inp.conso_adblue * inp.prix_adblue) / 100 : 0
  const cout_maint_km        = inp.cout_maint_prev + inp.cout_maint_correctif
  const cout_pneus_km        = inp.cout_pneus
  const cout_peages_km       = inp.peages_km
  const cout_conducteur_var_km = inp.conducteur_variable
  const cout_autres_km       = inp.autres_variables

  const total_variables_km =
    cout_carburant_km + cout_adblue_km + cout_maint_km +
    cout_pneus_km + cout_peages_km + cout_conducteur_var_km + cout_autres_km

  const total_variables_annuel = total_variables_km * km_annuel

  // 5. TCO
  const tco_nominal_annuel = total_fixes_annuel + total_variables_annuel
  const tco_nominal_km     = km_annuel > 0 ? tco_nominal_annuel / km_annuel : 0
  const td                 = Math.max(0.01, Math.min(1, inp.taux_disponibilite))
  const tco_corrige_annuel = tco_nominal_annuel / td
  const tco_corrige_km     = km_annuel > 0 ? tco_corrige_annuel / km_annuel : 0

  // 6. Breakdown catégories (€/an)
  const cat_capital         = amortissement_annuel + cout_financement_annuel
  const cat_energie         = (cout_carburant_km + cout_adblue_km) * km_annuel
  const cat_entretien       = (cout_maint_km + cout_pneus_km) * km_annuel
  const cat_conducteur      = cout_conducteur_fixe + cout_conducteur_var_km * km_annuel
  const cat_peages          = cout_peages_km * km_annuel + taxes_annuelles
  const cat_assurance_admin = assurance_annuelle + frais_generaux_annuels + infra_recharge_annuel

  return {
    prix_acquisition_net,
    amortissement_annuel,
    cout_financement_annuel,
    assurance_annuelle,
    taxes_annuelles,
    cout_conducteur_fixe,
    frais_generaux_annuels,
    infra_recharge_annuel,
    total_fixes_annuel,
    cout_carburant_km,
    cout_adblue_km,
    cout_maint_km,
    cout_pneus_km,
    cout_peages_km,
    cout_conducteur_var_km,
    cout_autres_km,
    total_variables_km,
    total_variables_annuel,
    tco_nominal_annuel,
    tco_nominal_km,
    tco_corrige_annuel,
    tco_corrige_km,
    cat_capital,
    cat_energie,
    cat_entretien,
    cat_conducteur,
    cat_peages,
    cat_assurance_admin,
  }
}

// ─── Defaults par profil ──────────────────────────────────────────────────────

const D_TRACTEUR_DIESEL: TCOPLInput = {
  type_vehicule: 'tracteur_44t', motorisation: 'diesel',
  km_annuel: 145_000, duree_detention: 5,
  prix_achat_ht: 135_000, remise_pct: 10, valeur_revente_estimee: 30_000,
  mode_financement: 'credit_bail', taux_interet_annuel: 4.5,
  duree_financement_mois: 60, loyer_mensuel: 2_450,
  valeur_residuelle_contractuelle: 25_000,
  assurance_rc: 3_200, assurance_tous_risques: 1_800,
  taxe_essieu: 640, vignette: 1_350,
  cout_conducteur: 52_000, frais_generaux: 2_500,
  controle_technique: 450, telematics: 900,
  infra_recharge_annuel: 0,
  consommation: 29, prix_carburant: 1.28,
  conso_adblue: 1.3, prix_adblue: 0.65,
  cout_maint_prev: 0.060, cout_maint_correctif: 0.040,
  cout_pneus: 0.048, peages_km: 0.260,
  conducteur_variable: 0.080, autres_variables: 0.015,
  taux_disponibilite: 0.96,
}

export const VEHICULE_DEFAULTS: Record<TypeVehicule, Partial<Record<Motorisation, TCOPLInput>>> = {
  tracteur_44t: {
    diesel: { ...D_TRACTEUR_DIESEL },
    gnv: {
      ...D_TRACTEUR_DIESEL, motorisation: 'gnv',
      prix_achat_ht: 148_000, loyer_mensuel: 2_650,
      consommation: 32, prix_carburant: 1.45,
      conso_adblue: 0.8, cout_maint_prev: 0.065,
    },
    hvo: {
      ...D_TRACTEUR_DIESEL, motorisation: 'hvo',
      consommation: 30, prix_carburant: 1.55,
    },
  },
  porteur_19t: {
    diesel: {
      type_vehicule: 'porteur_19t', motorisation: 'diesel',
      km_annuel: 85_000, duree_detention: 6,
      prix_achat_ht: 100_000, remise_pct: 8, valeur_revente_estimee: 20_000,
      mode_financement: 'credit_bail', taux_interet_annuel: 4.5,
      duree_financement_mois: 72, loyer_mensuel: 1_750,
      valeur_residuelle_contractuelle: 18_000,
      assurance_rc: 3_000, assurance_tous_risques: 1_500,
      taxe_essieu: 500, vignette: 800,
      cout_conducteur: 50_000, frais_generaux: 2_000,
      controle_technique: 400, telematics: 800,
      infra_recharge_annuel: 0,
      consommation: 21, prix_carburant: 1.28,
      conso_adblue: 1.0, prix_adblue: 0.65,
      cout_maint_prev: 0.055, cout_maint_correctif: 0.035,
      cout_pneus: 0.038, peages_km: 0.160,
      conducteur_variable: 0.075, autres_variables: 0.012,
      taux_disponibilite: 0.96,
    },
    gnv: {
      type_vehicule: 'porteur_19t', motorisation: 'gnv',
      km_annuel: 85_000, duree_detention: 6,
      prix_achat_ht: 108_000, remise_pct: 7, valeur_revente_estimee: 19_000,
      mode_financement: 'credit_bail', taux_interet_annuel: 4.5,
      duree_financement_mois: 72, loyer_mensuel: 1_850,
      valeur_residuelle_contractuelle: 17_000,
      assurance_rc: 3_000, assurance_tous_risques: 1_500,
      taxe_essieu: 500, vignette: 800,
      cout_conducteur: 50_000, frais_generaux: 2_000,
      controle_technique: 420, telematics: 800,
      infra_recharge_annuel: 0,
      consommation: 25, prix_carburant: 1.45,
      conso_adblue: 0.6, prix_adblue: 0.65,
      cout_maint_prev: 0.060, cout_maint_correctif: 0.038,
      cout_pneus: 0.038, peages_km: 0.140,
      conducteur_variable: 0.075, autres_variables: 0.012,
      taux_disponibilite: 0.95,
    },
    hvo: {
      type_vehicule: 'porteur_19t', motorisation: 'hvo',
      km_annuel: 85_000, duree_detention: 6,
      prix_achat_ht: 101_000, remise_pct: 8, valeur_revente_estimee: 20_000,
      mode_financement: 'credit_bail', taux_interet_annuel: 4.5,
      duree_financement_mois: 72, loyer_mensuel: 1_750,
      valeur_residuelle_contractuelle: 18_000,
      assurance_rc: 3_000, assurance_tous_risques: 1_500,
      taxe_essieu: 500, vignette: 800,
      cout_conducteur: 50_000, frais_generaux: 2_000,
      controle_technique: 400, telematics: 800,
      infra_recharge_annuel: 0,
      consommation: 22, prix_carburant: 1.55,
      conso_adblue: 1.0, prix_adblue: 0.65,
      cout_maint_prev: 0.055, cout_maint_correctif: 0.035,
      cout_pneus: 0.038, peages_km: 0.140,
      conducteur_variable: 0.075, autres_variables: 0.012,
      taux_disponibilite: 0.96,
    },
  },
  porteur_elec: {
    elec: {
      type_vehicule: 'porteur_elec', motorisation: 'elec',
      km_annuel: 55_000, duree_detention: 8,
      prix_achat_ht: 350_000, remise_pct: 4, valeur_revente_estimee: 100_000,
      mode_financement: 'credit_bail', taux_interet_annuel: 3.5,
      duree_financement_mois: 96, loyer_mensuel: 4_200,
      valeur_residuelle_contractuelle: 90_000,
      assurance_rc: 3_500, assurance_tous_risques: 2_000,
      taxe_essieu: 200, vignette: 0,
      cout_conducteur: 52_000, frais_generaux: 2_500,
      controle_technique: 500, telematics: 1_200,
      infra_recharge_annuel: 8_000,
      consommation: 100, prix_carburant: 0.22,
      conso_adblue: 0, prix_adblue: 0,
      cout_maint_prev: 0.025, cout_maint_correctif: 0.018,
      cout_pneus: 0.045, peages_km: 0.080,
      conducteur_variable: 0.080, autres_variables: 0.010,
      taux_disponibilite: 0.97,
    },
  },
}

export function getDefaultInput(vehicule: TypeVehicule, motorisation: Motorisation): TCOPLInput {
  const d = VEHICULE_DEFAULTS[vehicule]?.[motorisation]
  if (d) return { ...d }
  // Fallback : porteur_elec / elec uniquement
  const elec = VEHICULE_DEFAULTS.porteur_elec.elec!
  return { ...elec, type_vehicule: vehicule, motorisation }
}

// ─── Utilitaires ──────────────────────────────────────────────────────────────

export function fmtEurPL(n: number, dec = 0): string {
  return n.toLocaleString('fr-FR', { maximumFractionDigits: dec }) + ' €'
}

export function carburantUnit(motorisation: Motorisation): string {
  if (motorisation === 'elec') return 'kWh/100 km'
  if (motorisation === 'gnv')  return 'kg/100 km'
  return 'l/100 km'
}

export function prixCarburantUnit(motorisation: Motorisation): string {
  if (motorisation === 'elec') return '€/kWh'
  if (motorisation === 'gnv')  return '€/kg'
  return '€/l'
}

export const MOTORISATION_LABELS: Record<Motorisation, string> = {
  diesel: 'Diesel',
  gnv:    'GNV',
  hvo:    'HVO',
  elec:   'Électrique',
}

export const VEHICULE_LABELS: Record<TypeVehicule, { icon: string; title: string; sub: string }> = {
  tracteur_44t: { icon: '🚛', title: 'Tracteur 4×2 44t', sub: 'Longue distance' },
  porteur_19t:  { icon: '🚚', title: 'Porteur 19t',       sub: 'Distribution régionale' },
  porteur_elec: { icon: '⚡', title: 'Porteur Élec. 16–19t', sub: 'Distribution urbaine' },
}
