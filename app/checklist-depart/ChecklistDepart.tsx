'use client'

import { useState, useMemo } from 'react'
import {
  type ProfilVoyage, type InfoTrajet, type ResultatFatigue,
  LABEL_PROFIL, EMOJI_PROFIL, COULEUR_FATIGUE, LABEL_FATIGUE,
  filtrerItems, grouperParCategorie,
  evaluerFatigue, calculerPauses,
} from '@/lib/checklist-depart'

// ── Styles ─────────────────────────────────────────────────────────────────────

const COULEUR = '#0ea5e9'

const cardStyle: React.CSSProperties = {
  background: 'var(--color-bg-card)',
  border: '1.5px solid var(--color-border)',
  borderRadius: 16, padding: '28px 24px',
}

const navBtnStyle = (primary: boolean): React.CSSProperties => ({
  padding: '11px 28px', borderRadius: 8, fontWeight: 700,
  fontSize: '0.95rem', cursor: 'pointer', border: 'none',
  background: primary ? COULEUR : 'var(--color-bg-alt)',
  color: primary ? '#fff' : 'var(--color-text)',
})

const sectionTitle: React.CSSProperties = {
  fontWeight: 700, fontSize: '1rem', marginBottom: 14, color: 'var(--color-text)',
}

function choiceCard(selected: boolean): React.CSSProperties {
  return {
    padding: '10px 14px', borderRadius: 10, cursor: 'pointer',
    border: selected ? `2px solid ${COULEUR}` : '2px solid var(--color-border)',
    background: selected ? `${COULEUR}15` : 'var(--color-bg-card)',
    color: selected ? COULEUR : 'var(--color-text)',
    fontWeight: selected ? 700 : 500, fontSize: '0.88rem',
    transition: 'all .15s', textAlign: 'center' as const,
  }
}

type Step = 1 | 2 | 3

const PROFILS: ProfilVoyage[] = ['famille', 'bebe', 'senior', 'ev', 'camping', 'animaux', 'long_courrier', 'etranger']

// ── Composant principal ─────────────────────────────────────────────────────────

