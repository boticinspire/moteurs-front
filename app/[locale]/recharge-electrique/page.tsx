/**
 * Hub SEO /recharge-electrique — version multilingue (next-intl).
 * SSG — server component pour metadata + JSON-LD, sous-composant
 * client pour le contenu (useTranslations).
 */

import type { Metadata } from 'next'
import { useTranslations } from 'next-intl'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import FaqAccordion from '@/components/FaqAccordion'
import { ENERGY_PRICES_FALLBACK } from '@/lib/tco'
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
  const t = await getTranslations({ locale, namespace: 'HubRecharge' })
  return {
    title: t('meta_title', { annee: ANNEE }),
    description: t('meta_desc', { annee: ANNEE }),
    openGraph: {
      title: t('og_title'),
      description: t('og_desc'),
      type: 'article',
    },
    alternates: {
      canonical: locale === routing.defaultLocale
        ? 'https://moteurs.com/recharge-electrique'
        : `https://moteurs.com/${locale}/recharge-electrique`,
    },
  }
}

export default async function PageRechargeElectrique({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)

  const tHub = await getTranslations({ locale, namespace: 'HubRecharge' })
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        '@id': 'https://moteurs.com/recharge-electrique',
        url: 'https://moteurs.com/recharge-electrique',
        name: tHub('meta_title', { annee: ANNEE }),
        description: tHub('meta_desc', { annee: ANNEE }),
        inLanguage: locale,
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: tHub('crumb_home'),          item: 'https://moteurs.com/' },
          { '@type': 'ListItem', position: 2, name: tHub('crumb_current'),    item: 'https://moteurs.com/recharge-electrique' },
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
      <RechargeContent />
    </>
  )
}

