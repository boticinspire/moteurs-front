'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  RechargeData, ResultatRecharge, ScenarioRecharge,
  calculerRecharge, SPECS_VE, RESEAUX_PUBLICS,
  fmtRecharge,
} from '@/lib/assistance-recharge'

// ── Types ─────────────────────────────────────────────────────────────────────

type Etape = 1 | 2 | 3

// ── Styles ────────────────────────────────────────────────────────────────────

const cardStyle: React.CSSProperties = {
  background: 'white',
  border: '1.5px solid var(--color-border)',
  borderRadius: 16,
  padding: '28px 28px 24px',
  marginBottom: 24,
}

const inputStyle: React.CSSProperties = {
  padding: '10px 14px',
  borderRadius: 8,
  border: '1.5px solid var(--color-border)',
  background: 'var(--color-bg-alt)',
  color: 'var(--color-text)',
  fontSize: '1rem',
  outline: 'none',
  width: '100%',
  boxSizing: 'border-box' as const,
}

const navBtnStyle: React.CSSProperties = {
  padding: '11px 28px',
  borderRadius: 10,
  border: 'none',
  cursor: 'pointer',
  fontWeight: 700,
  fontSize: '0.95rem',
  transition: 'background .15s',
}

function choiceCard(selected: boolean, color = 'var(--color-primary)'): React.CSSProperties {
  return {
    padding: '14px 16px',
    borderRadius: 12,
    border: selected ? `2px solid ${color}` : '1.5px solid var(--color-border)',
    background: selected ? `${color}10` : 'var(--color-bg-alt)',
    cursor: 'pointer',
    transition: 'all .15s',
    textAlign: 'left' as const,
    width: '100%',
  }
}

// ── Étape 1 : Logement + Pays + km/an ────────────────────────────────────────

function Etape1({ data, setData }: { data: RechargeData; setData: (d: RechargeData) => void }) {
  const LOGEMENTS = [
    { id: 'maison',      icon: '🏠', label: 'Maison individuelle', detail: 'Garage ou prise extérieure disponible' },
    { id: 'appartement', icon: '🏢', label: 'Appartement',         detail: 'Parking privatif ou box en sous-sol' },
    { id: 'copro',       icon: '🏗️', label: 'Copropriété',        detail: 'Parking commun, accord copropriétaires' },
    { id: 'bureau',      icon: '🏭', label: 'Usage pro / flotte',  detail: 'Chargement sur site entreprise' },
  ] as const

  const PAYS = [
    { id: 'FR', flag: '🇫🇷', label: 'France'   },
    { id: 'BE', flag: '🇧🇪', label: 'Belgique'  },
    { id: 'CH', flag: '🇨🇭', label: 'Suisse'    },
    { id: 'CA', flag: '🇨🇦', label: 'Canada'    },
  ] as const

  return (
    <div style={cardStyle}>
      <h2 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: 20 }}>
        1 · Votre situation de recharge
      </h2>

      {/* Logement */}
      <div style={{ marginBottom: 24 }}>
        <label style={{ display: 'block', fontWeight: 600, marginBottom: 10, fontSize: '0.9rem' }}>
          Où habitez-vous / rechargez-vous principalement ?
        </label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {LOGEMENTS.map(l => (
            <button key={l.id} onClick={() => setData({ ...data, logement: l.id })}
              style={choiceCard(data.logement === l.id, '#059669')}>
              <div style={{ fontSize: '1.5rem', marginBottom: 4 }}>{l.icon}</div>
              <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--color-text)' }}>{l.label}</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--color-text-soft)', marginTop: 2 }}>{l.detail}</div>
            </button>
          ))}
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
                ...choiceCard(data.pays === p.id, '#059669'),
                width: 'auto', padding: '10px 18px',
                display: 'flex', alignItems: 'center', gap: 8,
              }}>
              <span style={{ fontSize: '1.3rem' }}>{p.flag}</span>
              <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{p.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Km/an */}
      <div>
        <label style={{ display: 'block', fontWeight: 600, marginBottom: 10, fontSize: '0.9rem' }}>
          Distance annuelle prévue (km/an)
        </label>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <input
            type="range" min={5000} max={60000} step={1000}
            value={data.kmAn}
            onChange={e => setData({ ...data, kmAn: Number(e.target.value) })}
            style={{ flex: 1, accentColor: '#059669' }}
          />
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <input
              type="number" min={5000} max={100000} step={500}
              value={data.kmAn}
              onChange={e => setData({ ...data, kmAn: Math.max(1000, Number(e.target.value)) })}
              style={{ ...inputStyle, width: 100 }}
            />
            <span style={{ fontSize: '0.88rem', color: 'var(--color-text-soft)' }}>km</span>
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--color-text-soft)', marginTop: 4 }}>
          <span>5 000 km/an</span>
          <span style={{ fontWeight: 700, color: '#059669' }}>
            {data.kmAn.toLocaleString('fr-FR')} km/an
          </span>
          <span>60 000 km/an</span>
        </div>
      </div>
    </div>
  )
}

