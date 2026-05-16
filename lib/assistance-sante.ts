// lib/assistance-sante.ts
// Assistance Santé Voyage — vaccins, trousse, assurance rapatriement, bébé, premiers secours

export type ZoneGeo = 'europe' | 'maghreb' | 'afrique_sub' | 'moyen_orient' | 'asie_sud_est' | 'amerique_nord' | 'amerique_latine' | 'ocean_indien'

export type ProfilVoyageur = 'adulte' | 'senior' | 'bebe' | 'enfant' | 'femme_enceinte'

export type TypeVoyage = 'plage' | 'ville' | 'montagne' | 'randonnee' | 'safari' | 'camping'

export type DureeSejour = 'weekend' | 'semaine' | 'quinzaine' | 'mois_plus'

export interface SanteData {
  zone:           ZoneGeo | null
  profils:        ProfilVoyageur[]
  typeVoyage:     TypeVoyage | null
  duree:          DureeSejour | null
  assuranceVoyage: boolean   // a-t-il une assurance voyage avec rapatriement
  pathologieChronique: boolean
  animauxContacts: boolean   // activités avec animaux (safari, ferme…)
}

// ── Zones géographiques ───────────────────────────────────────────────────────

export interface InfoZone {
  label:      string
  flag:       string
  pays:       string     // exemples
  risques:    string[]
  vaccinsReco: VaccinInfo[]
  vaccinsOblig: string[]
  eauPotable: 'oui' | 'prudence' | 'non'
  paludisme:  'aucun' | 'risque_faible' | 'risque_eleve'
  niveauRisque: 'faible' | 'modere' | 'eleve'
}

export interface VaccinInfo {
  nom:        string
  indication: string
  delai:      string    // délai avant départ
  obligatoire: boolean
}

