import Link from 'next/link'

export default function NotFound() {
  return (
    <div style={{ textAlign: 'center', padding: '80px 24px' }}>
      <h1 style={{ fontSize: '1.4rem', marginBottom: 12 }}>Article introuvable</h1>
      <p style={{ color: 'var(--color-text-soft)', marginBottom: 24 }}>
        Cet article n&apos;existe pas ou a été supprimé.
      </p>
      <Link href="/articles" className="btn btn-primary">
        Voir tous les décryptages →
      </Link>
    </div>
  )
}
