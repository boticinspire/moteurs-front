'use client'

/**
 * CalculateurPV.tsx
 * Widget interactif : calculateur d'amendes routières multi-pays
 * Types couverts : vitesse, stationnement, comportement, ZFE, alcool, stupéfiants
 */

import { useState, useMemo } from 'react'
import {
  PAYS,
  BAREME_VITESSE,
  BAREME_COMPORTEMENT,
  BAREME_STATIONNEMENT,
  BAREME_ZFE,
  BAREME_ALCOOL,
  BAREME_STUPEFIANTS,
  getTranche,
  type PaysCode,
  type TypeVoie,
  type TypeInfraction,
} from '@/lib/amendes'

// ─── Constantes ───────────────────────────────────────────────────────────────

const PAYS_LISTE = Object.entries(PAYS).map(([code, info]) => ({ code: code as PaysCode, ...info }))

const ONGLETS: { id: TypeInfraction; label: string; emoji: string }[] = [
  { id: 'vitesse',       label: 'Vitesse',      emoji: '⚡' },
  { id: 'stationnement', label: 'Stationnement', emoji: '🅿️' },
  { id: 'comportement',  label: 'Comportement',  emoji: '📱' },
  { id: 'zfe',           label: 'ZFE / Éco',     emoji: '🌿' },
  { id: 'alcool',        label: 'Alcool',         emoji: '🍷' },
  { id: 'stupefiants',   label: 'Stupéfiants',    emoji: '🚫' },
]

const VOIES: { id: TypeVoie; label: string }[] = [
  { id: 'agglo',       label: 'En agglomération' },
  { id: 'hors_agglo',  label: 'Hors agglomération' },
  { id: 'autoroute',   label: 'Autoroute' },
]

// ─── Styles ──────────────────────────────────────────────────────────────────

