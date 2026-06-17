import type { Metadata } from 'next'
import { Link } from '@/i18n/navigation'
import { CLASSEMENTS } from '@/lib/voitures'

export const revalidate = 86400

export const metadata: Metadata = {
  title: { absolute: 'Palmarès des voitures électriques : autonomie, recharge, efficience | Moteurs.com' },
  description:
    'Les meilleurs classements de voitures électriques : autonomie, recharge rapide, 800V, efficience, batterie. Comparez et choisissez le bon modèle.',
  alternates: { canonical: 'https://moteurs.com/voitures/palmares' },
}

export default function PalmaresIndexPage() {
  return (
    <main style={{ maxWidth: 1000, margin: '0 auto', padding: '32px 20px 64px' }}>
      <nav style={{ fontSize: 13, color: 'var(--color-text-muted)', marginBottom: 12 }}>
        <Link href="/voitures" style={{ color: 'var(--color-text-muted)' }}>← Catalogue des voitures électriques</Link>
      </nav>
      <h1 style={{ fontSize: '1.9rem', lineHeight: 1.2, marginBottom: 8 }}>
        Palmarès des voitures électriques
      </h1>
      <p style={{ color: 'var(--color-text-muted)', maxWidth: 720, marginBottom: 28 }}>
        Nos classements de voitures électriques selon les critères qui comptent : autonomie réelle,
        vitesse de recharge, efficience et plus encore. Chaque palmarès est calculé à partir des
        données techniques du catalogue.
      </p>
      <div style={{ display: 'grid', gap: 14, gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))' }}>
        {CLASSEMENTS.map((c) => (
          <Link
            key={c.slug}
            href={`/voitures/palmares/${c.slug}`}
            style={{
              display: 'block', padding: '18px 20px', borderRadius: 14,
              border: '1.5px solid var(--color-border)', background: 'var(--color-bg-card)',
              textDecoration: 'none', color: 'var(--color-text)',
            }}
          >
            <div style={{ fontWeight: 700, fontSize: '1.05rem', marginBottom: 6 }}>{c.h1}</div>
            <div style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>{c.titre}</div>
          </Link>
        ))}
      </div>
    </main>
  )
}
