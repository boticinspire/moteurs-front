import type { Metadata } from 'next'
import Link from 'next/link'
import AssistanceSurprises from './AssistanceSurprises'

export const metadata: Metadata = {
  title: "Mauvaises Surprises — Amende, fourrière, vol, ZTL, accident à l'étranger | Moteurs.com",
  description:
    "Guide décisionnel pour les galères en voyage : amende à l'étranger, fourrière, vol dans le véhicule, ZTL Italie, péage impayé, accident, document perdu. Étapes claires, contacts, erreurs à éviter.",
  openGraph: {
    title: "Mauvaises surprises en voiture : amende, fourrière, vol — que faire ?",
    description: "8 situations couvertes avec étapes pas à pas, contacts officiels, erreurs à éviter et checklists de prévention.",
  },
}

export default function PageAssistanceSurprises() {
  return (
    <main className="container" style={{ paddingTop: 40, paddingBottom: 64 }}>

      {/* ── Hero ── */}
      <div style={{ textAlign: 'center', marginBottom: 44 }}>
        <div style={{ fontSize: '0.82rem', color: '#b45309', fontWeight: 600, marginBottom: 10, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
          Assistance Mauvaises Surprises · Moteurs.com 2026
        </div>
        <h1 style={{ fontSize: 'clamp(1.6rem, 4vw, 2.4rem)', marginBottom: 14, lineHeight: 1.2 }}>
          Ça tourne mal —<br />
          <span style={{ color: '#b45309' }}>voici exactement quoi faire</span>
        </h1>
        <p style={{ maxWidth: 560, margin: '0 auto', color: 'var(--color-text-soft)', fontSize: '0.98rem', lineHeight: 1.65 }}>
          Amende à l&apos;étranger, fourrière, vol, ZTL italienne, péage impayé, accident, document perdu —
          les étapes concrètes, les contacts officiels et les erreurs à ne surtout pas commettre.
        </p>

        <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: 8, marginTop: 20 }}>
          {[
            "🚔 Amende UE",
            "🚜 Fourrière",
            "🔓 Vol",
            "🇮🇹 ZTL",
            "🛣️ Péage",
            "🚗💥 Accident",
            "📄 Document perdu",
            "📸 Radar",
          ].map(b => (
            <span key={b} style={{
              padding: '5px 14px', borderRadius: 20, fontSize: '0.78rem',
              background: 'rgba(180,83,9,0.07)', border: '1px solid rgba(180,83,9,0.2)',
              color: '#b45309',
            }}>
              {b}
            </span>
          ))}
        </div>
      </div>

      {/* ── Guide ── */}
      <AssistanceSurprises />

      {/* ── Pédagogie ── */}
      <section style={{ marginTop: 72, borderTop: '1px solid var(--color-border)', paddingTop: 48 }}>
        <h2 style={{ textAlign: 'center', marginBottom: 10, fontSize: '1.2rem' }}>
          Ce que les voyageurs regrettent de ne pas avoir fait avant
        </h2>
        <p style={{ textAlign: 'center', color: 'var(--color-text-soft)', marginBottom: 36, maxWidth: 520, margin: '0 auto 36px' }}>
          La plupart des mauvaises surprises coûtent beaucoup plus cher quand on n&apos;est pas préparé.
        </p>
        <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
          {[
            {
              icon: '📸',
              titre: 'Photographiez tout avant de partir',
              desc: "Documents (recto/verso), intérieur du véhicule de location, bagages et leur contenu. Une photo datée vaut mieux que mille mots face à un loueur ou une assurance.",
            },
            {
              icon: '💳',
              titre: 'Numéro d\'opposition CB — en mémoire',
              desc: "Le numéro interbancaire d'opposition est le +33 892 705 705 (depuis l'étranger). Enregistrez-le dans votre téléphone sous 'CB Opposition'— en cas de vol, chaque minute compte.",
            },
            {
              icon: '📋',
              titre: 'Constat amiable européen — toujours 2',
              desc: "Le constat bleu est valable dans tout l'UE — les cases numérotées sont identiques dans toutes les langues. Demandez-en 2 exemplaires vierges à votre assurance avant chaque voyage.",
            },
            {
              icon: '🗺️',
              titre: 'ZTL : contournez systématiquement',
              desc: "Garez-vous en périphérie des villes italiennes et prenez les transports en commun. Un parking à 10 € la journée vaut mieux qu'une amende ZTL à 163 €.",
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
          Préparez votre voyage complet :
        </p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 12, flexWrap: 'wrap' }}>
          <Link href="/assistance" className="btn btn-primary">🤖 Hub Assistance →</Link>
          <Link href="/assistance/location" className="btn btn-secondary">🔑 Location & Assurance</Link>
          <Link href="/assistance/panne" className="btn btn-secondary">🚨 Guide Panne</Link>
        </div>
      </section>
    </main>
  )
}
