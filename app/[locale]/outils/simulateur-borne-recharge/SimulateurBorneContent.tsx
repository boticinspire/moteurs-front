'use client'

import { useState, useEffect } from 'react'
import { Link, usePathname } from '@/i18n/navigation'
import { useUserContext } from '@/context/UserContextProvider'

// ─── TYPES ───────────────────────────────────────────────────────────────────
type Pays = 'BE' | 'FR' | 'CH' | 'LU'
type TypeLieu = 'maison' | 'copropriete' | 'entreprise'
type TypeReseau = 'mono' | 'tri_sans_neutre' | 'tri_avec_neutre'
type Puissance = 25 | 40 | 63 | 80 | 100
type Distance = 'courte' | 'moyenne' | 'longue_int' | 'longue_ext'
type EtatTableau = 'recent' | 'sature'
type TypeBorne = 'basique_7' | 'smart_7' | 'smart_11' | 'smart_22'
type AgeBatiment = 'neuf' | 'moyen' | 'ancien'

interface Config {
  pays: Pays
  typeLieu: TypeLieu
  typeReseau: TypeReseau
  puissanceCompteur: Puissance
  distance: Distance
  etatTableau: EtatTableau
  typeBorne: TypeBorne
  ageBatiment: AgeBatiment
}

interface BudgetLine {
  label: string
  low: number
  high: number
  note: string
}

interface Alert {
  level: 'error' | 'warn' | 'info'
  icon: string
  title: string
  body: string
}

// ─── STATIC DATA ─────────────────────────────────────────────────────────────
const PAYS_INFO: Record<Pays, { flag: string; name: string }> = {
  BE: { flag: '🇧🇪', name: 'Belgique' },
  FR: { flag: '🇫🇷', name: 'France' },
  CH: { flag: '🇨🇭', name: 'Suisse' },
  LU: { flag: '🇱🇺', name: 'Luxembourg' },
}

const BORNE_PRICES: Record<TypeBorne, { low: number; high: number; desc: string }> = {
  basique_7: { low: 450,  high: 830,  desc: 'Borne basique 7,4 kW (non connectée) + protections type B' },
  smart_7:   { low: 700,  high: 1180, desc: 'Borne connectée 7,4 kW (délestage, app, solaire) + protections type B' },
  smart_11:  { low: 900,  high: 1500, desc: 'Borne connectée 11 kW triphasée (OCPP) + protections type B' },
  smart_22:  { low: 1120, high: 2000, desc: 'Borne connectée 22 kW triphasée (OCPP) + protections type B' },
}

const CABLAGE_PRICES: Record<Distance, { low: number; high: number; desc: string }> = {
  courte:     { low: 150,  high: 350,  desc: "Câblage + main d’œuvre (< 5 m)" },
  moyenne:    { low: 350,  high: 700,  desc: "Câblage + main d’œuvre (5–15 m)" },
  longue_int: { low: 600,  high: 1000, desc: "Câblage + main d’œuvre (> 15 m, intérieur)" },
  longue_ext: { low: 1000, high: 2500, desc: "Câblage + main d’œuvre + tranchée extérieure (> 15 m)" },
}

const TABLEAU_PRICES: Record<EtatTableau, { low: number; high: number; desc: string }> = {
  recent:  { low: 0,   high: 80,  desc: 'Ajout disjoncteur dédié (tableau récent)' },
  sature:  { low: 400, high: 900, desc: 'Mise en conformité / extension tableau électrique' },
}

const INSPECT_PRICES: Record<Pays, { low: number; high: number; label: string }> = {
  BE: { low: 150, high: 250, label: 'Contrôle RGIE (obligatoire en Belgique)' },
  FR: { low: 100, high: 200, label: 'Visa Consuel (obligatoire en France)' },
  CH: { low: 200, high: 350, label: 'Contrôle NIBT (obligatoire en Suisse)' },
  LU: { low: 150, high: 250, label: 'Contrôle électrique OAI (obligatoire au Luxembourg)' },
}

const STEP_LABELS = [
  'Pays', 'Type de lieu', 'Réseau électrique', 'Puissance compteur',
  'Distance tableau → borne', 'État du tableau', 'Borne souhaitée', 'Âge du bâtiment',
]

// ─── HELPERS ─────────────────────────────────────────────────────────────────
const fmt = (n: number) => n.toLocaleString('fr-BE')

function getEffectiveBorne(config: Config): TypeBorne {
  if (config.typeReseau === 'mono' && (config.typeBorne === 'smart_22' || config.typeBorne === 'smart_11')) {
    return 'smart_7'
  }
  return config.typeBorne
}

function getTVA(config: Config): { rate: number; label: string; note: string } {
  const { pays, typeLieu, ageBatiment } = config
  if (pays === 'BE') {
    if (typeLieu === 'entreprise') return { rate: 21, label: 'TVA 21 %', note: "Usage professionnel. La TVA est en principe déductible pour les assujettis. La déduction majorée (150 % puis 100 %) est expirée depuis fin 2024." }
    if (ageBatiment === 'ancien') return { rate: 6, label: 'TVA 6 %', note: "Taux réduit applicable aux travaux de rénovation sur logement résidentiel de plus de 10 ans, si la borne est fixée de façon permanente au bâtiment ou au garage. À confirmer avec un installateur agréé." }
    return { rate: 21, label: 'TVA 21 %', note: "Logement de moins de 10 ans : taux normal. Le taux de 6 % n’est accessible qu’après 10 ans d’ancienneté du bâtiment." }
  }
  if (pays === 'FR') {
    if (typeLieu === 'entreprise') return { rate: 20, label: 'TVA 20 %', note: "Taux normal pour installations commerciales et professionnelles." }
    if (ageBatiment === 'neuf') return { rate: 20, label: 'TVA 20 %', note: "Logement de moins de 2 ans : taux normal. Le taux réduit ne s’applique qu’aux logements anciens." }
    return { rate: 5.5, label: 'TVA 5,5 %', note: "Taux réduit énergie applicable depuis 2023 pour l’installation d’une borne IRVE sur résidence principale de plus de 2 ans (BOI-TVA-LIQ-30-20-90). À confirmer avec votre prestataire RGE / IRVE qualifié." }
  }
  if (pays === 'CH') {
    return { rate: 8.1, label: 'TVA 8,1 %', note: "Taux normal suisse. Des aides cantonales peuvent s’appliquer (Programme Bâtiments, aides cantonales pour la mobilité électrique)." }
  }
  // LU
  if (typeLieu === 'entreprise') return { rate: 17, label: 'TVA 17 %', note: "Taux normal luxembourgeois." }
  if (ageBatiment === 'neuf') return { rate: 17, label: 'TVA 17 %', note: "Logement neuf : taux normal. Le super-taux réduit de 3 % ne s’applique qu’aux logements existants à usage de résidence principale." }
  return { rate: 3, label: 'TVA 3 %', note: "Super-taux réduit luxembourgeois applicable aux travaux de rénovation sur résidence principale de plus de 2 ans." }
}

