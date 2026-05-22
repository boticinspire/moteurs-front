'use client'

import { useState, useMemo } from 'react'

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// WALLONIE — Formule exacte (réforme 01/07/2025, valable jusqu'au 30/06/2026)
// Source : SPW Finances — finances.wallonie.be
// TMC = MB × (CO₂/X) × (MMA/1838) × C   [clampé 50 € – 9 000 €]
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const MB_TRANCHES: Array<[number, number]> = [
  [70,  61.50],
  [85,  123],
  [100, 495],
  [110, 867],
  [120, 1239],
  [155, 2478],
  [Infinity, 4957],
]

const DEGRESSIVITE: number[] = [
  1.00, 0.90, 0.80, 0.70, 0.60, 0.55, 0.50,
  0.45, 0.40, 0.35, 0.30, 0.25, 0.20, 0.15, 0.10,
]

function getMB(kw: number): number {
  for (const [max, mb] of MB_TRANCHES) if (kw <= max) return mb
  return 4957
}

function getMBDegressif(kw: number, ageAns: number): number {
  const mb = getMB(kw)
  if (ageAns >= 15) return 61.50
  const factor = DEGRESSIVITE[Math.min(ageAns, 14)]
  return Math.max(61.50, mb * factor)
}

function getCoefficientC(moto: string, kw: number): number {
  if (moto === 'elec' || moto === 'h2') {
    if (kw <= 120) return 0.01
    if (kw <= 155) return 0.10
    if (kw <= 249) return 0.18
    return 0.26
  }
  if (moto === 'phev' || moto === 'hev') return 0.80
  return 1.00  // essence / diesel / gpl / gnv / autre
}

interface WallonieParams {
  kw: number; co2: number; norme: 'wltp' | 'nedc'
  mma: number; moto: string; ageAns: number; familleNombreuse: boolean
}

interface WallonieResult {
  tmc: number
  mb: number; mbDeg: number; co2Factor: number
  masseFactor: number; C: number; reduction: number
}

