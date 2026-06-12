// Registre des pages "passerelles" SEO du comparateur de cartes de recharge.
// Chaque preset = une intention de recherche + un filtre sur les cartes.
// Rendu par app/[locale]/outils/cartes-recharge/comparatif/[filtre]/page.tsx

import type { Carte } from './cartes-recharge'

export interface SelectionPreset {
  slug: string
  /** Libellé court (fil d'Ariane, liens de maillage). */
  label: string
  emoji: string
  h1: string
  title: string
  description: string
  /** Paragraphe d'intro affiché sous le H1. */
  intro: string
  /** Filtre appliqué à la liste des cartes. */
  filtre: (c: Carte) => boolean
  /** Affiche les boutons de filtre pays FR/BE au-dessus du tableau. */
  showFiltrePays: boolean
  faq: { question: string; answer: string }[]
}

export const SELECTIONS: SelectionPreset[] = [
  {
    slug: 'sans-abonnement',
    label: 'Sans abonnement',
    emoji: '💳',
    h1: 'Cartes de recharge sans abonnement',
    title: 'Meilleures cartes de recharge sans abonnement 2026 | Moteurs.com',
    description:
      "Comparatif des cartes de recharge VE sans abonnement mensuel : tarif au kWh AC et DC, roaming Europe. Lidl, Chargemap, Freshmile et plus — France & Belgique.",
    intro:
      "Aucun frais fixe mensuel : vous ne payez que ce que vous rechargez. Idéal si vous rechargez peu en public ou si vous voulez éviter de cumuler les abonnements. Voici les cartes sans abonnement, classées par tarif au kWh.",
    filtre: (c) => (c.donnees?.abonnement?.mensuel_eur || 0) === 0,
    showFiltrePays: true,
    faq: [
      {
        question: 'Quelle est la meilleure carte de recharge sans abonnement ?',
        answer:
          "Lidl est la moins chère sur les bornes AC 22 kW (0,29 €/kWh) mais uniquement sur les bornes Lidl. Pour un grand réseau sans abonnement, Chargemap Pass et Freshmile sont les meilleurs agrégateurs : tarif AC autour de 0,38–0,39 €/kWh sur des milliers de points de charge.",
      },
      {
        question: 'Une carte sans abonnement est-elle vraiment gratuite ?',
        answer:
          "La carte ou le badge peut avoir un coût d'achat unique, mais il n'y a pas de frais mensuel récurrent. Vous payez uniquement vos sessions de recharge au tarif indiqué. C'est l'option la plus économique en dessous d'un certain volume mensuel.",
      },
    ],
  },
  {
    slug: 'voyage-europe',
    label: 'Voyage en Europe',
    emoji: '✈️',
    h1: 'Cartes de recharge pour voyager en Europe',
    title: 'Meilleure carte de recharge pour voyager en Europe 2026 | Moteurs.com',
    description:
      "Comparatif des cartes de recharge avec roaming européen : Chargemap, Plugsurfing, EnBW, IONITY. Couverture multi-pays et tarif DC rapide pour vos trajets longue distance.",
    intro:
      "Pour les longs trajets transfrontaliers, ce qui compte c'est la couverture du roaming (nombre de pays et de réseaux accessibles avec une seule carte) et le tarif en charge rapide. Voici les cartes les plus adaptées aux voyages en Europe.",
    filtre: (c) =>
      !!c.donnees?.roaming?.disponible &&
      (c.donnees?.roaming?.pays_couverts?.length || 0) >= 5,
    showFiltrePays: false,
    faq: [
      {
        question: 'Quelle carte choisir pour les voyages en Europe ?',
        answer:
          "Chargemap Pass et Plugsurfing offrent le meilleur roaming (30+ pays). IONITY est imbattable si vous roulez surtout sur autoroute en ultra-rapide avec son abonnement. EnBW mobility+ est le meilleur choix vers l'Allemagne et l'Autriche.",
      },
      {
        question: 'Une seule carte suffit-elle pour traverser plusieurs pays ?',
        answer:
          "Avec une carte à fort roaming (Chargemap, Plugsurfing, Freshmile), une seule carte permet d'accéder aux réseaux de la plupart des pays traversés. Pour les très gros rouleurs autoroute, un second abonnement réseau (IONITY, Fastned) peut réduire la facture sur les axes rapides.",
      },
    ],
  },
  {
    slug: 'flotte-pro',
    label: 'Flotte & pro',
    emoji: '🏢',
    h1: 'Cartes de recharge pour flotte et professionnels',
    title: 'Cartes de recharge flotte & entreprise 2026 — comparatif pro | Moteurs.com',
    description:
      "Comparatif des cartes de recharge pour flottes d'entreprise : facturation centralisée, gestion multi-véhicules, TVA récupérable. Solutions pro France & Belgique.",
    intro:
      "Pour les flottes et les professionnels, l'enjeu n'est pas que le prix au kWh : facturation centralisée, reporting, gestion des badges par véhicule et récupération de TVA font la différence. Voici les cartes avec offre flotte dédiée.",
    filtre: (c) => c.flotte_pro === true,
    showFiltrePays: true,
    faq: [
      {
        question: 'Quelle carte de recharge pour une flotte d’entreprise ?',
        answer:
          "Les cartes avec offre flotte (Freshmile, TotalEnergies Charge, Eneco, Blink, Izivia) proposent une facturation centralisée et un reporting par véhicule, indispensables en gestion de parc. Le choix dépend de votre géographie et de votre volume.",
      },
      {
        question: 'La TVA sur la recharge publique est-elle récupérable ?',
        answer:
          "Pour un usage professionnel, la TVA sur l'électricité de recharge est en principe récupérable selon les règles de chaque pays. Une facturation centralisée par carte flotte simplifie la justification comptable. Vérifiez les conditions avec votre expert-comptable.",
      },
    ],
  },
  {
    slug: 'france',
    label: 'France',
    emoji: '🇫🇷',
    h1: 'Cartes de recharge disponibles en France',
    title: 'Meilleures cartes de recharge en France 2026 — comparatif | Moteurs.com',
    description:
      "Comparatif des cartes de recharge utilisables en France : Chargemap, Freshmile, Electra, IONITY, Lidl, TotalEnergies. Tarif au kWh AC et DC, abonnement, roaming.",
    intro:
      "Les cartes ci-dessous donnent accès à un large réseau de bornes en France. Comparez le tarif au kWh en charge lente (AC) et rapide (DC), l'abonnement éventuel et la couverture pour vos déplacements.",
    filtre: (c) => (c.pays_origine || []).includes('FR'),
    showFiltrePays: false,
    faq: [
      {
        question: 'Quelle est la meilleure carte de recharge en France ?',
        answer:
          "Chargemap Pass est la référence pour le plus grand réseau en France sans abonnement. Pour la charge rapide sur autoroute, Electra et Fastned proposent des tarifs compétitifs. Lidl reste imbattable en AC mais uniquement sur ses propres bornes.",
      },
    ],
  },
  {
    slug: 'belgique',
    label: 'Belgique',
    emoji: '🇧🇪',
    h1: 'Cartes de recharge disponibles en Belgique',
    title: 'Meilleures cartes de recharge en Belgique 2026 — comparatif | Moteurs.com',
    description:
      "Comparatif des cartes de recharge utilisables en Belgique : Eneco, Blink (ex-Blue Corner), Luminus, Chargemap, IONITY. Tarif au kWh, abonnement, roaming Benelux et Europe.",
    intro:
      "Les cartes ci-dessous fonctionnent en Belgique. Acteurs locaux (Eneco, Luminus, Blink) ou agrégateurs européens (Chargemap, Freshmile) : comparez le tarif au kWh et la couverture roaming pour le Benelux et au-delà.",
    filtre: (c) => (c.pays_origine || []).includes('BE'),
    showFiltrePays: false,
    faq: [
      {
        question: 'Quelle est la meilleure carte de recharge en Belgique ?',
        answer:
          "Eneco eMobility et Luminus sont de solides acteurs belges avec une bonne couverture locale. Pour le roaming européen depuis la Belgique, Chargemap Pass et Plugsurfing restent les plus polyvalents.",
      },
    ],
  },
]

export function getSelection(slug: string): SelectionPreset | undefined {
  return SELECTIONS.find((s) => s.slug === slug)
}
