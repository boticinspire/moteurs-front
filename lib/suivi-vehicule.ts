/**
 * lib/suivi-vehicule.ts — Moteurs.com / Autopulse
 * Carnet d'entretien intelligent : profil véhicule multi-marques,
 * échéances d'entretien (km + date), suivi des coûts.
 *
 * 100 % client : persistance localStorage, aucune API externe.
 * Hook de synchronisation membres prévu (Supabase) — voir syncRemote / pullRemote.
 */

// ─── Types ──────────────────────────────────────────────────────────────────

export type Carburant =
  | 'ESSENCE'
  | 'DIESEL'
  | 'HYBRIDE'      // HEV + PHEV
  | 'ELECTRIQUE'   // BEV
  | 'GNV'
  | 'GPL'

export interface Echeance {
  id: string
  label: string
  /** intervalle kilométrique (km). 0 = non basé sur le km. */
  intervalleKm: number
  /** intervalle calendaire (mois). 0 = non basé sur la date. */
  intervalleMois: number
  /** dernier km auquel l'opération a été faite (null = jamais). */
  dernierKm: number | null
  /** dernière date ISO yyyy-mm-dd à laquelle l'opération a été faite (null = jamais). */
  derniereDate: string | null
  /** opération issue du modèle par défaut (vs ajout manuel). */
  parDefaut?: boolean
}

export interface Depense {
  id: string
  date: string          // ISO yyyy-mm-dd
  categorie: 'Entretien' | 'Carburant/Recharge' | 'Assurance' | 'Pneus' | 'Réparation' | 'Autre'
  libelle: string
  montant: number       // €
  km: number | null     // km au moment de la dépense (optionnel)
}

export type UsureType = 'pneus' | 'plaquettes_av' | 'plaquettes_ar' | 'disques' | 'batterie_traction'

export interface Usure {
  id: string
  type: UsureType
  label: string
  installKm: number           // km au montage / dernier remplacement
  installDate: string | null  // ISO yyyy-mm-dd
  dureeVieKm: number          // durée de vie attendue (km)
}

export interface HistoriqueItem {
  id: string
  label: string
  km: number | null
  date: string                // ISO yyyy-mm-dd
  cout: number | null         // € (optionnel)
}

export interface Vehicule {
  id: string
  marque: string
  modele: string
  annee: number | null
  carburant: Carburant
  kmActuel: number
  kmActuelDate: string        // ISO yyyy-mm-dd — date du relevé kmActuel
  kmParAn: number             // estimation pour projeter les échéances km en date
  miseEnService: string | null // ISO yyyy-mm-dd
  immatriculation?: string
  echeances: Echeance[]
  depenses: Depense[]
  usures: Usure[]
  historique: HistoriqueItem[]
  creeLe: string              // ISO datetime
}

export interface AutopulseState {
  vehicules: Vehicule[]
  actifId: string | null
  version: 1
}

// ─── Constantes ─────────────────────────────────────────────────────────────

export const LS_KEY = 'moteurs_autopulse_v1'

export const CARBURANTS: { value: Carburant; label: string; emoji: string }[] = [
  { value: 'ESSENCE', label: 'Essence', emoji: '⛽' },
  { value: 'DIESEL', label: 'Diesel', emoji: '🛢️' },
  { value: 'HYBRIDE', label: 'Hybride (HEV/PHEV)', emoji: '🔋' },
  { value: 'ELECTRIQUE', label: 'Électrique (BEV)', emoji: '⚡' },
  { value: 'GNV', label: 'GNV / bioGNV', emoji: '💨' },
  { value: 'GPL', label: 'GPL', emoji: '🟢' },
]

export const CATEGORIES_DEPENSE: Depense['categorie'][] = [
  'Entretien', 'Carburant/Recharge', 'Assurance', 'Pneus', 'Réparation', 'Autre',
]

// ─── Modèles d'entretien par carburant ──────────────────────────────────────
// Intervalles génériques constructeur (indicatifs, éditables par l'utilisateur).

