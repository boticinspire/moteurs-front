import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Link from 'next/link'
import Flag from '@/components/Flag'
import {
  calculTCO, getMotors,
  MOTOR_LABELS, MOTOR_COLORS, SEGMENT_LABELS,
  fmtEur, fmtEurM,
  type Segment, type Profil, type Pays, type Motor, type TcoResult,
} from '@/lib/tco'

// ─── Mappings URL ─────────────────────────────────────────────────────────────

const PAYS_MAP: Record<string, Pays> = {
  fr: 'FR', be: 'BE', ch: 'CH', ca: 'CA',
}

const PAYS_LABELS: Record<Pays, string> = {
  FR: 'France', BE: 'Belgique', CH: 'Suisse', CA: 'Canada',
}

const PAYS_FLAGS: Record<Pays, string> = {
  FR: '🇫🇷', BE: '🇧🇪', CH: '🇨🇭', CA: '🇨🇦',
}

// Slug URL → valeur interne (ex: "vul-moyen" → "vul_moyen")
const SEGMENT_SLUG_MAP: Record<string, Segment> = {
  'vul-petit':   'vul_petit',
  'vul-moyen':   'vul_moyen',
  'vul-grand':   'vul_grand',
  'camion':      'camion',
  'poids-lourd': 'poids_lourd',
  'voiture':     'voiture',
  'vae':         'vae',
  'trottinette': 'trottinette',
  'moto':        'moto',
}

// Profil associé à chaque segment
const SEGMENT_PROFIL: Record<Segment, Profil> = {
  vul_petit:   'B2B',
  vul_moyen:   'B2B',
  vul_grand:   'B2B',
  camion:      'B2B',
  poids_lourd: 'B2B',
  voiture:     'Particulier',
  vae:         'Particulier',
  trottinette: 'Particulier',
  moto:        'Particulier',
}

// km/an par défaut selon profil
const KM_DEFAULT: Record<Profil, number> = { B2B: 25000, Particulier: 15000 }

// ─── Génération statique ──────────────────────────────────────────────────────

export async function generateStaticParams() {
  const segments = Object.keys(SEGMENT_SLUG_MAP)
  const pays     = Object.keys(PAYS_MAP)
  return pays.flatMap(p => segments.map(s => ({ pays: p, segment: s })))
}

// ─── Calcul TCO au build ──────────────────────────────────────────────────────

function calculerResultats(segment: Segment, pays: Pays): TcoResult[] {
  const profil = SEGMENT_PROFIL[segment]
  const motors = getMotors(segment, profil)
  return motors.map(motor =>
    calculTCO({
      segment, motor, profil, pays,
      km_an: KM_DEFAULT[profil],
      duree_mois: 48,
      profil_conduite: 'mixte',
      charge: 'standard',
      pct_hiver: 25,
      taux_recharge_phev: 50,
    })
  ).sort((a, b) => {
    if (!a.available) return 1
    if (!b.available) return -1
    return a.total - b.total
  })
}

// ─── FAQ dynamique ────────────────────────────────────────────────────────────

