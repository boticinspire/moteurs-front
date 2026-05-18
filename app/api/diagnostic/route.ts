/**
 * Moteurs.com — Proxy diagnostic IA
 * Appelle Claude Haiku avec le contexte de panne et retourne un diagnostic structuré.
 */

import { NextRequest, NextResponse } from 'next/server'

const ANTHROPIC_KEY  = process.env.ANTHROPIC_API_KEY ?? ''
const ANTHROPIC_URL  = 'https://api.anthropic.com/v1/messages'
const MODEL          = 'claude-haiku-4-5-20251001'

export async function POST(req: NextRequest) {
  if (!ANTHROPIC_KEY) {
    return NextResponse.json({ error: 'ANTHROPIC_API_KEY manquante' }, { status: 500 })
  }

  const body = await req.json().catch(() => null)
  if (!body?.symptome || !body?.motorisation) {
    return NextResponse.json({ error: 'Paramètres manquants' }, { status: 400 })
  }

  const { symptome_label, motorisation, reponses } = body

  const reponsesFormatees = (reponses as { question: string; reponse: string }[])
    .map(r => `- ${r.question} → ${r.reponse}`)
    .join('\n')

  const prompt = `Tu es un expert automobile expérimenté. Un conducteur non-mécanicien te décrit une panne.

Motorisation du véhicule : ${motorisation}
Symptôme principal : ${symptome_label}
Réponses aux questions de diagnostic :
${reponsesFormatees || '(aucune question supplémentaire)'}

Réponds UNIQUEMENT en JSON valide, sans markdown, sans texte hors JSON :
{
  "pannes_probables": [
    {"nom": "...", "probabilite": "haute|moyenne|faible", "explication": "explication simple en 1-2 phrases"}
  ],
  "gravite": "critique|urgent|attention|ok",
  "peut_rouler": true|false,
  "etapes": ["étape concrète 1", "étape 2", "..."],
  "conseil_cle": "1 conseil principal en 1 phrase courte"
}

Règles de gravité :
- critique = danger immédiat, arrêt obligatoire, ne pas rouler
- urgent = garage aujourd'hui, ne pas faire de long trajet
- attention = surveiller, garage sous 1 semaine
- ok = informatif, peut attendre le prochain entretien

Sois simple, rassurant, accessible à un non-mécanicien. Maximum 3 pannes probables, maximum 5 étapes.`

  try {
    const res = await fetch(ANTHROPIC_URL, {
      method: 'POST',
      headers: {
        'x-api-key':         ANTHROPIC_KEY,
        'anthropic-version': '2023-06-01',
        'content-type':      'application/json',
      },
      body: JSON.stringify({
        model:      MODEL,
        max_tokens: 1024,
        messages:   [{ role: 'user', content: prompt }],
      }),
    })

    if (!res.ok) {
      const err = await res.text()
      console.error('[/api/diagnostic] Anthropic error', res.status, err)
      return NextResponse.json({ error: 'Service IA indisponible' }, { status: 502 })
    }

    const data = await res.json()
    const text = data.content?.[0]?.text ?? ''

    // Parse JSON — Claude Haiku peut parfois ajouter des backticks
    const cleaned = text.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim()
    const diagnostic = JSON.parse(cleaned)

    return NextResponse.json(diagnostic)
  } catch (err) {
    console.error('[/api/diagnostic] erreur', err)
    return NextResponse.json({ error: 'Erreur de traitement' }, { status: 500 })
  }
}
