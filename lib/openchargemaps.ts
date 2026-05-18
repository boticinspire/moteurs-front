/**
 * Moteurs.com — Client OpenChargeMap
 * Récupère les stations de recharge électrique le long d'un trajet.
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Coords {
  lat: number
  lng: number
}

export interface Station {
  id: number
  nom: string
  adresse: string
  ville: string
  pays: string
  coords: Coords
  nb_points: number
  puissance_max_kw: number
  operateur?: string
  acces: 'public' | 'payant' | 'inconnu'
  types_prise: string[]
  derniere_verification?: string
  statut: 'operationnel' | 'inconnu' | 'hors_service'
  distance_depart_km?: number  // distance du point de départ du trajet
}

// ─── Parseur de réponse OCM ───────────────────────────────────────────────────

function parseOCMStation(raw: Record<string, unknown>): Station | null {
  try {
    const addr = raw.AddressInfo as Record<string, unknown>
    if (!addr) return null

    const lat = Number(addr.Latitude)
    const lng = Number(addr.Longitude)
    if (!lat || !lng) return null

    // Puissance max parmi les connexions
    const connections = (raw.Connections ?? []) as Record<string, unknown>[]
    let puissance_max_kw = 0
    const types = new Set<string>()

    for (const conn of connections) {
      const kw = Number(conn.PowerKW ?? 0)
      if (kw > puissance_max_kw) puissance_max_kw = kw

      // Type de prise
      const ct = conn.ConnectionType as Record<string, unknown> | undefined
      if (ct?.Title) types.add(String(ct.Title))
    }

    // Opérateur
    const op = raw.OperatorInfo as Record<string, unknown> | undefined
    const operateur = op?.Title ? String(op.Title) : undefined

    // Statut
    const statusType = raw.StatusType as Record<string, unknown> | undefined
    let statut: Station['statut'] = 'inconnu'
    if (statusType) {
      const isOp = statusType.IsOperational
      if (isOp === true) statut = 'operationnel'
      else if (isOp === false) statut = 'hors_service'
    }

    // Accès
    let acces: Station['acces'] = 'inconnu'
    const usageType = raw.UsageType as Record<string, unknown> | undefined
    if (usageType) {
      const t = String(usageType.Title ?? '').toLowerCase()
      if (t.includes('public')) acces = 'public'
      else if (t.includes('pay') || t.includes('payant') || t.includes('membership')) acces = 'payant'
    }

    return {
      id: Number(raw.ID),
      nom: String(addr.Title ?? 'Station inconnue'),
      adresse: String(addr.AddressLine1 ?? ''),
      ville: String(addr.Town ?? addr.StateOrProvince ?? ''),
      pays: String(addr.Country ? (addr.Country as Record<string, unknown>).ISOCode ?? '' : ''),
      coords: { lat, lng },
      nb_points: connections.length || 1,
      puissance_max_kw: Math.round(puissance_max_kw),
      operateur,
      acces,
      types_prise: Array.from(types).slice(0, 4),
      derniere_verification: raw.DateLastVerified ? String(raw.DateLastVerified) : undefined,
      statut,
    }
  } catch {
    return null
  }
}

// ─── Interpolation de points le long d'un trajet ─────────────────────────────

function interpolatePoints(start: Coords, end: Coords, n: number): Coords[] {
  const points: Coords[] = []
  for (let i = 0; i <= n; i++) {
    const t = i / n
    points.push({
      lat: start.lat + (end.lat - start.lat) * t,
      lng: start.lng + (end.lng - start.lng) * t,
    })
  }
  return points
}

// ─── Distance haversine (en km) ───────────────────────────────────────────────

export function haversineKm(a: Coords, b: Coords): number {
  const R = 6371
  const dLat = ((b.lat - a.lat) * Math.PI) / 180
  const dLng = ((b.lng - a.lng) * Math.PI) / 180
  const sinLat = Math.sin(dLat / 2)
  const sinLng = Math.sin(dLng / 2)
  const c =
    sinLat * sinLat +
    Math.cos((a.lat * Math.PI) / 180) *
    Math.cos((b.lat * Math.PI) / 180) *
    sinLng * sinLng
  return R * 2 * Math.atan2(Math.sqrt(c), Math.sqrt(1 - c))
}

// ─── Requête OCM pour un point ────────────────────────────────────────────────

async function fetchStationsAroundPoint(
  point: Coords,
  radius: number,
  maxresults = 50
): Promise<Station[]> {
  const params = new URLSearchParams({
    lat: String(point.lat),
    lng: String(point.lng),
    radius: String(radius),
    maxresults: String(maxresults),
  })

  const res = await fetch(`/api/ocm?${params.toString()}`)
  if (!res.ok) return []

  const data = await res.json()
  if (!Array.isArray(data)) return []

  return data
    .map((raw: Record<string, unknown>) => parseOCMStation(raw))
    .filter((s): s is Station => s !== null)
}

// ─── Fonction principale — stations le long d'un trajet ──────────────────────

export async function fetchStationsAlongRoute(
  start: Coords,
  end: Coords,
  options: {
    radius?: number      // km autour de chaque point d'interpolation (défaut 10)
    nbPoints?: number    // nombre de points intermédiaires (défaut 4)
  } = {}
): Promise<Station[]> {
  const radius = options.radius ?? 10
  const nbPoints = options.nbPoints ?? 4

  const points = interpolatePoints(start, end, nbPoints)

  // Requêtes parallèles (une par point d'interpolation)
  const results = await Promise.allSettled(
    points.map(p => fetchStationsAroundPoint(p, radius, 80))
  )

  // Fusionner et dédupliquer par ID
  const map = new Map<number, Station>()
  for (const result of results) {
    if (result.status === 'fulfilled') {
      for (const station of result.value) {
        if (!map.has(station.id)) {
          // Calculer la distance depuis le départ
          station.distance_depart_km = Math.round(haversineKm(start, station.coords))
          map.set(station.id, station)
        }
      }
    }
  }

  // Trier par distance depuis le départ
  return Array.from(map.values()).sort(
    (a, b) => (a.distance_depart_km ?? 0) - (b.distance_depart_km ?? 0)
  )
}

// ─── Filtres ──────────────────────────────────────────────────────────────────

export type FiltrePuissance = 'tous' | '22' | '50' | '150'

export function filtrerStations(
  stations: Station[],
  options: {
    puissance?: FiltrePuissance
    operateur?: string
    distanceMax?: number  // km depuis le départ
    sansHorsService?: boolean
  }
): Station[] {
  return stations.filter(s => {
    // Filtre puissance
    if (options.puissance && options.puissance !== 'tous') {
      const kw = Number(options.puissance)
      if (s.puissance_max_kw < kw) return false
    }

    // Filtre opérateur
    if (options.operateur && options.operateur !== 'tous') {
      if (!s.operateur?.toLowerCase().includes(options.operateur.toLowerCase())) return false
    }

    // Filtre distance
    if (options.distanceMax !== undefined) {
      if ((s.distance_depart_km ?? 0) > options.distanceMax) return false
    }

    // Exclure hors service
    if (options.sansHorsService && s.statut === 'hors_service') return false

    return true
  })
}

// ─── Badge puissance ─────────────────────────────────────────────────────────

export function badgePuissance(kw: number): { label: string; couleur: string } {
  if (kw >= 150) return { label: '⚡ DC 150+ kW', couleur: '#7c3aed' }
  if (kw >= 50)  return { label: '⚡ DC 50 kW',   couleur: '#2563eb' }
  if (kw >= 22)  return { label: '⚡ AC 22 kW',   couleur: '#0891b2' }
  if (kw > 0)    return { label: `${kw} kW`,      couleur: '#6b7280' }
  return              { label: 'Puissance ?',     couleur: '#9ca3af' }
}
