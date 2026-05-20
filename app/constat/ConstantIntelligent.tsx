'use client'

import { useState } from 'react'
import {
  ConstantData, VehiculeInfo, Temoin,
  emptyConstat, CIRCONSTANCES, PHOTOS_CHECKLIST, POINTS_CHOC, PAYS_URGENCE,
} from '@/lib/constat'
import ConstantResume from './ConstantResume'

// ─── Étapes ───────────────────────────────────────────────────────────────────

const ETAPES = [
  { id: 0, label: 'Urgence',       emoji: '🚨' },
  { id: 1, label: 'Photos',        emoji: '📸' },
  { id: 2, label: 'Votre véhicule',emoji: '🚗' },
  { id: 3, label: 'Autre véhicule',emoji: '🚙' },
  { id: 4, label: 'Circonstances', emoji: '📋' },
  { id: 5, label: 'Croquis',       emoji: '🗺️' },
  { id: 6, label: 'Témoins',       emoji: '👥' },
  { id: 7, label: 'Résumé',        emoji: '✅' },
]

// ─── Styles ───────────────────────────────────────────────────────────────────

const card: React.CSSProperties = {
  background: 'var(--color-bg-card)',
  border: '1.5px solid var(--color-border)',
  borderRadius: 16, padding: '26px 24px', marginBottom: 20,
}

const label = (required = false): React.CSSProperties => ({
  display: 'block', fontWeight: 600, fontSize: '0.85rem',
  marginBottom: 6, color: 'var(--color-text)',
})

const input: React.CSSProperties = {
  width: '100%', padding: '10px 13px', borderRadius: 9,
  border: '1.5px solid var(--color-border)', background: 'var(--color-bg-alt)',
  color: 'var(--color-text)', fontSize: '0.9rem', boxSizing: 'border-box',
}

const textarea: React.CSSProperties = {
  ...input, minHeight: 90, resize: 'vertical', fontFamily: 'inherit',
}

const btnPrimary: React.CSSProperties = {
  padding: '12px 28px', borderRadius: 10, border: 'none', cursor: 'pointer',
  fontWeight: 700, fontSize: '0.93rem',
  background: '#ef4444', color: 'white',
}

const btnSecondary: React.CSSProperties = {
  padding: '12px 24px', borderRadius: 10,
  border: '1.5px solid var(--color-border)', cursor: 'pointer',
  fontWeight: 600, fontSize: '0.9rem',
  background: 'var(--color-bg-alt)', color: 'var(--color-text)',
}

// ─── Champ réutilisable pour les fiches véhicule ─────────────────────────────
// IMPORTANT : déclaré au niveau du module. Définir un composant à l'intérieur
// d'un parent crée un nouveau type à chaque render → React démonte l'input et
// le focus est perdu à chaque caractère.
function VehiculeField({
  label: lbl, field, placeholder, type = 'text', vehicule, patch,
}: {
  label:       string
  field:       keyof VehiculeInfo
  placeholder?: string
  type?:       string
  vehicule:    VehiculeInfo
  patch:       (p: Partial<VehiculeInfo>) => void
}) {
  return (
    <div>
      <label style={label()}>{lbl}</label>
      <input
        style={input}
        type={type}
        placeholder={placeholder}
        value={(vehicule[field] as string) ?? ''}
        onChange={e => patch({ [field]: e.target.value } as Partial<VehiculeInfo>)}
      />
    </div>
  )
}

// ─── Composant principal ──────────────────────────────────────────────────────

