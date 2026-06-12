/**
 * Hub SEO /zfe-reglementation — page pilier ZFE / Crit'Air.
 * Contenu FR autonome (canonique FR, servi sous tous les préfixes locale).
 * Données vérifiées le 12/06/2026 (statut législatif + verbalisation par ville).
 */

import type { Metadata } from 'next'
import { Link } from '@/i18n/navigation'

const ANNEE = 2026

const PAGE_TITLE = "ZFE 2026 : zones à faibles émissions, Crit'Air et villes concernées | Moteurs.com"
const PAGE_DESC =
  "ZFE en 2026 : la suppression votée puis bloquée par le Conseil constitutionnel — les zones restent en vigueur. Villes concernées, calendrier de verbalisation (Paris, Lyon, Grenoble), vignette Crit'Air, véhicules interdits et dérogations."

export const metadata: Metadata = {
  title: PAGE_TITLE,
  description: PAGE_DESC,
  keywords:
    "ZFE 2026, zone à faibles émissions, Crit'Air, ZFE Paris, ZFE Lyon, ZFE Grenoble, véhicules interdits ZFE, vignette Crit'Air",
  openGraph: {
    title: "ZFE 2026 : où en est-on vraiment ? Villes, Crit'Air, calendrier",
    description:
      "Suppression bloquée, ZFE maintenues : le point complet 2026 sur les zones à faibles émissions, par ville et par vignette Crit'Air.",
    type: 'article',
  },
  alternates: { canonical: 'https://moteurs.com/zfe-reglementation' },
}

const VILLES: { ville: string; statut: string; detail: string }[] = [
  { ville: 'Paris / Grand Paris (intra-A86)', statut: 'Pas de verbalisation en 2026', detail: "Phase pédagogique prolongée. L'interdiction Crit'Air 3, 4, 5 et non classés reste juridiquement en vigueur, mais aucune amende n'est émise en 2026." },
  { ville: 'Lyon (Métropole)', statut: 'Verbalisation dès le 1ᵉʳ juillet 2026', detail: "Sanctions pour les véhicules Crit'Air 3 et au-delà à partir de juillet 2026." },
  { ville: 'Grenoble (Métropole)', statut: 'Verbalisation déjà active', detail: 'Amende forfaitaire de 68 € pour un véhicule léger non conforme. La ZFE la plus avancée de France.' },
  { ville: 'Strasbourg', statut: 'Contrôle automatisé en déploiement', detail: 'Caméras de lecture de plaques (LAPI) croisées avec le SIV, comme à Paris et Lyon.' },
  { ville: '43 agglomérations > 150 000 hab.', statut: 'ZFE en place', detail: 'Calendriers et niveaux de restriction variables selon la qualité de l’air locale.' },
]

const CRITAIR: { v: string; couleur: string; motorisation: string }[] = [
  { v: 'Crit’Air 0 (verte)', couleur: '#16a34a', motorisation: '100 % électrique ou hydrogène — jamais restreint' },
  { v: 'Crit’Air 1', couleur: '#7c3aed', motorisation: 'Essence Euro 5/6 (depuis 2011) + hybrides rechargeables' },
  { v: 'Crit’Air 2', couleur: '#d97706', motorisation: 'Essence 2006–2010, diesel Euro 5/6 (depuis 2011)' },
  { v: 'Crit’Air 3', couleur: '#ea580c', motorisation: 'Essence 1997–2005, diesel 2006–2010 — visé par les restrictions 2026' },
  { v: 'Crit’Air 4 / 5 / non classé', couleur: '#dc2626', motorisation: 'Diesel avant 2006 — interdits dans les ZFE actives' },
]

