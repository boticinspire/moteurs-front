// lib/assistance-achat.ts
// Moteur de recommandation — Assistance Achat VE / Auto

export type Pays       = 'FR' | 'BE' | 'CH' | 'CA'
export type Usage      = 'urbain' | 'mixte' | 'routier' | 'utilitaire'
export type Segment    = 'citadine' | 'berline' | 'suv' | 'utilitaire'
export type Motorisation = 'elec' | 'hybride' | 'essence' | 'diesel' | 'phev'
export type TypeAchat  = 'neuf' | 'occasion' | 'indifferent'

export interface AchatData {
  budget:     number       // €/CHF/CAD
  pays:       Pays | null
  typeAchat:  TypeAchat | null
  usage:      Usage | null
  segment:    Segment | null
  kmAn:       number
  recharge:   boolean      // accès à une borne domicile
}

// ── Modèles recommandés ───────────────────────────────────────────────────────

export interface ModeleAuto {
  nom:          string
  motorisation: Motorisation
  prix:         number        // prix neuf indicatif (€/CHF/CAD selon pays)
  prixOcc:      number | null // prix occasion indicatif
  autonomie:    number | null // km WLTP (VE/PHEV)
  conso:        string        // ex: "5.5 L/100km" ou "17 kWh/100km"
  forces:       string[]
  segment:      Segment
  href:         string        // lien constructeur ou comparateur
}

