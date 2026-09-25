import type { Metadata } from 'next'
import Image from 'next/image'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { routing } from '@/i18n/routing'
import VitrineHeader from '@/components/vitrine/VitrineHeader'
import VitrineFooter from '@/components/vitrine/VitrineFooter'
import DevisForm from '@/components/vitrine/DevisForm'
import s from '@/components/vitrine/vitrine.module.css'

/**
 * Page d'accueil Moteurs.com — vitrine produits.
 *
 * Depuis septembre 2026, la racine du site est consacrée exclusivement à la
 * présentation et à la vente des produits développés (gabarits de contrôle
 * pour sièges et guides de soupape — brevet BE 2025/5347).
 *
 * L'ancien média (outils TCO, décryptages, espace membres…) est intégralement
 * conservé et accessible sous /media (voir app/[locale]/media/page.tsx).
 * Le header/footer du média sont masqués ici par <MediaChrome> (layout).
 */

export const revalidate = 86400

const FLYERS: Record<string, { file: string; label: string }> = {
  fr: { file: '/vitrine/flyer-FR.png', label: 'Flyer FR (PNG)' },
  en: { file: '/vitrine/flyer-EN.png', label: 'Flyer EN (PNG)' },
  nl: { file: '/vitrine/flyer-NL.pdf', label: 'Flyer NL (PDF)' },
  de: { file: '/vitrine/flyer-DE.pdf', label: 'Flyer DE (PDF)' },
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'Vitrine' })
  const alternates: Record<string, string> = {}
  for (const l of routing.locales) alternates[l] = l === routing.defaultLocale ? '/' : `/${l}`
  return {
    title: { absolute: t('meta_title') },
    description: t('meta_description'),
    alternates: {
      canonical: locale === routing.defaultLocale ? '/' : `/${locale}`,
      languages: alternates,
    },
    openGraph: {
      title: t('meta_title'),
      description: t('meta_description'),
      images: [{ url: '/vitrine/hero-atelier.webp', width: 1400, height: 788 }],
      type: 'website',
    },
  }
}

