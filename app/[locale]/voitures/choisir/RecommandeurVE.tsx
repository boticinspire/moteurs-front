'use client'

/**
 * Recommandeur « quel véhicule électrique pour moi ? »
 * Charge le catalogue (marques EU), applique des filtres + un score pondéré
 * selon l'usage, et propose le top 5. Tout côté client.
 */
import { useEffect, useMemo, useState } from 'react'
import { consoReelleKwh100, type EvModeleLite } from '@/components/SelecteurModele'

type Modele = EvModeleLite
type Usage = 'ville' | 'mixte' | 'longs'

// Doit produire le MÊME slug que voitureSlug() de lib/voitures (page /voitures/[slug]).
function modeleSlug(make: string, model: string): string {
  return `${make}-${model}`
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

function dedupe(list: Modele[]): Modele[] {
  const best = new Map<string, Modele>()
  for (const m of list) {
    const key = `${m.make}|${m.model}`
    const cur = best.get(key)
    if (!cur || (m.wltp_km ?? 0) > (cur.wltp_km ?? 0)) best.set(key, m)
  }
  return [...best.values()]
}

export default function RecommandeurVE() {
  const [all, setAll] = useState<Modele[]>([])
  const [loading, setLoading] = useState(true)
  const [autonomieMin, setAutonomieMin] = useState(350)
  const [places, setPlaces] = useState<0 | 5 | 7>(0)
  const [usage, setUsage] = useState<Usage>('mixte')

  useEffect(() => {
    fetch('/api/ev-modeles?marche=eu&limit=400')
      .then((r) => r.json())
      .then((j) => setAll(dedupe(j.modeles || [])))
      .catch(() => setAll([]))
      .finally(() => setLoading(false))
  }, [])

  const resultats = useMemo(() => {
    if (all.length === 0) return []
    // poids selon usage
    const poids =
      usage === 'ville' ? { auto: 0.2, charge: 0.1, conso: 0.7 }
      : usage === 'longs' ? { auto: 0.5, charge: 0.35, conso: 0.15 }
      : { auto: 0.4, charge: 0.25, conso: 0.35 }

    const elig = all.filter((m) => {
      if ((m.wltp_km ?? 0) < autonomieMin) return false
      if (places && m.seats != null && m.seats < places) return false
      return true
    })
    if (elig.length === 0) return []

    const wlts = elig.map((m) => m.wltp_km ?? 0)
    const dcs = elig.map((m) => m.dc_kw ?? 0)
    const cons = elig.map((m) => consoReelleKwh100(m) ?? 99)
    const maxW = Math.max(...wlts, 1), maxD = Math.max(...dcs, 1)
    const minC = Math.min(...cons), maxC = Math.max(...cons)
    const spanC = maxC - minC || 1

    return elig
      .map((m) => {
        const sAuto = (m.wltp_km ?? 0) / maxW
        const sCharge = (m.dc_kw ?? 0) / maxD
        const c = consoReelleKwh100(m) ?? maxC
        const sConso = 1 - (c - minC) / spanC // plus sobre = meilleur
        const score = poids.auto * sAuto + poids.charge * sCharge + poids.conso * sConso
        return { m, score }
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
  }, [all, autonomieMin, places, usage])

  const card: React.CSSProperties = { padding: '12px 16px', borderRadius: 12, border: '1.5px solid var(--color-border)', background: 'var(--color-bg-card)' }

  return (
    <div>
      {/* Questions */}
      <div style={{ display: 'grid', gap: 18, gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', marginBottom: 28 }}>
        <div style={card}>
          <label style={{ fontSize: 13, fontWeight: 600 }}>Autonomie minimale souhaitée</label>
          <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--color-primary)', margin: '4px 0' }}>{autonomieMin} km</div>
          <input type="range" min={200} max={600} step={25} value={autonomieMin} onChange={(e) => setAutonomieMin(Number(e.target.value))} style={{ width: '100%' }} />
        </div>
        <div style={card}>
          <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 8 }}>Places</label>
          {([[0, 'Peu importe'], [5, '5+ places'], [7, '7 places']] as const).map(([v, l]) => (
            <button key={v} type="button" onClick={() => setPlaces(v)} style={{
              marginRight: 6, marginBottom: 6, padding: '6px 12px', borderRadius: 999, cursor: 'pointer', fontSize: 13,
              border: places === v ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
              background: places === v ? 'var(--color-primary)' : 'transparent',
              color: places === v ? '#0a1628' : 'var(--color-text)',
            }}>{l}</button>
          ))}
        </div>
        <div style={card}>
          <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 8 }}>Usage principal</label>
          {([['ville', 'Ville / quotidien'], ['mixte', 'Mixte'], ['longs', 'Longs trajets']] as const).map(([v, l]) => (
            <button key={v} type="button" onClick={() => setUsage(v)} style={{
              marginRight: 6, marginBottom: 6, padding: '6px 12px', borderRadius: 999, cursor: 'pointer', fontSize: 13,
              border: usage === v ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
              background: usage === v ? 'var(--color-primary)' : 'transparent',
              color: usage === v ? '#0a1628' : 'var(--color-text)',
            }}>{l}</button>
          ))}
        </div>
      </div>

      {/* Résultats */}
      {loading ? (
        <p style={{ color: 'var(--color-text-muted)' }}>Chargement du catalogue…</p>
      ) : resultats.length === 0 ? (
        <p style={{ color: 'var(--color-text-muted)' }}>Aucun modèle ne correspond — assouplissez l’autonomie ou les places.</p>
      ) : (
        <div style={{ display: 'grid', gap: 12 }}>
          {resultats.map(({ m }, i) => {
            const conso = consoReelleKwh100(m)
            return (
              <a key={m.id} href={`/voitures/${modeleSlug(m.make, m.model)}`} style={{ ...card, display: 'flex', alignItems: 'center', gap: 14, textDecoration: 'none', color: 'var(--color-text)' }}>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: i === 0 ? 'var(--color-primary)' : 'var(--color-text-muted)', minWidth: 28 }}>{i + 1}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700 }}>{m.make} {m.model}{i === 0 && <span style={{ color: 'var(--color-primary)', fontSize: 12, fontWeight: 600 }}> · recommandé</span>}</div>
                  <div style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>
                    {m.wltp_km} km WLTP · {m.batt_kwh_net ?? m.batt_kwh_gross} kWh · {m.dc_kw} kW DC{conso ? ` · ~${conso} kWh/100 km` : ''}
                  </div>
                </div>
                <div style={{ color: 'var(--color-primary)', fontSize: 13 }}>Voir →</div>
              </a>
            )
          })}
        </div>
      )}
      <p style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 20 }}>
        Recommandation indicative, calculée sur les données techniques du catalogue (autonomie,
        recharge, consommation). Le prix n’est pas pris en compte.
      </p>
    </div>
  )
}
