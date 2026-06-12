import type { Metadata } from 'next'
import ChecklistDepart from './ChecklistDepart'

export const metadata: Metadata = {
  title: 'Check-list départ en vacances — Moteurs.com',
  description: 'Checklist interactive personnalisée avant de prendre la route : véhicule, documents, sécurité, VE, bébé, animaux. Estimation fatigue conducteur et pauses intelligentes.',
  openGraph: {
    title: 'Check-list départ en vacances — Moteurs.com',
    description: 'Checklist interactive personnalisée avant de prendre la route : véhicule, documents, sécurité, VE, bébé, animaux.',
    url: 'https://moteurs.com/checklist-depart',
  },
  alternates: { canonical: 'https://moteurs.com/checklist-depart' },
}

const AVANTAGES = [
  {
    icon: '✅',
    titre: 'Personnalisée selon votre voyage',
    desc: 'La liste s\'adapte automatiquement à votre profil : famille avec bébé, véhicule électrique, animaux, séjour à l\'étranger, camping — seuls les points pertinents sont affichés.',
  },
  {
    icon: '😴',
    titre: 'Score fatigue conducteur',
    desc: 'L\'algorithme analyse distance, heure de départ, nombre de conducteurs et présence de bébé pour vous donner un indice de fatigue réaliste et des recommandations.',
  },
  {
    icon: '🗺️',
    titre: 'Pauses intelligentes planifiées',
    desc: 'Calcul automatique des arrêts recommandés toutes les 2h/200 km (1h30 avec bébé ou animaux), avec détection des horaires repas et horaires nocturnes.',
  },
  {
    icon: '🚨',
    titre: 'Alertes urgences intégrées',
    desc: 'Les points critiques à ne jamais oublier — papiers de bord, médicaments essentiels, sécurité enfants — sont mis en évidence en rouge pour attirer votre attention.',
  },
]

export default function ChecklistDepartPage() {
  return (
    <>
      {/* ── Hero ── */}
      <section className="page-hero">
        <div className="container">
          <div style={{
            fontSize: '0.82rem', color: 'var(--color-primary)',
            fontWeight: 600, marginBottom: 10,
            textTransform: 'uppercase', letterSpacing: '0.05em',
          }}>
            Gratuit · 55+ points de contrôle · Personnalisé
          </div>
          <h1>Check-list départ en vacances</h1>
          <p style={{ maxWidth: 560, margin: '0 auto' }}>
            Ne partez plus sans avoir tout vérifié. Remplissez votre profil de voyage
            et obtenez une checklist sur-mesure avec estimation de fatigue
            et planning de pauses intelligent.
          </p>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap', marginTop: 20 }}>
            {['Famille', 'Bébé à bord', 'Véhicule électrique', 'Camping-car', 'Animaux', 'Étranger'].map(tag => (
              <span key={tag} style={{
                fontSize: '0.78rem', fontWeight: 600,
                padding: '4px 12px', borderRadius: 20,
                background: 'rgba(122,240,194,0.12)',
                color: 'var(--color-primary)',
                border: '1px solid rgba(122,240,194,0.25)',
              }}>
                {tag}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── Outil interactif ── */}
      <section style={{ padding: '40px 0' }}>
        <div className="container">
          <ChecklistDepart />
        </div>
      </section>

      {/* ── Section pédagogique ── */}
      <section style={{ padding: '40px 0 64px', borderTop: '1px solid var(--color-border)' }}>
        <div className="container">
          <h2 style={{ textAlign: 'center', fontSize: '1.3rem', fontWeight: 700, marginBottom: 8 }}>
            Pourquoi une checklist avant de partir ?
          </h2>
          <p style={{ textAlign: 'center', color: 'var(--color-text-muted)', maxWidth: 540, margin: '0 auto 36px' }}>
            80 % des accidents de vacances surviennent lors des premiers 200 km, souvent sous l&apos;effet de la précipitation
            et du manque de préparation.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 20 }}>
            {AVANTAGES.map((a) => (
              <div key={a.titre} style={{
                background: 'var(--color-bg-card)',
                border: '1px solid var(--color-border)',
                borderRadius: 14, padding: '24px 22px',
              }}>
                <div style={{ fontSize: '2rem', marginBottom: 12 }}>{a.icon}</div>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 8, color: 'var(--color-text)' }}>
                  {a.titre}
                </h3>
                <p style={{ fontSize: '0.88rem', color: 'var(--color-text-muted)', lineHeight: 1.6, margin: 0 }}>
                  {a.desc}
                </p>
              </div>
            ))}
          </div>

          {/* CTA bas de page */}
          <div style={{
            marginTop: 48, padding: '32px 28px',
            background: 'var(--color-bg-card)',
            border: '1.5px solid var(--color-border)',
            borderRadius: 16, textAlign: 'center',
          }}>
            <div style={{ fontSize: '1.6rem', marginBottom: 12 }}>🏖️</div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 8 }}>
              Planifiez aussi votre budget voyage
            </h3>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', marginBottom: 20, maxWidth: 460, margin: '0 auto 20px' }}>
              Combien vous coûtera vraiment ce trajet ? Péages, carburant/recharge, hébergement
              et comparatif entre motorisations sur votre itinéraire exact.
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
              <a href="/assistant-vacances" style={{
                display: 'inline-block', padding: '11px 24px',
                background: 'var(--color-primary)', color: '#0a1628',
                borderRadius: 8, fontWeight: 700, fontSize: '0.9rem',
                textDecoration: 'none',
              }}>
                🏖️ Assistant Vacances complet
              </a>
              <a href="/comparer-trajet" style={{
                display: 'inline-block', padding: '11px 24px',
                background: 'var(--color-bg-alt)', color: 'var(--color-text)',
                borderRadius: 8, fontWeight: 700, fontSize: '0.9rem',
                textDecoration: 'none', border: '1px solid var(--color-border)',
              }}>
                📊 Comparer les motorisations
              </a>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
