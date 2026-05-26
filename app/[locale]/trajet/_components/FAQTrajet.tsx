/**
 * Génère une FAQ dynamique adaptée à un trajet + sa variante.
 * S'appuie sur FaqAccordion (qui injecte le JSON-LD FAQPage automatiquement).
 */

import FaqAccordion, { type FaqItem } from '@/components/FaqAccordion'
import { PAYS_LEGAL } from '@/lib/legal-pays'
import {
  type TrajetSEO,
  type VarianteThematique,
  type VarianteInfo,
} from '@/lib/trajets-seo'

interface Props {
  trajet: TrajetSEO
  variante?: VarianteInfo
}

export default function FAQTrajet({ trajet, variante }: Props) {
  const items = construireFAQ(trajet, variante)
  return <FaqAccordion items={items} title={`Questions fréquentes : ${trajet.titre_court}${variante ? ' ' + variante.label : ''}`} />
}

// ─── Génération FAQ ───────────────────────────────────────────────────────────

function construireFAQ(trajet: TrajetSEO, variante?: VarianteInfo): FaqItem[] {
  const origineNom = variante?.origineAlt?.ville ?? trajet.origine.ville
  const destinNom = trajet.destination.ville
  const annee = new Date().getFullYear()
  const items: FaqItem[] = []

  // 1. Distance & durée
  items.push({
    question: `Combien de temps faut-il pour aller de ${origineNom} à ${destinNom} en voiture ?`,
    answer:
      `Le trajet ${origineNom} → ${destinNom} fait environ ${trajet.distance_km} km. ` +
      `En conditions normales, comptez ${formatDureeFR(trajet.duree_base_min)} de conduite hors pauses. ` +
      `Avec deux pauses de 30 minutes et un arrêt déjeuner, prévoyez plutôt ${formatDureeFR(trajet.duree_base_min + 120)}.`,
  })

  // 2. Coût total (toujours utile)
  const coutMin = estimerCoutMin(trajet)
  items.push({
    question: `Combien coûte le trajet ${origineNom} → ${destinNom} en voiture en ${annee} ?`,
    answer:
      `Le coût total dépend de votre motorisation. Comptez environ ${coutMin}€ aller simple ` +
      `(carburant + péages) pour un véhicule essence ou diesel, ` +
      `et un peu moins en électrique selon votre tarif de recharge (autoroute vs domicile). ` +
      `Notre comparateur ci-dessus calcule le coût exact pour chaque motorisation.`,
  })

  // 3. Vignettes obligatoires (si au moins une)
  const vignettes = trajet.pays_traverses
    .map(c => PAYS_LEGAL[c])
    .filter(p => p.vignette.required)

  if (vignettes.length > 0) {
    items.push({
      question: `Quelles vignettes acheter pour le trajet ${origineNom} → ${destinNom} ?`,
      answer:
        `Sur ce trajet, vous traversez ${vignettes.length} pays imposant une vignette autoroutière : ` +
        vignettes
          .map(p =>
            `${p.nom} (${p.vignette.prix_courte ?? p.vignette.prix_annuelle} € — ${
              p.vignette.duree_courte ?? 'annuelle'
            })`
          )
          .join(', ') +
        `. Achetez-les en ligne avant le départ pour éviter les files aux frontières et les amendes en cas d'oubli.`,
    })
  }

  // 4. Péages
  if (trajet.peages_eur > 0) {
    items.push({
      question: `Combien coûtent les péages sur le trajet ${origineNom} → ${destinNom} ?`,
      answer:
        `Les péages représentent environ ${trajet.peages_eur} € aller simple, tarif standard ${annee}. ` +
        `Un badge télépéage (Bip&Go, Ulys, Telepass) accélère le passage et donne accès à des réductions ` +
        `pour les utilisateurs fréquents. Certaines variantes "sans péage" évitent ces frais — comptez ` +
        `environ 1 h supplémentaire et un confort moindre sur nationales.`,
    })
  }

  // 5. Spécifique électrique
  if (variante?.theme === 'electrique' || (!variante)) {
    const arrets = Math.max(0, Math.ceil(trajet.distance_km / 270) - 1)
    items.push({
      question: `Combien d'arrêts de recharge pour faire ${origineNom} → ${destinNom} en voiture électrique ?`,
      answer:
        `Pour un véhicule électrique avec ~270 km d'autonomie autoroute réelle (batterie 60-70 kWh, ` +
        `recharge 20→80 %), prévoyez ${arrets} arrêt(s) de recharge sur ce trajet. ` +
        `Chaque arrêt prend environ 25-30 minutes sur borne rapide DC (100 kW+). ` +
        `Les véhicules avec batterie 80+ kWh réduisent ce nombre. Notre comparateur calcule le total ` +
        `automatiquement selon le profil choisi.`,
    })
  }

  // 6. Sans-péage
  if (variante?.theme === 'sans-peage') {
    items.push({
      question: `L'itinéraire ${origineNom} → ${destinNom} sans péage est-il réaliste ?`,
      answer:
        `Oui, à condition d'accepter environ 1 à 2 h de trajet supplémentaire et un confort moindre ` +
        `(routes nationales, traversées de villes). L'économie sur les péages (~${trajet.peages_eur} €) ` +
        `compense en partie la consommation accrue sur nationales. Pour de longs trajets familiaux, ` +
        `mixer autoroute pour les longues étapes et nationales le matin (paysages, pauses) est souvent ` +
        `un bon compromis.`,
    })
  }

  // 7. Famille
  if (variante?.theme === 'famille') {
    items.push({
      question: `Comment organiser le trajet ${origineNom} → ${destinNom} avec des enfants ?`,
      answer:
        `Pour un trajet de ${trajet.distance_km} km, prévoyez une pause toutes les 2 h ou 200 km. ` +
        `Partir tôt (5-6 h du matin) permet de profiter des enfants endormis sur les premières heures, ` +
        `d'éviter la chaleur et la majorité des bouchons. Si la durée totale dépasse 10 h de conduite, ` +
        `une étape nuit est fortement recommandée — voir notre checklist "famille" ci-dessous.`,
    })
  }

  // 8. Camping-car
  if (variante?.theme === 'camping-car') {
    items.push({
      question: `Y a-t-il des restrictions camping-car sur le trajet ${origineNom} → ${destinNom} ?`,
      answer:
        `Les camping-cars de plus de 3,5 t ont des règles spécifiques : vitesse limitée (souvent ` +
        `100-110 km/h sur autoroute), parfois péages majorés (catégorie 2 ou 3 selon poids et hauteur), ` +
        `et obligation de pneus hiver dans certains pays (Allemagne, Autriche, Italie en zones montagne). ` +
        `Vérifiez la hauteur de votre véhicule (3,10 m typique) avant les parkings et tunnels.`,
    })
  }

  // 9. Le moins cher
  if (variante?.theme === 'le-moins-cher') {
    items.push({
      question: `Quelle motorisation choisir pour le trajet ${origineNom} → ${destinNom} le moins cher ?`,
      answer:
        `Le classement varie selon le tarif d'électricité retenu. En recharge majoritairement à domicile ` +
        `(0,21 €/kWh), un véhicule électrique est presque toujours le moins cher, surtout sur longs trajets. ` +
        `En recharge 100 % autoroute (~0,55 €/kWh), le diesel reprend souvent l'avantage. ` +
        `Notre comparateur ci-dessus modélise les deux cas et inclut les péages.`,
    })
  }

  // 10. ZFE / villes d'arrivée
  const paysDest = PAYS_LEGAL[trajet.destination.pays]
  if (paysDest && paysDest.zfe.length > 0) {
    const zfeProche = paysDest.zfe.find(z => z.ville === destinNom) ?? paysDest.zfe[0]
    if (zfeProche) {
      items.push({
        question: `Faut-il une vignette environnementale pour entrer à ${destinNom} ?`,
        answer:
          `${destinNom} et plusieurs grandes villes de ${paysDest.nom} appliquent une ZFE (${zfeProche.nom}). ` +
          (zfeProche.vignette_requise
            ? `Il faut être en règle avec ${zfeProche.vignette_requise}. `
            : `Vérifiez les règles locales avant d'entrer dans le centre-ville. `) +
          `Les véhicules anciens (Crit'Air 4-5 en France, Euro 0-3 ailleurs) peuvent être refoulés ou amendés.`,
      })
    }
  }

  return items
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDureeFR(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h === 0) return `${m} min`
  if (m === 0) return `${h} h`
  return `${h} h ${m.toString().padStart(2, '0')}`
}

function estimerCoutMin(trajet: TrajetSEO): number {
  // Diesel ≈ 6 L / 100 km à 1,72 €/L + péages
  const conso = (6 / 100) * trajet.distance_km * 1.72
  return Math.round(conso + trajet.peages_eur)
}
