/**
 * Hub SEO /vacances-voiture
 * Pillar page qui agrège tout l'écosystème "vacances en voiture" de moteurs.com.
 * SSG — pic saisonnier juin-août, à indexer dès que possible.
 */

import type { Metadata } from 'next'
import Link from 'next/link'
import FaqAccordion from '@/components/FaqAccordion'
import { TRAJETS_SEO } from '@/lib/trajets-seo'
import { PAYS_LEGAL } from '@/lib/legal-pays'

const ANNEE = new Date().getFullYear()

export const metadata: Metadata = {
  title: `Vacances en voiture ${ANNEE} : itinéraires, coûts, péages, vignettes | Moteurs.com`,
  description:
    `Préparer ses vacances en voiture en ${ANNEE} : 15 grands trajets européens décryptés, ` +
    `comparateur de coût par motorisation, vignettes, checklist de départ, constat amiable. ` +
    `Tout l'écosystème vacances de Moteurs.com en une page.`,
  openGraph: {
    title: `Vacances en voiture ${ANNEE} — Moteurs.com`,
    description:
      'Itinéraires européens, coût par motorisation, péages, vignettes, recharge VE, checklist départ.',
    type: 'article',
  },
  alternates: { canonical: 'https://moteurs.com/vacances-voiture' },
}

