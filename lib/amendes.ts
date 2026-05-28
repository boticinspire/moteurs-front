/**
 * lib/amendes.ts
 * Barèmes officiels des amendes routières — FR, BE, CH, CA-QC + EU principaux
 * Sources : Code de la route FR (art. R413-14 ss), SPF Mobilité BE, OPO CH,
 *           CSR Québec, StVG DE, DGT ES, CdS IT
 * Mise à jour : mai 2026
 */

// ─── Types ───────────────────────────────────────────────────────────────────

export type PaysCode = 'FR' | 'BE' | 'CH' | 'CA-QC' | 'DE' | 'ES' | 'IT' | 'NL' | 'GB' | 'AT' | 'LU' | 'PT' | 'PL' | 'HR'
export type RegionBE = 'FL' | 'FL90' | 'WA' | 'BX'
export type TypeVoie = 'agglo' | 'hors_agglo' | 'autoroute'
export type TypeInfraction = 'vitesse' | 'stationnement' | 'comportement' | 'zfe' | 'alcool' | 'stupefiants'

export interface PaysInfo {
  nom: string
  devise: string
  symbole: string
  drapeau: string
  permis_points_total: number | null  // null = pas de système à points
  note_generale?: string
}

export interface ResultatPV {
  pays: PaysCode
  type: TypeInfraction
  amende_minoree?: number
  amende_forfaitaire: number
  amende_majoree?: number
  amende_max_tribunal?: number
  points_retires: number
  devise: string
  symbole: string
  risque_tribunal: boolean
  risque_suspension: boolean
  risque_immobilisation: boolean
  risque_confiscation: boolean
  delai_paiement_minore?: number  // jours
  delai_contestation?: number     // jours
  conseils: string[]
  sources: string[]
}

// ─── Pays ─────────────────────────────────────────────────────────────────────

export const PAYS: Record<PaysCode, PaysInfo> = {
  FR: {
    nom: 'France',
    devise: 'EUR',
    symbole: '€',
    drapeau: '🇫🇷',
    permis_points_total: 12,
    note_generale: 'Permis à 12 points (6 en probatoire). Amende minorée payable sous 15 jours, majorée après 45 jours.',
  },
  BE: {
    nom: 'Belgique',
    devise: 'EUR',
    symbole: '€',
    drapeau: '🇧🇪',
    permis_points_total: 12,
    note_generale: 'Limites variables par région : Flandre 70 km/h hors agglo (depuis oct. 2021), Wallonie 90 km/h, Bruxelles 30 km/h en agglo. Les perceptions immédiates (PI) sont fédérales et identiques dans les 3 régions. Système de points en vigueur depuis mars 2023.',
  },
  CH: {
    nom: 'Suisse',
    devise: 'CHF',
    symbole: 'CHF',
    drapeau: '🇨🇭',
    permis_points_total: null,
    note_generale: 'Pas de système à points mais avertissement, retrait de permis ou retrait définitif selon la gravité. La "Raserei" (conduite grave) entraîne un retrait min. 2 ans.',
  },
  'CA-QC': {
    nom: 'Canada – Québec',
    devise: 'CAD',
    symbole: '$',
    drapeau: '🇨🇦',
    permis_points_total: 15,
    note_generale: 'Montants indicatifs incluant frais + contribution au SAAQ. Les zones scolaires/de construction doublent certaines amendes. Permis à 15 points.',
  },
  DE: {
    nom: 'Allemagne',
    devise: 'EUR',
    symbole: '€',
    drapeau: '🇩🇪',
    permis_points_total: 8,
    note_generale: "Système Flensburg à 8 points. L'autobahn sans limite est une légende urbaine : zones limitées très nombreuses.",
  },
  ES: {
    nom: 'Espagne',
    devise: 'EUR',
    symbole: '€',
    drapeau: '🇪🇸',
    permis_points_total: 12,
    note_generale: 'Permis à 12 points (8 en probatoire). Radar fixe ou mobile. Réduction de 50 % si paiement sous 20 jours.',
  },
  IT: {
    nom: 'Italie',
    devise: 'EUR',
    symbole: '€',
    drapeau: '🇮🇹',
    permis_points_total: 20,
    note_generale: "Permis à 20 points. Déduction de 30 % si paiement dans les 5 jours. ZTL (zones trafic limité) très étendues dans les centres historiques.",
  },
  NL: {
    nom: 'Pays-Bas',
    devise: 'EUR',
    symbole: '€',
    drapeau: '🇳🇱',
    permis_points_total: null,
    note_generale: "Pas de système à points. CJIB gère le recouvrement des amendes. Facteur de sur-amende selon le revenu pour les infractions graves.",
  },
  GB: {
    nom: 'Royaume-Uni',
    devise: 'GBP',
    symbole: '£',
    drapeau: '🇬🇧',
    permis_points_total: 12,
    note_generale: 'Permis à 12 points. Fixed Penalty Notice (FPN). Réduction 50 % si accepté sous 28 jours. Les radars sont jaunes.',
  },
  AT: {
    nom: 'Autriche',
    devise: 'EUR',
    symbole: '€',
    drapeau: '🇦🇹',
    permis_points_total: null,
    note_generale: "Pas de système à points national. Amendes très élevées. Confiscation du véhicule possible en récidive ≥ 60 km/h de dépassement.",
  },
  LU: {
    nom: 'Luxembourg',
    devise: 'EUR',
    symbole: '€',
    drapeau: '🇱🇺',
    permis_points_total: 12,
    note_generale: "Permis à 12 points. Amendes (avertissements taxés) payables sous 45 jours — double amende après délai. Au-delà de +25 km/h : poursuites judiciaires. Au-delà de +30 km/h : retrait de permis et comparution. Les radars luxembourgeois flashent fréquemment les frontaliers français et belges.",
  },
  PT: {
    nom: 'Portugal',
    devise: 'EUR',
    symbole: '€',
    drapeau: '🇵🇹',
    permis_points_total: 12,
    note_generale: "Permis à 12 points (8 en probatoire < 3 ans). Infractions classées : légères / graves / très graves. Réduction de 50 % si paiement dans les 20 jours (infractions légères). Radars nombreux sur A2 et A25. Seuil alcool abaissé à 0,2 g/L pour pros et permis < 3 ans.",
  },
  PL: {
    nom: 'Pologne',
    devise: 'PLN',
    symbole: 'zł',
    drapeau: '🇵🇱',
    permis_points_total: 24,
    note_generale: "Système de points additif : on accumule jusqu'à 24 points (→ repassage du permis). Points annulés après 1 an. Autoroute à 140 km/h : vitesse maximale légale la plus élevée d'Europe. Récidive (même infraction ≥ 31 km/h dans les 2 ans) : amende doublée.",
  },
  HR: {
    nom: 'Croatie',
    devise: 'EUR',
    symbole: '€',
    drapeau: '🇭🇷',
    permis_points_total: null,
    note_generale: "Pas de système à points. Euro depuis jan. 2023. Réduction de 50 % si paiement immédiat sur place (infractions < 265 €). Phares obligatoires 24h/24 du 1er nov. au 31 mars. Zéro alcool pour < 24 ans et professionnels. Péages sur autoroutes HAC (pas de vignette).",
  },
}

// ─── Vitesse ─────────────────────────────────────────────────────────────────

export interface TrancheVitesse {
  dep_min: number   // dépassement min inclus (km/h)
  dep_max: number   // dépassement max inclus (km/h) — Infinity = dernier palier
  amende_min?: number  // minoré ou PI basse
  amende: number       // forfaitaire ou PI haute
  amende_max?: number  // majoré ou tribunal
  points: number
  tribunal: boolean
  suspension: boolean
  note?: string
}

export interface BaremerVitesseVoie {
  limite_legale: number  // km/h par défaut
  tranches: TrancheVitesse[]
}

export type BaremerVitesse = Record<TypeVoie, BaremerVitesseVoie>

const VITESSE_FR: BaremerVitesse = {
  agglo: {
    limite_legale: 50,
    tranches: [
      { dep_min: 1,  dep_max: 19, amende_min: 90,  amende: 135,  amende_max: 375,  points: 1, tribunal: false, suspension: false },
      { dep_min: 20, dep_max: 29, amende_min: 90,  amende: 135,  amende_max: 375,  points: 2, tribunal: false, suspension: false },
      { dep_min: 30, dep_max: 39, amende_min: 90,  amende: 135,  amende_max: 375,  points: 3, tribunal: false, suspension: false },
      { dep_min: 40, dep_max: 49, amende_min: 90,  amende: 135,  amende_max: 1500, points: 4, tribunal: false, suspension: false },
      { dep_min: 50, dep_max: Infinity, amende: 1500, amende_max: 3750, points: 6, tribunal: true, suspension: true, note: 'Contravention de 5ème classe. Suspension possible dès le contrôle. En récidive dans l\'an : délit pénal (2 ans + 3 750 €).' },
    ],
  },
  hors_agglo: {
    limite_legale: 80,
    tranches: [
      { dep_min: 1,  dep_max: 19, amende_min: 90,  amende: 135,  amende_max: 375,  points: 1, tribunal: false, suspension: false },
      { dep_min: 20, dep_max: 29, amende_min: 90,  amende: 135,  amende_max: 375,  points: 2, tribunal: false, suspension: false },
      { dep_min: 30, dep_max: 39, amende_min: 90,  amende: 135,  amende_max: 375,  points: 3, tribunal: false, suspension: false },
      { dep_min: 40, dep_max: 49, amende_min: 90,  amende: 135,  amende_max: 1500, points: 4, tribunal: false, suspension: false },
      { dep_min: 50, dep_max: Infinity, amende: 1500, amende_max: 3750, points: 6, tribunal: true, suspension: true, note: 'Contravention de 5ème classe. Suspension possible dès le contrôle. En récidive dans l\'an : délit pénal (2 ans + 3 750 €).' },
    ],
  },
  autoroute: {
    limite_legale: 130,
    tranches: [
      { dep_min: 1,  dep_max: 19, amende_min: 90,  amende: 135,  amende_max: 375,  points: 1, tribunal: false, suspension: false },
      { dep_min: 20, dep_max: 29, amende_min: 90,  amende: 135,  amende_max: 375,  points: 2, tribunal: false, suspension: false },
      { dep_min: 30, dep_max: 39, amende_min: 90,  amende: 135,  amende_max: 375,  points: 3, tribunal: false, suspension: false },
      { dep_min: 40, dep_max: 49, amende_min: 90,  amende: 135,  amende_max: 1500, points: 4, tribunal: false, suspension: false },
      { dep_min: 50, dep_max: Infinity, amende: 1500, amende_max: 3750, points: 6, tribunal: true, suspension: true, note: 'Contravention de 5ème classe. Suspension possible dès le contrôle.' },
    ],
  },
}

// Belgique – Flandre (70 km/h hors agglo depuis oct. 2021)
const VITESSE_BE_FL: BaremerVitesse = {
  agglo: {
    limite_legale: 50,
    tranches: [
      { dep_min: 1,  dep_max: 10, amende: 116,  points: 0, tribunal: false, suspension: false, note: 'Perception immédiate.' },
      { dep_min: 11, dep_max: 20, amende: 160,  points: 2, tribunal: false, suspension: false },
      { dep_min: 21, dep_max: 30, amende: 248,  points: 3, tribunal: false, suspension: false },
      { dep_min: 31, dep_max: 40, amende: 412,  points: 4, tribunal: false, suspension: false },
      { dep_min: 41, dep_max: Infinity, amende: 624, amende_max: 4000, points: 6, tribunal: true, suspension: true, note: 'Tribunal correctionnel. Retrait de permis probable.' },
    ],
  },
  hors_agglo: {
    limite_legale: 70,
    tranches: [
      { dep_min: 1,  dep_max: 10, amende: 116,  points: 0, tribunal: false, suspension: false },
      { dep_min: 11, dep_max: 20, amende: 160,  points: 2, tribunal: false, suspension: false },
      { dep_min: 21, dep_max: 30, amende: 248,  points: 3, tribunal: false, suspension: false },
      { dep_min: 31, dep_max: 40, amende: 412,  points: 4, tribunal: false, suspension: false },
      { dep_min: 41, dep_max: Infinity, amende: 624, amende_max: 4000, points: 6, tribunal: true, suspension: true },
    ],
  },
  autoroute: {
    limite_legale: 120,
    tranches: [
      { dep_min: 1,  dep_max: 10, amende: 116,  points: 0, tribunal: false, suspension: false },
      { dep_min: 11, dep_max: 20, amende: 160,  points: 2, tribunal: false, suspension: false },
      { dep_min: 21, dep_max: 30, amende: 248,  points: 3, tribunal: false, suspension: false },
      { dep_min: 31, dep_max: 40, amende: 412,  points: 4, tribunal: false, suspension: false },
      { dep_min: 41, dep_max: Infinity, amende: 624, amende_max: 4000, points: 6, tribunal: true, suspension: true },
    ],
  },
}

