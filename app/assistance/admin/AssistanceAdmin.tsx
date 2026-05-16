'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  AdminData, ResultatAdmin, calculerAdmin,
  TAXE_REGIONALE_FR, ZFE_VILLES_FR, labelMoto,
  Motorisation, Pays, Segment, RegionFR,
} from '@/lib/assistance-admin'

type Etape = 1 | 2 | 3

// ── Styles ────────────────────────────────────────────────────────────────────

const cardStyle: React.CSSProperties = {
  background: 'white', border: '1.5px solid var(--color-border)',
  borderRadius: 16, padding: '28px 28px 24px', marginBottom: 24,
}

const inputStyle: React.CSSProperties = {
  padding: '10px 14px', borderRadius: 8,
  border: '1.5px solid var(--color-border)',
  background: 'var(--color-bg-alt)', color: 'var(--color-text)',
  fontSize: '1rem', outline: 'none',
  width: '100%', boxSizing: 'border-box' as const,
}

const navBtnStyle: React.CSSProperties = {
  padding: '11px 28px', borderRadius: 10, border: 'none',
  cursor: 'pointer', fontWeight: 700, fontSize: '0.95rem',
}

const COLOR = '#6366f1'

function choiceCard(selected: boolean): React.CSSProperties {
  return {
    padding: '12px 14px', borderRadius: 12,
    border: selected ? `2px solid ${COLOR}` : '1.5px solid var(--color-border)',
    background: selected ? `${COLOR}10` : 'var(--color-bg-alt)',
    cursor: 'pointer', transition: 'all .15s',
    textAlign: 'left' as const, width: '100%',
  }
}

// ── Étape 1 : Pays + Motorisation + Segment ───────────────────────────────────

