'use client'

import { useEffect, useState } from 'react'
import { ConstantData, CIRCONSTANCES, PHOTOS_CHECKLIST } from '@/lib/constat'
import { useUserContext } from '@/context/UserContextProvider'
import { saveConstat } from '@/lib/constats-membres'

// ─── Styles ───────────────────────────────────────────────────────────────────

const section: React.CSSProperties = {
  background: 'var(--color-bg-card)',
  border: '1.5px solid var(--color-border)',
  borderRadius: 12, padding: '20px 22px', marginBottom: 16,
}

const sectionTitle: React.CSSProperties = {
  fontWeight: 700, fontSize: '0.85rem', textTransform: 'uppercase',
  letterSpacing: '0.06em', color: '#ef4444', marginBottom: 14,
}

const row: React.CSSProperties = {
  display: 'flex', gap: 8, marginBottom: 6, fontSize: '0.87rem',
}

const rowLabel: React.CSSProperties = {
  fontWeight: 600, minWidth: 160, flexShrink: 0, color: 'var(--color-text-soft)',
}

const rowVal: React.CSSProperties = {
  color: 'var(--color-text)', flex: 1,
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function Row({ label, value }: { label: string; value?: string }) {
  if (!value) return null
  return (
    <div style={row}>
      <span style={rowLabel}>{label}</span>
      <span style={rowVal}>{value}</span>
    </div>
  )
}

function VehiculeBlock({ titre, v, couleur }: {
  titre: string
  v: ConstantData['vehicule_a']
  couleur: string
}) {
  return (
    <div style={{ ...section, borderLeftColor: couleur, borderLeftWidth: 3 }}>
      <div style={{ ...sectionTitle, color: couleur }}>{titre}</div>
      <Row label="Immatriculation"  value={v.immatriculation || '—'} />
      <Row label="Marque / Modèle"  value={v.marque_modele || '—'} />
      <Row label="Conducteur"       value={[v.prenom_conducteur, v.nom_conducteur].filter(Boolean).join(' ') || '—'} />
      <Row label="Adresse"          value={v.adresse_conducteur} />
      <Row label="Téléphone"        value={v.telephone} />
      <Row label="Email"            value={v.email} />
      <Row label="Assureur"         value={v.assurance_nom || '—'} />
      <Row label="N° police"        value={v.assurance_numero_police} />
      <Row label="Tél. assurance"   value={v.assurance_telephone} />
      {v.dommages_description && (
        <div style={{ marginTop: 10, padding: '10px 12px', background: 'var(--color-bg-alt)', borderRadius: 8 }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-soft)', marginBottom: 4 }}>DOMMAGES</div>
          <p style={{ margin: 0, fontSize: '0.84rem', lineHeight: 1.55 }}>{v.dommages_description}</p>
          {v.dommages_localisation.length > 0 && (
            <div style={{ marginTop: 6, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {v.dommages_localisation.map(pt => (
                <span key={pt} style={{ padding: '2px 10px', borderRadius: 20, fontSize: '0.75rem', background: `${couleur}15`, border: `1px solid ${couleur}40`, color: couleur }}>
                  {pt}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Composant principal ──────────────────────────────────────────────────────

export default function ConstantResume({ constat, onEdit, onReset, savedId }: {
  constat: ConstantData
  onEdit:  (etape: number) => void
  onReset: () => void
  /** Si déjà chargé depuis l'espace membre, on update au lieu d'insert. */
  savedId?: string
}) {
  const { userId } = useUserContext()
  const [email,        setEmail]        = useState('')
  const [sending,      setSending]      = useState(false)
  const [emailSent,    setEmailSent]    = useState(false)
  const [emailErreur,  setEmailErreur]  = useState('')

  // ── Sauvegarde dans l'espace membre ──
  const [saving,        setSaving]        = useState(false)
  const [savedConstatId, setSavedConstatId] = useState<string | null>(savedId ?? null)
  const [saveErreur,    setSaveErreur]    = useState('')

  const handleSaveToMember = async () => {
    if (!userId) return
    setSaving(true)
    setSaveErreur('')
    const result = await saveConstat(userId, constat, savedConstatId ? { id: savedConstatId } : undefined)
    setSaving(false)
    if (result.ok) {
      setSavedConstatId(result.id)
    } else {
      setSaveErreur(result.error)
    }
  }

  const sendEmail = async () => {
    if (!email.trim() || !email.includes('@')) {
      setEmailErreur('Adresse email invalide')
      return
    }
    setSending(true)
    setEmailErreur('')
    try {
      const res = await fetch('/api/constat-email', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email, constat }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`)
      setEmailSent(true)
    } catch (e) {
      setEmailErreur(e instanceof Error ? e.message : 'Erreur inconnue')
    } finally {
      setSending(false)
    }
  }

  const circA = constat.circonstances_a.map(i => CIRCONSTANCES[i]?.label).filter(Boolean)
  const circB = constat.circonstances_b.map(i => CIRCONSTANCES[i]?.label).filter(Boolean)

  return (
    <div>

      {/* ── En-tête ── */}
      <div style={{ background: 'rgba(34,197,94,0.07)', border: '2px solid rgba(34,197,94,0.3)', borderRadius: 16, padding: '20px 24px', marginBottom: 20 }}>
        <div style={{ fontWeight: 800, fontSize: '1.1rem', marginBottom: 4 }}>
          ✅ Constat complété
        </div>
        <p style={{ margin: 0, fontSize: '0.87rem', color: 'var(--color-text-soft)' }}>
          {constat.date} à {constat.heure} — {constat.lieu || 'Lieu non précisé'}
          {constat.blesses && <span style={{ marginLeft: 8, color: '#ef4444', fontWeight: 700 }}>⚠️ Blessés signalés</span>}
        </p>
      </div>

      {/* ── Actions export ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginBottom: 24 }}>

        {/* Imprimer / PDF */}
        <button
          onClick={() => window.print()}
          style={{
            padding: '14px 16px', borderRadius: 10, cursor: 'pointer', border: 'none',
            background: '#3b82f6', color: 'white', fontWeight: 700, fontSize: '0.9rem',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}
        >
          🖨️ Imprimer / Sauvegarder PDF
        </button>

        {/* Modifier */}
        <button onClick={() => onEdit(0)} style={{
          padding: '14px 16px', borderRadius: 10, cursor: 'pointer',
          border: '1.5px solid var(--color-border)', background: 'var(--color-bg-alt)',
          color: 'var(--color-text)', fontWeight: 700, fontSize: '0.9rem',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        }}>
          ✏️ Modifier le constat
        </button>

        {/* Nouveau */}
        <button onClick={onReset} style={{
          padding: '14px 16px', borderRadius: 10, cursor: 'pointer',
          border: '1.5px solid var(--color-border)', background: 'var(--color-bg-alt)',
          color: 'var(--color-text)', fontWeight: 600, fontSize: '0.9rem',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        }}>
          🔄 Nouveau constat
        </button>
      </div>

      {/* ── Sauvegarde dans l'espace membre ── */}
      {userId && (
        <div style={{
          ...section,
          borderColor: savedConstatId ? 'rgba(34,197,94,0.4)' : 'var(--color-border)',
        }}>
          <div style={sectionTitle}>💾 Sauvegarder dans mon espace</div>
          {savedConstatId ? (
            <div style={{ color: '#22c55e', fontWeight: 700, fontSize: '0.9rem' }}>
              ✅ Constat sauvegardé dans votre espace membre. Vous pouvez le retrouver dans <a href="/espace-membres" style={{ color: 'var(--color-primary)', fontWeight: 700 }}>/espace-membres</a> à tout moment.
              <button
                onClick={handleSaveToMember}
                disabled={saving}
                style={{
                  marginLeft: 10, padding: '4px 10px', borderRadius: 6, border: 'none',
                  background: 'var(--color-bg-alt)', color: 'var(--color-text-soft)',
                  fontSize: '0.78rem', cursor: 'pointer', fontWeight: 600,
                }}
              >
                {saving ? '…' : '🔄 Mettre à jour'}
              </button>
            </div>
          ) : (
            <>
              <p style={{ margin: '0 0 12px', fontSize: '0.85rem', color: 'var(--color-text-soft)' }}>
                Stockez ce constat dans votre espace membre pour le retrouver, l&apos;imprimer ou le compléter plus tard.
              </p>
              <button
                onClick={handleSaveToMember}
                disabled={saving}
                style={{
                  padding: '11px 22px', borderRadius: 10, border: 'none', cursor: 'pointer',
                  background: '#22c55e', color: 'white', fontWeight: 700, fontSize: '0.9rem',
                  opacity: saving ? 0.7 : 1,
                }}
              >
                {saving ? 'Sauvegarde…' : '💾 Sauvegarder dans mon espace'}
              </button>
            </>
          )}
          {saveErreur && (
            <div style={{ marginTop: 10, fontSize: '0.8rem', color: '#ef4444' }}>⚠️ {saveErreur}</div>
          )}
        </div>
      )}

      {/* ── Email ── */}
      <div style={{ ...section, borderColor: emailSent ? 'rgba(34,197,94,0.4)' : 'var(--color-border)' }}>
        <div style={sectionTitle}>📧 Recevoir par email</div>
        {emailSent ? (
          <div style={{ color: '#22c55e', fontWeight: 700, fontSize: '0.9rem' }}>
            ✅ Email envoyé à {email}
          </div>
        ) : (
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              type="email"
              placeholder="votre@email.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              style={{
                flex: 1, padding: '10px 13px', borderRadius: 9,
                border: '1.5px solid var(--color-border)', background: 'var(--color-bg-alt)',
                color: 'var(--color-text)', fontSize: '0.9rem',
              }}
            />
            <button
              onClick={sendEmail}
              disabled={sending}
              style={{
                padding: '10px 20px', borderRadius: 9, border: 'none', cursor: 'pointer',
                background: '#3b82f6', color: 'white', fontWeight: 700, fontSize: '0.9rem',
                opacity: sending ? 0.7 : 1,
              }}
            >
              {sending ? '…' : 'Envoyer'}
            </button>
          </div>
        )}
        {emailErreur && (
          <div style={{ marginTop: 8, fontSize: '0.8rem', color: '#ef4444' }}>⚠️ {emailErreur}</div>
        )}
        <p style={{ margin: '8px 0 0', fontSize: '0.75rem', color: 'var(--color-text-soft)' }}>
          Le résumé est envoyé à votre adresse uniquement.
          {userId
            ? ' Vous pouvez aussi sauvegarder le constat dans votre espace membre (ci-dessus).'
            : ' Pour stocker durablement le constat, connectez-vous à l\'espace membre.'}
        </p>
      </div>

      {/* ══════════════════════════════════════════════════════════════
          RÉSUMÉ IMPRIMABLE (visible à l'écran + dans le PDF print)
      ══════════════════════════════════════════════════════════════ */}
      <div id="constat-print">

        {/* ── Infos générales ── */}
        <div style={section}>
          <div style={sectionTitle}>📍 Informations générales</div>
          <Row label="Date"    value={constat.date} />
          <Row label="Heure"   value={constat.heure} />
          <Row label="Lieu"    value={constat.lieu || '—'} />
          <Row label="Pays"    value={constat.pays} />
          <Row label="Blessés" value={constat.blesses ? `Oui — ${constat.nb_blesses > 0 ? constat.nb_blesses : '?'} blessé(s)${constat.secours_appeles ? ` — Secours appelés (${constat.numero_appele})` : ''}` : 'Non'} />
        </div>

        {/* ── Photos ── */}
        <div style={section}>
          <div style={sectionTitle}>📸 Photos confirmées</div>
          {constat.photos_checklist.length === 0
            ? <p style={{ fontSize: '0.85rem', color: 'var(--color-text-soft)', margin: 0 }}>Aucune photo cochée</p>
            : (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {constat.photos_checklist.map(id => {
                  const ph = PHOTOS_CHECKLIST.find(p => p.id === id)
                  return ph ? (
                    <span key={id} style={{ padding: '3px 12px', borderRadius: 20, fontSize: '0.78rem', background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', color: '#16a34a' }}>
                      ✅ {ph.label}
                    </span>
                  ) : null
                })}
              </div>
            )}
        </div>

        {/* ── Véhicules ── */}
        <VehiculeBlock titre="🚗 Véhicule A — Vous" v={constat.vehicule_a} couleur="#3b82f6" />
        <VehiculeBlock titre="🚙 Véhicule B — Adverse" v={constat.vehicule_b} couleur="#ef4444" />

        {/* ── Circonstances ── */}
        <div style={section}>
          <div style={sectionTitle}>📋 Circonstances</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.82rem', color: '#3b82f6', marginBottom: 8 }}>🚗 Véhicule A</div>
              {circA.length === 0
                ? <span style={{ fontSize: '0.83rem', color: 'var(--color-text-soft)' }}>Aucune case cochée</span>
                : circA.map((c, i) => (
                  <div key={i} style={{ fontSize: '0.83rem', marginBottom: 4 }}>☑ {c}</div>
                ))}
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.82rem', color: '#ef4444', marginBottom: 8 }}>🚙 Véhicule B</div>
              {circB.length === 0
                ? <span style={{ fontSize: '0.83rem', color: 'var(--color-text-soft)' }}>Aucune case cochée</span>
                : circB.map((c, i) => (
                  <div key={i} style={{ fontSize: '0.83rem', marginBottom: 4 }}>☑ {c}</div>
                ))}
            </div>
          </div>
        </div>

        {/* ── Croquis ── */}
        <div style={section}>
          <div style={sectionTitle}>🗺️ Croquis & description du choc</div>
          <Row label="Sens véhicule A" value={constat.sens_a || '—'} />
          <Row label="Sens véhicule B" value={constat.sens_b || '—'} />
          <Row label="Point de choc A" value={constat.point_choc_a || '—'} />
          <Row label="Point de choc B" value={constat.point_choc_b || '—'} />
          {constat.croquis_description && (
            <div style={{ marginTop: 10, padding: '10px 12px', background: 'var(--color-bg-alt)', borderRadius: 8 }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-soft)', marginBottom: 4 }}>DESCRIPTION</div>
              <p style={{ margin: 0, fontSize: '0.84rem', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{constat.croquis_description}</p>
            </div>
          )}
        </div>

        {/* ── Témoins ── */}
        {(constat.temoins.length > 0 || constat.observations) && (
          <div style={section}>
            <div style={sectionTitle}>👥 Témoins & observations</div>
            {constat.temoins.map((t, i) => (
              <div key={i} style={{ marginBottom: 8 }}>
                <Row label={`Témoin ${i + 1}`} value={[t.nom, t.adresse, t.telephone].filter(Boolean).join(' — ')} />
              </div>
            ))}
            {constat.observations && (
              <div style={{ marginTop: 8, padding: '10px 12px', background: 'var(--color-bg-alt)', borderRadius: 8 }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-soft)', marginBottom: 4 }}>OBSERVATIONS</div>
                <p style={{ margin: 0, fontSize: '0.84rem', lineHeight: 1.55 }}>{constat.observations}</p>
              </div>
            )}
          </div>
        )}

        {/* ── Disclaimer ── */}
        <p style={{ fontSize: '0.72rem', color: 'var(--color-text-soft)', marginTop: 8, lineHeight: 1.5 }}>
          Ce résumé est généré à titre d&apos;aide et ne remplace pas le constat amiable original signé des deux parties. Transmettez le constat physique signé à votre assureur dans les 5 jours ouvrables (délai légal FR/BE/CH).
        </p>
      </div>

      {/* ── CSS print ── */}
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #constat-print, #constat-print * { visibility: visible !important; }
          #constat-print { position: fixed; top: 0; left: 0; width: 100%; padding: 20px; }
          nav, header, footer, .btn { display: none !important; }
        }
      `}</style>
    </div>
  )
}
