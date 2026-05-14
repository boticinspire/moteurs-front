import Link from 'next/link'
import { supabase, FLAGS, CONF_CLASS, CONF_LABEL, type Article } from '@/lib/supabase'
import NewsletterForm from '@/components/NewsletterForm'

export const revalidate = 60

export default async function HomePage() {
  const { data: articles } = await supabase
    .from('articles')
    .select('slug, titre_provisoire, resume_50mots, pays_cible, published_at, niveau_confiance')
    .eq('etat_code', 'PUBLIE')
    .order('published_at', { ascending: false })
    .limit(6)

  return (
    <>
      {/* ===== HERO ===== */}
      <section className="hero">
        <div className="container">
          <h1>
            La transition énergétique de vos véhicules,<br />
            <span className="accent">décodée par les chiffres.</span>
          </h1>
          <p className="lead">
            Aides, fiscalité, TCO réel, ZFE, motorisations 2026 — pour PME, artisans,
            transporteurs et particuliers. Données triangulées, sources officielles, zéro
            promesse marketing.
          </p>
          <div className="hero-actions">
            <Link href="/simulateur" className="btn btn-primary btn-lg">
              Calculer mon TCO en 2 min →
            </Link>
            <Link href="/articles" className="btn btn-secondary btn-lg">
              Lire les décryptages
            </Link>
          </div>

          <h2 style={{ fontSize: '1.05rem', color: 'var(--color-text-soft)', marginTop: 8, fontWeight: 600 }}>
            Vous êtes&nbsp;:
          </h2>
          <div className="profile-selector">
            <Link href="/b2b" className="profile-card">
              <div className="icon">🚐</div>
              <h3>Une entreprise, un artisan, une flotte</h3>
              <p>VUL, fourgons, camions, poids-lourds — TCO, CEE, suramortissement, ZFE.</p>
              <div className="arrow">Voir l&apos;espace B2B →</div>
            </Link>
            <Link href="/particulier" className="profile-card">
              <div className="icon">🚗</div>
              <h3>Un particulier, une famille</h3>
              <p>Voiture, VAE, trottinette, moto — bonus écologique, FMD, recharge à domicile.</p>
              <div className="arrow">Voir l&apos;espace Particulier →</div>
            </Link>
          </div>
        </div>
      </section>

      {/* ===== STATS ===== */}
      <section>
        <div className="container">
          <div className="stats-strip">
            <div className="stat">
              <div className="stat-value">8 600 €</div>
              <div className="stat-label">CEE max VUL électrique <span className="confidence high">FR</span></div>
            </div>
            <div className="stat">
              <div className="stat-value">30 000 €</div>
              <div className="stat-label">Suramortissement fiscal HT <span className="confidence high">FR</span></div>
            </div>
            <div className="stat">
              <div className="stat-value">800 €/an</div>
              <div className="stat-label">FMD employeur cumulable</div>
            </div>
            <div className="stat">
              <div className="stat-value">2035</div>
              <div className="stat-label">Fin moteurs thermiques UE (sauf e-fuels)</div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== À LA UNE ===== */}
      <section className="section-alt">
        <div className="container">
          <h2 className="section-title">À la une cette semaine</h2>
          <p className="section-subtitle">
            Veille triangulée — sources officielles, presse spécialisée, signaux digitaux.
          </p>

          <div className="cards-grid">
            {(articles ?? []).map((a) => {
              const p    = a.pays_cible as string
              const flag = FLAGS[p] ?? ''
              const conf = (a as Article).niveau_confiance ?? 'MOYEN'
              const date = a.published_at
                ? new Date(a.published_at).toLocaleDateString('fr-FR', {
                    day: 'numeric', month: 'long', year: 'numeric',
                  })
                : ''
              return (
                <article key={a.slug} className="card">
                  <span className="tag">{flag} {p}</span>
                  <h3>
                    <Link href={`/article/${a.slug}`} style={{ color: 'inherit' }}>
                      {a.titre_provisoire}
                    </Link>
                  </h3>
                  {a.resume_50mots && <p>{a.resume_50mots}</p>}
                  <div className="meta">
                    {date && <span>📅 {date}</span>}
                    <span className={`confidence ${CONF_CLASS[conf] ?? 'conf-medium'}`}>
                      {CONF_LABEL[conf] ?? 'Confiance MOYEN'}
                    </span>
                  </div>
                </article>
              )
            })}
          </div>

          <div style={{ textAlign: 'center', marginTop: 36 }}>
            <Link href="/articles" className="btn btn-secondary">
              Voir tous les décryptages →
            </Link>
          </div>
        </div>
      </section>

      {/* ===== POURQUOI MOTEURS.COM ===== */}
      <section>
        <div className="container">
          <h2 className="section-title">Pourquoi Moteurs.com</h2>
          <p className="section-subtitle">
            Un média éditorial 100 % autonome, conçu pour aider à décider — pas à vendre.
          </p>
          <div className="cards-grid">
            <div className="card">
              <h3>📊 TCO réel, pas TCO marketing</h3>
              <p>Nous calculons sur consommation réelle, pas WLTP. Hiver, charge utile, profil de conduite — tous nos paramètres sont modifiables.</p>
            </div>
            <div className="card">
              <h3>🔍 Triangulation systématique</h3>
              <p>Minimum 2 sources indépendantes par fait publié. Quand une donnée n&apos;est pas confirmée, nous le disons clairement.</p>
            </div>
            <div className="card">
              <h3>🌍 Multi-pays</h3>
              <p>France, Belgique, Suisse, Canada francophone. Aides, fiscalité, ZFE/LEZ — adaptées à votre territoire.</p>
            </div>
            <div className="card">
              <h3>⚖️ Compliance et transparence</h3>
              <p>Sources citées, dates de mise à jour visibles, niveaux de confiance affichés. Aucun conseil financier personnalisé déguisé.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ===== NEWSLETTER ===== */}
      <section className="newsletter">
        <div className="container">
          <h2>Une veille hebdomadaire, segmentée selon votre profil.</h2>
          <p>Recevez chaque vendredi les arbitrages économiques de la semaine — pas de spam, désinscription en 1 clic.</p>
          <NewsletterForm />
        </div>
      </section>
    </>
  )
}
