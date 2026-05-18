'use client'

import { useState, useMemo } from 'react'
import dynamic from 'next/dynamic'
import {
  fetchStationsAlongRoute,
  filtrerStations,
  badgePuissance,
  type Station,
  type FiltrePuissance,
  type Coords,
} from '@/lib/openchargemaps'
import { geocoderVille } from '@/lib/openrouteservice'

// Carte Leaflet chargée uniquement côté client (pas de SSR)
const CarteStations = dynamic(() => import('./CarteStations'), {
  ssr: false,
  loading: () => (
    <div style={{
      height: 340, borderRadius: 12, border: '1.5px solid var(--color-border)',
      background: 'var(--color-bg-alt)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: 'var(--color-text-muted)', fontSize: '0.87rem',
    }}>
      🗺️ Chargement de la carte…
    </div>
  ),
})

// ─── Types ────────────────────────────────────────────────────────────────────

interface Props {
  // Coordonnées GPS déjà connues (trajet ORS)
  coordDepart?: Coords
  coordArrivee?: Coords
  // Noms de villes à géocoder si les coords ne sont pas disponibles
  villeDepart?: string
  villeArrivee?: string
  distanceTrajet: number  // pour l'info contextuelle
}

// ─── Sous-composant : carte d'une station ────────────────────────────────────

function CarteStation({ s, index }: { s: Station; index: number }) {
  const badge = badgePuissance(s.puissance_max_kw)

  return (
    <div style={{
      background: 'var(--color-bg-card)',
      border: '1.5px solid var(--color-border)',
      borderRadius: 12, padding: '14px 16px',
      transition: 'border-color .15s',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 8 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--color-text)', marginBottom: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {index + 1}. {s.nom}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>
            {s.adresse}{s.adresse && s.ville ? ', ' : ''}{s.ville}
          </div>
        </div>
        <div style={{
          flexShrink: 0, padding: '3px 9px', borderRadius: 20,
          fontSize: '0.72rem', fontWeight: 700,
          background: `${badge.couleur}15`, border: `1px solid ${badge.couleur}40`,
          color: badge.couleur,
        }}>
          {badge.label}
        </div>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
        {/* Points de charge */}
        <span style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>
          🔌 {s.nb_points} point{s.nb_points > 1 ? 's' : ''}
        </span>

        {/* Opérateur */}
        {s.operateur && (
          <span style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>
            · {s.operateur.length > 22 ? s.operateur.slice(0, 22) + '…' : s.operateur}
          </span>
        )}

        {/* Accès */}
        {s.acces !== 'inconnu' && (
          <span style={{
            fontSize: '0.72rem', padding: '2px 8px', borderRadius: 20,
            background: s.acces === 'public' ? 'rgba(34,197,94,0.1)' : 'rgba(245,158,11,0.1)',
            border: s.acces === 'public' ? '1px solid rgba(34,197,94,0.3)' : '1px solid rgba(245,158,11,0.3)',
            color: s.acces === 'public' ? '#16a34a' : '#d97706',
          }}>
            {s.acces === 'public' ? '✓ Public' : '💳 Payant / Abonnement'}
          </span>
        )}

        {/* Statut */}
        {s.statut === 'hors_service' && (
          <span style={{
            fontSize: '0.72rem', padding: '2px 8px', borderRadius: 20,
            background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
            color: '#ef4444',
          }}>
            ⚠️ Hors service
          </span>
        )}

        {/* Distance depuis départ */}
        {s.distance_depart_km !== undefined && (
          <span style={{
            marginLeft: 'auto', fontSize: '0.78rem', fontWeight: 600,
            color: 'var(--color-primary)',
          }}>
            à {s.distance_depart_km} km du départ
          </span>
        )}
      </div>

      {/* Types de prise */}
      {s.types_prise.length > 0 && (
        <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
          {s.types_prise.map(t => (
            <span key={t} style={{
              fontSize: '0.69rem', padding: '1px 7px', borderRadius: 20,
              background: 'var(--color-bg-alt)', border: '1px solid var(--color-border)',
              color: 'var(--color-text-muted)',
            }}>
              {t}
            </span>
          ))}
        </div>
      )}

      {/* Lien itinéraire Google Maps */}
      <a
        href={`https://www.google.com/maps/dir/?api=1&destination=${s.coords.lat},${s.coords.lng}`}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          display: 'inline-block', marginTop: 10, fontSize: '0.76rem',
          color: 'var(--color-primary)', textDecoration: 'none', fontWeight: 600,
        }}
      >
        📍 Itinéraire →
      </a>
    </div>
  )
}