export default function PageVacancesVoiture() {
  // Sélection des 8 trajets les plus populaires (difficulté Élevée ou Moyenne)
  const trajetsVedettes = TRAJETS_SEO
    .filter(t => t.difficulte === 'Élevée' || t.difficulte === 'Moyenne')
    .slice(0, 8)

  // Pays imposant une vignette (utile au hub légal)
  const paysAvecVignette = Object.values(PAYS_LEGAL).filter(p => p.vignette.required)

  return (
    <main className="container" style={{ paddingTop: 36, paddingBottom: 64 }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(buildJsonLd()) }}
      />

      {/* Fil d'Ariane */}
      <nav style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', marginBottom: 22 }}>
        <Link href="/" style={lienMuted}>Accueil</Link>
        {' / '}
        <span>Vacances en voiture</span>
      </nav>

      {/* Hero */}
      <header style={{ marginBottom: 32 }}>
        <div style={{ fontSize: '0.82rem', color: 'var(--color-primary)', fontWeight: 600, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Guide complet · Été {ANNEE}
        </div>
        <h1 style={{ fontSize: 'clamp(1.7rem, 4vw, 2.5rem)', marginBottom: 14, lineHeight: 1.2 }}>
          Vacances en voiture : <span style={{ color: 'var(--color-primary)' }}>itinéraires, coûts, péages & légal</span>
        </h1>
        <p style={{ fontSize: '1rem', lineHeight: 1.65, maxWidth: 720, color: 'var(--color-text)' }}>
          Préparer ses vacances en voiture en {ANNEE} : calcul du coût exact par motorisation, vignettes
          obligatoires par pays traversé, comparateur d&apos;itinéraires, checklist de départ, recharge
          électrique sur autoroute, constat amiable européen. Tout ce qu&apos;il faut, en un endroit.
        </p>
      </header>

      {/* Stats clés */}
      <section style={{ marginBottom: 40 }}>
        <div style={{ display: 'grid', gap: 14, gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
          <Stat valeur="27 M" label="Français en voiture l&apos;été" />
          <Stat valeur="1 200 km" label="Trajet vacances moyen" />
          <Stat valeur="60-160 €" label="Péages aller selon route" />
          <Stat valeur="15" label="Grands axes décryptés" />
        </div>
      </section>

      {/* Section : préparer son trajet */}
      <section style={{ marginBottom: 40 }}>
        <h2 style={h2}>1. Préparer son itinéraire</h2>
        <p style={paraIntro}>
          Trois outils complémentaires selon votre besoin : un trajet libre (vous saisissez départ &amp;
          arrivée), un trajet pré-décrypté (les 15 grands axes européens) ou un assistant qui choisit
          pour vous.
        </p>

        <div style={{ display: 'grid', gap: 14, gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', marginBottom: 24 }}>
          <CarteOutil
            href="/comparer-trajet"
            titre="Comparateur de trajet"
            description="Calculez le coût exact par motorisation pour n&apos;importe quel itinéraire européen. Péages, recharge, étapes."
            cta="Lancer le comparateur"
          />
          <CarteOutil
            href="/trajet"
            titre="15 trajets décryptés"
            description="Belgique → Côte d&apos;Azur, Pays-Bas → Lac de Garde, France → Costa Brava... chaque trajet a sa page dédiée."
            cta="Voir les itinéraires"
          />
          <CarteOutil
            href="/assistant-vacances"
            titre="Assistant vacances"
            description="Répondez à 3 questions, on vous propose l&apos;itinéraire, la motorisation et le budget adaptés."
            cta="Démarrer l&apos;assistant"
          />
        </div>

        {/* Échantillon des 15 trajets */}
        <h3 style={h3}>Trajets vedettes</h3>
        <div style={{ display: 'grid', gap: 10, gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
          {trajetsVedettes.map(t => (
            <Link key={t.slug} href={`/trajet/${t.slug}`} style={carteLink}>
              <div style={{ fontSize: '1.4rem', marginBottom: 6 }}>{t.emoji}</div>
              <div style={{ fontWeight: 600, fontSize: '0.92rem' }}>{t.titre_court}</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', marginTop: 4 }}>
                {t.distance_km} km · {t.pays_traverses.length} pays
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Section : avant de partir */}
      <section style={{ marginBottom: 40 }}>
        <h2 style={h2}>2. Avant le départ</h2>
        <div style={{ display: 'grid', gap: 14, gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
          <CarteOutil
            href="/checklist-depart"
            titre="Checklist complète"
            description="Documents, équipement véhicule, vignettes, pharmacie, enfants, VE... 7 catégories à cocher."
            cta="Voir la checklist"
          />
          <CarteOutil
            href="/constat"
            titre="Constat amiable européen"
            description="Constat numérique multilingue prêt à imprimer, valable dans toute l&apos;UE. Export PDF + envoi par email."
            cta="Préparer mon constat"
          />
          <CarteOutil
            href="/recharge-electrique"
            titre="Recharge électrique"
            description="Si vous partez en VE : tarifs par pays, cartes de recharge, étapes de recharge sur autoroute."
            cta="Guide recharge"
          />
        </div>
      </section>

      {/* Section : pendant le trajet */}
      <section style={{ marginBottom: 40 }}>
        <h2 style={h2}>3. Pendant le trajet</h2>
        <div style={{ display: 'grid', gap: 14, gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
          <CarteOutil
            href="/assistance/meteo"
            titre="Météo trajet"
            description="Prévisions point par point sur votre itinéraire, alertes vigilance, recommandations selon météo."
            cta="Météo en temps réel"
          />
          <CarteOutil
            href="/assistant-depannage"
            titre="Scan voyant véhicule"
            description="Photographiez un voyant ou symptôme — diagnostic IA immédiat (peut rouler ? attention ? stop ?)."
            cta="Diagnostiquer"
          />
          <CarteOutil
            href="/assistance/panne"
            titre="En cas de panne"
            description="Numéros d&apos;urgence et de dépannage par pays. Démarches assurance assistance."
            cta="Que faire ?"
          />
        </div>
      </section>

      {/* Section : légal — vignettes & ZFE */}
      <section style={{ marginBottom: 40 }}>
        <h2 style={h2}>4. Légal : vignettes et ZFE par pays</h2>
        <p style={paraIntro}>
          Quatre pays européens imposent une vignette autoroutière. Achetez-les en ligne avant le départ
          pour éviter les files aux frontières et les amendes en cas d&apos;oubli.
        </p>
        <div style={{ display: 'grid', gap: 14, gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
          {paysAvecVignette.map(p => (
            <article key={p.code} style={vignetteCard}>
              <div style={{ fontSize: '1.6rem', marginBottom: 6 }}>{p.drapeau}</div>
              <div style={{ fontWeight: 700, marginBottom: 4 }}>{p.nom}</div>
              {p.vignette.prix_courte != null ? (
                <div style={{ fontSize: '0.92rem' }}>
                  {p.vignette.prix_courte} € ({p.vignette.duree_courte})
                </div>
              ) : (
                <div style={{ fontSize: '0.92rem' }}>
                  {p.vignette.prix_annuelle} € (annuelle)
                </div>
              )}
              {p.vignette.url && (
                <a href={p.vignette.url} target="_blank" rel="noopener noreferrer" style={{ ...lien, fontSize: '0.82rem', display: 'inline-block', marginTop: 6 }}>
                  Achat officiel ↗
                </a>
              )}
            </article>
          ))}
        </div>
        <p style={{ marginTop: 14, fontSize: '0.9rem' }}>
          Voir le détail réglementaire complet (vitesses, équipements, ZFE, alcoolémie) sur la page
          de chaque trajet — par exemple <Link href="/trajet/belgique-cote-azur" style={lien}>Belgique → Côte d&apos;Azur</Link>.
        </p>
      </section>

      {/* FAQ */}
      <section style={{ marginTop: 48 }}>
        <FaqAccordion items={FAQ_VACANCES} title="Vacances en voiture : questions fréquentes" />
      </section>

      {/* CTA finale */}
      {/* Voir aussi : maillage inter-hubs */}
      <section style={{ marginTop: 48, paddingTop: 32, borderTop: '1px solid var(--color-border)' }}>
        <h2 style={{ fontSize: '1.15rem', marginBottom: 14 }}>Voir aussi dans nos guides</h2>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', marginBottom: 18, lineHeight: 1.5 }}>
          Quatre autres dossiers complets pour aller plus loin sur la voiture en 2026.
        </p>
        <div style={{ display: 'grid', gap: 14, gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
          <a href="/recharge-electrique" style={{
            display: 'block', padding: 16, borderRadius: 12,
            background: 'var(--color-bg)', border: '1px solid var(--color-border)',
            textDecoration: 'none', color: 'var(--color-text)',
          }}>
            <div style={{ fontSize: '1.4rem', marginBottom: 6 }}>🔌</div>
            <div style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: 4 }}>Recharge électrique</div>
            <div style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', lineHeight: 1.5 }}>Tarifs par pays, cartes, bornes, installation à domicile, aides.</div>
          </a>
          <a href="/cout-voiture" style={{
            display: 'block', padding: 16, borderRadius: 12,
            background: 'var(--color-bg)', border: '1px solid var(--color-border)',
            textDecoration: 'none', color: 'var(--color-text)',
          }}>
            <div style={{ fontSize: '1.4rem', marginBottom: 6 }}>💰</div>
            <div style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: 4 }}>Coût voiture (TCO)</div>
            <div style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', lineHeight: 1.5 }}>TCO 5 ans par motorisation et par pays, méthode complète.</div>
          </a>
          <a href="/depannage" style={{
            display: 'block', padding: 16, borderRadius: 12,
            background: 'var(--color-bg)', border: '1px solid var(--color-border)',
            textDecoration: 'none', color: 'var(--color-text)',
          }}>
            <div style={{ fontSize: '1.4rem', marginBottom: 6 }}>🔧</div>
            <div style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: 4 }}>Dépannage</div>
            <div style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', lineHeight: 1.5 }}>Numéros urgence par pays, scan voyant, constat européen.</div>
          </a>
          <a href="/documents-auto" style={{
            display: 'block', padding: 16, borderRadius: 12,
            background: 'var(--color-bg)', border: '1px solid var(--color-border)',
            textDecoration: 'none', color: 'var(--color-text)',
          }}>
            <div style={{ fontSize: '1.4rem', marginBottom: 6 }}>📄</div>
            <div style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: 4 }}>Documents auto</div>
            <div style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', lineHeight: 1.5 }}>Carte grise, permis international, assurance, contrôle technique.</div>
          </a>
        </div>
      </section>

            <section style={{ marginTop: 40, padding: 22, borderRadius: 14, background: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}>
        <h2 style={{ fontSize: '1.05rem', marginBottom: 12 }}>Continuer votre préparation</h2>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
          <Link href="/trajet" style={btnSecondaire}>15 trajets décryptés →</Link>
          <Link href="/comparer-trajet" style={btnSecondaire}>Comparateur libre →</Link>
          <Link href="/recharge-electrique" style={btnSecondaire}>Recharge VE →</Link>
          <Link href="/simulateur" style={btnSecondaire}>Simulateur TCO →</Link>
          <Link href="/constat" style={btnSecondaire}>Constat européen →</Link>
        </div>
      </section>
    </main>
  )
}

// ─── Composants ────────────────────────────────────────────────────────────────

function Stat({ valeur, label }: { valeur: string; label: string }) {
  return (
    <div style={{
      background: 'var(--color-bg-card)', border: '1px solid var(--color-border)',
      borderRadius: 12, padding: 16, textAlign: 'center',
    }}>
      <div style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--color-primary)' }}>{valeur}</div>
      <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', marginTop: 4 }} dangerouslySetInnerHTML={{ __html: label }} />
    </div>
  )
}

function CarteOutil({ href, titre, description, cta }: { href: string; titre: string; description: string; cta: string }) {
  return (
    <Link href={href} style={{
      display: 'block', padding: 18, borderRadius: 12,
      background: 'var(--color-bg-card)', border: '1px solid var(--color-border)',
      textDecoration: 'none', color: 'var(--color-text)',
    }}>
      <h3 style={{ fontSize: '1rem', margin: 0, marginBottom: 8 }} dangerouslySetInnerHTML={{ __html: titre }} />
      <p style={{ fontSize: '0.88rem', lineHeight: 1.55, color: 'var(--color-text-muted)', margin: 0, marginBottom: 12 }} dangerouslySetInnerHTML={{ __html: description }} />
      <span style={{ color: 'var(--color-primary)', fontSize: '0.85rem', fontWeight: 600 }} dangerouslySetInnerHTML={{ __html: cta + ' →' }} />
    </Link>
  )
}

// ─── FAQ ──────────────────────────────────────────────────────────────────────

const FAQ_VACANCES = [
  {
    question: "Quel est le meilleur jour pour partir en vacances en voiture en 2026 ?",
    answer:
      "Pour éviter les bouchons en France, partez un dimanche matin tôt (avant 5 h) ou un mardi en milieu d&apos;après-midi. Évitez à tout prix les samedis classés rouge ou noir par Bison Futé (1ᵉʳ et 8 août notamment). Les départs en soirée (après 20 h) fonctionnent aussi bien si vos enfants peuvent dormir en voiture.",
  },
  {
    question: "Quel est le coût moyen d&apos;un trajet vacances en voiture ?",
    answer:
      "Pour un trajet de 1 200 km (moyenne nationale), comptez 130 à 180 € de carburant en diesel/essence, plus 60 à 120 € de péages selon la route, soit 200 à 300 € aller-retour. En électrique, le carburant chute à 50-80 € en recharge mixte domicile/autoroute, soit 110 à 180 € aller-retour péages compris. Notre comparateur de trajet calcule le coût exact selon votre véhicule.",
  },
  {
    question: "Quelles vignettes acheter pour traverser l&apos;Europe en voiture ?",
    answer:
      "Quatre pays imposent une vignette autoroutière : Suisse (40 CHF annuelle), Autriche (12,40 € pour 10 jours), Slovénie (16 € pour 7 jours), République tchèque. La Croatie et la Hongrie utilisent des péages classiques. Achetez les vignettes en ligne avant le départ — le risque d&apos;amende sans vignette est de 200 à 800 € selon le pays.",
  },
  {
    question: "Peut-on faire un long trajet vacances en voiture électrique sans souci ?",
    answer:
      "Oui sans difficulté en 2026 sur les grands axes européens. Une voiture électrique moderne (Tesla, Kia EV6, Hyundai Ioniq 5, VW ID.4) avec 60-80 kWh de batterie permet de rouler 250-280 km à 130 km/h, puis 25-30 minutes de recharge rapide DC. Sur Paris-Nice (930 km), comptez 2 à 3 arrêts soit 1 h 30 de pauses recharge — souvent du même ordre que ce qu&apos;une famille ferait de toute façon.",
  },
  {
    question: "Comment éviter les péages en France pour les vacances ?",
    answer:
      "Activez l&apos;option « éviter péages » dans Waze ou Google Maps. Économie : 60 à 150 € sur un long trajet. Coût : 1 à 2 h supplémentaires et un confort moindre (nationales, traversées de villes, ronds-points). Stratégie mixte intelligente : autoroute le matin pour les longues étapes, nationales l&apos;après-midi pour les paysages et pauses.",
  },
  {
    question: "Faut-il un constat amiable européen spécifique ?",
    answer:
      "Le constat amiable européen est multilingue et valide dans tous les pays de l&apos;UE. Vous pouvez le télécharger gratuitement, le remplir à l&apos;avance avec vos coordonnées, et le glisser dans la boîte à gants. Notre outil constat propose un wizard guidé en 8 étapes, avec export PDF et envoi par email — vous gagnez 20 minutes en cas d&apos;accident.",
  },
  {
    question: "Quel équipement obligatoire dans la voiture pour traverser l&apos;Europe ?",
    answer:
      "Le minimum partout : triangle de signalisation, gilet fluorescent (1 par personne en France, sinon 1 minimum), trousse de premiers secours (obligatoire en Allemagne et Autriche), permis de conduire, certificat d&apos;immatriculation, attestation d&apos;assurance. En montagne (loi Montagne France, Italie, Autriche) : chaînes neige ou pneus hiver sont obligatoires d&apos;octobre/novembre à avril selon les pays.",
  },
]

// ─── JSON-LD ──────────────────────────────────────────────────────────────────

function buildJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        '@id': 'https://moteurs.com/vacances-voiture',
        url: 'https://moteurs.com/vacances-voiture',
        name: `Vacances en voiture ${ANNEE} : guide complet`,
        description: `Itinéraires européens, coût par motorisation, péages, vignettes, recharge VE, checklist départ — guide vacances voiture ${ANNEE}.`,
        about: { '@type': 'Thing', name: 'Vacances en voiture' },
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Accueil',             item: 'https://moteurs.com/' },
          { '@type': 'ListItem', position: 2, name: 'Vacances en voiture', item: 'https://moteurs.com/vacances-voiture' },
        ],
      },
      {
        '@type': 'ItemList',
        name: 'Outils et ressources vacances en voiture',
        itemListElement: [
          { '@type': 'ListItem', position: 1, url: 'https://moteurs.com/trajet',               name: '15 trajets vacances décryptés' },
          { '@type': 'ListItem', position: 2, url: 'https://moteurs.com/comparer-trajet',      name: 'Comparateur de trajet libre' },
          { '@type': 'ListItem', position: 3, url: 'https://moteurs.com/assistant-vacances',   name: 'Assistant vacances' },
          { '@type': 'ListItem', position: 4, url: 'https://moteurs.com/checklist-depart',     name: 'Checklist de départ' },
          { '@type': 'ListItem', position: 5, url: 'https://moteurs.com/constat',              name: 'Constat amiable européen' },
          { '@type': 'ListItem', position: 6, url: 'https://moteurs.com/recharge-electrique',  name: 'Recharge électrique en voyage' },
        ],
      },
    ],
  }
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const lienMuted: React.CSSProperties = { color: 'var(--color-text-muted)', textDecoration: 'none' }
const lien: React.CSSProperties = { color: 'var(--color-primary)', textDecoration: 'none', fontWeight: 600 }
const h2: React.CSSProperties = { fontSize: '1.3rem', marginBottom: 12, marginTop: 0 }
const h3: React.CSSProperties = { fontSize: '1rem', color: 'var(--color-text-muted)', marginBottom: 12, marginTop: 22 }
const paraIntro: React.CSSProperties = { fontSize: '0.95rem', lineHeight: 1.65, color: 'var(--color-text)', marginBottom: 20, maxWidth: 720 }
const carteLink: React.CSSProperties = {
  display: 'block', padding: 14, borderRadius: 10,
  background: 'var(--color-bg-card)', border: '1px solid var(--color-border)',
  textDecoration: 'none', color: 'var(--color-text)',
}
const vignetteCard: React.CSSProperties = {
  background: 'var(--color-bg-card)', border: '1px solid var(--color-border)',
  borderRadius: 12, padding: 16,
}
const btnSecondaire: React.CSSProperties = {
  padding: '8px 14px', borderRadius: 10, fontSize: '0.88rem',
  background: 'transparent', border: '1px solid var(--color-border)',
  color: 'var(--color-text)', textDecoration: 'none',
}
