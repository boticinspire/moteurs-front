import type { Metadata } from 'next'
import Link from 'next/link'
import AssistancePanne from './AssistancePanne'

export const metadata: Metadata = {
  title: 'Assistance Panne — Que faire en cas de panne ? | Moteurs.com',
  description:
    'Protocole d\'urgence personnalisé selon votre type de panne, motorisation et lieu. Spécificités VE, numéros utiles FR/BE/CH/CA, étapes pas-à-pas pour rester en sécurité.',
  openGraph: {
    title: 'Que faire en cas de panne — Guide d\'urgence automobile',
    description: 'Protocole pas-à-pas pour panne carburant, crevaison, accident, surchauffe. Spécificités VE et contacts urgence par pays.',
  },
}

export default function PageAssistancePanne() {
  return (
    <main className="container" style={{ paddingTop: 40, paddingBottom: 64 }}>

      {/* ── Hero ── */}
      <div style={{ textAlign: 'center', marginBottom: 44 }}>
        <div style={{ fontSize: '0.82rem', color: '#ef4444', fontWeight: 600, marginBottom: 10, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
          Assistance Panne · Moteurs.com 2026
        </div>
        <h1 style={{ fontSize: 'clamp(1.6rem, 4vw, 2.4rem)', marginBottom: 14, lineHeight: 1.2 }}>
          En panne — <span style={{ color: '#ef4444' }}>que faire maintenant ?</span>
        </h1>
        <p style={{ maxWidth: 560, margin: '0 auto', color: 'var(--color-text-soft)', fontSize: '0.98rem', lineHeight: 1.65 }}>
          Un protocole clair, adapté à votre motorisation et votre situation,
          avec les bons numéros à appeler. En cas de danger, composez le 15, 18 ou 112.
        </p>

        {/* Badges */}
        <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: 8, marginTop: 20 }}>
          {[
            '🚨 Protocole urgence',
            '⚡ Spécificités VE',
            '📞 Contacts FR · BE · CH · CA',
            '🔧 Crevaison · Panne · Accident',
            '🛣️ Autoroute · Ville · Route',
          ].map(b => (
            <span key={b} style={{
              padding: '5px 14px', borderRadius: 20, fontSize: '0.78rem',
              background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.2)',
              color: '#ef4444',
            }}>
              {b}
            </span>
          ))}
        </div>
      </div>

      {/* ── Wizard ── */}
      <AssistancePanne />

      {/* ── Pédagogie ── */}
      <section style={{ marginTop: 72, borderTop: '1px solid var(--color-border)', paddingTop: 48 }}>
        <h2 style={{ textAlign: 'center', marginBottom: 10, fontSize: '1.2rem' }}>
          Les 4 réflexes qui sauvent des vies sur la route
        </h2>
        <p style={{ textAlign: 'center', color: 'var(--color-text-soft)', marginBottom: 36, maxWidth: 500, margin: '0 auto 36px' }}>
          En cas de panne, les premières secondes sont déterminantes. Ces réflexes sont valables pour tous les véhicules.
        </p>
        <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
          {[
            { icon: '🔴', titre: 'Feux de détresse immédiatement', desc: "Dès que vous ressentez un problème, activez les feux de détresse. C'est le premier signal pour les autres conducteurs — même avant de comprendre ce qui se passe." },
            { icon: '🦺', titre: "Gilet jaune avant de sortir", desc: "Enfilez votre gilet jaune AVANT d'ouvrir la portière — c'est une obligation légale en France, Belgique et Suisse. Ensuite, sortez côté passager uniquement. Les accidents sur la VAU sont mortels dans 80% des cas." },
            { icon: '🔺', titre: 'Triangle à 100 m minimum', desc: "Sur autoroute, le triangle doit être à au moins 100 m (pas 30 m comme en ville). Portez le gilet jaune AVANT de sortir du véhicule — obligation légale en France, Belgique et Suisse." },
            { icon: '⚡', titre: 'VE = protocole différent', desc: "Un VE ne se remorque pas comme un thermique — exigez une dépanneuse à plateau. En cas d'accident ou d'odeur chimique, éloignez-vous et signalez la haute tension aux secours." },
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
          <Link href="/assistance/achat" className="btn btn-secondary">🚗 Choisir mon véhicule</Link>
          <Link href="/assistance/recharge" className="btn btn-secondary">⚡ Assistance Recharge</Link>
        </div>
      </section>
    </main>
  )
}
