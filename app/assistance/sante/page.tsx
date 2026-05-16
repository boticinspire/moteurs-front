import type { Metadata } from 'next'
import Link from 'next/link'
import AssistanceSante from './AssistanceSante'

export const metadata: Metadata = {
  title: "Santé Voyage — Vaccins, trousse médicale, premiers secours, rapatriement | Moteurs.com",
  description:
    "Préparez votre santé avant de partir : vaccins recommandés par destination, trousse médicale complète, gestes de premiers secours, assurance rapatriement, conseils bébé et senior.",
  openGraph: {
    title: "Santé Voyage : vaccins, trousse, assurance — tout préparer avant de partir",
    description: "8 zones géographiques, conseils bébé/femme enceinte/senior, gestes d'urgence, analyse de votre couverture médicale.",
  },
}

export default function PageAssistanceSante() {
  return (
    <main className="container" style={{ paddingTop: 40, paddingBottom: 64 }}>

      {/* ── Hero ── */}
      <div style={{ textAlign: 'center', marginBottom: 44 }}>
        <div style={{ fontSize: '0.82rem', color: '#db2777', fontWeight: 600, marginBottom: 10, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
          Assistance Santé Voyage · Moteurs.com 2026
        </div>
        <h1 style={{ fontSize: 'clamp(1.6rem, 4vw, 2.4rem)', marginBottom: 14, lineHeight: 1.2 }}>
          Préparez votre santé avant de partir —<br />
          <span style={{ color: '#db2777' }}>vaccins, trousse & premiers secours</span>
        </h1>
        <p style={{ maxWidth: 580, margin: '0 auto', color: 'var(--color-text-soft)', fontSize: '0.98rem', lineHeight: 1.65 }}>
          Destination, profil voyageur (bébé, senior, femme enceinte), type de séjour —
          obtenez votre bilan santé personnalisé, la trousse médicale adaptée et les gestes
          d&apos;urgence à connaître.
        </p>

        <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: 8, marginTop: 20 }}>
          {[
            "💉 Vaccins par zone",
            "🧳 Trousse médicale",
            "🩺 Premiers secours",
            "🏥 Assurance rapatriement",
            "🍼 Conseils bébé & senior",
            "🌍 8 zones géographiques",
          ].map(b => (
            <span key={b} style={{
              padding: '5px 14px', borderRadius: 20, fontSize: '0.78rem',
              background: 'rgba(219,39,119,0.07)', border: '1px solid rgba(219,39,119,0.2)',
              color: '#db2777',
            }}>
              {b}
            </span>
          ))}
        </div>
      </div>

      {/* ── Wizard ── */}
      <AssistanceSante />

      {/* ── Pédagogie ── */}
      <section style={{ marginTop: 72, borderTop: '1px solid var(--color-border)', paddingTop: 48 }}>
        <h2 style={{ textAlign: 'center', marginBottom: 10, fontSize: '1.2rem' }}>
          Ce que la plupart des voyageurs oublient de préparer
        </h2>
        <p style={{ textAlign: 'center', color: 'var(--color-text-soft)', marginBottom: 36, maxWidth: 520, margin: '0 auto 36px' }}>
          La santé est la partie la moins bien préparée des voyages — et la plus coûteuse en cas de problème.
        </p>
        <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
          {[
            {
              icon: '⏱️',
              titre: 'Commencez 6 semaines avant',
              desc: "Certains vaccins nécessitent 2 à 3 doses espacées (rage, encéphalite japonaise, hépatite B). Attendre la dernière semaine, c'est partir sans protection.",
            },
            {
              icon: '✈️',
              titre: 'Le rapatriement : 50 000 € sans assurance',
              desc: "Un avion médicalisé pour rapatrier depuis l'Asie ou l'Afrique coûte entre 30 000 et 100 000 €. Une assurance voyage coûte 30 à 80 € pour 2 semaines.",
            },
            {
              icon: '🦟',
              titre: 'Dengue : aucun médicament préventif',
              desc: "Contrairement au paludisme, il n'existe pas d'antipaludéen contre la dengue. La seule protection : répulsif et vêtements couvrants. Les moustiques piquent de jour.",
            },
            {
              icon: '💊',
              titre: "L'ordonnance internationale",
              desc: "Si vous prenez un traitement chronique, demandez une ordonnance en DCI (dénomination commune internationale) — les noms de marque varient selon les pays.",
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

      {/* ── Disclaimer ── */}
      <div style={{ marginTop: 40, padding: '16px 20px', borderRadius: 10, background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.2)', fontSize: '0.82rem', color: 'var(--color-text-soft)', textAlign: 'center' }}>
        ℹ️ Ces informations sont à titre indicatif. Consultez toujours un médecin ou un centre de vaccination internationale avant votre départ. En cas d&apos;urgence médicale à l&apos;étranger, appelez le 112 (Europe) ou le numéro d&apos;urgence local.
      </div>

      {/* ── CTA final ── */}
      <section style={{ marginTop: 40, textAlign: 'center' }}>
        <p style={{ color: 'var(--color-text-soft)', marginBottom: 16, fontSize: '0.9rem' }}>
          Préparez votre voyage complet avec les autres assistants :
        </p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 12, flexWrap: 'wrap' }}>
          <Link href="/assistance" className="btn btn-primary">🤖 Hub Assistance →</Link>
          <Link href="/assistant-vacances" className="btn btn-secondary">🏖️ Planifier mon voyage</Link>
          <Link href="/assistance/location" className="btn btn-secondary">🔑 Location voiture</Link>
        </div>
      </section>
    </main>
  )
}
