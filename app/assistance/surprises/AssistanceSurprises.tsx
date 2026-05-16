'use client'

import { useState } from 'react'
import {
  type SituationId, type Situation, type SituationPays,
  SITUATIONS, LABEL_URGENCE, getSituation,
} from '@/lib/assistance-surprises'

// ── Styles ─────────────────────────────────────────────────────────────────────

const COULEUR = '#b45309'

const cardStyle: React.CSSProperties = {
  background: 'var(--color-bg-card)',
  border: '1.5px solid var(--color-border)',
  borderRadius: 16, padding: '28px 24px',
}

const btnStyle = (primary: boolean, color = COULEUR): React.CSSProperties => ({
  padding: '10px 22px', borderRadius: 8, fontWeight: 700,
  fontSize: '0.9rem', cursor: 'pointer', border: 'none',
  background: primary ? color : 'var(--color-bg-alt)',
  color: primary ? '#fff' : 'var(--color-text)',
})

const sectionTitle: React.CSSProperties = {
  fontWeight: 700, fontSize: '0.95rem', marginBottom: 12, color: 'var(--color-text)',
}

// ── Accordéon ─────────────────────────────────────────────────────────────────

function Accordion({ title, children, defaultOpen = false }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div style={{ border: '1px solid var(--color-border)', borderRadius: 10, overflow: 'hidden', marginBottom: 8 }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: '100%', padding: '13px 16px', background: 'none', border: 'none',
          cursor: 'pointer', display: 'flex', justifyContent: 'space-between',
          alignItems: 'center', fontWeight: 600, fontSize: '0.9rem', color: 'var(--color-text)',
        }}
      >
        <span>{title}</span>
        <span style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div style={{ padding: '4px 16px 16px', borderTop: '1px solid var(--color-border)' }}>
          {children}
        </div>
      )}
    </div>
  )
}

// ── Vue détail situation ───────────────────────────────────────────────────────