export default async function VitrineHomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations({ locale, namespace: 'Vitrine' })

  const productJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: t('product_name'),
    description: t('meta_description'),
    brand: { '@type': 'Brand', name: 'Moteurs.com' },
    image: 'https://moteurs.com/vitrine/planche-reelle.webp',
    url: 'https://moteurs.com/',
    offers: {
      '@type': 'Offer',
      availability: 'https://schema.org/PreOrder',
      priceCurrency: 'EUR',
      url: 'https://moteurs.com/#devis',
    },
  }

  const steps = [1, 2, 3] as const
  const faqs = [1, 2, 3, 4, 5] as const

  return (
    <div className={s.page}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }} />
      <VitrineHeader />

      <main>
        {/* ── HERO ─────────────────────────────────────────────────────── */}
        <section className={s.hero} id="top">
          <div className={s.heroInner}>
            <div className={s.heroText}>
              <p className={s.eyebrow}>{t('patent_line')}</p>
              <h1 className={s.h1}>{t('hero_title')}</h1>
              <p className={s.lead}>{t('hero_lead')}</p>
              <p className={s.heroFor}><strong>{t('hero_for_label')}</strong> {t('hero_for')}</p>
              <div className={s.heroCtas}>
                <a href="#devis" className={s.btnPrimary}>{t('cta_quote')}</a>
                <a href="#principe" className={s.btnGhost}>{t('cta_how')}</a>
              </div>
              <ul className={s.heroBadges}>
                <li>{t('badge_seconds')}</li>
                <li>{t('badge_no_caliper')}</li>
                <li>{t('badge_made_in')}</li>
              </ul>
            </div>
            <div className={s.heroMedia}>
              <Image
                src="/vitrine/hero-atelier.webp"
                alt={t('hero_img_alt')}
                width={1400}
                height={788}
                priority
                sizes="(max-width: 900px) 100vw, 55vw"
                className={s.heroImg}
              />
            </div>
          </div>
        </section>

        {/* ── PRODUIT ──────────────────────────────────────────────────── */}
        <section className={s.section} id="produit">
          <div className={s.container}>
            <div className={s.split}>
              <div>
                <p className={s.kicker}>{t('product_kicker')}</p>
                <h2 className={s.h2}>{t('product_title')}</h2>
                <p className={s.p}>{t('product_p1')}</p>
                <p className={s.p}>{t('product_p2')}</p>
                <ul className={s.checks}>
                  <li>{t('product_check1')}</li>
                  <li>{t('product_check2')}</li>
                  <li>{t('product_check3')}</li>
                  <li>{t('product_check4')}</li>
                </ul>
              </div>
              <figure className={s.figure}>
                <Image src="/vitrine/planche-reelle.webp" alt={t('img_board_alt')} width={794} height={1024} sizes="(max-width: 900px) 100vw, 45vw" className={s.figImg} />
                <figcaption>{t('img_board_caption')}</figcaption>
              </figure>
            </div>
          </div>
        </section>

        {/* ── PRINCIPE ─────────────────────────────────────────────────── */}
        <section className={`${s.section} ${s.sectionAlt}`} id="principe">
          <div className={s.container}>
            <p className={s.kicker}>{t('how_kicker')}</p>
            <h2 className={s.h2}>{t('how_title')}</h2>
            <div className={s.stepsGrid}>
              <ol className={s.steps}>
                {steps.map(n => (
                  <li key={n}>
                    <span className={s.stepNum}>{n}</span>
                    <div>
                      <strong>{t(`step${n}_title`)}</strong>
                      <p>{t(`step${n}_text`)}</p>
                    </div>
                  </li>
                ))}
              </ol>
              <div className={s.detailCol}>
                <figure className={s.figure}>
                  <Image src="/vitrine/contact-siege.webp" alt={t('img_seat_alt')} width={900} height={766} sizes="(max-width: 900px) 100vw, 40vw" className={s.figImg} />
                  <figcaption><strong>{t('img_seat_label')}</strong> — {t('img_seat_caption')}</figcaption>
                </figure>
              </div>
            </div>
          </div>
        </section>

        {/* ── TAILLES ──────────────────────────────────────────────────── */}
        <section className={s.section} id="tailles">
          <div className={s.container}>
            <p className={s.kicker}>{t('sizes_kicker')}</p>
            <h2 className={s.h2}>{t('sizes_title')}</h2>
            <div className={s.specGrid}>
              <div className={s.spec}>
                <div className={s.specVal}>28–49 mm</div>
                <div className={s.specLbl}>{t('spec_head')}</div>
                <div className={s.specSub}>{t('spec_std')}</div>
              </div>
              <div className={s.spec}>
                <div className={s.specVal}>8–11 mm</div>
                <div className={s.specLbl}>{t('spec_stem')}</div>
                <div className={s.specSub}>{t('spec_std')}</div>
              </div>
              <div className={s.spec}>
                <div className={s.specVal}>30° · 45° · 60°</div>
                <div className={s.specLbl}>{t('spec_angle')}</div>
                <div className={s.specSub}>{t('spec_on_request')}</div>
              </div>
            </div>
            <div className={s.split}>
              <figure className={s.figure}>
                <Image src="/vitrine/gabarit-brevet.webp" alt={t('img_cad_alt')} width={900} height={970} sizes="(max-width: 900px) 100vw, 40vw" className={s.figImg} />
                <figcaption>{t('img_cad_caption')}</figcaption>
              </figure>
              <div>
                <h3 className={s.h3}>{t('sizes_h3')}</h3>
                <p className={s.p}>{t('sizes_p1')}</p>
                <p className={s.p}>{t('sizes_p2')}</p>
                <p className={s.note}>{t('sizes_note')}</p>
                <a href="#devis" className={s.btnPrimary}>{t('cta_quote')}</a>
              </div>
            </div>
          </div>
        </section>

        {/* ── OFFRES ───────────────────────────────────────────────────── */}
        <section className={`${s.section} ${s.sectionAlt}`} id="offres">
          <div className={s.container}>
            <p className={s.kicker}>{t('offers_kicker')}</p>
            <h2 className={s.h2}>{t('offers_title')}</h2>
            <div className={s.offers}>
              <article className={s.offer}>
                <h3>{t('offer1_title')}</h3>
                <p>{t('offer1_text')}</p>
                <a href="#devis" className={s.btnGhost}>{t('offer_cta')}</a>
              </article>
              <article className={`${s.offer} ${s.offerFeatured}`}>
                <span className={s.offerTag}>{t('offer2_tag')}</span>
                <h3>{t('offer2_title')}</h3>
                <p>{t('offer2_text')}</p>
                <a href="#devis" className={s.btnPrimary}>{t('offer_cta')}</a>
              </article>
              <article className={s.offer}>
                <h3>{t('offer3_title')}</h3>
                <p>{t('offer3_text')}</p>
                <a href="#devis" className={s.btnGhost}>{t('offer_cta')}</a>
              </article>
            </div>
            <figure className={`${s.figure} ${s.figureWide}`}>
              <Image src="/vitrine/kit-atelier.webp" alt={t('img_kit_alt')} width={912} height={1176} sizes="(max-width: 900px) 100vw, 60vw" className={s.figImg} />
              <figcaption>{t('img_kit_caption')}</figcaption>
            </figure>
          </div>
        </section>

        {/* ── DEVIS ────────────────────────────────────────────────────── */}
        <section className={s.section} id="devis">
          <div className={s.container}>
            <div className={s.formHead}>
              <p className={s.kicker}>{t('quote_kicker')}</p>
              <h2 className={s.h2}>{t('quote_title')}</h2>
              <p className={s.p}>{t('quote_text')}</p>
            </div>
            <DevisForm />
            <p className={s.flyers}>
              {t('flyers_label')}{' '}
              {Object.entries(FLYERS).map(([k, f], i) => (
                <span key={k}>{i > 0 && ' · '}<a href={f.file} download>{f.label}</a></span>
              ))}
            </p>
          </div>
        </section>

        {/* ── FAQ ──────────────────────────────────────────────────────── */}
        <section className={`${s.section} ${s.sectionAlt}`} id="faq">
          <div className={s.container}>
            <p className={s.kicker}>FAQ</p>
            <h2 className={s.h2}>{t('faq_title')}</h2>
            <div className={s.faq}>
              {faqs.map(n => (
                <details key={n}>
                  <summary>{t(`faq${n}_q`)}</summary>
                  <p>{t(`faq${n}_a`)}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* ── MÉDIA ────────────────────────────────────────────────────── */}
        <section className={s.mediaBand}>
          <div className={s.container}>
            <div className={s.mediaBandInner}>
              <div>
                <p className={s.kicker}>{t('media_kicker')}</p>
                <h2 className={s.h2}>{t('media_title')}</h2>
                <p className={s.p}>{t('media_text')}</p>
              </div>
              <a href={locale === routing.defaultLocale ? '/media' : `/${locale}/media`} className={s.btnLight}>{t('media_cta')} →</a>
            </div>
          </div>
        </section>
      </main>

      <VitrineFooter />
    </div>
  )
}