export const INFO_ZONES: Record<ZoneGeo, InfoZone> = {
  europe: {
    label: 'Europe', flag: '🇪🇺',
    pays: 'France, Espagne, Italie, Grèce, Portugal…',
    risques: ["Insolation et coup de chaleur en été", "Morsures de tiques en forêt (encéphalite)", "Intoxications alimentaires"],
    vaccinsReco: [
      { nom: 'Hépatite A', indication: 'Séjour en zone rurale, alimentation locale', delai: '2 semaines avant', obligatoire: false },
      { nom: 'Encéphalite à tiques', indication: 'Randonnée en forêt (Europe centrale, Scandinavie)', delai: '3 semaines avant (2 doses)', obligatoire: false },
    ],
    vaccinsOblig: [],
    eauPotable: 'oui',
    paludisme: 'aucun',
    niveauRisque: 'faible',
  },
  maghreb: {
    label: 'Maghreb', flag: '🌍',
    pays: 'Maroc, Tunisie, Algérie',
    risques: ["Diarrhée du voyageur (turista)", "Insolation et déshydratation", "Scorpions et serpents en zone rurale", "Rage (animaux errants)"],
    vaccinsReco: [
      { nom: 'Hépatite A', indication: 'Recommandé systématiquement', delai: '2 semaines avant', obligatoire: false },
      { nom: 'Fièvre typhoïde', indication: 'Séjour > 2 semaines ou alimentation locale', delai: '2 semaines avant', obligatoire: false },
      { nom: 'Rage', indication: 'Contact avec animaux, zones rurales, enfants', delai: '4 semaines avant (3 doses)', obligatoire: false },
    ],
    vaccinsOblig: [],
    eauPotable: 'non',
    paludisme: 'aucun',
    niveauRisque: 'modere',
  },
  afrique_sub: {
    label: 'Afrique subsaharienne', flag: '🌍',
    pays: 'Sénégal, Kenya, Tanzanie, Madagascar…',
    risques: ["Paludisme — risque élevé", "Fièvre jaune", "Diarrhée du voyageur", "Typhoïde", "Rage", "Morsures de serpents"],
    vaccinsReco: [
      { nom: 'Fièvre jaune', indication: 'Obligatoire dans de nombreux pays', delai: '10 jours avant', obligatoire: true },
      { nom: 'Hépatite A', indication: 'Recommandé systématiquement', delai: '2 semaines avant', obligatoire: false },
      { nom: 'Fièvre typhoïde', indication: 'Recommandé systématiquement', delai: '2 semaines avant', obligatoire: false },
      { nom: 'Rage', indication: 'Séjour > 1 mois, contact animaux, zones rurales', delai: '4 semaines avant (3 doses)', obligatoire: false },
      { nom: 'Méningite ACWY', indication: 'Ceinture méningitique africaine, pèlerinages', delai: '2 semaines avant', obligatoire: false },
    ],
    vaccinsOblig: ['Fièvre jaune (certificat international requis)'],
    eauPotable: 'non',
    paludisme: 'risque_eleve',
    niveauRisque: 'eleve',
  },
  moyen_orient: {
    label: 'Moyen-Orient', flag: '🕌',
    pays: 'Égypte, Jordanie, Dubaï, Turquie…',
    risques: ["Diarrhée du voyageur", "Insolation extrême (>45°C en été)", "MERS-CoV (péninsule arabique)", "Scorpions"],
    vaccinsReco: [
      { nom: 'Hépatite A', indication: 'Recommandé systématiquement', delai: '2 semaines avant', obligatoire: false },
      { nom: 'Fièvre typhoïde', indication: 'Séjour hors zones touristiques', delai: '2 semaines avant', obligatoire: false },
      { nom: 'Méningite ACWY', indication: 'Pèlerinage La Mecque (obligatoire), zones rurales', delai: '2 semaines avant', obligatoire: false },
    ],
    vaccinsOblig: ['Méningite ACWY (pèlerinage uniquement)'],
    eauPotable: 'prudence',
    paludisme: 'risque_faible',
    niveauRisque: 'modere',
  },
  asie_sud_est: {
    label: 'Asie du Sud-Est', flag: '🌏',
    pays: 'Thaïlande, Vietnam, Bali, Cambodge…',
    risques: ["Dengue (moustiques de jour)", "Paludisme en zones rurales/frontières", "Diarrhée du voyageur", "Rage (chiens errants)", "Leptospirose (eau douce)"],
    vaccinsReco: [
      { nom: 'Hépatite A', indication: 'Recommandé systématiquement', delai: '2 semaines avant', obligatoire: false },
      { nom: 'Fièvre typhoïde', indication: 'Recommandé si alimentation locale', delai: '2 semaines avant', obligatoire: false },
      { nom: 'Rage', indication: 'Séjour > 1 mois, enfants, zones rurales', delai: '4 semaines avant (3 doses)', obligatoire: false },
      { nom: 'Encéphalite japonaise', indication: 'Zones rurales, saison des pluies, > 1 mois', delai: '4 semaines avant (2 doses)', obligatoire: false },
      { nom: 'Hépatite B', indication: 'Contact médical possible, séjour long', delai: '6 semaines avant (3 doses)', obligatoire: false },
    ],
    vaccinsOblig: [],
    eauPotable: 'non',
    paludisme: 'risque_faible',
    niveauRisque: 'modere',
  },
  amerique_nord: {
    label: 'Amérique du Nord', flag: '🌎',
    pays: 'USA, Canada',
    risques: ["Frais médicaux extrêmement élevés aux USA", "Maladie de Lyme (tiques en forêt)", "Virus du Nil occidental"],
    vaccinsReco: [
      { nom: 'Hépatite A', indication: 'Zones rurales, alimentation locale', delai: '2 semaines avant', obligatoire: false },
    ],
    vaccinsOblig: [],
    eauPotable: 'oui',
    paludisme: 'aucun',
    niveauRisque: 'faible',
  },
  amerique_latine: {
    label: 'Amérique latine', flag: '🌎',
    pays: 'Mexique, Brésil, Colombie, Cuba, Pérou…',
    risques: ["Dengue et Zika (moustiques)", "Paludisme en zones forestières", "Diarrhée du voyageur", "Fièvre jaune en Amazonie", "Rage"],
    vaccinsReco: [
      { nom: 'Fièvre jaune', indication: 'Amazonie, zones tropicales (souvent obligatoire)', delai: '10 jours avant', obligatoire: true },
      { nom: 'Hépatite A', indication: 'Recommandé systématiquement', delai: '2 semaines avant', obligatoire: false },
      { nom: 'Fièvre typhoïde', indication: 'Séjour hors hôtels, alimentation locale', delai: '2 semaines avant', obligatoire: false },
      { nom: 'Rage', indication: 'Zones rurales, enfants, contact animaux', delai: '4 semaines avant (3 doses)', obligatoire: false },
    ],
    vaccinsOblig: ['Fièvre jaune (Amazonie, selon pays)'],
    eauPotable: 'prudence',
    paludisme: 'risque_faible',
    niveauRisque: 'modere',
  },
  ocean_indien: {
    label: 'Océan Indien', flag: '🏝️',
    pays: 'Réunion, Maurice, Maldives, Seychelles',
    risques: ["Chikungunya et dengue (moustiques)", "Leptospirose (eaux douces)", "Insolation et déshydratation", "Coraux et méduses"],
    vaccinsReco: [
      { nom: 'Hépatite A', indication: 'Recommandé pour Madagascar et Comores', delai: '2 semaines avant', obligatoire: false },
    ],
    vaccinsOblig: [],
    eauPotable: 'prudence',
    paludisme: 'risque_faible',
    niveauRisque: 'faible',
  },
}

