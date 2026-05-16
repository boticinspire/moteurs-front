'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  AchatData, ResultatAchat, RecommandationMotorisation,
  recommander, labelSegment, labelMotorisationPublic,
  ModeleAuto, AideAchat,
} from '@/lib/assistance-achat'

// ── Types ─────────────────────────────────────────────────────────────────────
type Etape = 1 | 2 | 3

// ── Styles ────────────────────────────────────────────────────────────────────

const cardStyle: React.CSSProperties = {
  background: 'white',
  border: '1.5px solid var(--color-border)',
  borderRadius: 16, padding: '28px 28px 24px',
  marginBottom: 24,
}

const inputStyle: React.CSSProperties = {
  padding: '10px 14px', borderRadius: 8,
  border: '1.5px solid var(--color-border)',
  background: 'var(--color-bg-alt)',
  color: 'var(--color-text)',
  fontSize: '1rem', outline: 'none',
  width: '100%', boxSizing: 'border-box' as const,
}

const navBtnStyle: React.CSSProperties = {
  padding: '11px 28px', borderRadius: 10,
  border: 'none', cursor: 'pointer',
  fontWeight: 700, fontSize: '0.95rem',
  transition: 'background .15s',
}

function choiceCard(selected: boolean, color = 'var(--color-primary)'): React.CSSProperties {
  return {
    padding: '14px 16px', borderRadius: 12,
    border: selected ? `2px solid ${color}` : '1.5px solid var(--color-border)',
    background: selected ? `${color}10` : 'var(--color-bg-alt)',
    cursor: 'pointer', transition: 'all .15s',
    textAlign: 'left' as const, width: '100%',
  }
}

// ── Étape 1 : Budget + Pays + Type achat ─────────────────────────────────────

