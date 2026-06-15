/**
 * Moteurs.com — Comparateur de financement automobile
 * Achat comptant · Crédit auto · LOA (leasing) · LLD
 *
 * Calcule, pour une même voiture sur une même durée :
 *   1) le déboursé brut (somme nominale des sorties de trésorerie)
 *   2) le coût net après revente / valeur résiduelle conservée
 *   3) le COÛT RÉEL ACTUALISÉ (NPV) intégrant le coût d'opportunité du capital
 *      (l'apport / le comptant aurait pu être placé au taux indiqué).
 *
 * Le coût réel actualisé est l'indicateur de classement : il rend comparables
 * des stratégies qui sortent l'argent à des moments différents (tout de suite
 * en comptant, étalé en location/crédit). Plus le taux de placement est élevé,
 * plus payer plus tard a de la valeur.
 *
 * Hypothèses & approximations assumées (affichées dans l'UI) :
 *   - Le taux du crédit est traité comme un taux annuel converti en taux
 *     mensuel proportionnel (TAEG ≈ taux nominal pour la mensualité).
 *   - L'actualisation se fait au taux de placement mensuel = taux/12.
 *   - Les coûts d'usage (carburant/énergie, assurance, entretien) sont
 *     optionnels et appliqués selon ce qui est « inclus » dans chaque offre.
 *   - La revente n'existe que pour les options où l'on est (ou devient)
 *     propriétaire : comptant, crédit, et LOA si l'option d'achat est levée.
 */

// ─── Types ──────────────────────────────────────────────────────────────────

export type ModeFin = 'comptant' | 'credit' | 'loa' | 'lld'
export type Pays = 'FR' | 'BE' | 'LU' | 'CH' | 'CA'
export type Devise = 'EUR' | 'CHF' | 'CAD'

export interface FinInput {
  // Commun
  prix_vehicule: number    // € prix d'achat / valeur catalogue
  duree_mois: number       // durée de détention / du contrat (mois)
  km_annuel: number        // km parcourus par an
  taux_placement: number   // %/an — rendement alternatif du capital (coût d'opportunité)
  decote_annuelle: number  // %/an — décote utilisée pour estimer la revente si non saisie
  devise: Devise           // devise d'affichage (selon le pays)

  // Revente estimée en fin de période (€). Si 0 → estimée via decote_annuelle.
  valeur_revente: number

  // Coûts d'usage annuels (optionnels, € / an)
  energie_an: number       // carburant ou électricité (toujours à la charge du conducteur)
  assurance_an: number     // assurance
  entretien_an: number     // entretien + pneus

  // ── Achat comptant ──
  comptant_actif: boolean

  // ── Crédit auto ──
  credit_actif: boolean
  credit_apport: number    // € apport initial
  credit_taux: number      // %/an TAEG
  credit_frais: number     // € frais de dossier (t0)

  // ── LOA ──
  loa_actif: boolean
  loa_premier_loyer: number   // € 1er loyer majoré / apport (t0)
  loa_loyer: number           // € loyer mensuel
  loa_option_achat: number    // € valeur résiduelle / option d'achat (fin)
  loa_lever_option: boolean   // true = on achète en fin, false = on restitue
  loa_frais_restitution: number // € frais de restitution si on rend (remise en état)
  loa_entretien_inclus: boolean // entretien inclus dans le loyer ?
  loa_assurance_incluse: boolean

  // ── LLD ──
  lld_actif: boolean
  lld_premier_loyer: number
  lld_loyer: number
  lld_frais_restitution: number
  lld_entretien_inclus: boolean
  lld_assurance_incluse: boolean
}

export interface FinResultat {
  mode: ModeFin
  label: string
  actif: boolean
  proprietaire: boolean       // devient-on propriétaire en fin ?
  debourse_brut: number       // somme nominale des sorties
  revente: number             // valeur récupérée en fin (0 si location rendue)
  cout_net: number            // débourse_brut - revente (nominal)
  cout_reel: number           // NPV des flux nets (indicateur de classement)
  mensualite: number          // mensualité indicative (crédit/loca)
  detail: string[]            // lignes explicatives
}

