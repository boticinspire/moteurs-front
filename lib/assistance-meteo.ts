// lib/assistance-meteo.ts
// Assistance Météo & Itinéraire — Open-Meteo API (gratuite, sans clé)

// ── Types ─────────────────────────────────────────────────────────────────────

export interface Ville {
  nom:     string
  pays:    string
  flag:    string
  lat:     number
  lon:     number
  alt?:    number   // altitude en m (montagne)
}

export type NiveauAlerte = 'ok' | 'attention' | 'danger'

export interface MeteoJour {
  date:             string        // ISO YYYY-MM-DD
  jourSemaine:      string
  tempMax:          number
  tempMin:          number
  precipitations:   number        // mm
  ventMax:          number        // km/h
  codeMeteo:        number        // WMO weather code
  labelMeteo:       string
  emoji:            string
  niveauAlerte:     NiveauAlerte
  alertes:          string[]
  conseilsConduite: string[]
  scoreConducte:    number        // 0–10 (10 = conditions parfaites)
}

export interface ResultatMeteo {
  depart:      Ville
  destination: Ville | null
  previsions:  MeteoJour[]
  meilleurJour: MeteoJour | null
  alertesGlobales: string[]
  resume:      string
}

// ── WMO weather codes → label + emoji ────────────────────────────────────────

export function decoderCodeMeteo(code: number): { label: string; emoji: string } {
  if (code === 0)            return { label: 'Ciel dégagé',         emoji: '☀️' }
  if (code <= 2)             return { label: 'Peu nuageux',          emoji: '🌤️' }
  if (code === 3)            return { label: 'Couvert',              emoji: '☁️' }
  if (code <= 49)            return { label: 'Brouillard',           emoji: '🌫️' }
  if (code <= 55)            return { label: 'Bruine',               emoji: '🌦️' }
  if (code <= 57)            return { label: 'Bruine verglçante',    emoji: '🌨️' }
  if (code <= 61)            return { label: 'Pluie légère',         emoji: '🌧️' }
  if (code <= 63)            return { label: 'Pluie modérée',        emoji: '🌧️' }
  if (code <= 65)            return { label: 'Pluie forte',          emoji: '🌧️' }
  if (code <= 67)            return { label: 'Pluie verglaçante',    emoji: '🌨️' }
  if (code <= 71)            return { label: 'Neige légère',         emoji: '🌨️' }
  if (code <= 73)            return { label: 'Neige modérée',        emoji: '❄️' }
  if (code <= 75)            return { label: 'Neige forte',          emoji: '❄️' }
  if (code === 77)           return { label: 'Grains de neige',      emoji: '🌨️' }
  if (code <= 82)            return { label: 'Averses',              emoji: '🌦️' }
  if (code <= 84)            return { label: 'Averses de grêle',     emoji: '⛈️' }
  if (code <= 86)            return { label: 'Averses de neige',     emoji: '🌨️' }
  if (code <= 99)            return { label: 'Orage',                emoji: '⛈️' }
  return                            { label: 'Inconnu',              emoji: '🌡️' }
}

// ── Analyse météo → alertes + conseils conduite ───────────────────────────────

