import { getStaticMetadata } from '@/lib/seo-keywords'
import { setRequestLocale } from 'next-intl/server'
import { routing } from '@/i18n/routing'

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }))
}

export const metadata = getStaticMetadata('/charte-editoriale')

const SITE = 'https://moteurs.com'

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'AboutPage',
  name: 'Charte éditoriale & déontologie — Moteurs.com',
  url: `${SITE}/charte-editoriale`,
  inLanguage: 'fr-FR',
  isPartOf: { '@type': 'WebSite', name: 'Moteurs.com', url: SITE },
  publisher: {
    '@type': 'NewsMediaOrganization',
    name: 'Moteurs.com',
    url: SITE,
    ethicsPolicy: `${SITE}/charte-editoriale`,
    diversityPolicy: `${SITE}/charte-editoriale`,
    masthead: `${SITE}/a-propos`,
  },
}

function Section({ titre, children }: { titre: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: 36 }}>
      <h2 style={{ fontSize: '1.35rem', fontWeight: 700, marginBottom: 14 }}>{titre}</h2>
      <div style={{ color: 'var(--color-text-soft)', lineHeight: 1.7, fontSize: '0.98rem' }}>
        {children}
      </div>
    </section>
  )
}

export default async function ChartePage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <header className="page-hero">
        <div className="container" style={{ maxWidth: 820, margin: '0 auto' }}>
          <span className="page-hero-badge">Déontologie</span>
          <h1 style={{ marginTop: 12 }}>Charte éditoriale &amp; déontologie</h1>
          <p style={{ marginTop: 12, maxWidth: 680 }}>
            Moteurs.com est un média indépendant consacré à la transition énergétique des
            transports routiers. Cette charte décrit notre méthode de travail, nos engagements
            de transparence et notre politique de corrections.
          </p>
        </div>
      </header>

      <div style={{ padding: '48px 0 80px' }}>
        <div className="container">
          <div style={{ maxWidth: 780, margin: '0 auto' }}>

            <Section titre="1. Notre mission">
              <p>
                Décrypter par les chiffres la transition énergétique des transports — TCO, ZFE,
                aides, fiscalité — pour les particuliers, les PME, les artisans et les flottes,
                en France, Belgique, Suisse et au Canada. Nous privilégions l&apos;information
                vérifiable et actionnable plutôt que l&apos;opinion.
              </p>
            </Section>

            <Section titre="2. Triangulation des sources">
              <p>
                Chaque décryptage s&apos;appuie sur des sources primaires : textes officiels,
                administrations (DGEC, Commission européenne, SPF Finances, OFEN, ADEME),
                constructeurs et fédérations professionnelles (ACEA, T&amp;E). Toute donnée
                chiffrée est, autant que possible, recoupée et la source d&apos;origine est
                citée dans le balisage de l&apos;article.
              </p>
            </Section>

            <Section titre="3. Niveaux de confiance">
              <p>
                Nous affichons sur chaque article un niveau de confiance —
                <strong> Élevé</strong>, <strong>Moyen</strong> ou <strong>Faible</strong> —
                qui reflète la solidité et l&apos;actualité des sources disponibles au moment de
                la publication. Lorsqu&apos;une donnée officielle manque, nous le signalons
                explicitement plutôt que d&apos;extrapoler.
              </p>
            </Section>

            <Section titre="4. Indépendance">
              <p>
                Notre ligne éditoriale est indépendante de tout annonceur. Le modèle économique
                de Moteurs.com repose sur du contenu gratuit et de la génération de contacts B2B :
                aucun partenaire commercial ne dispose d&apos;un droit de regard sur nos
                décryptages. Tout contenu sponsorisé éventuel serait identifié comme tel.
              </p>
            </Section>

            <Section titre="5. Politique de corrections">
              <p>
                Nous corrigeons rapidement toute erreur factuelle qui nous est signalée. Les
                articles indiquent une date de dernière mise à jour. Pour signaler une erreur ou
                demander un droit de réponse, écrivez-nous à{' '}
                <a href="mailto:redaction@moteurs.com" style={{ color: 'var(--color-primary)' }}>
                  redaction@moteurs.com
                </a>
                .
              </p>
            </Section>

            <Section titre="6. Usage de l'IA et transparence (AI Act)">
              <p>
                Conformément au Règlement européen sur l&apos;intelligence artificielle (AI Act,
                art. 50), nous signalons clairement les contenus produits avec l&apos;assistance
                d&apos;outils d&apos;IA. Une partie de notre veille et de notre production
                éditoriale est assistée par l&apos;IA, mais chaque article est <strong>vérifié et
                validé par un journaliste de la rédaction avant publication</strong>. L&apos;IA est
                un outil d&apos;assistance&nbsp;: elle ne possède pas le statut de journaliste et
                n&apos;est jamais responsable éditorialement.
              </p>
            </Section>

            <Section titre="7. Responsabilité éditoriale">
              <p>
                Qu&apos;un contenu soit rédigé par un humain ou assisté par une IA, la
                responsabilité légale finale incombe au <strong>directeur de la publication</strong>
                de Moteurs.com (voir nos{' '}
                <a href="/mentions-legales" style={{ color: 'var(--color-primary)' }}>mentions légales</a>).
                Nos contenus sont soumis au droit commun de la presse&nbsp;: interdiction de la
                diffamation et de l&apos;injure, lutte contre les fausses nouvelles, respect de la
                vie privée et de la présomption d&apos;innocence.
              </p>
            </Section>

            <Section titre="8. Droit d'auteur et droits voisins">
              <p>
                Nous respectons le travail des autres éditeurs&nbsp;: nos décryptages citent leurs
                sources d&apos;origine et n&apos;en reproduisent pas le contenu. Réciproquement, au
                titre des <strong>droits voisins des éditeurs de presse</strong>, nous exerçons
                notre droit de retrait (opt-out)&nbsp;: les robots d&apos;<strong>entraînement</strong>
                des modèles d&apos;IA sont bloqués sur l&apos;ensemble du site (voir notre{' '}
                <a href="/robots.txt" style={{ color: 'var(--color-primary)' }}>robots.txt</a>).
                Toute utilisation de nos articles pour entraîner un modèle d&apos;IA requiert un
                accord préalable. Les assistants IA peuvent en revanche citer et lier nos articles.
              </p>
            </Section>

            <Section titre="9. Contact rédaction">
              <p>
                Rédaction : <a href="mailto:redaction@moteurs.com" style={{ color: 'var(--color-primary)' }}>redaction@moteurs.com</a>
                {' · '}Espace presse : <a href="/presse" style={{ color: 'var(--color-primary)' }}>moteurs.com/presse</a>
                {' · '}À propos : <a href="/a-propos" style={{ color: 'var(--color-primary)' }}>qui sommes-nous</a>
              </p>
            </Section>

          </div>
        </div>
      </div>
    </>
  )
}
