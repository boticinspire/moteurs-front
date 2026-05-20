/**
 * Moteurs.com — Client OpenRouteService (via proxy /api/ors)
 * Les appels passent par notre route API Next.js pour éviter le CORS du free tier ORS.
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ORSCoordonnees {
  lon:   number
  lat:   number
  label: string
}

export interface ORSItineraire {
  distance_km: number
  duree_min:   number
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
    return { lon, lat, label: feature.properties.label as string }
  } catch (err) {
    console.error('[ORS] Geocode erreur', err)
    return null
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
    const summary = data.routes?.[0]?.summary
    if (!summary) return null
    return {
      distance_km: Math.round(summary.distance / 1000),
      duree_min:   Math.round(summary.duration  / 60),
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
