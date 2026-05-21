/**
 * Bloc "réglementation par pays traversé" pour /trajet/[slug].
 * Server component — affiche une carte par pays avec vignette, équipements,
 * vitesses, ZFE majeures, particularités, numéros d'urgence.
 */

import { PAYS_LEGAL, type InfoPays, type PaysCode } from '@/lib/legal-pays'

interface Props {
  paysTraverses: PaysCode[]
}

export default function BlocLegal({ paysTraverses }: Props) {
  const pays = paysTraverses.map(c => PAYS_LEGAL[c]).filter(Boolean)

  return (
    <section style={{ marginTop: 48, marginBottom: 36 }}>
      <h2 style={{ fontSize: '1.2rem', marginBottom: 8 }}>
        Réglementation par pays traversé
      </h2>
      <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', marginBottom: 22, lineHeight: 1.5 }}>
        Vignettes, équipements obligatoires, vitesses, ZFE et alcoolémie pour chaque pays sur votre trajet.
        Données vérifiées en mai 2026 — un lien officiel est fourni pour chaque pays.
      </p>

      <div style={{ display: 'grid', gap: 18, gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))' }}>
        {pays.map(p => <CartePays key={p.code} pays={p} />)}
      </div>
    </section>
  )
}

function CartePays({ pays }: { pays: InfoPays }) {
  return (
    <article style={{
      background: 'var(--color-bg-card)',
      border: '1px solid var(--color-border)',
      borderRadius: 12,
      padding: 18,
    }}>
      <header style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14, paddingBottom: 12, borderBottom: '1px solid var(--color-border)' }}>
        <span style={{ fontSize: '1.8rem' }}>{pays.drapeau}</span>
        <div>
          <h3 style={{ fontSize: '1.05rem', margin: 0 }}>{pays.nom}</h3>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
            Urgence&nbsp;: <strong>{pays.urgence}</strong>
            {pays.depannage && <> · Dépannage&nbsp;: <strong>{pays.depannage}</strong></>}
          </div>
        </div>
      </header>

      {/* Vignette */}
      {pays.vignette.required ? (
        <div style={ligneStyle}>
          <span style={iconStyle}>🎫</span>
          <div>
            <strong>Vignette autoroute obligatoire</strong>
            <div style={subStyle}>
              {pays.vignette.prix_courte != null && (
                <>{pays.vignette.prix_courte} € ({pays.vignette.duree_courte})</>
              )}
              {pays.vignette.prix_courte == null && pays.vignette.prix_annuelle != null && (
                <>{pays.vignette.prix_annuelle} € (annuelle)</>
              )}
              {pays.vignette.url && (
                <> · <a href={pays.vignette.url} target="_blank" rel="noopener noreferrer" style={lienStyle}>achat officiel ↗</a></>
              )}
            </div>
            {pays.vignette.note && <div style={subStyle}>{pays.vignette.note}</div>}
          </div>
        </div>
      ) : (
        <div style={ligneStyle}>
          <span style={iconStyle}>✅</span>
          <div>
            <strong>Pas de vignette</strong>
            {pays.vignette.note && <div style={subStyle}>{pays.vignette.note}</div>}
          </div>
        </div>
      )}

      {/* Vitesses */}
      <div style={ligneStyle}>
        <span style={iconStyle}>🚗</span>
        <div>
          <strong>Vitesses maximales</strong>
          <div style={subStyle}>
            Ville {pays.vitesses.ville} · Route {pays.vitesses.route} · Autoroute {pays.vitesses.autoroute} km/h
            {pays.vitesses.autoroute_pluie && <> ({pays.vitesses.autoroute_pluie} sous la pluie)</>}
          </div>
        </div>
      </div>

      {/* Alcoolémie */}
      <div style={ligneStyle}>
        <span style={iconStyle}>🍷</span>
        <div>
          <strong>Alcoolémie max</strong>
          <div style={subStyle}>
            {pays.alcool_max.toFixed(1)} g/L
            {pays.alcool_jeune != null && pays.alcool_jeune < pays.alcool_max && (
              <> · jeunes conducteurs&nbsp;: {pays.alcool_jeune.toFixed(1)} g/L</>
            )}
          </div>
        </div>
      </div>

      {/* Équipements */}
      <div style={ligneStyle}>
        <span style={iconStyle}>🧰</span>
        <div>
          <strong>Équipement obligatoire</strong>
          <ul style={{ ...subStyle, margin: '4px 0 0 0', paddingLeft: 18 }}>
            {pays.equipements.map((e, i) => <li key={i}>{e}</li>)}
          </ul>
        </div>
      </div>

      {/* ZFE */}
      {pays.zfe.length > 0 && (
        <div style={ligneStyle}>
          <span style={iconStyle}>🏙️</span>
          <div>
            <strong>ZFE / LEZ</strong>
            <div style={subStyle}>
              {pays.zfe.map((z, i) => (
                <span key={i}>
                  {z.ville}
                  {z.vignette_requise && <em style={{ color: 'var(--color-text-muted)' }}> ({z.vignette_requise})</em>}
                  {i < pays.zfe.length - 1 && ' · '}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Particularités */}
      <div style={ligneStyle}>
        <span style={iconStyle}>💡</span>
        <div>
          <strong>À savoir</strong>
          <ul style={{ ...subStyle, margin: '4px 0 0 0', paddingLeft: 18 }}>
            {pays.particularites.map((p, i) => <li key={i}>{p}</li>)}
          </ul>
        </div>
      </div>

      <a href={pays.info_officielle_url} target="_blank" rel="noopener noreferrer" style={{
        display: 'inline-block', marginTop: 10, fontSize: '0.8rem',
        color: 'var(--color-primary)', textDecoration: 'none',
      }}>
        Source officielle ↗
      </a>
    </article>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const ligneStyle: React.CSSProperties = {
  display: 'flex', gap: 12, alignItems: 'flex-start',
  padding: '10px 0', borderTop: '1px solid var(--color-border)',
  fontSize: '0.9rem', lineHeight: 1.5,
}
const iconStyle: React.CSSProperties = { fontSize: '1.1rem', flexShrink: 0, marginTop: 1 }
const subStyle: React.CSSProperties  = { fontSize: '0.84rem', color: 'var(--color-text-muted)', marginTop: 2 }
const lienStyle: React.CSSProperties = { color: 'var(--color-primary)', textDecoration: 'none' }
