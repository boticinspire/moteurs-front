/**
 * lib/seo-keywords.ts — Auto-généré par scripts/seo-audit.py
 * Usage dans une page :
 *   import { getSeoMeta, getPageKeywords } from '@/lib/seo-keywords'
 *   const meta = getSeoMeta('/comparer')  // → { title, description, keywords }
 */

export interface SeoMeta {
  title: string
  description: string
  keywords: string[]
  primaryKeyword: string
  volume: number
  intent: 'Informationnelle' | 'Commerciale' | 'Navigationnelle' | 'Transactionnelle'
}

export const SEO_MAP: Record<string, SeoMeta> = {
  '/': {
    title: 'Calculateur TCO & Coût de Trajet | Moteurs.com — France, Belgique, Suisse',
    description: 'Comparez le coût total de votre voiture (diesel, essence, électrique) et calculez le coût de votre trajet en 30 secondes. Données 2026 triangulées.',
    keywords: ['comparateur voiture électrique', 'TCO voiture électrique', 'coût voiture électrique vs diesel'],
    primaryKeyword: 'calculateur coût trajet voiture',
    volume: 14500,
    intent: 'Commerciale',
  },
  '/comparer': {
    title: 'Comparateur voiture électrique vs diesel vs essence — TCO 2026 | Moteurs.com',
    description: 'Comparez diesel, essence, électrique, hybride et GNV sur 48 mois. Aides 2026 incluses. 4 pays couverts.',
    keywords: ['TCO voiture électrique', 'coût voiture électrique vs diesel'],
    primaryKeyword: 'comparateur voiture électrique',
    volume: 22000,
    intent: 'Commerciale',
  },
  '/comparer-trajet': {
    title: 'Calculateur coût trajet voiture — électrique vs diesel | Moteurs.com',
    description: 'Calculez le coût exact de votre trajet selon votre motorisation : péages, recharge, énergie. Badge meilleure motorisation inclus.',
    keywords: ['coût trajet voiture électrique', 'comparateur coût trajet motorisation'],
    primaryKeyword: 'calculateur coût trajet voiture',
    volume: 9800,
    intent: 'Commerciale',
  },
  '/simulateur': {
    title: 'Simulateur TCO voiture — Coût total sur mesure 2026 | Moteurs.com',
    description: 'Personnalisez km/an, durée, pays et fiscalité pour calculer le coût total de possession de votre véhicule. Export PDF inclus.',
    keywords: ['TCO voiture électrique'],
    primaryKeyword: 'simulateur coût voiture',
    volume: 9200,
    intent: 'Commerciale',
  },
  '/tco': {
    title: 'Comparatifs TCO par segment — Voiture, VUL, Camion | Moteurs.com',
    description: 'Comparatifs TCO : voiture, camionnette, camion, moto, VAE. Par pays (France, Belgique, Suisse, Canada) et motorisation. 2026.',
    keywords: ['comparatif TCO motorisation', 'coût total de possession voiture'],
    primaryKeyword: 'TCO voiture électrique',
    volume: 8500,
    intent: 'Informationnelle',
  },
  '/recharge-electrique': {
    title: 'Prix recharge voiture électrique & réseau bornes France 2026 | Moteurs.com',
    description: 'Comparez les prix de recharge (kWh, abonnement, sans abo), le réseau de bornes rapides et les meilleures cartes recharge en France et Europe.',
    keywords: ['borne recharge rapide France', 'réseau recharge voiture électrique France'],
    primaryKeyword: 'prix recharge voiture électrique',
    volume: 21000,
    intent: 'Informationnelle',
  },
  '/outils/comparer-modeles': {
    title: 'Comparateur de modèles voiture — Électrique, Diesel, Hybride | Moteurs.com',
    description: 'Comparez jusqu\'à 5 véhicules de même motorisation côte à côte : autonomie, prix, consommation, points forts & faiblesses. Analyse IA 2024–2025.',
    keywords: ['comparateur voiture électrique', 'comparer modèles voiture', 'meilleure voiture électrique 2025'],
    primaryKeyword: 'comparateur modèles voiture',
    volume: 8500,
    intent: 'Commerciale',
  },
  '/outils/cartes-recharge': {
    title: 'Meilleure carte recharge voiture électrique 2026 — Comparatif | Moteurs.com',
    description: 'Comparez Chargemap, Freshmile, IONITY, Fastned, Electra : tarifs par pays, plans abonnement, roaming. Trouvez la carte la moins chère.',
    keywords: ['carte recharge interopérable Europe', 'IONITY tarif 2026'],
    primaryKeyword: 'meilleure carte recharge voiture électrique',
    volume: 9800,
    intent: 'Commerciale',
  },
  '/depannage': {
    title: 'ZFE 2026 : Crit\'Air, vignettes, alternatives | Guide Moteurs.com',
    description: 'Tout sur les Zones à Faibles Émissions 2026 : Crit\'Air obligatoire, villes concernées, aides remplacement, alternatives. France, Belgique, Suisse.',
    keywords: ['Crit\'Air ZFE', 'zone faibles émissions 2026'],
    primaryKeyword: 'ZFE 2026',
    volume: 18000,
    intent: 'Informationnelle',
  },
  '/assistant-depannage': {
    title: 'Voyant tableau de bord : signification et que faire | Moteurs.com',
    description: 'Identifiez chaque voyant (rouge, orange, vert) : diagnostic IA par photo, niveau d\'urgence, puis-je rouler ? 75+ voyants couverts.',
    keywords: ['voyant rouge voiture', 'voyant orange moteur voiture que faire'],
    primaryKeyword: 'voyant tableau de bord signification',
    volume: 24000,
    intent: 'Informationnelle',
  },
  '/constat': {
    title: 'Constat amiable voiture — Remplir seul, wizard guidé | Moteurs.com',
    description: 'Remplissez votre constat amiable en 8 étapes : 17 cas d\'accident standardisés, export PDF, envoi email. France, Belgique, Suisse, Canada.',
    keywords: ['constat amiable remplir seul'],
    primaryKeyword: 'constat amiable voiture',
    volume: 31000,
    intent: 'Informationnelle',
  },
  '/b2b': {
    title: 'Gestion flotte électrique entreprise — TCO & Aides 2026 | Moteurs.com',
    description: 'Calculez le TCO de votre flotte, comparez utilitaires électriques vs diesel, optimisez aides et déductibilité. PME, artisans, grandes flottes.',
    keywords: ['TCO flotte véhicule électrique'],
    primaryKeyword: 'gestion flotte électrique entreprise',
    volume: 6400,
    intent: 'Commerciale',
  },
  '/particulier': {
    title: 'Aide achat voiture électrique 2026 : bonus, leasing social | Moteurs.com',
    description: 'Bonus écologique, prime conversion, leasing social : toutes les aides pour particuliers pour acheter une voiture électrique en 2026.',
    keywords: ['bonus écologique 2026', 'leasing social voiture électrique 2026'],
    primaryKeyword: 'aide achat voiture électrique 2026',
    volume: 19500,
    intent: 'Informationnelle',
  },
  '/articles/fr': {
    title: 'Bonus écologique & aides voiture électrique France 2026 | Moteurs.com',
    description: 'Décryptages TCO, ZFE, bonus écologique et prime conversion 2026 pour la France. Données triangulées, mises à jour régulièrement.',
    keywords: ['prime conversion 2026'],
    primaryKeyword: 'bonus écologique voiture électrique 2026',
    volume: 28000,
    intent: 'Informationnelle',
  },
  '/articles/be': {
    title: 'Déduction fiscale voiture électrique Belgique 2026 | Moteurs.com',
    description: 'Avantage en nature, cotisation CO2, déductibilité : tout sur la fiscalité voiture électrique en Belgique pour particuliers et entreprises.',
    keywords: ['avantage toute nature voiture électrique Belgique'],
    primaryKeyword: 'déduction fiscale voiture électrique Belgique 2026',
    volume: 8400,
    intent: 'Informationnelle',
  },
  '/articles/ch': {
    title: 'Aide cantonale voiture électrique Suisse 2026 | Moteurs.com',
    description: 'Subventions par canton (Genève, Vaud, Zurich...) pour l\'achat d\'un véhicule électrique ou hybride en Suisse. Guide mis à jour.',
    keywords: [],
    primaryKeyword: 'aide cantonale voiture électrique Suisse',
    volume: 3600,
    intent: 'Informationnelle',
  },
  '/articles/ca': {
    title: 'Incitatif fédéral véhicule zéro émission Canada — IZEV 2026 | Moteurs.com',
    description: 'Programme IZEV, Roulez Vert Québec, aides provinciales : toutes les aides pour acheter une voiture électrique au Canada en 2026.',
    keywords: ['programme IZEV Canada 2026', 'roulez vert Québec 2026'],
    primaryKeyword: 'incitatif fédéral véhicule zéro émission Canada',
    volume: 4200,
    intent: 'Informationnelle',
  },
  '/vacances-voiture': {
    title: 'Trajet vacances voiture électrique — Coût, recharge, vignettes | Moteurs.com',
    description: 'Planifiez vos vacances en voiture électrique : coût de trajet, bornes de recharge, vignettes autoroute Europe, autonomie réelle en été.',
    keywords: ['vignette autoroute Suisse voiture électrique'],
    primaryKeyword: 'trajet vacances voiture électrique',
    volume: 11000,
    intent: 'Informationnelle',
  },
  '/trajet': {
    title: 'Itinéraires vacances Europe — Coût voiture & recharge | Moteurs.com',
    description: '25 grands itinéraires de vacances calculés : Paris-Nice, Belgique-Costa Brava, etc. Coût par motorisation, bornes, péages.',
    keywords: ['coût trajet Paris Nice voiture'],
    primaryKeyword: 'itinéraires vacances Europe voiture',
    volume: 7000,
    intent: 'Informationnelle',
  },
  '/cout-voiture': {
    title: 'TCO voiture électrique vs diesel — Coût total 2026 | Moteurs.com',
    description: 'Calculez et comparez le coût total de possession d\'une voiture électrique face au diesel et à l\'essence sur 4 ans. France, Belgique, Suisse.',
    keywords: ['coût possession voiture diesel France'],
    primaryKeyword: 'TCO voiture électrique vs diesel',
    volume: 6400,
    intent: 'Informationnelle',
  },
  '/documents-auto': {
    title: 'Documents auto obligatoires en voiture à l\'étranger 2026 | Moteurs.com',
    description: 'Permis international, carte grise, certificat de conformité, vignettes : tous les documents obligatoires selon le pays de destination.',
    keywords: [],
    primaryKeyword: 'documents auto obligatoires voiture',
    volume: 4500,
    intent: 'Informationnelle',
  },
  '/outils/immatriculation-france': {
    title: 'Immatriculation voiture étrangère en France — Délais & démarches 2026 | Moteurs.com',
    description: 'Comment immatriculer une voiture étrangère en France : délai légal, documents, coût carte grise, démarches en ligne.',
    keywords: [],
    primaryKeyword: 'immatriculation voiture étrangère France délai',
    volume: 6800,
    intent: 'Informationnelle',
  },
  '/outils/immatriculation-belgique': {
    title: 'Immatriculation voiture étrangère en Belgique 2026 | Moteurs.com',
    description: 'Certificat d\'immatriculation belge pour véhicule étranger : démarches DIV, documents requis, délais, coûts.',
    keywords: [],
    primaryKeyword: 'certificat immatriculation Belgique voiture étrangère',
    volume: 5200,
    intent: 'Informationnelle',
  },
  '/outils/tco-poids-lourds': {
    title: 'Calculateur TCO Poids Lourds Europe 2025 — Tracteur, Porteur, Électrique | Moteurs.com',
    description: 'Calculez le coût total de possession de votre poids lourd : capital, énergie, AdBlue, maintenance, conducteur, péages. Benchmarks IRU/ACEA — Diesel, GNV, HVO, Électrique.',
    keywords: ['TCO poids lourd', 'coût total possession camion', 'calculateur TCO transport', 'coût km tracteur diesel'],
    primaryKeyword: 'calculateur TCO poids lourd Europe',
    volume: 3200,
    intent: 'Commerciale',
  },
  '/outils/recharge-domicile-voiture-societe-belgique': {
    title: 'Recharge à domicile voiture de société : montant imposable (Belgique) | Moteurs.com',
    description: 'Calculez l\'avantage imposable (ATN) du remboursement de la recharge à domicile d\'une voiture de société en Belgique. Barème CREG, circulaire 2024/C/77.',
    keywords: ['ATN recharge domicile voiture société', 'barème CREG remboursement recharge', 'circulaire 2024/C/77'],
    primaryKeyword: 'recharge domicile voiture de société imposable Belgique',
    volume: 1900,
    intent: 'Informationnelle',
  },
}

/** Retourne le metadata SEO pour une route donnée. */
export function getSeoMeta(route: string): SeoMeta | null {
  return SEO_MAP[route] ?? null
}

/** Retourne tous les keywords (primary + secondary) pour une route. */
export function getPageKeywords(route: string): string[] {
  const meta = SEO_MAP[route]
  if (!meta) return []
  return [meta.primaryKeyword, ...meta.keywords]
}

/** Retourne le title + description pour generateMetadata(). */
export function getStaticMetadata(route: string) {
  const m = SEO_MAP[route]
  if (!m) return {}
  return {
    title: m.title,
    description: m.description,
    keywords: [m.primaryKeyword, ...m.keywords].join(', '),
    openGraph: { title: m.title, description: m.description },
    alternates: { canonical: `https://moteurs.com${route}` },
  }
}