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
  /** Groupe d'affichage dans le hub (profil d'usage vs réseau opérateur). */
  groupe?: 'profil' | 'reseau'
  /** Encart "accessible aussi en roaming" affiché sur les pages réseau. */
  noteRoaming?: string
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

  // ── Pages réseau (carte opérateur + note roaming) ────────────────────────────
  {
    slug: 'reseau-fastned',
    label: 'Réseau Fastned',
    emoji: '⚡',
    groupe: 'reseau',
    h1: 'Quelle carte pour recharger sur le réseau Fastned ?',
    title: 'Carte de recharge réseau Fastned 2026 — tarifs & alternatives | Moteurs.com',
    description:
      'Recharger sur le réseau Fastned : tarif de la carte Fastned (Standard vs Gold) et accès en roaming via Chargemap, Plugsurfing ou Freshmile. France, Belgique, Europe.',
    intro:
      "Fastned exploite un réseau de stations DC rapide et ultra-rapide sur les grands axes européens. Le moyen le moins cher d'y recharger est généralement la carte Fastned elle-même, en particulier avec l'abonnement Gold pour les gros rouleurs.",
    filtre: (c) => c.operateur === 'Fastned',
    showFiltrePays: false,
    noteRoaming:
      "Vous n'êtes pas obligé d'avoir la carte Fastned pour recharger sur ses bornes : une carte multi-réseaux comme Chargemap Pass, Plugsurfing ou Freshmile y donne accès en roaming, souvent à un tarif un peu plus élevé que la carte maison. La carte Fastned (surtout en formule Gold) reste habituellement la moins chère sur son propre réseau.",
    faq: [
      {
        question: 'Faut-il un abonnement pour recharger chez Fastned ?',
        answer:
          "Non. Vous pouvez payer au tarif Standard (carte bancaire à la borne ou app, prix unique) sans abonnement. L'abonnement Gold (environ 11,99 €/mois) débloque environ -25 % et devient rentable au-delà de ~110 kWh/mois rechargés sur Fastned.",
      },
      {
        question: 'Quelle carte multi-réseaux fonctionne sur Fastned ?',
        answer:
          'Les grands agrégateurs comme Chargemap Pass, Plugsurfing et Freshmile permettent de recharger sur Fastned en roaming. Le tarif est alors fixé par votre fournisseur de carte et est généralement supérieur au tarif Fastned direct.',
      },
    ],
  },
  {
    slug: 'reseau-ionity',
    label: 'Réseau IONITY',
    emoji: '⚡',
    groupe: 'reseau',
    h1: 'Quelle carte pour recharger sur le réseau IONITY ?',
    title: 'Carte de recharge réseau IONITY 2026 — Motion, Power & roaming | Moteurs.com',
    description:
      "Recharger sur le réseau IONITY : tarifs sans abonnement (App/Direct) vs abonnements Motion et Power, et accès en roaming via d'autres cartes. France, Belgique, Europe.",
    intro:
      "IONITY est un réseau ultra-rapide (≥350 kW) présent dans une vingtaine de pays européens. Sans abonnement, le tarif est élevé ; les formules Motion (≈5,99 €/mois) et Power (≈11,99 €/mois) réduisent fortement le prix au kWh pour ceux qui roulent beaucoup sur autoroute.",
    filtre: (c) => c.operateur === 'IONITY',
    showFiltrePays: false,
    noteRoaming:
      "Certaines cartes tierces donnent accès à IONITY en roaming — notamment EnBW mobility+, qui inclut le réseau IONITY à tarif réduit, ainsi que Chargemap ou Plugsurfing. Pour un usage autoroute intensif, l'abonnement IONITY direct (Motion ou Power) reste souvent le plus avantageux.",
    faq: [
      {
        question: 'IONITY est-il intéressant sans abonnement ?',
        answer:
          "Sans abonnement, IONITY applique un tarif App ou Direct élevé (autour de 0,51–0,54 €/kWh en France). Si vous rechargez régulièrement sur IONITY, l'abonnement Motion ou Power réduit nettement la facture.",
      },
      {
        question: 'Quelle carte pour IONITY moins chère que l’abonnement ?',
        answer:
          "EnBW mobility+ inclut IONITY à un tarif réduit sans abonnement IONITY dédié, ce qui peut être intéressant pour un usage occasionnel, surtout sur les trajets vers l'Allemagne et l'Autriche.",
      },
    ],
  },
  {
    slug: 'reseau-electra',
    label: 'Réseau Electra',
    emoji: '⚡',
    groupe: 'reseau',
    h1: 'Quelle carte pour recharger sur le réseau Electra ?',
    title: 'Carte de recharge réseau Electra 2026 — tarif app & abonnement | Moteurs.com',
    description:
      "Recharger sur le réseau Electra : tarif de l'app Electra, option Electra+ et accès en roaming. Réseau DC ultra-rapide urbain et autoroute. France, Belgique, Europe.",
    intro:
      "Electra est un opérateur de bornes DC ultra-rapide (≥150 kW) en forte croissance, surtout en zones urbaines et sur autoroute. Le tarif via l'app Electra est compétitif, et l'abonnement optionnel Electra+ réduit encore le prix au kWh.",
    filtre: (c) => c.operateur === 'Electra',
    showFiltrePays: false,
    noteRoaming:
      "Vous pouvez recharger sur Electra avec un badge multi-réseaux (Chargemap, Plugsurfing, Freshmile) en roaming, mais le tarif appliqué est alors celui de votre fournisseur de carte et un surcoût est possible. L'app Electra reste généralement la moins chère sur le réseau Electra.",
    faq: [
      {
        question: 'Le tarif Electra est-il fixe ?',
        answer:
          "Non, Electra applique une tarification dynamique en France : le prix au kWh varie selon la station (environ 0,39 à 0,61 €/kWh). Le prix exact est affiché sur la borne et dans l'app avant le lancement de la charge.",
      },
    ],
  },
  {
    slug: 'reseau-totalenergies',
    label: 'Réseau TotalEnergies',
    emoji: '⚡',
    groupe: 'reseau',
    h1: 'Quelle carte pour recharger sur le réseau TotalEnergies ?',
    title: 'Carte de recharge réseau TotalEnergies 2026 — tarifs & accès | Moteurs.com',
    description:
      'Recharger sur le réseau TotalEnergies (stations-service et bornes urbaines) : tarif de la carte TotalEnergies Charge et accès en roaming. France, Belgique.',
    intro:
      "TotalEnergies déploie des bornes AC et DC, intégrées notamment à son réseau de stations-service. La carte TotalEnergies Charge donne accès à ce réseau et à un bon roaming européen.",
    filtre: (c) => c.operateur === 'TotalEnergies',
    showFiltrePays: false,
    noteRoaming:
      'Les bornes TotalEnergies sont aussi accessibles via des cartes multi-réseaux comme Chargemap Pass, Plugsurfing ou Freshmile en roaming. Le tarif dépend alors du fournisseur de la carte.',
    faq: [
      {
        question: 'Où sont les bornes du réseau TotalEnergies ?',
        answer:
          'TotalEnergies installe des bornes dans ses stations-service (axes routiers et autoroutes) ainsi que des points de charge urbains, en France et en Belgique. La couverture exacte dépend de votre région.',
      },
    ],
  },
  {
    slug: 'reseau-enbw',
    label: 'Réseau EnBW',
    emoji: '⚡',
    groupe: 'reseau',
    h1: 'Quelle carte pour recharger sur le réseau EnBW ?',
    title: 'Carte de recharge réseau EnBW 2026 — DACH & IONITY inclus | Moteurs.com',
    description:
      "Recharger sur le réseau EnBW mobility+ : tarif unique, réseau IONITY inclus à tarif réduit, idéal pour l'Allemagne, l'Autriche et la Suisse. France, Europe.",
    intro:
      "EnBW mobility+ propose l'un des plus grands réseaux de recharge en Allemagne, Autriche et Suisse, avec un tarif simple et l'accès au réseau IONITY à prix réduit. C'est souvent la meilleure carte pour les trajets vers la zone DACH.",
    filtre: (c) => c.operateur === 'EnBW',
    showFiltrePays: false,
    noteRoaming:
      "EnBW mobility+ est avant tout intéressante pour son propre réseau et son accès IONITY. Pour la France, des cartes comme Chargemap Pass peuvent offrir une meilleure couverture locale ; comparez selon vos trajets habituels.",
    faq: [
      {
        question: 'EnBW est-elle utile en France ?',
        answer:
          "EnBW mobility+ fonctionne en France via le roaming, mais son intérêt principal reste les trajets vers l'Allemagne, l'Autriche et la Suisse, où sa couverture et ses tarifs sont les plus compétitifs.",
      },
    ],
  },
  {
    slug: 'reseau-allego',
    label: 'Réseau Allego',
    emoji: '⚡',
    groupe: 'reseau',
    h1: 'Quelle carte pour recharger sur le réseau Allego ?',
    title: 'Carte de recharge réseau Allego 2026 — Benelux & autoroute | Moteurs.com',
    description:
      'Recharger sur le réseau Allego (Benelux, Allemagne, autoroutes) : tarif de la carte Allego et accès en roaming via les grands agrégateurs. Belgique, Pays-Bas, France.',
    intro:
      "Allego est un opérateur majeur de bornes de recharge au Benelux et en Allemagne, avec un bon maillage autoroutier. Sa carte donne accès à son réseau ainsi qu'à un roaming européen.",
    filtre: (c) => c.operateur === 'Allego',
    showFiltrePays: false,
    noteRoaming:
      'Les bornes Allego sont aussi accessibles avec une carte multi-réseaux (Chargemap, Plugsurfing, Freshmile) en roaming. Le tarif dépend alors de votre fournisseur de carte.',
    faq: [
      {
        question: 'Où le réseau Allego est-il le plus dense ?',
        answer:
          "Allego est surtout présent aux Pays-Bas, en Belgique et en Allemagne, avec des stations rapides le long des grands axes. Sa présence en France est plus limitée que celle des opérateurs locaux.",
      },
    ],
  },
]

export const SELECTIONS_PROFIL = SELECTIONS.filter((s) => s.groupe !== 'reseau')
export const SELECTIONS_RESEAU = SELECTIONS.filter((s) => s.groupe === 'reseau')

export function getSelection(slug: string): SelectionPreset | undefined {
  return SELECTIONS.find((s) => s.slug === slug)
}
