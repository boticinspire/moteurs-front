import type { Metadata } from 'next'
import { setRequestLocale } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import { routing } from '@/i18n/routing'
import { buildAlternates } from '@/lib/seo-utils'
import { getSeoMeta } from '@/lib/seo-keywords'

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const m = getSeoMeta('/jeux')
  return {
    title: m ? m.title : 'Jeux gratuits | Moteurs.com',
    description: m ? m.description : 'Des jeux gratuits pour faire une pause, réservés aux membres de Moteurs.com.',
    alternates: buildAlternates(locale, '/jeux'),
  }
}

type Jeu = {
  href: string
  icon: string
  titre: string
  desc: string
  tags: string[]
  cta: string
  badge?: string | null
}

const JEUX: Jeu[] = [
  {
    href: '/jeux/sudoku',
    icon: '🧩',
    titre: 'Sudoku',
    desc: 'Une grille à solution unique générée à chaque partie, 4 niveaux (facile à expert), notes, indices et chrono. La pause maligne entre deux trajets.',
    tags: ['Logique', 'Facile → Expert', 'Partageable', 'Membres'],
    cta: 'Jouer',
    badge: 'Nouveau',
  },
]

export default async function JeuxPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)

  return (
    <>
      {/* ── Hero ── */}
      <section className="page-hero">
        <div className="container">
          <div style={{ fontSize: '0.82rem', color: 'var(--color-primary)', fontWeight: 600, marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Jeux gratuits
          </div>
          <h1>La pause détente Moteurs.com</h1>
          <p style={{ maxWidth: 540, margin: '0 auto' }}>
            Des jeux gratuits pour souffler entre deux calculs de trajet. Accessibles gratuitement à tous les membres — connectez-vous et c&apos;est parti.
          </p>
        </div>
      </section>

      {/* ── Grille de jeux ── */}
      <section style={{ padding: '48px 0 0' }}>
        <div className="container">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20, marginBottom: 64 }}>
            {JEUX.map((j) => (
              <Link key={j.href} href={j.href} style={{ textDecoration: 'none' }}>
                <div style={{
                  background: 'var(--color-bg-card)',
                  border: '1.5px solid var(--color-border)',
                  borderRadius: 14, padding: 28, height: '100%',
                  display: 'flex', flexDirection: 'column', gap: 14,
                  cursor: 'pointer', transition: 'border-color .15s, transform .15s',
                  position: 'relative',
                }}>
                  {j.badge && (
                    <div style={{
                      position: 'absolute', top: -12, right: 16,
                      background: 'var(--color-primary)', color: '#0a1628',
                      borderRadius: 20, padding: '3px 12px',
                      fontSize: '0.72rem', fontWeight: 800, letterSpacing: '0.05em',
                    }}>
                      {j.badge}
                    </div>
                  )}
                  <div style={{ fontSize: '2.4rem' }}>{j.icon}</div>
                  <div>
                    <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 8, color: 'var(--color-text)' }}>
                      {j.titre}
                    </h2>
                    <p style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', lineHeight: 1.6, margin: 0 }}>
                      {j.desc}
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {j.tags.map((tag) => (
                      <span key={tag} style={{
                        fontSize: '0.72rem', fontWeight: 600, padding: '3px 8px',
                        background: 'rgba(122,240,194,0.12)', color: 'var(--color-primary)',
                        border: '1px solid rgba(122,240,194,0.25)',
                        borderRadius: 4,
                      }}>{tag}</span>
                    ))}
                  </div>
                  <div style={{ marginTop: 'auto', paddingTop: 8 }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: '0.9rem', fontWeight: 700, color: 'var(--color-primary)' }}>
                      {j.cta} →
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