type Modele = Omit<Echeance, 'id' | 'dernierKm' | 'derniereDate'>

const COMMUN: Modele[] = [
  { label: 'Filtre habitacle', intervalleKm: 15000, intervalleMois: 12, parDefaut: true },
  { label: 'Plaquettes de frein (contrôle)', intervalleKm: 30000, intervalleMois: 0, parDefaut: true },
  { label: 'Liquide de frein', intervalleKm: 0, intervalleMois: 24, parDefaut: true },
  { label: 'Pneus — contrôle / permutation', intervalleKm: 10000, intervalleMois: 0, parDefaut: true },
  { label: 'Contrôle technique', intervalleKm: 0, intervalleMois: 24, parDefaut: true },
]

const THERMIQUE: Modele[] = [
  { label: 'Vidange huile moteur + filtre', intervalleKm: 15000, intervalleMois: 12, parDefaut: true },
  { label: 'Filtre à air', intervalleKm: 30000, intervalleMois: 24, parDefaut: true },
  { label: 'Courroie / chaîne de distribution', intervalleKm: 120000, intervalleMois: 60, parDefaut: true },
]

const MODELES: Record<Carburant, Modele[]> = {
  ESSENCE: [
    ...THERMIQUE,
    { label: 'Bougies d’allumage', intervalleKm: 60000, intervalleMois: 0, parDefaut: true },
    ...COMMUN,
  ],
  DIESEL: [
    ...THERMIQUE,
    { label: 'Filtre à gazole', intervalleKm: 40000, intervalleMois: 24, parDefaut: true },
    { label: 'Filtre à particules (FAP) — contrôle', intervalleKm: 80000, intervalleMois: 0, parDefaut: true },
    ...COMMUN,
  ],
  GNV: [
    ...THERMIQUE,
    { label: 'Inspection réservoir(s) GNV', intervalleKm: 0, intervalleMois: 48, parDefaut: true },
    ...COMMUN,
  ],
  GPL: [
    ...THERMIQUE,
    { label: 'Contrôle réservoir / injecteurs GPL', intervalleKm: 0, intervalleMois: 24, parDefaut: true },
    ...COMMUN,
  ],
  HYBRIDE: [
    { label: 'Vidange huile moteur + filtre', intervalleKm: 15000, intervalleMois: 12, parDefaut: true },
    { label: 'Filtre à air', intervalleKm: 30000, intervalleMois: 24, parDefaut: true },
    { label: 'Liquide de refroidissement batterie', intervalleKm: 0, intervalleMois: 60, parDefaut: true },
    { label: 'Plaquettes de frein (contrôle — usure réduite)', intervalleKm: 50000, intervalleMois: 0, parDefaut: true },
    { label: 'Filtre habitacle', intervalleKm: 15000, intervalleMois: 12, parDefaut: true },
    { label: 'Liquide de frein', intervalleKm: 0, intervalleMois: 24, parDefaut: true },
    { label: 'Pneus — contrôle / permutation', intervalleKm: 10000, intervalleMois: 0, parDefaut: true },
    { label: 'Contrôle technique', intervalleKm: 0, intervalleMois: 24, parDefaut: true },
  ],
  ELECTRIQUE: [
    { label: 'Filtre habitacle', intervalleKm: 15000, intervalleMois: 12, parDefaut: true },
    { label: 'Plaquettes de frein (contrôle — usure réduite)', intervalleKm: 60000, intervalleMois: 0, parDefaut: true },
    { label: 'Liquide de frein', intervalleKm: 0, intervalleMois: 24, parDefaut: true },
    { label: 'Liquide de refroidissement batterie', intervalleKm: 30000, intervalleMois: 24, parDefaut: true },
    { label: 'Pneus — contrôle / permutation', intervalleKm: 10000, intervalleMois: 0, parDefaut: true },
    { label: 'Batterie 12 V — contrôle', intervalleKm: 0, intervalleMois: 48, parDefaut: true },
    { label: 'Contrôle technique', intervalleKm: 0, intervalleMois: 24, parDefaut: true },
  ],
}

