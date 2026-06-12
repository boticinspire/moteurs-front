/**
 * /outils/cartes-recharge/comparatif/[filtre]
 *
 * Pages "passerelles" SEO : une page indexable par intention de recherche
 * (sans abonnement, voyage Europe, flotte, France, Belgique), chacune rendant
 * le tableau comparatif pré-filtré côté serveur + FAQ + JSON-LD.
 *
 * Server Component SSG (revalidate 3600). Le registre des presets est dans
 * lib/cartes-selections.ts.
 */
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Link } from '@/i18n/navigation'
import { setRequestLocale } from 'next-intl/server'
import { routing } from '@/i18n/routing'
import { getCartes, getTarifs } from '@/lib/cartes-recharge'
import { SELECTIONS, getSelection } from '@/lib/cartes-selections'
import TableauCartes from '../../TableauCartes'
import FaqAccordion from '@/components/FaqAccordion'

export const revalidate = 3600

const BASE = 'https://moteurs.com'

export function generateStaticParams() {
  return routing.locales.flatMap((locale) =>
    SELECTIONS.map((s) => ({ locale, filtre: s.slug }))
  )
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; filtre: string }>
}): Promise<Metadata> {
  const { filtre } = await params
  const sel = getSelection(filtre)
  if (!sel) return { title: 'Comparatif cartes de recharge — Moteurs.com' }
  const path = `/outils/cartes-recharge/comparatif/${sel.slug}`
  return {
    title: sel.title,
    description: sel.description,
    alternates: { canonical: `${BASE}${path}` },
    openGraph: { title: sel.h1, description: sel.description },
  }
}

export default async function PagePasserelle({
  params,
}: {
  params: Promise<{ locale: string; filtre: string }>
}) {
  const { locale, filtre } = await params
  setRequestLocale(locale)

  const sel = getSelection(filtre)
  if (!sel) notFound()

  const toutes = await getCartes()
  const cartes = toutes.filter(sel.filtre)

  // Carte la moins chère (tarif AC de référence) pour l'ItemList JSON-LD.
  const classees = [...cartes].sort((a, b) => {
    const pa = getTarifs(a).ac_slow?.prix ?? getTarifs(a).dc_rapide?.prix ?? 99
    const pb = getTarifs(b).ac_slow?.prix ?? getTarifs(b).dc_rapide?.prix ?? 99
    return pa - pb
  })

  const itemListLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: sel.h1,
    description: sel.description,
    numberOfItems: classees.length,
    itemListElement: classees.map((c, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: c.nom,
      url: `${BASE}/outils/cartes-recharge/${c.id}`,
    })),
  }

  // NB : le JSON-LD FAQPage est injecté par <FaqAccordion> — pas de doublon ici.

  const autres = SELECTIONS.filter((s) => s.slug !== sel.slug)

  return (
    <main className="container" style={{ paddingTop: 32, paddingBottom: 64 }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListLd) }}
      />

      {/* ── Fil d'Ariane ── */}
      <nav style={{ fontSize: '0.85rem', marginBottom: 16, color: 'var(--color-text-muted)' }}>
        <Link href="/outils/cartes-recharge" style={{ color: 'inherit' }}>← Comparateur de cartes de recharge</Link>
      </nav>

      {/* ── Hero ── */}
      <header style={{ marginBottom: 8 }}>
        <div style={{ fontSize: '0.82rem', color: 'var(--color-primary)', fontWeight: 600, marginBottom: 10, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
          {sel.emoji} {cartes.length} carte{cartes.length > 1 ? 's' : ''} · Mis à jour 2026
        </div>
        <h1 style={{ fontSize: 'clamp(1.6rem, 4vw, 2.3rem)', marginBottom: 14, lineHeight: 1.2 }}>
          {sel.h1}
        </h1>
        <p style={{ maxWidth: 640, color: 'var(--color-text-muted)', fontSize: '1rem', lineHeight: 1.6 }}>
          {sel.intro}
        </p>
      </header>

      {/* ── Tableau pré-filtré (rendu serveur, indexable) ── */}
      <TableauCartes
        cartes={classees}
        heading={`Comparatif — ${sel.label}`}
        subtitle={`${cartes.length} carte${cartes.length > 1 ? 's' : ''} correspondant à ce profil, avec tarif au kWh par type de borne et abonnement mensuel.`}
        showFiltrePays={sel.showFiltrePays}
      />

      {/* ── FAQ ── */}
      <FaqAccordion items={sel.faq} title={`Questions fréquentes — ${sel.label}`} />

      {/* ── Maillage : autres sélections ── */}
      <section style={{ marginTop: 48 }}>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 16 }}>Autres comparatifs de cartes</h2>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {autres.map((s) => (
            <Link key={s.slug} href={`/outils/cartes-recharge/comparatif/${s.slug}`} style={{
              padding: '8px 16px', borderRadius: 24, fontSize: '0.88rem', fontWeight: 600,
              border: '1px solid var(--color-border)', color: 'var(--color-text)',
              textDecoration: 'none', background: 'var(--color-bg-card)',
            }}>
              {s.emoji} {s.label}
            </Link>
          ))}
          <Link href="/outils/cartes-recharge" style={{
            padding: '8px 16px', borderRadius: 24, fontSize: '0.88rem', fontWeight: 600,
            border: '1px solid var(--color-primary)', color: 'var(--color-primary)',
            textDecoration: 'none',
          }}>
            🧮 Calculateur complet
          </Link>
        </div>
      </section>
    </main>
  )
}
