import type { Metadata } from 'next'
import Link from 'next/link'
import AssistanceRecharge from './AssistanceRecharge'

export const metadata: Metadata = {
  title: 'Assistance Recharge VE — Coût, borne, autonomie réelle | Moteurs.com',
  description:
    'Calculez le coût annuel de recharge de votre véhicule électrique. Comparez domicile vs réseau public, estimez l\'installation d\'une borne et découvrez les aides disponibles.',
  openGraph: {
    title: 'Assistance Recharge VE — Combien coûte vraiment recharger ?',
    description: 'Coût domicile vs public, installation borne, autonomie réelle été/hiver, réseaux par pays.',
  },
}

export default function PageAssistanceRecharge() {
  return (
    <main className="container" style={{ paddingTop: 40, paddingBottom: 64 }}>

      {/* ── Hero ── */}
      <div style={{ textAlign: 'center', marginBottom: 44 }}>
        <div style={{ fontSize: '0.82rem', color: '#059669', fontWeight: 600, marginBottom: 10, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
          Assistance Recharge · Moteurs.com 2026
        </div>
        <h1 style={{ fontSize: 'clamp(1.6rem, 4vw, 2.4rem)', marginBottom: 14, lineHeight: 1.2 }}>
          Combien vous coûte vraiment<br />
          <span style={{ color: '#059669' }}>recharger votre VE ?</span>
        </h1>
        <p style={{ maxWidth: 560, margin: '0 auto', color: 'var(--color-text-soft)', fontSize: '0.98rem', lineHeight: 1.65 }}>
          Domicile ou réseau public ? Quelle borne installer ? Quelle autonomie réelle en hiver ?
          Obtenez un bilan complet en 2 étapes.
        </p>

        {/* Badges */}
        <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: 8, marginTop: 20 }}>
          {[
            '⚡ Coût recharge annuel',
            '🔌 Installation borne',
            '❄️ Autonomie été / hiver',
            '🗺️ Réseaux FR · BE · CH · CA',
            '🎁 Aides & subventions',
          ].map(b => (
            <span key={b} style={{
              padding: '5px 14px', borderRadius: 20, fontSize: '0.78rem',
              background: 'rgba(5,150,105,0.07)', border: '1px solid rgba(5,150,105,0.2)',
              color: '#059669',
            }}>
              {b}
            </span>
          ))}
        </div>
      </div>

      {/* ── Wizard ── */}
      <AssistanceRecharge />

      {/* ── Pédagogie ── */}
      <section style={{ marginTop: 72, borderTop: '1px solid var(--color-border)', paddingTop: 48 }}>
        <h2 style={{ textAlign: 'center', marginBottom: 10, fontSize: '1.2rem' }}>
          Ce que la plupart des futurs propriétaires VE ne savent pas
        </h2>
        <p style={{ textAlign: 'center', color: 'var(--color-text-soft)', marginBottom: 36, maxWidth: 500, margin: '0 auto 36px' }}>
          Recharger un VE coûte bien moins cher qu'on ne le croit — surtout à domicile.
        </p>
        <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
          {[
            { icon: '🏠', titre: 'Domicile = 4× moins cher', desc: 'Recharger chez soi coûte 0.25 €/kWh en France. Sur le réseau public DC rapide : 0.55 €/kWh. Soit 4× plus cher — l\'argument principal pour une borne à domicile.' },
            { icon: '⏰', titre: 'Vous rechargez la nuit', desc: '80% des conducteurs VE rechargent la nuit. La borne à domicile est branchée pendant 6–8h, bien assez pour 200–300 km d\'autonomie.' },
            { icon: '❄️', titre: "L'hiver réduit de -30%", desc: "En dessous de 0°C, la batterie perd jusqu'à 30–35% d'autonomie. Préchauffer le véhicule branché compense une grande partie de cette perte." },
            { icon: '💶', titre: 'Borne amortie en < 2 ans', desc: 'Une wallbox à 1 200 € après aide s\'amortit en 18 à 24 mois pour un conducteur faisant 15 000 km/an, grâce à l\'écart de prix domicile vs public.' },
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
          <Link href="/assistance/couts" className="btn btn-secondary">💰 Coûts TCO complet</Link>
          <Link href="/assistant-vacances" className="btn btn-secondary">🏖️ Assistant Vacances</Link>
        </div>
      </section>
    </main>
  )
}
