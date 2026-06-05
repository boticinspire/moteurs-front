/**
 * Moteurs.com — Scan voyant par photo
 * 1. Hash l'image → lookup cache Supabase (0 token si déjà vu)
 * 2. Si miss → appelle Claude Haiku Vision (avec prompt caching)
 * 3. Sauvegarde résultat en cache + log (fire & forget)
 *
 * Optimisations token (juin 2026) :
 *  - Modèle : claude-sonnet-4-6 → claude-haiku-4-5-20251001 (~20x moins cher)
 *  - max_tokens : 1024 → 512 (réponse JSON ~200 tokens max)
 *  - Prompt caching : system prompt statique mis en cache (cache_control ephemeral)
 *    → 90 % de réduction sur les tokens d'entrée après le 1er appel
 */
 
import { NextRequest, NextResponse } from 'next/server'
import { hashImage, getScanFromCache, saveScanToCache } from '@/lib/scan-voyant-cache'
 
const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages'
const MODEL = 'claude-haiku-4-5-20251001'  // ← était claude-sonnet-4-6
 
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
- stop = DANGER IMMÉDIAT — garer et couper le moteur dès que possible (pression huile, surchauffe, frein)
- attention = intervenir sous 24-48h, éviter les longs trajets (moteur, batterie, ABS, airbag)
- info = informatif, planifier une visite garage (service, AdBlue, TPMS)
 
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
 
  const mimeType = body.mime_type ?? 'image/jpeg'
  const imageB64 = body.image_base64
 
  // Vérification taille (~5 Mo max)
  if (imageB64.length * 3 / 4 > 5 * 1024 * 1024) {
    return NextResponse.json(
      { error: 'Image trop volumineuse (max 5 Mo). Réduisez la résolution.' },
      { status: 413 }
    )
  }
 
  // ── Tier 1 : Cache Supabase ───────────────────────────────────────────────
  const imageHash = hashImage(imageB64)
  const cached = await getScanFromCache(imageHash)
  if (cached) {
    return NextResponse.json({ ...cached, _cache: true })
  }
 
  // ── Tier 2 : Claude Vision (Haiku + prompt caching) ───────────────────────
  try {
    const res = await fetch(ANTHROPIC_URL, {
      method: 'POST',
      headers: {
        'x-api-key': ANTHROPIC_KEY,
        'anthropic-version': '2023-06-01',
        'anthropic-beta': 'prompt-caching-2024-07-31',  // ← header requis pour le caching
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 512,  // ← était 1024 ; la réponse JSON fait ~200 tokens max
        system: [
          {
            type: 'text',
            text: PROMPT_VISION,
            cache_control: { type: 'ephemeral' },  // ← mis en cache côté Anthropic
          },
        ],
        messages: [{
          role: 'user',
          content: [
            {
              type: 'image',
              source: { type: 'base64', media_type: mimeType, data: imageB64 },
            },
            { type: 'text', text: 'Identifie le(s) voyant(s) allumé(s) sur cette photo.' },
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
 
    // ── Monitoring cache (visible dans les logs Vercel) ───────────────────
    const usage = data.usage ?? {}
    const cacheHit = usage.cache_read_input_tokens ?? 0
    const cacheCreate = usage.cache_creation_input_tokens ?? 0
    const inputTokens = usage.input_tokens ?? 0
    const outputTokens = usage.output_tokens ?? 0
    const cacheRatio = cacheHit / Math.max(cacheHit + inputTokens, 1)
    console.info(
      `[scan-voyant] model=${MODEL} | input=${inputTokens} | cache_create=${cacheCreate} | cache_read=${cacheHit} | output=${outputTokens} | cache_ratio=${(cacheRatio * 100).toFixed(0)}%`
    )
 
    const text = data.content?.[0]?.text ?? ''
    if (!text) {
      return NextResponse.json({ error: 'Réponse vide de Claude Vision' }, { status: 502 })
    }
 
    // Nettoyer si Claude ajoute des backticks
    const cleaned = t