/**
 * Moteurs.com — Configuration des 15 routes SEO dynamiques
 * Source : tableau Oliver "outil SEO trajets" (mai 2026).
 *
 * Chaque route est rendue en SSG sur /trajet/[slug] avec des variantes
 * SSG dédiées (/trajet/[slug]/[variante]) pour maximiser la couverture
 * SEO longue traîne.
 */

import type { Route } from '@/lib/trajet'

export type PaysCode = 'FR' | 'BE' | 'NL' | 'DE' | 'IT' | 'ES' | 'PT' | 'CH' | 'AT' | 'SI' | 'HR' | 'GR' | 'DK' | 'SE' | 'NO'
export type Difficulte = 'Faible' | 'Moyenne' | 'Élevée'

export interface VilleOrigine {
  ville: string
  pays: PaysCode
  lat: number
  lon: number
}

export interface TrajetSEO {
  /** URL slug — /trajet/[slug] */
  slug: string
  /** H1 / titre principal (sans année — l'année est ajoutée à l'affichage) */
  titre_court: string
  /** Origine principale (ville par défaut) */
  origine: VilleOrigine
  /** Destination */
  destination: VilleOrigine
  /** Pays traversés (codes ISO) — utilisé pour le bloc légal */
  pays_traverses: PaysCode[]
  /** Distance approximative en km (utilisée pour SSG, surchargée par ORS si dispo) */
  distance_km: number
  /** Durée de base en minutes (sans recharge VE) */
  duree_base_min: number
  /** Péages estimés (aller simple, tarif standard 2026, hors vignettes) */
  peages_eur: number
  /** Émoji / image décorative */
  emoji: string
  /** Région touristique du voyage */
  region: string
  /** Intention de recherche principale */
  intention: string
  /** Difficulté SEO (du tableau initial) */
  difficulte: Difficulte
  /** Villes alternatives de départ — chacune génère une variante /trajet/[slug]/depuis-[ville] */
  villes_depart_alt: VilleOrigine[]
  /** Variantes "thématiques" applicables à cette route */
  variantes_thematiques: VarianteThematique[]
  /** Catégories de monétisation utiles pour cette route */
  monetisation: string[]
}

export type VarianteThematique =
  | 'electrique'
  | 'sans-peage'
  | 'famille'
  | 'camping-car'
  | 'le-moins-cher'

export const VARIANTES_LABELS: Record<VarianteThematique, { label: string; emoji: string; intent: string }> = {
  'electrique':    { label: 'en voiture électrique', emoji: '⚡', intent: 'véhicules zéro émission, recharge sur autoroute' },
  'sans-peage':    { label: 'sans péage',            emoji: '🚧', intent: 'itinéraires gratuits, nationales et départementales' },
  'famille':       { label: 'en famille',            emoji: '👨‍👩‍👧', intent: 'pauses enfants, sécurité, durée raisonnable' },
  'camping-car':   { label: 'en camping-car',        emoji: '🚐', intent: 'aires de stationnement, hauteur tunnels, vignettes spécifiques' },
  'le-moins-cher': { label: 'le moins cher',         emoji: '💰', intent: 'optimiser le budget total carburant + péages + nuits' },
}

// ─── Les 15 routes SEO ────────────────────────────────────────────────────────

