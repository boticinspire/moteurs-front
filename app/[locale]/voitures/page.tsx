import type { Metadata } from 'next'
import { Link } from '@/i18n/navigation'
import { getVoituresIndex, consoReelle100 } from '@/lib/voitures'

export const revalidate = 86400

export const metadata: Metadata = {
  title: { absolute: 'Catalogue voitures électriques : autonomie, recharge & fiches techniques | Moteurs.com' },
  description:
    'Toutes les voitures électriques par modèle : autonomie réelle, consommation, puissance de charge et temps de recharge estimé. Comparez et calculez votre coût.',
  alternates: { canonical: 'https://moteurs.com/voitures' },
}

export default async function VoituresIndexPage() {
  const modeles = await getVoituresIndex()

  // Regroupe par marque pour l'affichage
  const parMarque = new Map<string, typeof modeles>()
  for (const m of modeles) {
    const arr = parMarque.get(m.make) ?? []
    arr.push(m)
    parMarque.set(m.make, arr)
  }
  const marques = [...parMarque.keys()].sort((a, b) => a.localeCompare(b))

  return (
    <main style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 20px 64px' }}>
      <h1 style={{ fontSize: '1.9rem', lineHeight: 1.2, marginBottom: 8 }}>
        Voitures électriques — autonomie, recharge & fiches techniques
      </h1>
      <p style={{ color: 'var(--color-text-muted)', maxWidth: 760, marginBottom: 28 }}>
        {modeles.length} modèles électriques avec autonomie réelle estimée, puissance de charge et
        temps de recharge. Choisissez un modèle pour sa fiche détaillée, puis calculez son coût ou
        son trajet.
      </p>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 28 }}>
        <Link href="/voitures/choisir" style={{ padding: '10px 16px', borderRadius: 10, border: '1.5px solid var(--color-primary)', background: 'var(--color-primary)', color: '#0a1628', textDecoration: 'none', fontWeight: 700, fontSize: 14 }}>
          🧭 Quelle voiture pour moi ?
        </Link>
        <Link href="/voitures/comparer" style={{ padding: '10px 16px', borderRadius: 10, border: '1.5px solid var(--color-primary)', color: 'var(--color-primary)', textDecoration: 'none', fontWeight: 600, fontSize: 14 }}>
          ⚖️ Comparer 2-3 modèles
        </Link>
        <Link href="/voitures/palmares" style={{ padding: '10px 16px', borderRadius: 10, border: '1.5px solid var(--color-primary)', color: 'var(--color-primary)', textDecoration: 'none', fontWeight: 600, fontSize: 14 }}>
          🏆 Palmarès
        </Link>
      </div>

      {marques.map((marque) => (
        <section key={marque} style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: '1.15rem', marginBottom: 12, borderBottom: '1px solid var(--color-border)', paddingBottom: 6 }}>
            {marque}
          </h2>
          <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))' }}>
            {(parMarque.get(marque) ?? []).map((m) => {
              const conso = consoReelle100(m)
              return (
                <Link
                  key={m.slug}
                  href={`/voitures/${m.slug}`}
                  style={{
                    display: 'block', padding: '14px 16px', borderRadius: 12,
                    border: '1.5px solid var(--color-border)', background: 'var(--color-bg-card)',
                    textDecoration: 'none', color: 'var(--color-text)',
                  }}
                >
                  <div style={{ fontWeight: 700, marginBottom: 4 }}>{m.model}</div>
                  <div style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>
                    {m.battMax ? `${m.battMax} kWh` : '—'}
                    {m.wltpMax ? ` · ${m.wltpMax} km WLTP` : ''}
                    {m.dcMax ? ` · ${m.dcMax} kW DC` : ''}
                  </div>
                  {conso && (
                    <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 2 }}>
                      ~{conso} kWh/100 km réel
                    </div>
                  )}
                </Link>
              )
            })}
          </div>
        </section>
      ))}

      <p style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 28 }}>
        Données véhicules : OpenEV Data (licence CDLA-Permissive-2.0). Autonomies et temps de
        recharge estimés — voir le détail de chaque fiche.
      </p>
    </main>
  )
}
