// lib/assistance-location.ts
// Assistance Location voiture + Analyse assurance

export type Pays        = 'FR' | 'BE' | 'CH' | 'CA' | 'ES' | 'IT' | 'PT' | 'DE' | 'GB' | 'US' | 'MA' | 'TN'
export type TypeVehicule = 'citadine' | 'berline' | 'suv' | 'utilitaire' | 'luxe'
export type DureeLocation = 'weekend' | 'semaine' | 'quinzaine' | 'mois'
export type CarteBancaire = 'visa_classic' | 'visa_premier' | 'visa_infinite' | 'mc_standard' | 'mc_gold' | 'mc_world' | 'amex' | 'aucune'

export interface LocationData {
  paysLocation:    Pays | null
  typeVehicule:    TypeVehicule | null
  duree:           DureeLocation | null
  carteBancaire:   CarteBancaire | null
  assurancePerso:  boolean   // assurance auto perso couvre les locations
  cdwPropose:      boolean   // loueur propose CDW/LDW
  prixCdwJour:     number    // €/jour demandé par le loueur
  ageConduc:       number    // âge du conducteur
  conducteurAddl:  boolean   // conducteur supplémentaire prévu
}

// ── Couverture cartes bancaires ────────────────────────────────────────────────

export interface CouvertureCB {
  nom:            string
  franchise:      number | null   // € (null = couverture totale)
  plafondVehicule: number | null  // valeur max du véhicule couvert
  dureeMax:       number          // jours max de location couverts
  paysExclus:     string[]
  rembourseVol:   boolean
  rachatFranchise: boolean        // permet de racheter la franchise
  conseil:        string
}

export const COUVERTURE_CB: Record<CarteBancaire, CouvertureCB> = {
  visa_classic: {
    nom: 'Visa Classic', franchise: 1600, plafondVehicule: 30000, dureeMax: 31,
    paysExclus: ['US', 'CA', 'IE'], rembourseVol: false, rachatFranchise: false,
    conseil: 'Couverture basique — franchise élevée. Prenez le CDW si véhicule > 30 000 €.',
  },
  visa_premier: {
    nom: 'Visa Premier', franchise: 0, plafondVehicule: 50000, dureeMax: 31,
    paysExclus: ['US', 'CA'], rembourseVol: true, rachatFranchise: true,
    conseil: 'Bonne couverture sans franchise. Vérifiez les exclusions pays et la valeur du véhicule.',
  },
  visa_infinite: {
    nom: 'Visa Infinite', franchise: 0, plafondVehicule: 80000, dureeMax: 45,
    paysExclus: [], rembourseVol: true, rachatFranchise: true,
    conseil: 'Couverture premium. Vous pouvez refuser le CDW du loueur dans la plupart des cas.',
  },
  mc_standard: {
    nom: 'Mastercard Standard', franchise: 1600, plafondVehicule: 30000, dureeMax: 31,
    paysExclus: ['US', 'CA', 'AU'], rembourseVol: false, rachatFranchise: false,
    conseil: 'Couverture limitée — franchise élevée, vol non couvert. CDW conseillé.',
  },
  mc_gold: {
    nom: 'Mastercard Gold', franchise: 0, plafondVehicule: 50000, dureeMax: 31,
    paysExclus: ['US', 'CA'], rembourseVol: true, rachatFranchise: true,
    conseil: 'Bonne protection sans franchise. Idéal pour l\'Europe.',
  },
  mc_world: {
    nom: 'Mastercard World / Elite', franchise: 0, plafondVehicule: 100000, dureeMax: 60,
    paysExclus: [], rembourseVol: true, rachatFranchise: true,
    conseil: 'Couverture maximale. Refusez le CDW loueur — vous êtes couvert.',
  },
  amex: {
    nom: 'American Express', franchise: 0, plafondVehicule: 75000, dureeMax: 30,
    paysExclus: ['AU', 'NZ', 'IE'], rembourseVol: true, rachatFranchise: true,
    conseil: 'Excellent pour location — couverture collision sans franchise dans la plupart des pays.',
  },
  aucune: {
    nom: 'Pas de carte adaptée', franchise: null, plafondVehicule: null, dureeMax: 0,
    paysExclus: [], rembourseVol: false, rachatFranchise: false,
    conseil: 'Sans carte bancaire couvrant les locations, prenez obligatoirement le CDW + vol chez le loueur.',
  },
}

