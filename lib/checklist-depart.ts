// lib/checklist-depart.ts
// Check-list interactive avant départ vacances

export type ProfilVoyage =
  | 'famille'
  | 'bebe'
  | 'senior'
  | 'ev'
  | 'camping'
  | 'animaux'
  | 'long_courrier'   // > 500 km
  | 'etranger'

export interface InfoTrajet {
  distanceKm:      number
  heureDepart:     string       // "HH:MM"
  nbConducteurs:   number
  profils:         ProfilVoyage[]
  nbPassagers:     number
  autoroute:       boolean
}

// ── Item checklist ────────────────────────────────────────────────────────────

export interface CheckItem {
  id:          string
  categorie:   string
  texte:       string
  detail?:     string            // explication courte
  urgence?:    boolean           // rouge si non coché
  profils?:    ProfilVoyage[]    // undefined = tous les profils
  sousItems?:  string[]          // sous-points optionnels
}

// ── Catégories + items ────────────────────────────────────────────────────────

export const CHECKLIST_ITEMS: CheckItem[] = [

  // ── 1. Véhicule ────────────────────────────────────────────────────────────
  {
    id: 'pneus_pression',
    categorie: '🚗 Véhicule',
    texte: 'Pression des pneus vérifiée (+ roue de secours)',
    detail: 'Augmenter de 0,3 bar en charge pleine. Sous les tropiques : +5% par 10°C supplémentaires.',
    urgence: true,
  },
  {
    id: 'pneus_usure',
    categorie: '🚗 Véhicule',
    texte: 'Usure des pneus OK (témoin d\'usure non atteint)',
    detail: 'Profondeur minimale légale : 1,6 mm. En dessous, la tenue de route sur sol mouillé est compromise.',
    urgence: true,
  },
  {
    id: 'niveaux',
    categorie: '🚗 Véhicule',
    texte: 'Niveaux vérifiés : huile moteur, liquide de frein, lave-glace, liquide de refroidissement',
    urgence: true,
  },
  {
    id: 'carburant',
    categorie: '🚗 Véhicule',
    texte: 'Plein de carburant fait',
    detail: 'Ne partez jamais avec moins d\'un demi-plein — les autoroutes sont jusqu\'à 30% plus chères.',
  },
  {
    id: 'eclairage',
    categorie: '🚗 Véhicule',
    texte: 'Feux vérifiés (stop, clignotants, feux de recul)',
    detail: 'Demandez à quelqu\'un de vérifier les feux arrière pendant que vous actionnez.',
  },
  {
    id: 'essuie_glaces',
    categorie: '🚗 Véhicule',
    texte: 'Essuie-glaces en bon état, lave-glace plein',
  },
  {
    id: 'courroie',
    categorie: '🚗 Véhicule',
    texte: 'Kilométrage courroie de distribution vérifié',
    detail: 'Un casse de courroie en route = moteur mort. Vérifiez si vous approchez de l\'échéance.',
    urgence: true,
    profils: ['long_courrier'],
  },
  {
    id: 'clim',
    categorie: '🚗 Véhicule',
    texte: 'Climatisation testée (fonctionne, pas d\'odeur)',
    detail: 'Indispensable en été. Si le filtre habitacle n\'a pas été changé depuis 2 ans, c\'est le moment.',
  },

  // ── 2. Sécurité obligatoire ─────────────────────────────────────────────────
  {
    id: 'gilet_triangle',
    categorie: '🦺 Sécurité',
    texte: 'Gilet jaune homologué + triangle de signalisation dans l\'habitacle (pas dans le coffre)',
    detail: 'Obligatoire en France, Belgique, Espagne, Italie, Suisse. Accessible sans ouvrir le coffre.',
    urgence: true,
  },
  {
    id: 'trousse_secours',
    categorie: '🦺 Sécurité',
    texte: 'Trousse de secours complète à bord',
    detail: 'Obligatoire en Autriche, conseillé partout. Au minimum : pansements, antiseptique, gants.',
  },
  {
    id: 'extincteur',
    categorie: '🦺 Sécurité',
    texte: 'Extincteur à bord (vérifié, non périmé)',
    profils: ['camping', 'long_courrier'],
  },
  {
    id: 'crique_cablee',
    categorie: '🦺 Sécurité',
    texte: 'Cric + câbles de démarrage ou booster autonome',
    detail: 'Un booster lithium (50€) démarre votre véhicule sans autre voiture.',
  },

  // ── 3. Documents ────────────────────────────────────────────────────────────
  {
    id: 'permis',
    categorie: '📄 Documents',
    texte: 'Permis de conduire valide (non expiré)',
    urgence: true,
  },
  {
    id: 'carte_grise',
    categorie: '📄 Documents',
    texte: 'Carte grise originale dans le véhicule',
    urgence: true,
  },
  {
    id: 'carte_verte',
    categorie: '📄 Documents',
    texte: 'Carte verte d\'assurance valide',
    urgence: true,
  },
  {
    id: 'cni_passeport',
    categorie: '📄 Documents',
    texte: 'CNI / Passeport valide pour tous les passagers',
    urgence: true,
    profils: ['etranger'],
  },
  {
    id: 'docs_photo',
    categorie: '📄 Documents',
    texte: 'Photos des documents dans le téléphone (recto/verso)',
    detail: 'En cas de vol ou de perte, vous pouvez prouver votre identité.',
  },
  {
    id: 'constat',
    categorie: '📄 Documents',
    texte: 'Constat amiable européen vierge dans la boîte à gants',
    detail: 'Le constat bleu est valable dans toute l\'UE — cases numérotées identiques partout.',
  },
  {
    id: 'vignette_ch',
    categorie: '📄 Documents',
    texte: 'Vignette autoroutière suisse (40 CHF)',
    detail: 'Achetez-la à la frontière ou dans les stations-service suisses frontalières. Valable 1 an civil.',
    profils: ['etranger'],
  },
  {
    id: 'assurance_assistance',
    categorie: '📄 Documents',
    texte: 'Numéro d\'assistance routière noté (ou dans le téléphone)',
    detail: 'Trouvable au dos de votre carte verte. Souvent un numéro international disponible 24h/24.',
  },

  // ── 4. Navigation ────────────────────────────────────────────────────────────
  {
    id: 'gps_maj',
    categorie: '🗺️ Navigation',
    texte: 'GPS / application mise à jour (cartes récentes)',
    detail: 'Les travaux et restrictions de circulation changent régulièrement.',
  },
  {
    id: 'itineraire_alt',
    categorie: '🗺️ Navigation',
    texte: 'Itinéraire alternatif identifié en cas de bouchon',
  },
  {
    id: 'hors_ligne',
    categorie: '🗺️ Navigation',
    texte: 'Carte hors-ligne téléchargée (zones sans réseau)',
    detail: 'Google Maps, Maps.me ou OsmAnd permettent le téléchargement hors-ligne.',
    profils: ['etranger', 'long_courrier'],
  },
  {
    id: 'meteo_verif',
    categorie: '🗺️ Navigation',
    texte: 'Météo vérifiée sur le trajet (7 jours)',
    detail: 'Consultez Météo-France ou notre Assistance Météo pour les alertes sur votre route.',
  },
  {
    id: 'peages',
    categorie: '🗺️ Navigation',
    texte: 'Budget péages estimé, CB ou badge télépéage préparé',
    detail: 'Via Michelin donne une estimation précise des péages par trajet.',
  },

  // ── 5. Bagages & chargement ──────────────────────────────────────────────────
  {
    id: 'bagages_fixes',
    categorie: '🧳 Bagages',
    texte: 'Bagages correctement arrimés (rien ne peut se déplacer en freinage)',
    urgence: true,
    detail: 'Un objet de 5 kg à 130 km/h devient un projectile de 1 000 N en cas de freinage d\'urgence.',
  },
  {
    id: 'galerie_fixee',
    categorie: '🧳 Bagages',
    texte: 'Galerie de toit / porte-vélos fixée et verrouillée',
    profils: ['famille', 'camping', 'long_courrier'],
  },
  {
    id: 'poids_ptac',
    categorie: '🧳 Bagages',
    texte: 'Poids total vérifié — PTAC et charge par essieu respectés',
    detail: 'Dépasser le PTAC = amende + risque de refus de prise en charge par l\'assurance.',
    profils: ['camping'],
  },
  {
    id: 'objets_habitacle',
    categorie: '🧳 Bagages',
    texte: 'Aucun objet non fixé dans l\'habitacle (siège arrière, tableau de bord)',
    urgence: true,
    detail: 'Une bouteille d\'eau, des lunettes ou une tablette deviennent dangereux en cas de choc.',
  },
  {
    id: 'valeur_cachee',
    categorie: '🧳 Bagages',
    texte: 'Aucune valeur visible dans le véhicule (ordinateurs, sacs)',
    detail: 'Les vols à la roulotte ont lieu en quelques secondes. Coffre ou maison.',
    profils: ['etranger'],
  },

  // ── 6. Confort & santé ──────────────────────────────────────────────────────
  {
    id: 'eau_provisions',
    categorie: '💧 Confort & santé',
    texte: 'Eau et provisions pour le trajet',
    detail: 'Au moins 0,5 L d\'eau par personne et par heure de trajet prévu.',
  },
  {
    id: 'medicaments',
    categorie: '💧 Confort & santé',
    texte: 'Médicaments personnels emportés (ordonnance si > 3 mois de traitement)',
    urgence: true,
  },
  {
    id: 'mal_route',
    categorie: '💧 Confort & santé',
    texte: 'Médicament anti-mal de voiture si passager sensible',
    detail: 'À prendre 30 min avant le départ pour les patch Scopoderm ou comprimés Nausicalm.',
  },
  {
    id: 'cremes_soleil',
    categorie: '💧 Confort & santé',
    texte: 'Crème solaire SPF 50 accessible dans l\'habitacle',
    detail: 'Vitres de voiture ne filtrent pas tous les UV. SPF sur les avant-bras et le visage.',
  },
  {
    id: 'chargeurs',
    categorie: '💧 Confort & santé',
    texte: 'Chargeurs téléphones + powerbank chargé',
  },

  // ── 7. Profil BÉBÉ ──────────────────────────────────────────────────────────
  {
    id: 'siege_bebe_homologue',
    categorie: '🍼 Bébé & Enfants',
    texte: 'Siège auto homologué (norme R129 ou ECE R44), bien fixé et testé',
    urgence: true,
    profils: ['bebe'],
    detail: 'Vérifiez la date d\'expiration du siège (généralement 6 ans). Siège dos-à-la-route jusqu\'à 15 mois minimum.',
  },
  {
    id: 'siege_enfant',
    categorie: '🍼 Bébé & Enfants',
    texte: 'Siège rehausseur adapté au poids et à la taille de l\'enfant',
    profils: ['bebe', 'famille'],
  },
  {
    id: 'trousse_bebe',
    categorie: '🍼 Bébé & Enfants',
    texte: 'Trousse médicale bébé (thermomètre, paracétamol adapté au poids, SRO)',
    urgence: true,
    profils: ['bebe'],
  },
  {
    id: 'lait_couches',
    categorie: '🍼 Bébé & Enfants',
    texte: 'Lait maternel / lait en poudre habituel + couches en quantité suffisante',
    detail: 'Comptez 20–30% de plus que prévu — les voyages perturbent les rythmes.',
    profils: ['bebe'],
  },
  {
    id: 'vêtements_rechange_bebe',
    categorie: '🍼 Bébé & Enfants',
    texte: 'Vêtements de rechange bébé accessibles dans l\'habitacle (pas dans le coffre)',
    profils: ['bebe'],
  },
  {
    id: 'activites_enfants',
    categorie: '🍼 Bébé & Enfants',
    texte: 'Activités / jeux pour les enfants (tablette chargée, livres, jouets)',
    profils: ['bebe', 'famille'],
  },
  {
    id: 'pare_soleil_vitre',
    categorie: '🍼 Bébé & Enfants',
    texte: 'Pare-soleil sur les vitres latérales côté bébé',
    detail: 'La vitre latérale arrière peut exposer le bébé à un soleil direct pendant des heures.',
    profils: ['bebe'],
  },
  {
    id: 'repas_enfants',
    categorie: '🍼 Bébé & Enfants',
    texte: 'Repas et snacks pour les enfants prêts à portée de main',
    profils: ['bebe', 'famille'],
  },

  // ── 8. Profil VE ────────────────────────────────────────────────────────────
  {
    id: 'ev_charge_depart',
    categorie: '⚡ Véhicule Électrique',
    texte: 'Véhicule chargé à 100% (ou 80% si batterie dégradée) avant départ',
    urgence: true,
    profils: ['ev'],
  },
  {
    id: 'ev_bornes_planifiees',
    categorie: '⚡ Véhicule Électrique',
    texte: 'Étapes de recharge planifiées sur l\'itinéraire (ABRP, Chargemap, ou GPS intégré)',
    urgence: true,
    profils: ['ev'],
    detail: 'Planifiez 2 options par étape en cas de borne en panne. Ciblez les DC rapides (50 kW min).',
  },
  {
    id: 'ev_apps',
    categorie: '⚡ Véhicule Électrique',
    texte: 'Applications de recharge téléchargées et comptes activés (Ionity, TOTAL, Chargemap…)',
    profils: ['ev'],
    detail: 'Vérifiez que votre carte ou badge de recharge fonctionne — rechargez votre solde si prépayé.',
  },
  {
    id: 'ev_cable',
    categorie: '⚡ Véhicule Électrique',
    texte: 'Câble Type 2 dans le véhicule + câble Mode 2 (prise domestique d\'urgence)',
    profils: ['ev'],
    detail: 'Le câble Mode 2 vous permet de recharger sur une prise ordinaire — lent mais dépannage.',
  },
  {
    id: 'ev_adaptateurs',
    categorie: '⚡ Véhicule Électrique',
    texte: 'Adaptateurs vérifiés selon le pays de destination (CCS, CHAdeMO, Type 2)',
    profils: ['ev'],
    profils_detail: 'En dehors de France/Europe, les standards varient.',
  },
  {
    id: 'ev_autonomie_meteo',
    categorie: '⚡ Véhicule Électrique',
    texte: 'Autonomie recalculée avec la météo (–25% en hiver, –15% autoroute)',
    profils: ['ev'],
    detail: 'En dessous de 5°C : prévoyez 30–35% d\'autonomie en moins. La climatisation consomme aussi.',
  },
  {
    id: 'ev_assurance_panne',
    categorie: '⚡ Véhicule Électrique',
    texte: 'Couverture assistance "panne d\'énergie" vérifiée (recharge mobile ou dépannage)',
    profils: ['ev'],
    detail: 'Certaines assurances ne couvrent pas la panne sèche VE — vérifiez votre contrat.',
    urgence: true,
  },

  // ── 9. Profil CAMPING ────────────────────────────────────────────────────────
  {
    id: 'camping_gaz',
    categorie: '⛺ Camping',
    texte: 'Bouteille de gaz / réchaud vérifiés (pas de fuite)',
    urgence: true,
    profils: ['camping'],
  },
  {
    id: 'camping_electricite',
    categorie: '⛺ Camping',
    texte: 'Rallonge électrique camping + adaptateur CEE 17 (borne camping)',
    profils: ['camping'],
  },
  {
    id: 'camping_permis',
    categorie: '⛺ Camping',
    texte: 'Permis camping international (camping-cars) + assurance spécifique',
    profils: ['camping'],
  },
  {
    id: 'camping_eaux',
    categorie: '⛺ Camping',
    texte: 'Eaux usées vidangées, eaux propres remplies avant départ',
    profils: ['camping'],
  },

  // ── 10. Profil ANIMAUX ───────────────────────────────────────────────────────
  {
    id: 'animal_cage_harnais',
    categorie: '🐕 Animaux',
    texte: 'Cage homologuée ou harnais de sécurité attaché à la ceinture',
    urgence: true,
    profils: ['animaux'],
    detail: 'Un animal non attaché est un projectile dangereux en cas de freinage d\'urgence.',
  },
  {
    id: 'animal_passeport',
    categorie: '🐕 Animaux',
    texte: 'Passeport européen + carnet de vaccination à jour (rage obligatoire)',
    urgence: true,
    profils: ['animaux'],
    detail: 'Obligatoire pour traverser les frontières UE avec un animal de compagnie.',
  },
  {
    id: 'animal_puce',
    categorie: '🐕 Animaux',
    texte: 'Puce électronique vérifiée (lisible, numéro noté)',
    profils: ['animaux'],
  },
  {
    id: 'animal_antiparasitaires',
    categorie: '🐕 Animaux',
    texte: 'Antiparasitaires récents (tiques, puces) selon la destination',
    profils: ['animaux'],
  },
  {
    id: 'animal_eau_gamelle',
    categorie: '🐕 Animaux',
    texte: 'Eau et gamelle accessibles dans l\'habitacle',
    profils: ['animaux'],
  },
  {
    id: 'animal_trousse_veto',
    categorie: '🐕 Animaux',
    texte: 'Numéro vétérinaire local noté + trousse médicale animaux',
    profils: ['animaux'],
  },

  // ── 11. Profil SENIOR ─────────────────────────────────────────────────────────
  {
    id: 'senior_medicaments',
    categorie: '👴 Senior',
    texte: 'Médicaments chroniques en quantité suffisante + ordonnance en DCI',
    urgence: true,
    profils: ['senior'],
    detail: 'Ordonnance en DCI (dénomination commune internationale) pour la reconnaître à l\'étranger.',
  },
  {
    id: 'senior_bas_contention',
    categorie: '👴 Senior',
    texte: 'Bas de contention portés (prévention thrombose en voiture)',
    profils: ['senior'],
  },
  {
    id: 'senior_assurance',
    categorie: '👴 Senior',
    texte: 'Vérification plafond d\'âge de l\'assurance voyage',
    profils: ['senior'],
    detail: 'Certains contrats ont un plafond à 70 ou 75 ans. Vérifiez avant de partir.',
    urgence: true,
  },

  // ── 12. Long courrier ─────────────────────────────────────────────────────────
  {
    id: 'long_revision',
    categorie: '🛣️ Long courrier',
    texte: 'Révision faite si > 1 000 km et kilométrage entretien dépassé',
    urgence: true,
    profils: ['long_courrier'],
  },
  {
    id: 'long_pneus_secours',
    categorie: '🛣️ Long courrier',
    texte: 'Roue de secours gonflée ou kit de réparation pneu vérifié',
    profils: ['long_courrier'],
  },
]