const s = {
  wrap: { fontFamily: 'inherit', maxWidth: 720, margin: '0 auto' } as React.CSSProperties,

  tabs: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: 6,
    marginBottom: 20,
  },

  tab: (active: boolean): React.CSSProperties => ({
    padding: '8px 14px',
    borderRadius: 8,
    border: `1.5px solid ${active ? 'var(--color-primary)' : 'var(--color-border)'}`,
    background: active ? 'var(--color-primary)' : 'transparent',
    color: active ? '#fff' : 'var(--color-text)',
    cursor: 'pointer',
    fontSize: '0.84rem',
    fontWeight: active ? 700 : 500,
    transition: 'all 0.15s',
  }),

  card: {
    background: 'var(--color-bg-card)',
    border: '1px solid var(--color-border)',
    borderRadius: 14,
    padding: '20px 24px',
    marginBottom: 16,
  } as React.CSSProperties,

  row: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 14,
    marginBottom: 16,
  } as React.CSSProperties,

  rowFull: {
    marginBottom: 16,
  } as React.CSSProperties,

  label: {
    display: 'block',
    fontSize: '0.8rem',
    fontWeight: 600,
    color: 'var(--color-text-muted)',
    marginBottom: 6,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.04em',
  },

  select: {
    width: '100%',
    padding: '10px 14px',
    borderRadius: 8,
    border: '1.5px solid var(--color-border)',
    background: 'var(--color-bg)',
    color: 'var(--color-text)',
    fontSize: '0.95rem',
    appearance: 'none' as const,
    cursor: 'pointer',
  },

  input: {
    width: '100%',
    padding: '10px 14px',
    borderRadius: 8,
    border: '1.5px solid var(--color-border)',
    background: 'var(--color-bg)',
    color: 'var(--color-text)',
    fontSize: '0.95rem',
    boxSizing: 'border-box' as const,
  },

  sliderWrap: { position: 'relative' as const },

  slider: {
    width: '100%',
    accentColor: 'var(--color-primary)',
    cursor: 'pointer',
  },

  sliderVal: {
    textAlign: 'center' as const,
    fontWeight: 700,
    fontSize: '1.3rem',
    color: 'var(--color-primary)',
    marginTop: 4,
  },

  btnCalc: {
    display: 'block',
    width: '100%',
    padding: '13px 0',
    borderRadius: 10,
    border: 'none',
    background: 'var(--color-primary)',
    color: '#fff',
    fontWeight: 700,
    fontSize: '1rem',
    cursor: 'pointer',
    marginTop: 4,
    transition: 'opacity 0.15s',
  } as React.CSSProperties,

  resultCard: (risk: boolean): React.CSSProperties => ({
    background: risk ? '#fff1f2' : 'var(--color-bg-card)',
    border: `2px solid ${risk ? '#f43f5e' : 'var(--color-primary)'}`,
    borderRadius: 14,
    padding: '20px 24px',
    marginTop: 18,
  }),

  resultTitle: {
    fontSize: '0.75rem',
    fontWeight: 700,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.06em',
    color: 'var(--color-text-muted)',
    marginBottom: 12,
  },

  amendeRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: 10,
    marginBottom: 16,
  } as React.CSSProperties,

  amendeBox: (variant: 'min' | 'principal' | 'max'): React.CSSProperties => ({
    textAlign: 'center',
    padding: '12px 8px',
    borderRadius: 10,
    background: variant === 'principal'
      ? 'var(--color-primary)'
      : variant === 'max'
        ? '#fef2f2'
        : 'var(--color-bg)',
    border: '1.5px solid ' + (
      variant === 'principal' ? 'var(--color-primary)' :
      variant === 'max' ? '#fca5a5' : 'var(--color-border)'
    ),
  }),

  amendeLabel: {
    fontSize: '0.7rem',
    fontWeight: 600,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
    opacity: 0.75,
    marginBottom: 4,
    display: 'block',
  },

  amendeVal: (principal?: boolean): React.CSSProperties => ({
    fontWeight: 800,
    fontSize: principal ? '1.5rem' : '1.2rem',
    color: principal ? '#fff' : 'inherit',
  }),

  badgeRow: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: 8,
    marginBottom: 14,
  },

  badge: (color: string, bg: string): React.CSSProperties => ({
    display: 'inline-flex',
    alignItems: 'center',
    gap: 5,
    padding: '4px 10px',
    borderRadius: 20,
    background: bg,
    color: color,
    fontWeight: 700,
    fontSize: '0.8rem',
    border: `1px solid ${color}33`,
  }),

  conseilList: {
    margin: 0,
    padding: '0 0 0 18px',
    listStyle: 'disc',
  } as React.CSSProperties,

  conseilItem: {
    fontSize: '0.87rem',
    lineHeight: 1.6,
    color: 'var(--color-text)',
    marginBottom: 4,
  },

  source: {
    fontSize: '0.74rem',
    color: 'var(--color-text-muted)',
    marginTop: 12,
    borderTop: '1px solid var(--color-border)',
    paddingTop: 10,
  },

  noData: {
    textAlign: 'center' as const,
    padding: '32px 16px',
    color: 'var(--color-text-muted)',
    fontSize: '0.9rem',
    background: 'var(--color-bg-card)',
    border: '1px solid var(--color-border)',
    borderRadius: 14,
    marginTop: 8,
  },

  disclaimer: {
    fontSize: '0.78rem',
    color: 'var(--color-text-muted)',
    background: 'var(--color-bg)',
    border: '1px solid var(--color-border)',
    borderRadius: 8,
    padding: '10px 14px',
    marginTop: 14,
    lineHeight: 1.5,
  },
}

// ─── Sous-composant résultat ───────────────────────────────────────────────────

interface ResultData {
  amende_minoree?: number
  amende_forfaitaire: number
  amende_majoree?: number
  points_retires: number
  symbole: string
  risque_tribunal: boolean
  risque_suspension: boolean
  risque_immobilisation: boolean
  risque_confiscation?: boolean
  conseils: string[]
  sources?: string[]
}

