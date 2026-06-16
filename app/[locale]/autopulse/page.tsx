/**
 * Page de marque /autopulse — destination conducteur pan-européenne.
 * Contenu FR autonome (canonique FR, servi sous tous les préfixes locale).
 * Hero + capture email via composant client AutopulseManifesto.
 */

import type { Metadata } from 'next'
import { Link } from '@/i18n/navigation'
import { routing } from '@/i18n/routing'
import { setRequestLocale } from 'next-intl/server'
import { buildAlternates } from '@/lib/seo-utils'
import AutopulseManifesto from '@/components/AutopulseManifesto'

const TITLE = 'Autopulse — le co-pilote de votre voiture, toutes marques, tous carburants | Moteurs.com'
const DESC =
  "Autopulse suit l'entretien, anticipe l'usure et surveille les coûts de n'importe quel véhicule — essence, diesel, hybride ou électrique. Sans boîtier, sans marque imposée. La plateforme conducteur pensée pour l'Europe."

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }))
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  return {
    title: { absolute: TITLE },
    description: DESC,
    keywords: 'application entretien voiture, carnet entretien numérique, suivi véhicule, co-pilote conducteur, application voiture toutes marques',
    openGraph: { title: TITLE, description: DESC, type: 'website' },
    alternates: buildAlternates(locale, '/autopulse'),
  }
}

const ETAPES: { n: string; t: string; d: string }[] = [
  { n: '1', t: 'Ajoutez votre voiture', d: 'Marque, modèle, kilométrage, carburant. Plusieurs véhicules possibles — la flotte du foyer.' },
  { n: '2', t: 'Autopulse calcule', d: 'Plan d’entretien adapté au carburant, échéances au km et à la date, usure des pneus et freins, coûts.' },
  { n: '3', t: 'Vous anticipez', d: 'Un pneu qui s’use vite, une plaquette à 800 km, un coût carburant en hausse : vous le savez avant la panne.' },
]

const POURQUOI: { ic: string; t: string; d: string }[] = [
  { ic: '🔓', t: 'Sans marque imposée', d: 'L’app Tesla ne marche que pour les Tesla. Autopulse fonctionne avec n’importe quelle voiture, de n’importe quelle marque.' },
  { ic: '⛽', t: 'Tous les carburants', d: 'Thermique, hybride, électrique, GNV. L’Europe est en pleine transition — vos outils doivent suivre les deux mondes, pas un seul.' },
  { ic: '🧭', t: 'Indépendant', d: 'Ni constructeur, ni concessionnaire. Un conseiller neutre, fidèle à l’ADN de Moteurs.com : le décryptage par les chiffres.' },
  { ic: '🇪🇺', t: 'Pensé pour l’Europe', d: 'Multi-pays, multilingue, conscient des règles locales (ZFE, contrôle technique, recharge). Là où les apps US s’arrêtent.' },
]

const SUIVI: string[] = [
  'Échéances d’entretien au kilomètre ET à la date (vidange, freins, filtres, contrôle technique…)',
  'Prévision d’usure des pneus, plaquettes et disques — kilomètres restants et date estimée',
  'Score de santé du véhicule, mis à jour à chaque relevé',
  'Suivi des coûts : total, par an, au kilomètre, et tendance trimestrielle du carburant',
  'Historique d’entretien horodaté + export de vos données',
]

const FAQ: { q: string; a: string }[] = [
  { q: 'Autopulse fonctionne avec quelles voitures ?', a: 'Toutes. Autopulse est volontairement brand-agnostic : essence, diesel, hybride, électrique, GNV ou GPL, de n’importe quelle marque. Le plan d’entretien s’adapte automatiquement au carburant (par exemple, pas de vidange pour une électrique).' },
  { q: 'Faut-il un boîtier ou un équipement à installer ?', a: 'Non. Autopulse fonctionne sans matériel : vous renseignez votre véhicule et son kilométrage, et la plateforme calcule le reste. Rien à brancher, rien à acheter.' },
  { q: 'Mes données sont-elles privées ?', a: 'Oui. Aujourd’hui, vos données restent stockées sur votre appareil (navigateur), sans envoi à un serveur. Une synchronisation entre appareils, réservée aux membres connectés, est prévue — elle sera optionnelle.' },
  { q: 'Combien ça coûte ?', a: 'Le carnet d’entretien Autopulse est gratuit et accessible sans compte. Inscrivez-vous à la liste d’attente pour être prévenu des prochaines fonctionnalités.' },
  { q: 'Quelle différence avec l’application de mon constructeur ?', a: 'Les apps constructeur ne couvrent qu’une marque et, souvent, qu’un type de motorisation. Si votre foyer a deux voitures de marques différentes, ou si vous changez de véhicule, Autopulse garde une vue unique et continue — indépendante du constructeur.' },
]

