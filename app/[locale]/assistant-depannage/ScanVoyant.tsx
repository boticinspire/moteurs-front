'use client'

import { useRef, useState } from 'react'

// ─── Types ────────────────────────────────────────────────────────────────────

type Urgence   = 'stop' | 'attention' | 'info'
type Confiance = 'haute' | 'moyenne' | 'faible'

interface VoyantDiagnostic {
  voyant_nom:   string
  description:  string
  urgence:      Urgence
  peut_rouler:  boolean
  actions:      string[]
  article_lien: string | null
  confiance:    Confiance
}

// ─── Config urgence ───────────────────────────────────────────────────────────

const URGENCE_CFG: Record<Urgence, {
  label: string; emoji: string; color: string; bg: string; border: string
}> = {
  stop:      { label: 'DANGER IMMÉDIAT',  emoji: '🚨', color: '#ef4444', bg: 'rgba(239,68,68,0.08)',    border: 'rgba(239,68,68,0.3)'    },
  attention: { label: 'URGENT',           emoji: '⚠️', color: '#f97316', bg: 'rgba(249,115,22,0.08)',   border: 'rgba(249,115,22,0.3)'   },
  info:      { label: 'INFORMATIF',       emoji: 'ℹ️', color: '#3b82f6', bg: 'rgba(59,130,246,0.08)',   border: 'rgba(59,130,246,0.3)'   },
}

// ─── Styles partagés ──────────────────────────────────────────────────────────

const cardStyle: React.CSSProperties = {
  background:   'var(--color-bg-card)',
  border:       '1.5px solid var(--color-border)',
  borderRadius: 16,
  padding:      '24px',
}

const btnPrimary: React.CSSProperties = {
  padding: '13px 22px', borderRadius: 10, cursor: 'pointer',
  fontWeight: 700, fontSize: '0.92rem', border: 'none',
  background: 'var(--color-primary)', color: '#0a1628',
}

// ─── Composant ────────────────────────────────────────────────────────────────

