import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * Middleware de protection des routes sensibles.
 * /admin → redirige vers /espace-membres si aucun cookie de session Supabase présent.
 * La vérification de l'email admin reste côté client (dans page.tsx).
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (pathname.startsWith('/admin')) {
    // Supabase stocke la session sous sb-<project-ref>-auth-token
    const cookies = request.cookies.getAll()
    const hasSession = cookies.some(
      c => c.name.includes('sb-') && c.name.includes('-auth-token') && c.value.length > 10
    )

    if (!hasSession) {
      const loginUrl = new URL('/espace-membres', request.url)
      loginUrl.searchParams.set('redirect', '/admin')
      return NextResponse.redirect(loginUrl)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin', '/admin/:path*'],
}
