import type { Metadata } from 'next'
import { setRequestLocale } from 'next-intl/server'
import { routing } from '@/i18n/routing'
import ComparateurModeles from './ComparateurModeles'

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }))
}

export const metadata: Metadata = {
  title: 'Comparateur de modèles — Électrique, Diesel, Essence, Hybride | Moteurs.com',
  description: "Comparez jusqu'à 5 véhicules de même motorisation côte à côte : autonomie, prix, consommation, points forts & faibles. Analyse IA 2024–2025.",
  alternates: {
    canonical: '/outils/comparer-modeles',
  },
}

export default async function ComparerModelesPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)
  return <ComparateurModeles />
}