let _seq = 0
export function uid(prefix = 'id'): string {
  _seq += 1
  return `${prefix}_${Date.now().toString(36)}_${_seq.toString(36)}_${Math.random().toString(36).slice(2, 7)}`
}

/** Construit les échéances par défaut pour un carburant donné. */
export function echeancesParDefaut(carburant: Carburant): Echeance[] {
  return (MODELES[carburant] || []).map((m) => ({
    ...m,
    id: uid('ech'),
    dernierKm: null,
    derniereDate: null,
  }))
}

// ─── Calcul des échéances ────────────────────────────────────────────────────

export type StatutEcheance = 'inconnu' | 'a_jour' | 'bientot' | 'en_retard'

export interface EcheanceCalc {
  echeance: Echeance
  statut: StatutEcheance
  /** km restant avant échéance (null si non basé km ou inconnu). */
  kmRestant: number | null
  /** jours restant avant échéance (null si inconnu). */
  joursRestant: number | null
  /** date d'échéance projetée la plus proche (ISO) ou null. */
  prochaineDate: string | null
  /** km d'échéance ou null. */
  prochainKm: number | null
  /** message court lisible. */
  detail: string
}

const SEUIL_KM = 1000     // « bientôt » si < 1000 km
const SEUIL_JOURS = 30    // « bientôt » si < 30 jours

function joursEntre(aISO: string, bISO: string): number {
  const a = new Date(aISO + 'T00:00:00')
  const b = new Date(bISO + 'T00:00:00')
  return Math.round((b.getTime() - a.getTime()) / 86400000)
}

function addMois(iso: string, mois: number): string {
  const d = new Date(iso + 'T00:00:00')
  d.setMonth(d.getMonth() + mois)
  return d.toISOString().slice(0, 10)
}

const todayISO = () => new Date().toISOString().slice(0, 10)

/**
 * Calcule le statut d'une échéance pour un véhicule.
 * Combine la dimension km (via kmActuel + kmParAn) et la dimension calendaire.
 * Retient l'échéance la plus contraignante (la plus proche / déjà dépassée).
 */
export function calcEcheance(v: Vehicule, e: Echeance, now = todayISO()): EcheanceCalc {
  const base = e.dernierKm
  const baseDate = e.derniereDate
  const kmPerDay = v.kmParAn > 0 ? v.kmParAn / 365 : 0

  let kmRestant: number | null = null
  let prochainKm: number | null = null
  let joursParKm: number | null = null

  if (e.intervalleKm > 0) {
    const dep = base ?? v.kmActuel
    prochainKm = dep + e.intervalleKm
    kmRestant = prochainKm - v.kmActuel
    if (kmPerDay > 0) joursParKm = Math.round(kmRestant / kmPerDay)
  }

  let joursParDate: number | null = null
  let prochaineDate: string | null = null
  if (e.intervalleMois > 0) {
    const depDate = baseDate ?? v.kmActuelDate
    prochaineDate = addMois(depDate, e.intervalleMois)
    joursParDate = joursEntre(now, prochaineDate)
  }

  // jours restant effectif = min des deux dimensions disponibles
  const candidats = [joursParKm, joursParDate].filter((x): x is number => x !== null)
  const joursRestant = candidats.length ? Math.min(...candidats) : null

  // date projetée la plus proche
  let dateProj = prochaineDate
  if (joursParKm !== null && (joursParDate === null || joursParKm < joursParDate)) {
    const d = new Date(now + 'T00:00:00')
    d.setDate(d.getDate() + joursParKm)
    dateProj = d.toISOString().slice(0, 10)
  }

  // statut
  let statut: StatutEcheance = 'inconnu'
  const jamaisFait = base === null && baseDate === null
  if (joursRestant === null && kmRestant === null) {
    statut = 'inconnu'
  } else {
    const retardKm = kmRestant !== null && kmRestant <= 0
    const retardJours = joursRestant !== null && joursRestant <= 0
    const bientotKm = kmRestant !== null && kmRestant > 0 && kmRestant < SEUIL_KM
    const bientotJours = joursRestant !== null && joursRestant > 0 && joursRestant < SEUIL_JOURS
    if (retardKm || retardJours) statut = 'en_retard'
    else if (bientotKm || bientotJours) statut = 'bientot'
    else statut = 'a_jour'
  }
  if (jamaisFait && statut === 'a_jour') {
    // jamais enregistré : on n'alarme pas, mais on signale « à renseigner »
    statut = 'inconnu'
  }

  // détail lisible
  let detail = ''
  if (statut === 'inconnu') {
    detail = jamaisFait ? 'Jamais renseigné' : 'Données insuffisantes'
  } else if (kmRestant !== null && (joursParDate === null || (joursParKm !== null && joursParKm <= joursParDate))) {
    detail = kmRestant <= 0 ? `Dépassé de ${Math.abs(kmRestant).toLocaleString('fr-FR')} km` : `Dans ${kmRestant.toLocaleString('fr-FR')} km`
  } else if (joursRestant !== null) {
    detail = joursRestant <= 0 ? `En retard de ${Math.abs(joursRestant)} j` : `Dans ${joursRestant} j`
  }

  return { echeance: e, statut, kmRestant, joursRestant, prochaineDate: dateProj, prochainKm, detail }
}