export function analyserJour(
  date: string,
  tempMax: number, tempMin: number,
  precip: number, vent: number, code: number,
): MeteoJour {
  const { label, emoji } = decoderCodeMeteo(code)
  const alertes: string[] = []
  const conseils: string[] = []
  let niveau: NiveauAlerte = 'ok'
  let score = 10

  // Température
  if (tempMax >= 40) {
    alertes.push(`🌡️ Canicule extrême — ${tempMax}°C. Danger pour les passagers (enfants, animaux).`)
    conseils.push("Partez avant 9h ou après 19h. Vérifiez la climatisation. Hydratez fréquemment.")
    niveau = 'danger'; score -= 4
  } else if (tempMax >= 35) {
    alertes.push(`🌡️ Forte chaleur — ${tempMax}°C. Risque de surchauffe moteur et coup de chaleur.`)
    conseils.push("Pauses régulières à l'ombre. Jamais d'enfants ou animaux seuls dans le véhicule.")
    if (niveau === 'ok') niveau = 'attention'; score -= 2
  }
  if (tempMin <= -5) {
    alertes.push(`❄️ Gel — ${tempMin}°C. Chaussées verglaçées possible le matin.`)
    conseils.push("Pneus hiver ou chaînes. Comptez +30% de temps de trajet. Décollage à la dégivre.")
    niveau = 'danger'; score -= 3
  } else if (tempMin <= 2) {
    alertes.push(`🧊 Risque de verglas matinal — ${tempMin}°C.`)
    conseils.push("Prudence sur les ponts et zones ombragées. Réduisez la vitesse de 20%.")
    if (niveau === 'ok') niveau = 'attention'; score -= 1
  }

  // Précipitations
  if (precip >= 20) {
    alertes.push(`🌊 Fortes pluies — ${precip} mm. Risque d'aquaplaning sur autoroute.`)
    conseils.push("Vitesse limitée à 110 km/h sur autoroute par arrêté. Distance de sécurité x3. Phares allumés.")
    niveau = 'danger'; score -= 3
  } else if (precip >= 5) {
    alertes.push(`🌧️ Pluie significative — ${precip} mm.`)
    conseils.push("Réduisez la vitesse, augmentez la distance de sécurité. Vérifiez vos essuie-glaces.")
    if (niveau === 'ok') niveau = 'attention'; score -= 1
  }

  // Vent
  if (vent >= 90) {
    alertes.push(`💨 Vent violent — ${vent} km/h. Danger pour poids lourds et camping-cars.`)
    conseils.push("Évitez les ponts et zones exposées. Tenez fermement le volant. Camping-cars : ne circulez pas.")
    niveau = 'danger'; score -= 4
  } else if (vent >= 60) {
    alertes.push(`💨 Vent fort — ${vent} km/h. Tenue de route affectée.`)
    conseils.push("Vitesse réduite sur les zones exposées (cols, ponts, littoral).")
    if (niveau === 'ok') niveau = 'attention'; score -= 2
  } else if (vent >= 40) {
    score -= 1
  }

  // Code météo (orage, neige, brouillard)
  if (code >= 95) {
    alertes.push("⛈️ Orage — visibilité réduite, éclairs sur route possible.")
    conseils.push("Si orage électrique en voiture : fermez les fenêtres, ne touchez pas les éléments métalliques.")
    niveau = 'danger'; score -= 3
  } else if (code >= 71 && code <= 77) {
    alertes.push("❄️ Chutes de neige — routes enneigées probables.")
    conseils.push("Pneus neige obligatoires. Limitez-vous à 60 km/h. Habillez-vous chaudement en cas de panne.")
    niveau = 'danger'; score -= 4
  } else if (code >= 40 && code <= 49) {
    alertes.push("🌫️ Brouillard — visibilité inférieure à 50 m possible.")
    conseils.push("Feux de brouillard avant. Vitesse ≤ 50 km/h en visibilité < 50 m. Ne doublez pas.")
    if (niveau === 'ok') niveau = 'attention'; score -= 2
  }

  const score_final = Math.max(0, Math.min(10, score))

  // Jour de la semaine
  const date_obj = new Date(date)
  const JOURS = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi']
  const jourSemaine = JOURS[date_obj.getDay()]

  return {
    date, jourSemaine,
    tempMax, tempMin, precipitations: precip, ventMax: vent,
    codeMeteo: code, labelMeteo: label, emoji,
    niveauAlerte: niveau,
    alertes,
    conseilsConduite: conseils,
    scoreConducte: score_final,
  }
}

// ── Fetch Open-Meteo (appelé côté client) ─────────────────────────────────────

export interface OpenMeteoResponse {
  daily: {
    time:                     string[]
    temperature_2m_max:       number[]
    temperature_2m_min:       number[]
    precipitation_sum:        number[]
    wind_speed_10m_max:       number[]
    weather_code:             number[]
  }
}