function genererFAQ(
  segment: Segment, pays: Pays, results: TcoResult[]
): { q: string; r: string }[] {
  const sLabel    = SEGMENT_LABELS[segment]
  const pLabel    = PAYS_LABELS[pays]
  const available = results.filter(r => r.available)
  const winner    = available[0]
  const second    = available[1]
  const profil    = SEGMENT_PROFIL[segment]
  const km        = KM_DEFAULT[profil]

  const faq: { q: string; r: string }[] = []

  if (winner) {
    faq.push({
      q: `Quelle est la motorisation la moins chère pour un ${sLabel} en ${pLabel} en 2026 ?`,
      r: `Selon nos calculs TCO sur 48 mois à ${km.toLocaleString('fr-FR')} km/an, le ${winner.label} est la motorisation la moins chère pour un ${sLabel} en ${pLabel}, avec un coût total de ${fmtEur(winner.total)}, soit ${fmtEurM(winner.coutMensuel)}. Ce montant inclut l'achat net (après aides), l'énergie et l'entretien.`,
    })
  }

  if (winner && second && winner.total < second.total) {
    const ecart = second.total - winner.total
    faq.push({
      q: `Quelle est l'économie réalisée avec un ${sLabel} ${winner.label} par rapport au ${second.label} ?`,
      r: `Sur 48 mois, choisir le ${winner.label} plutôt que le ${second.label} représente une économie de ${fmtEur(ecart)} en ${pLabel}. Cela correspond à ${fmtEurM(Math.round(ecart / 48))} de différence chaque mois sur la durée d'exploitation.`,
    })
  }

  const elec = available.find(r => r.motor === 'elec')
  const diesel = available.find(r => r.motor === 'diesel')
  if (elec && diesel) {
    const diff = elec.total - diesel.total
    faq.push({
      q: `Le ${sLabel} électrique est-il vraiment moins cher que le diesel en ${pLabel} ?`,
      r: diff < 0
        ? `Oui. Sur 48 mois, le ${sLabel} électrique revient ${fmtEur(Math.abs(diff))} moins cher que le diesel en ${pLabel}, grâce aux aides à l'achat (${fmtEur(elec.aides)}), à l'énergie moins coûteuse et à un entretien réduit.`
        : `Pas encore totalement. Le ${sLabel} électrique coûte ${fmtEur(diff)} de plus que le diesel en ${pLabel} sur 48 mois, principalement en raison du prix d'achat plus élevé. Cependant, sur une durée plus longue (60 mois) et avec un kilométrage élevé, la balance peut s'inverser.`,
    })
  }

  if (pays === 'FR' && SEGMENT_PROFIL[segment] === 'B2B') {
    faq.push({
      q: `Quelles aides sont disponibles pour un ${sLabel} en France en 2026 ?`,
      r: `En France, les entreprises peuvent bénéficier du suramortissement de 25 % (sur une base plafonnée à 30 000 €) pour les véhicules électriques, hydrogène et GNV. Des aides directes s'ajoutent selon le segment : jusqu'à ${fmtEur(available.find(r => r.aides > 0)?.aides ?? 0)} pour ce segment. Le cumul de ces dispositifs est intégré dans les calculs TCO présentés.`,
    })
  }

  return faq
}

// ─── JSON-LD ──────────────────────────────────────────────────────────────────

function genererJsonLd(
  segment: Segment, pays: Pays, faq: { q: string; r: string }[], titre: string
): string {
  const schemas = [
    {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: titre,
      author: { '@type': 'Organization', name: 'Moteurs.com', url: 'https://moteurs.com' },
      publisher: { '@type': 'Organization', name: 'Moteurs.com', url: 'https://moteurs.com' },
      inLanguage: 'fr-FR',
      url: `https://moteurs.com/tco/${pays.toLowerCase()}/${segment.replace('_', '-')}`,
    },
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: faq.map(f => ({
        '@type': 'Question',
        name: f.q,
        acceptedAnswer: { '@type': 'Answer', text: f.r },
      })),
    },
  ]
  return schemas.map(s =>
    `<script type="application/ld+json">${JSON.stringify(s)}</script>`
  ).join('\n')
}

// ─── Metadata ─────────────────────────────────────────────────────────────────

export async function generateMetadata({
  params,
}: {
  params: Promise<{ pays: string; segment: string }>
}): Promise<Metadata> {
  const { pays: paysSlug, segment: segSlug } = await params
  const pays    = PAYS_MAP[paysSlug]
  const segment = SEGMENT_SLUG_MAP[segSlug]
  if (!pays || !segment) return { title: 'Page introuvable' }

  const sLabel = SEGMENT_LABELS[segment]
  const pLabel = PAYS_LABELS[pays]
  const flag   = PAYS_FLAGS[pays]

  const titre = `TCO ${sLabel} — ${pLabel} 2026 : comparatif par motorisation`
  const desc  = `Comparez le coût total de possession d'un ${sLabel} en ${pLabel} : diesel, électrique, hydrogène, GNV, PHEV. Calcul TCO sur 48 mois incluant aides 2026, énergie et entretien. Données triangulées par Moteurs.com.`

  return {
    title: titre,
    description: desc,
    openGraph: {
      title: `${flag} ${titre}`,
      description: desc,
      type: 'article',
    },
    alternates: {
      canonical: `https://moteurs.com/tco/${paysSlug}/${segSlug}`,
    },
  }
}