function getBudgetLines(config: Config): BudgetLine[] {
  const borne = getEffectiveBorne(config)
  const lines: BudgetLine[] = []
  const bp = BORNE_PRICES[borne]
  lines.push({
    label: bp.desc, low: bp.low, high: bp.high,
    note: borne.startsWith('smart')
      ? 'Inclut différentiel Type B (norme IEC 62955). Borne OCPP : délestage dynamique, heures creuses, compatibilité solaire.'
      : 'Inclut différentiel Type B. Solution plug & charge sans connectivité réseau.',
  })
  const cp = CABLAGE_PRICES[config.distance]
  lines.push({ label: cp.desc, low: cp.low, high: cp.high, note: 'Section câble 6 ou 10 mm² selon puissance. Inclut gaines, percements, raccordement tableau et borne.' })
  const tp = TABLEAU_PRICES[config.etatTableau]
  if (tp.high > 0) {
    lines.push({
      label: tp.desc, low: tp.low, high: tp.high,
      note: config.etatTableau === 'sature'
        ? 'Extension ou remplacement partiel + mise en conformité réglementaire.'
        : 'Fourniture et pose du disjoncteur bipolaire ou différentiel dédié.',
    })
  }
  const ip = INSPECT_PRICES[config.pays]
  lines.push({ label: ip.label, low: ip.low, high: ip.high, note: 'Obligatoire avant mise en service. À inclure dans le devis de votre électricien agréé.' })
  return lines
}

function getAlerts(config: Config): Alert[] {
  const alerts: Alert[] = []
  if (config.typeReseau === 'tri_sans_neutre' && (config.typeBorne === 'smart_11' || config.typeBorne === 'smart_22')) {
    alerts.push({ level: 'error', icon: '⛔',
      title: 'Réseau IT (3×230 V sans neutre) — Incompatibilité borne triphasée standard',
      body: "La quasi-totalité des bornes 11 kW et 22 kW du marché sont conçues pour 3×400 V+N (réseau TT). Votre réseau sans neutre — fréquent dans les vieilles habitations belges — nécessite un transformateur d’isolement (500– 2 000 €), une borne certifiée IT, ou un passage au réseau 3×400 V+N via votre GRD. Consultez un électricien agréé avant tout achat.",
    })
  }
  if (config.typeReseau === 'mono' && (config.typeBorne === 'smart_22' || config.typeBorne === 'smart_11')) {
    const kw = config.typeBorne === 'smart_22' ? '22 kW' : '11 kW'
    alerts.push({ level: 'error', icon: '⛔',
      title: `${kw} impossible en monophasé — ramené à 7,4 kW dans l’estimation`,
      body: `La charge ${kw} requiert un réseau triphasé (3×400 V+N). En monophasé 230 V, la puissance AC maximale est 7,4 kW (32 A × 230 V). L’estimation a été recalculée sur la base d’une borne 7,4 kW connectée.`,
    })
  }
  if (config.typeReseau === 'mono' && config.puissanceCompteur === 25) {
    const grd: Record<Pays, string> = { BE: 'Sibelga (BXL) / Fluvius (Flandre) / ORES-RESA (Wallonie)', FR: 'Enedis', CH: 'votre GRD cantonal', LU: 'Creos' }
    alerts.push({ level: 'warn', icon: '⚠️',
      title: 'Compteur 25 A — Renforcement de puissance nécessaire',
      body: `Un compteur monophasé 25 A fournit ≈ 5,75 kW. Une borne 7,4 kW tire 32 A : le disjoncteur déclencherait. Demandez un relèvement de calibre à ${grd[config.pays]} avant l’installation. Délai : 2 à 6 semaines. Surcoût : 300– 1 200 € non inclus dans l’estimation ci-dessus.`,
    })
  }
  if (config.typeReseau === 'mono' && config.puissanceCompteur === 40 && (config.typeBorne === 'basique_7' || config.typeBorne === 'smart_7')) {
    alerts.push({ level: 'warn', icon: '⚠️',
      title: 'Compteur 40 A — Délestage dynamique fortement conseillé',
      body: "Avec un compteur 40 A (≈ 9,2 kW), une borne 7,4 kW absorbe 32 A en charge pleine. La marge pour les autres usages simultanés (plaques, eau chaude, sèche-linge…) est très faible. Une borne connectée avec délestage dynamique module la puissance en temps réel et évite les déclenchements — souvent sans renforcer le compteur.",
    })
  }
  if (config.typeLieu === 'copropriete') {
    const loi: Record<Pays, string> = {
      BE: "La loi belge encadre le droit à la prise en copropriété, mais des contraintes techniques (colonnes montantes, sécurité incendie) peuvent être imposées.",
      FR: "La loi Élan facilite le droit à la prise, mais une autorisation de l’assemblée générale reste obligatoire pour les travaux sur parties communes.",
      CH: "L’accord de l’assemblée des copropriétaires est requis ; les délais varient selon les cantons.",
      LU: "L’accord de l’assemblée générale de la copropriété est nécessaire.",
    }
    alerts.push({ level: 'info', icon: '📋',
      title: 'Copropriété — Procédure collective et délais à anticiper',
      body: `${loi[config.pays]} Prévoyez une colonne montante dédiée, un coffret de comptage individuel, et potentiellement 500 à 2 000 € de frais supplémentaires. Délai réaliste : 3 à 18 mois selon la réactivité du syndic.`,
    })
  }
  if (config.distance === 'longue_ext') {
    alerts.push({ level: 'warn', icon: '⛏️',
      title: 'Tranchée extérieure — Fourchette large, obtenez au moins 2 devis',
      body: "Le coût varie fortement selon la nature du sol (terre, béton, carrelage), la longueur réelle, et l’obligation de remise en état des revêtements. Précisez qui est responsable de la réfection du trottoir ou de l’allée.",
    })
  }
  if (config.pays === 'FR') {
    alerts.push({ level: 'info', icon: '💡',
      title: "France 2026 — Crédit d’impôt IRVE expiré, programme ADVENIR actif",
      body: "Le crédit d’impôt pour borne à domicile (CITE IRVE) s’est terminé le 31/12/2025. Aucune aide fiscale nationale directe ne subsiste pour les particuliers. Le ROI se construit via la recharge intelligente (tarif Heures Creuses, autoconsommation solaire). Programme ADVENIR toujours actif pour copropriétés (jusqu’à 50 % de la facture TTC) et parkings ouverts au public.",
    })
  }
  if (config.pays === 'BE' && config.typeLieu === 'entreprise') {
    alerts.push({ level: 'info', icon: '💡',
      title: 'Belgique entreprise 2026 — Déduction majorée expirée',
      body: "La déduction majorée à 150 % (jusqu’au 31/03/2023) puis à 100 % (jusqu’au 31/12/2024) est expirée. En 2026, seule la déduction standard à 100 % s’applique. Des aides régionales peuvent subsister : prime VLAIO (Flandre), prime Wallonie Entreprises, aide Bruxelles Économie.",
    })
  }
  if (config.pays === 'CH') {
    alerts.push({ level: 'info', icon: '💡',
      title: 'Suisse — Aides cantonales et Programme Bâtiments',
      body: "Il n’existe pas d’aide fédérale directe pour les bornes de recharge en Suisse. Plusieurs cantons (Genève, Vaud, Zurich, Berne) offrent des subventions via le Programme Bâtiments ou des programmes cantonaux de mobilité électrique. Votre installateur certifié SIV peut vous orienter.",
    })
  }
  if (config.typeBorne === 'smart_22' && config.typeReseau === 'tri_avec_neutre') {
    alerts.push({ level: 'info', icon: '🚗',
      title: "Vérifiez la compatibilité de votre véhicule avec la charge AC 22 kW",
      body: "La majorité des VE populaires (Tesla Model 3/Y, VW ID.3/4, Renault Mégane E-Tech…) plafonnent à 7,4 kW ou 11 kW en AC. Seuls certains modèles (Renault Zoé, quelques Mercedes EQ) acceptent 22 kW. Si votre VE est limité à 11 kW, une borne 11 kW est suffisante et moins coûteuse.",
    })
  }
  return alerts
}

