#!/usr/bin/env node
/**
 * Moteurs.com — Sync des données fallback
 *
 * Régénère les blocs hardcodés dans `lib/tco.ts` et `public/simulateur.js`
 * à partir de la source de vérité `public/data/simulateur-data.json`
 * (mise à jour par l'Agent Simulateur).
 *
 * Exécuté automatiquement au `prebuild` (cf. package.json). Peut aussi
 * être lancé seul : `node scripts/sync-fallbacks.mjs`.
 *
 * Idempotent. Les zones modifiées sont délimitées par des marqueurs :
 *   // >>> SYNC:<NAME> START
 *   ... contenu régénéré ...
 *   // >>> SYNC:<NAME> END
 * Tout fichier sans marqueur est laissé intact (un avertissement est loggé).
 */

import { readFileSync, writeFileSync } from 'node:fs'
import { join, dirname, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const ROOT = join(HERE, '..')

const JSON_PATH = join(ROOT, 'public', 'data', 'simulateur-data.json')
const TCO_TS    = join(ROOT, 'lib', 'tco.ts')
const SIM_JS    = join(ROOT, 'public', 'simulateur.js')

const rel = p => relative(ROOT, p).replace(/\\/g, '/')

// ─── 1. Source de vérité ──────────────────────────────────────────────────────

const data = JSON.parse(readFileSync(JSON_PATH, 'utf-8'))
const version = data._meta?.version ?? 'n/a'

// ─── 2. Helpers de formatage ──────────────────────────────────────────────────

/** "{ a: 1, b: 2 }" — single-line, espaces autour des accolades */
function fmtInlineTs(obj) {
  const pairs = Object.entries(obj).map(([k, v]) => `${k}: ${v}`)
  return `{ ${pairs.join(', ')} }`
}

/** Multi-ligne, clés padées à la longueur de la plus longue (style tco.ts actuel). */
function fmtBlockTs(obj, indent = '  ') {
  const keys = Object.keys(obj)
  const colonPad = Math.max(...keys.map(k => k.length)) + 2 // ":" + ≥1 space
  return keys
    .map(k => `${indent}${(k + ':').padEnd(colonPad)}${fmtInlineTs(obj[k])},`)
    .join('\n')
}

/** "{a:1,b:2}" — compact, sans espaces (style public/simulateur.js actuel) */
function fmtInlineJs(obj) {
  const pairs = Object.entries(obj).map(([k, v]) =>
    `${k}:${v && typeof v === 'object' ? fmtInlineJs(v) : v}`
  )
  return `{${pairs.join(',')}}`
}

// ─── 3. Substitution par marqueurs ────────────────────────────────────────────

function replaceBetweenMarkers(source, name, newBody, filePath) {
  const startTag = `// >>> SYNC:${name} START`
  const endTag   = `// >>> SYNC:${name} END`
  const sIdx = source.indexOf(startTag)
  const eIdx = source.indexOf(endTag, sIdx === -1 ? 0 : sIdx)
  if (sIdx === -1 || eIdx === -1) {
    console.warn(`  ⚠  marker manquant : ${name} dans ${rel(filePath)} — fichier non modifié`)
    return { source, changed: false }
  }
  // Inclure le \n qui suit la ligne START
  const sLineEnd = source.indexOf('\n', sIdx) + 1
  // Reculer jusqu'au début de la ligne END (préserver son indentation)
  const eLineStart = source.lastIndexOf('\n', eIdx) + 1
  const before  = source.slice(0, sLineEnd)
  const after   = source.slice(eLineStart)
  const updated = before + newBody + '\n' + after
  return { source: updated, changed: updated !== source }
}

// ─── 4. lib/tco.ts ────────────────────────────────────────────────────────────

const tsBlocks = {
  ENERGY_PRICES_FALLBACK:     fmtBlockTs(data.energy_prices),
  REF_PRICES_FALLBACK:        fmtBlockTs(data.ref_prices),
  AIDES_B2B_FALLBACK:         fmtBlockTs(data.aides_b2b),
  AIDES_PARTICULIER_FALLBACK: fmtBlockTs(data.aides_particulier),
}

let tco = readFileSync(TCO_TS, 'utf-8')
let tcoChanged = false
for (const [name, body] of Object.entries(tsBlocks)) {
  const { source, changed } = replaceBetweenMarkers(tco, name, body, TCO_TS)
  tco = source
  if (changed) tcoChanged = true
}
if (tcoChanged) {
  writeFileSync(TCO_TS, tco)
  console.log(`  ✓  ${rel(TCO_TS)} régénéré`)
} else {
  console.log(`  ·  ${rel(TCO_TS)} déjà à jour`)
}

// ─── 5. public/simulateur.js ──────────────────────────────────────────────────

const jsBody = [
  `    ENERGY_PRICES     = ${fmtInlineJs(data.energy_prices)};`,
  `    AIDES_B2B         = ${fmtInlineJs(data.aides_b2b)};`,
  `    AIDES_PARTICULIER = ${fmtInlineJs(data.aides_particulier)};`,
  `    REF_PRICES        = ${fmtInlineJs(data.ref_prices)};`,
].join('\n')

let sim = readFileSync(SIM_JS, 'utf-8')
const { source: simNew, changed: simChanged } = replaceBetweenMarkers(sim, 'FALLBACK', jsBody, SIM_JS)
if (simChanged) {
  writeFileSync(SIM_JS, simNew)
  console.log(`  ✓  ${rel(SIM_JS)} régénéré`)
} else {
  console.log(`  ·  ${rel(SIM_JS)} déjà à jour`)
}

// ─── 6. Récap ─────────────────────────────────────────────────────────────────

console.log(`\nFallbacks synchronisés depuis ${rel(JSON_PATH)} (version ${version}).`)