// ─── Page principale ──────────────────────────────────────────────────────────

export default async function TcoSegmentPage({
  params,
}: {
  params: Promise<{ pays: string; segment: string }>
}) {
  const { pays: paysSlug, segment: segSlug } = await params
  const pays    = PAYS_MAP[paysSlug]
  const segment = SEGMENT_SLUG_MAP[segSlug]

  if (!pays || !segment) notFound()

  const sLabel  = SEGMENT_LABELS[segment]
  const pLabel  = PAYS_LABELS[pays]
  const flag    = PAYS_FLAGS[pays]
  const profil  = SEGMENT_PROFIL[segment]
  const km      = KM_DEFAULT[profil]
  const results = calculerResultats(segment, pays)
  const available = results.filter(r => r.available)
  const winner    = available[0]
  const titre   = `TCO ${sLabel} — ${pLabel} 2026`

  const faq     = genererFAQ(segment, pays, results)
  const jsonLd  = genererJsonLd(segment, pays, faq, titre)

  return (
    <>
      {/* JSON-LD */}
      <div dangerouslySetInnerHTML={{ __html: jsonLd }} />

      {/* Hero */}
      <header className="page-hero">
        <div className="container" style={{ maxWidth: 860, margin: '0 auto' }}>
          <nav className="breadcrumb">
            <a href="/tco">← Comparatifs TCO</a>
          </nav>
          <div className="page-hero-badges">
            <span className="page-hero-badge" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><Flag code={pays.toLowerCase()} size={16} /> {pLabel}</span>
            <span className="page-hero-badge">{profil}</span>
            <span className="page-hero-badge">📅 2026</span>
          </div>
          <h1 style={{ lineHeight: 1.15, maxWidth: 700 }}>
            Coût total de possession — {sLabel}<br />
            <span style={{ color: 'var(--color-primary)', fontWeight: 800 }}>{pLabel} 2026</span>
          </h1>
          <p style={{ marginTop: 14, maxWidth: 640, fontSize: '1.02rem' }}>
            Toutes les motorisations comparées sur 48 mois à {km.toLocaleString('fr-FR')} km/an.
            Aides {pLabel} 2026 incluses. Sources triangulées, hypothèses affichées.
          </p>
        </div>
      </header>

      {/* Corps */}
      <div style={{ padding: '48px 0 80px' }}>
        <div className="container" style={{ maxWidth: 860, margin: '0 auto' }}>

          {/* Badge gagnant */}
          {winner && (
            <div style={{
              background: `${MOTOR_COLORS[winner.motor]}14`,
              border: `1px solid ${MOTOR_COLORS[winner.motor]}`,
              borderRadius: 12,
              padding: '20px 24px',
              marginBottom: 40,
              display: 'flex',
              gap: 20,
              alignItems: 'center',
              flexWrap: 'wrap',
            }}>
              <div style={{
                width: 48, height: 48, borderRadius: '50%',
                background: MOTOR_COLORS[winner.motor],
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1.5rem', flexShrink: 0,
              }}>
                {winner.motor === 'elec' ? '⚡' : winner.motor === 'h2' ? '💧' : winner.motor === 'gnv' ? '🌿' : winner.motor === 'diesel' ? '🔵' : '⛽'}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-soft)', marginBottom: 2 }}>
                  Motorisation la moins chère sur ce segment en {pLabel}
                </div>
                <div style={{ fontWeight: 800, fontSize: '1.2rem' }}>
                  {winner.label} — {fmtEur(winner.total)} sur 48 mois
                </div>
                <div style={{ fontSize: '0.9rem', color: 'var(--color-text-soft)', marginTop: 2 }}>
                  soit <strong style={{ color: MOTOR_COLORS[winner.motor] }}>{fmtEurM(winner.coutMensuel)}</strong> en coût mensuel moyen
                </div>
              </div>
              {available[1] && (
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-soft)', marginBottom: 2 }}>vs {available[1].label}</div>
                  <div style={{ fontWeight: 700, color: '#059669', fontSize: '1rem' }}>
                    −{fmtEur(available[1].total - winner.total)}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Tableau comparatif */}
          <h2 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: 16 }}>
            Comparatif TCO — toutes motorisations
          </h2>
          <div style={{ overflowX: 'auto', marginBottom: 48 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ background: 'var(--color-bg-alt)', borderBottom: '2px solid var(--color-border)' }}>
                  <th style={{ textAlign: 'left', padding: '12px 14px', fontWeight: 700 }}>Motorisation</th>
                  <th style={{ textAlign: 'right', padding: '12px 14px' }}>Achat net</th>
                  <th style={{ textAlign: 'right', padding: '12px 14px' }}>Aides</th>
                  <th style={{ textAlign: 'right', padding: '12px 14px' }}>Énergie</th>
                  <th style={{ textAlign: 'right', padding: '12px 14px' }}>Entretien</th>
                  <th style={{ textAlign: 'right', padding: '12px 14px', fontWeight: 700 }}>TCO total</th>
                  <th style={{ textAlign: 'right', padding: '12px 14px' }}>Mensuel</th>
                </tr>
              </thead>
              <tbody>
                {results
                  .filter(r => r.available)
                  .map((r, i) => (
                    <tr
                      key={r.motor}
                      style={{
                        borderBottom: '1px solid var(--color-border)',
                        background: i === 0 ? `${MOTOR_COLORS[r.motor]}0a` : 'transparent',
                      }}
                    >
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{
                            display: 'inline-block', width: 10, height: 10,
                            borderRadius: '50%', background: MOTOR_COLORS[r.motor],
                          }} />
                          <span style={{ fontWeight: i === 0 ? 700 : 400 }}>{r.label}</span>
                          {i === 0 && (
                            <span style={{
                              fontSize: '0.65rem', background: MOTOR_COLORS[r.motor],
                              color: '#fff', padding: '1px 6px', borderRadius: 4, fontWeight: 700,
                            }}>✓ Moins cher</span>
                          )}
                        </div>
                      </td>
                      <td style={{ padding: '12px 14px', textAlign: 'right' }}>{fmtEur(r.prixNet)}</td>
                      <td style={{ padding: '12px 14px', textAlign: 'right', color: r.aides > 0 ? '#059669' : 'var(--color-text-soft)' }}>
                        {r.aides > 0 ? `−${fmtEur(r.aides)}` : '—'}
                      </td>
                      <td style={{ padding: '12px 14px', textAlign: 'right' }}>{fmtEur(r.coutEnergie)}</td>
                      <td style={{ padding: '12px 14px', textAlign: 'right' }}>{fmtEur(r.coutMaint)}</td>
                      <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 700 }}>{fmtEur(r.total)}</td>
                      <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: i === 0 ? 700 : 400, color: i === 0 ? MOTOR_COLORS[r.motor] : 'inherit' }}>
                        {fmtEurM(r.coutMensuel)}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>

          {/* Hypothèses */}
          <div style={{
            padding: '14px 18px',
            background: 'var(--color-bg-alt)',
            borderRadius: 8,
            fontSize: '0.8rem',
            color: 'var(--color-text-soft)',
            marginBottom: 48,
            lineHeight: 1.6,
          }}>
            <strong>Hypothèses de calcul —</strong>{' '}
            Durée : 48 mois · Kilométrage : {km.toLocaleString('fr-FR')} km/an · Profil : mixte ·
            Charge : standard · Roulage hivernal : 25 % · Prix énergie {pLabel} 2026 (moyennes sources officielles) ·
            Aides {pLabel} 2026 incluses · TVA {profil === 'B2B' ? 'non appliquée (B2B)' : 'appliquée (particulier)'}.{' '}
            <Link href="/simulateur" style={{ color: 'var(--color-primary)' }}>Personnalisez vos paramètres →</Link>
          </div>

          {/* FAQ */}
          {faq.length > 0 && (
            <div style={{ marginBottom: 48 }}>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 20 }}>
                Questions fréquentes
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {faq.map((item, i) => (
                  <div
                    key={i}
                    style={{
                      padding: '16px 20px',
                      background: 'var(--color-bg-alt)',
                      borderRadius: 10,
                      borderLeft: '3px solid var(--color-primary)',
                    }}
                  >
                    <div style={{ fontWeight: 700, marginBottom: 8, fontSize: '0.92rem' }}>
                      {item.q}
                    </div>
                    <div style={{ fontSize: '0.87rem', color: 'var(--color-text-soft)', lineHeight: 1.65 }}>
                      {item.r}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Liens vers autres pays */}
          <div style={{ marginBottom: 48 }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: 12 }}>
              Même segment, autre pays
            </h3>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {(Object.keys(PAYS_MAP) as string[])
                .filter(p => p !== paysSlug)
                .map(p => (
                  <Link
                    key={p}
                    href={`/tco/${p}/${segSlug}`}
                    style={{
                      padding: '7px 16px',
                      background: 'var(--color-bg-alt)',
                      border: '1px solid var(--color-border)',
                      borderRadius: 20,
                      fontSize: '0.85rem',
                      textDecoration: 'none',
                      color: 'var(--color-text)',
                    }}
                  >
                    <Flag code={p} size={14} /> TCO {sLabel} — {PAYS_LABELS[PAYS_MAP[p]]}
                  </Link>
                ))}
            </div>
          </div>

          {/* Liens vers autres segments (même pays) */}
          <div style={{ marginBottom: 48 }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: 12 }}>
              Autres segments — {pLabel}
            </h3>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {(Object.keys(SEGMENT_SLUG_MAP) as string[])
                .filter(s => s !== segSlug)
                .map(s => (
                  <Link
                    key={s}
                    href={`/tco/${paysSlug}/${s}`}
                    style={{
                      padding: '7px 16px',
                      background: 'var(--color-bg-alt)',
                      border: '1px solid var(--color-border)',
                      borderRadius: 20,
                      fontSize: '0.85rem',
                      textDecoration: 'none',
                      color: 'var(--color-text)',
                    }}
                  >
                    {SEGMENT_LABELS[SEGMENT_SLUG_MAP[s]]}
                  </Link>
                ))}
            </div>
          </div>

          {/* CTA */}
          <div style={{
            padding: '32px',
            background: 'linear-gradient(135deg, var(--hero-bg-start), var(--hero-bg-end))',
            borderRadius: 14,
            textAlign: 'center',
            color: '#fff',
          }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, marginBottom: 10 }}>
              Vos paramètres sont différents ?
            </h3>
            <p style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.75)', marginBottom: 20, maxWidth: 480, margin: '0 auto 20px' }}>
              Kilométrage, durée, profil de conduite — personnalisez chaque hypothèse
              dans le comparateur interactif.
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link href="/comparer" className="btn btn-primary">
                Comparateur TCO personnalisé →
              </Link>
              <Link href="/simulateur" className="btn btn-secondary">
                Simulateur détaillé
              </Link>
            </div>
          </div>

          {/* Disclaimer */}
          <p style={{ marginTop: 32, fontSize: '0.75rem', color: 'var(--color-text-soft)', lineHeight: 1.5 }}>
            <strong>Disclaimer —</strong> Ce comparatif produit des estimations indicatives basées sur des moyennes 2026.
            Les montants réels (achat, aides, énergie, entretien) varient selon l'opérateur, le concessionnaire
            et votre éligibilité. Vérifiez votre situation auprès d'un professionnel avant tout engagement.
            Moteurs.com n'est pas conseiller financier.
          </p>
        </div>
      </div>
    </>
  )
}