function getRecoConfig(config: Config) {
  const eff = getEffectiveBorne(config)
  const adjusted = eff !== config.typeBorne
  const powerLabels: Record<TypeBorne, string> = {
    basique_7: '7,4 kW — Monophasé (230 V)',
    smart_7:   '7,4 kW — Monophasé (230 V)',
    smart_11:  '11 kW — Triphasé (400 V)',
    smart_22:  '22 kW — Triphasé (400 V)',
  }
  const borneLabels: Record<TypeBorne, string> = {
    basique_7: 'Mode 3 — prise T2 fixe — non connectée',
    smart_7:   'OCPP — délestage dynamique — programmation heures creuses — app mobile',
    smart_11:  'OCPP — délestage dynamique — charge 2× plus rapide — app mobile',
    smart_22:  'OCPP — délestage dynamique — puissance AC maximale — vérifier compatibilité VE',
  }
  const summaries: Record<TypeBorne, string> = {
    basique_7: "Solution économique pour recharge nocturne sans contrainte de temps. Pas de connectivité, mais idéale avec un contrat heures creuses et des besoins simples.",
    smart_7:   "Recommandation standard pour la majorité des ménages. Le délestage dynamique évite souvent le renforcement du compteur ; la programmation optimise la charge aux heures creuses ou à la production solaire.",
    smart_11:  "Optimal si votre réseau est triphasé et que votre VE supporte 11 kW. Recharge environ 2× plus rapide qu’en 7,4 kW pour un surcoût modéré. Délestage dynamique conseillé.",
    smart_22:  "Réservé aux véhicules acceptant la charge AC 22 kW. Investissement élevé, à justifier par un usage intensif (flotte, VE sans recharge nocturne longue possible).",
  }
  return { powerLabel: powerLabels[eff], borneLabel: borneLabels[eff], summary: summaries[eff], adjusted }
}

