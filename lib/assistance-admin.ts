// lib/assistance-admin.ts
// Assistance Admin — Carte grise, ZFE, Bonus, Aides fiscales

export type Pays         = 'FR' | 'BE' | 'CH' | 'CA'
export type Motorisation = 'elec' | 'phev' | 'hybride' | 'essence' | 'diesel' | 'gnv' | 'hydrogene'
export type Segment      = 'citadine' | 'berline' | 'suv' | 'utilitaire'
export type TypeUsage    = 'particulier' | 'professionnel'
export type RegionFR     =
  | 'ile-de-france' | 'auvergne-rhone-alpes' | 'hauts-de-france'
  | 'nouvelle-aquitaine' | 'occitanie' | 'paca' | 'bretagne'
  | 'normandie' | 'pays-de-la-loire' | 'grand-est' | 'bourgogne'
  | 'centre-val-de-loire' | 'autres'

export interface AdminData {
  pays:          Pays | null
  motorisation:  Motorisation | null
  segment:       Segment | null
  typeUsage:     TypeUsage | null
  prixAchat:     number         // prix du véhicule neuf
  co2:           number | null  // g/km CO₂ (WLTP)
  regionFR:      RegionFR | null
  ancienVehicule: boolean       // dispose d'un ancien thermique à céder
  revenuFiscal:  'modeste' | 'intermediaire' | 'aise' | null  // pour leasing social
}

// ── Taxe régionale FR (taux €/cv) ────────────────────────────────────────────

export const TAXE_REGIONALE_FR: Record<RegionFR, { taux: number; label: string }> = {
  'ile-de-france':        { taux: 54.95, label: 'Île-de-France' },
  'auvergne-rhone-alpes': { taux: 51.20, label: 'Auvergne-Rhône-Alpes' },
  'hauts-de-france':      { taux: 51.20, label: 'Hauts-de-France' },
  'nouvelle-aquitaine':   { taux: 51.20, label: 'Nouvelle-Aquitaine' },
  'occitanie':            { taux: 54.50, label: 'Occitanie' },
  'paca':                 { taux: 51.20, label: "Provence-Alpes-Côte d'Azur" },
  'bretagne':             { taux: 51.20, label: 'Bretagne' },
  'normandie':            { taux: 51.20, label: 'Normandie' },
  'pays-de-la-loire':     { taux: 48.00, label: 'Pays de la Loire' },
  'grand-est':            { taux: 48.00, label: 'Grand Est' },
  'bourgogne':            { taux: 56.00, label: 'Bourgogne-Franche-Comté' },
  'centre-val-de-loire':  { taux: 54.00, label: 'Centre-Val de Loire' },
  'autres':               { taux: 51.20, label: 'Autre région' },
}

// Puissance administrative approx par segment (chevaux fiscaux)
const CV_PAR_SEGMENT: Record<Segment, Record<Motorisation, number>> = {
  citadine:   { elec: 1, phev: 4, hybride: 5,  essence: 5,  diesel: 5,  gnv: 5,  hydrogene: 1 },
  berline:    { elec: 1, phev: 6, hybride: 7,  essence: 7,  diesel: 7,  gnv: 6,  hydrogene: 1 },
  suv:        { elec: 1, phev: 8, hybride: 9,  essence: 9,  diesel: 8,  gnv: 7,  hydrogene: 1 },
  utilitaire: { elec: 1, phev: 6, hybride: 6,  essence: 6,  diesel: 6,  gnv: 6,  hydrogene: 1 },
}

// ── Malus CO₂ FR 2026 ─────────────────────────────────────────────────────────

export interface TrancheMalus {
  co2Min: number; co2Max: number; montant: number
}

