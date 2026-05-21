/**
 * Hub SEO /cout-voiture
 * Pillar page TCO : combien coûte une voiture sur 5 ans toutes motorisations,
 * tous pays. Agrège /simulateur, /comparer, /tco/[pays]/[segment].
 */

import type { Metadata } from 'next'
import Link from 'next/link'
import FaqAccordion from '@/components/FaqAccordion'
import {
  ENERGY_PRICES_FALLBACK,
  REF_PRICES_FALLBACK,
  REF_CONSO,
  MOTOR_LABELS,
  type Motor,
  type Pays,
} from '@/lib/tco'

const ANNEE = new Date().getFullYear()

export const metadata: Metadata = {
  title: `Coût total d'une voiture en ${ANNEE} : TCO diesel, essence, électrique, hybride | Moteurs.com`,
  description:
    `Combien coûte vraiment une voiture sur 5 ans ? Calcul TCO complet par motorisation et par pays ` +
    `(France, Belgique, Suisse, Canada). Achat, carburant, entretien, aides, péages — tout inclus. ` +
    `Mis à jour en ${ANNEE}.`,
  openGraph: {
    title: `Coût total voiture ${ANNEE} — TCO Moteurs.com`,
    description: 'TCO par motorisation et par pays : achat + énergie + entretien + aides. Données actualisées.',
    type: 'article',
  },
  alternates: { canonical: 'https://moteurs.com/cout-voiture' },
}

