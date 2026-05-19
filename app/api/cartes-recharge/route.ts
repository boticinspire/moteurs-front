import { NextResponse } from 'next/server'

const RAILWAY_URL = 'https://orchestrateur-production.up.railway.app/recharge/cartes'

export const revalidate = 3600 // cache 1h

export async function GET() {
  try {
    const res = await fetch(RAILWAY_URL, {
      next: { revalidate: 3600 },
      headers: { 'Accept': 'application/json' },
    })
    if (!res.ok) throw new Error(`Railway ${res.status}`)
    const data = await res.json()
    return NextResponse.json(data)
  } catch (e) {
    console.error('[API cartes-recharge] Erreur fetch Railway:', e)
    return NextResponse.json({ nb: 0, cartes: [] })
  }
}
