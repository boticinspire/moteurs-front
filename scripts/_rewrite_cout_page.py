"""
Réécrit app/[locale]/cout-voiture/page.tsx en version multilingue (next-intl).
Server component avec generateMetadata + JSON-LD localisé + setRequestLocale.
Sub-component CoutContent avec useTranslations('HubCout') + useTranslations('HubsShared').
Préserve le calcul TCO dynamique (exempleTCO) et les liens Link from @/i18n/navigation.
Écriture atomique tempfile + os.replace.
"""
import os
import tempfile


def atomic_write(target: str, content: str) -> str:
    target_dir = os.path.dirname(target) or "."
    fd, tmp = tempfile.mkstemp(prefix=".atomic_", dir=target_dir)
    try:
        with os.fdopen(fd, "w", encoding="utf-8", newline="\n") as f:
            f.write(content)
            f.flush()
            os.fsync(f.fileno())
        os.replace(tmp, target)
    except Exception:
        try:
            os.unlink(tmp)
        except FileNotFoundError:
            pass
        raise
    return f"size={os.path.getsize(target)}"


CONTENT = r"""/**
 * Hub SEO /cout-voiture — version multilingue (next-intl).
 * SSG — pillar page TCO : combien coûte une voiture sur 5 ans, toutes motorisations, tous pays.
 * Agrège /simulateur, /comparer, /tco/[pays]/[segment].
 */

import type { Metadata } from 'next'
import { useTranslations } from 'next-intl'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import FaqAccordion from '@/components/FaqAccordion'
import { routing } from '@/i18n/routing'
import {
  ENERGY_PRICES_FALLBACK,
  REF_PRICES_FALLBACK,
  REF_CONSO,
  MOTOR_LABELS,
  type Motor,
  type Pays,
} from '@/lib/tco'

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
  const t = await getTranslations({ locale, namespace: 'HubCout' })
  return {
    title: t('meta_title', { annee: ANNEE }),
    description: t('meta_desc', { annee: ANNEE }),
    openGraph: {
      title: t('og_title', { annee: ANNEE }),
      description: t('og_desc'),
      type: 'article',
    },
    alternates: {
      canonical:
        locale === routing.defaultLocale
          ? 'https://moteurs.com/cout-voiture'
          : `https://moteurs.com/${locale}/cout-voiture`,
    },
  }
}

export default async function PageCoutVoiture({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)

  const tHub = await getTranslations({ locale, namespace: 'HubCout' })
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        '@id': 'https://moteurs.com/cout-voiture',
        url: 'https://moteurs.com/cout-voiture',
        name: tHub('meta_title', { annee: ANNEE }),
        description: tHub('meta_desc', { annee: ANNEE }),
        inLanguage: locale,
        about: { '@type': 'Thing', name: "Coût de possession d'un véhicule" },
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Accueil', item: 'https://moteurs.com/' },
          { '@type': 'ListItem', position: 2, name: tHub('crumb_current'), item: 'https://moteurs.com/cout-voiture' },
        ],
      },
      {
        '@type': 'ItemList',
        name: 'Outils TCO Moteurs.com',
        itemListElement: [
          { '@type': 'ListItem', position: 1, url: 'https://moteurs.com/simulateur', name: 'Simulateur TCO personnalisé' },
          { '@type': 'ListItem', position: 2, url: 'https://moteurs.com/comparer', name: 'Comparateur 6 motorisations' },
          { '@type': 'ListItem', position: 3, url: 'https://moteurs.com/comparer-trajet', name: 'Comparateur coût trajet' },
          { '@type': 'ListItem', position: 4, url: 'https://moteurs.com/tco/fr/voiture', name: 'TCO voiture France' },
          { '@type': 'ListItem', position: 5, url: 'https://moteurs.com/tco/be/voiture', name: 'TCO voiture Belgique' },
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
      <CoutContent />
    </>
  )
}

function CoutContent() {
  const t = useTranslations('HubCout')
  const ts = useTranslations('HubsShared')
  const tc = useTranslations('Common')

  const motorsParticulier: Motor[] = ['diesel', 'essence', 'elec', 'phev']
  const paysList: { code: Pays; nom: string; drapeau: string }[] = [
    { code: 'FR', nom: tc('country_fr'), drapeau: '🇫🇷' },
    { code: 'BE', nom: tc('country_be'), drapeau: '🇧🇪' },
    { code: 'CH', nom: tc('country_ch'), drapeau: '🇨🇭' },
    { code: 'CA', nom: tc('country_ca'), drapeau: '🇨🇦' },
  ]

  // Exemple TCO 5 ans / 15 000 km/an / voiture particulier France
  const exempleTCO = motorsParticulier
    .map((m) => {
      const prixCat = REF_PRICES_FALLBACK.voiture?.[m] ?? 0
      const conso = REF_CONSO.voiture?.[m] ?? 0
      const energyKey = m === 'phev' ? 'diesel' : m === 'essence' ? 'essence' : m
      const prixEnergie = ENERGY_PRICES_FALLBACK.FR[energyKey] ?? 0
      const energie5ans = (conso / 100) * 15000 * 5 * prixEnergie
      const entretien5ans =
        m === 'elec' ? 480 * 5 : m === 'diesel' ? 1100 * 5 : m === 'phev' ? 950 * 5 : 1000 * 5
      const total = prixCat + energie5ans + entretien5ans
      return {
        motor: m,
        label: MOTOR_LABELS[m],
        prix: prixCat,
        energie: energie5ans,
        entretien: entretien5ans,
        total,
      }
    })
    .sort((a, b) => a.total - b.total)

  const moinsCher = exempleTCO[0]
  const plusCher = exempleTCO[exempleTCO.length - 1]
  const economie = plusCher.total - moinsCher.total

  // FAQ — 7 questions tirées du namespace HubCout
  const faqItems = [1, 2, 3, 4, 5, 6, 7].map((i) => ({
    question: t(`faq_q${i}` as `faq_q${1 | 2 | 3 | 4 | 5 | 6 | 7}`),
    answer: t(`faq_a${i}` as `faq_a${1 | 2 | 3 | 4 | 5 | 6 | 7}`, { annee: ANNEE }),
  }))

  return (
    <main className="container" style={{ paddingTop: 36, paddingBottom: 64 }}>
      <nav
        className="hub-breadcrumb-dark"
        style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', marginBottom: 22 }}
      >
        <Link href="/" style={lienMuted}>
          {ts('crumb_home')}
        </Link>
        {' / '}
        <span>{t('crumb_current')}</span>
      </nav>

      {/* Hero */}
      <header className="hub-hero-dark" style={{ marginBottom: 32 }}>
        <div
          style={{
            fontSize: '0.82rem',
            color: 'var(--color-primary)',
            fontWeight: 600,
            marginBottom: 8,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}
        >
          {t('hero_eyebrow', { annee: ANNEE })}
        </div>
        <h1 style={{ fontSize: 'clamp(1.7rem, 4vw, 2.5rem)', marginBottom: 14, lineHeight: 1.2 }}>
          {t('hero_h1_a', { annee: ANNEE })}{' '}
          <span style={{ color: 'var(--color-primary)' }}>{t('hero_h1_b')}</span>
        </h1>
        <p style={{ fontSize: '1rem', lineHeight: 1.65, maxWidth: 720, color: 'rgba(255,255,255,0.92)' }}>
          {t('hero_lead', { annee: ANNEE })}
        </p>
      </header>

      {/* Stat principale */}
      <section style={{ marginBottom: 36 }}>
        <div
          style={{
            background: 'linear-gradient(135deg, rgba(122,240,194,0.06), rgba(122,240,194,0.02))',
            border: '1px solid rgba(122,240,194,0.2)',
            borderRadius: 14,
            padding: '22px 24px',
          }}
        >
          <div
            style={{
              fontSize: '0.8rem',
              color: 'var(--color-primary)',
              fontWeight: 600,
              marginBottom: 8,
              textTransform: 'uppercase',
            }}
          >
            {t('stat_eyebrow')}
          </div>
          <p style={{ fontSize: '1rem', lineHeight: 1.65, margin: 0 }}>
            {t('stat_body_a')} <strong>{moinsCher.label}</strong> {t('stat_body_b')}{' '}
            <strong>{fmtEur(moinsCher.total)}</strong>
            {t('stat_body_c')} <strong>{fmtEur(economie)}</strong> {t('stat_body_d')}{' '}
            {plusCher.label}
            {t('stat_body_e')}
          </p>
        </div>
      </section>

      {/* Tableau TCO exemple */}
      <section style={{ marginBottom: 40 }}>
        <h2 style={h2}>{t('tco_h2')}</h2>
        <p style={paraIntro}>{t('tco_intro')}</p>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.92rem' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--color-border)' }}>
                <th style={th}>{t('tco_th_motor')}</th>
                <th style={thR}>{t('tco_th_prix')}</th>
                <th style={thR}>{t('tco_th_energie')}</th>
                <th style={thR}>{t('tco_th_entretien')}</th>
                <th style={thR}>{t('tco_th_total')}</th>
              </tr>
            </thead>
            <tbody>
              {exempleTCO.map((r) => (
                <tr
                  key={r.motor}
                  style={{
                    borderBottom: '1px solid var(--color-border)',
                    background: r.motor === moinsCher.motor ? 'rgba(5,150,105,0.05)' : 'transparent',
                  }}
                >
                  <td style={{ ...td, fontWeight: r.motor === moinsCher.motor ? 700 : 400 }}>
                    {r.label}
                    {r.motor === moinsCher.motor && (
                      <span style={{ marginLeft: 6, color: '#059669', fontSize: '0.74rem' }}>
                        {t('stat_winner_badge')}
                      </span>
                    )}
                  </td>
                  <td style={tdR}>{fmtEur(r.prix)}</td>
                  <td style={tdR}>{fmtEur(r.energie)}</td>
                  <td style={tdR}>{fmtEur(r.entretien)}</td>
                  <td style={{ ...tdR, fontWeight: 700 }}>{fmtEur(r.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Coût par pays */}
      <section style={{ marginBottom: 40 }}>
        <h2 style={h2}>{t('pays_h2')}</h2>
        <p style={paraIntro}>{t('pays_intro')}</p>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.92rem' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--color-border)' }}>
                <th style={th}>{t('pays_th_pays')}</th>
                <th style={thR}>{t('pays_th_diesel')}</th>
                <th style={thR}>{t('pays_th_essence')}</th>
                <th style={thR}>{t('pays_th_elec')}</th>
                <th style={thR}>{t('pays_th_dedie')}</th>
              </tr>
            </thead>
            <tbody>
              {paysList.map((p) => {
                const ep = ENERGY_PRICES_FALLBACK[p.code]
                return (
                  <tr key={p.code} style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <td style={td}>
                      {p.drapeau} {p.nom}
                    </td>
                    <td style={tdR}>{(ep.diesel ?? 0).toFixed(2)}</td>
                    <td style={tdR}>{(ep.essence ?? 0).toFixed(2)}</td>
                    <td style={tdR}>{(ep.elec ?? 0).toFixed(2)}</td>
                    <td style={tdR}>
                      <Link href={`/tco/${p.code.toLowerCase()}/voiture`} style={lien}>
                        {t('pays_link_prefix')} {p.nom} →
                      </Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Outils principaux */}
      <section style={{ marginBottom: 40 }}>
        <h2 style={h2}>{t('outils_h2')}</h2>
        <div
          style={{
            display: 'grid',
            gap: 14,
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          }}
        >
          <CarteOutil
            href="/simulateur"
            titre={t('outils_card1_title')}
            description={t('outils_card1_desc')}
            cta={t('outils_card1_cta')}
          />
          <CarteOutil
            href="/comparer"
            titre={t('outils_card2_title')}
            description={t('outils_card2_desc')}
            cta={t('outils_card2_cta')}
          />
          <CarteOutil
            href="/comparer-trajet"
            titre={t('outils_card3_title')}
            description={t('outils_card3_desc')}
            cta={t('outils_card3_cta')}
          />
        </div>
      </section>

      {/* Particulier vs B2B */}
      <section style={{ marginBottom: 40 }}>
        <h2 style={h2}>{t('segments_h2')}</h2>
        <div
          style={{
            display: 'grid',
            gap: 16,
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          }}
        >
          <article style={infoCard}>
            <h3 style={infoH3}>{t('segments_part_title')}</h3>
            <ul style={infoList}>
              <li>{t('segments_part_1')}</li>
              <li>{t('segments_part_2', { annee: ANNEE })}</li>
              <li>{t('segments_part_3')}</li>
              <li>{t('segments_part_4')}</li>
              <li>{t('segments_part_5')}</li>
            </ul>
            <Link
              href="/particulier"
              style={{ ...lien, fontSize: '0.85rem', display: 'block', marginTop: 12 }}
            >
              {t('segments_part_link')}
            </Link>
          </article>
          <article style={infoCard}>
            <h3 style={infoH3}>{t('segments_b2b_title')}</h3>
            <ul style={infoList}>
              <li>{t('segments_b2b_1')}</li>
              <li>{t('segments_b2b_2', { annee: ANNEE })}</li>
              <li>{t('segments_b2b_3')}</li>
              <li>{t('segments_b2b_4')}</li>
              <li>{t('segments_b2b_5')}</li>
            </ul>
            <Link
              href="/b2b"
              style={{ ...lien, fontSize: '0.85rem', display: 'block', marginTop: 12 }}
            >
              {t('segments_b2b_link')}
            </Link>
          </article>
        </div>
      </section>

      {/* Postes de coût */}
      <section style={{ marginBottom: 40 }}>
        <h2 style={h2}>{t('postes_h2')}</h2>
        <ol style={{ paddingLeft: 20, lineHeight: 1.8, fontSize: '0.95rem' }}>
          {[1, 2, 3, 4, 5, 6, 7].map((i) => {
            const label = t(`postes_${i}_label` as `postes_${1 | 2 | 3 | 4 | 5 | 6 | 7}_label`)
            const body = t(`postes_${i}_body` as `postes_${1 | 2 | 3 | 4 | 5 | 6 | 7}_body`)
            return (
              <li key={i}>
                <strong>{label}</strong> — {body}
              </li>
            )
          })}
        </ol>
      </section>

      {/* FAQ */}
      <section style={{ marginTop: 48 }}>
        <FaqAccordion items={faqItems} title={t('faq_title')} />
      </section>

      {/* Voir aussi : maillage inter-hubs */}
      <section
        style={{
          marginTop: 48,
          paddingTop: 32,
          borderTop: '1px solid var(--color-border)',
        }}
      >
        <h2 style={{ fontSize: '1.15rem', marginBottom: 14 }}>{ts('see_also_h2')}</h2>
        <p
          style={{
            color: 'var(--color-text-muted)',
            fontSize: '0.9rem',
            marginBottom: 18,
            lineHeight: 1.5,
          }}
        >
          {ts('see_also_lead')}
        </p>
        <div
          style={{
            display: 'grid',
            gap: 14,
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          }}
        >
          <Link
            href="/recharge-electrique"
            style={{
              display: 'block',
              padding: 16,
              borderRadius: 12,
              background: 'var(--color-bg)',
              border: '1px solid var(--color-border)',
              textDecoration: 'none',
              color: 'var(--color-text)',
            }}
          >
            <div style={{ fontSize: '1.4rem', marginBottom: 6 }}>🔌</div>
            <div style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: 4 }}>
              {ts('card_recharge_title')}
            </div>
            <div
              style={{
                fontSize: '0.82rem',
                color: 'var(--color-text-muted)',
                lineHeight: 1.5,
              }}
            >
              {ts('card_recharge_desc')}
            </div>
          </Link>
          <Link
            href="/vacances-voiture"
            style={{
              display: 'block',
              padding: 16,
              borderRadius: 12,
              background: 'var(--color-bg)',
              border: '1px solid var(--color-border)',
              textDecoration: 'none',
              color: 'var(--color-text)',
            }}
          >
            <div style={{ fontSize: '1.4rem', marginBottom: 6 }}>🏖️</div>
            <div style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: 4 }}>
              {ts('card_vacances_title')}
            </div>
            <div
              style={{
                fontSize: '0.82rem',
                color: 'var(--color-text-muted)',
                lineHeight: 1.5,
              }}
            >
              {ts('card_vacances_desc')}
            </div>
          </Link>
          <Link
            href="/depannage"
            style={{
              display: 'block',
              padding: 16,
              borderRadius: 12,
              background: 'var(--color-bg)',
              border: '1px solid var(--color-border)',
              textDecoration: 'none',
              color: 'var(--color-text)',
            }}
          >
            <div style={{ fontSize: '1.4rem', marginBottom: 6 }}>🔧</div>
            <div style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: 4 }}>
              {ts('card_depannage_title')}
            </div>
            <div
              style={{
                fontSize: '0.82rem',
                color: 'var(--color-text-muted)',
                lineHeight: 1.5,
              }}
            >
              {ts('card_depannage_desc')}
            </div>
          </Link>
          <Link
            href="/documents-auto"
            style={{
              display: 'block',
              padding: 16,
              borderRadius: 12,
              background: 'var(--color-bg)',
              border: '1px solid var(--color-border)',
              textDecoration: 'none',
              color: 'var(--color-text)',
            }}
          >
            <div style={{ fontSize: '1.4rem', marginBottom: 6 }}>📄</div>
            <div style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: 4 }}>
              {ts('card_documents_title')}
            </div>
            <div
              style={{
                fontSize: '0.82rem',
                color: 'var(--color-text-muted)',
                lineHeight: 1.5,
              }}
            >
              {ts('card_documents_desc')}
            </div>
          </Link>
        </div>
      </section>

      {/* Outliens / aller plus loin */}
      <section
        style={{
          marginTop: 40,
          padding: 22,
          borderRadius: 14,
          background: 'var(--color-bg-card)',
          border: '1px solid var(--color-border)',
        }}
      >
        <h2 style={{ fontSize: '1.05rem', marginBottom: 12 }}>{t('outliens_h2')}</h2>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
          <Link href="/simulateur" style={btnSecondaire}>
            {t('outliens_simu')}
          </Link>
          <Link href="/comparer" style={btnSecondaire}>
            {t('outliens_compare')}
          </Link>
          <Link href="/comparer-trajet" style={btnSecondaire}>
            {t('outliens_trajet')}
          </Link>
          <Link href="/recharge-electrique" style={btnSecondaire}>
            {t('outliens_recharge')}
          </Link>
          <Link href="/vacances-voiture" style={btnSecondaire}>
            {t('outliens_vacances')}
          </Link>
        </div>
      </section>
    </main>
  )
}

// ─── Composants ───────────────────────────────────────────────────────────────

function CarteOutil({
  href,
  titre,
  description,
  cta,
}: {
  href: string
  titre: string
  description: string
  cta: string
}) {
  return (
    <Link
      href={href}
      style={{
        display: 'block',
        padding: 18,
        borderRadius: 12,
        background: 'var(--color-bg-card)',
        border: '1px solid var(--color-border)',
        textDecoration: 'none',
        color: 'var(--color-text)',
      }}
    >
      <h3 style={{ fontSize: '1rem', margin: 0, marginBottom: 8 }}>{titre}</h3>
      <p
        style={{
          fontSize: '0.88rem',
          lineHeight: 1.55,
          color: 'var(--color-text-muted)',
          margin: 0,
          marginBottom: 12,
        }}
      >
        {description}
      </p>
      <span
        style={{ color: 'var(--color-primary)', fontSize: '0.85rem', fontWeight: 600 }}
      >
        {cta} →
      </span>
    </Link>
  )
}

// ─── Utilitaires & styles ─────────────────────────────────────────────────────

function fmtEur(v: number): string {
  return Math.round(v).toLocaleString('fr-FR') + ' €'
}

const lienMuted: React.CSSProperties = {
  color: 'var(--color-text-muted)',
  textDecoration: 'none',
}
const lien: React.CSSProperties = {
  color: 'var(--color-primary)',
  textDecoration: 'none',
  fontWeight: 600,
}
const h2: React.CSSProperties = { fontSize: '1.3rem', marginBottom: 12, marginTop: 0 }
const paraIntro: React.CSSProperties = {
  fontSize: '0.95rem',
  lineHeight: 1.65,
  marginBottom: 18,
  maxWidth: 720,
}
const th: React.CSSProperties = {
  padding: '10px 12px',
  textAlign: 'left',
  color: 'var(--color-text-muted)',
  fontWeight: 600,
}
const thR: React.CSSProperties = {
  padding: '10px 12px',
  textAlign: 'right',
  color: 'var(--color-text-muted)',
  fontWeight: 600,
}
const td: React.CSSProperties = { padding: '10px 12px' }
const tdR: React.CSSProperties = { padding: '10px 12px', textAlign: 'right' }
const infoCard: React.CSSProperties = {
  background: 'var(--color-bg-card)',
  border: '1px solid var(--color-border)',
  borderRadius: 12,
  padding: 18,
}
const infoH3: React.CSSProperties = { fontSize: '1.05rem', marginTop: 0, marginBottom: 10 }
const infoList: React.CSSProperties = {
  paddingLeft: 18,
  fontSize: '0.92rem',
  lineHeight: 1.7,
  margin: 0,
}
const btnSecondaire: React.CSSProperties = {
  padding: '8px 14px',
  borderRadius: 8,
  background: 'transparent',
  border: '1px solid var(--color-border)',
  color: 'var(--color-text)',
  fontSize: '0.85rem',
  textDecoration: 'none',
  fontWeight: 500,
}
"""

OUT = "app/[locale]/cout-voiture/page.tsx"
print(atomic_write(OUT, CONTENT))