// ─── CSS ─────────────────────────────────────────────────────────────────────
const TOOL_CSS = `
.m-tool{
  --bg:var(--color-bg); --surface:var(--color-bg-card); --surface-2:var(--color-bg-alt);
  --text:var(--color-text); --text-soft:var(--color-text-soft); --text-faint:var(--color-text-muted);
  --line:var(--color-border); --line2:rgba(128,128,128,.10);
  --accent:var(--color-primary); --accent-deep:var(--color-primary-dark); --accent-soft:rgba(239,108,26,.14);
  --warn:#b0510c; --warn-soft:rgba(176,81,12,.12);
  --shadow:0 1px 2px rgba(16,24,43,.05),0 14px 34px -16px rgba(16,24,43,.2);
  --font-d:Georgia,"Times New Roman",serif;
  background:var(--bg);color:var(--text);font-size:16px;line-height:1.55;-webkit-font-smoothing:antialiased;
}
html[data-theme="dark"] .m-tool{
  --warn:#f2a65a; --warn-soft:rgba(242,166,90,.15); --line2:rgba(255,255,255,.05);
  --shadow:0 1px 2px rgba(0,0,0,.4),0 18px 40px -18px rgba(0,0,0,.6);
}
.m-tool *{box-sizing:border-box;margin:0;padding:0}
.m-tool .wrap{max-width:820px;margin:0 auto;padding:26px 22px 70px}
.m-tool .crumb{font-size:.82rem;color:var(--text-faint);margin-bottom:18px}
.m-tool .crumb a{color:var(--text-soft);text-decoration:none}
.m-tool .crumb a:hover{color:var(--accent)}
.m-tool .crumb span{margin:0 7px;opacity:.5}
.m-tool .head{border-bottom:1px solid var(--line);padding-bottom:22px;margin-bottom:28px}
.m-tool .meta-row{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:14px}
.m-tool .chip{font-size:.74rem;font-weight:700;letter-spacing:.04em;text-transform:uppercase;
  padding:5px 11px;border-radius:999px;background:var(--surface-2);border:1px solid var(--line);color:var(--text-soft)}
.m-tool .chip-acc{color:var(--accent)}
.m-tool h1{font-family:var(--font-d);font-weight:600;font-size:clamp(1.8rem,4.2vw,2.6rem);
  line-height:1.1;letter-spacing:-.01em;max-width:30ch;margin-bottom:.3em}
.m-tool .lede{color:var(--text-soft);max-width:66ch;font-size:1.02rem}
.m-tool .card{background:var(--surface);border:1px solid var(--line);border-radius:16px;
  box-shadow:var(--shadow);padding:26px;margin-bottom:20px}
/* wizard */
.m-tool .progress{display:flex;gap:5px;margin-bottom:8px}
.m-tool .ps{flex:1;height:5px;border-radius:3px;background:var(--line);transition:background .25s}
.m-tool .ps.done{background:var(--accent)} .m-tool .ps.active{background:var(--accent);opacity:.5}
.m-tool .step-ctr{font-size:.8rem;color:var(--text-soft);font-weight:600;margin-bottom:20px}
.m-tool .step-q{font-family:var(--font-d);font-size:clamp(1.18rem,3vw,1.42rem);
  font-weight:600;line-height:1.3;margin-bottom:6px}
.m-tool .step-hint{font-size:.87rem;color:var(--text-soft);margin-bottom:22px;line-height:1.55;max-width:64ch}
.m-tool .opts{display:grid;grid-template-columns:1fr;gap:10px;margin-bottom:28px}
@media(min-width:540px){.m-tool .opts.col2{grid-template-columns:1fr 1fr}}
.m-tool .opt{display:flex;align-items:flex-start;gap:13px;padding:14px 16px;
  border:1.5px solid var(--line);border-radius:12px;cursor:pointer;
  background:var(--surface-2);transition:border-color .15s,background .15s;text-align:left;width:100%;font:inherit}
.m-tool .opt:hover{border-color:var(--accent);background:var(--accent-soft)}
.m-tool .opt.sel{border-color:var(--accent-deep);background:var(--accent-soft)}
.m-tool .oi{font-size:1.45rem;flex-shrink:0;line-height:1.1;margin-top:1px}
.m-tool .ot{display:block;font-weight:700;font-size:.95rem;color:var(--text)}
.m-tool .od{display:block;font-size:.8rem;color:var(--text-soft);margin-top:3px;line-height:1.4}
.m-tool .opt.sel .ot{color:var(--accent-deep)}
.m-tool .wnav{display:flex;gap:12px;flex-wrap:wrap}
.m-tool .btn-p{padding:12px 28px;background:var(--accent);color:#fff;border:none;border-radius:10px;
  font:inherit;font-weight:700;font-size:.95rem;cursor:pointer;transition:background .15s}
.m-tool .btn-p:hover{background:var(--accent-deep)}
.m-tool .btn-g{padding:12px 20px;background:transparent;color:var(--text-soft);
  border:1.5px solid var(--line);border-radius:10px;font:inherit;font-weight:600;font-size:.95rem;
  cursor:pointer;transition:all .15s}
.m-tool .btn-g:hover{border-color:var(--text-soft);color:var(--text)}
/* results */
.m-tool .rc{background:var(--surface);border:1px solid var(--line);border-radius:16px;
  box-shadow:var(--shadow);padding:22px 24px;margin-bottom:18px}
.m-tool .rh{font-family:var(--font-d);font-size:1.08rem;font-weight:600;
  margin-bottom:14px;display:flex;align-items:center;gap:9px}
.m-tool .rn{display:inline-flex;width:24px;height:24px;border-radius:50%;
  background:var(--accent);color:#fff;font-size:.7rem;font-weight:800;
  align-items:center;justify-content:center;flex-shrink:0}
.m-tool .cfgr{display:flex;justify-content:space-between;gap:12px;
  padding:8px 0;border-bottom:1px solid var(--line2);font-size:.89rem}
.m-tool .cfgr:last-child{border-bottom:none}
.m-tool .cl{color:var(--text-soft)} .m-tool .cv{font-weight:600;text-align:right;max-width:55%}
.m-tool .rbox{background:var(--accent-soft);border:1px solid rgba(239,108,26,.3);
  border-radius:11px;padding:14px 16px;margin-top:14px;font-size:.88rem;line-height:1.55}
.m-tool .adj{font-size:.78rem;background:var(--warn-soft);color:var(--warn);
  border-radius:7px;padding:6px 10px;margin-top:8px;font-weight:600}
.m-tool .btab{width:100%;border-collapse:collapse;font-size:.88rem;margin-top:4px}
.m-tool .btab th{text-align:left;padding:8px 10px;font-size:.72rem;text-transform:uppercase;
  letter-spacing:.04em;color:var(--text-soft);border-bottom:1.5px solid var(--line);font-weight:700}
.m-tool .btab th.r{text-align:right}
.m-tool .btab td{padding:10px 10px;border-bottom:1px solid var(--line2);vertical-align:top}
.m-tool .btab td.r{text-align:right;font-variant-numeric:tabular-nums;font-weight:600;white-space:nowrap}
.m-tool .btab .nota{font-size:.74rem;color:var(--text-soft);margin-top:3px;display:block;line-height:1.35}
.m-tool .btab tr.tot td{border-top:2px solid var(--text);border-bottom:none;font-weight:700;padding-top:12px;font-size:.94rem}
.m-tool .tvabox{background:var(--accent-soft);border:1px solid rgba(239,108,26,.3);border-radius:10px;padding:14px 16px;margin-top:14px}
.m-tool .tvr{display:flex;justify-content:space-between;align-items:baseline;font-size:.9rem;padding:4px 0}
.m-tool .tvl{color:var(--text-soft)} .m-tool .tvv{font-weight:700;font-variant-numeric:tabular-nums}
.m-tool .tvtot{border-top:1px solid rgba(239,108,26,.4);margin-top:8px;padding-top:8px}
.m-tool .tvtot .tvl{color:var(--text);font-weight:600}
.m-tool .tvtot .tvv{font-size:1.2rem;color:var(--accent-deep)}
.m-tool .tvnote{font-size:.77rem;color:var(--text-soft);margin-top:8px;line-height:1.5}
.m-tool .abox{border-radius:11px;padding:14px 16px;margin-bottom:11px;border:1px solid}
.m-tool .abox.error{background:rgba(220,38,38,.07);border-color:rgba(220,38,38,.25)}
.m-tool .abox.warn{background:var(--warn-soft);border-color:rgba(176,81,12,.28)}
.m-tool .abox.info{background:var(--surface-2);border-color:var(--line)}
.m-tool .at{font-weight:700;font-size:.88rem;margin-bottom:6px;display:flex;align-items:baseline;gap:6px}
.m-tool .ab{font-size:.83rem;color:var(--text-soft);line-height:1.55}
.m-tool .disc{margin-top:26px;background:var(--warn-soft);border:1px solid var(--line);
  border-radius:13px;padding:15px 17px;font-size:.82rem;line-height:1.5}
.m-tool .disc b{color:var(--warn)}
.m-tool .restart{display:inline-flex;align-items:center;gap:6px;padding:10px 18px;
  background:var(--surface-2);border:1.5px solid var(--line);border-radius:10px;
  font:inherit;font-size:.9rem;font-weight:600;cursor:pointer;color:var(--text-soft);
  transition:all .15s;text-decoration:none;margin-top:12px}
.m-tool .restart:hover{border-color:var(--accent);color:var(--accent)}
/* cta-next */
.m-tool .cta-next{background:linear-gradient(135deg,var(--accent-soft),rgba(239,108,26,.15));border:1.5px solid rgba(239,108,26,.30);border-radius:16px;padding:28px 24px;margin-top:24px;text-align:center}
.m-tool .cn-icon{font-size:2.2rem;margin-bottom:10px}
.m-tool .cta-next h3{font-size:1rem;color:var(--text-soft);font-weight:600;line-height:1.5;margin-bottom:18px;max-width:56ch;margin-left:auto;margin-right:auto}
.m-tool .btn-cta{display:inline-block;padding:14px 28px;background:var(--accent);color:#fff;border-radius:11px;font-weight:700;font-size:.97rem;text-decoration:none;transition:background .15s;line-height:1.4}
.m-tool .btn-cta:hover{background:var(--accent-deep);color:#fff}
`

