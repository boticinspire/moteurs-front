/**
 * Moteurs.com — Recherche intelligente (IA)
 * Reçoit une question en langage naturel, Claude Haiku identifie
 * la page/outil cible et retourne une réponse courte + URL.
 * ~0.25 ct par requête | Prompt caching sur le system prompt
 */

import { NextRequest, NextResponse } from 'next/server'

const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages'
const MODEL = 'claude-haiku-4-5-20251001'

const SYSTEM_PROMPT = `Tu es l'assistant de navigation de Moteurs.com, un média sur la transition énergétique des transports routiers.

Ta tâche : comprendre la question et retourner la page ou l'outil qui correspond le mieux parmi ceux disponibles.

Pages et outils disponibles :
- /comparer-trajet : calculateur coût de trajet (ex: "Paris Nice en électrique", "combien ça coûte aller à Lyon", "trajet vacances", "coût avec péages", "distance route")
- /comparer : comparateur TCO / quel véhicule acheter (ex: "électrique vs diesel", "TCO", "quelle voiture choisir", "coût sur 5 ans", "rentable", "amortissement")
- /simulateur : simulateur TCO détaillé multi-pays (coût total possession approfondi)
- /outils/cartes-recharge : comparateur cartes d'abonnement recharge (ex: "carte IONITY", "abonnement recharge", "Chargemap", "Fastned", "moins chère pour recharger", "MSP")
- /recharge-electrique : hub recharge VE (ex: "recharger ma voiture électrique", "trouver une borne", "temps de charge", "infrastructure")
- /assistant-depannage : assistant dépannage (ex: "ma voiture fait un bruit", "panne", "symptôme bizarre", "voiture ne démarre pas")
- /assistant-depannage/voyants : voyants tableau de bord (ex: "voyant rouge", "voyant moteur allumé", "que signifie ce voyant", "lumière jaune")
- /constat : constat amiable accident (ex: "j'ai eu un accident", "remplir un constat", "accrochage", "constat amiable")
- /vacances-voiture : guide trajet vacances Europe (ex: "vignette autoroute", "péages Europe", "règles pays", "vacances voiture")
- /depannage : hub dépannage général
- /documents-auto : documents auto (ex: "carte grise", "permis international", "contrôle technique", "CT", "immatriculation")
- /articles : actualités transition énergétique, aides, réglementation, ZFE
- /espace-membres : alertes personnalisées, suivi aides et réglementation
- /outils/recharge-domicile-voiture-societe-belgique : ATN recharge domicile voiture société Belgique (ex: "avantage nature Belgique", "ATN", "voiture société recharge", "remboursement kWh employeur Belgique", "circulaire fiscale")
- /b2b : solutions flottes PME artisans (ex: "flotte électrique", "véhicules utilitaires", "suramortissement", "PME", "artisan")
- /aides-vehicules : aides et bonus (ex: "bonus écologique", "prime conversion", "CEE", "aide achat véhicule")

Réponds UNIQUEMENT en JSON valide, sans markdown, sans texte hors JSON :
{
  "answer": "Réponse directe en 1-2 phrases (max 130 caractères), dans la même langue que la question de l'utilisateur",
  "url": "/la-page-cible",
  "label": "Texte du bouton CTA (max 28 caractères, dans la langue de la question)"
}

Si la question est hors sujet (pas sur les véhicules, l'énergie ou le transport), retourne :
{
  "answer": "Je suis spécialisé véhicules & énergie. Posez-moi une question sur les trajets, les coûts ou la recharge !",
  "url": "/",
  "label": "Voir nos outils"
}`

export async function POST(req: NextRequest) {
  const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY ?? ''
  if (!ANTHROPIC_KEY) {
    return NextResponse.json(
      { error: 'ANTHROPIC_API_KEY manquante — configurer dans Vercel env vars' },
      { status: 500 }
    )
  }

  let question = ''
  try {
    const body = await req.json()
    question = String(body.question ?? '').slice(0, 400).trim()
  } catch {
    return NextResponse.json({ error: 'Corps de requête invalide' }, { status: 400 })
  }

  if (!question) {
    return NextResponse.json({ error: 'Question vide' }, { status: 400 })
  }

  try {
    const response = await fetch(ANTHROPIC_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 256,
        system: [
          {
            type: 'text',
            text: SYSTEM_PROMPT,
            cache_control: { type: 'ephemeral' },
          },
        ],
        messages: [{ role: 'user', content: question }],
      }),
    })

    if (!response.ok) {
      const err = await response.text()
      console.error('[search] Anthropic error:', err)
      return NextResponse.json({ error: `Erreur Anthropic: ${response.status}` }, { status: 500 })
    }

    const data = await response.json()
    const raw: string = data.content?.[0]?.text ?? ''

    // Extraire le JSON même s'il y a du texte parasite
    const match = raw.match(/\{[\s\S]*\}/)
    if (!match) {
      console.error('[search] JSON introuvable dans la réponse:', raw)
      return NextResponse.json({ error: 'Réponse invalide du modèle' }, { status: 500 })
    }

    const parsed = JSON.parse(match[0])
    return NextResponse.json(parsed)
  } catch (err) {
    console.error('[search] Exception:', err)
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 })
  }
}