// ── Trousse médicale ──────────────────────────────────────────────────────────

export interface ItemTrousse {
  categorie: string
  items:      { nom: string; indication: string; zones?: ZoneGeo[] }[]
}

export const TROUSSE_BASE: ItemTrousse[] = [
  {
    categorie: 'Douleur & fièvre',
    items: [
      { nom: 'Paracétamol (500 mg)', indication: 'Antidouleur, antipyrétique — base de toute trousse' },
      { nom: 'Ibuprofène (400 mg)', indication: 'Anti-inflammatoire, douleurs musculaires' },
    ],
  },
  {
    categorie: 'Digestif',
    items: [
      { nom: 'Lopéramide (Imodium)', indication: 'Antidiarrhéique — arrêt mécanique' },
      { nom: 'Sels de réhydratation orale (SRO)', indication: 'Turista, vomissements, déshydratation' },
      { nom: 'Smectite (Smecta)', indication: 'Diarrhée légère, irritation intestinale' },
      { nom: 'Antiémétique (métoclopramide)', indication: 'Nausées, vomissements' },
      { nom: 'Antispasmodique (Spasfon)', indication: 'Douleurs abdominales' },
    ],
  },
  {
    categorie: 'Plaies & peau',
    items: [
      { nom: 'Antiseptique (Betadine ou Biseptine)', indication: 'Désinfection des plaies' },
      { nom: 'Pansements assortis', indication: 'Coupures, ampoules' },
      { nom: 'Compresses stériles', indication: 'Pansements larges, brûlures' },
      { nom: 'Crème antihistaminique', indication: 'Piqûres d\'insectes, allergies cutanées' },
      { nom: 'Crème solaire SPF 50+', indication: 'Prévention coups de soleil — fondamental sous les tropiques' },
    ],
  },
  {
    categorie: 'Yeux & ORL',
    items: [
      { nom: 'Collyre antibiotique (Sterdex)', indication: 'Conjonctivite (prescrit avant départ)' },
      { nom: 'Spray nasal décongestionnant', indication: 'Sinusite, rhume en avion' },
      { nom: 'Antihistaminique oral (Zyrtec)', indication: 'Allergie, urticaire' },
    ],
  },
  {
    categorie: 'Matériel',
    items: [
      { nom: 'Thermomètre digital', indication: 'Surveiller la fièvre' },
      { nom: 'Pince à épiler', indication: 'Retrait de tiques, épines' },
      { nom: 'Ciseaux à bouts ronds', indication: 'Découpe pansements, fils' },
      { nom: 'Gants latex', indication: 'Hygiène lors des soins' },
    ],
  },
]

