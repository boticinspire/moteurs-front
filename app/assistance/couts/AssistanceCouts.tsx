'use client'

import { useState, useMemo } from 'react'
import {
  calculerCouts, fmtEurCout, fmtMois,
  CATEGORIE_LABELS, MOTEUR_LABELS, PAYS_LABELS,
  CONSO_MIXTE, PRIX_ENERGIE_COUTS, ENTRETIEN_ESTIMATION, ASSURANCE_ESTIMATION,
  type CoutData, type PostesCout,
  type CategorieCout, type MotorisationCout, type TypeFinancement, type TypeUsage, type Pays,
} from '@/lib/assistance-couts'

// ─── Defaults ─────────────────────────────────────────────────────────────────

const DEFAULT: CoutData = {
  categorie:       'berline',
  motorisation:    'diesel',
  kmAn:            15000,
  anneeVehicule:   2022,
  typeFinancement: 'credit',
  mensualite:      350,
  assurance:       null,
  entretien:       null,
  pays:            'FR',
  usage:           'domicile_travail',
  kmDomTravail:    30,
  joursParAn:      220,
}

// ─── Composants utilitaires ───────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: '0.78rem', color: 'var(--color-text-soft)', fontWeight: 700,
      textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>
      {children}
    </div>
  )
}

function ChoixCard({ actif, onClick, children }: { actif: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} style={{
      textAlign: 'left', padding: '11px 14px', borderRadius: 10, cursor: 'pointer',
      background: actif ? 'rgba(26,95,196,0.07)' : 'white',
      border: actif ? '2px solid var(--color-primary)' : '1.5px solid var(--color-border)',
      color: 'var(--color-text)', transition: 'all .15s', width: '100%',
    }}>
      {children}
    </button>
  )
}

function InputField({
  label, value, onChange, type = 'number', placeholder = '', suffix = '',
  hint = '',
}: {
  label: string; value: string | number; onChange: (v: string) => void;
  type?: string; placeholder?: string; suffix?: string; hint?: string;
}) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--color-text-soft)', fontWeight: 600, marginBottom: 6 }}>
        {label}
      </label>
      <div style={{ position: 'relative' }}>
        <input
          type={type} value={value} onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          style={{
            width: '100%', boxSizing: 'border-box', padding: suffix ? '10px 40px 10px 12px' : '10px 12px',
            borderRadius: 8, fontSize: '0.9rem', background: 'var(--color-bg-alt)',
            color: 'var(--color-text)', border: '1.5px solid var(--color-border)', outline: 'none',
          }}
        />
        {suffix && (
          <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
            fontSize: '0.82rem', color: 'var(--color-text-soft)', pointerEvents: 'none' }}>
            {suffix}
          </span>
        )}
      </div>
      {hint && <div style={{ fontSize: '0.74rem', color: 'var(--color-text-soft)', marginTop: 4 }}>{hint}</div>}
    </div>
  )
}

function EtapeCard({ titre, sousTitre, children }: { titre: string; sousTitre: string; children: React.ReactNode }) {
  return (
    <div style={{ background: 'white', border: '1.5px solid var(--color-border)', borderRadius: 16, padding: '28px 28px 24px' }}>
      <h2 style={{ margin: '0 0 4px', fontSize: '1.15rem', color: 'var(--color-text)' }}>{titre}</h2>
      <p style={{ margin: '0 0 24px', color: 'var(--color-text-soft)', fontSize: '0.88rem' }}>{sousTitre}</p>
      {children}
    </div>
  )
}

const navBtnStyle = (primaire: boolean, enabled = true): React.CSSProperties => ({
  padding: '12px 28px', borderRadius: 10, cursor: enabled ? 'pointer' : 'not-allowed',
  fontWeight: 700, fontSize: '0.95rem', transition: 'all .15s',
  background: primaire ? (enabled ? 'var(--color-primary)' : 'var(--color-border)') : 'white',
  color: primaire ? (enabled ? 'white' : 'var(--color-text-soft)') : 'var(--color-text)',
  border: primaire ? 'none' : '1.5px solid var(--color-border)',
})

