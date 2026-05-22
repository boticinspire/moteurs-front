'use client'

import { useState, useMemo } from 'react'

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Puissance fiscale (chevaux fiscaux) — formule officielle ANTS
// PF = (P/40)^1.6 + CO₂/45  [arrondi à l'entier le plus proche, min 1]
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function calculerCV(kw: number, co2: number, isElec: boolean): number {
  if (isElec) return Math.max(1, Math.round(Math.pow(kw / 40, 1.6)))
  return Math.max(1, Math.round(Math.pow(kw / 40, 1.6) + co2 / 45))
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Tarifs régionaux (€/CV) — barème 2025 / indicatif
// Source : ants.gouv.fr / légifrance — mis à jour annuellement par chaque région
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const REGIONS: Array<{ id: string; label: string; tarif: number; exoElec: boolean; note?: string }> = [
  { id: 'ile-de-france',       label: 'Île-de-France',                   tarif: 46.15, exoElec: true },
  { id: 'auvergne-ra',         label: 'Auvergne-Rhône-Alpes',            tarif: 51.50, exoElec: true },
  { id: 'bourgogne-fc',        label: 'Bourgogne-Franche-Comté',         tarif: 56.00, exoElec: true },
  { id: 'bretagne',            label: 'Bretagne',                        tarif: 51.00, exoElec: true },
  { id: 'centre-vl',          label: 'Centre-Val de Loire',              tarif: 55.00, exoElec: true },
  { id: 'corse',               label: 'Corse',                           tarif: 0,     exoElec: true, note: 'Exonération totale (tous véhicules)' },
  { id: 'grand-est',           label: 'Grand Est',                       tarif: 48.00, exoElec: true },
  { id: 'hauts-de-france',     label: 'Hauts-de-France',                 tarif: 33.00, exoElec: true },
  { id: 'normandie',           label: 'Normandie',                       tarif: 35.00, exoElec: true },
  { id: 'nouvelle-aquitaine',  label: 'Nouvelle-Aquitaine',              tarif: 41.00, exoElec: true },
  { id: 'occitanie',           label: 'Occitanie',                       tarif: 55.00, exoElec: true },
  { id: 'pays-de-la-loire',   label: 'Pays de la Loire',                tarif: 48.00, exoElec: true },
  { id: 'paca',                label: 'Provence-Alpes-Côte d\'Azur',    tarif: 51.20, exoElec: true },
  { id: 'guadeloupe',          label: 'Guadeloupe (DOM)',                tarif: 41.00, exoElec: true },
  { id: 'martinique',          label: 'Martinique (DOM)',                tarif: 41.00, exoElec: true },
  { id: 'la-reunion',          label: 'La Réunion (DOM)',                tarif: 51.00, exoElec: true },
  { id: 'guyane',              label: 'Guyane (DOM)',                    tarif: 0,     exoElec: true, note: 'Exonération totale' },
  { id: 'mayotte',             label: 'Mayotte (DOM)',                   tarif: 27.00, exoElec: true },
]

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Malus CO₂ 2026 (France) — barème indicatif
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const MALUS_SEUILS: Array<[number, number]> = [
  [117, 0], [118, 50], [119, 75], [120, 100], [122, 125], [124, 150],
  [126, 175], [128, 200], [130, 250], [135, 300], [140, 400], [145, 500],
  [150, 1000], [155, 2000], [160, 3000], [165, 4000], [170, 5000],
  [175, 6000], [180, 8000], [185, 10000], [195, 16000], [200, 20000],
  [Infinity, 30000],
]

function getMalus(co2: number): number {
  for (const [seuil, montant] of MALUS_SEUILS) {
    if (co2 <= seuil) return montant
  }
  return 30000
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Taxes fixes
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// Taxe de gestion : 11 € (1ère immatriculation) ou 32 € (cession)
// Redevance acheminement : 2.76 €
const TAXE_GEST_NEUF   = 11.00
const TAXE_GEST_CESSION = 32.00
const TAXE_ACHEMINEMENT = 2.76

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// UI helpers
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function fmt(v: number) {
  return v.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
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
  padding: '10px 14px', background: 'var(--color-bg)',
  border: '1px solid var(--color-border)', borderRadius: 8,
  color: 'var(--color-text)', fontSize: '1rem', fontFamily: 'inherit',
  width: '100%', boxSizing: 'border-box',
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Composant principal
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export default function ImmatriculationFrancePage() {
  const [kw,      setKw]      = useState('')
  const [co2,     setCo2]     = useState('')
  const [region,  setRegion]  = useState('ile-de-france')
  const [typeOp,  setTypeOp]  = useState<'neuf' | 'cession'>('neuf')
  const [moto,    setMoto]    = useState('essence')

  const isElec = moto === 'elec' || moto === 'h2'

  const result = useMemo(() => {
    const kwN  = parseFloat(kw)
    const co2N = isElec ? 0 : parseFloat(co2)
    if (!kwN || kwN <= 0) return null
    if (!isElec && (!co2N || co2N < 0)) return null

    const reg = REGIONS.find((r) => r.id === region)!
    const cv  = calculerCV(kwN, co2N, isElec)

    // Taxe régionale : 0 si électrique + région qui exonère
    const txRegBase = (isElec && reg.exoElec) ? 0 : reg.tarif
    const txRegionale = cv * txRegBase

    const txGestion  = typeOp === 'neuf' ? TAXE_GEST_NEUF : TAXE_GEST_CESSION
    const txAchemi   = TAXE_ACHEMINEMENT
    const malus      = isElec ? 0 : getMalus(co2N)
    const total      = txRegionale + txGestion + txAchemi + malus

    return { cv, reg, txRegBase, txRegionale, txGestion, txAchemi, malus, total }
  }, [kw, co2, region, typeOp, moto, isElec])

  return (
    <>
      <section className="page-hero">
        <div className="container" style={{ maxWidth: 860 }}>
          <nav className="breadcrumb"><a href="/outils">← Outils</a></nav>
          <h1>🇫🇷 Carte grise — France</h1>
          <p>Estimez les frais d'immatriculation : taxe régionale, taxe de gestion et malus écologique.</p>
        </div>
      </section>

      <div style={{ padding: '40px 0 80px' }}>
        <div className="container" style={{ maxWidth: 820 }}>

          {/* Formulaire */}
          <div style={{
            background: 'var(--color-bg-alt)', border: '1px solid var(--color-border)',
            borderRadius: 12, padding: '28px 28px 24px',
          }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>

              <Field label="Type d'opération">
                <select style={inputStyle} value={typeOp} onChange={(e) => setTypeOp(e.target.value as 'neuf' | 'cession')}>
                  <option value="neuf">1ère immatriculation (neuf)</option>
                  <option value="cession">Cession / changement de proprio</option>
                </select>
              </Field>

              <Field label="Motorisation">
                <select style={inputStyle} value={moto} onChange={(e) => setMoto(e.target.value)}>
                  <option value="essence">Essence</option>
                  <option value="diesel">Diesel</option>
                  <option value="gpl">GPL / E85</option>
                  <option value="hev">Hybride (HEV)</option>
                  <option value="phev">Hybride rechargeable (PHEV)</option>
                  <option value="elec">Électrique</option>
                  <option value="h2">Hydrogène</option>
                </select>
              </Field>

              <Field label="Puissance nette (kW)" hint="Case P2 de la carte grise">
                <input type="number" min="1" max="1000" step="1" placeholder="ex : 110" style={inputStyle}
                  value={kw} onChange={(e) => setKw(e.target.value)} />
              </Field>

              {!isElec && (
                <Field label="CO₂ WLTP (g/km)" hint="Case V7 de la carte grise">
                  <input type="number" min="0" max="600" step="1" placeholder="ex : 142" style={inputStyle}
                    value={co2} onChange={(e) => setCo2(e.target.value)} />
                </Field>
              )}

              <Field label="Région d'immatriculation">
                <select style={inputStyle} value={region} onChange={(e) => setRegion(e.target.value)}>
                  {REGIONS.map((r) => (
                    <option key={r.id} value={r.id}>{r.label}</option>
                  ))}
                </select>
              </Field>

            </div>

            {/* Résultat */}
            {result && (
              <div style={{
                marginTop: 24, padding: '22px 24px 18px',
                background: 'rgba(122,240,194,0.07)',
                border: '2px solid var(--color-primary)', borderRadius: 12,
              }}>
                {/* Puissance fiscale */}
                <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                  <div style={{ fontSize: '0.8rem', color: 'var(--color-text-soft)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Puissance fiscale calculée
                  </div>
                  <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--color-primary)', lineHeight: 1 }}>
                    {result.cv} CV
                  </div>
                  {result.reg.note && (
                    <span style={{ fontSize: '0.78rem', color: 'var(--color-primary)', fontWeight: 600 }}>
                      ★ {result.reg.note}
                    </span>
                  )}
                </div>

                {/* Tableau détaillé */}
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
                  <tbody>
                    <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                      <td style={{ padding: '8px 0', color: 'var(--color-text-soft)' }}>
                        Taxe régionale ({result.cv} CV × {result.txRegBase === 0 ? 'exonéré' : `${result.txRegBase.toFixed(2)} €/CV`})
                      </td>
                      <td style={{ padding: '8px 0', fontWeight: 700, textAlign: 'right' }}>
                        {fmt(result.txRegionale)} €
                        {isElec && result.txRegBase === 0 && <span style={{ fontSize: '0.72rem', color: 'var(--color-primary)', marginLeft: 6, fontWeight: 400 }}>VE exonéré</span>}
                      </td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                      <td style={{ padding: '8px 0', color: 'var(--color-text-soft)' }}>
                        Taxe de gestion ({typeOp === 'neuf' ? '1ère immat.' : 'cession'})
                      </td>
                      <td style={{ padding: '8px 0', fontWeight: 700, textAlign: 'right' }}>
                        {fmt(result.txGestion)} €
                      </td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                      <td style={{ padding: '8px 0', color: 'var(--color-text-soft)' }}>Redevance d'acheminement</td>
                      <td style={{ padding: '8px 0', fontWeight: 700, textAlign: 'right' }}>{fmt(result.txAchemi)} €</td>
                    </tr>
                    {result.malus > 0 && (
                      <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                        <td style={{ padding: '8px 0', color: '#f87171' }}>Malus écologique CO₂ (2026)</td>
                        <td style={{ padding: '8px 0', fontWeight: 700, textAlign: 'right', color: '#f87171' }}>{fmt(result.malus)} €</td>
                      </tr>
                    )}
                    <tr>
                      <td style={{ padding: '12px 0 4px', fontWeight: 800, fontSize: '1rem' }}>Total estimé</td>
                      <td style={{ padding: '12px 0 4px', fontWeight: 800, fontSize: '1.4rem', textAlign: 'right', color: 'var(--color-primary)' }}>
                        {fmt(result.total)} €
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Infos pédagogiques */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16, marginTop: 24 }}>
            {[
              {
                titre: '📋 Données nécessaires',
                texte: 'Puissance en kW (case P2), CO₂ WLTP en g/km (case V7) et région d\'immatriculation du titulaire.',
              },
              {
                titre: '🌿 Véhicules électriques',
                texte: 'Les VE sont exonérés de taxe régionale dans la quasi-totalité des régions françaises. La taxe de gestion et la redevance restent dues.',
              },
              {
                titre: '🔄 Véhicule d\'occasion',
                texte: 'Choisissez "Cession" pour un changement de propriétaire. La taxe régionale est due à 100% si < 3 mois (sinon exonération possible).',
              },
              {
                titre: '💸 Malus écologique',
                texte: 'Dû une seule fois à l\'immatriculation pour les véhicules neufs émettant plus de 118 g/km de CO₂ (barème 2026 — décroissant selon âge pour l\'occasion).',
              },
            ].map(({ titre, texte }) => (
              <div key={titre} style={{
                padding: '18px 20px', background: 'var(--color-bg-alt)',
                border: '1px solid var(--color-border)', borderRadius: 10,
              }}>
                <div style={{ fontWeight: 700, marginBottom: 8, fontSize: '0.9rem' }}>{titre}</div>
                <div style={{ fontSize: '0.82rem', color: 'var(--color-text-soft)', lineHeight: 1.6 }}>{texte}</div>
              </div>
            ))}
          </div>

          {/* Disclaimer */}
          <div style={{
            marginTop: 20, padding: '14px 18px',
            background: 'var(--color-bg-alt)', border: '1px solid var(--color-border)',
            borderRadius: 8, fontSize: '0.78rem', color: 'var(--color-text-soft)', lineHeight: 1.6,
          }}>
            <strong>Estimation indicative.</strong> Les tarifs régionaux sont indicatifs (barème 2025) et peuvent varier. Malus et taxes de gestion sont mis à jour annuellement.
            Pour un montant officiel, utilisez le simulateur de l'ANTS : <a href="https://ants.gouv.fr/les-services-numeriques/les-simulateurs/simulateur-tarifs-carte-grise" target="_blank" rel="noopener" style={{ color: 'var(--color-primary)' }}>ants.gouv.fr</a>.
            Ce calculateur ne constitue pas un conseil fiscal.
          </div>

        </div>
      </div>
    </>
  )
}