function Etape1({ data, setData }: { data: AchatData; setData: (d: AchatData) => void }) {
  const PAYS = [
    { id: 'FR', flag: '🇫🇷', label: 'France'  },
    { id: 'BE', flag: '🇧🇪', label: 'Belgique' },
    { id: 'CH', flag: '🇨🇭', label: 'Suisse'   },
    { id: 'CA', flag: '🇨🇦', label: 'Canada'   },
  ] as const

  const TYPE_ACHAT = [
    { id: 'neuf',        label: '🆕 Neuf',     detail: 'Garantie constructeur, aides disponibles' },
    { id: 'occasion',    label: '🔄 Occasion',  detail: 'Prix réduit, historique à vérifier' },
    { id: 'indifferent', label: '🤷 Peu importe', detail: 'Je cherche le meilleur rapport qualité/prix' },
  ] as const

  const TRANCHES_BUDGET = [15000, 20000, 25000, 30000, 35000, 40000, 50000, 60000, 80000]

  return (
    <div style={cardStyle}>
      <h2 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: 20 }}>
        1 · Votre budget & situation
      </h2>

      {/* Budget */}
      <div style={{ marginBottom: 24 }}>
        <label style={{ display: 'block', fontWeight: 600, marginBottom: 10, fontSize: '0.9rem' }}>
          Budget maximum pour le véhicule
        </label>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
          {TRANCHES_BUDGET.map(b => (
            <button key={b} onClick={() => setData({ ...data, budget: b })}
              style={{
                padding: '8px 14px', borderRadius: 8, cursor: 'pointer',
                border: data.budget === b ? '2px solid var(--color-primary)' : '1.5px solid var(--color-border)',
                background: data.budget === b ? 'rgba(26,95,196,0.1)' : 'var(--color-bg-alt)',
                fontWeight: data.budget === b ? 700 : 500,
                fontSize: '0.85rem', color: data.budget === b ? 'var(--color-primary)' : 'var(--color-text)',
              }}>
              {b.toLocaleString('fr-FR')} {data.pays === 'CH' ? 'CHF' : data.pays === 'CA' ? 'CAD' : '€'}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <label style={{ fontSize: '0.85rem', color: 'var(--color-text-soft)', whiteSpace: 'nowrap' }}>Ou saisissez :</label>
          <input
            type="number" min={5000} max={200000} step={1000}
            value={data.budget}
            onChange={e => setData({ ...data, budget: Number(e.target.value) })}
            style={{ ...inputStyle, width: 140 }}
          />
          <span style={{ fontSize: '0.88rem', color: 'var(--color-text-soft)' }}>
            {data.pays === 'CH' ? 'CHF' : data.pays === 'CA' ? 'CAD' : '€'}
          </span>
        </div>
      </div>

      {/* Pays */}
      <div style={{ marginBottom: 24 }}>
        <label style={{ display: 'block', fontWeight: 600, marginBottom: 10, fontSize: '0.9rem' }}>
          Votre pays
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

      {/* Type achat */}
      <div style={{ marginBottom: 24 }}>
        <label style={{ display: 'block', fontWeight: 600, marginBottom: 10, fontSize: '0.9rem' }}>
          Neuf ou occasion ?
        </label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {TYPE_ACHAT.map(t => (
            <button key={t.id} onClick={() => setData({ ...data, typeAchat: t.id })}
              style={choiceCard(data.typeAchat === t.id)}>
              <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--color-text)' }}>{t.label}</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--color-text-soft)', marginTop: 2 }}>{t.detail}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Accès recharge */}
      <div>
        <label style={{ display: 'block', fontWeight: 600, marginBottom: 10, fontSize: '0.9rem' }}>
          Avez-vous accès à une borne de recharge à domicile ?
        </label>
        <div style={{ display: 'flex', gap: 10 }}>
          {[{ val: true, label: '✅ Oui — maison, parking privatif' }, { val: false, label: '❌ Non — rue, copro sans borne' }].map(opt => (
            <button key={String(opt.val)} onClick={() => setData({ ...data, recharge: opt.val })}
              style={{
                ...choiceCard(data.recharge === opt.val),
                flex: 1, padding: '12px 14px',
              }}>
              <span style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--color-text)' }}>{opt.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Étape 2 : Usage + Segment + km/an ────────────────────────────────────────

function Etape2({ data, setData }: { data: AchatData; setData: (d: AchatData) => void }) {
  const USAGES = [
    { id: 'urbain',     icon: '🏙️', label: 'Urbain',          detail: 'Principalement en ville, trajets courts (< 30 km/j)' },
    { id: 'mixte',      icon: '🛣️', label: 'Mixte',           detail: 'Ville + périurbain + quelques longs trajets' },
    { id: 'routier',    icon: '🚀', label: 'Grand routier',    detail: 'Beaucoup d\'autoroute, longs trajets fréquents' },
    { id: 'utilitaire', icon: '🔧', label: 'Professionnel',    detail: 'Artisan, livraison, flotte — charge utile importante' },
  ] as const

  const SEGMENTS = [
    { id: 'citadine',   icon: '🚗', label: 'Citadine',                 detail: 'Compacte, idéale ville, stationnement facile' },
    { id: 'berline',    icon: '🚘', label: 'Berline / Compacte',       detail: 'Polyvalente, confort famille, coffre généreux' },
    { id: 'suv',        icon: '🚙', label: 'SUV / Crossover',          detail: 'Hauteur de caisse, espace, traction 4×4 possible' },
    { id: 'utilitaire', icon: '🚐', label: 'Véhicule utilitaire (VUL)', detail: 'Fourgon, van, charge utile ≥ 500 kg' },
  ] as const

  return (
    <div style={cardStyle}>
      <h2 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: 20 }}>
        2 · Votre usage & type de véhicule
      </h2>

      {/* Usage */}
      <div style={{ marginBottom: 24 }}>
        <label style={{ display: 'block', fontWeight: 600, marginBottom: 10, fontSize: '0.9rem' }}>
          Quel est votre usage principal ?
        </label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {USAGES.map(u => (
            <button key={u.id} onClick={() => setData({ ...data, usage: u.id, segment: u.id === 'utilitaire' ? 'utilitaire' : data.segment })}
              style={choiceCard(data.usage === u.id)}>
              <div style={{ fontSize: '1.5rem', marginBottom: 4 }}>{u.icon}</div>
              <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--color-text)' }}>{u.label}</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--color-text-soft)', marginTop: 2 }}>{u.detail}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Segment */}
      {data.usage !== 'utilitaire' && (
        <div style={{ marginBottom: 24 }}>
          <label style={{ display: 'block', fontWeight: 600, marginBottom: 10, fontSize: '0.9rem' }}>
            Quel type de carrosserie ?
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
            {SEGMENTS.filter(s => s.id !== 'utilitaire').map(s => (
              <button key={s.id} onClick={() => setData({ ...data, segment: s.id as typeof data.segment })}
                style={choiceCard(data.segment === s.id)}>
                <div style={{ fontSize: '1.5rem', marginBottom: 4 }}>{s.icon}</div>
                <div style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--color-text)' }}>{s.label}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-soft)', marginTop: 2, lineHeight: 1.4 }}>{s.detail}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* km/an */}
      <div>
        <label style={{ display: 'block', fontWeight: 600, marginBottom: 10, fontSize: '0.9rem' }}>
          Distance annuelle prévue (km/an)
        </label>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <input
            type="range" min={5000} max={80000} step={1000}
            value={data.kmAn}
            onChange={e => setData({ ...data, kmAn: Number(e.target.value) })}
            style={{ flex: 1, accentColor: 'var(--color-primary)' }}
          />
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <input
              type="number" min={5000} max={120000} step={500}
              value={data.kmAn}
              onChange={e => setData({ ...data, kmAn: Math.max(1000, Number(e.target.value)) })}
              style={{ ...inputStyle, width: 100 }}
            />
            <span style={{ fontSize: '0.88rem', color: 'var(--color-text-soft)' }}>km</span>
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--color-text-soft)', marginTop: 4 }}>
          <span>5 000</span>
          <span style={{ fontWeight: 700, color: 'var(--color-primary)' }}>
            {data.kmAn.toLocaleString('fr-FR')} km/an
          </span>
          <span>80 000</span>
        </div>
      </div>
    </div>
  )
}

// ── Étape 3 : Bilan ───────────────────────────────────────────────────────────

function CarteMotorisation({ r, rank }: { r: RecommandationMotorisation; rank: number }) {
  const COULEURS: Record<string, string> = {
    elec: '#059669', phev: '#0ea5e9', hybride: '#f59e0b', essence: '#6b7280', diesel: '#8b5cf6',
  }
  const couleur = COULEURS[r.motorisation] ?? 'var(--color-primary)'
  const estTop = rank === 0

  return (
    <div style={{
      background: estTop ? `${couleur}08` : 'white',
      border: estTop ? `2px solid ${couleur}50` : '1.5px solid var(--color-border)',
      borderRadius: 14, padding: '18px 20px',
      position: 'relative',
    }}>
      {estTop && (
        <span style={{
          position: 'absolute', top: -10, left: 16,
          background: couleur, color: 'white',
          borderRadius: 20, padding: '2px 12px',
          fontSize: '0.72rem', fontWeight: 800,
        }}>
          ✓ Recommandé #{rank + 1}
        </span>
      )}
      {!estTop && rank <= 2 && (
        <span style={{
          position: 'absolute', top: -10, left: 16,
          background: 'var(--color-bg-alt)', color: 'var(--color-text-soft)',
          border: '1px solid var(--color-border)',
          borderRadius: 20, padding: '2px 12px',
          fontSize: '0.72rem', fontWeight: 600,
        }}>
          Alternative #{rank + 1}
        </span>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, marginTop: estTop || rank <= 2 ? 4 : 0 }}>
        <span style={{ fontSize: '1.5rem' }}>{r.emoji}</span>
        <div>
          <div style={{ fontWeight: 700, fontSize: '0.97rem', color: 'var(--color-text)' }}>
            {labelMotorisationPublic(r.motorisation)}
          </div>
          <div style={{ fontSize: '0.78rem', color: couleur, fontWeight: 600 }}>{r.verdict}</div>
        </div>
      </div>

      <ul style={{ margin: 0, paddingLeft: 18, fontSize: '0.82rem', color: 'var(--color-text-soft)', lineHeight: 1.6 }}>
        {r.pourquoi.map((p, i) => <li key={i}>{p}</li>)}
      </ul>

      {r.vigilance && (
        <div style={{
          marginTop: 10, background: 'rgba(245,158,11,0.08)',
          border: '1px solid rgba(245,158,11,0.25)',
          borderRadius: 8, padding: '8px 12px',
          fontSize: '0.8rem', color: '#92400e',
        }}>
          ⚠️ {r.vigilance}
        </div>
      )}
    </div>
  )
}

function CarteModele({ m, devise, typeAchat }: { m: ModeleAuto; devise: string; typeAchat: string }) {
  const prixAffiche = typeAchat === 'occasion' && m.prixOcc !== null ? m.prixOcc : m.prix
  const labelPrix   = typeAchat === 'occasion' && m.prixOcc !== null ? 'Occasion' : 'Neuf'

  const COULEURS: Record<string, string> = {
    elec: '#059669', phev: '#0ea5e9', hybride: '#f59e0b', essence: '#6b7280', diesel: '#8b5cf6',
  }
  const couleur = COULEURS[m.motorisation] ?? 'var(--color-primary)'

  return (
    <div style={{
      background: 'var(--color-bg-alt)', border: '1.5px solid var(--color-border)',
      borderRadius: 12, padding: '16px 18px',
    }}>
      {/* Motorisation badge */}
      <div style={{ marginBottom: 8 }}>
        <span style={{
          fontSize: '0.72rem', fontWeight: 700, padding: '2px 8px', borderRadius: 4,
          background: `${couleur}15`, color: couleur, border: `1px solid ${couleur}30`,
        }}>
          {labelMotorisationPublic(m.motorisation)}
        </span>
      </div>

      <div style={{ fontWeight: 700, fontSize: '0.97rem', marginBottom: 6, color: 'var(--color-text)' }}>
        {m.nom}
      </div>

      <div style={{ fontSize: '1.2rem', fontWeight: 800, color: couleur, marginBottom: 6 }}>
        {prixAffiche.toLocaleString('fr-FR')} {devise}
        <span style={{ fontSize: '0.72rem', fontWeight: 500, color: 'var(--color-text-soft)', marginLeft: 6 }}>
          {labelPrix}
        </span>
      </div>

      <div style={{ fontSize: '0.78rem', color: 'var(--color-text-soft)', marginBottom: 8 }}>
        {m.autonomie ? `${m.autonomie} km WLTP · ` : ''}{m.conso}
      </div>

      <ul style={{ margin: 0, paddingLeft: 16, fontSize: '0.78rem', color: 'var(--color-text-soft)', lineHeight: 1.55 }}>
        {m.forces.map((f, i) => <li key={i}>{f}</li>)}
      </ul>

      <a href={m.href} target="_blank" rel="noopener noreferrer"
        style={{ display: 'inline-block', marginTop: 10, fontSize: '0.8rem', fontWeight: 600, color: couleur }}>
        Voir le modèle →
      </a>
    </div>
  )
}

function Bilan({ res, data }: { res: ResultatAchat; data: AchatData }) {
  const topMoto = res.recommandations[0]
  const COULEURS: Record<string, string> = {
    elec: '#059669', phev: '#0ea5e9', hybride: '#f59e0b', essence: '#6b7280', diesel: '#8b5cf6',
  }
  const couleurTop = COULEURS[topMoto.motorisation] ?? 'var(--color-primary)'
  const devise = res.devise

  return (
    <div>
      {/* ── Résumé ── */}
      <div style={{
        background: `linear-gradient(135deg, ${couleurTop} 0%, ${couleurTop}cc 100%)`,
        borderRadius: 16, padding: '24px 28px', marginBottom: 24, color: 'white',
      }}>
        <div style={{ fontSize: '0.82rem', opacity: 0.85, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Votre recommandation · {labelSegment(data.segment ?? 'berline')}
        </div>
        <div style={{ fontSize: 'clamp(1.4rem, 4vw, 2rem)', fontWeight: 800, lineHeight: 1.2, marginBottom: 8 }}>
          {topMoto.emoji} {labelMotorisationPublic(topMoto.motorisation)}
        </div>
        <div style={{ fontSize: '0.95rem', opacity: 0.95 }}>
          {topMoto.verdict}
        </div>
        <div style={{ marginTop: 12, fontSize: '0.85rem', opacity: 0.9, background: 'rgba(255,255,255,0.15)', borderRadius: 8, padding: '8px 14px', display: 'inline-block' }}>
          💡 Avec les aides disponibles en {data.pays}, votre budget effectif pourrait atteindre{' '}
          <strong>{res.budgetApresAide.toLocaleString('fr-FR')} {devise}</strong>
        </div>
      </div>

      {/* ── Recommandations motorisations ── */}
      <div style={{ ...cardStyle, marginBottom: 24 }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 16 }}>
          🏆 Classement des motorisations pour votre profil
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {res.recommandations.slice(0, 4).map((r, i) => (
            <CarteMotorisation key={r.motorisation} r={r} rank={i} />
          ))}
        </div>
      </div>

      {/* ── Modèles recommandés ── */}
      {res.modeles.length > 0 && (
        <div style={{ ...cardStyle, marginBottom: 24 }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 6 }}>
            🚗 Modèles dans votre budget ({data.budget.toLocaleString('fr-FR')} {devise})
          </h3>
          <p style={{ fontSize: '0.82rem', color: 'var(--color-text-soft)', marginBottom: 16 }}>
            Sélection pour {labelSegment(data.segment ?? 'berline')} — {data.typeAchat === 'occasion' ? 'prix occasion estimés' : 'prix neuf indicatifs'}
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
            {res.modeles.map(m => (
              <CarteModele key={m.nom} m={m} devise={devise} typeAchat={data.typeAchat ?? 'neuf'} />
            ))}
          </div>
          <p style={{ fontSize: '0.76rem', color: 'var(--color-text-soft)', marginTop: 14, marginBottom: 0 }}>
            * Prix indicatifs avant aides et négociation. Vérifiez les offres actuelles chez les concessionnaires.
          </p>
        </div>
      )}

      {/* ── Aides disponibles ── */}
      <div style={{ ...cardStyle, marginBottom: 24 }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 16 }}>
          🎁 Aides disponibles en {data.pays === 'FR' ? 'France' : data.pays === 'BE' ? 'Belgique' : data.pays === 'CH' ? 'Suisse' : 'Canada'}
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {res.aides.map(aide => (
            <div key={aide.nom} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
              gap: 14, padding: '14px 16px',
              background: 'rgba(26,95,196,0.05)', border: '1px solid rgba(26,95,196,0.15)',
              borderRadius: 10, flexWrap: 'wrap',
            }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--color-text)', marginBottom: 4 }}>
                  {aide.nom}
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--color-text-soft)', lineHeight: 1.5 }}>
                  {aide.condition}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--color-primary)', whiteSpace: 'nowrap' }}>
                  {aide.montant}
                </div>
                <a href={aide.href} target="_blank" rel="noopener noreferrer"
                  style={{ fontSize: '0.76rem', color: 'var(--color-primary)', fontWeight: 600 }}>
                  En savoir plus →
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── CTA ── */}
      <div style={{ background: 'var(--color-bg-alt)', borderRadius: 12, padding: '20px 22px', textAlign: 'center' }}>
        <p style={{ color: 'var(--color-text-soft)', marginBottom: 14, fontSize: '0.9rem' }}>
          Comparez les coûts réels sur 5 ans avec le simulateur :
        </p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 10, flexWrap: 'wrap' }}>
          <Link href="/comparer" className="btn btn-primary">📊 Comparateur TCO →</Link>
          <Link href="/simulateur" className="btn btn-secondary">🧮 Simulateur complet</Link>
          <Link href="/assistance/couts" className="btn btn-secondary">💰 Coût mensuel réel</Link>
        </div>
      </div>
    </div>
  )
}