function DetailSituation({ situation, onBack }: { situation: Situation; onBack: () => void }) {
  const [paysFocus, setPaysFocus] = useState<SituationPays | null>(null)
  const urgInfo = LABEL_URGENCE[situation.urgence]

  return (
    <div style={{ maxWidth: 700, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* En-tête */}
      <div style={{ ...cardStyle, padding: '20px 24px' }}>
        <button style={{ ...btnStyle(false), padding: '6px 14px', fontSize: '0.82rem', marginBottom: 16 }} onClick={onBack}>
          ← Retour
        </button>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
          <div style={{ fontSize: '2.4rem' }}>{situation.emoji}</div>
          <div>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 800, marginBottom: 6 }}>{situation.titre}</h2>
            <div style={{ fontSize: '0.86rem', color: 'var(--color-text-muted)', marginBottom: 10 }}>{situation.sousTitre}</div>
            <span style={{
              display: 'inline-block', padding: '4px 12px', borderRadius: 20,
              fontSize: '0.78rem', fontWeight: 700,
              background: urgInfo.bg, color: urgInfo.color,
            }}>
              ⏱ {urgInfo.label}
            </span>
          </div>
        </div>
        <p style={{ fontSize: '0.88rem', color: 'var(--color-text-muted)', lineHeight: 1.65, marginTop: 14 }}>
          {situation.description}
        </p>
      </div>

      {/* Étapes générales */}
      <div style={cardStyle}>
        <div style={sectionTitle}>📋 Que faire — étapes à suivre</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {situation.etapesGenerales.map((etape, i) => (
            <div
              key={i}
              style={{
                padding: '14px 16px', borderRadius: 10,
                background: etape.urgent ? 'rgba(239,68,68,0.06)' : 'var(--color-bg-alt)',
                border: etape.urgent ? '1.5px solid rgba(239,68,68,0.25)' : '1px solid var(--color-border)',
              }}
            >
              <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <div style={{
                  width: 26, height: 26, borderRadius: '50%', flexShrink: 0,
                  background: etape.urgent ? '#dc2626' : COULEUR,
                  color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 800, fontSize: '0.8rem', marginTop: 1,
                }}>
                  {etape.urgent ? '!' : etape.ordre}
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: '0.88rem', color: 'var(--color-text)', margin: 0, lineHeight: 1.6 }}>
                    {etape.texte}
                  </p>
                  {etape.alerte && (
                    <div style={{ marginTop: 8, padding: '6px 10px', borderRadius: 6, background: 'rgba(239,68,68,0.08)', fontSize: '0.82rem', color: '#dc2626' }}>
                      ⚠️ {etape.alerte}
                    </div>
                  )}
                  {etape.astuce && (
                    <div style={{ marginTop: 8, padding: '6px 10px', borderRadius: 6, background: 'rgba(5,150,105,0.08)', fontSize: '0.82rem', color: '#059669' }}>
                      💡 {etape.astuce}
                    </div>
                  )}
                  {etape.contact && (
                    <div style={{ marginTop: 8, display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' as const }}>
                      {etape.contact.numero && (
                        <a href={`tel:${etape.contact.numero}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 6, background: 'rgba(8,145,178,0.1)', color: '#0891b2', fontSize: '0.82rem', fontWeight: 700, textDecoration: 'none' }}>
                          📞 {etape.contact.numero}
                        </a>
                      )}
                      {etape.contact.url && (
                        <a href={etape.contact.url} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 6, background: 'rgba(124,58,237,0.1)', color: '#7c3aed', fontSize: '0.82rem', fontWeight: 700, textDecoration: 'none' }}>
                          🔗 {etape.contact.label}
                        </a>
                      )}
                      {!etape.contact.numero && !etape.contact.url && etape.contact.info && (
                        <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
                          ℹ️ {etape.contact.info}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Détails par pays */}
      {situation.parPays && situation.parPays.length > 0 && (
        <div style={cardStyle}>
          <div style={sectionTitle}>🌍 Spécificités par pays</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
            {situation.parPays.map(p => (
              <button
                key={p.paysCode}
                onClick={() => setPaysFocus(paysFocus?.paysCode === p.paysCode ? null : p)}
                style={{
                  padding: '6px 14px', borderRadius: 20, border: 'none', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600,
                  background: paysFocus?.paysCode === p.paysCode ? COULEUR : 'var(--color-bg-alt)',
                  color: paysFocus?.paysCode === p.paysCode ? '#fff' : 'var(--color-text)',
                }}
              >
                {p.flag} {p.paysNom}
              </button>
            ))}
          </div>
          {paysFocus && (
            <div style={{ padding: '16px', borderRadius: 10, background: 'var(--color-bg-alt)', border: '1px solid var(--color-border)' }}>
              <div style={{ fontWeight: 700, fontSize: '0.92rem', marginBottom: 12 }}>{paysFocus.flag} {paysFocus.paysNom}</div>
              {paysFocus.montant && (
                <div style={{ fontSize: '0.82rem', color: '#b45309', fontWeight: 700, marginBottom: 8 }}>
                  💶 Montant typique : {paysFocus.montant}
                </div>
              )}
              {paysFocus.delai && (
                <div style={{ fontSize: '0.82rem', color: '#0891b2', fontWeight: 700, marginBottom: 12 }}>
                  ⏱ Délai : {paysFocus.delai}
                </div>
              )}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {paysFocus.etapes.map((e, i) => (
                  <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                    <span style={{ fontWeight: 800, color: COULEUR, flexShrink: 0 }}>{e.ordre}.</span>
                    <div>
                      <span style={{ fontSize: '0.86rem', color: 'var(--color-text)' }}>{e.texte}</span>
                      {e.astuce && <div style={{ fontSize: '0.8rem', color: '#059669', marginTop: 4 }}>💡 {e.astuce}</div>}
                      {e.alerte && <div style={{ fontSize: '0.8rem', color: '#dc2626', marginTop: 4 }}>⚠️ {e.alerte}</div>}
                    </div>
                  </div>
                ))}
              </div>
              {paysFocus.contacts.length > 0 && (
                <div style={{ marginTop: 12, display: 'flex', gap: 8, flexWrap: 'wrap' as const }}>
                  {paysFocus.contacts.map((c, i) => (
                    c.url ? (
                      <a key={i} href={c.url} target="_blank" rel="noopener noreferrer"
                        style={{ padding: '4px 10px', borderRadius: 6, background: 'rgba(124,58,237,0.1)', color: '#7c3aed', fontSize: '0.8rem', fontWeight: 700, textDecoration: 'none' }}>
                        🔗 {c.label}
                      </a>
                    ) : (
                      <span key={i} style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>ℹ️ {c.label} — {c.info}</span>
                    )
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Erreurs courantes */}
      <div style={{ ...cardStyle, background: 'rgba(239,68,68,0.04)', borderColor: 'rgba(239,68,68,0.2)' }}>
        <div style={sectionTitle}>🚫 Erreurs à ne pas commettre</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {situation.erreursCourantes.map((e, i) => (
            <div key={i} style={{ padding: '10px 14px', borderRadius: 8, background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)' }}>
              <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#dc2626', marginBottom: 4 }}>
                ❌ {e.erreur}
              </div>
              <div style={{ fontSize: '0.83rem', color: 'var(--color-text-muted)' }}>
                → {e.consequence}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Contacts utiles */}
      {situation.contactsGeneraux.length > 0 && (
        <div style={cardStyle}>
          <div style={sectionTitle}>📞 Contacts utiles</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {situation.contactsGeneraux.map((c, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 8, background: 'var(--color-bg-alt)' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>{c.label}</div>
                  {c.info && <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', marginTop: 2 }}>{c.info}</div>}
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  {c.numero && (
                    <a href={`tel:${c.numero}`} style={{ padding: '4px 10px', borderRadius: 6, background: 'rgba(8,145,178,0.1)', color: '#0891b2', fontSize: '0.82rem', fontWeight: 700, textDecoration: 'none' }}>
                      📞 {c.numero}
                    </a>
                  )}
                  {c.url && (
                    <a href={c.url} target="_blank" rel="noopener noreferrer" style={{ padding: '4px 10px', borderRadius: 6, background: 'rgba(124,58,237,0.1)', color: '#7c3aed', fontSize: '0.82rem', fontWeight: 700, textDecoration: 'none' }}>
                      🔗 Site
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Checklist prévention */}
      {situation.checklistDepart.length > 0 && (
        <Accordion title="✅ Checklist prévention — avant de partir">
          <div style={{ paddingTop: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
            {situation.checklistDepart.map((item, i) => (
              <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                <span style={{ color: '#059669', fontWeight: 700, flexShrink: 0 }}>☐</span>
                <span style={{ fontSize: '0.86rem', color: 'var(--color-text)' }}>{item}</span>
              </div>
            ))}
          </div>
        </Accordion>
      )}

      <div>
        <button style={btnStyle(false)} onClick={onBack}>← Autre situation</button>
      </div>
    </div>
  )
}

// ── Composant principal ─────────────────────────────────────────────────────────

export default function AssistanceSurprises() {
  const [situationActive, setSituationActive] = useState<Situation | null>(null)

  if (situationActive) {
    return <DetailSituation situation={situationActive} onBack={() => setSituationActive(null)} />
  }

  return (
    <div style={{ maxWidth: 700, margin: '0 auto' }}>
      <div style={{ ...cardStyle, marginBottom: 24 }}>
        <h2 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: 8 }}>
          😤 Quelle est votre situation ?
        </h2>
        <p style={{ fontSize: '0.88rem', color: 'var(--color-text-muted)', margin: 0 }}>
          Sélectionnez la mauvaise surprise que vous rencontrez — vous obtiendrez les étapes à suivre, les contacts et les erreurs à éviter.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {SITUATIONS.map(situation => {
          const urgInfo = LABEL_URGENCE[situation.urgence]
          return (
            <div
              key={situation.id}
              onClick={() => setSituationActive(situation)}
              style={{
                ...cardStyle, padding: '18px 20px', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 16,
                transition: 'border-color .15s, transform .1s',
              }}
            >
              <div style={{ fontSize: '2rem', flexShrink: 0 }}>{situation.emoji}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: '0.97rem', marginBottom: 3 }}>{situation.titre}</div>
                <div style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>
                  {situation.sousTitre}
                </div>
              </div>
              <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: '0.72rem', fontWeight: 700, background: urgInfo.bg, color: urgInfo.color }}>
                  {urgInfo.label}
                </span>
                <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>→</span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Numéros urgence */}
      <div style={{ ...cardStyle, marginTop: 20, background: 'rgba(239,68,68,0.04)', borderColor: 'rgba(239,68,68,0.2)', padding: '16px 20px' }}>
        <div style={{ fontWeight: 700, fontSize: '0.88rem', marginBottom: 10, color: '#dc2626' }}>
          🆘 Numéros d&apos;urgence universels
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {[
            { label: 'Urgences Europe', numero: '112' },
            { label: 'Police France', numero: '17' },
            { label: 'SAMU France', numero: '15' },
            { label: 'Opposition CB', numero: '+33 892 705 705' },
          ].map(c => (
            <a key={c.label} href={`tel:${c.numero}`}
              style={{ padding: '6px 14px', borderRadius: 8, background: 'rgba(239,68,68,0.1)', color: '#dc2626', fontSize: '0.82rem', fontWeight: 700, textDecoration: 'none' }}>
              📞 {c.label} — {c.numero}
            </a>
          ))}
        </div>
      </div>
    </div>
  )
}