// Belgique – Flandre – routes nationales signalisées à 90 km/h
// (certaines N-routes non reclassées maintiennent 90 km/h malgré la réforme d'oct. 2021)
const VITESSE_BE_FL90: BaremerVitesse = {
  agglo: {
    limite_legale: 50,
    tranches: [
      { dep_min: 1,  dep_max: 10, amende: 116,  points: 0, tribunal: false, suspension: false, note: 'Perception immédiate.' },
      { dep_min: 11, dep_max: 20, amende: 160,  points: 2, tribunal: false, suspension: false },
      { dep_min: 21, dep_max: 30, amende: 248,  points: 3, tribunal: false, suspension: false },
      { dep_min: 31, dep_max: 40, amende: 412,  points: 4, tribunal: false, suspension: false },
      { dep_min: 41, dep_max: Infinity, amende: 624, amende_max: 4000, points: 6, tribunal: true, suspension: true, note: 'Tribunal correctionnel. Retrait de permis probable.' },
    ],
  },
  hors_agglo: {
    limite_legale: 90,  // Routes nationales flamandes explicitement signalisées à 90 km/h
    tranches: [
      { dep_min: 1,  dep_max: 10, amende: 116,  points: 0, tribunal: false, suspension: false },
      { dep_min: 11, dep_max: 20, amende: 160,  points: 2, tribunal: false, suspension: false },
      { dep_min: 21, dep_max: 30, amende: 248,  points: 3, tribunal: false, suspension: false },
      { dep_min: 31, dep_max: 40, amende: 412,  points: 4, tribunal: false, suspension: false },
      { dep_min: 41, dep_max: Infinity, amende: 624, amende_max: 4000, points: 6, tribunal: true, suspension: true },
    ],
  },
  autoroute: {
    limite_legale: 120,
    tranches: [
      { dep_min: 1,  dep_max: 10, amende: 116,  points: 0, tribunal: false, suspension: false },
      { dep_min: 11, dep_max: 20, amende: 160,  points: 2, tribunal: false, suspension: false },
      { dep_min: 21, dep_max: 30, amende: 248,  points: 3, tribunal: false, suspension: false },
      { dep_min: 31, dep_max: 40, amende: 412,  points: 4, tribunal: false, suspension: false },
      { dep_min: 41, dep_max: Infinity, amende: 624, amende_max: 4000, points: 6, tribunal: true, suspension: true },
    ],
  },
}

// Belgique – Wallonie (90 km/h hors agglo)
const VITESSE_BE_WA: BaremerVitesse = {
  agglo: {
    limite_legale: 50,
    tranches: [
      { dep_min: 1,  dep_max: 10, amende: 116,  points: 0, tribunal: false, suspension: false, note: 'Perception immédiate.' },
      { dep_min: 11, dep_max: 20, amende: 160,  points: 2, tribunal: false, suspension: false },
      { dep_min: 21, dep_max: 30, amende: 248,  points: 3, tribunal: false, suspension: false },
      { dep_min: 31, dep_max: 40, amende: 412,  points: 4, tribunal: false, suspension: false },
      { dep_min: 41, dep_max: Infinity, amende: 624, amende_max: 4000, points: 6, tribunal: true, suspension: true, note: 'Tribunal correctionnel. Retrait de permis probable.' },
    ],
  },
  hors_agglo: {
    limite_legale: 90,  // Wallonie maintient 90 km/h
    tranches: [
      { dep_min: 1,  dep_max: 10, amende: 116,  points: 0, tribunal: false, suspension: false },
      { dep_min: 11, dep_max: 20, amende: 160,  points: 2, tribunal: false, suspension: false },
      { dep_min: 21, dep_max: 30, amende: 248,  points: 3, tribunal: false, suspension: false },
      { dep_min: 31, dep_max: 40, amende: 412,  points: 4, tribunal: false, suspension: false },
      { dep_min: 41, dep_max: Infinity, amende: 624, amende_max: 4000, points: 6, tribunal: true, suspension: true },
    ],
  },
  autoroute: {
    limite_legale: 120,
    tranches: [
      { dep_min: 1,  dep_max: 10, amende: 116,  points: 0, tribunal: false, suspension: false },
      { dep_min: 11, dep_max: 20, amende: 160,  points: 2, tribunal: false, suspension: false },
      { dep_min: 21, dep_max: 30, amende: 248,  points: 3, tribunal: false, suspension: false },
      { dep_min: 31, dep_max: 40, amende: 412,  points: 4, tribunal: false, suspension: false },
      { dep_min: 41, dep_max: Infinity, amende: 624, amende_max: 4000, points: 6, tribunal: true, suspension: true },
    ],
  },
}

// Belgique – Bruxelles-Capitale (zone 30 km/h généralisée depuis jan. 2021)
const VITESSE_BE_BX: BaremerVitesse = {
  agglo: {
    limite_legale: 30,  // Zone 30 généralisée — exceptions : ring R0, grands boulevards signalés 50/70
    tranches: [
      { dep_min: 1,  dep_max: 10, amende: 116,  points: 0, tribunal: false, suspension: false, note: 'Perception immédiate. Seuil bas à 30 km/h.' },
      { dep_min: 11, dep_max: 20, amende: 160,  points: 2, tribunal: false, suspension: false },
      { dep_min: 21, dep_max: 30, amende: 248,  points: 3, tribunal: false, suspension: false },
      { dep_min: 31, dep_max: 40, amende: 412,  points: 4, tribunal: false, suspension: false },
      { dep_min: 41, dep_max: Infinity, amende: 624, amende_max: 4000, points: 6, tribunal: true, suspension: true, note: 'Tribunal correctionnel. Retrait de permis probable.' },
    ],
  },
  hors_agglo: {
    limite_legale: 70,  // Région bruxelloise hors agglo
    tranches: [
      { dep_min: 1,  dep_max: 10, amende: 116,  points: 0, tribunal: false, suspension: false },
      { dep_min: 11, dep_max: 20, amende: 160,  points: 2, tribunal: false, suspension: false },
      { dep_min: 21, dep_max: 30, amende: 248,  points: 3, tribunal: false, suspension: false },
      { dep_min: 31, dep_max: 40, amende: 412,  points: 4, tribunal: false, suspension: false },
      { dep_min: 41, dep_max: Infinity, amende: 624, amende_max: 4000, points: 6, tribunal: true, suspension: true },
    ],
  },
  autoroute: {
    limite_legale: 120,  // Ring R0 et autoroutes traversantes
    tranches: [
      { dep_min: 1,  dep_max: 10, amende: 116,  points: 0, tribunal: false, suspension: false },
      { dep_min: 11, dep_max: 20, amende: 160,  points: 2, tribunal: false, suspension: false },
      { dep_min: 21, dep_max: 30, amende: 248,  points: 3, tribunal: false, suspension: false },
      { dep_min: 31, dep_max: 40, amende: 412,  points: 4, tribunal: false, suspension: false },
      { dep_min: 41, dep_max: Infinity, amende: 624, amende_max: 4000, points: 6, tribunal: true, suspension: true },
    ],
  },
}

// Suisse — OPO (Ordonnance sur les amendes d'ordre) + jurisprudence TF
const VITESSE_CH: BaremerVitesse = {
  agglo: {
    limite_legale: 50,
    tranches: [
      { dep_min: 1,  dep_max: 5,  amende: 40,   points: 0, tribunal: false, suspension: false },
      { dep_min: 6,  dep_max: 10, amende: 100,  points: 0, tribunal: false, suspension: false },
      { dep_min: 11, dep_max: 15, amende: 250,  points: 0, tribunal: false, suspension: false },
      { dep_min: 16, dep_max: 24, amende: 600,  amende_max: 1200, points: 0, tribunal: false, suspension: false, note: 'Ordonnance pénale. Avertissement ou retrait de permis selon l\'historique.' },
      { dep_min: 25, dep_max: Infinity, amende: 2000, amende_max: 10000, points: 0, tribunal: true, suspension: true, note: '« Raserei » — Conduite grave : retrait de permis minimum 2 ans, possible définitif. Casier judiciaire.' },
    ],
  },
  hors_agglo: {
    limite_legale: 80,
    tranches: [
      { dep_min: 1,  dep_max: 5,  amende: 40,   points: 0, tribunal: false, suspension: false },
      { dep_min: 6,  dep_max: 10, amende: 100,  points: 0, tribunal: false, suspension: false },
      { dep_min: 11, dep_max: 15, amende: 250,  points: 0, tribunal: false, suspension: false },
      { dep_min: 16, dep_max: 29, amende: 600,  amende_max: 1500, points: 0, tribunal: false, suspension: false },
      { dep_min: 30, dep_max: Infinity, amende: 2000, amende_max: 15000, points: 0, tribunal: true, suspension: true, note: '« Raserei » — Retrait de permis min. 2 ans.' },
    ],
  },
  autoroute: {
    limite_legale: 120,
    tranches: [
      { dep_min: 1,  dep_max: 5,  amende: 40,   points: 0, tribunal: false, suspension: false },
      { dep_min: 6,  dep_max: 10, amende: 100,  points: 0, tribunal: false, suspension: false },
      { dep_min: 11, dep_max: 15, amende: 250,  points: 0, tribunal: false, suspension: false },
      { dep_min: 16, dep_max: 34, amende: 600,  amende_max: 2000, points: 0, tribunal: false, suspension: false },
      { dep_min: 35, dep_max: Infinity, amende: 2000, amende_max: 20000, points: 0, tribunal: true, suspension: true, note: '« Raserei » — Retrait de permis min. 2 ans. Peines pénales.' },
    ],
  },
}

// Québec — Code de la sécurité routière (montants tout compris : amende + frais + SAAQ)
const VITESSE_CA_QC: BaremerVitesse = {
  agglo: {
    limite_legale: 50,
    tranches: [
      { dep_min: 1,  dep_max: 10, amende: 90,  amende_max: 180,  points: 0, tribunal: false, suspension: false },
      { dep_min: 11, dep_max: 20, amende: 150, amende_max: 280,  points: 1, tribunal: false, suspension: false },
      { dep_min: 21, dep_max: 30, amende: 220, amende_max: 420,  points: 2, tribunal: false, suspension: false },
      { dep_min: 31, dep_max: 45, amende: 350, amende_max: 590,  points: 3, tribunal: false, suspension: false },
      { dep_min: 46, dep_max: 60, amende: 590, amende_max: 780,  points: 4, tribunal: false, suspension: true, note: 'Suspension de permis sur-le-champ possible.' },
      { dep_min: 61, dep_max: Infinity, amende: 900, amende_max: 1700, points: 5, tribunal: true, suspension: true, note: 'Saisie du véhicule possible. Suspension 7 à 30 jours.' },
    ],
  },
  hors_agglo: {
    limite_legale: 90,
    tranches: [
      { dep_min: 1,  dep_max: 10, amende: 90,  amende_max: 180,  points: 0, tribunal: false, suspension: false },
      { dep_min: 11, dep_max: 20, amende: 150, amende_max: 280,  points: 1, tribunal: false, suspension: false },
      { dep_min: 21, dep_max: 30, amende: 220, amende_max: 420,  points: 2, tribunal: false, suspension: false },
      { dep_min: 31, dep_max: 45, amende: 350, amende_max: 590,  points: 3, tribunal: false, suspension: false },
      { dep_min: 46, dep_max: 60, amende: 590, amende_max: 780,  points: 4, tribunal: false, suspension: true },
      { dep_min: 61, dep_max: Infinity, amende: 900, amende_max: 1700, points: 5, tribunal: true, suspension: true },
    ],
  },
  autoroute: {
    limite_legale: 100,
    tranches: [
      { dep_min: 1,  dep_max: 10, amende: 90,  amende_max: 180,  points: 0, tribunal: false, suspension: false },
      { dep_min: 11, dep_max: 20, amende: 150, amende_max: 280,  points: 1, tribunal: false, suspension: false },
      { dep_min: 21, dep_max: 30, amende: 220, amende_max: 420,  points: 2, tribunal: false, suspension: false },
      { dep_min: 31, dep_max: 45, amende: 350, amende_max: 590,  points: 3, tribunal: false, suspension: false },
      { dep_min: 46, dep_max: 60, amende: 590, amende_max: 780,  points: 4, tribunal: false, suspension: true },
      { dep_min: 61, dep_max: Infinity, amende: 900, amende_max: 1700, points: 5, tribunal: true, suspension: true },
    ],
  },
}

