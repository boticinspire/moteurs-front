import type { Metadata } from 'next'
import ComparateurTCOEmbed, { type EmbedTheme, type EmbedLang } from './ComparateurTCOEmbed'

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  title: 'Moteurs.com — Comparateur TCO (embed)',
}

// Page tres dynamique : les query strings changent par partenaire
export const dynamic = 'force-dynamic'

interface PageProps {
  searchParams: Promise<{
    partner?: string
    lang?: string
    theme?: string
    accent?: string
    id?: string
  }>
}

function sanitizeLang(v: string | undefined): EmbedLang {
  return v === 'en' ? 'en' : 'fr'
}

function sanitizeTheme(v: string | undefined): EmbedTheme {
  if (v === 'dark' || v === 'auto') return v
  return 'light'
}

function sanitizeHexColor(v: string | undefined): string | undefined {
  if (!v) return undefined
  // accepte #abc, #abcdef, #abcdef00 — caracteres hex uniquement
  return /^#[0-9a-fA-F]{3,8}$/.test(v) ? v : undefined
}

function sanitizeSlug(v: string | undefined): string | undefined {
  if (!v) return undefined
  return /^[a-zA-Z0-9_-]{1,40}$/.test(v) ? v : undefined
}

export default async function EmbedTcoPage({ searchParams }: PageProps) {
  const sp = await searchParams

  const partner = sanitizeSlug(sp.partner)
  const lang = sanitizeLang(sp.lang)
  const theme = sanitizeTheme(sp.theme)
  const accent = sanitizeHexColor(sp.accent)
  const embedId = sanitizeSlug(sp.id) ?? 'default'

  return (
    <ComparateurTCOEmbed
      partner={partner}
      lang={lang}
      theme={theme}
      accent={accent}
      embedId={embedId}
    />
  )
}