function ResultatCard({ data }: { data: ResultData }) {
  const hasRisk = data.risque_tribunal || data.risque_suspension || data.risque_confiscation
  return (
    <div style={s.resultCard(!!hasRisk)}>
      <div style={s.resultTitle}>Résultat estimé</div>

      {/* Amendes */}
      <div style={s.amendeRow}>
        {data.amende_minoree != null ? (
          <div style={s.amendeBox('min')}>
            <span style={s.amendeLabel}>Minorée</span>
            <span style={s.amendeVal()}>
              {data.symbole}{data.amende_minoree.toLocaleString('fr-FR')}
            </span>
          </div>
        ) : <div />}

        <div style={s.amendeBox('principal')}>
          <span style={{ ...s.amendeLabel, color: '#ffffffbb' }}>Forfaitaire</span>
          <span style={s.amendeVal(true)}>
            {data.symbole}{data.amende_forfaitaire.toLocaleString('fr-FR')}
          </span>
        </div>

        {data.amende_majoree != null ? (
          <div style={s.amendeBox('max')}>
            <span style={{ ...s.amendeLabel, color: '#b91c1c' }}>Majorée / max</span>
            <span style={{ ...s.amendeVal(), color: '#b91c1c' }}>
              {data.symbole}{data.amende_majoree.toLocaleString('fr-FR')}
            </span>
          </div>
        ) : <div />}
      </div>

      {/* Badges risques */}
      <div style={s.badgeRow}>
        {data.points_retires > 0 && (
          <span style={s.badge('#b45309', '#fef3c7')}>
            ⭐ {data.points_retires} point{data.points_retires > 1 ? 's' : ''} retirés
          </span>
        )}
        {data.risque_tribunal && (
          <span style={s.badge('#be123c', '#fff1f2')}>⚖️ Tribunal possible</span>
        )}
        {data.risque_suspension && (
          <span style={s.badge('#9a3412', '#fff7ed')}>🚫 Suspension de permis</span>
        )}
        {data.risque_immobilisation && (
          <span style={s.badge('#1d4ed8', '#eff6ff')}>🔒 Immobilisation du véhicule</span>
        )}
        {data.risque_confiscation && (
          <span style={s.badge('#7c3aed', '#faf5ff')}>🔐 Confiscation possible</span>
        )}
        {!data.risque_tribunal && !data.risque_suspension && data.points_retires === 0 && (
          <span style={s.badge('#15803d', '#f0fdf4')}>✅ Pas de suspension ni de tribunal</span>
        )}
      </div>

      {/* Conseils */}
      {data.conseils.length > 0 && (
        <>
          <div style={{ ...s.resultTitle, marginTop: 12 }}>À savoir</div>
          <ul style={s.conseilList}>
            {data.conseils.map((c, i) => (
              <li key={i} style={s.conseilItem}>{c}</li>
            ))}
          </ul>
        </>
      )}

      {/* Sources */}
      {data.sources && data.sources.length > 0 && (
        <div style={s.source}>Source : {data.sources.join(' • ')}</div>
      )}
    </div>
  )
}

// ─── Formulaires par type ─────────────────────────────────────────────────────