// Allemagne — BKatV (Bußgeldkatalog 2024)
const VITESSE_DE: BaremerVitesse = {
  agglo: {
    limite_legale: 50,
    tranches: [
      { dep_min: 1,  dep_max: 10, amende: 30,   points: 0, tribunal: false, suspension: false },
      { dep_min: 11, dep_max: 15, amende: 50,   points: 0, tribunal: false, suspension: false },
      { dep_min: 16, dep_max: 20, amende: 70,   points: 0, tribunal: false, suspension: false },
      { dep_min: 21, dep_max: 25, amende: 115,  points: 1, tribunal: false, suspension: false },
      { dep_min: 26, dep_max: 30, amende: 180,  points: 1, tribunal: false, suspension: true, note: '1 mois d\'interdiction de conduire.' },
      { dep_min: 31, dep_max: 40, amende: 260,  points: 2, tribunal: false, suspension: true, note: '1 mois d\'interdiction.' },
      { dep_min: 41, dep_max: 50, amende: 400,  points: 2, tribunal: false, suspension: true, note: '1 mois d\'interdiction.' },
      { dep_min: 51, dep_max: 60, amende: 560,  points: 2, tribunal: false, suspension: true, note: '2 mois d\'interdiction.' },
      { dep_min: 61, dep_max: 70, amende: 700,  points: 2, tribunal: false, suspension: true, note: '3 mois d\'interdiction.' },
      { dep_min: 71, dep_max: Infinity, amende: 800, amende_max: 3000, points: 2, tribunal: true, suspension: true },
    ],
  },
  hors_agglo: {
    limite_legale: 100,
    tranches: [
      { dep_min: 1,  dep_max: 10, amende: 20,   points: 0, tribunal: false, suspension: false },
      { dep_min: 11, dep_max: 15, amende: 40,   points: 0, tribunal: false, suspension: false },
      { dep_min: 16, dep_max: 20, amende: 60,   points: 0, tribunal: false, suspension: false },
      { dep_min: 21, dep_max: 25, amende: 100,  points: 1, tribunal: false, suspension: false },
      { dep_min: 26, dep_max: 30, amende: 150,  points: 1, tribunal: false, suspension: false },
      { dep_min: 31, dep_max: 40, amende: 200,  points: 1, tribunal: false, suspension: true, note: '1 mois d\'interdiction.' },
      { dep_min: 41, dep_max: 50, amende: 320,  points: 2, tribunal: false, suspension: true },
      { dep_min: 51, dep_max: 60, amende: 480,  points: 2, tribunal: false, suspension: true, note: '1 mois d\'interdiction.' },
      { dep_min: 61, dep_max: 70, amende: 600,  points: 2, tribunal: false, suspension: true, note: '2 mois d\'interdiction.' },
      { dep_min: 71, dep_max: Infinity, amende: 700, amende_max: 3000, points: 2, tribunal: true, suspension: true },
    ],
  },
  autoroute: {
    limite_legale: 130,  // recommandation, zones limitées
    tranches: [
      { dep_min: 1,  dep_max: 10, amende: 20,   points: 0, tribunal: false, suspension: false },
      { dep_min: 11, dep_max: 15, amende: 40,   points: 0, tribunal: false, suspension: false },
      { dep_min: 16, dep_max: 20, amende: 60,   points: 0, tribunal: false, suspension: false },
      { dep_min: 21, dep_max: 25, amende: 100,  points: 1, tribunal: false, suspension: false },
      { dep_min: 26, dep_max: 30, amende: 150,  points: 1, tribunal: false, suspension: false },
      { dep_min: 31, dep_max: 40, amende: 200,  points: 1, tribunal: false, suspension: true },
      { dep_min: 41, dep_max: 50, amende: 320,  points: 2, tribunal: false, suspension: true },
      { dep_min: 51, dep_max: 60, amende: 480,  points: 2, tribunal: false, suspension: true },
      { dep_min: 61, dep_max: 70, amende: 600,  points: 2, tribunal: false, suspension: true, note: '2 mois d\'interdiction.' },
      { dep_min: 71, dep_max: Infinity, amende: 700, amende_max: 3000, points: 2, tribunal: true, suspension: true },
    ],
  },
}

// Espagne — DGT 2024
const VITESSE_ES: BaremerVitesse = {
  agglo: {
    limite_legale: 50,
    tranches: [
      { dep_min: 1,  dep_max: 20, amende_min: 100, amende: 100, points: 0, tribunal: false, suspension: false, note: 'Réduction 50 % si paiement sous 20 jours.' },
      { dep_min: 21, dep_max: 30, amende_min: 200, amende: 400, points: 2, tribunal: false, suspension: false },
      { dep_min: 31, dep_max: 50, amende_min: 300, amende: 600, points: 4, tribunal: false, suspension: false },
      { dep_min: 51, dep_max: 70, amende_min: 400, amende: 800, points: 6, tribunal: false, suspension: true },
      { dep_min: 71, dep_max: Infinity, amende: 600, amende_max: 6000, points: 6, tribunal: true, suspension: true },
    ],
  },
  hors_agglo: {
    limite_legale: 90,
    tranches: [
      { dep_min: 1,  dep_max: 20, amende_min: 100, amende: 100, points: 0, tribunal: false, suspension: false },
      { dep_min: 21, dep_max: 30, amende_min: 200, amende: 400, points: 2, tribunal: false, suspension: false },
      { dep_min: 31, dep_max: 50, amende_min: 300, amende: 600, points: 4, tribunal: false, suspension: false },
      { dep_min: 51, dep_max: 70, amende_min: 400, amende: 800, points: 6, tribunal: false, suspension: true },
      { dep_min: 71, dep_max: Infinity, amende: 600, amende_max: 6000, points: 6, tribunal: true, suspension: true },
    ],
  },
  autoroute: {
    limite_legale: 120,
    tranches: [
      { dep_min: 1,  dep_max: 20, amende_min: 100, amende: 100, points: 0, tribunal: false, suspension: false },
      { dep_min: 21, dep_max: 30, amende_min: 200, amende: 400, points: 2, tribunal: false, suspension: false },
      { dep_min: 31, dep_max: 50, amende_min: 300, amende: 600, points: 4, tribunal: false, suspension: false },
      { dep_min: 51, dep_max: 70, amende_min: 400, amende: 800, points: 6, tribunal: false, suspension: true },
      { dep_min: 71, dep_max: Infinity, amende: 600, amende_max: 6000, points: 6, tribunal: true, suspension: true },
    ],
  },
}

// Italie — CdS (Codice della Strada) 2024
const VITESSE_IT: BaremerVitesse = {
  agglo: {
    limite_legale: 50,
    tranches: [
      { dep_min: 1,  dep_max: 10, amende_min: 43, amende: 173, points: 0, tribunal: false, suspension: false, note: 'Réduction 30 % si paiement dans les 5 jours.' },
      { dep_min: 11, dep_max: 40, amende_min: 173, amende: 695, points: 3, tribunal: false, suspension: false },
      { dep_min: 41, dep_max: 60, amende_min: 543, amende: 2170, points: 6, tribunal: false, suspension: true, note: 'Suspension 1-3 mois.' },
      { dep_min: 61, dep_max: Infinity, amende_min: 845, amende: 3382, points: 10, tribunal: true, suspension: true, note: 'Suspension 6-12 mois.' },
    ],
  },
  hors_agglo: {
    limite_legale: 90,
    tranches: [
      { dep_min: 1,  dep_max: 10, amende_min: 43, amende: 173, points: 0, tribunal: false, suspension: false },
      { dep_min: 11, dep_max: 40, amende_min: 173, amende: 695, points: 3, tribunal: false, suspension: false },
      { dep_min: 41, dep_max: 60, amende_min: 543, amende: 2170, points: 6, tribunal: false, suspension: true },
      { dep_min: 61, dep_max: Infinity, amende_min: 845, amende: 3382, points: 10, tribunal: true, suspension: true },
    ],
  },
  autoroute: {
    limite_legale: 130,
    tranches: [
      { dep_min: 1,  dep_max: 10, amende_min: 43, amende: 173, points: 0, tribunal: false, suspension: false },
      { dep_min: 11, dep_max: 40, amende_min: 173, amende: 695, points: 3, tribunal: false, suspension: false },
      { dep_min: 41, dep_max: 60, amende_min: 543, amende: 2170, points: 6, tribunal: false, suspension: true },
      { dep_min: 61, dep_max: Infinity, amende_min: 845, amende: 3382, points: 10, tribunal: true, suspension: true },
    ],
  },
}

// Pays-Bas — Wet administratiefrechtelijke handhaving verkeersvoorschriften
const VITESSE_NL: BaremerVitesse = {
  agglo: {
    limite_legale: 50,
    tranches: [
      { dep_min: 1,  dep_max: 3,  amende: 31,   points: 0, tribunal: false, suspension: false },
      { dep_min: 4,  dep_max: 9,  amende: 100,  points: 0, tribunal: false, suspension: false },
      { dep_min: 10, dep_max: 14, amende: 180,  points: 0, tribunal: false, suspension: false },
      { dep_min: 15, dep_max: 19, amende: 260,  points: 0, tribunal: false, suspension: false },
      { dep_min: 20, dep_max: 29, amende: 380,  points: 0, tribunal: false, suspension: false },
      { dep_min: 30, dep_max: 40, amende: 500,  amende_max: 700, points: 0, tribunal: false, suspension: true },
      { dep_min: 41, dep_max: Infinity, amende: 700, amende_max: 3000, points: 0, tribunal: true, suspension: true },
    ],
  },
  hors_agglo: {
    limite_legale: 80,
    tranches: [
      { dep_min: 1,  dep_max: 3,  amende: 31,   points: 0, tribunal: false, suspension: false },
      { dep_min: 4,  dep_max: 9,  amende: 83,   points: 0, tribunal: false, suspension: false },
      { dep_min: 10, dep_max: 14, amende: 142,  points: 0, tribunal: false, suspension: false },
      { dep_min: 15, dep_max: 19, amende: 210,  points: 0, tribunal: false, suspension: false },
      { dep_min: 20, dep_max: 29, amende: 320,  points: 0, tribunal: false, suspension: false },
      { dep_min: 30, dep_max: 40, amende: 450,  amende_max: 700, points: 0, tribunal: false, suspension: true },
      { dep_min: 41, dep_max: Infinity, amende: 700, amende_max: 3000, points: 0, tribunal: true, suspension: true },
    ],
  },
  autoroute: {
    limite_legale: 100,  // 100 de nuit, 130 de jour sur autoroutes non limitées
    tranches: [
      { dep_min: 1,  dep_max: 3,  amende: 31,   points: 0, tribunal: false, suspension: false },
      { dep_min: 4,  dep_max: 9,  amende: 68,   points: 0, tribunal: false, suspension: false },
      { dep_min: 10, dep_max: 14, amende: 116,  points: 0, tribunal: false, suspension: false },
      { dep_min: 15, dep_max: 19, amende: 174,  points: 0, tribunal: false, suspension: false },
      { dep_min: 20, dep_max: 29, amende: 274,  points: 0, tribunal: false, suspension: false },
      { dep_min: 30, dep_max: 40, amende: 400,  amende_max: 700, points: 0, tribunal: false, suspension: true },
      { dep_min: 41, dep_max: Infinity, amende: 700, amende_max: 3000, points: 0, tribunal: true, suspension: true },
    ],
  },
}

