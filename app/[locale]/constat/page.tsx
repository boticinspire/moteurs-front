import type { Metadata } from 'next'
import { Link } from '@/i18n/navigation'
import ConstantIntelligent from './ConstantIntelligent'

export const metadata: Metadata = {
  title: 'Constat Amiable Intelligent — Guidé pas-à-pas | Moteurs.com',
  description:
    'Remplissez votre constat amiable étape par étape : checklist photos, circonstances, croquis guidé, PDF téléchargeable et email récapitulatif. Adapté FR, BE, CH, CA.',
}

export default function PageConstat() {
  return (
    <main className="container" style={{ paddingTop: 40, paddingBottom: 72 }}>

      {/* ── Hero ── */}
      <div style={{ maxWidth: 720, margin: '0 auto', marginBottom: 36 }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          padding: '4px 14px', borderRadius: 20, marginBottom: 14,
          background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
          fontSize: '0.75rem', fontWeight: 700, color: '#ef4444',
          textTransform: 'uppercase', letterSpacing: '0.06em',
        }}>
          📋 Constat Amiable
        </div>
        <h1 style={{ fontSize: 'clamp(1.6rem, 4vw, 2.2rem)', marginBottom: 12, lineHeight: 1.2 }}>
          Accident — <span style={{ color: '#ef4444' }}>Remplir le constat étape par étape</span>
        </h1>
        <p style={{ color: 'var(--color-text-soft)', fontSize: '0.97rem', lineHeight: 1.65, marginBottom: 16, maxWidth: 600 }}>
          Ce guide vous accompagne de la sécurisation de l'accident jusqu'au constat signé :
          checklist photos, circonstances européennes, croquis guidé, puis PDF + email pour votre assureur.
        </p>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {['📸 Checklist photos', '📋 17 circonstances', '🗺️ Croquis guidé', '📄 PDF', '📧 Email assureur', '🇫🇷 🇧🇪 🇨🇭 🇨🇦'].map(b => (
            <span key={b} style={{
              padding: '4px 12px', borderRadius: 20, fontSize: '0.75rem',
              background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.18)',
              color: '#ef4444',
            }}>{b}</span>
          ))}
        </div>
      </div>

      {/* ── Wizard ── */}
      <ConstantIntelligent />

      {/* ── Liens retour ── */}
      <div style={{ maxWidth: 720, margin: '48px auto 0', borderTop: '1px solid var(--color-border)', paddingTop: 28, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <Link href="/assistance/panne" className="btn btn-secondary">🚨 Protocole urgence</Link>
        <Link href="/assistant-depannage" className="btn btn-secondary">🔍 Diagnostic panne</Link>
        <Link href="/assistance" className="btn btn-secondary">🤖 Hub Assistance</Link>
      </div>

    </main>
  )
}
