/**
 * /auteurs/[slug] — page profil d'un auteur / d'une signature éditoriale.
 * JSON-LD ProfilePage + Person (ou Organization) pour l'E-E-A-T.
 * Contenu FR autonome (canonique FR).
 */

import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Link } from '@/i18n/navigation'
import { getAuteur, getAuteurSlugs } from '@/lib/auteurs'

export function generateStaticParams() {
  return getAuteurSlugs().map((slug) => ({ slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const auteur = getAuteur(slug)
  if (!auteur) return { title: 'Auteur introuvable | Moteurs.com' }
  return {
    title: `${auteur.nom} — ${auteur.role} | Moteurs.com`,
    description: auteur.bio.slice(0, 160),
    alternates: { canonical: `https://moteurs.com/auteurs/${slug}` },
  }
}

export default async function PageAuteur({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const auteur = getAuteur(slug)
  if (!auteur) notFound()

  const entity =
    auteur.type === 'Person'
      ? {
          '@type': 'Person',
          name: auteur.nom,
          jobTitle: auteur.role,
          description: auteur.bio,
          knowsAbout: auteur.expertise,
          ...(auteur.photo ? { image: `https://moteurs.com${auteur.photo}` } : {}),
          ...(auteur.sameAs && auteur.sameAs.length ? { sameAs: auteur.sameAs } : {}),
          worksFor: { '@type': 'Organization', name: 'Moteurs.com', url: 'https://moteurs.com' },
          url: `https://moteurs.com/auteurs/${slug}`,
        }
      : {
          '@type': 'Organization',
          name: auteur.nom,
          description: auteur.bio,
          knowsAbout: auteur.expertise,
          url: `https://moteurs.com/auteurs/${slug}`,
          parentOrganization: { '@type': 'Organization', name: 'Moteurs.com', url: 'https://moteurs.com' },
        }

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'ProfilePage',
        '@id': `https://moteurs.com/auteurs/${slug}`,
        url: `https://moteurs.com/auteurs/${slug}`,
        name: `${auteur.nom} — ${auteur.role}`,
        inLanguage: 'fr',
        mainEntity: entity,
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Accueil', item: 'https://moteurs.com/' },
          { '@type': 'ListItem', position: 2, name: 'Auteurs', item: 'https://moteurs.com/auteurs' },
          { '@type': 'ListItem', position: 3, name: auteur.nom, item: `https://moteurs.com/auteurs/${slug}` },
        ],
      },
    ],
  }

  return (
    <main className="container" style={{ paddingTop: 36, paddingBottom: 64, maxWidth: 720 }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <nav style={{ fontSize: '0.82rem', color: 'var(--color-text-soft)', marginBottom: 24 }}>
        <Link href="/" style={{ color: 'inherit', textDecoration: 'none' }}>Accueil</Link>
        {' / '}
        <Link href="/auteurs" style={{ color: 'inherit', textDecoration: 'none' }}>Auteurs</Link>
        {' / '}
        <span>{auteur.nom}</span>
      </nav>

      <header style={{ display: 'flex', gap: 18, alignItems: 'center', marginBottom: 28, flexWrap: 'wrap' }}>
        {auteur.photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={auteur.photo} alt={auteur.nom} width={88} height={88} style={{ borderRadius: '50%', objectFit: 'cover' }} />
        ) : (
          <div style={{ width: 88, height: 88, borderRadius: '50%', background: 'var(--color-bg-alt)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem' }} aria-hidden>
            ✍️
          </div>
        )}
        <div>
          <h1 style={{ fontSize: 'clamp(1.5rem, 3.5vw, 2rem)', margin: 0, marginBottom: 4 }}>{auteur.nom}</h1>
          <p style={{ margin: 0, color: 'var(--color-primary)', fontWeight: 600 }}>{auteur.role}</p>
        </div>
      </header>

      <p style={{ fontSize: '1rem', lineHeight: 1.7, marginBottom: 28 }}>{auteur.bio}</p>

      <section style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: '1.1rem', marginBottom: 10 }}>Domaines d’expertise</h2>
        <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 1.8, color: 'var(--color-text-soft)' }}>
          {auteur.expertise.map((e) => <li key={e}>{e}</li>)}
        </ul>
      </section>

      {auteur.sameAs && auteur.sameAs.length > 0 && (
        <section style={{ marginBottom: 28 }}>
          <h2 style={{ fontSize: '1.1rem', marginBottom: 10 }}>Retrouver {auteur.nom}</h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            {auteur.sameAs.map((url) => (
              <a key={url} href={url} target="_blank" rel="noopener noreferrer me" className="btn btn-secondary">{url.replace(/^https?:\/\/(www\.)?/, '').split('/')[0]}</a>
            ))}
          </div>
        </section>
      )}

      <section style={{ marginTop: 40, paddingTop: 24, borderTop: '1px solid var(--color-border)' }}>
        <p style={{ fontSize: '0.9rem', color: 'var(--color-text-soft)', lineHeight: 1.6 }}>
          La méthode éditoriale de Moteurs.com (triangulation des sources, niveaux de confiance,
          indépendance) est détaillée dans notre{' '}
          <Link href="/charte-editoriale" style={{ color: 'var(--color-primary)' }}>charte éditoriale</Link>.
        </p>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 14 }}>
          <Link href="/auteurs" className="btn btn-secondary">← Tous les auteurs</Link>
          <Link href="/articles" className="btn btn-secondary">Les décryptages</Link>
        </div>
      </section>
    </main>
  )
}
