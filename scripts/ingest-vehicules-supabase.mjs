#!/usr/bin/env node
/**
 * ingest-vehicules-supabase.mjs — Moteurs.com / Autopulse
 * Pousse le snapshot data/open-ev-data.json dans la table Supabase `vehicules_ev` (UPSERT).
 *
 * Workflow recommandé (sur la machine d'Oliver, qui atteint GitHub) :
 *   1) node scripts/refresh-open-ev-data.mjs        # télécharge le dataset complet (1149)
 *   2) node scripts/ingest-vehicules-supabase.mjs   # upsert vers Supabase
 *
 * Variables d'environnement requises :
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY   (clé service — NE PAS committer)
 *
 * La table `vehicules_ev` doit déjà exister (migration create_vehicules_ev).
 */
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!URL || !KEY) {
  console.error('✗ NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY sont requis.')
  process.exit(1)
}

const FILE = join(dirname(fileURLToPath(import.meta.url)), '..', 'data', 'open-ev-data.json')
const data = JSON.parse(readFileSync(FILE, 'utf-8'))
const version = data.dataset_version ?? null
const vehicles = (data.vehicles ?? []).map((v) => ({
  id: v.id,
  brand: v.brand,
  model: v.model,
  variant: v.variant ?? null,
  year: v.year ?? null,
  battery_kwh: v.battery_kwh ?? null,
  range_km: v.range_km ?? null,
  consumption_wh_km: v.consumption_wh_km ?? null,
  dc_kw: v.dc_kw ?? null,
  ac_kw: v.ac_kw ?? null,
  drivetrain: v.drivetrain ?? null,
  body: v.body ?? null,
  seats: v.seats ?? null,
  v2l: v.v2l ?? null,
  price_eur: v.price_eur ?? null,
  source: 'open-ev-data',
  dataset_version: version,
  actif: true,
  updated_at: new Date().toISOString(),
}))

if (vehicles.length === 0) {
  console.error('✗ Aucun véhicule dans le snapshot — abandon.')
  process.exit(1)
}

const CHUNK = 200
let done = 0
async function upsert(batch) {
  const res = await fetch(`${URL}/rest/v1/vehicules_ev?on_conflict=id`, {
    method: 'POST',
    headers: {
      apikey: KEY,
      Authorization: `Bearer ${KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'resolution=merge-duplicates,return=minimal',
    },
    body: JSON.stringify(batch),
  })
  if (!res.ok) throw new Error(`HTTP ${res.status} — ${await res.text()}`)
}

console.log(`[ingest] ${vehicles.length} véhicules (version ${version}) → Supabase…`)
for (let i = 0; i < vehicles.length; i += CHUNK) {
  const batch = vehicles.slice(i, i + CHUNK)
  await upsert(batch)
  done += batch.length
  console.log(`[ingest] ${done}/${vehicles.length}`)
}
console.log('[ingest] ✓ terminé. Pense à vérifier le compte : select count(*) from vehicules_ev;')
