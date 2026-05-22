import type { Metadata } from 'next'
import AssistantVacances from './AssistantVacances'

export const metadata: Metadata = {
  title: 'Assistant Vacances Auto — Budget, péages, recharge, trafic | Moteurs.com',
  description:
    'Planifiez votre trajet vacances en voiture : budget total (transport + hébergement), itinéraire économique, stratégie de recharge VE, alertes trafic, conseils bagages. Le Google Maps économique automobile.',
  openGraph: {
    title: 'Assistant Vacances Auto — Combien va coûter votre voyage ?',
    description: 'Budget transport + hébergement, itinéraire économique, recharge VE, trafic, bagages — tout en un.',
  },
}

export default function PageAssistantVacances() {
  return (
    <main className="container" style={{ paddingTop: 40, paddingBottom: 64 }}>

      {/* ── Hero ── */}
      <div style={{ textAlign: 'center', marginBottom: 44 }}>
        <div style={{ fontSize: '0.82rem', color: 'var(--color-primary)', fontWeight: 600, marginBottom: 10, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
          Outil gratuit · Été 2026
        </div>
        <h1 style={{ fontSize: 'clamp(1.6rem, 4vw, 2.4rem)', marginBottom: 14, lineHeight: 1.2 }}>
          Votre voyage vacances va coûter<br />
          <span style={{ color: 'var(--color-primary)' }}>combien exactement ?</span>
        </h1>
        <p style={{ maxWidth: 580, margin: '0 auto', color: 'var(--color-text-muted)', fontSize: '0.98rem', lineHeight: 1.65 }}>
          Budget complet (transport + hébergement), itinéraire économique, stratégie recharge VE,
          alertes trafic et conseils personnalisés — en 3 étapes.
        </p>

        {/* Badges */}
        <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: 8, marginTop: 20 }}>
          {[
            '💰 Budget total voyage',
            '🗺️ Itinéraire économique',
            '⚡ Stratégie recharge VE',
            '🚨 Alertes trafic saisonnières',
            '🧳 Calculateur bagages',
            '🏨 Hôtels avec borne',
          ].map(b => (
            <span key={b} style={{
              padding: '5px 14px', borderRadius: 20, fontSize: '0.78rem',
              background: 'rgba(122,240,194,0.08)', border: '1px solid rgba(122,240,194,0.2)',
              color: 'var(--color-primary)',
            }}>
              {b}
            </span>
          ))}
        </div>
      </div>

      {/* ── Wizard ── */}
      <AssistantVacances />

      {/* ── Section pédagogique ── */}
      <section style={{ marginTop: 72, borderTop: '1px solid var(--color-border)', paddingTop: 48 }}>
        <h2 style={{ textAlign: 'center', marginBottom: 10, fontSize: '1.3rem' }}>
          Votre copilote économique pour les vacances
        </h2>
        <p style={{ textAlign: 'center', color: 'var(--color-text-muted)', marginBottom: 36, maxWidth: 500, margin: '0 auto 36px' }}>
          Pas juste un calculateur de carburant — un vrai bilan de voyage.
        </p>
        <div style={{ display: 'grid', gap: 18, gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
          {[
            {
              icon: '💰',
              titre: 'Budget total réaliste',
              desc: 'Énergie + péages aller-retour + hébergement N nuits. Coût par adulte affiché. Fini les mauvaises surprises.',
            },
            {
              icon: '🗺️',
              titre: 'Itinéraire économique',
              desc: 'Autoroute vs route nationale : on calcule l\'économie réelle sur les péages et la valeur de votre temps perdu.',
            },
            {
              icon: '⚡',
              titre: 'Stratégie recharge VE',
              desc: 'DC autoroute (0,45 €/kWh) vs AC hôtel nuit (0,18 €/kWh). On vous dit combien économiser et comment planifier.',
            },
            {
              icon: '🚨',
              titre: 'Trafic & heure de départ',
              desc: 'Alertes Bison Futé intégrées : jours à éviter, heures conseillées pour chaque mois de l\'été.',
            },
            {
              icon: '🧳',
              titre: 'Bagages & coffre',
              desc: 'Coffre de votre catégorie + galerie de toit optionnelle. Vérification automatique : votre équipement rentre-t-il ?',
            },
            {
              icon: '🎯',
              titre: 'Conseils personnalisés',
              desc: 'Enfants à bord, animal, PHEV, VE — des recommandations adaptées à votre profil exact.',
            },
          ].map(item => (
            <div key={item.titre} style={{
              background: 'var(--color-bg-card)', borderRadius: 12,
              border: '1px solid var(--color-border)', padding: '20px 18px',
            }}>
              <div style={{ fontSize: '1.6rem', marginBottom: 10 }}>{item.icon}</div>
              <div style={{ fontWeight: 700, marginBottom: 6, fontSize: '0.95rem' }}>{item.titre}</div>
              <p style={{ fontSize: '0.84rem', color: 'var(--color-text-muted)', margin: 0, lineHeight: 1.55 }}>
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA outils complémentaires ── */}
      <section style={{ marginTop: 52, textAlign: 'center' }}>
        <p style={{ color: 'var(--color-text-muted)', marginBottom: 16 }}>
          Comparez aussi les motorisations pour votre prochain achat :
        </p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 12, flexWrap: 'wrap' }}>
          <a href="/comparer-trajet" className="btn btn-primary">
            🏖️ Comparateur trajet →
          </a>
          <a href="/comparer" className="btn btn-secondary">
            📊 Comparateur TCO
          </a>
          <a href="/simulateur" className="btn btn-secondary">
            🧮 Simulateur personnalisé
          </a>
        </div>
      </section>
    </main>
  )
}
