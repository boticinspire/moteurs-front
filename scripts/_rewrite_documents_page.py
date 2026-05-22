"""
Réécrit app/[locale]/documents-auto/page.tsx en version multilingue (next-intl).
Server component avec generateMetadata + JSON-LD localisé + setRequestLocale.
Sub-component DocumentsContent avec useTranslations('HubDocuments') + useTranslations('HubsShared').
Écriture atomique tempfile + os.replace.
"""
import os, tempfile


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
        try: os.unlink(tmp)
        except FileNotFoundError: pass
        raise
    return f"size={os.path.getsize(target)}"


CONTENT = r"""/**
 * Hub SEO /documents-auto — version multilingue (next-intl).
 * SSG — pillar page sur les documents administratifs du véhicule
 * (carte grise, permis, assurance, contrôle technique).
 */

import type { Metadata } from 'next'
import { useTranslations } from 'next-intl'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import FaqAccordion from '@/components/FaqAccordion'
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
  const t = await getTranslations({ locale, namespace: 'HubDocuments' })
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
          ? 'https://moteurs.com/documents-auto'
          : `https://moteurs.com/${locale}/documents-auto`,
    },
  }
}

export default async function PageDocumentsAuto({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)

  const tHub = await getTranslations({ locale, namespace: 'HubDocuments' })
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        '@id': 'https://moteurs.com/documents-auto',
        url: 'https://moteurs.com/documents-auto',
        name: tHub('meta_title', { annee: ANNEE }),
        description: tHub('meta_desc', { annee: ANNEE }),
        inLanguage: locale,
        about: { '@type': 'Thing', name: 'Documents administratifs véhicule' },
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Accueil', item: 'https://moteurs.com/' },
          { '@type': 'ListItem', position: 2, name: tHub('crumb_current'), item: 'https://moteurs.com/documents-auto' },
        ],
      },
      {
        '@type': 'ItemList',
        name: 'Outils documents auto Moteurs.com',
        itemListElement: [
          { '@type': 'ListItem', position: 1, url: 'https://moteurs.com/outils/immatriculation-france', name: 'Outil immatriculation France' },
          { '@type': 'ListItem', position: 2, url: 'https://moteurs.com/outils/immatriculation-belgique', name: 'Outil immatriculation Belgique' },
          { '@type': 'ListItem', position: 3, url: 'https://moteurs.com/outils/convertisseur', name: 'Convertisseur technique' },
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
      <DocumentsContent />
    </>
  )
}

function DocumentsContent() {
  const t = useTranslations('HubDocuments')
  const ts = useTranslations('HubsShared')

  const faqItems = [1, 2, 3, 4, 5, 6, 7].map((i) => ({
    question: t(`faq_q${i}` as `faq_q${1 | 2 | 3 | 4 | 5 | 6 | 7}`, { annee: ANNEE }),
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
          {t('hero_h1_a')} <span style={{ color: 'var(--color-primary)' }}>{t('hero_h1_b')}</span>
        </h1>
        <p style={{ fontSize: '1rem', lineHeight: 1.65, maxWidth: 720, color: 'rgba(255,255,255,0.92)' }}>
          {t('hero_lead', { annee: ANNEE })}
        </p>
      </header>

      {/* Documents indispensables — checklist */}
      <section style={{ marginBottom: 40 }}>
        <h2 style={h2}>{t('check_h2')}</h2>
        <div style={{ display: 'grid', gap: 14, gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
          <Doc icone="🪪" titre={t('check_1_title')} description={t('check_1_desc')} />
          <Doc icone="🚗" titre={t('check_2_title')} description={t('check_2_desc')} />
          <Doc icone="🛡️" titre={t('check_3_title')} description={t('check_3_desc')} />
          <Doc icone="✅" titre={t('check_4_title')} description={t('check_4_desc')} />
        </div>
      </section>

      {/* Outils principaux */}
      <section style={{ marginBottom: 40 }}>
        <h2 style={h2}>{t('outils_h2')}</h2>
        <div style={{ display: 'grid', gap: 14, gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
          <CarteOutil
            href="/outils/immatriculation-france"
            titre={t('outils_card1_title')}
            description={t('outils_card1_desc')}
            cta={t('outils_card1_cta')}
          />
          <CarteOutil
            href="/outils/immatriculation-belgique"
            titre={t('outils_card2_title')}
            description={t('outils_card2_desc')}
            cta={t('outils_card2_cta')}
          />
          <CarteOutil
            href="/outils/convertisseur"
            titre={t('outils_card3_title')}
            description={t('outils_card3_desc', { annee: ANNEE })}
            cta={t('outils_card3_cta')}
          />
        </div>
      </section>

      {/* Carte grise par pays */}
      <section style={{ marginBottom: 40 }}>
        <h2 style={h2}>{t('pays_h2')}</h2>
        <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))' }}>
          <article style={infoCard}>
            <h3 style={infoH3}>{t('pays_fr_title')}</h3>
            <ul style={infoList}>
              <li>{t('pays_fr_1')}</li>
              <li>{t('pays_fr_2')}</li>
              <li>{t('pays_fr_3')}</li>
              <li>{t('pays_fr_4')}</li>
              <li>{t('pays_fr_5')}</li>
            </ul>
            <Link
              href="/outils/immatriculation-france"
              style={{ ...lien, fontSize: '0.85rem', display: 'block', marginTop: 10 }}
            >
              {t('pays_fr_link')}
            </Link>
          </article>
          <article style={infoCard}>
            <h3 style={infoH3}>{t('pays_be_title')}</h3>
            <ul style={infoList}>
              <li>{t('pays_be_1')}</li>
              <li>{t('pays_be_2')}</li>
              <li>{t('pays_be_3')}</li>
              <li>{t('pays_be_4')}</li>
              <li>{t('pays_be_5')}</li>
            </ul>
            <Link
              href="/outils/immatriculation-belgique"
              style={{ ...lien, fontSize: '0.85rem', display: 'block', marginTop: 10 }}
            >
              {t('pays_be_link')}
            </Link>
          </article>
          <article style={infoCard}>
            <h3 style={infoH3}>{t('pays_ch_title')}</h3>
            <ul style={infoList}>
              <li>{t('pays_ch_1')}</li>
              <li>{t('pays_ch_2')}</li>
              <li>{t('pays_ch_3')}</li>
              <li>{t('pays_ch_4')}</li>
              <li>{t('pays_ch_5')}</li>
            </ul>
          </article>
          <article style={infoCard}>
            <h3 style={infoH3}>{t('pays_ca_title')}</h3>
            <ul style={infoList}>
              <li>{t('pays_ca_1')}</li>
              <li>{t('pays_ca_2')}</li>
              <li>{t('pays_ca_3')}</li>
              <li>{t('pays_ca_4')}</li>
              <li>{t('pays_ca_5')}</li>
            </ul>
          </article>
        </div>
      </section>

      {/* Permis de conduire */}
      <section style={{ marginBottom: 40 }}>
        <h2 style={h2}>{t('permis_h2')}</h2>
        <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))' }}>
          <article style={infoCard}>
            <h3 style={infoH3}>{t('permis_card1_title')}</h3>
            <p style={infoP}>{t('permis_card1_body')}</p>
          </article>
          <article style={infoCard}>
            <h3 style={infoH3}>{t('permis_card2_title')}</h3>
            <p style={infoP}>{t('permis_card2_body')}</p>
          </article>
          <article style={infoCard}>
            <h3 style={infoH3}>{t('permis_card3_title')}</h3>
            <p style={infoP}>{t('permis_card3_body')}</p>
          </article>
        </div>
      </section>

      {/* Assurance / carte verte */}
      <section style={{ marginBottom: 40 }}>
        <h2 style={h2}>{t('assur_h2')}</h2>
        <p style={paraIntro}>{t('assur_intro')}</p>
        <ul style={{ paddingLeft: 18, lineHeight: 1.8, fontSize: '0.95rem' }}>
          <li>
            <strong>{t('assur_li1_label')}</strong> — {t('assur_li1_body')}
          </li>
          <li>
            <strong>{t('assur_li2_label')}</strong> — {t('assur_li2_body')}
          </li>
          <li>
            <strong>{t('assur_li3_label')}</strong> — {t('assur_li3_body')}
          </li>
          <li>
            <strong>{t('assur_li4_label')}</strong> — {t('assur_li4_a')}{' '}
            <Link href="/depannage" style={lien}>
              {t('assur_li4_link')}
            </Link>{' '}
            {t('assur_li4_b')}
          </li>
        </ul>
      </section>

      {/* Contrôle technique */}
      <section style={{ marginBottom: 40 }}>
        <h2 style={h2}>{t('ct_h2')}</h2>
        <div style={{ display: 'grid', gap: 14, gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
          <Doc icone="🇫🇷" titre={t('ct_fr_title')} description={t('ct_fr_desc')} />
          <Doc icone="🇧🇪" titre={t('ct_be_title')} description={t('ct_be_desc')} />
          <Doc icone="🇨🇭" titre={t('ct_ch_title')} description={t('ct_ch_desc')} />
          <Doc icone="🇨🇦" titre={t('ct_ca_title')} description={t('ct_ca_desc')} />
        </div>
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
            <div style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', lineHeight: 1.5 }}>
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
            <div style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', lineHeight: 1.5 }}>
              {ts('card_vacances_desc')}
            </div>
          </Link>
          <Link
            href="/cout-voiture"
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
            <div style={{ fontSize: '1.4rem', marginBottom: 6 }}>💰</div>
            <div style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: 4 }}>
              {ts('card_cout_title')}
            </div>
            <div style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', lineHeight: 1.5 }}>
              {ts('card_cout_desc')}
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
            <div style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', lineHeight: 1.5 }}>
              {ts('card_depannage_desc')}
            </div>
          </Link>
        </div>
      </section>

      {/* Outliens */}
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
          <Link href="/outils/immatriculation-france" style={btnSecondaire}>
            {t('outliens_immat_fr')}
          </Link>
          <Link href="/outils/immatriculation-belgique" style={btnSecondaire}>
            {t('outliens_immat_be')}
          </Link>
          <Link href="/outils/convertisseur" style={btnSecondaire}>
            {t('outliens_conv')}
          </Link>
          <Link href="/depannage" style={btnSecondaire}>
            {t('outliens_depannage')}
          </Link>
          <Link href="/cout-voiture" style={btnSecondaire}>
            {t('outliens_cout')}
          </Link>
        </div>
      </section>
    </main>
  )
}

// ─── Composants ───────────────────────────────────────────────────────────────

function Doc({ icone, titre, description }: { icone: string; titre: string; description: string }) {
  return (
    <article
      style={{
        background: 'var(--color-bg-card)',
        border: '1px solid var(--color-border)',
        borderRadius: 12,
        padding: 16,
      }}
    >
      <div style={{ fontSize: '1.6rem', marginBottom: 8 }}>{icone}</div>
      <h3 style={{ fontSize: '0.95rem', margin: 0, marginBottom: 6 }}>{titre}</h3>
      <p style={{ fontSize: '0.86rem', lineHeight: 1.55, color: 'var(--color-text-muted)', margin: 0 }}>
        {description}
      </p>
    </article>
  )
}

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
      <span style={{ color: 'var(--color-primary)', fontSize: '0.85rem', fontWeight: 600 }}>
        {cta} →
      </span>
    </Link>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────

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
const infoCard: React.CSSProperties = {
  background: 'var(--color-bg-card)',
  border: '1px solid var(--color-border)',
  borderRadius: 12,
  padding: 18,
}
const infoH3: React.CSSProperties = { fontSize: '1rem', margin: 0, marginBottom: 10 }
const infoP: React.CSSProperties = {
  fontSize: '0.95rem',
  lineHeight: 1.65,
  margin: 0,
  color: 'var(--color-text-muted)',
}
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

OUT = "app/[locale]/documents-auto/page.tsx"
print(atomic_write(OUT, CONTENT))