export const MALUS_CO2_FR_2026: TrancheMalus[] = [
  { co2Min: 0,   co2Max: 117, montant: 0      },
  { co2Min: 118, co2Max: 122, montant: 50     },
  { co2Min: 123, co2Max: 127, montant: 100    },
  { co2Min: 128, co2Max: 132, montant: 250    },
  { co2Min: 133, co2Max: 137, montant: 500    },
  { co2Min: 138, co2Max: 142, montant: 1000   },
  { co2Min: 143, co2Max: 147, montant: 2000   },
  { co2Min: 148, co2Max: 152, montant: 3000   },
  { co2Min: 153, co2Max: 157, montant: 5000   },
  { co2Min: 158, co2Max: 162, montant: 7500   },
  { co2Min: 163, co2Max: 167, montant: 10000  },
  { co2Min: 168, co2Max: 172, montant: 12500  },
  { co2Min: 173, co2Max: 177, montant: 15000  },
  { co2Min: 178, co2Max: 182, montant: 17500  },
  { co2Min: 183, co2Max: 187, montant: 20000  },
  { co2Min: 188, co2Max: 192, montant: 22500  },
  { co2Min: 193, co2Max: 197, montant: 25000  },
  { co2Min: 198, co2Max: 999, montant: 50000  },
]

export function calculerMalusCO2(co2: number): number {
  const tranche = MALUS_CO2_FR_2026.find(t => co2 >= t.co2Min && co2 <= t.co2Max)
  return tranche?.montant ?? 0
}

// ── Malus masse FR 2026 ───────────────────────────────────────────────────────
// Simplifié : 10 €/kg au-dessus de 1 600 kg (exempt VE, PHEV > 50km, véhicule 3+ enfants)
export function calculerMalusMasse(poidsTonne: number, moto: Motorisation): number {
  if (moto === 'elec' || moto === 'hydrogene') return 0
  const seuilKg = moto === 'phev' ? 2000 : 1600
  const excedent = Math.max(0, poidsTonne * 1000 - seuilKg)
  return excedent > 0 ? Math.round(excedent * 10) : 0
}

// ── Calcul carte grise FR ─────────────────────────────────────────────────────

export interface ResultatCarteGriseFR {
  taxeRegionale:    number
  taxeGestion:      number  // fixe ~11 €
  taxeRedevance:    number  // ~4 €
  malus:            number
  totalEstime:      number
  exonere:          boolean
  tauxRegion:       number
  cvFiscaux:        number
  regionLabel:      string
}

export function calculerCarteGriseFR(
  region: RegionFR,
  segment: Segment,
  moto: Motorisation,
  co2: number | null
): ResultatCarteGriseFR {
  const regionData = TAXE_REGIONALE_FR[region]
  const cv = CV_PAR_SEGMENT[segment][moto]
  const exonere = moto === 'elec' || moto === 'hydrogene'

  const taxeRegionale = exonere ? 0 : Math.round(cv * regionData.taux)
  const taxeGestion   = 11
  const taxeRedevance = 4
  const malus = (!exonere && co2 !== null) ? calculerMalusCO2(co2) : 0
  const total = taxeRegionale + taxeGestion + taxeRedevance + malus

  return {
    taxeRegionale, taxeGestion, taxeRedevance, malus,
    totalEstime: total,
    exonere, tauxRegion: regionData.taux,
    cvFiscaux: cv, regionLabel: regionData.label,
  }
}

// ── Frais immatriculation Belgique ────────────────────────────────────────────

export interface ResultatImmatBE {
  tmc:        number   // Taxe de Mise en Circulation
  taxeCircul: number   // Taxe de circulation annuelle
  exonere:    boolean
  detail:     string
}

export function calculerImmatBE(moto: Motorisation, co2: number | null, prixAchat: number): ResultatImmatBE {
  const exonere = moto === 'elec' || moto === 'hydrogene'
  if (exonere) return { tmc: 0, taxeCircul: 0, exonere: true, detail: 'Les VE sont exonérés de TMC et bénéficient d\'une taxe de circulation réduite.' }

  // TMC Belgique : basée sur la puissance ou les émissions selon région
  // Simplifié : Wallonie base ~61 € × coefficient CO₂
  const co2val = co2 ?? 140
  const coefCO2 = co2val <= 115 ? 1.0 : co2val <= 145 ? 1.5 : co2val <= 175 ? 2.0 : 3.0
  const tmc = Math.round(61 * coefCO2 * (moto === 'diesel' ? 1.25 : 1))
  const taxeCircul = moto === 'phev' ? 80 : moto === 'hybride' ? 120 : 180

  return {
    tmc, taxeCircul, exonere: false,
    detail: 'TMC (Taxe de Mise en Circulation) + Taxe de circulation annuelle. Variable selon région (Wallonie/Bruxelles/Flandre).',
  }
}