function FormulaireVitesse({ pays }: { pays: PaysCode }) {
  const [voie, setVoie] = useState<TypeVoie>('agglo')
  const [dep, setDep] = useState(15)
  const [result, setResult] = useState<ReturnType<typeof computeVitesse> | null>(null)
  const info = PAYS[pays]
  const bareme = BAREME_VITESSE[pays]

  type R = {
    amende_minoree?: number
    amende_forfaitaire: number
    amende_majoree?: number
    points_retires: number
    symbole: string
    risque_tribunal: boolean
    risque_suspension: boolean
    risque_immobilisation: boolean
    risque_confiscation: boolean
    conseils: string[]
    sources: string[]
    limiteInfo?: string
  } | null

  function computeVitesse(): R {
    if (!bareme) return null
    const voieData = bareme[voie]
    const tranche = getTranche(voieData.tranches, dep)
    if (!tranche) return null
    const conseils: string[] = []
    if (pays === 'FR' && tranche.amende_min) conseils.push(`Payez sous 15 jours : amende réduite à ${info.symbole}${tranche.amende_min}.`)
    if (pays === 'FR' && dep < 50) conseils.push('Contestation possible dans les 45 jours en envoyant le formulaire joint à l\'avis de contravention.')
    if (pays === 'FR' && dep >= 20 && dep < 50) conseils.push('Stage de sensibilisation à la sécurité routière : récupérez jusqu\'à 4 points.')
    if (pays === 'FR' && dep >= 50) conseils.push('Infraction de 5ème classe : comparution possible devant le tribunal. Assistance juridique recommandée.')
    if (pays === 'CH' && dep >= 25 && voie === 'agglo') conseils.push('« Raserei » : retrait de permis minimum 2 ans + pénal. Consultez immédiatement un avocat.')
    if (pays === 'CH' && dep >= 30 && voie === 'hors_agglo') conseils.push('« Raserei » : retrait de permis minimum 2 ans + pénal.')
    if (pays === 'CH' && dep >= 35 && voie === 'autoroute') conseils.push('« Raserei » : retrait de permis minimum 2 ans + pénal.')
    if (pays === 'CA-QC' && dep >= 46) conseils.push('Suspension du permis sur-le-champ possible. Frais SAAQ s\'ajoutent à l\'amende.')
    if (pays === 'DE' && tranche.note) conseils.push(tranche.note)
    if (pays === 'ES' && tranche.amende_min) conseils.push(`Réduction 50 % si paiement sous 20 jours : ${info.symbole}${tranche.amende_min}.`)
    if (pays === 'IT' && tranche.amende_min) conseils.push(`Réduction 30 % si paiement dans les 5 jours : ${info.symbole}${tranche.amende_min}.`)
    if (tranche.note && !conseils.includes(tranche.note)) conseils.push(tranche.note)
    return {
      amende_minoree: tranche.amende_min,
      amende_forfaitaire: tranche.amende,
      amende_majoree: tranche.amende_max,
      points_retires: tranche.points,
      symbole: info.symbole,
      risque_tribunal: tranche.tribunal,
      risque_suspension: tranche.suspension,
      risque_immobilisation: false,
      risque_confiscation: false,
      conseils,
      sources: getSource(pays, 'vitesse'),
      limiteInfo: `Limite légale : ${voieData.limite_legale} km/h — Vitesse présumée : ${voieData.limite_legale + dep} km/h`,
    }
  }

  if (!bareme) return (
    <div style={s.noData}>
      Les données pour ce pays ne sont pas encore disponibles dans notre base.
    </div>
  )

  return (
    <div>
      <div style={s.row}>
        <div>
          <label style={s.label}>Type de voie</label>
          <select style={s.select} value={voie} onChange={e => { setVoie(e.target.value as TypeVoie); setResult(null) }}>
            {VOIES.map(v => <option key={v.id} value={v.id}>{v.label}</option>)}
          </select>
        </div>
        <div>
          <label style={s.label}>Dépassement constaté</label>
          <div style={s.sliderWrap}>
            <input
              type="range" min={1} max={80} value={dep} style={s.slider}
              onChange={e => { setDep(+e.target.value); setResult(null) }}
            />
            <div style={s.sliderVal}>{dep} km/h de trop</div>
          </div>
        </div>
      </div>

      {bareme && (
        <p style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', marginBottom: 14 }}>
          Limite légale par défaut : {bareme[voie].limite_legale} km/h
          &nbsp;—&nbsp;Vitesse présumée : {bareme[voie].limite_legale + dep} km/h
        </p>
      )}

      <button style={s.btnCalc} onClick={() => setResult(computeVitesse())}>
        Calculer mon amende
      </button>

      {result && <ResultatCard data={result} />}
    </div>
  )
}

