/**
 * Hub SEO /depannage — version multilingue (next-intl).
 * SSG — pillar page panne/assistance/dépannage voiture.
 */

import type { Metadata } from 'next'
import { useTranslations } from 'next-intl'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import FaqAccordion from '@/components/FaqAccordion'
import { PAYS_LEGAL } from '@/lib/legal-pays'
import { routing } from '@/i18n/routing'
import { buildAlternates } from '@/lib/seo-utils'

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
  const t = await getTranslations({ locale, namespace: 'HubDepannage' })
  return {
    title: t('meta_title', { annee: ANNEE }),
    description: t('meta_desc', { annee: ANNEE }),
    openGraph: {
      title: t('og_title', { annee: ANNEE }),
      description: t('og_desc'),
      type: 'article',
    },
    alternates: buildAlternates(locale, '/depannage'),
  }
}

export default async function PageDepannage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)

  const tHub = await getTranslations({ locale, namespace: 'HubDepannage' })
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        '@id': 'https://moteurs.com/depannage',
        url: 'https://moteurs.com/depannage',
        name: tHub('meta_title', { annee: ANNEE }),
        description: tHub('meta_desc', { annee: ANNEE }),
        inLanguage: locale,
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Accueil',             item: 'https://moteurs.com/' },
          { '@type': 'ListItem', position: 2, name: tHub('crumb_current'), item: 'https://moteurs.com/depannage' },
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
      <DepannageContent />
    </>
  )
}