const FAQ_ZFE: { q: string; a: string }[] = [
  {
    q: 'Les ZFE sont-elles supprimées en 2026 ?',
    a: "Non. L'Assemblée nationale a voté leur suppression le 14 avril 2026, mais le Conseil constitutionnel a annulé cette disposition le 21 mai 2026, la jugeant sans lien avec la loi de simplification (cavalier législatif). Les ZFE restent donc en vigueur là où elles ont été instaurées, et les règles Crit'Air continuent de s'appliquer.",
  },
  {
    q: 'Faut-il toujours une vignette Crit’Air pour circuler en ZFE ?',
    a: "Oui. Même dans les villes où la verbalisation est suspendue (comme Paris en 2026), la vignette Crit'Air reste obligatoire pour circuler dans une ZFE. Elle se commande uniquement sur le site officiel certificat-air.gouv.fr au tarif unique de 3,77 € (frais d'envoi inclus). Méfiez-vous des sites revendeurs plus chers.",
  },
  {
    q: 'Quels véhicules sont interdits en ZFE en 2026 ?',
    a: "Cela dépend de la ville. La cible 2026 est le Crit'Air 3 (essence d'avant 2006, diesel d'avant 2011) et au-delà (Crit'Air 4, 5 et non classés). À Paris, l'interdiction Crit'Air 3+ existe sur le papier mais n'est pas verbalisée en 2026 ; à Lyon elle le sera dès juillet ; à Grenoble elle l'est déjà.",
  },
  {
    q: 'Quel est le montant de l’amende ZFE ?',
    a: "L'amende forfaitaire est de 68 € pour une voiture ou un deux-roues (véhicule léger) et de 135 € pour un poids lourd, autocar ou autobus. Grenoble verbalise déjà ; Lyon démarre en juillet 2026. Le contrôle se fait de plus en plus par caméras automatiques reliées au fichier des immatriculations.",
  },
  {
    q: 'Existe-t-il des dérogations à la ZFE ?',
    a: "Oui. Les véhicules d'urgence, de personnes à mobilité réduite (carte mobilité inclusion stationnement), certains véhicules professionnels et les véhicules de collection (carte grise « collection ») bénéficient de dérogations. Des pass « petits rouleurs » (24 jours/an) existent aussi dans plusieurs métropoles. Les conditions sont fixées localement.",
  },
  {
    q: 'Comment savoir si ma voiture est concernée ?',
    a: "Votre vignette Crit'Air dépend de la motorisation et de la date de première immatriculation, lisibles sur votre carte grise (champs P.3 et B). Un véhicule 100 % électrique est Crit'Air 0 et n'est jamais restreint. En cas de doute, simulez votre amende et vérifiez votre éligibilité ZFE avec notre calculateur.",
  },
]