// ── Étape 2 : VE + profil usage ───────────────────────────────────────────────

function Etape2({ data, setData }: { data: RechargeData; setData: (d: RechargeData) => void }) {
  const BATTERIES = [
    { id: 'petite',  icon: '🔋',   label: 'Petite batterie',  specs: SPECS_VE.petite  },
    { id: 'moyenne', icon: '🔋🔋',  label: 'Batterie moyenne', specs: SPECS_VE.moyenne },
    { id: 'grande',  icon: '🔋🔋🔋', label: 'Grande batterie', specs: SPECS_VE.grande  },
  ] as const

  const PROFILS = [
    { id: 'domicile', icon: '🏠', label: 'Domicile–travail', detail: 'Trajets courts, recharge surtout la nuit à la maison' },
    { id: 'mixte',    icon: '🛣️', label: 'Usage mixte',     detail: 'Quotidien + quelques longs trajets par mois' },
    { id: 'routier',  icon: '🚀', label: 'Grand routier',    detail: 'Longs trajets fréquents, autoroute régulier' },
  ] as const

  return (
    <div style={cardStyle}>
      <h2 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: 20 }}>
        2 · Votre véhicule électrique
      </h2>

      {/* Taille batterie */}
      <div style={{ marginBottom: 24 }}>
        <label style={{ display: 'block', fontWeight: 600, marginBottom: 10, fontSize: '0.9rem' }}>
          Capacité de batterie
        </label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
          {BATTERIES.map(b => (
            <button key={b.id} onClick={() => setData({ ...data, tailleBatterie: b.id })}
              style={choiceCard(data.tailleBatterie === b.id, '#059669')}>
              <div style={{ fontSize: '1.3rem', marginBottom: 6 }}>{b.icon}</div>
              <div style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--color-text)', marginBottom: 4 }}>
                {b.label}
              </div>
              <div style={{ fontSize: '0.78rem', color: '#059669', fontWeight: 700, marginBottom: 3 }}>
                {b.specs.labelBatterie}
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--color-text-soft)', lineHeight: 1.4 }}>
                ~{b.specs.wltp} km WLTP
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--color-text-soft)', marginTop: 4, lineHeight: 1.4 }}>
                {b.specs.exemples}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Profil usage */}
      <div>
        <label style={{ display: 'block', fontWeight: 600, marginBottom: 10, fontSize: '0.9rem' }}>
          Votre profil d'utilisation
        </label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {PROFILS.map(p => (
            <button key={p.id} onClick={() => setData({ ...data, profilUsage: p.id })}
              style={choiceCard(data.profilUsage === p.id, '#059669')}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: '1.4rem' }}>{p.icon}</span>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--color-text)' }}>{p.label}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--color-text-soft)', marginTop: 2 }}>{p.detail}</div>
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

