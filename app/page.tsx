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
          <div style={{ fontSize: '0.82rem', color: 'var(--color-primary)', fontWeight: 600, marginBottom: 14, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            Moteurs.com · Données 2026
          </div>
          <h1>
            Votre voiture vous coûte<br />
            <span className="accent">combien vraiment ?</span>
          </h1>
          <p className="lead">
            Carburant, péages, entretien, fiscalité, aides — calculez le vrai coût de votre motorisation
            et découvrez combien vous pouvez économiser en 2026.
          </p>
          <div className="hero-actions">
            <Link href="/comparer-trajet" className="btn btn-primary btn-lg">
              🏖️ Mon trajet vacances →
            </Link>
            <Link href="/outils" className="btn btn-secondary btn-lg">
              Tous les calculateurs
            </Link>
          </div>

          <h2 style={{ fontSize: '1.05rem', color: 'var(--color-text-soft)', marginTop: 32, fontWeight: 600 }}>
            Vous êtes&nbsp;:
          </h2>
          <div className="profile-selector">
            <Link href="/b2b" className="profile-card">
              <div className="icon">🚐</div>
              <h3>Une entreprise, un artisan, une flotte</h3>
              <p>VUL, fourgons, camions — TCO, CEE, suramortissement, ZFE.</p>
              <div className="arrow">Voir l&apos;espace B2B →</div>
            </Link>
            <Link href="/particulier" className="profile-card">
              <div className="icon">🚗</div>
              <h3>Un particulier, une famille</h3>
              <p>Voiture, VAE, trottinette — bonus écologique, recharge, trajets quotidiens.</p>
              <div className="arrow">Voir l&apos;espace Particulier →</div>
            </Link>
          </div>
        </div>
      </section>

      {/* ===== STATS ===== */}
      <section style={{ padding: '0', background: 'white', borderTop: '1px solid var(--color-border)', borderBottom: '1px solid var(--color-border)' }}>
        <div className="container" style={{ padding: '0 24px' }}>
          <div className="stats-strip" style={{ borderRadius: 0, border: 'none', borderLeft: '1px solid var(--color-border)', borderRight: '1px solid var(--color-border)' }}>
            <div className="stat">
              <div className="stat-value">68 €</div>
              <div className="stat-label">Économie aller-retour Paris-Nice élec vs diesel</div>
            </div>
            <div className="stat">
              <div className="stat-value">8 600 €</div>
              <div className="stat-label">CEE max VUL électrique <span className="confidence high">FR</span></div>
            </div>
            <div className="stat">
              <div className="stat-value">100 %</div>
              <div className="stat-label">Déductibilité VE entreprise Belgique jusqu'en 2027</div>
            </div>
            <div className="stat">
              <div className="stat-value">2035</div>
              <div className="stat-label">Fin moteurs thermiques neufs UE</div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== OUTILS ===== */}
      <section style={{ padding: '56px 0 48px' }}>
        <div className="container">
          <h2 className="section-title">Nos calculateurs gratuits</h2>
          <p className="section-subtitle">
            Des chiffres réels, pas des estimations marketing. Péages, consommation autoroute, aides 2026 — tout est inclus.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20, marginBottom: 32 }}>
            {/* Outil phare */}
            <Link href="/comparer-trajet" style={{ textDecoration: 'none', gridColumn: 'span 1' }}>
              <div style={{
                background: 'linear-gradient(135deg, rgba(122,240,194,0.08), rgba(59,130,246,0.06))',
                border: '2px solid rgba(122,240,194,0.35)',
                borderRadius: 14, padding: '26px 24px',
                display: 'flex', flexDirection: 'column', gap: 12, height: '100%',
                cursor: 'pointer', transition: 'transform .15s',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <span style={{ fontSize: '2.2rem' }}>🏖️</span>
                  <span style={{
                    background: 'var(--color-primary)', color: '#0a1628',
                    borderRadius: 20, padding: '3px 12px',
                    fontSize: '0.7rem', fontWeight: 800,
                  }}>NOUVEAU</span>
                </div>
                <div>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: 6 }}>Trajet vacances</h3>
                  <p style={{ fontSize: '0.88rem', color: 'var(--color-text-muted)', lineHeight: 1.5, margin: 0 }}>
                    Combien coûte votre trajet selon votre motorisation ? Péages et énergie inclus, 25 routes populaires.
                  </p>
                </div>
                <span style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--color-primary)', marginTop: 'auto' }}>
                  Calculer mon trajet →
                </span>
              </div>
            </Link>

            <Link href="/simulateur" style={{ textDecoration: 'none' }}>
              <div style={{
                background: 'var(--color-bg-card)', border: '1.5px solid var(--color-border)',
                borderRadius: 14, padding: '26px 24px',
                display: 'flex', flexDirection: 'column', gap: 12, height: '100%',
                cursor: 'pointer', transition: 'border-color .15s',
              }}>
                <span style={{ fontSize: '2.2rem' }}>🧮</span>
                <div>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: 6 }}>Simulateur TCO</h3>
                  <p style={{ fontSize: '0.88rem', color: 'var(--color-text-muted)', lineHeight: 1.5, margin: 0 }}>
                    Coût total sur 3 à 5 ans selon votre profil : km/an, segment, pays, motorisation.
                  </p>
                </div>
                <span style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--color-primary)', marginTop: 'auto' }}>
                  Lancer le simulateur →
                </span>
              </div>
            </Link>

            <Link href="/comparer" style={{ textDecoration: 'none' }}>
              <div style={{
                background: 'var(--color-bg-card)', border: '1.5px solid var(--color-border)',
                borderRadius: 14, padding: '26px 24px',
                display: 'flex', flexDirection: 'column', gap: 12, height: '100%',
                cursor: 'pointer', transition: 'border-color .15s',
              }}>
                <span style={{ fontSize: '2.2rem' }}>📊</span>
                <div>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: 6 }}>Comparateur motorisations</h3>
                  <p style={{ fontSize: '0.88rem', color: 'var(--color-text-muted)', lineHeight: 1.5, margin: 0 }}>
                    Diesel, essence, électrique, hydrogène — visualisez le TCO côte à côte.
                  </p>
                </div>
                <span style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--color-primary)', marginTop: 'auto' }}>
                  Comparer →
                </span>
              </div>
            </Link>
          </div>

          <div style={{ textAlign: 'center' }}>
            <Link href="/outils" className="btn btn-secondary">
              Voir tous les calculateurs →
            </Link>
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
            Des chiffres vrais, pas des promesses — pour des décisions d&apos;achat et de gestion de flotte éclairées.
          </p>
          <div className="cards-grid">
            <div className="card">
              <h3>📊 Consommation réelle, pas WLTP</h3>
              <p>Nos calculs utilisent les consommations autoroute, hivernales et en charge — pas les valeurs constructeur idéalisées.</p>
            </div>
            <div className="card">
              <h3>🔍 Triangulation systématique</h3>
              <p>Minimum 2 sources indépendantes par fait publié. Niveaux de confiance affichés. Quand une donnée n&apos;est pas confirmée, on le dit.</p>
            </div>
            <div className="card">
              <h3>🌍 France, Belgique, Suisse, Canada, Luxembourg</h3>
              <p>Aides, fiscalité, ZFE/LEZ — chaque décryptage est adapté à votre territoire et à votre réglementation.</p>
            </div>
            <div className="card">
              <h3>⚖️ Aucun conseil financier déguisé</h3>
              <p>Sources citées, dates de mise à jour visibles. Moteurs.com est un outil d&apos;information, pas un vendeur.</p>
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
