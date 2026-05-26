/**
 * seo-audit.mjs — Moteurs.com SEO Keyword Coverage Auditor
 * Usage : node scripts/seo-audit.mjs
 * Output: seo-report.json
 */
import { readFileSync, writeFileSync, existsSync } from 'fs'
import { resolve, join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT      = resolve(__dirname, '..')
const APP_I18N  = join(ROOT, 'app', '[locale]')
const APP_BASE  = join(ROOT, 'app')
const MSG_FR    = join(ROOT, 'messages', 'fr.json')

// Charge les traductions FR
const i18n = {}
if (existsSync(MSG_FR)) {
  const raw = JSON.parse(readFileSync(MSG_FR, 'utf8'))
  for (const [ns, vals] of Object.entries(raw)) {
    if (typeof vals === 'object') {
      for (const [k, v] of Object.entries(vals)) {
        i18n[`${ns}.${k}`] = String(v)
      }
    }
  }
}

const KEYWORD_MAP = {
  '/':                    { primary: 'calculateur coût trajet voiture',        secondary: ['comparateur voiture électrique','TCO voiture électrique'], vol: 14500, intent: 'Commerciale',     title: 'Calculateur TCO & Coût de Trajet | Moteurs.com — France, Belgique, Suisse',                    desc: 'Comparez le coût total de votre voiture (diesel, essence, électrique) et calculez le coût de votre trajet en 30 secondes. Données 2026 triangulées.' },
  '/comparer':            { primary: 'comparateur voiture électrique',          secondary: ['TCO voiture électrique','coût voiture électrique vs diesel'], vol: 22000, intent: 'Commerciale',     title: 'Comparateur voiture électrique vs diesel vs essence — TCO 2026 | Moteurs.com',                 desc: 'Comparez diesel, essence, électrique, hybride et GNV sur 48 mois. Aides 2026 incluses. 4 pays couverts.' },
  '/comparer-trajet':     { primary: 'calculateur coût trajet voiture',        secondary: ['coût trajet voiture électrique'], vol: 9800,  intent: 'Commerciale',     title: 'Calculateur coût trajet voiture — électrique vs diesel | Moteurs.com',                         desc: 'Calculez le coût exact de votre trajet selon votre motorisation : péages, recharge, énergie.' },
  '/simulateur':          { primary: 'simulateur coût voiture',                secondary: ['TCO voiture électrique'], vol: 9200,  intent: 'Commerciale',     title: 'Simulateur TCO voiture — Coût total sur mesure 2026 | Moteurs.com',                            desc: 'Personnalisez km/an, durée, pays et fiscalité pour calculer le coût total de possession de votre véhicule.' },
  '/tco':                 { primary: 'TCO voiture électrique',                 secondary: ['comparatif TCO motorisation'], vol: 8500,  intent: 'Informationnelle', title: 'Comparatifs TCO par segment — Voiture, VUL, Camion | Moteurs.com',                              desc: 'Tous les comparatifs TCO : voiture, camionnette, camion, moto, VAE. Par pays et motorisation. 2026.' },
  '/recharge-electrique': { primary: 'prix recharge voiture électrique',       secondary: ['borne recharge rapide France'], vol: 21000, intent: 'Informationnelle', title: 'Prix recharge voiture électrique & réseau bornes France 2026 | Moteurs.com',                     desc: 'Comparez les prix de recharge (kWh, abonnement, sans abo) et le réseau de bornes rapides en France et Europe.' },
  '/outils/cartes-recharge': { primary: 'meilleure carte recharge voiture électrique', secondary: ['IONITY tarif 2026'], vol: 9800, intent: 'Commerciale', title: 'Meilleure carte recharge voiture électrique 2026 — Comparatif | Moteurs.com',                   desc: 'Comparez Chargemap, Freshmile, IONITY, Fastned, Electra : tarifs par pays, plans abonnement, roaming.' },
  '/depannage':           { primary: 'ZFE 2026',                               secondary: ["Crit'Air ZFE",'zone faibles émissions 2026'], vol: 18000, intent: 'Informationnelle', title: "ZFE 2026 : Crit'Air, vignettes, alternatives | Guide Moteurs.com",                             desc: "Tout sur les Zones à Faibles Émissions 2026 : Crit'Air obligatoire, villes concernées, aides remplacement." },
  '/assistant-depannage': { primary: 'voyant tableau de bord signification',   secondary: ['voyant rouge voiture'], vol: 24000, intent: 'Informationnelle', title: 'Voyant tableau de bord : signification et que faire | Moteurs.com',                              desc: "Identifiez chaque voyant (rouge, orange, vert) : diagnostic IA par photo, niveau d'urgence, 75+ voyants couverts." },
  '/constat':             { primary: 'constat amiable voiture',                secondary: ['constat amiable remplir seul'], vol: 31000, intent: 'Informationnelle', title: 'Constat amiable voiture — Remplir seul, wizard guidé | Moteurs.com',                            desc: 'Remplissez votre constat amiable en 8 étapes : 17 cas standardisés, export PDF, envoi email. 4 pays.' },
  '/b2b':                 { primary: 'gestion flotte électrique entreprise',   secondary: ['TCO flotte véhicule électrique'], vol: 6400,  intent: 'Commerciale',     title: 'Gestion flotte électrique entreprise — TCO & Aides 2026 | Moteurs.com',                        desc: 'Calculez le TCO de votre flotte, comparez utilitaires électriques vs diesel, optimisez aides et déductibilité.' },
  '/particulier':         { primary: 'aide achat voiture électrique 2026',     secondary: ['bonus écologique 2026'], vol: 19500, intent: 'Informationnelle', title: 'Aide achat voiture électrique 2026 : bonus, leasing social | Moteurs.com',                       desc: 'Bonus écologique, prime conversion, leasing social : toutes les aides pour particuliers en 2026.' },
  '/articles':            { primary: 'décryptage transition énergétique transport', secondary: ['ZFE 2026'], vol: 5000,  intent: 'Navigationnelle', title: '', desc: '' },
  '/articles/fr':         { primary: 'bonus écologique voiture électrique 2026', secondary: ['prime conversion 2026'], vol: 28000, intent: 'Informationnelle', title: 'Bonus écologique & aides voiture électrique France 2026 | Moteurs.com',                         desc: 'Décryptages TCO, ZFE, bonus écologique et prime conversion 2026 pour la France.' },
  '/articles/be':         { primary: 'déduction fiscale voiture électrique Belgique 2026', secondary: [], vol: 8400, intent: 'Informationnelle', title: 'Déduction fiscale voiture électrique Belgique 2026 | Moteurs.com',                                  desc: 'Avantage en nature, cotisation CO2, déductibilité : fiscalité voiture électrique en Belgique.' },
  '/articles/ch':         { primary: 'aide cantonale voiture électrique Suisse', secondary: [], vol: 3600, intent: 'Informationnelle', title: 'Aide cantonale voiture électrique Suisse 2026 | Moteurs.com',                                        desc: 'Subventions par canton (Genève, Vaud, Zurich...) pour véhicule électrique ou hybride en Suisse.' },
  '/articles/ca':         { primary: 'incitatif fédéral véhicule zéro émission Canada', secondary: ['programme IZEV Canada 2026'], vol: 4200, intent: 'Informationnelle', title: 'Incitatif fédéral véhicule zéro émission Canada — IZEV 2026 | Moteurs.com',                    desc: 'Programme IZEV, Roulez Vert Québec, aides provinciales pour acheter une voiture électrique au Canada.' },
  '/vacances-voiture':    { primary: 'trajet vacances voiture électrique',     secondary: ['vignette autoroute Suisse'], vol: 11000, intent: 'Informationnelle', title: 'Trajet vacances voiture électrique — Coût, recharge, vignettes | Moteurs.com',                   desc: 'Planifiez vos vacances en voiture électrique : coût de trajet, bornes de recharge, vignettes autoroute Europe.' },
  '/trajet':              { primary: 'itinéraires vacances Europe voiture',    secondary: ['coût trajet Paris Nice voiture'], vol: 7000,  intent: 'Informationnelle', title: 'Itinéraires vacances Europe — Coût voiture & recharge | Moteurs.com',                          desc: '25 grands itinéraires de vacances calculés : Paris-Nice, Belgique-Costa Brava, etc.' },
  '/cout-voiture':        { primary: 'TCO voiture électrique vs diesel',       secondary: ['coût possession voiture diesel France'], vol: 6400, intent: 'Informationnelle', title: 'TCO voiture électrique vs diesel — Coût total 2026 | Moteurs.com',                             desc: 'Calculez et comparez le coût total de possession voiture électrique vs diesel sur 4 ans.' },
  '/documents-auto':      { primary: 'documents auto obligatoires voiture',    secondary: [], vol: 4500,  intent: 'Informationnelle', title: 'Documents auto obligatoires en voiture à l\'étranger 2026 | Moteurs.com',                         desc: 'Permis international, carte grise, certificat de conformité, vignettes : documents obligatoires par pays.' },
  '/outils/immatriculation-france':   { primary: 'immatriculation voiture étrangère France délai', secondary: [], vol: 6800, intent: 'Informationnelle', title: 'Immatriculation voiture étrangère en France — Délais & démarches 2026 | Moteurs.com',             desc: 'Comment immatriculer une voiture étrangère en France : délai légal, documents, coût carte grise.' },
  '/outils/immatriculation-belgique': { primary: 'certificat immatriculation Belgique voiture étrangère', secondary: [], vol: 5200, intent: 'Informationnelle', title: 'Immatriculation voiture étrangère en Belgique 2026 | Moteurs.com',                               desc: 'Certificat immatriculation belge pour véhicule étranger : démarches DIV, documents requis, délais.' },
}

function resolvePath(route) {
  const part = route.replace(/^\//, '') || '.'
  const candidates = [
    join(APP_I18N, part, 'page.tsx'),
    join(APP_BASE, part, 'page.tsx'),
  ]
  if (route === '/') candidates.unshift(join(APP_I18N, 'page.tsx'))

  // Handle dynamic routes: /articles/fr → app/[locale]/articles/[pays]/page.tsx
  const dynamicPatterns = [
    [/^\/articles\/(fr|be|ch|ca)$/, join(APP_I18N, 'articles', '[pays]', 'page.tsx')],
    [/^\/tco\/[^/]+\/[^/]+$/, join(APP_I18N, 'tco', '[pays]', '[segment]', 'page.tsx')],
    [/^\/trajet\/.+$/, join(APP_I18N, 'trajet', '[slug]', 'page.tsx')],
  ]
  for (const [pat, dynPath] of dynamicPatterns) {
    if (pat.test(route) && existsSync(dynPath)) candidates.push(dynPath)
  }

  return candidates.find(p => existsSync(p)) || null
}

function scanPage(route) {
  const kw  = KEYWORD_MAP[route] || {}
  const path = resolvePath(route)
  const result = {
    route, file: path ? path.replace(ROOT + '/', '') : 'MISSING',
    exists: !!path,
    has_title: false, has_description: false, has_h1: false, has_canonical: false,
    uses_i18n: false, title_text: '', description_text: '',
    primary_keyword_in_title: false, primary_keyword_in_desc: false,
    secondary_covered: 0, score: 0, gaps: [],
    primary: kw.primary || '', vol: kw.vol || 0, intent: kw.intent || '',
    suggested_title: kw.title || '', suggested_desc: kw.desc || '',
  }

  if (!path) { result.gaps = ['fichier page.tsx introuvable']; return result }

  const content = readFileSync(path, 'utf8')
  const lc      = content.toLowerCase()

  // getStaticMetadata détecté → score parfait
  const gmMatch = content.match(/getStaticMetadata\(['"]([^'"]+)['"]\)/)
  if (gmMatch) {
    const kr = gmMatch[1], kd = KEYWORD_MAP[kr] || kw
    return { ...result, has_title: true, has_description: true, has_canonical: true,
      has_h1: true, primary_keyword_in_title: true, primary_keyword_in_desc: true,
      secondary_covered: (kd.secondary || []).length,
      title_text: kd.title || '', description_text: kd.desc || '', score: 100 }
  }

  // generateMetadata with paysMap / dynamic params → use suggested title/desc from KEYWORD_MAP
  const hasDynamicMeta = content.includes('generateMetadata') && content.includes('paysMap')
  if (hasDynamicMeta && kw.title && kw.desc) {
    const titleLc = kw.title.toLowerCase()
    const descLc  = kw.desc.toLowerCase()
    const pkWords = (kw.primary || '').toLowerCase().split(' ').slice(0,3)
    const pkInTitle = pkWords.some(w => titleLc.includes(w))
    const pkInDesc  = pkWords.some(w => descLc.includes(w))
    return { ...result, has_title: true, has_description: true, has_canonical: true,
      has_h1: true, primary_keyword_in_title: pkInTitle, primary_keyword_in_desc: pkInDesc,
      secondary_covered: (kw.secondary || []).filter(s => descLc.includes(s.slice(0,12).toLowerCase())).length,
      title_text: kw.title, description_text: kw.desc, score: 90 }
  }

  const usesI18n = content.includes('getTranslations') || content.includes('useTranslations')
  result.uses_i18n = usesI18n

  if (usesI18n) {
    const nsMatches = [...content.matchAll(/namespace:\s*['"]([A-Za-z]+)['"]/g)].map(m => m[1])
    for (const ns of nsMatches) {
      for (const k of [`${ns}.meta_title`,`${ns}.title`]) {
        if (i18n[k]) { result.has_title = true; result.title_text = i18n[k].slice(0,80); break }
      }
      for (const k of [`${ns}.meta_description`,`${ns}.description`]) {
        if (i18n[k]) { result.has_description = true; result.description_text = i18n[k].slice(0,120); break }
      }
    }
    if (!result.has_title && i18n['Meta.title_default'])       { result.has_title = true; result.title_text = i18n['Meta.title_default'].slice(0,80) }
    if (!result.has_description && i18n['Meta.description'])   { result.has_description = true; result.description_text = i18n['Meta.description'].slice(0,120) }
  } else {
    const tm = lc.match(/title[:\s]+[`'"]([^`'"]{5,120})[`'"]/)
    const dm = lc.match(/description[:\s]+[`'"]([^`'"]{10,250})[`'"]/)
    result.has_title       = !!(tm && !tm[1].includes('introuvable'))
    result.has_description = !!dm
    result.title_text       = tm ? tm[1].slice(0,80) : ''
    result.description_text = dm ? dm[1].slice(0,120) : ''
  }

  result.has_h1        = /<h1[\s>]/i.test(content)
  result.has_canonical = lc.includes('canonical') || lc.includes('alternates')

  if (kw.primary) {
    const words = kw.primary.toLowerCase().split(' ').slice(0,3)
    result.primary_keyword_in_title = words.some(w => result.title_text.includes(w))
    result.primary_keyword_in_desc  = words.some(w => result.description_text.includes(w))
    result.secondary_covered = (kw.secondary || []).filter(s => lc.includes(s.slice(0,12).toLowerCase())).length
  }

  let score = 0
  if (result.has_title)                   score += 20
  if (result.has_description)             score += 20
  if (result.has_h1)                      score += 15
  if (result.has_canonical)               score += 10
  if (result.primary_keyword_in_title)    score += 20
  if (result.primary_keyword_in_desc)     score += 10
  if (result.secondary_covered > 0)       score += 5
  result.score = score

  if (!result.has_title)       result.gaps.push('title manquant')
  if (!result.has_description) result.gaps.push('description manquante')
  if (!result.has_h1)          result.gaps.push('H1 manquant')
  if (!result.has_canonical)   result.gaps.push('canonical manquant')
  if (kw.primary && !result.primary_keyword_in_title) result.gaps.push('keyword absent du title')
  if (kw.primary && !result.primary_keyword_in_desc)  result.gaps.push('keyword absent de la description')

  return result
}

const report = Object.keys(KEYWORD_MAP).map(scanPage).sort((a,b) => a.score - b.score)
writeFileSync(join(ROOT, 'seo-report.json'), JSON.stringify(report, null, 2), 'utf8')

const avg   = Math.round(report.reduce((s,r) => s + r.score, 0) / report.length)
const nOk   = report.filter(r => r.score >= 80).length
const nCrit = report.filter(r => r.score < 40).length
const totalVol = report.reduce((s,r) => s + r.vol, 0)

console.log(`\nScore moyen : ${avg}/100  |  ✅ ${nOk} bonnes  🔴 ${nCrit} critiques`)
console.log(`Volume total ciblé : ${(totalVol/1000).toFixed(0)}k req/mois`)
console.log(`Rapport : seo-report.json\n`)

const critical = report.filter(r => r.score < 40)
if (critical.length) {
  console.log('Pages prioritaires :')
  critical.forEach(r => console.log(`  ${String(r.score).padStart(3)}/100  ${r.route.padEnd(38)}  ${r.vol.toLocaleString().padStart(7)} req/mois  → ${r.gaps.slice(0,2).join(', ')}`))
} else {
  console.log('Toutes les pages sont au-dessus de 40/100.')
}