export default function PageCoutVoiture() {
  const motorsParticulier: Motor[] = ['diesel', 'essence', 'elec', 'phev']
  const paysList: { code: Pays; nom: string; drapeau: string }[] = [
    { code: 'FR', nom: 'France',   drapeau: '🇫🇷' },
    { code: 'BE', nom: 'Belgique', drapeau: '🇧🇪' },
    { code: 'CH', nom: 'Suisse',   drapeau: '🇨🇭' },
    { code: 'CA', nom: 'Canada',   drapeau: '🇨🇦' },
  ]

  // Exemple TCO 5 ans / 15 000 km/an / voiture particulier France
  // En réutilisant les fallbacks (pas d'aides, pas de remise — chiffres bruts)
  const exempleTCO = motorsParticulier.map(m => {
    const prixCat = REF_PRICES_FALLBACK.voiture?.[m] ?? 0
    const conso = REF_CONSO.voiture?.[m] ?? 0
    const energyKey = m === 'phev' ? 'diesel' : m === 'essence' ? 'essence' : m
    const prixEnergie = ENERGY_PRICES_FALLBACK.FR[energyKey] ?? 0
    const energie5ans = (conso / 100) * 15000 * 5 * prixEnergie
    const entretien5ans = m === 'elec' ? 480 * 5 : m === 'diesel' ? 1100 * 5 : m === 'phev' ? 950 * 5 : 1000 * 5
    const total = prixCat + energie5ans + entretien5ans
    return { motor: m, label: MOTOR_LABELS[m], prix: prixCat, energie: energie5ans, entretien: entretien5ans, total }
  }).sort((a, b) => a.total - b.total)

  const moinsCher = exempleTCO[0]
  const plusCher = exempleTCO[exempleTCO.length - 1]
  const economie = plusCher.total - moinsCher.total

  return (
    <main className="container" style={{ paddingTop: 36, paddingBottom: 64 }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(buildJsonLd()) }}
      />

      <nav style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', marginBottom: 22 }}>
        <Link href="/" style={lienMuted}>Accueil</Link>
        {' / '}
        <span>Coût voiture</span>
      </nav>

      {/* Hero */}
      <header style={{ marginBottom: 32 }}>
        <div style={{ fontSize: '0.82rem', color: 'var(--color-primary)', fontWeight: 600, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Guide TCO complet · {ANNEE}
        </div>
        <h1 style={{ fontSize: 'clamp(1.7rem, 4vw, 2.5rem)', marginBottom: 14, lineHeight: 1.2 }}>
          Coût total d&apos;une voiture en {ANNEE} : <span style={{ color: 'var(--color-primary)' }}>TCO toutes motorisations</span>
        </h1>
        <p style={{ fontSize: '1rem', lineHeight: 1.65, maxWidth: 720 }}>
          Combien coûte vraiment une voiture sur 5 ans en {ANNEE} ? Le prix catalogue n&apos;est que
          la moitié de l&apos;histoire — il faut ajouter le carburant ou l&apos;électricité, l&apos;entretien,
          l&apos;assurance, la décote, les péages. Cette page agrège tous nos outils pour calculer le
          coût total de possession (TCO) par motorisation et par pays.
        </p>
      </header>

      {/* Stat principale */}
      <section style={{ marginBottom: 36 }}>
        <div style={{
          background: 'linear-gradient(135deg, rgba(122,240,194,0.06), rgba(122,240,194,0.02))',
          border: '1px solid rgba(122,240,194,0.2)',
          borderRadius: 14, padding: '22px 24px',
        }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--color-primary)', fontWeight: 600, marginBottom: 8, textTransform: 'uppercase' }}>
            Exemple — voiture particulier, France, 15 000 km/an pendant 5 ans
          </div>
          <p style={{ fontSize: '1rem', lineHeight: 1.65, margin: 0 }}>
            La motorisation la moins chère est <strong>{moinsCher.label}</strong> avec un TCO de{' '}
            <strong>{fmtEur(moinsCher.total)}</strong>, soit <strong>{fmtEur(economie)}</strong>{' '}
            de moins que le {plusCher.label}. Sans compter les aides et les péages.
          </p>
        </div>
      </section>

      {/* Tableau TCO exemple */}
      <section style={{ marginBottom: 40 }}>
        <h2 style={h2}>TCO sur 5 ans, motorisation par motorisation</h2>
        <p style={paraIntro}>
          Hypothèses : voiture compacte neuve, 15 000 km/an, profil mixte, pas de remise constructeur.
          Hors aides, hors assurance, hors péages. Pour un calcul personnalisé qui inclut tout, utilisez
          notre simulateur.
        </p>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.92rem' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--color-border)' }}>
                <th style={th}>Motorisation</th>
                <th style={thR}>Prix neuf TTC</th>
                <th style={thR}>Énergie 5 ans</th>
                <th style={thR}>Entretien 5 ans</th>
                <th style={thR}>TCO total</th>
              </tr>
            </thead>
            <tbody>
              {exempleTCO.map(r => (
                <tr key={r.motor} style={{
                  borderBottom: '1px solid var(--color-border)',
                  background: r.motor === moinsCher.motor ? 'rgba(5,150,105,0.05)' : 'transparent',
                }}>
                  <td style={{ ...td, fontWeight: r.motor === moinsCher.motor ? 700 : 400 }}>
                    {r.label}
                    {r.motor === moinsCher.motor && <span style={{ marginLeft: 6, color: '#059669', fontSize: '0.74rem' }}>✓ moins cher</span>}
                  </td>
                  <td style={tdR}>{fmtEur(r.prix)}</td>
                  <td style={tdR}>{fmtEur(r.energie)}</td>
                  <td style={tdR}>{fmtEur(r.entretien)}</td>
                  <td style={{ ...tdR, fontWeight: 700 }}>{fmtEur(r.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Coût par pays */}
      <section style={{ marginBottom: 40 }}>
        <h2 style={h2}>Coût de l&apos;énergie par pays</h2>
        <p style={paraIntro}>
          Le pays change radicalement l&apos;équilibre entre motorisations. La Suisse a l&apos;électricité
          la plus chère d&apos;Europe occidentale, le Canada a la moins chère. Le diesel reste
          stable autour de 1,72-1,85 €/L.
        </p>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.92rem' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--color-border)' }}>
                <th style={th}>Pays</th>
                <th style={thR}>Diesel (€/L)</th>
                <th style={thR}>Essence (€/L)</th>
                <th style={thR}>Électricité (€/kWh)</th>
                <th style={thR}>Page dédiée</th>
              </tr>
            </thead>
            <tbody>
              {paysList.map(p => {
                const ep = ENERGY_PRICES_FALLBACK[p.code]
                return (
                  <tr key={p.code} style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <td style={td}>{p.drapeau} {p.nom}</td>
                    <td style={tdR}>{(ep.diesel ?? 0).toFixed(2)}</td>
                    <td style={tdR}>{(ep.essence ?? 0).toFixed(2)}</td>
                    <td style={tdR}>{(ep.elec ?? 0).toFixed(2)}</td>
                    <td style={tdR}>
                      <Link href={`/tco/${p.code.toLowerCase()}/voiture`} style={lien}>
                        TCO {p.nom} →
                      </Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Outils principaux */}
      <section style={{ marginBottom: 40 }}>
        <h2 style={h2}>Calculer mon coût exact</h2>
        <div style={{ display: 'grid', gap: 14, gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
          <CarteOutil
            href="/simulateur"
            titre="Simulateur TCO"
            description="Calcul personnalisé : segment, motorisation, profil de conduite, durée. Inclut aides et suramortissement."
            cta="Lancer le simulateur"
          />
          <CarteOutil
            href="/comparer"
            titre="Comparateur 6 motorisations"
            description="Comparez en un coup d&apos;oeil diesel, essence, électrique, hybride, hydrogène, GNV."
            cta="Comparer"
          />
          <CarteOutil
            href="/comparer-trajet"
            titre="Coût d&apos;un trajet"
            description="Pour un trajet spécifique (vacances, professionnel) : carburant + péages selon motorisation."
            cta="Comparer un trajet"
          />
        </div>
      </section>

      {/* Particulier vs B2B */}
      <section style={{ marginBottom: 40 }}>
        <h2 style={h2}>Particulier vs entreprise : pas le même calcul</h2>
        <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))' }}>
          <article style={infoCard}>
            <h3 style={infoH3}>Particulier</h3>
            <ul style={infoList}>
              <li>Prix TTC (inclut TVA 20 % en France)</li>
              <li>Bonus écologique pour VE (4 000 € en {ANNEE})</li>
              <li>Crédit d&apos;impôt borne 500 €</li>
              <li>Pas de récupération de TVA</li>
              <li>Décote rapide les 3 premières années</li>
            </ul>
            <Link href="/particulier" style={{ ...lien, fontSize: '0.85rem', display: 'block', marginTop: 12 }}>
              Espace particuliers →
            </Link>
          </article>
          <article style={infoCard}>
            <h3 style={infoH3}>Entreprise / flotte</h3>
            <ul style={infoList}>
              <li>Prix HT (TVA récupérable à 100 % sur VE et VUL)</li>
              <li>Suramortissement 40 % France (jusqu&apos;à fin {ANNEE})</li>
              <li>Pas de TVS pour VE</li>
              <li>Aide flotte jusqu&apos;à 12 000 € par poids-lourd</li>
              <li>Amortissement linéaire 5-7 ans</li>
            </ul>
            <Link href="/b2b" style={{ ...lien, fontSize: '0.85rem', display: 'block', marginTop: 12 }}>
              Espace B2B →
            </Link>
          </article>
        </div>
      </section>

      {/* Postes de coût */}
      <section style={{ marginBottom: 40 }}>
        <h2 style={h2}>Les 7 postes du TCO</h2>
        <ol style={{ paddingLeft: 20, lineHeight: 1.8, fontSize: '0.95rem' }}>
          <li><strong>Prix d&apos;achat</strong> — neuf TTC ou HT, après remise et aides (40-55 % du TCO).</li>
          <li><strong>Énergie</strong> — carburant ou électricité, dépend du pays et du profil (15-30 % du TCO).</li>
          <li><strong>Entretien</strong> — révisions, pneus, freins. Un VE coûte environ moitié moins (5-12 %).</li>
          <li><strong>Assurance</strong> — souvent 5-8 % du TCO, plus élevée pour les VE neufs (réparation coûteuse).</li>
          <li><strong>Décote</strong> — l&apos;ennemi caché : 40-50 % de la valeur perdue en 4 ans. Les VE décotent plus vite côté market, mais les meilleures occasions.</li>
          <li><strong>Péages et stationnement</strong> — variable : ~0,10 €/km autoroute en France. Certaines villes exonèrent les VE.</li>
          <li><strong>Fiscalité</strong> — TVS, malus écologique, taxe poids, redevances ZFE. Faible pour particuliers, lourde en B2B.</li>
        </ol>
      </section>

      {/* FAQ */}
      <section style={{ marginTop: 48 }}>
        <FaqAccordion items={FAQ_COUT} title="Coût voiture : questions fréquentes" />
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
        <h2 style={{ fontSize: '1.05rem', marginBottom: 12 }}>Aller plus loin</h2>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
          <Link href="/simulateur" style={btnSecondaire}>Simulateur TCO →</Link>
          <Link href="/comparer" style={btnSecondaire}>Comparer 6 motorisations →</Link>
          <Link href="/comparer-trajet" style={btnSecondaire}>Coût d&apos;un trajet →</Link>
          <Link href="/recharge-electrique" style={btnSecondaire}>Recharge électrique →</Link>
          <Link href="/vacances-voiture" style={btnSecondaire}>Vacances voiture →</Link>
        </div>
      </section>
    </main>
  )
}

// ─── Composants ───────────────────────────────────────────────────────────────

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

const FAQ_COUT = [
  {
    question: "C'est quoi le TCO d'une voiture ?",
    answer:
      "Le TCO (Total Cost of Ownership) est le coût total de possession d&apos;un véhicule sur sa durée de détention. Il additionne le prix d&apos;achat (ou loyer LLD), le carburant ou l&apos;électricité, l&apos;entretien, l&apos;assurance, la décote, les péages et la fiscalité. C&apos;est l&apos;indicateur le plus honnête pour comparer deux motorisations différentes : un VE plus cher à l&apos;achat est souvent moins cher en TCO grâce à l&apos;énergie et l&apos;entretien réduit.",
  },
  {
    question: "Quelle motorisation est la moins chère sur 5 ans en France ?",
    answer:
      "Pour un usage particulier moyen (15 000 km/an), trois cas typiques : 1) longs trajets autoroute + recharge publique : diesel reste compétitif ; 2) trajets mixtes + recharge domicile : électrique est imbattable (économie de 3 000 à 6 000 € sur 5 ans vs diesel) ; 3) trajets courts < 80 km/jour : électrique avec recharge domicile = TCO le plus bas, et de loin. Notre simulateur calcule votre cas précis.",
  },
  {
    question: "Une voiture électrique est-elle vraiment plus chère à l'achat ?",
    answer:
      "Oui à neuf : compter +5 000 à +10 000 € vs un équivalent thermique de même gamme. Mais après bonus écologique (4 000 € en {ANNEE}), prime à la conversion et TVS exonérée pour B2B, l&apos;écart à l&apos;achat se réduit à 1 000-3 000 €. Sur 5 ans avec recharge domicile, ce surcoût est récupéré en énergie + entretien. En occasion, les VE de 2-3 ans sont souvent les meilleurs deals du marché.",
  },
  {
    question: "Combien coûte l'entretien d'une voiture électrique vs diesel ?",
    answer:
      "Un VE coûte environ moitié moins en entretien : 400-600 €/an vs 900-1 200 €/an pour un diesel. Raisons : pas de vidange, pas de filtre à huile, pas de courroie de distribution, freins moins usés (régénération). Reste : pneus (plus chers car gomme spéciale), liquide de refroidissement batterie tous les 4 ans, contrôle freins/suspension. Sur 5 ans, l&apos;économie sur l&apos;entretien dépasse 2 500 €.",
  },
  {
    question: "La décote tue-t-elle l'avantage électrique ?",
    answer:
      "Plus en {ANNEE}. Jusqu&apos;en 2023, les VE décotaient effectivement 5-10 points de plus que les thermiques (autonomie obsolète, peur batterie). Depuis 2024, le marché de l&apos;occasion VE est mature : les modèles 2022-2024 décotent à un rythme normal (40-50 % en 4 ans, comme un diesel équivalent). Les Tesla Model 3/Y, Kia EV6, Hyundai Ioniq 5 ont les meilleures cotes.",
  },
  {
    question: "Comment réduire le coût total de ma voiture ?",
    answer:
      "Cinq leviers majeurs : 1) acheter en LOA/LLD pour lisser la décote (mais payer plus en intérêts) ; 2) optimiser le carburant (badge télépéage, app de carburant le moins cher) ; 3) entretien chez indépendants ou réseau secondaire (-30 % vs concessionnaire) ; 4) assurance comparateur (changer tous les 2 ans, gain ~200 €/an) ; 5) maximiser les aides (bonus, prime conversion, suramortissement B2B). Notre simulateur intègre tous ces paramètres.",
  },
  {
    question: "Le suramortissement de 40 % en France, c'est quoi exactement ?",
    answer:
      "C&apos;est une déduction fiscale supplémentaire pour les entreprises qui achètent un véhicule utilitaire électrique, hydrogène ou GNV. Elle s&apos;ajoute à l&apos;amortissement classique : 40 % du prix HT du véhicule (plafonné à 60 000 € selon segment) est déduit du résultat imposable. Concrètement, pour un VUL électrique à 32 000 € HT : économie d&apos;impôt de 3 200 € (à 25 % d&apos;IS). Mécanisme prolongé jusqu&apos;à fin {ANNEE}.",
  },
]

// ─── JSON-LD ──────────────────────────────────────────────────────────────────

function buildJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        '@id': 'https://moteurs.com/cout-voiture',
        url: 'https://moteurs.com/cout-voiture',
        name: `Coût total d'une voiture en ${ANNEE} : TCO complet`,
        description: `TCO par motorisation et par pays — guide complet ${ANNEE}.`,
        about: { '@type': 'Thing', name: "Coût de possession d'un véhicule" },
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Accueil',       item: 'https://moteurs.com/' },
          { '@type': 'ListItem', position: 2, name: 'Coût voiture', item: 'https://moteurs.com/cout-voiture' },
        ],
      },
      {
        '@type': 'ItemList',
        name: 'Outils TCO Moteurs.com',
        itemListElement: [
          { '@type': 'ListItem', position: 1, url: 'https://moteurs.com/simulateur',      name: 'Simulateur TCO personnalisé' },
          { '@type': 'ListItem', position: 2, url: 'https://moteurs.com/comparer',         name: 'Comparateur 6 motorisations' },
          { '@type': 'ListItem', position: 3, url: 'https://moteurs.com/comparer-trajet',  name: 'Comparateur coût trajet' },
          { '@type': 'ListItem', position: 4, url: 'https://moteurs.com/tco/fr/voiture',  name: 'TCO voiture France' },
          { '@type': 'ListItem', position: 5, url: 'https://moteurs.com/tco/be/voiture',  name: 'TCO voiture Belgique' },
        ],
      },
    ],
  }
}

