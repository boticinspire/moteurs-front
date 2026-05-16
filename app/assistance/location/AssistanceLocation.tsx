'use client'

import { useState } from 'react'
import {
  type Pays, type TypeVehicule, type DureeLocation, type CarteBancaire,
  type LocationData, type ResultatLocation,
  analyserLocation, INFO_PAYS, LABEL_PAYS, LABEL_DUREE,
} from '@/lib/assistance-location'

// ── Styles ─────────────────────────────────────────────────────────────────────

const cardStyle: React.CSSProperties = {
  background: 'var(--color-bg-card)',
  border: '1.5px solid var(--color-border)',
  borderRadius: 16, padding: '32px 28px',
  maxWidth: 680, margin: '0 auto',
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 14px', borderRadius: 8,
  border: '1.5px solid var(--color-border)',
  background: 'var(--color-bg-alt)',
  color: 'var(--color-text)', fontSize: '0.95rem',
  boxSizing: 'border-box',
}

const labelStyle: React.CSSProperties = {
  display: 'block', marginBottom: 6, fontWeight: 600,
  fontSize: '0.88rem', color: 'var(--color-text-muted)',
}

const navBtnStyle = (primary: boolean): React.CSSProperties => ({
  padding: '11px 28px', borderRadius: 8, fontWeight: 700,
  fontSize: '0.95rem', cursor: 'pointer', border: 'none',
  background: primary ? 'var(--color-primary)' : 'var(--color-bg-alt)',
  color: primary ? '#0a1628' : 'var(--color-text)',
})

function choiceCard(selected: boolean, couleur = '#0891b2'): React.CSSProperties {
  return {
    padding: '10px 16px', borderRadius: 10, cursor: 'pointer',
    border: selected ? `2px solid ${couleur}` : '2px solid var(--color-border)',
    background: selected ? `${couleur}18` : 'var(--color-bg-card)',
    color: selected ? couleur : 'var(--color-text)',
    fontWeight: selected ? 700 : 500, fontSize: '0.9rem',
    transition: 'all .15s', textAlign: 'center',
  }
}

const sectionTitle: React.CSSProperties = {
  fontWeight: 700, fontSize: '1rem', marginBottom: 12,
  color: 'var(--color-text)',
}

// ── Types locaux ────────────────────────────────────────────────────────────────

type Step = 1 | 2 | 3

// ── Données des choix ───────────────────────────────────────────────────────────

const PAYS_OPTIONS: { code: Pays; flag: string; nom: string }[] = [
  { code: 'FR', flag: '🇫🇷', nom: 'France' },
  { code: 'BE', flag: '🇧🇪', nom: 'Belgique' },
  { code: 'CH', flag: '🇨🇭', nom: 'Suisse' },
  { code: 'CA', flag: '🇨🇦', nom: 'Canada' },
  { code: 'ES', flag: '🇪🇸', nom: 'Espagne' },
  { code: 'IT', flag: '🇮🇹', nom: 'Italie' },
  { code: 'PT', flag: '🇵🇹', nom: 'Portugal' },
  { code: 'DE', flag: '🇩🇪', nom: 'Allemagne' },
  { code: 'GB', flag: '🇬🇧', nom: 'Royaume-Uni' },
  { code: 'US', flag: '🇺🇸', nom: 'États-Unis' },
  { code: 'MA', flag: '🇲🇦', nom: 'Maroc' },
  { code: 'TN', flag: '🇹🇳', nom: 'Tunisie' },
]

const TYPE_VEHICULE_OPTIONS: { value: TypeVehicule; label: string; emoji: string }[] = [
  { value: 'citadine',   label: 'Citadine',    emoji: '🚗' },
  { value: 'berline',    label: 'Berline',      emoji: '🚙' },
  { value: 'suv',        label: 'SUV / 4x4',   emoji: '🛻' },
  { value: 'utilitaire', label: 'Utilitaire',   emoji: '🚐' },
  { value: 'luxe',       label: 'Prestige',     emoji: '🏎️' },
]

