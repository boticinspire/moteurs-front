/**
 * /outils/cartes-recharge/[carte_id]
 *
 * Page détail d'une carte de recharge : informations générales + grille tarifaire
 * complète par pays (lue depuis la table Supabase tarifs_carte_pays via Railway).
 *
 * Server component ISR (revalidate 3600).
 */
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { Link } from '@/i18n/navigation'
export const revalidate = 3600

const RAILWAY = 'https://orchestrateur-production.up.railway.app'

// ── Types ─────────────────────────────────────────────────────────────────────

interface Carte {
  id: string
  nom: string
  operateur: string
  pays_origine: string[]
  url_officielle?: string
  url_tarifs?: string
  ideal_voyage: boolean
  ideal_quotidien: boolean
  flotte_pro: boolean
  points_forts: string[]
  points_faibles: string[]
  donnees: {
    abonnement?: { mensuel_eur?: number; annuel_eur?: number; engagement_mois?: number }
  }
}

interface TarifPays {
  carte_id: string
  pays_iso: string
  devise: string
  plan_principal_kwh: number | null
  plan_premium_kwh: number | null
  plan_sans_abo_app: number | null
  plan_sans_abo_direct: number | null
  ac_slow_kwh: number | null
  dc_rapide_kwh: number | null
  dc_ultra_kwh: number | null
  abo_mensuel: number | null
  source: string | null
  derniere_maj: string
}

// ── Mapping ISO → libellé pays (avec drapeau emoji) ──────────────────────────

const PAYS_LABELS: Record<string, { nom: string; flag: string }> = {
  AT: { nom: 'Autriche',       flag: '🇦🇹' },
  BE: { nom: 'Belgique',       flag: '🇧🇪' },
  CH: { nom: 'Suisse',         flag: '🇨🇭' },
  CZ: { nom: 'Tchéquie',       flag: '🇨🇿' },
  DE: { nom: 'Allemagne',      flag: '🇩🇪' },
  DK: { nom: 'Danemark',       flag: '🇩🇰' },
  EE: { nom: 'Estonie',        flag: '🇪🇪' },
  ES: { nom: 'Espagne',        flag: '🇪🇸' },
  FI: { nom: 'Finlande',       flag: '🇫🇮' },
  FR: { nom: 'France',         flag: '🇫🇷' },
  GB: { nom: 'Royaume-Uni',    flag: '🇬🇧' },
  HR: { nom: 'Croatie',        flag: '🇭🇷' },
  HU: { nom: 'Hongrie',        flag: '🇭🇺' },
  IE: { nom: 'Irlande',        flag: '🇮🇪' },
  IT: { nom: 'Italie',         flag: '🇮🇹' },
  LT: { nom: 'Lituanie',       flag: '🇱🇹' },
  LU: { nom: 'Luxembourg',     flag: '🇱🇺' },
  LV: { nom: 'Lettonie',       flag: '🇱🇻' },
  NL: { nom: 'Pays-Bas',       flag: '🇳🇱' },
  NO: { nom: 'Norvège',        flag: '🇳🇴' },
  PL: { nom: 'Pologne',        flag: '🇵🇱' },
  PT: { nom: 'Portugal',       flag: '🇵🇹' },
  SE: { nom: 'Suède',          flag: '🇸🇪' },
  SI: { nom: 'Slovénie',       flag: '🇸🇮' },
  SK: { nom: 'Slovaquie',      flag: '🇸🇰' },
}

function libelle(iso: string) {
  return PAYS_LABELS[iso] ?? { nom: iso, flag: '🌍' }
}

// ── Fetch helpers ────────────────────────────────────────────────────────────

async function getCarte(carte_id: string): Promise<Carte | null> {
  try {
    const r = await fetch(`${RAILWAY}/recharge/cartes/${encodeURIComponent(carte_id)}`, {
      next: { revalidate: 3600 },
    })
    if (!r.ok) return null
    return await r.json()
  } catch {
    return null
  }
}

