import type { Metadata } from 'next'
import { setRequestLocale } from 'next-intl/server'
import AssistantDepannage from './AssistantDepannage'
import { buildAlternates } from '@/lib/seo-utils'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  return {
    title: 'Voyant tableau de bord : signification & diagnostic auto | Moteurs.com',
    description: 'Identifiez votre panne en quelques questions. Diagnostic guidé pour essence, diesel, hybride et électrique. Voyants, bruit, perte de puissance, recharge impossible…',
    alternates: buildAlternates(locale, '/assistant-depannage'),
  }
}

export default async function PageAssistantDepannage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)
  return (
    <main style={{ padding: '40px 20px 80px' }}>
      <div style={{ maxWidth: 680, margin: '0 auto' }}>
        <div style={{ marginBottom: 32 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 12, padding: '4px 12px', borderRadius: 999, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
            <span style={{ fontSize: '0.73rem', fontWeight: 700, color: '#ef4444', textTransform: 'uppercase', letterSpacing: '0.06em' }}>🔧 Nouveau</span>
          </div>
          <h1 style={{ margin: '0 0 12px', fontSize: '1.75rem', lineHeight: 1.25 }}>
            Assistant Dépannage Auto
          </h1>
          <p style={{ margin: 0, color: 'var(--color-text-muted)', fontSize: '0.95rem', lineHeight: 1.6 }}>
            Répondez à quelques questions pour identifier votre panne, évaluer sa gravité et savoir quoi faire.
            Adapté à tous les types de motorisation : essence, diesel, hybride et électrique.
          </p>
        </div>

        <AssistantDepannage />
      </div>
    </main>
  )
}
