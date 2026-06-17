import type { Metadata } from 'next'
import { Link } from '@/i18n/navigation'
import ComparateurModeles from './ComparateurModeles'

export const metadata: Metadata = {
  title: { absolute: 'Comparateur de voitures électriques côte à côte | Moteurs.com' },
  description:
    'Comparez 2 ou 3 voitures électriques côte à côte : autonomie, consommation réelle, puissance et temps de recharge. Choisissez le bon modèle.',
  alternates: { canonical: 'https://moteurs.com/voitures/comparer' },
}

export default function ComparerModelesPage() {
  return (
    <main style={{ maxWidth: 880, margin: '0 auto', padding: '28px 20px 64px' }}>
      <nav style={{ fontSize: 13, color: 'var(--color-text-muted)', marginBottom: 12 }}>
        <Link href="/voitures" style={{ color: 'var(--color-text-muted)' }}>← Catalogue des voitures électriques</Link>
      </nav>
      <h1 style={{ fontSize: '1.8rem', lineHeight: 1.2, marginBottom: 8 }}>
        Comparer des voitures électriques côte à côte
      </h1>
      <p style={{ color: 'var(--color-text-muted)', maxWidth: 700, marginBottom: 24 }}>
        Sélectionnez 2 ou 3 modèles : autonomie, consommation réelle, puissance de charge et temps de
        recharge sont comparés ligne par ligne, la meilleure valeur en surbrillance.
      </p>
      <ComparateurModeles />
    </main>
  )
}
