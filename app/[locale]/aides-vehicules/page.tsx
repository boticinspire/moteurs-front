/**
 * Hub SEO /aides-vehicules — page pilier des aides à l'achat 2026.
 * Contenu FR autonome (canonique FR, servi sous tous les préfixes locale).
 * Données vérifiées le 12/06/2026 (bonus écologique, leasing social, B2B).
 */

import type { Metadata } from 'next'
import { Link } from '@/i18n/navigation'

const ANNEE = 2026

const PAGE_TITLE = "Aides voiture électrique 2026 : bonus écologique, leasing social, B2B | Moteurs.com"
const PAGE_DESC =
  "Toutes les aides 2026 à l'achat d'un véhicule propre : bonus écologique jusqu'à 5 700 €, surbonus batterie européenne, leasing social, aides entreprise (suramortissement, TVA, CEE borne). Montants, conditions et cumuls vérifiés."

export const metadata: Metadata = {
  title: PAGE_TITLE,
  description: PAGE_DESC,
  keywords:
    "bonus écologique 2026, aide achat voiture électrique, leasing social 2026, prime conversion, suramortissement véhicule électrique, CEE borne recharge",
  openGraph: {
    title: "Aides voiture électrique 2026 : ce à quoi vous avez droit",
    description:
      "Bonus jusqu'à 5 700 €, surbonus batterie EU, leasing social, aides entreprise : le point complet et à jour sur les aides 2026.",
    type: 'article',
  },
  alternates: { canonical: 'https://moteurs.com/aides-vehicules' },
}

const BONUS: { profil: string; montant: string }[] = [
  { profil: 'Ménages très modestes / précaires', montant: "jusqu'à 5 700 €" },
  { profil: 'Ménages modestes (non précaires)', montant: "jusqu'à 4 700 €" },
  { profil: 'Autres ménages', montant: "jusqu'à 3 500 €" },
  { profil: 'Surbonus batterie fabriquée en Europe', montant: '+1 200 € à 2 000 €' },
]

const FAQ_AIDES: { q: string; a: string }[] = [
  {
    q: 'Quel est le montant du bonus écologique en 2026 ?',
    a: "Le bonus écologique 2026 est modulé selon le revenu fiscal de référence : jusqu'à 5 700 € pour les ménages les plus modestes, 4 700 € pour les ménages modestes et 3 500 € pour les autres. Un surbonus de 1 200 € à 2 000 € s'ajoute si la batterie est fabriquée en Europe. Le cumul théorique maximum (bonus + aides régionales + surbonus) peut atteindre environ 13 700 €.",
  },
  {
    q: 'Quelles conditions pour toucher le bonus écologique ?',
    a: "Le véhicule doit être une voiture 100 % électrique neuve, avec un prix d'achat inférieur à 47 000 €, un poids inférieur à 2 400 kg et un score environnemental ADEME d'au moins 60/80 (ce qui exclut une partie des modèles produits hors d'Europe). Les conditions de revenu déterminent le montant.",
  },
  {
    q: 'La prime à la conversion existe-t-elle encore en 2026 ?',
    a: "Non. La prime à la conversion (qui récompensait la mise au rebut d'un vieux véhicule) a été supprimée fin 2024. Elle est partiellement remplacée par le leasing social, destiné aux ménages modestes.",
  },
  {
    q: 'Qu’est-ce que le leasing social et qui y a droit ?',
    a: "Le leasing social permet de louer une voiture électrique neuve à partir de 82 à 200 € par mois. Le dispositif 2026 ouvre le 16 juillet 2026 (jusqu'au 31 décembre 2031, sous réserve des crédits). Il est attribué sous condition de revenu et d'usage (critère « gros rouleur » : long trajet domicile-travail ou forte utilisation). Important : il n'est pas cumulable avec le bonus écologique.",
  },
  {
    q: 'Les hybrides rechargeables sont-ils encore aidés ?',
    a: "Non. Depuis le 1ᵉʳ juillet 2025, les véhicules hybrides rechargeables (PHEV) ne sont plus éligibles au bonus écologique. Seules les voitures 100 % électriques neuves ouvrent droit au bonus.",
  },
  {
    q: 'Quelles aides pour une entreprise qui achète un véhicule électrique ?',
    a: "Les entreprises bénéficient du suramortissement de 40 % (jusqu'à fin 2026) sur les véhicules lourds électriques, de la récupération de TVA à 100 % sur les véhicules électriques et utilitaires, de l'exonération de TVS pour les VE, et d'aides flottes pouvant aller jusqu'à 12 000 € par poids lourd. Voir notre espace PME & flottes pour le détail.",
  },
  {
    q: 'Y a-t-il des aides pour installer une borne de recharge ?',
    a: "Oui. Les particuliers bénéficient d'un crédit d'impôt (jusqu'à 500 € par borne) et les primes CEE (Certificats d'Économies d'Énergie) financent une partie de l'installation, à domicile comme en entreprise. En Belgique, des dispositifs spécifiques (DPI) existent pour les indépendants et PME.",
  },
]

