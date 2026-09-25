/**
 * Moteurs.com — envoi des emails « demande de devis gabarits » depuis le serveur Node
 * (Behostings), via le SMTP de l'hébergeur — sans Gmail ni Supabase.
 *
 * Variables d'environnement (DirectAdmin › Setup Node.js App) :
 *   SMTP_HOST        ex. mail.moteurs.com (ou hostnode7.behostings.net)
 *   SMTP_PORT        465 (SSL) ou 587 (STARTTLS) — défaut 465
 *   SMTP_USER        ex. devis@moteurs.com
 *   SMTP_PASS        mot de passe de la boîte
 *   SMTP_FROM        (option) ex. "Moteurs.com <devis@moteurs.com>" — défaut SMTP_USER
 *   DEVIS_NOTIFY_TO  (option) destinataire interne — défaut info@moteurs.com
 */
import nodemailer from 'nodemailer'

export type DemandeDevis = {
  nom: string | null
  email: string | null
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

export const smtpConfigured = () =>
  Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS)

export const esc = (v: unknown) =>
  String(v ?? '—').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c] as string))

const ACK: Record<string, { subject: string; hello: string; body: string; sign: string }> = {
  fr: {
    subject: 'Votre demande de devis — gabarits de soupape (Moteurs.com)',
    hello: 'Bonjour',
    body: 'Nous avons bien reçu votre demande concernant nos gabarits de contrôle pour sièges et guides de soupape. Nous revenons vers vous sous 48 h ouvrées avec un devis, le délai de fabrication et les frais de port.',
    sign: 'Moteurs.com — un produit de Botic (Belgique)',
  },
  en: {
    subject: 'Your quote request — valve gauges (Moteurs.com)',
    hello: 'Hello',
    body: 'We have received your request about our valve seat and guide check gauges. We will get back to you within 2 working days with a quote, lead time and shipping costs.',
    sign: 'Moteurs.com — a Botic product (Belgium)',
  },
  nl: {
    subject: 'Uw offerteaanvraag — klepkalibers (Moteurs.com)',
    hello: 'Beste',
    body: 'Wij hebben uw aanvraag over onze controlekalibers voor klepzittingen en geleiders goed ontvangen. Wij nemen binnen 2 werkdagen contact op met een offerte, de levertermijn en de verzendkosten.',
    sign: 'Moteurs.com — een product van Botic (België)',
  },
  de: {
    subject: 'Ihre Angebotsanfrage — Ventilprüflehren (Moteurs.com)',
    hello: 'Guten Tag',
    body: 'Wir haben Ihre Anfrage zu unseren Prüflehren für Ventilsitz und -führung erhalten. Wir melden uns innerhalb von 2 Werktagen mit Angebot, Lieferzeit und Versandkosten.',
    sign: 'Moteurs.com — ein Produkt von Botic (Belgien)',
  },
}

let transporter: nodemailer.Transporter | null = null
export function getTransport() {
  if (transporter) return transporter
  const port = Number(process.env.SMTP_PORT || 465)
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure: port === 465,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 15_000,
  })
  return transporter
}

/** Envoie la notification interne puis l'accusé de réception client. */
export async function sendDevisEmails(d: DemandeDevis) {
  const t = getTransport()
  const from = process.env.SMTP_FROM || `Moteurs.com <${process.env.SMTP_USER}>`
  const notifyTo = process.env.DEVIS_NOTIFY_TO || 'info@moteurs.com'

  const rows: [string, unknown][] = [
    ['Nom', d.nom], ['Email', d.email], ['Entreprise', d.entreprise], ['Pays', d.pays], ['Profil', d.profil],
    ['Moteur', d.moteur], ['Ø tête (mm)', d.diametre_tete], ['Ø tige (mm)', d.diametre_tige],
    ['Angle de portée', d.angle_siege ? `${d.angle_siege}°` : null], ['Quantité', d.quantite],
    ['Langue', d.langue], ['Page', d.source_page],
  ]
  const internalHtml = `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"></head>
<body style="font-family:Arial,sans-serif;color:#14213d;background:#f3f6fb;margin:0;padding:24px">
<div style="max-width:640px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden">
<div style="background:#0e2a57;color:#fff;padding:20px 24px"><h1 style="margin:0;font-size:1.2rem">Nouvelle demande de devis — gabarits de soupape</h1></div>
<div style="padding:20px 24px"><table style="width:100%;border-collapse:collapse;font-size:.9rem">
${rows.map(([k, v]) => `<tr><td style="padding:6px 8px;border-bottom:1px solid #eef2f7;font-weight:600;color:#5b6b85;width:150px">${k}</td><td style="padding:6px 8px;border-bottom:1px solid #eef2f7">${esc(v)}</td></tr>`).join('')}
</table>
${d.message ? `<div style="background:#e9f0fb;border-left:3px solid #1d5fd1;padding:12px;border-radius:6px;margin-top:16px;white-space:pre-wrap">${esc(d.message)}</div>` : ''}
<p style="font-size:.8rem;color:#7f91ad;margin-top:18px">Répondre directement à ce mail pour écrire à ${esc(d.email)} · historique : Supabase › demandes_gabarits</p>
</div></div></body></html>`

  const result = { internal: false, ack: false }
  await t.sendMail({
    from,
    to: notifyTo,
    replyTo: d.email ?? undefined,
    subject: `Devis gabarits — ${d.nom ?? ''}${d.entreprise ? ` (${d.entreprise})` : ''}`,
    html: internalHtml,
  })
  result.internal = true

  if (d.email) {
    const lang = (d.langue ?? 'fr').slice(0, 2)
    const a = ACK[lang] ?? ACK.fr
    const ackHtml = `<!DOCTYPE html><html lang="${lang}"><head><meta charset="UTF-8"></head>
<body style="font-family:Arial,sans-serif;color:#14213d;line-height:1.55;padding:24px">
<p>${a.hello} ${esc(d.nom)},</p><p>${a.body}</p>
<p style="color:#5b6b85;font-size:.9rem">${d.moteur ? `${esc(d.moteur)} · ` : ''}Ø ${esc(d.diametre_tete)} / ${esc(d.diametre_tige)} mm · ${d.angle_siege ? esc(d.angle_siege) + '°' : '—'} · ×${esc(d.quantite ?? 1)}</p>
<p>${a.sign}<br><a href="https://moteurs.com" style="color:#1d5fd1">moteurs.com</a></p>
</body></html>`
    await t.sendMail({ from, to: d.email, replyTo: notifyTo, subject: a.subject, html: ackHtml })
    result.ack = true
  }
  return result
}