// ── Calcul fatigue conducteur ─────────────────────────────────────────────────

export interface ResultatFatigue {
  niveauFatigue: 'faible' | 'modere' | 'eleve' | 'critique'
  score:         number     // 0–100 (100 = critique)
  alertes:       string[]
  conseils:      string[]
  dureeTotale:   number     // heures estimées
}

export function evaluerFatigue(trajet: InfoTrajet): ResultatFatigue {
  let score = 0
  const alertes: string[] = []
  const conseils: string[] = []

  // Vitesse moyenne estimée
  const vitesseMoy = trajet.autoroute ? 100 : 75
  const dureeTotale = trajet.distanceKm / vitesseMoy

  // Distance
  if (trajet.distanceKm > 800) { score += 30; alertes.push(`Trajet de ${trajet.distanceKm} km — plus de 8h de route. Fortement conseillé de faire 2 jours.`) }
  else if (trajet.distanceKm > 500) { score += 20; alertes.push(`Trajet de ${trajet.distanceKm} km — prévoir au moins 2 pauses de 15 min minimum.`) }
  else if (trajet.distanceKm > 300) { score += 10 }

  // Heure de départ
  const [heure] = trajet.heureDepart.split(':').map(Number)
  if (heure >= 22 || heure < 5) {
    score += 35
    alertes.push(`Départ nocturne (${trajet.heureDepart}) — le risque d'accident est 3x plus élevé entre minuit et 6h. Vigilance maximale.`)
    conseils.push("Faites une courte sieste de 20 min avant de partir si vous partez la nuit.")
  } else if (heure >= 13 && heure <= 16) {
    score += 15
    alertes.push(`Départ en début d'après-midi — la somnolence post-prandiale (13h–16h) est un pic d'accidents.`)
    conseils.push("Évitez de partir juste après un repas copieux. Préférez partir le matin.")
  }

  // Conducteur unique sur long trajet
  if (trajet.nbConducteurs === 1 && trajet.distanceKm > 400) {
    score += 20
    alertes.push("Conducteur unique sur > 400 km — pas de relève possible. Pauses obligatoires toutes les 2h.")
    conseils.push("Boire du café aide 30–45 min, pas plus. La seule vraie solution à la somnolence : la sieste de 20 min.")
  }

  // Avec bébé/enfants (trajets plus épuisants)
  if (trajet.profils.includes('bebe')) {
    score += 10
    conseils.push("Avec un bébé : prévoyez des arrêts flexibles pour allaitement ou change. Ne forcez pas le timing.")
  }

  const niveau: ResultatFatigue['niveauFatigue'] =
    score >= 60 ? 'critique' :
    score >= 35 ? 'eleve' :
    score >= 15 ? 'modere' : 'faible'

  if (niveau === 'faible') conseils.push("Conditions de départ favorables. Respectez quand même les pauses toutes les 2h.")
  if (niveau === 'modere') conseils.push("Partez reposé. Évitez les repas lourds avant de prendre le volant.")
  if (niveau === 'eleve') conseils.push("Envisagez de décaler l'heure de départ ou de partager la conduite.")
  if (niveau === 'critique') {
    conseils.push("Ce profil présente des risques sérieux. Repensez l'organisation du trajet.")
    conseils.push("Alternative : trajet en 2 jours avec une nuit à mi-parcours.")
  }

  return { niveauFatigue: niveau, score: Math.min(100, score), alertes, conseils, dureeTotale }
}

