/**
 * Page /trajet/[slug]/[variante] — déclinaisons SEO d'un trajet.
 *
 * Variantes :
 * - "electrique", "sans-peage", "famille", "camping-car", "le-moins-cher"  → thématiques
 * - "depuis-[ville]"                                                       → origine alternative
 *
 * SSG : ~15 routes × ~5-8 variantes ≈ 60-90 pages générées au build.
 */

import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Link } from '@/i18n/navigation'
import {
  allTrajetVariantParams,
  getTrajetBySlug,
  getVarianteInfo,
  toRoute,
  VARIANTES_LABELS,
  type TrajetSEO,
  type VarianteInfo,
} from '@/lib/trajets-seo'
import { calculerTousVehicules, fmtEur, type MotorisationTrajet } from '@/lib/trajet'
import CalculTrajet from '../../_components/CalculTrajet'
import BlocLegal from '../../_components/BlocLegal'
import ChecklistVacances from '../../_components/ChecklistVacances'
import MaillageVariantes from '../../_components/MaillageVariantes'
import FAQTrajet from '../../_components/FAQTrajet'

const ANNEE = new Date().getFullYear()

// ─── Generate static params ───────────────────────────────────────────────────

export async function generateStaticParams() {
  return allTrajetVariantParams()
}

// ─── Metadata ──────────────────────────────────────────────────────────────────

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string; variante: string }> }
): Promise<Metadata> {
  const { slug, variante: varianteSlug } = await params
  const trajet = getTrajetBySlug(slug)
  if (!trajet) return {}
  const variante = getVarianteInfo(trajet, varianteSlug)
  if (!variante) return {}

  const origineNom = variante.origineAlt?.ville ?? trajet.origine.ville
  const titre = `Trajet ${origineNom} → ${trajet.destination.ville} ${variante.label} (${ANNEE}) | Moteurs.com`
  const desc =
    `${variante.intent}. Calcul du coût ${origineNom} → ${trajet.destination.ville} (${trajet.distance_km} km), ` +
    `péages, vignettes${variante.theme === 'electrique' ? ', arrêts de recharge' : ''}.`

  return {
    title: titre,
    description: desc,
    openGraph: { title: titre, description: desc, type: 'article' },
    alternates: { canonical: `https://moteurs.com/trajet/${trajet.slug}/${variante.slug}` },
  }
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function PageTrajetVariante(
  { params }: { params: Promise<{ slug: string; variante: string }> }
) {
  const { slug, variante: varianteSlug } = await params
  const trajet = getTrajetBySlug(slug)
  if (!trajet) notFound()
  const variante = getVarianteInfo(trajet, varianteSlug)
  if (!variante) notFound()

  const route = toRoute(trajet, variante.origineAlt)
  const sansPeages = variante.theme === 'sans-peage'
  const motorisationFocus = focusFor(variante)

  const resultats = calculerTousVehicules(sansPeages ? { ...route, peages_eur: 0 } : route)
  const principal = motorisationFocus ? resultats.find(r => r.id === motorisationFocus) ?? resultats[0] : resultats[0]

  const origineNom = variante.origineAlt?.ville ?? trajet.origine.ville
  const h1 = construireH1(trajet, variante, origineNom)
  const intro = construireIntro(trajet, variante, origineNom, principal.cout_total, principal.label, motorisationFocus, sansPeages)

  const jsonLd = buildJsonLd(trajet, variante, origineNom)

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
        <Link href={`/trajet/${trajet.slug}`} style={lienBreadcrumb}>{trajet.titre_court}</Link>
        {' / '}
        <span>{variante.label}</span>
      </nav>

      {/* H1 + intro */}
      <header style={{ marginBottom: 28 }}>
        <div style={{ fontSize: '0.82rem', color: 'var(--color-primary)', fontWeight: 600, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {variante.emoji} {variante.label}
        </div>
        <h1 style={{ fontSize: 'clamp(1.5rem, 3.6vw, 2.2rem)', marginBottom: 14, lineHeight: 1.2 }}>
          {h1} <span style={{ color: 'var(--color-text-muted)', fontWeight: 400 }}>({ANNEE})</span>
        </h1>
        <p style={{ fontSize: '1rem', lineHeight: 1.6, maxWidth: 720, color: 'var(--color-text)' }}>
          {intro}
        </p>
      </header>

      {/* Calcul */}
      <CalculTrajet
        route={route}
        motorisationFocus={motorisationFocus}
        sansPeages={sansPeages}
      />

      {/* Bloc légal */}
      <BlocLegal paysTraverses={trajet.pays_traverses} />

      {/* Checklist adaptée */}
      <ChecklistVacances
        paysTraverses={trajet.pays_traverses}
        electrique={variante.theme === 'electrique'}
        famille={variante.theme === 'famille'}
        campingCar={variante.theme === 'camping-car'}
      />

      {/* Maillage variantes */}
      <MaillageVariantes trajet={trajet} varianteActive={variante.slug} />

      {/* FAQ */}
      <section style={{ marginTop: 48 }}>
        <FAQTrajet trajet={trajet} variante={variante} />
      </section>

      {/* CTA */}
      <section style={{ marginTop: 40, padding: 22, borderRadius: 14, background: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}>
        <h2 style={{ fontSize: '1.05rem', marginBottom: 12 }}>Approfondir</h2>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
          <Link href={`/trajet/${trajet.slug}`} style={btnSecondaire}>Vue complète {trajet.titre_court} →</Link>
          <Link href="/comparer-trajet" style={btnSecondaire}>Comparateur libre →</Link>
          <Link href="/simulateur" style={btnSecondaire}>Simulateur TCO →</Link>
        </div>
      </section>
    </main>
  )
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function focusFor(variante: VarianteInfo): MotorisationTrajet | undefined {
  if (variante.theme === 'electrique') return 'elec'
  return undefined
}

function construireH1(trajet: TrajetSEO, variante: VarianteInfo, origineNom: string): string {
  if (variante.origineAlt) {
    return `Trajet ${origineNom} → ${trajet.destination.ville} en voiture`
  }
  return `${trajet.titre_court} ${variante.label}`
}

function construireIntro(
  trajet: TrajetSEO,
  variante: VarianteInfo,
  origineNom: string,
  cout: number,
  label: string,
  focus: MotorisationTrajet | undefined,
  sansPeages: boolean,
): string {
  const distance = trajet.distance_km
  const base = `Trajet de ${distance} km entre ${origineNom} et ${trajet.destination.ville}, à travers ${trajet.pays_traverses.length} pays.`

  switch (variante.theme) {
    case 'electrique':
      return `${base} En voiture électrique, comptez ${fmtEur(cout)} aller simple, recharge sur autoroute incluse. Nombre d'arrêts et durée recalculés automatiquement selon votre véhicule.`
    case 'sans-peage':
      return `${base} En évitant les autoroutes à péage, vous économisez environ ${trajet.peages_eur} € — au prix d'environ 1 h de trajet supplémentaire. Coût total minimal : ${fmtEur(cout)}.`
    case 'famille':
      return `${base} Avec des enfants, prévoyez une pause toutes les 2 h ou 200 km. Notre checklist intègre tout ce qu\'il faut pour un trajet long en famille. Coût minimum estimé : ${fmtEur(cout)}.`
    case 'camping-car':
      return `${base} En camping-car, attention aux vignettes spécifiques (parfois majorées pour les +3,5 t), aux hauteurs de tunnel et aux aires de stationnement le long de la route. Budget énergie + péages : ${fmtEur(cout)} pour un moteur diesel équivalent.`
    case 'le-moins-cher':
      return `${base} Pour ce trajet, la solution la moins chère est ${label} avec ${fmtEur(cout)} (carburant + péages). Notre comparateur ci-dessous détaille pourquoi.`
    default:
      // depuis-ville
      return `${base} En ${label}, comptez ${fmtEur(cout)} aller simple toutes motorisations confondues — voir le détail ci-dessous.`
  }
}

function buildJsonLd(trajet: TrajetSEO, variante: VarianteInfo, origineNom: string) {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'TouristTrip',
        name: `${origineNom} → ${trajet.destination.ville} ${variante.label}`,
        description: `Itinéraire en voiture ${variante.label} entre ${origineNom} et ${trajet.destination.ville}.`,
        touristType: variante.theme ? VARIANTES_LABELS[variante.theme]?.intent : 'Road trip vacances',
        url: `https://moteurs.com/trajet/${trajet.slug}/${variante.slug}`,
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Accueil',          item: 'https://moteurs.com/' },
          { '@type': 'ListItem', position: 2, name: 'Trajets vacances', item: 'https://moteurs.com/trajet' },
          { '@type': 'ListItem', position: 3, name: trajet.titre_court, item: `https://moteurs.com/trajet/${trajet.slug}` },
          { '@type': 'ListItem', position: 4, name: variante.label,     item: `https://moteurs.com/trajet/${trajet.slug}/${variante.slug}` },
        ],
      },
    ],
  }
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const lienBreadcrumb: React.CSSProperties = { color: 'var(--color-text-muted)', textDecoration: 'none' }
const btnSecondaire: React.CSSProperties = {
  padding: '8px 14px', borderRadius: 10, fontSize: '0.88rem',
  background: 'transparent', border: '1px solid var(--color-border)',
  color: 'var(--color-text)', textDecoration: 'none',
}
