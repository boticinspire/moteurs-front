'use client'

import { useState } from 'react'
import type { Metadata } from 'next'

// ── Constantes de conversion ──────────────────────────────────────────────────
const KW_TO_CH  = 1.35962   // 1 kW = 1.35962 ch (CV)
const NM_TO_LBF = 0.737562  // 1 Nm = 0.737562 lb·ft

// ── Helpers ───────────────────────────────────────────────────────────────────
function fmt(v: number, dec = 1) {
  return isNaN(v) || !isFinite(v) ? '—' : v.toLocaleString('fr-FR', { maximumFractionDigits: dec })
}

// ── Sous-composants ───────────────────────────────────────────────────────────

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: 16, color: 'var(--color-text)' }}>
      {children}
    </h2>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--color-text-soft)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
        {label}
      </label>
      {children}
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  padding: '10px 14px',
  background: 'var(--color-bg)',
  border: '1px solid var(--color-border)',
  borderRadius: 8,
  color: 'var(--color-text)',
  fontSize: '1rem',
  fontFamily: 'inherit',
  width: '100%',
  boxSizing: 'border-box',
}

const resultStyle: React.CSSProperties = {
  padding: '18px 20px',
  background: 'rgba(122,240,194,0.08)',
  border: '1px solid var(--color-primary)',
  borderRadius: 10,
  marginTop: 16,
}

const cardStyle: React.CSSProperties = {
  background: 'var(--color-bg-alt)',
  border: '1px solid var(--color-border)',
  borderRadius: 12,
  padding: '28px 28px 24px',
}

// ── Section 1 : kW ↔ ch ───────────────────────────────────────────────────────
function ConvPuissance() {
  const [kw, setKw] = useState('')
  const [ch, setCh] = useState('')

  function onKwChange(v: string) {
    setKw(v)
    const n = parseFloat(v.replace(',', '.'))
    setCh(isNaN(n) ? '' : fmt(n * KW_TO_CH, 1))
  }
  function onChChange(v: string) {
    setCh(v)
    const n = parseFloat(v.replace(',', '.'))
    setKw(isNaN(n) ? '' : fmt(n / KW_TO_CH, 1))
  }

  const kwN = parseFloat(kw.replace(',', '.'))
  const chN = parseFloat(ch.replace(',', '.'))

  return (
    <div style={cardStyle}>
      <SectionTitle>⚡ Puissance — kW ↔ ch (CV)</SectionTitle>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <Field label="Kilowatts (kW)">
          <input type="number" min="0" step="0.1" placeholder="ex: 110" style={inputStyle}
            value={kw} onChange={(e) => onKwChange(e.target.value)} />
        </Field>
        <Field label="Chevaux (ch / CV)">
          <input type="number" min="0" step="0.1" placeholder="ex: 150" style={inputStyle}
            value={ch} onChange={(e) => onChChange(e.target.value)} />
        </Field>
      </div>
      {(kwN > 0 || chN > 0) && (
        <div style={resultStyle}>
          {kwN > 0 && <div style={{ fontSize: '1.05rem', fontWeight: 600 }}>
            {fmt(kwN, 1)} kW = <span style={{ color: 'var(--color-primary)' }}>{fmt(kwN * KW_TO_CH, 1)} ch</span>
          </div>}
          {chN > 0 && <div style={{ fontSize: '0.92rem', color: 'var(--color-text-soft)', marginTop: 4 }}>
            {fmt(chN, 1)} ch = <span style={{ color: 'var(--color-primary)' }}>{fmt(chN / KW_TO_CH, 1)} kW</span>
          </div>}
          <div style={{ fontSize: '0.78rem', color: 'var(--color-text-soft)', marginTop: 8 }}>
            1 kW = 1,35962 ch · 1 ch = 0,73550 kW
          </div>
        </div>
      )}
    </div>
  )
}