function ScenarioCard({ s, highlight = false }: { s: ScenarioRecharge; highlight?: boolean }) {
  return (
    <div style={{
      background: highlight ? 'rgba(5,150,105,0.06)' : 'var(--color-bg-alt)',
      border: highlight ? '2px solid #059669' : '1.5px solid var(--color-border)',
      borderRadius: 12, padding: '16px 18px',
      position: 'relative',
    }}>
      {highlight && (
        <span style={{
          position: 'absolute', top: -10, right: 14,
          background: '#059669', color: 'white',
          borderRadius: 20, padding: '2px 12px',
          fontSize: '0.72rem', fontWeight: 800,
        }}>
          Votre profil
        </span>
      )}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        <span style={{ fontSize: '1.6rem' }}>{s.icon}</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--color-text)', marginBottom: 3 }}>
            {s.nom}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--color-text-soft)', marginBottom: 10, lineHeight: 1.45 }}>
            {s.description}
          </div>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontSize: '1.35rem', fontWeight: 800, color: highlight ? '#059669' : 'var(--color-primary)' }}>
                {fmtRecharge(s.coutMensuel, s.devise)}<span style={{ fontSize: '0.75rem', fontWeight: 500 }}>/mois</span>
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-soft)' }}>
                {fmtRecharge(s.coutAnnuel, s.devise)}/an · {s.coutKwh.toFixed(2)} {s.devise}/kWh moy.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function Bilan({ res, data }: { res: ResultatRecharge; data: RechargeData }) {
  const ecoDomicile = res.scenarioPublic.coutAnnuel - res.scenarioDomicile.coutAnnuel

  return (
    <div>
      {/* ── Résumé ── */}
      <div style={{
        background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
        borderRadius: 16, padding: '24px 28px', marginBottom: 24, color: 'white',
      }}>
        <div style={{ fontSize: '0.82rem', opacity: 0.85, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Estimation annuelle · Votre profil
        </div>
        <div style={{ fontSize: 'clamp(2rem, 5vw, 2.8rem)', fontWeight: 800, lineHeight: 1.1 }}>
          {fmtRecharge(res.scenarioProfil.coutAnnuel, res.devise)}/an
        </div>
        <div style={{ fontSize: '1rem', opacity: 0.9, marginTop: 6 }}>
          soit {fmtRecharge(res.scenarioProfil.coutMensuel, res.devise)}/mois
          · {res.consommationAn.toLocaleString('fr-FR')} kWh consommés
        </div>
        {ecoDomicile > 0 && (
          <div style={{ marginTop: 12, fontSize: '0.88rem', opacity: 0.95, background: 'rgba(255,255,255,0.15)', borderRadius: 8, padding: '8px 14px', display: 'inline-block' }}>
            💡 Avec une borne à domicile vous économiseriez <strong>{fmtRecharge(ecoDomicile, res.devise)}/an</strong> vs réseau public uniquement
          </div>
        )}
      </div>

      {/* ── 3 scénarios ── */}
      <div style={{ ...cardStyle, marginBottom: 24 }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 16 }}>
          ⚡ Comparaison des 3 scénarios de recharge
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <ScenarioCard s={res.scenarioProfil}    highlight={true} />
          <ScenarioCard s={res.scenarioDomicile} />
          <ScenarioCard s={res.scenarioMixte}    />
          <ScenarioCard s={res.scenarioPublic}   />
        </div>
      </div>

      {/* ── Installation borne ── */}
      <div style={{ ...cardStyle, marginBottom: 24 }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 16 }}>
          🔌 Installation d'une borne à domicile
        </h3>

        {/* Coût */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 20 }}>
          <div style={{ background: 'var(--color-bg-alt)', borderRadius: 10, padding: '14px 16px' }}>
            <div style={{ fontSize: '0.78rem', color: 'var(--color-text-soft)', marginBottom: 4 }}>Coût brut installation</div>
            <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--color-text)' }}>
              {res.installation.coutMin.toLocaleString('fr-FR')} – {res.installation.coutMax.toLocaleString('fr-FR')} {res.devise}
            </div>
          </div>
          <div style={{ background: 'rgba(5,150,105,0.07)', borderRadius: 10, padding: '14px 16px', border: '1.5px solid rgba(5,150,105,0.2)' }}>
            <div style={{ fontSize: '0.78rem', color: 'var(--color-text-soft)', marginBottom: 4 }}>Après aide ({res.installation.aide.montantLabel})</div>
            <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#059669' }}>
              {res.installation.apresAide.min.toLocaleString('fr-FR')} – {res.installation.apresAide.max.toLocaleString('fr-FR')} {res.devise}
            </div>
          </div>
        </div>

        {/* Délai + note */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 18, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem' }}>
            <span>⏱️</span>
            <strong>Délai estimé :</strong> {res.installation.delai}
          </div>
        </div>
        <p style={{ fontSize: '0.84rem', color: 'var(--color-text-soft)', margin: '0 0 14px', lineHeight: 1.6 }}>
          {res.installation.note}
        </p>

        {/* Aide */}
        <div style={{
          background: 'rgba(26,95,196,0.05)', border: '1px solid rgba(26,95,196,0.18)',
          borderRadius: 10, padding: '14px 16px',
        }}>
          <div style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--color-primary)', marginBottom: 6 }}>
            🎁 {res.installation.aide.nom} — {res.installation.aide.montantLabel}
          </div>
          <p style={{ fontSize: '0.82rem', color: 'var(--color-text-soft)', margin: '0 0 8px', lineHeight: 1.55 }}>
            {res.installation.aide.detail}
          </p>
          <a href={res.installation.aide.href} target="_blank" rel="noopener noreferrer"
            style={{ fontSize: '0.8rem', color: 'var(--color-primary)', fontWeight: 600 }}>
            En savoir plus →
          </a>
        </div>
      </div>

      {/* ── Autonomie réelle ── */}
      <div style={{ ...cardStyle, marginBottom: 24 }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 16 }}>
          📏 Autonomie réelle de votre VE ({SPECS_VE[data.tailleBatterie ?? 'moyenne'].labelBatterie})
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
          {[
            { label: 'Autonomie WLTP (officielle)', val: res.autonomie.wltp, color: '#6b7280', icon: '📋' },
            { label: 'Été (conditions optimales)',   val: res.autonomie.ete,  color: '#f59e0b', icon: '☀️' },
            { label: 'Hiver (froid, -10°C)',         val: res.autonomie.hiver, color: '#3b82f6', icon: '❄️' },
            { label: 'Autoroute (130 km/h)',         val: res.autonomie.autoroute, color: '#8b5cf6', icon: '🛣️' },
          ].map(item => (
            <div key={item.label} style={{
              background: 'var(--color-bg-alt)', borderRadius: 10, padding: '14px 16px',
              borderLeft: `3px solid ${item.color}`,
            }}>
              <div style={{ fontSize: '1.1rem', marginBottom: 4 }}>{item.icon}</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: item.color }}>
                {item.val} km
              </div>
              <div style={{ fontSize: '0.76rem', color: 'var(--color-text-soft)', lineHeight: 1.4 }}>
                {item.label}
              </div>
            </div>
          ))}
        </div>

        {res.autonomie.gainHiver > 50 && (
          <div style={{
            marginTop: 14, background: 'rgba(59,130,246,0.06)',
            border: '1px solid rgba(59,130,246,0.2)',
            borderRadius: 8, padding: '10px 14px', fontSize: '0.83rem', color: 'var(--color-text-soft)',
          }}>
            ❄️ En hiver vous perdez <strong>{res.autonomie.gainHiver} km</strong> d'autonomie — pensez à préchauffer le véhicule branché et à réduire la clim/chauffage.
          </div>
        )}
      </div>

      {/* ── Réseaux publics ── */}
      <div style={{ ...cardStyle, marginBottom: 24 }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 16 }}>
          🗺️ Réseaux de recharge publique dans votre pays
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {res.reseaux.map(r => (
            <div key={r.nom} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '12px 14px', background: 'var(--color-bg-alt)',
              borderRadius: 8, gap: 12, flexWrap: 'wrap',
            }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--color-text)' }}>{r.nom}</div>
                <div style={{ fontSize: '0.76rem', color: 'var(--color-text-soft)', marginTop: 2 }}>{r.couverture}</div>
              </div>
              <div style={{
                fontSize: '0.82rem', fontWeight: 600,
                color: 'var(--color-primary)', background: 'rgba(26,95,196,0.07)',
                padding: '5px 12px', borderRadius: 6, whiteSpace: 'nowrap',
              }}>
                {r.tarif}
              </div>
            </div>
          ))}
        </div>
        <p style={{ fontSize: '0.8rem', color: 'var(--color-text-soft)', marginTop: 14, marginBottom: 0, lineHeight: 1.5 }}>
          💡 Conseil : téléchargez l'app <strong>Chargemap</strong> ou <strong>PlugShare</strong> pour localiser toutes les bornes en temps réel, quel que soit le réseau.
        </p>
      </div>

      {/* ── CTA ── */}
      <div style={{ background: 'var(--color-bg-alt)', borderRadius: 12, padding: '20px 22px', textAlign: 'center' }}>
        <p style={{ color: 'var(--color-text-soft)', marginBottom: 14, fontSize: '0.9rem' }}>
          Allez plus loin avec les autres assistants :
        </p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 10, flexWrap: 'wrap' }}>
          <Link href="/assistance/couts" className="btn btn-primary">💰 Coût total TCO →</Link>
          <Link href="/assistant-vacances" className="btn btn-secondary">🏖️ Vacances en VE</Link>
          <Link href="/comparer" className="btn btn-secondary">📊 Comparer motorisations</Link>
        </div>
      </div>
    </div>
  )
}