function calculerWallonie(p: WallonieParams): WallonieResult {
  const mb    = getMB(p.kw)
  const mbDeg = getMBDegressif(p.kw, p.ageAns)

  let co2Factor: number
  if (p.moto === 'elec' || p.moto === 'h2') {
    co2Factor = 1
  } else {
    const X = p.norme === 'wltp' ? 136 : 115
    co2Factor = p.co2 / X
  }

  const masseFactor = p.mma / 1838
  const C = getCoefficientC(p.moto, p.kw)

  let tmc = mbDeg * co2Factor * masseFactor * C
  tmc = Math.max(50, Math.min(9000, tmc))

  const reduction = p.familleNombreuse ? 250 : 0
  tmc = Math.max(50, tmc - reduction)

  return { tmc, mb, mbDeg, co2Factor, masseFactor, C, reduction }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Utilitaires UI
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function fmt2(v: number) {
  return v.toLocaleString('fr-BE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function Field({
  label, hint, children,
}: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-text-soft)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
        {label}
      </label>
      {children}
      {hint && <span style={{ fontSize: '0.74rem', color: 'var(--color-text-soft)' }}>{hint}</span>}
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  padding: '10px 14px',
  background: 'var(--color-bg)',
  border: '1px solid var(--color-border)',
  borderRadius: 8, color: 'var(--color-text)',
  fontSize: '1rem', fontFamily: 'inherit', width: '100%', boxSizing: 'border-box',
}
const selectStyle: React.CSSProperties = { ...inputStyle }

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Formulaire Wallonie
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function FormulaireWallonie() {
  const currentYear = new Date().getFullYear()

  const [kw,     setKw]     = useState('')
  const [co2,    setCo2]    = useState('')
  const [norme,  setNorme]  = useState<'wltp' | 'nedc'>('wltp')
  const [mma,    setMma]    = useState('')
  const [moto,   setMoto]   = useState('essence')
  const [annee,  setAnnee]  = useState(String(currentYear))
  const [famille,setFamille]= useState(false)

  const isElec = moto === 'elec' || moto === 'h2'

  const result = useMemo<WallonieResult | null>(() => {
    const kwN   = parseFloat(kw)
    const co2N  = isElec ? 0 : parseFloat(co2)
    const mmaN  = parseFloat(mma)
    const anneeN = parseInt(annee)

    if (!kwN || kwN <= 0) return null
    if (!isElec && (!co2N || co2N <= 0)) return null
    if (!mmaN || mmaN <= 0) return null
    if (!anneeN || anneeN < 1970 || anneeN > currentYear) return null

    return calculerWallonie({
      kw: kwN, co2: isElec ? 0 : co2N, norme,
      mma: mmaN, moto, ageAns: currentYear - anneeN,
      familleNombreuse: famille,
    })
  }, [kw, co2, norme, mma, moto, annee, famille, isElec, currentYear])

  return (
    <div>
      {/* Grille de saisie */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
        <Field label="Motorisation">
          <select style={selectStyle} value={moto} onChange={(e) => setMoto(e.target.value)}>
            <option value="essence">Essence</option>
            <option value="diesel">Diesel</option>
            <option value="gpl">GPL / LPG</option>
            <option value="gnv">GNV / CNG</option>
            <option value="hev">Hybride (HEV)</option>
            <option value="phev">Hybride rechargeable (PHEV)</option>
            <option value="elec">Électrique</option>
            <option value="h2">Hydrogène</option>
          </select>
        </Field>

        <Field label="Puissance (kW)" hint="Case P2 de la carte grise">
          <input type="number" min="1" max="1000" step="1" placeholder="ex : 110" style={inputStyle}
            value={kw} onChange={(e) => setKw(e.target.value)} />
        </Field>

        {!isElec && (
          <Field label="Émissions CO₂ (g/km)" hint="Case V7 de la carte grise">
            <input type="number" min="1" max="600" step="1" placeholder="ex : 142" style={inputStyle}
              value={co2} onChange={(e) => setCo2(e.target.value)} />
          </Field>
        )}

        {!isElec && (
          <Field label="Norme CO₂" hint="Cycle de mesure">
            <select style={selectStyle} value={norme} onChange={(e) => setNorme(e.target.value as 'wltp' | 'nedc')}>
              <option value="wltp">WLTP (après 2018)</option>
              <option value="nedc">NEDC (avant 2018)</option>
            </select>
          </Field>
        )}

        <Field label="MMA (kg)" hint="Masse maxi autorisée — case F1">
          <input type="number" min="500" max="5000" step="10" placeholder="ex : 1750" style={inputStyle}
            value={mma} onChange={(e) => setMma(e.target.value)} />
        </Field>

        <Field label="Année 1ère immatriculation" hint="Dégressivité selon l'âge">
          <input type="number" min="1970" max={currentYear} step="1" placeholder={String(currentYear)} style={inputStyle}
            value={annee} onChange={(e) => setAnnee(e.target.value)} />
        </Field>
      </div>

      {/* Option famille nombreuse */}
      <label style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 16, cursor: 'pointer', fontSize: '0.92rem' }}>
        <input type="checkbox" checked={famille} onChange={(e) => setFamille(e.target.checked)}
          style={{ width: 18, height: 18, accentColor: 'var(--color-primary)', cursor: 'pointer' }} />
        Famille nombreuse (3 enfants ou plus) — réduction de 250 €
      </label>

      {/* Résultat */}
      {result && (
        <div style={{
          marginTop: 24, padding: '24px 24px 20px',
          background: 'rgba(122,240,194,0.07)',
          border: '2px solid var(--color-primary)',
          borderRadius: 12,
        }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
            <div style={{ fontSize: '0.82rem', color: 'var(--color-text-soft)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              TMC estimée
            </div>
            <div style={{ fontSize: '2.4rem', fontWeight: 800, color: 'var(--color-primary)', lineHeight: 1 }}>
              {fmt2(result.tmc)} €
            </div>
            {result.reduction > 0 && (
              <div style={{ fontSize: '0.85rem', color: '#7af0c2', fontWeight: 600 }}>
                (après réduction −{result.reduction} €)
              </div>
            )}
          </div>

          {/* Détail du calcul */}
          <details style={{ fontSize: '0.82rem', color: 'var(--color-text-soft)' }}>
            <summary style={{ cursor: 'pointer', fontWeight: 600, marginBottom: 8, color: 'var(--color-text)' }}>
              Détail du calcul
            </summary>
            <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 8 }}>
              <tbody>
                {[
                  ['Montant de base (MB)', `${fmt2(result.mb)} €`],
                  ['MB après dégressivité (âge)', `${fmt2(result.mbDeg)} €`],
                  ['Coefficient CO₂ (CO₂/X)', isElec ? '1,00 (électrique)' : fmt2(result.co2Factor)],
                  ['Coefficient masse (MMA/1 838)', fmt2(result.masseFactor)],
                  ['Coefficient énergie (C)', fmt2(result.C)],
                  ['TMC brute (avant plafond)', `${fmt2(result.mbDeg * result.co2Factor * result.masseFactor * result.C)} €`],
                  ['Plafond appliqué (50 € – 9 000 €)', '✓'],
                  ...(result.reduction > 0 ? [['Réduction famille nombreuse', `−${result.reduction} €`]] : []),
                ].map(([k, v]) => (
                  <tr key={k} style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <td style={{ padding: '5px 0', paddingRight: 16 }}>{k}</td>
                    <td style={{ padding: '5px 0', fontWeight: 600, textAlign: 'right', whiteSpace: 'nowrap' }}>{v}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </details>
        </div>
      )}

      {/* Source + disclaimer */}
      <div style={{ marginTop: 16, fontSize: '0.78rem', color: 'var(--color-text-soft)', lineHeight: 1.7 }}>
        <strong>Source :</strong> <a href="https://finances.wallonie.be" target="_blank" rel="noopener" style={{ color: 'var(--color-primary)' }}>
          SPW Finances — Portail officiel Wallonie
        </a><br />
        Barème valable du 01/07/2025 au 30/06/2026. Indexation annuelle au 1er juillet.
        Ce calculateur fournit une <strong>estimation indicative</strong> — aucun conseil fiscal. Pour un montant opposable, utilisez le simulateur officiel du SPW Finances.
      </div>
    </div>
  )
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Bloc Bruxelles
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function InfoBruxelles() {
  return (
    <div style={{
      padding: '24px', background: 'var(--color-bg-alt)',
      border: '1px solid var(--color-border)', borderRadius: 10,
    }}>
      <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 12 }}>
        Comment est calculée la TMC à Bruxelles ?
      </h3>
      <p style={{ fontSize: '0.9rem', color: 'var(--color-text-soft)', lineHeight: 1.7, margin: 0 }}>
        La Région de Bruxelles-Capitale applique <strong>deux grilles tarifaires</strong> simultanément : une basée sur les <strong>chevaux fiscaux (CV)</strong> et une sur la <strong>puissance en kW</strong>. Le montant le plus élevé des deux est retenu.
        La TMC est modulée par <strong>l'âge du véhicule</strong> (réduction progressive) et diffère selon que le véhicule est acquis en <strong>leasing ou non</strong>.
      </p>
      <div style={{ marginTop: 16, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        {[
          ['Montant minimum 2026', '75,79 €'],
          ['Montant maximum 2026', '6 108,51 €'],
          ['Taxe unique', 'Oui (à l\'immatriculation)'],
          ['Véhicules électriques', 'Taxé (pas d\'exonération automatique)'],
        ].map(([k, v]) => (
          <div key={k} style={{ padding: '12px 14px', background: 'var(--color-bg)', borderRadius: 8, border: '1px solid var(--color-border)' }}>
            <div style={{ fontSize: '0.74rem', color: 'var(--color-text-soft)', marginBottom: 4 }}>{k}</div>
            <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{v}</div>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 16 }}>
        <a
          href="https://mytax.brussels/WFBTAX/"
          target="_blank" rel="noopener"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '10px 20px', background: 'var(--color-primary)',
            color: '#000', borderRadius: 8, fontWeight: 700, fontSize: '0.88rem',
            textDecoration: 'none',
          }}
        >
          🔗 Calculer sur MyTax (Bruxelles Fiscalité) →
        </a>
      </div>
      <div style={{ marginTop: 12, fontSize: '0.78rem', color: 'var(--color-text-soft)' }}>
        La complexité du barème (deux grilles + leasing) rend le calcul précis difficile sans l'outil officiel.
      </div>
    </div>
  )
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Bloc Flandre
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function InfoFlandre() {
  return (
    <div style={{
      padding: '24px', background: 'var(--color-bg-alt)',
      border: '1px solid var(--color-border)', borderRadius: 10,
    }}>
      <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 12 }}>
        Comment est calculée la TMC (BIV) en Flandre ?
      </h3>
      <p style={{ fontSize: '0.9rem', color: 'var(--color-text-soft)', lineHeight: 1.7, margin: 0 }}>
        La Flandre calcule la BIV (<em>Belasting Inschrijving Voertuigen</em>) en combinant plusieurs facteurs :
        les <strong>émissions de CO₂</strong> (g/km), la <strong>norme Euro</strong>, la <strong>puissance fiscale</strong>
        (CV ou kW, le montant le plus élevé) et l'<strong>âge du véhicule</strong>.
        Le montant retenu est le plus élevé entre le calcul en CV fiscal et le calcul en kW.
      </p>
      <div style={{ marginTop: 16, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        {[
          ['Montant minimum 2026', '55 €'],
          ['Montant maximum 2026', '13 250 €'],
          ['Véhicules électriques', '61,50 € (forfait depuis 2026)'],
          ['Service percepteur', 'Vlaamse Belastingdienst'],
        ].map(([k, v]) => (
          <div key={k} style={{ padding: '12px 14px', background: 'var(--color-bg)', borderRadius: 8, border: '1px solid var(--color-border)' }}>
            <div style={{ fontSize: '0.74rem', color: 'var(--color-text-soft)', marginBottom: 4 }}>{k}</div>
            <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{v}</div>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 16, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <a
          href="https://belastingen.fenb.be/ui/public/landing"
          target="_blank" rel="noopener"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '10px 20px', background: 'var(--color-primary)',
            color: '#000', borderRadius: 8, fontWeight: 700, fontSize: '0.88rem',
            textDecoration: 'none',
          }}
        >
          🔗 Simulateur officiel Flandre →
        </a>
      </div>
      <div style={{ marginTop: 12, fontSize: '0.78rem', color: 'var(--color-text-soft)' }}>
        Le simulateur flamand est disponible en néerlandais uniquement. Les paramètres nécessaires se trouvent sur votre carte grise (V7 pour CO₂, P2 pour la puissance, norme Euro).
      </div>
    </div>
  )
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Page principale
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const REGIONS = [
  { id: 'wallonie',  flag: '🟡', label: 'Wallonie' },
  { id: 'bruxelles', flag: '🔵', label: 'Bruxelles' },
  { id: 'flandre',   flag: '🟡', label: 'Flandre' },
]

export default function ImmatriculationBelgiquePage() {
  const [region, setRegion] = useState('wallonie')

  return (
    <>
      <section className="page-hero">
        <div className="container" style={{ maxWidth: 860 }}>
          <nav className="breadcrumb"><a href="/outils">← Outils</a></nav>
          <h1>🇧🇪 Frais d'immatriculation — Belgique</h1>
          <p>Calculez la TMC (taxe de mise en circulation) selon votre région et les caractéristiques de votre véhicule.</p>
        </div>
      </section>

      <div style={{ padding: '40px 0 80px' }}>
        <div className="container" style={{ maxWidth: 860 }}>

          {/* Sélecteur de région */}
          <div style={{ marginBottom: 32 }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-text-soft)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>
              Votre région
            </div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {REGIONS.map((r) => (
                <button key={r.id} onClick={() => setRegion(r.id)} style={{
                  padding: '10px 22px',
                  borderRadius: 8, cursor: 'pointer',
                  fontWeight: 700, fontSize: '0.95rem',
                  fontFamily: 'inherit',
                  border: region === r.id ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                  background: region === r.id ? 'rgba(122,240,194,0.12)' : 'var(--color-bg-alt)',
                  color: region === r.id ? 'var(--color-primary)' : 'var(--color-text)',
                  transition: 'all 0.15s',
                }}>
                  {r.flag} {r.label}
                </button>
              ))}
            </div>
          </div>

          {/* Contenu par région */}
          {region === 'wallonie' && (
            <div>
              <div style={{
                padding: '12px 16px', marginBottom: 20,
                background: 'rgba(122,240,194,0.07)', border: '1px solid var(--color-primary)',
                borderRadius: 8, fontSize: '0.82rem', color: 'var(--color-text-soft)',
              }}>
                ✅ <strong>Calcul précis disponible</strong> — Formule officielle SPW Finances (réforme juillet 2025, barèmes 2025–2026).
              </div>
              <FormulaireWallonie />
            </div>
          )}

          {region === 'bruxelles' && (
            <div>
              <div style={{
                padding: '12px 16px', marginBottom: 20,
                background: 'rgba(255,200,0,0.07)', border: '1px solid rgba(255,200,0,0.4)',
                borderRadius: 8, fontSize: '0.82rem', color: 'var(--color-text-soft)',
              }}>
                ⚠️ Le barème Bruxellois (double grille CV/kW + leasing) nécessite l'outil officiel MyTax pour un résultat précis.
              </div>
              <InfoBruxelles />
            </div>
          )}

          {region === 'flandre' && (
            <div>
              <div style={{
                padding: '12px 16px', marginBottom: 20,
                background: 'rgba(255,200,0,0.07)', border: '1px solid rgba(255,200,0,0.4)',
                borderRadius: 8, fontSize: '0.82rem', color: 'var(--color-text-soft)',
              }}>
                ⚠️ La BIV flamande intègre la norme Euro et plusieurs tables complexes — le simulateur officiel est recommandé.
              </div>
              <InfoFlandre />
            </div>
          )}

          {/* Info taxe de circulation */}
          <div style={{
            marginTop: 32, padding: '20px 22px',
            background: 'var(--color-bg-alt)', border: '1px solid var(--color-border)',
            borderRadius: 10,
          }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: 10 }}>
              📅 Ne confondez pas : TMC ≠ Taxe de circulation annuelle
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--color-text-soft)', lineHeight: 1.7, margin: 0 }}>
              La <strong>TMC</strong> (Taxe de Mise en Circulation) est une <strong>taxe unique</strong>, payée une seule fois à l'immatriculation.
              La <strong>taxe de circulation</strong> est une <strong>taxe annuelle</strong> due chaque année pour circuler.
              Elle est calculée différemment (puissance fiscale CV en Wallonie/Bruxelles, CO₂ en Flandre) et varie aussi selon la région.
            </p>
          </div>

          {/* Données carte grise */}
          <div style={{
            marginTop: 16, padding: '20px 22px',
            background: 'var(--color-bg-alt)', border: '1px solid var(--color-border)',
            borderRadius: 10,
          }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: 10 }}>
              📋 Où trouver ces données sur votre carte grise ?
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 10 }}>
              {[
                ['Case P2', 'Puissance moteur (kW)'],
                ['Case V7', 'Émissions CO₂ (g/km)'],
                ['Case F1', 'MMA — Masse maxi (kg)'],
                ['Case B', 'Date 1ère immatriculation'],
                ['Case P3', 'Cylindrée (cm³)'],
                ['Case G', 'Masse à vide (kg)'],
              ].map(([case_, desc]) => (
                <div key={case_} style={{ padding: '10px 12px', background: 'var(--color-bg)', borderRadius: 6, border: '1px solid var(--color-border)' }}>
                  <div style={{ fontWeight: 800, fontSize: '0.85rem', color: 'var(--color-primary)', marginBottom: 2 }}>{case_}</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--color-text-soft)' }}>{desc}</div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </>
  )
}
