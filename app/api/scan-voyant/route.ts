/**
 * Moteurs.com — Proxy scan voyant
 * Reçoit { image_base64, mime_type } du navigateur
 * et le transmet à l'orchestrateur Railway qui appelle Claude Vision.
 */

import { NextRequest, NextResponse } from 'next/server'

const ORCHESTRATEUR_URL =
  process.env.ORCHESTRATEUR_URL ?? 'https://orchestrateur-production.up.railway.app'

export async function POST(req: NextRequest) {
  let body: { image_base64?: string; mime_type?: string } | null = null
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Corps de requête JSON invalide' }, { status: 400 })
  }

  if (!body?.image_base64) {
    return NextResponse.json({ error: 'Champ image_base64 manquant' }, { status: 400 })
  }

  try {
    const res = await fetch(`${ORCHESTRATEUR_URL}/depannage/scan-voyant`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({
        image_base64: body.image_base64,
        mime_type:    body.mime_type ?? 'image/jpeg',
      }),
    })

    const data = await res.json()

    if (!res.ok) {
      return NextResponse.json(
        { error: data.detail ?? `Erreur orchestrateur HTTP ${res.status}` },
        { status: res.status }
      )
    }

    return NextResponse.json(data)
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[/api/scan-voyant]', msg)
    return NextResponse.json({ error: `Erreur serveur: ${msg}` }, { status: 500 })
  }
}
