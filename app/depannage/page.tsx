/**
 * Hub SEO /depannage
 * Pillar page panne / assistance / dépannage voiture.
 * SSG — agrège scan voyant, constat européen, assistance panne,
 * et numéros d'urgence par pays.
 */

import type { Metadata } from 'next'
import Link from 'next/link'
import FaqAccordion from '@/components/FaqAccordion'
import { PAYS_LEGAL } from '@/lib/legal-pays'

const ANNEE = new Date().getFullYear()

export const metadata: Metadata = {
  title: `Dépannage voiture : numéros d'urgence, voyants, panne ${ANNEE} | Moteurs.com`,
  description:
    `Que faire en cas de panne en voiture en ${ANNEE} ? Numéros d'urgence par pays (France, Belgique, Suisse, ` +
    `Italie...), diagnostic voyant par photo, constat amiable européen, top pannes fréquentes et coût d'un ` +
    `dépannage type.`,
  openGraph: {
    title: `Dépannage voiture ${ANNEE} — Moteurs.com`,
    description: 'Numéros d\'urgence, scan voyant IA, constat amiable, top pannes — tout pour gérer une panne.',
    type: 'article',
  },
  alternates: { canonical: 'https://moteurs.com/depannage' },
}

export default function PageDepannage() {
  // Numéros d'urgence pour les 8 pays les plus traversés en vacances
  const paysUrgence = (['FR', 'BE', 'CH', 'IT', 'ES', 'DE', 'NL', 'PT'] as const)
    .map(c => PAYS_LEGAL[c])
    .filter(Boolean)

  return (
    <main className="container" style={{ paddingTop: 36, paddingBottom: 64 }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(buildJsonLd()) }}
      />

      <nav style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', marginBottom: 22 }}>
        <Link href="/" style={lienMuted}>Accueil</Link>
        {' / '}
        <span>Dépannage</span>
      </nav>

      {/* Hero */}
      <header className="hub-hero-dark" style={{ marginBottom: 28 }}>
        <div style={{ fontSize: '0.82rem', color: 'var(--color-primary)', fontWeight: 600, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Guide dépannage · {ANNEE}
        </div>
        <h1 style={{ fontSize: 'clamp(1.7rem, 4vw, 2.5rem)', marginBottom: 14, lineHeight: 1.2 }}>
          Panne voiture : <span style={{ color: 'var(--color-primary)' }}>quoi faire maintenant ?</span>
        </h1>
        <p style={{ fontSize: '1rem', lineHeight: 1.65, maxWidth: 720 }}>
          Voyant allumé, batterie à plat, pneu crevé, accident léger — voici la marche à suivre en {ANNEE},
          les bons réflexes et les bons numéros par pays. Diagnostic photo voyant gratuit en 30 secondes,
          constat amiable européen numérique, top des pannes les plus fréquentes.
        </p>
      </header>

      {/* Bandeau urgence */}
      <section style={{
        background: 'rgba(220,38,38,0.06)',
        border: '1px solid rgba(220,38,38,0.25)',
        borderRadius: 12, padding: '18px 22px', marginBottom: 32,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
          <span style={{ fontSize: '1.8rem' }}>🚨</span>
          <h2 style={{ margin: 0, fontSize: '1.1rem', color: '#dc2626' }}>En urgence : composez le 112</h2>
        </div>
        <p style={{ margin: 0, fontSize: '0.92rem', lineHeight: 1.55 }}>
          Le <strong>112</strong> est le numéro d&apos;urgence unique européen (police, pompiers, SAMU).
          Il fonctionne dans toute l&apos;UE, gratuitement, même sans crédit. Pour le dépannage routier,
          voir les numéros par pays ci-dessous.
        </p>
      </section>

      {/* Outils principaux */}
      <section style={{ marginBottom: 40 }}>
        <h2 style={h2}>3 outils pour gérer une panne</h2>
        <div style={{ display: 'grid', gap: 14, gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
          <CarteOutil
            href="/assistant-depannage"
            titre="Scan voyant par photo"
            description="Prenez une photo du voyant ou symptôme — l&apos;IA vous dit si vous pouvez rouler, attendre ou stopper, et donne la cause probable."
            cta="Scanner un voyant"
            urgent
          />
          <CarteOutil
            href="/constat"
            titre="Constat amiable européen"
            description="Wizard 8 étapes guidé, 17 cas standardisés, 10 points de choc, export PDF + email. Valable dans toute l&apos;UE."
            cta="Préparer mon constat"
          />
          <CarteOutil
            href="/assistance/panne"
            titre="Assistance panne complète"
            description="Démarches assurance, coordonnées dépanneur, gestion du sinistre, simulation coût. Tout pour ne rien oublier."
            cta="Voir l&apos;assistance"
          />
        </div>
      </section>

      {/* Numéros d'urgence par pays */}
      <section style={{ marginBottom: 40 }}>
        <h2 style={h2}>Numéros d&apos;urgence par pays européen</h2>
        <p style={paraIntro}>
          Le 112 fonctionne partout. Mais certains pays ont aussi un numéro de dépannage autoroute
          spécifique, plus rapide pour une panne mécanique (pas de blessés).
        </p>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.92rem' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--color-border)' }}>
                <th style={th}>Pays</th>
                <th style={th}>Urgence</th>
                <th style={th}>Dépannage autoroute</th>
                <th style={th}>Alcoolémie max</th>
              </tr>
            </thead>
            <tbody>
              {paysUrgence.map(p => (
                <tr key={p.code} style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <td style={td}>{p.drapeau} {p.nom}</td>
                  <td style={{ ...td, fontWeight: 700, color: '#dc2626' }}>{p.urgence}</td>
                  <td style={td}>{p.depannage ?? '—'}</td>
                  <td style={td}>{p.alcool_max.toFixed(1)} g/L</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginTop: 12 }}>
          Le détail par pays (vignettes, équipements obligatoires, ZFE) est disponible sur chaque page
          trajet — par exemple <Link href="/trajet/belgique-cote-azur" style={lien}>Belgique → Côte d&apos;Azur</Link>.
        </p>
      </section>

      {/* Étapes en cas de panne */}
      <section style={{ marginBottom: 40 }}>
        <h2 style={h2}>Que faire pas à pas en cas de panne ?</h2>
        <ol style={{ paddingLeft: 20, lineHeight: 1.8, fontSize: '0.95rem' }}>
          <li><strong>Sécuriser</strong> — allumer les feux de détresse, sortir du véhicule côté opposé à la circulation, mettre le gilet fluorescent avant de sortir, placer le triangle 30 m en arrière (150 m sur autoroute).</li>
          <li><strong>Se mettre en sécurité</strong> — passer derrière la glissière de sécurité, ne JAMAIS rester dans le véhicule sur la bande d&apos;arrêt d&apos;urgence.</li>
          <li><strong>Évaluer la panne</strong> — voyant rouge ? Bruit anormal ? Fumée ? Notre <Link href="/assistant-depannage" style={lien}>scan voyant</Link> vous aide à diagnostiquer en 30 secondes.</li>
          <li><strong>Appeler</strong> — assurance assistance d&apos;abord (numéro sur la carte verte), ou directement le dépannage autoroute via les bornes oranges tous les 2 km.</li>
          <li><strong>Si accident</strong> — remplir le constat amiable, prendre des photos des dégâts et de la position des véhicules avant de bouger quoi que ce soit.</li>
          <li><strong>Conserver les preuves</strong> — facture dépanneur, photos, témoignages. Indispensable pour l&apos;assurance.</li>
        </ol>
      </section>

      {/* Top pannes */}
      <section style={{ marginBottom: 40 }}>
        <h2 style={h2}>Top 5 des pannes les plus fréquentes</h2>
        <div style={{ display: 'grid', gap: 14, gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))' }}>
          <Panne
            titre="1. Batterie déchargée"
            frequence="35 % des appels dépannage"
            cause="Vétusté (3-5 ans), oubli phares, court trajets répétés."
            cout="80-250 € (intervention + nouvelle batterie 90-180 €)"
          />
          <Panne
            titre="2. Pneu crevé"
            frequence="22 %"
            cause="Clou, nid de poule, usure, choc bordure."
            cout="60-150 € intervention + 80-180 € pneu remplacé"
          />
          <Panne
            titre="3. Panne sèche / mauvais carburant"
            frequence="12 %"
            cause="Mauvaise estimation autonomie, jauge défectueuse."
            cout="100-180 € intervention + carburant. Si mauvais carburant : 800-2 500 €"
          />
          <Panne
            titre="4. Panne moteur"
            frequence="10 %"
            cause="Surchauffe, courroie distribution, défaut allumage."
            cout="150-400 € intervention + réparation atelier 300-3 000 €+"
          />
          <Panne
            titre="5. Problème électrique"
            frequence="8 %"
            cause="Capteur HS, fil sectionné, alternateur défaillant."
            cout="100-250 € intervention + diagnostic 80-200 €"
          />
        </div>
        <p style={{ marginTop: 14, fontSize: '0.88rem', color: 'var(--color-text-muted)' }}>
          Source : moyennes Mondial Assistance, Europ Assistance, Inter Mutuelles Assistance {ANNEE}.
        </p>
      </section>

      {/* Assurance assistance */}
      <section style={{ marginBottom: 40 }}>
        <h2 style={h2}>Avez-vous une assistance dans votre assurance ?</h2>
        <p style={paraIntro}>
          La plupart des assurances auto incluent une assistance de base (« panne 0 km » ou
          « panne au-delà de 50 km »). Vérifiez votre contrat avant un long trajet.
        </p>
        <div style={{ display: 'grid', gap: 14, gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
          <article style={infoCard}>
            <h3 style={infoH3}>Assistance 0 km</h3>
            <p style={infoP}>
              Couvre toute panne, même devant votre domicile. La plus complète. Souvent en option (+30 à 80 €/an)
              ou incluse dans les formules tous risques.
            </p>
          </article>
          <article style={infoCard}>
            <h3 style={infoH3}>Assistance + de 50 km</h3>
            <p style={infoP}>
              Standard : ne couvre la panne que si vous êtes à plus de 50 km de chez vous. Suffisant
              pour les vacances, mais pas pour la vie quotidienne.
            </p>
          </article>
          <article style={infoCard}>
            <h3 style={infoH3}>Assistance premium</h3>
            <p style={infoP}>
              Inclut véhicule de remplacement, hôtel, rapatriement passagers, taxi. À envisager pour
              les longs trajets famille ou les véhicules de société.
            </p>
          </article>
        </div>
      </section>

      {/* FAQ */}
      <section style={{ marginTop: 48 }}>
        <FaqAccordion items={FAQ_DEPANNAGE} title="Dépannage voiture : questions fréquentes" />
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
        <h2 style={{ fontSize: '1.05rem', marginBottom: 12 }}>Outils liés</h2>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
          <Link href="/assistant-depannage" style={btnSecondaire}>Scan voyant →</Link>
          <Link href="/constat" style={btnSecondaire}>Constat européen →</Link>
          <Link href="/assistance/panne" style={btnSecondaire}>Assistance panne →</Link>
          <Link href="/vacances-voiture" style={btnSecondaire}>Vacances voiture →</Link>
          <Link href="/checklist-depart" style={btnSecondaire}>Checklist départ →</Link>
        </div>
      </section>
    </main>
  )
}

// ─── Composants ───────────────────────────────────────────────────────────────

function CarteOutil({ href, titre, description, cta, urgent }: { href: string; titre: string; description: string; cta: string; urgent?: boolean }) {
  return (
    <Link href={href} style={{
      display: 'block', padding: 18, borderRadius: 12,
      background: 'var(--color-bg-card)',
      border: urgent ? '2px solid rgba(220,38,38,0.35)' : '1px solid var(--color-border)',
      textDecoration: 'none', color: 'var(--color-text)',
    }}>
      <h3 style={{ fontSize: '1rem', margin: 0, marginBottom: 8 }} dangerouslySetInnerHTML={{ __html: titre }} />
      <p style={{ fontSize: '0.88rem', lineHeight: 1.55, color: 'var(--color-text-muted)', margin: 0, marginBottom: 12 }} dangerouslySetInnerHTML={{ __html: description }} />
      <span style={{ color: urgent ? '#dc2626' : 'var(--color-primary)', fontSize: '0.85rem', fontWeight: 600 }} dangerouslySetInnerHTML={{ __html: cta + ' →' }} />
    </Link>
  )
}

function Panne({ titre, frequence, cause, cout }: { titre: string; frequence: string; cause: string; cout: string }) {
  return (
    <article style={{
      background: 'var(--color-bg-card)', border: '1px solid var(--color-border)',
      borderRadius: 12, padding: 16,
    }}>
      <h3 style={{ fontSize: '0.98rem', margin: 0, marginBottom: 4 }}>{titre}</h3>
      <div style={{ fontSize: '0.78rem', color: 'var(--color-primary)', fontWeight: 600, marginBottom: 10 }}>{frequence}</div>
      <p style={{ fontSize: '0.86rem', margin: 0, marginBottom: 6 }}><strong>Cause :</strong> {cause}</p>
      <p style={{ fontSize: '0.86rem', margin: 0, color: 'var(--color-text-muted)' }}><strong>Coût :</strong> {cout}</p>
    </article>
  )
}

// ─── FAQ ──────────────────────────────────────────────────────────────────────

const FAQ_DEPANNAGE = [
  {
    question: "Que faire si je tombe en panne sur autoroute ?",
    answer:
      "1) Mettez les feux de détresse et tentez de gagner la bande d'arrêt d'urgence (BAU). 2) Sortez du véhicule côté opposé à la circulation, enfilez votre gilet fluorescent AVANT de sortir. 3) Placez le triangle 150 m en arrière, idéalement après un virage. 4) Passez derrière la glissière de sécurité. 5) Appelez le dépannage via la borne orange tous les 2 km — c'est le moyen le plus rapide. Ne restez JAMAIS dans le véhicule sur la BAU.",
  },
  {
    question: "Mon voyant moteur s'allume : puis-je rouler ?",
    answer:
      "Cela dépend de la couleur et du clignotement. <strong>Voyant orange fixe</strong> : roulez prudemment jusqu'à votre garage habituel, faites diagnostiquer rapidement (souvent un capteur). <strong>Voyant orange clignotant</strong> : ralentissez immédiatement, défaut potentiellement grave (allumage, injection). <strong>Voyant rouge</strong> : ARRÊTEZ-VOUS dès que possible en sécurité, le moteur risque la casse. Notre <a href='/assistant-depannage'>scan voyant par photo</a> diagnostique précisément en 30 secondes.",
  },
  {
    question: "Combien coûte un dépannage classique en 2026 ?",
    answer:
      "Sur route ouverte (hors autoroute) : 80 à 200 € pour un dépannage simple sur place (batterie, crevaison). Si remorquage nécessaire jusqu'à un garage : 150 à 350 €. Sur autoroute, les tarifs sont réglementés en France : environ 150 € en jour ouvré, 215 € la nuit ou le dimanche, par tranche de 10 km de remorquage. Votre assurance assistance prend généralement en charge tout ou partie.",
  },
  {
    question: "Le 112 fonctionne-t-il à l'étranger ?",
    answer:
      "Oui — le 112 est le numéro d'urgence unique européen, valide dans les 27 pays de l'UE plus l'Islande, la Norvège, la Suisse, le Royaume-Uni. Il fonctionne gratuitement, sans crédit, et même sans carte SIM dans certains cas. Les opérateurs parlent au minimum l'anglais. Pour un dépannage mécanique seul (pas de blessé), préférez les numéros nationaux : 112 en CH/IT/ES/BE, ou le numéro de votre assurance.",
  },
  {
    question: "Comment remplir un constat amiable à l'étranger ?",
    answer:
      "Le constat amiable européen est multilingue et standardisé : remplissez-le dans votre langue, l'autre conducteur dans la sienne, les cases correspondent exactement. Notre <a href='/constat'>outil constat amiable</a> propose un wizard 8 étapes guidé qui couvre les 17 cas standardisés et les 10 points de choc européens. Export PDF prêt à imprimer + envoi par email aux deux parties.",
  },
  {
    question: "Mon assurance refuse de prendre en charge la panne — que faire ?",
    answer:
      "Vérifiez d'abord le kilométrage couvert (« panne 0 km » vs « +50 km du domicile »), la franchise éventuelle, et les exclusions (panne d'essence, négligence d'entretien). En cas de refus injustifié, demandez le motif par écrit, contestez auprès du service client, puis du médiateur de l'assurance (gratuit). En dernier recours : l'ACPR ou un avocat (couvert par votre protection juridique si vous en avez une).",
  },
  {
    question: "Comment éviter les pannes lors des longs trajets ?",
    answer:
      "Une révision avant départ est le meilleur investissement (80-150 €). Vérifications essentielles : pression des pneus (à froid, avec la charge réelle), niveaux (huile, refroidissement, lave-glace), feux et clignotants, batterie (test gratuit en centre auto), essuie-glaces. Faites le plein la veille pour éviter les départs à jeun. Et consultez notre <a href='/checklist-depart'>checklist départ vacances</a>.",
  },
]

// ─── JSON-LD ──────────────────────────────────────────────────────────────────

function buildJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        '@id': 'https://moteurs.com/depannage',
        url: 'https://moteurs.com/depannage',
        name: `Dépannage voiture : guide ${ANNEE}`,
        description: `Panne voiture : numéros d'urgence par pays, scan voyant, constat amiable, top pannes — guide ${ANNEE}.`,
        about: { '@type': 'Thing', name: 'Dépannage automobile' },
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Accueil',   item: 'https://moteurs.com/' },
          { '@type': 'ListItem', position: 2, name: 'Dépannage', item: 'https://moteurs.com/depannage' },
        ],
      },
      {
        '@type': 'ItemList',
        name: 'Outils dépannage Moteurs.com',
        itemListElement: [
          { '@type': 'ListItem', position: 1, url: 'https://moteurs.com/assistant-depannage', name: 'Scan voyant par photo' },
          { '@type': 'ListItem', position: 2, url: 'https://moteurs.com/constat',             name: 'Constat amiable européen' },
          { '@type': 'ListItem', position: 3, url: 'https://moteurs.com/assistance/panne',    name: 'Assistance panne complète' },
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
const th: React.CSSProperties = { padding: '10px 12px', textAlign: 'left', color: 'var(--color-text-muted)', fontWeight: 600 }
const td: React.CSSProperties = { padding: '10px 12px' }
const infoCard: React.CSSProperties = {
  background: 'var(--color-bg-card)', border: '1px solid var(--color-border)',
  borderRadius: 12, padding: 16,
}
const infoH3: React.CSSProperties = { fontSize: '0.98rem', margin: 0, marginBottom: 8 }
const infoP: React.CSSProperties = { fontSize: '0.86rem', lineHeight: 1.55, margin: 0 }
const btnSecondaire: React.CSSProperties = {
  padding: '8px 14px', borderRadius: 10, fontSize: '0.88rem',
  background: 'transparent', border: '1px solid var(--color-border)',
  color: 'var(--color-text)', textDecoration: 'none',
}
