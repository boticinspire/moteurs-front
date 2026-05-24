/**
 * Hub SEO /vacances-voiture — version multilingue (next-intl).
 * SSG — pillar page qui agrège tout l'écosystème "vacances en voiture".
 */

import type { Metadata } from 'next'
import { useTranslations } from 'next-intl'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import FaqAccordion from '@/components/FaqAccordion'
import { TRAJETS_SEO } from '@/lib/trajets-seo'
import { PAYS_LEGAL } from '@/lib/legal-pays'
import { routing } from '@/i18n/routing'

const ANNEE = new Date().getFullYear()

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'HubVacances' })
  return {
    title: t('meta_title', { annee: ANNEE }),
    description: t('meta_desc', { annee: ANNEE }),
    openGraph: {
      title: t('og_title', { annee: ANNEE }),
      description: t('og_desc'),
      type: 'article',
    },
    alternates: {
      canonical: locale === routing.defaultLocale
        ? 'https://moteurs.com/vacances-voiture'
        : `https://moteurs.com/${locale}/vacances-voiture`,
    },
  }
}

export default async function PageVacancesVoiture({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)

  const tHub = await getTranslations({ locale, namespace: 'HubVacances' })
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        '@id': 'https://moteurs.com/vacances-voiture',
        url: 'https://moteurs.com/vacances-voiture',
        name: tHub('meta_title', { annee: ANNEE }),
        description: tHub('meta_desc', { annee: ANNEE }),
        inLanguage: locale,
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Accueil',             item: 'https://moteurs.com/' },
          { '@type': 'ListItem', position: 2, name: tHub('crumb_current'), item: 'https://moteurs.com/vacances-voiture' },
        ],
      },
    ],
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <VacancesContent />
    </>
  )
}

