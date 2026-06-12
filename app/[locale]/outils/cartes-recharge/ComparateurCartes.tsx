'use client'

import { useState, useMemo } from 'react'
import type { Carte, Tarifs } from '@/lib/cartes-recharge'

// ── URL "Voir l'offre" — préfère url_tarifs (page de prix) sur url_officielle. ──
function urlOffre(carte: Carte): string | null {
  const raw = carte.url_tarifs || carte.url_officielle
  if (!raw) return null
  if (/^https?:\/\//i.test(raw)) return raw
  return `https://${raw}`
}

type Pays = 'FR' | 'BE'

interface ProfilParticulier {
  kmMoisPublic: number
  pctDC: number
  voyagesEU: number   // 0 = jamais, 1 = 1-2/an, 2 = 3+/an
  pays: Pays
}

interface ProfilFlotte {
  nbVehicules: number
  kmMoisPublicParVehicule: number
  pctDC: number
  voyagesEU: number
  pays: Pays
}

// ── Tarifs selon le pays de recharge habituel ──────────────────────────────────
// En mode BE on n'utilise QUE les tarifs belges natifs (pas de repli sur FR :
// les prix FR ne valent pas en Belgique). Une carte sans tarif BE natif sera
// donc écartée du scénario Belgique — c'est exactement ce qu'on veut pour ne
// montrer que les cartes « couverture nationale sans frais d'itinérance ».
function getTarifsPays(carte: Carte, pays: Pays): Tarifs {
  const d = carte.donnees
  if (pays === 'BE') return d?.tarifs_be || {}
  return d?.tarifs_fr || d?.tarifs_be || {}
}

// Au moins un prix exploitable (AC ou DC) ? Sinon la carte ne peut pas être chiffrée.
function aUnPrix(t: Tarifs): boolean {
  return (t.ac_slow?.prix ?? null) != null
    || (t.dc_rapide?.prix ?? null) != null
    || (t.dc_ultra?.prix ?? null) != null
}

// La carte propose-t-elle un tarif belge natif exploitable (≠ simple itinérance) ?
function couvreBelgiqueNatif(carte: Carte): boolean {
  return aUnPrix(carte.donnees?.tarifs_be || {})
}

// ── Calcul coût mensuel ────────────────────────────────────────────────────────

function calculerCoutParticulier(carte: Carte, p: ProfilParticulier): number | null {
  const tarifs = getTarifsPays(carte, p.pays)
  const roaming = carte.donnees?.roaming || {}
  const abo = carte.donnees?.abonnement?.mensuel_eur || 0

  const kwhTotal = p.kmMoisPublic * 0.20
  const kwhAC = kwhTotal * (1 - p.pctDC / 100)
  const kwhDC = kwhTotal * (p.pctDC / 100)

  const tarifAC = tarifs.ac_slow?.prix ?? null
  const tarifDC = tarifs.dc_rapide?.prix ?? tarifs.dc_ultra?.prix ?? null

  // Éligibilité : la carte doit fournir le type d'énergie demandé par le profil.
  // (Corrige le bug où une carte à prix null « gagnait » à 0 €.)
  if (tarifAC == null && tarifDC == null) return null
  if (kwhAC > 0.01 && tarifAC == null) return null
  if (kwhDC > 0.01 && tarifDC == null) return null

  // AC
  const fraisAC = tarifs.ac_slow?.frais_session || 0
  const sessionsAC = kwhAC > 0 ? Math.ceil(kwhAC / 15) : 0
  const coutAC = tarifAC != null ? kwhAC * tarifAC + sessionsAC * fraisAC : 0

  // DC
  const fraisDC = tarifs.dc_rapide?.frais_session || 0
  const sessionsDC = kwhDC > 0 ? Math.ceil(kwhDC / 45) : 0
  const coutDC = tarifDC != null ? kwhDC * tarifDC + sessionsDC * fraisDC : 0

  // Roaming (voyages EU)
  const sessionsRoamingMois = p.voyagesEU === 0 ? 0 : p.voyagesEU === 1 ? 1.5 * 6 / 12 : 3 * 6 / 12
  // 6 sessions DC par voyage, ramené en mensuel
  let coutRoaming = 0
  if (sessionsRoamingMois > 0) {
    if (roaming.disponible && roaming.tarif_dc_rapide?.prix != null) {
      coutRoaming = sessionsRoamingMois * 45 * roaming.tarif_dc_rapide.prix
    } else if (!roaming.disponible) {
      // Pas de roaming → tarif spot moyen marché pénalisé
      coutRoaming = sessionsRoamingMois * 45 * 0.75
    }
  }

  return Math.round((abo + coutAC + coutDC + coutRoaming) * 10) / 10
}

function calculerCoutFlotte(carte: Carte, p: ProfilFlotte): number | null {
  const individuel = calculerCoutParticulier(carte, {
    kmMoisPublic: p.kmMoisPublicParVehicule,
    pctDC: p.pctDC,
    voyagesEU: p.voyagesEU,
    pays: p.pays,
  })
  if (individuel === null) return null
  // Abonnement : certaines cartes flotte ont un abonnement par véhicule
  return Math.round(individuel * p.nbVehicules * 10) / 10
}

// ── Presets « scénarios » (reverse filtering) ──────────────────────────────────
// Un clic règle les curseurs + le pays et re-classe automatiquement les cartes.

interface PresetP { id: string; emoji: string; titre: string; sous: string; km: number; pctDC: number; voyages: number; pays: Pays }
interface PresetF { id: string; emoji: string; titre: string; sous: string; nb: number; km: number; pctDC: number; voyages: number; pays: Pays }

const PRESETS_PARTICULIER: PresetP[] = [
  { id: 'equilibre', emoji: '⚖️', titre: 'Équilibré',   sous: 'Usage mixte',            km: 200, pctDC: 30, voyages: 1, pays: 'FR' },
  { id: 'voyageur',  emoji: '⚡', titre: 'Pack Voyageur', sous: 'Autoroute · sans abo',  km: 300, pctDC: 75, voyages: 2, pays: 'FR' },
  { id: 'quotidien', emoji: '🔋', titre: 'Pack Quotidien', sous: 'Voirie AC · 0 €/mois', km: 150, pctDC: 0,  voyages: 0, pays: 'FR' },
  { id: 'belgique',  emoji: '🇧🇪', titre: 'Spécial Belgique', sous: 'Couverture nationale', km: 250, pctDC: 35, voyages: 0, pays: 'BE' },
]

const PRESETS_FLOTTE: PresetF[] = [
  { id: 'equilibre', emoji: '⚖️', titre: 'Équilibré',     sous: 'Flotte mixte',         nb: 5, km: 500, pctDC: 40, voyages: 0, pays: 'FR' },
  { id: 'missions',  emoji: '⚡', titre: 'Missions EU',    sous: 'Longue distance',      nb: 5, km: 700, pctDC: 70, voyages: 2, pays: 'FR' },
  { id: 'depot',     emoji: '🔋', titre: 'Dépôt + voirie', sous: 'Recharge lente AC',    nb: 8, km: 400, pctDC: 0,  voyages: 0, pays: 'FR' },
  { id: 'belgique',  emoji: '🇧🇪', titre: 'Spécial Belgique', sous: 'Couverture nationale', nb: 6, km: 500, pctDC: 35, voyages: 0, pays: 'BE' },
]

// ── Helpers UI ────────────────────────────────────────────────────────────────

const PRIMARY = 'var(--color-primary)'
const BORDER  = 'var(--color-border)'
const BG_CARD = 'var(--color-bg-card)'
const MUTED   = 'var(--color-text-muted)'

function Badge({ children, color = PRIMARY, title }: { children: React.ReactNode; color?: string; title?: string }) {
  return (
    <span title={title} style={{
      fontSize: '0.72rem', fontWeight: 600, padding: '2px 8px', borderRadius: 4,
      background: `color-mix(in srgb, ${color} 12%, transparent)`,
      color, border: `1px solid color-mix(in srgb, ${color} 30%, transparent)`,
      cursor: title ? 'help' : 'default',
    }}>
      {children}
    </span>
  )
}

function Slider({ label, min, max, step, value, onChange, unit = '' }:
  { label: string; min: number; max: number; step: number; value: number; onChange: (v: number) => void; unit?: string }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: '0.88rem' }}>
        <span style={{ color: 'var(--color-text)', fontWeight: 500 }}>{label}</span>
        <span style={{ color: PRIMARY, fontWeight: 700 }}>{value}{unit}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(Number(e.target.value))}
        style={{ width: '100%', accentColor: 'var(--color-primary)' }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: MUTED, marginTop: 2 }}>
        <span>{min}{unit}</span><span>{max}{unit}</span>
      </div>
    </div>
  )
}

