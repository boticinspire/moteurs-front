/**
 * app/[locale]/outils/amende-pv/page.tsx
 * Calculateur d'amendes / PV routiers — FR, BE, CH, CA-QC + pays EU
 * SSG multilingue avec FAQ SEO et JSON-LD
 */

import type { Metadata } from 'next'
import { setRequestLocale } from 'next-intl/server'
import { routing } from '@/i18n/routing'
import { buildAlternates } from '@/lib/seo-utils'
import CalculateurPV from '@/components/CalculateurPV'
import FaqAccordion from '@/components/FaqAccordion'

const ANNEE = new Date().getFullYear()
const ROUTE = '/outils/amende-pv'

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  return {
    title: `Calculateur PV & Amendes routières ${ANNEE} — France, Belgique, Suisse, Europe | Moteurs.com`,
    description:
      `Calculez le montant exact de votre amende (PV) : excès de vitesse, stationnement, téléphone, alcool, ZFE… ` +
      `Barèmes officiels ${ANNEE} pour la France, la Belgique, la Suisse, le Québec et 6 pays européens. Points retirés, risque de suspension inclus.`,
    openGraph: {
      title: `Combien va coûter mon PV ? Calculateur d'amendes ${ANNEE}`,
      description:
        'Entrez votre infraction et votre pays — obtenez l\'amende exacte (minorée/forfaitaire/majorée), les points retirés et les risques de suspension.',
      type: 'article',
    },
    alternates: buildAlternates(locale, ROUTE),
    keywords: [
      'amende voiture', 'PV', 'excès de vitesse amende', 'calculateur amende',
      'amende stationnement', 'alcool au volant amende', 'ZFE amende Crit\'Air',
      'points permis retirés', 'amende belgique', 'amende suisse', 'amende europe',
    ],
  }
}

const FAQ = [
  {
    question: `Combien coûte un excès de vitesse de 20 km/h en France en ${ANNEE} ?`,
    answer:
      `Un dépassement de vitesse de 20 à 29 km/h en France entraîne une amende forfaitaire de 135 € (minorée à 90 € si paiement sous 15 jours, majorée à 375 € après 45 jours) et 2 points retirés sur le permis. Le montant ne dépend pas du type de voie (agglomération, route ou autoroute) — seul le dépassement compte.`,
  },
  {
    question: 'Combien coûte le téléphone au volant ?',
    answer:
      `En France : 135 € d'amende (90 € si paiement rapide) et 3 points retirés. En Belgique : 174 € et 2 points. En Suisse : 100 CHF, pas de points mais possible avertissement. En Allemagne : 100 € et 1 point Flensburg. Aux Pays-Bas, l'amende atteint 420 €. Au Royaume-Uni : 200 £ et 6 points — suffisant pour annuler le permis en probatoire.`,
  },
  {
    question: 'Quand une amende peut-elle passer en tribunal ?',
    answer:
      `En France, les contraventions de 5ème classe (excès de vitesse ≥ 50 km/h, alcool ≥ 0,8 g/L, conduite sous stupéfiants) entraînent une comparution possible devant le tribunal. En Belgique, un dépassement ≥ 41 km/h en agglomération passe directement au correctionnel. En Suisse, la "Raserei" (excès ≥ 25 km/h en agglo, ≥ 30 hors agglo, ≥ 35 sur autoroute) est une infraction pénale.`,
  },
  {
    question: 'Comment fonctionne l\'amende ZFE en France ?',
    answer:
      `L'absence de vignette Crit'Air sur un véhicule léger en ZFE est punie d'une amende de 135 € (majorée à 375 €). La vignette coûte 3,62 € sur certificat-air.gouv.fr. Les restrictions varient selon les villes : Paris exige Crit'Air 2 minimum, Lyon Crit'Air 3 minimum. Les poids lourds sans vignette écoppent de 450 €.`,
  },
  {
    question: 'Peut-on contester un PV reçu en France ?',
    answer:
      `Oui. Pour une contravention des 4 premières classes, vous disposez de 45 jours pour la contester en retournant le formulaire de requête en exonération joint à l'avis. Pour les contraventions de 5ème classe ou les délits, la contestation suit la procédure pénale. Le paiement de l'amende minorée (15 jours) implique la reconnaissance de l'infraction et met fin à toute contestation.`,
  },
  {
    question: 'Quelle est la différence entre amende minorée, forfaitaire et majorée ?',
    answer:
      `En France (et dans certains autres pays), l'amende existe en trois versions : • Minorée : si vous payez dans les 15 jours — c'est le tarif réduit. • Forfaitaire : le montant de référence si vous payez entre 15 et 45 jours. • Majorée : si vous ne payez pas sous 45 jours, l'amende gonfle (parfois ×2 à ×10) et passe en recouvrement forcé.`,
  },
  {
    question: 'Comment récupérer des points après un PV en France ?',
    answer:
      `Deux mécanismes : (1) récupération automatique — si vous n'avez pas commis d'infraction entraînant un retrait de points pendant 6 mois, vos points restants augmentent ; le plein de 12 points est atteint au bout de 2 ans sans infraction. (2) stage de sensibilisation à la sécurité routière : vous récupérez jusqu'à 4 points, une fois par an, pour environ 200 €.`,
  },
  {
    question: 'Les amendes reçues à l\'étranger sont-elles recouvrées en France ?',
    answer:
      `Oui, entre pays UE. La directive 2015/413/UE permet aux pays membres d'accéder aux fichiers d'immatriculation des autres États. Les amendes étrangères non payées peuvent faire l'objet d'une procédure de recouvrement transfrontalier. Suisse et Canada disposent aussi d'accords bilatéraux, mais les délais sont plus longs.`,
  },
]