function FormulaireStationnement({ pays }: { pays: PaysCode }) {
  const [type, setType] = useState('')
  const [result, setResult] = useState<ResultData | null>(null)
  const infractions = BAREME_STATIONNEMENT[pays]
  const info = PAYS[pays]

  if (!infractions) return <div style={s.noData}>Données non disponibles pour ce pays.</div>

  function compute() {
    const inf = infractions!.find(i => i.id === type)
    if (!inf) return
    const conseils: string[] = []
    if (pays === 'FR' && inf.id.startsWith('payant')) conseils.push('Le FPS remplace l\'horodateur. Contestez via la RAPO auprès du service compétent dans les 3 mois.')
    if (inf.fourriere) conseils.push('Immobilisation ou enlèvement possible. Des frais de fourrière s\'ajouteront à l\'amende.')
    if (inf.note) conseils.push(inf.note)
    if (pays === 'IT' && inf.id === 'ztl') conseils.push('Vérifiez avant d\'entrer dans une ville italienne si une ZTL est active. Application Ammende.it utile.')
    setResult({
      amende_forfaitaire: inf.amende,
      amende_majoree: inf.amende_max,
      points_retires: inf.points,
      symbole: info.symbole,
      risque_tribunal: false,
      risque_suspension: false,
      risque_immobilisation: inf.fourriere,
      conseils,
      sources: getSource(pays, 'stationnement'),
    })
  }

  return (
    <div>
      <div style={s.rowFull}>
        <label style={s.label}>Type d&apos;infraction de stationnement</label>
        <select style={s.select} value={type} onChange={e => { setType(e.target.value); setResult(null) }}>
          <option value="">— Sélectionnez —</option>
          {infractions.map(i => <option key={i.id} value={i.id}>{i.label}</option>)}
        </select>
      </div>
      <button style={{ ...s.btnCalc, opacity: type ? 1 : 0.5 }} onClick={compute} disabled={!type}>
        Calculer mon amende
      </button>
      {result && <ResultatCard data={result} />}
    </div>
  )
}

function FormulaireComportement({ pays }: { pays: PaysCode }) {
  const [type, setType] = useState('')
  const [result, setResult] = useState<ResultData | null>(null)
  const infractions = BAREME_COMPORTEMENT[pays]
  const info = PAYS[pays]

  if (!infractions) return <div style={s.noData}>Données non disponibles pour ce pays.</div>

  function compute() {
    const inf = infractions!.find(i => i.id === type)
    if (!inf) return
    const conseils: string[] = []
    if (pays === 'FR' && inf.amende_min) conseils.push(`Payez sous 15 jours : amende réduite à ${info.symbole}${inf.amende_min}.`)
    if (pays === 'GB' && inf.id === 'telephone') conseils.push('Si vous avez moins de 2 ans de permis, celui-ci sera annulé automatiquement.')
    if (inf.note) conseils.push(inf.note)
    setResult({
      amende_minoree: inf.amende_min,
      amende_forfaitaire: inf.amende,
      amende_majoree: inf.amende_max,
      points_retires: inf.points,
      symbole: info.symbole,
      risque_tribunal: inf.tribunal,
      risque_suspension: inf.suspension,
      risque_immobilisation: false,
      conseils,
      sources: getSource(pays, 'comportement'),
    })
  }

  return (
    <div>
      <div style={s.rowFull}>
        <label style={s.label}>Type d&apos;infraction</label>
        <select style={s.select} value={type} onChange={e => { setType(e.target.value); setResult(null) }}>
          <option value="">— Sélectionnez —</option>
          {infractions.map(i => <option key={i.id} value={i.id}>{i.label}</option>)}
        </select>
      </div>
      <button style={{ ...s.btnCalc, opacity: type ? 1 : 0.5 }} onClick={compute} disabled={!type}>
        Calculer mon amende
      </button>
      {result && <ResultatCard data={result} />}
    </div>
  )
}

