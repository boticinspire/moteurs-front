/**
 * /vacances-voiture/checklist-ev — Pense-bête EV vacances
 * Page SSG multilingue : 10 conseils pratiques pour réduire le coût d'un trajet
 * vacances en voiture électrique. Comprend un bouton "imprimer" + styles @media print.
 */

import type { Metadata } from 'next'
import { useTranslations } from 'next-intl'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import { routing } from '@/i18n/routing'
import PrintButton from './PrintButton'

const ANNEE = new Date().getFullYear()

const TIPS = [
  { num: 1,  cat: 'cat_road',     emoji: '🐢' },
  { num: 2,  cat: 'cat_recharge', emoji: '🔥' },
  { num: 3,  cat: 'cat_recharge', emoji: '🔋' },
  { num: 4,  cat: 'cat_recharge', emoji: '❄️' },
  { num: 5,  cat: 'cat_recharge', emoji: '🛒' },
  { num: 6,  cat: 'cat_recharge', emoji: '💳' },
  { num: 7,  cat: 'cat_vehicle',  emoji: '🌬️' },
  { num: 8,  cat: 'cat_vehicle',  emoji: '⚙️' },
  { num: 9,  cat: 'cat_road',     emoji: '🌡️' },
  { num: 10, cat: 'cat_house',    emoji: '🏠' },
] as const

const CAT_COLOR: Record<string, string> = {
  cat_road:     '#3b82f6',
  cat_recharge: '#10b981',
  cat_vehicle:  '#f59e0b',
  cat_house:    '#a855f7',
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'ChecklistEV' })
  const canonical =
    locale === routing.defaultLocale
      ? 'https://moteurs.com/vacances-voiture/checklist-ev'
      : `https://moteurs.com/${locale}/vacances-voiture/checklist-ev`
  return {
    title: t('meta_title', { annee: ANNEE }),
    description: t('meta_desc'),
    openGraph: {
      title: t('og_title', { annee: ANNEE }),
      description: t('og_desc'),
      type: 'article',
      url: canonical,
    },
    alternates: { canonical },
  }
}

export default async function PageChecklistEV({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)

  const tHub = await getTranslations({ locale, namespace: 'ChecklistEV' })

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'HowTo',
        name: tHub('meta_title', { annee: ANNEE }),
        description: tHub('meta_desc'),
        inLanguage: locale,
        step: TIPS.map((tip) => ({
          '@type': 'HowToStep',
          position: tip.num,
          name: tHub(`tip_${tip.num}_title` as 'tip_1_title'),
          text: tHub(`tip_${tip.num}_what` as 'tip_1_what'),
        })),
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Moteurs.com',           item: 'https://moteurs.com/' },
          { '@type': 'ListItem', position: 2, name: tHub('crumb_hub'),       item: 'https://moteurs.com/vacances-voiture' },
          { '@type': 'ListItem', position: 3, name: tHub('crumb_current') },
        ],
      },
      {
        '@type': 'FAQPage',
        mainEntity: [1, 2, 3, 4, 5].map((i) => ({
          '@type': 'Question',
          name: tHub(`faq_q${i}` as 'faq_q1'),
          acceptedAnswer: {
            '@type': 'Answer',
            text: tHub(`faq_a${i}` as 'faq_a1'),
          },
        })),
      },
    ],
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ChecklistContent />
    </>
  )
}