// Bouton scénario (pré-filtre en un clic)
function PresetButton({ emoji, titre, sous, actif, onClick }:
  { emoji: string; titre: string; sous: string; actif: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{
      flex: '1 1 150px', minWidth: 140, textAlign: 'left',
      padding: '10px 14px', borderRadius: 10, cursor: 'pointer',
      border: `1.5px solid ${actif ? PRIMARY : BORDER}`,
      background: actif ? `color-mix(in srgb, ${PRIMARY} 12%, transparent)` : BG_CARD,
      transition: 'border-color .15s, background .15s',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: '1.15rem' }}>{emoji}</span>
        <span style={{ fontWeight: 700, fontSize: '0.9rem', color: actif ? PRIMARY : 'var(--color-text)' }}>{titre}</span>
      </div>
      <div style={{ fontSize: '0.72rem', color: MUTED, marginTop: 2 }}>{sous}</div>
    </button>
  )
}

// ── Composant principal (calculateur interactif) ───────────────────────────────

export default function ComparateurCartes({ initialCartes }: { initialCartes: Carte[] }) {
  const cartes = initialCartes
  const [onglet, setOnglet] = useState<'particulier' | 'flotte'>('particulier')

  // Profil particulier
  const [kmMois, setKmMois] = useState(200)
  const [pctDC, setPctDC] = useState(30)
  const [voyages, setVoyages] = useState(1) // 0/1/2
  const [paysP, setPaysP] = useState<Pays>('FR')
  const [presetP, setPresetP] = useState<string>('equilibre')

  // Profil flotte
  const [nbVeh, setNbVeh] = useState(5)
  const [kmVeh, setKmVeh] = useState(500)
  const [pctDCFlotte, setPctDCFlotte] = useState(40)
  const [voyagesFlotte, setVoyagesFlotte] = useState(0)
  const [paysF, setPaysF] = useState<Pays>('FR')
  const [presetF, setPresetF] = useState<string>('equilibre')

  // Application d'un preset (particulier)
  function appliquerPresetP(pr: PresetP) {
    setKmMois(pr.km); setPctDC(pr.pctDC); setVoyages(pr.voyages); setPaysP(pr.pays); setPresetP(pr.id)
  }
  // Application d'un preset (flotte)
  function appliquerPresetF(pr: PresetF) {
    setNbVeh(pr.nb); setKmVeh(pr.km); setPctDCFlotte(pr.pctDC); setVoyagesFlotte(pr.voyages); setPaysF(pr.pays); setPresetF(pr.id)
  }

  const pays: Pays = onglet === 'particulier' ? paysP : paysF

  // Calcul et classement
  const resultats = useMemo(() => {
    if (!cartes.length) return []
    return cartes
      .filter(c => pays !== 'BE' || couvreBelgiqueNatif(c)) // scénario BE : cartes belges natives uniquement
      .map(c => {
        const cout = onglet === 'particulier'
          ? calculerCoutParticulier(c, { kmMoisPublic: kmMois, pctDC, voyagesEU: voyages, pays: paysP })
          : calculerCoutFlotte(c, { nbVehicules: nbVeh, kmMoisPublicParVehicule: kmVeh, pctDC: pctDCFlotte, voyagesEU: voyagesFlotte, pays: paysF })
        return { carte: c, cout }
      })
      .filter(r => r.cout !== null)
      .sort((a, b) => (a.cout ?? 999) - (b.cout ?? 999))
  }, [cartes, onglet, kmMois, pctDC, voyages, paysP, nbVeh, kmVeh, pctDCFlotte, voyagesFlotte, paysF, pays])

  const voyagesLabel = ['Jamais', '1–2 fois/an', '3+ fois/an']

  if (!cartes.length) return (
    <div style={{ textAlign: 'center', padding: '60px 0', color: MUTED }}>
      Données temporairement indisponibles. Réessayez dans quelques instants.
    </div>
  )

  return (
    <div>
      {/* ── Onglets Particulier / Flotte ─────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        {(['particulier', 'flotte'] as const).map(o => (
          <button key={o} onClick={() => setOnglet(o)} style={{
            padding: '10px 24px', borderRadius: 8, fontWeight: 600, fontSize: '0.9rem',
            border: `1.5px solid ${onglet === o ? PRIMARY : BORDER}`,
            background: onglet === o ? `color-mix(in srgb, ${PRIMARY} 10%, transparent)` : 'transparent',
            color: onglet === o ? PRIMARY : MUTED, cursor: 'pointer',
          }}>
            {o === 'particulier' ? '👤 Particulier' : '🏢 Flotte Pro'}
          </button>
        ))}
      </div>

      {/* ── Scénarios en un clic (reverse filtering) ─────────────────────── */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: '0.8rem', fontWeight: 600, color: MUTED, marginBottom: 10 }}>
          ⚡ Choisissez votre profil en un clic
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {onglet === 'particulier'
            ? PRESETS_PARTICULIER.map(pr => (
                <PresetButton key={pr.id} emoji={pr.emoji} titre={pr.titre} sous={pr.sous}
                  actif={presetP === pr.id} onClick={() => appliquerPresetP(pr)} />
              ))
            : PRESETS_FLOTTE.map(pr => (
                <PresetButton key={pr.id} emoji={pr.emoji} titre={pr.titre} sous={pr.sous}
                  actif={presetF === pr.id} onClick={() => appliquerPresetF(pr)} />
              ))}
        </div>
      </div>

      {/* ── Vue Calculateur ──────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(260px,320px) 1fr', gap: 32, alignItems: 'start' }}>

        {/* Panneau paramètres */}
        <div style={{ background: BG_CARD, border: `1px solid ${BORDER}`, borderRadius: 14, padding: 24 }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 20 }}>
            {onglet === 'particulier' ? '👤 Votre profil' : '🏢 Votre flotte'}
          </h3>

          {/* Pays de recharge habituel */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: '0.88rem', fontWeight: 500, marginBottom: 8 }}>Pays de recharge habituel</div>
            <div style={{ display: 'flex', gap: 6 }}>
              {(['FR', 'BE'] as const).map(pc => {
                const actif = pays === pc
                const set = onglet === 'particulier'
                  ? () => { setPaysP(pc); setPresetP('custom') }
                  : () => { setPaysF(pc); setPresetF('custom') }
                return (
                  <button key={pc} onClick={set} style={{
                    flex: 1, padding: '7px 4px', borderRadius: 6, fontSize: '0.8rem', fontWeight: 600,
                    border: `1.5px solid ${actif ? PRIMARY : BORDER}`,
                    background: actif ? `color-mix(in srgb, ${PRIMARY} 10%, transparent)` : 'transparent',
                    color: actif ? PRIMARY : MUTED, cursor: 'pointer',
                  }}>
                    {pc === 'FR' ? '🇫🇷 France' : '🇧🇪 Belgique'}
                  </button>
                )
              })}
            </div>
          </div>

          {onglet === 'particulier' ? (
            <>
              <Slider label="km/mois en recharge publique" min={0} max={1500} step={25} value={kmMois}
                onChange={v => { setKmMois(v); setPresetP('custom') }} unit=" km" />
              <Slider label="Part de recharge DC rapide" min={0} max={100} step={5} value={pctDC}
                onChange={v => { setPctDC(v); setPresetP('custom') }} unit="%" />
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: '0.88rem', fontWeight: 500, marginBottom: 8 }}>Voyages UE en voiture</div>
                <div style={{ display: 'flex', gap: 6 }}>
                  {voyagesLabel.map((l, i) => (
                    <button key={i} onClick={() => { setVoyages(i); setPresetP('custom') }} style={{
                      flex: 1, padding: '7px 4px', borderRadius: 6, fontSize: '0.75rem', fontWeight: 600,
                      border: `1.5px solid ${voyages === i ? PRIMARY : BORDER}`,
                      background: voyages === i ? `color-mix(in srgb, ${PRIMARY} 10%, transparent)` : 'transparent',
                      color: voyages === i ? PRIMARY : MUTED, cursor: 'pointer',
                    }}>
                      {l}
                    </button>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <>
              <Slider label="Nombre de véhicules" min={1} max={50} step={1} value={nbVeh}
                onChange={v => { setNbVeh(v); setPresetF('custom') }} unit=" véh." />
              <Slider label="km/mois en public par véhicule" min={0} max={2000} step={50} value={kmVeh}
                onChange={v => { setKmVeh(v); setPresetF('custom') }} unit=" km" />
              <Slider label="Part DC rapide" min={0} max={100} step={5} value={pctDCFlotte}
                onChange={v => { setPctDCFlotte(v); setPresetF('custom') }} unit="%" />
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: '0.88rem', fontWeight: 500, marginBottom: 8 }}>Missions EU régulières</div>
                <div style={{ display: 'flex', gap: 6 }}>
                  {['Non', 'Occasionnel', 'Fréquent'].map((l, i) => (
                    <button key={i} onClick={() => { setVoyagesFlotte(i); setPresetF('custom') }} style={{
                      flex: 1, padding: '7px 4px', borderRadius: 6, fontSize: '0.75rem', fontWeight: 600,
                      border: `1.5px solid ${voyagesFlotte === i ? PRIMARY : BORDER}`,
                      background: voyagesFlotte === i ? `color-mix(in srgb, ${PRIMARY} 10%, transparent)` : 'transparent',
                      color: voyagesFlotte === i ? PRIMARY : MUTED, cursor: 'pointer',
                    }}>
                      {l}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          <div style={{ fontSize: '0.75rem', color: MUTED, lineHeight: 1.5, padding: '12px', background: 'var(--color-bg-alt)', borderRadius: 8 }}>
            💡 Hypothèses : 20 kWh/100 km, sessions AC = 15 kWh, sessions DC = 45 kWh.
            {pays === 'BE' && ' Scénario Belgique : seules les cartes à tarif belge natif (sans frais d\'itinérance cachés) sont affichées.'}
            {' '}Estimation indicative — vérifiez les tarifs officiels avant de souscrire.
          </div>
        </div>

        {/* Résultats classés */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {resultats.length === 0 && (
            <div style={{ textAlign: 'center', padding: '40px 0', color: MUTED }}>
              Aucune carte ne correspond à ce profil. Essayez un autre scénario.
            </div>
          )}
          {resultats.map((r, i) => {
            const isWinner = i === 0
            const roaming = r.carte.donnees?.roaming
            return (
              <div key={r.carte.id} style={{
                background: BG_CARD,
                border: `${isWinner ? '2px' : '1px'} solid ${isWinner ? PRIMARY : BORDER}`,
                borderRadius: 12, padding: '18px 20px',
                display: 'grid', gridTemplateColumns: '1fr auto', gap: 12, alignItems: 'center',
              }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    {isWinner && <span style={{ fontSize: '1rem' }}>🏆</span>}
                    <span style={{ fontWeight: 700, fontSize: '1rem' }}>{r.carte.nom}</span>
                    <span style={{ fontSize: '0.78rem', color: MUTED }}>{r.carte.operateur}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {pays === 'BE' && <Badge color="#ef4444" title="Tarif belge natif — pas de frais d'itinérance.">🇧🇪 Tarif national</Badge>}
                    {r.carte.ideal_voyage && <Badge>✈️ Voyage EU</Badge>}
                    {r.carte.flotte_pro && <Badge color="#8b5cf6">🏢 Flotte</Badge>}
                    {(r.carte.donnees?.abonnement?.mensuel_eur || 0) === 0 && <Badge color="#f59e0b">Sans abo</Badge>}
                    {roaming?.disponible && (roaming.pays_couverts?.length || 0) >= 5 && (
                      <Badge color="#06b6d4" title="Nombre de pays couverts par notre comparatif tarifaire — pas forcément la couverture maximale du réseau partenaire.">
                        Couverture {roaming.pays_couverts?.length || 0} pays
                      </Badge>
                    )}
                  </div>
                  {r.carte.points_forts?.length > 0 && (
                    <div style={{ fontSize: '0.8rem', color: MUTED, marginTop: 6 }}>
                      {r.carte.points_forts[0]}
                    </div>
                  )}
                </div>
                <div style={{ textAlign: 'right', minWidth: 110 }}>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: isWinner ? PRIMARY : 'var(--color-text)' }}>
                    {r.cout?.toFixed(0)} €
                  </div>
                  <div style={{ fontSize: '0.75rem', color: MUTED }}>
                    {onglet === 'flotte' ? `/ mois (${nbVeh} véh.)` : '/ mois estimé'}
                  </div>
                  {urlOffre(r.carte) && (
                    <a href={urlOffre(r.carte) as string}
                      target="_blank" rel="noopener noreferrer"
                      style={{ fontSize: '0.78rem', color: PRIMARY, fontWeight: 600, textDecoration: 'none', display: 'block', marginTop: 4 }}>
                      Voir l&apos;offre →
                    </a>
                  )}
                  <a href={`/outils/cartes-recharge/${r.carte.id}`}
                    style={{ fontSize: '0.78rem', color: MUTED, fontWeight: 500, textDecoration: 'none', display: 'block', marginTop: 2 }}>
                    📊 Tarifs par pays
                  </a>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