const MODELES: ModeleAuto[] = [
  // ── Citadines électriques ──
  { nom: 'Dacia Spring', motorisation: 'elec', prix: 16990, prixOcc: 10500, autonomie: 220, conso: '13.9 kWh/100km', forces: ['Prix le plus bas du marché', 'Faible coût recharge', 'Idéal ville'], segment: 'citadine', href: 'https://www.dacia.fr/spring' },
  { nom: 'Citroën ë-C3', motorisation: 'elec', prix: 23300, prixOcc: null, autonomie: 320, conso: '14.8 kWh/100km', forces: ['Confort classe supérieure', 'Longue autonomie pour citadine', 'Éligible bonus FR'], segment: 'citadine', href: 'https://www.citroen.fr' },
  { nom: 'Renault 5 E-Tech', motorisation: 'elec', prix: 24900, prixOcc: null, autonomie: 410, conso: '12.6 kWh/100km', forces: ['Design iconique', 'Excellente efficience', 'V2G possible'], segment: 'citadine', href: 'https://www.renault.fr' },

  // ── Citadines essence ──
  { nom: 'Renault Clio', motorisation: 'essence', prix: 17800, prixOcc: 9500, autonomie: null, conso: '5.3 L/100km', forces: ['Prix attractif', 'Large réseau SAV', 'Fiabilité prouvée'], segment: 'citadine', href: 'https://www.renault.fr' },
  { nom: 'Peugeot 208', motorisation: 'essence', prix: 18500, prixOcc: 10000, autonomie: null, conso: '5.1 L/100km', forces: ['Coffre généreux', 'Finitions soignées', 'Disponible en VE'], segment: 'citadine', href: 'https://www.peugeot.fr' },

  // ── Berlines électriques ──
  { nom: 'Tesla Model 3', motorisation: 'elec', prix: 41990, prixOcc: 28000, autonomie: 629, conso: '14.9 kWh/100km', forces: ['Autonomie record', 'Superchargeurs rapides', 'OTA updates'], segment: 'berline', href: 'https://www.tesla.com/fr_fr/model3' },
  { nom: 'Renault Mégane E-Tech', motorisation: 'elec', prix: 35000, prixOcc: 22000, autonomie: 470, conso: '16.1 kWh/100km', forces: ['Intérieur premium', 'Éligible bonus FR', 'Charge rapide 130 kW'], segment: 'berline', href: 'https://www.renault.fr' },
  { nom: 'Peugeot e-308', motorisation: 'elec', prix: 40000, prixOcc: null, autonomie: 418, conso: '16.5 kWh/100km', forces: ['Coffre 548 L', 'i-Cockpit', 'Confort autoroute'], segment: 'berline', href: 'https://www.peugeot.fr' },
  { nom: 'BMW i4', motorisation: 'elec', prix: 57000, prixOcc: 38000, autonomie: 590, conso: '16.6 kWh/100km', forces: ['Plaisir de conduite', 'Charge 205 kW', 'Finition premium'], segment: 'berline', href: 'https://www.bmw.fr' },

  // ── Berlines hybrides ──
  { nom: 'Toyota Camry Hybrid', motorisation: 'hybride', prix: 42500, prixOcc: 27000, autonomie: null, conso: '4.6 L/100km', forces: ['Fiabilité légendaire', 'Sans recharge requise', 'Idéal autoroute'], segment: 'berline', href: 'https://www.toyota.fr' },
  { nom: 'Toyota Yaris Cross', motorisation: 'hybride', prix: 29500, prixOcc: 20000, autonomie: null, conso: '4.8 L/100km', forces: ['Conso mixte excellente', 'Pas de prise requise', 'Coffre SUV compact'], segment: 'berline', href: 'https://www.toyota.fr' },

  // ── Berlines diesel ──
  { nom: 'Volkswagen Passat TDI', motorisation: 'diesel', prix: 46000, prixOcc: 28000, autonomie: null, conso: '4.5 L/100km', forces: ['Long rayon d\'action', 'Coffre 650 L', 'Idéal grands voyageurs'], segment: 'berline', href: 'https://www.volkswagen.fr' },
  { nom: 'Peugeot 508 BlueHDi', motorisation: 'diesel', prix: 42000, prixOcc: 25000, autonomie: null, conso: '4.2 L/100km', forces: ['Faible conso longue distance', 'Confort premium', 'Coffre spacieux'], segment: 'berline', href: 'https://www.peugeot.fr' },

  // ── SUV électriques ──
  { nom: 'Tesla Model Y', motorisation: 'elec', prix: 44990, prixOcc: 30000, autonomie: 568, conso: '16.9 kWh/100km', forces: ['SUV le plus vendu en Europe', 'Superchargeurs', 'Coffre 854 L'], segment: 'suv', href: 'https://www.tesla.com/fr_fr/modely' },
  { nom: 'Hyundai Ioniq 5', motorisation: 'elec', prix: 46000, prixOcc: 31000, autonomie: 507, conso: '17.2 kWh/100km', forces: ['Charge ultra-rapide 800V', 'V2L intégré', 'Espace intérieur'], segment: 'suv', href: 'https://www.hyundai.com/fr' },
  { nom: 'Peugeot e-2008', motorisation: 'elec', prix: 36500, prixOcc: 22000, autonomie: 406, conso: '15.6 kWh/100km', forces: ['Gabarit urbain', 'Éligible bonus FR', 'i-Cockpit'], segment: 'suv', href: 'https://www.peugeot.fr' },
  { nom: 'Skoda Enyaq', motorisation: 'elec', prix: 40000, prixOcc: 26000, autonomie: 545, conso: '16.6 kWh/100km', forces: ['Coffre 585 L', 'Rapport qualité/prix', 'Charge 135 kW'], segment: 'suv', href: 'https://www.skoda-auto.fr' },

  // ── SUV PHEV ──
  { nom: 'Peugeot 3008 PHEV', motorisation: 'phev', prix: 47000, prixOcc: 28000, autonomie: 55, conso: '1.2 L/100km (cycle chargé)', forces: ['Zéro émission en ville', 'Long rayon d\'action thermique', 'Bonus PHEV BE/FR'], segment: 'suv', href: 'https://www.peugeot.fr' },
  { nom: 'Volkswagen Tiguan eHybrid', motorisation: 'phev', prix: 52000, prixOcc: 32000, autonomie: 65, conso: '1.4 L/100km (cycle chargé)', forces: ['ZFE passable en VE', 'Grande habitabilité', 'Confort autoroute'], segment: 'suv', href: 'https://www.volkswagen.fr' },

  // ── SUV hybrides ──
  { nom: 'Toyota RAV4 Hybrid', motorisation: 'hybride', prix: 43000, prixOcc: 29000, autonomie: null, conso: '5.1 L/100km', forces: ['Sans recharge requise', 'Traction intégrale possible', 'Fiabilité top'], segment: 'suv', href: 'https://www.toyota.fr' },

  // ── SUV diesel ──
  { nom: 'Ford Kuga TDCi', motorisation: 'diesel', prix: 38000, prixOcc: 22000, autonomie: null, conso: '5.2 L/100km', forces: ['Grand coffre', 'Bon TCO longue distance', 'Confort famille'], segment: 'suv', href: 'https://www.ford.fr' },

  // ── Utilitaires électriques ──
  { nom: 'Renault Kangoo E-Tech', motorisation: 'elec', prix: 37900, prixOcc: 25000, autonomie: 300, conso: '20 kWh/100km', forces: ['Plancher plat', 'Éligible ADVENIR Pro', 'Charge 80 kW'], segment: 'utilitaire', href: 'https://www.renault.fr' },
  { nom: 'Stellantis e-Dispatch', motorisation: 'elec', prix: 43000, prixOcc: 28000, autonomie: 330, conso: '22 kWh/100km', forces: ['Grand volume', 'ZFE illimité', 'Bonus VUL FR'], segment: 'utilitaire', href: 'https://www.citroen.fr' },
  { nom: 'Ford E-Transit Custom', motorisation: 'elec', prix: 48000, prixOcc: null, autonomie: 380, conso: '23 kWh/100km', forces: ['Volume pro', 'ProPower Onboard', 'Réseau SAV FR'], segment: 'utilitaire', href: 'https://www.ford.fr' },

  // ── Utilitaires diesel ──
  { nom: 'Renault Kangoo dCi', motorisation: 'diesel', prix: 26000, prixOcc: 14000, autonomie: null, conso: '5.5 L/100km', forces: ['Faible coût initial', 'Long rayon d\'action', 'Fiabilité artisans'], segment: 'utilitaire', href: 'https://www.renault.fr' },
  { nom: 'Volkswagen Transporter TDI', motorisation: 'diesel', prix: 43000, prixOcc: 25000, autonomie: null, conso: '7.5 L/100km', forces: ['Réputation professionnelle', 'Charge utile élevée', 'Réseau SAV étendu'], segment: 'utilitaire', href: 'https://www.volkswagen.fr' },
]

