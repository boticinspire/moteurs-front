import type { Metadata } from 'next'
import ComparateurTCO from './ComparateurTCO'
import FaqAccordion from '@/components/FaqAccordion'

const FAQ_COMPARER = [
  {
    question: "Quelle différence entre le comparateur TCO et le simulateur ?",
    answer:
      "Le comparateur TCO est conçu pour une vue synthétique côte à côte de toutes les motorisations sur votre segment : il classe les résultats du moins cher au plus cher et met en évidence le gagnant. Le simulateur personnalisé offre davantage de paramètres (prix d'achat par motorisation, remises, profil d'usage détaillé). Utilisez le comparateur pour décider rapidement, puis le simulateur pour affiner.",
  },
  {
    question: "L'électrique est-il vraiment moins cher que le diesel sur 4 ans ?",
    answer:
      "Dans la plupart des scénarios B2B en France en 2026 (fourgon moyen, 25 000 km/an), oui : le bonus écologique + la faible recharge abaissent le TCO électrique en dessous du diesel. Mais le résultat dépend du kilométrage, de l'usage (autoroute vs urbain), du pays et des aides disponibles. Modifiez les paramètres dans le comparateur pour tester votre situation réelle.",
  },
  {
    question: "Comment sont calculés les coûts d'entretien ?",
    answer:
      "Les coûts d'entretien sont estimés à partir de moyennes sectorielles 2026 par segment (VUL, camion, etc.) et par motorisation. L'électrique est moins coûteux (pas de vidange, pas d'embrayage, freins moins usés grâce au frein régénératif). Le diesel et l'essence incluent vidanges, filtres et distribution. Les PHEV combinent les deux. Ces valeurs sont ajustées par le kilométrage annuel saisi.",
  },
  {
    question: "Le GNV (gaz naturel) est-il pertinent pour ma flotte ?",
    answer:
      "Le GNV (et son équivalent biogaz, le bioCNV) est particulièrement compétitif pour les grands kilométrages (> 50 000 km/an) et les poids-lourds en France, grâce à un réseau de stations en développement et un coût carburant inférieur au diesel. Pour les VUL petits ou moyens avec des trajets courts, l'électrique est généralement plus avantageux. Le comparateur vous permet de voir les deux côte à côte.",
  },
  {
    question: "Les aides et subventions sont-elles prises en compte ?",
    answer:
      "Oui. Le comparateur applique automatiquement les aides 2026 selon le pays sélectionné : bonus écologique (France), déductibilité fiscale intégrale des BEV (Belgique), exonérations cantonales (Suisse) et programme iZEV (Canada). Le prix d'achat affiché est le prix net après aides.",
  },
  {
    question: "Comment interpréter le badge « gagnant » ?",
    answer:
      "Le badge 🏆 est attribué à la motorisation dont le TCO total est le plus bas sur la durée sélectionnée, pour les paramètres saisis. Il ne signifie pas que cette motorisation est la meilleure dans tous les cas : une contrainte d'autonomie, l'absence de borne de recharge sur site, ou un réseau de distribution limité peuvent rendre une autre option plus adaptée à votre situation.",
  },
]

export const metadata: Metadata = {
  title: 'Comparateur TCO',
  description: 'Comparez le coût total de possession (TCO) de toutes les motorisations sur votre segment : diesel, électrique, hydrogène, GNV, PHEV, e-fuel. Aides, énergie et entretien inclus.',
}

export default function ComparerPage() {
  return (
    <>
      <section className="page-hero">
        <div className="container">
          <h1>Comparateur TCO</h1>
          <p>
            Toutes les motorisations côte à côte — achat net, énergie, entretien, aides comprises.
            Ajustez vos paramètres et le tableau se recalcule instantanément.
          </p>
        </div>
      </section>

      <section style={{ padding: '32px 0 80px' }}>
        <div className="container">
          <ComparateurTCO />
          <FaqAccordion items={FAQ_COMPARER} />
        </div>
      </section>
    </>
  )
}
