import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { setRequestLocale } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import { getDessin, getDessinSlugs, CATEGORIE_LABEL } from '@/lib/dessins'
import { FLAGS } from '@/lib/supabase'
import DessinActions from './DessinActions'

export const revalidate = 3600

const SITE = 'https://moteurs.com'

export async function generateStaticParams() {
  const slugs = await getDessinSlugs()
  return slugs.map((slug) => ({ slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const d = await getDessin(slug)
  if (!d) return { title: 'Dessin introuvable' }
  return {
    title: { absolute: `${d.titre} — Dessins Moteurs.com` },
    description: d.legende ?? d.description ?? `Dessin « ${d.titre} » — la galerie de Moteurs.com.`,
    alternates: { canonical: `${SITE}/dessins/${d.slug}` },
    openGraph: {
      title: d.titre,
      description: d.legende ?? undefined,
      type: 'article',
      images: [{ url: d.image_url, alt: d.alt ?? d.titre }],
    },
    twitter: { card: 'summary_large_image' },
  }
}

export default async function DessinPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>
}) {
  const { locale, slug } = await params
  setRequestLocale(locale)

  const d = await getDessin(slug)
  if (!d) notFound()

  const url = `${SITE}/dessins/${d.slug}`

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ImageObject',
    name: d.titre,
    caption: d.legende ?? undefined,
    description: d.description ?? d.legende ?? undefined,
    contentUrl: d.image_url,
    url,
    width: d.largeur ?? undefined,
    height: d.hauteur ?? undefined,
    datePublished: d.date_publication,
    creditText: d.auteur,
    author: { '@type': 'Organization', name: d.auteur, url: `${SITE}/a-propos` },
    copyrightHolder: { '@type': 'Organization', name: 'Moteurs.com', url: SITE },
    isPartOf: { '@type': 'CollectionPage', name: 'Dessins Moteurs.com', url: `${SITE}/dessins` },
  }

  const breadcrumb = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Accueil', item: SITE },
      { '@type': 'ListItem', position: 2, name: 'Dessins', item: `${SITE}/dessins` },
      { '@type': 'ListItem', position: 3, name: d.titre, item: url },
    ],
  }

  return (
    <main style={{ maxWidth: 920, margin: '0 auto', padding: '28px 20px 72px' }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />

      {/* Fil d'Ariane */}
      <nav style={{ fontSize: '0.85rem', color: 'var(--color-text-soft)', marginBottom: 20 }}>
        <Link href="/dessins" style={{ color: 'var(--color-primary)', textDecoration: 'none' }}>
          ← Tous les dessins
        </Link>
      </nav>

      <div
        style={{
          fontSize: '0.74rem',
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.03em',
          color: 'var(--color-primary)',
          marginBottom: 8,
        }}
      >
        {CATEGORIE_LABEL[d.categorie] ?? d.categorie}
        {d.pays_cible && FLAGS[d.pays_cible] ? `  ·  ${FLAGS[d.pays_cible]}` : ''}
      </div>

      <h1 style={{ fontSize: 'clamp(1.5rem, 3.5vw, 2.2rem)', fontWeight: 800, lineHeight: 1.18, marginBottom: 18 }}>
        {d.titre}
      </h1>

      <figure style={{ margin: 0 }}>
        <div
          style={{
            borderRadius: 16,
            overflow: 'hidden',
            border: '1px solid var(--color-border)',
            background: 'var(--color-bg-alt)',
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={d.image_url}
            alt={d.alt ?? d.titre}
            width={d.largeur ?? undefined}
            height={d.hauteur ?? undefined}
            style={{ width: '100%', height: 'auto', display: 'block' }}
          />
        </div>
        {d.legende && (
          <figcaption
            style={{
              marginTop: 12,
              fontSize: '0.95rem',
              fontStyle: 'italic',
              color: 'var(--color-text-soft)',
              lineHeight: 1.6,
            }}
          >
            {d.legende}
          </figcaption>
        )}
      </figure>

      {d.description && (
        <p style={{ marginTop: 18, color: 'var(--color-text)', lineHeight: 1.7, fontSize: '1rem' }}>
          {d.description}
        </p>
      )}

      <DessinActions url={url} titre={d.titre} imageUrl={d.image_url} />

      <p style={{ marginTop: 22, fontSize: '0.82rem', color: 'var(--color-text-soft)' }}>
        © {d.auteur} · Reproduction soumise à autorisation.
        {d.article_slug && (
          <>
            {' '}
            <Link href={`/article/${d.article_slug}`} style={{ color: 'var(--color-primary)' }}>
              Lire le décryptage associé →
            </Link>
          </>
        )}
      </p>
    </main>
  )
}
