// lib/assistance-recharge.ts
// Moteur de calcul — Assistance Recharge VE

export type TypeLogement = 'maison' | 'appartement' | 'copro' | 'bureau'
export type Pays         = 'FR' | 'BE' | 'CH' | 'CA'
export type TailleBatterie = 'petite' | 'moyenne' | 'grande'
export type ProfilUsage  = 'domicile' | 'mixte' | 'routier'

export interface RechargeData {
  logement:       TypeLogement | null
  pays:           Pays | null
  kmAn:           number
  tailleBatterie: TailleBatterie | null
  profilUsage:    ProfilUsage | null
}

// ── Prix énergie par pays ─────────────────────────────────────────────────────

export const PRIX_ENERGIE_RECHARGE: Record<Pays, {
  domicile: number; ac: number; dc: number; devise: string
}> = {
  FR: { domicile: 0.2516, ac: 0.38, dc: 0.56, devise: '€'   },
  BE: { domicile: 0.31,   ac: 0.44, dc: 0.63, devise: '€'   },
  CH: { domicile: 0.28,   ac: 0.46, dc: 0.68, devise: 'CHF' },
  CA: { domicile: 0.14,   ac: 0.32, dc: 0.49, devise: 'CAD' },
}

// ── Spécifications VE par taille batterie ─────────────────────────────────────

export const SPECS_VE: Record<TailleBatterie, {
  kwh100km: number; wltp: number
  labelBatterie: string; exemples: string
}> = {
  petite:  { kwh100km: 14.5, wltp: 200, labelBatterie: '< 40 kWh',  exemples: 'Dacia Spring, Citroën ë-C3, Fiat 500e' },
  moyenne: { kwh100km: 17.0, wltp: 340, labelBatterie: '40–75 kWh', exemples: 'Peugeot e-308, Renault Mégane E-Tech, Tesla Model 3 SR' },
  grande:  { kwh100km: 21.0, wltp: 520, labelBatterie: '> 75 kWh',  exemples: 'Tesla Model Y LR, BMW iX, Hyundai Ioniq 6 LR' },
}

// ── Répartition domicile / AC public / DC par profil ──────────────────────────

const REPARTITION: Record<ProfilUsage, { domicile: number; ac: number; dc: number; label: string }> = {
  domicile: { domicile: 0.82, ac: 0.12, dc: 0.06, label: 'Trajet domicile-travail, courts parcours' },
  mixte:    { domicile: 0.55, ac: 0.28, dc: 0.17, label: 'Usage varié, quelques longs trajets/mois' },
  routier:  { domicile: 0.22, ac: 0.30, dc: 0.48, label: 'Longs trajets fréquents, autoroute régulier' },
}

// ── Coefficients d'autonomie réelle ──────────────────────────────────────────

export const AUTONOMIE_COEFF = {
  ete:       0.92,
  hiver:     0.68,
  autoroute: 0.78,
}

// ── Coût et délai installation borne par logement ────────────────────────────

const INSTALLATION: Record<TypeLogement, {
  min: number; max: number; delai: string; note: string
}> = {
  maison:      { min: 800,  max: 1800, delai: '1 à 2 semaines', note: 'Wallbox 7–22 kW recommandée, installation rapide sur tableau électrique existant.' },
  appartement: { min: 600,  max: 1400, delai: '2 à 4 semaines', note: 'Prise renforcée IRVE ou wallbox sur parking privatif, câblage selon distance.' },
  copro:       { min: 1500, max: 4000, delai: '3 à 6 mois',     note: 'Vote en AG requis (droit à la prise). IRVE collective mutualisée envisageable.' },
  bureau:      { min: 1500, max: 5000, delai: '1 à 3 mois',     note: 'Installation pro avec comptage séparé, possible sur compteur entreprise.' },
}

// ── Aides installation par pays ───────────────────────────────────────────────

