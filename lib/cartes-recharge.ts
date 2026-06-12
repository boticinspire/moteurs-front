// Type partagé + fetch serveur des cartes de recharge.
// Source : orchestrateur Railway /recharge/cartes (JSON public, cache 1h).

export interface Tarifs {
  ac_slow?:   { modele?: string; prix?: number | null; frais_session?: number }
  dc_rapide?: { modele?: string; prix?: number | null; frais_session?: number }
  dc_ultra?:  { modele?: string; prix?: number | null; frais_session?: number }
}

export interface Roaming {
  disponible?: boolean
  pays_couverts?: string[]
  tarif_dc_rapide?: { prix?: number | null }
  tarif_dc_ultra?:  { prix?: number | null }
}

export interface Carte {
  id: string
  nom: string
  operateur: string
  pays_origine: string[]
  url_officielle?: string
  url_tarifs?: string
  ideal_voyage: boolean
  ideal_quotidien: boolean
  flotte_pro: boolean
  points_forts: string[]
  points_faibles: string[]
  actif?: boolean
  donnees: {
    abonnement?: { mensuel_eur?: number; annuel_eur?: number; engagement_mois?: number }
    tarifs_fr?: Tarifs
    tarifs_be?: Tarifs
    roaming?: Roaming
  }
}

const RAILWAY_URL =
  'https://orchestrateur-production.up.railway.app/recharge/cartes'

/**
 * Cartes obsolètes / fusionnées à exclure même si l'API les renvoie encore.
 * - blue-corner : Blue Corner est passé sous la marque Blink Charging
 *   (cf. blink-charging-be). Doublon à ne plus afficher.
 */
const DEPRECATED_IDS = new Set<string>(['blue-corner'])

/** Fetch serveur des cartes actives (cache ISR 1h). Renvoie [] en cas d'erreur. */
export async function getCartes(): Promise<Carte[]> {
  try {
    const res = await fetch(RAILWAY_URL, {
      next: { revalidate: 3600 },
      headers: { Accept: 'application/json' },
    })
    if (!res.ok) throw new Error(`Railway ${res.status}`)
    const data = await res.json()
    const cartes: Carte[] = data.cartes || []
    return cartes.filter((c) => c.actif !== false && !DEPRECATED_IDS.has(c.id))
  } catch (e) {
    console.error('[getCartes] Erreur fetch Railway:', e)
    return []
  }
}

/** Tarifs de référence d'une carte (FR prioritaire, sinon BE). */
export function getTarifs(carte: Carte): Tarifs {
  return carte.donnees?.tarifs_fr || carte.donnees?.tarifs_be || {}
}