// Royaume-Uni — Fixed Penalty + Magistrates Court
const VITESSE_GB: BaremerVitesse = {
  agglo: {
    limite_legale: 48,  // 30 mph
    tranches: [
      { dep_min: 1,  dep_max: 9,  amende_min: 100, amende: 100, points: 3, tribunal: false, suspension: false, note: 'FPN. Réduction 50 % acceptée sous 28 jours. Stage de sensibilité possible.' },
      { dep_min: 10, dep_max: 19, amende_min: 100, amende: 100, amende_max: 1000, points: 4, tribunal: false, suspension: false },
      { dep_min: 20, dep_max: Infinity, amende_min: 100, amende: 1000, amende_max: 2500, points: 6, tribunal: true, suspension: true },
    ],
  },
  hors_agglo: {
    limite_legale: 96,  // 60 mph
    tranches: [
      { dep_min: 1,  dep_max: 9,  amende_min: 100, amende: 100, points: 3, tribunal: false, suspension: false },
      { dep_min: 10, dep_max: 24, amende_min: 100, amende: 100, amende_max: 1000, points: 4, tribunal: false, suspension: false },
      { dep_min: 25, dep_max: Infinity, amende_min: 100, amende: 1000, amende_max: 2500, points: 6, tribunal: true, suspension: true },
    ],
  },
  autoroute: {
    limite_legale: 113,  // 70 mph
    tranches: [
      { dep_min: 1,  dep_max: 9,  amende_min: 100, amende: 100, points: 3, tribunal: false, suspension: false },
      { dep_min: 10, dep_max: 24, amende_min: 100, amende: 100, amende_max: 1000, points: 4, tribunal: false, suspension: false },
      { dep_min: 25, dep_max: Infinity, amende_min: 100, amende: 1000, amende_max: 2500, points: 6, tribunal: true, suspension: true },
    ],
  },
}

// Autriche — FSG 2024
const VITESSE_AT: BaremerVitesse = {
  agglo: {
    limite_legale: 50,
    tranches: [
      { dep_min: 1,  dep_max: 20, amende: 50,   amende_max: 300, points: 0, tribunal: false, suspension: false },
      { dep_min: 21, dep_max: 30, amende: 150,  amende_max: 726, points: 0, tribunal: false, suspension: false },
      { dep_min: 31, dep_max: 40, amende: 300,  amende_max: 1500, points: 0, tribunal: false, suspension: false },
      { dep_min: 41, dep_max: 50, amende: 400,  amende_max: 2180, points: 0, tribunal: false, suspension: true, note: 'Retrait temporaire possible.' },
      { dep_min: 51, dep_max: 60, amende: 500,  amende_max: 2900, points: 0, tribunal: false, suspension: true },
      { dep_min: 61, dep_max: Infinity, amende: 700, amende_max: 5000, points: 0, tribunal: true, suspension: true, note: 'Confiscation du véhicule possible en récidive.' },
    ],
  },
  hors_agglo: {
    limite_legale: 100,
    tranches: [
      { dep_min: 1,  dep_max: 20, amende: 50,   amende_max: 300, points: 0, tribunal: false, suspension: false },
      { dep_min: 21, dep_max: 30, amende: 150,  amende_max: 726, points: 0, tribunal: false, suspension: false },
      { dep_min: 31, dep_max: 40, amende: 300,  amende_max: 1500, points: 0, tribunal: false, suspension: false },
      { dep_min: 41, dep_max: 50, amende: 400,  amende_max: 2180, points: 0, tribunal: false, suspension: true },
      { dep_min: 51, dep_max: 60, amende: 500,  amende_max: 2900, points: 0, tribunal: false, suspension: true },
      { dep_min: 61, dep_max: Infinity, amende: 700, amende_max: 5000, points: 0, tribunal: true, suspension: true },
    ],
  },
  autoroute: {
    limite_legale: 130,
    tranches: [
      { dep_min: 1,  dep_max: 20, amende: 50,   amende_max: 300, points: 0, tribunal: false, suspension: false },
      { dep_min: 21, dep_max: 30, amende: 150,  amende_max: 726, points: 0, tribunal: false, suspension: false },
      { dep_min: 31, dep_max: 40, amende: 300,  amende_max: 1500, points: 0, tribunal: false, suspension: false },
      { dep_min: 41, dep_max: 50, amende: 400,  amende_max: 2180, points: 0, tribunal: false, suspension: true },
      { dep_min: 51, dep_max: 60, amende: 500,  amende_max: 2900, points: 0, tribunal: false, suspension: true },
      { dep_min: 61, dep_max: Infinity, amende: 700, amende_max: 5000, points: 0, tribunal: true, suspension: true },
    ],
  },
}

// Luxembourg — Code de la route Grand-Ducal 2025 (avertissements taxés)
const VITESSE_LU: BaremerVitesse = {
  agglo: {
    limite_legale: 50,
    tranches: [
      { dep_min: 1,  dep_max: 10, amende: 49,   points: 0, tribunal: false, suspension: false },
      { dep_min: 11, dep_max: 15, amende: 74,   points: 0, tribunal: false, suspension: false },
      { dep_min: 16, dep_max: 20, amende: 99,   points: 0, tribunal: false, suspension: false },
      { dep_min: 21, dep_max: 25, amende: 145,  points: 2, tribunal: false, suspension: false },
      { dep_min: 26, dep_max: 30, amende: 500,  amende_max: 2500, points: 4, tribunal: true, suspension: false, note: 'Poursuites judiciaires possibles.' },
      { dep_min: 31, dep_max: Infinity, amende: 1000, amende_max: 10000, points: 6, tribunal: true, suspension: true, note: 'Retrait de permis, interdiction de conduire, confiscation possible.' },
    ],
  },
  hors_agglo: {
    limite_legale: 90,
    tranches: [
      { dep_min: 1,  dep_max: 10, amende: 49,   points: 0, tribunal: false, suspension: false },
      { dep_min: 11, dep_max: 15, amende: 74,   points: 0, tribunal: false, suspension: false },
      { dep_min: 16, dep_max: 20, amende: 99,   points: 0, tribunal: false, suspension: false },
      { dep_min: 21, dep_max: 25, amende: 145,  points: 2, tribunal: false, suspension: false },
      { dep_min: 26, dep_max: 30, amende: 500,  amende_max: 2500, points: 4, tribunal: true, suspension: false },
      { dep_min: 31, dep_max: Infinity, amende: 1000, amende_max: 10000, points: 6, tribunal: true, suspension: true },
    ],
  },
  autoroute: {
    limite_legale: 130,
    tranches: [
      { dep_min: 1,  dep_max: 10, amende: 49,   points: 0, tribunal: false, suspension: false },
      { dep_min: 11, dep_max: 15, amende: 74,   points: 0, tribunal: false, suspension: false },
      { dep_min: 16, dep_max: 20, amende: 99,   points: 0, tribunal: false, suspension: false },
      { dep_min: 21, dep_max: 25, amende: 145,  points: 2, tribunal: false, suspension: false },
      { dep_min: 26, dep_max: 30, amende: 500,  amende_max: 2500, points: 4, tribunal: true, suspension: false },
      { dep_min: 31, dep_max: Infinity, amende: 1000, amende_max: 10000, points: 6, tribunal: true, suspension: true },
    ],
  },
}

// Portugal — Código da Estrada / ANSR 2025 (infrações leves / graves / muito graves)
const VITESSE_PT: BaremerVitesse = {
  agglo: {
    limite_legale: 50,
    tranches: [
      { dep_min: 1,  dep_max: 20, amende_min: 60,  amende: 300,  points: 0, tribunal: false, suspension: false, note: 'Infração leve. Réduction 50 % si paiement sous 20 jours.' },
      { dep_min: 21, dep_max: 40, amende_min: 120, amende: 600,  points: 2, tribunal: false, suspension: false, note: 'Infração grave. Suspension 1–12 mois possible.' },
      { dep_min: 41, dep_max: 60, amende_min: 300, amende: 1500, points: 4, tribunal: false, suspension: true,  note: 'Infração muito grave. Suspension 2–24 mois.' },
      { dep_min: 61, dep_max: Infinity, amende_min: 500, amende: 2500, points: 4, tribunal: true, suspension: true, note: 'Infração muito grave — tribunal.' },
    ],
  },
  hors_agglo: {
    limite_legale: 90,
    tranches: [
      { dep_min: 1,  dep_max: 30, amende_min: 60,  amende: 300,  points: 0, tribunal: false, suspension: false, note: 'Infração leve. Réduction 50 % si paiement sous 20 jours.' },
      { dep_min: 31, dep_max: 60, amende_min: 120, amende: 600,  points: 2, tribunal: false, suspension: false, note: 'Infração grave.' },
      { dep_min: 61, dep_max: 80, amende_min: 300, amende: 1500, points: 4, tribunal: false, suspension: true,  note: 'Infração muito grave.' },
      { dep_min: 81, dep_max: Infinity, amende_min: 500, amende: 2500, points: 4, tribunal: true, suspension: true },
    ],
  },
  autoroute: {
    limite_legale: 120,
    tranches: [
      { dep_min: 1,  dep_max: 30, amende_min: 60,  amende: 300,  points: 0, tribunal: false, suspension: false, note: 'Infração leve. Réduction 50 % si paiement sous 20 jours.' },
      { dep_min: 31, dep_max: 60, amende_min: 120, amende: 600,  points: 2, tribunal: false, suspension: false },
      { dep_min: 61, dep_max: 80, amende_min: 300, amende: 1500, points: 4, tribunal: false, suspension: true  },
      { dep_min: 81, dep_max: Infinity, amende_min: 500, amende: 2500, points: 4, tribunal: true, suspension: true },
    ],
  },
}

