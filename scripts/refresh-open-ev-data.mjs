#!/usr/bin/env node
/**
 * refresh-open-ev-data.mjs — Moteurs.com / Autopulse
 * Télécharge le dernier dataset Open EV Data (https://github.com/open-ev-data/open-ev-data-dataset),
 * le normalise au format consommé par le catalogue, et écrit data/open-ev-data.json.
 *
 * Usage :  node scripts/refresh-open-ev-data.mjs
 * Nécessite un accès réseau à api.github.com + github.com (objects CDN).
 * Données sous licence CDLA-Permissive-2.0 — attribution conservée dans le fichier de sortie.
 */
import { writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const REPO = 'open-ev-data/open-ev-data-dataset'
const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'data', 'open-ev-data.json')

const slug = (...xs) => xs.join('-').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
const num = (x) => (typeof x === 'number' && isFinite(x) ? x : null)

function pick(v) {
  // Gère le format compilé « plat » ET le format canonique riche (schema 1.0.0).
  const brand = v.make?.name ?? v.brand ?? v.make ?? null
  const model = v.model?.name ?? v.model ?? null
  const variant = v.variant?.name ?? v.trim?.name ?? v.variant ?? null
  const year = num(v.year)

  const batt = num(v.battery?.pack_capacity_kwh_net)
    ?? num(v.battery?.pack_capacity_kwh_gross)
    ?? num(v.battery?.capacity_kwh) ?? null

  let range = null
  if (Array.isArray(v.range?.rated)) {
    const w = v.range.rated.find((r) => r.cycle === 'wltp') ?? v.range.rated[0]
    range = num(w?.range_km)
  }
  range = range ?? num(v.range?.wltp?.km) ?? num(v.range_km) ?? null

  const conso = num(v.efficiency?.energy_consumption_wh_per_km) ?? null
  const dc = num(v.charging?.dc?.max_power_kw) ?? num(v.charging_speed_kw) ?? null
  const ac = num(v.charging?.ac?.max_power_kw) ?? null
  const drivetrain = v.powertrain?.drivetrain ?? v.drive_type ?? null
  const body = v.body?.style ?? v.body ?? v.vehicle_type ?? null
  const seats = num(v.body?.seats) ?? num(v.seats) ?? null
  const v2l = v.v2x?.v2l?.supported ?? null
  let price = null
  if (Array.isArray(v.pricing?.msrp)) {
    const eur = v.pricing.msrp.find((m) => m.currency === 'EUR')
    price = num(eur?.amount)
  }

  if (!brand || !model) return null
  return {
    id: slug(brand, model, variant ?? '', String(year ?? '')),
    brand, model, variant: variant ?? undefined, year: year ?? null,
    battery_kwh: batt, range_km: range, consumption_wh_km: conso,
    dc_kw: dc, ac_kw: ac,
    drivetrain: drivetrain ?? undefined, body: body ?? undefined,
    seats: seats ?? undefined, v2l: v2l ?? undefined, price_eur: price,
  }
}

async function main() {
  console.log('[open-ev-data] récupération du dernier tag…')
  const rel = await fetch(`https://api.github.com/repos/${REPO}/releases/latest`, {
    headers: { 'Accept': 'application/vnd.github+json', 'User-Agent': 'moteurs-refresh' },
  }).then((r) => r.json())
  const tag = rel.tag_name
  if (!tag) throw new Error('Tag introuvable (API GitHub)')
  console.log('[open-ev-data] version:', tag)

  const asset = (rel.assets || []).find((a) => a.name.endsWith('.json'))
  const url = asset?.browser_download_url
    ?? `https://github.com/${REPO}/releases/download/${tag}/open-ev-data-${tag}.json`
  console.log('[open-ev-data] téléchargement:', url)
  const raw = await fetch(url, { headers: { 'User-Agent': 'moteurs-refresh' } }).then((r) => r.json())

  const list = Array.isArray(raw) ? raw : (raw.vehicles ?? [])
  const vehicles = list.map(pick).filter(Boolean)
    .filter((v) => v.battery_kwh || v.range_km)   // au moins une donnée utile

  // dédoublonnage par id
  const seen = new Set()
  const dedup = vehicles.filter((v) => (seen.has(v.id) ? false : (seen.add(v.id), true)))
  // tri marque puis modèle
  dedup.sort((a, b) => (a.brand + a.model).localeCompare(b.brand + b.model, 'fr'))

  const out = {
    source: 'open-ev-data',
    dataset_version: tag,
    generated_at: new Date().toISOString(),
    attribution: 'Données : Open EV Data (https://open-ev-data.github.io) — CDLA-Permissive-2.0.',
    count: dedup.length,
    vehicles: dedup,
  }
  writeFileSync(OUT, JSON.stringify(out, null, 2))
  console.log(`[open-ev-data] ✓ ${dedup.length} véhicules écrits dans data/open-ev-data.json`)
}

main().catch((e) => { console.error('[open-ev-data] échec:', e.message); process.exit(1) })
