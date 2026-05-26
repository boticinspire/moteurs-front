import { supabase, FLAGS, type Cible } from '@/lib/supabase'

/**
 * Section serveur : 3 derniers décryptages publiés pour une cible donnée.
 * Inclut les articles "mixte" qui apparaissent dans les 2 onglets.
 *
 * Usage :
 *   <DerniersDecryptages cible="particulier" />
 *   <DerniersDecryptages cible="pro" />
 */
export default async function DerniersDecryptages({ cible }: { cible: Exclude<Cible, 'mixte'> }) {
  const { data: articles } = await supabase
    .from('articles')
    .select('slug, titre_provisoire, resume_50mots, pays_cible, cible, published_at')
    .eq('etat_code', 'PUBLIE')
    .in('cible', [cible, 'mixte'])
    .order('published_at', { ascending: false })
    .limit(3)

  if (!articles || articles.length === 0) return null

  const titre = cible === 'particulier'
    ? 'Nos derniers décryptages pour vous'
    : 'Nos derniers décryptages pour les pros'
  const soustitre = cible === 'particulier'
    ? 'Économie €/mois, aides 2026, recharge à domicile, ZFE : on traduit l’actu en impact concret pour votre foyer.'
    : 'TCO, déductibilité, suramortissement, leasing pro : on traduit l’actu en arbitrage chiffré pour votre flotte.'
  const ctaLabel = cible === 'particulier'
    ? 'Voir tous les décryptages particulier'
    : 'Voir tous les décryptages pro'

  return (
    <section style={{ padding: '64px 0', background: 'var(--color-bg-alt)' }}>
      <div className="container">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 16, flexWrap: 'wrap', marginBottom: 24 }}>
          <div>
            <h2 style={{ marginBottom: 6 }}>{titre}</h2>
            <p style={{ color: 'var(--color-text-soft)', maxWidth: 640, margin: 0 }}>{soustitre}</p>
          </div>
          <a href={`/articles?cible=${cible}`} className="btn btn-secondary" style={{ whiteSpace: 'nowrap' }}>
            {ctaLabel} &rarr;
          </a>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 18 }}>
          {articles.map((a) => {
            const date = a.published_at
              ? new Date(a.published_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
              : ''
            const pays = (a.pays_cible as string) || 'FR'
            return (
              <a
                key={a.slug}
                href={`/article/${a.slug}`}
                style={{
                  display: 'flex', flexDirection: 'column', gap: 10,
                  padding: '20px 22px',
                  background: 'white',
                  border: '1px solid var(--color-border)',
                  borderRadius: 12,
                  textDecoration: 'none',
                  color: 'inherit',
                  transition: 'all 0.18s',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.78rem', color: 'var(--color-text-soft)' }}>
                  <span>{FLAGS[pays] ?? '🌍'} {pays}</span>
                  {date && <><span>·</span><span>{date}</span></>}
                  {a.cible === 'mixte' && (
                    <><span>·</span><span style={{ fontWeight: 600 }}>Particulier + Pro</span></>
                  )}
                </div>
                <h3 style={{ fontSize: '1.05rem', lineHeight: 1.3, margin: 0 }}>
                  {a.titre_provisoire}
                </h3>
                {a.resume_50mots && (
                  <p style={{ fontSize: '0.88rem', color: 'var(--color-text-soft)', lineHeight: 1.55, margin: 0 }}>
                    {a.resume_50mots.length > 130 ? a.resume_50mots.slice(0, 127) + '…' : a.resume_50mots}
                  </p>
                )}
                <div style={{ marginTop: 'auto', fontSize: '0.82rem', color: 'var(--color-primary)', fontWeight: 600 }}>
                  Lire le décryptage &rarr;
                </div>
              </a>
            )
          })}
        </div>
      </div>
    </section>
  )
}