const DUREE_OPTIONS: { value: DureeLocation; label: string }[] = [
  { value: 'weekend',   label: 'Week-end (3 j)' },
  { value: 'semaine',   label: '1 semaine (7 j)' },
  { value: 'quinzaine', label: '2 semaines (15 j)' },
  { value: 'mois',      label: '1 mois (30 j)' },
]

const CB_OPTIONS: { value: CarteBancaire; label: string; desc: string }[] = [
  { value: 'visa_classic',  label: 'Visa Classic',         desc: 'Franchise 1 600 €, 31 j max' },
  { value: 'visa_premier',  label: 'Visa Premier',         desc: 'Sans franchise, vol inclus' },
  { value: 'visa_infinite', label: 'Visa Infinite',        desc: 'Premium, 45 j max, mondial' },
  { value: 'mc_standard',   label: 'Mastercard Standard',  desc: 'Franchise 1 600 €, vol exclu' },
  { value: 'mc_gold',       label: 'Mastercard Gold',      desc: 'Sans franchise, Europe' },
  { value: 'mc_world',      label: 'MC World / Elite',     desc: 'Premium, 60 j max, mondial' },
  { value: 'amex',          label: 'American Express',     desc: 'Sans franchise, 30 j max' },
  { value: 'aucune',        label: 'Aucune CB adaptée',    desc: 'CDW obligatoire' },
]

// ── Composant principal ─────────────────────────────────────────────────────────

