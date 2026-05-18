/**
 * Moteurs.com — Client OpenRouteService
 * Geocodage ville → coordonnées + calcul itinéraire driving-car
 */

const ORS_KEY  = process.env.NEXT_PUBLIC_ORS_API_KEY  ?? ''
const ORS_BASE = process.env.NEXT_PUBLIC_ORS_BASE_URL ?? 'https://api.openrouteservice.org'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ORSCoordonnees {
  lon:   number
  lat:   number
  label: string  // nom de lieu tel que retourné par ORS
}

export interface ORSItineraire {
  distance_km:    number
  duree_min:      number
}

export type ORSProfil = 'recommended' | 'fastest' | 'shortest'

// ─── Geocodage ────────────────────────────────────────────────────────────────

/**
 * Transforme un nom de ville en coordonnées GPS.
 * Retourne null si la ville n'est pas trouvée ou en cas d'erreur réseau.
 */
export async function geocoderVille(texte: string): Promise<ORSCoordonnees | null> {
  if (!ORS_KEY) {
    console.error('[ORS] NEXT_PUBLIC_ORS_API_KEY manquante')
    return null
  }
  try {
    const url = new URL(`${ORS_BASE}/geocode/search`)
    url.searchParams.set('api_key', ORS_KEY)
    url.searchParams.set('text', texte)
    url.searchParams.set('size', '1')
    url.searchParams.set('layers', 'locality,region,localadmin')

    const res = await fetch(url.toString())
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

/**
 * Calcule la distance et durée entre deux points GPS.
 * profil : 'recommended' (défaut) | 'fastest' | 'shortest'
 */
export async function calculerRoute(
  depart:  ORSCoordonnees,
  arrivee: ORSCoordonnees,
  profil:  ORSProfil = 'recommended',
): Promise<ORSItineraire | null> {
  if (!ORS_KEY) {
    console.error('[ORS] NEXT_PUBLIC_ORS_API_KEY manquante')
    return null
  }
  try {
    const res = await fetch(`${ORS_BASE}/v2/directions/driving-car`, {
      method: 'POST',
      headers: {
        Authorization: ORS_KEY,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        coordinates: [
          [depart.lon,  depart.lat],
          [arrivee.lon, arrivee.lat],
        ],
        preference: profil,
      }),
    })

    if (!res.ok) {
      const text = await res.text().catch(() => '')
      console.error('[ORS] Directions HTTP', res.status, text)
      return null
    }

    const data = await res.json()
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

/**
 * Géocode les deux villes puis calcule l'itinéraire.
 * Retourne null si l'une des deux villes est introuvable ou en cas d'erreur ORS.
 */
export async function geocoderEtCalculer(
  nomDepart:  string,
  nomArrivee: string,
  profil: ORSProfil = 'recommended',
): Promise<{
  itineraire: ORSItineraire
  coordDepart:  ORSCoordonnees
  coordArrivee: ORSCoordonnees
} | null> {
  const [coordDepart, coordArrivee] = await Promise.all([
    geocoderVille(nomDepart),
    geocoderVille(nomArrivee),
  ])

  if (!coordDepart || !coordArrivee) {
    console.error('[ORS] Geocodage échoué', { nomDepart, nomArrivee, coordDepart, coordArrivee })
    return null
  }

  const itineraire = await calculerRoute(coordDepart, coordArrivee, profil)
  if (!itineraire) return null

  return { itineraire, coordDepart, coordArrivee }
}
