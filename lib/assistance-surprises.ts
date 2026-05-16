// lib/assistance-surprises.ts
// Assistance Mauvaises Surprises — guide décisionnel étape par étape

export type SituationId =
  | 'amende_etranger'
  | 'fourriere'
  | 'vol_vehicule'
  | 'ztl_italie'
  | 'peage_impaye'
  | 'accident_etranger'
  | 'document_perdu'
  | 'radar_flash'

export type NiveauUrgence = 'immédiat' | 'dans_24h' | 'dans_72h' | 'sans_urgence'

export interface Etape {
  ordre:      number
  texte:      string
  urgent?:    boolean
  alerte?:    string        // texte d'avertissement rouge
  astuce?:    string        // texte de conseil vert
  contact?:   Contact
}

export interface Contact {
  label:  string
  numero?: string
  url?:   string
  info?:  string
}

export interface ErreurCourante {
  erreur:      string
  consequence: string
}

export interface SituationPays {
  paysCode:  string
  flag:      string
  paysNom:   string
  etapes:    Etape[]
  contacts:  Contact[]
  delai:     string
  montant?:  string
  notes?:    string
}

export interface Situation {
  id:          SituationId
  emoji:       string
  titre:       string
  sousTitre:   string
  urgence:     NiveauUrgence
  labelUrgence: string
  description: string
  erreursCourantes: ErreurCourante[]
  etapesGenerales:  Etape[]
  parPays?:    SituationPays[]
  contactsGeneraux: Contact[]
  checklistDepart: string[]  // prévention
}

// ── Situations ────────────────────────────────────────────────────────────────

