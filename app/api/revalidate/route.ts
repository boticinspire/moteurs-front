/**
 * Moteurs.com — Revalidation ISR à la demande
 *
 * Permet de rafraîchir le cache d'un article (ou de toute page) sans
 * attendre la fenêtre `revalidate`, et sans redéploiement Vercel.
 *
 * Sécurité : un secret partagé est requis (env `REVALIDATE_SECRET`),
 * passé soit en query `?secret=...`, soit en header `x-revalidate-secret`.
 *
 * Exemples :
 *   POST /api/revalidate?secret=XXX            → revalide TOUS les articles + /articles
 *   POST /api/revalidate?secret=XXX&slug=mon-article
 *   POST /api/revalidate?secret=XXX&path=/dessins
 *
 * Réponse : { ok, revalidated: string[], at }
 */

import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Locales du site (next-intl, FR = défaut sans préfixe mais route interne sous /[locale])
const LOCALES = ['fr', 'en', 'nl', 'de', 'es', 'it'] as const

function getSecret(req: NextRequest): string | null {
  return (
    req.nextUrl.searchParams.get('secret') ??
    req.headers.get('x-revalidate-secret') ??
    null
  )
}

async function handle(req: NextRequest) {
  const expected = process.env.REVALIDATE_SECRET
  const provided = getSecret(req)

  if (!expected || provided !== expected) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
  }

  // Paramètres (query ou corps JSON)
  const body = await req.json().catch(() => ({} as Record<string, unknown>))
  const slug =
    (typeof body.slug === 'string' ? body.slug : null) ??
    req.nextUrl.searchParams.get('slug')
  const path =
    (typeof body.path === 'string' ? body.path : null) ??
    req.nextUrl.searchParams.get('path')

  const revalidated: string[] = []

  if (path) {
    // Revalidation d'une page précise fournie telle quelle
    revalidatePath(path)
    revalidated.push(path)
  } else if (slug) {
    // Article précis : FR (URL nue) + chaque locale préfixée
    revalidatePath(`/article/${slug}`)
    revalidated.push(`/article/${slug}`)
    for (const loc of LOCALES) {
      const p = `/${loc}/article/${slug}`
      revalidatePath(p)
      revalidated.push(p)
    }
    revalidatePath('/articles')
    revalidated.push('/articles')
  } else {
    // Aucun ciblage : revalide le gabarit dynamique de tous les articles
    revalidatePath('/[locale]/article/[slug]', 'page')
    revalidated.push('/[locale]/article/[slug] (toutes pages)')
    revalidatePath('/articles')
    revalidated.push('/articles')
  }

  return NextResponse.json({
    ok: true,
    revalidated,
    at: new Date().toISOString(),
  })
}

export async function POST(req: NextRequest) {
  return handle(req)
}

// Pratique pour déclencher depuis un navigateur / cron simple
export async function GET(req: NextRequest) {
  return handle(req)
}