// ── Spécificités pays location ─────────────────────────────────────────────────

export interface InfoPaysLocation {
  flag:          string
  nom:           string
  risques:       string[]
  obligatoire:   string[]
  conseils:      string[]
  alerte?:       string
}

export const INFO_PAYS: Record<Pays, InfoPaysLocation> = {
  FR: { flag: '🇫🇷', nom: 'France',       risques: ['Vandalisme en ville', 'Stationnement complexe'], obligatoire: ['Assurance RC incluse légalement'], conseils: ['Vérifiez les ZFE — loueur doit fournir véhicule éligible', 'Photos obligatoires à la prise en charge'] },
  BE: { flag: '🇧🇪', nom: 'Belgique',      risques: ['Tram prioritaire', 'Parking payant dense'], obligatoire: ['RC obligatoire'], conseils: ['Bruxelles : ZFE active, vignette requise', 'Vitesse 30 km/h en ville par défaut'] },
  CH: { flag: '🇨🇭', nom: 'Suisse',        risques: ['Vignette autoroutière obligatoire', 'Amendes élevées'], obligatoire: ['Vignette autoroutière 40 CHF/an'], conseils: ['Achetez la vignette à la frontière', 'Vitesse limitée : 80 km/h route, 120 km/h autoroute', 'Chaînes à neige conseillées en hiver en montagne'] },
  CA: { flag: '🇨🇦', nom: 'Canada',        risques: ['Grands espaces — panne loin de tout', 'Météo extrême'], obligatoire: ['RC provinciale incluse'], conseils: ['GPS fortement conseillé hors villes', 'Pneus hiver obligatoires au Québec (15 déc–15 mars)', 'Carburant : vérifiez essence vs diesel'] },
  ES: { flag: '🇪🇸', nom: 'Espagne',       risques: ['Radars fréquents', 'Vol dans le véhicule'], obligatoire: ['Gilets jaunes dans la boîte à gants'], conseils: ['Ne laissez rien de visible dans la voiture', 'Péages nombreux sur autopistas', 'Vignette Barcelone (DGT) pour accès centre'], alerte: '🚨 Vols à la roulotte fréquents : ne laissez JAMAIS de bagages visibles, même 5 minutes.' },
  IT: { flag: '🇮🇹', nom: 'Italie',        risques: ['ZTL (zones circulation limitée)', 'Conduite agressive'], obligatoire: ['Vignette ZTL selon ville'], conseils: ['Vérifiez les ZTL AVANT d\'entrer en ville — amendes 80–300 €', 'Rome, Florence, Venise : ZTL très étendues', 'GPS avec ZTL à jour indispensable'], alerte: '🚨 ZTL : les caméras enregistrent votre plaque. L\'amende arrive à votre domicile 2 à 6 mois après.' },
  PT: { flag: '🇵🇹', nom: 'Portugal',      risques: ['Péages automatiques Via Verde', 'Routes étroites'], obligatoire: ['Via Verde ou paiement péage'], conseils: ['Optez pour la Via Verde chez le loueur (sinon amendes)', 'Routes côtières parfois sinueuses', 'Bon rapport qualité/prix global'] },
  DE: { flag: '🇩🇪', nom: 'Allemagne',     risques: ['Autoroute sans limite (stress)', 'Contrôles fréquents'], obligatoire: ['Gilet jaune + triangle'], conseils: ['Restez droite sauf dépassement — tolérance zéro', 'Pneus adaptés à la saison obligatoires', 'Péages : quasi inexistants sauf tunnels'] },
  GB: { flag: '🇬🇧', nom: 'Royaume-Uni',   risques: ['Conduite à gauche', 'Congestion charge Londres'], obligatoire: ['Congestion Charge si centre Londres'], conseils: ['Prenez le temps de vous habituer à gauche avant de démarrer', 'Ronds-points : priorité à gauche', 'Congestion Charge : 15 £/jour si entrée zone centrale'], alerte: '⚠️ Conduite à gauche : les 2 premiers jours sont critiques — évitez les autoroutes.' },
  US: { flag: '🇺🇸', nom: 'États-Unis',    risques: ['CB française non acceptée pour caution', 'Grands espaces'], obligatoire: ['Assurance state minimale'], conseils: ['Utilisez une carte Visa Infinite ou Amex pour la caution', 'Les CB classiques sont souvent refusées comme caution', 'Prenez le LDW chez le loueur si pas de CB premium', 'Plein de carburant : vérifiez unleaded vs diesel'], alerte: '⚠️ La plupart des CB françaises classiques sont refusées comme caution aux US — vérifiez avant de partir.' },
  MA: { flag: '🇲🇦', nom: 'Maroc',         risques: ['État des routes variables', 'Contrôles police'], obligatoire: ['Assurance Maroc (Carte Verte non valide)'], conseils: ['Souscrivez l\'assurance au Maroc séparément', 'Évitez les pistes sans 4x4', 'Permis international conseillé', 'Carburant : disponible mais qualité variable hors villes'], alerte: '⚠️ La Carte Verte européenne n\'est pas valable au Maroc — assurance locale obligatoire.' },
  TN: { flag: '🇹🇳', nom: 'Tunisie',       risques: ['Routes secondaires dégradées', 'Conduite locale imprévisible'], obligatoire: ['Assurance locale obligatoire'], conseils: ['Préférez les loueurs avec assistance 24h', 'Évitez la conduite de nuit hors villes', 'Permis international requis'], alerte: '⚠️ Votre assurance auto européenne ne couvre pas la Tunisie — assurance locale à souscrire obligatoirement.' },
}