function DepannageContent() {
  const t = useTranslations('HubDepannage')
  const ts = useTranslations('HubsShared')

  // 8 pays les plus traversés en vacances
  const paysUrgence = (['FR', 'BE', 'CH', 'IT', 'ES', 'DE', 'NL', 'PT'] as const)
    .map((c) => PAYS_LEGAL[c])
    .filter(Boolean)

  return (
    <main className="container" style={{ paddingTop: 36, paddingBottom: 64 }}>
      {/* Breadcrumb */}
      <nav className="hub-breadcrumb-dark" style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', marginBottom: 22 }}>
        <Link href="/" style={lienMuted}>{ts('crumb_home')}</Link>
        {' / '}
        <span>{t('crumb_current')}</span>
      </nav>

      {/* Hero */}
      <header className="hub-hero-dark" style={{ marginBottom: 28 }}>
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

      {/* Bandeau urgence 112 */}
      <section style={{
        background: 'rgba(220,38,38,0.06)',
        border: '1px solid rgba(220,38,38,0.25)',
        borderRadius: 12, padding: '18px 22px', marginBottom: 32,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
          <span style={{ fontSize: '1.8rem' }}>🚨</span>
          <h2 style={{ margin: 0, fontSize: '1.1rem', color: '#dc2626' }}>{t('urgence_h2')}</h2>
        </div>
        <p style={{ margin: 0, fontSize: '0.92rem', lineHeight: 1.55 }}>
          {t('urgence_body_a')} <strong>{t('urgence_body_strong')}</strong> {t('urgence_body_b')}
        </p>
      </section>

      {/* 3 outils */}
      <section style={{ marginBottom: 40 }}>
        <h2 style={h2}>{t('outils_h2')}</h2>
        <div style={{ display: 'grid', gap: 14, gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
          <CarteOutil href="/assistant-depannage" titre={t('outils_card1_title')} description={t('outils_card1_desc')} cta={t('outils_card1_cta')} urgent />
          <CarteOutil href="/constat"             titre={t('outils_card2_title')} description={t('outils_card2_desc')} cta={t('outils_card2_cta')} />
          <CarteOutil href="/assistance/panne"    titre={t('outils_card3_title')} description={t('outils_card3_desc')} cta={t('outils_card3_cta')} />
          <CarteOutil href="/outils/amende-pv"   titre={t('outils_card4_title')} description={t('outils_card4_desc')} cta={t('outils_card4_cta')} />
        </div>
      </section>

      {/* Numéros par pays */}
      <section style={{ marginBottom: 40 }}>
        <h2 style={h2}>{t('pays_h2')}</h2>
        <p style={paraIntro}>{t('pays_intro')}</p>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.92rem' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--color-border)' }}>
                <th style={th}>{t('pays_th_pays')}</th>
                <th style={th}>{t('pays_th_urgence')}</th>
                <th style={th}>{t('pays_th_depannage')}</th>
                <th style={th}>{t('pays_th_alcool')}</th>
              </tr>
            </thead>
            <tbody>
              {paysUrgence.map((p) => (
                <tr key={p.code} style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <td style={td}>{p.drapeau} {p.nom}</td>
                  <td style={{ ...td, fontWeight: 700, color: '#dc2626' }}>{p.urgence}</td>
                  <td style={td}>{p.depannage ?? '—'}</td>
                  <td style={td}>{p.alcool_max.toFixed(1)} g/L</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginTop: 12 }}>
          {t('pays_footer_a')}{' '}
          <Link href="/trajet/belgique-cote-azur" style={lien}>{t('pays_footer_link')}</Link>{t('pays_footer_suffix')}
        </p>
      </section>

      {/* Étapes pas à pas */}
      <section style={{ marginBottom: 40 }}>
        <h2 style={h2}>{t('etapes_h2')}</h2>
        <ol style={{ paddingLeft: 20, lineHeight: 1.8, fontSize: '0.95rem' }}>
          <li><strong>{t('etapes_1_label')}</strong> — {t('etapes_1_body')}</li>
          <li><strong>{t('etapes_2_label')}</strong> — {t('etapes_2_body')}</li>
          <li>
            <strong>{t('etapes_3_label')}</strong> — {t('etapes_3_body_a')}{' '}
            <Link href="/assistant-depannage" style={lien}>{t('etapes_3_body_link')}</Link>{' '}
            {t('etapes_3_body_b')}
          </li>
          <li><strong>{t('etapes_4_label')}</strong> — {t('etapes_4_body')}</li>
          <li><strong>{t('etapes_5_label')}</strong> — {t('etapes_5_body')}</li>
          <li><strong>{t('etapes_6_label')}</strong> — {t('etapes_6_body')}</li>
        </ol>
      </section>

      {/* Top 5 pannes */}
      <section style={{ marginBottom: 40 }}>
        <h2 style={h2}>{t('top_h2')}</h2>
        <div style={{ display: 'grid', gap: 14, gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))' }}>
          <Panne titre={t('top_1_title')} frequence={t('top_1_freq')} cause={t('top_1_cause')} cout={t('top_1_cout')} labelCause={t('top_label_cause')} labelCout={t('top_label_cout')} />
          <Panne titre={t('top_2_title')} frequence={t('top_2_freq')} cause={t('top_2_cause')} cout={t('top_2_cout')} labelCause={t('top_label_cause')} labelCout={t('top_label_cout')} />
          <Panne titre={t('top_3_title')} frequence={t('top_3_freq')} cause={t('top_3_cause')} cout={t('top_3_cout')} labelCause={t('top_label_cause')} labelCout={t('top_label_cout')} />
          <Panne titre={t('top_4_title')} frequence={t('top_4_freq')} cause={t('top_4_cause')} cout={t('top_4_cout')} labelCause={t('top_label_cause')} labelCout={t('top_label_cout')} />
          <Panne titre={t('top_5_title')} frequence={t('top_5_freq')} cause={t('top_5_cause')} cout={t('top_5_cout')} labelCause={t('top_label_cause')} labelCout={t('top_label_cout')} />
        </div>
        <p style={{ marginTop: 14, fontSize: '0.88rem', color: 'var(--color-text-muted)' }}>
          {t('top_source', { annee: ANNEE })}
        </p>
      </section>

      {/* Assurance assistance */}
      <section style={{ marginBottom: 40 }}>
        <h2 style={h2}>{t('assur_h2')}</h2>
        <p style={paraIntro}>{t('assur_intro')}</p>
        <div style={{ display: 'grid', gap: 14, gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
          <article style={infoCard}>
            <h3 style={infoH3}>{t('assur_card1_title')}</h3>
            <p style={infoP}>{t('assur_card1_body')}</p>
          </article>
          <article style={infoCard}>
            <h3 style={infoH3}>{t('assur_card2_title')}</h3>
            <p style={infoP}>{t('assur_card2_body')}</p>
          </article>
          <article style={infoCard}>
            <h3 style={infoH3}>{t('assur_card3_title')}</h3>
            <p style={infoP}>{t('assur_card3_body')}</p>
          </article>
        </div>
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
          <Link href="/vacances-voiture" style={hubCardLink}>
            <div style={{ fontSize: '1.4rem', marginBottom: 6 }}>🏖️</div>
            <div style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: 4 }}>{ts('card_vacances_title')}</div>
            <div style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', lineHeight: 1.5 }}>{ts('card_vacances_desc')}</div>
          </Link>
          <Link href="/cout-voiture" style={hubCardLink}>
            <div style={{ fontSize: '1.4rem', marginBottom: 6 }}>💰</div>
            <div style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: 4 }}>{ts('card_cout_title')}</div>
            <div style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', lineHeight: 1.5 }}>{ts('card_cout_desc')}</div>
          </Link>
          <Link href="/documents-auto" style={hubCardLink}>
            <div style={{ fontSize: '1.4rem', marginBottom: 6 }}>📄</div>
            <div style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: 4 }}>{ts('card_documents_title')}</div>
            <div style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', lineHeight: 1.5 }}>{ts('card_documents_desc')}</div>
          </Link>
        </div>
      </section>

      {/* Outils liés */}
      <section style={{ marginTop: 40, padding: 22, borderRadius: 14, background: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}>
        <h2 style={{ fontSize: '1.05rem', marginBottom: 12 }}>{t('outliens_h2')}</h2>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
          <Link href="/assistant-depannage" style={btnSecondaire}>{t('outliens_scan')}</Link>
          <Link href="/constat" style={btnSecondaire}>{t('outliens_constat')}</Link>
          <Link href="/outils/amende-pv" style={btnSecondaire}>{t('outils_card4_cta')}</Link>
          <Link href="/assistance/panne" style={btnSecondaire}>{t('outliens_assistance')}</Link>
          <Link href="/vacances-voiture" style={btnSecondaire}>{t('outliens_vacances')}</Link>
          <Link href="/checklist-depart" style={btnSecondaire}>{t('outliens_checklist')}</Link>
        </div>
      </section>
    </main>
  )
}

