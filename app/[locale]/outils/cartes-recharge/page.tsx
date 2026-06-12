import type { Metadata } from 'next'
import ComparateurCartes from './ComparateurCartes'
import TableauCartes from './TableauCartes'
import FaqAccordion from '@/components/FaqAccordion'
import { Link } from '@/i18n/navigation'
import { getCartes } from '@/lib/cartes-recharge'
import { SELECTIONS_PROFIL, SELECTIONS_RESEAU } from '@/lib/cartes-selections'
import { setRequestLocale } from 'next-intl/server'
import { routing } from '@/i18n/routing'

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }))
}

export const revalidate = 3600

export const metadata: Metadata = {
  title: 'Comparateur cartes de recharge VE 2026 — France, Belgique, Europe | Moteurs.com',
  description:
    'Comparez Chargemap, Freshmile, Electra, IONITY, Lidl, TotalEnergies et 8 autres cartes de recharge. Calculez votre coût mensuel réel selon votre profil : km, DC/AC, voyages EU.',
  openGraph: {
    title: 'Quelle carte de recharge vous coûte le moins cher ?',
    description: 'Calculateur gratuit : coût mensuel estimé selon votre usage + tableau comparatif 14 cartes FR & BE.',
  },
  alternates: { canonical: 'https://moteurs.com/outils/cartes-recharge' },
}

const FAQ_CARTES = [
  {
    question: "Quelle est la meilleure carte de recharge sans abonnement ?",
    answer:
      "Lidl Plus est la moins chère sur les bornes AC 22 kW (0,29 €/kWh) sans abonnement, mais uniquement sur les bornes Lidl. Chargemap Pass et Freshmile sont les meilleurs agrégateurs sans abonnement pour accéder à un grand réseau : tarif AC autour de 0,38–0,39 €/kWh sur des milliers de points de charge en France.",
  },
  {
    question: "Quelle carte choisir pour les voyages en Europe ?",
    answer:
      "Pour les voyages EU, Chargemap Pass et Plugsurfing offrent le meilleur roaming (30+ pays). IONITY Passport est indispensable si vous roulez beaucoup sur autoroute et rechargez principalement en ultra-rapide — l'abonnement à 17,99 €/mois ramène le tarif de 0,79 à 0,35 €/kWh sur le réseau IONITY. EnBW mobility+ est le meilleur choix pour les voyages vers l'Allemagne et l'Autriche.",
  },
  {
    question: "Comment est calculé le coût mensuel estimé ?",
    answer:
      "Le calculateur estime votre consommation mensuelle en kWh (20 kWh/100 km), répartit entre sessions AC (≈15 kWh/session) et DC rapide (≈45 kWh/session), puis applique les tarifs de chaque carte. Pour les voyages EU, il ajoute une estimation de sessions roaming selon la fréquence renseignée. C'est une estimation indicative — vérifiez les tarifs officiels avant de souscrire.",
  },
  {
    question: "La carte de recharge remplace-t-elle le paiement par CB directe ?",
    answer:
      "Non — la plupart des bornes récentes (depuis 2022 en France) acceptent la CB directement grâce à l'obligation réglementaire européenne. La carte de recharge est avantageuse si vous rechargez fréquemment en public : elle donne accès à des tarifs négociés, souvent 20 à 40 % moins chers que le tarif CB sans contrat.",
  },
  {
    question: "Les cartes de recharge fonctionnent-elles en Belgique et en Suisse ?",
    answer:
      "Oui pour les cartes avec roaming EU — Chargemap, Freshmile, Plugsurfing, EnBW et IONITY couvrent la Belgique et la Suisse. Eneco eMobility et Blink Charging (ex-Blue Corner, racheté en 2023) sont des cartes belges qui fonctionnent principalement en Belgique et aux Pays-Bas. Filtrez par pays dans le tableau comparatif pour voir les cartes disponibles dans votre région.",
  },
]

