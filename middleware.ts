import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Passthrough — protection /admin gérée côté client (vérification email dans page.tsx)
export function middleware(_request: NextRequest) {
  return NextResponse.next()
}

export const config = {
  matcher: [],
}