// Pologne — Taryfikator mandatów 2026 (PLN — 1 EUR ≈ 4,3 zł)
const VITESSE_PL: BaremerVitesse = {
  agglo: {
    limite_legale: 50,
    tranches: [
      { dep_min: 1,  dep_max: 10, amende: 50,   points: 1,  tribunal: false, suspension: false },
      { dep_min: 11, dep_max: 15, amende: 100,  points: 2,  tribunal: false, suspension: false },
      { dep_min: 16, dep_max: 20, amende: 200,  points: 3,  tribunal: false, suspension: false },
      { dep_min: 21, dep_max: 25, amende: 300,  points: 5,  tribunal: false, suspension: false },
      { dep_min: 26, dep_max: 30, amende: 400,  points: 7,  tribunal: false, suspension: false },
      { dep_min: 31, dep_max: 40, amende: 800,  amende_max: 1600, points: 9,  tribunal: false, suspension: false, note: 'Récidive dans les 2 ans : 1 600 zł.' },
      { dep_min: 41, dep_max: 50, amende: 1000, amende_max: 2000, points: 11, tribunal: false, suspension: false, note: 'Récidive : 2 000 zł.' },
      { dep_min: 51, dep_max: 60, amende: 1500, amende_max: 3000, points: 13, tribunal: false, suspension: false, note: 'Récidive : 3 000 zł.' },
      { dep_min: 61, dep_max: 70, amende: 2000, amende_max: 4000, points: 14, tribunal: false, suspension: false, note: 'Récidive : 4 000 zł.' },
      { dep_min: 71, dep_max: Infinity, amende: 2500, amende_max: 5000, points: 15, tribunal: true, suspension: true, note: 'Récidive : 5 000 zł. Retrait de permis possible.' },
    ],
  },
  hors_agglo: {
    limite_legale: 90,
    tranches: [
      { dep_min: 1,  dep_max: 10, amende: 50,   points: 1,  tribunal: false, suspension: false },
      { dep_min: 11, dep_max: 15, amende: 100,  points: 2,  tribunal: false, suspension: false },
      { dep_min: 16, dep_max: 20, amende: 200,  points: 3,  tribunal: false, suspension: false },
      { dep_min: 21, dep_max: 25, amende: 300,  points: 5,  tribunal: false, suspension: false },
      { dep_min: 26, dep_max: 30, amende: 400,  points: 7,  tribunal: false, suspension: false },
      { dep_min: 31, dep_max: 40, amende: 800,  amende_max: 1600, points: 9,  tribunal: false, suspension: false },
      { dep_min: 41, dep_max: 50, amende: 1000, amende_max: 2000, points: 11, tribunal: false, suspension: false },
      { dep_min: 51, dep_max: 60, amende: 1500, amende_max: 3000, points: 13, tribunal: false, suspension: false },
      { dep_min: 61, dep_max: 70, amende: 2000, amende_max: 4000, points: 14, tribunal: false, suspension: false },
      { dep_min: 71, dep_max: Infinity, amende: 2500, amende_max: 5000, points: 15, tribunal: true, suspension: true },
    ],
  },
  autoroute: {
    limite_legale: 140,  // Plus haute limite légale d'Europe
    tranches: [
      { dep_min: 1,  dep_max: 10, amende: 50,   points: 1,  tribunal: false, suspension: false },
      { dep_min: 11, dep_max: 15, amende: 100,  points: 2,  tribunal: false, suspension: false },
      { dep_min: 16, dep_max: 20, amende: 200,  points: 3,  tribunal: false, suspension: false },
      { dep_min: 21, dep_max: 25, amende: 300,  points: 5,  tribunal: false, suspension: false },
      { dep_min: 26, dep_max: 30, amende: 400,  points: 7,  tribunal: false, suspension: false },
      { dep_min: 31, dep_max: 40, amende: 800,  amende_max: 1600, points: 9,  tribunal: false, suspension: false },
      { dep_min: 41, dep_max: 50, amende: 1000, amende_max: 2000, points: 11, tribunal: false, suspension: false },
      { dep_min: 51, dep_max: 60, amende: 1500, amende_max: 3000, points: 13, tribunal: false, suspension: false },
      { dep_min: 61, dep_max: 70, amende: 2000, amende_max: 4000, points: 14, tribunal: false, suspension: false },
      { dep_min: 71, dep_max: Infinity, amende: 2500, amende_max: 5000, points: 15, tribunal: true, suspension: true },
    ],
  },
}

// Croatie — ZSPC (Zakon o sigurnosti prometa na cestama) 2025 (EUR depuis jan. 2023)
const VITESSE_HR: BaremerVitesse = {
  agglo: {
    limite_legale: 50,
    tranches: [
      { dep_min: 1,  dep_max: 10, amende: 40,   points: 0, tribunal: false, suspension: false, note: 'Réduction 50 % si paiement immédiat sur place.' },
      { dep_min: 11, dep_max: 20, amende: 66,   points: 0, tribunal: false, suspension: false },
      { dep_min: 21, dep_max: 30, amende: 133,  points: 0, tribunal: false, suspension: false },
      { dep_min: 31, dep_max: 50, amende: 265,  points: 0, tribunal: false, suspension: true, note: 'Suspension possible.' },
      { dep_min: 51, dep_max: Infinity, amende: 664, amende_max: 1992, points: 0, tribunal: true, suspension: true, note: "Retrait de permis jusqu\'à 90 jours. Poursuites judiciaires." },
    ],
  },
  hors_agglo: {
    limite_legale: 90,
    tranches: [
      { dep_min: 1,  dep_max: 10, amende: 40,   points: 0, tribunal: false, suspension: false, note: 'Réduction 50 % si paiement immédiat.' },
      { dep_min: 11, dep_max: 20, amende: 66,   points: 0, tribunal: false, suspension: false },
      { dep_min: 21, dep_max: 30, amende: 133,  points: 0, tribunal: false, suspension: false },
      { dep_min: 31, dep_max: 50, amende: 265,  points: 0, tribunal: false, suspension: true },
      { dep_min: 51, dep_max: Infinity, amende: 664, amende_max: 1992, points: 0, tribunal: true, suspension: true },
    ],
  },
  autoroute: {
    limite_legale: 130,
    tranches: [
      { dep_min: 1,  dep_max: 10, amende: 40,   points: 0, tribunal: false, suspension: false },
      { dep_min: 11, dep_max: 20, amende: 66,   points: 0, tribunal: false, suspension: false },
      { dep_min: 21, dep_max: 30, amende: 133,  points: 0, tribunal: false, suspension: false },
      { dep_min: 31, dep_max: 50, amende: 265,  points: 0, tribunal: false, suspension: true },
      { dep_min: 51, dep_max: Infinity, amende: 664, amende_max: 1992, points: 0, tribunal: true, suspension: true },
    ],
  },
}

export const BAREME_VITESSE: Partial<Record<PaysCode, BaremerVitesse>> = {
  FR: VITESSE_FR,
  BE: VITESSE_BE_FL,  // legacy — utilisé en fallback (Flandre). Le composant UI utilise BAREME_VITESSE_BE.
  CH: VITESSE_CH,
  'CA-QC': VITESSE_CA_QC,
  DE: VITESSE_DE,
  ES: VITESSE_ES,
  IT: VITESSE_IT,
  NL: VITESSE_NL,
  GB: VITESSE_GB,
  AT: VITESSE_AT,
  LU: VITESSE_LU,
  PT: VITESSE_PT,
  PL: VITESSE_PL,
  HR: VITESSE_HR,
}

export const BAREME_VITESSE_BE: Record<RegionBE, BaremerVitesse> = {
  FL:   VITESSE_BE_FL,
  FL90: VITESSE_BE_FL90,
  WA:   VITESSE_BE_WA,
  BX:   VITESSE_BE_BX,
}

// ─── Comportement (téléphone, ceinture, refus priorité...) ───────────────────

export interface InfractionComportement {
  id: string
  label: string
  amende_min?: number
  amende: number
  amende_max?: number
  points: number
  tribunal: boolean
  suspension: boolean
  note?: string
}

export const BAREME_COMPORTEMENT: Partial<Record<PaysCode, InfractionComportement[]>> = {
  FR: [
    { id: 'telephone', label: 'Téléphone tenu en main au volant', amende_min: 90, amende: 135, amende_max: 375, points: 3, tribunal: false, suspension: false },
    { id: 'ceinture_conducteur', label: 'Ceinture de sécurité non bouclée (conducteur)', amende_min: 90, amende: 135, amende_max: 375, points: 3, tribunal: false, suspension: false },
    { id: 'ceinture_passager', label: 'Ceinture passager non bouclée', amende_min: 90, amende: 135, amende_max: 375, points: 0, tribunal: false, suspension: false, note: 'Le conducteur est responsable si passager mineur.' },
    { id: 'feu_rouge', label: 'Refus de priorité / passage au feu rouge', amende_min: 90, amende: 135, amende_max: 375, points: 4, tribunal: false, suspension: false },
    { id: 'arret_stop', label: 'Non-respect d\'un stop', amende_min: 90, amende: 135, amende_max: 375, points: 4, tribunal: false, suspension: false },
    { id: 'demi_tour_autoroute', label: 'Demi-tour ou marche arrière sur autoroute', amende: 135, amende_max: 375, points: 3, tribunal: false, suspension: false },
    { id: 'depassement_dangereux', label: 'Dépassement dangereux (ligne continue / double file)', amende_min: 90, amende: 135, amende_max: 375, points: 3, tribunal: false, suspension: false },
    { id: 'conduite_contresens', label: 'Conduite à contresens (autoroute)', amende: 3750, points: 3, tribunal: true, suspension: true, note: 'Délit pénal. Annulation possible.' },
    { id: 'casque_moto', label: 'Défaut de casque (moto/scooter)', amende_min: 90, amende: 135, amende_max: 375, points: 3, tribunal: false, suspension: false },
    { id: 'telephone_kit_mains_libres', label: 'Téléphone avec kit mains-libres (kit bouton)', amende_min: 90, amende: 135, amende_max: 375, points: 3, tribunal: false, suspension: false, note: 'Seuls le haut-parleur intégré et les oreillettes Bluetooth sont autorisés.' },
    { id: 'non_eclairage_nuit', label: 'Défaut d\'éclairage de nuit / brouillard', amende_min: 11, amende: 35, amende_max: 75, points: 0, tribunal: false, suspension: false },
  ],
  BE: [
    { id: 'telephone', label: 'Téléphone tenu en main au volant', amende: 174, points: 2, tribunal: false, suspension: false },
    { id: 'ceinture_conducteur', label: 'Ceinture non bouclée (conducteur)', amende: 174, points: 2, tribunal: false, suspension: false },
    { id: 'feu_rouge', label: 'Passage au feu rouge', amende: 174, points: 4, tribunal: false, suspension: false },
    { id: 'arret_stop', label: 'Non-respect d\'un stop', amende: 174, points: 2, tribunal: false, suspension: false },
    { id: 'casque_moto', label: 'Défaut de casque', amende: 174, points: 2, tribunal: false, suspension: false },
  ],
  CH: [
    { id: 'telephone', label: 'Téléphone tenu en main', amende: 100, points: 0, tribunal: false, suspension: false, note: 'CHF 100 fixes. Kit mains-libres obligatoire.' },
    { id: 'ceinture_conducteur', label: 'Ceinture non bouclée (conducteur)', amende: 60, points: 0, tribunal: false, suspension: false },
    { id: 'feu_rouge', label: 'Passage au feu rouge', amende: 250, amende_max: 10000, points: 0, tribunal: false, suspension: true, note: 'Retrait de permis probable.' },
    { id: 'casque_moto', label: 'Défaut de casque', amende: 40, points: 0, tribunal: false, suspension: false },
  ],
  'CA-QC': [
    { id: 'telephone', label: 'Téléphone / appareil tenu en main', amende: 300, amende_max: 600, points: 5, tribunal: false, suspension: false },
    { id: 'ceinture_conducteur', label: 'Ceinture non bouclée (conducteur)', amende: 200, amende_max: 300, points: 3, tribunal: false, suspension: false },
    { id: 'feu_rouge', label: 'Refus de céder le passage / feu rouge', amende: 200, amende_max: 300, points: 4, tribunal: false, suspension: false },
    { id: 'casque_moto', label: 'Défaut de casque homologué (moto)', amende: 200, amende_max: 300, points: 0, tribunal: false, suspension: false },
  ],
  DE: [
    { id: 'telephone', label: 'Téléphone tenu en main', amende: 100, points: 1, tribunal: false, suspension: false },
    { id: 'ceinture_conducteur', label: 'Ceinture non bouclée', amende: 30, points: 0, tribunal: false, suspension: false },
    { id: 'feu_rouge', label: 'Passage au feu rouge (< 1s)', amende: 90, points: 1, tribunal: false, suspension: false },
    { id: 'feu_rouge_long', label: 'Passage au feu rouge (> 1s)', amende: 240, points: 2, tribunal: false, suspension: true, note: '1 mois d\'interdiction de conduire.' },
    { id: 'casque_moto', label: 'Défaut de casque (moto)', amende: 15, points: 0, tribunal: false, suspension: false },
  ],
  ES: [
    { id: 'telephone', label: 'Téléphone tenu en main', amende: 200, points: 3, tribunal: false, suspension: false },
    { id: 'ceinture_conducteur', label: 'Ceinture non bouclée', amende: 200, points: 3, tribunal: false, suspension: false },
    { id: 'feu_rouge', label: 'Passage au feu rouge', amende: 200, points: 6, tribunal: false, suspension: true },
    { id: 'casque_moto', label: 'Défaut de casque', amende: 200, points: 3, tribunal: false, suspension: false },
  ],
  IT: [
    { id: 'telephone', label: 'Téléphone tenu en main', amende_min: 165, amende: 661, points: 5, tribunal: false, suspension: false, note: 'En récidive dans les 2 ans : suspension 5-10 jours.' },
    { id: 'ceinture_conducteur', label: 'Ceinture non bouclée', amende_min: 83, amende: 333, points: 5, tribunal: false, suspension: false },
    { id: 'feu_rouge', label: 'Passage au feu rouge', amende_min: 167, amende: 667, points: 6, tribunal: false, suspension: true },
    { id: 'casque_moto', label: 'Défaut de casque', amende_min: 83, amende: 333, points: 5, tribunal: false, suspension: false },
  ],
  NL: [
    { id: 'telephone', label: 'Téléphone tenu en main', amende: 420, points: 0, tribunal: false, suspension: false },
    { id: 'ceinture_conducteur', label: 'Ceinture non bouclée', amende: 180, points: 0, tribunal: false, suspension: false },
    { id: 'feu_rouge', label: 'Passage au feu rouge', amende: 320, points: 0, tribunal: false, suspension: false },
    { id: 'casque_moto', label: 'Défaut de casque', amende: 180, points: 0, tribunal: false, suspension: false },
  ],
  GB: [
    { id: 'telephone', label: 'Téléphone tenu en main', amende: 200, points: 6, tribunal: false, suspension: true, note: 'Permis annulé si < 2 ans de permis.' },
    { id: 'ceinture_conducteur', label: 'Ceinture non bouclée', amende: 100, points: 0, tribunal: false, suspension: false },
    { id: 'feu_rouge', label: 'Passage au feu rouge', amende: 100, points: 3, tribunal: false, suspension: false },
    { id: 'casque_moto', label: 'Défaut de casque', amende: 500, points: 0, tribunal: false, suspension: false },
  ],
  AT: [
    { id: 'telephone', label: 'Téléphone tenu en main', amende: 50, amende_max: 726, points: 0, tribunal: false, suspension: false },
    { id: 'ceinture_conducteur', label: 'Ceinture non bouclée', amende: 35, amende_max: 218, points: 0, tribunal: false, suspension: false },
    { id: 'feu_rouge', label: 'Passage au feu rouge', amende: 70, amende_max: 1000, points: 0, tribunal: false, suspension: false },
    { id: 'casque_moto', label: 'Défaut de casque', amende: 35, amende_max: 218, points: 0, tribunal: false, suspension: false },
  ],
  LU: [
    { id: 'telephone', label: 'Téléphone tenu en main au volant', amende: 145, points: 2, tribunal: false, suspension: false },
    { id: 'ceinture_conducteur', label: 'Ceinture non bouclée', amende: 49, points: 0, tribunal: false, suspension: false },
    { id: 'feu_rouge', label: 'Passage au feu rouge', amende: 145, points: 4, tribunal: false, suspension: false },
    { id: 'casque_moto', label: 'Défaut de casque (moto)', amende: 74, points: 0, tribunal: false, suspension: false },
  ],
  PT: [
    { id: 'telephone', label: 'Téléphone tenu en main', amende_min: 250, amende: 500, points: 3, tribunal: false, suspension: false, note: 'Réduction 50 % si paiement sous 20 jours.' },
    { id: 'ceinture_conducteur', label: 'Ceinture non bouclée', amende_min: 120, amende: 300, points: 2, tribunal: false, suspension: false },
    { id: 'feu_rouge', label: 'Passage au feu rouge', amende_min: 250, amende: 1250, points: 4, tribunal: false, suspension: true },
    { id: 'casque_moto', label: 'Défaut de casque (moto)', amende_min: 120, amende: 600, points: 2, tribunal: false, suspension: false },
  ],
  PL: [
    { id: 'telephone', label: 'Téléphone tenu en main', amende: 500, points: 12, tribunal: false, suspension: false, note: '500 zł + 12 points sur le permis.' },
    { id: 'ceinture_conducteur', label: 'Ceinture non bouclée', amende: 100, points: 5, tribunal: false, suspension: false },
    { id: 'feu_rouge', label: 'Passage au feu rouge', amende: 500, points: 10, tribunal: false, suspension: true },
    { id: 'casque_moto', label: 'Défaut de casque (moto)', amende: 200, points: 5, tribunal: false, suspension: false },
  ],
  HR: [
    { id: 'telephone', label: 'Téléphone tenu en main', amende: 133, points: 0, tribunal: false, suspension: false, note: 'Réduction 50 % si paiement immédiat sur place (< 265 €).' },
    { id: 'ceinture_conducteur', label: 'Ceinture non bouclée', amende: 66, points: 0, tribunal: false, suspension: false },
    { id: 'feu_rouge', label: 'Passage au feu rouge / stop', amende: 133, points: 0, tribunal: false, suspension: false },
    { id: 'casque_moto', label: 'Défaut de casque', amende: 66, points: 0, tribunal: false, suspension: false },
    { id: 'phares_hiver', label: 'Phares non allumés (nov.–mars)', amende: 40, points: 0, tribunal: false, suspension: false, note: 'Feux de croisement obligatoires 24h/24 du 1er nov. au 31 mars.' },
  ],
}

