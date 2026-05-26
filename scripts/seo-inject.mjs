/**
 * seo-inject.mjs — Injection automatique metadata SEO
 * Usage : node scripts/seo-inject.mjs
 * Injecte getStaticMetadata() dans les pages sans metadata
 * Ajoute le canonical dans les pages i18n qui en manquent
 */
import { readFileSync, writeFileSync, existsSync } from 'fs'
import { resolve, join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')

// Pages sans metadata → injection complète
const PAGES_STATIC = [
  ['app/[locale]/b2b/page.tsx',                             '/b2b'],
  ['app/[locale]/particulier/page.tsx',                     '/particulier'],
  ['app/[locale]/outils/immatriculation-france/page.tsx',   '/outils/immatriculation-france'],
  ['app/[locale]/outils/immatriculation-belgique/page.tsx', '/outils/immatriculation-belgique'],
  ['app/[locale]/simulateur/page.tsx',                      '/simulateur'],
  ['app/[locale]/cout-voiture/page.tsx',                    '/cout-voiture'],
  ['app/[locale]/trajet/page.tsx',                          '/trajet'],
  ['app/[locale]/articles/page.tsx',                        '/articles'],
]

// Pages i18n → ajouter canonical si absent
const PAGES_CANONICAL = [
  ['app/[locale]/comparer/page.tsx',                        'https://moteurs.com/comparer'],
  ['app/[locale]/comparer-trajet/page.tsx',                 'https://moteurs.com/comparer-trajet'],
  ['app/[locale]/tco/page.tsx',                             'https://moteurs.com/tco'],
  ['app/[locale]/outils/cartes-recharge/page.tsx',          'https://moteurs.com/outils/cartes-recharge'],
  ['app/[locale]/constat/page.tsx',                         'https://moteurs.com/constat'],
  ['app/[locale]/assistant-depannage/page.tsx',             'https://moteurs.com/assistant-depannage'],
  ['app/[locale]/articles/page.tsx',                        'https://moteurs.com/articles'],
  ['app/[locale]/trajet/page.tsx',                          'https://moteurs.com/trajet'],
]

function atomicWrite(path, content) {
  writeFileSync(path, content, 'utf8')
}

function injectStatic(relPath, route) {
  const path = join(ROOT, relPath)
  if (!existsSync(path)) { console.log(`  SKIP (introuvable) : ${relPath}`); return }

  let content = readFileSync(path, 'utf8').replace(/\r\n/g, '\n')

  // Ne jamais injecter dans un Client Component ('use client')
  if (content.trimStart().startsWith("'use client'") || content.trimStart().startsWith('"use client"')) {
    console.log(`  SKIP (use client) : ${relPath}`)
    return
  }

  if (content.includes('getStaticMetadata') || content.includes('generateMetadata')) {
    // Vérifier si canonical est déjà présent
    if (!content.includes('canonical')) {
      content = injectCanonical(content, `https://moteurs.com${route}`)
      atomicWrite(path, content)
      console.log(`  ✅ canonical ajouté : ${relPath}`)
    } else {
      console.log(`  SKIP (déjà optimisé) : ${relPath}`)
    }
    return
  }

  // Trouver la fin du bloc d'imports
  const importMatches = [...content.matchAll(/^import\s+.+$/gm)]
  const lastImportEnd = importMatches.length
    ? importMatches[importMatches.length - 1].index + importMatches[importMatches.length - 1][0].length
    : 0

  const inject = `\nimport { getStaticMetadata } from '@/lib/seo-keywords'\n\nexport const metadata = getStaticMetadata('${route}')\n`
  content = content.slice(0, lastImportEnd) + inject + content.slice(lastImportEnd)

  atomicWrite(path, content)
  console.log(`  ✅ metadata injecté : ${relPath}`)
}

function injectCanonical(content, url) {
  // Chercher le premier "return {" dans generateMetadata
  const gmIdx = content.indexOf('generateMetadata')
  if (gmIdx === -1) return content

  const returnIdx = content.indexOf('return {', gmIdx)
  if (returnIdx === -1) return content

  const insertPos = returnIdx + 'return {'.length
  return content.slice(0, insertPos) + `\n    alternates: { canonical: '${url}' },` + content.slice(insertPos)
}

function addCanonical(relPath, url) {
  const path = join(ROOT, relPath)
  if (!existsSync(path)) { console.log(`  SKIP (introuvable) : ${relPath}`); return }

  let content = readFileSync(path, 'utf8').replace(/\r\n/g, '\n')

  if (content.includes('canonical')) { console.log(`  SKIP (canonical présent) : ${relPath}`); return }

  content = injectCanonical(content, url)
  atomicWrite(path, content)
  console.log(`  ✅ canonical ajouté : ${relPath}`)
}

console.log('\n=== Injection SEO automatique ===\n')
console.log('-- Metadata complet --')
PAGES_STATIC.forEach(([rel, route]) => injectStatic(rel, route))

console.log('\n-- Canonical manquant --')
PAGES_CANONICAL.forEach(([rel, url]) => addCanonical(rel, url))

console.log('\nTerminé. Lance : npm run seo:audit')
