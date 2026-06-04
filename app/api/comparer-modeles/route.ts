/**
 * Moteurs.com — Comparateur de modèles par motorisation
 * Reçoit une liste de modèles + motorisation → appelle Claude → retourne comparaison structurée
 */

import { NextRequest, NextResponse } from 'next/server'

const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages'
const MODEL = 'claude-haiku-4-5-20251001'

function buildPrompt(motorisation: string, modeles: string[]): string {
  return `Tu es un expert automobile reconnu. Compare les ${modeles.length} véhicule(s) suivant(s), tous de motorisation "${motorisation}" :
${modeles.map((m, i) => `${i + 1}. ${m}`).join('\n')}

Réponds UNIQUEMENT en JSON valide, sans markdown, sans texte hors JSON :
{
  "motorisation": "${motorisation}",
  "modeles": [
    {
      "nom": "Nom normalisé : Marque Modèle Finition (ex: Tesla Model 3 Long Range)",
      "annee_modele": "2024",
      "specs": {
        "prix_base": "Prix de base neuf (ex: 39 990 €)",
        "puissance": "Puissance max (ex: 204 ch / 150 kW)",
        "autonomie_wltp": "Autonomie WLTP si VE ou PHEV (ex: 580 km), sinon null",
        "consommation": "Consommation mixte (ex: 14.3 kWh/100km ou 5.2 L/100km)",
        "recharge_max_kw": "Puissance DC max en kW si VE/PHEV (ex: 170 kW), sinon null",
        "capacite_batterie_kwh": "Capacité batterie si VE/PHEV (ex: 75 kWh), sinon null",
        "coffre_litres": "Volume coffre en litres (ex: 440 L)",
        "longueur_mm": "Longueur hors-tout (ex: 4694 mm)",
        "poids_kg": "Poids à vide (ex: 1830 kg)",
        "garantie": "Garantie constructeur (ex: 8 ans / 160 000 km batterie)"
      },
      "points_forts": [
        "Point fort 1 — précis et factuel (1 phrase courte)",
        "Point fort 2",
        "Point fort 3",
        "Point fort 4",
        "Point fort 5"
      ],
      "points_faibles": [
        "Point faible 1 — honnête et factuel (1 phrase courte)",
        "Point faible 2",
        "Point faible 3"
      ],
      "pour_qui": "Profil acheteur idéal en 1-2 phrases",
      "verdict": "Verdict équilibré en 2-3 phrases factuelles",
      "note_globale": 8.2
    }
  ],
  "synthese": {
    "meilleur_rapport_qp": "Nom exact du modèle avec le meilleur rapport qualité-prix",
    "meilleur_autonomie": "Nom exact du modèle avec la meilleure autonomie (null si non applicable)",
    "meilleur_recharge": "Nom exact du modèle avec la meilleure vitesse de recharge (null si non applicable)",
    "meilleur_espace": "Nom exact du modèle avec le plus d'espace / polyvalence",
    "conclusion": "Synthèse comparative en 3-4 phrases : différences clés, quel profil devrait choisir quel modèle"
  }
}

Règles strictes :
- Si un modèle n'existe pas ou n'est pas clairement identifiable, mets note_globale: 0 et explique dans verdict
- Données du millésime le plus récent disponible (2024 ou 2025)
- Pour les specs nullables : utiliser exactement null (pas de chaîne "null")
- Toutes les autres valeurs de specs sont des strings non vides
- note_globale : nombre décimal entre 0 et 10 avec une décimale
- Sois factuel, équilibré, sans favoritisme de marque`
}

// Vercel : allonge le timeout à 60s (plan Pro) ; sur Hobby la limite est 10s
export const maxDuration = 60

export async function POST(req: NextRequest) {
  const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY ?? ''
  if (!ANTHROPIC_KEY) {
    return NextResponse.json(
      { error: 'ANTHROPIC_API_KEY manquante — à configurer dans Vercel env vars' },
      { status: 500 }
    )
  }

  let body: { modeles?: string[]; motorisation?: string } | null = null
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Corps de requête JSON invalide' }, { status: 400 })
  }

  const modeles = (body?.modeles ?? [])
    .map((m: string) => m.trim())
    .filter((m: string) => m.length > 0)
    .slice(0, 5)

  const motorisation = (body?.motorisation ?? 'Électrique').trim()

  if (modeles.length < 2) {
    return NextResponse.json({ error: 'Minimum 2 modèles requis pour une comparaison' }, { status: 400 })
  }

  try {
    const res = await fetch(ANTHROPIC_URL, {
      method: 'POST',
      headers: {
        'x-api-key': ANTHROPIC_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      // Abort à 30 s (plan Pro maxDuration=60) — garantit une réponse JSON propre
      signal: AbortSignal.timeout(30000),
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 2048,
        messages: [{ role: 'user', content: buildPrompt(motorisation, modeles) }],
      }),
    })

    if (!res.ok) {
      const err = await res.text()
      console.error('[/api/comparer-modeles] Anthropic error', res.status, err)
      return NextResponse.json(
        { error: `Anthropic ${res.status}: ${err.slice(0, 200)}` },
        { status: 502 }
      )
    }

    const data = await res.json()
    const text = data.content?.[0]?.text ?? ''
    if (!text) {
      return NextResponse.json({ error: 'Réponse vide de Claude' }, { status: 502 })
    }

    const cleaned = text.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim()

    let result
    try {
      result = JSON.parse(cleaned)
    } catch {
      console.error('[/api/comparer-modeles] JSON invalide:', cleaned.slice(0, 300))
      return NextResponse.json(
        { error: `Réponse non analysable: ${cleaned.slice(0, 120)}` },
        { status: 502 }
      )
    }

    return NextResponse.json(result)
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    if (err instanceof Error && (err.name === 'AbortError' || err.name === 'TimeoutError')) {
      return NextResponse.json(
        { error: `Délai dépassé — Claude Haiku n'a pas répondu à temps. Réessayez avec moins de modèles.` },
        { status: 504 }
      )
    }
    console.error('[/api/comparer-modeles] erreur', msg)
    return NextResponse.json({ error: `Erreur serveur: ${msg}` }, { status: 500 })
  }
}