function ChecklistContent() {
  const t = useTranslations('ChecklistEV')

  return (
    <main className="container checklist-ev-page" style={{ paddingTop: 36, paddingBottom: 64 }}>
      {/* Styles imprimés — version 1 page A4, layout 2 colonnes */}
      <style>{`
        .checklist-ev-print-only { display: none; }
        @media print {
          /* Cacher tout sauf les conseils et le print-only */
          .checklist-ev-page .no-print { display: none !important; }
          .checklist-ev-page .checklist-ev-print-only { display: block !important; }
          /* Réinit page */
          .checklist-ev-page {
            color: #111 !important;
            padding: 0 !important;
            max-width: none !important;
            font-size: 9pt !important;
          }
          .checklist-ev-page h1,
          .checklist-ev-page h2,
          .checklist-ev-page h3 { color: #111 !important; }
          .checklist-ev-page a { color: #111 !important; text-decoration: none; }
          body { background: #fff !important; }

          /* === Layout 2 colonnes pour les 10 conseils === */
          .checklist-ev-tips-grid {
            display: block !important;
            column-count: 2 !important;
            column-gap: 6mm !important;
            column-fill: balance !important;
          }

          /* Cards conseils — ultra compactes */
          .checklist-ev-page .checklist-ev-tip {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            border: none !important;
            border-left: 2.5pt solid #888 !important;
            background: #fff !important;
            color: #111 !important;
            margin: 0 0 4pt 0 !important;
            padding: 3pt 0 3pt 6pt !important;
            box-shadow: none !important;
            border-radius: 0 !important;
            display: block !important;
          }
          .checklist-ev-page .checklist-ev-tip > div:first-child {
            display: inline !important;
            text-align: left !important;
            min-width: 0 !important;
            margin-right: 4pt;
          }
          .checklist-ev-page .checklist-ev-tip > div:first-child > div:first-child {
            display: none !important; /* emoji caché pour gagner de la place */
          }
          .checklist-ev-page .checklist-ev-tip > div:first-child > div:last-child {
            display: inline !important;
            font-size: 11pt !important;
            font-weight: 800 !important;
            color: #111 !important;
            margin: 0 !important;
          }
          .checklist-ev-page .checklist-ev-tip > div:last-child {
            display: inline !important;
          }

          /* Sous-éléments individuels */
          .checklist-ev-page .tip-category { display: none !important; }
          .checklist-ev-page .tip-nuance   { display: none !important; }
          .checklist-ev-page .tip-why      { display: none !important; }
          .checklist-ev-page .tip-title {
            font-size: 9.5pt !important;
            font-weight: 700 !important;
            margin: 0 0 1pt 0 !important;
            display: inline !important;
          }
          .checklist-ev-page .tip-impact {
            font-size: 8.5pt !important;
            font-weight: 600 !important;
            margin: 1pt 0 1pt 0 !important;
            display: block !important;
            color: #111 !important;
          }
          .checklist-ev-page .tip-what {
            font-size: 8.5pt !important;
            line-height: 1.35 !important;
            margin: 0 !important;
            color: #222 !important;
            display: block !important;
          }
          .checklist-ev-page .tip-what strong { font-weight: 700; }

          /* Titre print et footer print */
          .checklist-ev-print-title {
            font-size: 12pt !important;
            font-weight: 700 !important;
            margin: 0 0 1pt 0 !important;
            color: #111 !important;
            text-align: center;
          }
          .checklist-ev-print-subtitle {
            font-size: 8pt !important;
            color: #555 !important;
            margin: 0 0 6pt 0 !important;
            padding-bottom: 4pt !important;
            border-bottom: 0.5pt solid #999 !important;
            text-align: center;
          }
          .checklist-ev-print-footer {
            margin-top: 4pt !important;
            padding-top: 3pt !important;
            border-top: 0.5pt solid #999 !important;
            font-size: 7pt !important;
            color: #777 !important;
            text-align: center !important;
          }
          /* H2 'Les 10 conseils' masqué */
          .checklist-ev-tips-h2 { display: none !important; }

          /* Marges A4 réduites */
          @page { margin: 8mm 10mm; size: A4 portrait; }
        }
        .checklist-ev-tip {
          transition: transform 0.15s ease, box-shadow 0.15s ease;
        }
        .checklist-ev-tip:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 18px rgba(0,0,0,0.08);
        }
      `}</style>

      {/* Header imprimé minimal — affiché uniquement à l'impression */}
      <div className="checklist-ev-print-only">
        <h1 className="checklist-ev-print-title">{t('print_doc_title')}</h1>
        <p className="checklist-ev-print-subtitle">{t('print_doc_subtitle')}</p>
      </div>

      {/* Breadcrumb */}
      <nav className="no-print" style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', marginBottom: 22 }}>
        <Link href="/" style={lienMuted}>Moteurs.com</Link>
        {' / '}
        <Link href="/vacances-voiture" style={lienMuted}>{t('crumb_hub')}</Link>
        {' / '}
        <span>{t('crumb_current')}</span>
      </nav>

      {/* Hero */}
      <header className="no-print" style={{ marginBottom: 24 }}>
        <div style={{ fontSize: '0.82rem', color: 'var(--color-primary)', fontWeight: 600, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {t('hero_eyebrow', { annee: ANNEE })}
        </div>
        <h1 style={{ fontSize: 'clamp(1.7rem, 4vw, 2.4rem)', marginBottom: 14, lineHeight: 1.2 }}>
          {t('hero_h1')}
        </h1>
        <p style={{ fontSize: '1rem', lineHeight: 1.65, maxWidth: 760, color: 'var(--color-text)' }}>
          {t('hero_lead')}
        </p>

        {/* Print button */}
        <div className="no-print" style={{ marginTop: 18 }}>
          <PrintButton />
          <span style={{ marginLeft: 12, fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
            {t('print_hint')}
          </span>
        </div>
      </header>

      {/* Stats clés */}
      <section className="no-print" style={{ marginBottom: 36 }}>
        <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))' }}>
          <Stat valeur={t('stat_1_value')} label={t('stat_1_label')} />
          <Stat valeur={t('stat_2_value')} label={t('stat_2_label')} />
          <Stat valeur={t('stat_3_value')} label={t('stat_3_label')} />
          <Stat valeur={t('stat_4_value')} label={t('stat_4_label')} />
        </div>
      </section>

      {/* Intro éditoriale */}
      <section className="no-print" style={{ marginBottom: 32 }}>
        <p style={{ fontSize: '0.95rem', lineHeight: 1.65, color: 'var(--color-text)', maxWidth: 760 }}>
          {t('intro_para')}
        </p>
      </section>

      {/* 10 conseils */}
      <section className="checklist-ev-tips-section" style={{ marginBottom: 40 }}>
        <h2 className="checklist-ev-tips-h2" style={h2}>{t('tips_h2')}</h2>
        <div className="checklist-ev-tips-grid" style={{ display: 'grid', gap: 14 }}>
          {TIPS.map((tip) => (
            <article
              key={tip.num}
              className="checklist-ev-tip"
              style={{
                display: 'grid',
                gridTemplateColumns: 'auto 1fr',
                gap: 16,
                padding: 18,
                borderRadius: 12,
                background: 'var(--color-bg-card)',
                border: '1px solid var(--color-border)',
                borderLeft: `4px solid ${CAT_COLOR[tip.cat]}`,
              }}
            >
              {/* Numéro + emoji */}
              <div style={{ textAlign: 'center', minWidth: 56 }}>
                <div style={{ fontSize: '1.8rem' }} aria-hidden="true">{tip.emoji}</div>
                <div style={{
                  fontSize: '1.4rem', fontWeight: 800, lineHeight: 1,
                  color: CAT_COLOR[tip.cat], marginTop: 4,
                }}>
                  {tip.num.toString().padStart(2, '0')}
                </div>
              </div>

              {/* Contenu */}
              <div>
                <div className="tip-category" style={{
                  display: 'inline-block', padding: '3px 10px', borderRadius: 999,
                  background: `${CAT_COLOR[tip.cat]}22`, color: CAT_COLOR[tip.cat],
                  fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase',
                  letterSpacing: '0.04em', marginBottom: 8,
                }}>
                  {t(tip.cat as 'cat_road')}
                </div>
                <h3 className="tip-title" style={{ fontSize: '1.1rem', margin: 0, marginBottom: 8 }}>
                  {t(`tip_${tip.num}_title` as 'tip_1_title')}
                </h3>
                <div className="tip-impact" style={{
                  fontSize: '0.85rem', fontWeight: 600,
                  color: CAT_COLOR[tip.cat], marginBottom: 8,
                }}>
                  💡 {t(`tip_${tip.num}_impact` as 'tip_1_impact')}
                </div>
                <p className="tip-what" style={{ fontSize: '0.92rem', lineHeight: 1.6, margin: 0, marginBottom: 8 }}>
                  <strong>{t('label_what')} :</strong> {t(`tip_${tip.num}_what` as 'tip_1_what')}
                </p>
                <p className="tip-nuance" style={{ fontSize: '0.88rem', lineHeight: 1.6, margin: 0, marginBottom: 8, color: 'var(--color-text-muted)' }}>
                  <strong>{t('label_nuance')} :</strong> {t(`tip_${tip.num}_nuance` as 'tip_1_nuance')}
                </p>
                <p className="tip-why" style={{ fontSize: '0.85rem', lineHeight: 1.55, margin: 0, color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
                  {t('label_why')} : {t(`tip_${tip.num}_why` as 'tip_1_why')}
                </p>
              </div>
            </article>
          ))}
        </div>
        {/* Footer print minimal */}
        <div className="checklist-ev-print-only checklist-ev-print-footer">
          moteurs.com/vacances-voiture/checklist-ev
        </div>
      </section>

      {/* FAQ */}
      <section className="no-print" style={{ marginBottom: 36 }}>
        <h2 style={h2}>{t('faq_h2')}</h2>
        <div style={{ display: 'grid', gap: 10 }}>
          {[1, 2, 3, 4, 5].map((i) => (
            <details
              key={i}
              style={{
                padding: 14, borderRadius: 10,
                background: 'var(--color-bg-card)', border: '1px solid var(--color-border)',
              }}
            >
              <summary style={{ cursor: 'pointer', fontWeight: 600, fontSize: '0.95rem' }}>
                {t(`faq_q${i}` as 'faq_q1')}
              </summary>
              <p style={{ marginTop: 10, fontSize: '0.9rem', lineHeight: 1.6, color: 'var(--color-text)' }}>
                {t(`faq_a${i}` as 'faq_a1')}
              </p>
            </details>
          ))}
        </div>
      </section>

      {/* Disclaimer + retour hub */}
      <section className="no-print" style={{ marginTop: 40, paddingTop: 24, borderTop: '1px solid var(--color-border)' }}>
        <p style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', lineHeight: 1.55, marginBottom: 18 }}>
          {t('disclaimer')}
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
          <Link href="/vacances-voiture" style={btnSecondaire}>← {t('back_to_hub')}</Link>
          <Link href="/comparer-trajet" style={btnSecondaire}>{t('cta_compare')} →</Link>
          <Link href="/recharge-electrique" style={btnSecondaire}>{t('cta_recharge')} →</Link>
        </div>
      </section>
    </main>
  )
}

function Stat({ valeur, label }: { valeur: string; label: string }) {
  return (
    <div style={{
      background: 'var(--color-bg-card)', border: '1px solid var(--color-border)',
      borderRadius: 12, padding: 14, textAlign: 'center',
    }}>
      <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--color-primary)' }}>{valeur}</div>
      <div style={{ fontSize: '0.74rem', color: 'var(--color-text-muted)', marginTop: 4, lineHeight: 1.4 }}>{label}</div>
    </div>
  )
}

const lienMuted: React.CSSProperties = { color: 'var(--color-text-muted)', textDecoration: 'none' }
const h2: React.CSSProperties = { fontSize: '1.3rem', marginBottom: 14, marginTop: 0 }
const btnSecondaire: React.CSSProperties = {
  padding: '8px 14px', borderRadius: 10, fontSize: '0.88rem',
  background: 'transparent', border: '1px solid var(--color-border)',
  color: 'var(--color-text)', textDecoration: 'none',
}