export const TROUSSE_EXTRAS: { zone: ZoneGeo[]; items: ItemTrousse }[] = [
  {
    zone: ['maghreb', 'afrique_sub', 'moyen_orient', 'asie_sud_est', 'amerique_latine', 'ocean_indien'],
    items: {
      categorie: 'Anti-moustiques (zones tropicales)',
      items: [
        { nom: 'Répulsif DEET ≥ 30% (Moustifluid, Cinq sur cinq tropique)', indication: 'Protection contre dengue, paludisme, Zika — appliquer sur peau exposée' },
        { nom: 'Moustiquaire imprégnée', indication: 'Dormir en zone à risque' },
        { nom: 'Antipaludéen (sur ordonnance)', indication: 'Selon destination et risque paludisme — consulter médecin du voyage' },
      ],
    },
  },
  {
    zone: ['afrique_sub', 'amerique_latine', 'asie_sud_est'],
    items: {
      categorie: 'Antibiothérapie voyageur (sur ordonnance)',
      items: [
        { nom: 'Azithromycine 500 mg', indication: 'Turista bactérienne sévère, 3 jours de traitement — à prescrire avant départ' },
        { nom: 'Ciprofloxacine 500 mg', indication: 'Alternative à l\'azithromycine selon zone et profil' },
      ],
    },
  },
]

// ── Gestes de premiers secours ────────────────────────────────────────────────

export interface GestePremierSecours {
  id:        string
  titre:     string
  emoji:     string
  urgence:   'haute' | 'moyenne'
  etapes:    string[]
  quandAppeler: string
}

