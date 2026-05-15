import type { Metadata } from 'next'
import Link from 'next/link'
import { SEGMENT_LABELS } from '@/lib/tco'
import type { Segment } from '@/lib/tco'
import Flag from '@/components/Flag'

export const metadata: Metadata = {
  title: 'Comparatifs TCO par segment — France, Belgique, Suisse, Canada 2026',
  description:
    'Tous les comparatifs de coût total de possession (TCO) par type de véhicule et par pays. Diesel, électrique, hydrogène, GNV, PHEV — aides 2026 incluses.',
}

const PAYS = [
  { slug: 'fr', label: 'France'   },
  { slug: 'be', label: 'Belgique' },
  { slug: 'ch', label: 'Suisse'   },
  { slug: 'ca', label: 'Canada'   },
]

const SEGMENTS_B2B: { slug: string; segment: Segment }[] = [
  { slug: 'vul-petit',   segment: 'vul_petit'   },
  { slug: 'vul-moyen',   segment: 'vul_moyen'   },
  { slug: 'vul-grand',   segment: 'vul_grand'   },
  { slug: 'camion',      segment: 'camion'       },
  { slug: 'poids-lourd', segment: 'poids_lourd'  },
]

const SEGMENTS_PARTICULIER: { slug: string; segment: Segment }[] = [
  { slug: 'voiture',     segment: 'voiture'     },
  { slug: 'vae',         segment: 'vae'         },
  { slug: 'trottinette', segment: 'trottinette' },
  { slug: 'moto',        segment: 'moto'        },
]

function SegmentGrid({ segments, pays }: {
  segments: { slug: string; segment: Segment }[]
  pays: typeof PAYS
}) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
      {segments.map(({ slug, segment }) => (
        <div key={slug} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ fontWeight: 700, fontSize: '0.88rem', padding: '8px 0 4px' }}>
            {SEGMENT_LABELS[segment]}
          </div>
          {pays.map(p => (
            <Link
              key={p.slug}
              href={`/tco/${p.slug}/${slug}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '7px 12px',
                background: 'var(--color-bg-alt)',
                border: '1px solid var(--color-border)',
                borderRadius: 8,
                textDecoration: 'none',
                color: 'var(--color-text)',
                fontSize: '0.83rem',
                transition: 'border-color 0.15s',
              }}
            >
              <Flag code={p.slug} size={16} />
              <span>TCO {p.label}</span>
            </Link>
          ))}
        </div>
      ))}
    </div>
  )
}

export default function TcoIndexPage() {
  return (
    <>
      <section className="page-hero">
        <div className="container">
          <h1>Comparatifs TCO 2026</h1>
          <p>
            Coût total de possession par segment et par pays — aides, énergie et entretien inclus.
            Données triangulées, hypothèses affichées, 4 pays francophones.
          </p>
        </div>
      </section>

      <section style={{ padding: '48px 0 80px' }}>
        <div className="container">

          <div style={{ marginBottom: 48 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
              <span style={{ padding: '3px 10px', background: 'var(--color-bg-alt)', border: '1px solid var(--color-border)', borderRadius: 20, fontSize: '0.78rem', fontWeight: 700 }}>B2B</span>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>PME · Artisans · Flottes · Transporteurs</h2>
            </div>
            <SegmentGrid segments={SEGMENTS_B2B} pays={PAYS} />
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
              <span style={{ padding: '3px 10px', background: 'var(--color-bg-alt)', border: '1px solid var(--color-border)', borderRadius: 20, fontSize: '0.78rem', fontWeight: 700, color: 'var(--color-primary)' }}>Particulier</span>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>Achat personnel · Famille · Micromobilité</h2>
            </div>
            <SegmentGrid segments={SEGMENTS_PARTICULIER} pays={PAYS} />
          </div>

          <div style={{
            marginTop: 56,
            padding: '24px 28px',
            background: 'var(--color-bg-alt)',
            borderRadius: 12,
            border: '1px solid var(--color-border)',
          }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 10 }}>
              Besoin de paramètres personnalisés ?
            </h3>
            <p style={{ fontSize: '0.88rem', color: 'var(--color-text-soft)', marginBottom: 16, maxWidth: 560 }}>
              Ces pages utilisent des hypothèses standard (48 mois, profil mixte, kilométrage moyen).
              Le comparateur interactif vous permet d&apos;ajuster chaque paramètre en temps réel.
            </p>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <Link href="/comparer" className="btn btn-primary btn-sm">Comparateur personnalisé →</Link>
              <Link href="/simulateur" className="btn btn-secondary btn-sm">Simulateur détaillé</Link>
            </div>
          </div>

        </div>
      </section>
    </>
  )
}
