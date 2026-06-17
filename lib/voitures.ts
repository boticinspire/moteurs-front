/**
 * lib/voitures.ts — Accès au catalogue véhicules électriques (table ev_modeles,
 * source OpenEV Data, licence CDLA-Permissive-2.0) pour les pages SEO /voitures.
 *
 * On expose UNE page par couple (marque, modèle) — pas par finition/année — pour
 * éviter les doublons. Les variantes (batterie, finition, année) sont listées
 * dans la fiche. Filtré aux marques commercialisées sur les marchés Moteurs.com.
 */
import { supabase } from '@/lib/supabase'

const MARQUES_EU = new Set([
  'Audi', 'BMW', 'Mercedes-Benz', 'Volkswagen', 'Renault', 'Peugeot', 'Citroen', 'Citroën',
  'DS', 'DS Automobiles', 'Dacia', 'Tesla', 'Hyundai', 'Kia', 'Skoda', 'Škoda', 'Cupra',
  'SEAT', 'Seat', 'Volvo', 'Polestar', 'Opel', 'Fiat', 'Abarth', 'Alfa Romeo', 'Lancia',
  'Ford', 'Nissan', 'Toyota', 'Lexus', 'Honda', 'Mazda', 'Mini', 'MINI', 'Smart', 'Jeep',
  'Jaguar', 'Land Rover', 'Porsche', 'MG', 'Subaru', 'Mitsubishi', 'Suzuki', 'Maserati',
  'Genesis', 'Lotus', 'Alpine', 'Leapmotor', 'XPeng', 'NIO', 'BYD', 'Maxus', 'GWM', 'Ora',
])

export type EvVariant = {
  id: number
  trim: string | null
  year: number | null
  batt_kwh_net: number | null
  batt_kwh_gross: number | null
  wltp_km: number | null
  conso_wh_km: number | null
  dc_kw: number | null
  ac_kw: number | null
  voltage_class: string | null
  seats: number | null
  drivetrain: string | null
}

export type EvModele = {
  slug: string
  make: string
  model: string
  variants: EvVariant[]
  // specs représentatives (meilleure variante)
  battMax: number | null
  wltpMax: number | null
  dcMax: number | null
  consoWhKm: number | null
  voltageClass: string | null
  seats: number | null
  image_url: string | null
  yearLatest: number | null
}

const COLS =
  'id,make,model,trim,year,batt_kwh_net,batt_kwh_gross,wltp_km,conso_wh_km,dc_kw,ac_kw,voltage_class,seats,drivetrain,image_url'

