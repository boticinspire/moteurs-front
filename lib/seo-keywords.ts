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
  '/articles': {
    title: 'Décryptages auto & transition énergétique 2026 — Aides, ZFE, TCO | Moteurs.com',
    description: 'Tous nos décryptages sur la voiture et la transition énergétique : aides 2026, bonus écologique, ZFE, TCO, fiscalité électrique. Veille triangulée, sources officielles recoupées, 4 pays (France, Belgique, Suisse, Canada).',
    keywords: ['actualité voiture électrique', 'aides voiture électrique 2026', 'décryptage transition énergétique'],
    primaryKeyword: 'actualité voiture électrique 2026',
    volume: 12000,
    intent: 'Informationnelle',
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
  '/outils/facture-recharge': {
    title: 'Avez-vous payé votre recharge trop cher ? Simulateur de facture | Moteurs.com',
    description: 'Entrez ce que vous avez payé sur une borne (kWh + montant) : on compare au tarif le moins cher et on vous dit combien vous auriez économisé avec la bonne carte.',
    keywords: ['prix recharge trop cher', 'tarif recharge borne arnaque', 'combien coûte une recharge'],
    primaryKeyword: 'prix recharge voiture électrique trop cher',
    volume: 4800,
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
    title: 'Dépannage voiture : numéros d\'urgence, voyants, panne 2026 | Moteurs.com',
    description: 'Que faire en cas de panne ? Numéros d\'urgence par pays, diagnostic voyant par photo, constat amiable européen, top pannes et coût d\'un dépannage. France, Belgique, Suisse.',
    keywords: ['panne voiture que faire', 'numéro dépannage autoroute'],
    primaryKeyword: 'dépannage voiture',
    volume: 14500,
    intent: 'Informationnelle',
  },
  '/zfe-reglementation': {
    title: 'ZFE 2026 : zones à faibles émissions, Crit\'Air et villes concernées | Moteurs.com',
    description: 'ZFE 2026 : suppression votée puis bloquée, les zones restent en vigueur. Villes, calendrier de verbalisation (Paris, Lyon, Grenoble), vignette Crit\'Air et véhicules interdits.',
    keywords: ['Crit\'Air ZFE', 'zone faibles émissions 2026', 'ZFE Paris Lyon Grenoble', 'véhicules interdits ZFE'],
    primaryKeyword: 'ZFE 2026',
    volume: 18000,
    intent: 'Informationnelle',
  },
  '/aides-vehicules': {
    title: 'Aides voiture électrique 2026 : bonus écologique, leasing social, B2B | Moteurs.com',
    description: 'Toutes les aides 2026 : bonus écologique jusqu\'à 5 700 €, surbonus batterie européenne, leasing social, aides entreprise (suramortissement, TVA, CEE borne). Montants et conditions vérifiés.',
    keywords: ['aide achat voiture électrique 2026', 'leasing social voiture électrique 2026', 'prime conversion 2026', 'suramortissement véhicule électrique'],
    primaryKeyword: 'bonus écologique 2026',
    volume: 28000,
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
  '/outils/calculateur-charge': {
    title: 'Calculateur de charge VE — Temps, coût et comparatif bornes | Moteurs.com',
    description: 'Calculez le temps de charge exact de votre véhicule électrique et son coût selon votre borne (7,4 kW, 11 kW, 22 kW, DC) et votre tarif réseau. Comparatif toutes bornes inclus.',
    keywords: ['calculateur charge voiture électrique', 'temps recharge VE', 'coût recharge électrique', 'comparatif bornes recharge'],
    primaryKeyword: 'calculateur temps charge voiture électrique',
    volume: 2800,
    intent: 'Transactionnelle',
  },
  '/outils/tco-particulier': {
    title: 'Simulateur TCO Particulier — Électrique vs Thermique 2026 | Moteurs.com',
    description: 'Calculez le coût total de possession réel d\'une voiture électrique vs essence ou diesel sur 10 ans : achat, énergie, entretien, dépréciation et aides fiscales FR/BE/CH.',
    keywords: ['TCO voiture électrique particulier', 'coût revient voiture électrique', 'rentabilité voiture électrique', 'comparatif électrique thermique coût'],
    primaryKeyword: 'simulateur TCO voiture électrique particulier',
    volume: 4100,
    intent: 'Commerciale',
  },
  '/outils/tco-poids-lourds': {
    title: 'Calculateur TCO Poids Lourds Europe 2025 — Tracteur, Porteur, Électrique | Moteurs.com',
    description: 'Calculez le coût total de possession de votre poids lourd : capital, énergie, AdBlue, maintenance, conducteur, péages. Benchmarks IRU/ACEA — Diesel, GNV, HVO, Électrique.',
    keywords: ['TCO poids lourd', 'coût total possession camion', 'calculateur TCO transport', 'coût km tracteur diesel'],
    primaryKeyword: 'calculateur TCO poids lourd Europe',
    volume: 3200,
    intent: 'Commerciale',
  },
  '/outils/simulateur-borne-recharge': {
    title: 'Simulateur budget borne de recharge IRVE | Moteurs.com',
    description: "Estimez le coût complet d'installation d'une borne de recharge (IRVE) : matériel, câblage, main d'œuvre, TVA. BE, FR, CH, LU. Outil pré-devis pour particuliers et entreprises.",
    keywords: ['budget borne recharge domicile', 'coût installation borne IRVE', 'devis borne recharge'],
    primaryKeyword: 'simulateur budget borne de recharge installation',
    volume: 2200,
    intent: 'Transactionnelle',
  },
  '/outils/recharge-domicile-voiture-societe-belgique': {
    title: 'Recharge à domicile voiture de société : montant imposable (Belgique) | Moteurs.com',
    description: 'Calculez l\'avantage imposable (ATN) du remboursement de la recharge à domicile d\'une voiture de société en Belgique. Barème CREG, circulaire 2024/C/77.',
    keywords: ['ATN recharge domicile voiture société', 'barème CREG remboursement recharge', 'circulaire 2024/C/77'],
    primaryKeyword: 'recharge domicile voiture de société imposable Belgique',
    volume: 1900,
    intent: 'Informationnelle',
  },
  '/outils/smart-charging-roi': {
    title: 'Retour sur investissement borne — Smart Charging & Solaire | Moteurs.com',
    description: "Simulez en 4 étapes l'économie réelle du Smart Charging : autoconsommation solaire optimisée, tarifs dynamiques Spot/Belpex, coût au kilomètre et temps de retour sur investissement de votre borne.",
    keywords: ['rentabilité borne recharge solaire', 'tarif dynamique voiture électrique', 'smart charging ROI'],
    primaryKeyword: 'retour sur investissement borne recharge électrique',
    volume: 800,
    intent: 'Transactionnelle',
  },
  '/outils/dpi-borne-belgique': {
    title: 'DPI Borne de recharge 2026 — Gain Fiscal Belgique (Indépendant / PME) | Moteurs.com',
    description: "Calculez votre réduction d'impôt réelle via la Déduction pour Investissement (DPI) environnementale pour une borne de recharge connectée en Belgique — indépendant, PME ou grande entreprise.",
    keywords: ['DPI borne recharge Belgique', 'déduction investissement borne IRVE', 'avantage fiscal borne électrique Belgique'],
    primaryKeyword: 'DPI déduction investissement borne recharge Belgique 2026',
    volume: 600,
    intent: 'Transactionnelle',
  },
  '/jeux': {
    title: 'Jeux gratuits — la pause détente | Moteurs.com',
    description: 'Des jeux gratuits pour faire une pause : Sudoku et bientôt plus. Accessibles gratuitement à tous les membres de Moteurs.com.',
    keywords: ['jeux gratuits en ligne', 'jeu de réflexion gratuit', 'pause détente'],
    primaryKeyword: 'jeux gratuits en ligne',
    volume: 0,
    intent: 'Navigationnelle',
  },
  '/jeux/sudoku': {
    title: 'Sudoku gratuit en ligne — pause détente | Moteurs.com',
    description: 'Jouez au Sudoku directement dans votre navigateur : 4 niveaux (facile à expert), grille à solution unique générée à chaque partie, notes, indices et chrono. Réservé aux membres.',
    keywords: ['sudoku gratuit en ligne', 'jeu sudoku navigateur', 'grille sudoku à imprimer'],
    primaryKeyword: 'sudoku gratuit en ligne',
    volume: 0,
    intent: 'Navigationnelle',
  },
  '/presse': {
    title: 'Espace presse — Moteurs.com, média de la transition énergétique des transports',
    description: 'Kit média, chiffres clés, communiqués et contact journalistes. Moteurs.com, média de référence sur la transition énergétique des transports routiers (France, Belgique, Suisse, Canada).',
    keywords: ['espace presse Moteurs.com', 'kit média Moteurs.com', 'contact presse transition énergétique'],
    primaryKeyword: 'Moteurs.com presse',
    volume: 0,
    intent: 'Informationnelle',
  },
  '/dessins': {
    title: 'Dessins & humour — la transition énergétique en images | Moteurs.com',
    description: "La galerie de dessins de Moteurs.com : le coup de crayon humoristique de l'actu auto (voiture électrique, ZFE, recharge) et les illustrations de nos décryptages.",
    keywords: ['dessin de presse voiture électrique', 'humour mobilité', 'illustration transition énergétique'],
    primaryKeyword: 'dessin humour voiture électrique',
    volume: 0,
    intent: 'Informationnelle',
  },
  '/charte-editoriale': {
    title: 'Charte éditoriale & déontologie — Moteurs.com',
    description: 'Notre méthode journalistique : triangulation des sources, niveaux de confiance, indépendance, politique de corrections et de transparence. La déontologie éditoriale de Moteurs.com.',
    keywords: ['charte éditoriale Moteurs.com', 'déontologie Moteurs.com', 'politique de corrections'],
    primaryKeyword: 'charte éditoriale Moteurs.com',
    volume: 0,
    intent: 'Informationnelle',
  },
  '/outils/comparateur-voiture-societe-belgique': {
    title: 'Comparateur voiture de société 2026 — autonomie, ATN, recharge (Belgique) | Moteurs.com',
    description: 'Comparez les voitures de société de la Carlist (catégories A, B, C) : autonomie réelle été/hiver, confort, ATN mensuel et coût de recharge selon votre installation (PV, borne, public). Barème CREG 2026.',
    keywords: ['comparateur voiture de société Belgique', 'autonomie voiture société hiver', 'ATN voiture électrique Belgique', 'Carlist voiture société'],
    primaryKeyword: 'comparateur voiture de société électrique Belgique',
    volume: 1300,
    intent: 'Commerciale',
  },
  '/outils/comparateur-financement-voiture': {
    title: 'LOA, LLD, crédit ou comptant : le vrai coût de votre voiture | Moteurs.com',
    description: "Comparez achat comptant, crédit auto, LOA et LLD pour calculer le vrai coût de votre voiture et identifier l'option la plus avantageuse. Coût réel actualisé (coût d'opportunité, revente, usage), adapté à la France, la Belgique, le Luxembourg, la Suisse et le Canada — en € / CHF / C$.",
    keywords: ['LOA ou crédit', 'LOA LLD crédit comptant', 'vrai coût voiture', 'comparateur financement voiture', 'leasing ou achat voiture', 'coût réel LOA', 'leasing voiture Suisse', 'prêt à tempérament Belgique', 'crédit auto Canada'],
    primaryKeyword: 'LOA ou crédit ou comptant',
    volume: 4400,
    intent: 'Commerciale',
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
    // absolute: contourne le title template du layout (évite la duplication "— Moteurs.com")
    title: { absolute: m.title },
    description: m.description,
    keywords: [m.primaryKeyword, ...m.keywords].join(', '),
    openGraph: { title: m.title, description: m.description },
    alternates: { canonical: `https://moteurs.com${route}` },
  }
}