// ── Section 2 : Nm ↔ lb·ft ───────────────────────────────────────────────────
function ConvCouple() {
  const [nm, setNm] = useState('')
  const [lb, setLb] = useState('')

  function onNmChange(v: string) {
    setNm(v)
    const n = parseFloat(v.replace(',', '.'))
    setLb(isNaN(n) ? '' : fmt(n * NM_TO_LBF, 1))
  }
  function onLbChange(v: string) {
    setLb(v)
    const n = parseFloat(v.replace(',', '.'))
    setNm(isNaN(n) ? '' : fmt(n / NM_TO_LBF, 1))
  }

  const nmN = parseFloat(nm.replace(',', '.'))
  const lbN = parseFloat(lb.replace(',', '.'))

  return (
    <div style={cardStyle}>
      <SectionTitle>🔩 Couple — Nm ↔ lb·ft</SectionTitle>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <Field label="Newton-mètre (Nm)">
          <input type="number" min="0" step="1" placeholder="ex: 400" style={inputStyle}
            value={nm} onChange={(e) => onNmChange(e.target.value)} />
        </Field>
        <Field label="Livre-pied (lb·ft)">
          <input type="number" min="0" step="1" placeholder="ex: 295" style={inputStyle}
            value={lb} onChange={(e) => onLbChange(e.target.value)} />
        </Field>
      </div>
      {(nmN > 0 || lbN > 0) && (
        <div style={resultStyle}>
          {nmN > 0 && <div style={{ fontSize: '1.05rem', fontWeight: 600 }}>
            {fmt(nmN, 0)} Nm = <span style={{ color: 'var(--color-primary)' }}>{fmt(nmN * NM_TO_LBF, 1)} lb·ft</span>
          </div>}
          {lbN > 0 && <div style={{ fontSize: '0.92rem', color: 'var(--color-text-soft)', marginTop: 4 }}>
            {fmt(lbN, 1)} lb·ft = <span style={{ color: 'var(--color-primary)' }}>{fmt(lbN / NM_TO_LBF, 0)} Nm</span>
          </div>}
          <div style={{ fontSize: '0.78rem', color: 'var(--color-text-soft)', marginTop: 8 }}>
            1 Nm = 0,7376 lb·ft · 1 lb·ft = 1,3558 Nm
          </div>
        </div>
      )}
    </div>
  )
}

// ── Section 3 : Autonomie batterie ────────────────────────────────────────────
const TEMP_FACTORS: Record<string, { label: string; factor: number }> = {
  chaud:    { label: '☀️ Été / chaud (>20°C)',       factor: 1.00 },
  tempere:  { label: '🌤️ Tempéré (10–20°C)',          factor: 0.90 },
  frais:    { label: '🌧️ Frais (0–10°C)',              factor: 0.80 },
  froid:    { label: '❄️ Froid (-10 à 0°C)',           factor: 0.68 },
  tresfroid:{ label: '🥶 Grand froid (< -10°C)',        factor: 0.55 },
}

function ConvAutonomie() {
  const [kwh,  setKwh]  = useState('')
  const [conso, setConso] = useState('')
  const [usable, setUsable] = useState('90')
  const [temp,  setTemp]  = useState('tempere')

  const kwhN    = parseFloat(kwh.replace(',', '.'))
  const consoN  = parseFloat(conso.replace(',', '.'))
  const usableN = parseFloat(usable) / 100
  const { factor, label } = TEMP_FACTORS[temp]

  const kwhUsable  = kwhN * usableN
  const autoNominal = consoN > 0 ? (kwhUsable / consoN) * 100 : 0
  const autoReel    = autoNominal * factor

  const hasResult = kwhN > 0 && consoN > 0

  return (
    <div style={cardStyle}>
      <SectionTitle>🔋 Autonomie batterie</SectionTitle>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
        <Field label="Capacité brute (kWh)">
          <input type="number" min="0" step="0.5" placeholder="ex: 77" style={inputStyle}
            value={kwh} onChange={(e) => setKwh(e.target.value)} />
        </Field>
        <Field label="Consommation (Wh/km)">
          <input type="number" min="0" step="1" placeholder="ex: 185" style={inputStyle}
            value={conso} onChange={(e) => setConso(e.target.value)} />
        </Field>
        <Field label={`Énergie utilisable : ${usable}%`}>
          <input type="range" min="75" max="100" step="1" style={{ width: '100%', accentColor: 'var(--color-primary)', marginTop: 4 }}
            value={usable} onChange={(e) => setUsable(e.target.value)} />
          <div style={{ fontSize: '0.78rem', color: 'var(--color-text-soft)' }}>
            Capacité utile : {kwhN > 0 ? fmt(kwhUsable, 1) : '—'} kWh
          </div>
        </Field>
        <Field label="Température extérieure">
          <select style={{ ...inputStyle }} value={temp} onChange={(e) => setTemp(e.target.value)}>
            {Object.entries(TEMP_FACTORS).map(([k, v]) => (
              <option key={k} value={k}>{v.label}</option>
            ))}
          </select>
        </Field>
      </div>

      {hasResult && (
        <div style={resultStyle}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <div style={{ fontSize: '0.78rem', color: 'var(--color-text-soft)', marginBottom: 4 }}>Autonomie nominale (WLTP)</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-primary)' }}>
                {fmt(autoNominal, 0)} km
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.78rem', color: 'var(--color-text-soft)', marginBottom: 4 }}>Autonomie réelle estimée ({label})</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-primary)' }}>
                ~{fmt(autoReel, 0)} km
              </div>
            </div>
          </div>
          <div style={{ marginTop: 12, fontSize: '0.82rem', color: 'var(--color-text-soft)', lineHeight: 1.6 }}>
            Base de calcul : {fmt(kwhUsable, 1)} kWh utiles ÷ {fmt(consoN, 0)} Wh/km × facteur température {factor * 100}%
          </div>
        </div>
      )}
      <div style={{ marginTop: 16, fontSize: '0.78rem', color: 'var(--color-text-soft)', lineHeight: 1.6 }}>
        💡 La consommation réelle varie selon l'autoroute/ville, la climatisation et les habitudes de conduite. Entrez votre consommation mesurée pour un résultat personnalisé.
      </div>
    </div>
  )
}

