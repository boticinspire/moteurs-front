'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  PanneData, PROTOCOLES, CONTACTS_PAR_PAYS, CONSEILS_VE_LIEU,
  Motorisation, Pays, Lieu, TypePanne,
} from '@/lib/assistance-panne'

// ── Types ─────────────────────────────────────────────────────────────────────
type Etape = 1 | 2 | 3

// ── Styles ────────────────────────────────────────────────────────────────────

const cardStyle: React.CSSProperties = {
  background: 'white',
  border: '1.5px solid var(--color-border)',
  borderRadius: 16, padding: '28px 28px 24px',
  marginBottom: 24,
}

const navBtnStyle: React.CSSProperties = {
  padding: '11px 28px', borderRadius: 10,
  border: 'none', cursor: 'pointer',
  fontWeight: 700, fontSize: '0.95rem',
  transition: 'background .15s',
}

function choiceCard(selected: boolean, color = '#ef4444'): React.CSSProperties {
  return {
    padding: '14px 16px', borderRadius: 12,
    border: selected ? `2px solid ${color}` : '1.5px solid var(--color-border)',
    background: selected ? `${color}10` : 'var(--color-bg-alt)',
    cursor: 'pointer', transition: 'all .15s',
    textAlign: 'left' as const, width: '100%',
  }
}

// ── Bandeau SOS permanent ─────────────────────────────────────────────────────

function BandeauSOS({ pays }: { pays: Pays | null }) {
  const numero = pays === 'CA' ? '911' : '112'
  return (
    <div style={{
      background: '#dc2626', color: 'white',
      borderRadius: 12, padding: '14px 20px', marginBottom: 20,
      display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap',
    }}>
      <span style={{ fontSize: '1.6rem' }}>🚨</span>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 800, fontSize: '1rem' }}>Blessé ou danger immédiat ?</div>
        <div style={{ fontSize: '0.85rem', opacity: 0.9 }}>
          Appelez immédiatement le <strong>{numero}</strong> — urgences européennes
          {pays === 'FR' && ' · 15 (SAMU) · 18 (Pompiers) · 17 (Police)'}
          {pays === 'BE' && ' · 100 (Ambulance) · 101 (Police)'}
          {pays === 'CH' && ' · 144 (Ambulance) · 117 (Police) · 118 (Pompiers)'}
        </div>
      </div>
      <a href={`tel:${numero}`} style={{
        background: 'white', color: '#dc2626',
        fontWeight: 800, fontSize: '1.1rem',
        padding: '8px 20px', borderRadius: 8,
        textDecoration: 'none', whiteSpace: 'nowrap',
      }}>
        📞 {numero}
      </a>
    </div>
  )
}

// ── Étape 1 : Véhicule + Pays ─────────────────────────────────────────────────

