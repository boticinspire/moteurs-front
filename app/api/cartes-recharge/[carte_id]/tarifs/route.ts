/**
 * GET /api/cartes-recharge/[carte_id]/tarifs
 *
 * Proxy Next.js → Railway /recharge/cartes/{carte_id}/tarifs.
 * Retourne tous les tarifs pays pour une carte donnée.
 * Cache 1h.
 */
import { NextResponse } from 'next/server'

export const revalidate = 3600

export async function GET(
  _req: Request,
  context: { params: Promise<{ carte_id: string }> }
) {
  const { carte_id } = await context.params
  const url = `https://orchestrateur-production.up.railway.app/recharge/cartes/${encodeURIComponent(carte_id)}/tarifs`

  try {
    const res = await fetch(url, {
      next: { revalidate: 3600 },
      headers: { Accept: 'application/json' },
    })
    if (!res.ok) throw new Error(`Railway ${res.status}`)
    const data = await res.json()
    return NextResponse.json(data)
  } catch (e) {
    console.error(`[API cartes-recharge/${carte_id}/tarifs] Erreur fetch Railway:`, e)
    return NextResponse.json({ carte_id, nb: 0, tarifs: [] })
  }
}