export default function PageAidesVehicules() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        '@id': 'https://moteurs.com/aides-vehicules',
        url: 'https://moteurs.com/aides-vehicules',
        name: PAGE_TITLE,
        description: PAGE_DESC,
        inLanguage: 'fr',
        about: { '@type': 'Thing', name: "Aides à l'achat de véhicules électriques" },
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Accueil', item: 'https://moteurs.com/' },
          { '@type': 'ListItem', position: 2, name: 'Aides véhicules', item: 'https://moteurs.com/aides-vehicules' },
        ],
      },
      {
        '@type': 'FAQPage',
        mainEntity: FAQ_AIDES.map(({ q, a }) => ({
          '@type': 'Question',
          name: q,
          acceptedAnswer: { '@type': 'Answer', text: a },
        })),
      },
    ],
  }

  return (
    <main className="container" style={{ paddingTop: 36, paddingBottom: 64, maxWidth: 800 }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <nav style={{ fontSize: '0.82rem', color: 'var(--color-text-soft)', marginBottom: 20 }}>
        <Link href="/" style={{ color: 'inherit', textDecoration: 'none' }}>Accueil</Link>
        {' / '}
        <span>Aides véhicules</span>
      </nav>

      <header style={{ marginBottom: 28 }}>
        <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--color-primary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
          Guide aides · {ANNEE}
        </div>
        <h1 style={{ fontSize: 'clamp(1.7rem, 4vw, 2.4rem)', marginBottom: 14, lineHeight: 1.2 }}>
          Aides à l’achat d’un véhicule électrique en {ANNEE}
        </h1>
        <p style={{ fontSize: '1.02rem', lineHeight: 1.65, color: 'var(--color-text-soft)' }}>
          Bonus écologique, surbonus batterie européenne, leasing social, aides entreprise : voici
          <strong> ce à quoi vous avez réellement droit en {ANNEE}</strong>, avec les montants, les
          conditions et les règles de cumul à jour.
        </p>
      </header>

      {/* Bonus écologique */}
      <section style={{ marginBottom: 36 }}>
        <h2 style={{ fontSize: '1.3rem', marginBottom: 8 }}>Le bonus écologique {ANNEE}</h2>
        <p style={{ color: 'var(--color-text-soft)', lineHeight: 1.6, marginBottom: 16, fontSize: '0.95rem' }}>
          Le bonus est <strong>modulé selon le revenu fiscal de référence</strong> et réservé aux
          voitures 100 % électriques neuves.
        </p>
        <div style={{ display: 'grid', gap: 8, marginBottom: 14 }}>
          {BONUS.map(({ profil, montant }) => (
            <div key={profil} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', border: '1px solid var(--color-border)', borderRadius: 8, padding: '12px 16px' }}>
              <span style={{ fontSize: '0.92rem' }}>{profil}</span>
              <strong style={{ color: 'var(--color-primary)', whiteSpace: 'nowrap' }}>{montant}</strong>
            </div>
          ))}
        </div>
        <div style={{ background: 'var(--color-bg-alt)', border: '1px solid var(--color-border)', borderRadius: 10, padding: '14px 16px', fontSize: '0.9rem', lineHeight: 1.6 }}>
          <strong>Conditions du véhicule :</strong> 100 % électrique neuf · prix &lt; 47 000 € · poids &lt; 2 400 kg ·
          score environnemental ADEME ≥ 60/80. Les hybrides rechargeables (PHEV) <strong>ne sont plus éligibles
          depuis le 1ᵉʳ juillet 2025</strong>.
        </div>
      </section>

      {/* Leasing social */}
      <section style={{ marginBottom: 36 }}>
        <h2 style={{ fontSize: '1.3rem', marginBottom: 8 }}>Le leasing social {ANNEE}</h2>
        <p style={{ color: 'var(--color-text-soft)', lineHeight: 1.6, fontSize: '0.95rem' }}>
          Louer une voiture électrique neuve à partir de <strong>82 à 200 €/mois</strong>. Le dispositif {ANNEE}
          {' '}ouvre le <strong>16 juillet {ANNEE}</strong> (jusqu’au 31 décembre 2031, sous réserve des crédits),
          sous condition de revenu et d’usage (critère « gros rouleur »). Il <strong>n’est pas cumulable</strong>
          {' '}avec le bonus écologique. Il remplace en partie la prime à la conversion, supprimée fin 2024.
        </p>
      </section>

      {/* B2B */}
      <section style={{ marginBottom: 36 }}>
        <h2 style={{ fontSize: '1.3rem', marginBottom: 8 }}>Aides pour les entreprises et les flottes</h2>
        <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 1.8, fontSize: '0.95rem', color: 'var(--color-text-soft)' }}>
          <li><strong>Suramortissement 40 %</strong> sur les véhicules lourds électriques (jusqu’à fin {ANNEE}).</li>
          <li><strong>Récupération de TVA à 100 %</strong> sur les véhicules électriques et utilitaires.</li>
          <li><strong>Exonération de TVS</strong> (taxe sur les véhicules de société) pour les VE.</li>
          <li><strong>Aide flotte</strong> jusqu’à 12 000 € par poids lourd électrique.</li>
        </ul>
      </section>

      {/* Borne */}
      <section style={{ marginBottom: 36 }}>
        <h2 style={{ fontSize: '1.3rem', marginBottom: 8 }}>Aides pour installer une borne de recharge</h2>
        <p style={{ color: 'var(--color-text-soft)', lineHeight: 1.6, fontSize: '0.95rem' }}>
          Crédit d’impôt jusqu’à <strong>500 € par borne</strong> pour les particuliers, et primes
          {' '}<strong>CEE</strong> (Certificats d’Économies d’Énergie) qui financent une partie de l’installation,
          à domicile comme en entreprise. En Belgique, la <strong>DPI</strong> s’adresse aux indépendants et PME.
        </p>
      </section>

      {/* Outils liés */}
      <section style={{ marginBottom: 36 }}>
        <h2 style={{ fontSize: '1.3rem', marginBottom: 12 }}>Calculer mon gain réel</h2>
        <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))' }}>
          <CarteOutil href="/simulateur" titre="Simulateur TCO" desc="Intégrez bonus et aides au coût total sur 5 ans, par pays et motorisation." cta="Lancer le simulateur" />
          <CarteOutil href="/comparer" titre="Comparateur motorisations" desc="Électrique, hybride, essence : quelle motorisation est la plus rentable, aides incluses ?" cta="Comparer" />
          <CarteOutil href="/b2b" titre="Espace PME & flottes" desc="Suramortissement, TVA, aides flottes : optimisez la fiscalité de vos véhicules pro." cta="Voir l’espace B2B" />
        </div>
      </section>

      {/* Autres pays */}
      <section style={{ marginBottom: 36 }}>
        <h2 style={{ fontSize: '1.3rem', marginBottom: 8 }}>Et dans les autres pays ?</h2>
        <p style={{ color: 'var(--color-text-soft)', lineHeight: 1.6, fontSize: '0.95rem', marginBottom: 12 }}>
          Les dispositifs diffèrent selon le pays. Retrouvez nos décryptages dédiés :
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
          <Link href="/articles/be" className="btn btn-secondary">🇧🇪 Aides Belgique</Link>
          <Link href="/articles/ch" className="btn btn-secondary">🇨🇭 Aides Suisse</Link>
          <Link href="/articles/ca" className="btn btn-secondary">🇨🇦 Aides Canada</Link>
        </div>
      </section>

      {/* FAQ */}
      <section style={{ marginBottom: 12 }}>
        <h2 style={{ fontSize: '1.3rem', marginBottom: 16 }}>Aides 2026 : questions fréquentes</h2>
        <div style={{ display: 'grid', gap: 10 }}>
          {FAQ_AIDES.map(({ q, a }) => (
            <details key={q} style={{ border: '1px solid var(--color-border)', borderRadius: 10, padding: '12px 16px' }}>
              <summary style={{ cursor: 'pointer', fontWeight: 600 }}>{q}</summary>
              <p style={{ marginTop: 10, color: 'var(--color-text-soft)', lineHeight: 1.6 }}>{a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* Maillage inter-hubs */}
      <section style={{ marginTop: 44, paddingTop: 28, borderTop: '1px solid var(--color-border)' }}>
        <h2 style={{ fontSize: '1.15rem', marginBottom: 14 }}>Voir aussi dans nos guides</h2>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
          <Link href="/cout-voiture" className="btn btn-secondary">💰 Coût voiture (TCO)</Link>
          <Link href="/zfe-reglementation" className="btn btn-secondary">🅿️ ZFE & réglementation</Link>
          <Link href="/recharge-electrique" className="btn btn-secondary">🔌 Recharge électrique</Link>
          <Link href="/particulier" className="btn btn-secondary">🚗 Espace particuliers</Link>
        </div>
      </section>

      <p style={{ marginTop: 28, fontSize: '0.78rem', color: 'var(--color-text-soft)', lineHeight: 1.5 }}>
        Montants et conditions vérifiés le 12/06/{ANNEE}. Les aides évoluent : vérifiez toujours sur
        le site officiel <strong>primealaconversion.gouv.fr</strong> avant tout achat.
      </p>
    </main>
  )
}

function CarteOutil({ href, titre, desc, cta }: { href: string; titre: string; desc: string; cta: string }) {
  return (
    <Link href={href} style={{ display: 'block', padding: 16, borderRadius: 12, background: 'var(--color-bg-card)', border: '1px solid var(--color-border)', textDecoration: 'none', color: 'var(--color-text)' }}>
      <h3 style={{ fontSize: '0.98rem', margin: 0, marginBottom: 6 }}>{titre}</h3>
      <p style={{ fontSize: '0.86rem', lineHeight: 1.5, color: 'var(--color-text-soft)', margin: 0, marginBottom: 10 }}>{desc}</p>
      <span style={{ color: 'var(--color-primary)', fontSize: '0.85rem', fontWeight: 600 }}>{cta} →</span>
    </Link>
  )
}