function Etape1({ data, setData }: { data: PanneData; setData: (d: PanneData) => void }) {
  const MOTOS: { id: Motorisation; icon: string; label: string; detail: string }[] = [
    { id: 'thermique', icon: '⛽', label: 'Thermique (essence / diesel)', detail: 'Véhicule à moteur à combustion uniquement' },
    { id: 've',        icon: '⚡', label: 'Électrique (100% VE)',          detail: 'Batterie haute tension, pas de moteur thermique' },
    { id: 'hybride',   icon: '🔄', label: 'Hybride (HEV)',                 detail: 'Hybride auto-rechargeable, sans prise' },
    { id: 'phev',      icon: '🔌', label: 'PHEV (hybride rechargeable)',   detail: 'Moteur thermique + batterie rechargeable sur prise' },
  ]

  const PAYS: { id: Pays; flag: string; label: string }[] = [
    { id: 'FR', flag: '🇫🇷', label: 'France'   },
    { id: 'BE', flag: '🇧🇪', label: 'Belgique'  },
    { id: 'CH', flag: '🇨🇭', label: 'Suisse'    },
    { id: 'CA', flag: '🇨🇦', label: 'Canada'    },
  ]

  return (
    <div style={cardStyle}>
      <h2 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: 20 }}>
        1 · Votre véhicule & pays
      </h2>

      <div style={{ marginBottom: 24 }}>
        <label style={{ display: 'block', fontWeight: 600, marginBottom: 10, fontSize: '0.9rem' }}>
          Type de motorisation
        </label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {MOTOS.map(m => (
            <button key={m.id} onClick={() => setData({ ...data, motorisation: m.id })}
              style={choiceCard(data.motorisation === m.id)}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: '1.4rem' }}>{m.icon}</span>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--color-text)' }}>{m.label}</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--color-text-soft)', marginTop: 2 }}>{m.detail}</div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div>
        <label style={{ display: 'block', fontWeight: 600, marginBottom: 10, fontSize: '0.9rem' }}>
          Vous êtes en
        </label>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {PAYS.map(p => (
            <button key={p.id} onClick={() => setData({ ...data, pays: p.id })}
              style={{
                ...choiceCard(data.pays === p.id),
                width: 'auto', padding: '10px 18px',
                display: 'flex', alignItems: 'center', gap: 8,
              }}>
              <span style={{ fontSize: '1.3rem' }}>{p.flag}</span>
              <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{p.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Étape 2 : Lieu + Type de panne ────────────────────────────────────────────

function Etape2({ data, setData }: { data: PanneData; setData: (d: PanneData) => void }) {
  const LIEUX: { id: Lieu; icon: string; label: string; detail: string }[] = [
    { id: 'autoroute', icon: '🛣️', label: 'Autoroute',           detail: 'À grande vitesse ou sur la VAU' },
    { id: 'route',     icon: '🗺️', label: 'Route nationale / départementale', detail: 'Hors agglomération' },
    { id: 'ville',     icon: '🏙️', label: 'En ville',             detail: 'Dans ou en périphérie d\'une agglomération' },
    { id: 'parking',   icon: '🅿️', label: 'Parking / domicile',   detail: 'Véhicule à l\'arrêt, en sécurité' },
  ]

  const isVE = data.motorisation === 've' || data.motorisation === 'phev'

  const TYPES_PANNE = [
    { id: 'energie'     as TypePanne, icon: isVE ? '⚡' : '⛽', label: isVE ? 'Batterie à 0 km' : 'Panne de carburant', detail: isVE ? "Autonomie épuisée, véhicule s'arrête" : 'Réservoir vide, moteur calé', showFor: undefined },
    { id: 'crevaison'   as TypePanne, icon: '🔧', label: 'Crevaison / pneu crevé',        detail: 'Pneu à plat, bruit de souffle',                   showFor: undefined },
    { id: 'mecanique'   as TypePanne, icon: '⚙️', label: 'Panne mécanique',               detail: 'Moteur, boîte, direction, électronique',           showFor: undefined },
    { id: 'accident'    as TypePanne, icon: '💥', label: 'Accident',                       detail: 'Collision, sortie de route, choc',                 showFor: undefined },
    { id: 'batterie12v' as TypePanne, icon: '🔋', label: 'Ne démarre plus (batterie 12V)', detail: 'Tableau de bord mort, clé sans réponse',           showFor: undefined },
    { id: 'surchauffe'  as TypePanne, icon: '🌡️', label: 'Surchauffe moteur',             detail: 'Voyant température rouge, fumée',                  showFor: 'non-ve'  },
    { id: 'autre'       as TypePanne, icon: '❓', label: 'Autre problème',                  detail: 'Voyant inconnu, bruit bizarre, autre',             showFor: undefined },
  ].filter(t => {
    if (t.showFor === 'non-ve' && isVE) return false
    return true
  })

  return (
    <div style={cardStyle}>
      <h2 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: 20 }}>
        2 · Où êtes-vous & que se passe-t-il ?
      </h2>

      <div style={{ marginBottom: 24 }}>
        <label style={{ display: 'block', fontWeight: 600, marginBottom: 10, fontSize: '0.9rem' }}>
          Où vous trouvez-vous ?
        </label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {LIEUX.map(l => (
            <button key={l.id} onClick={() => setData({ ...data, lieu: l.id })}
              style={choiceCard(data.lieu === l.id)}>
              <div style={{ fontSize: '1.4rem', marginBottom: 4 }}>{l.icon}</div>
              <div style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--color-text)' }}>{l.label}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-soft)', marginTop: 2 }}>{l.detail}</div>
            </button>
          ))}
        </div>
      </div>

      <div>
        <label style={{ display: 'block', fontWeight: 600, marginBottom: 10, fontSize: '0.9rem' }}>
          Quel est le problème ?
        </label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {TYPES_PANNE.map(t => (
            <button key={t.id} onClick={() => setData({ ...data, typePanne: t.id })}
              style={choiceCard(data.typePanne === t.id)}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: '1.3rem' }}>{t.icon}</span>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--color-text)' }}>{t.label}</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--color-text-soft)', marginTop: 1 }}>{t.detail}</div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Étape 3 : Bilan ───────────────────────────────────────────────────────────