export default function ChecklistDepart() {
  const [step, setStep]   = useState<Step>(1)
  const [checked, setChecked] = useState<Set<string>>(new Set())
  const [openCats, setOpenCats] = useState<Set<string>>(new Set())

  const [trajet, setTrajet] = useState<InfoTrajet>({
    distanceKm:    300,
    heureDepart:   '08:00',
    nbConducteurs: 1,
    profils:       [],
    nbPassagers:   2,
    autoroute:     true,
  })

  function toggleProfil(p: ProfilVoyage) {
    setTrajet(t => {
      const has = t.profils.includes(p)
      return { ...t, profils: has ? t.profils.filter(x => x !== p) : [...t.profils, p] }
    })
  }

  function toggleItem(id: string) {
    setChecked(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function toggleCat(cat: string) {
    setOpenCats(prev => {
      const next = new Set(prev)
      next.has(cat) ? next.delete(cat) : next.add(cat)
      return next
    })
  }

  // Items filtrés selon profils
  const items = useMemo(() => filtrerItems(trajet), [trajet])
  const grouped = useMemo(() => grouperParCategorie(items), [items])
  const fatigue  = useMemo(() => evaluerFatigue(trajet), [trajet])
  const pauses   = useMemo(() => calculerPauses(trajet), [trajet])

  const totalItems   = items.length
  const checkedCount = items.filter(i => checked.has(i.id)).length
  const pctComplete  = totalItems > 0 ? Math.round((checkedCount / totalItems) * 100) : 0
  const urgentsManquants = items.filter(i => i.urgence && !checked.has(i.id))

  // ── Étape 1 : Profil ───────────────────────────────────────────────────────

  function renderStep1() {
    return (
      <div style={cardStyle}>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: 8 }}>
          🗺️ Votre voyage
        </h2>
        <p style={{ fontSize: '0.88rem', color: 'var(--color-text-muted)', marginBottom: 24 }}>
          Personnalisez votre check-list selon votre situation.
        </p>

        {/* Profils */}
        <div style={{ marginBottom: 24 }}>
          <div style={sectionTitle}>Qui voyage ? Quelles spécificités ? <span style={{ fontWeight: 400, fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>(sélection multiple)</span></div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 8 }}>
            {PROFILS.map(p => (
              <div
                key={p}
                style={{ ...choiceCard(trajet.profils.includes(p)), padding: '12px' }}
                onClick={() => toggleProfil(p)}
              >
                <div style={{ fontSize: '1.4rem' }}>{EMOJI_PROFIL[p]}</div>
                <div style={{ fontSize: '0.82rem', marginTop: 4 }}>{LABEL_PROFIL[p]}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Distance */}
        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'block', fontWeight: 600, fontSize: '0.88rem', color: 'var(--color-text-muted)', marginBottom: 8 }}>
            Distance estimée : <strong style={{ color: 'var(--color-text)' }}>{trajet.distanceKm} km</strong>
          </label>
          <input
            type="range" min={50} max={1500} step={25}
            value={trajet.distanceKm}
            onChange={e => setTrajet(t => ({ ...t, distanceKm: Number(e.target.value) }))}
            style={{ width: '100%' }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: 4 }}>
            <span>50 km</span><span>750 km</span><span>1 500 km</span>
          </div>
        </div>

        {/* Heure départ */}
        <div style={{ marginBottom: 20, display: 'flex', gap: 20, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 160 }}>
            <label style={{ display: 'block', fontWeight: 600, fontSize: '0.88rem', color: 'var(--color-text-muted)', marginBottom: 6 }}>
              Heure de départ prévue
            </label>
            <input
              type="time" value={trajet.heureDepart}
              onChange={e => setTrajet(t => ({ ...t, heureDepart: e.target.value }))}
              style={{ padding: '10px 14px', borderRadius: 8, border: '1.5px solid var(--color-border)', background: 'var(--color-bg-alt)', color: 'var(--color-text)', fontSize: '0.95rem', width: '100%' }}
            />
          </div>
          <div style={{ flex: 1, minWidth: 160 }}>
            <label style={{ display: 'block', fontWeight: 600, fontSize: '0.88rem', color: 'var(--color-text-muted)', marginBottom: 6 }}>
              Nombre de conducteurs
            </label>
            <div style={{ display: 'flex', gap: 8 }}>
              {[1, 2, 3].map(n => (
                <div
                  key={n}
                  style={{ ...choiceCard(trajet.nbConducteurs === n), flex: 1 }}
                  onClick={() => setTrajet(t => ({ ...t, nbConducteurs: n }))}
                >
                  {n} conducteur{n > 1 ? 's' : ''}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Autoroute */}
        <div style={{ marginBottom: 28 }}>
          <div style={sectionTitle}>Type de trajet principal</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <div style={{ ...choiceCard(trajet.autoroute), flex: 1 }} onClick={() => setTrajet(t => ({ ...t, autoroute: true }))}>
              🛣️ Autoroute
            </div>
            <div style={{ ...choiceCard(!trajet.autoroute), flex: 1 }} onClick={() => setTrajet(t => ({ ...t, autoroute: false }))}>
              🏘️ Routes nationales / départementales
            </div>
          </div>
        </div>

        {/* Aperçu items générés */}
        <div style={{ padding: '12px 16px', borderRadius: 8, background: 'var(--color-bg-alt)', marginBottom: 24, fontSize: '0.88rem', color: 'var(--color-text-muted)' }}>
          📋 Votre check-list : <strong style={{ color: 'var(--color-text)' }}>{items.length} points</strong> répartis en {grouped.size} catégories
          {trajet.profils.length > 0 && ` — dont ${items.filter(i => i.profils).length} spécifiques à votre profil`}
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button style={navBtnStyle(true)} onClick={() => {
            setOpenCats(new Set(grouped.keys()))
            setStep(2)
          }}>
            Voir ma check-list →
          </button>
        </div>
      </div>
    )
  }

  // ── Étape 2 : Checklist ───────────────────────────────────────────────────

  function renderStep2() {
    return (
      <div style={{ maxWidth: 700, margin: '0 auto' }}>
        {/* Barre de progression sticky */}
        <div style={{
          position: 'sticky', top: 0, zIndex: 10,
          background: 'var(--color-bg-card)', border: '1px solid var(--color-border)',
          borderRadius: 12, padding: '14px 20px', marginBottom: 20,
          boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 8 }}>
            <div style={{ fontWeight: 700, fontSize: '0.92rem' }}>
              ✅ {checkedCount} / {totalItems} points cochés
            </div>
            <div style={{ fontWeight: 800, fontSize: '1rem', color: pctComplete === 100 ? '#059669' : COULEUR }}>
              {pctComplete}%
            </div>
          </div>
          <div style={{ height: 8, borderRadius: 4, background: 'var(--color-bg-alt)', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${pctComplete}%`, borderRadius: 4, background: pctComplete === 100 ? '#059669' : COULEUR, transition: 'width .3s' }} />
          </div>
          {urgentsManquants.length > 0 && (
            <div style={{ marginTop: 8, fontSize: '0.78rem', color: '#dc2626', fontWeight: 600 }}>
              ⚠️ {urgentsManquants.length} point{urgentsManquants.length > 1 ? 's' : ''} urgent{urgentsManquants.length > 1 ? 's' : ''} non coché{urgentsManquants.length > 1 ? 's' : ''}
            </div>
          )}
        </div>

        {/* Catégories */}
        {Array.from(grouped.entries()).map(([cat, catItems]) => {
          const catChecked = catItems.filter(i => checked.has(i.id)).length
          const isOpen = openCats.has(cat)
          return (
            <div key={cat} style={{ ...cardStyle, padding: 0, marginBottom: 12 }}>
              <button
                onClick={() => toggleCat(cat)}
                style={{
                  width: '100%', padding: '16px 20px', background: 'none', border: 'none',
                  cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                }}
              >
                <span style={{ fontWeight: 700, fontSize: '0.97rem', color: 'var(--color-text)' }}>{cat}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{
                    fontSize: '0.78rem', fontWeight: 700, padding: '2px 8px', borderRadius: 20,
                    background: catChecked === catItems.length ? 'rgba(5,150,105,0.12)' : 'var(--color-bg-alt)',
                    color: catChecked === catItems.length ? '#059669' : 'var(--color-text-muted)',
                  }}>
                    {catChecked}/{catItems.length}
                  </span>
                  <span style={{ color: 'var(--color-text-muted)' }}>{isOpen ? '▲' : '▼'}</span>
                </div>
              </button>
              {isOpen && (
                <div style={{ padding: '0 20px 16px', borderTop: '1px solid var(--color-border)' }}>
                  {catItems.map(item => (
                    <div
                      key={item.id}
                      onClick={() => toggleItem(item.id)}
                      style={{
                        display: 'flex', gap: 12, alignItems: 'flex-start',
                        padding: '10px 0',
                        borderBottom: '1px solid var(--color-border)',
                        cursor: 'pointer',
                        opacity: checked.has(item.id) ? 0.6 : 1,
                      }}
                    >
                      {/* Checkbox */}
                      <div style={{
                        width: 22, height: 22, borderRadius: 6, flexShrink: 0, marginTop: 1,
                        border: `2px solid ${checked.has(item.id) ? '#059669' : item.urgence ? '#dc2626' : 'var(--color-border)'}`,
                        background: checked.has(item.id) ? '#059669' : 'transparent',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        {checked.has(item.id) && <span style={{ color: '#fff', fontSize: '0.75rem', fontWeight: 800 }}>✓</span>}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '0.9rem', fontWeight: item.urgence ? 700 : 500, color: 'var(--color-text)', textDecoration: checked.has(item.id) ? 'line-through' : 'none' }}>
                          {item.urgence && !checked.has(item.id) && <span style={{ color: '#dc2626', marginRight: 4 }}>!</span>}
                          {item.texte}
                        </div>
                        {item.detail && (
                          <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', marginTop: 3, lineHeight: 1.5 }}>
                            💡 {item.detail}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}

        <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
          <button style={navBtnStyle(false)} onClick={() => setStep(1)}>← Modifier le profil</button>
          <button style={navBtnStyle(true)} onClick={() => setStep(3)}>
            Voir mon bilan →
          </button>
        </div>
      </div>
    )
  }

  // ── Étape 3 : Bilan ────────────────────────────────────────────────────────

  function renderStep3() {
    const couleurFatigue = COULEUR_FATIGUE[fatigue.niveauFatigue]
    const h = Math.floor(fatigue.dureeTotale)
    const m = Math.round((fatigue.dureeTotale - h) * 60)

    return (
      <div style={{ maxWidth: 700, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* Score checklist */}
        <div style={{
          ...cardStyle,
          background: pctComplete === 100 ? 'rgba(5,150,105,0.05)' : urgentsManquants.length > 0 ? 'rgba(239,68,68,0.05)' : 'rgba(14,165,233,0.05)',
          borderColor: pctComplete === 100 ? 'rgba(5,150,105,0.25)' : urgentsManquants.length > 0 ? 'rgba(239,68,68,0.25)' : 'rgba(14,165,233,0.25)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ fontSize: '3rem' }}>
              {pctComplete === 100 ? '🎉' : pctComplete >= 80 ? '✅' : pctComplete >= 50 ? '⚠️' : '🔴'}
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: '1.2rem', marginBottom: 4 }}>
                Préparation : {pctComplete}% — {checkedCount}/{totalItems} points
              </div>
              <div style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>
                {pctComplete === 100 && 'Check-list complète — vous êtes prêt à partir !'}
                {pctComplete >= 80 && pctComplete < 100 && `${totalItems - checkedCount} point(s) restant(s) à vérifier.`}
                {pctComplete < 80 && `${urgentsManquants.length} point(s) urgent(s) manquant(s).`}
              </div>
            </div>
          </div>
          {urgentsManquants.length > 0 && (
            <div style={{ marginTop: 14, padding: '12px 16px', borderRadius: 8, background: 'rgba(239,68,68,0.08)' }}>
              <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#dc2626', marginBottom: 6 }}>
                ⚠️ Points urgents non cochés
              </div>
              {urgentsManquants.map(i => (
                <div key={i.id} style={{ fontSize: '0.85rem', color: '#dc2626', paddingLeft: 12, marginBottom: 2 }}>
                  • {i.texte}
                </div>
              ))}
            </div>
          )}
          {pctComplete < 100 && (
            <button
              style={{ marginTop: 14, ...navBtnStyle(false), fontSize: '0.88rem', padding: '8px 18px' }}
              onClick={() => { setOpenCats(new Set(grouperParCategorie(items).keys())); setStep(2) }}
            >
              ← Retour à la checklist
            </button>
          )}
        </div>

        {/* Fatigue conducteur */}
        <div style={{ ...cardStyle, borderColor: `${couleurFatigue}30`, background: `${couleurFatigue}08` }}>
          <div style={sectionTitle}>😴 Estimation fatigue conducteur</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
            <div style={{
              width: 60, height: 60, borderRadius: '50%', background: couleurFatigue,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontWeight: 800, fontSize: '1.1rem', flexShrink: 0,
            }}>
              {fatigue.score}
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: '1rem', color: couleurFatigue }}>
                {LABEL_FATIGUE[fatigue.niveauFatigue]}
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginTop: 2 }}>
                Durée estimée : {h}h{m > 0 ? `${m.toString().padStart(2, '0')}` : ''} · Départ {trajet.heureDepart} · {trajet.nbConducteurs} conducteur{trajet.nbConducteurs > 1 ? 's' : ''}
              </div>
            </div>
          </div>
          {fatigue.alertes.length > 0 && (
            <div style={{ marginBottom: 12 }}>
              {fatigue.alertes.map((a, i) => (
                <div key={i} style={{ padding: '8px 12px', borderRadius: 6, background: 'rgba(239,68,68,0.08)', fontSize: '0.85rem', color: '#dc2626', marginBottom: 6 }}>
                  ⚠️ {a}
                </div>
              ))}
            </div>
          )}
          {fatigue.conseils.length > 0 && (
            <div>
              {fatigue.conseils.map((c, i) => (
                <div key={i} style={{ fontSize: '0.85rem', color: 'var(--color-text)', paddingLeft: 12, marginBottom: 4 }}>
                  💡 {c}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pauses recommandées */}
        {pauses.length > 0 && (
          <div style={cardStyle}>
            <div style={sectionTitle}>⏸️ Pauses recommandées sur {trajet.distanceKm} km</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {pauses.map((pause, i) => (
                <div key={i} style={{
                  display: 'flex', gap: 14, alignItems: 'flex-start',
                  padding: '12px 14px', borderRadius: 10, background: 'var(--color-bg-alt)',
                  border: pause.raison.includes('⚠️') ? '1.5px solid rgba(239,68,68,0.3)' : '1px solid var(--color-border)',
                }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                    background: pause.raison.includes('⚠️') ? '#dc2626' : COULEUR,
                    color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 800, fontSize: '0.82rem',
                  }}>
                    {i + 1}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: 4 }}>{pause.raison}</div>
                    <div style={{ display: 'flex', gap: 12, marginBottom: 6 }}>
                      <span style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>
                        ⏱ {pause.dureeMin} min minimum
                      </span>
                      <span style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>
                        🕐 ~{Math.floor(pause.apresHeures)}h{Math.round((pause.apresHeures % 1) * 60).toString().padStart(2, '0')} de trajet
                      </span>
                    </div>
                    <div style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>{pause.conseil}</div>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 12, padding: '8px 12px', borderRadius: 6, background: 'rgba(5,150,105,0.08)', fontSize: '0.82rem', color: '#059669' }}>
              💡 Durée totale avec pauses estimée : {h + Math.round(pauses.reduce((acc, p) => acc + p.dureeMin, 0) / 60)}h{m.toString().padStart(2, '0')}
            </div>
          </div>
        )}

        {/* CTA */}
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <button style={navBtnStyle(false)} onClick={() => { setStep(2); setOpenCats(new Set(grouperParCategorie(items).keys())) }}>
            ← Retour à la checklist
          </button>
          <button style={navBtnStyle(true)} onClick={() => { setStep(1); setChecked(new Set()); setTrajet({ distanceKm: 300, heureDepart: '08:00', nbConducteurs: 1, profils: [], nbPassagers: 2, autoroute: true }) }}>
            🔄 Nouveau départ
          </button>
        </div>
      </div>
    )
  }

  // ── Barre de progression ─────────────────────────────────────────────────────

  const steps = [
    { n: 1, label: 'Profil' },
    { n: 2, label: 'Checklist' },
    { n: 3, label: 'Bilan' },
  ]

  return (
    <div style={{ maxWidth: 700, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 32 }}>
        {steps.map((s, i) => (
          <div key={s.n} style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <div style={{
                width: 34, height: 34, borderRadius: '50%',
                background: step >= s.n ? COULEUR : 'var(--color-bg-alt)',
                color: step >= s.n ? '#fff' : 'var(--color-text-muted)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 800, fontSize: '0.95rem',
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
