/**
 * Moteurs.com — API route demandes de devis / commande gabarits de soupape
 *
 * POST /api/devis-gabarits
 *   1. Valide le corps (nom, email obligatoires)
 *   2. Insère dans la table Supabase `demandes_gabarits`
 *      (RLS : insert autorisé à anon, lecture réservée au service role / admin)
 *   3. Déclenche l'Edge Function `devis-gabarits-email` (notification + accusé de réception)
 *   4. Retourne { success: true }
 */

import { NextRequest, NextResponse } from 'next/server'

const SUPABASE_URL      = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''
const SUPABASE_SERVICE  = process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''

interface DevisBody {
  nom: string
  email: string
  entreprise?: string | null
  pays?: string | null
  profil?: string | null
  diametre_tete?: string | null
  diametre_tige?: string | null
  angle_siege?: string | null
  quantite?: number
  moteur?: string | null
  message?: string | null
  langue?: string
  source_page?: string
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const clip = (v: unknown, n: number) => (typeof v === 'string' ? v.slice(0, n) : null)

export async function POST(req: NextRequest) {
  if (!SUPABASE_URL || !(SUPABASE_SERVICE || SUPABASE_ANON_KEY)) {
    return NextResponse.json({ error: 'Supabase non configuré' }, { status: 500 })
  }

  let body: DevisBody | null = null
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Corps JSON invalide' }, { status: 400 })
  }

  if (!body?.nom?.trim() || !body?.email?.trim() || !EMAIL_RE.test(body.email)) {
    return NextResponse.json({ error: 'Nom et email valides requis' }, { status: 400 })
  }

  const row = {
    nom:           clip(body.nom, 120),
    email:         clip(body.email, 200),
    entreprise:    clip(body.entreprise, 160),
    pays:          clip(body.pays, 8),
    profil:        clip(body.profil, 40),
    diametre_tete: clip(body.diametre_tete, 60),
    diametre_tige: clip(body.diametre_tige, 60),
    angle_siege:   clip(body.angle_siege, 20),
    quantite:      Number.isFinite(body.quantite) && (body.quantite as number) > 0 ? Math.min(Math.round(body.quantite as number), 999) : 1,
    moteur:        clip(body.moteur, 200),
    message:       clip(body.message, 4000),
    langue:        clip(body.langue, 5),
    source_page:   clip(body.source_page, 200),
    user_agent:    req.headers.get('user-agent')?.slice(0, 300) ?? null,
  }

  const key = SUPABASE_SERVICE || SUPABASE_ANON_KEY
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/demandes_gabarits`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: key,
        Authorization: `Bearer ${key}`,
        Prefer: 'return=minimal',
      },
      body: JSON.stringify(row),
    })
    if (!res.ok) {
      const data = await res.json().catch(() => null)
      const msg = (data && (data.message || data.error)) ?? `Supabase HTTP ${res.status}`
      return NextResponse.json({ error: msg }, { status: 502 })
    }
    // Notification email (interne + accusé de réception client) — fire & forget
    try {
      const fnKey = SUPABASE_ANON_KEY || key
      fetch(`${SUPABASE_URL}/functions/v1/devis-gabarits-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${fnKey}` },
        body: JSON.stringify(row),
      }).catch(err => console.error('[devis-gabarits] notification email:', err))
    } catch {}
    // return=minimal : la clé anon n'a pas de droit SELECT (RLS) — on ne renvoie pas l'id
    return NextResponse.json({ success: true })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: `Erreur serveur: ${msg}` }, { status: 500 })
  }
}
