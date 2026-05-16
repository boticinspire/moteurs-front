import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Outils & Calculateurs — Moteurs.com',
  description: 'Outils gratuits pour la mobilité : convertisseur kW/ch, calculateur autonomie batterie, frais d\'immatriculation Belgique, et plus.',
}

const outils = [
  {
    href: '/outils/convertisseur',
    icon: '⚡',
    titre: 'Convertisseur technique',
    desc: 'kW ↔ ch, Nm ↔ lb-ft, autonomie batterie selon le poids et la consommation.',
    tags: ['Ingénieurs', 'Techniciens', 'Gratuit'],
    cta: 'Convertir',
  },
  {
    href: '/outils/immatriculation-belgique',
    icon: '🇧🇪',
    titre: "Frais d'immatriculation — Belgique",
    desc: 'Calculez la TMC (taxe de mise en circulation) selon votre région : Wallonie, Bruxelles ou Flandre.',
    tags: ['Wallonie', 'Bruxelles', 'Flandre'],
    cta: 'Calculer',
  },
  {
    href: '/outils/immatriculation-france',
    icon: '🇫🇷',
    titre: "Carte grise — France",
    desc: "Estimez vos frais d'immatriculation : puissance fiscale, taxe régionale par région, malus CO₂ 2026 et taxes fixes.",
    tags: ['13 régions', 'Malus CO₂', 'VE exonérés'],
    cta: 'Calculer',
  },
]

export default function OutilsPage() {
  return (
    <>
      <section className="page-hero">
        <div className="container">
          <h1>Outils & Calculateurs</h1>
          <p>Des outils gratuits et précis pour les professionnels de la mobilité et les particuliers.</p>
        </div>
      </section>

      <section style={{ padding: '48px 0 80px' }}>
        <div className="container">
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: 24,
            maxWidth: 900,
          }}>
            {outils.map((o) => (
              <Link key={o.href} href={o.href} style={{ textDecoration: 'none' }}>
                <div style={{
                  background: 'var(--color-bg-alt)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 12,
                  padding: 28,
                  height: '100%',
                  transition: 'border-color 0.15s, box-shadow 0.15s',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 16,
                  cursor: 'pointer',
                }}>
                  <div style={{ fontSize: '2.4rem' }}>{o.icon}</div>
                  <div>
                    <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: 8, color: 'var(--color-text)' }}>
                      {o.titre}
                    </h2>
                    <p style={{ fontSize: '0.92rem', color: 'var(--color-text-soft)', lineHeight: 1.6, margin: 0 }}>
                      {o.desc}
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {o.tags.map((t) => (
                      <span key={t} style={{
                        fontSize: '0.72rem', fontWeight: 600, padding: '3px 8px',
                        background: 'var(--color-primary)', color: '#000',
                        borderRadius: 4, letterSpacing: '0.02em',
                      }}>{t}</span>
                    ))}
                  </div>
                  <div style={{ marginTop: 'auto', paddingTop: 8 }}>
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: 6,
                      fontSize: '0.88rem', fontWeight: 600, color: 'var(--color-primary)',
                    }}>
                      {o.cta} →
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
