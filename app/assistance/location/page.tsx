import type { Metadata } from 'next'
import Link from 'next/link'
import AssistanceLocation from './AssistanceLocation'

export const metadata: Metadata = {
  title: "Location voiture & Assurance — Analyse CDW, checklist, alertes pays | Moteurs.com",
  description:
    "Faut-il prendre le CDW du loueur ? Analysez votre couverture CB, obtenez la checklist état des lieux et les alertes spécifiques à votre destination — pour 12 pays.",
  openGraph: {
    title: "Location voiture : CDW ou pas ? Analyse personnalisée par destination",
    description: "Visa, Mastercard, Amex — découvrez si votre CB couvre déjà les dommages. Alertes ZTL Italie, vols Espagne, CB refusées aux USA.",
  },
}

export default function PageAssistanceLocation() {
  return (
    <main className="container" style={{ paddingTop: 40, paddingBottom: 64 }}>

      {/* ── Hero ── */}
      <div style={{ textAlign: 'center', marginBottom: 44 }}>
        <div style={{ fontSize: '0.82rem', color: '#0891b2', fontWeight: 600, marginBottom: 10, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
          Assistance Location & Assurance · Moteurs.com 2026
        </div>
        <h1 style={{ fontSize: 'clamp(1.6rem, 4vw, 2.4rem)', marginBottom: 14, lineHeight: 1.2 }}>
          Location voiture : faut-il prendre le CDW ?<br />
          <span style={{ color: '#0891b2' }}>Votre analyse personnalisée en 2 étapes</span>
        </h1>
        <p style={{ maxWidth: 560, margin: '0 auto', color: 'var(--color-text-soft)', fontSize: '0.98rem', lineHeight: 1.65 }}>
          Destination, type de véhicule, carte bancaire, assurance perso — obtenez une
          recommandation claire sur le CDW, les alertes pays et les checklists état des lieux.
        </p>

        <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: 8, marginTop: 20 }}>
          {[
            "🛡️ Analyse CDW",
            "💳 Couverture CB",
            "📋 Checklist état des lieux",
            "⚠️ Alertes pays",
            "🌍 12 destinations",
          ].map(b => (
            <span key={b} style={{
              padding: '5px 14px', borderRadius: 20, fontSize: '0.78rem',
              background: 'rgba(8,145,178,0.07)', border: '1px solid rgba(8,145,178,0.2)',
              color: '#0891b2',
            }}>
              {b}
            </span>
          ))}
        </div>
      </div>

      {/* ── Wizard ── */}
      <AssistanceLocation />

      {/* ── Pédagogie ── */}
      <section style={{ marginTop: 72, borderTop: '1px solid var(--color-border)', paddingTop: 48 }}>
        <h2 style={{ textAlign: 'center', marginBottom: 10, fontSize: '1.2rem' }}>
          Ce que la plupart des voyageurs ignorent
        </h2>
        <p style={{ textAlign: 'center', color: 'var(--color-text-soft)', marginBottom: 36, maxWidth: 500, margin: '0 auto 36px' }}>
          La location voiture cache des pièges coûteux — et des économies insoupçonnées.
        </p>
        <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
          {[
            {
              icon: '💳',
              titre: 'Votre CB couvre peut-être déjà tout',
              desc: "Une Visa Premier ou Mastercard Gold couvre les dommages collision sans franchise jusqu'à 50 000 € — sans débourser 10 à 25 €/jour de CDW. Payez simplement la location avec cette carte.",
            },
            {
              icon: '🇮🇹',
              titre: 'Italie : les ZTL coûtent cher',
              desc: "Les Zones à Trafic Limité de Rome, Florence et Venise sont filmées 24h/24. Le loueur transmet votre plaque et vous recevez l'amende (80–300 €) chez vous 2 à 6 mois après.",
            },
            {
              icon: '🇺🇸',
              titre: 'USA : votre CB classique refusée',
              desc: "La plupart des loueurs américains exigent une CB haut de gamme comme caution. Une Visa Classic ou Mastercard Standard est souvent refusée — préparez une Visa Infinite ou Amex.",
            },
            {
              icon: '📸',
              titre: 'Photos avant de partir — toujours',
              desc: "Filmez le véhicule en vidéo horodatée avant de quitter le parking. En cas de litige à la restitution, c'est votre seule preuve opposable. Sans ça, vous payez ce que le loueur dit.",
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

      {/* ── CTA final ── */}
      <section style={{ marginTop: 48, textAlign: 'center' }}>
        <p style={{ color: 'var(--color-text-soft)', marginBottom: 16, fontSize: '0.9rem' }}>
          Préparez votre voyage avec les autres assistants :
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