// ─── Utilitaires & styles ─────────────────────────────────────────────────────

function fmtEur(v: number): string {
  return Math.round(v).toLocaleString('fr-FR') + ' €'
}

const lienMuted: React.CSSProperties = { color: 'var(--color-text-muted)', textDecoration: 'none' }
const lien: React.CSSProperties = { color: 'var(--color-primary)', textDecoration: 'none', fontWeight: 600 }
const h2: React.CSSProperties = { fontSize: '1.3rem', marginBottom: 12, marginTop: 0 }
const paraIntro: React.CSSProperties = { fontSize: '0.95rem', lineHeight: 1.65, marginBottom: 18, maxWidth: 720 }
const th: React.CSSProperties = { padding: '10px 12px', textAlign: 'left', color: 'var(--color-text-muted)', fontWeight: 600 }
const thR: React.CSSProperties = { padding: '10px 12px', textAlign: 'right', color: 'var(--color-text-muted)', fontWeight: 600 }
const td: React.CSSProperties = { padding: '10px 12px' }
const tdR: React.CSSProperties = { padding: '10px 12px', textAlign: 'right' }
const infoCard: React.CSSProperties = {
  background: 'var(--color-bg-card)', border: '1px solid var(--color-border)',
  borderRadius: 12, padding: 18,
}
const infoH3: React.CSSProperties = { fontSize: '1rem', margin: 0, marginBottom: 12 }
const infoList: React.CSSProperties = { paddingLeft: 18, lineHeight: 1.7, fontSize: '0.9rem', margin: 0 }
const btnSecondaire: React.CSSProperties = {
  padding: '8px 14px', borderRadius: 10, fontSize: '0.88rem',
  background: 'transparent', border: '1px solid var(--color-border)',
  color: 'var(--color-text)', textDecoration: 'none',
}