export async function fetchMeteo(lat: number, lon: number): Promise<MeteoJour[]> {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,wind_speed_10m_max&wind_speed_unit=kmh&forecast_days=7&timezone=auto`
  const res = await fetch(url)
  if (!res.ok) throw new Error('Erreur API météo')
  const data: OpenMeteoResponse = await res.json()
  const { daily } = data
  return daily.time.map((date, i) => analyserJour(
    date,
    daily.temperature_2m_max[i],
    daily.temperature_2m_min[i],
    daily.precipitation_sum[i],
    daily.wind_speed_10m_max[i],
    daily.weather_code[i],
  ))
}

// ── Villes populaires ─────────────────────────────────────────────────────────

export const VILLES_POPULAIRES: Ville[] = [
  // France
  { nom: 'Paris',        pays: 'France',      flag: '🇫🇷', lat: 48.8566,  lon: 2.3522  },
  { nom: 'Lyon',         pays: 'France',      flag: '🇫🇷', lat: 45.7640,  lon: 4.8357  },
  { nom: 'Marseille',    pays: 'France',      flag: '🇫🇷', lat: 43.2965,  lon: 5.3698  },
  { nom: 'Bordeaux',     pays: 'France',      flag: '🇫🇷', lat: 44.8378,  lon: -0.5792 },
  { nom: 'Toulouse',     pays: 'France',      flag: '🇫🇷', lat: 43.6047,  lon: 1.4442  },
  { nom: 'Nice',         pays: 'France',      flag: '🇫🇷', lat: 43.7102,  lon: 7.2620  },
  { nom: 'Nantes',       pays: 'France',      flag: '🇫🇷', lat: 47.2184,  lon: -1.5536 },
  { nom: 'Strasbourg',   pays: 'France',      flag: '🇫🇷', lat: 48.5734,  lon: 7.7521  },
  { nom: 'Rennes',       pays: 'France',      flag: '🇫🇷', lat: 48.1173,  lon: -1.6778 },
  { nom: 'Montpellier',  pays: 'France',      flag: '🇫🇷', lat: 43.6119,  lon: 3.8772  },
  // Destinations vacances France
  { nom: 'Biarritz',     pays: 'France',      flag: '🇫🇷', lat: 43.4832,  lon: -1.5586 },
  { nom: 'Chamonix',     pays: 'France',      flag: '🇫🇷', lat: 45.9237,  lon: 6.8694, alt: 1035 },
  { nom: 'Avignon',      pays: 'France',      flag: '🇫🇷', lat: 43.9493,  lon: 4.8059  },
  { nom: 'La Rochelle',  pays: 'France',      flag: '🇫🇷', lat: 46.1591,  lon: -1.1520 },
  { nom: 'Brest',        pays: 'France',      flag: '🇫🇷', lat: 48.3904,  lon: -4.4861 },
  // Belgique
  { nom: 'Bruxelles',    pays: 'Belgique',    flag: '🇧🇪', lat: 50.8503,  lon: 4.3517  },
  { nom: 'Bruges',       pays: 'Belgique',    flag: '🇧🇪', lat: 51.2093,  lon: 3.2247  },
  // Suisse
  { nom: 'Genève',       pays: 'Suisse',      flag: '🇨🇭', lat: 46.2044,  lon: 6.1432  },
  { nom: 'Zurich',       pays: 'Suisse',      flag: '🇨🇭', lat: 47.3769,  lon: 8.5417  },
  { nom: 'Zermatt',      pays: 'Suisse',      flag: '🇨🇭', lat: 46.0207,  lon: 7.7491, alt: 1608 },
  // Espagne
  { nom: 'Barcelone',    pays: 'Espagne',     flag: '🇪🇸', lat: 41.3851,  lon: 2.1734  },
  { nom: 'Madrid',       pays: 'Espagne',     flag: '🇪🇸', lat: 40.4168,  lon: -3.7038 },
  { nom: 'Séville',      pays: 'Espagne',     flag: '🇪🇸', lat: 37.3891,  lon: -5.9845 },
  { nom: 'Valence',      pays: 'Espagne',     flag: '🇪🇸', lat: 39.4699,  lon: -0.3763 },
  // Italie
  { nom: 'Rome',         pays: 'Italie',      flag: '🇮🇹', lat: 41.9028,  lon: 12.4964 },
  { nom: 'Milan',        pays: 'Italie',      flag: '🇮🇹', lat: 45.4654,  lon: 9.1859  },
  { nom: 'Florence',     pays: 'Italie',      flag: '🇮🇹', lat: 43.7696,  lon: 11.2558 },
  { nom: 'Venise',       pays: 'Italie',      flag: '🇮🇹', lat: 45.4408,  lon: 12.3155 },
  // Portugal
  { nom: 'Lisbonne',     pays: 'Portugal',    flag: '🇵🇹', lat: 38.7223,  lon: -9.1393 },
  { nom: 'Porto',        pays: 'Portugal',    flag: '🇵🇹', lat: 41.1579,  lon: -8.6291 },
  // Maroc
  { nom: 'Marrakech',    pays: 'Maroc',       flag: '🇲🇦', lat: 31.6295,  lon: -7.9811 },
  { nom: 'Agadir',       pays: 'Maroc',       flag: '🇲🇦', lat: 30.4278,  lon: -9.5981 },
  // Tunisie
  { nom: 'Tunis',        pays: 'Tunisie',     flag: '🇹🇳', lat: 36.8065,  lon: 10.1815 },
  // Autres
  { nom: 'Amsterdam',    pays: 'Pays-Bas',    flag: '🇳🇱', lat: 52.3676,  lon: 4.9041  },
  { nom: 'Berlin',       pays: 'Allemagne',   flag: '🇩🇪', lat: 52.5200,  lon: 13.4050 },
  { nom: 'Londres',      pays: 'Royaume-Uni', flag: '🇬🇧', lat: 51.5072,  lon: -0.1276 },
]

// ── Géocodage simplifié par texte libre ──────────────────────────────────────

export function rechercherVille(query: string): Ville[] {
  const q = query.toLowerCase().trim()
  if (!q) return []
  return VILLES_POPULAIRES.filter(v =>
    v.nom.toLowerCase().includes(q) || v.pays.toLowerCase().includes(q)
  ).slice(0, 6)
}

// ── Fetch géocodage Open-Meteo (pour les villes non listées) ─────────────────

export interface GeocodingResult {
  results?: {
    name:      string
    country:   string
    latitude:  number
    longitude: number
    elevation: number
  }[]
}

export async function geocoderVille(query: string): Promise<Ville | null> {
  // D'abord chercher dans la liste locale
  const local = rechercherVille(query)
  if (local.length > 0) return local[0]

  // Sinon appel API
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=1&language=fr`
  try {
    const res = await fetch(url)
    const data: GeocodingResult = await res.json()
    if (!data.results?.length) return null
    const r = data.results[0]
    return {
      nom: r.name,
      pays: r.country,
      flag: '📍',
      lat: r.latitude,
      lon: r.longitude,
      alt: r.elevation,
    }
  } catch {
    return null
  }
}

// ── Score couleur ─────────────────────────────────────────────────────────────

export function couleurScore(score: number): string {
  if (score >= 8) return '#059669'
  if (score >= 5) return '#f59e0b'
  return '#dc2626'
}

export function labelScore(score: number): string {
  if (score >= 8) return 'Excellent'
  if (score >= 6) return 'Bon'
  if (score >= 4) return 'Moyen'
  return 'Difficile'
}

// ── Formatage date française ──────────────────────────────────────────────────

export function formatDateFr(iso: string): string {
  const d = new Date(iso + 'T12:00:00')
  return d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })
}