// ── Composant principal ───────────────────────────────────────────────────────

export default function AssistanceAchat() {
  const [etape, setEtape] = useState<Etape>(1)
  const [data, setData]   = useState<AchatData>({
    budget: 30000, pays: null, typeAchat: null,
    usage: null, segment: null, kmAn: 15000, recharge: false,
  })

  const etape1Ok = Boolean(data.pays && data.typeAchat)
  const etape2Ok = Boolean(data.usage && (data.usage === 'utilitaire' ? true : data.segment))
  const resultat: ResultatAchat | null = (etape === 3 && etape2Ok && data.pays)
    ? recommander({ ...data, segment: data.usage === 'utilitaire' ? 'utilitaire' : (data.segment ?? 'berline') })
    : null

  const progress = ((etape - 1) / 2) * 100

  return (
    <div style={{ maxWidth: 720, margin: '0 auto' }}>

      {/* ── Progress bar ── */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
          {['1 · Budget & pays', '2 · Usage & carrosserie', '3 · Recommandation'].map((label, i) => (
            <div key={i} style={{
              fontSize: '0.78rem',
              fontWeight: etape === i + 1 ? 700 : 500,
              color: etape > i ? 'var(--color-primary)' : etape === i + 1 ? 'var(--color-text)' : 'var(--color-text-soft)',
            }}>
              {label}
            </div>
          ))}
        </div>
        <div style={{ height: 6, background: 'var(--color-border)', borderRadius: 3, overflow: 'hidden' }}>
          <div style={{
            height: '100%', width: `${progress}%`,
            background: 'linear-gradient(90deg, var(--color-primary), #4f89e8)',
            borderRadius: 3, transition: 'width .4s ease',
          }} />
        </div>
      </div>

      {/* ── Étapes ── */}
      {etape === 1 && <Etape1 data={data} setData={setData} />}
      {etape === 2 && <Etape2 data={data} setData={setData} />}
      {etape === 3 && resultat && <Bilan res={resultat} data={data} />}
      {etape === 3 && !resultat && (
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
              background: (etape === 1 ? etape1Ok : etape2Ok) ? 'var(--color-primary)' : 'var(--color-border)',
              color: (etape === 1 ? etape1Ok : etape2Ok) ? 'white' : 'var(--color-text-soft)',
              opacity: (etape === 1 ? etape1Ok : etape2Ok) ? 1 : 0.55,
            }}
          >
            {etape === 2 ? 'Voir mes recommandations →' : 'Suivant →'}
          </button>
        )}

        {etape === 3 && (
          <button
            onClick={() => { setEtape(1); setData({ budget: 30000, pays: null, typeAchat: null, usage: null, segment: null, kmAn: 15000, recharge: false }) }}
            style={{ ...navBtnStyle, background: 'var(--color-primary)', color: 'white' }}
          >
            ↺ Recommencer
          </button>
        )}
      </div>
    </div>
  )
}
