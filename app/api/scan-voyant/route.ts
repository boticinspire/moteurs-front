/**
 * Moteurs.com — Scan voyant par photo
 * Reçoit { image_base64, mime_type } depuis le navigateur,
 * appelle Claude Sonnet Vision directement et retourne le diagnostic structuré.
 */

import { NextRequest, NextResponse } from 'next/server'

const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages'
const MODEL         = 'claude-sonnet-4-6'

const PROMPT_VISION = `Tu es un expert en mécanique automobile. Analyse cette photo du tableau de bord et identifie le(s) voyant(s) allumé(s).

Réponds UNIQUEMENT en JSON valide, sans markdown, sans texte hors JSON :
{
  "voyant_nom": "Nom court du voyant principal (ex: 'Voyant moteur', 'Pression huile', 'Température moteur', 'Batterie / Alternateur', 'Pression pneus (TPMS)', 'ABS', 'Airbag', 'Direction assistée', 'AdBlue', 'Filtre à particules (FAP)', 'Niveau carburant', 'Frein / liquide de frein', 'Service dû')",
  "description": "Explication claire en 2-3 phrases de ce que signifie ce voyant, accessible à un conducteur non-mécanicien",
  "urgence": "stop|attention|info",
  "peut_rouler": true,
  "actions": ["action concrète 1", "action 2", "action 3"],
  "confiance": "haute|moyenne|faible"
}

Règles urgence :
- stop     = DANGER IMMÉDIAT — garer et couper le moteur dès que possible (pression huile, surchauffe, frein)
- attention = intervenir sous 24-48h, éviter les longs trajets (moteur, batterie, ABS, airbag)
- info      = informatif, planifier une visite garage (service, AdBlue, TPMS)

Règles :
- peut_rouler = false si urgence est "stop", sinon true
- Maximum 4 actions, claires et ordonnées par priorité
- Sois rassurant et accessible pour un conducteur non-mécanicien
- Si tu ne distingues pas de voyant allumé ou si l'image n'est pas un tableau de bord automobile, mets confiance: "faible" et explique dans description`

export async function POST(req: NextRequest) {
  const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY ?? ''
  if (!ANTHROPIC_KEY) {
    return NextResponse.json(
      { error: 'ANTHROPIC_API_KEY manquante — à configurer dans Vercel env vars' },
      { status: 500 }
    )
  }

  let body: { image_base64?: string; mime_type?: string } | null = null
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Corps de requête JSON invalide' }, { status: 400 })
  }

  if (!body?.image_base64) {
    return NextResponse.json({ error: 'Champ image_base64 manquant' }, { status: 400 })
  }

  const mimeType   = body.mime_type ?? 'image/jpeg'
  const image_b64  = body.image_base64

  // Vérification taille (~5 Mo max)
  const approxBytes = image_b64.length * 3 / 4
  if (approxBytes > 5 * 1024 * 1024) {
    return NextResponse.json(
      { error: 'Image trop volumineuse (max 5 Mo). Réduisez la résolution.' },
      { status: 413 }
    )
  }

  try {
    const res = await fetch(ANTHROPIC_URL, {
      method:  'POST',
      headers: {
        'x-api-key':         ANTHROPIC_KEY,
        'anthropic-version': '2023-06-01',
        'content-type':      'application/json',
      },
      body: JSON.stringify({
        model:      MODEL,
        max_tokens: 1024,
        messages: [{
          role: 'user',
          content: [
            {
              type:   'image',
              source: {
                type:       'base64',
                media_type: mimeType,
                data:        image_b64,
              },
            },
            {
              type: 'text',
              text: PROMPT_VISION,
            },
          ],
        }],
      }),
    })

    if (!res.ok) {
      const err = await res.text()
      console.error('[/api/scan-voyant] Anthropic error', res.status, err)
      return NextResponse.json(
        { error: `Anthropic ${res.status}: ${err.slice(0, 200)}` },
        { status: 502 }
      )
    }

    const data = await res.json()
    const text = data.content?.[0]?.text ?? ''

    if (!text) {
      return NextResponse.json({ error: 'Réponse vide de Claude Vision' }, { status: 502 })
    }

    // Nettoyer si Claude ajoute des backticks
    const cleaned = text
      .replace(/^```json\s*/i, '')
      .replace(/```\s*$/i, '')
      .trim()

    let diagnostic
    try {
      diagnostic = JSON.parse(cleaned)
    } catch {
      console.error('[/api/scan-voyant] JSON invalide:', cleaned.slice(0, 300))
      return NextResponse.json(
        { error: `Réponse non analysable de Claude: ${cleaned.slice(0, 100)}` },
        { status: 502 }
      )
    }

    // Normaliser les champs
    const urgence = ['stop', 'attention', 'info'].includes(diagnostic.urgence)
      ? diagnostic.urgence
      : 'attention'

    const confiance = ['haute', 'moyenne', 'faible'].includes(diagnostic.confiance)
      ? diagnostic.confiance
      : 'moyenne'

    return NextResponse.json({
      voyant_nom:   diagnostic.voyant_nom   ?? 'Voyant non identifié',
      description:  diagnostic.description  ?? '',
      urgence,
      peut_rouler:  urgence !== 'stop',
      actions:      (diagnostic.actions ?? []).slice(0, 4),
      article_lien: null,
      confiance,
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[/api/scan-voyant] erreur', msg)
    return NextResponse.json({ error: `Erreur serveur: ${msg}` }, { status: 500 })
  }
}