export interface FinComparaison {
  resultats: FinResultat[]    // triés par cout_reel croissant (actifs d'abord)
  gagnant: FinResultat | null
  ecart_vs_2e: number         // € d'écart entre le gagnant et le 2e (coût réel)
  km_total: number
}

// ─── Helpers ────────────────────────────────────────────────────────────────

export const fmtEur = (n: number): string =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(
    Number.isFinite(n) ? Math.round(n) : 0,
  )

export const fmtEur2 = (n: number): string =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 2 }).format(
    Number.isFinite(n) ? n : 0,
  )

export const fmtSignEur = (n: number): string => (n > 0 ? '+' : '') + fmtEur(n)

/** Formatage monétaire générique selon la devise (EUR / CHF / CAD). */
const DEVISE_LOCALE: Record<Devise, string> = { EUR: 'fr-FR', CHF: 'fr-CH', CAD: 'fr-CA' }
export function fmtMoney(n: number, devise: Devise = 'EUR'): string {
  return new Intl.NumberFormat(DEVISE_LOCALE[devise], {
    style: 'currency', currency: devise, maximumFractionDigits: 0,
  }).format(Number.isFinite(n) ? Math.round(n) : 0)
}
/** Symbole court pour les suffixes de champs. */
export const DEVISE_SYMBOLE: Record<Devise, string> = { EUR: '€', CHF: 'CHF', CAD: 'C$' }

/** Mensualité d'un crédit amortissable (annuité constante). */
export function mensualiteCredit(capital: number, tauxAnnuelPct: number, nMois: number): number {
  if (capital <= 0 || nMois <= 0) return 0
  const r = tauxAnnuelPct / 100 / 12
  if (r === 0) return capital / nMois
  return (capital * r) / (1 - Math.pow(1 + r, -nMois))
}

/** Valeur actuelle nette d'un flux mensuel : montant à la fin du mois t (1..n). */
function npvMensuel(montant: number, t: number, tauxAnnuelPct: number): number {
  const r = tauxAnnuelPct / 100 / 12
  return montant / Math.pow(1 + r, t)
}

/** Valeur actuelle d'un montant unique au mois t (0 = aujourd'hui). */
function vaUnique(montant: number, t: number, tauxAnnuelPct: number): number {
  const r = tauxAnnuelPct / 100 / 12
  return montant / Math.pow(1 + r, t)
}

/** Revente estimée via décote géométrique si valeur non saisie. */
export function reventeEstimee(prix: number, decotePct: number, dureeMois: number): number {
  const annees = dureeMois / 12
  return Math.max(0, prix * Math.pow(1 - decotePct / 100, annees))
}

// ─── Cœur du calcul ───────────────────────────────────────────────────────────

const LABELS: Record<ModeFin, string> = {
  comptant: 'Achat comptant',
  credit: 'Crédit auto',
  loa: 'LOA (leasing)',
  lld: 'LLD (location)',
}

/** Somme actualisée d'un loyer/mensualité constant versé en fin de mois 1..n. */
function npvFluxConstant(montant: number, nMois: number, tauxPct: number): number {
  let s = 0
  for (let t = 1; t <= nMois; t++) s += npvMensuel(montant, t, tauxPct)
  return s
}