export default function ScanVoyant() {
  const [preview,    setPreview]    = useState<string | null>(null)
  const [mimeType,   setMimeType]   = useState<string>('image/jpeg')
  const [loading,    setLoading]    = useState(false)
  const [erreur,     setErreur]     = useState<string>('')
  const [diagnostic, setDiagnostic] = useState<VoyantDiagnostic | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)

  // ── Charger une image depuis fichier ou caméra ──────────────────────────────
  const handleFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setErreur('Veuillez sélectionner une image (JPG, PNG, WebP)')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setErreur('Image trop volumineuse (max 5 Mo). Essayez de réduire la résolution.')
      return
    }
    setErreur('')
    setDiagnostic(null)
    setMimeType(file.type)

    const reader = new FileReader()
    reader.onload = (e) => setPreview(e.target?.result as string)
    reader.readAsDataURL(file)
  }

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }

  // ── Lancer l'analyse ────────────────────────────────────────────────────────
  const analyser = async () => {
    if (!preview) return
    setLoading(true)
    setErreur('')

    // Extraire la partie base64 pure (sans le préfixe "data:image/xxx;base64,")
    const base64 = preview.split(',')[1]

    try {
      const res = await fetch('/api/scan-voyant', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ image_base64: base64, mime_type: mimeType }),
      })
      const data = await res.json()
      if (!res.ok || data.error) throw new Error(data.error ?? `HTTP ${res.status}`)
      setDiagnostic(data)
    } catch (e) {
      setErreur(e instanceof Error ? e.message : String(e))
    } finally {
      setLoading(false)
    }
  }

  // ── Reset ────────────────────────────────────────────────────────────────────
  const reset = () => {
    setPreview(null)
    setDiagnostic(null)
    setErreur('')
    if (fileInputRef.current)   fileInputRef.current.value   = ''
    if (cameraInputRef.current) cameraInputRef.current.value = ''
  }

  // ─── Rendu ─────────────────────────────────────────────────────────────────

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* ── Zone upload / capture ── */}
      {!diagnostic && (
        <div style={cardStyle}>
          <h2 style={{ margin: '0 0 6px', fontSize: '1.1rem' }}>📸 Photographiez votre tableau de bord</h2>
          <p style={{ margin: '0 0 20px', color: 'var(--color-text-muted)', fontSize: '0.87rem', lineHeight: 1.5 }}>
            Prenez en photo le voyant allumé ou votre tableau de bord entier. Claude analyse l&apos;image et identifie le problème en quelques secondes.
          </p>

          {/* Zone de preview ou dropzone */}
          {preview ? (
            <div style={{ position: 'relative', marginBottom: 16 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={preview}
                alt="Tableau de bord"
                style={{ width: '100%', maxHeight: 260, objectFit: 'contain', borderRadius: 10, border: '1.5px solid var(--color-border)' }}
              />
              <button
                onClick={reset}
                style={{
                  position: 'absolute', top: 8, right: 8,
                  background: 'rgba(0,0,0,0.55)', color: '#fff',
                  border: 'none', borderRadius: '50%',
                  width: 28, height: 28, cursor: 'pointer',
                  fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
                title="Supprimer"
              >
                ✕
              </button>
            </div>
          ) : (
            <div
              onClick={() => fileInputRef.current?.click()}
              style={{
                border: '2px dashed var(--color-border)',
                borderRadius: 12, padding: '36px 20px',
                textAlign: 'center', cursor: 'pointer',
                marginBottom: 16, transition: 'border-color .15s',
              }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--color-primary)')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--color-border)')}
            >
              <div style={{ fontSize: '2.5rem', marginBottom: 10 }}>🖼️</div>
              <div style={{ fontWeight: 600, marginBottom: 4 }}>Cliquez pour choisir une photo</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>JPG, PNG, WebP — max 5 Mo</div>
            </div>
          )}

          {/* Inputs cachés */}
          <input ref={fileInputRef}   type="file" accept="image/*"              onChange={onFileChange} style={{ display: 'none' }} />
          <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" onChange={onFileChange} style={{ display: 'none' }} />

          {/* Boutons d'action */}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {!preview && (
              <button
                onClick={() => cameraInputRef.current?.click()}
                style={{ ...btnPrimary, flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
              >
                📷 Prendre une photo
              </button>
            )}
            {!preview && (
              <button
                onClick={() => fileInputRef.current?.click()}
                style={{
                  ...btnPrimary, flex: 1,
                  background: 'var(--color-bg-alt)', color: 'var(--color-text)',
                  border: '1.5px solid var(--color-border)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                }}
              >
                📂 Choisir depuis la galerie
              </button>
            )}
            {preview && !loading && (
              <>
                <button
                  onClick={analyser}
                  style={{ ...btnPrimary, flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                >
                  🔍 Analyser le voyant
                </button>
                <button
                  onClick={reset}
                  style={{
                    ...btnPrimary,
                    background: 'var(--color-bg-alt)', color: 'var(--color-text)',
                    border: '1.5px solid var(--color-border)',
                  }}
                >
                  🔄 Changer
                </button>
              </>
            )}
          </div>

          {/* Chargement */}
          {loading && (
            <div style={{ marginTop: 20, textAlign: 'center', padding: '20px 0' }}>
              <div style={{ fontSize: '2rem', marginBottom: 10, opacity: 0.8 }}>🔍</div>
              <p style={{ margin: 0, color: 'var(--color-text-muted)', fontSize: '0.88rem' }}>
                Claude analyse votre photo…
              </p>
            </div>
          )}

          {/* Erreur */}
          {erreur && (
            <div style={{
              marginTop: 14, padding: '12px 14px',
              background: 'rgba(239,68,68,0.07)',
              border: '1px solid rgba(239,68,68,0.25)',
              borderRadius: 8, fontSize: '0.83rem', color: '#ef4444',
            }}>
              ⚠️ {erreur}
            </div>
          )}

          {/* Conseil photo */}
          <div style={{ marginTop: 16, padding: '10px 14px', background: 'var(--color-bg-alt)', borderRadius: 8 }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-muted)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              💡 Conseils pour une meilleure analyse
            </div>
            <ul style={{ margin: 0, paddingLeft: 16, fontSize: '0.78rem', color: 'var(--color-text-muted)', lineHeight: 1.7 }}>
              <li>Photographiez de face, tableau de bord bien éclairé</li>
              <li>Moteur démarré (voyants visibles) ou clé sur position &quot;contact&quot;</li>
              <li>Cadrez le voyant allumé ou tout le combiné d&apos;instruments</li>
            </ul>
          </div>
        </div>
      )}

      {/* ── Résultat diagnostic ── */}
      {diagnostic && (
        <DiagnosticResult diagnostic={diagnostic} preview={preview} onReset={reset} />
      )}
    </div>
  )
}

// ─── Affichage du résultat ────────────────────────────────────────────────────

function DiagnosticResult({
  diagnostic, preview, onReset,
}: {
  diagnostic: VoyantDiagnostic
  preview:    string | null
  onReset:    () => void
}) {
  const cfg = URGENCE_CFG[diagnostic.urgence]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* En-tête urgence */}
      <div style={{ background: cfg.bg, border: `2px solid ${cfg.border}`, borderRadius: 16, padding: '22px 24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: cfg.color, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
              {cfg.emoji} {cfg.label}
            </div>
            <h2 style={{ margin: '0 0 8px', fontSize: '1.2rem' }}>
              {diagnostic.voyant_nom}
            </h2>
            <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--color-text-muted)', lineHeight: 1.55 }}>
              {diagnostic.description}
            </p>
          </div>

          {/* Badge peut rouler */}
          <div style={{
            padding: '12px 14px', borderRadius: 12, textAlign: 'center', flexShrink: 0,
            background: diagnostic.peut_rouler ? 'rgba(5,150,105,0.12)' : 'rgba(239,68,68,0.12)',
            border: `1.5px solid ${diagnostic.peut_rouler ? 'rgba(5,150,105,0.35)' : 'rgba(239,68,68,0.35)'}`,
          }}>
            <div style={{ fontSize: '1.5rem' }}>{diagnostic.peut_rouler ? '✅' : '🛑'}</div>
            <div style={{ fontSize: '0.7rem', fontWeight: 700, marginTop: 4, color: diagnostic.peut_rouler ? '#059669' : '#ef4444' }}>
              {diagnostic.peut_rouler ? 'Peut rouler' : 'Stop moteur'}
            </div>
          </div>
        </div>

        {/* Confiance */}
        {diagnostic.confiance !== 'haute' && (
          <div style={{
            marginTop: 14, padding: '8px 12px', borderRadius: 7,
            background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.25)',
            fontSize: '0.78rem', color: '#d97706',
          }}>
            ⚡ Confiance {diagnostic.confiance === 'faible' ? 'faible' : 'moyenne'} — photo peu lisible ? Essayez de photographier de plus près ou sous meilleur éclairage.
          </div>
        )}
      </div>

      {/* Photo analysée (miniature) */}
      {preview && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: 'var(--color-bg-card)', border: '1px solid var(--color-border)', borderRadius: 10 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={preview} alt="Photo analysée" style={{ width: 60, height: 44, objectFit: 'cover', borderRadius: 6, flexShrink: 0 }} />
          <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>
            <strong style={{ color: 'var(--color-text)' }}>Photo analysée</strong> — identification via Claude Vision
          </div>
        </div>
      )}

      {/* Actions à faire */}
      {diagnostic.actions.length > 0 && (
        <div style={{ background: 'var(--color-bg-card)', border: '1.5px solid var(--color-border)', borderRadius: 12, padding: '18px 20px' }}>
          <div style={{ fontWeight: 700, marginBottom: 14, fontSize: '0.97rem' }}>📋 Que faire maintenant ?</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {diagnostic.actions.map((action, i) => (
              <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <div style={{
                  width: 26, height: 26, borderRadius: '50%', flexShrink: 0,
                  background: 'var(--color-primary)', color: '#0a1628',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 800, fontSize: '0.78rem',
                }}>
                  {i + 1}
                </div>
                <p style={{ margin: '2px 0 0', fontSize: '0.88rem', lineHeight: 1.55, color: 'var(--color-text)' }}>
                  {action}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Lien article */}
      {diagnostic.article_lien && (
        <a
          href={diagnostic.article_lien}
          style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '14px 18px', borderRadius: 12, textDecoration: 'none',
            background: 'var(--color-bg-card)', border: '1.5px solid var(--color-border)',
            color: 'var(--color-text)',
          }}
        >
          <span style={{ fontSize: '1.4rem' }}>📖</span>
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>En savoir plus sur Moteurs.com</div>
            <div style={{ fontSize: '0.78rem', color: 'var(--color-primary)', marginTop: 2 }}>
              Voir nos articles liés à ce problème →
            </div>
          </div>
        </a>
      )}

      {/* Boutons fin */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <button onClick={onReset} style={{ ...btnPrimary, flex: 1 }}>
          📸 Scanner une autre photo
        </button>
      </div>

      <p style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', margin: 0, lineHeight: 1.5 }}>
        Ce diagnostic est fourni à titre indicatif par une IA et ne remplace pas l&apos;avis d&apos;un professionnel qualifié. En cas de danger immédiat, garez-vous en sécurité et appelez votre assistance routière.
      </p>
    </div>
  )
}