// ── Checklist état véhicule ────────────────────────────────────────────────────

export const CHECKLIST_PRISE_EN_CHARGE = [
  { zone: 'Carrosserie avant',  points: ['Pare-chocs : rayures, impacts', 'Capot : bosses, éraflures', 'Rétroviseurs : état, pliage'] },
  { zone: 'Carrosserie latérale', points: ['Portes : rayures bas de caisse', 'Bas de caisse : impacts cailloux', 'Vitres : fissures, éclats'] },
  { zone: 'Carrosserie arrière', points: ['Hayon / coffre : état', 'Pare-chocs arrière : rayures', 'Feux : fissures'] },
  { zone: 'Intérieur',          points: ['Sièges : taches, déchirures', 'Moquette : état général', 'Tableau de bord : rayures, voyants'] },
  { zone: 'Roues & pneus',      points: ['Pneus : usure, flancs (impacts)', 'Jantes : rayures', 'Roue de secours présente ?'] },
  { zone: 'Documents & équipements', points: ['Carte grise présente', 'Gilet jaune + triangle', 'Carte carburant si incluse', 'Niveau carburant noté sur contrat'] },
]

export const CHECKLIST_RESTITUTION = [
  'Photos des 4 côtés AVANT de rendre les clés',
  'Niveau carburant identique à la prise en charge',
  'Intérieur propre (sinon frais nettoyage ~50–150 €)',
  'Tous les documents rendus (carte grise, pass péage)',
  'État des lieux contradictoire signé avec un agent',
  "En cas de dommage contesté : refusez de signer sans réserves — notez 'sous réserve de contrôle' avant de signer",
  'Gardez une copie du contrat et des photos minimum 60 jours',
]

// ── Analyse assurance & recommandation ────────────────────────────────────────

export interface RecommandationAssurance {
  prendreCDW:      boolean
  prendreVol:      boolean
  prendreTP:       boolean   // tiers passager
  coutCDWTotal:    number    // coût CDW sur durée
  economiePossible: number   // si CB couvre
  explication:     string
  alertes:         string[]
}

const JOURS_DUREE: Record<DureeLocation, number> = {
  weekend: 3, semaine: 7, quinzaine: 15, mois: 30,
}

export interface ResultatLocation {
  couvertureCB:     CouvertureCB
  infoPays:         InfoPaysLocation
  recommandation:   RecommandationAssurance
  checklistPrise:   typeof CHECKLIST_PRISE_EN_CHARGE
  checklistRestitution: typeof CHECKLIST_RESTITUTION
  prixCDWTotal:     number
  jours:            number
  alerteAge:        string | null
  alerteConducteurAddl: string | null
}