function FormulaireZFE({ pays }: { pays: PaysCode }) {
  const [type, setType] = useState('')
  const [result, setResult] = useState<ResultData | null>(null)
  const infractions = BAREME_ZFE[pays]
  const info = PAYS[pays]

  if (!infractions) return (
    <div style={s.noData}>
      Aucune ZFE ou restriction environnementale recensée dans nos données pour ce pays.
    </div>
  )

  function compute() {
    const inf = infractions!.find(i => i.id === type)
    if (!inf) return
    const conseils: string[] = []
    if (pays === 'FR') conseils.push('Commandez votre vignette Crit\'Air sur certificat-air.gouv.fr (3,62 €). Délai ~2 semaines.')
    if (pays === 'GB') conseils.push('Vérifiez la conformité ULEZ avec la plaque sur tfl.gov.uk/modes/driving/check-your-vehicle-260.')
    if (pays === 'IT') conseils.push('Vérifiez les ZTL actives sur les sites municipaux ou via l\'app Ammende.it avant d\'entrer dans une ville.')
    if (inf.note) conseils.push(inf.note)
    setResult({
      amende_forfaitaire: inf.amende,
      amende_majoree: inf.amende_max,
      points_retires: inf.points,
      symbole: info.symbole,
      risque_tribunal: false,
      risque_suspension: false,
      risque_immobilisation: false,
      conseils,
      sources: getSource(pays, 'zfe'),
    })
  }

  return (
    <div>
      <div style={s.rowFull}>
        <label style={s.label}>Type d&apos;infraction ZFE / environnementale</label>
        <select style={s.select} value={type} onChange={e => { setType(e.target.value); setResult(null) }}>
          <option value="">— Sélectionnez —</option>
          {infractions.map(i => <option key={i.id} value={i.id}>{i.label}</option>)}
        </select>
      </div>
      <button style={{ ...s.btnCalc, opacity: type ? 1 : 0.5 }} onClick={compute} disabled={!type}>
        Voir l&apos;amende
      </button>
      {result && <ResultatCard data={result} />}
    </div>
  )
}