// ── Frais immatriculation Suisse ──────────────────────────────────────────────

export interface ResultatImmatCH {
  impotVehicule: number  // annuel, CHF
  exonere:       boolean
  detail:        string
}

export function calculerImmatCH(moto: Motorisation, co2: number | null): ResultatImmatCH {
  const exonere = moto === 'elec' || moto === 'hydrogene'
  if (exonere) return { impotVehicule: 0, exonere: true, detail: 'Les VE sont exonérés d\'impôt sur les véhicules dans la majorité des cantons suisses.' }

  const co2val = co2 ?? 140
  const base = moto === 'diesel' ? 450 : 320
  const malus = co2val > 130 ? Math.round((co2val - 130) * 8) : 0

  return {
    impotVehicule: base + malus, exonere: false,
    detail: 'Impôt cantonal sur les véhicules (annuel). Variable selon canton — estimé sur base Vaud/Genève.',
  }
}

// ── ZFE — Zones à Faibles Émissions ──────────────────────────────────────────

export type VignetteZFE = 'Crit\'Air 0' | 'Crit\'Air 1' | 'Crit\'Air 2' | 'Crit\'Air 3' | 'Crit\'Air 4' | 'Crit\'Air 5' | 'Non classé'

export interface InfoZFE {
  vignette:        VignetteZFE
  accesVillesFR:   string
  restrictions:    string
  conseil:         string
  couleur:         string
}

export const ZFE_PAR_MOTORISATION: Record<Motorisation, InfoZFE> = {
  elec:      { vignette: "Crit'Air 0", couleur: '#059669', accesVillesFR: 'Accès partout, y compris jours de restriction totale', restrictions: 'Aucune restriction', conseil: 'Vous êtes en règle dans toutes les ZFE françaises actuelles et futures.' },
  hydrogene: { vignette: "Crit'Air 0", couleur: '#059669', accesVillesFR: 'Accès partout', restrictions: 'Aucune restriction', conseil: 'Même statut que l\'électrique — accès illimité.' },
  phev:      { vignette: "Crit'Air 1", couleur: '#6366f1', accesVillesFR: 'Accès dans toutes les ZFE actuelles (Paris, Lyon, Grenoble…)', restrictions: 'Restriction possible à partir de 2027–2028 dans certaines villes', conseil: 'Crit\'Air 1 : vous accédez sans restriction jusqu\'en 2027 au minimum. Vérifiez les arrêtés locaux.' },
  hybride:   { vignette: "Crit'Air 1", couleur: '#6366f1', accesVillesFR: 'Accès dans toutes les ZFE actuelles', restrictions: 'Restriction possible à partir de 2027–2028', conseil: 'Crit\'Air 1 : bonne situation à court terme. Surveillez les évolutions réglementaires.' },
  essence:   { vignette: "Crit'Air 1", couleur: '#6366f1', accesVillesFR: 'Accès si Euro 6 (post-2015) · Crit\'Air 2 si Euro 5 (2010-2015)', restrictions: 'Euro 5 (Crit\'Air 2) : restriction dans certaines ZFE aux heures de pointe', conseil: 'Vérifiez le millésime de votre véhicule. Euro 6 (post-2015) = Crit\'Air 1. Euro 5 (2010-2015) = Crit\'Air 2 avec risques.' },
  diesel:    { vignette: "Crit'Air 2", couleur: '#f59e0b', accesVillesFR: 'Accès limité — restrictions selon ville et heure', restrictions: 'Interdit à Paris en semaine · Restrictions croissantes dans Lyon, Grenoble, Strasbourg, Rouen…', conseil: '⚠️ Le diesel Crit\'Air 2 est de plus en plus restreint. Si vous faites plus de 10 000 km/an en ville, envisagez le remplacement avant 2027.' },
  gnv:       { vignette: "Crit'Air 1", couleur: '#6366f1', accesVillesFR: 'Accès dans toutes les ZFE actuelles', restrictions: 'Aucune restriction majeure prévue', conseil: 'GNV : statut favorable, peu de restrictions ZFE prévues à court terme.' },
}