export function voitureSlug(make: string, model: string): string {
  return `${make}-${model}`
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

type Row = EvVariant & { make: string; model: string; image_url: string | null }

async function loadEuRows(): Promise<Row[]> {
  const out: Row[] = []
  const PAGE = 1000
  for (let from = 0; from < 5000; from += PAGE) {
    const { data, error } = await supabase
      .from('ev_modeles')
      .select(COLS)
      .eq('actif', true)
      .order('make', { ascending: true })
      .order('model', { ascending: true })
      .range(from, from + PAGE - 1)
    if (error || !data || data.length === 0) break
    out.push(...(data as unknown as Row[]))
    if (data.length < PAGE) break
  }
  return out.filter((r) => MARQUES_EU.has(r.make))
}

function groupByModel(rows: Row[]): Map<string, EvModele> {
  const map = new Map<string, EvModele>()
  for (const r of rows) {
    const slug = voitureSlug(r.make, r.model)
    let g = map.get(slug)
    if (!g) {
      g = {
        slug, make: r.make, model: r.model, variants: [],
        battMax: null, wltpMax: null, dcMax: null, consoWhKm: null,
        voltageClass: null, seats: null, image_url: null, yearLatest: null,
      }
      map.set(slug, g)
    }
    g.variants.push({
      id: r.id, trim: r.trim, year: r.year,
      batt_kwh_net: r.batt_kwh_net, batt_kwh_gross: r.batt_kwh_gross,
      wltp_km: r.wltp_km, conso_wh_km: r.conso_wh_km, dc_kw: r.dc_kw, ac_kw: r.ac_kw,
      voltage_class: r.voltage_class, seats: r.seats, drivetrain: r.drivetrain,
    })
    const batt = r.batt_kwh_net ?? r.batt_kwh_gross
    if (batt != null && (g.battMax == null || batt > g.battMax)) {
      g.battMax = batt
      g.consoWhKm = r.conso_wh_km
      g.voltageClass = r.voltage_class
    }
    if (r.wltp_km != null && (g.wltpMax == null || r.wltp_km > g.wltpMax)) g.wltpMax = r.wltp_km
    if (r.dc_kw != null && (g.dcMax == null || r.dc_kw > g.dcMax)) g.dcMax = r.dc_kw
    if (r.seats != null && g.seats == null) g.seats = r.seats
    if (!g.image_url && r.image_url) g.image_url = r.image_url
    if (r.year != null && (g.yearLatest == null || r.year > g.yearLatest)) g.yearLatest = r.year
  }
  // tri des variantes : année desc puis batterie desc
  for (const g of map.values()) {
    g.variants.sort((a, b) => (b.year ?? 0) - (a.year ?? 0) || (b.batt_kwh_net ?? 0) - (a.batt_kwh_net ?? 0))
  }
  return map
}

export async function getVoituresIndex(): Promise<EvModele[]> {
  const groups = [...groupByModel(await loadEuRows()).values()]
  groups.sort((a, b) => a.make.localeCompare(b.make) || a.model.localeCompare(b.model))
  return groups
}

export async function getVoitureSlugs(): Promise<string[]> {
  return [...groupByModel(await loadEuRows()).keys()]
}

export async function getVoiture(slug: string): Promise<EvModele | null> {
  return groupByModel(await loadEuRows()).get(slug) ?? null
}

/** Conso réelle estimée en kWh/100 km (rated × 1,15). */
export function consoReelle100(m: EvModele): number | null {
  let wh = m.consoWhKm
  if (wh == null && m.battMax && m.wltpMax) wh = (m.battMax / m.wltpMax) * 1000
  return wh != null ? Math.round((wh / 1000) * 100 * 1.15 * 10) / 10 : null
}


// ─── Classements SEO (pages /voitures/palmares) ─────────────────────────────

export type Critere = {
  slug: string
  titre: string          // titre court (carte / nav)
  h1: string             // H1 de la page
  description: string    // meta description
  intro: string          // paragraphe d'intro éditorial
  /** Valeur classée pour un modèle (null = exclu). */
  metric: (m: EvModele) => number | null
  /** 'desc' = plus grand d'abord ; 'asc' = plus petit d'abord. */
  sens: 'asc' | 'desc'
  /** Libellé de la valeur affichée. */
  valeur: (m: EvModele) => string
  /** Filtre optionnel d'éligibilité. */
  filtre?: (m: EvModele) => boolean
}

export const CLASSEMENTS: Critere[] = [
  {
    slug: 'meilleure-autonomie',
    titre: 'Meilleures autonomies',
    h1: 'Voitures électriques avec la meilleure autonomie',
    description: 'Classement des voitures électriques par autonomie WLTP, avec autonomie réelle estimée et temps de recharge.',
    intro: 'Les modèles électriques qui vont le plus loin sur une charge, classés par autonomie WLTP. L’autonomie réelle (≈ −20 % sur autoroute, davantage en hiver) est indiquée à titre indicatif.',
    metric: (m) => m.wltpMax,
    sens: 'desc',
    valeur: (m) => (m.wltpMax ? `${m.wltpMax} km WLTP` : '—'),
  },
  {
    slug: 'recharge-la-plus-rapide',
    titre: 'Recharge la plus rapide',
    h1: 'Voitures électriques qui se rechargent le plus vite',
    description: 'Classement des voitures électriques par puissance de charge rapide (kW DC) et temps de recharge 10→80 % estimé.',
    intro: 'Plus la puissance de charge DC est élevée, plus la pause recharge est courte sur les longs trajets. Classement par puissance crête ; le temps 10→80 % est estimé par notre modèle.',
    metric: (m) => m.dcMax,
    sens: 'desc',
    valeur: (m) => (m.dcMax ? `${m.dcMax} kW DC` : '—'),
  },
  {
    slug: 'voitures-800v',
    titre: 'Architecture 800V',
    h1: 'Voitures électriques en architecture 800 volts',
    description: 'Liste des voitures électriques 800V : la technologie qui permet la recharge ultra-rapide.',
    intro: 'L’architecture 800V autorise des puissances de charge très élevées et de courtes pauses. Voici les modèles qui en sont équipés.',
    metric: (m) => m.dcMax,
    sens: 'desc',
    valeur: (m) => (m.dcMax ? `${m.dcMax} kW · 800V` : '800V'),
    filtre: (m) => m.voltageClass === '800v',
  },
  {
    slug: 'plus-efficientes',
    titre: 'Les plus efficientes',
    h1: 'Voitures électriques les plus efficientes (consommation)',
    description: 'Classement des voitures électriques par consommation réelle estimée (kWh/100 km) : les moins gourmandes.',
    intro: 'Une faible consommation = plus d’autonomie et un coût de recharge réduit. Classement par consommation réelle estimée (WLTP × 1,15), de la plus sobre à la plus gourmande.',
    metric: (m) => consoReelle100(m),
    sens: 'asc',
    valeur: (m) => { const c = consoReelle100(m); return c ? `${c} kWh/100 km` : '—' },
  },
  {
    slug: 'plus-grande-batterie',
    titre: 'Plus grosses batteries',
    h1: 'Voitures électriques avec la plus grande batterie',
    description: 'Classement des voitures électriques par capacité de batterie utile (kWh).',
    intro: 'La capacité de batterie conditionne l’autonomie et le temps de charge. Classement par batterie utile la plus grande.',
    metric: (m) => m.battMax,
    sens: 'desc',
    valeur: (m) => (m.battMax ? `${m.battMax} kWh` : '—'),
  },
  {
    slug: 'citadines-compactes',
    titre: 'Citadines & compactes',
    h1: 'Petites voitures électriques (citadines & compactes)',
    description: 'Les voitures électriques compactes (batterie ≤ 55 kWh), idéales en ville et au quotidien, classées par autonomie.',
    intro: 'Pensées pour la ville et les trajets du quotidien, ces modèles compacts (batterie ≤ 55 kWh) offrent le meilleur compromis taille / autonomie / prix de recharge.',
    metric: (m) => m.wltpMax,
    sens: 'desc',
    valeur: (m) => (m.wltpMax ? `${m.wltpMax} km` : '—'),
    filtre: (m) => m.battMax != null && m.battMax <= 55,
  },
]

export function getCritere(slug: string): Critere | null {
  return CLASSEMENTS.find((c) => c.slug === slug) ?? null
}

export async function getClassement(slug: string, limit = 25): Promise<{ critere: Critere; modeles: EvModele[] } | null> {
  const critere = getCritere(slug)
  if (!critere) return null
  let modeles = await getVoituresIndex()
  if (critere.filtre) modeles = modeles.filter(critere.filtre)
  modeles = modeles.filter((m) => critere.metric(m) != null)
  modeles.sort((a, b) => {
    const va = critere.metric(a) as number
    const vb = critere.metric(b) as number
    return critere.sens === 'asc' ? va - vb : vb - va
  })
  return { critere, modeles: modeles.slice(0, limit) }
}
