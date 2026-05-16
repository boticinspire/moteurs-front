import type { Metadata } from 'next'
import Link from 'next/link'
import AssistanceAdmin from './AssistanceAdmin'

export const metadata: Metadata = {
  title: "Assistance Admin — Carte grise, ZFE, Bonus & Aides | Moteurs.com",
  description:
    "Estimez vos frais de carte grise, vérifiez votre accès aux ZFE, calculez le bonus écologique et toutes les aides disponibles selon votre pays et motorisation.",
  openGraph: {
    title: "Carte grise, ZFE, bonus VE — Toutes vos démarches auto en un clic",
    description: "Frais d'immatriculation, Crit'Air, bonus écologique, prime à la conversion, leasing social. FR · BE · CH · CA.",
  },
}

export default function PageAssistanceAdmin() {
  return (
    <main className="container" style={{ paddingTop: 40, paddingBottom: 64 }}>

      {/* ── Hero ── */}
      <div style={{ textAlign: 'center', marginBottom: 44 }}>
        <div style={{ fontSize: '0.82rem', color: '#6366f1', fontWeight: 600, marginBottom: 10, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
          Assistance Administrative · Moteurs.com 2026
        </div>
        <h1 style={{ fontSize: 'clamp(1.6rem, 4vw, 2.4rem)', marginBottom: 14, lineHeight: 1.2 }}>
          Carte grise, ZFE, bonus —<br />
          <span style={{ color: '#6366f1' }}>toutes vos démarches simplifiées</span>
        </h1>
        <p style={{ maxWidth: 560, margin: '0 auto', color: 'var(--color-text-soft)', fontSize: '0.98rem', lineHeight: 1.65 }}>
          Estimez vos frais d'immatriculation, vérifiez votre vignette Crit'Air et
          découvrez toutes les aides auxquelles vous avez droit — en 2 étapes.
        </p>

        <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: 8, marginTop: 20 }}>
          {[
            "📋 Carte grise estimée",
            "🏙️ ZFE & Crit'Air",
            "🎁 Bonus & aides",
            "🇫🇷 FR · 🇧🇪 BE · 🇨🇭 CH · 🇨🇦 CA",
            "💰 Malus CO₂ 2026",
          ].map(b => (
            <span key={b} style={{
              padding: '5px 14px', borderRadius: 20, fontSize: '0.78rem',
              background: 'rgba(99,102,241,0.07)', border: '1px solid rgba(99,102,241,0.2)',
              color: '#6366f1',
            }}>
              {b}
            </span>
          ))}
        </div>
      </div>

      {/* ── Wizard ── */}
      <AssistanceAdmin />

      {/* ── Pédagogie ── */}
      <section style={{ marginTop: 72, borderTop: '1px solid var(--color-border)', paddingTop: 48 }}>
        <h2 style={{ textAlign: 'center', marginBottom: 10, fontSize: '1.2rem' }}>
          Ce que beaucoup d'acheteurs ratent lors d'un achat
        </h2>
        <p style={{ textAlign: 'center', color: 'var(--color-text-soft)', marginBottom: 36, maxWidth: 500, margin: '0 auto 36px' }}>
          Les démarches administratives recèlent des économies souvent ignorées.
        </p>
        <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
          {[
            { icon: '🎁', titre: 'Le bonus est cumulable', desc: "En France, le bonus écologique (jusqu'à 7 000 €) est cumulable avec la prime à la conversion (5 000 €) si vous mettez à la casse un vieux thermique. Soit jusqu'à 12 000 € d'aides." },
            { icon: '🏙️', titre: "La ZFE peut bloquer votre diesel", desc: "Un diesel acheté aujourd'hui (Crit'Air 2) est déjà interdit à Paris en semaine. Lyon et d'autres grandes villes suivent. Vérifiez avant d'acheter." },
            { icon: '⚡', titre: 'VE = carte grise quasi gratuite', desc: "En France, les VE sont exonérés de la taxe régionale (la partie la plus chère de la carte grise). Vous ne payez que ~15 € de frais fixes au lieu de 300 à 800 € pour un thermique." },
            { icon: '🏢', titre: 'Pro : la déduction fiscale change tout', desc: "En Belgique, un VE de société est déductible à 100% jusqu'en 2026. L'ATN est calculé à 0 g/km. En France, le suramortissement s'ajoute. Consultez votre comptable." },
          ].map(item => (
            <div key={item.titre} style={{ background: 'white', borderRadius: 12, border: '1px solid var(--color-border)', padding: '20px 18px' }}>
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
          <Link href="/assistance/achat" className="btn btn-secondary">🚗 Quelle motorisation ?</Link>
          <Link href="/comparer" className="btn btn-secondary">📊 Comparateur TCO</Link>
        </div>
      </section>
    </main>
  )
}
