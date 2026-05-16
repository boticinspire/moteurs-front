/**
 * Moteurs.com — Moteur de calcul coût de trajet vacances
 * Calcule le coût réel d'un trajet routier selon la motorisation.
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export type MotorisationTrajet = 'diesel' | 'essence' | 'elec' | 'phev'

export interface Route {
  slug: string
  depart: string
  arrivee: string
  distance_km: number
  peages_eur: number
  duree_base_min: number
  pays_depart: string
  region?: string
  popular?: boolean
}

export interface ResultatTrajet {
  id: MotorisationTrajet
  label: string
  emoji: string
  couleur: string
  cout_energie: number
  cout_peages: number
  cout_total: number
  duree_min: number
  nb_arrets_recharge: number
  temps_recharge_min: number
  conso_detail: string
  gagnant?: boolean
}

// ─── Prix énergie (autoroute, vacances) ─────────────────────────────────────

export const PRIX_ENERGIE = {
  diesel:      1.72,  // €/L (prix pompe autoroute)
  essence:     1.82,  // €/L
  elec_blended: 0.33, // €/kWh (mix domicile 0.21 + borne DC rapide 0.45)
  elec_home:   0.21,  // €/kWh (recharge domicile)
}

// ─── Profils véhicule typiques ────────────────────────────────────────────────
// Consommations en autoroute (plus élevées qu'en cycle mixte)

interface ProfilDiesel {
  id: 'diesel'; motorisation: 'diesel'
  conso_l100: number
}
interface ProfilEssence {
  id: 'essence'; motorisation: 'essence'
  conso_l100: number
}
interface ProfilElec {
  id: 'elec'; motorisation: 'elec'
  conso_kwh100: number
  autonomie_km: number       // autonomie réelle autoroute (80% batterie utilisable)
  temps_recharge_min: number // par arrêt rapide DC (20% → 80%, ~100 kW)
}
interface ProfilPhev {
  id: 'phev'; motorisation: 'phev'
  range_elec_km: number       // autonomie 100% électrique
  conso_kwh100_elec: number
  conso_l100_thermique: number // au-delà du range électrique
}

type ProfilVehicule = (ProfilDiesel | ProfilEssence | ProfilElec | ProfilPhev) & {
  label: string
  emoji: string
  couleur: string
}

export const PROFILS_VEHICULE: ProfilVehicule[] = [
  {
    id: 'diesel',
    motorisation: 'diesel',
    label: 'Diesel',
    emoji: '⛽',
    couleur: '#6b7280',
    conso_l100: 6.0,
  },
  {
    id: 'essence',
    motorisation: 'essence',
    label: 'Essence',
    emoji: '⛽',
    couleur: '#92400e',
    conso_l100: 7.5,
  },
  {
    id: 'elec',
    motorisation: 'elec',
    label: 'Électrique',
    emoji: '⚡',
    couleur: '#059669',
    conso_kwh100: 20,          // kWh/100km autoroute (réel)
    autonomie_km: 270,          // km entre charges (batterie ~60 kWh, 80% usable)
    temps_recharge_min: 30,     // ~30 min par arrêt (20% → 80%, borne 100kW)
  },
  {
    id: 'phev',
    motorisation: 'phev',
    label: 'Hybride Rechargeable',
    emoji: '🔋',
    couleur: '#d97706',
    range_elec_km: 50,           // autonomie 100% élec typique PHEV
    conso_kwh100_elec: 15,
    conso_l100_thermique: 5.5,   // après épuisement batterie
  },
]

// ─── Calcul pour une motorisation ────────────────────────────────────────────

export function calculerTrajet(route: Route, motorisationId: MotorisationTrajet): ResultatTrajet {
  const profil = PROFILS_VEHICULE.find(p => p.id === motorisationId)!
  const { distance_km, peages_eur, duree_base_min } = route

  let cout_energie = 0
  let nb_arrets = 0
  let temps_recharge = 0
  let conso_detail = ''

  switch (profil.motorisation) {
    case 'diesel': {
      const p = profil as ProfilDiesel
      cout_energie = (p.conso_l100 / 100) * distance_km * PRIX_ENERGIE.diesel
      conso_detail = `${p.conso_l100} L/100km · diesel ${PRIX_ENERGIE.diesel.toFixed(2)} €/L`
      break
    }
    case 'essence': {
      const p = profil as ProfilEssence
      cout_energie = (p.conso_l100 / 100) * distance_km * PRIX_ENERGIE.essence
      conso_detail = `${p.conso_l100} L/100km · essence ${PRIX_ENERGIE.essence.toFixed(2)} €/L`
      break
    }
    case 'elec': {
      const p = profil as ProfilElec
      cout_energie = (p.conso_kwh100 / 100) * distance_km * PRIX_ENERGIE.elec_blended
      nb_arrets = Math.max(0, Math.ceil(distance_km / p.autonomie_km) - 1)
      temps_recharge = nb_arrets * p.temps_recharge_min
      conso_detail = `${p.conso_kwh100} kWh/100km · tarif moyen ${PRIX_ENERGIE.elec_blended.toFixed(2)} €/kWh`
      break
    }
    case 'phev': {
      const p = profil as ProfilPhev
      const km_elec = Math.min(p.range_elec_km, distance_km)
      const km_therm = Math.max(0, distance_km - km_elec)
      const cout_elec = (p.conso_kwh100_elec / 100) * km_elec * PRIX_ENERGIE.elec_home
      const cout_therm = (p.conso_l100_thermique / 100) * km_therm * PRIX_ENERGIE.diesel
      cout_energie = cout_elec + cout_therm
      if (km_therm > 0) {
        conso_detail = `${km_elec} km élec + ${km_therm} km thermique (${p.conso_l100_thermique} L/100km)`
      } else {
        conso_detail = `${km_elec} km 100% électrique`
      }
      break
    }
  }

  return {
    id: profil.id as MotorisationTrajet,
    label: profil.label,
    emoji: profil.emoji,
    couleur: profil.couleur,
    cout_energie: Math.round(cout_energie * 100) / 100,
    cout_peages: peages_eur,
    cout_total: Math.round((cout_energie + peages_eur) * 100) / 100,
    duree_min: duree_base_min + temps_recharge,
    nb_arrets_recharge: nb_arrets,
    temps_recharge_min: temps_recharge,
    conso_detail,
  }
}

// ─── Calcul pour toutes les motorisations ────────────────────────────────────

export function calculerTousVehicules(route: Route): ResultatTrajet[] {
  const motorisations: MotorisationTrajet[] = ['diesel', 'essence', 'elec', 'phev']
  const resultats = motorisations.map(m => calculerTrajet(route, m))
  resultats.sort((a, b) => a.cout_total - b.cout_total)
  resultats[0].gagnant = true
  return resultats
}

// ─── Utilitaires ──────────────────────────────────────────────────────────────

export function fmtEur(v: number): string {
  return Math.round(v).toLocaleString('fr-FR') + ' €'
}

export function fmtDuree(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (m === 0) return `${h}h00`
  return `${h}h${m.toString().padStart(2, '0')}`
}

export function economieVsGagnant(resultat: ResultatTrajet, gagnant: ResultatTrajet): number {
  return resultat.cout_total - gagnant.cout_total
}
