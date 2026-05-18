import Link from 'next/link'
import { supabase, FLAGS, CONF_CLASS, CONF_LABEL, type Article } from '@/lib/supabase'
import NewsletterForm from '@/components/NewsletterForm'

export const revalidate = 60

export const metadata = {
  title: 'Calculateur TCO & Coût de Trajet Motorisation | Moteurs.com — France, Belgique, Suisse',
  description:
    'Comparez le vrai coût de vos trajets et le TCO sur 5 ans : diesel, essence, électrique, hybride. Péages réels, recharge, aides 2026 — pour particuliers, PME et flottes en France, Belgique, Suisse et Canada.',
}

export default async function HomePage() {
  const { data: articles } = await supabase
    .from('articles')
    .select('slug, titre_provisoire, resume_50mots, pays_cible, published_at, niveau_confiance')
    .eq('etat_code', 'PUBLIE')
    .order('published_at', { ascending: false })
    .limit(6)

  return (
    <>
      {/* ===== BANDEAU SAISONNIER ===== */}
      <div style={{
        background: 'linear-gradient(90deg, #0369a1 0%, #0ea5e9 40%, #06b6d4 70%, #10b981 100%)',
        color: '#fff',
        textAlign: 'center',
        padding: '11px 16px',
        fontSize: '0.88rem',
        fontWeight: 600,
        letterSpacing: '0.01em',
      }}>
        🌅 Spécial Été 2026 — Calculez le vrai coût de votre trajet vacances avant de partir&nbsp;
        <Link href="/comparer-trajet" style={{ color: '#fff', textDecoration: 'underline', textUnderlineOffset: 3, marginLeft: 6 }}>
          Essayer →
        </Link>
      </div>

      {/* ===== HERO ===== */}
      <section className="hero" style={{
        background: 'linear-gradient(160deg, #0c1a2e 0%, #0a3050 55%, #073d3a 100%)',
      }}>
        <div className="container">
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            fontSize: '0.78rem', fontWeight: 700, marginBottom: 18,
            letterSpacing: '0.07em', textTransform: 'uppercase',
            background: 'rgba(14,165,233,0.15)', border: '1px solid rgba(14,165,233,0.35)',
            borderRadius: 20, padding: '5px 14px', color: '#7af0c2',
          }}>
            🏖️ Spécial Vacances · Été 2026
          </div>

          <h1>
            Calculateur TCO &amp; coût de trajet —<br />
            <span className="accent">diesel, essence, électrique, hybride</span>
          </h1>
          <p className="lead">
            Comparez le vrai coût de vos déplacements selon votre motorisation : TCO sur 5 ans,
            coût de trajet avec péages et recharge, aides 2026. Pour particuliers, artisans et
            flottes en France, Belgique, Suisse et Canada.
          </p>
          <p style={{ fontSize: '0.87rem', color: 'rgba(255,255,255,0.65)', marginTop: -8, marginBottom: 4 }}>
            🌅 Été 2026 — 25 routes de vacances analysées avec péages réels
          </p>
          <div className="hero-actions">
            <Link href="/comparer-trajet" className="btn btn-primary btn-lg">
              🏖️ Calculer mon trajet vacances →
            </Link>
            <Link href="/checklist-depart" className="btn btn-secondary btn-lg">
              ✅ Ma checklist départ
            </Link>
          </div>

          {/* Badges rassurants */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 28 }}>
            {[
              '25 routes populaires',
              'Péages inclus',
              'Bornes de recharge',
              'Coût réel, pas WLTP',
              'Gratuit & sans inscription',
            ].map(b => (
              <span key={b} style={{
                padding: '4px 13px', borderRadius: 20,
                fontSize: '0.75rem', fontWeight: 600,
                background: 'rgba(255,255,255,0.07)',
                border: '1px solid rgba(255,255,255,0.15)',
                color: 'rgba(255,255,255,0.75)',
              }}>{b}</span>
            ))}
          </div>

          <div style={{ marginTop: 36, borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 28 }}>
            <div style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.5)', marginBottom: 14, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Vous êtes&nbsp;:
            </div>
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
              <div className="stat-value">25</div>
              <div className="stat-label">Routes de vacances analysées avec péages réels</div>
            </div>
            <div className="stat">
              <div className="stat-value">100 %</div>
              <div className="stat-label">Déductibilité VE entreprise Belgique jusqu&apos;en 2027</div>
            </div>
            <div className="stat">
              <div className="stat-value">2035</div>
              <div className="stat-label">Fin moteurs thermiques neufs UE</div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== ENCART VACANCES ===== */}
      <section style={{
        padding: '52px 0 48px',
        background: 'linear-gradient(135deg, rgba(3,105,161,0.05) 0%, rgba(16,185,129,0.05) 100%)',
        borderBottom: '1px solid var(--color-border)',
      }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: 36 }}>
            <div style={{
              display: 'inline-block', marginBottom: 12,
              fontSize: '0.72rem', fontWeight: 800, letterSpacing: '0.08em',
              padding: '4px 14px', borderRadius: 20,
              background: 'rgba(14,165,233,0.1)', color: '#0369a1',
              border: '1px solid rgba(14,165,233,0.2)',
              textTransform: 'uppercase',
            }}>
              🌅 Spécial Départ en Vacances
            </div>
            <h2 style={{ fontSize: 'clamp(1.25rem, 3vw, 1.75rem)', marginBottom: 10 }}>
              Tout pour préparer votre départ — sans mauvaises surprises
            </h2>
            <p style={{ color: 'var(--color-text-soft)', maxWidth: 540, margin: '0 auto', fontSize: '0.94rem', lineHeight: 1.65 }}>
              Coût du trajet, checklist voiture et animaux, assistance en cas de panne —
              nos outils vous préparent avant même de boucler les valises.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 18 }}>
            {/* Trajet vacances — STAR */}
            <Link href="/comparer-trajet" style={{ textDecoration: 'none' }}>
              <div style={{
                background: 'linear-gradient(135deg, rgba(14,165,233,0.1), rgba(16,185,129,0.08))',
                border: '2px solid rgba(14,165,233,0.3)',
                borderRadius: 16, padding: '28px 24px',
                display: 'flex', flexDirection: 'column', gap: 12, height: '100%',
                cursor: 'pointer',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <span style={{ fontSize: '2.2rem' }}>🗺️</span>
                  <span style={{
                    background: 'var(--color-primary)', color: '#0a1628',
                    borderRadius: 20, padding: '3px 12px',
                    fontSize: '0.68rem', fontWeight: 800, letterSpacing: '0.04em',
                  }}>INCONTOURNABLE</span>
                </div>
                <div>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 800, marginBottom: 6 }}>Mon trajet vacances</h3>
                  <p style={{ fontSize: '0.87rem', color: 'var(--color-text-muted)', lineHeight: 1.5, margin: 0 }}>
                    Péages + énergie + recharge — calculez et comparez le coût exact selon votre motorisation sur 25 routes populaires.
                  </p>
                </div>
                <span style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--color-primary)', marginTop: 'auto' }}>
                  Calculer mon trajet →
                </span>
              </div>
            </Link>

            {/* Checklist départ */}
            <Link href="/checklist-depart" style={{ textDecoration: 'none' }}>
              <div style={{
                background: 'var(--color-bg-card)', border: '1.5px solid var(--color-border)',
                borderRadius: 16, padding: '28px 24px',
                display: 'flex', flexDirection: 'column', gap: 12, height: '100%',
                cursor: 'pointer',
              }}>
                <span style={{ fontSize: '2.2rem' }}>✅</span>
                <div>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 800, marginBottom: 6 }}>Checklist départ</h3>
                  <p style={{ fontSize: '0.87rem', color: 'var(--color-text-muted)', lineHeight: 1.5, margin: 0 }}>
                    Voiture, documents, animaux, bébé — votre liste personnalisée selon votre profil. Export PDF inclus.
                  </p>
                </div>
                <span style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--color-primary)', marginTop: 'auto' }}>
                  Préparer mon départ →
                </span>
              </div>
            </Link>

            {/* Assistant vacances */}
            <Link href="/assistant-vacances" style={{ textDecoration: 'none' }}>
              <div style={{
                background: 'var(--color-bg-card)', border: '1.5px solid var(--color-border)',
                borderRadius: 16, padding: '28px 24px',
                display: 'flex', flexDirection: 'column', gap: 12, height: '100%',
                cursor: 'pointer',
              }}>
                <span style={{ fontSize: '2.2rem' }}>🤖</span>
                <div>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 800, marginBottom: 6 }}>Assistant Vacances IA</h3>
                  <p style={{ fontSize: '0.87rem', color: 'var(--color-text-muted)', lineHeight: 1.5, margin: 0 }}>
                    Posez vos questions : recharge sur route, bornes autoroute, ZFE à éviter, budget carburant réaliste.
                  </p>
                </div>
                <span style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--color-primary)', marginTop: 'auto' }}>
                  Poser une question →
                </span>
              </div>
            </Link>
          </div>

          <div style={{ textAlign: 'center', marginTop: 28 }}>
            <Link href="/outils" style={{
              display: 'inline-block', padding: '10px 22px',
              background: 'transparent', border: '1.5px solid rgba(14,165,233,0.3)',
              borderRadius: 10, color: '#0369a1', fontWeight: 600, fontSize: '0.88rem',
              textDecoration: 'none',
            }}>
              Voir tous les outils →
            </Link>
          </div>
        </div>
      </section>

      {/* ===== AUTRES CALCULATEURS ===== */}
      <section style={{ padding: '52px 0 44px' }}>
        <div className="container">
          <h2 className="section-title">Nos calculateurs TCO</h2>
          <p className="section-subtitle">
            Coût total sur 3 à 5 ans, aides 2026, fiscalité par pays — pour les décisions d&apos;achat et de flotte.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 18, marginBottom: 28 }}>
            <Link href="/simulateur" style={{ textDecoration: 'none' }}>
              <div style={{
                background: 'var(--color-bg-card)', border: '1.5px solid var(--color-border)',
                borderRadius: 14, padding: '24px 22px',
                display: 'flex', flexDirection: 'column', gap: 12, height: '100%',
                cursor: 'pointer',
              }}>
                <span style={{ fontSize: '2rem' }}>🧮</span>
                <div>
                  <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 5 }}>Simulateur TCO</h3>
                  <p style={{ fontSize: '0.86rem', color: 'var(--color-text-muted)', lineHeight: 1.5, margin: 0 }}>
                    Coût total sur 3 à 5 ans selon votre profil : km/an, segment, pays, motorisation.
                  </p>
                </div>
                <span style={{ fontSize: '0.86rem', fontWeight: 700, color: 'var(--color-primary)', marginTop: 'auto' }}>
                  Lancer le simulateur →
                </span>
              </div>
            </Link>

            <Link href="/comparer" style={{ textDecoration: 'none' }}>
              <div style={{
                background: 'var(--color-bg-card)', border: '1.5px solid var(--color-border)',
                borderRadius: 14, padding: '24px 22px',
                display: 'flex', flexDirection: 'column', gap: 12, height: '100%',
                cursor: 'pointer',
              }}>
                <span style={{ fontSize: '2rem' }}>📊</span>
                <div>
                  <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 5 }}>Comparateur motorisations</h3>
                  <p style={{ fontSize: '0.86rem', color: 'var(--color-text-muted)', lineHeight: 1.5, margin: 0 }}>
                    Diesel, essence, électrique, hybride, hydrogène — TCO côte à côte avec graphiques.
                  </p>
                </div>
                <span style={{ fontSize: '0.86rem', fontWeight: 700, color: 'var(--color-primary)', marginTop: 'auto' }}>
                  Comparer →
                </span>
              </div>
            </Link>

            <Link href="/assistance" style={{ textDecoration: 'none' }}>
              <div style={{
                background: 'var(--color-bg-card)', border: '1.5px solid var(--color-border)',
                borderRadius: 14, padding: '24px 22px',
                display: 'flex', flexDirection: 'column', gap: 12, height: '100%',
                cursor: 'pointer',
              }}>
                <span style={{ fontSize: '2rem' }}>🛡️</span>
                <div>
                  <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 5 }}>Hub Assistance Voyage</h3>
                  <p style={{ fontSize: '0.86rem', color: 'var(--color-text-muted)', lineHeight: 1.5, margin: 0 }}>
                    Santé, location, surprises, surprises en route — guides et conseils pratiques.
                  </p>
                </div>
                <span style={{ fontSize: '0.86rem', fontWeight: 700, color: 'var(--color-primary)', marginTop: 'auto' }}>
                  Voir les guides →
                </span>
              </div>
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