function FormulaireAlcool({ pays }: { pays: PaysCode }) {
  const [taux, setTaux] = useState(0.5)
  const [permisProb, setPermisProb] = useState(false)
  const [result, setResult] = useState<ResultData | null>(null)
  const baremes = BAREME_ALCOOL[pays]
  const info = PAYS[pays]

  if (!baremes) return <div style={s.noData}>Données non disponibles pour ce pays.</div>

  const tranche = useMemo(() => {
    const t = taux
    // Pour jeune conducteur FR, seuil à 0.2
    const seuil_effectif = permisProb && pays === 'FR' ? 0.2 : pays === 'BE' && permisProb ? 0.1 : pays === 'DE' && permisProb ? 0.2 : undefined
    if (seuil_effectif && t >= seuil_effectif && t < 0.5) {
      return baremes.find(b => b.taux_min <= 0.25 && b.taux_max > 0.25)
    }
    return baremes.find(b => t >= b.taux_min && t <= b.taux_max) ?? null
  }, [taux, permisProb, baremes, pays])

  function compute() {
    if (!tranche) return
    const conseils: string[] = []
    if (pays === 'FR' && taux >= 0.8) conseils.push('Délit pénal : comparution possible. Un avocat spécialisé peut obtenir une suspension réduite ou aménagée.')
    if (pays === 'FR') conseils.push('Le dépistage peut être contesté si les formalités procédurales n\'ont pas été respectées (2 tests + éthylomètre homologué).')
    if (pays === 'CH') conseils.push('En Suisse, un test sanguin est systématiquement proposé. Vous pouvez le demander pour contester un test salivaire.')
    if (pays === 'CA-QC' && taux >= 0.08) conseils.push('Infraction criminelle. Casier judiciaire. Un avocat criminaliste est vivement recommandé.')
    if (tranche.note) conseils.push(tranche.note)
    setResult({
      amende_minoree: tranche.amende_min,
      amende_forfaitaire: tranche.amende,
      amende_majoree: tranche.amende_max,
      points_retires: tranche.points,
      symbole: info.symbole,
      risque_tribunal: tranche.tribunal,
      risque_suspension: tranche.suspension,
      risque_immobilisation: taux >= 1.5,
      risque_confiscation: false,
      conseils,
      sources: getSource(pays, 'alcool'),
    })
  }

  return (
    <div>
      <div style={s.rowFull}>
        <label style={s.label}>Taux d&apos;alcool mesuré (g/L de sang)</label>
        <input
          type="range" min={0.1} max={2.5} step={0.05} value={taux} style={s.slider}
          onChange={e => { setTaux(+e.target.value); setResult(null) }}
        />
        <div style={s.sliderVal}>{taux.toFixed(2)} g/L</div>
        <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', textAlign: 'center', marginTop: 4 }}>
          ≈ {(taux / 2).toFixed(2)} mg/L en air expiré
        </div>
      </div>
      <div style={s.rowFull}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: '0.9rem' }}>
          <input
            type="checkbox" checked={permisProb} style={{ accentColor: 'var(--color-primary)', width: 16, height: 16 }}
            onChange={e => { setPermisProb(e.target.checked); setResult(null) }}
          />
          Permis probatoire (moins de 3 ans) ou conducteur professionnel
        </label>
      </div>

      {tranche && (
        <div style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', marginBottom: 12 }}>
          Tranche détectée : <strong>{tranche.label}</strong>
        </div>
      )}

      <button style={{ ...s.btnCalc, opacity: tranche ? 1 : 0.5 }} onClick={compute} disabled={!tranche}>
        Calculer les sanctions
      </button>
      {result && <ResultatCard data={result} />}
    </div>
  )
}