function Etape1({ data, setData }: { data: AdminData; setData: (d: AdminData) => void }) {
  const PAYS: { id: Pays; flag: string; label: string }[] = [
    { id: 'FR', flag: '🇫🇷', label: 'France'   },
    { id: 'BE', flag: '🇧🇪', label: 'Belgique'  },
    { id: 'CH', flag: '🇨🇭', label: 'Suisse'    },
    { id: 'CA', flag: '🇨🇦', label: 'Canada'    },
  ]

  const MOTOS: { id: Motorisation; icon: string; label: string }[] = [
    { id: 'elec',      icon: '⚡', label: 'Électrique' },
    { id: 'phev',      icon: '🔌', label: 'PHEV (hybride rechargeable)' },
    { id: 'hybride',   icon: '🔄', label: 'Hybride HEV' },
    { id: 'essence',   icon: '⛽', label: 'Essence' },
    { id: 'diesel',    icon: '🛢️', label: 'Diesel' },
    { id: 'gnv',       icon: '💨', label: 'GNV / Hydrogène' },
  ]

  const SEGMENTS: { id: Segment; icon: string; label: string }[] = [
    { id: 'citadine',   icon: '🚗', label: 'Citadine' },
    { id: 'berline',    icon: '🚘', label: 'Berline / Compacte' },
    { id: 'suv',        icon: '🚙', label: 'SUV / Crossover' },
    { id: 'utilitaire', icon: '🚐', label: 'Utilitaire (VUL)' },
  ]

  return (
    <div style={cardStyle}>
      <h2 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: 20 }}>
        1 · Votre véhicule & pays
      </h2>

      {/* Pays */}
      <div style={{ marginBottom: 24 }}>
        <label style={{ display: 'block', fontWeight: 600, marginBottom: 10, fontSize: '0.9rem' }}>Pays</label>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {PAYS.map(p => (
            <button key={p.id} onClick={() => setData({ ...data, pays: p.id, regionFR: null })}
              style={{ ...choiceCard(data.pays === p.id), width: 'auto', padding: '10px 18px', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: '1.3rem' }}>{p.flag}</span>
              <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{p.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Motorisation */}
      <div style={{ marginBottom: 24 }}>
        <label style={{ display: 'block', fontWeight: 600, marginBottom: 10, fontSize: '0.9rem' }}>Motorisation</label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {MOTOS.map(m => (
            <button key={m.id} onClick={() => setData({ ...data, motorisation: m.id as Motorisation })}
              style={choiceCard(data.motorisation === m.id)}>
              <span style={{ fontSize: '1.2rem', marginRight: 8 }}>{m.icon}</span>
              <span style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--color-text)' }}>{m.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Segment */}
      <div style={{ marginBottom: 24 }}>
        <label style={{ display: 'block', fontWeight: 600, marginBottom: 10, fontSize: '0.9rem' }}>Type de véhicule</label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {SEGMENTS.map(s => (
            <button key={s.id} onClick={() => setData({ ...data, segment: s.id })}
              style={choiceCard(data.segment === s.id)}>
              <span style={{ fontSize: '1.2rem', marginRight: 8 }}>{s.icon}</span>
              <span style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--color-text)' }}>{s.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Type usage */}
      <div>
        <label style={{ display: 'block', fontWeight: 600, marginBottom: 10, fontSize: '0.9rem' }}>Vous achetez ce véhicule en tant que</label>
        <div style={{ display: 'flex', gap: 10 }}>
          {[{ id: 'particulier', label: '👤 Particulier' }, { id: 'professionnel', label: '🏢 Professionnel / entreprise' }].map(u => (
            <button key={u.id} onClick={() => setData({ ...data, typeUsage: u.id as 'particulier' | 'professionnel' })}
              style={{ ...choiceCard(data.typeUsage === u.id), flex: 1, padding: '12px 14px' }}>
              <span style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--color-text)' }}>{u.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Étape 2 : Détails financiers + région ─────────────────────────────────────

function Etape2({ data, setData }: { data: AdminData; setData: (d: AdminData) => void }) {
  const REGIONS = Object.entries(TAXE_REGIONALE_FR).map(([id, v]) => ({ id: id as RegionFR, label: v.label }))
  const REVENUS = [
    { id: 'modeste',       label: 'Modeste (< 22 k€/an)' },
    { id: 'intermediaire', label: 'Intermédiaire (22–50 k€/an)' },
    { id: 'aise',          label: 'Aisé (> 50 k€/an)' },
  ] as const

  return (
    <div style={cardStyle}>
      <h2 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: 20 }}>
        2 · Détails pour calculer vos aides
      </h2>

      {/* Prix achat */}
      <div style={{ marginBottom: 22 }}>
        <label style={{ display: 'block', fontWeight: 600, marginBottom: 8, fontSize: '0.9rem' }}>
          Prix d'achat du véhicule ({data.pays === 'CH' ? 'CHF' : data.pays === 'CA' ? 'CAD' : '€'})
        </label>
        <input
          type="number" min={5000} max={200000} step={500}
          value={data.prixAchat}
          onChange={e => setData({ ...data, prixAchat: Number(e.target.value) })}
          style={{ ...inputStyle, maxWidth: 200 }}
        />
      </div>

      {/* CO₂ (si pas VE) */}
      {data.motorisation !== 'elec' && data.motorisation !== 'hydrogene' && (
        <div style={{ marginBottom: 22 }}>
          <label style={{ display: 'block', fontWeight: 600, marginBottom: 8, fontSize: '0.9rem' }}>
            Émissions CO₂ WLTP (g/km) — optionnel
          </label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <input
              type="number" min={0} max={400} step={1}
              value={data.co2 ?? ''}
              placeholder="Ex : 142"
              onChange={e => setData({ ...data, co2: e.target.value ? Number(e.target.value) : null })}
              style={{ ...inputStyle, maxWidth: 130 }}
            />
            <span style={{ fontSize: '0.85rem', color: 'var(--color-text-soft)' }}>g/km CO₂</span>
          </div>
          <p style={{ fontSize: '0.78rem', color: 'var(--color-text-soft)', marginTop: 6 }}>
            Renseigné sur la fiche technique ou le certificat de conformité. Si inconnu, laissez vide.
          </p>
        </div>
      )}

      {/* Région FR */}
      {data.pays === 'FR' && (
        <div style={{ marginBottom: 22 }}>
          <label style={{ display: 'block', fontWeight: 600, marginBottom: 8, fontSize: '0.9rem' }}>
            Votre région (pour le calcul de la carte grise)
          </label>
          <select
            value={data.regionFR ?? ''}
            onChange={e => setData({ ...data, regionFR: e.target.value as RegionFR })}
            style={{ ...inputStyle, maxWidth: 360 }}
          >
            <option value="">— Sélectionnez votre région —</option>
            {REGIONS.map(r => (
              <option key={r.id} value={r.id}>{r.label}</option>
            ))}
          </select>
        </div>
      )}

      {/* Revenu fiscal (pour bonus FR) */}
      {data.pays === 'FR' && (
        <div style={{ marginBottom: 22 }}>
          <label style={{ display: 'block', fontWeight: 600, marginBottom: 8, fontSize: '0.9rem' }}>
            Tranche de revenu fiscal (pour le bonus écologique)
          </label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {REVENUS.map(r => (
              <button key={r.id} onClick={() => setData({ ...data, revenuFiscal: r.id })}
                style={choiceCard(data.revenuFiscal === r.id)}>
                <span style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--color-text)' }}>{r.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Ancien véhicule à céder */}
      <div>
        <label style={{ display: 'block', fontWeight: 600, marginBottom: 8, fontSize: '0.9rem' }}>
          Avez-vous un ancien véhicule thermique à céder / mettre à la casse ?
        </label>
        <div style={{ display: 'flex', gap: 10 }}>
          {[{ val: true, label: '✅ Oui' }, { val: false, label: '❌ Non' }].map(opt => (
            <button key={String(opt.val)} onClick={() => setData({ ...data, ancienVehicule: opt.val })}
              style={{ ...choiceCard(data.ancienVehicule === opt.val), flex: 1, padding: '12px 14px' }}>
              <span style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--color-text)' }}>{opt.label}</span>
            </button>
          ))}
        </div>
        <p style={{ fontSize: '0.78rem', color: 'var(--color-text-soft)', marginTop: 6 }}>
          Permet de cumuler la prime à la conversion avec le bonus écologique en France.
        </p>
      </div>
    </div>
  )
}

// ── Bilan ─────────────────────────────────────────────────────────────────────

function Bilan({ res, data }: { res: ResultatAdmin; data: AdminData }) {
  const devise = res.devise

  return (
    <div>
      {/* ── Résumé ── */}
      <div style={{
        background: `linear-gradient(135deg, ${COLOR} 0%, #818cf8 100%)`,
        borderRadius: 16, padding: '24px 28px', marginBottom: 24, color: 'white',
      }}>
        <div style={{ fontSize: '0.82rem', opacity: 0.85, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Votre bilan administratif · {labelMoto(res.motorisation)}
        </div>
        <div style={{ fontSize: 'clamp(1.4rem, 4vw, 2rem)', fontWeight: 800, lineHeight: 1.2, marginBottom: 8 }}>
          {res.aidesEligibles.length} aide{res.aidesEligibles.length > 1 ? 's' : ''} disponible{res.aidesEligibles.length > 1 ? 's' : ''}
        </div>
        <div style={{ fontSize: '0.95rem', opacity: 0.95 }}>
          {res.zfe.vignette} · {res.zfe.accesVillesFR}
        </div>
      </div>

      {/* ── Carte grise / Immatriculation ── */}
      <div style={{ ...cardStyle, marginBottom: 24 }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 16 }}>
          📋 Frais d'immatriculation estimés
        </h3>

        {/* FR */}
        {res.immat.FR && (
          <div>
            {res.immat.FR.exonere ? (
              <div style={{ background: 'rgba(5,150,105,0.07)', border: '1.5px solid rgba(5,150,105,0.25)', borderRadius: 10, padding: '14px 18px', marginBottom: 14 }}>
                <div style={{ fontWeight: 700, color: '#059669', marginBottom: 4 }}>✅ Exonération totale de taxe régionale</div>
                <p style={{ margin: 0, fontSize: '0.84rem', color: 'var(--color-text-soft)' }}>
                  Les véhicules électriques et à hydrogène sont exonérés de la taxe régionale en France.
                  Vous ne payez que les frais fixes (~{res.immat.FR.taxeGestion + res.immat.FR.taxeRedevance} €).
                </p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 10, marginBottom: 14 }}>
                {[
                  { label: 'Taxe régionale', val: `${res.immat.FR.taxeRegionale} €`, sub: `${res.immat.FR.cvFiscaux} CV × ${res.immat.FR.tauxRegion} €` },
                  { label: 'Frais de gestion', val: `${res.immat.FR.taxeGestion} €`, sub: 'Fixe' },
                  { label: 'Malus CO₂', val: `${res.immat.FR.malus} €`, sub: data.co2 ? `${data.co2} g/km` : 'CO₂ non renseigné' },
                  { label: 'Total estimé', val: `${res.immat.FR.totalEstime} €`, sub: 'Hors malus masse' },
                ].map(item => (
                  <div key={item.label} style={{ background: 'var(--color-bg-alt)', borderRadius: 8, padding: '12px 14px' }}>
                    <div style={{ fontSize: '0.76rem', color: 'var(--color-text-soft)', marginBottom: 4 }}>{item.label}</div>
                    <div style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--color-text)' }}>{item.val}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--color-text-soft)' }}>{item.sub}</div>
                  </div>
                ))}
              </div>
            )}
            <p style={{ fontSize: '0.78rem', color: 'var(--color-text-soft)', margin: 0 }}>
              * Estimation pour la région {res.immat.FR.regionLabel}. Le montant exact est calculé par l'ANTS lors de votre demande de certificat d'immatriculation.
            </p>
          </div>
        )}

        {/* BE */}
        {res.immat.BE && (
          <div>
            {res.immat.BE.exonere ? (
              <div style={{ background: 'rgba(5,150,105,0.07)', border: '1.5px solid rgba(5,150,105,0.25)', borderRadius: 10, padding: '14px 18px' }}>
                <div style={{ fontWeight: 700, color: '#059669', marginBottom: 4 }}>✅ Exonération TMC pour véhicule zéro émission</div>
                <p style={{ margin: 0, fontSize: '0.84rem', color: 'var(--color-text-soft)' }}>{res.immat.BE.detail}</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div style={{ background: 'var(--color-bg-alt)', borderRadius: 8, padding: '12px 14px' }}>
                  <div style={{ fontSize: '0.76rem', color: 'var(--color-text-soft)', marginBottom: 4 }}>TMC (mise en circulation)</div>
                  <div style={{ fontWeight: 800, fontSize: '1.1rem' }}>{res.immat.BE.tmc} €</div>
                </div>
                <div style={{ background: 'var(--color-bg-alt)', borderRadius: 8, padding: '12px 14px' }}>
                  <div style={{ fontSize: '0.76rem', color: 'var(--color-text-soft)', marginBottom: 4 }}>Taxe circulation (annuelle)</div>
                  <div style={{ fontWeight: 800, fontSize: '1.1rem' }}>{res.immat.BE.taxeCircul} €/an</div>
                </div>
                <p style={{ fontSize: '0.78rem', color: 'var(--color-text-soft)', margin: 0, gridColumn: '1 / -1' }}>{res.immat.BE.detail}</p>
              </div>
            )}
          </div>
        )}

        {/* CH */}
        {res.immat.CH && (
          <div>
            {res.immat.CH.exonere ? (
              <div style={{ background: 'rgba(5,150,105,0.07)', border: '1.5px solid rgba(5,150,105,0.25)', borderRadius: 10, padding: '14px 18px' }}>
                <div style={{ fontWeight: 700, color: '#059669', marginBottom: 4 }}>✅ Exonération impôt cantonal (VE)</div>
                <p style={{ margin: 0, fontSize: '0.84rem', color: 'var(--color-text-soft)' }}>{res.immat.CH.detail}</p>
              </div>
            ) : (
              <div style={{ background: 'var(--color-bg-alt)', borderRadius: 8, padding: '12px 14px', display: 'inline-block' }}>
                <div style={{ fontSize: '0.76rem', color: 'var(--color-text-soft)', marginBottom: 4 }}>Impôt cantonal estimé</div>
                <div style={{ fontWeight: 800, fontSize: '1.1rem' }}>{res.immat.CH.impotVehicule} CHF/an</div>
                <p style={{ fontSize: '0.78rem', color: 'var(--color-text-soft)', margin: '6px 0 0' }}>{res.immat.CH.detail}</p>
              </div>
            )}
          </div>
        )}

        {/* CA */}
        {res.immat.CA && (
          <div style={{ background: 'var(--color-bg-alt)', borderRadius: 8, padding: '14px 16px' }}>
            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-text-soft)', lineHeight: 1.6 }}>{res.immat.CA.detail}</p>
          </div>
        )}
      </div>

      {/* ── ZFE ── */}
      <div style={{ ...cardStyle, marginBottom: 24 }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 16 }}>
          🏙️ Zones à Faibles Émissions (ZFE)
        </h3>

        <div style={{
          background: `${res.zfe.couleur}10`, border: `2px solid ${res.zfe.couleur}40`,
          borderRadius: 12, padding: '16px 18px', marginBottom: 16,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
            <span style={{
              padding: '4px 14px', borderRadius: 20, fontWeight: 800, fontSize: '0.9rem',
              background: res.zfe.couleur, color: 'white',
            }}>
              {res.zfe.vignette}
            </span>
            <span style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--color-text)' }}>
              {res.zfe.accesVillesFR}
            </span>
          </div>
          <p style={{ margin: 0, fontSize: '0.84rem', color: 'var(--color-text-soft)', lineHeight: 1.6 }}>
            {res.zfe.conseil}
          </p>
        </div>

        {/* Tableau villes FR si pays = FR */}
        {res.pays === 'FR' && (
          <div>
            <div style={{ fontWeight: 600, fontSize: '0.85rem', marginBottom: 10, color: 'var(--color-text-soft)' }}>
              Principales ZFE françaises en 2026 :
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {ZFE_VILLES_FR.map(v => (
                <div key={v.ville} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
                  padding: '8px 12px', background: 'var(--color-bg-alt)', borderRadius: 8, gap: 12, flexWrap: 'wrap',
                }}>
                  <span style={{ fontWeight: 700, fontSize: '0.85rem', minWidth: 90 }}>{v.ville}</span>
                  <span style={{ fontSize: '0.78rem', color: 'var(--color-text-soft)', flex: 1 }}>{v.seuil}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Aides éligibles ── */}
      <div style={{ ...cardStyle, marginBottom: 24 }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 6 }}>
          🎁 Aides & bonus auxquels vous êtes éligible
        </h3>
        <p style={{ fontSize: '0.82rem', color: 'var(--color-text-soft)', marginBottom: 16 }}>
          {res.aidesEligibles.length === 0
            ? "Aucune aide spécifique détectée pour votre profil."
            : `${res.aidesEligibles.length} aide${res.aidesEligibles.length > 1 ? 's' : ''} identifiée${res.aidesEligibles.length > 1 ? 's' : ''} — vérifiez les conditions sur les sites officiels.`}
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {res.aidesEligibles.map(aide => (
            <div key={aide.id} style={{
              background: 'rgba(99,102,241,0.05)', border: '1px solid rgba(99,102,241,0.2)',
              borderRadius: 12, padding: '16px 18px',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap', marginBottom: 8 }}>
                <div style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--color-text)' }}>{aide.nom}</div>
                <div style={{ fontWeight: 800, fontSize: '1rem', color: COLOR, whiteSpace: 'nowrap' }}>{aide.montant}</div>
              </div>
              <div style={{ fontSize: '0.78rem', color: '#6366f1', fontWeight: 600, marginBottom: 6 }}>
                Condition : {aide.condition}
              </div>
              <p style={{ margin: '0 0 10px', fontSize: '0.82rem', color: 'var(--color-text-soft)', lineHeight: 1.55 }}>
                {aide.detail}
              </p>
              <a href={aide.href} target="_blank" rel="noopener noreferrer"
                style={{ fontSize: '0.8rem', fontWeight: 700, color: COLOR }}>
                Site officiel →
              </a>
            </div>
          ))}

          {res.aidesEligibles.length === 0 && (
            <div style={{ background: 'var(--color-bg-alt)', borderRadius: 10, padding: '16px', fontSize: '0.84rem', color: 'var(--color-text-soft)' }}>
              Votre profil ne correspond pas aux critères des aides principales actuelles.
              Consultez le site de votre région ou commune — des aides locales existent parfois.
            </div>
          )}
        </div>
      </div>

      {/* ── CTA ── */}
      <div style={{ background: 'var(--color-bg-alt)', borderRadius: 12, padding: '20px 22px', textAlign: 'center' }}>
        <p style={{ color: 'var(--color-text-soft)', marginBottom: 14, fontSize: '0.9rem' }}>
          Allez plus loin — calculez le coût total de votre futur véhicule :
        </p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 10, flexWrap: 'wrap' }}>
          <Link href="/comparer" className="btn btn-primary">📊 Comparateur TCO →</Link>
          <Link href="/assistance/achat" className="btn btn-secondary">🚗 Quelle motorisation ?</Link>
          <Link href="/assistance" className="btn btn-secondary">🤖 Hub Assistance</Link>
        </div>
      </div>
    </div>
  )
}

// ── Composant principal ───────────────────────────────────────────────────────

export default function AssistanceAdmin() {
  const [etape, setEtape] = useState<Etape>(1)
  const [data, setData]   = useState<AdminData>({
    pays: null, motorisation: null, segment: null, typeUsage: null,
    prixAchat: 35000, co2: null, regionFR: null,
    ancienVehicule: false, revenuFiscal: null,
  })

  const etape1Ok = Boolean(data.pays && data.motorisation && data.segment && data.typeUsage)
  const etape2Ok = true  // tout optionnel en étape 2

  const resultat: ResultatAdmin | null = etape === 3 && data.pays && data.motorisation
    ? calculerAdmin(data)
    : null

  const progress = ((etape - 1) / 2) * 100

  return (
    <div style={{ maxWidth: 720, margin: '0 auto' }}>

      {/* Progress bar */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
          {['1 · Véhicule & pays', '2 · Détails', '3 · Bilan administratif'].map((label, i) => (
            <div key={i} style={{
              fontSize: '0.78rem', fontWeight: etape === i + 1 ? 700 : 500,
              color: etape > i ? COLOR : etape === i + 1 ? 'var(--color-text)' : 'var(--color-text-soft)',
            }}>
              {label}
            </div>
          ))}
        </div>
        <div style={{ height: 6, background: 'var(--color-border)', borderRadius: 3, overflow: 'hidden' }}>
          <div style={{
            height: '100%', width: `${progress}%`,
            background: `linear-gradient(90deg, ${COLOR}, #818cf8)`,
            borderRadius: 3, transition: 'width .4s ease',
          }} />
        </div>
      </div>

      {etape === 1 && <Etape1 data={data} setData={setData} />}
      {etape === 2 && <Etape2 data={data} setData={setData} />}
      {etape === 3 && resultat && <Bilan res={resultat} data={data} />}
      {etape === 3 && !resultat && (
        <div style={{ ...cardStyle, textAlign: 'center', padding: 40, color: 'var(--color-text-soft)' }}>
          Veuillez compléter les étapes précédentes.
        </div>
      )}

      {/* Navigation */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, marginBottom: 48 }}>
        <button
          onClick={() => setEtape(e => Math.max(1, e - 1) as Etape)}
          disabled={etape === 1}
          style={{ ...navBtnStyle, background: etape === 1 ? 'var(--color-bg-alt)' : 'var(--color-border)', color: etape === 1 ? 'var(--color-text-soft)' : 'var(--color-text)', opacity: etape === 1 ? 0.5 : 1 }}
        >
          ← Précédent
        </button>

        {etape < 3 && (
          <button
            onClick={() => setEtape(e => Math.min(3, e + 1) as Etape)}
            disabled={etape === 1 && !etape1Ok}
            style={{ ...navBtnStyle, background: (etape === 1 ? etape1Ok : true) ? COLOR : 'var(--color-border)', color: (etape === 1 ? etape1Ok : true) ? 'white' : 'var(--color-text-soft)', opacity: (etape === 1 ? etape1Ok : true) ? 1 : 0.55 }}
          >
            {etape === 2 ? 'Voir mon bilan →' : 'Suivant →'}
          </button>
        )}

        {etape === 3 && (
          <button
            onClick={() => { setEtape(1); setData({ pays: null, motorisation: null, segment: null, typeUsage: null, prixAchat: 35000, co2: null, regionFR: null, ancienVehicule: false, revenuFiscal: null }) }}
            style={{ ...navBtnStyle, background: COLOR, color: 'white' }}
          >
            ↺ Recommencer
          </button>
        )}
      </div>
    </div>
  )
}
