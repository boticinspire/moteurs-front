import type { Metadata } from 'next'
import ComparateurTrajet from './ComparateurTrajet'

export const metadata: Metadata = {
  title: 'Comparateur coût trajet vacances — Diesel, Électrique, Hybride | Moteurs.com',
  description:
    'Calculez et comparez le coût réel de votre trajet vacances selon la motorisation : diesel, essence, électrique, hybride rechargeable. Péages, énergie, arrêts de recharge — tout inclus.',
  openGraph: {
    title: 'Combien coûte votre trajet vacances selon la motorisation ?',
    description: 'Comparateur gratuit : diesel vs électrique vs hybride pour vos trajets en voiture.',
  },
}

export default function PageComparateurTrajet() {
  return (
    <main className="container" style={{ paddingTop: 40, paddingBottom: 64 }}>
      {/* ── Hero ── */}
      <div style={{ textAlign: 'center', marginBottom: 40 }}>
        <div style={{ fontSize: '0.85rem', color: 'var(--color-primary)', fontWeight: 600, marginBottom: 10, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
          Outil gratuit · Mis à jour 2026
        </div>
        <h1 style={{ fontSize: 'clamp(1.6rem, 4vw, 2.4rem)', marginBottom: 14, lineHeight: 1.2 }}>
          Combien va coûter votre trajet<br />
          <span style={{ color: 'var(--color-primary)' }}>selon votre motorisation ?</span>
        </h1>
        <p style={{ maxWidth: 560, margin: '0 auto', color: 'var(--color-text-muted)', fontSize: '1rem', lineHeight: 1.6 }}>
          Carburant, péages, arrêts de recharge — comparez le vrai coût de vos vacances en diesel, essence, électrique ou hybride.
        </p>

        {/* Badges clés */}
        <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: 10, marginTop: 20 }}>
          {[
            '🗺️ 25 trajets populaires',
            '⚡ Arrêts de recharge calculés',
            '🛣️ Péages inclus',
            '✏️ Saisie libre',
          ].map(b => (
            <span key={b} style={{
              padding: '5px 14px', borderRadius: 20, fontSize: '0.8rem',
              background: 'rgba(122,240,194,0.08)', border: '1px solid rgba(122,240,194,0.2)',
              color: 'var(--color-primary)',
            }}>
              {b}
            </span>
          ))}
        </div>
      </div>

      {/* ── Comparateur ── */}
      <ComparateurTrajet />

      {/* ── Section pédagogique ── */}
      <section style={{ marginTop: 64, borderTop: '1px solid var(--color-border)', paddingTop: 40 }}>
        <h2 style={{ textAlign: 'center', marginBottom: 32, fontSize: '1.3rem' }}>
          Ce que ce comparateur prend en compte
        </h2>
        <div style={{ display: 'grid', gap: 20, gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
          {[
            {
              icon: '⛽',
              titre: 'Coût énergie réel',
              desc: 'Consommations autoroute (plus élevées qu\'en ville). Prix carburant et électricité actualisés 2026.',
            },
            {
              icon: '🛣️',
              titre: 'Péages précis',
              desc: 'Montants réels pour chaque trajet pré-renseigné. Tarifs standard 2026, hors abonnement télépéage.',
            },
            {
              icon: '⚡',
              titre: 'Arrêts de recharge VE',
              desc: 'Nombre d\'arrêts calculé selon l\'autonomie réelle autoroute (~270 km). Durée de recharge ajoutée au temps de trajet.',
            },
            {
              icon: '🔋',
              titre: 'PHEV bien calculé',
              desc: 'Les 50 premiers km en électrique, puis thermique. Pas de tromperie sur la consommation réelle.',
            },
          ].map(item => (
            <div key={item.titre} style={{
              background: 'var(--color-bg-card)', borderRadius: 12,
              border: '1px solid var(--color-border)', padding: '20px 18px',
            }}>
              <div style={{ fontSize: '1.6rem', marginBottom: 10 }}>{item.icon}</div>
              <div style={{ fontWeight: 700, marginBottom: 6 }}>{item.titre}</div>
              <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', margin: 0, lineHeight: 1.5 }}>
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA outils complémentaires ── */}
      <section style={{ marginTop: 48, textAlign: 'center' }}>
        <p style={{ color: 'var(--color-text-muted)', marginBottom: 16 }}>
          Vous envisagez de changer de véhicule ? Allez plus loin :
        </p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 12, flexWrap: 'wrap' }}>
          <a href="/comparer" className="btn btn-secondary">
            📊 Comparateur TCO complet
          </a>
          <a href="/simulateur" className="btn btn-secondary">
            🧮 Simulateur personnalisé
          </a>
        </div>
      </section>
    </main>
  )
}
