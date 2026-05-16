// lib/assistance-panne.ts
// Guide d'urgence interactif — Assistance Panne

export type Motorisation = 'thermique' | 've' | 'hybride' | 'phev'
export type Pays         = 'FR' | 'BE' | 'CH' | 'CA'
export type Lieu         = 'autoroute' | 'ville' | 'parking' | 'route'
export type TypePanne    = 'energie' | 'crevaison' | 'mecanique' | 'accident' | 'batterie12v' | 'surchauffe' | 'autre'

export interface PanneData {
  motorisation: Motorisation | null
  pays:         Pays | null
  lieu:         Lieu | null
  typePanne:    TypePanne | null
}

// ── Contacts urgence par pays ──────────────────────────────────────────────────

export interface ContactUrgence {
  nom:     string
  numero:  string
  detail:  string
  gratuit: boolean
}

export const CONTACTS_PAR_PAYS: Record<Pays, ContactUrgence[]> = {
  FR: [
    { nom: 'SAMU (urgences médicales)', numero: '15',   detail: 'Blessés, malaise — priorité absolue', gratuit: true },
    { nom: 'Police / Gendarmerie',      numero: '17',   detail: 'Accident, danger, sécurisation', gratuit: true },
    { nom: 'Pompiers',                  numero: '18',   detail: 'Feu, accident grave, extraction', gratuit: true },
    { nom: 'Numéro d\'urgence européen',numero: '112',  detail: 'Fonctionne dans toute l\'Europe', gratuit: true },
    { nom: 'Autoroutes (SOS autoroute)',numero: 'Borne SOS orange', detail: 'Tous les 2 km sur autoroute — relie la gendarmerie et le dépanneur agréé', gratuit: true },
    { nom: 'AXA Assistance',            numero: '01 55 92 27 27', detail: 'Si couvert — vérifiez votre contrat', gratuit: false },
    { nom: 'Allianz Assistance',        numero: '01 41 85 85 85', detail: 'Si couvert — vérifiez votre contrat', gratuit: false },
  ],
  BE: [
    { nom: 'Urgences (police/médecin)', numero: '112',  detail: 'Numéro unique européen', gratuit: true },
    { nom: 'Police',                    numero: '101',  detail: 'Accident, sécurisation', gratuit: true },
    { nom: 'Touring Assistance',        numero: '0800 60 800', detail: 'Assistance routière — membres Touring', gratuit: false },
    { nom: 'VAB Assistance',            numero: '0800 81 818', detail: 'Assistance VAB — membres VAB', gratuit: false },
    { nom: 'Europ Assistance BE',       numero: '02 533 75 75', detail: 'Si couvert — vérifiez votre contrat', gratuit: false },
  ],
  CH: [
    { nom: 'Police / Urgences',         numero: '117',  detail: 'Police cantonale', gratuit: true },
    { nom: 'Ambulance',                 numero: '144',  detail: 'Urgences médicales', gratuit: true },
    { nom: 'Pompiers',                  numero: '118',  detail: 'Feu, accident', gratuit: true },
    { nom: 'TCS Assistance',            numero: '0800 140 140', detail: 'Touring Club Suisse — membres TCS', gratuit: false },
    { nom: 'ACS Assistance',            numero: '0800 055 055', detail: 'Automobile Club Suisse', gratuit: false },
    { nom: 'Numéro européen',           numero: '112',  detail: 'Fonctionne aussi en Suisse', gratuit: true },
  ],
  CA: [
    { nom: 'Urgences (911)',            numero: '911',  detail: 'Police, pompiers, ambulance', gratuit: true },
    { nom: 'CAA Québec',               numero: '1-800-222-4357', detail: 'Assistance CAA — membres', gratuit: false },
    { nom: 'CAA Ontario',              numero: '1-800-222-4357', detail: 'Assistance CAA — membres', gratuit: false },
    { nom: 'AMA (Alberta)',            numero: '1-800-222-4357', detail: 'Alberta Motor Association', gratuit: false },
    { nom: 'Allstate Roadside',        numero: '1-800-726-6033', detail: 'Si couvert — vérifiez votre contrat', gratuit: false },
  ],
}

