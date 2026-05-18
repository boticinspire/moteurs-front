'use client'

/**
 * Moteurs.com — Carte Leaflet des stations de recharge
 * Chargée dynamiquement (no SSR) via `dynamic()` dans StationsRecharge.tsx
 */

import { useEffect, useRef } from 'react'
import { type Station, badgePuissance, type Coords } from '@/lib/openchargemaps'

interface Props {
  stations: Station[]
  coordDepart: Coords
  coordArrivee: Coords
}

export default function CarteStations({ stations, coordDepart, coordArrivee }: Props) {
  const mapRef = useRef<HTMLDivElement>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const leafletMap = useRef<any>(null)

  useEffect(() => {
    if (!mapRef.current) return

    // Nettoyage si la carte existait déjà (rechargement de données)
    if (leafletMap.current) {
      leafletMap.current.remove()
      leafletMap.current = null
    }

    // Import dynamique de Leaflet (côté client uniquement)
    import('leaflet').then(L => {
      // Icônes Leaflet par défaut (hack CDN)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const iconDefault = L.Icon.Default as any
      delete iconDefault.prototype._getIconUrl
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
        iconUrl:       'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
        shadowUrl:     'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
      })

      // Centre de la carte = milieu du trajet
      const centerLat = (coordDepart.lat + coordArrivee.lat) / 2
      const centerLng = (coordDepart.lng + coordArrivee.lng) / 2

      const map = L.map(mapRef.current!).setView([centerLat, centerLng], 7)
      leafletMap.current = map

      // Tuiles OpenStreetMap
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 18,
      }).addTo(map)

      // ── Ligne du trajet ──
      L.polyline(
        [[coordDepart.lat, coordDepart.lng], [coordArrivee.lat, coordArrivee.lng]],
        { color: '#7af0c2', weight: 3, opacity: 0.7, dashArray: '8 5' }
      ).addTo(map)

      // ── Marqueur départ ──
      const iconDepart = L.divIcon({
        html: `<div style="background:#22c55e;color:white;border-radius:50%;width:28px;height:28px;display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:700;border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.4)">A</div>`,
        className: '',
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      })
      L.marker([coordDepart.lat, coordDepart.lng], { icon: iconDepart })
        .addTo(map)
        .bindPopup('<strong>Départ</strong>')

      // ── Marqueur arrivée ──
      const iconArrivee = L.divIcon({
        html: `<div style="background:#ef4444;color:white;border-radius:50%;width:28px;height:28px;display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:700;border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.4)">B</div>`,
        className: '',
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      })
      L.marker([coordArrivee.lat, coordArrivee.lng], { icon: iconArrivee })
        .addTo(map)
        .bindPopup('<strong>Arrivée</strong>')

      // ── Marqueurs des stations ──
      for (const s of stations) {
        const badge = badgePuissance(s.puissance_max_kw)

        // Couleur selon puissance
        let bg = '#6b7280'
        if (s.puissance_max_kw >= 150) bg = '#7c3aed'
        else if (s.puissance_max_kw >= 50) bg = '#2563eb'
        else if (s.puissance_max_kw >= 22) bg = '#0891b2'

        if (s.statut === 'hors_service') bg = '#9ca3af'

        const iconStation = L.divIcon({
          html: `<div style="background:${bg};color:white;border-radius:50%;width:22px;height:22px;display:flex;align-items:center;justify-content:center;font-size:11px;border:2px solid white;box-shadow:0 2px 4px rgba(0,0,0,0.4)">⚡</div>`,
          className: '',
          iconSize: [22, 22],
          iconAnchor: [11, 11],
        })

        const popupHtml = `
          <div style="min-width:180px;max-width:240px;font-family:sans-serif">
            <div style="font-weight:700;margin-bottom:4px;font-size:0.9rem">${s.nom}</div>
            ${s.adresse ? `<div style="font-size:0.78rem;color:#6b7280;margin-bottom:4px">${s.adresse}${s.ville ? ', ' + s.ville : ''}</div>` : ''}
            <div style="font-size:0.78rem;margin-bottom:4px">
              <strong>${badge.label}</strong> · ${s.nb_points} point${s.nb_points > 1 ? 's' : ''}
            </div>
            ${s.operateur ? `<div style="font-size:0.75rem;color:#6b7280">${s.operateur}</div>` : ''}
            ${s.statut === 'hors_service' ? '<div style="color:#ef4444;font-size:0.75rem;margin-top:4px">⚠️ Hors service</div>' : ''}
            <a href="https://www.google.com/maps/dir/?api=1&destination=${s.coords.lat},${s.coords.lng}"
               target="_blank" rel="noopener noreferrer"
               style="display:inline-block;margin-top:8px;font-size:0.75rem;color:#7af0c2;font-weight:700">
              📍 Itinéraire →
            </a>
          </div>
        `

        L.marker([s.coords.lat, s.coords.lng], { icon: iconStation })
          .addTo(map)
          .bindPopup(popupHtml)
      }

      // Ajuster le zoom pour englober départ + arrivée
      const bounds = L.latLngBounds([
        [coordDepart.lat, coordDepart.lng],
        [coordArrivee.lat, coordArrivee.lng],
        ...stations.slice(0, 20).map(s => [s.coords.lat, s.coords.lng] as [number, number]),
      ])
      map.fitBounds(bounds, { padding: [40, 40] })
    })

    return () => {
      if (leafletMap.current) {
        leafletMap.current.remove()
        leafletMap.current = null
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stations])

  return (
    <>
      {/* CSS Leaflet */}
      <link
        rel="stylesheet"
        href="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css"
      />
      <div
        ref={mapRef}
        style={{ height: 380, borderRadius: 12, overflow: 'hidden', border: '1.5px solid var(--color-border)' }}
      />
      {/* Légende */}
      <div style={{
        marginTop: 8, display: 'flex', gap: 12, flexWrap: 'wrap',
        fontSize: '0.74rem', color: 'var(--color-text-muted)',
      }}>
        {[
          { color: '#7c3aed', label: '≥ 150 kW (DC rapide)' },
          { color: '#2563eb', label: '50–149 kW (DC)' },
          { color: '#0891b2', label: '22–49 kW (AC)' },
          { color: '#6b7280', label: '< 22 kW' },
          { color: '#9ca3af', label: 'Hors service' },
        ].map(({ color, label }) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <div style={{ width: 12, height: 12, borderRadius: '50%', background: color, flexShrink: 0 }} />
            {label}
          </div>
        ))}
      </div>
    </>
  )
}