/** Trie les échéances calculées de la plus urgente à la moins urgente. */
export function trierUrgence(list: EcheanceCalc[]): EcheanceCalc[] {
  const rank: Record<StatutEcheance, number> = { en_retard: 0, bientot: 1, a_jour: 2, inconnu: 3 }
  return [...list].sort((a, b) => {
    if (rank[a.statut] !== rank[b.statut]) return rank[a.statut] - rank[b.statut]
    const ja = a.joursRestant ?? 1e9
    const jb = b.joursRestant ?? 1e9
    return ja - jb
  })
}

/** Score de santé 0-100 dérivé des échéances. */
export function scoreSante(calcs: EcheanceCalc[]): { score: number; label: string } {
  const pertinents = calcs.filter((c) => c.statut !== 'inconnu')
  if (!pertinents.length) return { score: 100, label: 'À renseigner' }
  let score = 100
  for (const c of pertinents) {
    if (c.statut === 'en_retard') score -= 18
    else if (c.statut === 'bientot') score -= 6
  }
  score = Math.max(0, Math.min(100, score))
  const label =
    score >= 85 ? 'Bon état' :
    score >= 65 ? 'À surveiller' :
    score >= 40 ? 'Entretien à prévoir' : 'Action requise'
  return { score, label }
}

// ─── Coûts ───────────────────────────────────────────────────────────────────

export interface ResumeCouts {
  total: number
  parAn: number
  parKm: number | null
  parCategorie: { categorie: string; montant: number }[]
}

export function resumeCouts(v: Vehicule): ResumeCouts {
  const total = v.depenses.reduce((s, d) => s + (d.montant || 0), 0)
  // période couverte = de la première dépense à aujourd'hui
  const dates = v.depenses.map((d) => d.date).filter(Boolean).sort()
  let parAn = 0
  if (dates.length) {
    const j = Math.max(1, joursEntre(dates[0], todayISO()))
    parAn = total / (j / 365)
  }
  // km parcourus depuis la 1re dépense renseignée avec km
  const avecKm = v.depenses.filter((d) => d.km != null).sort((a, b) => (a.km! - b.km!))
  let parKm: number | null = null
  if (avecKm.length >= 1) {
    const kmMin = Math.min(...avecKm.map((d) => d.km!))
    const span = v.kmActuel - kmMin
    if (span > 0) parKm = total / span
  }
  const map = new Map<string, number>()
  for (const d of v.depenses) map.set(d.categorie, (map.get(d.categorie) || 0) + d.montant)
  const parCategorie = Array.from(map.entries())
    .map(([categorie, montant]) => ({ categorie, montant }))
    .sort((a, b) => b.montant - a.montant)
  return { total, parAn, parKm, parCategorie }
}

