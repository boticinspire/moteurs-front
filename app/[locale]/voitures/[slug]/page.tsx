import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import type { CSSProperties } from 'react'
import { Link } from '@/i18n/navigation'
import { getVoiture, getVoitureSlugs, consoReelle100, type EvModele } from '@/lib/voitures'
import { syntheticCurve, chargeTimeMin, type VoltageClass } from '@/lib/ev-charge-model'
import CoutRechargeModele from './CoutRechargeModele'

export const revalidate = 86400

export async function generateStaticParams() {
  const slugs = await getVoitureSlugs()
  return slugs.map((slug) => ({ slug }))
}

function titreModele(m: EvModele): string {
  return `${m.make} ${m.model}`
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const m = await getVoiture(slug)
  if (!m) return { title: 'Modèle introuvable' }
  const t = titreModele(m)
  const desc = `${t} électrique : ${m.battMax ?? '—'} kWh, ${m.wltpMax ?? '—'} km WLTP, charge ${m.dcMax ?? '—'} kW. Autonomie réelle, temps de recharge estimé et coût.`
  return {
    title: { absolute: `${t} : autonomie, recharge & fiche technique | Moteurs.com` },
    description: desc,
    alternates: { canonical: `https://moteurs.com/voitures/${slug}` },
    openGraph: { title: `${t} — voiture électrique`, description: desc, type: 'website', url: `https://moteurs.com/voitures/${slug}` },
  }
}

