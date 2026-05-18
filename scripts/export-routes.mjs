/**
 * Moteurs.com — Script d'export des trajets populaires
 * ─────────────────────────────────────────────────────
 * Lit les N trajets les plus demandés dans la table Supabase `trajets_cache`
 * et les fusionne dans `data/routes-vacances.json`.
 *
 * Usage :
 *   node scripts/export-routes.mjs           → top 50 (défaut)
 *   node scripts/export-routes.mjs 100       → top 100
 *   node scripts/export-routes.mjs --dry-run → affiche sans écrire
 *
 * Les variables NEXT_PUBLIC_SUPABASE_URL et NEXT_PUBLIC_SUPABASE_ANON_KEY
 * sont lues depuis .env.local (ou les variables d'environnement du shell).
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createClient } from '@supabase/supabase-js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')

// ─── Charger .env.local ───────────────────────────────────────────────────────

function loadEnvLocal() {
  const envPath = resolve(ROOT, '.env.local')
  if (!existsSync(envPath)) return
  const lines = readFileSync(envPath, 'utf8').split('\n')
  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq < 0) continue
    const key = trimmed.slice(0, eq).trim()
    const val = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, '')
    if (!process.env[key]) process.env[key] = val
  }
}

loadEnvLocal()

// ─── Arguments CLI ────────────────────────────────────────────────────────────

const args = process.argv.slice(2)
const dryRun = args.includes('--dry-run')
const limitArg = args.find(a => /^\d+$/.test(a))
const LIMIT = limitArg ? parseInt(limitArg, 10) : 50

// ─── Supabase ─────────────────────────────────────────────────────────────────

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌  NEXT_PUBLIC_SUPABASE_URL et NEXT_PUBLIC_SUPABASE_ANON_KEY requis')
  console.error('   Vérifiez que .env.local est présent à la racine du projet next-front/')
  process.exit(1)
}

const sb = createClient(SUPABASE_URL, SUPABASE_KEY)

// ─── Normalisation (même logique que lib/trajets-cache.ts) ───────────────────

function normaliser(s) {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9 -]/g, '')
    .trim()
}

function makeSlug(depart, arrivee) {
  return `${normaliser(depart).replace(/ /g, '-')}-${normaliser(arrivee).replace(/ /g, '-')}`
}

// ─── Lecture cache Supabase ───────────────────────────────────────────────────

console.log(`\n📡  Connexion à Supabase — top ${LIMIT} trajets par nb_requetes…`)

const { data: cacheRows, error } = await sb
  .from('trajets_cache')
  .select('depart, arrivee, distance_km, peages_eur, duree_base_min, nb_requetes')
  .order('nb_requetes', { ascending: false })
  .limit(LIMIT)

if (error) {
  console.error('❌  Erreur Supabase :', error.message)
  process.exit(1)
}

if (!cacheRows || cacheRows.length === 0) {
  console.log('ℹ️   Aucun trajet trouvé dans trajets_cache.')
  process.exit(0)
}

console.log(`✅  ${cacheRows.length} trajets récupérés depuis Supabase`)

// ─── Lecture du fichier existant ──────────────────────────────────────────────

const jsonPath = resolve(ROOT, 'data', 'routes-vacances.json')
let existing = []

try {
  existing = JSON.parse(readFileSync(jsonPath, 'utf8'))
  console.log(`📂  ${existing.length} routes déjà présentes dans routes-vacances.json`)
} catch {
  console.log(`⚠️   Fichier routes-vacances.json introuvable — création ex nihilo`)
}

// ─── Fusion ───────────────────────────────────────────────────────────────────

// Index des routes existantes par paire normalisée (A→B et B→A)
const existingKeys = new Set()
for (const r of existing) {
  const nd = normaliser(r.depart)
  const na = normaliser(r.arrivee)
  existingKeys.add(`${nd}|${na}`)
  existingKeys.add(`${na}|${nd}`)
}

const nouvelles = []

for (const row of cacheRows) {
  const nd = normaliser(row.depart)
  const na = normaliser(row.arrivee)
  const key = `${nd}|${na}`

  if (existingKeys.has(key)) continue   // déjà présent

  nouvelles.push({
    slug:          makeSlug(row.depart, row.arrivee),
    depart:        row.depart,
    arrivee:       row.arrivee,
    distance_km:   Math.round(row.distance_km),
    peages_eur:    Math.round(row.peages_eur ?? row.distance_km * 0.07),
    duree_base_min: Math.round(row.duree_base_min),
    pays_depart:   'FR',
    popular:       true,
  })

  existingKeys.add(key)
  existingKeys.add(`${na}|${nd}`)
}

// ─── Résultat ─────────────────────────────────────────────────────────────────

const merged = [...existing, ...nouvelles]

if (nouvelles.length === 0) {
  console.log('\n✅  Aucun nouveau trajet à ajouter (tous déjà présents).')
  process.exit(0)
}

console.log(`\n🆕  ${nouvelles.length} nouveau(x) trajet(s) à ajouter :`)
for (const r of nouvelles) {
  console.log(`   • ${r.depart} → ${r.arrivee}  (${r.distance_km} km, ~${r.peages_eur}€ péages)`)
}

if (dryRun) {
  console.log('\n🔍  Mode --dry-run : aucun fichier modifié.')
  console.log(`   Le fichier contiendrait ${merged.length} routes au total.`)
  process.exit(0)
}

// ─── Écriture ─────────────────────────────────────────────────────────────────

writeFileSync(jsonPath, JSON.stringify(merged, null, 2) + '\n', 'utf8')

console.log(`\n✅  routes-vacances.json mis à jour : ${merged.length} routes au total`)
console.log('   Commitez le fichier puis poussez pour que Vercel le prenne en compte :')
console.log('   git add data/routes-vacances.json && git commit -m "data: enrichir routes-vacances depuis cache" && git push\n')