export default function PageZFE() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        '@id': 'https://moteurs.com/zfe-reglementation',
        url: 'https://moteurs.com/zfe-reglementation',
        name: PAGE_TITLE,
        description: PAGE_DESC,
        inLanguage: 'fr',
        about: { '@type': 'Thing', name: 'Zone à faibles émissions (ZFE)' },
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Accueil', item: 'https://moteurs.com/' },
          { '@type': 'ListItem', position: 2, name: 'ZFE & réglementation', item: 'https://moteurs.com/zfe-reglementation' },
        ],
      },
      {
        '@type': 'FAQPage',
        mainEntity: FAQ_ZFE.map(({ q, a }) => ({
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

      {/* Fil d'ariane */}
      <nav style={{ fontSize: '0.82rem', color: 'var(--color-text-soft)', marginBottom: 20 }}>
        <Link href="/" style={{ color: 'inherit', textDecoration: 'none' }}>Accueil</Link>
        {' / '}
        <span>ZFE & réglementation</span>
      </nav>

      {/* Hero */}
      <header style={{ marginBottom: 28 }}>
        <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--color-primary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
          Guide ZFE · {ANNEE}
        </div>
        <h1 style={{ fontSize: 'clamp(1.7rem, 4vw, 2.4rem)', marginBottom: 14, lineHeight: 1.2 }}>
          ZFE {ANNEE} : zones à faibles émissions, Crit’Air et villes concernées
        </h1>
        <p style={{ fontSize: '1.02rem', lineHeight: 1.65, color: 'var(--color-text-soft)' }}>
          La suppression des ZFE a été votée à l’Assemblée puis <strong>annulée par le Conseil
          constitutionnel</strong> le 21 mai {ANNEE} : les zones à faibles émissions <strong>restent en
          vigueur</strong>. Voici le point complet — statut légal, villes, calendrier de verbalisation,
          vignette Crit’Air et véhicules concernés.
        </p>
      </header>

      {/* Encadré statut */}
      <section style={{ background: 'rgba(234,88,12,0.06)', border: '1px solid rgba(234,88,12,0.25)', borderRadius: 12, padding: '18px 20px', marginBottom: 34 }}>
        <h2 style={{ fontSize: '1.1rem', marginTop: 0, marginBottom: 8 }}>Où en est-on en {ANNEE} ? (mis à jour le 12/06/{ANNEE})</h2>
        <p style={{ margin: 0, lineHeight: 1.65, fontSize: '0.95rem' }}>
          Le 14 avril {ANNEE}, l’Assemblée nationale a voté la suppression totale des ZFE dans le cadre
          d’une loi de simplification. Mais le 21 mai {ANNEE}, le Conseil constitutionnel a censuré cette
          mesure (cavalier législatif). <strong>Conséquence : le cadre actuel est maintenu</strong> — les
          ZFE déjà instaurées continuent de s’appliquer, et la vignette Crit’Air reste obligatoire.
        </p>
      </section>

      {/* Villes */}
      <section style={{ marginBottom: 36 }}>
        <h2 style={{ fontSize: '1.3rem', marginBottom: 8 }}>Villes concernées et calendrier de verbalisation</h2>
        <p style={{ color: 'var(--color-text-soft)', lineHeight: 1.6, marginBottom: 16, fontSize: '0.95rem' }}>
          43 agglomérations de plus de 150 000 habitants appliquent une ZFE en {ANNEE}, mais la
          verbalisation varie fortement de l’une à l’autre.
        </p>
        <div style={{ display: 'grid', gap: 10 }}>
          {VILLES.map(({ ville, statut, detail }) => (
            <div key={ville} style={{ border: '1px solid var(--color-border)', borderRadius: 10, padding: '14px 16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, marginBottom: 4 }}>
                <strong>{ville}</strong>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-primary)' }}>{statut}</span>
              </div>
              <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--color-text-soft)', lineHeight: 1.55 }}>{detail}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Crit'Air */}
      <section style={{ marginBottom: 36 }}>
        <h2 style={{ fontSize: '1.3rem', marginBottom: 8 }}>Les vignettes Crit’Air et les véhicules interdits</h2>
        <p style={{ color: 'var(--color-text-soft)', lineHeight: 1.6, marginBottom: 16, fontSize: '0.95rem' }}>
          La vignette Crit’Air classe les véhicules de 0 (les plus propres) à 5 selon la motorisation et
          la date d’immatriculation. Elle se commande sur le site officiel <strong>certificat-air.gouv.fr</strong>
          {' '}au tarif unique de <strong>3,77 €</strong>. La cible des restrictions {ANNEE} est le Crit’Air 3 et au-delà.
        </p>
        <div style={{ display: 'grid', gap: 8 }}>
          {CRITAIR.map(({ v, couleur, motorisation }) => (
            <div key={v} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', borderLeft: `4px solid ${couleur}`, padding: '8px 14px', background: 'var(--color-bg-alt)', borderRadius: 6 }}>
              <strong style={{ minWidth: 160, color: couleur }}>{v}</strong>
              <span style={{ fontSize: '0.9rem', color: 'var(--color-text-soft)', lineHeight: 1.5 }}>{motorisation}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Outils liés */}
      <section style={{ marginBottom: 36 }}>
        <h2 style={{ fontSize: '1.3rem', marginBottom: 12 }}>Vérifier ma situation</h2>
        <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))' }}>
          <CarteOutil href="/outils/amende-pv" titre="Calculateur d’amende ZFE" desc="Montant exact selon votre véhicule et la ville, pour 10 pays." cta="Calculer mon amende" />
          <CarteOutil href="/particulier" titre="Aides au remplacement" desc="Bonus, prime à la conversion, leasing social pour passer à un véhicule propre." cta="Voir les aides" />
          <CarteOutil href="/comparer" titre="Comparateur motorisations" desc="Électrique, hybride, essence : quelle motorisation pour rester libre de circuler ?" cta="Comparer" />
        </div>
      </section>

      {/* FAQ */}
      <section style={{ marginBottom: 12 }}>
        <h2 style={{ fontSize: '1.3rem', marginBottom: 16 }}>ZFE et Crit’Air : questions fréquentes</h2>
        <div style={{ display: 'grid', gap: 10 }}>
          {FAQ_ZFE.map(({ q, a }) => (
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
          <Link href="/depannage" className="btn btn-secondary">🔧 Dépannage</Link>
          <Link href="/documents-auto" className="btn btn-secondary">📄 Documents auto</Link>
          <Link href="/cout-voiture" className="btn btn-secondary">💰 Coût voiture (TCO)</Link>
          <Link href="/recharge-electrique" className="btn btn-secondary">🔌 Recharge électrique</Link>
        </div>
      </section>
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