function VacancesContent() {
  const t = useTranslations('HubVacances')
  const ts = useTranslations('HubsShared')

  // Sélection 8 trajets vedettes (difficulté Élevée ou Moyenne)
  const trajetsVedettes = TRAJETS_SEO
    .filter((trip) => trip.difficulte === 'Élevée' || trip.difficulte === 'Moyenne')
    .slice(0, 8)

  // Pays imposant une vignette
  const paysAvecVignette = Object.values(PAYS_LEGAL).filter((p) => p.vignette.required)

  return (
    <main className="container" style={{ paddingTop: 36, paddingBottom: 64 }}>
      {/* Breadcrumb */}
      <nav className="hub-breadcrumb-dark" style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', marginBottom: 22 }}>
        <Link href="/" style={lienMuted}>{ts('crumb_home')}</Link>
        {' / '}
        <span>{t('crumb_current')}</span>
      </nav>

      {/* Hero */}
      <header className="hub-hero-dark" style={{ marginBottom: 32 }}>
        <div style={{ fontSize: '0.82rem', color: 'var(--color-primary)', fontWeight: 600, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {t('hero_eyebrow', { annee: ANNEE })}
        </div>
        <h1 style={{ fontSize: 'clamp(1.7rem, 4vw, 2.5rem)', marginBottom: 14, lineHeight: 1.2 }}>
          {t('hero_h1_a')} <span style={{ color: 'var(--color-primary)' }}>{t('hero_h1_b')}</span>
        </h1>
        <p style={{ fontSize: '1rem', lineHeight: 1.65, maxWidth: 720, color: 'rgba(255,255,255,0.92)' }}>
          {t('hero_lead', { annee: ANNEE })}
        </p>
      </header>

      {/* Stats clés */}
      <section style={{ marginBottom: 40 }}>
        <div style={{ display: 'grid', gap: 14, gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
          <Stat valeur={t('stat_1_value')} label={t('stat_1_label')} />
          <Stat valeur={t('stat_2_value')} label={t('stat_2_label')} />
          <Stat valeur={t('stat_3_value')} label={t('stat_3_label')} />
          <Stat valeur={t('stat_4_value')} label={t('stat_4_label')} />
        </div>
      </section>

      {/* Section 1 : préparer son trajet */}
      <section style={{ marginBottom: 40 }}>
        <h2 style={h2}>{t('s1_h2')}</h2>
        <p style={paraIntro}>{t('s1_intro')}</p>

        <div style={{ display: 'grid', gap: 14, gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', marginBottom: 24 }}>
          <CarteOutil href="/comparer-trajet"   titre={t('s1_card1_title')} description={t('s1_card1_desc')} cta={t('s1_card1_cta')} />
          <CarteOutil href="/trajet"            titre={t('s1_card2_title')} description={t('s1_card2_desc')} cta={t('s1_card2_cta')} />
          <CarteOutil href="/assistant-vacances" titre={t('s1_card3_title')} description={t('s1_card3_desc')} cta={t('s1_card3_cta')} />
        </div>

        {/* Trajets vedettes */}
        <h3 style={h3}>{t('s1_h3_vedettes')}</h3>
        <div style={{ display: 'grid', gap: 10, gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
          {trajetsVedettes.map((trip) => (
            <Link key={trip.slug} href={`/trajet/${trip.slug}`} style={carteLink}>
              <div style={{ fontSize: '1.4rem', marginBottom: 6 }}>{trip.emoji}</div>
              <div style={{ fontWeight: 600, fontSize: '0.92rem' }}>{trip.titre_court}</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', marginTop: 4 }}>
                {trip.distance_km} {t('s1_trip_km_suffix')} · {trip.pays_traverses.length} {t('s1_trip_pays_suffix')}
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Section 2 : avant le départ */}
      <section style={{ marginBottom: 40 }}>
        <h2 style={h2}>{t('s2_h2')}</h2>
        <div style={{ display: 'grid', gap: 14, gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
          <CarteOutil href="/checklist-depart"     titre={t('s2_card1_title')} description={t('s2_card1_desc')} cta={t('s2_card1_cta')} />
          <CarteOutil href="/constat"              titre={t('s2_card2_title')} description={t('s2_card2_desc')} cta={t('s2_card2_cta')} />
          <CarteOutil href="/recharge-electrique"  titre={t('s2_card3_title')} description={t('s2_card3_desc')} cta={t('s2_card3_cta')} />
        </div>
      </section>

      {/* Section 3 : pendant le trajet */}
      <section style={{ marginBottom: 40 }}>
        <h2 style={h2}>{t('s3_h2')}</h2>
        <div style={{ display: 'grid', gap: 14, gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
          <CarteOutil href="/assistance/meteo"       titre={t('s3_card1_title')} description={t('s3_card1_desc')} cta={t('s3_card1_cta')} />
          <CarteOutil href="/assistant-depannage"    titre={t('s3_card2_title')} description={t('s3_card2_desc')} cta={t('s3_card2_cta')} />
          <CarteOutil href="/assistance/panne"       titre={t('s3_card3_title')} description={t('s3_card3_desc')} cta={t('s3_card3_cta')} />
        </div>
      </section>

      {/* Section 4 : légal — vignettes & ZFE */}
      <section style={{ marginBottom: 40 }}>
        <h2 style={h2}>{t('s4_h2')}</h2>
        <p style={paraIntro}>{t('s4_intro')}</p>
        <div style={{ display: 'grid', gap: 14, gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
          {paysAvecVignette.map((p) => (
            <article key={p.code} style={vignetteCard}>
              <div style={{ fontSize: '1.6rem', marginBottom: 6 }}>{p.drapeau}</div>
              <div style={{ fontWeight: 700, marginBottom: 4 }}>{p.nom}</div>
              {p.vignette.prix_courte != null ? (
                <div style={{ fontSize: '0.92rem' }}>
                  {p.vignette.prix_courte} € ({p.vignette.duree_courte})
                </div>
              ) : (
                <div style={{ fontSize: '0.92rem' }}>
                  {p.vignette.prix_annuelle} € {t('s4_vignette_for')}
                </div>
              )}
              {p.vignette.url && (
                <a href={p.vignette.url} target="_blank" rel="noopener noreferrer" style={{ ...lien, fontSize: '0.82rem', display: 'inline-block', marginTop: 6 }}>
                  {t('s4_vignette_official')}
                </a>
              )}
            </article>
          ))}
        </div>
        <p style={{ marginTop: 14, fontSize: '0.9rem' }}>
          {t('s4_more_a')}{' '}
          <Link href="/trajet/belgique-cote-azur" style={lien}>{t('s4_more_b_link')}</Link>{t('s4_more_b_suffix')}
        </p>
      </section>

      {/* FAQ */}
      <section style={{ marginTop: 48 }}>
        <FaqAccordion
          title={t('faq_title')}
          items={[
            { question: t('faq_q1'), answer: t('faq_a1') },
            { question: t('faq_q2'), answer: t('faq_a2') },
            { question: t('faq_q3'), answer: t('faq_a3') },
            { question: t('faq_q4'), answer: t('faq_a4') },
            { question: t('faq_q5'), answer: t('faq_a5') },
            { question: t('faq_q6'), answer: t('faq_a6') },
            { question: t('faq_q7'), answer: t('faq_a7') },
          ]}
        />
      </section>

      {/* Voir aussi */}
      <section style={{ marginTop: 48, paddingTop: 32, borderTop: '1px solid var(--color-border)' }}>
        <h2 style={{ fontSize: '1.15rem', marginBottom: 14 }}>{ts('see_also_h2')}</h2>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', marginBottom: 18, lineHeight: 1.5 }}>
          {ts('see_also_lead')}
        </p>
        <div style={{ display: 'grid', gap: 14, gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
          <Link href="/recharge-electrique" style={hubCardLink}>
            <div style={{ fontSize: '1.4rem', marginBottom: 6 }}>🔌</div>
            <div style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: 4 }}>{ts('card_recharge_title')}</div>
            <div style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', lineHeight: 1.5 }}>{ts('card_recharge_desc')}</div>
          </Link>
          <Link href="/cout-voiture" style={hubCardLink}>
            <div style={{ fontSize: '1.4rem', marginBottom: 6 }}>💰</div>
            <div style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: 4 }}>{ts('card_cout_title')}</div>
            <div style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', lineHeight: 1.5 }}>{ts('card_cout_desc')}</div>
          </Link>
          <Link href="/depannage" style={hubCardLink}>
            <div style={{ fontSize: '1.4rem', marginBottom: 6 }}>🔧</div>
            <div style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: 4 }}>{ts('card_depannage_title')}</div>
            <div style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', lineHeight: 1.5 }}>{ts('card_depannage_desc')}</div>
          </Link>
          <Link href="/documents-auto" style={hubCardLink}>
            <div style={{ fontSize: '1.4rem', marginBottom: 6 }}>📄</div>
            <div style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: 4 }}>{ts('card_documents_title')}</div>
            <div style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', lineHeight: 1.5 }}>{ts('card_documents_desc')}</div>
          </Link>
        </div>
      </section>

      {/* Outils */}
      <section style={{ marginTop: 40, padding: 22, borderRadius: 14, background: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}>
        <h2 style={{ fontSize: '1.05rem', marginBottom: 12 }}>{t('outils_h2')}</h2>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
          <Link href="/trajet" style={btnSecondaire}>{t('outils_trajets')}</Link>
          <Link href="/comparer-trajet" style={btnSecondaire}>{t('outils_comparer')}</Link>
          <Link href="/recharge-electrique" style={btnSecondaire}>{t('outils_recharge')}</Link>
          <Link href="/simulateur" style={btnSecondaire}>{t('outils_simulateur')}</Link>
          <Link href="/constat" style={btnSecondaire}>{t('outils_constat')}</Link>
          <Link href="/vacances-voiture/checklist-ev" style={btnSecondaire}>{t('outils_checklist_ev')}</Link>
        </div>
      </section>
    </main>
  )
}

function Stat({ valeur, label }: { valeur: string; label: string }) {
  return (
    <div style={{
      background: 'var(--color-bg-card)', border: '1px solid var(--color-border)',
      borderRadius: 12, padding: 16, textAlign: 'center',
    }}>
      <div style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--color-primary)' }}>{valeur}</div>
      <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', marginTop: 4 }}>{label}</div>
    </div>
  )
}

function CarteOutil({ href, titre, description, cta }: { href: '/comparer-trajet' | '/trajet' | '/assistant-vacances' | '/checklist-depart' | '/constat' | '/recharge-electrique' | '/assistance/meteo' | '/assistant-depannage' | '/assistance/panne'; titre: string; description: string; cta: string }) {
  return (
    <Link href={href} style={{
      display: 'block', padding: 18, borderRadius: 12,
      background: 'var(--color-bg-card)', border: '1px solid var(--color-border)',
      textDecoration: 'none', color: 'var(--color-text)',
    }}>
      <h3 style={{ fontSize: '1rem', margin: 0, marginBottom: 8 }}>{titre}</h3>
      <p style={{ fontSize: '0.88rem', lineHeight: 1.55, color: 'var(--color-text-muted)', margin: 0, marginBottom: 12 }}>
        {description}
      </p>
      <span style={{ color: 'var(--color-primary)', fontSize: '0.85rem', fontWeight: 600 }}>{cta} →</span>
    </Link>
  )
}

const lienMuted: React.CSSProperties = { color: 'var(--color-text-muted)', textDecoration: 'none' }
const lien: React.CSSProperties = { color: 'var(--color-primary)', textDecoration: 'none', fontWeight: 600 }
const h2: React.CSSProperties = { fontSize: '1.3rem', marginBottom: 12, marginTop: 0 }
const h3: React.CSSProperties = { fontSize: '1rem', color: 'var(--color-text-muted)', marginBottom: 12, marginTop: 22 }
const paraIntro: React.CSSProperties = { fontSize: '0.95rem', lineHeight: 1.65, color: 'var(--color-text)', marginBottom: 20, maxWidth: 720 }
const carteLink: React.CSSProperties = {
  display: 'block', padding: 14, borderRadius: 10,
  background: 'var(--color-bg-card)', border: '1px solid var(--color-border)',
  textDecoration: 'none', color: 'var(--color-text)',
}
const vignetteCard: React.CSSProperties = {
  background: 'var(--color-bg-card)', border: '1px solid var(--color-border)',
  borderRadius: 12, padding: 16,
}
const hubCardLink: React.CSSProperties = {
  display: 'block', padding: 16, borderRadius: 12,
  background: 'var(--color-bg)', border: '1px solid var(--color-border)',
  textDecoration: 'none', color: 'var(--color-text)',
}
const btnSecondaire: React.CSSProperties = {
  padding: '8px 14px', borderRadius: 10, fontSize: '0.88rem',
  background: 'transparent', border: '1px solid var(--color-border)',
  color: 'var(--color-text)', textDecoration: 'none',
}
