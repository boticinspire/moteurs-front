import type { Metadata } from 'next'
import Link from 'next/link'
import AssistanceMeteo from './AssistanceMeteo'

export const metadata: Metadata = {
  title: "Météo & Itinéraire — Prévisions route, alertes conduite, meilleur jour de départ | Moteurs.com",
  description:
    "Prévisions météo 7 jours pour votre départ et destination, score conditions de conduite, alertes canicule/orage/verglas et conseils personnalisés. Données Open-Meteo.",
  openGraph: {
    title: "Météo route : quel jour partir ? Alertes conduite en temps réel",
    description: "Score conditions de conduite jour par jour, alertes vent violent, verglas, canicule, orage. Pour 35 villes et toute destination.",
  },
}

export default function PageAssistanceMeteo() {
  return (
    <main className="container" style={{ paddingTop: 40, paddingBottom: 64 }}>

      {/* ── Hero ── */}
      <div style={{ textAlign: 'center', marginBottom: 44 }}>
        <div style={{ fontSize: '0.82rem', color: '#7c3aed', fontWeight: 600, marginBottom: 10, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
          Assistance Météo & Itinéraire · Moteurs.com 2026
        </div>
        <h1 style={{ fontSize: 'clamp(1.6rem, 4vw, 2.4rem)', marginBottom: 14, lineHeight: 1.2 }}>
          Quel jour partir ? —<br />
          <span style={{ color: '#7c3aed' }}>Prévisions météo route & alertes conduite</span>
        </h1>
        <p style={{ maxWidth: 560, margin: '0 auto', color: 'var(--color-text-soft)', fontSize: '0.98rem', lineHeight: 1.65 }}>
          Prévisions 7 jours pour votre départ et destination, score de conditions de conduite,
          alertes canicule / orage / verglas / vent violent — et conseils adaptés à votre route.
        </p>

        <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: 8, marginTop: 20 }}>
          {[
            "🌡️ Canicule",
            "⛈️ Orages",
            "❄️ Verglas",
            "💨 Vent violent",
            "🌫️ Brouillard",
            "📅 Meilleur jour de départ",
          ].map(b => (
            <span key={b} style={{
              padding: '5px 14px', borderRadius: 20, fontSize: '0.78rem',
              background: 'rgba(124,58,237,0.07)', border: '1px solid rgba(124,58,237,0.2)',
              color: '#7c3aed',
            }}>
              {b}
            </span>
          ))}
        </div>
      </div>

      {/* ── Outil météo ── */}
      <AssistanceMeteo />

      {/* ── Pédagogie ── */}
      <section style={{ marginTop: 72, borderTop: '1px solid var(--color-border)', paddingTop: 48 }}>
        <h2 style={{ textAlign: 'center', marginBottom: 10, fontSize: '1.2rem' }}>
          Ce que la météo change vraiment sur la route
        </h2>
        <p style={{ textAlign: 'center', color: 'var(--color-text-soft)', marginBottom: 36, maxWidth: 520, margin: '0 auto 36px' }}>
          Les conditions météo sont impliquées dans 20 % des accidents mortels en France.
        </p>
        <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
          {[
            {
              icon: '🌧️',
              titre: 'Pluie : distance de freinage ×2',
              desc: "Par temps de pluie, la distance de freinage double à 130 km/h. La vitesse maximale sur autoroute passe légalement à 110 km/h. L'aquaplaning survient dès 2 mm de profondeur de pluie.",
            },
            {
              icon: '❄️',
              titre: 'Verglas : freinage ×10',
              desc: "Sur verglas, la distance de freinage est 10 fois supérieure à sec. Les ponts et zones ombragées verglaçent en premier. Pneus hiver ou neige obligatoires dans de nombreux pays.",
            },
            {
              icon: '🌡️',
              titre: 'Canicule : jamais d\'enfants seuls',
              desc: "L'habitacle d'une voiture garée atteint 60°C en 30 minutes à 35°C extérieur. Un enfant peut décéder en 20 minutes. Vérifiez la pression des pneus (+5% par 10°C).",
            },
            {
              icon: '💨',
              titre: 'Vent > 80 km/h : camping-cars, stop',
              desc: "À 80 km/h de vent latéral, un camping-car ou une caravane peut se coucher. Les ponts et zones de col sont les zones les plus exposées. Attachez les bagages sur le toit.",
            },
          ].map(item => (
            <div key={item.titre} style={{ background: 'white', borderRadius: 12, border: '1px solid var(--color-border)', padding: '20px 18px' }}>
              <div style={{ fontSize: '1.6rem', marginBottom: 10 }}>{item.icon}</div>
              <div style={{ fontWeight: 700, marginBottom: 6, fontSize: '0.95rem' }}>{item.titre}</div>
              <p style={{ fontSize: '0.84rem', color: 'var(--color-text-soft)', margin: 0, lineHeight: 1.55 }}>{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Source données ── */}
      <div style={{ marginTop: 40, textAlign: 'center', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
        Données météo fournies par <a href="https://open-meteo.com" target="_blank" rel="noopener noreferrer" style={{ color: '#7c3aed' }}>Open-Meteo</a> (licence CC BY 4.0) · Mise à jour toutes les heures
      </div>

      {/* ── CTA final ── */}
      <section style={{ marginTop: 40, textAlign: 'center' }}>
        <p style={{ color: 'var(--color-text-soft)', marginBottom: 16, fontSize: '0.9rem' }}>
          Préparez votre voyage complet :
        </p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 12, flexWrap: 'wrap' }}>
          <Link href="/assistance" className="btn btn-primary">🤖 Hub Assistance →</Link>
          <Link href="/assistant-vacances" className="btn btn-secondary">🏖️ Planifier mon voyage</Link>
          <Link href="/assistance/panne" className="btn btn-secondary">🚨 Guide Panne</Link>
        </div>
      </section>
    </main>
  )
}
