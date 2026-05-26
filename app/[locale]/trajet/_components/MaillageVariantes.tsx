/**
 * Maillage interne SEO : pour une route donnée, affiche les liens vers
 * les variantes "soeurs" (autres formules de la même route) + un lien
 * vers la page mère + 4-5 autres trajets thématiquement proches.
 * Server component.
 */

import {
  TRAJETS_SEO,
  type TrajetSEO,
  type VarianteThematique,
  VARIANTES_LABELS,
  slugVille,
} from '@/lib/trajets-seo'

interface Props {
  trajet: TrajetSEO
  /** Slug de variante actuellement consultée, ou undefined si on est sur la page mère */
  varianteActive?: string
}

export default function MaillageVariantes({ trajet, varianteActive }: Props) {
  // 1. Variantes thématiques de cette route
  const themes = trajet.variantes_thematiques.map(v => ({
    href:  `/trajet/${trajet.slug}/${v}`,
    label: VARIANTES_LABELS[v as VarianteThematique].label,
    emoji: VARIANTES_LABELS[v as VarianteThematique].emoji,
    slug:  v as string,
  }))

  // 2. Villes alt → variantes "depuis-[ville]"
  const villes = trajet.villes_depart_alt.map(v => {
    const slug = `depuis-${slugVille(v.ville)}`
    return {
      href:  `/trajet/${trajet.slug}/${slug}`,
      label: `depuis ${v.ville}`,
      emoji: '📍',
      slug,
    }
  })

  // 3. Trajets proches : même destination_pays, ou même origine_pays
  const proches = TRAJETS_SEO.filter(t =>
    t.slug !== trajet.slug &&
    (t.destination.pays === trajet.destination.pays || t.origine.pays === trajet.origine.pays)
  ).slice(0, 4)

  return (
    <section style={{ marginTop: 48, marginBottom: 36 }}>
      <h2 style={{ fontSize: '1.2rem', marginBottom: 14 }}>
        Affiner ce trajet
      </h2>

      {/* Lien vers la page mère si on est sur une variante */}
      {varianteActive && (
        <div style={{ marginBottom: 14 }}>
          <a href={`/trajet/${trajet.slug}`} style={lienMere}>
            ← Retour à la vue complète {trajet.titre_court}
          </a>
        </div>
      )}

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 24 }}>
        {[...themes, ...villes].map(v => (
          <a
            key={v.slug}
            href={v.href}
            style={{
              ...chipStyle,
              ...(v.slug === varianteActive ? chipStyleActive : null),
            }}
          >
            <span>{v.emoji}</span> <span>{trajet.titre_court} {v.label}</span>
          </a>
        ))}
      </div>

      {/* Trajets proches */}
      {proches.length > 0 && (
        <>
          <h3 style={{ fontSize: '1rem', marginBottom: 12, color: 'var(--color-text-muted)' }}>
            Autres trajets pouvant vous intéresser
          </h3>
          <div style={{ display: 'grid', gap: 10, gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
            {proches.map(t => (
              <a key={t.slug} href={`/trajet/${t.slug}`} style={carteProche}>
                <div style={{ fontSize: '1.4rem', marginBottom: 6 }}>{t.emoji}</div>
                <div style={{ fontWeight: 600, fontSize: '0.92rem' }}>{t.titre_court}</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', marginTop: 2 }}>
                  {t.distance_km} km · {t.region}
                </div>
              </a>
            ))}
          </div>
        </>
      )}
    </section>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const chipStyle: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 6,
  padding: '8px 14px', borderRadius: 20, fontSize: '0.85rem',
  background: 'var(--color-bg-card)',
  border: '1px solid var(--color-border)',
  color: 'var(--color-text)', textDecoration: 'none',
  transition: 'all .15s',
}

const chipStyleActive: React.CSSProperties = {
  background: 'rgba(122,240,194,0.10)',
  borderColor: 'rgba(122,240,194,0.35)',
  color: 'var(--color-primary)',
  fontWeight: 600,
}

const lienMere: React.CSSProperties = {
  display: 'inline-block', fontSize: '0.85rem',
  color: 'var(--color-primary)', textDecoration: 'none',
}

const carteProche: React.CSSProperties = {
  display: 'block', padding: 14, borderRadius: 10,
  background: 'var(--color-bg-card)', border: '1px solid var(--color-border)',
  textDecoration: 'none', color: 'var(--color-text)',
  transition: 'all .15s',
}
