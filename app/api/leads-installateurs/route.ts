/**
 * Moteurs.com — API route leads installateurs
 *
 * POST /api/leads-installateurs
 *
 * 1. Valide le corps de la requête
 * 2. Trouve les installateurs correspondant (pays + code postal + spécialité)
 * 3. Insère le lead dans leads_installateurs (avec installateur_ids)
 * 4. Notifie les installateurs matchés via Edge Function (fire & forget)
 * 5. Retourne { success: true, lead_id }
 */

import { NextRequest, NextResponse } from 'next/server'

const SUPABASE_URL      = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''

// Mapping type_projet → spécialité attendue dans installateurs.specialites
const SPECIALITE_MAP: Record<string, string> = {
  borne_maison:     'borne_irve',
  borne_entreprise: 'borne_irve',
  panneaux:         'panneaux',
  batterie:         'batterie',
  audit:            'audit',
}

interface LeadBody {
  type_projet:       string
  puissance_kw?:     number | null
  pays:              string
  code_postal:       string
  nom_contact:       string
  email_contact:     string
  telephone_contact?: string
  message?:          string
  source_page?:      string
}

interface Installateur {
  id:            string
  nom:           string
  email:         string
  telephone:     string | null
  codes_postaux: string[]
  specialites:   string[]
  certifications: string[]
}

export async function POST(req: NextRequest) {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return NextResponse.json({ error: 'Supabase non configuré' }, { status: 500 })
  }

  // ── 1. Parse + validation ──────────────────────────────────────────────────
  let body: LeadBody
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Corps JSON invalide' }, { status: 400 })
  }

  const required: (keyof LeadBody)[] = [
    'type_projet', 'pays', 'code_postal', 'nom_contact', 'email_contact',
  ]
  for (const field of required) {
    if (!body[field]) {
      return NextResponse.json({ error: `Champ requis manquant : ${field}` }, { status: 400 })
    }
  }

  // ── 2. Matching installateurs ──────────────────────────────────────────────
  // Requête PostgREST : actifs + pays correspondant
  // On filtre ensuite en JS pour code_postal et spécialité
  const specialite = SPECIALITE_MAP[body.type_projet] ?? body.type_projet
  // PostgREST array contains : pays=cs.{FR}
  const paysFilter = encodeURIComponent(`{${body.pays}}`)

  const instRes = await fetch(
    `${SUPABASE_URL}/rest/v1/installateurs?actif=eq.true&pays=cs.${paysFilter}&select=id,nom,email,telephone,codes_postaux,specialites,certifications`,
    {
      headers: {
        'apikey':        SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
      cache: 'no-store',
    }
  )

  let allInstallateurs: Installateur[] = []
  if (instRes.ok) {
    allInstallateurs = await instRes.json()
  }

  // Filtre JS : spécialité + code postal (vide = couvre tout le pays)
  const dept = body.code_postal.substring(0, 2)  // Ex: "75" pour Paris
  const matched = allInstallateurs.filter((inst) => {
    const hasSpec = inst.specialites.length === 0 || inst.specialites.includes(specialite)
    const hasZone =
      inst.codes_postaux.length === 0 ||
      inst.codes_postaux.includes(body.code_postal) ||
      inst.codes_postaux.some((cp) => cp === dept || cp.startsWith(dept))
    return hasSpec && hasZone
  })

  const installateurIds = matched.map((i) => i.id)

  // ── 3. Insertion du lead ───────────────────────────────────────────────────
  const leadPayload = {
    type_projet:        body.type_projet,
    puissance_kw:       body.puissance_kw ?? null,
    pays:               body.pays,
    code_postal:        body.code_postal,
    nom_contact:        body.nom_contact,
    email_contact:      body.email_contact,
    telephone_contact:  body.telephone_contact ?? null,
    message:            body.message ?? null,
    source_page:        body.source_page ?? null,
    statut:             installateurIds.length > 0 ? 'TRANSMIS' : 'NOUVEAU',
    installateur_ids:   installateurIds,
  }

  const insertRes = await fetch(`${SUPABASE_URL}/rest/v1/leads_installateurs`, {
    method: 'POST',
    headers: {
      'apikey':        SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type':  'application/json',
      'Prefer':        'return=representation',
    },
    body: JSON.stringify(leadPayload),
  })

  if (!insertRes.ok) {
    const err = await insertRes.text()
    console.error('[leads-installateurs] INSERT error:', err)
    return NextResponse.json({ error: 'Erreur lors de l\'enregistrement du lead' }, { status: 500 })
  }

  const [insertedLead] = await insertRes.json()
  const leadId: string = insertedLead?.id ?? 'unknown'

  // ── 4. Notification email — fire & forget ─────────────────────────────────
  // Appel à la Supabase Edge Function `notif-lead-installateur`
  // Ne bloque pas la réponse en cas d'erreur
  if (matched.length > 0) {
    fetch(`${SUPABASE_URL}/functions/v1/notif-lead-installateur`, {
      method: 'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        lead_id:        leadId,
        lead:           leadPayload,
        installateurs:  matched.map((i) => ({ id: i.id, nom: i.nom, email: i.email })),
      }),
    }).catch((e) => console.error('[leads-installateurs] notif email error:', e))
  }

  // ── 5. Réponse ─────────────────────────────────────────────────────────────
  return NextResponse.json({
    success:              true,
    lead_id:              leadId,
    installateurs_count:  matched.length,
  })
}