export default async function PageCartesRecharge({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)

  // Fetch serveur → le tableau est rendu en HTML statique (indexable),
  // et le calculateur reçoit les mêmes données sans re-fetch côté client.
  const cartes = await getCartes()

  return (
    <main className="container" style={{ paddingTop: 40, paddingBottom: 64 }}>

      {/* ── Hero ── */}
      <div style={{ textAlign: 'center', marginBottom: 48 }}>
        <div style={{ fontSize: '0.82rem', color: 'var(--color-primary)', fontWeight: 600, marginBottom: 10, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
          {cartes.length} cartes comparées · Mis à jour 2026
        </div>
        <h1 style={{ fontSize: 'clamp(1.6rem, 4vw, 2.4rem)', marginBottom: 14, lineHeight: 1.2 }}>
          Quelle carte de recharge<br />
          <span style={{ color: 'var(--color-primary)' }}>vous coûte le moins cher ?</span>
        </h1>
        <p style={{ maxWidth: 560, margin: '0 auto', color: 'var(--color-text-muted)', fontSize: '1rem', lineHeight: 1.6 }}>
          Renseignez votre profil — km/mois, part DC rapide, voyages EU — et obtenez votre coût mensuel estimé pour chaque carte, classé du moins cher au plus cher.
        </p>

        <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: 10, marginTop: 20 }}>
          {[`⚡ ${cartes.length} cartes FR & BE`, '✈️ Roaming EU calculé', '🏢 Mode flotte', '📊 Tableau comparatif'].map(b => (
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

      {/* ── Calculateur interactif (client) ── */}
      <ComparateurCartes initialCartes={cartes} />

      {/* ── Tableau comparatif (rendu serveur, indexable) ── */}
      <TableauCartes cartes={cartes} />

      {/* ── Comparatifs ciblés (pages passerelles SEO) ── */}
      <section style={{ marginTop: 48 }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: 6 }}>Comparatifs ciblés</h2>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', marginBottom: 18 }}>
          Accédez directement au comparatif filtré selon votre besoin.
        </p>

        <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 10 }}>Par profil d&apos;usage</div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 22 }}>
          {SELECTIONS_PROFIL.map(s => (
            <Link key={s.slug} href={`/outils/cartes-recharge/comparatif/${s.slug}`} style={{
              padding: '8px 16px', borderRadius: 24, fontSize: '0.88rem', fontWeight: 600,
              border: '1px solid var(--color-border)', color: 'var(--color-text)',
              textDecoration: 'none', background: 'var(--color-bg-card)',
            }}>
              {s.emoji} {s.label}
            </Link>
          ))}
        </div>

        <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 10 }}>Par réseau de bornes</div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {SELECTIONS_RESEAU.map(s => (
            <Link key={s.slug} href={`/outils/cartes-recharge/comparatif/${s.slug}`} style={{
              padding: '8px 16px', borderRadius: 24, fontSize: '0.88rem', fontWeight: 600,
              border: '1px solid var(--color-border)', color: 'var(--color-text)',
              textDecoration: 'none', background: 'var(--color-bg-card)',
            }}>
              {s.emoji} {s.label}
            </Link>
          ))}
        </div>
      </section>

      {/* ── FAQ ── */}
      <FaqAccordion items={FAQ_CARTES} title="Questions fréquentes sur les cartes de recharge" />

      {/* ── CTA ── */}
      <section style={{ marginTop: 48, textAlign: 'center' }}>
        <p style={{ color: 'var(--color-text-muted)', marginBottom: 16, fontSize: '0.9rem' }}>
          Vous envisagez de passer à l'électrique ?
        </p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 12, flexWrap: 'wrap' }}>
          <a href="/simulateur" className="btn btn-primary">🧮 Simulateur TCO →</a>
          <a href="/assistance/recharge" className="btn btn-secondary">⚡ Guide recharge VE</a>
          <a href="/comparer" className="btn btn-secondary">📊 Comparateur motorisations</a>
        </div>
      </section>
    </main>
  )
}