export function comparerFinancement(input: FinInput): FinComparaison {
  const n = Math.max(1, Math.round(input.duree_mois))
  const annees = n / 12
  const tx = input.taux_placement
  const money = (v: number): string => fmtMoney(v, input.devise)
  const revente =
    input.valeur_revente > 0
      ? input.valeur_revente
      : reventeEstimee(input.prix_vehicule, input.decote_annuelle, n)

  // Coûts d'usage actualisés (versés mensuellement, simplifié à 1/12 du montant annuel)
  const usageMensuel = (energie: boolean, assur: boolean, entretien: boolean): number => {
    const m =
      (input.energie_an / 12) * (energie ? 1 : 0) +
      (input.assurance_an / 12) * (assur ? 1 : 0) +
      (input.entretien_an / 12) * (entretien ? 1 : 0)
    return m
  }
  const usageBrut = (energie: boolean, assur: boolean, entretien: boolean): number =>
    usageMensuel(energie, assur, entretien) * 12 * annees
  const usageNpv = (energie: boolean, assur: boolean, entretien: boolean): number =>
    npvFluxConstant(usageMensuel(energie, assur, entretien), n, tx)

  const resultats: FinResultat[] = []

  // ── 1. Comptant ──
  {
    const brutFin = input.prix_vehicule
    const usB = usageBrut(true, true, true)
    const usN = usageNpv(true, true, true)
    const debourse = brutFin + usB
    const cout_net = debourse - revente
    const cout_reel = brutFin + usN - vaUnique(revente, n, tx)
    resultats.push({
      mode: 'comptant',
      label: LABELS.comptant,
      actif: input.comptant_actif,
      proprietaire: true,
      debourse_brut: debourse,
      revente,
      cout_net,
      cout_reel,
      mensualite: 0,
      detail: [
        `Prix payé immédiatement : ${money(input.prix_vehicule)}`,
        `Revente estimée à ${annees.toFixed(1)} ans : ${money(revente)}`,
        `Coût d'usage (énergie + assurance + entretien) : ${money(usB)}`,
        `Coût d'opportunité inclus : capital immobilisé actualisé à ${tx}%/an`,
      ],
    })
  }

  // ── 2. Crédit ──
  {
    const apport = input.credit_apport
    const capital = Math.max(0, input.prix_vehicule - apport)
    const m = mensualiteCredit(capital, input.credit_taux, n)
    const interets = m * n - capital
    const usB = usageBrut(true, true, true)
    const usN = usageNpv(true, true, true)
    const brut = apport + input.credit_frais + m * n + usB
    const cout_net = brut - revente
    const cout_reel =
      apport +
      input.credit_frais +
      npvFluxConstant(m, n, tx) +
      usN -
      vaUnique(revente, n, tx)
    resultats.push({
      mode: 'credit',
      label: LABELS.credit,
      actif: input.credit_actif,
      proprietaire: true,
      debourse_brut: brut,
      revente,
      cout_net,
      cout_reel,
      mensualite: m,
      detail: [
        `Apport : ${money(apport)} + frais de dossier : ${money(input.credit_frais)}`,
        `${n} mensualités de ${money(m)} (TAEG ${input.credit_taux}%)`,
        `Intérêts payés : ${money(interets)}`,
        `Revente estimée : ${money(revente)} (vous êtes propriétaire)`,
        `Coût d'usage : ${money(usB)}`,
      ],
    })
  }

  // ── 3. LOA ──
  {
    const buy = input.loa_lever_option
    const enE = !input.loa_entretien_inclus // si non inclus, le conducteur paie l'entretien
    const enA = !input.loa_assurance_incluse
    const usB = usageBrut(true, enA, enE)
    const usN = usageNpv(true, enA, enE)
    const loyers = input.loa_loyer * n
    const reventeLoa = buy ? revente : 0
    const optionPaiement = buy ? input.loa_option_achat : 0
    const restit = buy ? 0 : input.loa_frais_restitution
    const brut = input.loa_premier_loyer + loyers + optionPaiement + restit + usB
    const cout_net = brut - reventeLoa
    const cout_reel =
      input.loa_premier_loyer +
      npvFluxConstant(input.loa_loyer, n, tx) +
      vaUnique(optionPaiement + restit, n, tx) +
      usN -
      vaUnique(reventeLoa, n, tx)
    const detail = [
      `1er loyer majoré : ${money(input.loa_premier_loyer)}`,
      `${n} loyers de ${money(input.loa_loyer)}`,
      buy
        ? `Option d'achat levée : ${money(input.loa_option_achat)} → vous devenez propriétaire (revente ${money(revente)})`
        : `Restitution en fin de contrat${restit > 0 ? ` (frais ${money(restit)})` : ''} — pas de revente`,
    ]
    if (input.loa_entretien_inclus || input.loa_assurance_incluse)
      detail.push(
        `Inclus dans le loyer : ${[input.loa_entretien_inclus ? 'entretien' : '', input.loa_assurance_incluse ? 'assurance' : ''].filter(Boolean).join(' + ')}`,
      )
    detail.push(`Coût d'usage restant à charge : ${money(usB)}`)
    resultats.push({
      mode: 'loa',
      label: LABELS.loa,
      actif: input.loa_actif,
      proprietaire: buy,
      debourse_brut: brut,
      revente: reventeLoa,
      cout_net,
      cout_reel,
      mensualite: input.loa_loyer,
      detail,
    })
  }

  // ── 4. LLD ──
  {
    const enE = !input.lld_entretien_inclus
    const enA = !input.lld_assurance_incluse
    const usB = usageBrut(true, enA, enE)
    const usN = usageNpv(true, enA, enE)
    const loyers = input.lld_loyer * n
    const brut = input.lld_premier_loyer + loyers + input.lld_frais_restitution + usB
    const cout_net = brut // pas de revente
    const cout_reel =
      input.lld_premier_loyer +
      npvFluxConstant(input.lld_loyer, n, tx) +
      vaUnique(input.lld_frais_restitution, n, tx) +
      usN
    const detail = [
      `1er loyer : ${money(input.lld_premier_loyer)}`,
      `${n} loyers de ${money(input.lld_loyer)}`,
      `Restitution obligatoire en fin de contrat — aucune revente, aucun capital récupéré`,
    ]
    if (input.lld_entretien_inclus || input.lld_assurance_incluse)
      detail.push(
        `Inclus dans le loyer : ${[input.lld_entretien_inclus ? 'entretien' : '', input.lld_assurance_incluse ? 'assurance' : ''].filter(Boolean).join(' + ')}`,
      )
    detail.push(`Coût d'usage restant à charge : ${money(usB)}`)
    resultats.push({
      mode: 'lld',
      label: LABELS.lld,
      actif: input.lld_actif,
      proprietaire: false,
      debourse_brut: brut,
      revente: 0,
      cout_net,
      cout_reel,
      mensualite: input.lld_loyer,
      detail,
    })
  }

  // Tri : actifs d'abord, puis coût réel croissant
  const tri = [...resultats].sort((a, b) => {
    if (a.actif !== b.actif) return a.actif ? -1 : 1
    return a.cout_reel - b.cout_reel
  })
  const actifs = tri.filter((r) => r.actif)
  const gagnant = actifs[0] ?? null
  const ecart_vs_2e = actifs.length >= 2 ? actifs[1].cout_reel - actifs[0].cout_reel : 0

  return {
    resultats: tri,
    gagnant,
    ecart_vs_2e,
    km_total: input.km_annuel * annees,
  }
}

