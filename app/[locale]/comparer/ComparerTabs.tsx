'use client'

/**
 * ComparerTabs — Moteurs.com
 * Outil de coût unifié (Phase 2 refonte). Réunit en 3 onglets les anciens outils
 * /comparer, /assistance/couts et /outils/tco-particulier (qui redirigent ici).
 * Chaque panneau ne se monte qu'à l'activation → un seul H1 dans le HTML indexé
 * (l'onglet par défaut "motorisations" n'a pas de H1 propre, il utilise celui de la page).
 */

import { useEffect, useState } from 'react'
import ComparateurTCO from './ComparateurTCO'
import AssistanceCouts from '../assistance/couts/AssistanceCouts'
import TCOParticulierContent from '../outils/tco-particulier/TCOParticulierContent'

export type ComparerMode = 'motorisations' | 'mensuel' | 'rentabilite'

const TABS: { id: ComparerMode; label: string; sub: string }[] = [
  { id: 'motorisations', label: 'Comparer les motorisations', sub: 'Diesel, essence, élec, hybride par segment' },
  { id: 'mensuel', label: 'Le coût de mon véhicule', sub: 'Budget mensuel réel + alternatives' },
  { id: 'rentabilite', label: 'Rentabilité VE vs thermique', sub: 'Point de bascule sur 10 ans' },
]

const CSS = `
.cmp-tabs{--line:var(--color-border);--accent:var(--color-primary);--soft:var(--color-text-soft);--faint:var(--color-text-muted);
 display:flex;gap:8px;flex-wrap:wrap;margin:0 0 22px}
.cmp-tabs button{flex:1 1 220px;text-align:left;cursor:pointer;font:inherit;
 background:var(--color-bg-card);border:1.5px solid var(--line);border-radius:12px;padding:12px 14px;transition:border-color .15s,box-shadow .15s}
.cmp-tabs button:hover{border-color:var(--accent)}
.cmp-tabs button.on{border-color:var(--accent);box-shadow:0 0 0 1px var(--accent)}
.cmp-tabs .t{display:block;font-weight:800;font-size:.95rem;color:var(--color-text)}
.cmp-tabs .s{display:block;font-size:.78rem;color:var(--faint);margin-top:2px}
`

export default function ComparerTabs({ initialMode = 'motorisations' }: { initialMode?: ComparerMode }) {
  const [mode, setMode] = useState<ComparerMode>(initialMode)

  // Garde l'URL partageable sans recharger (deep-link ?mode=…).
  useEffect(() => {
    const url = new URL(window.location.href)
    if (mode === 'motorisations') url.searchParams.delete('mode')
    else url.searchParams.set('mode', mode)
    window.history.replaceState(null, '', url.toString())
  }, [mode])

  return (
    <div>
      <style>{CSS}</style>
      <div className="cmp-tabs" role="tablist" aria-label="Mode de comparaison">
        {TABS.map((tb) => (
          <button
            key={tb.id}
            role="tab"
            aria-selected={mode === tb.id}
            className={mode === tb.id ? 'on' : ''}
            onClick={() => setMode(tb.id)}
          >
            <span className="t">{tb.label}</span>
            <span className="s">{tb.sub}</span>
          </button>
        ))}
      </div>

      {mode === 'motorisations' && <ComparateurTCO />}
      {mode === 'mensuel' && <AssistanceCouts />}
      {mode === 'rentabilite' && <TCOParticulierContent />}
    </div>
  )
}