// ── Calcul pauses intelligentes ───────────────────────────────────────────────

export interface Pause {
  apresKm:     number
  apresHeures: number
  dureeMin:    number
  raison:      string
  conseil:     string
}

export function calculerPauses(trajet: InfoTrajet): Pause[] {
  const pauses: Pause[] = []
  const vitesseMoy = trajet.autoroute ? 100 : 75
  const intervalleKm = trajet.profils.includes('bebe') ? 150 : trajet.profils.includes('animaux') ? 150 : 200
  const intervalleH  = trajet.profils.includes('bebe') ? 1.5 : 2

  let kmParcourus = 0
  let heuresParcourues = 0
  let numeroPause = 1

  while (kmParcourus + intervalleKm < trajet.distanceKm) {
    kmParcourus     += intervalleKm
    heuresParcourues = kmParcourus / vitesseMoy

    const [hDep] = trajet.heureDepart.split(':').map(Number)
    const heureArrivee = (hDep + heuresParcourues) % 24
    const estRepas = (heureArrivee >= 12 && heureArrivee <= 13.5) || (heureArrivee >= 19 && heureArrivee <= 20.5)
    const estNuit  = heureArrivee >= 23 || heureArrivee < 5

    const duree = estRepas ? 45 : estNuit ? 30 : 15

    let raison = `Pause ${numeroPause} — après ${kmParcourus} km`
    let conseil = "Profitez-en pour vous dégourdir les jambes, boire, et faire le plein si besoin."

    if (estRepas) {
      raison = `Pause repas — après ${kmParcourus} km (${Math.round(heureArrivee)}h)`
      conseil = "Repas léger de préférence — un repas lourd amplifie la somnolence post-prandiale."
    }
    if (estNuit) {
      raison = `⚠️ Pause nocturne obligatoire — après ${kmParcourus} km`
      conseil = "La somnolence nocturne est maximale. Sieste de 20 min dans l'aire ou un hôtel à proximité."
    }
    if (trajet.profils.includes('bebe')) {
      conseil += " Profitez-en pour vérifier le bébé, donner à boire ou changer."
    }
    if (trajet.profils.includes('ev')) {
      conseil += " Vérifiez les bornes de recharge disponibles sur cette section."
    }

    pauses.push({ apresKm: kmParcourus, apresHeures: heuresParcourues, dureeMin: duree, raison, conseil })
    numeroPause++
  }

  return pauses
}