// ── Composant principal ───────────────────────────────────────────────────────

export default function AssistanceRecharge() {
  const [etape, setEtape]   = useState<Etape>(1)
  const [data, setData]     = useState<RechargeData>({
    logement: null, pays: null, kmAn: 15000,
    tailleBatterie: null, profilUsage: null,
  })

  const etape1Ok = Boolean(data.logement && data.pays)
  const etape2Ok = Boolean(data.tailleBatterie && data.profilUsage)
  const resultat: ResultatRecharge | null = etape === 3 && etape2Ok
    ? calculerRecharge(data)
    : null

  const progress = ((etape - 1) / 2) * 100

  return (
    <div style={{ maxWidth: 720, margin: '0 auto' }}>

      {/* ── Progress bar ── */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
          {(['1 · Logement & pays', '2 · Votre VE', '3 · Bilan recharge'] as const).map((label, i) => (
            <div key={i} style={{
              fontSize: '0.78rem', fontWeight: etape === i + 1 ? 700 : 500,
              color: etape > i ? '#059669' : etape === i + 1 ? 'var(--color-text)' : 'var(--color-text-soft)',
            }}>
              {label}
            </div>
          ))}
        </div>
        <div style={{ height: 6, background: 'var(--color-border)', borderRadius: 3, overflow: 'hidden' }}>
          <div style={{
            height: '100%', width: `${progress}%`,
            background: 'linear-gradient(90deg, #059669, #10b981)',
            borderRadius: 3, transition: 'width .4s ease',
          }} />
        </div>
      </div>

      {/* ── Étapes ── */}
      {etape === 1 && <Etape1 data={data} setData={setData} />}
      {etape === 2 && <Etape2 data={data} setData={setData} />}
      {etape === 3 && resultat && <Bilan res={resultat} data={data} />}
      {etape === 3 && !resultat && (
        <div style={{ ...cardStyle, color: 'var(--color-text-soft)', textAlign: 'center', padding: 40 }}>
          Veuillez compléter les étapes précédentes pour voir votre bilan.
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
              background: (etape === 1 ? etape1Ok : etape2Ok) ? '#059669' : 'var(--color-border)',
              color: (etape === 1 ? etape1Ok : etape2Ok) ? 'white' : 'var(--color-text-soft)',
              opacity: (etape === 1 ? etape1Ok : etape2Ok) ? 1 : 0.55,
            }}
          >
            {etape === 2 ? 'Voir mon bilan →' : 'Suivant →'}
          </button>
        )}

        {etape === 3 && (
          <button
            onClick={() => { setEtape(1); setData({ logement: null, pays: null, kmAn: 15000, tailleBatterie: null, profilUsage: null }) }}
            style={{ ...navBtnStyle, background: '#059669', color: 'white' }}
          >
            ↺ Recommencer
          </button>
        )}
      </div>
    </div>
  )
}
