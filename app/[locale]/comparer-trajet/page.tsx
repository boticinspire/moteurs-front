import type { Metadata } from 'next'
import { useTranslations } from 'next-intl'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import ComparateurTrajet from './ComparateurTrajet'
import FaqAccordion from '@/components/FaqAccordion'
import { routing } from '@/i18n/routing'

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'ComparerTrajet' })
  return {
    title: t('meta_title'),
    description: t('meta_desc'),
    openGraph: {
      title: t('og_title'),
      description: t('og_desc'),
    },
  }
}

export default async function PageComparateurTrajet({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)
  return <ComparerTrajetContent />
}

function ComparerTrajetContent() {
  const t = useTranslations('ComparerTrajet')

  const badges = [
    t('badge_routes'),
    t('badge_stops'),
    t('badge_tolls'),
    t('badge_free'),
  ]

  const ped = [
    { icon: '⛽', titre: t('ped_1_title'), desc: t('ped_1_desc') },
    { icon: '🛣️', titre: t('ped_2_title'), desc: t('ped_2_desc') },
    { icon: '⚡', titre: t('ped_3_title'), desc: t('ped_3_desc') },
    { icon: '🔋', titre: t('ped_4_title'), desc: t('ped_4_desc') },
  ]

  const seoTrips = [
    { slug: 'belgique-cote-azur',    label: "🇧🇪 → 🇫🇷 Côte d'Azur" },
    { slug: 'belgique-toscane',      label: '🇧🇪 → 🇮🇹 Toscane' },
    { slug: 'pays-bas-lac-garde',    label: '🇳🇱 → 🇮🇹 Lac de Garde' },
    { slug: 'france-costa-brava',    label: '🇫🇷 → 🇪🇸 Costa Brava' },
    { slug: 'allemagne-algarve',     label: '🇩🇪 → 🇵🇹 Algarve' },
    { slug: 'pays-bas-dalmatie',     label: '🇳🇱 → 🇭🇷 Dalmatie' },
    { slug: 'danemark-norvege',      label: '🇩🇰 → 🇳🇴 Fjords' },
  ]

  const faq = [
    { question: t('faq_q1'), answer: t('faq_a1') },
    { question: t('faq_q2'), answer: t('faq_a2') },
    { question: t('faq_q3'), answer: t('faq_a3') },
    { question: t('faq_q4'), answer: t('faq_a4') },
    { question: t('faq_q5'), answer: t('faq_a5') },
    { question: t('faq_q6'), answer: t('faq_a6') },
  ]

  return (
    <main className="container" style={{ paddingTop: 40, paddingBottom: 64 }}>
      {/* Hero */}
      <div style={{ textAlign: 'center', marginBottom: 40 }}>
        <div style={{ fontSize: '0.85rem', color: 'var(--color-primary)', fontWeight: 600, marginBottom: 10, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
          {t('eyebrow')}
        </div>
        <h1 style={{ fontSize: 'clamp(1.6rem, 4vw, 2.4rem)', marginBottom: 14, lineHeight: 1.2 }}>
          {t('h1_a')}<br />
          <span style={{ color: 'var(--color-primary)' }}>{t('h1_b')}</span>
        </h1>
        <p style={{ maxWidth: 560, margin: '0 auto', color: 'var(--color-text-muted)', fontSize: '1rem', lineHeight: 1.6 }}>
          {t('lead')}
        </p>

        <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: 10, marginTop: 20 }}>
          {badges.map(b => (
            <span key={b} style={{
              padding: '5px 14px', borderRadius: 20, fontSize: '0.8rem',
              background: 'rgba(122,240,194,0.08)', border: '1px solid rgba(122,240,194,0.2)',
              color: 'var(--color-primary)',
            }}>
              {b}
            </span>
          ))}
        </div>
      </div>

      <ComparateurTrajet />

      {/* Section pédagogique */}
      <section style={{ marginTop: 64, borderTop: '1px solid var(--color-border)', paddingTop: 40 }}>
        <h2 style={{ textAlign: 'center', marginBottom: 32, fontSize: '1.3rem' }}>
          {t('ped_h2')}
        </h2>
        <div style={{ display: 'grid', gap: 20, gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
          {ped.map(item => (
            <div key={item.titre} style={{
              background: 'var(--color-bg-card)', borderRadius: 12,
              border: '1px solid var(--color-border)', padding: '20px 18px',
            }}>
              <div style={{ fontSize: '1.6rem', marginBottom: 10 }}>{item.icon}</div>
              <div style={{ fontWeight: 700, marginBottom: 6 }}>{item.titre}</div>
              <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', margin: 0, lineHeight: 1.5 }}>
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Section trajets SEO */}
      <section style={{ marginTop: 56, borderTop: '1px solid var(--color-border)', paddingTop: 32 }}>
        <h2 style={{ marginBottom: 8, fontSize: '1.2rem' }}>
          {t('seo_h2')}
        </h2>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', marginBottom: 18, lineHeight: 1.5 }}>
          {t('seo_lead')}
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {seoTrips.map(trip => (
            <a key={trip.slug} href={`/trajet/${trip.slug}`} style={{
              padding: '8px 14px', borderRadius: 20, fontSize: '0.85rem',
              background: 'rgba(122,240,194,0.06)', border: '1px solid rgba(122,240,194,0.2)',
              color: 'var(--color-primary)', textDecoration: 'none',
            }}>
              {trip.label}
            </a>
          ))}
          <a href="/trajet" style={{
            padding: '8px 14px', borderRadius: 20, fontSize: '0.85rem',
            background: 'transparent', border: '1px solid var(--color-border)',
            color: 'var(--color-text)', textDecoration: 'none',
          }}>
            {t('seo_all')}
          </a>
        </div>
      </section>

      {/* CTA */}
      <section style={{ marginTop: 48, textAlign: 'center' }}>
        <p style={{ color: 'var(--color-text-muted)', marginBottom: 16 }}>
          {t('cta_intro')}
        </p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 12, flexWrap: 'wrap' }}>
          <a href="/comparer" className="btn btn-secondary">
            {t('cta_tco')}
          </a>
          <a href="/simulateur" className="btn btn-secondary">
            {t('cta_simulator')}
          </a>
        </div>
      </section>

      <FaqAccordion items={faq} />
    </main>
  )
}
