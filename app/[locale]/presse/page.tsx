import { getStaticMetadata } from '@/lib/seo-keywords'
import { setRequestLocale } from 'next-intl/server'
import { routing } from '@/i18n/routing'
import { supabase } from '@/lib/supabase'

export const revalidate = 86400

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }))
}

export const metadata = getStaticMetadata('/presse')

const SITE = 'https://moteurs.com'

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'NewsMediaOrganization',
  name: 'Moteurs.com',
  url: SITE,
  logo: { '@type': 'ImageObject', url: `${SITE}/assets/img/logo.png` },
  description:
    'Média de référence sur la transition énergétique des transports routiers : TCO, ZFE, aides et fiscalité, en France, Belgique, Suisse et au Canada.',
  ethicsPolicy: `${SITE}/charte-editoriale`,
  diversityPolicy: `${SITE}/charte-editoriale`,
  masthead: `${SITE}/a-propos`,
  knowsLanguage: ['fr', 'en', 'nl', 'de', 'es', 'it'],
  contactPoint: {
    '@type': 'ContactPoint',
    contactType: 'press',
    email: 'presse@moteurs.com',
    availableLanguage: ['French', 'English'],
  },
}

function Stat({ chiffre, label }: { chiffre: string; label: string }) {
  return (
    <div
      style={{
        flex: '1 1 150px',
        background: 'var(--color-bg-alt)',
        border: '1px solid var(--color-border)',
        borderRadius: 12,
        padding: '20px 18px',
        textAlign: 'center',
      }}
    >
      <div style={{ fontSize: '1.9rem', fontWeight: 800, color: 'var(--color-primary)' }}>{chiffre}</div>
      <div style={{ fontSize: '0.82rem', color: 'var(--color-text-soft)', marginTop: 4 }}>{label}</div>
    </div>
  )
}

function Card({ titre, children }: { titre: string; children: React.ReactNode }) {
  return (
    <section
      style={{
        background: 'var(--color-bg-alt)',
        border: '1px solid var(--color-border)',
        borderRadius: 14,
        padding: '24px 26px',
        marginBottom: 22,
      }}
    >
      <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: 12 }}>{titre}</h2>
      <div style={{ color: 'var(--color-text-soft)', lineHeight: 1.7, fontSize: '0.96rem' }}>{children}</div>
    </section>
  )
}

export default async function PressePage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)

  let publies = 1000
  try {
    const { count } = await supabase
      .from('articles')
      .select('id', { count: 'exact', head: true })
      .eq('etat_code', 'PUBLIE')
    if (count) publies = Math.floor(count / 50) * 50 // arrondi pédagogique
  } catch {
    /* fallback */
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <header className="page-hero">
        <div className="container" style={{ maxWidth: 860, margin: '0 auto' }}>
          <span className="page-hero-badge">Espace presse</span>
          <h1 style={{ marginTop: 12 }}>Espace presse</h1>
          <p style={{ marginTop: 12, maxWidth: 700 }}>
            Vous êtes journaliste et souhaitez citer Moteurs.com, obtenir des données ou
            interviewer la rédaction sur la transition énergétique des transports&nbsp;? Vous
            trouverez ici l&apos;essentiel — et un contact direct.
          </p>
        </div>
      </header>

      <div style={{ padding: '48px 0 80px' }}>
        <div className="container">
          <div style={{ maxWidth: 820, margin: '0 auto' }}>

            {/* Chiffres clés */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, marginBottom: 30 }}>
              <Stat chiffre={`${publies}+`} label="décryptages publiés" />
              <Stat chiffre="4" label="pays couverts (FR · BE · CH · CA)" />
              <Stat chiffre="6" label="langues du site" />
              <Stat chiffre="12+" label="sources officielles en veille" />
            </div>

            <Card titre="Le média en bref">
              <p>
                <strong>Moteurs.com</strong> est un média indépendant consacré à la transition
                énergétique des transports routiers. Notre angle&nbsp;: le décryptage par les
                chiffres — coût total de possession (TCO), zones à faibles émissions (ZFE),
                aides et fiscalité 2026 — pour les particuliers comme pour les PME, artisans et
                flottes. Couverture France, Belgique, Suisse et Canada.
              </p>
            </Card>

            <Card titre="Ce que la rédaction peut commenter">
              <p>
                Bonus écologique et primes 2026, déploiement et calendrier des ZFE, fiscalité des
                véhicules de société (FR/BE), coût réel électrique vs thermique, recharge et
                cartes d&apos;abonnement, aides cantonales suisses et programmes canadiens. Nous
                pouvons fournir des données chiffrées sourcées et des comparatifs sur demande.
              </p>
            </Card>

            <Card titre="Communiqués de presse">
              <p>
                Aucun communiqué n&apos;est disponible publiquement pour le moment. Pour être
                ajouté à notre liste de diffusion presse et recevoir nos prochains communiqués,
                écrivez à{' '}
                <a href="mailto:presse@moteurs.com" style={{ color: 'var(--color-primary)' }}>
                  presse@moteurs.com
                </a>
                .
              </p>
            </Card>

            <Card titre="Kit média">
              <p style={{ marginBottom: 10 }}>Éléments d&apos;identité utiles pour vos articles&nbsp;:</p>
              <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 1.9 }}>
                <li><strong>Nom</strong>&nbsp;: Moteurs.com</li>
                <li><strong>Baseline</strong>&nbsp;: le média de la transition énergétique des transports routiers</li>
                <li><strong>Couleur de marque</strong>&nbsp;: vert <code>#7af0c2</code></li>
                <li><strong>Zones</strong>&nbsp;: France, Belgique, Suisse, Canada</li>
                <li><strong>Site</strong>&nbsp;: <a href="https://moteurs.com" style={{ color: 'var(--color-primary)' }}>moteurs.com</a></li>
              </ul>
              <p style={{ marginTop: 12 }}>
                Logos haute définition et visuels sur demande à{' '}
                <a href="mailto:presse@moteurs.com" style={{ color: 'var(--color-primary)' }}>presse@moteurs.com</a>.
              </p>
            </Card>

            <Card titre="Notre déontologie">
              <p>
                Triangulation systématique des sources, niveaux de confiance affichés,
                indépendance vis-à-vis des annonceurs et politique de corrections&nbsp;: tout est
                détaillé dans notre{' '}
                <a href="/charte-editoriale" style={{ color: 'var(--color-primary)' }}>charte éditoriale</a>.
              </p>
            </Card>

            {/* Contact presse */}
            <div
              style={{
                background: 'var(--color-primary)',
                color: 'white',
                borderRadius: 14,
                padding: '26px 28px',
                marginTop: 8,
              }}
            >
              <h2 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: 8 }}>Contact presse</h2>
              <p style={{ opacity: 0.95, marginBottom: 12 }}>
                Pour toute demande d&apos;interview, de données ou de droit de réponse&nbsp;:
              </p>
              <a
                href="mailto:presse@moteurs.com"
                style={{
                  display: 'inline-block',
                  background: 'white',
                  color: 'var(--color-primary)',
                  fontWeight: 700,
                  padding: '11px 22px',
                  borderRadius: 9,
                  textDecoration: 'none',
                }}
              >
                presse@moteurs.com
              </a>
            </div>

          </div>
        </div>
      </div>
    </>
  )
}