// ─── WIZARD STEPS = 8 ────────────────────────────────────────────────────────
const N_STEPS = 8

// ─── MAIN EXPORT ─────────────────────────────────────────────────────────────
export default function SimulateurBorneContent() {
  const { isReady, isBootstrapped, userId } = useUserContext()
  const pathname = usePathname()
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])

  if (!mounted || !isReady) return <div style={{ minHeight: '60vh' }} />

  if (!isBootstrapped) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
        <div style={{ width: 36, height: 36, borderRadius: '50%', border: '3px solid var(--color-border)', borderTopColor: 'var(--color-primary)', animation: 'spin .7s linear infinite' }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        <span style={{ color: 'var(--color-text-muted)', fontSize: '.88rem' }}>Chargement …</span>
      </div>
    )
  }

  if (!userId) {
    return (
      <section style={{ maxWidth: 560, margin: '0 auto', padding: '64px 22px', textAlign: 'center' }}>
        <div style={{ fontSize: '2.6rem', marginBottom: 14 }}>🔒</div>
        <h1 style={{ fontSize: '1.6rem', fontWeight: 700, marginBottom: 12, color: 'var(--color-text)' }}>
          Outil réservé aux membres Moteurs.com
        </h1>
        <p style={{ color: 'var(--color-text-muted)', lineHeight: 1.6, marginBottom: 26 }}>
          Ce simulateur budgétaire est gratuit et sans publicité, accessible aux membres inscrits.
          Créez un compte en 30 secondes — aucune carte bancaire requise.
        </p>
        <Link
          href={`/espace-membres?next=${encodeURIComponent(pathname)}`}
          style={{ display: 'inline-block', background: 'var(--color-primary)', color: '#fff', fontWeight: 700, padding: '12px 26px', borderRadius: 10, textDecoration: 'none' }}
        >
          Accéder / Créer un compte
        </Link>
        <div style={{ marginTop: 18 }}>
          <Link href="/outils" style={{ color: 'var(--color-text-muted)', fontSize: '.88rem' }}>← Retour aux outils</Link>
        </div>
      </section>
    )
  }

  return (
    <div className="m-tool">
      <style dangerouslySetInnerHTML={{ __html: TOOL_CSS }} />
      <div className="wrap">
        <nav className="crumb" aria-label="Fil d’Ariane">
          <a href="/">Accueil</a><span>&rsaquo;</span>
          <a href="/outils">Outils</a><span>&rsaquo;</span>
          Simulateur budget borne de recharge
        </nav>
        <header className="head">
          <div className="meta-row">
            <span className="chip">🔌 Installation IRVE</span>
            <span className="chip chip-acc">🇧🇪 🇫🇷 🇨🇭 🇱🇺 — 4 pays</span>
            <span className="chip">Réservé aux membres</span>
          </div>
          <h1>Simulateur de budget borne de recharge</h1>
          <p className="lede">
            Obtenez une <strong>estimation budgétaire HTVA et TVAC</strong> pour l’installation de votre borne IRVE —
            matériel, câblage, main d’œuvre, protections, inspection.
            Estimation pré-devis à faire valider par un électricien agréé.
          </p>
        </header>
        <Wizard />
      </div>
    </div>
  )
}