// ─── Valeurs par défaut (exemple d'amorçage — NON un relevé d'offres) ──────────
//
// Ordres de grandeur du marché français, vérifiés le 15/06/2026. Ce sont des
// valeurs d'exemple destinées à illustrer le calcul : l'utilisateur doit les
// remplacer par les montants exacts de SES devis. Références :
//   - TAEG crédit auto : offres standard 4,5–6,2 % (déc. 2025), 5–8 % sur
//     48–60 mois selon profil → défaut 5,5 % (source : Empruntis / Meilleurtaux).
//   - Décote : ~20–25 % la 1re année puis 10–15 %/an, ~50 % perdus à 4–5 ans →
//     décote géométrique 15 %/an (30 000 € → ~15 700 € à 4 ans, soit -48 %)
//     (source : vendezvotrevoiture.fr / auto-ies.com).
//   - Taux de placement (coût d'opportunité) : Livret A 1,5 % net au 01/02/2026,
//     défaut prudent 2 % pour une épargne sécurisée diversifiée
//     (source : economie.gouv.fr / Banque de France).
//   - LOA : taux 3,9 % (constructeur) à 8,5 % (organisme), apport 10–30 % du prix
//     (source : elite-auto.fr / commentaider.fr).
//
// Voir SOURCES_DEFAUTS pour l'affichage côté UI.