export default function ConstantIntelligent() {
  const [etape,   setEtape]   = useState(0)
  const [constat, setConstat] = useState<ConstantData>(emptyConstat())

  const patchConstat = (patch: Partial<ConstantData>) =>
    setConstat(prev => ({ ...prev, ...patch }))

  const patchA = (patch: Partial<VehiculeInfo>) =>
    setConstat(prev => ({ ...prev, vehicule_a: { ...prev.vehicule_a, ...patch } }))

  const patchB = (patch: Partial<VehiculeInfo>) =>
    setConstat(prev => ({ ...prev, vehicule_b: { ...prev.vehicule_b, ...patch } }))

  const next = () => setEtape(e => Math.min(ETAPES.length - 1, e + 1))
  const prev = () => setEtape(e => Math.max(0, e - 1))

  return (
    <div style={{ maxWidth: 720, margin: '0 auto' }}>

      {/* ── Barre de progression ── */}
      {etape < 7 && (
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: 'flex', gap: 4, marginBottom: 10 }}>
            {ETAPES.map((e, i) => (
              <div key={e.id} style={{
                flex: 1, height: 4, borderRadius: 2,
                background: i < etape ? '#ef4444' : i === etape ? '#f87171' : 'var(--color-border)',
                transition: 'background .3s',
              }} />
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--color-text-soft)' }}>
              Étape {etape + 1} / {ETAPES.length} — {ETAPES[etape].emoji} {ETAPES[etape].label}
            </span>
            <span style={{ fontSize: '0.72rem', color: 'var(--color-text-soft)' }}>
              {Math.round((etape / (ETAPES.length - 1)) * 100)}%
            </span>
          </div>
        </div>
      )}

      {/* ── Étape 0 : Urgence ── */}
      {etape === 0 && (
        <Etape0
          constat={constat} patch={patchConstat} onNext={next}
        />
      )}

      {/* ── Étape 1 : Photos ── */}
      {etape === 1 && (
        <Etape1
          constat={constat} patch={patchConstat} onNext={next} onPrev={prev}
        />
      )}

      {/* ── Étape 2 : Votre véhicule ── */}
      {etape === 2 && (
        <EtapeVehicule
          titre="🚗 Votre véhicule (A)"
          sousTitre="Vos informations — conducteur + assurance"
          vehicule={constat.vehicule_a}
          patch={patchA}
          onNext={next} onPrev={prev}
        />
      )}

      {/* ── Étape 3 : Véhicule adverse ── */}
      {etape === 3 && (
        <EtapeVehicule
          titre="🚙 Véhicule adverse (B)"
          sousTitre="Informations de l'autre conducteur — à relever sur place"
          vehicule={constat.vehicule_b}
          patch={patchB}
          onNext={next} onPrev={prev}
        />
      )}

      {/* ── Étape 4 : Circonstances ── */}
      {etape === 4 && (
        <Etape4
          constat={constat} patch={patchConstat} onNext={next} onPrev={prev}
        />
      )}

      {/* ── Étape 5 : Croquis ── */}
      {etape === 5 && (
        <Etape5
          constat={constat} patch={patchConstat} onNext={next} onPrev={prev}
        />
      )}

      {/* ── Étape 6 : Témoins ── */}
      {etape === 6 && (
        <Etape6
          constat={constat} patch={patchConstat} onNext={next} onPrev={prev}
        />
      )}

      {/* ── Étape 7 : Résumé ── */}
      {etape === 7 && (
        <ConstantResume
          constat={constat}
          onEdit={(e) => setEtape(e)}
          onReset={() => { setConstat(emptyConstat()); setEtape(0) }}
        />
      )}
    </div>
  )
}

// ─── Étape 0 : Urgence & sécurité ────────────────────────────────────────────