function CourbeCharge({ m }: { m: EvModele }) {
  if (!m.dcMax || !m.battMax) return null
  const pts = syntheticCurve({ dcPeakKw: m.dcMax, voltageClass: (m.voltageClass as VoltageClass) ?? undefined, battKwhNet: m.battMax }, 5)
  const W = 320, H = 120, pad = 24
  const maxKw = Math.max(...pts.map((p) => p.kw), 1)
  const x = (soc: number) => pad + (soc / 100) * (W - pad * 2)
  const y = (kw: number) => H - pad - (kw / maxKw) * (H - pad * 2)
  const d = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${x(p.soc).toFixed(1)},${y(p.kw).toFixed(1)}`).join(' ')
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ maxWidth: 360 }} role="img" aria-label="Courbe de charge estimée">
      <line x1={pad} y1={H - pad} x2={W - pad} y2={H - pad} stroke="var(--color-border)" />
      <line x1={pad} y1={pad} x2={pad} y2={H - pad} stroke="var(--color-border)" />
      <path d={d} fill="none" stroke="var(--color-primary)" strokeWidth={2.5} />
      <text x={W / 2} y={H - 4} textAnchor="middle" fontSize="9" fill="var(--color-text-muted)">% batterie (SOC)</text>
      <text x={W - pad} y={y(maxKw) - 4} textAnchor="end" fontSize="9" fill="var(--color-text-muted)">{maxKw} kW</text>
    </svg>
  )
}

export default async function VoiturePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const m = await getVoiture(slug)
  if (!m) notFound()

  const t = titreModele(m)
  const conso = consoReelle100(m)
  const tps1080 =
    m.dcMax && m.battMax
      ? chargeTimeMin({ battKwhNet: m.battMax, dcPeakKw: m.dcMax, voltageClass: (m.voltageClass as VoltageClass) ?? undefined, stationKw: 150 }, 10, 80)
      : null

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Car',
    name: t,
    brand: { '@type': 'Brand', name: m.make },
    model: m.model,
    fuelType: 'Electric',
    url: `https://moteurs.com/voitures/${slug}`,
    ...(m.dcMax ? { } : {}),
    additionalProperty: [
      m.battMax && { '@type': 'PropertyValue', name: 'Capacité batterie', value: `${m.battMax} kWh` },
      m.wltpMax && { '@type': 'PropertyValue', name: 'Autonomie WLTP', value: `${m.wltpMax} km` },
      m.dcMax && { '@type': 'PropertyValue', name: 'Puissance de charge DC', value: `${m.dcMax} kW` },
      conso && { '@type': 'PropertyValue', name: 'Consommation réelle estimée', value: `${conso} kWh/100 km` },
    ].filter(Boolean),
  }
  const breadcrumb = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Accueil', item: 'https://moteurs.com/' },
      { '@type': 'ListItem', position: 2, name: 'Voitures électriques', item: 'https://moteurs.com/voitures' },
      { '@type': 'ListItem', position: 3, name: t, item: `https://moteurs.com/voitures/${slug}` },
    ],
  }

  const cell: CSSProperties = { padding: '8px 10px', borderBottom: '1px solid var(--color-border)', fontSize: 14 }

  return (
    <main style={{ maxWidth: 880, margin: '0 auto', padding: '28px 20px 64px' }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />

      <nav style={{ fontSize: 13, color: 'var(--color-text-muted)', marginBottom: 12 }}>
        <Link href="/voitures" style={{ color: 'var(--color-text-muted)' }}>← Toutes les voitures électriques</Link>
      </nav>

      <h1 style={{ fontSize: '1.8rem', lineHeight: 1.2, marginBottom: 6 }}>
        {t} — autonomie, recharge & fiche technique
      </h1>
      <p style={{ color: 'var(--color-text-muted)', marginBottom: 24 }}>
        Voiture électrique{m.yearLatest ? ` · millésime ${m.yearLatest}` : ''}
        {m.variants.length > 1 ? ` · ${m.variants.length} versions` : ''}.
      </p>

      {/* Specs représentatives */}
      <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', marginBottom: 28 }}>
        {[
          ['Batterie', m.battMax ? `${m.battMax} kWh` : '—'],
          ['Autonomie WLTP', m.wltpMax ? `${m.wltpMax} km` : '—'],
          ['Conso réelle', conso ? `~${conso} kWh/100 km` : '—'],
          ['Charge DC', m.dcMax ? `${m.dcMax} kW${m.voltageClass === '800v' ? ' · 800V' : ''}` : '—'],
          ['Recharge 10→80 %', tps1080 ? `~${tps1080} min` : '—'],
          ['Places', m.seats ? `${m.seats}` : '—'],
        ].map(([k, v]) => (
          <div key={k} style={{ padding: '12px 14px', borderRadius: 12, border: '1.5px solid var(--color-border)', background: 'var(--color-bg-card)' }}>
            <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>{k}</div>
            <div style={{ fontWeight: 700, fontSize: '1.05rem' }}>{v}</div>
          </div>
        ))}
      </div>

      {/* Courbe de charge */}
      {m.dcMax && m.battMax && (
        <section style={{ marginBottom: 28 }}>
          <h2 style={{ fontSize: '1.1rem', marginBottom: 6 }}>Courbe de charge rapide (estimée)</h2>
          <p style={{ fontSize: 13, color: 'var(--color-text-muted)', marginBottom: 8 }}>
            Puissance de charge selon le niveau de batterie. Estimation paramétrique à partir de la
            puissance crête ({m.dcMax} kW) et de l’architecture {m.voltageClass === '800v' ? '800V' : '400V'}.
          </p>
          <CourbeCharge m={m} />
        </section>
      )}

      {/* Coût de recharge selon la carte (croisement tarifs_carte_pays) */}
      {m.battMax && <CoutRechargeModele battKwh={m.battMax} dcMax={m.dcMax} />}

      {/* Variantes */}
      {m.variants.length > 0 && (
        <section style={{ marginBottom: 28 }}>
          <h2 style={{ fontSize: '1.1rem', marginBottom: 8 }}>Versions</h2>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {['Version', 'Année', 'Batterie', 'WLTP', 'Charge DC'].map((h) => (
                    <th key={h} style={{ ...cell, textAlign: 'left', color: 'var(--color-text-muted)', fontWeight: 600 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {m.variants.slice(0, 30).map((v) => (
                  <tr key={v.id}>
                    <td style={cell}>{v.trim && v.trim.toLowerCase() !== 'base' ? v.trim : '—'}</td>
                    <td style={cell}>{v.year ?? '—'}</td>
                    <td style={cell}>{(v.batt_kwh_net ?? v.batt_kwh_gross) ? `${v.batt_kwh_net ?? v.batt_kwh_gross} kWh` : '—'}</td>
                    <td style={cell}>{v.wltp_km ? `${v.wltp_km} km` : '—'}</td>
                    <td style={cell}>{v.dc_kw ? `${v.dc_kw} kW` : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Liens outils */}
      <section style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: '1.1rem', marginBottom: 10 }}>Aller plus loin avec ce modèle</h2>
        <div style={{ display: 'grid', gap: 10, gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
          {[
            ['/comparer', '💶 Calculer son coût (TCO)', 'Comparez le coût total face au diesel, essence, hybride.'],
            ['/comparer-trajet', '🗺️ Coût & recharge d’un trajet', 'Temps de charge réel et arrêts sur votre itinéraire.'],
            ['/outils/cartes-recharge', '⚡ Cartes de recharge', 'Le meilleur tarif au kWh pour recharger ce modèle.'],
          ].map(([href, titre, sous]) => (
            <Link key={href} href={href} style={{ display: 'block', padding: '14px 16px', borderRadius: 12, border: '1.5px solid var(--color-border)', background: 'var(--color-bg-card)', textDecoration: 'none', color: 'var(--color-text)' }}>
              <div style={{ fontWeight: 700, marginBottom: 4 }}>{titre}</div>
              <div style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>{sous}</div>
            </Link>
          ))}
        </div>
      </section>

      <p style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
        Données véhicule : OpenEV Data (licence CDLA-Permissive-2.0). Consommation réelle estimée
        (WLTP × 1,15) et temps de recharge calculé par un modèle paramétrique (borne 150 kW) —
        valeurs indicatives, susceptibles de varier selon conditions et version.
      </p>
    </main>
  )
}
