/**
 * Hub SEO /recharge-electrique
 * Page-pilier qui agrège tout l'écosystème recharge VE de moteurs.com.
 * SSG — server component, contenu éditorial riche + maillage interne.
 */

import type { Metadata } from 'next'
import Link from 'next/link'
import FaqAccordion from '@/components/FaqAccordion'
import { ENERGY_PRICES_FALLBACK } from '@/lib/tco'

const ANNEE = new Date().getFullYear()

export const metadata: Metadata = {
  title: `Recharge voiture électrique en ${ANNEE} : guide complet | Moteurs.com`,
  description:
    `Tarifs recharge VE par pays (France, Belgique, Suisse, Canada), domicile vs public, bornes AC/DC, cartes de recharge, installation, aides. Tout pour optimiser le coût de recharge en ${ANNEE}.`,
  openGraph: {
    title: 'Recharge électrique : guide & comparateur Moteurs.com',
    description: 'Tarifs, bornes, cartes, installation, aides — tout sur la recharge VE.',
    type: 'article',
  },
  alternates: { canonical: 'https://moteurs.com/recharge-electrique' },
}

export default function PageRechargeElectrique() {
  const tarifs = [
    { pays: 'France',     code: 'FR', drapeau: '🇫🇷', prix: ENERGY_PRICES_FALLBACK.FR.elec ?? 0.21 },
    { pays: 'Belgique',   code: 'BE', drapeau: '🇧🇪', prix: ENERGY_PRICES_FALLBACK.BE.elec ?? 0.30 },
    { pays: 'Suisse',     code: 'CH', drapeau: '🇨🇭', prix: ENERGY_PRICES_FALLBACK.CH.elec ?? 0.27 },
    { pays: 'Canada',     code: 'CA', drapeau: '🇨🇦', prix: ENERGY_PRICES_FALLBACK.CA.elec ?? 0.13 },
  ]

  const moyenneEU = (tarifs[0].prix + tarifs[1].prix + tarifs[2].prix) / 3

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
        <span>Recharge électrique</span>
      </nav>

      {/* Hero */}
      <header style={{ marginBottom: 32 }}>
        <div style={{ fontSize: '0.82rem', color: 'var(--color-primary)', fontWeight: 600, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Guide complet · Édition {ANNEE}
        </div>
        <h1 style={{ fontSize: 'clamp(1.7rem, 4vw, 2.5rem)', marginBottom: 14, lineHeight: 1.2 }}>
          Recharge voiture électrique : <span style={{ color: 'var(--color-primary)' }}>tarifs, bornes, cartes & aides</span>
        </h1>
        <p style={{ fontSize: '1rem', lineHeight: 1.65, maxWidth: 720, color: 'var(--color-text)' }}>
          Tout ce qu&apos;il faut savoir pour recharger sa voiture électrique en {ANNEE} : combien ça coûte selon
          le pays et le mode de recharge, quelle borne installer chez soi, quelle carte choisir pour les voyages,
          quelles aides demander. Données vérifiées et mises à jour mensuellement par notre Agent Simulateur.
        </p>
      </header>

      {/* Stats clés tarifs */}
      <section style={{ marginBottom: 40 }}>
        <h2 style={statH2}>Combien coûte 1 kWh de recharge en {ANNEE} ?</h2>
        <div style={{ display: 'grid', gap: 14, gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', marginBottom: 16 }}>
          {tarifs.map(t => (
            <div key={t.code} style={statCard}>
              <div style={{ fontSize: '1.8rem', marginBottom: 4 }}>{t.drapeau}</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>{t.pays}</div>
              <div style={{ fontSize: '1.3rem', fontWeight: 700, marginTop: 4 }}>{t.prix.toFixed(2)} €/kWh</div>
              <div style={{ fontSize: '0.74rem', color: 'var(--color-text-muted)', marginTop: 2 }}>
                ~{(t.prix * 60).toFixed(0)} € pour 60 kWh
              </div>
            </div>
          ))}
        </div>
        <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', lineHeight: 1.6 }}>
          Tarifs résidentiels de référence (heures pleines / tarif moyen). Une recharge complète de 60 kWh
          (autonomie ~350 km) revient en moyenne à <strong>{(moyenneEU * 60).toFixed(0)} €</strong> en Europe.
          Sur borne rapide publique (DC), comptez 2 à 3 fois plus.
        </p>
      </section>

      {/* Domicile vs public */}
      <section style={{ marginBottom: 40 }}>
        <h2 style={statH2}>Recharger à domicile ou sur le réseau public ?</h2>
        <div style={{ overflowX: 'auto', marginBottom: 16 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.92rem' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--color-border)' }}>
                <th style={th}>Critère</th>
                <th style={th}>Domicile (AC)</th>
                <th style={th}>Public lent (AC)</th>
                <th style={th}>Public rapide (DC)</th>
              </tr>
            </thead>
            <tbody>
              <tr style={tr}><td style={td}>Prix moyen</td><td style={td}>0,18-0,25 €/kWh</td><td style={td}>0,30-0,45 €/kWh</td><td style={td}>0,45-0,65 €/kWh</td></tr>
              <tr style={tr}><td style={td}>Puissance</td><td style={td}>2-22 kW</td><td style={td}>3-22 kW</td><td style={td}>50-350 kW</td></tr>
              <tr style={tr}><td style={td}>Temps (60 kWh)</td><td style={td}>3-12 h</td><td style={td}>3-8 h</td><td style={td}>20-45 min</td></tr>
              <tr style={tr}><td style={td}>Usage idéal</td><td style={td}>Quotidien, nuit</td><td style={td}>Travail, parking</td><td style={td}>Long trajet, vacances</td></tr>
              <tr style={tr}><td style={td}>Investissement initial</td><td style={td}>800-2 500 € (borne)</td><td style={td}>Aucun</td><td style={td}>Aucun</td></tr>
            </tbody>
          </table>
        </div>
        <p style={{ fontSize: '0.92rem', lineHeight: 1.65 }}>
          <strong>Règle d&apos;or :</strong> 80 % de votre recharge devrait se faire à domicile (ou au travail).
          Les bornes rapides publiques sont 2-3 fois plus chères et accélèrent l&apos;usure de la batterie ;
          réservez-les aux longs trajets.
        </p>
      </section>

      {/* Cartes de recharge */}
      <section style={{ marginBottom: 40, padding: 24, borderRadius: 14, background: 'rgba(122,240,194,0.05)', border: '1px solid rgba(122,240,194,0.2)' }}>
        <h2 style={{ ...statH2, marginTop: 0 }}>Quelle carte de recharge choisir ?</h2>
        <p style={{ fontSize: '0.95rem', lineHeight: 1.65, marginBottom: 16 }}>
          En Europe, plus de 25 cartes de recharge se partagent le marché : IONITY Motion, Chargemap, Plugsurfing,
          Shell Recharge, Izivia, Electra, Fastned, etc. Nos comparateurs détaillent les tarifs par pays
          pour chacune.
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
          <Link href="/outils/cartes-recharge" style={btnPrimaire}>
            🔌 Comparateur cartes de recharge →
          </Link>
          <Link href="/assistance/recharge" style={btnSecondaire}>
            🧮 Calculer mon coût annuel →
          </Link>
        </div>
      </section>

      {/* Bornes & autoroute */}
      <section style={{ marginBottom: 40 }}>
        <h2 style={statH2}>Recharger sur autoroute pendant les vacances</h2>
        <p style={{ fontSize: '0.95rem', lineHeight: 1.65, marginBottom: 16 }}>
          Sur les grands axes européens, la densité de bornes DC rapides est désormais suffisante pour
          n&apos;importe quel trajet vacances. Nos pages trajet calculent automatiquement le nombre
          d&apos;arrêts nécessaires selon l&apos;autonomie de votre véhicule (270 km réels sur autoroute en
          moyenne).
        </p>
        <div style={{ display: 'grid', gap: 10, gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
          {[
            { slug: 'belgique-cote-azur', label: 'Belgique → Côte d&apos;Azur' },
            { slug: 'france-costa-brava', label: 'France → Costa Brava' },
            { slug: 'pays-bas-lac-garde', label: 'Pays-Bas → Lac de Garde' },
            { slug: 'allemagne-algarve',  label: 'Allemagne → Algarve' },
          ].map(t => (
            <Link key={t.slug} href={`/trajet/${t.slug}/electrique`} style={carteLink}>
              <div style={{ fontWeight: 600, fontSize: '0.92rem' }} dangerouslySetInnerHTML={{ __html: '⚡ ' + t.label }} />
              <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', marginTop: 4 }}>
                Trajet en électrique — étapes & coût recharge
              </div>
            </Link>
          ))}
        </div>
        <p style={{ marginTop: 14 }}>
          <Link href="/comparer-trajet" style={lien}>Comparateur de trajet libre →</Link>
        </p>
      </section>

      {/* Installation à domicile */}
      <section style={{ marginBottom: 40 }}>
        <h2 style={statH2}>Installer une borne à domicile</h2>
        <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', marginBottom: 16 }}>
          <article style={infoCard}>
            <h3 style={infoH3}>🏠 Maison individuelle</h3>
            <p style={infoP}>
              Borne murale (wallbox) 7,4 kW ou 11 kW : 800-2 500 € installation comprise. Aucune autorisation
              nécessaire si vous êtes propriétaire. Crédit d&apos;impôt FR de 500 € sur la pose en {ANNEE}.
            </p>
          </article>
          <article style={infoCard}>
            <h3 style={infoH3}>🏢 Copropriété</h3>
            <p style={infoP}>
              Droit à la prise : tout copropriétaire peut faire installer une borne sur sa place. La
              copropriété ne peut s&apos;y opposer (loi LOM en France). Prime Advenir jusqu&apos;à 960 €.
            </p>
            <Link href="/article/article-recharge-copro" style={{ ...lien, fontSize: '0.85rem' }}>
              → Guide complet recharge en copropriété
            </Link>
          </article>
          <article style={infoCard}>
            <h3 style={infoH3}>🏬 Entreprise / flotte</h3>
            <p style={infoP}>
              Suramortissement de 40 % en France pour les bornes installées sur site (jusqu&apos;à fin {ANNEE}).
              Prime Advenir B2B jusqu&apos;à 2 100 € par point de charge accessible au public.
            </p>
          </article>
        </div>
      </section>

      {/* Aides */}
      <section style={{ marginBottom: 40 }}>
        <h2 style={statH2}>Aides à l&apos;installation en {ANNEE}</h2>
        <ul style={{ paddingLeft: 18, lineHeight: 1.8, fontSize: '0.95rem' }}>
          <li><strong>France</strong> — Crédit d&apos;impôt 500 € par borne (particuliers), Prime Advenir B2B jusqu&apos;à 2 100 €, TVA réduite 5,5 % pour installation pro.</li>
          <li><strong>Belgique</strong> — Déduction fiscale 30-45 % sur l&apos;installation jusqu&apos;à 3 750 € (Wallonie + Flandre), variable selon région.</li>
          <li><strong>Suisse</strong> — Subventions cantonales hétérogènes (Vaud, Genève actives) — jusqu&apos;à 1 500 CHF par borne.</li>
          <li><strong>Canada</strong> — iZEV programme fédéral + crédits provinciaux QC/BC pour bornes résidentielles (jusqu&apos;à 600 CAD).</li>
        </ul>
        <p style={{ marginTop: 12 }}>
          <Link href="/articles" style={lien}>Voir tous les articles aides &amp; primes →</Link>
        </p>
      </section>

      {/* FAQ */}
      <section style={{ marginTop: 48 }}>
        <FaqAccordion items={FAQ_RECHARGE} title="Questions fréquentes sur la recharge VE" />
      </section>

      {/* Maillage / CTA finale */}
      <section style={{ marginTop: 40, padding: 22, borderRadius: 14, background: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}>
        <h2 style={{ fontSize: '1.05rem', marginBottom: 12 }}>Outils & ressources liés</h2>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
          <Link href="/outils/cartes-recharge" style={btnSecondaire}>Comparateur cartes →</Link>
          <Link href="/assistance/recharge" style={btnSecondaire}>Assistance recharge →</Link>
          <Link href="/simulateur" style={btnSecondaire}>Simulateur TCO →</Link>
          <Link href="/comparer-trajet" style={btnSecondaire}>Comparateur trajet →</Link>
          <Link href="/trajet" style={btnSecondaire}>Trajets vacances →</Link>
        </div>
      </section>
    </main>
  )
}

// ─── FAQ ──────────────────────────────────────────────────────────────────────

const FAQ_RECHARGE = [
  {
    question: "Combien coûte une recharge complète à domicile en 2026 ?",
    answer:
      "Pour une batterie de 60 kWh (autonomie WLTP ~350 km), comptez environ 11 € en France au tarif réglementé heures pleines (0,21 €/kWh), 7,80 € si vous bénéficiez du tarif heures creuses (0,13 €/kWh). En Belgique : ~18 €. En Suisse : ~16 €. Une recharge complète à domicile reste 2 à 3 fois moins chère qu&apos;une recharge rapide publique.",
  },
  {
    question: "Quelle puissance de borne installer chez moi ?",
    answer:
      "Pour un usage quotidien (50-80 km/jour), une borne 7,4 kW (monophasée) suffit largement et recharge environ 40 km par heure. Si vous roulez beaucoup ou disposez d&apos;un raccordement triphasé, optez pour une borne 11 kW (60 km/h). La 22 kW est rarement utile pour un particulier — la plupart des voitures sont limitées à 11 kW en AC.",
  },
  {
    question: "Faut-il s&apos;abonner à un opérateur de recharge ?",
    answer:
      "Si vous rechargez surtout à domicile (≥ 80 % du temps) et faites quelques longs trajets par an : une carte sans abonnement type Chargemap Pass ou Shell Recharge suffit. Si vous parcourez +20 000 km/an avec usage régulier de bornes rapides : un abonnement (IONITY Motion, Fastned Gold, Electra) peut réduire le coût/kWh de 30-50 %. Notre comparateur affiche le seuil de rentabilité.",
  },
  {
    question: "L&apos;autonomie réelle est-elle proche du WLTP ?",
    answer:
      "Non. En cycle mixte réel, comptez 80-85 % du WLTP (350 km annoncés = 280-300 km en pratique). Sur autoroute à 130 km/h : 60-70 % du WLTP (350 km = 210-245 km). En hiver à -5 °C : 70-75 % du WLTP. Les voitures les plus efficientes en autoroute en 2026 : Tesla Model 3, Hyundai Ioniq 6, Mercedes EQE.",
  },
  {
    question: "Peut-on installer une borne en copropriété sans accord de l&apos;AG ?",
    answer:
      "En France, le « droit à la prise » (loi LOM 2019) autorise tout copropriétaire à faire installer une borne sur sa place, à ses frais, sans accord de l&apos;assemblée générale. Le syndic doit être informé. La prime Advenir couvre jusqu&apos;à 960 € de l&apos;installation. En Belgique et en Suisse, des dispositifs similaires existent. Voir notre guide détaillé recharge en copropriété.",
  },
  {
    question: "Recharger sur autoroute pendant les vacances : combien d&apos;arrêts ?",
    answer:
      "Pour une voiture avec batterie ~60 kWh (Tesla Model Y, Kia EV6, VW ID.4) et 270 km d&apos;autonomie réelle autoroute, comptez 1 arrêt tous les ~200 km de conduite continue (recharge 20 → 80 % en 25-30 min sur borne 150 kW). Sur un Paris-Nice (930 km) : 2-3 arrêts. Notre comparateur trajet calcule le détail pour chaque grand axe européen.",
  },
  {
    question: "Quelle aide fiscale pour la borne en France en 2026 ?",
    answer:
      "Pour les particuliers : crédit d&apos;impôt forfaitaire de 500 € par borne installée par un pro IRVE. Pour les entreprises : suramortissement de 40 % (déduction fiscale supplémentaire) sur le prix de la borne, jusqu&apos;à fin 2026. Pour les bornes accessibles au public (parkings d&apos;entreprises, commerces) : prime Advenir B2B de 1 000 à 2 100 € selon puissance.",
  },
]

// ─── JSON-LD ──────────────────────────────────────────────────────────────────

function buildJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        '@id': 'https://moteurs.com/recharge-electrique',
        url: 'https://moteurs.com/recharge-electrique',
        name: `Recharge voiture électrique : guide complet ${ANNEE}`,
        description: `Tarifs recharge VE par pays, domicile vs public, bornes AC/DC, cartes, aides — guide ${ANNEE}.`,
        about: {
          '@type': 'Thing',
          name: 'Recharge véhicule électrique',
        },
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Accueil',              item: 'https://moteurs.com/' },
          { '@type': 'ListItem', position: 2, name: 'Recharge électrique', item: 'https://moteurs.com/recharge-electrique' },
        ],
      },
      {
        '@type': 'ItemList',
        name: 'Outils et ressources recharge VE',
        itemListElement: [
          { '@type': 'ListItem', position: 1, url: 'https://moteurs.com/outils/cartes-recharge',  name: 'Comparateur cartes de recharge' },
          { '@type': 'ListItem', position: 2, url: 'https://moteurs.com/assistance/recharge',     name: 'Assistance recharge VE' },
          { '@type': 'ListItem', position: 3, url: 'https://moteurs.com/comparer-trajet',         name: 'Comparateur de trajet' },
          { '@type': 'ListItem', position: 4, url: 'https://moteurs.com/trajet',                   name: 'Itinéraires vacances décryptés' },
          { '@type': 'ListItem', position: 5, url: 'https://moteurs.com/simulateur',               name: 'Simulateur TCO' },
        ],
      },
    ],
  }
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const lienMuted: React.CSSProperties = { color: 'var(--color-text-muted)', textDecoration: 'none' }
const lien: React.CSSProperties = { color: 'var(--color-primary)', textDecoration: 'none', fontWeight: 600 }
const statH2: React.CSSProperties = { fontSize: '1.3rem', marginBottom: 16, marginTop: 0 }
const statCard: React.CSSProperties = {
  background: 'var(--color-bg-card)', border: '1px solid var(--color-border)',
  borderRadius: 12, padding: 16, textAlign: 'center',
}
const th: React.CSSProperties = { padding: '10px 12px', textAlign: 'left', color: 'var(--color-text-muted)', fontWeight: 600 }
const tr: React.CSSProperties = { borderBottom: '1px solid var(--color-border)' }
const td: React.CSSProperties = { padding: '10px 12px' }
const infoCard: React.CSSProperties = {
  background: 'var(--color-bg-card)', border: '1px solid var(--color-border)',
  borderRadius: 12, padding: 18,
}
const infoH3: React.CSSProperties = { fontSize: '1rem', margin: 0, marginBottom: 8 }
const infoP: React.CSSProperties = { fontSize: '0.88rem', lineHeight: 1.6, margin: 0, color: 'var(--color-text)' }
const carteLink: React.CSSProperties = {
  display: 'block', padding: 14, borderRadius: 10,
  background: 'var(--color-bg-card)', border: '1px solid var(--color-border)',
  textDecoration: 'none', color: 'var(--color-text)',
}
const btnPrimaire: React.CSSProperties = {
  padding: '10px 20px', borderRadius: 10, fontSize: '0.92rem', fontWeight: 600,
  background: 'var(--color-primary)', color: 'var(--color-bg)',
  textDecoration: 'none',
}
const btnSecondaire: React.CSSProperties = {
  padding: '8px 14px', borderRadius: 10, fontSize: '0.88rem',
  background: 'transparent', border: '1px solid var(--color-border)',
  color: 'var(--color-text)', textDecoration: 'none',
}