export const GESTES_SECOURS: GestePremierSecours[] = [
  {
    id: 'coup_chaleur',
    titre: 'Coup de chaleur / Insolation',
    emoji: '🌡️',
    urgence: 'haute',
    etapes: [
      "Éloignez la personne du soleil — ombre ou intérieur climatisé immédiatement.",
      "Allongez-la et surélevez légèrement les jambes.",
      "Refroidissez par tous moyens : eau froide sur la peau, ventilateur, glaçons sur la nuque et les aisselles.",
      "Faites boire de l'eau fraîche (pas glacée) si la personne est consciente.",
      "Ne donnez pas d'aspirine ni d'ibuprofène — ils n'aident pas et peuvent aggraver.",
      "Si confusion, perte de conscience ou T° > 40°C → appelez les secours immédiatement.",
    ],
    quandAppeler: "Confusion mentale, perte de conscience, T° > 40°C, convulsions.",
  },
  {
    id: 'turista',
    titre: 'Turista / Diarrhée du voyageur',
    emoji: '🤒',
    urgence: 'moyenne',
    etapes: [
      "Réhydratez avec des sels de réhydratation orale (SRO) — 1 sachet dans 200 ml d'eau purifiée toutes les heures.",
      "Ne mangez pas pendant 4–6 h, puis reprise avec riz blanc, banane, toast sec.",
      "Prenez du lopéramide (Imodium) uniquement si vous devez absolument vous déplacer — il ralentit l'élimination.",
      "Eau uniquement en bouteille fermée ou traitée — même pour se brosser les dents.",
      "Si fièvre > 38,5°C, sang dans les selles ou diarrhée persistant > 48 h → consultez.",
      "Antibiothérapie (azithromycine) si prescrite avant départ : débutez au 3e jour sans amélioration.",
    ],
    quandAppeler: "Fièvre > 38,5°C, sang dans les selles, déshydratation sévère (> 8 selles/jour, vertiges, yeux creux).",
  },
  {
    id: 'piqure_insecte',
    titre: 'Piqûre d\'insecte / Réaction allergique',
    emoji: '🐝',
    urgence: 'haute',
    etapes: [
      "Retirez le dard si visible : grattez latéralement avec une carte — ne pincez pas (cela injecte davantage de venin).",
      "Lavez à l'eau et au savon, appliquez du froid (glaçon enveloppé dans un tissu, 10 min).",
      "Crème antihistaminique sur la zone, antihistaminique oral si démangeaison importante.",
      "Surveillez les signes d'allergie sévère : gonflement du visage, difficulté à respirer, malaise, chute de pression.",
      "En cas de choc anaphylactique → adrénaline auto-injectable (Epipen) si disponible — allongez la personne, jambes surélevées, appelez le 15/112.",
    ],
    quandAppeler: "Gonflement de la gorge, difficultés à respirer, malaise, perte de conscience — choc anaphylactique : URGENCE absolue.",
  },
  {
    id: 'tique',
    titre: 'Morsure de tique',
    emoji: '🕷️',
    urgence: 'moyenne',
    etapes: [
      "Retirez la tique le plus vite possible avec un tire-tique (ou pince fine) : saisissez le plus près possible de la peau, tirez doucement sans tourner.",
      "Ne brûlez jamais la tique, ne mettez pas d'éther ni de vaseline — cela augmente le risque d'injection de salive.",
      "Désinfectez la zone à l'antiseptique.",
      "Notez la date de la morsure et surveillez la zone 30 jours.",
      "Rougeur circulaire qui s'étend (érythème migrant, signe de Lyme) → consultez immédiatement même sans fièvre.",
    ],
    quandAppeler: "Apparition d'un érythème migrant (rougeur circulaire > 5 cm), fièvre, courbatures dans les jours suivants.",
  },
  {
    id: 'noyade',
    titre: 'Quasi-noyade',
    emoji: '🌊',
    urgence: 'haute',
    etapes: [
      "Sortez la personne de l'eau en sécurisant votre propre position.",
      "Appelez les secours (112) immédiatement.",
      "Allongez la personne sur le dos sur une surface ferme.",
      "Si elle ne respire pas : commencez le bouche-à-bouche — 5 insufflations initiales, puis massage cardiaque 30 compressions / 2 insufflations.",
      "Continuez jusqu'à l'arrivée des secours ou reprise de la respiration spontanée.",
      "Même si la personne reprend conscience, consultation médicale obligatoire (risque d'œdème pulmonaire secondaire).",
    ],
    quandAppeler: "Toujours — quasi-noyade nécessite systématiquement une évaluation médicale.",
  },
  {
    id: 'fracture',
    titre: 'Fracture / Entorse grave',
    emoji: '🦴',
    urgence: 'haute',
    etapes: [
      "Immobilisez le membre dans la position dans laquelle il se trouve — ne tentez pas de remettre en place.",
      "Attelle improvisée : planche, bâton de randonnée, magazine roulé — fixez sans serrer.",
      "Surélevez le membre si possible pour limiter l'œdème.",
      "Appliquez du froid (enveloppé) 15–20 minutes.",
      "Donnez un antalgique (paracétamol ou ibuprofène) si la personne est consciente et sans contre-indication.",
      "Évacuez vers un centre médical — ne faites pas marcher si fracture jambe.",
    ],
    quandAppeler: "Toujours en cas de fracture suspectée. Urgence immédiate si os visible, perte de sensibilité, teinte bleutée du membre.",
  },
]

// ── Assurance rapatriement ────────────────────────────────────────────────────

export interface InfoAssurance {
  titre:       string
  description: string
  conseil:     string
  couvreQuoi:  string[]
  neCouvrePas: string[]
}

export const INFO_ASSURANCE: InfoAssurance = {
  titre: 'Assurance voyage avec rapatriement médical',
  description: "Le rapatriement médical peut coûter 20 000 à 100 000 € sans couverture — c'est le poste de dépense le plus sous-estimé par les voyageurs.",
  conseil: "Vérifiez que votre assurance inclut bien le rapatriement médical (pas juste l'annulation). La carte bancaire peut couvrir l'annulation mais pas toujours le rapatriement.",
  couvreQuoi: [
    "Rapatriement médical (avion médicalisé si nécessaire)",
    "Hospitalisation à l'étranger",
    "Frais médicaux d'urgence",
    "Assistance 24h/24 par téléphone",
    "Retour anticipé en cas de décès d'un proche",
  ],
  neCouvrePas: [
    "Pathologies préexistantes non déclarées",
    "Sports extrêmes (souvent en option)",
    "Alcool ou stupéfiants impliqués",
    "Grossesse après la 32e semaine (variable)",
    "Pays en zone rouge (MEAE déconseille le voyage)",
  ],
}