// ─── WIZARD ──────────────────────────────────────────────────────────────────
function Wizard() {
  const [step, setStep] = useState(0)
  const [config, setConfig] = useState<Config>({
    pays: 'BE',
    typeLieu: 'maison',
    typeReseau: 'mono',
    puissanceCompteur: 40,
    distance: 'moyenne',
    etatTableau: 'recent',
    typeBorne: 'smart_7',
    ageBatiment: 'ancien',
  })

  function set<K extends keyof Config>(k: K, v: Config[K]) {
    setConfig(prev => ({ ...prev, [k]: v }))
  }

  const next = () => setStep(s => s + 1)
  const back = () => setStep(s => s - 1)

  if (step >= N_STEPS) return <Results config={config} onRestart={() => setStep(0)} />

  const segs = Array.from({ length: N_STEPS }, (_, i) => i < step ? 'done' : i === step ? 'active' : '')

  return (
    <div className="card">
      <div className="progress" aria-label="Progression du formulaire">
        {segs.map((c, i) => <div key={i} className={`ps ${c}`} />)}
      </div>
      <div className="step-ctr">Étape {step + 1} / {N_STEPS} — {STEP_LABELS[step]}</div>

      {step === 0 && (
        <>
          <div className="step-q">Dans quel pays se trouve l’installation ?</div>
          <div className="step-hint">La réglementation, les taux de TVA et la fiscalité varient selon le pays.</div>
          <div className="opts col2">
            {(['BE', 'FR', 'CH', 'LU'] as Pays[]).map(p => (
              <button key={p} type="button" className={`opt${config.pays === p ? ' sel' : ''}`} onClick={() => set('pays', p)}>
                <span className="oi">{PAYS_INFO[p].flag}</span>
                <span><span className="ot">{PAYS_INFO[p].name}</span></span>
              </button>
            ))}
          </div>
        </>
      )}

      {step === 1 && (
        <>
          <div className="step-q">Quel est le type de lieu d’installation ?</div>
          <div className="step-hint">Impacte la TVA applicable, les démarches administratives et les contraintes techniques.</div>
          <div className="opts">
            {[
              { v: 'maison',      icon: '🏡', t: 'Maison individuelle',              d: "Logement avec accès direct au tableau électrique principal." },
              { v: 'copropriete', icon: '🏢', t: 'Copropriété / Appartement',           d: "Parking souterrain ou box privatif dans un immeuble. Accord de copropriété requis." },
              { v: 'entreprise',  icon: '🏭', t: 'Lieu de travail / PME / Parking entreprise', d: "Installation professionnelle : TVA déductible, règles IRVE entreprise." },
            ].map(({ v, icon, t, d }) => (
              <button key={v} type="button" className={`opt${config.typeLieu === v ? ' sel' : ''}`} onClick={() => set('typeLieu', v as TypeLieu)}>
                <span className="oi">{icon}</span>
                <span><span className="ot">{t}</span><span className="od">{d}</span></span>
              </button>
            ))}
          </div>
        </>
      )}

      {step === 2 && (
        <>
          <div className="step-q">Quel est le type de réseau électrique existant ?</div>
          <div className="step-hint">Visible sur votre tableau électrique ou dans le dossier technique du logement.</div>
          <div className="opts">
            {[
              { v: 'mono',            icon: '⚡', t: 'Monophasé — 230 V',               d: "Le plus courant. 1 disjoncteur principal. Maximum 7,4 kW pour une borne." },
              { v: 'tri_sans_neutre', icon: '⚠️', t: 'Triphasé sans neutre — 3×230 V (IT)', d: "Réseau ancien, surtout en Belgique. Incompatible avec la plupart des bornes triphasées standard." },
              { v: 'tri_avec_neutre', icon: '⚡⚡', t: 'Triphasé avec neutre — 3×400 V+N (TT)',  d: "Réseau moderne. Permet les bornes 11 et 22 kW. Bâtiments récents et professionnels." },
            ].map(({ v, icon, t, d }) => (
              <button key={v} type="button" className={`opt${config.typeReseau === v ? ' sel' : ''}`} onClick={() => set('typeReseau', v as TypeReseau)}>
                <span className="oi">{icon}</span>
                <span><span className="ot">{t}</span><span className="od">{d}</span></span>
              </button>
            ))}
          </div>
        </>
      )}

      {step === 3 && (
        <>
          <div className="step-q">Quelle est la puissance de votre compteur ?</div>
          <div className="step-hint">Indiquée sur votre contrat d’électricité ou le disjoncteur de branchement (en ampères).</div>
          <div className="opts col2">
            {([25, 40, 63, 80, 100] as Puissance[]).map(p => (
              <button key={p} type="button" className={`opt${config.puissanceCompteur === p ? ' sel' : ''}`} onClick={() => set('puissanceCompteur', p)}>
                <span className="oi">{p <= 25 ? '🔴' : p <= 40 ? '🟡' : '🟢'}</span>
                <span>
                  <span className="ot">{p} A</span>
                  <span className="od">≈ {(p * 230 / 1000).toFixed(1)} kW disponibles</span>
                </span>
              </button>
            ))}
          </div>
        </>
      )}

      {step === 4 && (
        <>
          <div className="step-q">Distance tableau électrique → borne ?</div>
          <div className="step-hint">Mesurez le trajet réel des gaines (pas en ligne droite). Comptez les percements, couloirs et escaliers.</div>
          <div className="opts">
            {[
              { v: 'courte',     icon: '📏',   t: 'Courte — moins de 5 m',             d: "Borne dans le même local que le tableau (garage attenant, cellier)." },
              { v: 'moyenne',    icon: '📏📏', t: 'Moyenne — 5 à 15 m',           d: "Quelques percements ou longueur modérée. Cas le plus fréquent." },
              { v: 'longue_int', icon: '📏📏📏', t: 'Longue intérieure — plus de 15 m', d: "Garage en sous-sol, cave éloignée, ou long trajet en goulotte intérieure." },
              { v: 'longue_ext', icon: '⛏️',   t: 'Longue extérieure — tranchée',        d: "Câble enterré dans l’allée ou le jardin. Coût variable selon la nature du sol." },
            ].map(({ v, icon, t, d }) => (
              <button key={v} type="button" className={`opt${config.distance === v ? ' sel' : ''}`} onClick={() => set('distance', v as Distance)}>
                <span className="oi">{icon}</span>
                <span><span className="ot">{t}</span><span className="od">{d}</span></span>
              </button>
            ))}
          </div>
        </>
      )}

      {step === 5 && (
        <>
          <div className="step-q">Quel est l’état du tableau électrique ?</div>
          <div className="step-hint">Un tableau récent laisse de la place pour un disjoncteur supplémentaire. Un tableau saturé ou ancien peut nécessiter une mise en conformité.</div>
          <div className="opts">
            <button type="button" className={`opt${config.etatTableau === 'recent' ? ' sel' : ''}`} onClick={() => set('etatTableau', 'recent')}>
              <span className="oi">✅</span>
              <span><span className="ot">Tableau récent avec place disponible</span><span className="od">Moins de 15 ans, aux normes, place pour un disjoncteur différentiel supplémentaire.</span></span>
            </button>
            <button type="button" className={`opt${config.etatTableau === 'sature' ? ' sel' : ''}`} onClick={() => set('etatTableau', 'sature')}>
              <span className="oi">🔧</span>
              <span><span className="ot">Tableau saturé ou ancien à mettre en conformité</span><span className="od">Tableau plein, vétuste ou non conforme. Extension ou remplacement partiel nécessaire avant installation.</span></span>
            </button>
          </div>
        </>
      )}

      {step === 6 && (
        <>
          <div className="step-q">Quelle borne souhaitez-vous installer ?</div>
          <div className="step-hint">La borne connectée (« intelligente ») permet le délestage dynamique, la programmation et l’intégration solaire. Obligatoire dans certains pays depuis 2024.</div>
          <div className="opts">
            {[
              { v: 'basique_7', icon: '🔌', t: 'Basique 7,4 kW — Non connectée',        d: "Plug & Charge simple. Recharge complète en ≈7–10 h. Idéale avec contrat heures creuses nocturne. Monophasé uniquement." },
              { v: 'smart_7',   icon: '📱', t: 'Intelligente 7,4 kW — Connectée (★ recommandée)', d: "OCPP, délestage dynamique, app mobile, compatible solaire. Monophasé. Incontournable si compteur limité ou panneaux solaires." },
              { v: 'smart_11',  icon: '⚡📱', t: 'Intelligente 11 kW — Triphasée',    d: "Recharge ≈2× plus rapide qu’en 7,4 kW. Requiert réseau 3×400 V+N et VE supportant 11 kW en AC." },
              { v: 'smart_22',  icon: '⚡⚡📱', t: 'Intelligente 22 kW — Triphasée',  d: "Puissance maximale AC. Requiert 3×400 V+N et VE supportant 22 kW (Renault Zoé, certaines Mercedes EQ). Flotte ou usage intensif." },
            ].map(({ v, icon, t, d }) => (
              <button key={v} type="button" className={`opt${config.typeBorne === v ? ' sel' : ''}`} onClick={() => set('typeBorne', v as TypeBorne)}>
                <span className="oi">{icon}</span>
                <span><span className="ot">{t}</span><span className="od">{d}</span></span>
              </button>
            ))}
          </div>
        </>
      )}

      {step === 7 && (
        <>
          <div className="step-q">Quel est l’âge du bâtiment ?</div>
          <div className="step-hint">Détermine le taux de TVA applicable (6 % vs 21 % en Belgique, 5,5 % vs 20 % en France…).</div>
          <div className="opts">
            <button type="button" className={`opt${config.ageBatiment === 'neuf' ? ' sel' : ''}`} onClick={() => set('ageBatiment', 'neuf')}>
              <span className="oi">🏗️</span>
              <span><span className="ot">Moins de 2 ans</span><span className="od">Bâtiment neuf ou livré récemment. TVA au taux normal dans tous les pays.</span></span>
            </button>
            <button type="button" className={`opt${config.ageBatiment === 'moyen' ? ' sel' : ''}`} onClick={() => set('ageBatiment', 'moyen')}>
              <span className="oi">🏠</span>
              <span><span className="ot">2 à 10 ans</span><span className="od">Bâtiment existant mais récent. TVA réduite possible en France et au Luxembourg.</span></span>
            </button>
            <button type="button" className={`opt${config.ageBatiment === 'ancien' ? ' sel' : ''}`} onClick={() => set('ageBatiment', 'ancien')}>
              <span className="oi">🏚️</span>
              <span><span className="ot">Plus de 10 ans</span><span className="od">Accès aux taux réduits dans tous les pays concernés (6 % BE, 5,5 % FR, 3 % LU sur résidence principale).</span></span>
            </button>
          </div>
        </>
      )}

      <div className="wnav">
        {step > 0 && (
          <button type="button" className="btn-g" onClick={back}>← Retour</button>
        )}
        <button type="button" className="btn-p" onClick={next}>
          {step === N_STEPS - 1 ? 'Voir mon estimation →' : 'Suivant →'}
        </button>
      </div>
    </div>
  )
}