function CarteOutil({ href, titre, description, cta, urgent }: { href: '/assistant-depannage' | '/constat' | '/assistance/panne' | '/outils/amende-pv'; titre: string; description: string; cta: string; urgent?: boolean }) {
  return (
    <Link href={href} style={{
      display: 'block', padding: 18, borderRadius: 12,
      background: 'var(--color-bg-card)',
      border: urgent ? '2px solid rgba(220,38,38,0.35)' : '1px solid var(--color-border)',
      textDecoration: 'none', color: 'var(--color-text)',
    }}>
      <h3 style={{ fontSize: '1rem', margin: 0, marginBottom: 8 }}>{titre}</h3>
      <p style={{ fontSize: '0.88rem', lineHeight: 1.55, color: 'var(--color-text-muted)', margin: 0, marginBottom: 12 }}>
        {description}
      </p>
      <span style={{ color: urgent ? '#dc2626' : 'var(--color-primary)', fontSize: '0.85rem', fontWeight: 600 }}>
        {cta} →
      </span>
    </Link>
  )
}

function Panne({ titre, frequence, cause, cout, labelCause, labelCout }: { titre: string; frequence: string; cause: string; cout: string; labelCause: string; labelCout: string }) {
  return (
    <article style={{
      background: 'var(--color-bg-card)', border: '1px solid var(--color-border)',
      borderRadius: 12, padding: 16,
    }}>
      <h3 style={{ fontSize: '0.98rem', margin: 0, marginBottom: 4 }}>{titre}</h3>
      <div style={{ fontSize: '0.78rem', color: 'var(--color-primary)', fontWeight: 600, marginBottom: 10 }}>{frequence}</div>
      <p style={{ fontSize: '0.86rem', margin: 0, marginBottom: 6 }}><strong>{labelCause}</strong> {cause}</p>
      <p style={{ fontSize: '0.86rem', margin: 0, color: 'var(--color-text-muted)' }}><strong>{labelCout}</strong> {cout}</p>
    </article>
  )
}

const lienMuted: React.CSSProperties = { color: 'var(--color-text-muted)', textDecoration: 'none' }
const lien: React.CSSProperties = { color: 'var(--color-primary)', textDecoration: 'none', fontWeight: 600 }
const h2: React.CSSProperties = { fontSize: '1.3rem', marginBottom: 12, marginTop: 0 }
const paraIntro: React.CSSProperties = { fontSize: '0.95rem', lineHeight: 1.65, marginBottom: 18, maxWidth: 720 }
const th: React.CSSProperties = { padding: '10px 12px', textAlign: 'left', color: 'var(--color-text-muted)', fontWeight: 600 }
const td: React.CSSProperties = { padding: '10px 12px' }
const infoCard: React.CSSProperties = {
  background: 'var(--color-bg-card)', border: '1px solid var(--color-border)',
  borderRadius: 12, padding: 16,
}
const infoH3: React.CSSProperties = { fontSize: '0.98rem', margin: 0, marginBottom: 8 }
const infoP: React.CSSProperties = { fontSize: '0.86rem', lineHeight: 1.55, margin: 0 }
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