export const ASSURANCES_CB: { carte: string; rapatriement: boolean; plafond: string; note: string }[] = [
  { carte: 'Visa Classic / MC Standard', rapatriement: false, plafond: '—', note: "Pas de rapatriement médical — souscrivez une assurance séparée." },
  { carte: 'Visa Premier / MC Gold', rapatriement: true, plafond: '150 000 €', note: "Rapatriement inclus. Vérifiez les exclusions (sports, pathologies)." },
  { carte: 'Visa Infinite / MC World', rapatriement: true, plafond: '300 000 €', note: "Couverture premium. Lisez les conditions pour les zones à risque." },
  { carte: 'American Express', rapatriement: true, plafond: 'variable', note: "Bonne couverture, vérifiez votre niveau de carte et les exclusions." },
]

// ── Conseils bébé / enfant ────────────────────────────────────────────────────

export const CONSEILS_BEBE: { titre: string; conseils: string[] }[] = [
  {
    titre: '🍼 Alimentation & eau',
    conseils: [
      "Eau en bouteille fermée uniquement pour préparer les biberons — même en Europe du Sud.",
      "Lait en poudre : emportez votre marque habituelle (introuvable à l'étranger).",
      "Nourriture solide : évitez les crudités, les jus non pasteurisés, les fruits non pelés.",
      "Diarrhée bébé : réhydratation orale IMMÉDIATE — les bébés se déshydratent très vite.",
    ],
  },
  {
    titre: '☀️ Soleil & chaleur',
    conseils: [
      "Évitez l'exposition directe au soleil avant 2 ans — chapeau, vêtements couvrants.",
      "Crème solaire SPF 50+ après 6 mois — avant 6 mois : vêtements uniquement.",
      "Hydratez régulièrement, même sans soif apparente.",
      "Signes de coup de chaleur bébé : fontanelle bombée, pleurs inhabituels, refus de boire.",
    ],
  },
  {
    titre: '🦟 Moustiques',
    conseils: [
      "Répulsifs DEET interdits avant 12 ans — utilisez un répulsif à l'IR3535 ou à la picaridine.",
      "Moustiquaire de lit imprégnée indispensable en zone tropicale.",
      "Vêtements manches longues en soirée.",
      "Antipaludéen : certains sont contre-indiqués selon l'âge — consultez un médecin du voyage.",
    ],
  },
  {
    titre: '🩺 Médical',
    conseils: [
      "Consultez votre pédiatre 4 à 6 semaines avant le départ pour les vaccins adaptés à l'âge.",
      "Emportez le carnet de santé et les ordonnances en cours.",
      "Paracétamol en suppositoire adapté au poids — plus pratique en voyage.",
      "Assurance avec rapatriement : vérifiez qu'elle couvre explicitement les nourrissons.",
    ],
  },
]

// ── Conseils femme enceinte ───────────────────────────────────────────────────

export const CONSEILS_ENCEINTE: string[] = [
  "Consultez votre gynécologue-obstétricien avant tout voyage — en particulier au-delà du 2e trimestre.",
  "Vol en avion : déconseillé après 36 semaines. Compagnies imposent souvent un certificat médical après 28 semaines.",
  "Zones tropicales : la plupart des vaccins vivants sont contre-indiqués (fièvre jaune, fièvre typhoïde orale).",
  "Antipaludéens : certains sont contre-indiqués — chloroquine tolérée, méfloquine déconseillée au 1er trimestre.",
  "Préférez les pays avec des structures médicales de qualité — USA, Canada, Europe occidentale.",
  "Assurance voyage : vérifiez qu'elle couvre la grossesse et un accouchement prématuré à l'étranger.",
  "Emportez votre dossier obstétrical complet traduit si possible.",
]

// ── Conseils senior ───────────────────────────────────────────────────────────

