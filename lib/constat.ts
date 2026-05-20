/**
 * Moteurs.com — Constat Intelligent
 * Types TypeScript + données de référence du constat amiable européen.
 */

import type { UserContext } from './user-context'

// ─── Types de base ────────────────────────────────────────────────────────────

export interface VehiculeInfo {
  immatriculation:          string
  marque_modele:            string
  nom_conducteur:           string
  prenom_conducteur:        string
  adresse_conducteur:       string
  telephone:                string
  email:                    string
  assurance_nom:            string
  assurance_numero_police:  string
  assurance_agence:         string
  assurance_telephone:      string
  dommages_description:     string
  dommages_localisation:    string[]  // ex: ['avant-gauche', 'portière-gauche']
}

export interface Temoin {
  nom:       string
  adresse:   string
  telephone: string
}

export interface ConstantData {
  // ── Étape 0 : Urgence ───────────────────────────────────────────────────────
  date:             string  // ISO date YYYY-MM-DD
  heure:            string  // HH:MM
  lieu:             string
  pays:             string
  blesses:          boolean
  nb_blesses:       number
  secours_appeles:  boolean
  numero_appele:    string

  // ── Étape 1 : Photos ────────────────────────────────────────────────────────
  photos_checklist: string[]  // IDs des photos confirmées prises

  // ── Étapes 2 & 3 : Véhicules ────────────────────────────────────────────────
  vehicule_a: VehiculeInfo
  vehicule_b: VehiculeInfo

  // ── Étape 4 : Circonstances ──────────────────────────────────────────────────
  circonstances_a: number[]  // indices (0-based) des cases cochées pour A
  circonstances_b: number[]  // indices pour B

  // ── Étape 5 : Croquis ────────────────────────────────────────────────────────
  sens_a:              string  // ex: "Nord → Sud (rue Victor Hugo)"
  sens_b:              string
  point_choc_a:        string  // ex: "avant-gauche"
  point_choc_b:        string
  croquis_description: string  // description libre du croquis

  // ── Étape 6 : Témoins & observations ─────────────────────────────────────────
  temoins:      Temoin[]
  observations: string
}

// ─── Valeur initiale vide ─────────────────────────────────────────────────────

export function emptyVehicule(): VehiculeInfo {
  return {
    immatriculation: '', marque_modele: '', nom_conducteur: '',
    prenom_conducteur: '', adresse_conducteur: '', telephone: '', email: '',
    assurance_nom: '', assurance_numero_police: '', assurance_agence: '',
    assurance_telephone: '', dommages_description: '', dommages_localisation: [],
  }
}

export function emptyConstat(): ConstantData {
  return {
    date: new Date().toISOString().slice(0, 10),
    heure: new Date().toTimeString().slice(0, 5),
    lieu: '', pays: 'FR',
    blesses: false, nb_blesses: 0,
    secours_appeles: false, numero_appele: '',
    photos_checklist: [],
    vehicule_a: emptyVehicule(),
    vehicule_b: emptyVehicule(),
    circonstances_a: [], circonstances_b: [],
    sens_a: '', sens_b: '',
    point_choc_a: '', point_choc_b: '',
    croquis_description: '',
    temoins: [], observations: '',
  }
}

// ─── 17 circonstances du constat amiable européen ────────────────────────────

export interface Circonstance {
  id:     number
  label:  string
  emoji:  string
}

export const CIRCONSTANCES: Circonstance[] = [
  { id: 0,  emoji: '🅿️', label: 'En stationnement / à l\'arrêt' },
  { id: 1,  emoji: '🚪', label: 'Quittait un stationnement / ouvrait une portière' },
  { id: 2,  emoji: '🅿️', label: 'Prenait un stationnement' },
  { id: 3,  emoji: '🚘', label: 'Sortait d\'un parking, lieu privé, chemin de terre' },
  { id: 4,  emoji: '🏠', label: 'S\'engageait dans un parking, lieu privé, chemin de terre' },
  { id: 5,  emoji: '🔄', label: 'S\'engageait sur une chaussée à sens giratoire' },
  { id: 6,  emoji: '🔄', label: 'Circulait sur une chaussée à sens giratoire' },
  { id: 7,  emoji: '⬆️', label: 'Heurtait l\'arrière de l\'autre véhicule, même sens, même file' },
  { id: 8,  emoji: '↔️', label: 'Roulait dans le même sens, file différente' },
  { id: 9,  emoji: '↗️', label: 'Changeait de file' },
  { id: 10, emoji: '🚗', label: 'Doublait' },
  { id: 11, emoji: '↩️', label: 'Virait à droite' },
  { id: 12, emoji: '↪️', label: 'Virait à gauche' },
  { id: 13, emoji: '⬅️', label: 'Reculait' },
  { id: 14, emoji: '⚠️', label: 'Empiétait sur la voie en sens inverse' },
  { id: 15, emoji: '➡️', label: 'Venait de droite (dans un carrefour)' },
  { id: 16, emoji: '🚦', label: 'N\'avait pas respecté un stop / feu rouge / priorité' },
]