// ─── Barre décomposition ──────────────────────────────────────────────────────

function BarreCompo({ postes }: { postes: PostesCout }) {
  const COULEURS: Record<keyof Omit<PostesCout, 'total'>, string> = {
    financement: '#1a5fc4', carburant: '#f59e0b', assurance: '#8b5cf6',
    entretien: '#059669', depreciation: '#6b7280',
  }
  const LABELS: Record<keyof Omit<PostesCout, 'total'>, string> = {
    financement: 'Financement', carburant: 'Carburant/Énergie',
    assurance: 'Assurance', entretien: 'Entretien', depreciation: 'Dépréciation',
  }
  const keys = Object.keys(COULEURS) as (keyof Omit<PostesCout, 'total'>)[]

  return (
    <div>
      {/* Barre empilée */}
      <div style={{ display: 'flex', borderRadius: 8, overflow: 'hidden', height: 20, marginBottom: 14 }}>
        {keys.map(k => (
          <div key={k} style={{
            width: `${(postes[k] / postes.total) * 100}%`,
            background: COULEURS[k], transition: 'width .5s',
          }} title={`${LABELS[k]} : ${fmtEurCout(postes[k])}`} />
        ))}
      </div>
      {/* Légende */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 16px' }}>
        {keys.map(k => (
          <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 10, height: 10, borderRadius: 2, background: COULEURS[k], flexShrink: 0 }} />
            <span style={{ fontSize: '0.78rem', color: 'var(--color-text-soft)' }}>
              {LABELS[k]} <strong style={{ color: 'var(--color-text)' }}>{fmtEurCout(postes[k])}</strong>
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Bilan ────────────────────────────────────────────────────────────────────

function Bilan({ data }: { data: CoutData }) {
  const resultat = useMemo(() => calculerCouts(data), [data])
  const { postes, coutKm, coutTrajetDT, coutAnnuel, economieMensuelleVE, moisRetourInvestVE, aides } = resultat

  const assuranceAffichee = data.assurance ?? ASSURANCE_ESTIMATION[data.categorie][data.motorisation]
  const entretienAffiche  = data.entretien ?? ENTRETIEN_ESTIMATION[data.motorisation]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* ── 1. Coût mensuel total ── */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(26,95,196,0.07), rgba(26,95,196,0.03))',
        border: '2px solid rgba(26,95,196,0.2)', borderRadius: 16, padding: '24px 28px',
      }}>
        <div style={{ fontSize: '0.78rem', color: 'var(--color-primary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
          Bilan de votre véhicule
        </div>
        <h2 style={{ margin: '0 0 4px', fontSize: '1.3rem', color: 'var(--color-text)' }}>
          {CATEGORIE_LABELS[data.categorie]} · {MOTEUR_LABELS[data.motorisation]}
        </h2>
        <div style={{ color: 'var(--color-text-soft)', fontSize: '0.85rem', marginBottom: 24 }}>
          {data.kmAn.toLocaleString('fr-FR')} km/an · {PAYS_LABELS[data.pays]}
        </div>

        {/* Chiffres clés */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 10, marginBottom: 24 }}>
          {[
            { label: 'Coût mensuel réel', value: fmtEurCout(postes.total), color: '#1a5fc4', sub: 'toutes charges incluses' },
            { label: 'Coût annuel', value: fmtEurCout(coutAnnuel), color: '#ef4444', sub: 'charges × 12' },
            { label: 'Coût au km', value: `${coutKm.toFixed(2).replace('.', ',')} €/km`, color: '#f59e0b', sub: `${data.kmAn.toLocaleString('fr-FR')} km/an` },
            ...(data.usage === 'domicile_travail' && coutTrajetDT > 0 ? [{
              label: 'Coût/jour DT', value: `${coutTrajetDT.toFixed(0)} €/jour`, color: '#8b5cf6', sub: `${data.kmDomTravail} km A/R`,
            }] : []),
          ].map(item => (
            <div key={item.label} style={{ background: 'rgba(255,255,255,0.7)', borderRadius: 10, padding: '14px 16px' }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--color-text-soft)', marginBottom: 4 }}>{item.label}</div>
              <div style={{ fontSize: '1.35rem', fontWeight: 800, color: item.color, lineHeight: 1.1 }}>{item.value}</div>
              <div style={{ fontSize: '0.68rem', color: 'var(--color-text-soft)', marginTop: 4 }}>{item.sub}</div>
            </div>
          ))}
        </div>

        {/* Barre décomposition */}
        <BarreCompo postes={postes} />
      </div>

      {/* ── 2. Détail des charges ── */}
      <div style={{ background: 'white', border: '1.5px solid var(--color-border)', borderRadius: 12, padding: '18px 20px' }}>
        <div style={{ fontWeight: 700, marginBottom: 14, fontSize: '0.98rem' }}>📊 Détail des charges mensuelles</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {[
            { label: 'Financement (crédit / leasing)', value: postes.financement, icon: '🏦', note: data.typeFinancement === 'comptant' ? 'Véhicule acheté au comptant' : null },
            { label: 'Carburant / Énergie', value: postes.carburant, icon: data.motorisation === 'elec' ? '⚡' : '⛽', note: `${(CONSO_MIXTE[data.categorie][data.motorisation]).toFixed(1)} ${data.motorisation === 'elec' ? 'kWh' : 'L'}/100km en usage mixte` },
            { label: 'Assurance', value: Math.round(assuranceAffichee), icon: '🛡️', note: data.assurance ? 'Montant saisi' : 'Estimation médiane tous risques 2026' },
            { label: 'Entretien & réparations', value: Math.round(entretienAffiche), icon: '🔧', note: data.entretien ? 'Montant saisi' : 'Lissé sur 12 mois (révisions + aléas)' },
            { label: 'Dépréciation', value: postes.depreciation, icon: '📉', note: 'Perte de valeur estimée, non décaissée mais réelle' },
          ].map((item, i, arr) => (
            <div key={item.label} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '12px 0',
              borderBottom: i < arr.length - 1 ? '1px solid var(--color-border)' : 'none',
              gap: 12,
            }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--color-text)', marginBottom: 2 }}>
                  {item.icon} {item.label}
                </div>
                {item.note && <div style={{ fontSize: '0.74rem', color: 'var(--color-text-soft)' }}>{item.note}</div>}
              </div>
              <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--color-text)', whiteSpace: 'nowrap' }}>
                {fmtEurCout(item.value)}
              </div>
            </div>
          ))}
          {/* Total */}
          <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 14, marginTop: 4, borderTop: '2px solid var(--color-primary)' }}>
            <span style={{ fontWeight: 800, fontSize: '1rem' }}>Total mensuel</span>
            <span style={{ fontWeight: 800, fontSize: '1.2rem', color: 'var(--color-primary)' }}>{fmtEurCout(postes.total)}</span>
          </div>
        </div>
      </div>

      {/* ── 3. Comparatif VE ── */}
      {data.motorisation !== 'elec' && economieMensuelleVE !== null && (
        <div style={{
          background: economieMensuelleVE > 0 ? 'rgba(5,150,105,0.07)' : 'rgba(239,68,68,0.06)',
          border: `1.5px solid ${economieMensuelleVE > 0 ? 'rgba(5,150,105,0.25)' : 'rgba(239,68,68,0.2)'}`,
          borderRadius: 12, padding: '18px 20px',
        }}>
          <div style={{ fontWeight: 700, marginBottom: 12, color: economieMensuelleVE > 0 ? '#059669' : '#ef4444', fontSize: '0.98rem' }}>
            ⚡ Et si vous passiez à un véhicule électrique ?
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10, marginBottom: 14 }}>
            <div style={{ background: 'rgba(255,255,255,0.6)', borderRadius: 8, padding: '12px 14px' }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--color-text-soft)', marginBottom: 4 }}>Économie hors financement</div>
              <div style={{ fontSize: '1.3rem', fontWeight: 800, color: economieMensuelleVE > 0 ? '#059669' : '#ef4444' }}>
                {economieMensuelleVE > 0 ? '+' : ''}{fmtEurCout(economieMensuelleVE)}/mois
              </div>
              <div style={{ fontSize: '0.68rem', color: 'var(--color-text-soft)', marginTop: 4 }}>
                carburant + entretien + assurance + dépréciation
              </div>
            </div>
            {moisRetourInvestVE !== null && (
              <div style={{ background: 'rgba(255,255,255,0.6)', borderRadius: 8, padding: '12px 14px' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--color-text-soft)', marginBottom: 4 }}>Retour sur investissement</div>
                <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#1a5fc4' }}>
                  {moisRetourInvestVE === 0 ? 'Immédiat' : fmtMois(moisRetourInvestVE)}
                </div>
                <div style={{ fontSize: '0.68rem', color: 'var(--color-text-soft)', marginTop: 4 }}>
                  surcout achat – bonus {PAYS_LABELS[data.pays].split(' ')[1]}
                </div>
              </div>
            )}
            <div style={{ background: 'rgba(255,255,255,0.6)', borderRadius: 8, padding: '12px 14px' }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--color-text-soft)', marginBottom: 4 }}>Économie sur 5 ans</div>
              <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#f59e0b' }}>
                {fmtEurCout(economieMensuelleVE * 60)}
              </div>
              <div style={{ fontSize: '0.68rem', color: 'var(--color-text-soft)', marginTop: 4 }}>
                hors différentiel de financement
              </div>
            </div>
          </div>
          <p style={{ fontSize: '0.82rem', color: 'var(--color-text-soft)', margin: 0, lineHeight: 1.5 }}>
            {economieMensuelleVE > 0
              ? `Avec vos ${data.kmAn.toLocaleString('fr-FR')} km/an, le VE est économiquement avantageux sur l'usage. Le différentiel de mensualité dépend du modèle choisi.`
              : `Avec vos ${data.kmAn.toLocaleString('fr-FR')} km/an, les économies d'usage ne compensent pas encore la dépréciation VE plus élevée. Au-delà de ${Math.round((data.kmAn * 1.5) / 1000) * 1000} km/an, l'équation s'inverse.`
            }
          </p>
        </div>
      )}

      {/* ── 4. Aides disponibles ── */}
      {aides.length > 0 && (
        <div style={{ background: 'white', border: '1.5px solid var(--color-border)', borderRadius: 12, padding: '18px 20px' }}>
          <div style={{ fontWeight: 700, marginBottom: 14, fontSize: '0.98rem' }}>
            🎁 Aides disponibles si vous passez au VE — {PAYS_LABELS[data.pays]}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {aides.map(aide => (
              <div key={aide.nom} style={{
                padding: '12px 14px', background: 'rgba(26,95,196,0.04)',
                borderRadius: 8, borderLeft: '3px solid var(--color-primary)',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                  <div style={{ fontWeight: 700, fontSize: '0.88rem' }}>{aide.nom}</div>
                  <span style={{
                    fontWeight: 800, fontSize: '0.88rem', color: 'var(--color-primary)',
                    background: 'rgba(26,95,196,0.1)', padding: '2px 10px', borderRadius: 20, whiteSpace: 'nowrap', marginLeft: 10,
                  }}>
                    {aide.montant}
                  </span>
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-soft)', marginBottom: 6, lineHeight: 1.5 }}>
                  {aide.detail}
                </div>
                <a href={aide.href} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.78rem', color: 'var(--color-primary)', fontWeight: 600 }}>
                  Voir les conditions officielles →
                </a>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── 5. Actions ── */}
      <div style={{ background: 'white', border: '1.5px solid var(--color-border)', borderRadius: 12, padding: '18px 20px' }}>
        <div style={{ fontWeight: 700, marginBottom: 12, fontSize: '0.98rem' }}>🔗 Aller plus loin</div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <a href="/comparer" style={{ ...btnLink('#1a5fc4') }}>📊 Comparateur TCO 5 ans</a>
          <a href="/simulateur" style={{ ...btnLink('#059669') }}>🧮 Simulateur personnalisé</a>
          <a href="/assistant-vacances" style={{ ...btnLink('#0ea5e9') }}>🏖️ Budget vacances</a>
          <a href="/assistance" style={{ ...btnLink('#8b5cf6') }}>🤖 Tous les assistants</a>
        </div>
      </div>

      {/* Note */}
      <p style={{ fontSize: '0.73rem', color: 'var(--color-text-soft)', margin: 0, lineHeight: 1.5 }}>
        Calculs basés sur des moyennes 2026 : carburant {PRIX_ENERGIE_COUTS.diesel} €/L (diesel), {PRIX_ENERGIE_COUTS.essence} €/L (essence), {PRIX_ENERGIE_COUTS.elec_mix} €/kWh (élec usage mixte). Assurance et entretien = médianes nationales. Ces estimations sont indicatives — votre situation peut varier.
      </p>
    </div>
  )
}

const btnLink = (bg: string): React.CSSProperties => ({
  display: 'inline-flex', alignItems: 'center', gap: 6,
  padding: '8px 14px', borderRadius: 8, textDecoration: 'none',
  fontSize: '0.82rem', fontWeight: 600, color: 'white',
  background: bg, transition: 'opacity .15s',
})

// ─── Wizard principal ─────────────────────────────────────────────────────────

export default function AssistanceCouts() {
  const [etape, setEtape] = useState(1)
  const [data, setData]   = useState<CoutData>(DEFAULT)
  const set = (patch: Partial<CoutData>) => setData(d => ({ ...d, ...patch }))

  const ETAPES = ['Véhicule', 'Charges', 'Profil', 'Bilan']

  // Estimation live pour affichage dans l'UI
  const estimAssurance = ASSURANCE_ESTIMATION[data.categorie][data.motorisation]
  const estimEntretien = ENTRETIEN_ESTIMATION[data.motorisation]

  return (
    <div style={{ maxWidth: 720, margin: '0 auto' }}>

      {/* Barre de progression */}
      <div style={{ display: 'flex', gap: 0, marginBottom: 36 }}>
        {ETAPES.map((label, i) => {
          const num = i + 1
          const actif = num === etape
          const fait  = num < etape
          return (
            <div key={label} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, position: 'relative' }}>
              {i > 0 && <div style={{ position: 'absolute', left: 0, top: 15, width: '50%', height: 2, background: fait || actif ? 'var(--color-primary)' : 'var(--color-border)' }} />}
              {i < 3 && <div style={{ position: 'absolute', right: 0, top: 15, width: '50%', height: 2, background: fait ? 'var(--color-primary)' : 'var(--color-border)' }} />}
              <div style={{
                width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 700, fontSize: '0.85rem', zIndex: 1,
                background: fait || actif ? 'var(--color-primary)' : 'white',
                color: fait || actif ? 'white' : 'var(--color-text-soft)',
                border: actif ? '2px solid var(--color-primary)' : '2px solid var(--color-border)',
              }}>
                {fait ? '✓' : num}
              </div>
              <span style={{ fontSize: '0.73rem', color: actif ? 'var(--color-primary)' : 'var(--color-text-soft)', fontWeight: actif ? 700 : 400 }}>
                {label}
              </span>
            </div>
          )
        })}
      </div>

      {/* ── Étape 1 : Véhicule ── */}
      {etape === 1 && (
        <EtapeCard titre="🚗 Votre véhicule" sousTitre="Catégorie et motorisation pour calibrer les consommations réelles">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
            <div>
              <SectionLabel>Catégorie</SectionLabel>
              <div style={{ display: 'grid', gap: 8, gridTemplateColumns: 'repeat(auto-fill, minmax(175px, 1fr))' }}>
                {(Object.keys(CATEGORIE_LABELS) as CategorieCout[]).map(cat => (
                  <ChoixCard key={cat} actif={data.categorie === cat} onClick={() => set({ categorie: cat })}>
                    <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>{CATEGORIE_LABELS[cat]}</div>
                  </ChoixCard>
                ))}
              </div>
            </div>

            <div>
              <SectionLabel>Motorisation</SectionLabel>
              <div style={{ display: 'grid', gap: 8, gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))' }}>
                {(Object.keys(MOTEUR_LABELS) as MotorisationCout[]).map(mot => (
                  <ChoixCard key={mot} actif={data.motorisation === mot} onClick={() => set({ motorisation: mot })}>
                    <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>
                      {mot === 'elec' ? '⚡' : mot === 'phev' ? '🔋' : '⛽'} {MOTEUR_LABELS[mot]}
                    </div>
                  </ChoixCard>
                ))}
              </div>
            </div>

            <div>
              <SectionLabel>Kilométrage annuel : <strong style={{ color: 'var(--color-primary)' }}>{data.kmAn.toLocaleString('fr-FR')} km</strong></SectionLabel>
              <input type="range" min={3000} max={80000} step={1000} value={data.kmAn}
                onChange={e => set({ kmAn: parseInt(e.target.value) })}
                style={{ width: '100%', accentColor: 'var(--color-primary)' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.73rem', color: 'var(--color-text-soft)', marginTop: 4 }}>
                <span>3 000 km (peu roulé)</span><span>80 000 km (professionnel)</span>
              </div>
            </div>
          </div>
        </EtapeCard>
      )}

      {/* ── Étape 2 : Charges ── */}
      {etape === 2 && (
        <EtapeCard titre="💳 Vos charges" sousTitre="Financement, assurance et entretien — laissez vide pour les estimations">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
            <div>
              <SectionLabel>Type de financement</SectionLabel>
              <div style={{ display: 'grid', gap: 8, gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))' }}>
                {([
                  { v: 'comptant', l: '💵 Comptant', sub: '0 €/mois' },
                  { v: 'credit',   l: '🏦 Crédit auto', sub: 'Mensualité à saisir' },
                  { v: 'leasing',  l: '🔑 Leasing LLD', sub: 'Loyer mensuel' },
                  { v: 'loa',      l: '📋 LOA', sub: 'Option d\'achat incluse' },
                ] as { v: TypeFinancement; l: string; sub: string }[]).map(opt => (
                  <ChoixCard key={opt.v} actif={data.typeFinancement === opt.v} onClick={() => set({ typeFinancement: opt.v, mensualite: opt.v === 'comptant' ? 0 : data.mensualite })}>
                    <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{opt.l}</div>
                    <div style={{ fontSize: '0.73rem', color: 'var(--color-text-soft)', marginTop: 2 }}>{opt.sub}</div>
                  </ChoixCard>
                ))}
              </div>
            </div>

            {data.typeFinancement !== 'comptant' && (
              <InputField label="Mensualité" value={data.mensualite} onChange={v => set({ mensualite: parseFloat(v) || 0 })} suffix="€/mois" placeholder="350" />
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <InputField
                label="Assurance (optionnel)"
                value={data.assurance ?? ''}
                onChange={v => set({ assurance: v ? parseFloat(v) : null })}
                suffix="€/mois" placeholder={`~${estimAssurance}`}
                hint={`Estimation : ${estimAssurance} €/mois (médiane tous risques)`}
              />
              <InputField
                label="Entretien (optionnel)"
                value={data.entretien ?? ''}
                onChange={v => set({ entretien: v ? parseFloat(v) : null })}
                suffix="€/mois" placeholder={`~${estimEntretien}`}
                hint={`Estimation : ${estimEntretien} €/mois (lissé)`}
              />
            </div>

            <div style={{ background: 'rgba(26,95,196,0.06)', borderRadius: 8, padding: '10px 14px', fontSize: '0.82rem', color: 'var(--color-text-soft)', lineHeight: 1.5 }}>
              💡 Si vous laissez Assurance et Entretien vides, on utilise les médianes nationales 2026 pour votre catégorie de véhicule.
            </div>
          </div>
        </EtapeCard>
      )}

      {/* ── Étape 3 : Profil ── */}
      {etape === 3 && (
        <EtapeCard titre="👤 Votre profil" sousTitre="Usage et lieu pour personnaliser les calculs de trajet et les aides">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
            <div>
              <SectionLabel>Pays</SectionLabel>
              <div style={{ display: 'grid', gap: 8, gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))' }}>
                {(Object.keys(PAYS_LABELS) as Pays[]).map(p => (
                  <ChoixCard key={p} actif={data.pays === p} onClick={() => set({ pays: p })}>
                    <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>{PAYS_LABELS[p]}</div>
                  </ChoixCard>
                ))}
              </div>
            </div>

            <div>
              <SectionLabel>Usage principal</SectionLabel>
              <div style={{ display: 'grid', gap: 8, gridTemplateColumns: '1fr 1fr 1fr' }}>
                {([
                  { v: 'domicile_travail', l: '🏠→🏢 Domicile-Travail', sub: 'Trajet quotidien régulier' },
                  { v: 'mixte',            l: '🔀 Usage mixte',          sub: 'DT + week-ends + vacances' },
                  { v: 'loisirs',          l: '🌄 Loisirs surtout',      sub: 'Week-ends, vacances, sorties' },
                ] as { v: TypeUsage; l: string; sub: string }[]).map(opt => (
                  <ChoixCard key={opt.v} actif={data.usage === opt.v} onClick={() => set({ usage: opt.v })}>
                    <div style={{ fontWeight: 600, fontSize: '0.82rem' }}>{opt.l}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--color-text-soft)', marginTop: 2 }}>{opt.sub}</div>
                  </ChoixCard>
                ))}
              </div>
            </div>

            {data.usage !== 'loisirs' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <InputField
                  label="Trajet domicile-travail"
                  value={data.kmDomTravail}
                  onChange={v => set({ kmDomTravail: parseFloat(v) || 0 })}
                  suffix="km A/R" placeholder="30"
                  hint="Aller-retour total par jour"
                />
                <InputField
                  label="Jours travaillés par an"
                  value={data.joursParAn}
                  onChange={v => set({ joursParAn: parseInt(v) || 220 })}
                  suffix="jours" placeholder="220"
                  hint="Standard : 220 j/an"
                />
              </div>
            )}
          </div>
        </EtapeCard>
      )}

      {/* ── Étape 4 : Bilan ── */}
      {etape === 4 && <Bilan data={data} />}

      {/* Navigation */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 28 }}>
        {etape > 1
          ? <button onClick={() => setEtape(e => e - 1)} style={navBtnStyle(false)}>← Retour</button>
          : <div />
        }
        {etape < 4
          ? <button onClick={() => setEtape(e => e + 1)} style={navBtnStyle(true)}>
              {etape === 3 ? '💰 Voir mon bilan →' : 'Suivant →'}
            </button>
          : <button onClick={() => { setEtape(1); setData(DEFAULT) }} style={navBtnStyle(false)}>
              ↺ Nouveau calcul
            </button>
        }
      </div>
    </div>
  )
}