export const SITUATIONS: Situation[] = [
  // ── 1. Amende à l'étranger ────────────────────────────────────────────────
  {
    id: 'amende_etranger',
    emoji: '🚔',
    titre: "Amende reçue à l'étranger",
    sousTitre: "Radar, stationnement, vitesse — depuis un pays de l'UE ou hors UE",
    urgence: 'dans_72h',
    labelUrgence: 'À traiter dans les 72h',
    description: "Depuis 2013, la directive européenne permet aux États membres de se transmettre les données des propriétaires de véhicules pour recouvrer les amendes. Une amende non payée peut doubler, bloquer votre carte grise ou générer une saisie.",
    erreursCourantes: [
      { erreur: "Ignorer l'amende en pensant être hors de portée", consequence: "Elle sera transmise à votre pays via le système EUCARIS. Majoration de 100% et frais d'huissier possibles." },
      { erreur: "Payer sans vérifier la légitimité", consequence: "Des arnaques circulent — fausses amendes par email ou courrier imitant les autorités." },
      { erreur: "Contester sans comprendre la procédure locale", consequence: "Un recours mal formé peut être rejeté et rallonger les délais." },
    ],
    etapesGenerales: [
      { ordre: 1, texte: "Vérifiez l'authenticité du document : il doit mentionner les coordonnées officielles du pays émetteur, votre plaque d'immatriculation exacte, la date, le lieu et la vitesse mesurée.", astuce: "Cherchez l'organisme émetteur sur Google — les faux courriers sont fréquents pour l'Italie et l'Espagne." },
      { ordre: 2, texte: "Notez la date d'infraction et calculez le délai de paiement : en général 30 à 45 jours depuis la date de notification (pas depuis la date d'infraction).", alerte: "Le délai court à partir de la réception en France, pas de la date du radar." },
      { ordre: 3, texte: "Évaluez si vous souhaitez contester : si vous n'étiez pas au volant (prêt du véhicule), vous pouvez dénoncer le conducteur réel dans certains pays.", astuce: "En Italie, vous pouvez mandater un avocat local pour ~50–100 € si l'amende dépasse 200 €." },
      { ordre: 4, texte: "Payez en ligne sur le site officiel de l'organisme. Conservez le reçu de paiement pendant 5 ans.", astuce: "Beaucoup d'amendes UE offrent une remise de 25–50% en cas de paiement rapide (souvent dans les 5 à 15 jours)." },
      { ordre: 5, texte: "Si l'amende vous semble disproportionnée ou erronée, envoyez une contestation écrite en lettre recommandée internationale avec AR — dans les délais légaux.", alerte: "Hors UE (Maroc, Turquie…), l'amende ne peut pas être recouvrée en France — mais vous pouvez avoir des problèmes lors du prochain passage à la frontière." },
    ],
    parPays: [
      {
        paysCode: 'IT', flag: '🇮🇹', paysNom: 'Italie (ZTL + radars)',
        etapes: [
          { ordre: 1, texte: "Vérifiez que le courrier vient de la Polizia Municipale ou Prefettura — pas d'un intermédiaire privé." },
          { ordre: 2, texte: "Vous avez 60 jours pour payer ou contester (depuis réception en France)." },
          { ordre: 3, texte: "Paiement en ligne sur le site de la municipalité concernée ou par virement SEPA.", astuce: "Remise de 30% si paiement dans les 5 jours suivant la réception." },
          { ordre: 4, texte: "Pour les ZTL : contestation difficile si vous étiez bien dans la zone. Vérifiez si la signalisation était lisible.", alerte: "Les amendes ZTL arrivent parfois 6 mois après — prescrites si > 90 jours et non notifiées." },
        ],
        contacts: [{ label: 'Portail amendes Italie', url: 'https://www.ilportaledautomobilista.it' }],
        delai: '60 jours depuis réception',
        montant: '80–300 € pour les ZTL',
      },
      {
        paysCode: 'ES', flag: '🇪🇸', paysNom: 'Espagne',
        etapes: [
          { ordre: 1, texte: "L'amende espagnole arrive via la DGT (Dirección General de Tráfico). Vérifiez sur le portail officiel." },
          { ordre: 2, texte: "Délai : 20 jours pour payer avec remise 50%, ou 30 jours plein tarif." },
          { ordre: 3, texte: "Contestation par courrier en espagnol recommandé ou formulaire en ligne DGT." },
        ],
        contacts: [{ label: 'DGT Espagne', url: 'https://www.dgt.es' }],
        delai: '20 jours (remise) / 30 jours',
        montant: '100–600 €',
      },
      {
        paysCode: 'CH', flag: '🇨🇭', paysNom: 'Suisse',
        etapes: [
          { ordre: 1, texte: "Les amendes suisses sont notifiées par l'Office fédéral des routes (OFROU) ou la police cantonale." },
          { ordre: 2, texte: "Les ordonnances pénales suisses doivent être payées ou contestées dans les 10 jours.", alerte: "La Suisse n'est pas dans l'UE — mais un accord bilatéral permet le recouvrement en France." },
          { ordre: 3, texte: "Les amendes pour vitesse excessive (> 30 km/h au-dessus) peuvent entraîner une plainte pénale." },
        ],
        contacts: [{ label: 'OFROU Suisse', url: 'https://www.astra.admin.ch' }],
        delai: '10 jours pour contester',
        montant: 'CHF 40 à plusieurs milliers',
      },
      {
        paysCode: 'BE', flag: '🇧🇪', paysNom: 'Belgique',
        etapes: [
          { ordre: 1, texte: "L'amende belge vient du SPF Finances ou de la Direction Perception et Recouvrement." },
          { ordre: 2, texte: "Payez via le numéro de communication structurée indiqué." },
          { ordre: 3, texte: "Contestation : tribunal de police belge dans les 30 jours." },
        ],
        contacts: [{ label: 'Portail amendes Belgique', url: 'https://www.myminfin.be' }],
        delai: '30 jours',
        montant: '50–400 €',
      },
    ],
    contactsGeneraux: [
      { label: 'Ambassade / Consulat du pays concerné', info: 'Pour obtenir le contact de l\'organisme compétent' },
      { label: 'Votre assurance auto', info: 'Certains contrats incluent une protection juridique internationale' },
    ],
    checklistDepart: [
      "Vérifiez les limitations de vitesse du pays (différentes de la France)",
      "Repérez les ZTL des villes italiennes sur Maps avant d'entrer",
      "En Espagne : ne laissez rien de visible dans le véhicule (amende + vol)",
      "En Suisse : respectez les 80 km/h sur route — les radars sont partout",
    ],
  },

  // ── 2. Fourrière ──────────────────────────────────────────────────────────
  {
    id: 'fourriere',
    emoji: '🚜',
    titre: "Véhicule mis en fourrière",
    sousTitre: "En France ou à l'étranger — retrouver et récupérer son véhicule",
    urgence: 'immédiat',
    labelUrgence: 'À traiter immédiatement',
    description: "La fourrière génère des frais dès la première heure : frais d'enlèvement (80–150 €) + garde journalière (5–30 €/jour). Agissez vite — les frais augmentent chaque jour.",
    erreursCourantes: [
      { erreur: "Attendre plusieurs jours avant d'agir", consequence: "Les frais de garde s'accumulent. Au-delà de 45 jours en France, le véhicule peut être vendu ou détruit." },
      { erreur: "Se déplacer sans les documents requis", consequence: "Vous repartez sans le véhicule et payez un trajet pour rien." },
      { erreur: "Ne pas vérifier si la fourrière était légale", consequence: "Vous pouvez contester et obtenir remboursement si l'enlèvement était abusif." },
    ],
    etapesGenerales: [
      { ordre: 1, texte: "Appelez le commissariat ou la gendarmerie du lieu de l'enlèvement — ils ont l'obligation de vous indiquer où est votre véhicule.", contact: { label: 'Police / Gendarmerie', numero: '17' }, urgent: true },
      { ordre: 2, texte: "En France : appelez le Centre de Renseignements sur les Fourrières (CRF) au 3003.", contact: { label: 'CRF France', numero: '3003' } },
      { ordre: 3, texte: "Préparez les documents : carte grise originale, permis de conduire, justificatif d'assurance en cours de validité, pièce d'identité.", alerte: "Sans ces documents, la fourrière ne vous remettra pas le véhicule." },
      { ordre: 4, texte: "Payez les frais d'enlèvement et de garde sur place (espèces ou CB selon la fourrière). Demandez un reçu détaillé.", astuce: "Photographiez l'état du véhicule AVANT de partir de la fourrière — toute dégradation doit être notée sur le bon de sortie." },
      { ordre: 5, texte: "Si vous estimez l'enlèvement abusif (signalisation absente ou illisible, zone non interdite) : payez d'abord, puis contestez auprès du Procureur de la République dans les 30 jours.", astuce: "Sans paiement préalable, la contestation est irrecevable dans la plupart des cas." },
    ],
    parPays: [
      {
        paysCode: 'ES', flag: '🇪🇸', paysNom: 'Espagne',
        etapes: [
          { ordre: 1, texte: "Appelez la Policía Local ou Guardia Urbana de la ville — ils confirment la mise en fourrière et donnent l'adresse (depósito municipal)." },
          { ordre: 2, texte: "Documents : documentación del vehículo (permis de circuler), permiso de conducir, DNI/passeport." },
          { ordre: 3, texte: "Payez l'amende de stationnement + frais d'enlèvement au guichet de la fourrière.", astuce: "À Barcelone, la fourrière se trouve à l'adresse : Av. De Paral·lel 28 (grua municipal)." },
        ],
        contacts: [
          { label: 'Policía Local Barcelone', numero: '092' },
          { label: 'Grua Municipal Barcelone', url: 'https://w33.bcn.cat/GruesBCN' },
        ],
        delai: 'Récupération possible 24h/24',
        montant: '150–250 € (enlèvement + garde)',
      },
      {
        paysCode: 'IT', flag: '🇮🇹', paysNom: 'Italie',
        etapes: [
          { ordre: 1, texte: "Appelez le Vigili Urbani ou Polizia Municipale — ils indiquent le dépositario (dépôt)." },
          { ordre: 2, texte: "Apportez : documenti del veicolo, patente, carta d'identità/passeport." },
          { ordre: 3, texte: "Payez les frais en espèces généralement.", alerte: "À Rome, certains dépôts ferment la nuit — vérifiez les horaires avant de vous déplacer." },
        ],
        contacts: [{ label: 'Polizia Municipale', numero: '06-67691 (Rome)' }],
        delai: 'Selon horaires du dépôt',
        montant: '80–200 € + 5–15 €/jour',
      },
    ],
    contactsGeneraux: [
      { label: 'CRF France — Fourrières', numero: '3003' },
      { label: 'Votre assurance — assistance dépannage', info: 'Peut couvrir les frais ou vous aider dans les démarches' },
    ],
    checklistDepart: [
      "Photographiez les panneaux de stationnement de chaque côté du stationnement",
      "Vérifiez l'application locale (Paris — ParkMe, Toulouse — Twisto…)",
      "En Italie : évitez les zones bleues et jaunes sans paiement — fourrière immédiate",
      "À Barcelone et Madrid : les ZRE interdisent les thermiques anciens — même en stationnement payant",
    ],
  },

  // ── 3. Vol dans/du véhicule ───────────────────────────────────────────────
  {
    id: 'vol_vehicule',
    emoji: '🔓',
    titre: "Vol dans le véhicule ou vol du véhicule",
    sousTitre: "Bagages volés, vitre brisée, ou véhicule entier volé",
    urgence: 'immédiat',
    labelUrgence: 'Appelez dans l\'heure',
    description: "Le vol à la roulotte (bagages dans la voiture) est le délit le plus fréquent en vacances. Le vol de véhicule représente 130 000 cas par an en France. Les délais pour la déclaration conditionnent votre remboursement.",
    erreursCourantes: [
      { erreur: "Ne pas porter plainte dans les 24h", consequence: "Votre assurance peut réduire ou refuser l'indemnisation sans déclaration dans les délais." },
      { erreur: "Nettoyer ou réparer avant l'expertise", consequence: "Détruit les preuves. L'assureur peut contester la nature et l'étendue du vol." },
      { erreur: "Laisser les documents dans le véhicule", consequence: "Un voleur avec votre carte grise peut faciliter la revente du véhicule." },
    ],
    etapesGenerales: [
      { ordre: 1, texte: "Appelez la police / gendarmerie locale (ou 17 en France) pour déclarer le vol dans l'heure.", contact: { label: 'Police Secours', numero: '17' }, urgent: true },
      { ordre: 2, texte: "Obtenez le numéro de procès-verbal (PV) de la plainte — indispensable pour l'assurance.", alerte: "Sans numéro de PV, votre assurance ne pourra pas traiter le dossier." },
      { ordre: 3, texte: "Appelez votre assurance auto dans les 2 jours ouvrables (délai légal en France) ou selon les conditions de votre contrat.", contact: { label: 'Numéro assurance (dos de votre carte verte)', info: 'Conservez votre carte verte dans votre téléphone en photo' } },
      { ordre: 4, texte: "En cas de vol total du véhicule : bloquez aussi les documents liés (déclaration carte grise volée à la préfecture).", astuce: "En France, vous pouvez faire la déclaration de carte grise volée en ligne sur ANTS." },
      { ordre: 5, texte: "Listez les objets volés avec valeur estimée et, si possible, justificatifs d'achat ou photos.", astuce: "L'assurance vol ne couvre que les objets fixes (autoradio intégré) — pas les bagages. Vérifiez votre contrat multirisque habitation qui peut couvrir les effets personnels." },
      { ordre: 6, texte: "À l'étranger : portez plainte auprès de la police locale. Demandez une copie traduite (ou en anglais) pour votre assurance française.", alerte: "Dans certains pays, le délai pour une copie de plainte peut être de 24 à 72h — restez sur place si nécessaire." },
    ],
    contactsGeneraux: [
      { label: 'Police Secours France', numero: '17' },
      { label: 'Numéro européen urgence', numero: '112' },
      { label: 'ANTS — Déclaration perte carte grise', url: 'https://ants.gouv.fr' },
      { label: 'Votre assurance auto', info: 'Numéro au dos de votre carte verte — mettez-la en photo dans votre téléphone' },
    ],
    checklistDepart: [
      "Ne laissez JAMAIS rien de visible dans le véhicule — même un câble de chargeur",
      "Photographiez vos bagages et leur contenu avant le départ (preuve pour assurance)",
      "Gardez passeport, carte bleue et espèces sur vous — jamais dans le coffre la nuit",
      "En Espagne/Portugal : privilégiez les parkings gardés pour les escales",
      "Gravure antivol sur les vitres : réduction jusqu'à 10% sur l'assurance vol",
    ],
  },

  // ── 4. ZTL Italie ─────────────────────────────────────────────────────────
  {
    id: 'ztl_italie',
    emoji: '🇮🇹',
    titre: "ZTL Italie — vous avez traversé une zone à trafic limité",
    sousTitre: "Rome, Florence, Venise, Bologne, Naples — que faire ?",
    urgence: 'dans_72h',
    labelUrgence: 'Vérifiez dans les 72h',
    description: "Les ZTL (Zone a Traffico Limitato) sont filmées 24h/24. L'amende arrive par courrier en France 2 à 6 mois après. Si vous étiez en voiture de location, le loueur transmet votre identité et facture des frais de gestion (25–50 €).",
    erreursCourantes: [
      { erreur: "Penser que c'est trop tard pour agir", consequence: "Vous pouvez contester si la signalisation était absente ou illisible — même des mois après." },
      { erreur: "Contacter le loueur trop tard", consequence: "Le loueur facture automatiquement après transmission des données — vous perdez la possibilité de contester votre identité." },
      { erreur: "Ne pas garder le contrat de location", consequence: "Impossible de prouver qui conduisait en cas de contestation." },
    ],
    etapesGenerales: [
      { ordre: 1, texte: "Vérifiez si votre hôtel avait enregistré votre plaque pour une autorisation ZTL — certains hôtels en centre-ville font cette démarche automatiquement.", astuce: "Appelez votre hôtel : 'Avez-vous enregistré mon véhicule pour la ZTL ?' — si oui, l'amende sera annulée." },
      { ordre: 2, texte: "Si vous étiez en voiture de location : contactez le loueur immédiatement par écrit. Demandez si la plateforme de gestion des amendes vous contactera directement." },
      { ordre: 3, texte: "Attendez le courrier officiel de la Polizia Municipale (ou Prefettura pour les plus graves). Vérifiez l'authenticité.", alerte: "Des arnaques imitent les amendes ZTL — vérifiez l'adresse d'expéditeur et le numéro IBAN demandé (doit être un compte public italien)." },
      { ordre: 4, texte: "Payez dans les 5 jours suivant la réception pour bénéficier de la remise de 30%.", astuce: "Montant typique : 80–100 € si payé vite. 160–300 € hors délai." },
      { ordre: 5, texte: "Contestation possible si : signalisation absente, panneau illisible, autorisation hôtel non prise en compte. Envoyez une lettre recommandée à la Polizia Municipale de la ville concernée.", alerte: "La contestation suspend le délai de paiement mais n'exempte pas si rejetée. Risque de frais supplémentaires." },
    ],
    parPays: [
      {
        paysCode: 'IT', flag: '🇮🇹', paysNom: 'Rome — ZTL',
        etapes: [
          { ordre: 1, texte: "La ZTL de Rome est active du lundi au samedi 6h30–18h (heures variables selon secteur). Vérifiez sur le portail Roma Mobilità.", contact: { label: 'Roma Mobilità', url: 'https://www.romamobilita.it/it/tecnologie/ztl' } },
          { ordre: 2, texte: "Si vous étiez dans un hôtel du centre, vérifiez qu'il a fait la demande d'autorisation temporaire.", astuce: "Certains hôtels ont un code d'accès spécial — à demander À LA RÉSERVATION." },
        ],
        contacts: [{ label: 'Polizia Municipale Rome', url: 'https://www.comune.roma.it/web/it/polizia-locale' }],
        delai: '60 jours pour payer ou contester',
        montant: '80–163 € selon délai',
      },
      {
        paysCode: 'IT', flag: '🇮🇹', paysNom: 'Florence — ZTL',
        etapes: [
          { ordre: 1, texte: "Florence a plusieurs ZTL dont une active la nuit (Oltrarno). La Ztl centre historique : lun–ven 7h30–20h, sam 7h30–16h.", contact: { label: 'SIAS Florence', url: 'https://www.comune.fi.it/comune-firenze/la-polizia-municipale-firenze' } },
          { ordre: 2, texte: "Si vous logiez en centre historique : votre hébergement doit enregistrer votre plaque sur le portail municipal AVANT votre arrivée." },
        ],
        contacts: [{ label: 'Portail amendes Florence', url: 'https://www.comune.fi.it' }],
        delai: '60 jours',
        montant: '80–163 €',
      },
    ],
    contactsGeneraux: [
      { label: 'Portail Automobilista (toutes amendes IT)', url: 'https://www.ilportaledautomobilista.it' },
      { label: 'Votre assurance — protection juridique', info: 'Peut mandater un correspondant italien pour contester' },
    ],
    checklistDepart: [
      "Avant de réserver un hôtel en centre-ville italien, demandez s'il gère les autorisations ZTL",
      "Installez l'application ViaMichelin ou Waze avec alertes ZTL à jour",
      "Contournez systématiquement le centre historique — garez-vous en périphérie et prenez les transports",
      "En location : demandez au comptoir si la voiture est équipée d'un pass ZTL",
    ],
  },

  // ── 5. Péage impayé ───────────────────────────────────────────────────────
  {
    id: 'peage_impaye',
    emoji: '🛣️',
    titre: "Péage impayé ou incident de paiement",
    sousTitre: "Paiement refusé, barrière levée sans payer, péage oublié",
    urgence: 'dans_72h',
    labelUrgence: 'À régulariser sous 72h',
    description: "Un péage impayé reste dans le système de l'exploitant pendant 2 à 5 ans. Au-delà de 90 jours, des frais de recouvrement s'ajoutent. La régularisation rapide évite les majorations.",
    erreursCourantes: [
      { erreur: "Penser que la barrière levée signifie que c'est gratuit", consequence: "La caméra a photographié votre plaque. Une facture arrivera sous 2 à 6 semaines." },
      { erreur: "Ne pas régulariser les péages Via Verde en Portugal", consequence: "Le système E-Renting poursuit les véhicules étrangers — majoration + huissier possible." },
      { erreur: "Jeter le ticket de péage", consequence: "Le ticket est la preuve du point d'entrée. Sans lui, vous payez le tarif maximum (longue distance)." },
    ],
    etapesGenerales: [
      { ordre: 1, texte: "Identifiez l'exploitant du péage concerné : en France (APRR, SANEF, Vinci, AREA, Cofiroute, ASF…), selon l'autoroute.", astuce: "Sur autoroute.fr, vous pouvez identifier l'exploitant par l'axe routier." },
      { ordre: 2, texte: "Rendez-vous sur le site de l'exploitant ou appelez leur service client pour régulariser. Munissez-vous de votre plaque, date, heure approximative et point d'entrée.", contact: { label: 'Autoroutes.fr — Régularisation', url: 'https://www.autoroutes.fr' } },
      { ordre: 3, texte: "Si vous avez reçu un avis de paiement : régularisez dans les 15 jours pour éviter la majoration.", alerte: "Passé ce délai, des frais de dossier de 15 à 80 € s'ajoutent selon l'exploitant." },
      { ordre: 4, texte: "Pour le Portugal (Via Verde) : régularisation sur le portail E-Renting avant la sortie du pays ou dans les 5 jours.", contact: { label: 'Via Verde Portugal', url: 'https://www.viaverde.pt' } },
      { ordre: 5, texte: "Pour l'Espagne (Autopistas) : régularisation sur le site de la concession concernée (Abertis, Autopistas…) ou au téléphone." },
    ],
    contactsGeneraux: [
      { label: 'SANEF — Service client', numero: '3404', url: 'https://www.sanef.com' },
      { label: 'APRR — Régularisation', url: 'https://www.aprr.fr' },
      { label: 'Vinci Autoroutes', url: 'https://www.vinci-autoroutes.com' },
      { label: 'Via Verde Portugal', url: 'https://www.viaverde.pt' },
      { label: 'Abertis Espagne', url: 'https://www.abertis.com' },
    ],
    checklistDepart: [
      "Préparez un moyen de paiement pour chaque pays (CB sans contact généralement acceptée en Europe)",
      "Au Portugal : renseignez-vous sur Via Verde AVANT le départ — les péages sans barrière sont partout",
      "Gardez vos tickets de péage jusqu'à la destination",
      "Télépéage Liber-t : fonctionne en Espagne, Portugal et Belgique — vérifiez avant de partir",
    ],
  },

  // ── 6. Accident à l'étranger ─────────────────────────────────────────────
  {
    id: 'accident_etranger',
    emoji: '🚗💥',
    titre: "Accident de voiture à l'étranger",
    sousTitre: "Accrochage, choc, accident avec tiers — démarches immédiates",
    urgence: 'immédiat',
    labelUrgence: 'Protocole immédiat',
    description: "Un accident à l'étranger nécessite de suivre un protocole précis. Le constat amiable européen est valable dans tous les pays de l'UE. Le BIRM (Bureau international de règlement des sinistres) coordonne les indemnisations transfrontalières.",
    erreursCourantes: [
      { erreur: "Signer un constat incomplet ou en langue inconnue", consequence: "Vous acceptez potentiellement une responsabilité erronée. Ne signez rien que vous ne comprenez pas." },
      { erreur: "Ne pas appeler la police si l'autre conducteur est agressif ou fuit", consequence: "Sans PV de police, prouver les torts sera difficile. La police est obligatoire en cas de blessé." },
      { erreur: "Déplacer le véhicule avant les photos", consequence: "Perdez les preuves de position. Photographiez d'abord, déplacez ensuite si sécurité l'exige." },
    ],
    etapesGenerales: [
      { ordre: 1, texte: "SÉCURITÉ D'ABORD : triangle de signalisation à 100m (50m en ville), gilet jaune avant de sortir.", urgent: true },
      { ordre: 2, texte: "Si blessés : appelez le 112 (partout en Europe). Ne déplacez pas les blessés sauf danger immédiat (incendie).", contact: { label: 'Urgences Europe', numero: '112' }, urgent: true },
      { ordre: 3, texte: "Photographiez : les deux véhicules (4 angles), les plaques, les dégâts, la position sur la route, les panneaux environnants.", astuce: "Filmez en vidéo pour avoir un document horodaté difficile à contester." },
      { ordre: 4, texte: "Remplissez le constat amiable européen (constat bleu). Chaque partie garde un exemplaire — NE PAS signer si désaccord sur les faits.", alerte: "Si l'autre conducteur ne parle pas français : utilisez les cases numérotées du constat — elles sont identiques dans toutes les langues." },
      { ordre: 5, texte: "Relevez : nom, prénom, adresse, numéro de permis, plaque, nom de l'assurance et numéro de police de l'autre conducteur." },
      { ordre: 6, texte: "Déclarez le sinistre à votre assurance dans les 5 jours ouvrables (délai légal France) — par téléphone puis par écrit.", contact: { label: 'Votre assurance — numéro au dos carte verte', info: 'Disponible 24h/24 pour les sinistres graves' } },
      { ordre: 7, texte: "Si l'autre véhicule est étranger : votre assurance contacte le BIRM pour l'indemnisation transfrontalière.", astuce: "Conservez tous les justificatifs de frais annexes : transport, hébergement si immobilisé, location de voiture." },
    ],
    contactsGeneraux: [
      { label: 'Urgences Europe', numero: '112' },
      { label: 'Votre assurance (urgence sinistre)', info: 'Numéro au dos de votre carte verte' },
      { label: 'BIRM — Bureau International', url: 'https://www.birm.fr', info: 'Gestion des accidents transfrontaliers UE' },
      { label: 'Ambassade de France', info: 'En cas de difficultés administratives graves avec les autorités locales' },
    ],
    checklistDepart: [
      "Emportez des constats amiables européens vierges (en demander à votre assurance)",
      "Prenez une photo de votre carte verte et de votre permis avec votre téléphone",
      "Notez le numéro d'assistance de votre assurance (distinct du numéro de contact habituel)",
      "Vérifiez que votre assurance couvre les pays de votre itinéraire (ex : hors UE, Maroc, etc.)",
    ],
  },

  // ── 7. Document perdu ─────────────────────────────────────────────────────
  {
    id: 'document_perdu',
    emoji: '📄',
    titre: "Document perdu ou volé à l'étranger",
    sousTitre: "Passeport, permis de conduire, carte grise — comment continuer à voyager",
    urgence: 'dans_24h',
    labelUrgence: 'À déclarer sous 24h',
    description: "Perdre son passeport à l'étranger n'empêche pas de rentrer — mais nécessite des démarches consulaires. Perdre son permis de conduire rend la conduite illégale dans la plupart des pays.",
    erreursCourantes: [
      { erreur: "Continuer à conduire sans permis 'en espérant ne pas être contrôlé'", consequence: "Délit de conduite sans permis, même à l'étranger. Amende, voire garde à vue." },
      { erreur: "Ne pas déclarer le vol de passeport à la police locale", consequence: "Sans déclaration de vol, le consulat ne peut pas délivrer un laissez-passer d'urgence." },
      { erreur: "Rentrer en France sans passeport sans prévenir la compagnie aérienne", consequence: "Refus d'embarquement. Certaines compagnies acceptent la CNI seule pour les vols intra-UE." },
    ],
    etapesGenerales: [
      { ordre: 1, texte: "Déposez plainte auprès de la police locale (vol) ou faites une déclaration de perte. Obtenez le numéro de procès-verbal.", urgent: true },
      { ordre: 2, texte: "Contactez le consulat ou l'ambassade de France du pays où vous vous trouvez — ils peuvent émettre un laissez-passer d'urgence ou un titre de voyage provisoire.", contact: { label: 'Consulats de France à l\'étranger', url: 'https://www.diplomatie.gouv.fr/fr/le-ministere-et-son-reseau/annuaires-et-adresses-du-mae/ambassades-et-consulats' }, urgent: true },
      { ordre: 3, texte: "Pour le permis de conduire : contactez votre préfecture en France pour une attestation temporaire envoyée par email. Certains pays l'acceptent.", astuce: "Dans l'UE, un permis perdu/volé : rendez-vous à la police locale qui peut consulter les bases européennes pour confirmer votre droit à conduire." },
      { ordre: 4, texte: "Pour la carte grise perdue : contactez l'ANTS. Un certificat de situation administrative peut être émis en 24h.", contact: { label: 'ANTS — France', url: 'https://ants.gouv.fr' } },
      { ordre: 5, texte: "Annulez vos cartes bancaires volées depuis votre application bancaire ou en appelant le numéro opposition (numéro interbancaire : 0 892 705 705 depuis l'étranger).", contact: { label: 'Opposition CB — numéro interbancaire', numero: '+33 892 705 705' } },
    ],
    contactsGeneraux: [
      { label: 'Ambassades et consulats de France', url: 'https://www.diplomatie.gouv.fr/fr/le-ministere-et-son-reseau/annuaires-et-adresses-du-mae/ambassades-et-consulats' },
      { label: 'ANTS — démarches carte grise', url: 'https://ants.gouv.fr' },
      { label: 'Opposition CB interbancaire', numero: '+33 892 705 705' },
      { label: 'Votre assurance assistance', info: 'Peut prendre en charge rapatriement et hébergement' },
    ],
    checklistDepart: [
      "Photographiez tous vos documents avant de partir (passeport, permis, carte grise, carte verte)",
      "Envoyez ces photos par email à vous-même ou stockez sur cloud",
      "Notez les numéros d'opposition de vos cartes bancaires",
      "Gardez une photocopie papier dans un sac différent de l'original",
    ],
  },

  // ── 8. Radar flashé ───────────────────────────────────────────────────────
  {
    id: 'radar_flash',
    emoji: '📸',
    titre: "J'ai été flashé par un radar",
    sousTitre: "Radar fixe, mobile, de feu rouge — en France ou à l'étranger",
    urgence: 'sans_urgence',
    labelUrgence: 'Rien à faire dans l\'immédiat',
    description: "Être flashé ne signifie pas être coupable — le flash peut être déclenché par d'autres raisons. En France, 47 jours en moyenne entre l'infraction et la réception de l'avis. Votre avis de contravention arrivera par courrier.",
    erreursCourantes: [
      { erreur: "Contacter l'ANTAI ou la police pour 'se dénoncer' avant réception de l'avis", consequence: "Inutile et peut créer des complications. Attendez l'avis officiel." },
      { erreur: "Payer sans vérifier si le flash était légitime", consequence: "Des faux flashs existent (erreur de plaque, radar défectueux). Vérifiez les photos avant de payer." },
      { erreur: "Dépasser la date limite de paiement minoré", consequence: "L'amende passe au tarif plein (souvent +33%) puis majoré si non payée." },
    ],
    etapesGenerales: [
      { ordre: 1, texte: "Attendez la réception de l'avis de contravention — il arrive dans 30 à 60 jours en France par lettre simple.", astuce: "L'avis arrive à l'adresse du titulaire de la carte grise. Si vous avez déménagé, mettez à jour votre adresse sur l'ANTS." },
      { ordre: 2, texte: "À réception : vérifiez la photo si disponible sur l'avis. Vous pouvez accéder aux clichés radar sur le portail ANTAI.", contact: { label: 'ANTAI — portail amendes', url: 'https://www.antai.gouv.fr' } },
      { ordre: 3, texte: "Payez dans les 15 jours (tarif minoré -33%) ou 45 jours (tarif normal) ou contestez dans les 45 jours.", astuce: "Si vous étiez en location : vous pouvez dénoncer le conducteur réel sur l'avis ANTAI — obligatoire pour les entreprises, facultatif pour les particuliers." },
      { ordre: 4, texte: "Contestation : envoyez lettre recommandée avec AR à l'Officier du Ministère Public compétent (adresse sur l'avis). Joignez consignation (paiement sous réserve) ou demande de dispense.", alerte: "La contestation sans consignation entraîne majoratioon automatique. Payez 'sous réserve de contestation'." },
      { ordre: 5, texte: "Retrait de points : les points sont retirés seulement après traitement définitif (pas au flash). Vous pouvez vérifier votre solde sur telepoints.fr.", contact: { label: 'Télépoints — solde de points', url: 'https://www.telepoints.fr' } },
    ],
    parPays: [
      {
        paysCode: 'BE', flag: '🇧🇪', paysNom: 'Belgique',
        etapes: [
          { ordre: 1, texte: "Les radars belges transmettent directement les données à la DIV (direction de l'Immatriculation). Avis reçu dans 45–90 jours." },
          { ordre: 2, texte: "Paiement en ligne sur le portail Perceptions. Remise de 20% dans les 30 jours." },
          { ordre: 3, texte: "Contestation : courrier en néerlandais, français ou allemand selon la région, au parquet du procureur du roi compétent." },
        ],
        contacts: [{ label: 'Portail Perceptions Belgique', url: 'https://www.myminfin.be' }],
        delai: '30 jours avec remise, 60 jours plein tarif',
        montant: '50–500 € selon infraction',
      },
    ],
    contactsGeneraux: [
      { label: 'ANTAI — Portail amendes France', url: 'https://www.antai.gouv.fr' },
      { label: 'Télépoints — Solde de points', url: 'https://www.telepoints.fr' },
    ],
    checklistDepart: [
      "Vérifiez votre solde de points avant un long voyage",
      "Respectez les limitations variables (par temps de pluie : autoroute 110 km/h)",
      "Les radars pédagogiques (sans flash) n'entraînent aucune amende",
      "Radar mobile en voiture banalisée : légal et fréquent en France, Belgique et Suisse",
    ],
  },
]

// ── Helpers ───────────────────────────────────────────────────────────────────

export const LABEL_URGENCE: Record<NiveauUrgence, { label: string; color: string; bg: string }> = {
  immédiat:     { label: 'Immédiat', color: '#dc2626', bg: 'rgba(239,68,68,0.1)' },
  dans_24h:     { label: 'Dans les 24h', color: '#b45309', bg: 'rgba(234,179,8,0.1)' },
  dans_72h:     { label: 'Dans les 72h', color: '#7c3aed', bg: 'rgba(124,58,237,0.1)' },
  sans_urgence: { label: 'Pas d\'urgence', color: '#059669', bg: 'rgba(5,150,105,0.1)' },
}

export function getSituation(id: SituationId): Situation {
  return SITUATIONS.find(s => s.id === id)!
}
