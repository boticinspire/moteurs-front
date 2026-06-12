/**
 * /auteurs — index des signatures éditoriales de Moteurs.com.
 * Contenu FR autonome (canonique FR).
 */

import type { Metadata } from 'next'
import { Link } from '@/i18n/navigation'
import { AUTEURS } from '@/lib/auteurs'

export const metadata: Metadata = {
  title: 'Les auteurs de Moteurs.com — qui écrit nos décryptages',
  description:
    "Découvrez l'équipe éditoriale de Moteurs.com : expertise, méthode et signatures de nos décryptages sur la transition énergétique des transports.",
  alternates: { canonical: 'https://moteurs.com/auteurs' },
}

export default function PageAuteurs() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    '@id': 'https://moteurs.com/auteurs',
    url: 'https://moteurs.com/auteurs',
    name: 'Les auteurs de Moteurs.com',
    inLanguage: 'fr',
    hasPart: AUTEURS.map((a) => ({
      '@type': a.type,
      name: a.nom,
      url: `https://moteurs.com/auteurs/${a.slug}`,
    })),
  }

  return (
    <main className="container" style={{ paddingTop: 36, paddingBottom: 64, maxWidth: 760 }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <nav style={{ fontSize: '0.82rem', color: 'var(--color-text-soft)', marginBottom: 20 }}>
        <Link href="/" style={{ color: 'inherit', textDecoration: 'none' }}>Accueil</Link>
        {' / '}
        <span>Auteurs</span>
      </nav>

      <header style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 'clamp(1.7rem, 4vw, 2.3rem)', marginBottom: 12 }}>Les auteurs de Moteurs.com</h1>
        <p style={{ fontSize: '1rem', lineHeight: 1.65, color: 'var(--color-text-soft)' }}>
          Qui écrit nos décryptages ? Notre équipe applique une méthode constante : triangulation des
          sources, niveaux de confiance affichés, indépendance totale. Voir notre{' '}
          <Link href="/charte-editoriale" style={{ color: 'var(--color-primary)' }}>charte éditoriale</Link>.
        </p>
      </header>

      <div style={{ display: 'grid', gap: 14 }}>
        {AUTEURS.map((a) => (
          <Link
            key={a.slug}
            href={`/auteurs/${a.slug}`}
            style={{ display: 'flex', gap: 16, alignItems: 'center', padding: 18, borderRadius: 12, background: 'var(--color-bg-card)', border: '1px solid var(--color-border)', textDecoration: 'none', color: 'var(--color-text)' }}
          >
            {a.photo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={a.photo} alt={a.nom} width={64} height={64} style={{ borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
            ) : (
              <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--color-bg-alt)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', flexShrink: 0 }} aria-hidden>✍️</div>
            )}
            <div>
              <div style={{ fontWeight: 700, fontSize: '1.05rem' }}>{a.nom}</div>
              <div style={{ color: 'var(--color-primary)', fontSize: '0.85rem', fontWeight: 600, marginBottom: 4 }}>{a.role}</div>
              <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--color-text-soft)', lineHeight: 1.5 }}>
                {a.bio.length > 150 ? a.bio.slice(0, 150) + '…' : a.bio}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </main>
  )
}
