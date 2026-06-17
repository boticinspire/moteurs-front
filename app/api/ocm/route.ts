/**
 * Moteurs.com — Proxy API OpenChargeMap
 * Évite les erreurs CORS côté navigateur.
 * GET /api/ocm?lat=...&lng=...&radius=...&maxresults=...
 */

import { NextRequest, NextResponse } from 'next/server'

const OCM_KEY = process.env.OCM_API_KEY ?? ''
const OCM_BASE = 'https://api.openchargemap.io/v3/poi'

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl

  // Paramètres transmis au proxy
  const lat        = searchParams.get('lat')
  const lng        = searchParams.get('lng')
  const radius     = searchParams.get('radius') ?? '10'
  const maxresults = searchParams.get('maxresults') ?? '100'

  if (!lat || !lng) {
    return NextResponse.json({ error: 'Paramètres lat et lng requis' }, { status: 400 })
  }

  const params = new URLSearchParams({
    latitude:   lat,
    longitude:  lng,
    distance:   radius,
    distanceunit: 'km',
    maxresults,
    compact:    'true',
    verbose:    'false',
    output:     'json',
    ...(OCM_KEY ? { key: OCM_KEY } : {}),
  })

  try {
    const ctrl = new AbortController()
    const to = setTimeout(() => ctrl.abort(), 12000)
    const res = await fetch(`${OCM_BASE}?${params.toString()}`, {
      headers: { 'Accept': 'application/json' },
      next: { revalidate: 3600 },   // cache 1h côté serveur
      signal: ctrl.signal,
    }).finally(() => clearTimeout(to))

    if (!res.ok) {
      return NextResponse.json(
        { error: `OpenChargeMap HTTP ${res.status}` },
        { status: res.status }
      )
    }

    const data = await res.json()
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200',
      },
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: `Erreur serveur: ${msg}` }, { status: 500 })
  }
}
