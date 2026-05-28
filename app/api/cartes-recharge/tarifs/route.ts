/**
 * GET /api/cartes-recharge/tarifs?pays=FR&carte_id=&devise=
 *
 * Proxy Next.js → Railway /recharge/tarifs.
 * Tous les filtres sont optionnels, transmis tels quels à l'orchestrateur.
 * Cache 1h (les tarifs ne bougent pas plus d'une fois par semaine).
 */
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const RAILWAY_URL = 'https://orchestrateur-production.up.railway.app/recharge/tarifs'

export const revalidate = 3600

export async function GET(req: Request) {
  try {
    const { search } = new URL(req.url)
    const target = `${RAILWAY_URL}${search}`
    const res = await fetch(target, {
      next: { revalidate: 3600 },
      headers: { Accept: 'application/json' },
    })
    if (!res.ok) throw new Error(`Railway ${res.status}`)
    const data = await res.json()
    return NextResponse.json(data)
  } catch (e) {
    console.error('[API cartes-recharge/tarifs] Erreur fetch Railway:', e)
    return NextResponse.json({ nb: 0, tarifs: [] })
  }
}
