import { Link } from '@/i18n/navigation'

/**
 * ToolFooterCTA — Moteurs.com / Autopulse
 * Pied de page d'outil partagé (fil rouge Autopulse). À monter en bas des outils
 * pour ramener l'utilisateur vers le carnet d'entretien (le hub relationnel).
 */
export default function ToolFooterCTA({
  texte = 'Vous avez choisi votre voiture ? Suivez son entretien et ses coûts au fil du temps avec Autopulse.',
  cta = 'Ouvrir mon carnet d’entretien',
}: {
  texte?: string
  cta?: string
}) {
  return (
    <div
      style={{
        marginTop: 32,
        background: 'var(--color-bg-card)',
        border: '1.5px solid var(--color-border)',
        borderRadius: 14,
        padding: '20px 24px',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 16,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 240, flex: 1 }}>
        <span style={{ fontSize: '1.6rem' }} aria-hidden>🩺</span>
        <p style={{ margin: 0, fontSize: '0.92rem', color: 'var(--color-text)', lineHeight: 1.5 }}>{texte}</p>
      </div>
      <Link
        href="/outils/carnet-entretien"
        style={{
          flexShrink: 0,
          display: 'inline-flex',
          alignItems: 'center',
          gap: 7,
          background: 'var(--color-primary)',
          color: '#0a1628',
          fontWeight: 800,
          fontSize: '0.88rem',
          textDecoration: 'none',
          borderRadius: 10,
          padding: '11px 18px',
        }}
      >
        {cta} →
      </Link>
    </div>
  )
}