// ─── Stationnement ────────────────────────────────────────────────────────────

export interface InfractionStationnement {
  id: string
  label: string
  amende_min?: number
  amende: number
  amende_max?: number
  points: number
  fourriere: boolean
  note?: string
}

export const BAREME_STATIONNEMENT: Partial<Record<PaysCode, InfractionStationnement[]>> = {
  FR: [
    { id: 'payant_zone1', label: 'Zone payante — Paris / grandes agglomérations (zone 1)', amende: 50, points: 0, fourriere: false, note: 'FPS (Forfait de Post-Stationnement). Résidentiel : 75 €. Défaillant : 100 €.' },
    { id: 'payant_zone2', label: 'Zone payante — villes moyennes (zone 2)', amende: 35, points: 0, fourriere: false },
    { id: 'payant_zone3', label: 'Zone payante — petites villes (zone 3)', amende: 17, points: 0, fourriere: false },
    { id: 'genant', label: 'Stationnement gênant (trottoir, voie cyclable, arrêt de bus)', amende: 135, amende_max: 375, points: 0, fourriere: true, note: 'Immobilisation ou enlèvement possible.' },
    { id: 'dangereux', label: 'Stationnement dangereux / interdit (ligne jaune continue)', amende: 135, amende_max: 375, points: 0, fourriere: true },
    { id: 'handicap', label: 'Sur emplacement réservé PMR (handicapés)', amende: 135, amende_max: 375, points: 0, fourriere: true },
  ],
  BE: [
    { id: 'payant', label: 'Zone payante sans paiement', amende: 58, points: 0, fourriere: false },
    { id: 'genant', label: 'Stationnement gênant', amende: 116, points: 0, fourriere: true },
    { id: 'handicap', label: 'Sur emplacement PMR', amende: 348, points: 0, fourriere: true },
  ],
  CH: [
    { id: 'payant', label: 'Zone bleue / payante sans disque', amende: 40, points: 0, fourriere: false },
    { id: 'genant', label: 'Stationnement gênant / interdit', amende: 100, amende_max: 400, points: 0, fourriere: true },
    { id: 'handicap', label: 'Emplacement handicapé sans vignette', amende: 200, points: 0, fourriere: true },
  ],
  'CA-QC': [
    { id: 'payant', label: 'Parcmètre non payé / dépassement', amende: 52, amende_max: 119, points: 0, fourriere: false },
    { id: 'genant', label: 'Stationnement interdit / gênant', amende: 85, amende_max: 200, points: 0, fourriere: true },
    { id: 'handicap', label: 'Espace réservé handicapé', amende: 235, amende_max: 535, points: 0, fourriere: true },
  ],
  DE: [
    { id: 'payant', label: 'Zone payante sans paiement', amende: 10, amende_max: 25, points: 0, fourriere: false },
    { id: 'genant', label: 'Stationnement gênant / trottoir', amende: 55, amende_max: 100, points: 0, fourriere: true },
    { id: 'handicap', label: 'Emplacement handicapé', amende: 35, amende_max: 70, points: 1, fourriere: true },
  ],
  ES: [
    { id: 'payant', label: 'Zone ORA non payée', amende: 80, amende_max: 200, points: 0, fourriere: false },
    { id: 'genant', label: 'Stationnement interdit / gênant', amende: 200, points: 0, fourriere: true },
    { id: 'handicap', label: 'Emplacement handicapé', amende: 200, points: 0, fourriere: true },
  ],
  IT: [
    { id: 'payant', label: 'Zone bleue sans ticket', amende_min: 25, amende: 87, points: 0, fourriere: false },
    { id: 'genant', label: 'Double file / stationnement gênant', amende_min: 42, amende: 173, points: 0, fourriere: true },
    { id: 'ztl', label: 'Entrée ZTL sans autorisation', amende_min: 83, amende: 332, points: 0, fourriere: false, note: 'Amendes automatiques par caméras. Plusieurs amendes si passage par plusieurs cameras.' },
    { id: 'handicap', label: 'Emplacement handicapé', amende_min: 84, amende: 335, points: 0, fourriere: true },
  ],
  NL: [
    { id: 'payant', label: 'Zone payante sans paiement', amende: 70, amende_max: 180, points: 0, fourriere: false },
    { id: 'genant', label: 'Stationnement gênant', amende: 100, amende_max: 380, points: 0, fourriere: true },
    { id: 'handicap', label: 'Emplacement handicapé', amende: 380, points: 0, fourriere: true },
  ],
  GB: [
    { id: 'payant', label: 'Zone payante sans paiement (PCN)', amende: 70, amende_max: 130, points: 0, fourriere: false, note: 'Réduction 50 % si paiement sous 14 jours.' },
    { id: 'genant', label: 'Lignes jaunes / stationnement interdit', amende: 130, points: 0, fourriere: true },
    { id: 'handicap', label: 'Emplacement handicapé (Blue Badge)', amende: 130, points: 0, fourriere: true },
  ],
  AT: [
    { id: 'payant', label: 'Zone payante sans ticket', amende: 22, amende_max: 72, points: 0, fourriere: false },
    { id: 'genant', label: 'Stationnement interdit', amende: 50, amende_max: 218, points: 0, fourriere: true },
    { id: 'handicap', label: 'Emplacement handicapé', amende: 72, amende_max: 218, points: 0, fourriere: true },
  ],
  LU: [
    { id: 'payant', label: 'Zone bleue / payante sans paiement', amende: 49, points: 0, fourriere: false },
    { id: 'genant', label: 'Stationnement interdit / gênant', amende: 74, amende_max: 145, points: 0, fourriere: true },
    { id: 'handicap', label: 'Emplacement réservé PMR', amende: 145, points: 0, fourriere: true },
  ],
  PT: [
    { id: 'payant', label: 'Zone bleue non payée', amende_min: 30, amende: 150, points: 0, fourriere: false },
    { id: 'genant', label: 'Stationnement interdit / gênant', amende_min: 60, amende: 300, points: 0, fourriere: true },
    { id: 'handicap', label: 'Emplacement réservé handicapé', amende_min: 120, amende: 600, points: 0, fourriere: true },
  ],
  PL: [
    { id: 'payant', label: 'Zone payante sans paiement', amende: 100, amende_max: 300, points: 0, fourriere: false },
    { id: 'genant', label: 'Stationnement interdit / gênant', amende: 200, amende_max: 500, points: 0, fourriere: true },
    { id: 'handicap', label: 'Emplacement réservé handicapé', amende: 500, amende_max: 800, points: 0, fourriere: true },
  ],
  HR: [
    { id: 'payant', label: 'Zone bleue / payante sans paiement', amende: 40, amende_max: 133, points: 0, fourriere: false, note: 'Paiement via app PayDo ou SMS dans les grandes villes.' },
    { id: 'genant', label: 'Stationnement interdit / gênant', amende: 66, amende_max: 133, points: 0, fourriere: true },
    { id: 'handicap', label: 'Emplacement réservé handicapé', amende: 133, points: 0, fourriere: true },
  ],
}

// ─── ZFE / Crit'Air ───────────────────────────────────────────────────────────

export interface InfractionZFE {
  id: string
  label: string
  amende_min?: number
  amende: number
  amende_max?: number
  points: number
  note?: string
}

