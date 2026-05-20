/**
 * Moteurs.com — Client OpenRouteService (via proxy /api/ors)
 * Les appels passent par notre route API Next.js pour éviter le CORS du free tier ORS.
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ORSCoordonnees {
  lon:        number
  lat:        number
  label:      string
  /** Confidence Pelias (0-1). 1.0 = exact, ≥0.8 = haute, ≥0.5 = moyenne, <0.5 = faible/interpolée. */
  confidence: number
  /** Type de match Pelias : 'exact', 'fallback', 'interpolated'. Sert à filtrer le cache. */
  match_type: string
}

export interface ORSItineraire {
  distance_km: number
  duree_min:   number
  /** Géométrie GeoJSON LineString — tableau de [lon, lat]. Vide si non récupérée. */
  geometry:    Array<[number, number]>
}

export type ORSProfil = 'recommended' | 'fastest' | 'shortest'

// ─── Géocodage ────────────────────────────────────────────────────────────────

/**
 * Filtre pays par défaut (ISO 3166-1 alpha-3, comma-separated).
 * Évite que "Stuttgart" résolve à Stuttgart, Arkansas ou "Verona" à Verona, NJ.
 */
const DEFAULT_BOUNDARY_COUNTRIES =
  'FRA,BEL,CHE,LUX,DEU,ITA,ESP,PRT,AUT,NLD,GBR,IRL,MCO,SMR,VAT,LIE,AND,CAN,DNK,SWE,NOR,FIN,POL,CZE,HUN,SVK,SVN,HRV'

export async function geocoderVille(
  texte: string,
  paysCode?: string | null,
): Promise<ORSCoordonnees | null> {
  try {
    const res = await fetch('/api/ors', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({
        action:  'geocode',
        text:    texte,
        country: paysCode ?? DEFAULT_BOUNDARY_COUNTRIES,
      }),
    })
    if (!res.ok) {
      console.error('[ORS] Geocode HTTP', res.status, texte)
      return null
    }
    const data = await res.json()
    const feature = data.features?.[0]
    if (!feature) return null
    const [lon, lat] = feature.geometry.coordinates as [number, number]
    const props = feature.properties as { label: string; confidence?: number; match_type?: string }
    return {
      lon, lat,
      label:      props.label,
      confidence: typeof props.confidence === 'number' ? props.confidence : 0.5,
      match_type: props.match_type ?? 'unknown',
    }
  } catch (err) {
    console.error('[ORS] Geocode erreur', err)
    return null
  }
}

// ─── Géocodage : N candidats (pour l'autocomplete) ────────────────────────────

export async function geocoderCandidats(
  texte:    string,
  options?: { max?: number; paysCode?: string | null },
): Promise<ORSCoordonnees[]> {
  const max = Math.min(15, Math.max(1, options?.max ?? 8))
  try {
    const res = await fetch('/api/ors', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({
        action:  'geocode',
        mode:    'autocomplete',  // endpoint Pelias optimisé type-ahead (cite mieux les communes)
        text:    texte,
        size:    max,
        country: options?.paysCode ?? DEFAULT_BOUNDARY_COUNTRIES,
      }),
    })
    if (!res.ok) return []
    const data = await res.json()
    const features = (data.features ?? []) as Array<{
      geometry:   { coordinates: [number, number] }
      properties: { label: string; confidence?: number; match_type?: string }
    }>
    return features.map(f => {
      const [lon, lat] = f.geometry.coordinates
      const props = f.properties
      return {
        lon, lat,
        label:      props.label,
        confidence: typeof props.confidence === 'number' ? props.confidence : 0.5,
        match_type: props.match_type ?? 'unknown',
      }
    })
  } catch (err) {
    console.error('[ORS] geocoderCandidats erreur', err)
    return []
  }
}

// ─── Itinéraire ───────────────────────────────────────────────────────────────

export async function calculerRoute(
  depart:  ORSCoordonnees,
  arrivee: ORSCoordonnees,
  profil:  ORSProfil = 'recommended',
): Promise<ORSItineraire | null> {
  try {
    const res = await fetch('/api/ors', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({
        action:      'directions',
        coordinates: [[depart.lon, depart.lat], [arrivee.lon, arrivee.lat]],
        preference:  profil,
      }),
    })
    if (!res.ok) {
      console.error('[ORS] Directions HTTP', res.status)
      return null
    }
    const data    = await res.json()
    // Réponse GeoJSON : { features: [{ geometry: {coordinates}, properties: {summary} }] }
    const feature = data.features?.[0]
    const summary = feature?.properties?.summary
    if (!summary) return null
    const coords  = (feature?.geometry?.coordinates ?? []) as Array<[number, number]>
    return {
      distance_km: Math.round(summary.distance / 1000),
      duree_min:   Math.round(summary.duration  / 60),
      geometry:    coords,
    }
  } catch (err) {
    console.error('[ORS] Directions erreur', err)
    return null
  }
}

// ─── Helper tout-en-un ────────────────────────────────────────────────────────

export async function geocoderEtCalculer(
  nomDepart:  string,
  nomArrivee: string,
  profil: ORSProfil = 'recommended',
  paysCodes?: { depart?: string | null; arrivee?: string | null },
): Promise<{
  itineraire:   ORSItineraire
  coordDepart:  ORSCoordonnees
  coordArrivee: ORSCoordonnees
} | null> {
  const [coordDepart, coordArrivee] = await Promise.all([
    geocoderVille(nomDepart,  paysCodes?.depart),
    geocoderVille(nomArrivee, paysCodes?.arrivee),
  ])

  if (!coordDepart || !coordArrivee) {
    console.error('[ORS] Geocodage échoué', { nomDepart, nomArrivee, coordDepart, coordArrivee })
    return null
  }

  const itineraire = await calculerRoute(coordDepart, coordArrivee, profil)
  if (!itineraire) return null

  return { itineraire, coordDepart, coordArrivee }
}
