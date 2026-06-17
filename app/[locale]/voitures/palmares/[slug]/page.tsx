import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import type { CSSProperties } from 'react'
import { Link } from '@/i18n/navigation'
import { CLASSEMENTS, getClassement, consoReelle100 } from '@/lib/voitures'

export const revalidate = 86400

export function generateStaticParams() {
  return CLASSEMENTS.map((c) => ({ slug: c.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const c = CLASSEMENTS.find((x) => x.slug === slug)
  if (!c) return { title: 'Palmarès introuvable' }
  return {
    title: { absolute: `${c.h1} (2026) | Moteurs.com` },
    description: c.description,
    alternates: { canonical: `https://moteurs.com/voitures/palmares/${slug}` },
    openGraph: { title: c.h1, description: c.description, type: 'website', url: `https://moteurs.com/voitures/palmares/${slug}` },
  }
}

export default async function PalmaresPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const res = await getClassement(slug, 25)
  if (!res) notFound()
  const { critere, modeles } = res

  const itemList = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: critere.h1,
    itemListElement: modeles.map((m, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      url: `https://moteurs.com/voitures/${m.slug}`,
      name: `${m.make} ${m.model}`,
    })),
  }
  const breadcrumb = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Accueil', item: 'https://moteurs.com/' },
      { '@type': 'ListItem', position: 2, name: 'Voitures électriques', item: 'https://moteurs.com/voitures' },
      { '@type': 'ListItem', position: 3, name: 'Palmarès', item: 'https://moteurs.com/voitures/palmares' },
      { '@type': 'ListItem', position: 4, name: critere.titre, item: `https://moteurs.com/voitures/palmares/${slug}` },
    ],
  }

  const cell: CSSProperties = { padding: '10px 10px', borderBottom: '1px solid var(--color-border)', fontSize: 14 }
  const th: CSSProperties = { ...cell, textAlign: 'left', color: 'var(--color-text-muted)', fontWeight: 600, fontSize: 12 }

  return (
    <main style={{ maxWidth: 880, margin: '0 auto', padding: '28px 20px 64px' }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemList) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />

      <nav style={{ fontSize: 13, color: 'var(--color-text-muted)', marginBottom: 12 }}>
        <Link href="/voitures/palmares" style={{ color: 'var(--color-text-muted)' }}>← Tous les palmarès</Link>
      </nav>

      <h1 style={{ fontSize: '1.8rem', lineHeight: 1.2, marginBottom: 10 }}>{critere.h1}</h1>
      <p style={{ color: 'var(--color-text-muted)', maxWidth: 720, marginBottom: 24 }}>{critere.intro}</p>

      <div style={{ overflowX: 'auto', marginBottom: 28 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ ...th, width: 40 }}>#</th>
              <th style={th}>Modèle</th>
              <th style={{ ...th, textAlign: 'right' as const }}>{critere.titre}</th>
              <th style={{ ...th, textAlign: 'right' as const }}>Autonomie</th>
              <th style={{ ...th, textAlign: 'right' as const }}>Charge</th>
            </tr>
          </thead>
          <tbody>
            {modeles.map((m, i) => {
              const conso = consoReelle100(m)
              return (
                <tr key={m.slug}>
                  <td style={{ ...cell, fontWeight: 700, color: i < 3 ? 'var(--color-primary)' : 'var(--color-text-muted)' }}>{i + 1}</td>
                  <td style={cell}>
                    <Link href={`/voitures/${m.slug}`} style={{ fontWeight: 600, color: 'var(--color-text)' }}>
                      {m.make} {m.model}
                    </Link>
                    {conso && <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>~{conso} kWh/100 km</div>}
                  </td>
                  <td style={{ ...cell, textAlign: 'right', fontWeight: 700 }}>{critere.valeur(m)}</td>
                  <td style={{ ...cell, textAlign: 'right' }}>{m.wltpMax ? `${m.wltpMax} km` : '—'}</td>
                  <td style={{ ...cell, textAlign: 'right' }}>{m.dcMax ? `${m.dcMax} kW` : '—'}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Autres palmarès */}
      <section style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: '1.05rem', marginBottom: 10 }}>Autres classements</h2>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {CLASSEMENTS.filter((c) => c.slug !== slug).map((c) => (
            <Link key={c.slug} href={`/voitures/palmares/${c.slug}`}
              style={{ fontSize: 13, padding: '6px 12px', borderRadius: 999, border: '1px solid var(--color-border)', background: 'var(--color-bg-card)', textDecoration: 'none', color: 'var(--color-text)' }}>
              {c.titre}
            </Link>
          ))}
        </div>
      </section>

      <p style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
        Classement calculé à partir du catalogue Moteurs.com (données OpenEV Data, licence
        CDLA-Permissive-2.0). Autonomie WLTP constructeur ; consommation et recharge estimées.
      </p>
    </main>
  )
}
