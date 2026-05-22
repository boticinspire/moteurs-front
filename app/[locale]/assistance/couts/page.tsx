import type { Metadata } from 'next'
import AssistanceCouts from './AssistanceCouts'

export const metadata: Metadata = {
  title: 'Assistance Coûts — Combien coûte vraiment votre voiture ? | Moteurs.com',
  description:
    'Calculez le coût mensuel réel de votre véhicule : financement, carburant, assurance, entretien, dépréciation. Comparez avec un VE et découvrez les aides disponibles dans votre pays.',
  openGraph: {
    title: 'Votre voiture vous coûte combien par mois, vraiment ?',
    description: 'Toutes charges incluses : financement, carburant, assurance, entretien, dépréciation. Plus le comparatif VE.',
  },
}

export default function PageAssistanceCouts() {
  return (
    <main className="container" style={{ paddingTop: 40, paddingBottom: 64 }}>

      {/* ── Hero ── */}
      <div style={{ textAlign: 'center', marginBottom: 44 }}>
        <div style={{ fontSize: '0.82rem', color: 'var(--color-primary)', fontWeight: 600, marginBottom: 10, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
          Assistance Coûts · Moteurs.com 2026
        </div>
        <h1 style={{ fontSize: 'clamp(1.6rem, 4vw, 2.4rem)', marginBottom: 14, lineHeight: 1.2 }}>
          Votre voiture vous coûte<br />
          <span style={{ color: 'var(--color-primary)' }}>combien vraiment par mois ?</span>
        </h1>
        <p style={{ maxWidth: 560, margin: '0 auto', color: 'var(--color-text-soft)', fontSize: '0.98rem', lineHeight: 1.65 }}>
          La plupart des conducteurs sous-estiment le coût réel de leur voiture de 40 à 60%.
          Calculez le vôtre en 3 étapes, comparez avec un VE, et découvrez les aides disponibles.
        </p>

        {/* Badges */}
        <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: 8, marginTop: 20 }}>
          {[
            '💰 Coût mensuel réel',
            '📊 5 postes ventilés',
            '⚡ Comparatif VE',
            '🎁 Aides FR · BE · CH · CA',
            '€/km · €/jour DT',
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
      <AssistanceCouts />

      {/* ── Pédagogie ── */}
      <section style={{ marginTop: 72, borderTop: '1px solid var(--color-border)', paddingTop: 48 }}>
        <h2 style={{ textAlign: 'center', marginBottom: 10, fontSize: '1.2rem' }}>
          Pourquoi le coût réel est toujours plus élevé que prévu
        </h2>
        <p style={{ textAlign: 'center', color: 'var(--color-text-soft)', marginBottom: 36, maxWidth: 500, margin: '0 auto 36px' }}>
          Les conducteurs ne pensent souvent qu&apos;au carburant et au remboursement. Ils oublient 3 postes majeurs.
        </p>
        <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
          {[
            { icon: '📉', titre: 'La dépréciation', desc: 'Une berline perd 2 500 à 4 000 € de valeur par an. C\'est réel même si non décaissé — c\'est ce que vous perdrez à la revente.' },
            { icon: '🔧', titre: 'L\'entretien lissé', desc: 'Les petites révisions et les grosses réparations doivent être lissées sur 12 mois. Un diesel full coûte ~110 €/mois en entretien en moyenne.' },
            { icon: '🛡️', titre: 'L\'assurance oubliée', desc: 'Une assurance tous risques coûte 62 à 115 €/mois selon le véhicule. Rarement incluse dans les calculs des conducteurs.' },
            { icon: '⚡', titre: 'L\'avantage VE', desc: 'Un VE coûte 40 €/mois d\'entretien (pas de vidange, moins de freins) et 18 à 55 €/mois d\'énergie vs 80-150 € pour un thermique.' },
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

      {/* ── CTA ── */}
      <section style={{ marginTop: 48, textAlign: 'center' }}>
        <p style={{ color: 'var(--color-text-soft)', marginBottom: 16, fontSize: '0.9rem' }}>
          Allez plus loin avec les autres assistants :
        </p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 12, flexWrap: 'wrap' }}>
          <a href="/assistance" className="btn btn-primary">🤖 Hub Assistance →</a>
          <a href="/comparer" className="btn btn-secondary">📊 Comparateur TCO</a>
          <a href="/assistant-vacances" className="btn btn-secondary">🏖️ Assistant Vacances</a>
        </div>
      </section>
    </main>
  )
}