export default function AssistanceLocation() {
  const [step, setStep] = useState<Step>(1)
  const [data, setData] = useState<LocationData>({
    paysLocation: null,
    typeVehicule: null,
    duree: null,
    carteBancaire: null,
    assurancePerso: false,
    cdwPropose: true,
    prixCdwJour: 15,
    ageConduc: 35,
    conducteurAddl: false,
  })
  const [resultat, setResultat] = useState<ResultatLocation | null>(null)
  const [checklistOpen, setChecklistOpen] = useState(false)
  const [restitutionOpen, setRestitutionOpen] = useState(false)

  const COULEUR = '#0891b2'

  // ── Étape 1 ────────────────────────────────────────────────────────────────

  function renderStep1() {
    const canNext = data.paysLocation && data.typeVehicule && data.duree
    return (
      <div style={cardStyle}>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: 24 }}>
          🌍 Votre destination & véhicule
        </h2>

        {/* Pays */}
        <div style={{ marginBottom: 24 }}>
          <div style={sectionTitle}>Pays de location</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 8 }}>
            {PAYS_OPTIONS.map(p => (
              <div
                key={p.code}
                style={choiceCard(data.paysLocation === p.code, COULEUR)}
                onClick={() => setData(d => ({ ...d, paysLocation: p.code }))}
              >
                <div style={{ fontSize: '1.4rem' }}>{p.flag}</div>
                <div style={{ fontSize: '0.8rem', marginTop: 2 }}>{p.nom}</div>
              </div>
            ))}
          </div>
          {data.paysLocation && INFO_PAYS[data.paysLocation].alerte && (
            <div style={{ marginTop: 12, padding: '10px 14px', borderRadius: 8, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', fontSize: '0.85rem', color: '#dc2626' }}>
              {INFO_PAYS[data.paysLocation].alerte}
            </div>
          )}
        </div>

        {/* Type véhicule */}
        <div style={{ marginBottom: 24 }}>
          <div style={sectionTitle}>Type de véhicule</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {TYPE_VEHICULE_OPTIONS.map(t => (
              <div
                key={t.value}
                style={{ ...choiceCard(data.typeVehicule === t.value, COULEUR), minWidth: 100 }}
                onClick={() => setData(d => ({ ...d, typeVehicule: t.value }))}
              >
                <div style={{ fontSize: '1.3rem' }}>{t.emoji}</div>
                <div style={{ fontSize: '0.82rem', marginTop: 2 }}>{t.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Durée */}
        <div style={{ marginBottom: 28 }}>
          <div style={sectionTitle}>Durée de location</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {DUREE_OPTIONS.map(d => (
              <div
                key={d.value}
                style={{ ...choiceCard(data.duree === d.value, COULEUR), minWidth: 130 }}
                onClick={() => setData(dd => ({ ...dd, duree: d.value }))}
              >
                {d.label}
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button
            style={navBtnStyle(true)}
            disabled={!canNext}
            onClick={() => canNext && setStep(2)}
          >
            Étape suivante →
          </button>
        </div>
      </div>
    )
  }

  // ── Étape 2 ────────────────────────────────────────────────────────────────

  function renderStep2() {
    return (
      <div style={cardStyle}>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: 24 }}>
          🛡️ Votre couverture & le CDW proposé
        </h2>

        {/* Carte bancaire */}
        <div style={{ marginBottom: 24 }}>
          <div style={sectionTitle}>Carte bancaire utilisée pour la location</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {CB_OPTIONS.map(cb => (
              <div
                key={cb.value}
                style={{
                  ...choiceCard(data.carteBancaire === cb.value, COULEUR),
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  textAlign: 'left', padding: '10px 16px',
                }}
                onClick={() => setData(d => ({ ...d, carteBancaire: cb.value }))}
              >
                <span style={{ fontWeight: 600 }}>{cb.label}</span>
                <span style={{ fontSize: '0.78rem', opacity: 0.7 }}>{cb.desc}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Assurance perso */}
        <div style={{ marginBottom: 20 }}>
          <div style={sectionTitle}>Assurance auto personnelle</div>
          <div style={{ display: 'flex', gap: 8 }}>
            {[
              { val: true,  label: '✅ Oui — elle couvre les locations' },
              { val: false, label: '❌ Non / Je ne sais pas' },
            ].map(opt => (
              <div
                key={String(opt.val)}
                style={{ ...choiceCard(data.assurancePerso === opt.val, COULEUR), flex: 1 }}
                onClick={() => setData(d => ({ ...d, assurancePerso: opt.val }))}
              >
                {opt.label}
              </div>
            ))}
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: 6 }}>
            Certains contrats auto incluent la couverture des véhicules de location — vérifiez votre police.
          </p>
        </div>

        {/* CDW proposé */}
        <div style={{ marginBottom: 20 }}>
          <div style={sectionTitle}>CDW / LDW proposé par le loueur ?</div>
          <div style={{ display: 'flex', gap: 8 }}>
            {[
              { val: true,  label: 'Oui — il me propose un CDW' },
              { val: false, label: "Non / Pas encore" },
            ].map(opt => (
              <div
                key={String(opt.val)}
                style={{ ...choiceCard(data.cdwPropose === opt.val, COULEUR), flex: 1 }}
                onClick={() => setData(d => ({ ...d, cdwPropose: opt.val }))}
              >
                {opt.label}
              </div>
            ))}
          </div>
        </div>

        {/* Prix CDW */}
        {data.cdwPropose && (
          <div style={{ marginBottom: 20 }}>
            <label style={labelStyle}>Prix CDW proposé (€/jour)</label>
            <input
              type="number"
              min={0}
              max={100}
              value={data.prixCdwJour}
              onChange={e => setData(d => ({ ...d, prixCdwJour: Number(e.target.value) }))}
              style={{ ...inputStyle, maxWidth: 160 }}
            />
          </div>
        )}

        {/* Âge conducteur */}
        <div style={{ marginBottom: 20 }}>
          <label style={labelStyle}>Âge du conducteur principal</label>
          <input
            type="number"
            min={18}
            max={99}
            value={data.ageConduc}
            onChange={e => setData(d => ({ ...d, ageConduc: Number(e.target.value) }))}
            style={{ ...inputStyle, maxWidth: 160 }}
          />
        </div>

        {/* Conducteur additionnel */}
        <div style={{ marginBottom: 28 }}>
          <div style={sectionTitle}>Conducteur supplémentaire prévu ?</div>
          <div style={{ display: 'flex', gap: 8 }}>
            {[
              { val: true,  label: 'Oui' },
              { val: false, label: 'Non' },
            ].map(opt => (
              <div
                key={String(opt.val)}
                style={{ ...choiceCard(data.conducteurAddl === opt.val, COULEUR), flex: 1 }}
                onClick={() => setData(d => ({ ...d, conducteurAddl: opt.val }))}
              >
                {opt.label}
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'space-between' }}>
          <button style={navBtnStyle(false)} onClick={() => setStep(1)}>← Retour</button>
          <button
            style={navBtnStyle(true)}
            disabled={!data.carteBancaire}
            onClick={() => {
              if (!data.carteBancaire) return
              setResultat(analyserLocation(data))
              setStep(3)
            }}
          >
            Obtenir mon bilan →
          </button>
        </div>
      </div>
    )
  }

  // ── Étape 3 : Bilan ────────────────────────────────────────────────────────

  function renderStep3() {
    if (!resultat) return null
    const { recommandation: reco, couvertureCB, infoPays, alerteAge, alerteConducteurAddl } = resultat
    const infosPays = INFO_PAYS[data.paysLocation!]

    return (
      <div style={{ maxWidth: 680, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* En-tête destination */}
        <div style={{ ...cardStyle, padding: '20px 24px', display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ fontSize: '2.8rem' }}>{infosPays.flag}</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>{infosPays.nom}</div>
            <div style={{ color: 'var(--color-text-muted)', fontSize: '0.88rem' }}>
              {data.typeVehicule && TYPE_VEHICULE_OPTIONS.find(t => t.value === data.typeVehicule)?.label}
              {' · '}
              {data.duree && LABEL_DUREE[data.duree]}
              {data.cdwPropose && ` · CDW proposé ${data.prixCdwJour} €/j`}
            </div>
          </div>
        </div>

        {/* Recommandation principale */}
        <div style={{
          ...cardStyle,
          background: reco.prendreCDW ? 'rgba(239,68,68,0.06)' : 'rgba(5,150,105,0.06)',
          borderColor: reco.prendreCDW ? 'rgba(239,68,68,0.3)' : 'rgba(5,150,105,0.3)',
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
            <div style={{ fontSize: '2.4rem' }}>{reco.prendreCDW ? '🛡️' : '💰'}</div>
            <div>
              <div style={{ fontWeight: 800, fontSize: '1.15rem', color: reco.prendreCDW ? '#dc2626' : '#059669', marginBottom: 8 }}>
                {reco.prendreCDW
                  ? `Prenez le CDW — ${reco.coutCDWTotal} € pour votre séjour`
                  : `Refusez le CDW — économisez ${reco.economiePossible} €`}
              </div>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', lineHeight: 1.6, margin: 0 }}>
                {reco.explication}
              </p>
            </div>
          </div>

          {/* Options complémentaires */}
          <div style={{ display: 'flex', gap: 10, marginTop: 16, flexWrap: 'wrap' }}>
            {reco.prendreVol && (
              <span style={{ padding: '5px 12px', borderRadius: 20, background: 'rgba(239,68,68,0.1)', color: '#dc2626', fontSize: '0.82rem', fontWeight: 600 }}>
                🔒 Prenez aussi l&apos;option vol
              </span>
            )}
            {reco.prendreTP && (
              <span style={{ padding: '5px 12px', borderRadius: 20, background: 'rgba(99,102,241,0.1)', color: '#6366f1', fontSize: '0.82rem', fontWeight: 600 }}>
                🧑 Tiers passager conseillé
              </span>
            )}
          </div>
        </div>

        {/* Couverture CB */}
        <div style={cardStyle}>
          <div style={sectionTitle}>💳 Votre carte bancaire — {couvertureCB.nom}</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {[
              { label: 'Franchise collision', value: couvertureCB.franchise === 0 ? '✅ Aucune' : couvertureCB.franchise === null ? '❌ Non couverte' : `⚠️ ${couvertureCB.franchise} €` },
              { label: 'Durée max couverte', value: couvertureCB.dureeMax ? `${couvertureCB.dureeMax} jours` : '—' },
              { label: 'Vol couvert', value: couvertureCB.rembourseVol ? '✅ Oui' : '❌ Non' },
              { label: 'Plafond véhicule', value: couvertureCB.plafondVehicule ? `${couvertureCB.plafondVehicule.toLocaleString('fr')} €` : '—' },
            ].map(item => (
              <div key={item.label} style={{ background: 'var(--color-bg-alt)', borderRadius: 8, padding: '10px 14px' }}>
                <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', marginBottom: 4 }}>{item.label}</div>
                <div style={{ fontWeight: 700, fontSize: '0.92rem' }}>{item.value}</div>
              </div>
            ))}
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginTop: 12, fontStyle: 'italic' }}>
            💡 {couvertureCB.conseil}
          </p>
          {couvertureCB.paysExclus.length > 0 && (
            <p style={{ fontSize: '0.82rem', color: '#b45309', marginTop: 8 }}>
              ⚠️ Pays exclus de votre couverture CB : {couvertureCB.paysExclus.join(', ')}
            </p>
          )}
        </div>

        {/* Alertes */}
        {(reco.alertes.length > 0 || alerteAge || alerteConducteurAddl || infosPays.alerte) && (
          <div style={{ ...cardStyle, background: 'rgba(234,179,8,0.06)', borderColor: 'rgba(234,179,8,0.3)' }}>
            <div style={sectionTitle}>⚠️ Points d&apos;attention</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {reco.alertes.map((a, i) => (
                <div key={i} style={{ fontSize: '0.88rem', padding: '8px 12px', background: 'rgba(234,179,8,0.08)', borderRadius: 6, color: '#92400e' }}>
                  {a}
                </div>
              ))}
              {alerteAge && (
                <div style={{ fontSize: '0.88rem', padding: '8px 12px', background: 'rgba(234,179,8,0.08)', borderRadius: 6, color: '#92400e' }}>
                  🧑 {alerteAge}
                </div>
              )}
              {alerteConducteurAddl && (
                <div style={{ fontSize: '0.88rem', padding: '8px 12px', background: 'rgba(234,179,8,0.08)', borderRadius: 6, color: '#92400e' }}>
                  {alerteConducteurAddl}
                </div>
              )}
              {infosPays.alerte && (
                <div style={{ fontSize: '0.88rem', padding: '8px 12px', background: 'rgba(239,68,68,0.08)', borderRadius: 6, color: '#dc2626' }}>
                  {infosPays.alerte}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Infos pays */}
        <div style={cardStyle}>
          <div style={sectionTitle}>{infosPays.flag} Spécificités {infosPays.nom}</div>
          {infosPays.obligatoire.length > 0 && (
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#dc2626', marginBottom: 4 }}>Obligatoire</div>
              {infosPays.obligatoire.map((o, i) => (
                <div key={i} style={{ fontSize: '0.86rem', color: 'var(--color-text)', paddingLeft: 12, marginBottom: 2 }}>• {o}</div>
              ))}
            </div>
          )}
          {infosPays.conseils.length > 0 && (
            <div>
              <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0891b2', marginBottom: 4 }}>Conseils pratiques</div>
              {infosPays.conseils.map((c, i) => (
                <div key={i} style={{ fontSize: '0.86rem', color: 'var(--color-text-muted)', paddingLeft: 12, marginBottom: 2 }}>• {c}</div>
              ))}
            </div>
          )}
        </div>

        {/* Checklist prise en charge — accordéon */}
        <div style={{ ...cardStyle, padding: '0' }}>
          <button
            onClick={() => setChecklistOpen(!checklistOpen)}
            style={{
              width: '100%', padding: '18px 24px', background: 'none', border: 'none',
              cursor: 'pointer', display: 'flex', justifyContent: 'space-between',
              alignItems: 'center', fontWeight: 700, fontSize: '1rem', color: 'var(--color-text)',
            }}
          >
            <span>📋 Checklist prise en charge du véhicule</span>
            <span style={{ fontSize: '1.2rem' }}>{checklistOpen ? '▲' : '▼'}</span>
          </button>
          {checklistOpen && (
            <div style={{ padding: '0 24px 20px', borderTop: '1px solid var(--color-border)' }}>
              <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', margin: '12px 0 16px' }}>
                Photographiez chaque zone AVANT de partir du parking — idéalement en vidéo avec horodatage.
              </p>
              {resultat.checklistPrise.map((section, i) => (
                <div key={i} style={{ marginBottom: 14 }}>
                  <div style={{ fontWeight: 700, fontSize: '0.88rem', color: COULEUR, marginBottom: 6 }}>
                    {section.zone}
                  </div>
                  {section.points.map((pt, j) => (
                    <div key={j} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 4 }}>
                      <span style={{ color: '#059669', fontWeight: 700, flexShrink: 0 }}>☐</span>
                      <span style={{ fontSize: '0.85rem', color: 'var(--color-text)' }}>{pt}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Checklist restitution — accordéon */}
        <div style={{ ...cardStyle, padding: '0' }}>
          <button
            onClick={() => setRestitutionOpen(!restitutionOpen)}
            style={{
              width: '100%', padding: '18px 24px', background: 'none', border: 'none',
              cursor: 'pointer', display: 'flex', justifyContent: 'space-between',
              alignItems: 'center', fontWeight: 700, fontSize: '1rem', color: 'var(--color-text)',
            }}
          >
            <span>🔑 Checklist restitution du véhicule</span>
            <span style={{ fontSize: '1.2rem' }}>{restitutionOpen ? '▲' : '▼'}</span>
          </button>
          {restitutionOpen && (
            <div style={{ padding: '0 24px 20px', borderTop: '1px solid var(--color-border)' }}>
              <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', margin: '12px 0 16px' }}>
                La restitution est le moment le plus à risque — soyez méthodique.
              </p>
              {resultat.checklistRestitution.map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 8 }}>
                  <span style={{ color: '#059669', fontWeight: 700, flexShrink: 0 }}>☐</span>
                  <span style={{ fontSize: '0.85rem', color: 'var(--color-text)' }}>{item}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <button style={navBtnStyle(false)} onClick={() => { setStep(1); setResultat(null) }}>
            ← Nouvelle analyse
          </button>
        </div>
      </div>
    )
  }

  // ── Barre de progression ────────────────────────────────────────────────────

  const steps = [
    { n: 1, label: 'Destination' },
    { n: 2, label: 'Couverture' },
    { n: 3, label: 'Bilan' },
  ]

  return (
    <div>
      {/* Progress */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 0, marginBottom: 32 }}>
        {steps.map((s, i) => (
          <div key={s.n} style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <div style={{
                width: 34, height: 34, borderRadius: '50%',
                background: step >= s.n ? COULEUR : 'var(--color-bg-alt)',
                color: step >= s.n ? '#0a1628' : 'var(--color-text-muted)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 800, fontSize: '0.95rem',
                border: step === s.n ? `2px solid ${COULEUR}` : '2px solid transparent',
              }}>
                {step > s.n ? '✓' : s.n}
              </div>
              <span style={{ fontSize: '0.75rem', color: step >= s.n ? COULEUR : 'var(--color-text-muted)', fontWeight: step === s.n ? 700 : 400 }}>
                {s.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div style={{ width: 60, height: 2, background: step > s.n ? COULEUR : 'var(--color-border)', marginBottom: 18 }} />
            )}
          </div>
        ))}
      </div>

      {step === 1 && renderStep1()}
      {step === 2 && renderStep2()}
      {step === 3 && renderStep3()}
    </div>
  )
}