// ─── Points de choc sur le véhicule ──────────────────────────────────────────

export const POINTS_CHOC = [
  'Avant', 'Avant-droit', 'Avant-gauche',
  'Côté droit', 'Côté gauche',
  'Arrière', 'Arrière-droit', 'Arrière-gauche',
  'Toit', 'Dessous',
]

// ─── Checklist photos à prendre ──────────────────────────────────────────────

export interface PhotoItem {
  id:     string
  label:  string
  desc:   string
  emoji:  string
  urgent: boolean
}

export const PHOTOS_CHECKLIST: PhotoItem[] = [
  { id: 'plaques',   emoji: '🔢', label: 'Plaques d\'immatriculation',       desc: 'Les deux véhicules — de près et lisibles',                  urgent: true  },
  { id: 'choc',      emoji: '💥', label: 'Zone de choc / dégâts',            desc: 'Chaque véhicule, sous plusieurs angles',                    urgent: true  },
  { id: 'lieu',      emoji: '📍', label: 'Vue d\'ensemble du lieu',           desc: 'Position des véhicules, signalisation, marquages',          urgent: true  },
  { id: 'permis',    emoji: '🪪', label: 'Permis de conduire adverse',        desc: 'Recto + verso, si l\'autre conducteur l\'accepte',          urgent: true  },
  { id: 'assurance', emoji: '📄', label: 'Carte verte assurance adverse',     desc: 'Numéro de police, dates validité, assureur',               urgent: true  },
  { id: 'croquis',   emoji: '🗺️', label: 'Vue satellite / plan du carrefour', desc: 'Screenshot Google Maps de la zone pour le croquis',        urgent: false },
  { id: 'temoins',   emoji: '👥', label: 'Témoins présents',                  desc: 'Coordonnées et consentement des témoins éventuels',        urgent: false },
  { id: 'signaux',   emoji: '🚦', label: 'Panneaux et feux de signalisation', desc: 'Stops, priorités, feux — utile si responsabilité contestée', urgent: false },
]

// ─── Pré-remplissage depuis le contexte utilisateur ──────────────────────────

/**
 * Construit un Partial<VehiculeInfo> à partir du contexte utilisateur stocké.
 * Utilisé pour pré-remplir le véhicule A (le sien) dans le constat.
 */
export function vehiculeInfoFromContext(ctx: UserContext): Partial<VehiculeInfo> {
  const c = ctx.conducteur
  const a = ctx.assurance
  const v = ctx.voiture
  const result: Partial<VehiculeInfo> = {}
  if (v?.immatriculation)         result.immatriculation = v.immatriculation
  if (v?.marque && v?.modele)     result.marque_modele = `${v.marque} ${v.modele}`
  else if (v?.marque)             result.marque_modele = v.marque
  if (c?.nom)                     result.nom_conducteur = c.nom
  if (c?.prenom)                  result.prenom_conducteur = c.prenom
  if (c?.adresse)                 result.adresse_conducteur = c.adresse
  if (c?.telephone)               result.telephone = c.telephone
  if (c?.email)                   result.email = c.email
  if (a?.nom_assureur)            result.assurance_nom = a.nom_assureur
  if (a?.numero_police)           result.assurance_numero_police = a.numero_police
  if (a?.agence)                  result.assurance_agence = a.agence
  if (a?.telephone)               result.assurance_telephone = a.telephone
  return result
}

/** True si le contexte contient au moins une info utile pour pré-remplir un constat. */
export function hasContextDataForConstat(ctx: UserContext): boolean {
  return !!(
    ctx.voiture?.immatriculation ||
    ctx.voiture?.marque ||
    ctx.conducteur?.nom ||
    ctx.conducteur?.prenom ||
    ctx.conducteur?.email ||
    ctx.assurance?.nom_assureur
  )
}

// ─── Pays et numéros d'urgence ────────────────────────────────────────────────

export const PAYS_URGENCE: Record<string, { police: string; samu: string; pompiers: string; eu: string }> = {
  FR: { police: '17', samu: '15', pompiers: '18', eu: '112' },
  BE: { police: '101', samu: '100', pompiers: '100', eu: '112' },
  CH: { police: '117', samu: '144', pompiers: '118', eu: '112' },
  CA: { police: '911', samu: '911', pompiers: '911', eu: '911' },
}