// ── Aides par pays ────────────────────────────────────────────────────────────

export interface AideAchat {
  nom:    string
  montant: string
  condition: string
  href:   string
}

export const AIDES_ACHAT: Record<Pays, AideAchat[]> = {
  FR: [
    { nom: 'Bonus écologique',      montant: 'jusqu\'à 4 000 €', condition: 'VE neuf, revenu fiscal ≤ 50 k€/an', href: 'https://www.gouvernement.fr/bonus-ecologique' },
    { nom: 'Prime à la conversion', montant: 'jusqu\'à 5 000 €', condition: 'Mise à la casse d\'un vieux thermique', href: 'https://www.primealaconversion.gouv.fr' },
    { nom: 'Leasing social VE',     montant: '100 €/mois',       condition: 'Revenus modestes, trajet domicile-travail > 15 km', href: 'https://www.leasingsocial.gouv.fr' },
    { nom: 'TVA récupérable (pro)', montant: '20% du prix',      condition: 'Véhicule utilitaire pour activité pro', href: 'https://www.impots.gouv.fr' },
  ],
  BE: [
    { nom: 'Déduction fiscale pro', montant: '100% jusqu\'à fin 2026', condition: 'VE pour activité professionnelle, véhicule neuf', href: 'https://finances.belgium.be' },
    { nom: 'Prime Wallonie VE',     montant: '4 000 €',          condition: 'VE neuf, résidant en Wallonie', href: 'https://www.wallonie.be' },
    { nom: 'Prime Bruxelles',       montant: '5 000 € max',      condition: 'VE neuf, résidant à Bruxelles', href: 'https://be.brussels' },
    { nom: 'TVA 21% récupérable',   montant: 'TVA complète',     condition: 'Usage professionnel > 50%', href: 'https://finances.belgium.be' },
  ],
  CH: [
    { nom: 'Déduction cantonale',   montant: '1 000–5 000 CHF',  condition: 'Variable selon canton (GE, VD, ZH favorables)', href: 'https://energieschweiz.ch' },
    { nom: 'Pas de TVA auto',       montant: 'TVA 8.1%',         condition: 'Tarif uniforme, moins avantageux que UE', href: 'https://www.estv.admin.ch' },
    { nom: 'Vignette ZFE Genève',   montant: 'Accès gratuit',    condition: 'VE exempté vignette environnementale Genève', href: 'https://www.ge.ch' },
  ],
  CA: [
    { nom: 'Programme iZEV fédéral', montant: 'jusqu\'à 5 000 CAD', condition: 'VE ou PHEV neuf, prix < 55 000 CAD', href: 'https://www.nrcan.gc.ca' },
    { nom: 'Rabais Québec',          montant: 'jusqu\'à 8 000 CAD', condition: 'VE neuf résidant Québec', href: 'https://www.roulezvert.gouv.qc.ca' },
    { nom: 'Rabais Ontario',         montant: 'jusqu\'à 5 000 CAD', condition: 'VE neuf résidant Ontario (selon budget provincial)', href: 'https://www.ontario.ca' },
    { nom: 'Crédit TPS/TVH',         montant: 'Exonération partielle', condition: 'Selon province et type de véhicule', href: 'https://www.canada.ca' },
  ],
}

