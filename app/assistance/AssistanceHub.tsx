'use client'

import { useState, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

// ─── Modules ──────────────────────────────────────────────────────────────────

interface Module {
  id:         string
  icon:       string
  label:      string
  desc:       string
  detail:     string
  href:       string
  disponible: boolean
  couleur:    string
}

const MODULES: Module[] = [
  {
    id: 'recharge', icon: '⚡', label: 'Assistance Recharge',
    desc: 'VE · Réseau · Domicile',
    detail: 'Combien coûte une recharge ? Quelle borne installer ? Réseau public vs domicile.',
    href: '/assistance/recharge', disponible: false, couleur: '#059669',
  },
  {
    id: 'vacances', icon: '🏖️', label: 'Assistance Vacances',
    desc: 'Budget · Trajet · Trafic',
    detail: 'Budget total voyage, itinéraire économique, alertes trafic, bagages, hôtels avec borne.',
    href: '/assistant-vacances', disponible: true, couleur: '#0ea5e9',
  },
  {
    id: 'couts', icon: '💰', label: 'Assistance Coûts',
    desc: 'TCO · Leasing · Mensuel',
    detail: 'Votre voiture vous coûte combien par mois, par km ? Économie potentielle si vous changez.',
    href: '/assistance/couts', disponible: true, couleur: '#f59e0b',
  },
  {
    id: 'panne', icon: '🚨', label: 'Assistance Panne',
    desc: 'VE · Dépannage · Urgence',
    detail: 'Que faire en cas de panne sur autoroute ? Spécificités VE. Contacts utiles par pays.',
    href: '/assistance/panne', disponible: false, couleur: '#ef4444',
  },
  {
    id: 'achat', icon: '🚗', label: 'Assistance Achat',
    desc: 'Budget · Aides · Segment',
    detail: 'Quel véhicule selon votre budget, vos km, votre usage ? Comparatif motorisations + aides.',
    href: '/assistance/achat', disponible: false, couleur: '#8b5cf6',
  },
  {
    id: 'admin', icon: '📋', label: 'Assistance Admin.',
    desc: 'Carte grise · ZFE · Bonus',
    detail: 'Calculez vos frais d\'immatriculation, vérifiez votre éligibilité aux ZFE, obtenez vos aides.',
    href: '/assistance/admin', disponible: false, couleur: '#6366f1',
  },
]

// ─── Routing intelligent ──────────────────────────────────────────────────────

interface RoutingResult {
  module: Module
  confiance: number
}

const ROUTING_PATTERNS: { patterns: string[]; moduleId: string }[] = [
  { moduleId: 'vacances',  patterns: ['vacances', 'trajet', 'péages', 'autoroute', 'voyage', 'partir', 'barcelone', 'nice', 'espagne', 'italie', 'routier'] },
  { moduleId: 'couts',     patterns: ['coût', 'cout', 'cher', 'budget', 'mensuel', 'mois', 'leasing', 'loa', 'assurance', 'tco', 'dépense', 'paie', 'paye', 'économie', 'economie', 'rentable', 'combien', 'facture', 'entretien', 'crédit', 'credit'] },
  { moduleId: 'recharge',  patterns: ['recharge', 'charge', 'borne', 'kwh', 'autonomie', 'wallbox', 'irve', 'superchargeur', 'ionity', 'domicile', 'chargeur'] },
  { moduleId: 'panne',     patterns: ['panne', 'dépannage', 'dépanner', 'tomber', 'en rade', 'secours', 'accident', 'garage', 'urgence'] },
  { moduleId: 'achat',     patterns: ['acheter', 'achat', 'choisir', 'laquelle', 'comparaison', 'modèle', 'quelle voiture', 'nouveau', 'occasion', 'lequel'] },
  { moduleId: 'admin',     patterns: ['carte grise', 'immatriculation', 'bonus', 'aide', 'prime', 'zfe', 'malus', 'fiscalité', 'taxe', 'conversion', 'déductible'] },
]

function router(question: string): RoutingResult | null {
  if (!question.trim()) return null
  const q = question.toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')  // enlève les accents pour matching plus souple

  let best: { moduleId: string; score: number } | null = null

  for (const route of ROUTING_PATTERNS) {
    const score = route.patterns.filter(p =>
      q.includes(p.normalize('NFD').replace(/[̀-ͯ]/g, ''))
    ).length
    if (score > 0 && (!best || score > best.score)) {
      best = { moduleId: route.moduleId, score }
    }
  }

  if (!best) return null
  const module = MODULES.find(m => m.id === best!.moduleId)!
  return { module, confiance: Math.min(100, best.score * 35 + 30) }
}

// ─── Exemples de questions ────────────────────────────────────────────────────

const EXEMPLES = [
  { question: 'Mon SUV diesel me coûte combien par mois ?', moduleId: 'couts' },
  { question: 'Trajet Paris-Barcelone en électrique, combien ça coûte ?', moduleId: 'vacances' },
  { question: 'Installer une borne Wallbox à domicile, quel coût ?', moduleId: 'recharge' },
  { question: 'Quel VE acheter pour 35 000 € avec le bonus ?', moduleId: 'achat' },
  { question: 'Comment obtenir la prime à la conversion ?', moduleId: 'admin' },
  { question: 'Panne sur autoroute avec un VE, que faire ?', moduleId: 'panne' },
]

// ─── Composant ────────────────────────────────────────────────────────────────

export default function AssistanceHub() {
  const [question, setQuestion]   = useState('')
  const [suggestion, setSuggestion] = useState<RoutingResult | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const nav = useRouter()

  const handleChange = (val: string) => {
    setQuestion(val)
    setSuggestion(val.length > 4 ? router(val) : null)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (suggestion?.module.disponible) {
      nav.push(suggestion.module.href)
    } else if (suggestion) {
      setSuggestion(s => s)  // garde la suggestion affichée
    }
  }

  const handleExemple = (q: string) => {
    setQuestion(q)
    setSuggestion(router(q))
    inputRef.current?.focus()
  }

  return (
    <div>
      {/* ── Barre de question ── */}
      <form onSubmit={handleSubmit} style={{ marginBottom: 12 }}>
        <div style={{ position: 'relative', maxWidth: 640, margin: '0 auto' }}>
          <input
            ref={inputRef}
            type="text"
            value={question}
            onChange={e => handleChange(e.target.value)}
            placeholder="Ex : Mon diesel me coûte combien par mois ?"
            style={{
              width: '100%', padding: '16px 54px 16px 20px', borderRadius: 14,
              fontSize: '1rem', border: '2px solid var(--color-border)',
              background: 'white', color: 'var(--color-text)',
              outline: 'none', boxShadow: '0 4px 16px rgba(10,30,60,0.08)',
              boxSizing: 'border-box', transition: 'border-color .15s',
            }}
            onFocus={e => (e.target.style.borderColor = 'var(--color-primary)')}
            onBlur={e => (e.target.style.borderColor = 'var(--color-border)')}
          />
          <button type="submit" style={{
            position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
            width: 38, height: 38, borderRadius: 10, border: 'none', cursor: 'pointer',
            background: 'var(--color-primary)', color: 'white', fontSize: '1.1rem',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>→</button>
        </div>
      </form>

      {/* ── Suggestion de routing ── */}
      {suggestion && (
        <div style={{
          maxWidth: 640, margin: '0 auto 28px',
          background: suggestion.module.disponible ? `${suggestion.module.couleur}12` : 'rgba(0,0,0,0.04)',
          border: `1.5px solid ${suggestion.module.disponible ? suggestion.module.couleur + '40' : 'var(--color-border)'}`,
          borderRadius: 12, padding: '12px 18px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: '1.5rem' }}>{suggestion.module.icon}</span>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{suggestion.module.label}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--color-text-soft)' }}>
                {suggestion.module.disponible ? 'Disponible maintenant' : 'Bientôt disponible'}
              </div>
            </div>
          </div>
          {suggestion.module.disponible ? (
            <Link href={suggestion.module.href} style={{
              padding: '8px 18px', borderRadius: 8, fontWeight: 700, fontSize: '0.88rem',
              background: suggestion.module.couleur, color: 'white', textDecoration: 'none',
              whiteSpace: 'nowrap',
            }}>
              Ouvrir →
            </Link>
          ) : (
            <span style={{
              padding: '6px 14px', borderRadius: 8, fontWeight: 600, fontSize: '0.8rem',
              background: 'var(--color-bg-alt)', color: 'var(--color-text-soft)', whiteSpace: 'nowrap',
            }}>
              Bientôt
            </span>
          )}
        </div>
      )}

      {/* ── Exemples ── */}
      {!question && (
        <div style={{ maxWidth: 640, margin: '0 auto 44px', display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
          {EXEMPLES.map(ex => (
            <button key={ex.question} onClick={() => handleExemple(ex.question)} style={{
              padding: '7px 14px', borderRadius: 20, fontSize: '0.8rem', cursor: 'pointer',
              background: 'var(--color-bg-alt)', color: 'var(--color-text-soft)',
              border: '1px solid var(--color-border)', transition: 'all .15s',
            }}>
              {ex.question}
            </button>
          ))}
        </div>
      )}

      {/* ── Grille des 6 modules ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 18 }}>
        {MODULES.map(m => (
          <ModuleCard key={m.id} module={m} />
        ))}
      </div>

      {/* ── Légende ── */}
      <div style={{ marginTop: 32, display: 'flex', gap: 20, justifyContent: 'center', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.82rem', color: 'var(--color-text-soft)' }}>
          <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#059669', display: 'inline-block' }} />
          Disponible maintenant
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.82rem', color: 'var(--color-text-soft)' }}>
          <span style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--color-border)', display: 'inline-block' }} />
          Bientôt disponible
        </div>
      </div>
    </div>
  )
}

// ─── Carte module ──────────────────────────────────────────────────────────────

function ModuleCard({ module: m }: { module: Module }) {
  const card = (
    <div style={{
      background: 'white',
      border: m.disponible ? `2px solid ${m.couleur}50` : '1.5px solid var(--color-border)',
      borderRadius: 14, padding: '22px 22px 18px',
      display: 'flex', flexDirection: 'column', gap: 12, height: '100%',
      cursor: m.disponible ? 'pointer' : 'default',
      transition: 'transform .15s, box-shadow .15s',
      position: 'relative',
      opacity: m.disponible ? 1 : 0.72,
    }}>
      {/* Badge statut */}
      {m.disponible ? (
        <span style={{
          position: 'absolute', top: 14, right: 14,
          padding: '3px 10px', borderRadius: 20, fontSize: '0.7rem', fontWeight: 700,
          background: `${m.couleur}18`, color: m.couleur, border: `1px solid ${m.couleur}40`,
        }}>
          Disponible
        </span>
      ) : (
        <span style={{
          position: 'absolute', top: 14, right: 14,
          padding: '3px 10px', borderRadius: 20, fontSize: '0.7rem', fontWeight: 600,
          background: 'var(--color-bg-alt)', color: 'var(--color-text-soft)',
        }}>
          Bientôt
        </span>
      )}

      {/* Icône */}
      <div style={{
        width: 48, height: 48, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: m.disponible ? `${m.couleur}14` : 'var(--color-bg-alt)',
        fontSize: '1.6rem',
      }}>
        {m.icon}
      </div>

      {/* Titre + desc */}
      <div>
        <div style={{ fontWeight: 700, fontSize: '1.02rem', marginBottom: 4, color: 'var(--color-text)' }}>
          {m.label}
        </div>
        <div style={{ fontSize: '0.82rem', color: 'var(--color-text-soft)', marginBottom: 8 }}>
          {m.desc}
        </div>
        <p style={{ fontSize: '0.84rem', color: 'var(--color-text-soft)', margin: 0, lineHeight: 1.55 }}>
          {m.detail}
        </p>
      </div>

      {/* CTA */}
      {m.disponible && (
        <div style={{ marginTop: 'auto', paddingTop: 8 }}>
          <span style={{ fontSize: '0.88rem', fontWeight: 700, color: m.couleur }}>
            Démarrer →
          </span>
        </div>
      )}
    </div>
  )

  if (m.disponible) {
    return <Link href={m.href} style={{ textDecoration: 'none' }}>{card}</Link>
  }
  return card
}
