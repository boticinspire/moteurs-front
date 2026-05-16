/**
 * Moteurs.com — Moteur de calcul Assistance Coûts
 * Calcule le coût mensuel réel d'un véhicule et compare les alternatives.
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export type CategorieCout = 'citadine' | 'berline' | 'suv' | 'monospace' | 'vul'
export type MotorisationCout = 'diesel' | 'essence' | 'elec' | 'phev' | 'hybride'
export type TypeFinancement = 'comptant' | 'credit' | 'leasing' | 'loa'
export type TypeUsage = 'domicile_travail' | 'mixte' | 'loisirs'
export type Pays = 'FR' | 'BE' | 'CH' | 'CA'

export interface CoutData {
  // Étape 1 — Véhicule
  categorie:    CategorieCout
  motorisation: MotorisationCout
  kmAn:         number
  anneeVehicule:number          // ex. 2022
  // Étape 2 — Charges
  typeFinancement: TypeFinancement
  mensualite:   number          // €/mois crédit/leasing (0 si comptant)
  assurance:    number | null   // null = estimation auto
  entretien:    number | null   // null = estimation auto
  // Étape 3 — Profil
  pays:         Pays
  usage:        TypeUsage
  kmDomTravail: number          // km aller-retour / jour
  joursParAn:   number          // jours travaillés
}

export interface PostesCout {
  financement:  number   // €/mois
  carburant:    number
  assurance:    number
  entretien:    number
  depreciation: number
  total:        number
}

export interface ResultatCouts {
  postes:           PostesCout
  coutKm:           number     // €/km
  coutTrajetDT:     number     // €/jour domicile-travail
  coutAnnuel:       number
  // Comparatif VE (si motorisation thermique)
  economieMensuelleVE: number | null
  moisRetourInvestVE:  number | null
  // Aides disponibles
  aides: Aide[]
}

export interface Aide {
  nom:     string
  montant: string
  detail:  string
  href:    string
  pays:    Pays
}

// ─── Données ──────────────────────────────────────────────────────────────────

// Consommation autoroute + mixte (on utilise mixte pour coût quotidien)
export const CONSO_MIXTE: Record<CategorieCout, Record<MotorisationCout, number>> = {
  citadine: { diesel: 5.0, essence: 5.8, elec: 15, phev: 4.5, hybride: 4.8 },
  berline:  { diesel: 5.8, essence: 6.8, elec: 18, phev: 5.0, hybride: 5.5 },
  suv:      { diesel: 6.5, essence: 7.8, elec: 20, phev: 6.0, hybride: 6.2 },
  monospace:{ diesel: 7.5, essence: 9.0, elec: 24, phev: 7.0, hybride: 7.2 },
  vul:      { diesel: 8.5, essence: 10.5, elec: 26, phev: 8.0, hybride: 8.2 },
}

// Prix énergie (cohérent avec lib/trajet.ts)
export const PRIX_ENERGIE_COUTS = {
  diesel:     1.72,
  essence:    1.82,
  elec:       0.21,   // domicile (usage quotidien, pas autoroute)
  elec_mix:   0.28,   // mix domicile + borne publique
}

// Dépréciation annuelle estimée (véhicule 1-5 ans, marché 2026)
export const DEPRECIATION_AN: Record<CategorieCout, Record<MotorisationCout, number>> = {
  citadine: { diesel: 1700, essence: 1500, elec: 2200, phev: 1900, hybride: 1700 },
  berline:  { diesel: 2800, essence: 2600, elec: 3400, phev: 3100, hybride: 2900 },
  suv:      { diesel: 4200, essence: 3900, elec: 4800, phev: 4500, hybride: 4100 },
  monospace:{ diesel: 3400, essence: 3100, elec: 3900, phev: 3600, hybride: 3300 },
  vul:      { diesel: 3800, essence: 3500, elec: 4200, phev: 4000, hybride: 3700 },
}

// Assurance mensuelle médiane tous risques 2026 (FR)
export const ASSURANCE_ESTIMATION: Record<CategorieCout, Record<MotorisationCout, number>> = {
  citadine: { diesel: 62, essence: 58, elec: 55, phev: 60, hybride: 58 },
  berline:  { diesel: 88, essence: 84, elec: 78, phev: 86, hybride: 85 },
  suv:      { diesel: 115, essence: 110, elec: 102, phev: 112, hybride: 110 },
  monospace:{ diesel: 98, essence: 94, elec: 88, phev: 96, hybride: 93 },
  vul:      { diesel: 105, essence: 100, elec: 92, phev: 102, hybride: 100 },
}

// Entretien mensuel moyen (réparti sur 12 mois, révisions + réparations)
export const ENTRETIEN_ESTIMATION: Record<MotorisationCout, number> = {
  diesel:  110,   // vidange, filtres, courroie, freins
  essence:  90,
  elec:     38,   // pas de vidange, moins de freins (régénératif), pas de distribution
  phev:     72,
  hybride:  68,
}

// ─── Aides disponibles ────────────────────────────────────────────────────────

export const AIDES_PAR_PAYS: Record<Pays, Aide[]> = {
  FR: [
    {
      nom: 'Bonus écologique VE neuf',
      montant: 'jusqu\'à 7 000 €',
      detail: 'Sous conditions de revenus (RFR ≤ 14 089 €/part) et de prix du véhicule ≤ 47 000 €.',
      href: 'https://www.service-public.fr/particuliers/vosdroits/F34014',
      pays: 'FR',
    },
    {
      nom: 'Prime à la conversion',
      montant: '1 500 à 2 500 €',
      detail: 'En échange de la mise à la casse d\'un diesel ou essence ancien (avant Euro 5). Cumulable avec le bonus.',
      href: 'https://www.service-public.fr/particuliers/vosdroits/F34014',
      pays: 'FR',
    },
    {
      nom: 'Leasing social VE',
      montant: 'Dès 99 €/mois',
      detail: 'Pour les ménages modestes. Disponibilité variable selon enveloppe gouvernementale.',
      href: 'https://www.service-public.fr/particuliers/vosdroits/F34014',
      pays: 'FR',
    },
    {
      nom: 'CEE Aide à la recharge domicile',
      montant: '400 à 960 €',
      detail: 'Via offre CEE de votre fournisseur d\'énergie pour l\'installation d\'une borne Wallbox.',
      href: 'https://www.ecologie.gouv.fr/bonus-ecologiques',
      pays: 'FR',
    },
  ],
  BE: [
    {
      nom: 'Prime VE — Wallonie',
      montant: '4 000 €',
      detail: 'Pour l\'achat d\'un véhicule 100% électrique neuf ou d\'occasion (≤ 3 ans).',
      href: 'https://energie.wallonie.be/fr/primes.html',
      pays: 'BE',
    },
    {
      nom: 'Prime VE — Bruxelles',
      montant: '4 000 à 5 000 €',
      detail: 'Prime Bruxell\'Air : jusqu\'à 5 000 € selon revenus pour véhicule ZEV.',
      href: 'https://leefmilieu.brussels/fr/themes/bruit-air-odeurs/air/vehicules-propres/primes-et-avantages',
      pays: 'BE',
    },
    {
      nom: 'Déductibilité fiscale VE — Entreprise',
      montant: '100 % jusqu\'en 2027',
      detail: 'Déductibilité totale des VE pour les indépendants et PME belges.',
      href: 'https://finances.belgium.be',
      pays: 'BE',
    },
  ],
  CH: [
    {
      nom: 'Primes cantonales VE',
      montant: '500 à 7 500 CHF',
      detail: 'Varie fortement par canton. Genève, Vaud et Zurich offrent les meilleures primes.',
      href: 'https://www.ch.ch/fr/vehicules-electriques/',
      pays: 'CH',
    },
    {
      nom: 'Réduction impôt cantonal',
      montant: 'Variable',
      detail: 'Plusieurs cantons exonèrent partiellement ou totalement les VE de la taxe sur les véhicules.',
      href: 'https://www.tcs.ch/fr/tests-conseils/conseils/voiture/voiture-electrique/',
      pays: 'CH',
    },
  ],
  CA: [
    {
      nom: 'Incitatifs fédéraux iZEV',
      montant: 'jusqu\'à 5 000 $',
      detail: 'Programme fédéral pour VE et PHEV ≤ 55 000 $ (ou ≤ 65 000 $ modèle haut de gamme).',
      href: 'https://tc.canada.ca/fr/transports-routiers/vehicules-ecologiques/programme-incitatifs-vehicules-zero-emission',
      pays: 'CA',
    },
    {
      nom: 'Rabais VE — Québec',
      montant: 'jusqu\'à 7 000 $',
      detail: 'Programme Roulez vert : jusqu\'à 4 000 $ pour VE neuf + bonification possible selon revenus.',
      href: 'https://vehiculeselectriques.gouv.qc.ca/rabais/roulez-vert/',
      pays: 'CA',
    },
  ],
}

// ─── Fonctions de calcul ──────────────────────────────────────────────────────

export function estimerCarburantMensuel(data: CoutData): number {
  const kmMois = data.kmAn / 12
  const conso = CONSO_MIXTE[data.categorie][data.motorisation]

  if (data.motorisation === 'elec') {
    return Math.round((conso / 100) * kmMois * PRIX_ENERGIE_COUTS.elec_mix)
  }
  if (data.motorisation === 'phev') {
    const kmElec = Math.min(data.kmAn * 0.40, data.kmAn) / 12  // 40% km en élec pour PHEV usage courant
    const kmTherm = kmMois - kmElec
    const consoTherm = conso
    return Math.round(
      (15 / 100) * kmElec * PRIX_ENERGIE_COUTS.elec +
      (consoTherm / 100) * kmTherm * PRIX_ENERGIE_COUTS.diesel
    )
  }
  if (data.motorisation === 'diesel') {
    return Math.round((conso / 100) * kmMois * PRIX_ENERGIE_COUTS.diesel)
  }
  // essence, hybride
  return Math.round((conso / 100) * kmMois * PRIX_ENERGIE_COUTS.essence)
}

export function calculerCouts(data: CoutData): ResultatCouts {
  const kmMois = data.kmAn / 12

  const carburant    = estimerCarburantMensuel(data)
  const assurance    = data.assurance  ?? ASSURANCE_ESTIMATION[data.categorie][data.motorisation]
  const entretien    = data.entretien  ?? ENTRETIEN_ESTIMATION[data.motorisation]
  const depreciation = Math.round(DEPRECIATION_AN[data.categorie][data.motorisation] / 12)
  const financement  = data.mensualite

  const total = Math.round(financement + carburant + assurance + entretien + depreciation)

  const postes: PostesCout = {
    financement, carburant, assurance: Math.round(assurance), entretien: Math.round(entretien), depreciation, total,
  }

  const coutKm      = kmMois > 0 ? Math.round((total / kmMois) * 100) / 100 : 0
  const coutAnnuel  = total * 12

  // Coût trajet domicile-travail (jours/mois moyens)
  const joursMois   = data.joursParAn / 12
  const coutDT      = data.kmDomTravail > 0 && joursMois > 0
    ? Math.round((total / joursMois) * 10) / 10
    : 0

  // Comparatif VE si motorisation thermique
  let economieMensuelleVE: number | null = null
  let moisRetourInvestVE: number | null = null

  if (data.motorisation !== 'elec') {
    const consoElec  = CONSO_MIXTE[data.categorie]['elec']
    const carburantVE = Math.round((consoElec / 100) * kmMois * PRIX_ENERGIE_COUTS.elec_mix)
    const assuranceVE = ASSURANCE_ESTIMATION[data.categorie]['elec']
    const entretienVE = ENTRETIEN_ESTIMATION['elec']
    const depreVE     = Math.round(DEPRECIATION_AN[data.categorie]['elec'] / 12)

    // Différentiel mensuel hors financement (on suppose même mensualité ou 0)
    const economieMensuelleBrute = Math.round(
      (carburant - carburantVE) +
      (Math.round(assurance) - assuranceVE) +
      (Math.round(entretien) - entretienVE) +
      (depreciation - depreVE)
    )

    economieMensuelleVE = economieMensuelleBrute

    // Surcout achat VE estimé vs thermique équivalent (en 2026)
    const SURCOUT_ACHAT_VE: Record<CategorieCout, number> = {
      citadine:  5000,
      berline:   7000,
      suv:       9000,
      monospace: 10000,
      vul:       12000,
    }
    // Déduire bonus écologique FR (le plus courant)
    const bonusFR = data.pays === 'FR' ? 4000 : data.pays === 'BE' ? 4000 : data.pays === 'CA' ? 5000 : 0
    const surcoutNet = SURCOUT_ACHAT_VE[data.categorie] - bonusFR

    if (economieMensuelleBrute > 0 && surcoutNet > 0) {
      moisRetourInvestVE = Math.round(surcoutNet / economieMensuelleBrute)
    } else if (economieMensuelleBrute > 0) {
      moisRetourInvestVE = 0
    }
  }

  const aides = AIDES_PAR_PAYS[data.pays] ?? []

  return {
    postes,
    coutKm,
    coutTrajetDT: coutDT,
    coutAnnuel,
    economieMensuelleVE,
    moisRetourInvestVE,
    aides: data.motorisation !== 'elec' ? aides : [],
  }
}

// ─── Utilitaires ──────────────────────────────────────────────────────────────

export function fmtEurCout(v: number): string {
  return Math.round(v).toLocaleString('fr-FR') + ' €'
}

export function fmtMois(n: number): string {
  if (n < 12) return `${n} mois`
  const ans = Math.floor(n / 12)
  const mois = n % 12
  if (mois === 0) return `${ans} an${ans > 1 ? 's' : ''}`
  return `${ans} an${ans > 1 ? 's' : ''} ${mois} mois`
}

export const CATEGORIE_LABELS: Record<CategorieCout, string> = {
  citadine:  'Citadine / Compacte',
  berline:   'Berline / Familiale',
  suv:       'SUV / Crossover',
  monospace: 'Monospace 7 places',
  vul:       'VUL / Fourgon',
}

export const MOTEUR_LABELS: Record<MotorisationCout, string> = {
  diesel:  'Diesel',
  essence: 'Essence',
  elec:    'Électrique',
  phev:    'Hybride recharg.',
  hybride: 'Hybride simple',
}

export const PAYS_LABELS: Record<Pays, string> = {
  FR: '🇫🇷 France',
  BE: '🇧🇪 Belgique',
  CH: '🇨🇭 Suisse',
  CA: '🇨🇦 Canada',
}