export default async function AutopulsePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  setRequestLocale(locale)

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'SoftwareApplication',
        name: 'Autopulse',
        applicationCategory: 'AutomotiveApplication',
        operatingSystem: 'Web',
        url: 'https://moteurs.com/autopulse',
        description: DESC,
        offers: { '@type': 'Offer', price: '0', priceCurrency: 'EUR' },
        publisher: { '@type': 'Organization', name: 'Moteurs.com', url: 'https://moteurs.com' },
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Accueil', item: 'https://moteurs.com/' },
          { '@type': 'ListItem', position: 2, name: 'Autopulse', item: 'https://moteurs.com/autopulse' },
        ],
      },
      {
        '@type': 'FAQPage',
        mainEntity: FAQ.map(({ q, a }) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })),
      },
    ],
  }

  const card: React.CSSProperties = {
    background: 'var(--color-bg-card)', border: '1.5px solid var(--color-border)',
    borderRadius: 14, padding: 24,
  }

  return (
    <main className="container" style={{ paddingTop: 28, paddingBottom: 72, maxWidth: 920 }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <nav style={{ fontSize: '0.82rem', color: 'var(--color-text-soft)', marginBottom: 16 }}>
        <Link href="/" style={{ color: 'inherit', textDecoration: 'none' }}>Accueil</Link>{' / '}<span>Autopulse</span>
      </nav>

      {/* Hero + capture email */}
      <AutopulseManifesto />

      {/* Comment ça marche */}
      <h2 style={{ fontSize: '1.5rem', fontWeight: 800, margin: '8px 0 18px' }}>Comment ça marche</h2>
      <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', marginBottom: 44 }}>
        {ETAPES.map((e) => (
          <div key={e.n} style={card}>
            <div style={{ width: 34, height: 34, borderRadius: 9, background: 'var(--color-primary)', color: '#fff', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>{e.n}</div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: '0 0 6px' }}>{e.t}</h3>
            <p style={{ color: 'var(--color-text-soft)', fontSize: '0.92rem', lineHeight: 1.55, margin: 0 }}>{e.d}</p>
          </div>
        ))}
      </div>

      {/* Pourquoi différent */}
      <h2 style={{ fontSize: '1.5rem', fontWeight: 800, margin: '0 0 18px' }}>Pourquoi Autopulse est différent</h2>
      <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', marginBottom: 44 }}>
        {POURQUOI.map((p) => (
          <div key={p.t} style={card}>
            <div style={{ fontSize: '1.8rem', marginBottom: 8 }}>{p.ic}</div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: '0 0 6px' }}>{p.t}</h3>
            <p style={{ color: 'var(--color-text-soft)', fontSize: '0.92rem', lineHeight: 1.55, margin: 0 }}>{p.d}</p>
          </div>
        ))}
      </div>

      {/* Ce que vous suivez */}
      <h2 style={{ fontSize: '1.5rem', fontWeight: 800, margin: '0 0 18px' }}>Ce que vous suivez aujourd’hui</h2>
      <div style={{ ...card, marginBottom: 28 }}>
        <ul style={{ margin: 0, paddingLeft: 0, listStyle: 'none', display: 'grid', gap: 12 }}>
          {SUIVI.map((s) => (
            <li key={s} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', fontSize: '0.95rem', lineHeight: 1.5 }}>
              <span style={{ color: 'var(--color-primary)', fontWeight: 800 }}>✓</span><span>{s}</span>
            </li>
          ))}
        </ul>
        <div style={{ marginTop: 20 }}>
          <Link href="/outils/carnet-entretien" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'var(--color-primary)', color: '#fff', fontWeight: 800, fontSize: '0.95rem', borderRadius: 12, padding: '13px 22px', textDecoration: 'none' }}>
            Ouvrir mon carnet d’entretien →
          </Link>
        </div>
      </div>

      {/* Vision */}
      <blockquote style={{ borderLeft: '3px solid var(--color-primary)', margin: '32px 0 44px', padding: '6px 0 6px 20px', color: 'var(--color-text-soft)', fontSize: '1.08rem', lineHeight: 1.6, fontStyle: 'italic' }}>
        Un jour, chaque conducteur en Europe ouvre Autopulse avant un long trajet. Pas par obligation —
        parce qu’il lui apprend quelque chose qu’il ignorait. Ce jour-là, Autopulse n’est plus un logiciel :
        c’est la relation entre le conducteur et sa machine, enfin en équilibre.
      </blockquote>

      {/* FAQ */}
      <h2 style={{ fontSize: '1.5rem', fontWeight: 800, margin: '0 0 18px' }}>Questions fréquentes</h2>
      <div style={{ display: 'grid', gap: 12 }}>
        {FAQ.map((f) => (
          <details key={f.q} style={{ ...card, padding: '16px 20px' }}>
            <summary style={{ fontWeight: 700, cursor: 'pointer', fontSize: '0.98rem' }}>{f.q}</summary>
            <p style={{ color: 'var(--color-text-soft)', fontSize: '0.92rem', lineHeight: 1.6, margin: '10px 0 0' }}>{f.a}</p>
          </details>
        ))}
      </div>
    </main>
  )
}