export const SOURCES_DEFAUTS = {
  date: '15/06/2026',
  items: [
    { label: 'TAEG crédit auto 5,5 %', detail: 'offres standard 4,5–6,2 % (Empruntis, Meilleurtaux)' },
    { label: 'Décote 15 %/an', detail: '~50 % de valeur perdue à 4–5 ans (cotes Argus / La Centrale)' },
    { label: 'Taux de placement 2 %', detail: 'Livret A 1,5 % net au 01/02/2026 (economie.gouv.fr)' },
    { label: 'Loyers LOA/LLD', detail: 'exemple plausible — à remplacer par votre devis' },
  ],
}

export const DEFAUTS: FinInput = {
  prix_vehicule: 30000,
  duree_mois: 48,
  km_annuel: 15000,
  taux_placement: 2,
  decote_annuelle: 15,
  valeur_revente: 0,
  devise: 'EUR',

  energie_an: 1200,
  assurance_an: 700,
  entretien_an: 600,

  comptant_actif: true,

  credit_actif: true,
  credit_apport: 3000,
  credit_taux: 5.5,
  credit_frais: 200,

  loa_actif: true,
  loa_premier_loyer: 3000,
  loa_loyer: 350,
  loa_option_achat: 12000,
  loa_lever_option: false,
  loa_frais_restitution: 0,
  loa_entretien_inclus: false,
  loa_assurance_incluse: false,

  lld_actif: true,
  lld_premier_loyer: 3000,
  lld_loyer: 420,
  lld_frais_restitution: 0,
  lld_entretien_inclus: true,
  lld_assurance_incluse: false,
}


// ─── Presets par pays (FR · BE · LU · CH · CA) ────────────────────────────────
//
// Valeurs d'amorçage vérifiées le 15/06/2026 — ordres de grandeur de marché,
// PAS des barèmes négociés. À remplacer par les devis réels de l'utilisateur.

export const PAYS_LABELS: Record<Pays, { nom: string; drapeau: string; devise: Devise }> = {
  FR: { nom: 'France', drapeau: '🇫🇷', devise: 'EUR' },
  BE: { nom: 'Belgique', drapeau: '🇧🇪', devise: 'EUR' },
  LU: { nom: 'Luxembourg', drapeau: '🇱🇺', devise: 'EUR' },
  CH: { nom: 'Suisse', drapeau: '🇨🇭', devise: 'CHF' },
  CA: { nom: 'Canada', drapeau: '🇨🇦', devise: 'CAD' },
}

export const PAYS_LISTE: Pays[] = ['FR', 'BE', 'LU', 'CH', 'CA']

/** Renvoie un FinInput complet pré-rempli pour le pays demandé. */
export function defautsPays(pays: Pays): FinInput {
  const base = { ...DEFAUTS }
  switch (pays) {
    case 'FR':
      return { ...base, devise: 'EUR', credit_taux: 5.5, taux_placement: 2 }
    case 'BE':
      return {
        ...base, devise: 'EUR',
        credit_taux: 4.5,      // prêt à tempérament neuf 3,75–3,99 %, occasion ~5–6 %
        taux_placement: 1.5,   // compte épargne réglementé : base ~0,5 %, meilleurs ~2,9 %
        loa_loyer: 350, lld_loyer: 420,
      }
    case 'LU':
      return {
        ...base, devise: 'EUR',
        credit_taux: 5.0,      // zone euro, prêt auto ~4,5–6 %
        taux_placement: 2,
        loa_loyer: 350, lld_loyer: 420,
      }
    case 'CH':
      return {
        ...base, devise: 'CHF',
        prix_vehicule: 35000,  // prix catalogue plus élevés en CHF
        credit_taux: 4.5,      // leasing 3,5–5,5 % (plafond légal LCC 12/14 %)
        taux_placement: 0.5,   // comptes épargne CH très bas (0,1–1 %)
        credit_apport: 3500,
        energie_an: 1500, assurance_an: 900, entretien_an: 800,
        loa_premier_loyer: 3500, loa_loyer: 420, loa_option_achat: 14000,
        lld_premier_loyer: 3500, lld_loyer: 490,
      }
    case 'CA':
      return {
        ...base, devise: 'CAD',
        prix_vehicule: 40000,
        credit_taux: 6.5,      // taux moyen prêt auto neuf ~6,5–6,72 %
        taux_placement: 3,     // HISA/GIC ~3–3,8 % (BoC 2,25 %)
        credit_apport: 4000,
        energie_an: 1800, assurance_an: 1500, entretien_an: 900,
        loa_premier_loyer: 4000, loa_loyer: 480, loa_option_achat: 16000,
        lld_premier_loyer: 4000, lld_loyer: 560,
      }
  }
}

