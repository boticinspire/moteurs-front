import { NextResponse } from 'next/server'

/**
 * Proxy Next.js → Railway pour le classement des cartes de recharge les moins
 * chères dans un pays donné et un type de borne donné.
 *
 *   GET /api/recharge/comparer/FR?type_borne=dc_ultra
 *     → { pays, type_borne, nb, classement: [{ rang, carte_id, nom, operateur,
 *         devise, prix_kwh, abo_mensuel }] }
 *
 * Évite le CORS et met en cache 1h côté serveur Next.
 * Utilisé par le « Simulateur de facture de recharge ».
 */

const RAILWAY = 'https://orchestrateur-production.up.railway.app'
const TYPES_VALIDES = new Set(['ac_slow', 'dc_rapide', 'dc_ultra'])

export const revalidate = 3600 // cache 1h

export async function GET(
  request: Request,
  { params }: { params: Promise<{ pays: string }> },
) {
  const { pays } = await params
  const paysIso = (pays || 'FR').toUpperCase().slice(0, 2)

  const url = new URL(request.url)
  const typeBorne = url.searchParams.get('type_borne') ?? 'dc_ultra'
  const type = TYPES_VALIDES.has(typeBorne) ? typeBorne : 'dc_ultra'

  try {
    const res = await fetch(
      `${RAILWAY}/recharge/tarifs/comparer/${encodeURIComponent(paysIso)}?type_borne=${type}`,
      { next: { revalidate: 3600 }, headers: { Accept: 'application/json' } },
    )
    if (!res.ok) throw new Error(`Railway ${res.status}`)
    const data = await res.json()
    return NextResponse.json(data)
  } catch (e) {
    console.error('[API recharge/comparer] Erreur fetch Railway:', e)
    return NextResponse.json({ pays: paysIso, type_borne: type, nb: 0, classement: [] })
  }
}