// ─── RESULTS ─────────────────────────────────────────────────────────────────
function Results({ config, onRestart }: { config: Config; onRestart: () => void }) {
  const reco = getRecoConfig(config)
  const lines = getBudgetLines(config)
  const tva = getTVA(config)
  const alerts = getAlerts(config)
  const totalLow = lines.reduce((s, l) => s + l.low, 0)
  const totalHigh = lines.reduce((s, l) => s + l.high, 0)
  const tvacLow = Math.round(totalLow * (1 + tva.rate / 100))
  const tvacHigh = Math.round(totalHigh * (1 + tva.rate / 100))
  const pays = PAYS_INFO[config.pays]

  return (
    <>
      {/* Section 1 */}
      <div className="rc">
        <div className="rh"><span className="rn">1</span>Configuration recommandée</div>
        {[
          { l: 'Pays', v: `${pays.flag} ${pays.name}` },
          { l: 'Type de lieu', v: config.typeLieu === 'maison' ? 'Maison individuelle' : config.typeLieu === 'copropriete' ? 'Copropriété / Appartement' : 'Lieu de travail / Entreprise' },
          { l: 'Réseau électrique', v: config.typeReseau === 'mono' ? 'Monophasé 230 V' : config.typeReseau === 'tri_sans_neutre' ? 'Triphasé 3×230 V sans neutre' : 'Triphasé 3×400 V+N' },
          { l: 'Puissance compteur', v: `${config.puissanceCompteur} A (≈ ${(config.puissanceCompteur * 230 / 1000).toFixed(1)} kW)` },
          { l: 'Puissance maximale conseillée', v: <strong>{reco.powerLabel}</strong> },
          { l: 'Type de borne', v: reco.borneLabel },
        ].map(({ l, v }) => (
          <div key={l} className="cfgr"><span className="cl">{l}</span><span className="cv">{v}</span></div>
        ))}
        <div className="rbox">
          {reco.adjusted && <div className="adj">⚠️ Puissance ajustée automatiquement (incompatibilité réseau / borne demandée).</div>}
          <p style={{ marginTop: reco.adjusted ? 8 : 0 }}>{reco.summary}</p>
        </div>
      </div>

      {/* Section 2 */}
      <div className="rc">
        <div className="rh"><span className="rn">2</span>Estimation budgétaire détaillée (hors TVA)</div>
        <div style={{ overflowX: 'auto' }}>
          <table className="btab">
            <thead>
              <tr>
                <th>Poste de dépense</th>
                <th className="r">Fourchette estimée (HTVA)</th>
              </tr>
            </thead>
            <tbody>
              {lines.map((l, i) => (
                <tr key={i}>
                  <td>
                    {l.label}
                    <span className="nota">{l.note}</span>
                  </td>
                  <td className="r">{l.low === 0 ? `incl. – ${fmt(l.high)} €` : `${fmt(l.low)} – ${fmt(l.high)} €`}</td>
                </tr>
              ))}
              <tr className="tot">
                <td><strong>TOTAL estimé (hors TVA)</strong></td>
                <td className="r"><strong>{fmt(totalLow)} – {fmt(totalHigh)} €</strong></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Section 3 */}
      <div className="rc">
        <div className="rh"><span className="rn">3</span>TVA & fiscalité ({pays.flag} {pays.name})</div>
        <div className="tvabox">
          <div className="tvr"><span className="tvl">Total HTVA (point milieu de fourchette)</span><span className="tvv">{fmt(Math.round((totalLow + totalHigh) / 2))} €</span></div>
          <div className="tvr"><span className="tvl">{tva.label}</span><span className="tvv">+ {tva.rate.toString().replace('.', ',')} %</span></div>
          <div className="tvr tvtot"><span className="tvl">Total TVAC estimé</span><span className="tvv">{fmt(tvacLow)} – {fmt(tvacHigh)} €</span></div>
        </div>
        <p className="tvnote">{tva.note}</p>
      </div>

      {/* Section 4 */}
      {alerts.length > 0 && (
        <div className="rc">
          <div className="rh"><span className="rn">4</span>Alertes techniques & points de vigilance</div>
          {alerts.map((a, i) => (
            <div key={i} className={`abox ${a.level}`}>
              <div className="at">{a.icon} {a.title}</div>
              <div className="ab">{a.body}</div>
            </div>
          ))}
        </div>
      )}

      <div className="disc">
        <b>Avertissement</b> — Cette estimation est à titre indicatif et ne constitue pas un devis professionnel.
        Les prix réels peuvent varier selon l’accessibilité du chantier, les tarifs régionaux et les caractéristiques techniques définitivement constatées lors de la visite de l’électricien.
        Faites toujours établir au minimum <b>2 devis par un électricien agréé IRVE</b> avant de vous engager.
      </div>

      {/* ─── CTA — outil suivant ────────────────────────────────────── */}
      {(() => {
        const isEnt = config.typeLieu === 'entreprise'
        const midTvac = Math.round((tvacLow + tvacHigh) / 2)
        const params = `cout=${midTvac}&pays=${config.pays}`
        const href = isEnt ? `/outils/dpi-borne-belgique?${params}` : `/outils/smart-charging-roi?${params}`
        const btnLabel = isEnt
          ? "Calculez votre réduction d'impôt immédiate (DPI 2026) →"
          : 'Calculez votre retour sur investissement solaire →'
        const title = isEnt
          ? `Sur ${fmt(midTvac)} € TVAC investis — combien récupérez-vous via la DPI énergie 2026 ?`
          : `Votre borne à ${fmt(midTvac)} € — en combien de temps la rentabilisez-vous avec le Smart Charging ?`
        return (
          <div className="cta-next" style={{ marginBottom: 22 }}>
            <div className="cn-icon">{isEnt ? '💼' : '☀️'}</div>
            <h3>{title}</h3>
            <Link href={href} className="btn-cta">{btnLabel}</Link>
          </div>
        )
      })()}

      <button type="button" className="restart" onClick={onRestart}>
        ↺ Refaire une simulation
      </button>
    </>
  )
}