function FormulaireStudefiants({ pays }: { pays: PaysCode }) {
  const [result, setResult] = useState<ResultData | null>(null)
  const data = BAREME_STUPEFIANTS[pays]
  const info = PAYS[pays]

  if (!data) return <div style={s.noData}>Données non disponibles pour ce pays.</div>

  function compute() {
    const d = data!
    const conseils: string[] = []
    if (pays === 'FR') {
      conseils.push('Délit pénal. Le test salivaire positif entraîne une prise de sang confirmatoire.')
      conseils.push('Association stupefiants + alcool ≥ 0,5 g/L : amende jusqu\'à 9 000 € et 3 ans d\'emprisonnement.')
    }
    if (pays === 'CA-QC') conseils.push('Cannabis légal à la consommation mais tolérance zéro au volant. THC ≥ 2 ng/mL sang = infraction criminelle.')
    if (pays === 'DE') conseils.push('Cannabis légalisé en 2024 mais conduite sous influence strictement interdite. THC ≥ 1 ng/mL plasma = infraction.')
    if (d.note) conseils.push(d.note)
    if (d.emprisonnement_max) conseils.push(`Emprisonnement possible : jusqu\'à ${d.emprisonnement_max}.`)
    setResult({
      amende_forfaitaire: d.amende,
      amende_majoree: d.amende_max,
      points_retires: d.points,
      symbole: info.symbole,
      risque_tribunal: d.tribunal,
      risque_suspension: d.suspension,
      risque_immobilisation: true,
      risque_confiscation: pays === 'FR' || pays === 'ES',
      conseils,
      sources: getSource(pays, 'stupefiants'),
    })
  }

  return (
    <div>
      <div style={{
        background: '#fef3c7', border: '1px solid #f59e0b', borderRadius: 10,
        padding: '12px 16px', marginBottom: 18, fontSize: '0.88rem', lineHeight: 1.5,
      }}>
        <strong>⚠️ Information</strong> — La conduite sous l&apos;influence de stupéfiants est un
        <strong> délit pénal dans tous les pays couverts</strong>. Les chiffres ci-dessous sont des
        montants indicatifs ; les peines réelles dépendent des circonstances et du juge.
      </div>
      <button style={s.btnCalc} onClick={compute}>Voir les sanctions encourues</button>
      {result && <ResultatCard data={result} />}
    </div>
  )
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getSource(pays: PaysCode, type: string): string[] {
  const map: Partial<Record<PaysCode, string>> = {
    FR: 'Code de la route — Légifrance',
    BE: 'SPF Mobilité — Perceptions immédiates 2025',
    CH: 'OPO (RS 741.031) + TF',
    'CA-QC': 'Code de la sécurité routière — SAAQ',
    DE: 'BKatV 2024 — BMVI',
    ES: 'RD 1428/2003 — DGT 2024',
    IT: 'Codice della Strada 2024',
    NL: 'WAHV 2024 — CJIB',
    GB: 'Road Traffic Offenders Act 1988',
    AT: 'FSG + STVO AT 2024',
  }
  return [map[pays] ?? 'Source officielle nationale', `Moteurs.com — Barèmes ${new Date().getFullYear()}`]
}

// ─── Composant principal ──────────────────────────────────────────────────────

interface Props {
  defaultPays?: PaysCode
  defaultTab?: TypeInfraction
  compact?: boolean
}

export default function CalculateurPV({ defaultPays = 'FR', defaultTab = 'vitesse', compact = false }: Props) {
  const [pays, setPays] = useState<PaysCode>(defaultPays)
  const [onglet, setOnglet] = useState<TypeInfraction>(defaultTab)
  const paysInfo = PAYS[pays]

  return (
    <div style={s.wrap}>
      {/* Sélecteur pays */}
      {!compact && (
        <div style={{ marginBottom: 22 }}>
          <label style={s.label}>
            {paysInfo.drapeau} Pays
          </label>
          <select
            style={{ ...s.select, maxWidth: 320 }}
            value={pays}
            onChange={e => setPays(e.target.value as PaysCode)}
          >
            {PAYS_LISTE.map(p => (
              <option key={p.code} value={p.code}>{p.drapeau} {p.nom}</option>
            ))}
          </select>
          {paysInfo.note_generale && (
            <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: 8, lineHeight: 1.5 }}>
              {paysInfo.note_generale}
            </p>
          )}
        </div>
      )}

      {/* Onglets types d'infractions */}
      <div style={s.tabs}>
        {ONGLETS.map(o => (
          <button
            key={o.id}
            style={s.tab(onglet === o.id)}
            onClick={() => setOnglet(o.id)}
          >
            {o.emoji} {o.label}
          </button>
        ))}
      </div>

      {/* Formulaire dynamique */}
      <div style={s.card}>
        {onglet === 'vitesse'       && <FormulaireVitesse pays={pays} key={pays} />}
        {onglet === 'stationnement' && <FormulaireStationnement pays={pays} key={pays} />}
        {onglet === 'comportement'  && <FormulaireComportement pays={pays} key={pays} />}
        {onglet === 'zfe'           && <FormulaireZFE pays={pays} key={pays} />}
        {onglet === 'alcool'        && <FormulaireAlcool pays={pays} key={pays} />}
        {onglet === 'stupefiants'   && <FormulaireStudefiants pays={pays} key={pays} />}
      </div>

      {/* Disclaimer */}
      <div style={s.disclaimer}>
        <strong>ℹ️ Estimation indicative.</strong> Ces montants correspondent aux barèmes officiels en vigueur
        ({new Date().getFullYear()}) mais ne constituent pas un avis juridique. Les amendes réelles peuvent varier
        selon les circonstances, la récidive et les décisions des autorités. En cas de doute, consultez un avocat
        spécialisé en droit routier.
      </div>
    </div>
  )
}