export const CONSEILS_SENIOR: string[] = [
  "Déclarez vos pathologies chroniques à l'assurance voyage — non-déclaration = refus de prise en charge.",
  "Emportez vos médicaments en quantité suffisante + ordonnance internationale (en latin, DCI).",
  "Certains médicaments sont classés stupéfiants à l'étranger — renseignez-vous à l'ambassade.",
  "Chaleur : les seniors régulent moins bien la température — hydratation renforcée, évitez les heures chaudes.",
  "Anticoagulants : thrombose en avion — bas de contention, marche régulière, hydratation.",
  "Assurance : vérifiez le plafond d'âge — certaines couvrent jusqu'à 75 ans seulement.",
]

// ── Alertes eau & alimentation ────────────────────────────────────────────────

export const CONSEILS_EAU: Record<InfoZone['eauPotable'], { titre: string; conseils: string[] }> = {
  oui: {
    titre: "✅ Eau du robinet potable",
    conseils: [
      "L'eau du robinet est généralement sans risque.",
      "Prudence dans les zones rurales très isolées.",
      "Glaçons sans risque dans les hôtels et restaurants.",
    ],
  },
  prudence: {
    titre: "⚠️ Eau — prudence recommandée",
    conseils: [
      "Préférez l'eau en bouteille fermée pour boire et vous brosser les dents.",
      "Évitez les glaçons dans les établissements peu contrôlés.",
      "Les fruits et légumes doivent être pelés ou cuits.",
      "Dans les hôtels classés, l'eau est généralement filtrée.",
    ],
  },
  non: {
    titre: "🚫 Eau du robinet non potable",
    conseils: [
      "Eau en bouteille fermée SYSTÉMATIQUEMENT — même pour se brosser les dents.",
      "Ne faites jamais de glaçons avec l'eau du robinet.",
      "Fruits et légumes : pelés ou cuits uniquement.",
      "Vigilance dans les buffets à volonté : crudités, sauces, crèmes glacées.",
      "Purification possible : pastilles de purification, filtre LifeStraw, ébullition 1 minute.",
    ],
  },
}

// ── Calcul résultat ───────────────────────────────────────────────────────────

export interface ResultatSante {
  zone:              InfoZone
  vaccinsReco:       VaccinInfo[]
  vaccinsOblig:      string[]
  trousse:           ItemTrousse[]
  gestesSecours:     GestePremierSecours[]
  conseilsEau:       { titre: string; conseils: string[] }
  assuranceRequise:  boolean
  assuranceAlerte:   string | null
  conseilsBebe:      typeof CONSEILS_BEBE | null
  conseilsEnceinte:  string[] | null
  conseilsSenior:    string[] | null
  paludismeAlerte:   string | null
  niveauRisque:      InfoZone['niveauRisque']
}