function RechargeContent() {
  const t = useTranslations('HubRecharge')
  const ts = useTranslations('HubsShared')
  const tc = useTranslations('Common')

  const tarifs = [
    { pays_key: 'country_fr', code: 'FR', drapeau: '🇫🇷', prix: ENERGY_PRICES_FALLBACK.FR.elec ?? 0.21 },
    { pays_key: 'country_be', code: 'BE', drapeau: '🇧🇪', prix: ENERGY_PRICES_FALLBACK.BE.elec ?? 0.30 },
    { pays_key: 'country_ch', code: 'CH', drapeau: '🇨🇭', prix: ENERGY_PRICES_FALLBACK.CH.elec ?? 0.27 },
    { pays_key: 'country_ca', code: 'CA', drapeau: '🇨🇦', prix: ENERGY_PRICES_FALLBACK.CA.elec ?? 0.13 },
  ]
  const moyenneEU = (tarifs[0].prix + tarifs[1].prix + tarifs[2].prix) / 3

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

      {/* Tarifs */}
      <section style={{ marginBottom: 40 }}>
        <h2 style={statH2}>{t('tarif_h2', { annee: ANNEE })}</h2>
        <div style={{ display: 'grid', gap: 14, gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', marginBottom: 16 }}>
          {tarifs.map(tarif => {
            const totalFor60 = (tarif.prix * 60).toFixed(0)
            return (
              <div key={tarif.code} style={statCard}>
                <div style={{ fontSize: '1.8rem', marginBottom: 4 }}>{tarif.drapeau}</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>
                  {tc(('country_' + tarif.code.toLowerCase()) as 'country_fr'|'country_be'|'country_ch'|'country_ca')}
                </div>
                <div style={{ fontSize: '1.3rem', fontWeight: 700, marginTop: 4 }}>{tarif.prix.toFixed(2)} €/kWh</div>
                <div style={{ fontSize: '0.74rem', color: 'var(--color-text-muted)', marginTop: 2 }}>
                  {t('tarif_card_for_60kwh', { prix: totalFor60 })}
                </div>
              </div>
            )
          })}
        </div>
        <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', lineHeight: 1.6 }}>
          {t('tarif_note', { moyenne: (moyenneEU * 60).toFixed(0) })}
        </p>
      </section>

      {/* Domicile vs public */}
      <section style={{ marginBottom: 40 }}>
        <h2 style={statH2}>{t('domvspub_h2')}</h2>
        <div style={{ overflowX: 'auto', marginBottom: 16 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.92rem' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--color-border)' }}>
                <th style={th}>{t('domvspub_th_critere')}</th>
                <th style={th}>{t('domvspub_th_dom')}</th>
                <th style={th}>{t('domvspub_th_pub_lent')}</th>
                <th style={th}>{t('domvspub_th_pub_rapide')}</th>
              </tr>
            </thead>
            <tbody>
              <tr style={tr}><td style={td}>{t('domvspub_row_prix')}</td><td style={td}>{t('domvspub_row_prix_dom')}</td><td style={td}>{t('domvspub_row_prix_pub_lent')}</td><td style={td}>{t('domvspub_row_prix_pub_rapide')}</td></tr>
              <tr style={tr}><td style={td}>{t('domvspub_row_puiss')}</td><td style={td}>{t('domvspub_row_puiss_dom')}</td><td style={td}>{t('domvspub_row_puiss_pub_lent')}</td><td style={td}>{t('domvspub_row_puiss_pub_rapide')}</td></tr>
              <tr style={tr}><td style={td}>{t('domvspub_row_temps')}</td><td style={td}>{t('domvspub_row_temps_dom')}</td><td style={td}>{t('domvspub_row_temps_pub_lent')}</td><td style={td}>{t('domvspub_row_temps_pub_rapide')}</td></tr>
              <tr style={tr}><td style={td}>{t('domvspub_row_usage')}</td><td style={td}>{t('domvspub_row_usage_dom')}</td><td style={td}>{t('domvspub_row_usage_pub_lent')}</td><td style={td}>{t('domvspub_row_usage_pub_rapide')}</td></tr>
              <tr style={tr}><td style={td}>{t('domvspub_row_invest')}</td><td style={td}>{t('domvspub_row_invest_dom')}</td><td style={td}>{t('domvspub_row_invest_pub_lent')}</td><td style={td}>{t('domvspub_row_invest_pub_rapide')}</td></tr>
            </tbody>
          </table>
        </div>
        <p style={{ fontSize: '0.92rem', lineHeight: 1.65 }}>
          <strong>{t('domvspub_rule_label')}</strong> {t('domvspub_rule_body')}
        </p>
      </section>

      {/* Cartes de recharge */}
      <section style={{ marginBottom: 40, padding: 24, borderRadius: 14, background: 'rgba(122,240,194,0.05)', border: '1px solid rgba(122,240,194,0.2)' }}>
        <h2 style={{ ...statH2, marginTop: 0 }}>{t('cards_h2')}</h2>
        <p style={{ fontSize: '0.95rem', lineHeight: 1.65, marginBottom: 16 }}>
          {t('cards_body')}
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
          <Link href="/outils/cartes-recharge" style={btnPrimaire}>{t('cards_cta_compare')}</Link>
          <Link href="/assistance/recharge" style={btnSecondaire}>{t('cards_cta_cost')}</Link>
        </div>
      </section>

      {/* Autoroute */}
      <section style={{ marginBottom: 40 }}>
        <h2 style={statH2}>{t('autoroute_h2')}</h2>
        <p style={{ fontSize: '0.95rem', lineHeight: 1.65, marginBottom: 16 }}>{t('autoroute_body')}</p>
        <div style={{ display: 'grid', gap: 10, gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
          {[
            { slug: 'belgique-cote-azur', label: "Belgique → Côte d'Azur" },
            { slug: 'france-costa-brava', label: 'France → Costa Brava' },
            { slug: 'pays-bas-lac-garde', label: 'Pays-Bas → Lac de Garde' },
            { slug: 'allemagne-algarve',  label: 'Allemagne → Algarve' },
          ].map(trip => (
            <Link key={trip.slug} href={`/trajet/${trip.slug}/electrique`} style={carteLink}>
              <div style={{ fontWeight: 600, fontSize: '0.92rem' }}>{'⚡ ' + trip.label}</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', marginTop: 4 }}>
                {t('autoroute_trip_label')}
              </div>
            </Link>
          ))}
        </div>
        <p style={{ marginTop: 14 }}>
          <Link href="/comparer-trajet" style={lien}>{t('autoroute_link_compare')}</Link>
        </p>
      </section>

      {/* Installation */}
      <section style={{ marginBottom: 40 }}>
        <h2 style={statH2}>{t('install_h2')}</h2>
        <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', marginBottom: 16 }}>
          <article style={infoCard}>
            <h3 style={infoH3}>{t('install_card1_title')}</h3>
            <p style={infoP}>{t('install_card1_body', { annee: ANNEE })}</p>
          </article>
          <article style={infoCard}>
            <h3 style={infoH3}>{t('install_card2_title')}</h3>
            <p style={infoP}>{t('install_card2_body')}</p>
            <Link href="/article/article-recharge-copro" style={{ ...lien, fontSize: '0.85rem' }}>
              {t('install_card2_link')}
            </Link>
          </article>
          <article style={infoCard}>
            <h3 style={infoH3}>{t('install_card3_title')}</h3>
            <p style={infoP}>{t('install_card3_body', { annee: ANNEE })}</p>
          </article>
        </div>
      </section>

      {/* Aides */}
      <section style={{ marginBottom: 40 }}>
        <h2 style={statH2}>{t('aides_h2', { annee: ANNEE })}</h2>
        <ul style={{ paddingLeft: 18, lineHeight: 1.8, fontSize: '0.95rem' }}>
          <li>{t('aides_fr')}</li>
          <li>{t('aides_be')}</li>
          <li>{t('aides_ch')}</li>
          <li>{t('aides_ca')}</li>
        </ul>
        <p style={{ marginTop: 12 }}>
          <Link href="/articles" style={lien}>{t('aides_more_link')}</Link>
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

      {/* Outils & ressources */}
      <section style={{ marginTop: 40, padding: 22, borderRadius: 14, background: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}>
        <h2 style={{ fontSize: '1.05rem', marginBottom: 12 }}>{t('outils_h2')}</h2>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
          <Link href="/outils/cartes-recharge" style={btnSecondaire}>{t('outils_cartes')}</Link>
          <Link href="/assistance/recharge" style={btnSecondaire}>{t('outils_assistance')}</Link>
          <Link href="/simulateur" style={btnSecondaire}>{t('outils_simulateur')}</Link>
          <Link href="/comparer-trajet" style={btnSecondaire}>{t('outils_comparer_trajet')}</Link>
          <Link href="/trajet" style={btnSecondaire}>{t('outils_trajets')}</Link>
        </div>
      </section>
    </main>
  )
}

// Pays labels (utilise les clés Common déjà existantes)
function paysLabel(code: 'FR' | 'BE' | 'CH' | 'CA'): string {
  // Cette fonction est appelée dans un composant client qui a useTranslations
  // Inline ici pour simplicité ; les libellés sont dans Common.country_*
  const map: Record<string, string> = {
    FR: 'France',
    BE: 'Belgique',
    CH: 'Suisse',
    CA: 'Canada',
  }
  return map[code]
}

// Styles
const lienMuted: React.CSSProperties = { color: 'var(--color-text-muted)', textDecoration: 'none' }
const lien: React.CSSProperties = { color: 'var(--color-primary)', textDecoration: 'none', fontWeight: 600 }
const statH2: React.CSSProperties = { fontSize: '1.3rem', marginBottom: 16, marginTop: 0 }
const statCard: React.CSSProperties = {
  background: 'var(--color-bg-card)', border: '1px solid var(--color-border)',
  borderRadius: 12, padding: 16, textAlign: 'center',
}
const th: React.CSSProperties = { padding: '10px 12px', textAlign: 'left', color: 'var(--color-text-muted)', fontWeight: 600 }
const tr: React.CSSProperties = { borderBottom: '1px solid var(--color-border)' }
const td: React.CSSProperties = { padding: '10px 12px' }
const infoCard: React.CSSProperties = {
  background: 'var(--color-bg-card)', border: '1px solid var(--color-border)',
  borderRadius: 12, padding: 18,
}
const infoH3: React.CSSProperties = { fontSize: '1rem', margin: 0, marginBottom: 8 }
const infoP: React.CSSProperties = { fontSize: '0.88rem', lineHeight: 1.6, margin: 0, color: 'var(--color-text)' }
const carteLink: React.CSSProperties = {
  display: 'block', padding: 14, borderRadius: 10,
  background: 'var(--color-bg-card)', border: '1px solid var(--color-border)',
  textDecoration: 'none', color: 'var(--color-text)',
}
const hubCardLink: React.CSSProperties = {
  display: 'block', padding: 16, borderRadius: 12,
  background: 'var(--color-bg)', border: '1px solid var(--color-border)',
  textDecoration: 'none', color: 'var(--color-text)',
}
const btnPrimaire: React.CSSProperties = {
  display: 'inline-block', padding: '10px 20px', borderRadius: 8,
  background: 'var(--color-primary)', color: '#fff', textDecoration: 'none',
  fontWeight: 700, fontSize: '0.95rem', border: '1px solid var(--color-primary)',
}
const btnSecondaire: React.CSSProperties = {
  display: 'inline-block', padding: '10px 16px',
  background: 'var(--color-bg-card)', border: '1px solid var(--color-border)',
  borderRadius: 8, color: 'var(--color-primary)', textDecoration: 'none',
  fontWeight: 600, fontSize: '0.92rem',
}