// ─── Persistance localStorage ────────────────────────────────────────────────

export function emptyState(): AutopulseState {
  return { vehicules: [], actifId: null, version: 1 }
}

export function loadState(): AutopulseState {
  if (typeof window === 'undefined') return emptyState()
  try {
    const raw = localStorage.getItem(LS_KEY)
    if (!raw) return emptyState()
    const parsed = JSON.parse(raw) as AutopulseState
    if (!parsed || !Array.isArray(parsed.vehicules)) return emptyState()
    return normalizeState(parsed)
  } catch {
    return emptyState()
  }
}

export function saveState(s: AutopulseState): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(s))
  } catch {
    /* quota — ignore */
  }
}

// ─── Prédiction d\'usure (consommables) ──────────────────────────────────────
// Modèle « durée de vie » (vs intervalle récurrent) : pneus, plaquettes, disques.
// Durées de vie indicatives, allongées pour BEV/hybride (freinage régénératif).

export function usuresParDefaut(carburant: Carburant): Usure[] {
  const regen = carburant === 'ELECTRIQUE' || carburant === 'HYBRIDE'
  const defs: { type: UsureType; label: string; km: number }[] = [
    { type: 'pneus', label: 'Pneus', km: 40000 },
    { type: 'plaquettes_av', label: 'Plaquettes avant', km: regen ? 60000 : 30000 },
    { type: 'plaquettes_ar', label: 'Plaquettes arrière', km: regen ? 80000 : 50000 },
    { type: 'disques', label: 'Disques de frein', km: regen ? 120000 : 80000 },
  ]
  return defs.map((d) => ({
    id: uid('usu'),
    type: d.type,
    label: d.label,
    installKm: 0,
    installDate: null,
    dureeVieKm: d.km,
  }))
}

export type StatutUsure = 'ok' | 'bientot' | 'remplacer' | 'inconnu'

export interface UsureCalc {
  usure: Usure
  usedKm: number | null
  restantKm: number | null
  pct: number | null            // % usé 0-100
  projDate: string | null       // remplacement projeté
  rythmeRapide: boolean         // s\'use plus vite que la moyenne attendue
  statut: StatutUsure
}

const SEUIL_USURE_PCT = 85      // « bientôt » au-delà de 85 % usé
const SEUIL_USURE_KM = 1500     // ou < 1500 km restants

export function calcUsure(v: Vehicule, u: Usure, now = todayISO()): UsureCalc {
  if (!u.installKm && !u.installDate) {
    return { usure: u, usedKm: null, restantKm: null, pct: null, projDate: null, rythmeRapide: false, statut: 'inconnu' }
  }
  const usedKm = Math.max(0, v.kmActuel - (u.installKm || 0))
  const restantKm = u.dureeVieKm - usedKm
  const pct = Math.max(0, Math.min(100, Math.round((usedKm / u.dureeVieKm) * 100)))
  const kmPerDay = v.kmParAn > 0 ? v.kmParAn / 365 : 0
  let projDate: string | null = null
  if (kmPerDay > 0 && restantKm > 0) {
    const d = new Date(now + 'T00:00:00')
    d.setDate(d.getDate() + Math.round(restantKm / kmPerDay))
    projDate = d.toISOString().slice(0, 10)
  }
  // rythme rapide : usure/an projetée > durée de vie / 3 ans de référence
  let rythmeRapide = false
  if (u.installDate && usedKm > 0) {
    const j = Math.max(1, joursEntre(u.installDate, now))
    const usurePAn = usedKm / (j / 365)
    rythmeRapide = usurePAn > u.dureeVieKm / 3
  }
  let statut: StatutUsure = 'ok'
  if (restantKm <= 0) statut = 'remplacer'
  else if (pct >= SEUIL_USURE_PCT || restantKm < SEUIL_USURE_KM) statut = 'bientot'
  return { usure: u, usedKm, restantKm, pct, projDate, rythmeRapide, statut }
}

