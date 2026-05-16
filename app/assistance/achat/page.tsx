import type { Metadata } from 'next'
import Link from 'next/link'
import AssistanceAchat from './AssistanceAchat'

export const metadata: Metadata = {
  title: 'Assistance Achat — Quelle motorisation choisir ? | Moteurs.com',
  description:
    'Trouvez la motorisation idéale selon votre budget, usage et kilométrage. Recommandation personnalisée électrique, hybride, essence ou diesel — avec toutes les aides disponibles.',
  openGraph: {
    title: 'Quelle voiture acheter ? Recommandation motorisation personnalisée',
    description: 'Électrique, hybride, essence, diesel : quelle motorisation selon votre budget et usage ? Modèles recommandés + aides 2026.',
  },
}

export default function PageAssistanceAchat() {
  return (
    <main className="container" style={{ paddingTop: 40, paddingBottom: 64 }}>

      {/* ── Hero ── */}
      <div style={{ textAlign: 'center', marginBottom: 44 }}>
        <div style={{ fontSize: '0.82rem', color: 'var(--color-primary)', fontWeight: 600, marginBottom: 10, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
          Assistance Achat · Moteurs.com 2026
        </div>
        <h1 style={{ fontSize: 'clamp(1.6rem, 4vw, 2.4rem)', marginBottom: 14, lineHeight: 1.2 }}>
          Quelle motorisation choisir<br />
          <span style={{ color: 'var(--color-primary)' }}>selon votre profil ?</span>
        </h1>
        <p style={{ maxWidth: 560, margin: '0 auto', color: 'var(--color-text-soft)', fontSize: '0.98rem', lineHeight: 1.65 }}>
          Électrique, hybride, PHEV, essence ou diesel — la bonne réponse dépend de
          votre budget, vos km et votre accès à la recharge.
          Obtenez votre recommandation personnalisée en 2 étapes.
        </p>

        {/* Badges */}
        <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: 8, marginTop: 20 }}>
          {[
            '🚗 Recommandation motorisation',
            '💰 Modèles dans votre budget',
            '🎁 Aides FR · BE · CH · CA',
            '📊 Scoring personnalisé',
            '⚡ VE · PHEV · Hybride · Diesel',
          ].map(b => (
            <span key={b} style={{
              padding: '5px 14px', borderRadius: 20, fontSize: '0.78rem',
              background: 'rgba(26,95,196,0.07)', border: '1px solid rgba(26,95,196,0.2)',
              color: 'var(--color-primary)',
            }}>
              {b}
            </span>
          ))}
        </div>
      </div>

      {/* ── Wizard ── */}
      <AssistanceAchat />

      {/* ── Pédagogie ── */}
      <section style={{ marginTop: 72, borderTop: '1px solid var(--color-border)', paddingTop: 48 }}>
        <h2 style={{ textAlign: 'center', marginBottom: 10, fontSize: '1.2rem' }}>
          Les 4 questions à se poser avant d'acheter
        </h2>
        <p style={{ textAlign: 'center', color: 'var(--color-text-soft)', marginBottom: 36, maxWidth: 500, margin: '0 auto 36px' }}>
          Il n'existe pas de motorisation universelle. Tout dépend de votre situation réelle.
        </p>
        <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
          {[
            { icon: '🔌', titre: 'Avez-vous une borne ?', desc: 'Sans recharge à domicile, le coût du VE sur réseau public grimpe à 0.55 €/kWh — l\'avantage économique s\'amenuise fortement. La borne est la clé.' },
            { icon: '📏', titre: 'Combien faites-vous de km ?', desc: 'Moins de 15 000 km/an : citadine électrique ou essence. Plus de 25 000 km/an : hybride ou diesel longue distance. Le kilométrage change tout.' },
            { icon: '🏙️', titre: 'Où circulez-vous ?', desc: 'ZFE en expansion dans les grandes villes. Un diesel acheté aujourd\'hui pourrait être exclu de Paris, Lyon ou Bruxelles d\'ici 2027–2028.' },
            { icon: '💰', titre: 'Quel TCO sur 5 ans ?', desc: 'Le prix d\'achat n\'est que 40% du coût. L\'entretien, l\'assurance, le carburant et la dépréciation représentent 60% du coût réel sur 5 ans.' },
          ].map(item => (
            <div key={item.titre} style={{
              background: 'white', borderRadius: 12,
              border: '1px solid var(--color-border)', padding: '20px 18px',
            }}>
              <div style={{ fontSize: '1.6rem', marginBottom: 10 }}>{item.icon}</div>
              <div style={{ fontWeight: 700, marginBottom: 6, fontSize: '0.95rem' }}>{item.titre}</div>
              <p style={{ fontSize: '0.84rem', color: 'var(--color-text-soft)', margin: 0, lineHeight: 1.55 }}>{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA final ── */}
      <section style={{ marginTop: 48, textAlign: 'center' }}>
        <p style={{ color: 'var(--color-text-soft)', marginBottom: 16, fontSize: '0.9rem' }}>
          Allez plus loin avec les autres assistants :
        </p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 12, flexWrap: 'wrap' }}>
          <Link href="/assistance" className="btn btn-primary">🤖 Hub Assistance →</Link>
          <Link href="/comparer" className="btn btn-secondary">📊 Comparateur TCO</Link>
          <Link href="/simulateur" className="btn btn-secondary">🧮 Simulateur complet</Link>
        </div>
      </section>
    </main>
  )
}