// ─── Composant principal ──────────────────────────────────────────────────────

export default function StationsRecharge({ coordDepart, coordArrivee, villeDepart, villeArrivee, distanceTrajet }: Props) {
  const [stations,       setStations]       = useState<Station[]>([])
  const [chargement,     setChargement]     = useState(false)
  const [erreur,         setErreur]         = useState('')
  const [charge,         setCharge]         = useState(false)   // si l'utilisateur a cliqué
  const [vue,            setVue]            = useState<'liste' | 'carte'>('liste')
  // Coordonnées résolues (soit issues des props, soit géocodées à la demande)
  const [resolvedCoords, setResolvedCoords] = useState<{ depart: Coords; arrivee: Coords } | null>(null)

  // Filtres
  const [puissance,     setPuissance]     = useState<FiltrePuissance>('tous')
  const [operateur,     setOperateur]     = useState('tous')
  const [sansHorsService, setSansHorsService] = useState(true)

  // Charger les stations au clic sur le bouton
  const chargerStations = async () => {
    setCharge(true)
    setChargement(true)
    setErreur('')
    setStations([])

    try {
      // Résoudre les coordonnées si non fournies (géocodage des noms de villes)
      let cD = coordDepart
      let cA = coordArrivee

      if (!cD || !cA) {
        if (!villeDepart || !villeArrivee) {
          setErreur('Coordonnées ou noms de villes requis')
          return
        }
        const [gD, gA] = await Promise.all([
          geocoderVille(villeDepart),
          geocoderVille(villeArrivee),
        ])
        if (!gD || !gA) {
          setErreur(`Impossible de géocoder ${!gD ? villeDepart : villeArrivee}`)
          return
        }
        // ORSCoordonnees utilise `lon`, Coords utilise `lng`
        cD = { lat: gD.lat, lng: gD.lon }
        cA = { lat: gA.lat, lng: gA.lon }
      }

      setResolvedCoords({ depart: cD, arrivee: cA })
      const radius = Math.min(15, Math.max(8, distanceTrajet / 40))
      const nbPoints = distanceTrajet > 300 ? 6 : distanceTrajet > 150 ? 4 : 3
      const data = await fetchStationsAlongRoute(cD, cA, {
        radius: Math.round(radius),
        nbPoints,
      })
      setStations(data)
    } catch (e) {
      setErreur(e instanceof Error ? e.message : 'Erreur inconnue')
    } finally {
      setChargement(false)
    }
  }

  // Opérateurs disponibles (pour le filtre)
  const operateurs = useMemo(() => {
    const set = new Set<string>()
    for (const s of stations) {
      if (s.operateur) set.add(s.operateur)
    }
    return Array.from(set).sort()
  }, [stations])

  // Stations filtrées
  const stationsFiltrees = useMemo(() => {
    return filtrerStations(stations, {
      puissance,
      operateur: operateur === 'tous' ? undefined : operateur,
      sansHorsService,
    })
  }, [stations, puissance, operateur, sansHorsService])

  // Bouton "voir les stations"
  if (!charge) {
    return (
      <div style={{
        background: 'var(--color-bg-card)',
        border: '1.5px solid var(--color-border)',
        borderRadius: 14, padding: '20px 22px',
        marginTop: 28,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: 4 }}>
              ⚡ Stations de recharge sur ce trajet
            </div>
            <p style={{ margin: 0, fontSize: '0.83rem', color: 'var(--color-text-muted)' }}>
              Bornes publiques et en accès libre ou abonnement (OpenChargeMap)
            </p>
          </div>
          <button
            onClick={chargerStations}
            style={{
              padding: '11px 22px', borderRadius: 10, border: 'none', cursor: 'pointer',
              background: 'var(--color-primary)', color: '#0a1628',
              fontWeight: 700, fontSize: '0.9rem', flexShrink: 0,
            }}
          >
            Voir les stations ⚡
          </button>
        </div>
      </div>
    )
  }

  // État de chargement
  if (chargement) {
    return (
      <div style={{
        background: 'var(--color-bg-card)',
        border: '1.5px solid var(--color-border)',
        borderRadius: 14, padding: '24px',
        marginTop: 28, textAlign: 'center',
      }}>
        <div style={{ fontSize: '1.4rem', marginBottom: 10 }}>⚡</div>
        <div style={{ fontWeight: 600, marginBottom: 6 }}>Recherche des bornes de recharge…</div>
        <p style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', margin: 0 }}>
          Interrogation OpenChargeMap le long du trajet
        </p>
      </div>
    )
  }

  // Erreur
  if (erreur) {
    return (
      <div style={{
        background: 'rgba(239,68,68,0.05)',
        border: '1.5px solid rgba(239,68,68,0.3)',
        borderRadius: 14, padding: '20px 22px', marginTop: 28,
      }}>
        <div style={{ fontWeight: 700, color: '#ef4444', marginBottom: 6 }}>⚠️ Erreur de chargement</div>
        <p style={{ margin: '0 0 12px', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>{erreur}</p>
        <button
          onClick={chargerStations}
          style={{
            padding: '9px 18px', borderRadius: 8, border: 'none', cursor: 'pointer',
            background: 'var(--color-primary)', color: '#0a1628', fontWeight: 700,
          }}
        >
          Réessayer
        </button>
      </div>
    )
  }

  return (
    <div style={{ marginTop: 28 }}>
      {/* ── En-tête ── */}
      <div style={{
        background: 'var(--color-bg-card)',
        border: '1.5px solid var(--color-border)',
        borderRadius: 14, padding: '18px 20px',
        marginBottom: 16,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: 3 }}>
              ⚡ {stationsFiltrees.length} station{stationsFiltrees.length !== 1 ? 's' : ''} trouvée{stationsFiltrees.length !== 1 ? 's' : ''}
              {stations.length !== stationsFiltrees.length && (
                <span style={{ fontWeight: 400, color: 'var(--color-text-muted)', fontSize: '0.85rem', marginLeft: 8 }}>
                  (sur {stations.length} au total)
                </span>
              )}
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>
              Dans un rayon de ~10 km le long du trajet • Source : OpenChargeMap
            </div>
          </div>
          {/* Bascule liste / carte */}
          <div style={{
            display: 'flex', background: 'var(--color-bg-alt)',
            borderRadius: 9, padding: 3, gap: 3,
          }}>
            {(['liste', 'carte'] as const).map(v => (
              <button key={v} onClick={() => setVue(v)} style={{
                padding: '7px 16px', borderRadius: 7, border: 'none', cursor: 'pointer',
                fontWeight: vue === v ? 700 : 400, fontSize: '0.85rem',
                background: vue === v ? 'var(--color-primary)' : 'transparent',
                color: vue === v ? '#0a1628' : 'var(--color-text-muted)',
                transition: 'all .15s',
              }}>
                {v === 'liste' ? '📋 Liste' : '🗺️ Carte'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Filtres ── */}
      <div style={{
        background: 'var(--color-bg-card)', border: '1.5px solid var(--color-border)',
        borderRadius: 12, padding: '14px 16px', marginBottom: 16,
        display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center',
      }}>
        {/* Filtre puissance */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', fontWeight: 600, marginRight: 2 }}>
            Puissance min :
          </span>
          {([
            { v: 'tous', label: 'Toutes' },
            { v: '22',  label: '≥ 22 kW' },
            { v: '50',  label: '≥ 50 kW' },
            { v: '150', label: '≥ 150 kW' },
          ] as { v: FiltrePuissance; label: string }[]).map(({ v, label }) => (
            <button key={v} onClick={() => setPuissance(v)} style={{
              padding: '5px 12px', borderRadius: 20, cursor: 'pointer',
              fontSize: '0.78rem', fontWeight: puissance === v ? 700 : 400,
              border: puissance === v ? '1.5px solid var(--color-primary)' : '1.5px solid var(--color-border)',
              background: puissance === v ? 'rgba(122,240,194,0.1)' : 'transparent',
              color: puissance === v ? 'var(--color-primary)' : 'var(--color-text-muted)',
              transition: 'all .15s',
            }}>
              {label}
            </button>
          ))}
        </div>

        {/* Filtre opérateur */}
        {operateurs.length > 1 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>
              Opérateur :
            </span>
            <select
              value={operateur}
              onChange={e => setOperateur(e.target.value)}
              style={{
                padding: '5px 10px', borderRadius: 8,
                border: '1.5px solid var(--color-border)',
                background: 'var(--color-bg-alt)', color: 'var(--color-text)',
                fontSize: '0.8rem', cursor: 'pointer',
              }}
            >
              <option value="tous">Tous</option>
              {operateurs.map(o => (
                <option key={o} value={o}>{o.length > 28 ? o.slice(0, 28) + '…' : o}</option>
              ))}
            </select>
          </div>
        )}

        {/* Filtre hors service */}
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>
          <input
            type="checkbox"
            checked={sansHorsService}
            onChange={e => setSansHorsService(e.target.checked)}
            style={{ cursor: 'pointer' }}
          />
          Masquer hors service
        </label>
      </div>

      {/* ── Aucun résultat ── */}
      {stationsFiltrees.length === 0 && stations.length > 0 && (
        <div style={{
          background: 'var(--color-bg-card)', border: '1.5px solid var(--color-border)',
          borderRadius: 12, padding: '20px', textAlign: 'center',
          color: 'var(--color-text-muted)', fontSize: '0.87rem',
        }}>
          Aucune station ne correspond aux filtres sélectionnés.{' '}
          <button
            onClick={() => { setPuissance('tous'); setOperateur('tous'); setSansHorsService(false) }}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-primary)', fontWeight: 700, fontSize: '0.87rem' }}
          >
            Réinitialiser les filtres
          </button>
        </div>
      )}

      {stationsFiltrees.length === 0 && stations.length === 0 && (
        <div style={{
          background: 'var(--color-bg-card)', border: '1.5px solid var(--color-border)',
          borderRadius: 12, padding: '20px', textAlign: 'center',
          color: 'var(--color-text-muted)', fontSize: '0.87rem',
        }}>
          Aucune station de recharge trouvée sur ce trajet. Les données OpenChargeMap peuvent être incomplètes.
        </div>
      )}

      {/* ── Carte Leaflet ── */}
      {vue === 'carte' && stationsFiltrees.length > 0 && resolvedCoords && (
        <div style={{ marginBottom: 16 }}>
          <CarteStations
            stations={stationsFiltrees}
            coordDepart={resolvedCoords.depart}
            coordArrivee={resolvedCoords.arrivee}
          />
        </div>
      )}

      {/* ── Liste ── */}
      {vue === 'liste' && stationsFiltrees.length > 0 && (
        <div style={{ display: 'grid', gap: 10, gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
          {stationsFiltrees.map((s, i) => (
            <CarteStation key={s.id} s={s} index={i} />
          ))}
        </div>
      )}

      {/* Note OCM */}
      <p style={{
        marginTop: 14, fontSize: '0.72rem', color: 'var(--color-text-muted)', lineHeight: 1.5,
      }}>
        Données : <a href="https://openchargemap.org" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-primary)' }}>OpenChargeMap</a> — contributeurs bénévoles.
        Les informations peuvent être incomplètes ou non à jour. Vérifiez auprès de l&apos;opérateur avant déplacement.
      </p>
    </div>
  )
}
