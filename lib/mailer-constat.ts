/**
 * Moteurs.com — envoi du résumé de constat amiable par email, depuis le serveur Node
 * (SMTP Behostings, mêmes variables SMTP_* que les devis — voir lib/mailer-devis.ts).
 */
import { esc, getTransport } from '@/lib/mailer-devis'

type Vehicule = Record<string, string | undefined>
export type Constat = Record<string, unknown>

const row = (k: string, v: unknown) =>
  `<tr><td style="padding:7px 10px;border-bottom:1px solid #f1f5f9;font-weight:600;color:#64748b;width:160px;vertical-align:top">${k}</td><td style="padding:7px 10px;border-bottom:1px solid #f1f5f9;vertical-align:top">${esc(v)}</td></tr>`

const section = (title: string, inner: string) =>
  `<div style="margin-bottom:24px"><div style="font-size:.72rem;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:#ef4444;margin-bottom:10px">${title}</div>${inner}</div>`

const table = (rows: string) => `<table style="width:100%;border-collapse:collapse;font-size:.88rem">${rows}</table>`

const para = (v: unknown) =>
  `<p style="font-size:.87rem;line-height:1.6;color:#374151">${esc(v).replace(/\n/g, '<br>')}</p>`

function vehiculeRows(v: Vehicule) {
  return table(
    row('Immatriculation', v.immatriculation) +
      row('Marque / Modèle', v.marque_modele) +
      row('Conducteur', `${v.prenom_conducteur ?? ''} ${v.nom_conducteur ?? ''}`.trim() || null) +
      row('Téléphone', v.telephone) +
      row('Assureur', v.assurance_nom) +
      row('N° police', v.assurance_numero_police) +
      row('Dommages', v.dommages_description),
  )
}

export async function sendConstatEmail(to: string, c: Constat) {
  const va = (c.vehicule_a ?? {}) as Vehicule
  const vb = (c.vehicule_b ?? {}) as Vehicule
  const circA = Array.isArray(c.circonstances_a) ? c.circonstances_a.length : 0
  const circB = Array.isArray(c.circonstances_b) ? c.circonstances_b.length : 0
  const blesses = Boolean(c.blesses)

  const html = `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"></head>
<body style="font-family:Arial,sans-serif;color:#1a1a2e;background:#f8fafc;margin:0;padding:0">
<div style="max-width:640px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden">
<div style="background:#ef4444;color:#fff;padding:28px 32px"><h1 style="margin:0 0 6px;font-size:1.4rem">Constat amiable — résumé</h1>
<p style="margin:0;opacity:.9;font-size:.9rem">Accident du ${esc(c.date)} à ${esc(c.heure)} · via Moteurs.com</p></div>
<div style="padding:28px 32px">
${blesses ? '<div style="background:#fef9c3;border-left:3px solid #eab308;padding:12px 16px;border-radius:6px;font-size:.85rem;margin-bottom:20px"><strong>Blessés signalés</strong> — transmettez ce constat à votre assureur sans délai.</div>' : ''}
${section('Informations générales', table(row('Date / Heure', `${c.date ?? '—'} à ${c.heure ?? '—'}`) + row('Lieu', c.lieu) + row('Pays', c.pays) + row('Blessés', blesses ? 'Oui' : 'Non')))}
${section('Véhicule A — vous', vehiculeRows(va))}
${section('Véhicule B — adverse', vehiculeRows(vb))}
${section('Circonstances cochées', table(row('Véhicule A', `${circA} case(s)`) + row('Véhicule B', `${circB} case(s)`)))}
${c.croquis_description ? section('Description du choc', para(c.croquis_description)) : ''}
${c.observations ? section('Observations', para(c.observations)) : ''}
<div style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:14px 16px;margin-top:8px">
<strong style="font-size:.85rem">Rappel légal</strong>
<p style="margin:6px 0 0;font-size:.82rem;color:#6b7280;line-height:1.55">Transmettez le constat amiable <strong>original signé</strong> à votre assureur dans les <strong>5 jours ouvrables</strong> suivant l'accident (délai légal FR, BE, CH). Ce document numérique est un aide-mémoire — il ne remplace pas le constat papier signé.</p>
</div></div>
<div style="background:#f8fafc;padding:20px 32px;font-size:.75rem;color:#94a3b8;border-top:1px solid #e2e8f0">Généré par <a href="https://moteurs.com" style="color:#ef4444">Moteurs.com</a> — assistant constat amiable · ${new Date().toLocaleDateString('fr-FR')}</div>
</div></body></html>`

  const from = process.env.SMTP_FROM || `Moteurs.com <${process.env.SMTP_USER}>`
  await getTransport().sendMail({
    from,
    to,
    subject: `Votre constat amiable — ${typeof c.date === 'string' && c.date ? c.date : 'Moteurs.com'}`,
    html,
  })
}