export const BAREME_ZFE: Partial<Record<PaysCode, InfractionZFE[]>> = {
  FR: [
    { id: 'absent_vignette_vp', label: 'Absence de vignette Crit\'Air (VP/VUL)', amende: 135, amende_max: 375, points: 0, note: 'Obligatoire pour circuler en ZFE (Paris, Lyon, Grenoble, Strasbourg, Marseille…).' },
    { id: 'absent_vignette_moto', label: 'Absence de vignette Crit\'Air (moto/cyclomoteur)', amende: 68, amende_max: 375, points: 0 },
    { id: 'absent_vignette_pl', label: 'Absence de vignette Crit\'Air (PL/autocar)', amende: 450, amende_max: 750, points: 0 },
    { id: 'non_respect_restriction_vp', label: 'Non-respect restriction ZFE — VP/VUL (mauvaise classe Crit\'Air)', amende: 135, amende_max: 375, points: 0, note: 'Vérifiez la carte ZFE de votre ville : les classes autorisées varient.' },
    { id: 'non_respect_restriction_pl', label: 'Non-respect restriction ZFE — PL/autocar', amende: 450, amende_max: 750, points: 0 },
    { id: 'malvaise_vignette', label: 'Vignette illisible / non conforme', amende: 68, points: 0 },
  ],
  BE: [
    { id: 'lez_bruxelles', label: 'Entrée LEZ Bruxelles sans autorisation', amende: 350, points: 0, note: 'LEZ active depuis 2018. Vignette électronique. Véhicules Diesel Euro 0-4 et Essence Euro 0-2 interdits.' },
    { id: 'lez_anvers', label: 'Entrée LEZ Anvers sans autorisation', amende: 350, points: 0, note: 'Similaire Bruxelles. Scooters 2-T inclus.' },
    { id: 'lez_gand', label: 'Entrée LEZ Gand sans autorisation', amende: 350, points: 0 },
  ],
  DE: [
    { id: 'umweltzone', label: 'Entrée Umweltzone sans vignette verte', amende: 80, points: 1, note: 'Vignette verte (Umweltplakette) obligatoire dans toutes les grandes villes. Achetable en Allemagne chez TÜV/DEKRA.' },
  ],
  IT: [
    { id: 'ztl_touriste', label: 'Entrée ZTL sans autorisation (touriste)', amende_min: 83, amende: 332, points: 0, note: 'Caméras automatiques. Amendes envoyées à domicile plusieurs semaines plus tard.' },
    { id: 'area_b_milan', label: 'Area B Milan — véhicule diesel Euro 0-5 sans dérogation', amende_min: 83, amende: 332, points: 0 },
  ],
  NL: [
    { id: 'milieuborden', label: 'Zone ZE obligatoire (milieuborden) — diesel pré-Euro 6', amende: 100, amende_max: 400, points: 0, note: 'Plusieurs villes NL (Amsterdam, Utrecht, Rotterdam) mettent en place des zones zéro émission à partir de 2025.' },
  ],
  GB: [
    { id: 'ulez_london', label: 'ULEZ Londres — non conforme (< Euro 6 diesel / < Euro 4 essence)', amende: 180, points: 0, note: 'Frais journalier de 12,50 £ en cas de non-conformité ou de non-paiement. Caméras ANPR 24h/24.' },
    { id: 'caz_birmingham', label: 'CAZ Birmingham / Bath — non conforme', amende: 120, points: 0 },
  ],
  PT: [
    { id: 'zef_lisboa', label: "Zone d'émissions faibles Lisbonne — véhicule non conforme", amende_min: 120, amende: 600, points: 0, note: 'ZEF Lisbonne : diesels pré-Euro 5 et essence pré-Euro 4 interdits dans le centre historique.' },
  ],
  PL: [
    { id: 'spw_krakow', label: 'Zone à faibles émissions Cracovie — diesels pré-Euro 4 interdits', amende: 100, amende_max: 500, points: 0, note: "SPW (Strefa Płatnego Parkowania) actif. D\'autres villes polonaises mettent en place des zones similaires." },
  ],
  HR: [
    { id: 'zagreb_restr', label: 'Zone restreinte Zagreb — haute pollution (diesels anciens)', amende: 66, amende_max: 133, points: 0, note: 'Restrictions temporaires lors des pics de pollution. Vérifier les annonces locales.' },
  ],
}

// ─── Alcool ──────────────────────────────────────────────────────────────────

export interface TrancheAlcool {
  taux_min: number    // g/L sang
  taux_max: number    // g/L sang (Infinity = délimitation haute)
  label: string
  amende_min?: number
  amende: number
  amende_max?: number
  points: number
  tribunal: boolean
  suspension: boolean
  note?: string
}

export const BAREME_ALCOOL: Partial<Record<PaysCode, TrancheAlcool[]>> = {
  FR: [
    { taux_min: 0.2, taux_max: 0.5, label: 'Taux entre 0,20 et 0,49 g/L (jeune conducteur uniquement)', amende_min: 90, amende: 135, amende_max: 375, points: 6, tribunal: false, suspension: false, note: 'Seuil abaissé à 0,2 g/L pour les détenteurs du permis probatoire (< 3 ans).' },
    { taux_min: 0.5, taux_max: 0.8, label: 'Taux entre 0,50 et 0,79 g/L (contravention 4ème classe)', amende_min: 90, amende: 135, amende_max: 750, points: 6, tribunal: false, suspension: false, note: '0,25 à 0,39 mg/L en air expiré.' },
    { taux_min: 0.8, taux_max: Infinity, label: 'Taux ≥ 0,80 g/L (délit)', amende: 4500, amende_max: 4500, points: 6, tribunal: true, suspension: true, note: '0,40 mg/L en air expiré. Jusqu\'à 2 ans d\'emprisonnement. Annulation de permis en récidive.' },
  ],
  BE: [
    { taux_min: 0.1, taux_max: 0.5, label: 'Taux entre 0,10 et 0,49 g/L (jeune conducteur)', amende: 174, points: 2, tribunal: false, suspension: false, note: 'Seuil à 0,1 g/L pendant les 2 premières années de permis.' },
    { taux_min: 0.5, taux_max: 0.8, label: 'Taux entre 0,50 et 0,79 g/L', amende: 174, points: 2, tribunal: false, suspension: false },
    { taux_min: 0.8, taux_max: 1.5, label: 'Taux entre 0,80 et 1,49 g/L', amende: 1600, amende_max: 16000, points: 4, tribunal: true, suspension: true },
    { taux_min: 1.5, taux_max: Infinity, label: 'Taux ≥ 1,50 g/L', amende: 2400, amende_max: 24000, points: 6, tribunal: true, suspension: true, note: 'Immobilisation du véhicule. Retrait de permis probable.' },
  ],
  CH: [
    { taux_min: 0.1, taux_max: 0.5, label: 'Taux entre 0,10 et 0,49 g/L (jeune/pro)', amende: 100, points: 0, tribunal: false, suspension: true, note: 'Seuil à 0,1 g/L pour permis probatoire, chauffeurs pros. Avertissement ou retrait de permis 1 mois.' },
    { taux_min: 0.5, taux_max: 0.8, label: 'Taux entre 0,50 et 0,79 g/L', amende: 700, points: 0, tribunal: false, suspension: true, note: 'Retrait de permis 1 à 3 mois.' },
    { taux_min: 0.8, taux_max: Infinity, label: 'Taux ≥ 0,80 g/L', amende: 1000, amende_max: 10000, points: 0, tribunal: true, suspension: true, note: 'Ordonnance pénale. Retrait min. 3 mois. Récidive : retrait définitif.' },
  ],
  'CA-QC': [
    { taux_min: 0.05, taux_max: 0.08, label: 'Taux entre 50 et 79 mg/100 ml (avertissement)', amende: 0, points: 0, tribunal: false, suspension: true, note: 'Suspension du permis sur-le-champ (24h ou 3 jours en récidive). Aucune amende d\'infraction criminelle.' },
    { taux_min: 0.08, taux_max: Infinity, label: 'Taux ≥ 80 mg/100 ml (infraction criminelle)', amende: 1000, amende_max: 10000, points: 0, tribunal: true, suspension: true, note: 'Casier judiciaire. Interdiction de conduire 1 à 3 ans. Première offense min. 1000$ CA.' },
  ],
  DE: [
    { taux_min: 0.2, taux_max: 0.5, label: 'Taux 0,20–0,49 g/L (jeune / récidive)', amende: 500, points: 0, tribunal: false, suspension: false, note: 'Seuil à 0,2 g/L pour moins de 21 ans ou probatoire.' },
    { taux_min: 0.5, taux_max: 0.8, label: 'Taux 0,50–0,79 g/L', amende: 500, points: 2, tribunal: false, suspension: true, note: '1 mois d\'interdiction.' },
    { taux_min: 0.8, taux_max: 1.6, label: 'Taux 0,80–1,59 g/L', amende: 1500, points: 2, tribunal: true, suspension: true },
    { taux_min: 1.6, taux_max: Infinity, label: 'Taux ≥ 1,60 g/L', amende: 3000, amende_max: 30000, points: 3, tribunal: true, suspension: true, note: 'Expertise psychiatrique (MPU) obligatoire avant récupération du permis.' },
  ],
  ES: [
    { taux_min: 0.15, taux_max: 0.5, label: 'Taux 0,15–0,49 g/L (jeune / pro)', amende: 500, points: 4, tribunal: false, suspension: false, note: 'Seuil 0,15 g/L pour professionnels et permis probatoire.' },
    { taux_min: 0.5, taux_max: 0.8, label: 'Taux 0,50–0,79 g/L', amende: 500, points: 4, tribunal: false, suspension: false },
    { taux_min: 0.8, taux_max: 1.2, label: 'Taux 0,80–1,19 g/L', amende: 1000, points: 6, tribunal: false, suspension: true },
    { taux_min: 1.2, taux_max: Infinity, label: 'Taux ≥ 1,20 g/L', amende: 1000, amende_max: 30000, points: 6, tribunal: true, suspension: true, note: 'Délit pénal. Prison possible.' },
  ],
  IT: [
    { taux_min: 0.5, taux_max: 0.8, label: 'Taux 0,50–0,79 g/L', amende_min: 543, amende: 2170, points: 10, tribunal: false, suspension: true, note: 'Suspension 3-6 mois.' },
    { taux_min: 0.8, taux_max: 1.5, label: 'Taux 0,80–1,49 g/L', amende_min: 800, amende: 3200, points: 10, tribunal: true, suspension: true, note: 'Suspension 6-12 mois.' },
    { taux_min: 1.5, taux_max: Infinity, label: 'Taux ≥ 1,50 g/L', amende_min: 1500, amende: 6000, points: 10, tribunal: true, suspension: true, note: 'Suspension 1-2 ans. Prison possible.' },
  ],
  NL: [
    { taux_min: 0.2, taux_max: 0.5, label: 'Taux 0,20–0,49 g/L (jeune)', amende: 325, points: 0, tribunal: false, suspension: false, note: '0,2 g/L pour moins de 24 ans ou < 5 ans de permis.' },
    { taux_min: 0.5, taux_max: 0.8, label: 'Taux 0,50–0,79 g/L', amende: 325, points: 0, tribunal: false, suspension: false },
    { taux_min: 0.8, taux_max: Infinity, label: 'Taux ≥ 0,80 g/L', amende: 325, amende_max: 16000, points: 0, tribunal: true, suspension: true, note: 'Amende basée sur le revenu pour taux élevés.' },
  ],
  GB: [
    { taux_min: 0.35, taux_max: 0.5, label: 'Taux 35–49 μg/100 ml air expiré (avertissement)', amende: 2500, points: 3, tribunal: true, suspension: true, note: 'En Angleterre/Pays de Galles. Seuil légal = 35 μg/100 ml. En Écosse : 22 μg/100 ml.' },
    { taux_min: 0.5, taux_max: Infinity, label: 'Taux ≥ 50 μg/100 ml (excès)', amende: 2500, amende_max: 5000, points: 10, tribunal: true, suspension: true },
  ],
  AT: [
    { taux_min: 0.1, taux_max: 0.5, label: 'Taux 0,10–0,49 g/L (jeune / pro)', amende: 300, points: 0, tribunal: false, suspension: false, note: 'Seuil 0,1 g/L pour moins de 20 ans.' },
    { taux_min: 0.5, taux_max: 0.8, label: 'Taux 0,50–0,79 g/L', amende: 800, points: 0, tribunal: false, suspension: true },
    { taux_min: 0.8, taux_max: 1.2, label: 'Taux 0,80–1,19 g/L', amende: 1600, points: 0, tribunal: true, suspension: true },
    { taux_min: 1.2, taux_max: Infinity, label: 'Taux ≥ 1,20 g/L', amende: 3700, amende_max: 5900, points: 0, tribunal: true, suspension: true },
  ],
  LU: [
    { taux_min: 0.2, taux_max: 0.5, label: 'Taux 0,20–0,49 g/L (jeune / récidive)', amende: 145, points: 2, tribunal: false, suspension: false, note: 'Seuil 0,2 g/L pour permis < 2 ans.' },
    { taux_min: 0.5, taux_max: 0.8, label: 'Taux 0,50–0,79 g/L', amende: 500, points: 4, tribunal: false, suspension: true, note: 'Suspension de permis possible.' },
    { taux_min: 0.8, taux_max: Infinity, label: 'Taux ≥ 0,80 g/L', amende: 1000, amende_max: 10000, points: 6, tribunal: true, suspension: true },
  ],
  PT: [
    { taux_min: 0.2, taux_max: 0.5, label: 'Taux 0,20–0,49 g/L (jeune / pro)', amende_min: 250, amende: 1250, points: 3, tribunal: false, suspension: false, note: 'Seuil 0,2 g/L pour permis < 3 ans et conducteurs professionnels.' },
    { taux_min: 0.5, taux_max: 1.2, label: 'Taux 0,50–1,19 g/L', amende_min: 250, amende: 1250, points: 3, tribunal: false, suspension: true, note: 'Suspension 1–12 mois.' },
    { taux_min: 1.2, taux_max: Infinity, label: 'Taux ≥ 1,20 g/L', amende_min: 500, amende: 2500, points: 6, tribunal: true, suspension: true, note: 'Suspension 2–24 mois. Peines pénales.' },
  ],
  PL: [
    { taux_min: 0.2, taux_max: 0.5, label: 'Taux 0,20–0,49 g/L (sobriété diminuée)', amende: 500, amende_max: 5000, points: 0, tribunal: false, suspension: true, note: 'Suspension du permis 6 mois – 3 ans. Arrestation possible.' },
    { taux_min: 0.5, taux_max: Infinity, label: "Taux ≥ 0,50 g/L (état d\'ivresse — délit pénal)", amende: 5000, amende_max: 30000, points: 0, tribunal: true, suspension: true, note: 'Casier judiciaire. Interdiction de conduire 1–15 ans. Prison possible.' },
  ],
  HR: [
    { taux_min: 0.0, taux_max: 0.5, label: 'Taux 0,01–0,49 g/L (< 24 ans ou professionnel)', amende: 133, amende_max: 265, points: 0, tribunal: false, suspension: true, note: 'Tolérance zéro pour moins de 24 ans et conducteurs professionnels.' },
    { taux_min: 0.5, taux_max: 1.0, label: 'Taux 0,50–0,99 g/L', amende: 133, amende_max: 265, points: 0, tribunal: false, suspension: true },
    { taux_min: 1.0, taux_max: Infinity, label: 'Taux ≥ 1,00 g/L', amende: 664, amende_max: 1992, points: 0, tribunal: true, suspension: true, note: 'Retrait de permis. Peines pénales.' },
  ],
}

