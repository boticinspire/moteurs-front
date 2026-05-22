/**
 * Page index /trajet — hub des 15 trajets SEO + lien vers le comparateur libre.
 */

import type { Metadata } from 'next'
import { Link } from '@/i18n/navigation'
import { TRAJETS_SEO } from '@/lib/trajets-seo'

export const metadata: Metadata = {
  title: 'Itinéraires vacances Europe — coût, péages, recharge | Moteurs.com',
  description:
    'Comparez le coût et les contraintes des 15 grands itinéraires vacances européens : péages, vignettes, recharge électrique, ZFE — diesel, essence, électrique, hybride.',
  openGraph: {
    title: 'Itinéraires vacances Europe — calcul de coût',
    description: '15 trajets vacances décryptés : péages, vignettes, recharge VE, motorisation la moins chère.',
  },
}

export default function PageTrajetsIndex() {
  return (
    <main className="container" style={{ paddingTop: 40, paddingBottom: 64 }}>
      <div style={{ textAlign: 'center', marginBottom: 36 }}>
        <div style={{ fontSize: '0.82rem', color: 'var(--color-primary)', fontWeight: 600, marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          15 grands trajets décryptés
        </div>
        <h1 style={{ fontSize: 'clamp(1.6rem, 4vw, 2.4rem)', marginBottom: 12, lineHeight: 1.2 }}>
          Itinéraires vacances Europe :<br />
          <span style={{ color: 'var(--color-primary)' }}>coût, péages, recharge, légal</span>
        </h1>
        <p style={{ maxWidth: 580, margin: '0 auto', color: 'var(--color-text-muted)', fontSize: '1rem', lineHeight: 1.6 }}>
          Pour chaque grand axe européen, on calcule le coût réel par motorisation,
          on liste les vignettes obligatoires et on prépare votre départ.
        </p>
      </div>

      <div style={{ display: 'grid', gap: 14, gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
        {TRAJETS_SEO.map(t => (
          <Link
            key={t.slug}
            href={`/trajet/${t.slug}`}
            style={{
              background: 'var(--color-bg-card)', border: '1px solid var(--color-border)',
              borderRadius: 12, padding: 18, textDecoration: 'none',
              color: 'var(--color-text)', transition: 'all .15s',
              display: 'block',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: '1.8rem' }}>{t.emoji}</span>
              <span style={{
                fontSize: '0.7rem', padding: '3px 8px', borderRadius: 6,
                background: t.difficulte === 'Élevée' ? 'rgba(220,38,38,0.10)' : t.difficulte === 'Moyenne' ? 'rgba(217,119,6,0.10)' : 'rgba(5,150,105,0.10)',
                color:      t.difficulte === 'Élevée' ? '#dc2626' : t.difficulte === 'Moyenne' ? '#d97706' : '#059669',
              }}>
                {t.difficulte}
              </span>
            </div>
            <h2 style={{ fontSize: '1.05rem', margin: 0, marginBottom: 6 }}>{t.titre_court}</h2>
            <div style={{ fontSize: '0.84rem', color: 'var(--color-text-muted)', marginBottom: 10 }}>
              {t.origine.ville} → {t.destination.ville} · {t.distance_km} km
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', lineHeight: 1.4 }}>
              {t.pays_traverses.length} pays traversés · ~{t.peages_eur} € de péages
            </div>
          </Link>
        ))}
      </div>

      <div style={{ marginTop: 40, textAlign: 'center' }}>
        <Link href="/comparer-trajet" style={{
          display: 'inline-block', padding: '12px 26px', borderRadius: 10,
          background: 'var(--color-primary)', color: 'var(--color-bg)',
          fontWeight: 600, textDecoration: 'none', fontSize: '0.95rem',
        }}>
          Comparer un trajet libre →
        </Link>
      </div>
    </main>
  )
}