async function getTarifs(carte_id: string): Promise<TarifPays[]> {
  try {
    const r = await fetch(`${RAILWAY}/recharge/cartes/${encodeURIComponent(carte_id)}/tarifs`, {
      next: { revalidate: 3600 },
    })
    if (!r.ok) return []
    const data = await r.json()
    return data.tarifs ?? []
  } catch {
    return []
  }
}

// ── Metadata ─────────────────────────────────────────────────────────────────

export async function generateMetadata({
  params,
}: {
  params: Promise<{ carte_id: string }>
}): Promise<Metadata> {
  const { carte_id } = await params
  const carte = await getCarte(carte_id)
  if (!carte) return { title: 'Carte de recharge — Moteurs.com' }
  return {
    title: `${carte.nom} — Tarifs par pays | Moteurs.com`,
    description: `Tarifs détaillés de la carte ${carte.nom} (${carte.operateur}) dans les pays européens où elle est disponible. Comparaison Motion/Power/App/Direct.`,
  }
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default async function PageDetail({
  params,
}: {
  params: Promise<{ carte_id: string }>
}) {
  const { carte_id } = await params
  const [carte, tarifs] = await Promise.all([getCarte(carte_id), getTarifs(carte_id)])
  if (!carte) notFound()

  const tarifsTries = [...tarifs].sort((a, b) => a.pays_iso.localeCompare(b.pays_iso))
  const aboMensuel = carte.donnees?.abonnement?.mensuel_eur ?? 0
  const urlOffre = carte.url_tarifs || carte.url_officielle

  return (
    <main style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 16px' }}>
      {/* ── Fil d'Ariane ── */}
      <nav style={{ fontSize: '0.85rem', marginBottom: 16, color: 'var(--color-text-muted)' }}>
        <Link href="/outils/cartes-recharge" style={{ color: 'inherit' }}>← Toutes les cartes</Link>
      </nav>

      {/* ── Header carte ── */}
      <header style={{ marginBottom: 24, paddingBottom: 16, borderBottom: '1px solid var(--color-border)' }}>
        <h1 style={{ fontSize: '2rem', marginBottom: 8 }}>{carte.nom}</h1>
        <div style={{ color: 'var(--color-text-muted)', fontSize: '1rem', marginBottom: 12 }}>
          {carte.operateur} ·{' '}
          {aboMensuel > 0
            ? <>Abonnement <strong>{aboMensuel} €/mois</strong></>
            : <>Sans abonnement</>
          }
          {urlOffre && (
            <>
              {' · '}
              <a href={urlOffre} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-primary)' }}>
                Voir l&apos;offre officielle ↗
              </a>
            </>
          )}
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', fontSize: '0.78rem' }}>
          {carte.ideal_voyage   && <Badge color="#06b6d4">✈️ Voyage EU</Badge>}
          {carte.flotte_pro     && <Badge color="#8b5cf6">🏢 Flotte</Badge>}
          {carte.ideal_quotidien && <Badge color="#10b981">🏠 Quotidien</Badge>}
        </div>
      </header>

      {/* ── Tableau tarifs par pays ── */}
      <section style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: '1.4rem', marginBottom: 12 }}>Tarifs par pays</h2>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.92rem', marginBottom: 16 }}>
          Grille tarifaire pour les {tarifsTries.length} marchés où {carte.nom} est disponible.
          {tarifs.length > 0 && tarifs[0].source && (
            <> Source : <span style={{ fontStyle: 'italic' }}>{tarifs[0].source}</span>.</>
          )}
        </p>

        {tarifsTries.length === 0 ? (
          <p style={{ padding: 16, background: 'var(--color-bg-card)', borderRadius: 4, color: 'var(--color-text-muted)' }}>
            Aucun tarif détaillé disponible en base pour cette carte pour le moment.
          </p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ background: 'var(--color-bg-card)', textAlign: 'left' }}>
                  <Th>Pays</Th>
                  <Th>Devise</Th>
                  <Th right title="Tarif principal (ex IONITY Motion / Electra app)">Principal</Th>
                  <Th right title="Tarif premium (ex IONITY Power / Electra+)">Premium</Th>
                  <Th right title="Tarif sans abonnement via app">App</Th>
                  <Th right title="Tarif sans inscription via QR code">Direct</Th>
                </tr>
              </thead>
              <tbody>
                {tarifsTries.map((t) => {
                  const l = libelle(t.pays_iso)
                  return (
                    <tr key={t.pays_iso} style={{ borderTop: '1px solid var(--color-border)' }}>
                      <Td>{l.flag} {l.nom} <span style={{ color: 'var(--color-text-muted)' }}>({t.pays_iso})</span></Td>
                      <Td><code>{t.devise}</code></Td>
                      <Td right>{fmt(t.plan_principal_kwh, t.devise)}</Td>
                      <Td right>{fmt(t.plan_premium_kwh, t.devise)}</Td>
                      <Td right>{fmt(t.plan_sans_abo_app, t.devise)}</Td>
                      <Td right>{fmt(t.plan_sans_abo_direct, t.devise)}</Td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* ── Points forts / faibles ── */}
      {(carte.points_forts?.length || carte.points_faibles?.length) > 0 && (
        <section style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 32 }}>
          {carte.points_forts?.length > 0 && (
            <div>
              <h3 style={{ fontSize: '1.1rem', color: '#10b981', marginBottom: 8 }}>👍 Points forts</h3>
              <ul style={{ paddingLeft: 20, lineHeight: 1.6, fontSize: '0.95rem' }}>
                {carte.points_forts.map((p, i) => <li key={i}>{p}</li>)}
              </ul>
            </div>
          )}
          {carte.points_faibles?.length > 0 && (
            <div>
              <h3 style={{ fontSize: '1.1rem', color: '#ef4444', marginBottom: 8 }}>👎 Points faibles</h3>
              <ul style={{ paddingLeft: 20, lineHeight: 1.6, fontSize: '0.95rem' }}>
                {carte.points_faibles.map((p, i) => <li key={i}>{p}</li>)}
              </ul>
            </div>
          )}
        </section>
      )}

      {/* ── Footer note méthodo ── */}
      <footer style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', borderTop: '1px solid var(--color-border)', paddingTop: 12 }}>
        Données mises à jour automatiquement chaque semaine via l&apos;agent IA Moteurs.com.
        Les prix affichés sont indicatifs et peuvent varier selon la station de recharge.
        Pour le détail exact, consulter le site officiel du fournisseur.
      </footer>
    </main>
  )
}

