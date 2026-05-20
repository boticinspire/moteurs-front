/**
 * Moteurs.com — Cache Supabase pour les trajets ORS
 * Évite de reconsommer des requêtes ORS pour des trajets déjà calculés.
 * Stocke aussi les coordonnées pour pouvoir recalculer sans re-géocoder.
 */

import { createClient } from '@supabase/supabase-js'
import type { ORSCoordonnees, ORSItineraire } from './openrouteservice'

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
)

// ─── Types ────────────────────────────────────────────────────────────────────

export interface TrajetCache {
  id:            number
  depart:        string
  arrivee:       string
  depart_norm:   string
  arrivee_norm:  string
  lon_depart:    number | null
  lat_depart:    number | null
  lon_arrivee:   number | null
  lat_arrivee:   number | null
  distance_km:   number
  duree_base_min: number
  peages_eur:    number
  nb_requetes:   number
  created_at:    string
  last_used:     string
}

// ─── Normalisation ────────────────────────────────────────────────────────────

/** Normalise un nom de ville pour la comparaison (sans accents, minuscules) */
export function normaliserVille(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9 -]/g, '')
    .trim()
}

// ─── Lecture cache ────────────────────────────────────────────────────────────

/**
 * Cherche un trajet dans le cache (dans les 2 sens).
 * Si trouvé, incrémente nb_requetes + met à jour last_used.
 */
export async function getRouteFromCache(
  depart: string,
  arrivee: string,
): Promise<TrajetCache | null> {
  const nd = normaliserVille(depart)
  const na = normaliserVille(arrivee)
  if (!nd || !na) return null

  // Cherche dans les 2 sens
  const { data, error } = await sb
    .from('trajets_cache')
    .select('*')
    .or(
      `and(depart_norm.eq.${nd},arrivee_norm.eq.${na}),` +
      `and(depart_norm.eq.${na},arrivee_norm.eq.${nd})`,
    )
    .limit(1)
    .maybeSingle()   // retourne null (pas d'erreur) si 0 résultats

  if (error || !data) return null

  // Mise à jour silencieuse des stats (fire & forget)
  sb.from('trajets_cache')
    .update({
      nb_requetes: data.nb_requetes + 1,
      last_used: new Date().toISOString(),
    })
    .eq('id', data.id)
    .then(() => {})

  return data as TrajetCache
}

// ─── Écriture cache ───────────────────────────────────────────────────────────

export interface SaveRouteCacheParams {
  depart:      string
  arrivee:     string
  coordDepart:  ORSCoordonnees
  coordArrivee: ORSCoordonnees
  itineraire:  ORSItineraire
  peages_eur?: number
}

/**
 * Enregistre un itinéraire ORS dans le cache.
 * Utilise upsert pour éviter les doublons (contrainte UNIQUE sur depart_norm/arrivee_norm).
 *
 * ⚠ Refuse la sauvegarde si la confiance du géocodage est trop basse (< 0,8) ou
 * si le match n'est pas exact, pour ne pas polluer le cache avec des villes
 * mal saisies. Le calcul de trajet, lui, reste affiché à l'utilisateur courant.
 */
const MIN_CONFIDENCE_FOR_CACHE = 0.8

export async function saveRouteToCache(params: SaveRouteCacheParams): Promise<void> {
  const {
    depart, arrivee,
    coordDepart, coordArrivee,
    itineraire,
    peages_eur = 0,
  } = params

  // Garde-fou anti-pollution : on ne cache que les trajets dont les deux villes
  // ont été identifiées avec haute confiance par Pelias/ORS.
  const cD = coordDepart.confidence ?? 0
  const cA = coordArrivee.confidence ?? 0
  if (cD < MIN_CONFIDENCE_FOR_CACHE || cA < MIN_CONFIDENCE_FOR_CACHE) {
    console.warn(
      `[TrajetCache] Sauvegarde ignorée : confiance trop basse ` +
      `(départ=${cD.toFixed(2)}, arrivée=${cA.toFixed(2)}). ` +
      `Saisies : "${depart}" → "${arrivee}". ` +
      `Résolus : "${coordDepart.label}" → "${coordArrivee.label}".`
    )
    return
  }

  const row = {
    depart,
    arrivee,
    depart_norm:   normaliserVille(depart),
    arrivee_norm:  normaliserVille(arrivee),
    lon_depart:    coordDepart.lon,
    lat_depart:    coordDepart.lat,
    lon_arrivee:   coordArrivee.lon,
    lat_arrivee:   coordArrivee.lat,
    distance_km:   itineraire.distance_km,
    duree_base_min: itineraire.duree_min,
    peages_eur,
    nb_requetes: 1,
    last_used: new Date().toISOString(),
  }

  const { error } = await sb
    .from('trajets_cache')
    .upsert(row, { onConflict: 'depart_norm,arrivee_norm', ignoreDuplicates: false })

  if (error) {
    console.error('[TrajetCache] Erreur upsert', error.message)
  }
}

// ─── Stats ────────────────────────────────────────────────────────────────────

/** Retourne les N trajets les plus demandés (pour enrichir routes-vacances.json) */
export async function getTopTrajets(limit = 20): Promise<TrajetCache[]> {
  const { data } = await sb
    .from('trajets_cache')
    .select('*')
    .order('nb_requetes', { ascending: false })
    .limit(limit)
  return (data ?? []) as TrajetCache[]
}