// ── Protocoles par type de panne ──────────────────────────────────────────────

export interface EtapeProtocole {
  ordre:   number
  texte:   string
  urgent:  boolean
  veOnly?: boolean   // uniquement VE
  nonVe?:  boolean   // thermique/hybride uniquement
}

export interface Protocole {
  titre:         string
  emoji:         string
  danger:        'faible' | 'moyen' | 'eleve'
  resume:        string
  etapes:        EtapeProtocole[]
  alerteVE?:     string   // avertissement spécifique VE
  conseilPro:    string
}

export const PROTOCOLES: Record<TypePanne, Protocole> = {
  energie: {
    titre:   'Panne d\'énergie (carburant vide / batterie à 0)',
    emoji:   '⚡',
    danger:  'moyen',
    resume:  'Immobilisation imminente — agissez dès que possible avant l\'arrêt complet.',
    etapes: [
      { ordre: 1, texte: 'Activez immédiatement les feux de détresse.', urgent: true },
      { ordre: 2, texte: 'Quittez la voie de circulation et gagnez la voie d\'arrêt d\'urgence (VAU) ou une aire de repos.', urgent: true },
      { ordre: 3, texte: 'Serrez le frein à main, moteur coupé.', urgent: false },
      { ordre: 4, texte: 'Enfilez votre gilet jaune AVANT de sortir du véhicule — obligation légale en France, Belgique et Suisse.', urgent: true },
      { ordre: 5, texte: 'Sortez du véhicule par le côté passager (jamais côté circulation). Éloignez-vous derrière la glissière.', urgent: true },
      { ordre: 6, texte: 'Posez le triangle de signalisation à au moins 30 m derrière le véhicule (100 m sur autoroute).', urgent: false },
      { ordre: 7, texte: 'Sur autoroute : utilisez la borne SOS orange ou appelez le 15/17/112.', urgent: false },
      { ordre: 8, texte: 'NE remorquez JAMAIS un VE avec les roues motrices au sol — commandez une dépanneuse à plateau.', urgent: false, veOnly: true },
      { ordre: 9, texte: 'Pour un thermique : contactez votre assistance ou faites livrer du carburant.', urgent: false, nonVe: true },
    ],
    alerteVE: 'Un VE à 0% ne peut pas être remorqué normalement. Le remorquage roues levées endommagera irrémédiablement la boîte de réduction. Exigez impérativement une dépanneuse à plateau.',
    conseilPro: 'Appelez votre assistance routière ou la borne SOS — ne tentez pas de traverser la chaussée.',
  },

  crevaison: {
    titre:   'Crevaison / pneu crevé',
    emoji:   '🔧',
    danger:  'moyen',
    resume:  'Réduisez immédiatement la vitesse et immobilisez-vous en sécurité.',
    etapes: [
      { ordre: 1, texte: 'Ne freinez pas brusquement — lâchez l\'accélérateur progressivement.', urgent: true },
      { ordre: 2, texte: 'Activez les feux de détresse et guidez le véhicule vers l\'accotement ou la VAU.', urgent: true },
      { ordre: 3, texte: 'Enfilez votre gilet jaune AVANT de sortir du véhicule — obligation légale.', urgent: true },
      { ordre: 4, texte: 'Sortez par le côté passager — jamais côté circulation.', urgent: true },
      { ordre: 5, texte: 'Posez le triangle de signalisation (30 m minimum, 100 m sur autoroute).', urgent: false },
      { ordre: 6, texte: 'Si vous avez une roue de secours et êtes en sécurité totale : changez le pneu. Sinon, appelez l\'assistance.', urgent: false },
      { ordre: 7, texte: 'Attention : de nombreux VE n\'ont pas de roue de secours — kit anti-crevaison ou assistance uniquement.', urgent: false, veOnly: true },
      { ordre: 8, texte: 'Serrez les boulons en étoile, vérifiez la pression avant de reprendre la route.', urgent: false, nonVe: true },
    ],
    conseilPro: 'Sur autoroute, ne changez jamais un pneu — appelez l\'assistance et restez derrière la glissière.',
  },

  mecanique: {
    titre:   'Panne mécanique (moteur, boîte, direction)',
    emoji:   '⚙️',
    danger:  'moyen',
    resume:  'Immobilisez-vous en sécurité, ne forcez pas sur le moteur.',
    etapes: [
      { ordre: 1, texte: 'Feux de détresse immédiatement.', urgent: true },
      { ordre: 2, texte: 'Immobilisez-vous sur l\'accotement, la VAU ou une aire de repos — évitez les tunnels.', urgent: true },
      { ordre: 3, texte: 'Coupez le moteur si vous observez fumée, odeur de brûlé ou voyant moteur rouge.', urgent: true },
      { ordre: 4, texte: 'Enfilez votre gilet jaune AVANT de sortir du véhicule — obligation légale.', urgent: true },
      { ordre: 5, texte: 'Ne tentez pas de réparer sur autoroute — restez éloigné du trafic derrière la glissière.', urgent: false },
      { ordre: 6, texte: 'Appelez votre assistance routière ou la borne SOS.', urgent: false },
      { ordre: 7, texte: 'Pour un VE : si voyant orange "haute tension" ou odeur chimique, éloignez-vous immédiatement et appelez les pompiers.', urgent: true, veOnly: true },
    ],
    alerteVE: 'Une odeur chimique ou âcre dans un VE peut indiquer un début de thermal runaway de la batterie haute tension. Évacuez le véhicule immédiatement et appelez les pompiers (18 / 112). Ne restez pas à proximité.',
    conseilPro: 'N\'ouvrez le capot moteur que si vous êtes en sécurité totale et loin du trafic.',
  },

  accident: {
    titre:   'Accident de la route',
    emoji:   '🚨',
    danger:  'eleve',
    resume:  'Sécurisez, alertez, secourez — dans cet ordre.',
    etapes: [
      { ordre: 1, texte: 'Coupez le moteur et mettez le frein à main.', urgent: true },
      { ordre: 2, texte: 'Allumez les feux de détresse et enfilez le gilet jaune AVANT de sortir du véhicule.', urgent: true },
      { ordre: 3, texte: 'Appelez le 15 (SAMU), le 18 (pompiers) ou le 112 si des blessés sont présents.', urgent: true },
      { ordre: 4, texte: 'Posez les triangles de signalisation sans vous mettre en danger.', urgent: false },
      { ordre: 5, texte: 'Ne déplacez pas les blessés sauf danger immédiat (feu, risque effondrement).', urgent: true },
      { ordre: 6, texte: 'Si VE impliqué : informez les secours de la présence d\'une batterie haute tension.', urgent: true, veOnly: true },
      { ordre: 7, texte: 'Échangez les coordonnées et prenez des photos pour le constat amiable.', urgent: false },
      { ordre: 8, texte: 'Remplissez le constat amiable — même si pas de blessé.', urgent: false },
    ],
    alerteVE: 'Informez impérativement les pompiers qu\'il s\'agit d\'un VE. Les batteries HV présentent des risques spécifiques (tension > 400V, risque d\'incendie différé). Les secours ont des protocoles adaptés.',
    conseilPro: 'En cas de doute sur des blessures (choc cervical, choc différé) : appelez le 15 même si vous semblez aller bien.',
  },

  batterie12v: {
    titre:   'Batterie 12V déchargée (véhicule ne démarre plus)',
    emoji:   '🔋',
    danger:  'faible',
    resume:  'Le véhicule ne répond plus aux commandes — situation non-urgente si vous êtes en sécurité.',
    etapes: [
      { ordre: 1, texte: 'Vérifiez que vous êtes en lieu sûr (parking, bord de route écarté).', urgent: false },
      { ordre: 2, texte: 'Tentez un démarrage par câbles de démarrage depuis un autre véhicule (thermique uniquement).', urgent: false, nonVe: true },
      { ordre: 3, texte: 'Pour un VE/PHEV : la batterie 12V est séparée de la batterie HV. Ne tentez pas un démarrage par câbles sans protocole constructeur.', urgent: false, veOnly: true },
      { ordre: 4, texte: 'Consultez le manuel constructeur — certains VE ont un accès spécifique pour dépannage 12V.', urgent: false, veOnly: true },
      { ordre: 5, texte: 'Appelez votre assistance routière — intervention rapide possible.', urgent: false },
      { ordre: 6, texte: 'La batterie 12V d\'un VE est souvent remplaçable en 30 min par un dépanneur qualifié VE.', urgent: false, veOnly: true },
    ],
    conseilPro: 'Une batterie 12V qui rend l\'âme souvent précède une panne complète — faites-la contrôler après dépannage.',
  },

  surchauffe: {
    titre:   'Surchauffe moteur (thermique)',
    emoji:   '🌡️',
    danger:  'eleve',
    resume:  'Arrêtez-vous immédiatement — continuer roulera le moteur définitivement.',
    etapes: [
      { ordre: 1, texte: 'Coupez la climatisation immédiatement — mettez le chauffage à fond pour évacuer les calories.', urgent: true },
      { ordre: 2, texte: 'Si le voyant rouge de température s\'allume : immobilisez-vous dès que possible en sécurité.', urgent: true },
      { ordre: 3, texte: 'Coupez le moteur. N\'ouvrez pas le capot immédiatement.', urgent: true },
      { ordre: 4, texte: 'Attendez 20 à 30 minutes avant d\'ouvrir le capot — risque de brûlure grave avec le liquide de refroidissement sous pression.', urgent: true },
      { ordre: 5, texte: 'N\'ajoutez jamais d\'eau froide sur un moteur chaud.', urgent: true },
      { ordre: 6, texte: 'Appelez votre assistance — ne redémarrez pas avant diagnostic.', urgent: false },
    ],
    alerteVE: 'Les VE ne surchauffent pas au sens thermique traditionnel, mais peuvent avoir un problème de gestion thermique de la batterie. Si voyant "T° batterie" rouge : arrêtez-vous et contactez l\'assistance.',
    conseilPro: 'Redémarrer un moteur surchauffé même "un peu" peut coûter 3 000 à 8 000 € de réparation moteur.',
  },

  autre: {
    titre:   'Autre problème',
    emoji:   '❓',
    danger:  'faible',
    resume:  'Appliquez les réflexes de base et contactez votre assistance.',
    etapes: [
      { ordre: 1, texte: 'Immobilisez-vous en lieu sûr, feux de détresse allumés.', urgent: false },
      { ordre: 2, texte: 'Évaluez la situation — y a-t-il un danger immédiat (feu, fumée, blessé) ?', urgent: false },
      { ordre: 3, texte: 'Si danger immédiat : appelez le 18 ou 112 immédiatement.', urgent: true },
      { ordre: 4, texte: 'Sinon : contactez votre assistance routière ou le garage de votre constructeur.', urgent: false },
      { ordre: 5, texte: 'Consultez le manuel du véhicule — la signification des voyants y est détaillée.', urgent: false },
    ],
    conseilPro: 'En cas de doute sur la sécurité du véhicule, ne reprenez pas la route — faites intervenir un professionnel.',
  },
}

// ── Conseils spécifiques VE par lieu ─────────────────────────────────────────

export const CONSEILS_VE_LIEU: Record<Lieu, string> = {
  autoroute: 'Sur autoroute avec un VE : la borne SOS permet de localiser la borne de recharge la plus proche. Certains assistants (Tesla, Renault) peuvent envoyer une dépanneuse avec un groupe électrogène mobile pour recharge d\'urgence.',
  ville:     'En ville avec un VE en panne : la plupart des grands centres-villes ont des bornes de recharge rapide. Vérifiez Chargemap — vous êtes peut-être à moins de 500 m d\'une borne.',
  parking:   'En parking avec un VE à plat : certains parkings disposent de bornes. Contactez la borne SOS du parking ou votre assistance — une recharge d\'urgence de 30 min peut suffire à rejoindre une borne.',
  route:     'Sur route départementale avec un VE : contactez votre assistance constructeur — Tesla, Renault, Stellantis disposent de camions de recharge mobile en FR/BE.',
}
