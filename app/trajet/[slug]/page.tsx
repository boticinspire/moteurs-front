/**
 * Page /trajet/[slug] — page mère SEO d'un grand trajet européen.
 * SSG (build time). 15 pages générées (une par TrajetSEO).
 */

import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import {
  TRAJETS_SEO,
  getTrajetBySlug,
  toRoute,
  type TrajetSEO,
} from '@/lib/trajets-seo'
import { calculerTousVehicules, fmtEur } from '@/lib/trajet'
import { coutVignettesTrajet } from '@/lib/legal-pays'
import CalculTrajet from '../_components/CalculTrajet'
import BlocLegal from '../_components/BlocLegal'
import ChecklistVacances from '../_components/ChecklistVacances'
import MaillageVariantes from '../_components/MaillageVariantes'
import FAQTrajet from '../_components/FAQTrajet'

const ANNEE = new Date().getFullYear()

// ─── Generate static params ───────────────────────────────────────────────────

export async function generateStaticParams() {
  return TRAJETS_SEO.map(t => ({ slug: t.slug }))
}

// ─── Metadata ──────────────────────────────────────────────────────────────────

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  const { slug } = await params
  const trajet = getTrajetBySlug(slug)
  if (!trajet) return {}

  const route = toRoute(trajet)
  const resultats = calculerTousVehicules(route)
  const gagnant = resultats[0]

  const title = `Trajet ${trajet.titre_court} en voiture (${ANNEE}) — coût, péages, recharge | Moteurs.com`
  const desc =
    `Calculer le coût d'un trajet ${trajet.origine.ville} → ${trajet.destination.ville} ` +
    `(${trajet.distance_km} km) : ${fmtEur(gagnant.cout_total)} en ${gagnant.label}, vignettes, ZFE, recharge VE. ` +
    `Diesel, essence, électrique, hybride comparés.`

  return {
    title,
    description: desc,
    openGraph: {
      title: `${trajet.titre_court} en voiture — combien ça coûte vraiment ?`,
      description: desc,
      type: 'article',
    },
    alternates: { canonical: `https://moteurs.com/trajet/${trajet.slug}` },
  }
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function PageTrajet(
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  const trajet = getTrajetBySlug(slug)
  if (!trajet) notFound()

  const route = toRoute(trajet)
  const resultats = calculerTousVehicules(route)
  const gagnant = resultats[0]
  const deuxieme = resultats[1]
  const coutVignettes = coutVignettesTrajet(trajet.pays_traverses)

  const jsonLd = buildJsonLd(trajet)

  return (
    <main className="container" style={{ paddingTop: 36, paddingBottom: 64 }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Fil d'Ariane */}
      <nav style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', marginBottom: 22 }}>
        <Link href="/" style={lienBreadcrumb}>Accueil</Link>
        {' / '}
        <Link href="/trajet" style={lienBreadcrumb}>Trajets vacances</Link>
        {' / '}
        <span>{trajet.titre_court}</span>
      </nav>

      {/* H1 + intro */}
      <header style={{ marginBottom: 28 }}>
        <div style={{ fontSize: '0.82rem', color: 'var(--color-primary)', fontWeight: 600, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {trajet.pays_traverses.length} pays traversés · {trajet.region}
        </div>
        <h1 style={{ fontSize: 'clamp(1.6rem, 3.8vw, 2.4rem)', marginBottom: 14, lineHeight: 1.2 }}>
          Trajet {trajet.titre_court} en voiture <span style={{ color: 'var(--color-text-muted)', fontWeight: 400 }}>({ANNEE})</span>
        </h1>
        <p style={{ fontSize: '1rem', lineHeight: 1.6, maxWidth: 700, color: 'var(--color-text)' }}>
          Itinéraire de <strong>{trajet.distance_km} km</strong> entre <strong>{trajet.origine.ville}</strong> et <strong>{trajet.destination.ville}</strong>.
          {' '}La motorisation la plus économique sur ce trajet est <strong style={{ color: gagnant.couleur }}>{gagnant.label}</strong> avec{' '}
          <strong>{fmtEur(gagnant.cout_total)}</strong> (carburant + péages), soit <strong>{fmtEur(deuxieme.cout_total - gagnant.cout_total)}</strong> de moins que le {deuxieme.label}.
          {coutVignettes > 0 && <> Prévoir aussi <strong>~{coutVignettes} €</strong> de vignettes autoroutières.</>}
        </p>
      </header>

      {/* Calcul TCO multi-motorisations */}
      <CalculTrajet route={route} />

      {/* Bloc légal */}
      <BlocLegal paysTraverses={trajet.pays_traverses} />

      {/* Checklist */}
      <ChecklistVacances paysTraverses={trajet.pays_traverses} famille />

      {/* Maillage variantes */}
      <MaillageVariantes trajet={trajet} />

      {/* FAQ */}
      <section style={{ marginTop: 48 }}>
        <FAQTrajet trajet={trajet} />
      </section>

      {/* CTA outils */}
      <section style={{ marginTop: 40, padding: 22, borderRadius: 14, background: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}>
        <h2 style={{ fontSize: '1.05rem', marginBottom: 12 }}>Outils complémentaires</h2>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
          <Link href={`/comparer-trajet`} style={btnSecondaire}>Comparateur libre →</Link>
          <Link href={`/simulateur`} style={btnSecondaire}>Simulateur TCO complet →</Link>
          <Link href={`/checklist-depart`} style={btnSecondaire}>Checklist détaillée →</Link>
          <Link href={`/constat`} style={btnSecondaire}>Constat amiable européen →</Link>
        </div>
      </section>
    </main>
  )
}

// ─── JSON-LD ──────────────────────────────────────────────────────────────────

function buildJsonLd(trajet: TrajetSEO) {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      // 1. TouristTrip — anchor sémantique principale
      {
        '@type': 'TouristTrip',
        name: `Trajet ${trajet.titre_court}`,
        description: `Itinéraire en voiture entre ${trajet.origine.ville} et ${trajet.destination.ville} (${trajet.distance_km} km).`,
        touristType: 'Road trip vacances',
        itinerary: {
          '@type': 'ItemList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, item: { '@type': 'Place', name: trajet.origine.ville, geo: { '@type': 'GeoCoordinates', latitude: trajet.origine.lat, longitude: trajet.origine.lon } } },
            { '@type': 'ListItem', position: 2, item: { '@type': 'Place', name: trajet.destination.ville, geo: { '@type': 'GeoCoordinates', latitude: trajet.destination.lat, longitude: trajet.destination.lon } } },
          ],
        },
        partOfTrip: { '@type': 'Trip', name: `${trajet.origine.ville} → ${trajet.destination.ville}` },
        url: `https://moteurs.com/trajet/${trajet.slug}`,
      },
      // 2. BreadcrumbList
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Accueil',        item: 'https://moteurs.com/' },
          { '@type': 'ListItem', position: 2, name: 'Trajets vacances', item: 'https://moteurs.com/trajet' },
          { '@type': 'ListItem', position: 3, name: trajet.titre_court, item: `https://moteurs.com/trajet/${trajet.slug}` },
        ],
      },
    ],
  }
}

// ─── Styles partagés ──────────────────────────────────────────────────────────

const lienBreadcrumb: React.CSSProperties = { color: 'var(--color-text-muted)', textDecoration: 'none' }
const btnSecondaire: React.CSSProperties = {
  padding: '8px 14px', borderRadius: 10, fontSize: '0.88rem',
  background: 'transparent', border: '1px solid var(--color-border)',
  color: 'var(--color-text)', textDecoration: 'none',
}