// ── Helpers UI ────────────────────────────────────────────────────────────────

function fmt(prix: number | null, devise: string): string {
  if (prix == null) return '—'
  const symboles: Record<string, string> = {
    EUR: '€', CHF: 'CHF', GBP: '£', NOK: 'kr', SEK: 'kr', DKK: 'kr',
    PLN: 'zł', CZK: 'Kč', HUF: 'Ft',
  }
  const symb = symboles[devise] ?? devise
  return `${prix.toFixed(2)} ${symb}/kWh`
}

function Badge({ children, color }: { children: React.ReactNode; color: string }) {
  return (
    <span style={{
      padding: '2px 8px', borderRadius: 4, fontWeight: 600,
      background: `color-mix(in srgb, ${color} 12%, transparent)`,
      color, border: `1px solid color-mix(in srgb, ${color} 30%, transparent)`,
    }}>
      {children}
    </span>
  )
}

function Th({ children, right, title }: { children: React.ReactNode; right?: boolean; title?: string }) {
  return (
    <th
      title={title}
      style={{
        padding: '10px 12px',
        textAlign: right ? 'right' : 'left',
        fontWeight: 600,
        cursor: title ? 'help' : 'default',
      }}
    >
      {children}
    </th>
  )
}

function Td({ children, right }: { children: React.ReactNode; right?: boolean }) {
  return (
    <td style={{ padding: '8px 12px', textAlign: right ? 'right' : 'left' }}>
      {children}
    </td>
  )
}
