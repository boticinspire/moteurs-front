/**
 * Hub SEO /documents-auto
 * Pillar page sur tous les documents administratifs liés à la voiture :
 * carte grise, permis, assurance, contrôle technique.
 */

import type { Metadata } from 'next'
import Link from 'next/link'
import FaqAccordion from '@/components/FaqAccordion'

const ANNEE = new Date().getFullYear()

export const metadata: Metadata = {
  title: `Documents auto en ${ANNEE} : carte grise, permis, assurance | Moteurs.com`,
  description:
    `Tous les papiers obligatoires pour rouler en ${ANNEE} : carte grise (France, Belgique, Suisse, Canada), ` +
    `permis de conduire, assurance et carte verte, contrôle technique. Outils d'immatriculation et ` +
    `convertisseur technique (kW, ch, autonomie batterie, malus CO₂).`,
  openGraph: {
    title: `Documents auto ${ANNEE} — Moteurs.com`,
    description: 'Carte grise, permis, assurance, contrôle technique : tout sur les papiers de votre voiture.',
    type: 'article',
  },
  alternates: { canonical: 'https://moteurs.com/documents-auto' },
}

export default function PageDocumentsAuto() {
  return (
    <main className="container" style={{ paddingTop: 36, paddingBottom: 64 }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(buildJsonLd()) }}
      />

      <nav className="hub-breadcrumb-dark" style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', marginBottom: 22 }}>
        <Link href="/" style={lienMuted}>Accueil</Link>
        {' / '}
        <span>Documents auto</span>
      </nav>

      {/* Hero */}
      <header className="hub-hero-dark" style={{ marginBottom: 32 }}>
        <div style={{ fontSize: '0.82rem', color: 'var(--color-primary)', fontWeight: 600, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Guide papiers véhicule · {ANNEE}
        </div>
        <h1 style={{ fontSize: 'clamp(1.7rem, 4vw, 2.5rem)', marginBottom: 14, lineHeight: 1.2 }}>
          Documents auto : <span style={{ color: 'var(--color-primary)' }}>carte grise, permis, assurance</span>
        </h1>
        <p style={{ fontSize: '1rem', lineHeight: 1.65, maxWidth: 720 }}>
          Tous les papiers obligatoires pour rouler en règle en {ANNEE} : carte grise (certificat
          d&apos;immatriculation) selon votre pays, permis de conduire et ses équivalences à l&apos;étranger,
          assurance et carte verte, contrôle technique. Avec nos outils d&apos;immatriculation et de conversion
          de plaques.
        </p>
      </header>

      {/* Documents indispensables — checklist */}
      <section style={{ marginBottom: 40 }}>
        <h2 style={h2}>À bord en permanence — la check-list</h2>
        <div style={{ display: 'grid', gap: 14, gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
          <Doc
            icone="🪪"
            titre="Permis de conduire"
            description="En cours de validité, catégorie adaptée au véhicule. Le permis dématérialisé France Identité est accepté."
          />
          <Doc
            icone="🚗"
            titre="Certificat d&apos;immatriculation"
            description="La fameuse carte grise. Doit correspondre au véhicule conduit. Original obligatoire (pas de copie)."
          />
          <Doc
            icone="🛡️"
            titre="Attestation d&apos;assurance"
            description="L&apos;auto-collant pare-brise + le papier vert. Carte verte obligatoire pour passer la frontière."
          />
          <Doc
            icone="✅"
            titre="Contrôle technique"
            description="À jour. Tolérance 2 mois après la date limite. Sticker apposé sur le pare-brise en France."
          />
        </div>
      </section>

      {/* Outils principaux */}
      <section style={{ marginBottom: 40 }}>
        <h2 style={h2}>Outils Moteurs.com</h2>
        <div style={{ display: 'grid', gap: 14, gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
          <CarteOutil
            href="/outils/immatriculation-france"
            titre="Immatriculation France"
            description="Décrypter une plaque SIV (AA-123-AA), trouver le département d&apos;émission, vérifier un véhicule, comprendre le format."
            cta="Outil immatriculation FR"
          />
          <CarteOutil
            href="/outils/immatriculation-belgique"
            titre="Immatriculation Belgique"
            description="Plaques rouges (administratives) vs ordinaires, format 1-ABC-123, conditions d&apos;import et d&apos;immatriculation."
            cta="Outil immatriculation BE"
          />
          <CarteOutil
            href="/outils/convertisseur"
            titre="Convertisseur technique"
            description="kW ↔ ch (CV), Nm ↔ lb·ft, autonomie batterie selon température, malus CO₂ France 2026."
            cta="Ouvrir le convertisseur"
          />
        </div>
      </section>

      {/* Carte grise par pays */}
      <section style={{ marginBottom: 40 }}>
        <h2 style={h2}>Le certificat d&apos;immatriculation par pays</h2>
        <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))' }}>
          <article style={infoCard}>
            <h3 style={infoH3}>🇫🇷 France — Carte grise</h3>
            <ul style={infoList}>
              <li>Demande sur ANTS (Agence nationale des titres sécurisés)</li>
              <li>Coût : taxe régionale variable (10-60 € / CV)</li>
              <li>Délai : 7-15 jours en ligne, 1 mois max</li>
              <li>Plaque format SIV (AA-123-AA) depuis 2009</li>
              <li>Conversion FNI → SIV obligatoire si carte modifiée</li>
            </ul>
            <Link href="/outils/immatriculation-france" style={{ ...lien, fontSize: '0.85rem', display: 'block', marginTop: 10 }}>
              Outil immatriculation France →
            </Link>
          </article>
          <article style={infoCard}>
            <h3 style={infoH3}>🇧🇪 Belgique — Certificat d&apos;immatriculation</h3>
            <ul style={infoList}>
              <li>Démarche en agence ou par courrier (DIV)</li>
              <li>Coût : 30 € + taxes régionales</li>
              <li>Plaque rouge sur fond blanc (1-ABC-123)</li>
              <li>Délai : 2-4 semaines</li>
              <li>Carte d&apos;identité belge requise</li>
            </ul>
            <Link href="/outils/immatriculation-belgique" style={{ ...lien, fontSize: '0.85rem', display: 'block', marginTop: 10 }}>
              Outil immatriculation Belgique →
            </Link>
          </article>
          <article style={infoCard}>
            <h3 style={infoH3}>🇨🇭 Suisse — Permis de circulation</h3>
            <ul style={infoList}>
              <li>Demande au service des automobiles cantonal</li>
              <li>Coût cantonal : 40-80 CHF</li>
              <li>Délai : immédiat sur place</li>
              <li>Plaques attribuées par canton (lettres avant chiffres)</li>
              <li>Expertise véhicule obligatoire (200-400 CHF)</li>
            </ul>
          </article>
          <article style={infoCard}>
            <h3 style={infoH3}>🇨🇦 Canada — Immatriculation</h3>
            <ul style={infoList}>
              <li>Compétence provinciale (SAAQ au QC, ICBC en CB)</li>
              <li>Coût : 50-200 CAD/an selon province</li>
              <li>Renouvellement annuel ou tous les 2 ans</li>
              <li>Plaque alphanumérique variable selon province</li>
              <li>Inspection mécanique parfois requise (véhicule occasion)</li>
            </ul>
          </article>
        </div>
      </section>

      {/* Permis de conduire */}
      <section style={{ marginBottom: 40 }}>
        <h2 style={h2}>Permis de conduire</h2>
        <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))' }}>
          <article style={infoCard}>
            <h3 style={infoH3}>Validité et renouvellement</h3>
            <p style={infoP}>
              En France, le permis B est valable 15 ans pour le support physique (renouvellement
              administratif simple, pas d&apos;examen), à vie pour le droit de conduire. Au-delà
              de 75 ans, visite médicale tous les 5 ans dans certains pays voisins (BE, IT).
            </p>
          </article>
          <article style={infoCard}>
            <h3 style={infoH3}>Permis international</h3>
            <p style={infoP}>
              Gratuit en France via l&apos;ANTS. Délai : 3-4 mois. Indispensable pour conduire hors
              UE/EEE (USA, Maroc, Thaïlande...). En UE, votre permis national suffit. Validité
              3 ans, accompagne TOUJOURS votre permis original.
            </p>
          </article>
          <article style={infoCard}>
            <h3 style={infoH3}>Équivalences UE</h3>
            <p style={infoP}>
              Tout permis délivré dans l&apos;UE/EEE est reconnu dans les 27 pays. Pas d&apos;échange
              obligatoire si vous déménagez. Cependant, après 2 ans de résidence dans un autre
              pays UE, vous pouvez échanger pour le permis local (utile pour le format).
            </p>
          </article>
        </div>
      </section>

      {/* Assurance / carte verte */}
      <section style={{ marginBottom: 40 }}>
        <h2 style={h2}>Assurance et carte verte</h2>
        <p style={paraIntro}>
          L&apos;assurance auto au tiers est obligatoire dans toute l&apos;Europe. Depuis 2020,
          la carte verte n&apos;est plus exigée à la frontière intra-UE (plaque européenne suffit),
          mais elle reste utile en cas de contrôle ou d&apos;accident.
        </p>
        <ul style={{ paddingLeft: 18, lineHeight: 1.8, fontSize: '0.95rem' }}>
          <li><strong>Au tiers</strong> — couvre les dommages causés à autrui. Minimum légal partout.</li>
          <li><strong>Tiers + vol/incendie</strong> — recommandé après 5 ans de véhicule.</li>
          <li><strong>Tous risques</strong> — couvre vos propres dommages. Indispensable pour un véhicule neuf ou financé.</li>
          <li><strong>Assistance</strong> — voir notre <Link href="/depannage" style={lien}>hub dépannage</Link> pour comprendre les niveaux.</li>
        </ul>
      </section>

      {/* Contrôle technique */}
      <section style={{ marginBottom: 40 }}>
        <h2 style={h2}>Contrôle technique</h2>
        <div style={{ display: 'grid', gap: 14, gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
          <Doc
            icone="🇫🇷"
            titre="France"
            description="1er CT à 4 ans, puis tous les 2 ans. ~80 €. Contre-visite : 4-5 défaillances majeures à corriger sous 2 mois."
          />
          <Doc
            icone="🇧🇪"
            titre="Belgique"
            description="1er CT à 4 ans, ensuite tous les ans pour les véhicules de plus de 4 ans. ~40 €."
          />
          <Doc
            icone="🇨🇭"
            titre="Suisse"
            description="1er à 4 ans, puis 3 ans, puis 2 ans. Service cantonal des automobiles. ~70 CHF."
          />
          <Doc
            icone="🇨🇦"
            titre="Canada"
            description="Pas de CT obligatoire au QC. ON et autres provinces : inspection lors de la revente uniquement."
          />
        </div>
      </section>

      {/* FAQ */}
      <section style={{ marginTop: 48 }}>
        <FaqAccordion items={FAQ_DOCS} title="Documents auto : questions fréquentes" />
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
          <a href="/vacances-voiture" style={{
            display: 'block', padding: 16, borderRadius: 12,
            background: 'var(--color-bg)', border: '1px solid var(--color-border)',
            textDecoration: 'none', color: 'var(--color-text)',
          }}>
            <div style={{ fontSize: '1.4rem', marginBottom: 6 }}>🏖️</div>
            <div style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: 4 }}>Vacances en voiture</div>
            <div style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', lineHeight: 1.5 }}>15 grands trajets Europe, vignettes, péages, checklist départ.</div>
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
        </div>
      </section>

            <section style={{ marginTop: 40, padding: 22, borderRadius: 14, background: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}>
        <h2 style={{ fontSize: '1.05rem', marginBottom: 12 }}>Outils &amp; ressources</h2>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
          <Link href="/outils/immatriculation-france" style={btnSecondaire}>Immatriculation FR →</Link>
          <Link href="/outils/immatriculation-belgique" style={btnSecondaire}>Immatriculation BE →</Link>
          <Link href="/outils/convertisseur" style={btnSecondaire}>Convertisseur technique →</Link>
          <Link href="/depannage" style={btnSecondaire}>Hub dépannage →</Link>
          <Link href="/cout-voiture" style={btnSecondaire}>Coût voiture (TCO) →</Link>
        </div>
      </section>
    </main>
  )
}

// ─── Composants ───────────────────────────────────────────────────────────────

function Doc({ icone, titre, description }: { icone: string; titre: string; description: string }) {
  return (
    <article style={{
      background: 'var(--color-bg-card)', border: '1px solid var(--color-border)',
      borderRadius: 12, padding: 16,
    }}>
      <div style={{ fontSize: '1.6rem', marginBottom: 8 }}>{icone}</div>
      <h3 style={{ fontSize: '0.95rem', margin: 0, marginBottom: 6 }} dangerouslySetInnerHTML={{ __html: titre }} />
      <p style={{ fontSize: '0.86rem', lineHeight: 1.55, color: 'var(--color-text-muted)', margin: 0 }} dangerouslySetInnerHTML={{ __html: description }} />
    </article>
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

const FAQ_DOCS = [
  {
    question: "Combien coûte une carte grise en France en 2026 ?",
    answer:
      "Le coût d'une carte grise française dépend de la puissance fiscale du véhicule (en chevaux fiscaux ou CV) et de la région d'immatriculation. La taxe régionale varie de 27 € (Corse) à 60 € (PACA) par CV. Pour un véhicule de 7 CV en Île-de-France : ~340 €. Ajoutez la taxe sur les véhicules polluants (malus écologique) qui peut atteindre 60 000 € pour les véhicules les plus émetteurs. Les véhicules électriques sont exonérés de la taxe régionale dans 12 régions.",
  },
  {
    question: "Quels sont les délais pour recevoir sa carte grise ?",
    answer:
      "En théorie, la carte grise arrive sous 7 jours ouvrés par courrier suivi. En pratique, comptez 2 à 4 semaines selon la charge de l'ANTS. Vous recevez immédiatement un certificat provisoire d'immatriculation (CPI) valable 1 mois, qui permet de circuler. Si délai dépassé, contactez le service ANTS directement (numéro sur votre suivi).",
  },
  {
    question: "Mon permis français est-il valable au Canada ?",
    answer:
      "Oui, pour une durée limitée. Tourisme : votre permis français suffit pendant 3-6 mois selon la province (3 mois au Québec, 60 jours en Colombie-Britannique). Au-delà, il faut un permis international ou échanger pour le permis canadien. La France a des accords d'échange direct avec le Québec, l'Ontario, le Manitoba, la Nouvelle-Écosse — pas besoin de repasser l'examen.",
  },
  {
    question: "Comment savoir si une plaque française est récente ou ancienne (FNI vs SIV) ?",
    answer:
      "Le SIV (depuis 2009) suit le format AA-123-AA (2 lettres, 3 chiffres, 2 lettres) avec drapeau européen et code département à droite — ce département est libre, choisi par le propriétaire, sans valeur administrative. L'ancien FNI (avant 2009) suivait le format 123 AB 99 où les deux derniers chiffres correspondaient obligatoirement au département d'immatriculation. Il n'existe pas de conversion algorithmique FNI → SIV : la nouvelle plaque vous est attribuée séquentiellement par l'ANTS lors d'un changement d'adresse ou de propriétaire.",
  },
  {
    question: "Ai-je besoin de la carte verte pour traverser l'Europe en 2026 ?",
    answer:
      "Non, pas obligatoirement. Depuis le 2 août 2020, la carte verte papier n'est plus exigée à la frontière entre pays de l'Espace Économique Européen + Suisse, UK, Andorre, Bosnie, Maroc, Tunisie, Turquie. La plaque européenne suffit comme preuve d'immatriculation et donc d'assurance présumée. Cependant, en cas de contrôle ou d'accident, la carte verte (gratuite, fournie par votre assureur) reste très utile.",
  },
  {
    question: "Que se passe-t-il si mon contrôle technique est dépassé ?",
    answer:
      "En France, le contrôle technique doit être réalisé tous les 2 ans (à partir des 4 ans du véhicule). Si dépassé : l'amende est de 135 € (forfaitaire) + immobilisation possible du véhicule. Et surtout, en cas d'accident, votre assureur peut réduire ou refuser la prise en charge si le CT est expiré depuis plus de 2 mois. Conseil : prenez RDV 1 mois avant la date limite, certains centres affichent 3 semaines d'attente.",
  },
  {
    question: "Permis international : où l'obtenir et combien ça coûte ?",
    answer:
      "En France : gratuit, demande sur le site de l'ANTS (Agence nationale des titres sécurisés). Joindre une copie du permis, une pièce d'identité et un justificatif de domicile. Délai annoncé : 11 semaines, en pratique 3-4 mois. Valide 3 ans, à toujours accompagner de votre permis original. Indispensable hors UE/EEE (USA, Maroc, Thaïlande, Australie, Japon...). En UE, votre permis national suffit.",
  },
]

// ─── JSON-LD ──────────────────────────────────────────────────────────────────

function buildJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        '@id': 'https://moteurs.com/documents-auto',
        url: 'https://moteurs.com/documents-auto',
        name: `Documents auto en ${ANNEE} : guide complet`,
        description: `Carte grise, permis, assurance, contrôle technique — tous les papiers pour rouler en règle en ${ANNEE}.`,
        about: { '@type': 'Thing', name: 'Documents administratifs véhicule' },
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Accueil',         item: 'https://moteurs.com/' },
          { '@type': 'ListItem', position: 2, name: 'Documents auto', item: 'https://moteurs.com/documents-auto' },
        ],
      },
      {
        '@type': 'ItemList',
        name: 'Outils documents auto Moteurs.com',
        itemListElement: [
          { '@type': 'ListItem', position: 1, url: 'https://moteurs.com/outils/immatriculation-france',   name: 'Outil immatriculation France' },
          { '@type': 'ListItem', position: 2, url: 'https://moteurs.com/outils/immatriculation-belgique', name: 'Outil immatriculation Belgique' },
          { '@type': 'ListItem', position: 3, url: 'https://moteurs.com/outils/convertisseur',            name: 'Convertisseur technique' },
        ],
      },
    ],
  }
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const lienMuted: React.CSSProperties = { color: 'var(--color-text-muted)', textDecoration: 'none' }
const lien: React.CSSProperties = { color: 'var(--color-primary)', textDecoration: 'none', fontWeight: 600 }
const h2: React.CSSProperties = { fontSize: '1.3rem', marginBottom: 12, marginTop: 0 }
const paraIntro: React.CSSProperties = { fontSize: '0.95rem', lineHeight: 1.65, marginBottom: 18, maxWidth: 720 }
const infoCard: React.CSSProperties = {
  background: 'var(--color-bg-card)', border: '1px solid var(--color-border)',
  borderRadius: 12, padding: 18,
}
const infoH3: React.CSSProperties = { fontSize: '1rem', margin: 0, marginBottom: 10 }
const infoP: React.CSSProperties = { fontSize: '0.95rem', lineHeight: 1.65, margin: 0, color: 'var(--color-text)' }
const infoList: React.CSSProperties = { fontSize: '0.95rem', lineHeight: 1.65, margin: 0, paddingLeft: 22 }
const btnSecondaire: React.CSSProperties = {
  display: 'inline-block',
  padding: '10px 16px',
  background: 'var(--color-bg-card)',
  border: '1px solid var(--color-border)',
  borderRadius: 8,
  color: 'var(--color-primary)',
  textDecoration: 'none',
  fontWeight: 600,
  fontSize: '0.92rem',
}