const AIDES_INSTALL: Record<Pays, { nom: string; reduction: number; montantLabel: string; detail: string; href: string }> = {
  FR: { nom: 'Crédit d\'impôt bornes', reduction: 500, montantLabel: 'jusqu\'à 500 €',    detail: 'Crédit d\'impôt 75% du coût, plafonné à 500 € par foyer (résidence principale). Programme ADVENIR pour les professionnels.', href: 'https://www.impots.gouv.fr' },
  BE: { nom: 'Déduction fiscale / Prime',reduction: 700, montantLabel: '500 à 1 500 €',   detail: 'Wallonie : prime UREBA résidentielle. Bruxelles : déduction RENOLUTION 30%. Déduction fiscale entreprise 100% jusqu\'à fin 2026.', href: 'https://economie.fgov.be' },
  CH: { nom: 'Aides cantonales',         reduction: 800, montantLabel: '500 à 1 500 CHF', detail: 'Pas d\'aide fédérale uniforme. Vaud, Genève, Zurich et d\'autres cantons offrent 500–1500 CHF pour l\'installation d\'une borne.', href: 'https://energieschweiz.ch' },
  CA: { nom: 'Programme provincial',     reduction: 600, montantLabel: '600 à 1 000 CAD', detail: 'Québec : ClimatAuto 600 CAD. Ontario : EV Charging Incentive 600 CAD. BC : CleanBC. Contacter votre province pour les conditions.', href: 'https://www.nrcan.gc.ca' },
}

// ── Réseaux de recharge publique par pays ─────────────────────────────────────

export const RESEAUX_PUBLICS: Record<Pays, { nom: string; couverture: string; tarif: string }[]> = {
  FR: [
    { nom: 'Tesla Superchargeur',   couverture: '⭐⭐⭐⭐⭐ Excellent',  tarif: '0.35–0.55 €/kWh' },
    { nom: 'Ionity',                couverture: '⭐⭐⭐⭐ Très bon',     tarif: '0.49–0.79 €/kWh' },
    { nom: 'TotalEnergies Charge+', couverture: '⭐⭐⭐⭐ Très bon',     tarif: '0.35–0.65 €/kWh' },
    { nom: 'Lidl Charge',           couverture: '⭐⭐⭐ Bon (en cours)', tarif: '0.28–0.42 €/kWh' },
    { nom: 'ChargePoint',           couverture: '⭐⭐⭐ Correct',        tarif: '0.38–0.58 €/kWh' },
  ],
  BE: [
    { nom: 'Tesla Superchargeur', couverture: '⭐⭐⭐⭐ Très bon', tarif: '0.36–0.56 €/kWh' },
    { nom: 'Ionity',              couverture: '⭐⭐⭐⭐ Très bon', tarif: '0.49–0.79 €/kWh' },
    { nom: 'Blue Corner',         couverture: '⭐⭐⭐⭐ Très bon', tarif: '0.40–0.65 €/kWh' },
    { nom: 'Eneco',               couverture: '⭐⭐⭐ Bon',        tarif: '0.38–0.62 €/kWh' },
  ],
  CH: [
    { nom: 'Tesla Superchargeur', couverture: '⭐⭐⭐⭐⭐ Excellent', tarif: '0.40–0.62 CHF/kWh' },
    { nom: 'EV-Key (SBB CFF)',    couverture: '⭐⭐⭐⭐⭐ Excellent', tarif: '0.30–0.55 CHF/kWh' },
    { nom: 'Swisscharge',         couverture: '⭐⭐⭐⭐ Très bon',    tarif: '0.28–0.52 CHF/kWh' },
    { nom: 'Ionity',              couverture: '⭐⭐⭐ Bon',           tarif: '0.49–0.79 €/kWh'  },
  ],
  CA: [
    { nom: 'Tesla Superchargeur',  couverture: '⭐⭐⭐⭐⭐ Excellent',   tarif: '0.38–0.55 CAD/kWh' },
    { nom: 'FLO',                  couverture: '⭐⭐⭐⭐ Très bon (QC/ON)', tarif: '0.28–0.48 CAD/kWh' },
    { nom: 'Electrify Canada',     couverture: '⭐⭐⭐⭐ Très bon',      tarif: '0.42–0.68 CAD/kWh' },
    { nom: 'Circuit Électrique',   couverture: '⭐⭐⭐⭐⭐ Excellent (QC)', tarif: '0.30–0.45 CAD/kWh' },
  ],
}

// ── Types résultat ────────────────────────────────────────────────────────────

export interface ScenarioRecharge {
  id:           'domicile' | 'mixte' | 'public'
  nom:          string
  icon:         string
  description:  string
  coutKwh:      number
  coutMensuel:  number
  coutAnnuel:   number
  devise:        string
}