export const ZFE_VILLES_FR = [
  { ville: 'Paris', seuil: "Crit'Air 2 interdit en semaine · Crit'Air 0-1 libre 24h/24" },
  { ville: 'Lyon',  seuil: "Crit'Air 3+ interdit · restrictions horaires Crit'Air 2" },
  { ville: 'Grenoble', seuil: "Crit'Air 3+ interdit · zone en expansion" },
  { ville: 'Strasbourg', seuil: "Crit'Air 2 diesel restreint aux heures de pointe" },
  { ville: 'Rouen', seuil: "Crit'Air 3+ interdit · Crit'Air 2 sous surveillance" },
  { ville: 'Marseille', seuil: "ZFE en déploiement progressif — vérifiez les arrêtés locaux" },
  { ville: 'Toulouse', seuil: "ZFE en déploiement — Crit'Air 3+ sous restriction" },
]

// ── Aides & bonus par pays ────────────────────────────────────────────────────

export interface AideAdmin {
  id:        string
  nom:       string
  montant:   string
  condition: string
  detail:    string
  href:      string
  eligible:  (data: AdminData) => boolean
}

export const AIDES_PAR_PAYS: Record<Pays, AideAdmin[]> = {
  FR: [
    {
      id: 'bonus',
      nom: 'Bonus écologique',
      montant: 'jusqu\'à 7 000 €',
      condition: 'VE neuf · prix < 47 000 € · revenu fiscal ≤ 50 k€/an (particulier) ou jusqu\'à 4 000 € sans condition de revenu',
      detail: 'Montant : 27% du prix d\'achat plafonné à 7 000 € pour revenus modestes. 4 000 € sans condition de revenu. Demande sur le site officiel primes-energie.gouv.fr.',
      href: 'https://www.primealaconversion.gouv.fr',
      eligible: (d) => d.motorisation === 'elec' || d.motorisation === 'hydrogene',
    },
    {
      id: 'conversion',
      nom: 'Prime à la conversion',
      montant: 'jusqu\'à 5 000 €',
      condition: 'Mise à la casse d\'un thermique ancien + achat VE ou hybride rechargeable',
      detail: 'Cumulable avec le bonus. Le montant dépend du revenu fiscal et du type de véhicule mis à la casse (diesel pre-2011, essence pre-2006 plus favorables).',
      href: 'https://www.primealaconversion.gouv.fr',
      eligible: (d) => (d.motorisation === 'elec' || d.motorisation === 'phev') && d.ancienVehicule,
    },
    {
      id: 'leasing',
      nom: 'Leasing social VE',
      montant: 'À partir de 100 €/mois',
      condition: 'Revenus modestes · trajet domicile-travail > 15 km ou sans transports en commun',
      detail: 'Dispositif gouvernemental permettant d\'accéder à un VE neuf à partir de 100 €/mois tout compris. Cumulable avec bonus et prime à la conversion.',
      href: 'https://www.leasingsocial.gouv.fr',
      eligible: (d) => (d.motorisation === 'elec') && d.revenuFiscal === 'modeste',
    },
    {
      id: 'tva-pro',
      nom: 'TVA récupérable (professionnel)',
      montant: '20% du prix HT',
      condition: 'Véhicule utilitaire ou voiture de société — activité professionnelle',
      detail: 'La TVA est récupérable à 100% sur les utilitaires. Pour les voitures particulières de société, la TVA n\'est récupérable que sur les VE dans certains cas. Consultez votre comptable.',
      href: 'https://www.impots.gouv.fr',
      eligible: (d) => d.typeUsage === 'professionnel',
    },
    {
      id: 'suramortissement',
      nom: 'Suramortissement véhicule propre (pro)',
      montant: '20 à 40% de déduction supplémentaire',
      condition: 'VE, PHEV ou GNV utilisé pour activité professionnelle',
      detail: 'Les entreprises peuvent déduire 20% à 40% supplémentaires du prix d\'achat en amortissement, selon le type de véhicule et la date d\'acquisition.',
      href: 'https://www.impots.gouv.fr',
      eligible: (d) => d.typeUsage === 'professionnel' && (d.motorisation === 'elec' || d.motorisation === 'phev' || d.motorisation === 'gnv'),
    },
  ],
  BE: [
    {
      id: 'deduction-pro',
      nom: 'Déduction fiscale 100% (pro)',
      montant: '100% jusqu\'à fin 2026, puis dégressif',
      condition: 'VE neuf pour usage professionnel',
      detail: 'Les entreprises belges peuvent déduire 100% du coût d\'un VE de leur résultat imposable jusqu\'à fin 2026. Passage à 75% en 2027, 50% en 2028.',
      href: 'https://finances.belgium.be',
      eligible: (d) => d.motorisation === 'elec' && d.typeUsage === 'professionnel',
    },
    {
      id: 'prime-wallonie',
      nom: 'Prime Wallonie (véhicule zéro émission)',
      montant: 'jusqu\'à 4 000 €',
      condition: 'VE neuf · résidant en Wallonie · revenu modéré',
      detail: 'Prime régionale wallonne pour l\'achat d\'un VE neuf. Vérifiez les conditions sur le site de la Wallonie car les modalités changent régulièrement.',
      href: 'https://www.wallonie.be',
      eligible: (d) => d.motorisation === 'elec',
    },
    {
      id: 'prime-bruxelles',
      nom: 'Prime Bruxelles VE',
      montant: 'jusqu\'à 5 000 €',
      condition: 'VE neuf · résidant à Bruxelles-Capitale',
      detail: 'Aide régionale bruxelloise pour l\'achat d\'un VE neuf. Cumulable avec les aides fédérales.',
      href: 'https://be.brussels',
      eligible: (d) => d.motorisation === 'elec',
    },
    {
      id: 'avantage-atd',
      nom: 'Avantage ATN réduit (pro)',
      montant: 'Économie de 1 500 à 4 000 €/an',
      condition: 'VE en voiture de société — avantage toutes natures réduit',
      detail: 'L\'Avantage de Toute Nature (ATN) d\'un VE de société est calculé sur une base CO₂ de 0 g/km, ce qui le rend très favorable fiscalement vs un thermique.',
      href: 'https://finances.belgium.be',
      eligible: (d) => d.motorisation === 'elec' && d.typeUsage === 'professionnel',
    },
  ],
  CH: [
    {
      id: 'exo-impot',
      nom: 'Exonération impôt cantonal',
      montant: '300 à 1 500 CHF/an économisés',
      condition: 'VE · varie selon canton',
      detail: 'La plupart des cantons exonèrent totalement les VE de l\'impôt cantonal sur les véhicules. Certains cantons offrent aussi une réduction sur le 1er achat.',
      href: 'https://energieschweiz.ch',
      eligible: (d) => d.motorisation === 'elec' || d.motorisation === 'hydrogene',
    },
    {
      id: 'aide-cantonale-achat',
      nom: 'Subvention cantonale à l\'achat',
      montant: '1 000 à 5 000 CHF',
      condition: 'Variable selon canton (GE, VD, NE, BS favorables)',
      detail: 'Genève et Vaud offrent les subventions les plus généreuses. Certains cantons ont arrêté leurs programmes — vérifiez auprès de votre canton.',
      href: 'https://energieschweiz.ch',
      eligible: (d) => d.motorisation === 'elec',
    },
    {
      id: 'amortissement-pro',
      nom: 'Amortissement accéléré (pro)',
      montant: 'Déduction fiscale selon amortissement',
      condition: 'VE pour usage professionnel',
      detail: 'Les entreprises suisses peuvent amortir rapidement les VE sur leur résultat. Consultez votre fiduciaire pour optimiser l\'impact fiscal.',
      href: 'https://www.estv.admin.ch',
      eligible: (d) => d.motorisation === 'elec' && d.typeUsage === 'professionnel',
    },
  ],
  CA: [
    {
      id: 'izev',
      nom: 'Programme fédéral iZEV',
      montant: 'jusqu\'à 5 000 CAD',
      condition: 'VE ou PHEV neuf · prix < 55 000 CAD (< 65 000 CAD pour version longue)',
      detail: 'Rabais à l\'achat ou au leasing d\'un VE neuf. Appliqué directement par le concessionnaire. 5 000 CAD pour VE, 2 500 CAD pour PHEV avec autonomie ≥ 50 km.',
      href: 'https://www.nrcan.gc.ca/iZEV',
      eligible: (d) => d.motorisation === 'elec' || (d.motorisation === 'phev'),
    },
    {
      id: 'quebec',
      nom: 'Rabais Roulez Vert (Québec)',
      montant: 'jusqu\'à 8 000 CAD',
      condition: 'VE ou PHEV neuf · résidant au Québec · revenu ≤ 100 k CAD',
      detail: '7 000 CAD pour VE · 5 000 CAD pour PHEV. Cumulable avec le programme fédéral iZEV.',
      href: 'https://www.roulezvert.gouv.qc.ca',
      eligible: (d) => d.motorisation === 'elec' || d.motorisation === 'phev',
    },
    {
      id: 'ontario',
      nom: 'Incitatif Ontario VE',
      montant: 'jusqu\'à 5 000 CAD',
      condition: 'VE neuf · résidant en Ontario · sous conditions de prix et revenu',
      detail: 'Programme provincial ontarien — vérifiez la disponibilité car les budgets sont limités et renouvelés annuellement.',
      href: 'https://www.ontario.ca/electricvehicle',
      eligible: (d) => d.motorisation === 'elec',
    },
    {
      id: 'deduction-pro-ca',
      nom: 'Déduction classe 54 (pro)',
      montant: 'Amortissement 100% an 1',
      condition: 'VE pour entreprise · acquisition avant la date limite budgétaire',
      detail: 'Les VE acquis pour usage commercial peuvent être amortis à 100% la première année via la Classe d\'amortissement 54 (CCA Class 54).',
      href: 'https://www.canada.ca/electricvehicle-business',
      eligible: (d) => d.motorisation === 'elec' && d.typeUsage === 'professionnel',
    },
  ],
}