// ── Scoring de compatibilité motorisation ─────────────────────────────────────

interface Criteres {
  usage:    Usage
  kmAn:    number
  recharge: boolean
  budget:   number
  segment:  Segment
}

function scoreMotorisation(moto: Motorisation, c: Criteres): number {
  let score = 0

  // Recharge domicile
  if (moto === 'elec') {
    score += c.recharge ? 30 : -15
    if (c.kmAn < 25000) score += 15
    if (c.usage === 'urbain') score += 20
    if (c.usage === 'routier' && c.kmAn > 30000) score -= 10
  }

  if (moto === 'phev') {
    score += c.recharge ? 15 : -5
    if (c.usage === 'mixte') score += 20
    if (c.usage === 'urbain') score += 10
  }

  if (moto === 'hybride') {
    score += 10
    if (!c.recharge) score += 10
    if (c.usage === 'routier') score += 10
    if (c.kmAn > 20000) score += 10
  }

  if (moto === 'diesel') {
    if (c.kmAn > 25000) score += 20
    if (c.usage === 'routier') score += 20
    if (c.usage === 'urbain') score -= 15
  }

  if (moto === 'essence') {
    score += 5
    if (c.kmAn < 15000) score += 10
    if (c.usage === 'urbain') score += 5
  }

  return score
}

// ── Recommandation principale ─────────────────────────────────────────────────

export interface RecommandationMotorisation {
  motorisation:  Motorisation
  score:         number
  verdict:       string
  pourquoi:      string[]
  vigilance:     string | null
  emoji:         string
}

export interface ResultatAchat {
  recommandations: RecommandationMotorisation[]  // triées score décroissant
  modeles:         ModeleAuto[]                   // filtrés budget + segment + top 2 motos
  aides:           AideAchat[]
  budgetApresAide: number
  devise:          string
}

const DEVISE: Record<Pays, string> = { FR: '€', BE: '€', CH: 'CHF', CA: 'CAD' }

function labelMoto(m: Motorisation): string {
  return { elec: 'Électrique', hybride: 'Hybride HEV', essence: 'Essence', diesel: 'Diesel', phev: 'PHEV (hybride rechargeable)' }[m]
}
function emojiMoto(m: Motorisation): string {
  return { elec: '⚡', hybride: '🔄', essence: '⛽', diesel: '🛢️', phev: '🔌' }[m]
}

