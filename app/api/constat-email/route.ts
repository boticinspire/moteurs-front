/**
 * Moteurs.com — API route constat email
 * Reçoit { email, constat } et appelle la Supabase Edge Function `constat-email`.
 */

import { NextRequest, NextResponse } from 'next/server'

const SUPABASE_URL      = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''

export async function POST(req: NextRequest) {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return NextResponse.json({ error: 'Supabase non configuré' }, { status: 500 })
  }

  let body: { email?: string; constat?: unknown } | null = null
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Corps JSON invalide' }, { status: 400 })
  }

  if (!body?.email || !body?.constat) {
    return NextResponse.json({ error: 'Champs email et constat requis' }, { status: 400 })
  }

  try {
    const res = await fetch(`${SUPABASE_URL}/functions/v1/constat-email`, {
      method:  'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({ email: body.email, constat: body.constat }),
    })

    const data = await res.json().catch(() => ({}))

    if (!res.ok) {
      return NextResponse.json(
        { error: data.error ?? `Supabase Edge Function HTTP ${res.status}` },
        { status: res.status }
      )
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: `Erreur serveur: ${msg}` }, { status: 500 })
  }
}
