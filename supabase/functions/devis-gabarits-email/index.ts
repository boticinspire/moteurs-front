/**
 * Moteurs.com — notification email pour une demande de devis « gabarits de soupape »
 *
 * Appelée (fire & forget) par /api/devis-gabarits après insertion dans `demandes_gabarits`.
 *   1. Email interne à DEVIS_NOTIFY_TO (repli : GMAIL_USER) avec le détail de la demande
 *   2. Accusé de réception au client, dans sa langue (fr / en / nl / de)
 *
 * Secrets attendus (déjà utilisés par constat-email) : GMAIL_USER, GMAIL_APP_PASSWORD
 * Secret optionnel : DEVIS_NOTIFY_TO (ex. info@moteurs.com)
 */
import { SMTPClient } from 'https://deno.land/x/denomailer@1.6.0/mod.ts'

const GMAIL_USER = Deno.env.get('GMAIL_USER') ?? ''
const GMAIL_PASS = Deno.env.get('GMAIL_APP_PASSWORD') ?? ''
const NOTIFY_TO  = Deno.env.get('DEVIS_NOTIFY_TO') || GMAIL_USER

type Demande = {
  id?: string
  nom: string
  email: string
  entreprise?: string | null
  pays?: string | null
  profil?: string | null
  diametre_tete?: string | null
  diametre_tige?: string | null
  angle_siege?: string | null
  quantite?: number | null
  moteur?: string | null
  message?: string | null
  langue?: string | null
  source_page?: string | null
}

const esc = (v: unknown) =>
  String(v ?? '—').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c] as string))

const ACK: Record<string, { subject: string; hello: string; body: string; sign: string }> = {
  fr: {
    subject: 'Votre demande de devis — gabarits de soupape (Moteurs.com)',
    hello: 'Bonjour',
    body: 'Nous avons bien reçu votre demande concernant nos gabarits de contrôle pour sièges et guides de soupape. Nous revenons vers vous sous 48 h ouvrées avec un devis, le délai de fabrication et les frais de port.',
    sign: 'Moteurs.com — Belgique',
  },
  en: {
    subject: 'Your quote request — valve gauges (Moteurs.com)',
    hello: 'Hello',
    body: 'We have received your request about our valve seat and guide check gauges. We will get back to you within 2 working days with a quote, lead time and shipping costs.',
    sign: 'Moteurs.com — Belgium',
  },
  nl: {
    subject: 'Uw offerteaanvraag — klepkalibers (Moteurs.com)',
    hello: 'Beste',
    body: 'Wij hebben uw aanvraag over onze controlekalibers voor klepzittingen en geleiders goed ontvangen. Wij nemen binnen 2 werkdagen contact op met een offerte, de levertermijn en de verzendkosten.',
    sign: 'Moteurs.com — België',
  },
  de: {
    subject: 'Ihre Angebotsanfrage — Ventilprüflehren (Moteurs.com)',
    hello: 'Guten Tag',
    body: 'Wir haben Ihre Anfrage zu unseren Prüflehren für Ventilsitz und -führung erhalten. Wir melden uns innerhalb von 2 Werktagen mit Angebot, Lieferzeit und Versandkosten.',
    sign: 'Moteurs.com — Belgien',
  },
}

Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 })
  }
  let d: Demande | null = null
  try { d = await req.json() } catch {
    return new Response(JSON.stringify({ error: 'JSON invalide' }), { status: 400 })
  }
  if (!d?.nom || !d?.email) {
    return new Response(JSON.stringify({ error: 'nom et email requis' }), { status: 400 })
  }
  if (!GMAIL_USER || !GMAIL_PASS) {
    return new Response(JSON.stringify({ error: 'SMTP non configuré' }), { status: 500 })
  }

  const rows: [string, unknown][] = [
    ['Nom', d.nom], ['Email', d.email], ['Entreprise', d.entreprise], ['Pays', d.pays], ['Profil', d.profil],
    ['Moteur', d.moteur], ['Ø tête (mm)', d.diametre_tete], ['Ø tige (mm)', d.diametre_tige],
    ['Angle de portée', d.angle_siege ? `${d.angle_siege}°` : null], ['Quantité', d.quantite],
    ['Langue', d.langue], ['Page', d.source_page], ['ID', d.id],
  ]
  const internalHtml = `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"><style>
    body{font-family:Arial,sans-serif;color:#14213d;background:#f3f6fb;margin:0;padding:24px}
    .wrap{max-width:640px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.08)}
    .header{background:#0e2a57;color:#fff;padding:24px 28px}.header h1{margin:0;font-size:1.25rem}
    .body{padding:24px 28px}table{width:100%;border-collapse:collapse;font-size:.9rem}
    td{padding:7px 10px;border-bottom:1px solid #eef2f7;vertical-align:top}td:first-child{font-weight:600;color:#5b6b85;width:160px}
    .msg{background:#e9f0fb;border-left:3px solid #1d5fd1;padding:12px 14px;border-radius:6px;margin-top:18px;white-space:pre-wrap}
  </style></head><body><div class="wrap">
    <div class="header"><h1>🔧 Nouvelle demande de devis — gabarits de soupape</h1></div>
    <div class="body"><table>${rows.map(([k, v]) => `<tr><td>${k}</td><td>${esc(v)}</td></tr>`).join('')}</table>
    ${d.message ? `<div class="msg">${esc(d.message)}</div>` : ''}
    <p style="font-size:.8rem;color:#7f91ad;margin-top:20px">Répondre directement à ${esc(d.email)} · Supabase › demandes_gabarits</p>
    </div></div></body></html>`

  const lang = (d.langue ?? 'fr').slice(0, 2)
  const a = ACK[lang] ?? ACK.fr
  const ackHtml = `<!DOCTYPE html><html lang="${lang}"><head><meta charset="UTF-8"></head>
  <body style="font-family:Arial,sans-serif;color:#14213d;line-height:1.55;padding:24px">
    <p>${a.hello} ${esc(d.nom)},</p>
    <p>${a.body}</p>
    <p style="color:#5b6b85;font-size:.9rem">${d.moteur ? `${esc(d.moteur)} · ` : ''}Ø ${esc(d.diametre_tete)} / ${esc(d.diametre_tige)} mm · ${d.angle_siege ? esc(d.angle_siege) + '°' : '—'} · ×${esc(d.quantite ?? 1)}</p>
    <p>${a.sign}<br><a href="https://moteurs.com" style="color:#1d5fd1">moteurs.com</a> · info@moteurs.com</p>
  </body></html>`

  const client = new SMTPClient({
    connection: { hostname: 'smtp.gmail.com', port: 465, tls: true, auth: { username: GMAIL_USER, password: GMAIL_PASS } },
  })
  const result: Record<string, unknown> = { internal: false, ack: false }
  try {
    await client.send({ from: GMAIL_USER, to: NOTIFY_TO, replyTo: d.email, subject: `🔧 Devis gabarits — ${d.nom}${d.entreprise ? ` (${d.entreprise})` : ''}`, html: internalHtml })
    result.internal = true
    try {
      await client.send({ from: GMAIL_USER, to: d.email, subject: a.subject, html: ackHtml })
      result.ack = true
    } catch (err) { result.ackError = String(err) }
    await client.close()
    return new Response(JSON.stringify({ success: true, ...result }), { headers: { 'Content-Type': 'application/json' } })
  } catch (err) {
    console.error('[devis-gabarits-email] SMTP error:', err)
    return new Response(JSON.stringify({ error: `Erreur SMTP: ${String(err)}`, ...result }), { status: 500, headers: { 'Content-Type': 'application/json' } })
  }
})