// ── Section 4 : CO₂ → coût carbone (bonus/malus FR) ─────────────────────────
// Barème malus 2026 (France) — approximatif, à titre indicatif
const MALUS_FR_2026: Array<[number, number]> = [
  [117, 0], [118, 50], [119, 75], [120, 100], [122, 125], [124, 150],
  [126, 175], [128, 200], [130, 250], [135, 300], [140, 400], [145, 500],
  [150, 1000], [155, 2000], [160, 3000], [165, 4000], [170, 5000],
  [175, 6000], [180, 8000], [185, 10000], [195, 16000], [200, 20000],
  [999, 30000],
]

function getMalusFR(co2: number): number {
  for (let i = MALUS_FR_2026.length - 1; i >= 0; i--) {
    if (co2 > MALUS_FR_2026[i][0]) return MALUS_FR_2026[i + 1]?.[1] ?? MALUS_FR_2026[i][1]
  }
  return 0
}

function ConvCO2() {
  const [co2, setCo2] = useState('')
  const co2N = parseInt(co2)
  const malus = co2N > 0 ? getMalusFR(co2N) : null

  return (
    <div style={cardStyle}>
      <SectionTitle>💨 CO₂ & Malus écologique (France)</SectionTitle>
      <Field label="Émissions CO₂ WLTP (g/km)">
        <input type="number" min="0" max="500" step="1" placeholder="ex: 142" style={{ ...inputStyle, maxWidth: 200 }}
          value={co2} onChange={(e) => setCo2(e.target.value)} />
      </Field>
      {malus !== null && (
        <div style={resultStyle}>
          {malus === 0
            ? <div style={{ fontWeight: 600, color: 'var(--color-primary)' }}>✅ Pas de malus (≤ 118 g/km)</div>
            : <div>
                <div style={{ fontSize: '0.82rem', color: 'var(--color-text-soft)', marginBottom: 4 }}>Malus estimé (barème France 2026)</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#f87171' }}>
                  {malus.toLocaleString('fr-FR')} €
                </div>
              </div>
          }
          <div style={{ fontSize: '0.78rem', color: 'var(--color-text-soft)', marginTop: 8 }}>
            Barème indicatif 2026 — source : Direction générale des finances publiques. Le montant exact peut varier selon la date d'immatriculation.
          </div>
        </div>
      )}
    </div>
  )
}

// ── Page principale ───────────────────────────────────────────────────────────
export default function ConvertisseurPage() {
  return (
    <>
      <section className="page-hero">
        <div className="container" style={{ maxWidth: 820 }}>
          <nav className="breadcrumb"><a href="/outils">← Outils</a></nav>
          <h1>Convertisseur technique</h1>
          <p>kW ↔ ch · Nm ↔ lb·ft · Autonomie batterie · Malus CO₂ France</p>
        </div>
      </section>

      <div style={{ padding: '48px 0 80px' }}>
        <div className="container" style={{ maxWidth: 820 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <ConvPuissance />
            <ConvCouple />
            <ConvAutonomie />
            <ConvCO2 />
          </div>

          <div style={{
            marginTop: 32, padding: '14px 18px',
            background: 'var(--color-bg-alt)', border: '1px solid var(--color-border)',
            borderRadius: 8, fontSize: '0.78rem', color: 'var(--color-text-soft)', lineHeight: 1.6,
          }}>
            Ces outils sont fournis à titre indicatif. Les conversions sont mathématiquement exactes ; les estimations (autonomie, malus) dépendent de conditions réelles pouvant varier. Moteurs.com n'est pas responsable des décisions prises sur la base de ces calculs.
          </div>
        </div>
      </div>
    </>
  )
}