export function analyserSante(data: SanteData): ResultatSante {
  const zone = INFO_ZONES[data.zone ?? 'europe']

  // Vaccins
  let vaccinsReco = [...zone.vaccinsReco]
  if (data.animauxContacts && !vaccinsReco.find(v => v.nom === 'Rage')) {
    vaccinsReco.push({ nom: 'Rage', indication: 'Contact avec animaux prévu', delai: '4 semaines avant (3 doses)', obligatoire: false })
  }

  // Trousse
  const trousse: ItemTrousse[] = [...TROUSSE_BASE]
  TROUSSE_EXTRAS.forEach(extra => {
    if (data.zone && extra.zone.includes(data.zone)) {
      trousse.push(extra.items)
    }
  })

  // Gestes secours adaptés à la destination
  const gestesSecours: GestePremierSecours[] = []
  if (['maghreb', 'afrique_sub', 'moyen_orient', 'asie_sud_est', 'amerique_latine', 'ocean_indien'].includes(data.zone ?? '')) {
    gestesSecours.push(GESTES_SECOURS.find(g => g.id === 'coup_chaleur')!)
    gestesSecours.push(GESTES_SECOURS.find(g => g.id === 'turista')!)
    gestesSecours.push(GESTES_SECOURS.find(g => g.id === 'piqure_insecte')!)
  }
  if (data.typeVoyage === 'randonnee' || data.typeVoyage === 'montagne') {
    gestesSecours.push(GESTES_SECOURS.find(g => g.id === 'fracture')!)
    gestesSecours.push(GESTES_SECOURS.find(g => g.id === 'tique')!)
  }
  if (data.typeVoyage === 'plage') {
    gestesSecours.push(GESTES_SECOURS.find(g => g.id === 'noyade')!)
    gestesSecours.push(GESTES_SECOURS.find(g => g.id === 'coup_chaleur')!)
    gestesSecours.push(GESTES_SECOURS.find(g => g.id === 'piqure_insecte')!)
  }
  // Dédoublonnage
  const ids = new Set<string>()
  const gestesFiltres = gestesSecours.filter(g => { if (ids.has(g.id)) return false; ids.add(g.id); return true })
  // Si rien de spécifique, on met les essentiels
  const gestesFinaux = gestesFiltres.length > 0 ? gestesFiltres : [
    GESTES_SECOURS.find(g => g.id === 'piqure_insecte')!,
    GESTES_SECOURS.find(g => g.id === 'turista')!,
  ]

  // Assurance
  const assuranceRequise = !data.assuranceVoyage
  const assuranceAlerte = data.zone === 'amerique_nord' && !data.assuranceVoyage
    ? "⚠️ Aux États-Unis, une nuit d'hospitalisation coûte 5 000 à 20 000 $. Sans assurance, un séjour médical peut ruiner un voyage — et au-delà."
    : zone.niveauRisque === 'eleve' && !data.assuranceVoyage
    ? "⚠️ Pour cette destination à risque élevé, l'assurance rapatriement est fortement conseillée — un évacuation médicale coûte 50 000 à 100 000 €."
    : null

  // Paludisme
  const paludismeAlerte = zone.paludisme === 'risque_eleve'
    ? "🦟 Risque paludisme ÉLEVÉ — antipaludéen obligatoire sur ordonnance (Malarone, Doxy…). Consultez un médecin du voyage 4–6 semaines avant le départ."
    : zone.paludisme === 'risque_faible'
    ? "🦟 Risque paludisme faible mais présent selon zones et saison — discutez avec votre médecin si vous allez hors des circuits touristiques."
    : null

  // Profils spéciaux
  const conseilsBebe = data.profils.includes('bebe') || data.profils.includes('enfant') ? CONSEILS_BEBE : null
  const conseilsEnceinte = data.profils.includes('femme_enceinte') ? CONSEILS_ENCEINTE : null
  const conseilsSenior = data.profils.includes('senior') ? CONSEILS_SENIOR : null

  return {
    zone,
    vaccinsReco,
    vaccinsOblig: zone.vaccinsOblig,
    trousse,
    gestesSecours: gestesFinaux,
    conseilsEau: CONSEILS_EAU[zone.eauPotable],
    assuranceRequise,
    assuranceAlerte,
    conseilsBebe,
    conseilsEnceinte,
    conseilsSenior,
    paludismeAlerte,
    niveauRisque: zone.niveauRisque,
  }
}

export const LABEL_ZONE: Record<ZoneGeo, string> = {
  europe: 'Europe',
  maghreb: 'Maghreb',
  afrique_sub: 'Afrique subsaharienne',
  moyen_orient: 'Moyen-Orient',
  asie_sud_est: 'Asie du Sud-Est',
  amerique_nord: 'Amérique du Nord',
  amerique_latine: 'Amérique latine',
  ocean_indien: 'Océan Indien',
}

export const LABEL_PROFIL: Record<ProfilVoyageur, string> = {
  adulte: 'Adulte',
  senior: 'Senior (65+)',
  bebe: 'Bébé (< 2 ans)',
  enfant: 'Enfant (2–12 ans)',
  femme_enceinte: 'Femme enceinte',
}

export const LABEL_VOYAGE: Record<TypeVoyage, string> = {
  plage: '🏖️ Plage / Mer',
  ville: '🏙️ Ville / Culturel',
  montagne: '⛰️ Montagne / Ski',
  randonnee: '🥾 Randonnée',
  safari: '🦁 Safari / Nature',
  camping: '⛺ Camping',
}

export const LABEL_DUREE: Record<DureeSejour, string> = {
  weekend: 'Week-end (< 4 j)',
  semaine: '1 semaine',
  quinzaine: '2 semaines',
  mois_plus: '1 mois et plus',
}