interface SourceBloc { date: string; items: { label: string; detail: string }[] }

export const SOURCES_PAYS: Record<Pays, SourceBloc> = {
  FR: {
    date: '15/06/2026',
    items: [
      { label: 'TAEG crédit 5,5 %', detail: 'offres standard 4,5–6,2 % (Empruntis, Meilleurtaux)' },
      { label: 'Placement 2 %', detail: 'Livret A 1,5 % net au 01/02/2026 (economie.gouv.fr)' },
      { label: 'Décote 15 %/an', detail: '~50 % de valeur perdue à 4–5 ans (Argus / La Centrale)' },
      { label: 'Loyers LOA/LLD', detail: 'exemple — à remplacer par votre devis' },
    ],
  },
  BE: {
    date: '15/06/2026',
    items: [
      { label: 'TAEG prêt à tempérament 4,5 %', detail: 'neuf 3,75–3,99 %, électrique dès 2,99 %, occasion ~5–6 % (CBC, Belfius, Beobank)' },
      { label: 'Placement 1,5 %', detail: 'compte épargne réglementé : base ~0,5 %, meilleurs ~2,9 % (BNP PF Boost)' },
      { label: 'Décote 15 %/an', detail: 'ordre de grandeur marché' },
      { label: 'Loyers LOA/LLD', detail: 'exemple — à remplacer par votre devis' },
    ],
  },
  LU: {
    date: '15/06/2026',
    items: [
      { label: 'TAEG prêt auto 5 %', detail: 'zone euro, fourchette ~4,5–6 %' },
      { label: 'Placement 2 %', detail: 'épargne sécurisée zone euro' },
      { label: 'Décote 15 %/an', detail: 'ordre de grandeur marché' },
      { label: 'Loyers LOA/LLD', detail: 'exemple — à remplacer par votre devis' },
    ],
  },
  CH: {
    date: '15/06/2026',
    items: [
      { label: 'Taux leasing 4,5 %', detail: 'marché 3,5–5,5 %, promos 0,9–1,9 % (plafond légal LCC 12/14 %)' },
      { label: 'Placement 0,5 %', detail: 'comptes épargne CH très bas, 0,1–1 % (moneyland.ch)' },
      { label: 'Décote 15 %/an', detail: 'ordre de grandeur marché' },
      { label: 'Prix & loyers en CHF', detail: 'exemple — à remplacer par votre devis' },
    ],
  },
  CA: {
    date: '15/06/2026',
    items: [
      { label: 'Taux prêt auto 6,5 %', detail: 'moyen ~6,5–6,72 %, neuf 5–7 % (WOWA, Statistique Canada)' },
      { label: 'Placement 3 %', detail: 'HISA/CPG 3–3,8 %, taux directeur BoC 2,25 % (Ratehub)' },
      { label: 'Décote 15 %/an', detail: 'ordre de grandeur marché' },
      { label: 'Prix & loyers en CAD', detail: 'exemple — à remplacer par votre devis' },
    ],
  },
}