// ── Filtrer items selon profil ────────────────────────────────────────────────

export function filtrerItems(trajet: InfoTrajet): CheckItem[] {
  return CHECKLIST_ITEMS.filter(item => {
    if (!item.profils) return true // item universel
    return item.profils.some(p => trajet.profils.includes(p))
  })
}

export function grouperParCategorie(items: CheckItem[]): Map<string, CheckItem[]> {
  const map = new Map<string, CheckItem[]>()
  for (const item of items) {
    if (!map.has(item.categorie)) map.set(item.categorie, [])
    map.get(item.categorie)!.push(item)
  }
  return map
}

// ── Labels ────────────────────────────────────────────────────────────────────

export const LABEL_PROFIL: Record<ProfilVoyage, string> = {
  famille:      'Famille',
  bebe:         'Bébé / Nourrisson',
  senior:       'Senior (65+)',
  ev:           'Véhicule électrique',
  camping:      'Camping-car / Caravane',
  animaux:      'Avec animaux',
  long_courrier: 'Long courrier (> 500 km)',
  etranger:     'À l\'étranger',
}

export const EMOJI_PROFIL: Record<ProfilVoyage, string> = {
  famille:      '👨‍👩‍👧',
  bebe:         '🍼',
  senior:       '👴',
  ev:           '⚡',
  camping:      '⛺',
  animaux:      '🐕',
  long_courrier: '🛣️',
  etranger:     '🌍',
}

export const COULEUR_FATIGUE: Record<ResultatFatigue['niveauFatigue'], string> = {
  faible:   '#059669',
  modere:   '#f59e0b',
  eleve:    '#ea580c',
  critique: '#dc2626',
}

export const LABEL_FATIGUE: Record<ResultatFatigue['niveauFatigue'], string> = {
  faible:   'Faible — conditions favorables',
  modere:   'Modéré — restez vigilant',
  eleve:    'Élevé — adaptez votre organisation',
  critique: 'Critique — repensez ce trajet',
}
