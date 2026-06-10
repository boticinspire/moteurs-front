import type { Metadata, Viewport } from 'next'
import type { ReactNode } from 'react'
import { Inter } from 'next/font/google'
import { notFound } from 'next/navigation'
import { NextIntlClientProvider, hasLocale } from 'next-intl'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import '../globals.css'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import CookieBanner from '@/components/CookieBanner'
import TranslationBannerGate from '@/components/TranslationBannerGate'
import { routing, type Locale } from '@/i18n/routing'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'Meta' })

  const alternates: Record<string, string> = {}
  for (const l of routing.locales) {
    alternates[l] = l === routing.defaultLocale ? '/' : `/${l}`
  }

  return {
    title: {
      default: t('title_default'),
      template: t('title_template'),
    },
    description: t('description'),
    metadataBase: new URL('https://moteurs.com'),
    alternates: {
      canonical: locale === routing.defaultLocale ? '/' : `/${locale}`,
      languages: alternates,
    },
  }
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)',  color: '#0a0e1a' },
  ],
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  if (!hasLocale(routing.locales, locale)) {
    notFound()
  }
  setRequestLocale(locale)

  const t = await getTranslations({ locale, namespace: 'Meta' })

  const orgJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Moteurs.com',
    url: 'https://moteurs.com',
    logo: 'https://moteurs.com/logo.png',
    description: t('org_description'),
    knowsAbout: [
      'Transition energetique des transports routiers',
      'Cout Total de Possession (TCO) automobile',
      'Vehicules electriques et hybrides',
      'Zones a Faibles Emissions (ZFE)',
      'Aides a l achat de vehicules propres 2026',
      'Bonus ecologique France',
      'Deductibilite fiscale vehicules electriques Belgique',
      'Subventions cantonales vehicules electriques Suisse',
      'Programme iZEV Canada',
      'Recharge electrique infrastructure',
      'Calculateur cout trajet motorisation',
    ],
    areaServed: [
      { '@type': 'Country', name: 'France' },
      { '@type': 'Country', name: 'Belgique' },
      { '@type': 'Country', name: 'Suisse' },
      { '@type': 'Country', name: 'Canada' },
    ],
    // sameAs: ['https://...'], // à compléter quand les profils officiels seront créés
  }

  const websiteJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Moteurs.com',
    url: 'https://moteurs.com',
    inLanguage: locale,
  }

  return (
    <html lang={locale as Locale} className={inter.variable}>
      <head>
        {/* Google Tag Manager */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','GTM-W3FM9HVP');`,
          }}
        />
        {/* Anti-FOUC : applique data-theme sur <html> avant le rendu */}
        <script dangerouslySetInnerHTML={{ __html: `try{var t=localStorage.getItem('moteurs-theme');if(t==='dark'||t==='light')document.documentElement.dataset.theme=t;}catch(e){}` }} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
        />
      </head>
      <body>
        {/* Google Tag Manager (noscript) */}
        <noscript>
          <iframe
            src="https://www.googletagmanager.com/ns.html?id=GTM-W3FM9HVP"
            height="0"
            width="0"
            style={{ display: 'none', visibility: 'hidden' }}
          />
        </noscript>
        <NextIntlClientProvider>
          <Header />
          <TranslationBannerGate />
          {children}
          <Footer />
          <CookieBanner />
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