export function recommander(data: AchatData): ResultatAchat {
  const p  = data.pays      ?? 'FR'
  const u  = data.usage     ?? 'mixte'
  const s  = data.segment   ?? 'berline'
  const km = data.kmAn
  const bgt = data.budget
  const recharge = data.recharge

  const devise = DEVISE[p]
  const criteres: Criteres = { usage: u, kmAn: km, recharge, budget: bgt, segment: s }

  // Score toutes motorisations
  const motos: Motorisation[] = ['elec', 'phev', 'hybride', 'essence', 'diesel']
  const recommandations: RecommandationMotorisation[] = motos
    .map(m => {
      const score = scoreMotorisation(m, criteres)
      const pourquoi: string[] = []
      let vigilance: string | null = null
      let verdict = ''

      if (m === 'elec') {
        if (recharge) pourquoi.push('Borne à domicile = recharge bon marché (~0.25 €/kWh)')
        else          pourquoi.push('Sans borne à domicile, coût réseau public plus élevé')
        if (km < 20000) pourquoi.push(`${km.toLocaleString()} km/an : usage modéré, idéal pour VE`)
        if (km > 30000) { pourquoi.push('Long kilométrage : autonomie à vérifier soigneusement'); vigilance = 'Préférez une grande batterie (> 75 kWh) pour ce kilométrage.' }
        if (u === 'urbain') pourquoi.push('Trafic urbain : VE ≈ 0 frein, 0 embrayage, régénératif')
        verdict = score >= 30 ? 'Motorisation idéale pour votre profil' : score >= 10 ? 'Bonne option si borne disponible' : 'À envisager sous conditions'
      }

      if (m === 'phev') {
        pourquoi.push('Idéal si usage mixte : ville en électrique, route en thermique')
        if (!recharge) { vigilance = 'Sans recharge régulière, le PHEV consomme comme un thermique classique.'; pourquoi.push('⚠️ Recharge indispensable pour profiter du mode électrique') }
        else pourquoi.push('Borne à domicile = 50-80 km quotidiens gratuits')
        verdict = 'Compromis si sans borne à domicile'
      }

      if (m === 'hybride') {
        pourquoi.push('Pas de prise requise — recharge automatique à la décélération')
        if (km > 20000) pourquoi.push(`${km.toLocaleString()} km/an : les hybrides brillent sur cet usage`)
        if (u === 'routier') pourquoi.push('Excellente conso autoroute grâce au moteur thermique')
        verdict = recharge ? 'Alternative si budget VE hors de portée' : 'Choix pragmatique sans contrainte de recharge'
      }

      if (m === 'diesel') {
        if (km > 25000) pourquoi.push(`${km.toLocaleString()} km/an : diesel amorti par la faible conso`)
        if (u === 'urbain') { vigilance = 'Le diesel en ville coûte cher en DPF et ZFE. Évitez si usage principalement urbain.'; pourquoi.push('⚠️ ZFE en expansion — vérifiez votre accès') }
        pourquoi.push('Large rayon d\'action, faible coût à la pompe longue distance')
        verdict = km > 25000 && u !== 'urbain' ? 'Pertinent pour grand routier uniquement' : 'À éviter sauf usage exclusivement routier'
      }

      if (m === 'essence') {
        pourquoi.push('Flexibilité totale, réseau de stations complet')
        if (km < 15000) pourquoi.push(`${km.toLocaleString()} km/an : faible kilométrage, essence économique`)
        verdict = 'Solution polyvalente sans contrainte'
      }

      return { motorisation: m, score, verdict, pourquoi, vigilance, emoji: emojiMoto(m) }
    })
    .sort((a, b) => b.score - a.score)

  // Modèles filtrés : segment + budget + top 2 motorisations
  const top2Motos = recommandations.slice(0, 2).map(r => r.motorisation)
  const modelesFiltres = MODELES
    .filter(m => {
      if (m.segment !== s) return false
      const prixRef = data.typeAchat === 'occasion' && m.prixOcc !== null ? m.prixOcc : m.prix
      return prixRef <= bgt * 1.15  // marge 15% (négociation / promo)
    })
    .filter(m => top2Motos.includes(m.motorisation))
    .sort((a, b) => {
      // priorise les top motorisations puis trie par prix croissant
      const ia = top2Motos.indexOf(a.motorisation)
      const ib = top2Motos.indexOf(b.motorisation)
      if (ia !== ib) return ia - ib
      return a.prix - b.prix
    })
    .slice(0, 6)

  // Si pas assez de modèles dans le budget, élargir à toutes motorisations
  const modelesFinal = modelesFiltres.length < 2
    ? MODELES
        .filter(m => m.segment === s && (data.typeAchat === 'occasion' && m.prixOcc !== null ? m.prixOcc : m.prix) <= bgt * 1.2)
        .sort((a, b) => a.prix - b.prix)
        .slice(0, 5)
    : modelesFiltres

  // Aides
  const aides = AIDES_ACHAT[p]
  const aideMax = p === 'FR' ? 7000 : p === 'BE' ? 5000 : p === 'CH' ? 3000 : 8000
  const budgetApresAide = Math.max(0, bgt + aideMax)

  return { recommandations, modeles: modelesFinal, aides, budgetApresAide, devise }
}

export function labelSegment(s: Segment): string {
  return { citadine: 'Citadine', berline: 'Berline / Compacte', suv: 'SUV / Crossover', utilitaire: 'Véhicule utilitaire léger' }[s]
}

export function labelMotorisationPublic(m: Motorisation): string {
  return { elec: '⚡ Électrique', hybride: '🔄 Hybride HEV', essence: '⛽ Essence', diesel: '🛢️ Diesel', phev: '🔌 PHEV' }[m]
}