// ─── Stupéfiants ──────────────────────────────────────────────────────────────

export interface SanctionstupefiantsPV {
  amende: number
  amende_max?: number
  points: number
  tribunal: boolean
  suspension: boolean
  emprisonnement_max?: string
  note?: string
}

export const BAREME_STUPEFIANTS: Partial<Record<PaysCode, SanctionstupefiantsPV>> = {
  FR: {
    amende: 4500, amende_max: 9000, points: 6, tribunal: true, suspension: true,
    emprisonnement_max: '2 ans (seul) / 3 ans (avec alcool ≥ 0,5 g/L)',
    note: "Délit pénal dès le premier usage. Confiscation du véhicule possible. Test salivaire en bord de route. Association stupefiants + alcool ≥ 0,5 g/L : jusqu\'à 9 000 € et 3 ans.",
  },
  BE: {
    amende: 8000, amende_max: 80000, points: 6, tribunal: true, suspension: true,
    emprisonnement_max: '5 ans',
    note: 'Infraction pénale systématique. Retrait immédiat de permis fréquent. Test salivaire légal depuis 2010.',
  },
  CH: {
    amende: 500, amende_max: 20000, points: 0, tribunal: true, suspension: true,
    emprisonnement_max: '3 ans',
    note: 'Ordonnance pénale ou tribunal selon les faits. Retrait de permis min. 1 mois, souvent plus long. Tests salivaires + prise de sang.',
  },
  'CA-QC': {
    amende: 1000, amende_max: 15000, points: 0, tribunal: true, suspension: true,
    emprisonnement_max: '18 mois (résumé) / 10 ans (mise en accusation)',
    note: 'Infraction au Code criminel. Cannabis légal à la consommation mais tolérance zéro au volant. THC ≥ 2 ng/mL : infraction. Suspension immédiate du permis.',
  },
  DE: {
    amende: 500, amende_max: 3000, points: 0, tribunal: true, suspension: true,
    emprisonnement_max: '1 an',
    note: 'Zero tolérance en Allemagne. THC ≥ 1 ng/mL plasma = infraction. Cannabis légalisé pour usage récréatif depuis 2024 mais conduite strictement interdite sous influence.',
  },
  ES: {
    amende: 1000, amende_max: 30000, points: 6, tribunal: true, suspension: true,
    emprisonnement_max: '2 ans',
    note: 'Tolérance zéro. Confiscation du véhicule possible.',
  },
  IT: {
    amende: 1500, amende_max: 6000, points: 10, tribunal: true, suspension: true,
    emprisonnement_max: '1 an',
    note: 'Suspension permis 1 à 2 ans. Prise de sang obligatoire si test positif.',
  },
  NL: {
    amende: 800, amende_max: 16000, points: 0, tribunal: true, suspension: true,
    emprisonnement_max: '3 mois (simple) / 3 ans (grave)',
    note: 'Tolérance zéro malgré légalisation du cannabis aux Pays-Bas. Test salivaire + prise de sang.',
  },
  GB: {
    amende: 2500, amende_max: 5000, points: 11, tribunal: true, suspension: true,
    emprisonnement_max: '6 mois',
    note: 'Drug Driving offence. Permis suspendu minimum 1 an. Casier judiciaire. Limites légales : Cannabis 2 μg/L sang, Cocaïne 10 μg/L, etc.',
  },
  AT: {
    amende: 800, amende_max: 5900, points: 0, tribunal: true, suspension: true,
    emprisonnement_max: '1 an',
    note: 'Tolérance zéro. Retrait de permis immédiat si test positif.',
  },
  LU: {
    amende: 500, amende_max: 10000, points: 6, tribunal: true, suspension: true,
    emprisonnement_max: '2 ans',
    note: 'Tolérance zéro. Retrait de permis immédiat. Prise de sang systématique.',
  },
  PT: {
    amende: 1000, amende_max: 3740, points: 6, tribunal: true, suspension: true,
    emprisonnement_max: '1 an',
    note: 'Tolérance zéro. Suspension 2–24 mois. Tests salivaires utilisés par la GNR et la PSP.',
  },
  PL: {
    amende: 2500, amende_max: 30000, points: 0, tribunal: true, suspension: true,
    emprisonnement_max: '3 ans',
    note: "Délit pénal. Interdiction de conduire 1–15 ans. Véhicule pouvant être confisqué.",
  },
  HR: {
    amende: 664, amende_max: 1992, points: 0, tribunal: true, suspension: true,
    emprisonnement_max: '1 an',
    note: 'Tolérance zéro. Retrait de permis. Tests salivaires + prise de sang obligatoire.',
  },
}

// ─── Fonctions calculateur ────────────────────────────────────────────────────

export function getTranche(bareme: TrancheVitesse[], depassement: number): TrancheVitesse | null {
  return bareme.find(t => depassement >= t.dep_min && depassement <= t.dep_max) ?? null
}

export function calculerVitesse(
  pays: PaysCode,
  voie: TypeVoie,
  depassement: number,
): ResultatPV | null {
  const b = BAREME_VITESSE[pays]
  if (!b) return null
  const voieData = b[voie]
  const tranche = getTranche(voieData.tranches, depassement)
  if (!tranche) return null
  const p = PAYS[pays]
  return {
    pays,
    type: 'vitesse',
    amende_minoree: tranche.amende_min,
    amende_forfaitaire: tranche.amende,
    amende_majoree: tranche.amende_max,
    points_retires: tranche.points,
    devise: p.devise,
    symbole: p.symbole,
    risque_tribunal: tranche.tribunal,
    risque_suspension: tranche.suspension,
    risque_immobilisation: false,
    risque_confiscation: false,
    delai_paiement_minore: pays === 'FR' ? 15 : undefined,
    delai_contestation: pays === 'FR' ? 45 : pays === 'GB' ? 28 : undefined,
    conseils: buildConseilsVitesse(pays, depassement, tranche),
    sources: getSourcesVitesse(pays),
  }
}

function buildConseilsVitesse(pays: PaysCode, dep: number, t: TrancheVitesse): string[] {
  const conseils: string[] = []
  if (pays === 'FR') {
    if (t.amende_min) conseils.push(`Payez dans les 15 jours : amende réduite à ${t.amende_min} €.`)
    if (dep >= 50) conseils.push('Infraction de 5ème classe : saisine du tribunal. Faites-vous assister d\'un avocat.')
    if (dep >= 20 && dep < 50) conseils.push('Stage de sensibilisation à la sécurité routière : récupérez jusqu\'à 4 points.')
    if (dep < 50) conseils.push('Conservez la preuve de paiement. Vous pouvez contester dans les 45 jours.')
  } else if (pays === 'CH') {
    if (dep >= 25) conseils.push('« Raserei » (conduite grave) : retrait de permis minimum 2 ans. Consultez immédiatement un avocat suisse.')
    conseils.push('En Suisse, les amendes d\'ordre (OPO) n\'exigent pas de papiers — mais la police peut photographier.')
  } else if (pays === 'CA-QC') {
    if (dep >= 46) conseils.push('Suspension du permis sur-le-champ possible. Contactez le SAAQ.')
    conseils.push('Les frais administratifs SAAQ s\'ajoutent à l\'amende de base.')
  } else if (pays === 'BE') {
    if (t.tribunal) conseils.push('Convocation au tribunal correctionnel probable. Assistance juridique recommandée.')
    conseils.push('Le système de points belge (depuis mars 2023) peut entraîner des cours de récupération obligatoires.')
  }
  if (t.note) conseils.push(t.note)
  return conseils
}

function getSourcesVitesse(pays: PaysCode): string[] {
  const sources: Record<PaysCode, string> = {
    FR: 'Code de la route art. R413-14 — Légifrance',
    BE: 'SPF Mobilité et Transports — Perceptions immédiates 2025',
    CH: 'OPO (RS 741.031) + jurisprudence Tribunal fédéral',
    'CA-QC': 'Code de la sécurité routière — SAAQ Québec',
    DE: 'BKatV (Bußgeldkatalog 2024) — BMVI',
    ES: 'RD 1428/2003 — DGT 2024',
    IT: 'Codice della Strada — MIT 2024',
    NL: 'Wet administratiefrechtelijke handhaving verkeersvoorschriften (WAHV)',
    GB: 'Road Traffic Offenders Act 1988 — Fixed Penalty Notice',
    AT: 'FSG (Führerscheingesetz) + STVO AT 2024',
    LU: 'Code de la route luxembourgeois — Administration des Ponts et Chaussées 2025',
    PT: 'Código da Estrada — ANSR (Autoridade Nacional de Segurança Rodoviária) 2025',
    PL: 'Taryfikator mandatów karnych 2026 — Ministerstwo Sprawiedliwości PL',
    HR: 'Zakon o sigurnosti prometa na cestama (ZSPC) — MUP Hrvatska 2025',
  }
  return [sources[pays]]
}
