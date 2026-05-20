/**
 * Moteurs.com — Proxy ORS server-side
 * Évite le blocage CORS du free tier ORS quand appelé depuis le navigateur.
 * Le navigateur appelle /api/ors (même domaine), le serveur appelle ORS.
 */

import { NextRequest, NextResponse } from 'next/server'

const ORS_KEY  = process.env.NEXT_PUBLIC_ORS_API_KEY  ?? ''
const ORS_BASE = process.env.NEXT_PUBLIC_ORS_BASE_URL ?? 'https://api.openrouteservice.org'

export async function POST(req: NextRequest) {
  if (!ORS_KEY) {
    return NextResponse.json({ error: 'ORS API key manquante' }, { status: 500 })
  }

  const body = await req.json().catch(() => null)
  if (!body?.action) {
    return NextResponse.json({ error: 'action manquante' }, { status: 400 })
  }

  // ── Géocodage : nom de ville → coordonnées ──────────────────────────────
  if (body.action === 'geocode') {
    const text = String(body.text ?? '').trim()
    if (!text) return NextResponse.json({ error: 'text vide' }, { status: 400 })

    const url = new URL(`${ORS_BASE}/geocode/search`)
    url.searchParams.set('api_key', ORS_KEY)
    url.searchParams.set('text', text)
    const size = Math.min(10, Math.max(1, Number(body.size ?? 1)))
    url.searchParams.set('size', String(size))
    url.searchParams.set('layers', 'locality,region,localadmin')
    // Filtre pays : restreint la recherche pour éviter Stuttgart Arkansas etc.
    const country = typeof body.country === 'string' ? body.country.trim() : ''
    if (country) url.searchParams.set('boundary.country', country)

    try {
      const res  = await fetch(url.toString())
      const data = await res.json()
      return NextResponse.json(data, { status: res.status })
    } catch (err) {
      console.error('[/api/ors] geocode erreur', err)
      return NextResponse.json({ error: 'ORS geocode indisponible' }, { status: 502 })
    }
  }

  // ── Itinéraire : coordonnées → distance + durée ──────────────────────────
  if (body.action === 'directions') {
    const { coordinates, preference = 'recommended' } = body
    if (!Array.isArray(coordinates) || coordinates.length < 2) {
      return NextResponse.json({ error: 'coordinates invalides' }, { status: 400 })
    }

    try {
      const res = await fetch(`${ORS_BASE}/v2/directions/driving-car/geojson`, {
        method:  'POST',
        headers: {
          Authorization:   ORS_KEY,
          'Content-Type':  'application/json',
          // ORS /geojson exige application/geo+json — sinon retourne 406 Not Acceptable
          Accept:          'application/geo+json, application/json',
        },
        body: JSON.stringify({ coordinates, preference }),
      })
      if (!res.ok) {
        // Log + remonter pour faciliter le diagnostic côté client
        const errBody = await res.text().catch(() => '')
        console.error('[/api/ors] directions échec', res.status, errBody.slice(0, 300))
        return NextResponse.json(
          { error: `ORS directions HTTP ${res.status}`, detail: errBody.slice(0, 200) },
          { status: res.status }
        )
      }
      const data = await res.json()
      return NextResponse.json(data, { status: res.status })
    } catch (err) {
      console.error('[/api/ors] directions erreur', err)
      return NextResponse.json({ error: 'ORS directions indisponible' }, { status: 502 })
    }
  }

  return NextResponse.json({ error: `action inconnue: ${body.action}` }, { status: 400 })
}