export function analyserLocation(data: LocationData): ResultatLocation {
  const cb      = COUVERTURE_CB[data.carteBancaire ?? 'aucune']
  const pays    = INFO_PAYS[data.paysLocation ?? 'FR']
  const jours   = JOURS_DUREE[data.duree ?? 'semaine']
  const prixCDWTotal = data.prixCdwJour * jours

  // Logique recommandation CDW
  const paysExcluParCB = cb.paysExclus.includes(data.paysLocation ?? 'FR')
  const cbCouvre = !paysExcluParCB && cb.franchise === 0 && (cb.dureeMax >= jours) && data.carteBancaire !== 'aucune'
  const cbCouvrePArtiellement = !paysExcluParCB && cb.franchise !== null && cb.franchise > 0 && data.carteBancaire !== 'aucune'

  const alertes: string[] = []
  if (paysExcluParCB && data.carteBancaire !== 'aucune') alertes.push(`Votre ${cb.nom} exclut ce pays — CDW obligatoire.`)
  if (cb.dureeMax < jours && data.carteBancaire !== 'aucune') alertes.push(`Votre CB couvre max ${cb.dureeMax} jours — vous êtes au-delà.`)
  if (data.paysLocation === 'US' || data.paysLocation === 'CA') alertes.push('Aux USA/Canada : vérifiez que votre CB est acceptée comme caution avant de partir.')
  if (data.paysLocation === 'MA' || data.paysLocation === 'TN') alertes.push('Assurez-vous d\'avoir une assurance locale — votre couverture européenne ne s\'applique pas.')

  const prendreVol = !cb.rembourseVol || paysExcluParCB
  const prendreTP  = data.typeVehicule === 'luxe' || (data.paysLocation === 'US')

  let prendreCDW = true
  let explication = ''
  let economiePossible = 0

  if (cbCouvre && !paysExcluParCB) {
    prendreCDW = false
    economiePossible = prixCDWTotal
    explication = `Votre ${cb.nom} couvre les dommages collision sans franchise pour ce pays et cette durée. Vous pouvez refuser le CDW et économiser ${prixCDWTotal} €. Payez la location avec cette carte pour activer la garantie.`
  } else if (cbCouvrePArtiellement && !paysExcluParCB) {
    prendreCDW: true
    explication = `Votre ${cb.nom} couvre partiellement (franchise ${cb.franchise} €). Le CDW du loueur rachète cette franchise — à vous de comparer le coût du CDW (${prixCDWTotal} €) avec le risque d'une franchise de ${cb.franchise} €.`
    economiePossible = Math.max(0, prixCDWTotal - (cb.franchise ?? 0) * 0.1)
  } else if (data.assurancePerso) {
    prendreCDW = false
    explication = 'Votre assurance auto personnelle couvre les véhicules de location — vérifiez l\'étendue géographique dans votre contrat avant de refuser le CDW.'
    economiePossible = prixCDWTotal
  } else {
    prendreCDW: true
    explication = `Sans couverture CB ni assurance perso adaptée, prenez le CDW (${prixCDWTotal} € pour votre séjour). C'est le tarif de la tranquillité d'esprit.`
  }

  // Alertes âge
  const alerteAge = data.ageConduc < 25
    ? `Conducteur de ${data.ageConduc} ans — supplément "jeune conducteur" probable (5–15 €/jour). Certains loueurs refusent les moins de 21 ans.`
    : data.ageConduc >= 70
    ? `Conducteur de ${data.ageConduc} ans — certains loueurs imposent une limite d'âge ou un supplément senior. Vérifiez les conditions avant réservation.`
    : null

  const alerteConducteurAddl = data.conducteurAddl
    ? 'Conducteur supplémentaire : déclarez-le OBLIGATOIREMENT au comptoir (5–10 €/jour généralement). Un conducteur non déclaré impliqué dans un accident annule toutes les assurances.'
    : null

  return {
    couvertureCB: cb, infoPays: pays,
    recommandation: { prendreCDW, prendreVol, prendreTP, coutCDWTotal: prixCDWTotal, economiePossible, explication, alertes },
    checklistPrise: CHECKLIST_PRISE_EN_CHARGE,
    checklistRestitution: CHECKLIST_RESTITUTION,
    prixCDWTotal, jours, alerteAge, alerteConducteurAddl,
  }
}

export const LABEL_PAYS: Record<Pays, string> = {
  FR: 'France', BE: 'Belgique', CH: 'Suisse', CA: 'Canada',
  ES: 'Espagne', IT: 'Italie', PT: 'Portugal', DE: 'Allemagne',
  GB: 'Royaume-Uni', US: 'États-Unis', MA: 'Maroc', TN: 'Tunisie',
}

export const LABEL_DUREE: Record<DureeLocation, string> = {
  weekend: 'Week-end (3 jours)', semaine: '1 semaine (7 jours)',
  quinzaine: '2 semaines (15 jours)', mois: '1 mois (30 jours)',
}