function Etape0({ constat, patch, onNext }: {
  constat: ConstantData
  patch: (p: Partial<ConstantData>) => void
  onNext: () => void
}) {
  const urgence = PAYS_URGENCE[constat.pays] ?? PAYS_URGENCE.FR

  return (
    <div>
      {/* Bandeau SOS */}
      <div style={{
        background: '#dc2626', color: 'white', borderRadius: 12,
        padding: '14px 20px', marginBottom: 20,
        display: 'flex', alignItems: 'center', gap: 14,
      }}>
        <span style={{ fontSize: '1.8rem' }}>🚨</span>
        <div>
          <div style={{ fontWeight: 800, fontSize: '1rem' }}>Blessé ou danger immédiat ?</div>
          <div style={{ fontSize: '0.85rem', opacity: 0.9 }}>
            Composez le <strong>{urgence.eu}</strong> (urgences EU) · {urgence.police} Police · {urgence.samu} SAMU
          </div>
        </div>
      </div>

      <div style={card}>
        <h2 style={{ margin: '0 0 18px', fontSize: '1.1rem' }}>🕐 Date, heure et lieu de l'accident</h2>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
          <div>
            <label style={label()}>Date</label>
            <input style={input} type="date" value={constat.date}
              onChange={e => patch({ date: e.target.value })} />
          </div>
          <div>
            <label style={label()}>Heure</label>
            <input style={input} type="time" value={constat.heure}
              onChange={e => patch({ heure: e.target.value })} />
          </div>
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={label()}>Lieu précis (rue, ville, autoroute + PR)</label>
          <input style={input} type="text" placeholder="ex: A6 au PK 124, Paris 75011 — rue de Rivoli…"
            value={constat.lieu} onChange={e => patch({ lieu: e.target.value })} />
        </div>

        <div>
          <label style={label()}>Pays</label>
          <select style={{ ...input, height: 42 }} value={constat.pays}
            onChange={e => patch({ pays: e.target.value })}>
            <option value="FR">🇫🇷 France</option>
            <option value="BE">🇧🇪 Belgique</option>
            <option value="CH">🇨🇭 Suisse</option>
            <option value="CA">🇨🇦 Canada</option>
          </select>
        </div>
      </div>

      <div style={card}>
        <h2 style={{ margin: '0 0 18px', fontSize: '1.1rem' }}>🩺 Blessés ?</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[
            { val: false, label: '✅ Aucun blessé — accident matériel uniquement' },
            { val: true,  label: '🚑 Il y a des blessés — j\'appelle les secours' },
          ].map(opt => (
            <button key={String(opt.val)}
              onClick={() => patch({ blesses: opt.val })}
              style={{
                textAlign: 'left', padding: '13px 16px', borderRadius: 10, cursor: 'pointer',
                border: constat.blesses === opt.val ? '2px solid #ef4444' : '1.5px solid var(--color-border)',
                background: constat.blesses === opt.val ? 'rgba(239,68,68,0.08)' : 'var(--color-bg-alt)',
                fontWeight: 600, fontSize: '0.9rem', color: 'var(--color-text)',
              }}>
              {opt.label}
            </button>
          ))}
        </div>

        {constat.blesses && (
          <div style={{ marginTop: 14, padding: '12px 14px', background: 'rgba(239,68,68,0.07)', borderRadius: 8, borderLeft: '3px solid #ef4444' }}>
            <div style={{ fontWeight: 700, marginBottom: 6 }}>⚠️ Ne déplacez pas les blessés</div>
            <p style={{ margin: 0, fontSize: '0.84rem', color: 'var(--color-text-soft)', lineHeight: 1.55 }}>
              Appelez le {urgence.eu} ou le {urgence.samu} immédiatement. Balisez la zone avec le triangle et le gilet jaune. Le constat se remplit après la prise en charge des secours.
            </p>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button onClick={onNext} style={btnPrimary}>
          Suivant — Checklist photos →
        </button>
      </div>
    </div>
  )
}

// ─── Étape 1 : Photos ─────────────────────────────────────────────────────────

function Etape1({ constat, patch, onNext, onPrev }: {
  constat: ConstantData
  patch: (p: Partial<ConstantData>) => void
  onNext: () => void
  onPrev: () => void
}) {
  const toggle = (id: string) => {
    const already = constat.photos_checklist.includes(id)
    patch({ photos_checklist: already
      ? constat.photos_checklist.filter(x => x !== id)
      : [...constat.photos_checklist, id] })
  }
  const urgentDone = PHOTOS_CHECKLIST.filter(p => p.urgent)
    .every(p => constat.photos_checklist.includes(p.id))

  return (
    <div>
      <div style={card}>
        <h2 style={{ margin: '0 0 6px', fontSize: '1.1rem' }}>📸 Photos à prendre maintenant</h2>
        <p style={{ margin: '0 0 18px', color: 'var(--color-text-soft)', fontSize: '0.85rem' }}>
          Cochez chaque photo au fur et à mesure. Les 5 premières sont indispensables.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {PHOTOS_CHECKLIST.map(p => {
            const done = constat.photos_checklist.includes(p.id)
            return (
              <button key={p.id} onClick={() => toggle(p.id)} style={{
                display: 'flex', alignItems: 'flex-start', gap: 12,
                padding: '12px 14px', borderRadius: 10, cursor: 'pointer', textAlign: 'left',
                border: done ? '2px solid #22c55e' : p.urgent ? '1.5px solid rgba(239,68,68,0.35)' : '1.5px solid var(--color-border)',
                background: done ? 'rgba(34,197,94,0.07)' : p.urgent ? 'rgba(239,68,68,0.04)' : 'var(--color-bg-alt)',
              }}>
                <span style={{ fontSize: '1.3rem', flexShrink: 0, marginTop: 1 }}>
                  {done ? '✅' : p.emoji}
                </span>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                    {p.label}
                    {p.urgent && !done && (
                      <span style={{ fontSize: '0.65rem', fontWeight: 800, padding: '1px 7px', borderRadius: 10, background: 'rgba(239,68,68,0.12)', color: '#ef4444' }}>INDISPENSABLE</span>
                    )}
                  </div>
                  <div style={{ fontSize: '0.77rem', color: 'var(--color-text-soft)', marginTop: 2 }}>{p.desc}</div>
                </div>
              </button>
            )
          })}
        </div>

        {!urgentDone && (
          <div style={{ marginTop: 14, padding: '10px 14px', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 8, fontSize: '0.82rem', color: '#d97706' }}>
            ⚡ Les 5 photos indispensables ne sont pas encore cochées — prenez-les avant de continuer.
          </div>
        )}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <button onClick={onPrev} style={btnSecondary}>← Retour</button>
        <button onClick={onNext} style={btnPrimary}>Suivant — Votre véhicule →</button>
      </div>
    </div>
  )
}

// ─── Étape 2/3 : Véhicule ─────────────────────────────────────────────────────

function EtapeVehicule({ titre, sousTitre, vehicule, patch, onNext, onPrev }: {
  titre:     string
  sousTitre: string
  vehicule:  VehiculeInfo
  patch:     (p: Partial<VehiculeInfo>) => void
  onNext:    () => void
  onPrev:    () => void
}) {
  return (
    <div>
      <div style={card}>
        <h2 style={{ margin: '0 0 4px', fontSize: '1.1rem' }}>{titre}</h2>
        <p style={{ margin: '0 0 20px', color: 'var(--color-text-soft)', fontSize: '0.84rem' }}>{sousTitre}</p>

        <div style={{ borderBottom: '1px solid var(--color-border)', paddingBottom: 16, marginBottom: 16 }}>
          <div style={{ fontWeight: 700, fontSize: '0.82rem', color: '#ef4444', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            🚗 Véhicule
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <VehiculeField label="Immatriculation" field="immatriculation" placeholder="AB-123-CD" vehicule={vehicule} patch={patch} />
            <VehiculeField label="Marque / Modèle" field="marque_modele" placeholder="Renault Clio 5" vehicule={vehicule} patch={patch} />
          </div>
        </div>

        <div style={{ borderBottom: '1px solid var(--color-border)', paddingBottom: 16, marginBottom: 16 }}>
          <div style={{ fontWeight: 700, fontSize: '0.82rem', color: '#ef4444', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            👤 Conducteur
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <VehiculeField label="Nom" field="nom_conducteur" placeholder="Dupont" vehicule={vehicule} patch={patch} />
            <VehiculeField label="Prénom" field="prenom_conducteur" placeholder="Jean" vehicule={vehicule} patch={patch} />
          </div>
          <div style={{ marginTop: 12 }}>
            <VehiculeField label="Adresse" field="adresse_conducteur" placeholder="12 rue de la Paix, 75001 Paris" vehicule={vehicule} patch={patch} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 12 }}>
            <VehiculeField label="Téléphone" field="telephone" placeholder="+33 6 12 34 56 78" type="tel" vehicule={vehicule} patch={patch} />
            <VehiculeField label="Email" field="email" placeholder="jean.dupont@email.com" type="email" vehicule={vehicule} patch={patch} />
          </div>
        </div>

        <div style={{ borderBottom: '1px solid var(--color-border)', paddingBottom: 16, marginBottom: 16 }}>
          <div style={{ fontWeight: 700, fontSize: '0.82rem', color: '#ef4444', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            🛡️ Assurance
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <VehiculeField label="Nom de l'assureur" field="assurance_nom" placeholder="AXA, MAAF, Allianz…" vehicule={vehicule} patch={patch} />
            <VehiculeField label="N° de police" field="assurance_numero_police" placeholder="123456789" vehicule={vehicule} patch={patch} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 12 }}>
            <VehiculeField label="Agence / Contrat" field="assurance_agence" placeholder="Agence Paris Centre" vehicule={vehicule} patch={patch} />
            <VehiculeField label="Tél. assurance" field="assurance_telephone" placeholder="+33 1 …" type="tel" vehicule={vehicule} patch={patch} />
          </div>
        </div>

        <div>
          <div style={{ fontWeight: 700, fontSize: '0.82rem', color: '#ef4444', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            💥 Dommages visibles
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={label()}>Description des dommages</label>
            <textarea style={textarea} placeholder="Pare-choc avant enfoncé, phare droit brisé, aile gauche rayée…"
              value={vehicule.dommages_description}
              onChange={e => patch({ dommages_description: e.target.value })} />
          </div>
          <div>
            <label style={label()}>Localisation sur le véhicule (cochez les zones)</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {POINTS_CHOC.map(pt => {
                const sel = vehicule.dommages_localisation.includes(pt)
                return (
                  <button key={pt} onClick={() => {
                    const next = sel
                      ? vehicule.dommages_localisation.filter(x => x !== pt)
                      : [...vehicule.dommages_localisation, pt]
                    patch({ dommages_localisation: next })
                  }} style={{
                    padding: '6px 14px', borderRadius: 20, cursor: 'pointer',
                    fontSize: '0.8rem', fontWeight: sel ? 700 : 500,
                    border: sel ? '2px solid #ef4444' : '1.5px solid var(--color-border)',
                    background: sel ? 'rgba(239,68,68,0.1)' : 'var(--color-bg-alt)',
                    color: sel ? '#ef4444' : 'var(--color-text)',
                  }}>
                    {pt}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <button onClick={onPrev} style={btnSecondary}>← Retour</button>
        <button onClick={onNext} style={btnPrimary}>Suivant →</button>
      </div>
    </div>
  )
}

// ─── Étape 4 : Circonstances ──────────────────────────────────────────────────

function Etape4({ constat, patch, onNext, onPrev }: {
  constat: ConstantData
  patch:   (p: Partial<ConstantData>) => void
  onNext:  () => void
  onPrev:  () => void
}) {
  const toggleCirc = (side: 'a' | 'b', id: number) => {
    const key = side === 'a' ? 'circonstances_a' : 'circonstances_b'
    const current = constat[key]
    const next = current.includes(id) ? current.filter(x => x !== id) : [...current, id]
    patch({ [key]: next })
  }

  return (
    <div>
      <div style={card}>
        <h2 style={{ margin: '0 0 6px', fontSize: '1.1rem' }}>📋 Circonstances de l'accident</h2>
        <p style={{ margin: '0 0 18px', color: 'var(--color-text-soft)', fontSize: '0.85rem' }}>
          Cochez les cases qui correspondent à chaque véhicule au moment du choc. Plusieurs cases peuvent être cochées.
        </p>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
            <thead>
              <tr>
                <th style={{ padding: '10px 8px', textAlign: 'left', borderBottom: '2px solid var(--color-border)', fontWeight: 700, fontSize: '0.78rem', color: 'var(--color-text-soft)' }}>
                  Circonstance
                </th>
                <th style={{ padding: '10px 8px', textAlign: 'center', borderBottom: '2px solid var(--color-border)', fontWeight: 700, fontSize: '0.78rem', color: '#3b82f6', minWidth: 64 }}>
                  🚗 Véh. A<br/>(vous)
                </th>
                <th style={{ padding: '10px 8px', textAlign: 'center', borderBottom: '2px solid var(--color-border)', fontWeight: 700, fontSize: '0.78rem', color: '#ef4444', minWidth: 64 }}>
                  🚙 Véh. B<br/>(adverse)
                </th>
              </tr>
            </thead>
            <tbody>
              {CIRCONSTANCES.map((c, i) => (
                <tr key={c.id} style={{ background: i % 2 === 0 ? 'transparent' : 'var(--color-bg-alt)' }}>
                  <td style={{ padding: '10px 8px', borderBottom: '1px solid var(--color-border)' }}>
                    <span style={{ marginRight: 8 }}>{c.emoji}</span>
                    {c.label}
                  </td>
                  <td style={{ padding: '10px 8px', textAlign: 'center', borderBottom: '1px solid var(--color-border)' }}>
                    <button onClick={() => toggleCirc('a', c.id)} style={{
                      width: 28, height: 28, borderRadius: 6, cursor: 'pointer', border: 'none',
                      background: constat.circonstances_a.includes(c.id) ? '#3b82f6' : 'var(--color-border)',
                      color: constat.circonstances_a.includes(c.id) ? 'white' : 'transparent',
                      fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      margin: '0 auto',
                    }}>
                      {constat.circonstances_a.includes(c.id) ? '✓' : ''}
                    </button>
                  </td>
                  <td style={{ padding: '10px 8px', textAlign: 'center', borderBottom: '1px solid var(--color-border)' }}>
                    <button onClick={() => toggleCirc('b', c.id)} style={{
                      width: 28, height: 28, borderRadius: 6, cursor: 'pointer', border: 'none',
                      background: constat.circonstances_b.includes(c.id) ? '#ef4444' : 'var(--color-border)',
                      color: constat.circonstances_b.includes(c.id) ? 'white' : 'transparent',
                      fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      margin: '0 auto',
                    }}>
                      {constat.circonstances_b.includes(c.id) ? '✓' : ''}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td style={{ padding: '10px 8px', fontWeight: 700, fontSize: '0.82rem' }}>Total cases cochées</td>
                <td style={{ padding: '10px 8px', textAlign: 'center', fontWeight: 700, color: '#3b82f6' }}>
                  {constat.circonstances_a.length}
                </td>
                <td style={{ padding: '10px 8px', textAlign: 'center', fontWeight: 700, color: '#ef4444' }}>
                  {constat.circonstances_b.length}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <button onClick={onPrev} style={btnSecondary}>← Retour</button>
        <button onClick={onNext} style={btnPrimary}>Suivant — Croquis →</button>
      </div>
    </div>
  )
}

// ─── Étape 5 : Croquis ────────────────────────────────────────────────────────

function Etape5({ constat, patch, onNext, onPrev }: {
  constat: ConstantData
  patch:   (p: Partial<ConstantData>) => void
  onNext:  () => void
  onPrev:  () => void
}) {
  return (
    <div>
      <div style={card}>
        <h2 style={{ margin: '0 0 6px', fontSize: '1.1rem' }}>🗺️ Croquis de l'accident</h2>
        <p style={{ margin: '0 0 18px', color: 'var(--color-text-soft)', fontSize: '0.85rem' }}>
          Décrivez la scène en quelques phrases. Le résumé final sera enrichi par IA pour produire un croquis textuel clair.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
          <div>
            <label style={label()}>Sens de circulation — Véhicule A (vous)</label>
            <input style={input} type="text" placeholder="ex: Du nord vers le sud, rue Victor Hugo"
              value={constat.sens_a} onChange={e => patch({ sens_a: e.target.value })} />
          </div>
          <div>
            <label style={label()}>Sens de circulation — Véhicule B (adverse)</label>
            <input style={input} type="text" placeholder="ex: De l'est, sortait du parking Leclerc"
              value={constat.sens_b} onChange={e => patch({ sens_b: e.target.value })} />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
          <div>
            <label style={label()}>Point de choc — Véhicule A</label>
            <select style={{ ...input, height: 42 }} value={constat.point_choc_a}
              onChange={e => patch({ point_choc_a: e.target.value })}>
              <option value="">-- Sélectionner --</option>
              {POINTS_CHOC.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div>
            <label style={label()}>Point de choc — Véhicule B</label>
            <select style={{ ...input, height: 42 }} value={constat.point_choc_b}
              onChange={e => patch({ point_choc_b: e.target.value })}>
              <option value="">-- Sélectionner --</option>
              {POINTS_CHOC.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label style={label()}>Description libre de la scène</label>
          <textarea style={{ ...textarea, minHeight: 120 }}
            placeholder={`Décrivez ce qui s'est passé :
• La configuration de la route (carrefour, ligne droite, parking…)
• La position des véhicules avant le choc
• Comment le choc s'est produit
• La signalisation présente (stop, feu, cédez le passage…)`}
            value={constat.croquis_description}
            onChange={e => patch({ croquis_description: e.target.value })} />
        </div>

        <div style={{ marginTop: 14, padding: '10px 14px', background: 'var(--color-bg-alt)', borderRadius: 8 }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-soft)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>💡 Conseil</div>
          <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--color-text-soft)', lineHeight: 1.55 }}>
            Faites un croquis papier sur le constat physique. Notez les noms des rues, la présence de feux ou stops, et la position précise des véhicules au moment du choc. Prenez une photo du croquis.
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <button onClick={onPrev} style={btnSecondary}>← Retour</button>
        <button onClick={onNext} style={btnPrimary}>Suivant — Témoins →</button>
      </div>
    </div>
  )
}

// ─── Étape 6 : Témoins & observations ────────────────────────────────────────

function Etape6({ constat, patch, onNext, onPrev }: {
  constat: ConstantData
  patch:   (p: Partial<ConstantData>) => void
  onNext:  () => void
  onPrev:  () => void
}) {
  const addTemoin = () =>
    patch({ temoins: [...constat.temoins, { nom: '', adresse: '', telephone: '' }] })

  const patchTemoin = (i: number, p: Partial<Temoin>) =>
    patch({ temoins: constat.temoins.map((t, idx) => idx === i ? { ...t, ...p } : t) })

  const removeTemoin = (i: number) =>
    patch({ temoins: constat.temoins.filter((_, idx) => idx !== i) })

  return (
    <div>
      <div style={card}>
        <h2 style={{ margin: '0 0 6px', fontSize: '1.1rem' }}>👥 Témoins</h2>
        <p style={{ margin: '0 0 18px', color: 'var(--color-text-soft)', fontSize: '0.85rem' }}>
          Si des témoins ont assisté à l'accident, relevez leurs coordonnées.
        </p>

        {constat.temoins.length === 0 && (
          <div style={{ padding: '16px', textAlign: 'center', color: 'var(--color-text-soft)', fontSize: '0.85rem', background: 'var(--color-bg-alt)', borderRadius: 10, marginBottom: 14 }}>
            Aucun témoin ajouté
          </div>
        )}

        {constat.temoins.map((t, i) => (
          <div key={i} style={{ padding: '14px', background: 'var(--color-bg-alt)', borderRadius: 10, marginBottom: 10, border: '1px solid var(--color-border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
              <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>Témoin {i + 1}</span>
              <button onClick={() => removeTemoin(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', fontSize: '0.8rem', fontWeight: 700 }}>
                Supprimer
              </button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div>
                <label style={label()}>Nom complet</label>
                <input style={input} type="text" value={t.nom}
                  onChange={e => patchTemoin(i, { nom: e.target.value })} />
              </div>
              <div>
                <label style={label()}>Téléphone</label>
                <input style={input} type="tel" value={t.telephone}
                  onChange={e => patchTemoin(i, { telephone: e.target.value })} />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={label()}>Adresse</label>
                <input style={input} type="text" value={t.adresse}
                  onChange={e => patchTemoin(i, { adresse: e.target.value })} />
              </div>
            </div>
          </div>
        ))}

        <button onClick={addTemoin} style={{ ...btnSecondary, width: '100%', textAlign: 'center' as const }}>
          + Ajouter un témoin
        </button>
      </div>

      <div style={card}>
        <h2 style={{ margin: '0 0 10px', fontSize: '1.1rem' }}>📝 Observations</h2>
        <textarea style={{ ...textarea, minHeight: 100 }}
          placeholder="Toute information complémentaire utile pour l'assureur…"
          value={constat.observations}
          onChange={e => patch({ observations: e.target.value })} />
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <button onClick={onPrev} style={btnSecondary}>← Retour</button>
        <button onClick={onNext} style={{ ...btnPrimary, background: '#22c55e' }}>
          ✅ Voir le résumé →
        </button>
      </div>
    </div>
  )
}