export interface ResultatRecharge {
  scenarioDomicile:  ScenarioRecharge
  scenarioMixte:     ScenarioRecharge
  scenarioPublic:    ScenarioRecharge
  scenarioProfil:    ScenarioRecharge  // selon profilUsage
  installation: {
    coutMin:     number
    coutMax:     number
    apresAide:   { min: number; max: number }
    aide:        { nom: string; montantLabel: string; detail: string; href: string }
    delai:       string
    note:        string
    devise:      string
  }
  autonomie: {
    wltp:       number
    ete:        number
    hiver:      number
    autoroute:  number
    gainHiver:  number  // km perdus en hiver vs été
  }
  reseaux:        { nom: string; couverture: string; tarif: string }[]
  consommationAn: number   // kWh/an
  devise:         string
}

// ── Calcul principal ──────────────────────────────────────────────────────────

export function calculerRecharge(data: RechargeData): ResultatRecharge {
  const p  = data.pays           ?? 'FR'
  const tb = data.tailleBatterie ?? 'moyenne'
  const pu = data.profilUsage    ?? 'mixte'
  const lg = data.logement       ?? 'maison'
  const km = data.kmAn

  const prix   = PRIX_ENERGIE_RECHARGE[p]
  const specs  = SPECS_VE[tb]
  const reparProfil = REPARTITION[pu]

  // Consommation annuelle avec majoration réelle (+12% vs WLTP)
  const consoAn = Math.round((specs.kwh100km * 1.12 * km) / 100)

  function makeScenario(
    id: ScenarioRecharge['id'],
    nom: string, icon: string, desc: string,
    rep: { domicile: number; ac: number; dc: number }
  ): ScenarioRecharge {
    const coutMoyen = prix.domicile * rep.domicile + prix.ac * rep.ac + prix.dc * rep.dc
    return {
      id, nom, icon, description: desc,
      coutKwh:     parseFloat(coutMoyen.toFixed(3)),
      coutMensuel: Math.round((consoAn * coutMoyen) / 12),
      coutAnnuel:  Math.round(consoAn  * coutMoyen),
      devise:      prix.devise,
    }
  }

  const scenarioDomicile = makeScenario(
    'domicile', 'Recharge domicile', '🏠',
    '82% à domicile (tarif résidentiel) — solution la plus économique',
    { domicile: 0.82, ac: 0.12, dc: 0.06 }
  )

  const scenarioMixte = makeScenario(
    'mixte', 'Mix domicile + réseau', '⚡',
    '55% domicile, 28% AC public, 17% DC rapide — équilibre pratique',
    { domicile: 0.55, ac: 0.28, dc: 0.17 }
  )

  const scenarioPublic = makeScenario(
    'public', 'Réseau public uniquement', '🔌',
    '42% AC public, 58% DC rapide — sans borne à domicile',
    { domicile: 0, ac: 0.42, dc: 0.58 }
  )

  // Scénario profil réel
  const scenarioProfil = makeScenario(
    pu === 'domicile' ? 'domicile' : pu === 'routier' ? 'public' : 'mixte',
    'Votre profil', '🎯',
    reparProfil.label,
    reparProfil
  )

  // Installation borne
  const inst  = INSTALLATION[lg]
  const aide  = AIDES_INSTALL[p]
  const apresAide = {
    min: Math.max(0, inst.min - aide.reduction),
    max: Math.max(0, inst.max - Math.round(aide.reduction * 0.35)),
  }

  // Autonomie réelle
  const wltp = specs.wltp
  const ete         = Math.round(wltp * AUTONOMIE_COEFF.ete)
  const hiver       = Math.round(wltp * AUTONOMIE_COEFF.hiver)
  const autoroute   = Math.round(wltp * AUTONOMIE_COEFF.autoroute)

  return {
    scenarioDomicile,
    scenarioMixte,
    scenarioPublic,
    scenarioProfil,
    installation: {
      coutMin:   inst.min,
      coutMax:   inst.max,
      apresAide,
      aide:      { nom: aide.nom, montantLabel: aide.montantLabel, detail: aide.detail, href: aide.href },
      delai:     inst.delai,
      note:      inst.note,
      devise:    prix.devise,
    },
    autonomie: {
      wltp, ete, hiver, autoroute,
      gainHiver: ete - hiver,
    },
    reseaux:        RESEAUX_PUBLICS[p],
    consommationAn: consoAn,
    devise:         prix.devise,
  }
}

// ── Formatage ─────────────────────────────────────────────────────────────────

export function fmtRecharge(v: number, devise: string): string {
  return `${v.toLocaleString('fr-FR')} ${devise}`
}
