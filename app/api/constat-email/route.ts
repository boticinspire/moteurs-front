/**
 * Moteurs.com — API route constat email
 * Reçoit { email, constat } et envoie le résumé :
 *   - via le SMTP de l'hébergeur (lib/mailer-constat.ts) si SMTP_* est configuré
 *   - sinon repli sur la Supabase Edge Function `constat-email`
 */

import { NextRequest, NextResponse } from 'next/server'
import { smtpConfigured } from '@/lib/mailer-devis'
import { sendConstatEmail } from '@/lib/mailer-constat'
import { allow, clientIp } from '@/lib/rate-limit'

export const runtime = 'nodejs'

const SUPABASE_URL      = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function POST(req: NextRequest) {
  let body: { email?: string; constat?: unknown } | null = null
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Corps JSON invalide' }, { status: 400 })
  }

  const email = typeof body?.email === 'string' ? body.email.trim().slice(0, 200) : ''
  if (!email || !EMAIL_RE.test(email) || !body?.constat || typeof body.constat !== 'object') {
    return NextResponse.json({ error: 'Champs email et constat requis' }, { status: 400 })
  }

  if (!allow(`constat:${clientIp(req.headers)}`, 5)) {
    return NextResponse.json({ error: 'Trop d’envois — réessayez dans une heure.' }, { status: 429 })
  }

  if (smtpConfigured()) {
    try {
      await sendConstatEmail(email, body.constat as Record<string, unknown>)
      return NextResponse.json({ success: true })
    } catch (err) {
      console.error('[constat-email] SMTP:', err)
      return NextResponse.json({ error: 'Envoi impossible pour le moment.' }, { status: 502 })
    }
  }

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return NextResponse.json({ error: 'Envoi email non configuré' }, { status: 500 })
  }
  try {
    const res = await fetch(`${SUPABASE_URL}/functions/v1/constat-email`, {
      method:  'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({ email, constat: body.constat }),
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