// ─── Tendance des coûts (trimestre courant vs précédent) ─────────────────────

export interface TendanceCouts {
  categorie: string
  actuel: number
  precedent: number
  pct: number | null            // variation %
  hasData: boolean
}

function trimestreBornes(offset = 0): [string, string] {
  const now = new Date()
  const q = Math.floor(now.getMonth() / 3) - offset
  const year = now.getFullYear() + Math.floor(q / 4)
  const qq = ((q % 4) + 4) % 4
  const start = new Date(year, qq * 3, 1)
  const end = new Date(year, qq * 3 + 3, 0)
  return [start.toISOString().slice(0, 10), end.toISOString().slice(0, 10)]
}

export function tendanceCouts(v: Vehicule, categorie: Depense['categorie'] | 'Tous' = 'Carburant/Recharge'): TendanceCouts {
  const [s0, e0] = trimestreBornes(0)
  const [s1, e1] = trimestreBornes(1)
  const inRange = (d: Depense, a: string, b: string) => d.date >= a && d.date <= b
  const match = (d: Depense) => categorie === 'Tous' || d.categorie === categorie
  const sum = (a: string, b: string) =>
    v.depenses.filter((d) => match(d) && inRange(d, a, b)).reduce((s, d) => s + d.montant, 0)
  const actuel = sum(s0, e0)
  const precedent = sum(s1, e1)
  const pct = precedent > 0 ? Math.round(((actuel - precedent) / precedent) * 100) : null
  return { categorie: categorie === 'Tous' ? 'Toutes dépenses' : categorie, actuel, precedent, pct, hasData: actuel > 0 || precedent > 0 }
}

// ─── Export / Import (portabilité + sauvegarde) ──────────────────────────────

export function exportJSON(state: AutopulseState): string {
  return JSON.stringify({ ...state, exportedAt: new Date().toISOString(), app: 'moteurs-autopulse' }, null, 2)
}

export function importJSON(raw: string): AutopulseState | null {
  try {
    const p = JSON.parse(raw)
    if (!p || !Array.isArray(p.vehicules)) return null
    return normalizeState({ vehicules: p.vehicules, actifId: p.actifId ?? null, version: 1 })
  } catch {
    return null
  }
}

// ─── Normalisation (migration douce des états stockés) ───────────────────────

export function normalizeState(s: AutopulseState): AutopulseState {
  const vehicules = (s.vehicules || []).map((v) => ({
    ...v,
    echeances: Array.isArray(v.echeances) ? v.echeances : [],
    depenses: Array.isArray(v.depenses) ? v.depenses : [],
    usures: Array.isArray((v as Vehicule).usures) ? (v as Vehicule).usures : usuresParDefaut(v.carburant),
    historique: Array.isArray((v as Vehicule).historique) ? (v as Vehicule).historique : [],
  }))
  return { vehicules, actifId: s.actifId ?? vehicules[0]?.id ?? null, version: 1 }
}

// ─── Hook de synchronisation membres (Supabase) — prévu ──────────────────────
// Public d'abord (localStorage). Quand un membre est connecté (userId), on
// pourra pousser/tirer l'état vers une table `autopulse_vehicules`.
// Stubs volontairement no-op tant que la table n'existe pas côté Supabase.

export async function syncRemote(_userId: string, _state: AutopulseState): Promise<boolean> {
  // TODO(member-sync): upsert vers Supabase table `autopulse_garage` (user_id, state jsonb).
  // Laisser en no-op tant que la migration n'est pas livrée — la persistance
  // localStorage reste la source de vérité.
  return false
}

export async function pullRemote(_userId: string): Promise<AutopulseState | null> {
  // TODO(member-sync): select state depuis Supabase et merger avec le local.
  return null
}