// ── Calcul résultat global ────────────────────────────────────────────────────

export interface ResultatAdmin {
  pays:           Pays
  motorisation:   Motorisation
  // Immatriculation
  immat: {
    FR?: ResultatCarteGriseFR
    BE?: ResultatImmatBE
    CH?: ResultatImmatCH
    CA?: { detail: string }
  }
  // ZFE
  zfe:            InfoZFE
  // Aides éligibles
  aidesEligibles: AideAdmin[]
  totalAideMax:   number
  devise:         string
}

const DEVISE: Record<Pays, string> = { FR: '€', BE: '€', CH: 'CHF', CA: 'CAD' }

export function calculerAdmin(data: AdminData): ResultatAdmin {
  const p  = data.pays!
  const m  = data.motorisation!
  const s  = data.segment ?? 'berline'
  const devise = DEVISE[p]

  // Immatriculation
  const immat: ResultatAdmin['immat'] = {}
  if (p === 'FR' && data.regionFR) {
    immat.FR = calculerCarteGriseFR(data.regionFR, s, m, data.co2)
  }
  if (p === 'BE') immat.BE = calculerImmatBE(m, data.co2, data.prixAchat)
  if (p === 'CH') immat.CH = calculerImmatCH(m, data.co2)
  if (p === 'CA') immat.CA = { detail: 'Au Canada, les frais d\'immatriculation varient par province (80–300 CAD/an). Il n\'existe pas de frais d\'immatriculation unique au niveau fédéral.' }

  // ZFE
  const zfe = ZFE_PAR_MOTORISATION[m]

  // Aides éligibles
  const aidesEligibles = AIDES_PAR_PAYS[p].filter(a => a.eligible(data))

  // Total max aides (estimation sommaire)
  const totalAideMax = aidesEligibles.reduce((acc, a) => {
    const match = a.montant.match(/[\d\s]+/)
    if (!match) return acc
    return acc + parseInt(match[0].replace(/\s/g, ''), 10)
  }, 0)

  return { pays: p, motorisation: m, immat, zfe, aidesEligibles, totalAideMax, devise }
}

export function labelMoto(m: Motorisation): string {
  return { elec: 'Électrique', phev: 'PHEV', hybride: 'Hybride HEV', essence: 'Essence', diesel: 'Diesel', gnv: 'GNV', hydrogene: 'Hydrogène' }[m]
}
