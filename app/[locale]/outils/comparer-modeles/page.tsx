import type { Metadata } from 'next'
import ComparateurModeles from './ComparateurModeles'

export const metadata: Metadata = {
  title: 'Comparateur de modèles — Électrique, Diesel, Essence, Hybride | Moteurs.com',
  description: 'Comparez jusqu\'à 5 véhicules de même motorisation côte à côte : autonomie, prix, consommation, points forts & faibles. Analyse IA 2024–2025.',
  keywords: ['comparateur voiture', 'comparer modèles voiture', 'comparatif électrique diesel', 'meilleure voiture électrique 2025'],
  alternates: {
    canonical: '/outils/comparer-modeles',
  },
  openGraph: {
    title: 'Comparateur de modèles | Moteurs.com',
    description: 'Comparez jusqu\'à 5 véhicules côte à côte — specs, forces, faiblesses, verdict IA.',
    url: 'https://moteurs.com/outils/comparer-modeles',
  },
}

export default function ComparerModelesPage() {
  return <ComparateurModeles />
}
