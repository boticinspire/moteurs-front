import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import routesData from '@/data/routes-vacances.json'
import { calculerTousVehicules, fmtEur, fmtDuree, type Route } from '@/lib/trajet'
import ComparateurTrajet from '../ComparateurTrajet'

const ROUTES = routesData as Route[]

// ─── Génération statique des pages ────────────────────────────────────────────

export async function generateStaticParams() {
  return ROUTES.map(route => ({ slug: route.slug }))
}

// ─── Métadonnées dynamiques ────────────────────────────────────────────────────

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  const { slug } = await params
  const route = ROUTES.find(r => r.slug === slug)
  if (!route) return {}

  const resultats = calculerTousVehicules(route)
  const gagnant = resultats[0]

  return {
    title: `${route.depart} → ${route.arrivee} : coût par motorisation (${route.distance_km} km) | Moteurs.com`,
    description: `Combien coûte le trajet ${route.depart}–${route.arrivee} en voiture ? En ${gagnant.label}, comptez ${fmtEur(gagnant.cout_total)} (énergie + péages). Comparez diesel, essence, électrique et hybride.`,
    openGraph: {
      title: `${route.depart} → ${route.arrivee} : quel carburant est le moins cher ?`,
      description: `Trajet ${route.distance_km} km — ${fmtEur(gagnant.cout_total)} en ${gagnant.label}, péages inclus. Comparatif complet diesel / essence / électrique / hybride.`,
    },
  }
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function PageTrajetSlug(
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  const route = ROUTES.find(r => r.slug === slug)
  if (!route) notFound()

  const resultats = calculerTousVehicules(route)
  const gagnant = resultats[0]
  const deuxieme = resultats[1]

  // JSON-LD Schema.org
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: `Coût trajet ${route.depart} → ${route.arrivee} par motorisation`,
    description: `Comparatif du coût de trajet ${route.depart}–${route.arrivee} (${route.distance_km} km) selon la motorisation du véhicule.`,
    url: `https://moteurs.com/comparer-trajet/${route.slug}`,
    mainEntity: {
      '@type': 'Table',
      name: `Comparatif coûts ${route.depart} → ${route.arrivee}`,
    },
  }

  return (
    <main className="container" style={{ paddingTop: 40, paddingBottom: 64 }}>
      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* ── Breadcrumb ── */}
      <nav style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', marginBottom: 24 }}>
        <a href="/" style={{ color: 'var(--color-text-muted)', textDecoration: 'none' }}>Accueil</a>
        {' '}/{' '}
        <a href="/comparer-trajet" style={{ color: 'var(--color-text-muted)', textDecoration: 'none' }}>Comparateur trajet</a>
        {' '}/{' '}
        <span>{route.depart} → {route.arrivee}</span>
      </nav>

      {/* ── Hero ── */}
      <div style={{ marginBottom: 36 }}>
        <div style={{ fontSize: '0.82rem', color: 'var(--color-primary)', fontWeight: 600, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {route.region} · {route.distance_km} km
        </div>
        <h1 style={{ fontSize: 'clamp(1.5rem, 3.5vw, 2.2rem)', marginBottom: 12, lineHeight: 1.2 }}>
          {route.depart} → {route.arrivee} :<br />
          <span style={{ color: 'var(--color-primary)' }}>quel carburant est le moins cher ?</span>
        </h1>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '1rem', lineHeight: 1.6, maxWidth: 600, marginBottom: 0 }}>
          Sur ce trajet de <strong>{route.distance_km} km</strong>, la motorisation la moins chère est{' '}
          <strong style={{ color: gagnant.couleur }}>{gagnant.label}</strong> avec{' '}
          <strong>{fmtEur(gagnant.cout_total)}</strong> (énergie + péages).
          Soit <strong>{fmtEur(deuxieme.cout_total - gagnant.cout_total)}</strong> de moins que le {deuxieme.label}.
        </p>
      </div>

      {/* ── Comparateur interactif (même composant) ── */}
      <ComparateurTrajet routeInitiale={route} />

      {/* ── Section SEO : infos trajet ── */}
      <section style={{ marginTop: 56, borderTop: '1px solid var(--color-border)', paddingTop: 36 }}>
        <h2 style={{ fontSize: '1.2rem', marginBottom: 20 }}>
          Informations pratiques : {route.depart} → {route.arrivee}
        </h2>
        <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
          <InfoBox icon="🛣️" titre="Distance" valeur={`${route.distance_km} km`} />
          <InfoBox icon="⏱️" titre="Durée de base" valeur={fmtDuree(route.duree_base_min)} />
          <InfoBox icon="💳" titre="Péages (tarif standard)" valeur={fmtEur(route.peages_eur)} />
          <InfoBox icon="⚡" titre="Arrêts recharge VE" valeur={`${Math.max(0, Math.ceil(route.distance_km / 270) - 1)} arrêt(s)`} />
        </div>

        <div style={{ marginTop: 28 }}>
          <h3 style={{ fontSize: '1rem', marginBottom: 12 }}>Synthèse des coûts pour ce trajet</h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--color-border)' }}>
                  <th style={{ padding: '10px 12px', textAlign: 'left', color: 'var(--color-text-muted)', fontWeight: 600 }}>Motorisation</th>
                  <th style={{ padding: '10px 12px', textAlign: 'right', color: 'var(--color-text-muted)', fontWeight: 600 }}>Énergie</th>
                  <th style={{ padding: '10px 12px', textAlign: 'right', color: 'var(--color-text-muted)', fontWeight: 600 }}>Péages</th>
                  <th style={{ padding: '10px 12px', textAlign: 'right', color: 'var(--color-text-muted)', fontWeight: 600 }}>Total aller</th>
                  <th style={{ padding: '10px 12px', textAlign: 'right', color: 'var(--color-text-muted)', fontWeight: 600 }}>Aller-retour</th>
                </tr>
              </thead>
              <tbody>
                {resultats.map(res => (
                  <tr key={res.id} style={{
                    borderBottom: '1px solid var(--color-border)',
                    background: res.gagnant ? 'rgba(5,150,105,0.05)' : 'transparent',
                  }}>
                    <td style={{ padding: '11px 12px', fontWeight: res.gagnant ? 700 : 400 }}>
                      {res.emoji} {res.label}
                      {res.gagnant && <span style={{ marginLeft: 6, color: '#059669', fontSize: '0.74rem' }}>✓ moins cher</span>}
                    </td>
                    <td style={{ padding: '11px 12px', textAlign: 'right' }}>{fmtEur(res.cout_energie)}</td>
                    <td style={{ padding: '11px 12px', textAlign: 'right' }}>{fmtEur(res.cout_peages)}</td>
                    <td style={{ padding: '11px 12px', textAlign: 'right', fontWeight: 700 }}>{fmtEur(res.cout_total)}</td>
                    <td style={{ padding: '11px 12px', textAlign: 'right', fontWeight: res.gagnant ? 700 : 400, color: res.gagnant ? '#059669' : undefined }}>
                      {fmtEur(res.cout_total * 2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ── Trajets proches ── */}
      <section style={{ marginTop: 48 }}>
        <h2 style={{ fontSize: '1rem', marginBottom: 14, color: 'var(--color-text-muted)' }}>
          Autres trajets depuis {route.depart}
        </h2>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {ROUTES.filter(r => r.slug !== route.slug && (r.depart === route.depart || r.arrivee === route.depart))
            .slice(0, 5)
            .map(r => (
              <a
                key={r.slug}
                href={`/comparer-trajet/${r.slug}`}
                style={{
                  padding: '8px 14px', borderRadius: 10, fontSize: '0.85rem',
                  background: 'var(--color-bg-card)', border: '1px solid var(--color-border)',
                  color: 'var(--color-text)', textDecoration: 'none', transition: 'all .15s',
                }}
              >
                {r.depart} → {r.arrivee} ({r.distance_km} km)
              </a>
            ))}
          <a href="/comparer-trajet" style={{
            padding: '8px 14px', borderRadius: 10, fontSize: '0.85rem',
            background: 'transparent', border: '1px solid var(--color-border)',
            color: 'var(--color-primary)', textDecoration: 'none',
          }}>
            Voir tous les trajets →
          </a>
        </div>
      </section>
    </main>
  )
}

function InfoBox({ icon, titre, valeur }: { icon: string; titre: string; valeur: string }) {
  return (
    <div style={{
      background: 'var(--color-bg-card)', border: '1px solid var(--color-border)',
      borderRadius: 10, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12,
    }}>
      <span style={{ fontSize: '1.4rem' }}>{icon}</span>
      <div>
        <div style={{ fontSize: '0.76rem', color: 'var(--color-text-muted)', marginBottom: 2 }}>{titre}</div>
        <div style={{ fontWeight: 700 }}>{valeur}</div>
      </div>
    </div>
  )
}