export const TRAJETS_SEO: TrajetSEO[] = [
  // 1
  {
    slug: 'belgique-cote-azur',
    titre_court: 'Belgique → Côte d\'Azur',
    origine:     { ville: 'Bruxelles', pays: 'BE', lat: 50.8503, lon: 4.3517 },
    destination: { ville: 'Nice',      pays: 'FR', lat: 43.7102, lon: 7.2620 },
    pays_traverses: ['BE', 'FR'],
    distance_km: 1250,
    duree_base_min: 720,
    peages_eur: 95,
    emoji: '🏖️',
    region: 'Méditerranée',
    intention: 'Trajet, péages, pauses, recharge VE, trafic estival',
    difficulte: 'Élevée',
    villes_depart_alt: [
      { ville: 'Anvers',  pays: 'BE', lat: 51.2194, lon: 4.4025 },
      { ville: 'Liège',   pays: 'BE', lat: 50.6326, lon: 5.5797 },
      { ville: 'Charleroi', pays: 'BE', lat: 50.4108, lon: 4.4446 },
    ],
    variantes_thematiques: ['electrique', 'sans-peage', 'famille', 'camping-car', 'le-moins-cher'],
    monetisation: ['Assurance voyage', 'Badge télépéage', 'Hôtels étape', 'Recharge EV'],
  },
  // 2
  {
    slug: 'belgique-costa-brava',
    titre_court: 'Belgique → Costa Brava',
    origine:     { ville: 'Bruxelles', pays: 'BE', lat: 50.8503, lon: 4.3517 },
    destination: { ville: 'Lloret de Mar', pays: 'ES', lat: 41.6993, lon: 2.8456 },
    pays_traverses: ['BE', 'FR', 'ES'],
    distance_km: 1320,
    duree_base_min: 770,
    peages_eur: 105,
    emoji: '🌊',
    region: 'Costa Brava',
    intention: 'Coût total vacances voiture, péages France + Espagne',
    difficulte: 'Élevée',
    villes_depart_alt: [
      { ville: 'Anvers', pays: 'BE', lat: 51.2194, lon: 4.4025 },
      { ville: 'Gand',   pays: 'BE', lat: 51.0500, lon: 3.7167 },
    ],
    variantes_thematiques: ['electrique', 'sans-peage', 'famille', 'camping-car', 'le-moins-cher'],
    monetisation: ['Carburant', 'Bornes recharge', 'Campings', 'Hôtels'],
  },
  // 3
  {
    slug: 'belgique-toscane',
    titre_court: 'Belgique → Toscane',
    origine:     { ville: 'Bruxelles', pays: 'BE', lat: 50.8503, lon: 4.3517 },
    destination: { ville: 'Florence',  pays: 'IT', lat: 43.7696, lon: 11.2558 },
    pays_traverses: ['BE', 'FR', 'CH', 'IT'],
    distance_km: 1310,
    duree_base_min: 780,
    peages_eur: 100,
    emoji: '🍷',
    region: 'Toscane',
    intention: 'Itinéraire famille, vignette suisse, tunnel Mont-Blanc/Gothard',
    difficulte: 'Moyenne',
    villes_depart_alt: [
      { ville: 'Anvers', pays: 'BE', lat: 51.2194, lon: 4.4025 },
      { ville: 'Liège',  pays: 'BE', lat: 50.6326, lon: 5.5797 },
    ],
    variantes_thematiques: ['electrique', 'famille', 'camping-car', 'le-moins-cher'],
    monetisation: ['Hôtels Toscane', 'Assistance auto', 'Vignette CH'],
  },
  // 4
  {
    slug: 'pays-bas-lac-garde',
    titre_court: 'Pays-Bas → Lac de Garde',
    origine:     { ville: 'Amsterdam', pays: 'NL', lat: 52.3676, lon: 4.9041 },
    destination: { ville: 'Riva del Garda', pays: 'IT', lat: 45.8852, lon: 10.8431 },
    pays_traverses: ['NL', 'DE', 'AT', 'IT'],
    distance_km: 1230,
    duree_base_min: 720,
    peages_eur: 65,
    emoji: '🏔️',
    region: 'Lacs italiens',
    intention: 'Cols alpins, vignette autrichienne, recharge VE, étapes',
    difficulte: 'Élevée',
    villes_depart_alt: [
      { ville: 'Rotterdam', pays: 'NL', lat: 51.9244, lon: 4.4777 },
      { ville: 'Utrecht',   pays: 'NL', lat: 52.0907, lon: 5.1214 },
    ],
    variantes_thematiques: ['electrique', 'famille', 'camping-car', 'le-moins-cher'],
    monetisation: ['Recharge EV', 'Pneus / chaînes', 'Vignettes AT', 'Hôtels'],
  },
  // 5
  {
    slug: 'pays-bas-dalmatie',
    titre_court: 'Pays-Bas → Dalmatie',
    origine:     { ville: 'Amsterdam', pays: 'NL', lat: 52.3676, lon: 4.9041 },
    destination: { ville: 'Split',     pays: 'HR', lat: 43.5081, lon: 16.4402 },
    pays_traverses: ['NL', 'DE', 'AT', 'SI', 'HR'],
    distance_km: 1700,
    duree_base_min: 1020,
    peages_eur: 90,
    emoji: '⛱️',
    region: 'Croatie',
    intention: 'Temps trajet, budget, vignettes Autriche/Slovénie',
    difficulte: 'Moyenne',
    villes_depart_alt: [
      { ville: 'Rotterdam', pays: 'NL', lat: 51.9244, lon: 4.4777 },
    ],
    variantes_thematiques: ['electrique', 'famille', 'camping-car', 'le-moins-cher'],
    monetisation: ['Assurance voyage', 'Assistance', 'Vignettes', 'Hôtels'],
  },
  // 6
  {
    slug: 'allemagne-algarve',
    titre_court: 'Allemagne → Algarve',
    origine:     { ville: 'Francfort', pays: 'DE', lat: 50.1109, lon: 8.6821 },
    destination: { ville: 'Faro',      pays: 'PT', lat: 37.0194, lon: -7.9304 },
    pays_traverses: ['DE', 'FR', 'ES', 'PT'],
    distance_km: 2550,
    duree_base_min: 1500,
    peages_eur: 165,
    emoji: '🏝️',
    region: 'Algarve',
    intention: 'Road trip long trajet, escales, recharge VE longue distance',
    difficulte: 'Moyenne',
    villes_depart_alt: [
      { ville: 'Munich',  pays: 'DE', lat: 48.1351, lon: 11.5820 },
      { ville: 'Cologne', pays: 'DE', lat: 50.9375, lon: 6.9603 },
    ],
    variantes_thematiques: ['electrique', 'famille', 'camping-car', 'le-moins-cher'],
    monetisation: ['Hôtels étape', 'Recharge', 'Coffre toit', 'Assurance'],
  },
  // 7
  {
    slug: 'allemagne-peloponnese',
    titre_court: 'Allemagne → Péloponnèse',
    origine:     { ville: 'Munich',    pays: 'DE', lat: 48.1351, lon: 11.5820 },
    destination: { ville: 'Patras',    pays: 'GR', lat: 38.2466, lon: 21.7346 },
    pays_traverses: ['DE', 'AT', 'IT', 'GR'],
    distance_km: 2200,
    duree_base_min: 1380,
    peages_eur: 110,
    emoji: '🏛️',
    region: 'Grèce',
    intention: 'Ferries Ancône/Bari → Patras, sécurité, documents',
    difficulte: 'Faible',
    villes_depart_alt: [
      { ville: 'Stuttgart', pays: 'DE', lat: 48.7758, lon: 9.1829 },
    ],
    variantes_thematiques: ['electrique', 'famille', 'camping-car', 'le-moins-cher'],
    monetisation: ['Ferries', 'Assistance', 'Assurance'],
  },
  // 8
  {
    slug: 'france-costa-brava',
    titre_court: 'France → Costa Brava',
    origine:     { ville: 'Paris',     pays: 'FR', lat: 48.8566, lon: 2.3522 },
    destination: { ville: 'Lloret de Mar', pays: 'ES', lat: 41.6993, lon: 2.8456 },
    pays_traverses: ['FR', 'ES'],
    distance_km: 1080,
    duree_base_min: 660,
    peages_eur: 95,
    emoji: '🏖️',
    region: 'Costa Brava',
    intention: 'Week-end Costa Brava, itinéraire rapide depuis France',
    difficulte: 'Élevée',
    villes_depart_alt: [
      { ville: 'Lyon',     pays: 'FR', lat: 45.7640, lon: 4.8357 },
      { ville: 'Toulouse', pays: 'FR', lat: 43.6047, lon: 1.4442 },
      { ville: 'Bordeaux', pays: 'FR', lat: 44.8378, lon: -0.5792 },
    ],
    variantes_thematiques: ['electrique', 'sans-peage', 'famille', 'camping-car', 'le-moins-cher'],
    monetisation: ['Hôtels', 'Carburant', 'Bornes recharge'],
  },
  // 9
  {
    slug: 'france-alpes-suisses',
    titre_court: 'France → Alpes suisses',
    origine:     { ville: 'Lyon',      pays: 'FR', lat: 45.7640, lon: 4.8357 },
    destination: { ville: 'Zermatt',   pays: 'CH', lat: 46.0207, lon: 7.7491 },
    pays_traverses: ['FR', 'CH'],
    distance_km: 410,
    duree_base_min: 290,
    peages_eur: 35,
    emoji: '⛰️',
    region: 'Alpes',
    intention: 'Cols alpins, vignette suisse, météo, neige',
    difficulte: 'Moyenne',
    villes_depart_alt: [
      { ville: 'Paris',     pays: 'FR', lat: 48.8566, lon: 2.3522 },
      { ville: 'Grenoble',  pays: 'FR', lat: 45.1885, lon: 5.7245 },
    ],
    variantes_thematiques: ['electrique', 'famille', 'le-moins-cher'],
    monetisation: ['Chaînes neige', 'Vignette CH', 'Assurance', 'Hôtels'],
  },
  // 10
  {
    slug: 'italie-tyrol',
    titre_court: 'Italie → Tyrol',
    origine:     { ville: 'Milan',     pays: 'IT', lat: 45.4642, lon: 9.1900 },
    destination: { ville: 'Innsbruck', pays: 'AT', lat: 47.2692, lon: 11.4041 },
    pays_traverses: ['IT', 'AT'],
    distance_km: 410,
    duree_base_min: 300,
    peages_eur: 40,
    emoji: '🏔️',
    region: 'Alpes orientales',
    intention: 'Vignette autrichienne, tunnel Brenner, péages italiens',
    difficulte: 'Faible',
    villes_depart_alt: [
      { ville: 'Vérone', pays: 'IT', lat: 45.4384, lon: 10.9916 },
    ],
    variantes_thematiques: ['electrique', 'famille', 'camping-car', 'le-moins-cher'],
    monetisation: ['Vignettes', 'Assistance', 'Hôtels'],
  },
  // 11
  {
    slug: 'italie-dalmatie',
    titre_court: 'Italie → Dalmatie',
    origine:     { ville: 'Trieste',   pays: 'IT', lat: 45.6495, lon: 13.7768 },
    destination: { ville: 'Split',     pays: 'HR', lat: 43.5081, lon: 16.4402 },
    pays_traverses: ['IT', 'SI', 'HR'],
    distance_km: 510,
    duree_base_min: 380,
    peages_eur: 35,
    emoji: '⛵',
    region: 'Adriatique',
    intention: 'Ferry vs route, vignettes Slovénie + Croatie',
    difficulte: 'Faible',
    villes_depart_alt: [
      { ville: 'Venise', pays: 'IT', lat: 45.4408, lon: 12.3155 },
      { ville: 'Ancône', pays: 'IT', lat: 43.6158, lon: 13.5189 },
    ],
    variantes_thematiques: ['electrique', 'famille', 'camping-car', 'le-moins-cher'],
    monetisation: ['Ferries', 'Hôtels', 'Vignettes'],
  },
  // 12
  {
    slug: 'espagne-algarve',
    titre_court: 'Espagne → Algarve',
    origine:     { ville: 'Madrid',    pays: 'ES', lat: 40.4168, lon: -3.7038 },
    destination: { ville: 'Faro',      pays: 'PT', lat: 37.0194, lon: -7.9304 },
    pays_traverses: ['ES', 'PT'],
    distance_km: 690,
    duree_base_min: 450,
    peages_eur: 35,
    emoji: '🏝️',
    region: 'Algarve',
    intention: 'Road trip plages, famille, péages Portugal',
    difficulte: 'Moyenne',
    villes_depart_alt: [
      { ville: 'Séville',  pays: 'ES', lat: 37.3891, lon: -5.9845 },
      { ville: 'Barcelone', pays: 'ES', lat: 41.3851, lon: 2.1734 },
    ],
    variantes_thematiques: ['electrique', 'sans-peage', 'famille', 'camping-car', 'le-moins-cher'],
    monetisation: ['Campings', 'Recharge EV', 'Hôtels'],
  },
  // 13
  {
    slug: 'portugal-provence',
    titre_court: 'Portugal → Provence',
    origine:     { ville: 'Lisbonne',  pays: 'PT', lat: 38.7223, lon: -9.1393 },
    destination: { ville: 'Avignon',   pays: 'FR', lat: 43.9493, lon: 4.8055 },
    pays_traverses: ['PT', 'ES', 'FR'],
    distance_km: 1980,
    duree_base_min: 1200,
    peages_eur: 130,
    emoji: '🌻',
    region: 'Provence',
    intention: 'Longs trajets, étapes, recharge VE',
    difficulte: 'Faible',
    villes_depart_alt: [
      { ville: 'Porto', pays: 'PT', lat: 41.1579, lon: -8.6291 },
    ],
    variantes_thematiques: ['electrique', 'famille', 'camping-car', 'le-moins-cher'],
    monetisation: ['Assistance premium', 'Hôtels', 'Recharge'],
  },
  // 14
  {
    slug: 'danemark-norvege',
    titre_court: 'Danemark → Fjords norvégiens',
    origine:     { ville: 'Copenhague', pays: 'DK', lat: 55.6761, lon: 12.5683 },
    destination: { ville: 'Bergen',     pays: 'NO', lat: 60.3913, lon: 5.3221 },
    pays_traverses: ['DK', 'SE', 'NO'],
    distance_km: 920,
    duree_base_min: 720,
    peages_eur: 75,
    emoji: '🏔️',
    region: 'Fjords',
    intention: 'Ferries, VE (densité bornes max au monde), météo',
    difficulte: 'Moyenne',
    villes_depart_alt: [
      { ville: 'Aarhus', pays: 'DK', lat: 56.1629, lon: 10.2039 },
    ],
    variantes_thematiques: ['electrique', 'famille', 'camping-car', 'le-moins-cher'],
    monetisation: ['Recharge EV', 'Ferry', 'Hôtels'],
  },
  // 15
  {
    slug: 'suede-foret-noire',
    titre_court: 'Suède → Forêt-Noire',
    origine:     { ville: 'Stockholm', pays: 'SE', lat: 59.3293, lon: 18.0686 },
    destination: { ville: 'Fribourg-en-Brisgau', pays: 'DE', lat: 47.9990, lon: 7.8421 },
    pays_traverses: ['SE', 'DK', 'DE'],
    distance_km: 1680,
    duree_base_min: 1080,
    peages_eur: 80,
    emoji: '🌲',
    region: 'Forêt-Noire',
    intention: 'Itinéraire vacances, ferries DK, hôtels',
    difficulte: 'Faible',
    villes_depart_alt: [
      { ville: 'Göteborg', pays: 'SE', lat: 57.7089, lon: 11.9746 },
    ],
    variantes_thematiques: ['electrique', 'famille', 'camping-car', 'le-moins-cher'],
    monetisation: ['Hôtels', 'Pneus', 'Recharge', 'Ferry'],
  },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Slugify a city name (e.g. "Lloret de Mar" → "lloret-de-mar") */
export function slugVille(nom: string): string {
  return nom
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

/** Get a TrajetSEO by slug, or undefined. */
export function getTrajetBySlug(slug: string): TrajetSEO | undefined {
  return TRAJETS_SEO.find(t => t.slug === slug)
}

/** Convert a TrajetSEO + optional alt origin into a `Route` for the TCO engine. */
export function toRoute(trajet: TrajetSEO, origineAlt?: VilleOrigine): Route {
  const origine = origineAlt ?? trajet.origine
  return {
    slug:           trajet.slug,
    depart:         origine.ville,
    arrivee:        trajet.destination.ville,
    distance_km:    trajet.distance_km,
    peages_eur:     trajet.peages_eur,
    duree_base_min: trajet.duree_base_min,
    pays_depart:    origine.pays,
    region:         trajet.region,
    popular:        trajet.difficulte === 'Élevée',
  }
}

/** All variant slugs for a given trajet (thématiques + villes alt). */
export function variantesForTrajet(trajet: TrajetSEO): string[] {
  const themes = trajet.variantes_thematiques as string[]
  const villes = trajet.villes_depart_alt.map(v => `depuis-${slugVille(v.ville)}`)
  return [...themes, ...villes]
}

/** Décrire une variante quelconque (thématique ou "depuis-ville"). */
export interface VarianteInfo {
  slug: string
  label: string
  emoji: string
  intent: string
  /** Si "depuis-ville", la VilleOrigine correspondante */
  origineAlt?: VilleOrigine
  /** Si thématique, la clé typée */
  theme?: VarianteThematique
}

export function getVarianteInfo(trajet: TrajetSEO, varianteSlug: string): VarianteInfo | undefined {
  // Thématique ?
  if ((Object.keys(VARIANTES_LABELS) as VarianteThematique[]).includes(varianteSlug as VarianteThematique)) {
    if (!(trajet.variantes_thematiques as string[]).includes(varianteSlug)) return undefined
    const v = VARIANTES_LABELS[varianteSlug as VarianteThematique]
    return { slug: varianteSlug, ...v, theme: varianteSlug as VarianteThematique }
  }
  // Depuis ville ?
  if (varianteSlug.startsWith('depuis-')) {
    const villeSlug = varianteSlug.replace(/^depuis-/, '')
    const origineAlt = trajet.villes_depart_alt.find(v => slugVille(v.ville) === villeSlug)
    if (!origineAlt) return undefined
    return {
      slug: varianteSlug,
      label: `depuis ${origineAlt.ville}`,
      emoji: '📍',
      intent: `Itinéraire spécifique depuis ${origineAlt.ville}`,
      origineAlt,
    }
  }
  return undefined
}

/** Liste exhaustive (15 routes × variantes) pour generateStaticParams. */
export function allTrajetVariantParams(): { slug: string; variante: string }[] {
  return TRAJETS_SEO.flatMap(t =>
    variantesForTrajet(t).map(variante => ({ slug: t.slug, variante }))
  )
}
