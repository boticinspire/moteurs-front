import type { Metadata } from 'next'
import { setRequestLocale } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import { routing } from '@/i18n/routing'
import { buildAlternates } from '@/lib/seo-utils'
import { getDessins, CATEGORIES, CATEGORIE_LABEL } from '@/lib/dessins'

export const revalidate = 3600

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }))
}

const SITE = 'https://moteurs.com'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  return {
    title: { absolute: 'Dessins & humour — la transition énergétique en images | Moteurs.com' },
    description:
      "La galerie de dessins de Moteurs.com : le coup de crayon humoristique de l'actu auto, les illustrations et visuels de nos décryptages sur la voiture électrique, les ZFE et la mobilité.",
    keywords:
      'dessin de presse voiture électrique, humour mobilité, dessin transition énergétique, caricature auto, illustration ZFE',
    alternates: buildAlternates(locale, '/dessins'),
    openGraph: {
      title: 'Dessins & humour — Moteurs.com',
      description:
        "Le coup de crayon de l'actu de la mobilité : dessins humoristiques et illustrations de Moteurs.com.",
      type: 'website',
    },
  }
}

export default async function DessinsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ cat?: string }>
}) {
  const { locale } = await params
  const { cat } = await searchParams
  setRequestLocale(locale)

  const categorie = CATEGORIES.some((c) => c.value === cat) ? cat : undefined
  const dessins = await getDessins(categorie)

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Dessins & humour — Moteurs.com',
    url: `${SITE}/dessins`,
    description:
      'Galerie de dessins humoristiques et illustrations éditoriales de Moteurs.com sur la transition énergétique des transports.',
    isPartOf: { '@type': 'WebSite', name: 'Moteurs.com', url: SITE },
    hasPart: dessins.slice(0, 30).map((d) => ({
      '@type': 'ImageObject',
      name: d.titre,
      contentUrl: d.image_url,
      url: `${SITE}/dessins/${d.slug}`,
    })),
  }

  return (
    <main style={{ maxWidth: 1180, margin: '0 auto', padding: '40px 20px 72px' }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* En-tête */}
      <header style={{ textAlign: 'center', marginBottom: 32 }}>
        <div
          style={{
            display: 'inline-block',
            fontSize: '0.78rem',
            fontWeight: 700,
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            color: 'var(--color-primary)',
            background: 'var(--color-bg-alt)',
            border: '1px solid var(--color-border)',
            borderRadius: 20,
            padding: '6px 16px',
            marginBottom: 16,
          }}
        >
          ✏️ La galerie de Moteurs.com
        </div>
        <h1 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.6rem)', fontWeight: 800, lineHeight: 1.15, marginBottom: 14 }}>
          Dessins &amp; humour de la mobilité
        </h1>
        <p
          style={{
            maxWidth: 640,
            margin: '0 auto',
            color: 'var(--color-text-soft)',
            fontSize: '1.02rem',
            lineHeight: 1.6,
          }}
        >
          Le coup de crayon sur l&apos;actu de la transition énergétique : voiture électrique, ZFE,
          bornes de recharge et fiscalité, croqués avec le sourire — plus les illustrations de nos
          décryptages.
        </p>
      </header>

      {/* Filtres catégories */}
      <nav
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 10,
          justifyContent: 'center',
          marginBottom: 34,
        }}
      >
        <FiltreChip href="/dessins" actif={!categorie} label="Tout" emoji="🖼️" />
        {CATEGORIES.map((c) => (
          <FiltreChip
            key={c.value}
            href={`/dessins?cat=${c.value}`}
            actif={categorie === c.value}
            label={c.label}
            emoji={c.emoji}
          />
        ))}
      </nav>

      {dessins.length === 0 ? (
        <p
          style={{
            textAlign: 'center',
            color: 'var(--color-text-soft)',
            padding: '60px 0',
            fontSize: '1rem',
          }}
        >
          Aucun dessin dans cette catégorie pour l&apos;instant. Revenez bientôt&nbsp;!
        </p>
      ) : (
        <div
          style={{
            columnGap: 18,
            columnWidth: 320,
          }}
        >
          {dessins.map((d) => (
            <Link
              key={d.id}
              href={`/dessins/${d.slug}`}
              style={{
                display: 'block',
                breakInside: 'avoid',
                marginBottom: 18,
                borderRadius: 14,
                overflow: 'hidden',
                background: 'var(--color-bg-alt)',
                border: '1px solid var(--color-border)',
                textDecoration: 'none',
                color: 'inherit',
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={d.image_url}
                alt={d.alt ?? d.titre}
                width={d.largeur ?? undefined}
                height={d.hauteur ?? undefined}
                loading="lazy"
                style={{ width: '100%', height: 'auto', display: 'block' }}
              />
              <div style={{ padding: '12px 14px 14px' }}>
                <div
                  style={{
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.03em',
                    color: 'var(--color-primary)',
                    marginBottom: 5,
                  }}
                >
                  {CATEGORIE_LABEL[d.categorie] ?? d.categorie}
                </div>
                <div style={{ fontWeight: 700, fontSize: '0.98rem', lineHeight: 1.3 }}>{d.titre}</div>
                {d.legende && (
                  <div
                    style={{
                      marginTop: 5,
                      fontSize: '0.85rem',
                      color: 'var(--color-text-soft)',
                      lineHeight: 1.45,
                    }}
                  >
                    {d.legende}
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  )
}

function FiltreChip({
  href,
  actif,
  label,
  emoji,
}: {
  href: string
  actif: boolean
  label: string
  emoji: string
}) {
  return (
    <Link
      href={href}
      style={{
        fontSize: '0.88rem',
        fontWeight: 600,
        padding: '8px 16px',
        borderRadius: 999,
        textDecoration: 'none',
        border: '1px solid var(--color-border)',
        background: actif ? 'var(--color-primary)' : 'var(--color-bg-alt)',
        color: actif ? '#fff' : 'var(--color-text)',
      }}
    >
      {emoji} {label}
    </Link>
  )
}