function Bilan({ data }: { data: PanneData }) {
  const protocole = PROTOCOLES[data.typePanne!]
  const contacts  = CONTACTS_PAR_PAYS[data.pays!]
  const isVE      = data.motorisation === 've' || data.motorisation === 'phev'
  const conseilVELieu = isVE && data.lieu ? CONSEILS_VE_LIEU[data.lieu] : null

  const DANGER_STYLE: Record<string, { bg: string; border: string; color: string; label: string }> = {
    faible: { bg: 'rgba(5,150,105,0.07)',  border: 'rgba(5,150,105,0.25)',  color: '#059669', label: '🟢 Risque faible' },
    moyen:  { bg: 'rgba(245,158,11,0.07)', border: 'rgba(245,158,11,0.3)',  color: '#d97706', label: '🟡 Risque modéré' },
    eleve:  { bg: 'rgba(220,38,38,0.07)',  border: 'rgba(220,38,38,0.25)',  color: '#dc2626', label: '🔴 Risque élevé' },
  }
  const dangerStyle = DANGER_STYLE[protocole.danger]

  // Filtre les étapes selon motorisation
  const etapes = protocole.etapes.filter(e => {
    if (e.veOnly && !isVE) return false
    if (e.nonVe  &&  isVE) return false
    return true
  })

  return (
    <div>
      {/* ── En-tête protocole ── */}
      <div style={{
        background: dangerStyle.bg, border: `2px solid ${dangerStyle.border}`,
        borderRadius: 16, padding: '20px 24px', marginBottom: 24,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
          <span style={{ fontSize: '2rem' }}>{protocole.emoji}</span>
          <div>
            <div style={{ fontSize: '0.78rem', fontWeight: 700, color: dangerStyle.color, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {dangerStyle.label}
            </div>
            <div style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--color-text)', lineHeight: 1.3 }}>
              {protocole.titre}
            </div>
          </div>
        </div>
        <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--color-text-soft)', lineHeight: 1.6 }}>
          {protocole.resume}
        </p>
      </div>

      {/* ── Alerte VE spécifique ── */}
      {isVE && protocole.alerteVE && (
        <div style={{
          background: 'rgba(220,38,38,0.06)', border: '2px solid rgba(220,38,38,0.3)',
          borderRadius: 12, padding: '14px 18px', marginBottom: 20,
          display: 'flex', gap: 12,
        }}>
          <span style={{ fontSize: '1.4rem', flexShrink: 0 }}>⚡⚠️</span>
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#dc2626', marginBottom: 4 }}>
              Spécificité véhicule électrique / PHEV
            </div>
            <p style={{ margin: 0, fontSize: '0.83rem', color: '#7f1d1d', lineHeight: 1.6 }}>
              {protocole.alerteVE}
            </p>
          </div>
        </div>
      )}

      {/* ── Protocole pas-à-pas ── */}
      <div style={{ ...cardStyle, marginBottom: 24 }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 18 }}>
          📋 Que faire — étape par étape
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {etapes.map((e) => (
            <div key={e.ordre} style={{
              display: 'flex', gap: 14, alignItems: 'flex-start',
              padding: '12px 14px', borderRadius: 10,
              background: e.urgent ? 'rgba(220,38,38,0.05)' : 'var(--color-bg-alt)',
              border: e.urgent ? '1.5px solid rgba(220,38,38,0.2)' : '1px solid var(--color-border)',
            }}>
              <div style={{
                minWidth: 28, height: 28, borderRadius: '50%',
                background: e.urgent ? '#dc2626' : 'var(--color-primary)',
                color: 'white', fontWeight: 800, fontSize: '0.85rem',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                {e.ordre}
              </div>
              <div style={{ flex: 1 }}>
                {e.urgent && (
                  <span style={{
                    fontSize: '0.68rem', fontWeight: 800, color: '#dc2626',
                    textTransform: 'uppercase', letterSpacing: '0.05em',
                    display: 'block', marginBottom: 3,
                  }}>
                    ⚡ Action immédiate
                  </span>
                )}
                <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--color-text)', lineHeight: 1.6 }}>
                  {e.texte}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Conseil pro */}
        <div style={{
          marginTop: 16, background: 'rgba(26,95,196,0.06)',
          border: '1px solid rgba(26,95,196,0.2)',
          borderRadius: 10, padding: '12px 16px',
          fontSize: '0.84rem', color: 'var(--color-text-soft)',
        }}>
          💡 <strong>Conseil de pro :</strong> {protocole.conseilPro}
        </div>
      </div>

      {/* ── Conseil VE selon lieu ── */}
      {conseilVELieu && (
        <div style={{
          background: 'rgba(14,165,233,0.06)', border: '1.5px solid rgba(14,165,233,0.25)',
          borderRadius: 12, padding: '16px 18px', marginBottom: 24,
          display: 'flex', gap: 12,
        }}>
          <span style={{ fontSize: '1.3rem', flexShrink: 0 }}>⚡🗺️</span>
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#0284c7', marginBottom: 6 }}>
              VE en panne {data.lieu === 'autoroute' ? 'sur autoroute' : data.lieu === 'ville' ? 'en ville' : data.lieu === 'parking' ? 'en parking' : 'sur route'}
            </div>
            <p style={{ margin: 0, fontSize: '0.83rem', color: 'var(--color-text-soft)', lineHeight: 1.6 }}>
              {conseilVELieu}
            </p>
          </div>
        </div>
      )}

      {/* ── Contacts urgence ── */}
      <div style={{ ...cardStyle, marginBottom: 24 }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 16 }}>
          📞 Numéros utiles — {data.pays === 'FR' ? 'France' : data.pays === 'BE' ? 'Belgique' : data.pays === 'CH' ? 'Suisse' : 'Canada'}
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {contacts.map(c => (
            <div key={c.nom} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '12px 14px', gap: 12, flexWrap: 'wrap',
              background: c.gratuit ? 'rgba(5,150,105,0.05)' : 'var(--color-bg-alt)',
              border: c.gratuit ? '1px solid rgba(5,150,105,0.2)' : '1px solid var(--color-border)',
              borderRadius: 8,
            }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--color-text)' }}>{c.nom}</div>
                <div style={{ fontSize: '0.76rem', color: 'var(--color-text-soft)', marginTop: 2 }}>{c.detail}</div>
              </div>
              <a href={`tel:${c.numero.replace(/\s/g, '')}`} style={{
                fontWeight: 800, fontSize: '1rem',
                color: c.gratuit ? '#059669' : 'var(--color-primary)',
                textDecoration: 'none', whiteSpace: 'nowrap',
                background: c.gratuit ? 'rgba(5,150,105,0.1)' : 'rgba(26,95,196,0.08)',
                padding: '6px 14px', borderRadius: 6,
              }}>
                📞 {c.numero}
              </a>
            </div>
          ))}
        </div>
      </div>

      {/* ── Après la panne ── */}
      <div style={{ background: 'var(--color-bg-alt)', borderRadius: 12, padding: '20px 22px', textAlign: 'center' }}>
        <p style={{ color: 'var(--color-text-soft)', marginBottom: 14, fontSize: '0.9rem' }}>
          Une fois en sécurité, optimisez votre prochain véhicule :
        </p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 10, flexWrap: 'wrap' }}>
          <Link href="/assistance/achat" className="btn btn-primary">🚗 Choisir mon prochain véhicule →</Link>
          <Link href="/assistance/couts" className="btn btn-secondary">💰 Calculer mon coût réel</Link>
          <Link href="/assistance" className="btn btn-secondary">🤖 Hub Assistance</Link>
        </div>
      </div>
    </div>
  )
}

