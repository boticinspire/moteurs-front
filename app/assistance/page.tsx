import type { Metadata } from 'next'
import AssistanceHub from './AssistanceHub'

export const metadata: Metadata = {
  title: 'Hub Assistance Auto — Coûts, Recharge, Vacances, Achat | Moteurs.com',
  description:
    'Votre assistant automobile intelligent : coût mensuel réel, stratégie de recharge VE, budget vacances, aide à l\'achat, démarches administratives. Posez votre question, on vous guide.',
  openGraph: {
    title: 'Assistant Moteurs.com — Votre copilote pour la voiture',
    description: 'Coûts, recharge, vacances, achat, panne, administratif — 6 modules d\'assistance automobile gratuits.',
  },
}

export default function PageAssistance() {
  return (
    <main className="container" style={{ paddingTop: 48, paddingBottom: 72 }}>

      {/* ── Hero ── */}
      <div style={{ textAlign: 'center', marginBottom: 52 }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          padding: '6px 16px', borderRadius: 20, marginBottom: 18,
          background: 'rgba(26,95,196,0.07)', border: '1px solid rgba(26,95,196,0.2)',
          fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-primary)',
          textTransform: 'uppercase', letterSpacing: '0.05em',
        }}>
          🤖 Assistant Moteurs — Été 2026
        </div>

        <h1 style={{ fontSize: 'clamp(1.7rem, 4vw, 2.6rem)', lineHeight: 1.18, marginBottom: 16 }}>
          Le marché auto devient complexe.<br />
          <span style={{ color: 'var(--color-primary)' }}>On démêle tout pour vous.</span>
        </h1>

        <p style={{
          maxWidth: 560, margin: '0 auto 36px', color: 'var(--color-text-soft)',
          fontSize: '1.02rem', lineHeight: 1.65,
        }}>
          VE, recharge, fiscalité, leasing, aides, inflation — posez votre question en langage naturel.
          Notre assistant vous redirige vers le bon outil ou calcule directement.
        </p>

        {/* Statistiques de frustration */}
        <div style={{
          display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: 10, marginBottom: 44,
        }}>
          {[
            '😰 72% des acheteurs VE désorientés',
            '💸 Coût réel voiture sous-estimé de 340 €/mois en moyenne',
            '🔌 60% des conducteurs VE ignorent les aides recharge',
          ].map(s => (
            <span key={s} style={{
              padding: '6px 14px', borderRadius: 20, fontSize: '0.78rem',
              background: 'var(--color-bg-alt)', border: '1px solid var(--color-border)',
              color: 'var(--color-text-soft)',
            }}>
              {s}
            </span>
          ))}
        </div>

        {/* Hub interactif */}
        <AssistanceHub />
      </div>

      {/* ── Pourquoi l'assistance ── */}
      <section style={{ borderTop: '1px solid var(--color-border)', paddingTop: 56, marginTop: 24 }}>
        <h2 style={{ textAlign: 'center', marginBottom: 10, fontSize: '1.3rem' }}>
          Pourquoi l&apos;assistance devient plus importante que l&apos;actualité
        </h2>
        <p style={{ textAlign: 'center', color: 'var(--color-text-soft)', marginBottom: 40, maxWidth: 520, margin: '0 auto 40px' }}>
          L&apos;automobile 2026 est devenue anxiogène, complexe et coûteuse. Les gens ne veulent plus lire des articles — ils veulent des réponses à leur situation précise.
        </p>
        <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
          {[
            { icon: '🎯', titre: 'Personnalisé', desc: 'Vos km, votre véhicule, votre pays, vos charges. Pas des moyennes nationales déconnectées de votre réalité.' },
            { icon: '🔢', titre: 'Chiffré', desc: 'Chaque réponse est un calcul. Pas "ça dépend" — un montant précis avec les hypothèses affichées.' },
            { icon: '⚡', titre: 'Immédiat', desc: 'Résultat en 2 minutes. Pas besoin de chercher un comparateur, un forum ou un expert.' },
            { icon: '🔗', titre: 'Orienté action', desc: 'Chaque bilan propose une étape suivante : simuler, comparer, accéder à l\'aide officielle.' },
          ].map(item => (
            <div key={item.titre} style={{
              background: 'white', borderRadius: 12,
              border: '1px solid var(--color-border)', padding: '20px 18px',
            }}>
              <div style={{ fontSize: '1.6rem', marginBottom: 10 }}>{item.icon}</div>
              <div style={{ fontWeight: 700, marginBottom: 6, fontSize: '0.97rem' }}>{item.titre}</div>
              <p style={{ fontSize: '0.84rem', color: 'var(--color-text-soft)', margin: 0, lineHeight: 1.55 }}>{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA Calculateurs classiques ── */}
      <section style={{ marginTop: 52, textAlign: 'center' }}>
        <p style={{ color: 'var(--color-text-soft)', marginBottom: 16, fontSize: '0.9rem' }}>
          Préférez les calculateurs directs ?
        </p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 12, flexWrap: 'wrap' }}>
          <a href="/comparer-trajet" className="btn btn-secondary">🏖️ Comparateur trajet</a>
          <a href="/comparer" className="btn btn-secondary">📊 Comparateur TCO</a>
          <a href="/simulateur" className="btn btn-secondary">🧮 Simulateur TCO</a>
          <a href="/outils" className="btn btn-secondary">⚡ Tous les outils</a>
        </div>
      </section>
    </main>
  )
}
