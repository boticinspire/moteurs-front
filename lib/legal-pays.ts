/**
 * Moteurs.com — Données légales par pays européen pour les pages /trajet/[slug]
 *
 * Source : sites gouvernementaux nationaux, mai 2026.
 * Données indicatives — toujours vérifier sur le site officiel du pays
 * avant de partir (un lien est fourni pour chaque pays).
 */

import type { PaysCode } from '@/lib/trajets-seo'

export interface Vitesses {
  ville: number
  route: number
  autoroute: number
  /** Vitesse spécifique sur autoroute par temps de pluie / brouillard (km/h) */
  autoroute_pluie?: number
}

export interface InfoVignette {
  required: boolean
  /** Prix vignette courte (10 jours / 7 jours selon pays) en € */
  prix_courte?: number
  /** Durée de la vignette courte */
  duree_courte?: string
  /** Prix annuel en € */
  prix_annuelle?: number
  /** URL officielle d'achat ou d'info */
  url?: string
  /** Note libre (ex: "vignette électronique depuis 2023") */
  note?: string
}

export interface InfoZFE {
  ville: string
  /** Périmètre ou nom officiel */
  nom: string
  /** Vignette ou autocollant requis */
  vignette_requise?: string
}

export interface InfoPays {
  code: PaysCode
  nom: string
  drapeau: string
  /** Numéro d'urgence unique (généralement 112) */
  urgence: string
  /** Numéro spécifique dépannage autoroute si applicable */
  depannage?: string
  vitesses: Vitesses
  /** Alcoolémie maximale en g/L (≈ ‰) */
  alcool_max: number
  /** Alcoolémie maximale pour jeunes conducteurs si plus stricte */
  alcool_jeune?: number
  vignette: InfoVignette
  /** Équipement obligatoire dans le véhicule */
  equipements: string[]
  /** ZFE / LEZ majeures du pays */
  zfe: InfoZFE[]
  /** Particularités importantes (ferries, tunnels, péages, etc.) */
  particularites: string[]
  /** URL officielle d'information générale (Sécurité Routière, Eurocontrol, etc.) */
  info_officielle_url: string
}

// ─── Catalogue ─────────────────────────────────────────────────────────────────