// ── Composant principal ───────────────────────────────────────────────────────

export default function AssistancePanne() {
  const [etape, setEtape] = useState<Etape>(1)
  const [data, setData]   = useState<PanneData>({
    motorisation: null, pays: null, lieu: null, typePanne: null,
  })

  const etape1Ok = Boolean(data.motorisation && data.pays)
  const etape2Ok = Boolean(data.lieu && data.typePanne)
  const progress = ((etape - 1) / 2) * 100

  return (
    <div style={{ maxWidth: 720, margin: '0 auto' }}>

      {/* ── Bandeau SOS ── */}
      <BandeauSOS pays={data.pays} />

      {/* ── Progress bar ── */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
          {['1 · Votre véhicule', '2 · Situation', '3 · Protocole'].map((label, i) => (
            <div key={i} style={{
              fontSize: '0.78rem',
              fontWeight: etape === i + 1 ? 700 : 500,
              color: etape > i ? '#ef4444' : etape === i + 1 ? 'var(--color-text)' : 'var(--color-text-soft)',
            }}>
              {label}
            </div>
          ))}
        </div>
        <div style={{ height: 6, background: 'var(--color-border)', borderRadius: 3, overflow: 'hidden' }}>
          <div style={{
            height: '100%', width: `${progress}%`,
            background: 'linear-gradient(90deg, #ef4444, #f87171)',
            borderRadius: 3, transition: 'width .4s ease',
          }} />
        </div>
      </div>

      {/* ── Étapes ── */}
      {etape === 1 && <Etape1 data={data} setData={setData} />}
      {etape === 2 && <Etape2 data={data} setData={setData} />}
      {etape === 3 && etape2Ok && <Bilan data={data} />}
      {etape === 3 && !etape2Ok && (
        <div style={{ ...cardStyle, textAlign: 'center', padding: 40, color: 'var(--color-text-soft)' }}>
          Veuillez compléter les étapes précédentes.
        </div>
      )}

      {/* ── Navigation ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, marginBottom: 48 }}>
        <button
          onClick={() => setEtape(e => Math.max(1, e - 1) as Etape)}
          disabled={etape === 1}
          style={{
            ...navBtnStyle,
            background: etape === 1 ? 'var(--color-bg-alt)' : 'var(--color-border)',
            color: etape === 1 ? 'var(--color-text-soft)' : 'var(--color-text)',
            opacity: etape === 1 ? 0.5 : 1,
          }}
        >
          ← Précédent
        </button>

        {etape < 3 && (
          <button
            onClick={() => setEtape(e => Math.min(3, e + 1) as Etape)}
            disabled={etape === 1 ? !etape1Ok : !etape2Ok}
            style={{
              ...navBtnStyle,
              background: (etape === 1 ? etape1Ok : etape2Ok) ? '#ef4444' : 'var(--color-border)',
              color: (etape === 1 ? etape1Ok : etape2Ok) ? 'white' : 'var(--color-text-soft)',
              opacity: (etape === 1 ? etape1Ok : etape2Ok) ? 1 : 0.55,
            }}
          >
            {etape === 2 ? 'Voir le protocole →' : 'Suivant →'}
          </button>
        )}

        {etape === 3 && (
          <button
            onClick={() => { setEtape(1); setData({ motorisation: null, pays: null, lieu: null, typePanne: null }) }}
            style={{ ...navBtnStyle, background: '#ef4444', color: 'white' }}
          >
            ↺ Nouvelle situation
          </button>
        )}
      </div>
    </div>
  )
}