export default async function PageAmendePV({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebApplication',
        '@id': `https://moteurs.com${ROUTE}`,
        url: `https://moteurs.com${ROUTE}`,
        name: `Calculateur PV & Amendes routières ${ANNEE}`,
        description: `Barèmes officiels des amendes routières pour la France, la Belgique, la Suisse, le Québec et 6 pays européens. Calcul instantané : montant, points retirés, risque de suspension.`,
        inLanguage: locale,
        applicationCategory: 'UtilitiesApplication',
        offers: { '@type': 'Offer', price: '0', priceCurrency: 'EUR' },
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Accueil',    item: 'https://moteurs.com/' },
          { '@type': 'ListItem', position: 2, name: 'Outils',      item: 'https://moteurs.com/outils' },
          { '@type': 'ListItem', position: 3, name: 'Calculateur PV', item: `https://moteurs.com${ROUTE}` },
        ],
      },
      {
        '@type': 'FAQPage',
        mainEntity: FAQ.map(f => ({
          '@type': 'Question',
          name: f.question,
          acceptedAnswer: { '@type': 'Answer', text: f.answer },
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

      <main style={{ paddingTop: 40, paddingBottom: 72 }}>
        <div className="container" style={{ maxWidth: 800 }}>

          {/* ── Hero ── */}
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <div style={{
              display: 'inline-block',
              fontSize: '0.78rem', fontWeight: 700, letterSpacing: '0.06em',
              textTransform: 'uppercase', color: 'var(--color-primary)',
              background: 'color-mix(in srgb, var(--color-primary) 10%, transparent)',
              padding: '4px 14px', borderRadius: 20, marginBottom: 14,
            }}>
              10 pays · Barèmes {ANNEE} · Gratuit
            </div>
            <h1 style={{ fontSize: 'clamp(1.7rem, 4vw, 2.5rem)', lineHeight: 1.2, marginBottom: 14 }}>
              Combien va coûter<br />
              <span style={{ color: 'var(--color-primary)' }}>mon PV ?</span>
            </h1>
            <p style={{
              maxWidth: 560, margin: '0 auto',
              color: 'var(--color-text-muted)', fontSize: '1rem', lineHeight: 1.65,
            }}>
              Calculez instantanément le montant de votre amende — excès de vitesse, stationnement,
              téléphone, alcool, ZFE ou stupéfiants — avec les barèmes officiels de 10 pays.
              Points retirés et risques de suspension inclus.
            </p>

            {/* Chips pays */}
            <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: 8, marginTop: 18 }}>
              {['🇫🇷 France', '🇧🇪 Belgique', '🇨🇭 Suisse', '🇨🇦 Québec', '🇩🇪 Allemagne', '🇪🇸 Espagne', '🇮🇹 Italie', '🇳🇱 Pays-Bas', '🇬🇧 Royaume-Uni', '🇦🇹 Autriche'].map(p => (
                <span key={p} style={{
                  padding: '4px 10px', borderRadius: 20,
                  background: 'var(--color-bg-card)', border: '1px solid var(--color-border)',
                  fontSize: '0.8rem', fontWeight: 500,
                }}>{p}</span>
              ))}
            </div>
          </div>

          {/* ── Calculateur ── */}
          <CalculateurPV defaultPays="FR" defaultTab="vitesse" />

          {/* ── Infos pratiques ── */}
          <section style={{ marginTop: 56 }}>
            <h2 style={{ fontSize: '1.4rem', marginBottom: 20 }}>
              Comment contester ou réduire votre amende
            </h2>
            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: 14,
            }}>
              {[
                {
                  titre: '⏱️ Payer vite (France)',
                  corps: 'En France, payer sous 15 jours active le tarif minoré (33 % de réduction). Passé 45 jours, l\'amende est majorée jusqu\'à ×10 et passe en recouvrement forcé.',
                },
                {
                  titre: '📝 Contester par formulaire',
                  corps: 'En France, joignez le formulaire de requête en exonération à l\'avis dans les 45 jours. En Espagne, vous avez 20 jours pour obtenir la réduction de 50 % ou contester.',
                },
                {
                  titre: '🎓 Stage de sensibilisation',
                  corps: 'En France, un stage volontaire (~200 €) permet de récupérer jusqu\'à 4 points, une fois par an. À faire avant la perte totale pour éviter l\'annulation du permis.',
                },
                {
                  titre: '⚖️ Infraction grave : avocat',
                  corps: 'Tribunal correctionnel, alcool ≥ 0,8 g/L, stupéfiants : faites-vous assister par un avocat spécialisé. Les vices de procédure (éthylomètre mal étalonné, etc.) peuvent invalider la preuve.',
                },
              ].map((c, i) => (
                <div key={i} style={{
                  background: 'var(--color-bg-card)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 12, padding: '16px 18px',
                }}>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: 8 }}>{c.titre}</div>
                  <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', lineHeight: 1.6, margin: 0 }}>{c.corps}</p>
                </div>
              ))}
            </div>
          </section>

          {/* ── Tableau comparatif vitesse ── */}
          <section style={{ marginTop: 48 }}>
            <h2 style={{ fontSize: '1.4rem', marginBottom: 8 }}>
              Comparatif des amendes vitesse par pays
            </h2>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.88rem', marginBottom: 18 }}>
              Pour un dépassement de 15 km/h en agglomération — barèmes {ANNEE}.
            </p>
            <div style={{ overflowX: 'auto' }}>
              <table style={{
                width: '100%', borderCollapse: 'collapse', fontSize: '0.87rem',
                background: 'var(--color-bg-card)', borderRadius: 12, overflow: 'hidden',
              }}>
                <thead>
                  <tr style={{ background: 'var(--color-primary)', color: '#fff' }}>
                    <th style={{ padding: '10px 14px', textAlign: 'left' }}>Pays</th>
                    <th style={{ padding: '10px 14px', textAlign: 'right' }}>Amende</th>
                    <th style={{ padding: '10px 14px', textAlign: 'center' }}>Points perdus</th>
                    <th style={{ padding: '10px 14px', textAlign: 'left' }}>Note</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { pays: '🇫🇷 France',         amende: '90–135 €',  points: '1 pt',    note: 'Minoré si paiement < 15j' },
                    { pays: '🇧🇪 Belgique',        amende: '116 €',     points: '0 pt',    note: 'Perception immédiate' },
                    { pays: '🇨🇭 Suisse',          amende: '250 CHF',   points: '—',       note: 'OPO — Ordonnance pénale' },
                    { pays: '🇨🇦 Québec',          amende: '90–280 $',  points: '0-1 pt',  note: 'Frais SAAQ inclus' },
                    { pays: '🇩🇪 Allemagne',       amende: '40 €',      points: '1 pt',    note: 'Flensburg' },
                    { pays: '🇪🇸 Espagne',         amende: '50–100 €',  points: '0 pt',    note: '-50 % si paiement < 20j' },
                    { pays: '🇮🇹 Italie',          amende: '43–173 €',  points: '0 pt',    note: '-30 % si paiement < 5j' },
                    { pays: '🇳🇱 Pays-Bas',        amende: '180 €',     points: '—',       note: 'Pas de permis à points' },
                    { pays: '🇬🇧 Royaume-Uni',     amende: '100 £',     points: '3 pts',   note: '-50 % accepté < 28j' },
                    { pays: '🇦🇹 Autriche',        amende: '50–300 €',  points: '—',       note: 'Fourchette selon circonstances' },
                  ].map((row, i) => (
                    <tr key={i} style={{ borderTop: '1px solid var(--color-border)' }}>
                      <td style={{ padding: '10px 14px', fontWeight: 600 }}>{row.pays}</td>
                      <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 700, color: 'var(--color-primary)' }}>{row.amende}</td>
                      <td style={{ padding: '10px 14px', textAlign: 'center' }}>{row.points}</td>
                      <td style={{ padding: '10px 14px', color: 'var(--color-text-muted)', fontSize: '0.82rem' }}>{row.note}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* ── FAQ ── */}
          <section style={{ marginTop: 56 }}>
            <h2 style={{ fontSize: '1.4rem', marginBottom: 20 }}>Questions fréquentes</h2>
            <FaqAccordion items={FAQ} />
          </section>

          {/* ── Liens outils associés ── */}
          <section style={{
            marginTop: 48, padding: '20px 24px',
            background: 'var(--color-bg-card)', border: '1px solid var(--color-border)',
            borderRadius: 14,
          }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 14 }}>
              Outils associés sur Moteurs.com
            </h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
              {[
                { href: '/depannage',         label: '🔧 Hub Dépannage'          },
                { href: '/assistant-depannage', label: '📷 Scan voyant IA'       },
                { href: '/constat',            label: '📋 Constat amiable'        },
                { href: '/comparer-trajet',    label: '📊 Comparateur de trajet'  },
                { href: '/outils/cartes-recharge', label: '⚡ Cartes de recharge' },
              ].map(l => (
                <a key={l.href} href={l.href} style={{
                  padding: '8px 14px', borderRadius: 8,
                  background: 'var(--color-bg)', border: '1px solid var(--color-border)',
                  fontSize: '0.85rem', fontWeight: 500, textDecoration: 'none',
                  color: 'var(--color-text)',
                }}>{l.label}</a>
              ))}
            </div>
          </section>

        </div>
      </main>
    </>
  )
}