export const PAYS_LEGAL: Record<PaysCode, InfoPays> = {
  FR: {
    code: 'FR',
    nom: 'France',
    drapeau: '🇫🇷',
    urgence: '112',
    depannage: '112 (ou 0800 100 200 sur autoroute)',
    vitesses: { ville: 50, route: 80, autoroute: 130, autoroute_pluie: 110 },
    alcool_max: 0.5,
    alcool_jeune: 0.2,
    vignette: { required: false },
    equipements: [
      'Gilet jaune (1 par occupant en France)',
      'Triangle de signalisation',
      'Éthylotest non chimique (recommandé, plus obligatoire depuis 2020)',
      'Pneus hiver ou chaînes du 1ᵉʳ nov. au 31 mars en zone "loi Montagne"',
    ],
    zfe: [
      { ville: 'Paris',     nom: 'ZFE-m Métropole du Grand Paris', vignette_requise: 'Crit\'Air' },
      { ville: 'Lyon',      nom: 'ZFE-m Métropole de Lyon',         vignette_requise: 'Crit\'Air' },
      { ville: 'Marseille', nom: 'ZFE-m Aix-Marseille',             vignette_requise: 'Crit\'Air' },
      { ville: 'Toulouse',  nom: 'ZFE-m Toulouse Métropole',        vignette_requise: 'Crit\'Air' },
      { ville: 'Strasbourg', nom: 'ZFE-m Eurométropole',            vignette_requise: 'Crit\'Air' },
      { ville: 'Nice',      nom: 'ZFE-m Métropole Nice Côte d\'Azur', vignette_requise: 'Crit\'Air' },
    ],
    particularites: [
      'Péages denses sur autoroute (≈ 0,10 €/km en moyenne).',
      'Crit\'Air obligatoire pour circuler dans toutes les ZFE-m.',
      'Loi Montagne : équipement hivernal requis en zones définies du 1ᵉʳ nov. au 31 mars.',
    ],
    info_officielle_url: 'https://www.securite-routiere.gouv.fr/',
  },
  BE: {
    code: 'BE',
    nom: 'Belgique',
    drapeau: '🇧🇪',
    urgence: '112',
    vitesses: { ville: 50, route: 90, autoroute: 120 },
    alcool_max: 0.5,
    alcool_jeune: 0.2,
    vignette: { required: false },
    equipements: [
      'Triangle de signalisation',
      'Gilet de sécurité fluorescent (1 minimum)',
      'Trousse de premiers secours (recommandée)',
      'Extincteur (obligatoire pour les véhicules immatriculés en Belgique)',
    ],
    zfe: [
      { ville: 'Bruxelles', nom: 'LEZ Bruxelles-Capitale', vignette_requise: 'Enregistrement plaque' },
      { ville: 'Anvers',    nom: 'LEZ Anvers',             vignette_requise: 'Enregistrement plaque' },
      { ville: 'Gand',      nom: 'LEZ Gand',               vignette_requise: 'Enregistrement plaque' },
    ],
    particularites: [
      'LEZ belges fonctionnent par lecture automatique de plaques : pas de vignette physique, mais enregistrement obligatoire pour les plaques étrangères (gratuit ou ~35 €).',
      'Autoroutes gratuites — pas de péages.',
    ],
    info_officielle_url: 'https://mobilit.belgium.be/',
  },
  NL: {
    code: 'NL',
    nom: 'Pays-Bas',
    drapeau: '🇳🇱',
    urgence: '112',
    vitesses: { ville: 50, route: 80, autoroute: 100 },
    alcool_max: 0.5,
    alcool_jeune: 0.2,
    vignette: { required: false },
    equipements: [
      'Triangle de signalisation (recommandé)',
      'Gilet fluorescent (recommandé)',
    ],
    zfe: [
      { ville: 'Amsterdam', nom: 'Milieuzone Amsterdam' },
      { ville: 'Rotterdam', nom: 'Milieuzone Rotterdam' },
      { ville: 'Utrecht',   nom: 'Milieuzone Utrecht' },
    ],
    particularites: [
      'Vitesse autoroute 100 km/h de 6h à 19h (130 km/h la nuit sur certains tronçons).',
      'Densité record de bornes de recharge (1 borne / 5 km en moyenne).',
      'Pas de péages sur autoroute (sauf tunnels Westerschelde et Kil).',
    ],
    info_officielle_url: 'https://www.government.nl/topics/mobility-public-transport-and-road-safety',
  },
  DE: {
    code: 'DE',
    nom: 'Allemagne',
    drapeau: '🇩🇪',
    urgence: '112',
    depannage: '112',
    vitesses: { ville: 50, route: 100, autoroute: 130 },
    alcool_max: 0.5,
    alcool_jeune: 0.0,
    vignette: { required: false },
    equipements: [
      'Triangle de signalisation',
      'Gilet de sécurité (1 minimum)',
      'Trousse de premiers secours homologuée DIN 13164',
      'Pneus hiver obligatoires "selon conditions météo" (jurisprudence : oct. → mars en pratique)',
    ],
    zfe: [
      { ville: 'Berlin',   nom: 'Umweltzone Berlin',  vignette_requise: 'Umweltplakette verte' },
      { ville: 'Munich',   nom: 'Umweltzone München', vignette_requise: 'Umweltplakette verte' },
      { ville: 'Hambourg', nom: 'Umweltzone Hamburg', vignette_requise: 'Umweltplakette verte' },
      { ville: 'Cologne',  nom: 'Umweltzone Köln',    vignette_requise: 'Umweltplakette verte' },
      { ville: 'Francfort', nom: 'Umweltzone Frankfurt', vignette_requise: 'Umweltplakette verte' },
    ],
    particularites: [
      'Autoroutes en grande partie gratuites pour les voitures (péages camions uniquement).',
      'Limitation à 130 km/h "recommandée" — vitesse libre sur ~70 % du réseau Autobahn.',
      'Umweltplakette verte indispensable pour entrer en ville (~6 € sur place ou en ligne).',
    ],
    info_officielle_url: 'https://www.adac.de/verkehr/recht/',
  },
  IT: {
    code: 'IT',
    nom: 'Italie',
    drapeau: '🇮🇹',
    urgence: '112',
    depannage: '803.116 (ACI)',
    vitesses: { ville: 50, route: 90, autoroute: 130, autoroute_pluie: 110 },
    alcool_max: 0.5,
    alcool_jeune: 0.0,
    vignette: { required: false },
    equipements: [
      'Triangle de signalisation',
      'Gilet fluorescent (obligatoire en cas d\'arrêt sur la chaussée)',
      'Chaînes neige ou pneus hiver du 15 nov. au 15 avr. sur de nombreux axes',
    ],
    zfe: [
      { ville: 'Milan',  nom: 'ZTL Area B / Area C',  vignette_requise: 'Inscription + péage Area C' },
      { ville: 'Rome',   nom: 'ZTL Centro Storico',   vignette_requise: 'Autorisation' },
      { ville: 'Bologne', nom: 'ZTL Bologna',          vignette_requise: 'Autorisation' },
      { ville: 'Florence', nom: 'ZTL Firenze',         vignette_requise: 'Autorisation' },
    ],
    particularites: [
      'Péages denses (≈ 0,07 €/km) — Telepass utile pour les habitués.',
      'ZTL piégeantes : amendes automatiques par caméra, plaques étrangères incluses.',
      'Tunnels alpins payants : Mont-Blanc (~50 € AR), Fréjus (~55 € AR), Grand-Saint-Bernard (~33 €).',
    ],
    info_officielle_url: 'https://www.aci.it/',
  },
  ES: {
    code: 'ES',
    nom: 'Espagne',
    drapeau: '🇪🇸',
    urgence: '112',
    vitesses: { ville: 50, route: 90, autoroute: 120 },
    alcool_max: 0.5,
    alcool_jeune: 0.3,
    vignette: { required: false },
    equipements: [
      'Triangle de signalisation (× 2 pour véhicules immatriculés ES)',
      'Gilet fluorescent (1 minimum, à porter avant de sortir du véhicule)',
      'Roue de secours ou kit anti-crevaison',
    ],
    zfe: [
      { ville: 'Madrid',    nom: 'ZBE Madrid',     vignette_requise: 'Distintivo ambiental DGT' },
      { ville: 'Barcelone', nom: 'ZBE Barcelona',  vignette_requise: 'Distintivo ambiental DGT' },
      { ville: 'Séville',   nom: 'ZBE Sevilla',    vignette_requise: 'Distintivo ambiental DGT' },
    ],
    particularites: [
      'Vitesses urbaines réduites : 30 km/h sur la majorité des rues à voie unique depuis 2021.',
      'Péages quasi gratuits depuis 2020 (autopistas AP-7, AP-2 etc. dépéagées).',
      'Distintivo ambiental DGT requis pour entrer dans les ZBE des grandes villes.',
    ],
    info_officielle_url: 'https://www.dgt.es/',
  },
  PT: {
    code: 'PT',
    nom: 'Portugal',
    drapeau: '🇵🇹',
    urgence: '112',
    vitesses: { ville: 50, route: 90, autoroute: 120 },
    alcool_max: 0.5,
    alcool_jeune: 0.2,
    vignette: { required: false },
    equipements: [
      'Triangle de signalisation',
      'Gilet de sécurité fluorescent (1 minimum, à bord)',
    ],
    zfe: [
      { ville: 'Lisbonne', nom: 'ZER Lisboa' },
    ],
    particularites: [
      'Péages électroniques (Via Verde) sur autoroutes A22 (Algarve) et autres axes : prévoir un boîtier ou s\'enregistrer (EasyToll) à l\'entrée du pays.',
      'Plaque étrangère : système EasyToll (location de transpondeur) ou Toll Card prépayée.',
    ],
    info_officielle_url: 'https://www.portugaltolls.com/',
  },
  CH: {
    code: 'CH',
    nom: 'Suisse',
    drapeau: '🇨🇭',
    urgence: '112',
    depannage: '140 (TCS)',
    vitesses: { ville: 50, route: 80, autoroute: 120 },
    alcool_max: 0.5,
    alcool_jeune: 0.1,
    vignette: {
      required: true,
      prix_annuelle: 40,
      duree_courte: 'aucune — vignette annuelle uniquement',
      url: 'https://www.estv.admin.ch/estv/fr/accueil/redevances/redevances-trafic/redevance-forfaitaire-pour-le-trafic-des-poids-lourds-rpl/vignette-autoroutiere.html',
      note: 'Vignette annuelle 40 CHF (~40 €) — validité du 1ᵉʳ déc. de l\'année précédente au 31 jan. de l\'année suivante. Existe en version e-vignette depuis 2023.',
    },
    equipements: [
      'Triangle de signalisation (obligatoire dans le véhicule)',
      'Gilet de sécurité (recommandé)',
      'Pneus hiver fortement conseillés en hiver (jurisprudence sévère sans)',
    ],
    zfe: [],
    particularites: [
      'Vignette autoroutière obligatoire (40 CHF) — amende 200 CHF + prix vignette si manquante.',
      'Pas de ZFE généralisée, mais accès restreint dans certains centres historiques (Berne, Zurich).',
      'Cols alpins : Saint-Bernard, Simplon, Gothard — souvent payants en tunnel.',
    ],
    info_officielle_url: 'https://www.ch.ch/fr/voiture-et-mobilite/',
  },
  AT: {
    code: 'AT',
    nom: 'Autriche',
    drapeau: '🇦🇹',
    urgence: '112',
    vitesses: { ville: 50, route: 100, autoroute: 130 },
    alcool_max: 0.5,
    alcool_jeune: 0.1,
    vignette: {
      required: true,
      prix_courte: 12.4,
      duree_courte: '10 jours',
      prix_annuelle: 103.8,
      url: 'https://www.asfinag.at/maut-vignette/',
      note: 'Vignette électronique (Digitale Vignette) ou autocollante. Prix 2026 : 10 j = 12,40 €, 2 mois = 31,10 €, annuelle = 103,80 €.',
    },
    equipements: [
      'Triangle de signalisation',
      'Gilet de sécurité fluorescent',
      'Trousse de premiers secours',
      'Pneus hiver du 1ᵉʳ nov. au 15 avr. selon météo',
    ],
    zfe: [
      { ville: 'Vienne',    nom: 'Umweltzone Wien (camions)' },
      { ville: 'Graz',      nom: 'Umweltzone Graz' },
    ],
    particularites: [
      'Vignette obligatoire sur toutes les autoroutes et voies rapides (sauf quelques tronçons frontaliers gratuits près de Salzbourg).',
      'Péages spécifiques sur certains tunnels alpins : Tauern, Karawanken, Felbertauern.',
      'Phares allumés obligatoires en journée (recommandation forte).',
    ],
    info_officielle_url: 'https://www.asfinag.at/',
  },
  SI: {
    code: 'SI',
    nom: 'Slovénie',
    drapeau: '🇸🇮',
    urgence: '112',
    vitesses: { ville: 50, route: 90, autoroute: 130 },
    alcool_max: 0.5,
    alcool_jeune: 0.0,
    vignette: {
      required: true,
      prix_courte: 16,
      duree_courte: '7 jours',
      prix_annuelle: 117.5,
      url: 'https://evinjeta.dars.si/',
      note: 'e-vignette uniquement depuis 2022 (plus d\'autocollant). 7 j = 16 €, mois = 32 €, annuelle = 117,50 €.',
    },
    equipements: [
      'Triangle de signalisation',
      'Gilet fluorescent',
      'Trousse de premiers secours',
      'Ampoules de rechange (recommandé)',
    ],
    zfe: [],
    particularites: [
      'e-vignette obligatoire sur toutes les autoroutes. Amende 300–800 € sans.',
      'Phares allumés obligatoires en permanence (jour et nuit).',
    ],
    info_officielle_url: 'https://www.dars.si/',
  },
  HR: {
    code: 'HR',
    nom: 'Croatie',
    drapeau: '🇭🇷',
    urgence: '112',
    vitesses: { ville: 50, route: 90, autoroute: 130 },
    alcool_max: 0.5,
    alcool_jeune: 0.0,
    vignette: { required: false, note: 'Pas de vignette — péages classiques à la sortie (cash, carte ou ENC).' },
    equipements: [
      'Triangle de signalisation (× 2 si remorque)',
      'Gilet fluorescent',
      'Trousse de premiers secours',
      'Ampoules de rechange',
    ],
    zfe: [],
    particularites: [
      'Péages classiques avec ticket à l\'entrée et paiement à la sortie (~30 € pour Zagreb → Split).',
      'Phares allumés obligatoires du 1ᵉʳ nov. au 31 mars.',
      'Pneus hiver obligatoires du 15 nov. au 15 avr.',
    ],
    info_officielle_url: 'https://www.hac.hr/',
  },
  GR: {
    code: 'GR',
    nom: 'Grèce',
    drapeau: '🇬🇷',
    urgence: '112',
    vitesses: { ville: 50, route: 90, autoroute: 130 },
    alcool_max: 0.5,
    alcool_jeune: 0.2,
    vignette: { required: false },
    equipements: [
      'Triangle de signalisation',
      'Trousse de premiers secours',
      'Extincteur (recommandé)',
      'Gilet fluorescent',
    ],
    zfe: [
      { ville: 'Athènes', nom: 'Daktilios Athina (centre)' },
    ],
    particularites: [
      'Péages classiques sur l\'autoroute Egnatia et Patras-Athènes-Thessalonique.',
      'Ferries depuis l\'Italie (Ancône, Bari, Brindisi) → Patras, Igoumenitsa : à réserver tôt en juillet/août.',
    ],
    info_officielle_url: 'https://www.olympiaodos.gr/',
  },
  DK: {
    code: 'DK',
    nom: 'Danemark',
    drapeau: '🇩🇰',
    urgence: '112',
    vitesses: { ville: 50, route: 80, autoroute: 130 },
    alcool_max: 0.5,
    alcool_jeune: 0.5,
    vignette: { required: false },
    equipements: [
      'Triangle de signalisation',
      'Gilet fluorescent (recommandé)',
    ],
    zfe: [
      { ville: 'Copenhague', nom: 'Miljøzone København', vignette_requise: 'Miljøzonemærke (diesel uniquement)' },
      { ville: 'Aarhus',     nom: 'Miljøzone Aarhus',     vignette_requise: 'Miljøzonemærke (diesel)' },
      { ville: 'Odense',     nom: 'Miljøzone Odense',     vignette_requise: 'Miljøzonemærke (diesel)' },
    ],
    particularites: [
      'Ponts payants : Storebæltsbro (Funen-Sjælland, ~35 €), Øresundsbron (DK-SE, ~55 €).',
      'Phares allumés obligatoires en permanence.',
      'Miljøzone : vise les diesels — peu d\'impact pour les véhicules essence/élec.',
    ],
    info_officielle_url: 'https://www.faerdselsstyrelsen.dk/',
  },
  SE: {
    code: 'SE',
    nom: 'Suède',
    drapeau: '🇸🇪',
    urgence: '112',
    vitesses: { ville: 50, route: 90, autoroute: 110 },
    alcool_max: 0.2,
    vignette: { required: false },
    equipements: [
      'Gilet fluorescent (recommandé)',
      'Triangle de signalisation',
      'Pneus hiver obligatoires du 1ᵉʳ déc. au 31 mars',
    ],
    zfe: [
      { ville: 'Stockholm', nom: 'Miljözon Stockholm' },
      { ville: 'Göteborg',  nom: 'Miljözon Göteborg' },
      { ville: 'Malmö',     nom: 'Miljözon Malmö' },
    ],
    particularites: [
      'Alcoolémie 0,2 g/L — la plus stricte d\'Europe.',
      'Pont d\'Øresund vers le Danemark : ~55 €.',
      'Péages urbains à Stockholm et Göteborg (heures de pointe).',
      'Phares allumés en permanence obligatoires.',
    ],
    info_officielle_url: 'https://www.transportstyrelsen.se/',
  },
  NO: {
    code: 'NO',
    nom: 'Norvège',
    drapeau: '🇳🇴',
    urgence: '112',
    vitesses: { ville: 50, route: 80, autoroute: 110 },
    alcool_max: 0.2,
    vignette: { required: false, note: 'Pas de vignette, mais péages électroniques (AutoPASS) automatiques par caméra — facturés à l\'étranger via Epass24.' },
    equipements: [
      'Gilet fluorescent (1 par occupant)',
      'Triangle de signalisation',
      'Pneus hiver / clous du 1ᵉʳ nov. au 15 avr. selon région',
    ],
    zfe: [
      { ville: 'Oslo',      nom: 'Miljøsone Oslo',     vignette_requise: 'Péage haut pour diesel ancien' },
      { ville: 'Bergen',    nom: 'Miljøsone Bergen' },
      { ville: 'Trondheim', nom: 'Miljøsone Trondheim' },
    ],
    particularites: [
      'AutoPASS : péages électroniques omniprésents (~50 portiques entre Oslo et Bergen, ~100 NOK total).',
      'Densité record de bornes de recharge — un VE est probablement le bon choix.',
      'Réservation obligatoire sur de nombreux ferries en été.',
      'Limitation à 80 km/h très majoritaire (pas d\'autoroute "rapide" comme en DE).',
    ],
    info_officielle_url: 'https://www.autopass.no/',
  },
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function getPaysInfo(code: PaysCode): InfoPays {
  return PAYS_LEGAL[code]
}

/** Coût total des vignettes pour les pays traversés (en €). */
export function coutVignettesTrajet(paysTraverses: PaysCode[]): number {
  return paysTraverses.reduce((sum, code) => {
    const p = PAYS_LEGAL[code]
    if (!p.vignette.required) return sum
    return sum + (p.vignette.prix_courte ?? p.vignette.prix_annuelle ?? 0)
  }, 0)
}

/** Liste des pays imposant une vignette parmi ceux traversés. */
export function paysAvecVignette(paysTraverses: PaysCode[]): InfoPays[] {
  return paysTraverses.map(c => PAYS_LEGAL[c]).filter(p => p.vignette.required)
}
