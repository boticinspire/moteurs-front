'use client'

import { useState, useMemo } from 'react'
import {
  fmtEur, fmtDuree,
  PRIX_ENERGIE, type Route, type MotorisationTrajet,
} from '@/lib/trajet'
import routesData from '@/data/routes-vacances.json'

const ROUTES = routesData as Route[]

// ─── Types ────────────────────────────────────────────────────────────────────

type Motorisation = MotorisationTrajet
type CategorieVehicule = 'citadine' | 'berline' | 'suv' | 'monospace'
type TypeHebergement = 'hotel' | 'airbnb' | 'camping' | 'famille'

interface WizardData {
  // Étape 1 — Trajet
  modeRoute:    'populaire' | 'libre'
  routeSlug:    string
  libreDepart:  string
  libreArrivee: string
  libreDistance:string
  librePeages:  string
  // Étape 2 — Véhicule
  motorisation:     Motorisation
  categorieVehicule:CategorieVehicule
  autonomieVE:      number   // km autoroute réels
  avecGalerie:      boolean  // coffre/galerie de toit
  // Étape 3 — Voyage
  nbAdultes:        number
  nbEnfants:        number
  avecAnimal:       boolean
  moisDepart:       number   // 1-12
  nbNuits:          number
  typeHebergement:  TypeHebergement
}

// ─── Consommations autoroute ──────────────────────────────────────────────────

const CONSO_AUTOROUTE: Record<CategorieVehicule, Record<Motorisation, number>> = {
  citadine: { diesel: 5.5, essence: 6.8, elec: 18, phev: 5.0 },
  berline:  { diesel: 6.0, essence: 7.5, elec: 20, phev: 5.5 },
  suv:      { diesel: 7.0, essence: 8.5, elec: 22, phev: 6.5 },
  monospace:{ diesel: 8.0, essence: 10.0, elec: 26, phev: 7.5 },
}

const COFFRE_LITRES: Record<CategorieVehicule, number> = {
  citadine: 300, berline: 450, suv: 550, monospace: 700,
}

const MOIS_LABELS = ['','Jan','Fév','Mar','Avr','Mai','Juin','Juil','Août','Sep','Oct','Nov','Déc']

// ─── Hébergement ──────────────────────────────────────────────────────────────

const LABELS_HEBERGEMENT: Record<TypeHebergement, string> = {
  hotel:   '🏨 Hôtel',
  airbnb:  '🏠 Location / Airbnb',
  camping: '⛺ Camping',
  famille: '👨‍👩‍👧 Famille / Amis',
}

function estimerTarifNuit(arrivee: string, type: TypeHebergement): number {
  if (type === 'famille') return 0
  const a = arrivee.toLowerCase()
  const estPremium = ['nice', 'cannes', 'antibes', 'monaco', 'saint-tropez', 'biarritz',
    'paris', 'courchevel', 'méribel', 'val d', 'chamonix', 'megève'].some(v => a.includes(v))
  const estStandard = ['bordeaux', 'lyon', 'marseille', 'toulouse', 'montpellier', 'barcelone',
    'rome', 'amsterdam', 'bruxelles', 'genève', 'zurich', 'milan', 'madrid'].some(v => a.includes(v))
  const cat = estPremium ? 'premium' : estStandard ? 'standard' : 'eco'
  const tarifs: Record<TypeHebergement, Record<string, number>> = {
    hotel:   { premium: 148, standard: 95, eco: 72 },
    airbnb:  { premium: 110, standard: 68, eco: 48 },
    camping: { premium: 42,  standard: 28, eco: 18 },
    famille: { premium: 0,   standard: 0,  eco: 0  },
  }
  return tarifs[type][cat]
}

// ─── Alertes trafic saisonnières ──────────────────────────────────────────────

interface AlerteTrafic {
  niveau: 'rouge' | 'orange' | 'vert'
  message: string
  joursEviter: string
  heureConseillee: string
}

const ALERTES_TRAFIC: Record<number, AlerteTrafic> = {
  6: { niveau: 'orange', message: 'Début de saison — week-ends chargés. Préférez partir en milieu de semaine.', joursEviter: 'Samedis et dimanches', heureConseillee: 'Avant 8h ou après 19h' },
  7: { niveau: 'rouge',  message: 'Juillet : mois le plus chargé. Évitez les samedis de chassé-croisé (5, 19, 26 juillet). Bison Futé prévoit des journées noires.', joursEviter: 'Sam. 5, 19 et 26 juillet', heureConseillee: 'Avant 7h ou après 21h' },
  8: { niveau: 'rouge',  message: 'Août : saturation totale. Samedis 2 et 9 août ultra-chargés. Partez la nuit ou très tôt matin.', joursEviter: 'Sam. 2 et 9 août', heureConseillee: 'Avant 6h30 ou après 21h' },
  9: { niveau: 'orange', message: 'Retours vacances : vendredis soir et dimanches chargés jusqu\'à mi-septembre.', joursEviter: 'Vendredis soir et dimanches', heureConseillee: 'Avant 9h ou après 20h' },
}

// ─── Calcul budget transport ──────────────────────────────────────────────────

function calculerBudget(route: Route, data: WizardData) {
  const conso_base = CONSO_AUTOROUTE[data.categorieVehicule][data.motorisation]
  const conso = data.avecGalerie ? conso_base * 1.10 : conso_base   // +10% avec galerie
  let coutEnergie = 0
  let nbArrets = 0
  let tempsRecharge = 0

  if (data.motorisation === 'diesel') {
    coutEnergie = (conso / 100) * route.distance_km * PRIX_ENERGIE.diesel
  } else if (data.motorisation === 'essence') {
    coutEnergie = (conso / 100) * route.distance_km * PRIX_ENERGIE.essence
  } else if (data.motorisation === 'elec') {
    coutEnergie = (conso / 100) * route.distance_km * PRIX_ENERGIE.elec_blended
    nbArrets = Math.max(0, Math.ceil(route.distance_km / data.autonomieVE) - 1)
    tempsRecharge = nbArrets * 30
  } else {
    const kme = Math.min(50, route.distance_km)
    const kmt = route.distance_km - kme
    coutEnergie = (15 / 100) * kme * PRIX_ENERGIE.elec_home + (conso / 100) * kmt * PRIX_ENERGIE.diesel
  }

  const surplusGalerie = data.avecGalerie
    ? (conso_base * 0.10 / 100) * route.distance_km *
      (data.motorisation === 'diesel' ? PRIX_ENERGIE.diesel : data.motorisation === 'elec' ? PRIX_ENERGIE.elec_blended : PRIX_ENERGIE.essence)
    : 0

  return {
    coutEnergie: Math.round(coutEnergie),
    coutPeages: route.peages_eur,
    coutAller: Math.round(coutEnergie + route.peages_eur),
    coutAR: Math.round((coutEnergie + route.peages_eur) * 2),
    nbArrets,
    tempsRecharge,
    dureeMin: route.duree_base_min + tempsRecharge,
    surplusGalerie: Math.round(surplusGalerie),
  }
}

// ─── Itinéraire économique ─────────────────────────────────────────────────────

function calculerItineraireEco(route: Route, data: WizardData) {
  const conso_auto = CONSO_AUTOROUTE[data.categorieVehicule][data.motorisation] * (data.avecGalerie ? 1.10 : 1)
  // Route nationale : +18% distance, vitesse moy 82 km/h, conso -18% (vitesse moindre), 0 péages
  const km_nat   = Math.round(route.distance_km * 1.18)
  const conso_nat = conso_auto * 0.82
  const duree_nat = Math.round((km_nat / 82) * 60)

  const getEnergie = (conso: number, km: number): number => {
    if (data.motorisation === 'diesel')  return (conso / 100) * km * PRIX_ENERGIE.diesel
    if (data.motorisation === 'essence') return (conso / 100) * km * PRIX_ENERGIE.essence
    if (data.motorisation === 'elec')    return (conso / 100) * km * PRIX_ENERGIE.elec_blended
    // phev
    const kme = Math.min(50, km)
    return (15 / 100) * kme * PRIX_ENERGIE.elec_home + (conso / 100) * Math.max(0, km - kme) * PRIX_ENERGIE.diesel
  }

  const energie_auto = getEnergie(conso_auto, route.distance_km)
  const energie_nat  = getEnergie(conso_nat,  km_nat)
  const total_auto   = Math.round(energie_auto + route.peages_eur)
  const total_nat    = Math.round(energie_nat)
  const economie     = total_auto - total_nat
  const tempsSupp    = duree_nat - route.duree_base_min

  return {
    autoroute: { km: route.distance_km, duree: route.duree_base_min, energie: Math.round(energie_auto), peages: route.peages_eur, total: total_auto },
    nationale: { km: km_nat, duree: duree_nat, energie: Math.round(energie_nat), peages: 0, total: total_nat },
    economie,
    tempsSupp,
    valeurTemps: (economie > 0 && tempsSupp > 0) ? Math.round(economie / (tempsSupp / 60)) : 0,
  }
}

// ─── Bagages & coffre ─────────────────────────────────────────────────────────

function calculerBagages(data: WizardData) {
  const coffreBase  = COFFRE_LITRES[data.categorieVehicule]
  const galerieExtra = data.avecGalerie ? 380 : 0
  const total       = coffreBase + galerieExtra
  const passagers   = data.nbAdultes + data.nbEnfants
  const besoinEstime = passagers * 50 + (data.nbEnfants > 0 ? 55 : 0)  // 50L/pers + poussette 55L
  const maxValises  = Math.floor(total / 50)
  const pctRempli   = Math.min(100, Math.round((besoinEstime / total) * 100))

  let statut: 'ok' | 'limite' | 'insuffisant'
  if (besoinEstime <= total * 0.80)   statut = 'ok'
  else if (besoinEstime <= total)      statut = 'limite'
  else                                 statut = 'insuffisant'

  return { coffreBase, galerieExtra, total, maxValises, besoinEstime, passagers, pctRempli, statut }
}

// ─── Stratégie recharge VE ────────────────────────────────────────────────────

function calculerRecharge(route: Route, data: WizardData) {
  if (data.motorisation !== 'elec') return null
  const conso       = CONSO_AUTOROUTE[data.categorieVehicule]['elec'] * (data.avecGalerie ? 1.10 : 1)
  const kwh_total   = (conso / 100) * route.distance_km
  const nbArrets    = Math.max(0, Math.ceil(route.distance_km / data.autonomieVE) - 1)

  const cout_dc     = Math.round(kwh_total * 0.45)   // tout bornes DC autoroute
  const cout_ac     = Math.round(kwh_total * 0.18)   // tout AC hôtel
  const kwh_dc_mix  = (conso / 100) * Math.min(route.distance_km, nbArrets * data.autonomieVE * 0.5)
  const cout_mix    = Math.round(kwh_dc_mix * 0.45 + (kwh_total - kwh_dc_mix) * 0.18)

  return {
    kwh_total: Math.round(kwh_total),
    cout_dc, cout_ac, cout_mix,
    nbArrets,
    economie_vs_dc: cout_dc - cout_ac,
  }
}

// ─── Conseils personnalisés ───────────────────────────────────────────────────

function genererConseils(data: WizardData, route: Route): string[] {
  const conseils: string[] = []
  const estEte  = data.moisDepart >= 6 && data.moisDepart <= 9
  const estLong = route.distance_km > 500

  if (data.motorisation === 'elec') {
    conseils.push(`⚡ En été, l'autonomie réelle peut baisser de 15-20% avec la clim. Prévoyez des arrêts plus fréquents si la batterie chauffe.`)
    if (estEte) conseils.push(`🌡️ Recharge VE : préférez la nuit à l'hôtel (borne AC, moins de stress thermique) plutôt que DC en pleine chaleur sur autoroute.`)
    conseils.push(`📱 Utilisez A Better Route Planner (ABRP) pour optimiser vos arrêts selon la température prévue.`)
  }
  if (data.motorisation === 'phev') {
    conseils.push(`🔋 Rechargez votre PHEV chaque soir à l'étape pour maximiser les km électriques le lendemain et réduire la note carburant.`)
  }
  if (data.avecGalerie) {
    conseils.push(`📦 Galerie de toit : limitez-vous à 120 km/h (110 km/h si pleine). Chaque 10 km/h de moins réduit la surconsommation de galerie de ~5%.`)
  }
  if (data.nbEnfants > 0) {
    conseils.push(`👶 Avec ${data.nbEnfants} enfant${data.nbEnfants > 1 ? 's' : ''} : pause toutes les 2h max. Sur ce trajet, prévoyez ${Math.max(1, Math.ceil(route.distance_km / 200) - 1)} pause${Math.ceil(route.distance_km / 200) - 1 > 1 ? 's' : ''} minimum.`)
    if (estEte) conseils.push(`⚠️ Ne laissez jamais un enfant seul dans le véhicule garé. La température monte à +30°C en moins de 15 minutes.`)
  }
  if (data.avecAnimal) {
    conseils.push(`🐾 Animal à bord : filet ou caisse de transport obligatoire, eau fraîche tous les 100 km, jamais seul dans le véhicule arrêté.`)
  }
  if (data.typeHebergement === 'hotel' && data.motorisation === 'elec') {
    conseils.push(`🏨 Filtrez sur Booking.com avec "infrastructure pour véhicules électriques" — rechargez la nuit à ~0,18 €/kWh vs 0,45 €/kWh en DC autoroute.`)
  }
  if (estEte) {
    conseils.push(`🌅 Partez avant 8h ou après 20h : évitez la chaleur (13h-18h) et les bouchons simultanément.`)
    if (estLong) conseils.push(`💧 1,5 L d'eau par personne dans l'habitacle (pas dans le coffre). La déshydratation augmente le risque de somnolence de 40%.`)
  }
  if (estLong) {
    conseils.push(`⏱️ Pause obligatoire toutes les 2h : fatigue + chaleur = risque x3. Sur ${route.distance_km} km, prévoyez ${Math.max(1, Math.ceil(route.distance_km / 200) - 1)} pause${Math.ceil(route.distance_km / 200) - 1 > 1 ? 's' : ''}.`)
  }

  return conseils
}

// ─── Liens utiles ─────────────────────────────────────────────────────────────

function getLiensUtiles(route: Route, motorisation: Motorisation) {
  const dest   = encodeURIComponent(route.arrivee)
  const depart = encodeURIComponent(route.depart)
  return {
    viaMichelin:  `https://www.viamichelin.fr/web/itineraires?departure=${depart}&arrival=${dest}`,
    mappy:        `https://fr.mappy.com/#/${depart}/${dest}`,
    bisonFute:    'https://www.bison-fute.gouv.fr/',
    abrp:         motorisation === 'elec' ? `https://abetterrouteplanner.com/?plan_uuid=&from=${depart}&to=${dest}` : null,
    opencharge:   'https://map.openchargemap.io/#zoom=8&lat=46.8&lng=2.3',
    booking:      `https://www.booking.com/searchresults.fr.html?ss=${dest}&nflt=hotelfacility%3D2`,
    bookingElec:  `https://www.booking.com/searchresults.fr.html?ss=${dest}&nflt=hotelfacility%3D2%3Bhotelfacility%3D182`,
  }
}

// ─── Composants atomiques ─────────────────────────────────────────────────────

function Row({ label, value, bold, color }: { label: string; value: string; bold?: boolean; color?: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
      <span style={{ color: 'var(--color-text-muted)', fontSize: '0.84rem' }}>{label}</span>
      <span style={{ fontWeight: bold ? 700 : 500, color: color || 'var(--color-text)', fontSize: '0.84rem' }}>{value}</span>
    </div>
  )
}

function Chip({ label, color }: { label: string; color?: string }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', padding: '4px 10px',
      borderRadius: 999, fontSize: '0.76rem', fontWeight: 600,
      background: color ? `${color}20` : 'rgba(255,255,255,0.06)',
      color: color || 'var(--color-text-muted)',
      border: `1px solid ${color ? `${color}40` : 'var(--color-border)'}`,
    }}>
      {label}
    </span>
  )
}

const btnLinkStyle = (bg: string): React.CSSProperties => ({
  display: 'inline-flex', alignItems: 'center', gap: 6,
  padding: '8px 14px', borderRadius: 8, textDecoration: 'none',
  fontSize: '0.82rem', fontWeight: 600, color: 'white',
  background: bg, transition: 'opacity .15s',
})

// ─── Bilan ────────────────────────────────────────────────────────────────────

function Bilan({ data, route }: { data: WizardData; route: Route }) {
  const budget       = calculerBudget(route, data)
  const itineraire   = calculerItineraireEco(route, data)
  const bagages      = calculerBagages(data)
  const recharge     = calculerRecharge(route, data)
  const conseils     = genererConseils(data, route)
  const alerteTrafic = ALERTES_TRAFIC[data.moisDepart]
  const liens        = getLiensUtiles(route, data.motorisation)
  const tarifNuit    = estimerTarifNuit(route.arrivee, data.typeHebergement)
  const coutHeberg   = tarifNuit * data.nbNuits
  const coutTotal    = budget.coutAR + coutHeberg
  const nbPassagers  = data.nbAdultes + data.nbEnfants
  const coutAdulte   = Math.round(coutTotal / data.nbAdultes)

  const MOTEUR_EMOJI: Record<Motorisation, string> = { diesel: '⛽', essence: '⛽', elec: '⚡', phev: '🔋' }
  const MOTEUR_LBL:   Record<Motorisation, string> = { diesel: 'Diesel', essence: 'Essence', elec: 'Électrique', phev: 'Hybride recharg.' }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* ──────────── 1. BUDGET TOTAL ──────────── */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(122,240,194,0.1), rgba(59,130,246,0.07))',
        border: '2px solid rgba(122,240,194,0.3)', borderRadius: 16, padding: '24px 28px',
      }}>
        <div style={{ fontSize: '0.78rem', color: 'var(--color-primary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
          Bilan de votre voyage
        </div>
        <h2 style={{ margin: '0 0 4px', fontSize: '1.35rem' }}>
          {route.depart} → {route.arrivee}
        </h2>
        <div style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', marginBottom: 22 }}>
          {route.distance_km} km · {nbPassagers} passager{nbPassagers > 1 ? 's' : ''} ·{' '}
          {MOTEUR_EMOJI[data.motorisation]} {MOTEUR_LBL[data.motorisation]} ·{' '}
          {data.nbNuits} nuit{data.nbNuits > 1 ? 's' : ''} · {LABELS_HEBERGEMENT[data.typeHebergement]}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 10, marginBottom: 16 }}>
          {[
            { label: 'Énergie A/R',   value: fmtEur(budget.coutEnergie * 2),  color: '#059669', sub: `${fmtEur(budget.coutEnergie)}/sens` },
            { label: 'Péages A/R',    value: fmtEur(budget.coutPeages * 2),   color: '#3b82f6', sub: `${fmtEur(budget.coutPeages)}/sens` },
            { label: `Héberg. (${data.nbNuits}n)`, value: fmtEur(coutHeberg), color: '#f59e0b', sub: `~${fmtEur(tarifNuit)}/nuit` },
            { label: 'Total voyage',  value: fmtEur(coutTotal),               color: '#7af0c2', sub: `${fmtEur(coutAdulte)}/adulte` },
          ].map(item => (
            <div key={item.label} style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: '14px 16px' }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', marginBottom: 4 }}>{item.label}</div>
              <div style={{ fontSize: '1.35rem', fontWeight: 800, color: item.color, lineHeight: 1.1 }}>{item.value}</div>
              <div style={{ fontSize: '0.68rem', color: 'var(--color-text-muted)', marginTop: 4 }}>{item.sub}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <Chip label={`⏱️ ${fmtDuree(budget.dureeMin)} de route`} />
          {budget.nbArrets > 0 && <Chip label={`⚡ ${budget.nbArrets} arrêt${budget.nbArrets > 1 ? 's' : ''} recharge (${budget.tempsRecharge} min)`} color="#059669" />}
          {data.avecGalerie && <Chip label={`📦 Galerie +${budget.surplusGalerie} €`} color="#8b5cf6" />}
        </div>
      </div>

      {/* ──────────── 2. ITINÉRAIRE ÉCONOMIQUE ──────────── */}
      <div style={{ background: 'var(--color-bg-card)', border: '1.5px solid var(--color-border)', borderRadius: 12, padding: '18px 20px' }}>
        <div style={{ fontWeight: 700, marginBottom: 14, fontSize: '0.98rem' }}>🗺️ Itinéraire économique — Autoroute vs Nationale</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
          {/* Autoroute */}
          <div style={{ background: 'rgba(59,130,246,0.07)', border: '1px solid rgba(59,130,246,0.25)', borderRadius: 10, padding: '14px 16px' }}>
            <div style={{ fontWeight: 700, color: '#3b82f6', fontSize: '0.82rem', marginBottom: 10 }}>🛣️ Autoroute</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              <Row label="Distance" value={`${itineraire.autoroute.km} km`} />
              <Row label="Durée" value={fmtDuree(itineraire.autoroute.duree)} />
              <Row label="Énergie" value={fmtEur(itineraire.autoroute.energie)} />
              <Row label="Péages" value={fmtEur(itineraire.autoroute.peages)} />
              <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 7, marginTop: 2 }}>
                <Row label="Total aller" value={fmtEur(itineraire.autoroute.total)} bold />
              </div>
            </div>
          </div>
          {/* Nationale */}
          <div style={{ background: 'rgba(5,150,105,0.07)', border: '1px solid rgba(5,150,105,0.25)', borderRadius: 10, padding: '14px 16px' }}>
            <div style={{ fontWeight: 700, color: '#059669', fontSize: '0.82rem', marginBottom: 10 }}>🌳 Route Nationale</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              <Row label="Distance" value={`${itineraire.nationale.km} km (+18%)`} />
              <Row label="Durée" value={`${fmtDuree(itineraire.nationale.duree)} (+${fmtDuree(itineraire.tempsSupp)})`} />
              <Row label="Énergie" value={fmtEur(itineraire.nationale.energie)} />
              <Row label="Péages" value="0 €" color="#059669" />
              <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 7, marginTop: 2 }}>
                <Row label="Total aller" value={fmtEur(itineraire.nationale.total)} bold />
              </div>
            </div>
          </div>
        </div>

        {itineraire.economie > 0 ? (
          <div style={{ background: 'rgba(5,150,105,0.08)', borderRadius: 8, padding: '12px 14px', fontSize: '0.86rem', lineHeight: 1.55 }}>
            💰 <strong>Économie : {fmtEur(itineraire.economie)} à l&apos;aller</strong> ({fmtEur(itineraire.economie * 2)} A/R) en prenant la nationale.
            Contrepartie : +{fmtDuree(itineraire.tempsSupp)} de trajet.
            {itineraire.valeurTemps > 0 && <> Votre heure économisée vaut <strong>{fmtEur(itineraire.valeurTemps)}/h</strong> — à vous de décider.</>}
          </div>
        ) : (
          <div style={{ background: 'rgba(239,68,68,0.06)', borderRadius: 8, padding: '12px 14px', fontSize: '0.86rem', color: 'var(--color-text-muted)' }}>
            Sur ce trajet, la route nationale revient plus cher (l&apos;extra carburant dépasse l&apos;économie sur les péages). <strong>L&apos;autoroute est le meilleur choix économique.</strong>
          </div>
        )}
      </div>

      {/* ──────────── 3. ALERTE TRAFIC ──────────── */}
      {alerteTrafic && (
        <div style={{
          background: alerteTrafic.niveau === 'rouge' ? 'rgba(239,68,68,0.08)' : 'rgba(245,158,11,0.08)',
          border: `1px solid ${alerteTrafic.niveau === 'rouge' ? 'rgba(239,68,68,0.3)' : 'rgba(245,158,11,0.3)'}`,
          borderRadius: 12, padding: '16px 20px',
        }}>
          <div style={{
            fontWeight: 700, marginBottom: 10,
            color: alerteTrafic.niveau === 'rouge' ? '#ef4444' : '#f59e0b',
            display: 'flex', gap: 8, alignItems: 'center',
          }}>
            <span style={{ fontSize: '1.3rem' }}>{alerteTrafic.niveau === 'rouge' ? '🚨' : '⚠️'}</span>
            Trafic {MOIS_LABELS[data.moisDepart]} — Niveau {alerteTrafic.niveau.toUpperCase()}
          </div>
          <p style={{ margin: '0 0 14px', fontSize: '0.88rem', color: 'var(--color-text-muted)', lineHeight: 1.5 }}>
            {alerteTrafic.message}
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {[
              { label: '🚫 Jours à éviter', value: alerteTrafic.joursEviter },
              { label: '✅ Heure conseillée', value: alerteTrafic.heureConseillee },
            ].map(({ label, value }) => (
              <div key={label} style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 8, padding: '10px 12px' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', marginBottom: 4 }}>{label}</div>
                <div style={{ fontSize: '0.88rem', fontWeight: 600 }}>{value}</div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 12, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <a href={liens.bisonFute} target="_blank" rel="noopener noreferrer" style={btnLinkStyle('#f59e0b')}>🦬 Bison Futé live</a>
            <a href={liens.viaMichelin} target="_blank" rel="noopener noreferrer" style={btnLinkStyle('#e84393')}>🗺️ ViaMichelin</a>
            <a href={liens.mappy} target="_blank" rel="noopener noreferrer" style={btnLinkStyle('#6366f1')}>🗺️ Mappy</a>
          </div>
        </div>
      )}

      {/* ──────────── 4. RECHARGE VE ──────────── */}
      {recharge && (
        <div style={{ background: 'rgba(5,150,105,0.07)', border: '1px solid rgba(5,150,105,0.25)', borderRadius: 12, padding: '18px 20px' }}>
          <div style={{ fontWeight: 700, marginBottom: 14, color: '#059669' }}>
            ⚡ Stratégie de recharge — {recharge.kwh_total} kWh nécessaires
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 14 }}>
            {[
              { label: '🔌 Tout DC rapide', sub: '0,45 €/kWh · bornes autorte', value: fmtEur(recharge.cout_dc), color: '#ef4444' },
              { label: '🌙 Tout AC hôtel', sub: '0,18 €/kWh · nuit complète', value: fmtEur(recharge.cout_ac), color: '#059669' },
              { label: '🔀 Mix conseillé', sub: 'AC nuit + DC si urgence', value: fmtEur(recharge.cout_mix), color: '#3b82f6' },
            ].map(s => (
              <div key={s.label} style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 8, padding: '12px 14px', textAlign: 'center' }}>
                <div style={{ fontSize: '0.78rem', fontWeight: 600, marginBottom: 6 }}>{s.label}</div>
                <div style={{ fontSize: '1.35rem', fontWeight: 800, color: s.color }}>{s.value}</div>
                <div style={{ fontSize: '0.68rem', color: 'var(--color-text-muted)', marginTop: 4 }}>{s.sub}</div>
              </div>
            ))}
          </div>
          <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: 14, lineHeight: 1.5 }}>
            {recharge.nbArrets === 0
              ? `✅ Votre autonomie de ${data.autonomieVE} km couvre le trajet sans arrêt de recharge nécessaire.`
              : `${recharge.nbArrets} arrêt${recharge.nbArrets > 1 ? 's' : ''} DC nécessaire${recharge.nbArrets > 1 ? 's' : ''} (~30 min chacun). Stratégie gagnante : rechargez la nuit à l'hôtel pour économiser ${fmtEur(recharge.economie_vs_dc)} vs tout DC.`
            }
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {liens.abrp && <a href={liens.abrp} target="_blank" rel="noopener noreferrer" style={btnLinkStyle('#059669')}>📱 Planifier ABRP</a>}
            <a href={liens.opencharge} target="_blank" rel="noopener noreferrer" style={btnLinkStyle('#3b82f6')}>🗺️ Carte bornes</a>
            <a href={liens.bookingElec} target="_blank" rel="noopener noreferrer" style={btnLinkStyle('#003580')}>🏨 Hôtels avec borne</a>
          </div>
        </div>
      )}

      {/* ──────────── 5. BAGAGES & COFFRE ──────────── */}
      <div style={{ background: 'var(--color-bg-card)', border: '1.5px solid var(--color-border)', borderRadius: 12, padding: '18px 20px' }}>
        <div style={{ fontWeight: 700, marginBottom: 14, fontSize: '0.98rem' }}>🧳 Bagages & coffre</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 10, marginBottom: 16 }}>
          {[
            { label: 'Coffre voiture', value: `${bagages.coffreBase} L` },
            ...(data.avecGalerie ? [{ label: '+ Galerie toit', value: `+${bagages.galerieExtra} L` }] : []),
            { label: 'Capacité totale', value: `${bagages.total} L` },
            { label: 'Max valises 20"', value: `${bagages.maxValises}` },
          ].map(item => (
            <div key={item.label} style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 8, padding: '12px 14px' }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', marginBottom: 4 }}>{item.label}</div>
              <div style={{ fontSize: '1.15rem', fontWeight: 700 }}>{item.value}</div>
            </div>
          ))}
        </div>

        {/* Barre de remplissage */}
        <div style={{ marginBottom: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.77rem', color: 'var(--color-text-muted)', marginBottom: 6 }}>
            <span>Besoin estimé ({bagages.passagers} pers.{data.nbEnfants > 0 ? ' + poussette' : ''}) : ~{bagages.besoinEstime} L</span>
            <span style={{
              fontWeight: 700,
              color: bagages.statut === 'ok' ? '#059669' : bagages.statut === 'limite' ? '#f59e0b' : '#ef4444',
            }}>
              {bagages.statut === 'ok' ? '✅ Suffisant' : bagages.statut === 'limite' ? '⚠️ Juste' : '❌ Insuffisant'}
            </span>
          </div>
          <div style={{ background: 'var(--color-border)', borderRadius: 999, height: 8, overflow: 'hidden' }}>
            <div style={{
              height: '100%', borderRadius: 999, transition: 'width .5s',
              width: `${bagages.pctRempli}%`,
              background: bagages.statut === 'ok' ? '#059669' : bagages.statut === 'limite' ? '#f59e0b' : '#ef4444',
            }} />
          </div>
        </div>

        {bagages.statut === 'insuffisant' && !data.avecGalerie && (
          <div style={{ background: 'rgba(239,68,68,0.07)', borderRadius: 8, padding: '10px 14px', fontSize: '0.83rem', color: '#ef4444' }}>
            💡 Ajoutez une galerie de toit dans l&apos;étape Véhicule — +380 L qui résout le problème. Location ~15-25 €/jour.
          </div>
        )}
        {bagages.statut === 'insuffisant' && data.avecGalerie && (
          <div style={{ background: 'rgba(239,68,68,0.07)', borderRadius: 8, padding: '10px 14px', fontSize: '0.83rem', color: '#ef4444' }}>
            💡 Même avec galerie, c&apos;est serré. Envisagez un véhicule de catégorie supérieure (SUV ou monospace).
          </div>
        )}
      </div>

      {/* ──────────── 6. CONSEILS PERSONNALISÉS ──────────── */}
      {conseils.length > 0 && (
        <div style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)', borderRadius: 12, padding: '18px 20px' }}>
          <div style={{ fontWeight: 700, marginBottom: 14, fontSize: '0.98rem' }}>🎯 Conseils pour votre voyage</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {conseils.map((c, i) => (
              <div key={i} style={{
                padding: '10px 14px', background: 'rgba(255,255,255,0.03)',
                borderRadius: 8, fontSize: '0.86rem', lineHeight: 1.6,
                borderLeft: '3px solid var(--color-primary)',
              }}>
                {c}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ──────────── 7. LIENS UTILES ──────────── */}
      <div style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)', borderRadius: 12, padding: '18px 20px' }}>
        <div style={{ fontWeight: 700, marginBottom: 12, fontSize: '0.98rem' }}>🔗 Ressources utiles</div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <a href={liens.viaMichelin} target="_blank" rel="noopener noreferrer" style={btnLinkStyle('#e84393')}>🗺️ ViaMichelin</a>
          <a href={liens.mappy} target="_blank" rel="noopener noreferrer" style={btnLinkStyle('#6366f1')}>🗺️ Mappy</a>
          <a href={liens.bisonFute} target="_blank" rel="noopener noreferrer" style={btnLinkStyle('#f59e0b')}>🦬 Bison Futé</a>
          {data.motorisation === 'elec'
            ? <a href={liens.bookingElec} target="_blank" rel="noopener noreferrer" style={btnLinkStyle('#003580')}>🏨 Hôtels avec borne</a>
            : <a href={liens.booking}     target="_blank" rel="noopener noreferrer" style={btnLinkStyle('#003580')}>🏨 Hôtels</a>
          }
          <a href="/comparer-trajet" style={btnLinkStyle('#059669')}>📊 Comparer les motorisations →</a>
        </div>
      </div>

      {/* Note légale */}
      <p style={{ fontSize: '0.73rem', color: 'var(--color-text-muted)', margin: 0, lineHeight: 1.5 }}>
        Estimations basées sur consommations réelles autoroute 2026 (diesel {PRIX_ENERGIE.diesel} €/L, essence {PRIX_ENERGIE.essence} €/L, électricité {PRIX_ENERGIE.elec_blended} €/kWh moyen).
        Hébergement : tarifs indicatifs haute saison, non contractuels. Ces informations sont indicatives et ne remplacent pas les recommandations officielles de sécurité routière.
      </p>
    </div>
  )
}

// ─── Wizard principal ─────────────────────────────────────────────────────────

const DEFAULT: WizardData = {
  modeRoute: 'populaire', routeSlug: 'paris-nice',
  libreDepart: '', libreArrivee: '', libreDistance: '', librePeages: '',
  motorisation: 'diesel', categorieVehicule: 'berline', autonomieVE: 300, avecGalerie: false,
  nbAdultes: 2, nbEnfants: 0, avecAnimal: false,
  moisDepart: 7, nbNuits: 7, typeHebergement: 'hotel',
}

export default function AssistantVacances() {
  const [etape, setEtape]   = useState(1)
  const [data,  setData]    = useState<WizardData>(DEFAULT)
  const set = (patch: Partial<WizardData>) => setData(d => ({ ...d, ...patch }))

  const route = useMemo<Route | null>(() => {
    if (data.modeRoute === 'populaire') return ROUTES.find(r => r.slug === data.routeSlug) ?? null
    const dist = parseFloat(data.libreDistance)
    if (!dist) return null
    return {
      slug: 'libre',
      depart: data.libreDepart || 'Départ',
      arrivee: data.libreArrivee || 'Arrivée',
      distance_km: dist,
      peages_eur: parseFloat(data.librePeages) || Math.round(dist * 0.07),
      duree_base_min: Math.round((dist / 110) * 60),
      pays_depart: 'FR',
    }
  }, [data])

  const peutAvancer = etape === 1 ? !!route : true

  const ETAPES = ['Trajet', 'Véhicule', 'Voyage', 'Bilan']

  return (
    <div style={{ maxWidth: 720, margin: '0 auto' }}>

      {/* Barre de progression */}
      <div style={{ display: 'flex', gap: 0, marginBottom: 36 }}>
        {ETAPES.map((label, i) => {
          const num   = i + 1
          const actif = num === etape
          const fait  = num < etape
          return (
            <div key={label} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, position: 'relative' }}>
              {i > 0 && <div style={{ position: 'absolute', left: 0, top: 15, width: '50%', height: 2, background: fait || actif ? 'var(--color-primary)' : 'var(--color-border)' }} />}
              {i < 3 && <div style={{ position: 'absolute', right: 0, top: 15, width: '50%', height: 2, background: fait ? 'var(--color-primary)' : 'var(--color-border)' }} />}
              <div style={{
                width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 700, fontSize: '0.85rem', zIndex: 1,
                background: fait || actif ? 'var(--color-primary)' : 'var(--color-bg-card)',
                color: fait || actif ? '#0a1628' : 'var(--color-text-muted)',
                border: actif ? '2px solid var(--color-primary)' : '2px solid var(--color-border)',
              }}>
                {fait ? '✓' : num}
              </div>
              <span style={{ fontSize: '0.73rem', color: actif ? 'var(--color-primary)' : 'var(--color-text-muted)', fontWeight: actif ? 700 : 400 }}>{label}</span>
            </div>
          )
        })}
      </div>

      {/* ── Étape 1 : Trajet ── */}
      {etape === 1 && (
        <EtapeCard titre="📍 Votre trajet" sousTitre="Choisissez votre destination ou saisissez votre propre trajet">
          <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
            {(['populaire', 'libre'] as const).map(m => (
              <button key={m} onClick={() => set({ modeRoute: m })} style={tabBtnStyle(data.modeRoute === m)}>
                {m === 'populaire' ? '🗺️ Routes populaires' : '✏️ Saisie libre'}
              </button>
            ))}
          </div>

          {data.modeRoute === 'populaire' && (
            <div style={{ display: 'grid', gap: 8, gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))' }}>
              {ROUTES.filter(r => r.popular).map(r => (
                <button key={r.slug} onClick={() => set({ routeSlug: r.slug })} style={{
                  textAlign: 'left', padding: '12px 14px', borderRadius: 10, cursor: 'pointer',
                  background: data.routeSlug === r.slug ? 'rgba(122,240,194,0.1)' : 'var(--color-bg-card)',
                  border: data.routeSlug === r.slug ? '2px solid var(--color-primary)' : '1.5px solid var(--color-border)',
                  color: 'var(--color-text)', transition: 'all .15s',
                }}>
                  <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>{r.depart} → {r.arrivee}</div>
                  <div style={{ fontSize: '0.74rem', color: 'var(--color-text-muted)', marginTop: 3 }}>{r.distance_km} km · {fmtDuree(r.duree_base_min)}</div>
                </button>
              ))}
            </div>
          )}

          {data.modeRoute === 'libre' && (
            <div style={{ display: 'grid', gap: 14, gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))' }}>
              {([
                { label: 'Départ',       key: 'libreDepart',    placeholder: 'Paris',  type: 'text' },
                { label: 'Arrivée',      key: 'libreArrivee',   placeholder: 'Nice',   type: 'text' },
                { label: 'Distance (km)',key: 'libreDistance',   placeholder: '750',    type: 'number' },
                { label: 'Péages (€)',   key: 'librePeages',    placeholder: 'auto',   type: 'number' },
              ] as { label: string; key: keyof WizardData; placeholder: string; type: string }[]).map(f => (
                <div key={f.key}>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: 6, fontWeight: 600 }}>{f.label}</label>
                  <input type={f.type} value={data[f.key] as string} onChange={e => set({ [f.key]: e.target.value })}
                    placeholder={f.placeholder} style={inputStyle} />
                </div>
              ))}
            </div>
          )}
        </EtapeCard>
      )}

      {/* ── Étape 2 : Véhicule ── */}
      {etape === 2 && (
        <EtapeCard titre="🚗 Votre véhicule" sousTitre="Motorisation, catégorie et accessoires pour un calcul précis">
          <div style={{ marginBottom: 22 }}>
            <Label>Motorisation</Label>
            <div style={{ display: 'grid', gap: 8, gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))' }}>
              {([
                { value: 'diesel',  label: '⛽ Diesel' },
                { value: 'essence', label: '⛽ Essence' },
                { value: 'elec',    label: '⚡ Électrique' },
                { value: 'phev',    label: '🔋 Hybride rechargeable' },
              ] as { value: Motorisation; label: string }[]).map(opt => (
                <button key={opt.value} onClick={() => set({ motorisation: opt.value })} style={selectBtnStyle(data.motorisation === opt.value)}>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {data.motorisation === 'elec' && (
            <div style={{ marginBottom: 22 }}>
              <Label>Autonomie réelle en autoroute : <strong style={{ color: 'var(--color-primary)' }}>{data.autonomieVE} km</strong></Label>
              <input type="range" min={100} max={600} step={10} value={data.autonomieVE}
                onChange={e => set({ autonomieVE: parseInt(e.target.value) })}
                style={{ width: '100%', accentColor: 'var(--color-primary)' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.73rem', color: 'var(--color-text-muted)', marginTop: 4 }}>
                <span>100 km (citadine)</span><span>600 km (Tesla Model S)</span>
              </div>
            </div>
          )}

          <div style={{ marginBottom: 22 }}>
            <Label>Catégorie de véhicule</Label>
            <div style={{ display: 'grid', gap: 8, gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))' }}>
              {([
                { value: 'citadine',  label: 'Citadine / Compacte', detail: `${COFFRE_LITRES.citadine} L de coffre` },
                { value: 'berline',   label: 'Berline / Familiale',  detail: `${COFFRE_LITRES.berline} L de coffre` },
                { value: 'suv',       label: 'SUV / Crossover',      detail: `${COFFRE_LITRES.suv} L de coffre` },
                { value: 'monospace', label: 'Monospace 7 places',   detail: `${COFFRE_LITRES.monospace} L de coffre` },
              ] as { value: CategorieVehicule; label: string; detail: string }[]).map(opt => (
                <button key={opt.value} onClick={() => set({ categorieVehicule: opt.value })} style={{
                  textAlign: 'left', padding: '12px 14px', borderRadius: 10, cursor: 'pointer',
                  background: data.categorieVehicule === opt.value ? 'rgba(122,240,194,0.1)' : 'var(--color-bg-card)',
                  border: data.categorieVehicule === opt.value ? '2px solid var(--color-primary)' : '1.5px solid var(--color-border)',
                  color: 'var(--color-text)', transition: 'all .15s',
                }}>
                  <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>{opt.label}</div>
                  <div style={{ fontSize: '0.73rem', color: 'var(--color-text-muted)', marginTop: 3 }}>{opt.detail}</div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <Label>Accessoires</Label>
            <button onClick={() => set({ avecGalerie: !data.avecGalerie })} style={{
              ...selectBtnStyle(data.avecGalerie),
              display: 'flex', alignItems: 'center', gap: 8,
            }}>
              <span style={{ fontSize: '1rem' }}>{data.avecGalerie ? '✅' : '○'}</span>
              📦 Galerie / coffre de toit (+380 L)
            </button>
            {data.avecGalerie && (
              <div style={{ marginTop: 8, fontSize: '0.8rem', color: '#f59e0b' }}>
                ⚠️ La galerie augmente la consommation d&apos;environ +10% — intégré dans les calculs.
              </div>
            )}
          </div>
        </EtapeCard>
      )}

      {/* ── Étape 3 : Voyage ── */}
      {etape === 3 && (
        <EtapeCard titre="🧳 Votre voyage" sousTitre="Passagers, hébergement et date pour des conseils personnalisés">
          <div style={{ display: 'grid', gap: 22 }}>

            {/* Passagers */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <Label>Adultes</Label>
                <CompteurPassagers value={data.nbAdultes} min={1} max={7} onChange={v => set({ nbAdultes: v })} />
              </div>
              <div>
                <Label>Enfants (moins de 12 ans)</Label>
                <CompteurPassagers value={data.nbEnfants} min={0} max={5} onChange={v => set({ nbEnfants: v })} />
              </div>
            </div>

            {/* Animal */}
            <div>
              <Label>Animal de compagnie</Label>
              <div style={{ display: 'flex', gap: 8 }}>
                {[{ v: false, l: '🚫 Non' }, { v: true, l: '🐾 Oui' }].map(opt => (
                  <button key={String(opt.v)} onClick={() => set({ avecAnimal: opt.v })} style={selectBtnStyle(data.avecAnimal === opt.v)}>
                    {opt.l}
                  </button>
                ))}
              </div>
            </div>

            {/* Mois de départ */}
            <div>
              <Label>Mois de départ</Label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {[4, 5, 6, 7, 8, 9, 10].map(m => (
                  <button key={m} onClick={() => set({ moisDepart: m })} style={{
                    padding: '8px 14px', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: '0.84rem',
                    background: data.moisDepart === m ? 'var(--color-primary)' : 'var(--color-bg-card)',
                    color: data.moisDepart === m ? '#0a1628' : 'var(--color-text)',
                    border: data.moisDepart === m ? '2px solid var(--color-primary)' : '1.5px solid var(--color-border)',
                    transition: 'all .15s',
                  }}>
                    {MOIS_LABELS[m]}{(m === 7 || m === 8) && ' 🔴'}
                  </button>
                ))}
              </div>
            </div>

            {/* Durée séjour */}
            <div>
              <Label>Durée du séjour</Label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <CompteurPassagers value={data.nbNuits} min={1} max={30} onChange={v => set({ nbNuits: v })} />
                <span style={{ color: 'var(--color-text-muted)', fontSize: '0.88rem' }}>
                  {data.nbNuits} nuit{data.nbNuits > 1 ? 's' : ''}
                </span>
              </div>
            </div>

            {/* Hébergement */}
            <div>
              <Label>Hébergement</Label>
              <div style={{ display: 'grid', gap: 8, gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))' }}>
                {(['hotel', 'airbnb', 'camping', 'famille'] as TypeHebergement[]).map(t => (
                  <button key={t} onClick={() => set({ typeHebergement: t })} style={{
                    textAlign: 'left', padding: '10px 14px', borderRadius: 10, cursor: 'pointer',
                    background: data.typeHebergement === t ? 'rgba(122,240,194,0.1)' : 'var(--color-bg-card)',
                    border: data.typeHebergement === t ? '2px solid var(--color-primary)' : '1.5px solid var(--color-border)',
                    color: 'var(--color-text)', transition: 'all .15s',
                  }}>
                    <div style={{ fontWeight: 600, fontSize: '0.86rem' }}>{LABELS_HEBERGEMENT[t]}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </EtapeCard>
      )}

      {/* ── Étape 4 : Bilan ── */}
      {etape === 4 && route && <Bilan data={data} route={route} />}

      {/* Navigation */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 28 }}>
        {etape > 1
          ? <button onClick={() => setEtape(e => e - 1)} style={navBtnStyle(false)}>← Retour</button>
          : <div />
        }
        {etape < 4
          ? <button onClick={() => { if (peutAvancer) setEtape(e => e + 1) }} disabled={!peutAvancer} style={navBtnStyle(true, peutAvancer)}>
              {etape === 3 ? '🎯 Voir mon bilan →' : 'Suivant →'}
            </button>
          : <button onClick={() => { setEtape(1); setData(DEFAULT) }} style={navBtnStyle(false)}>
              ↺ Nouveau voyage
            </button>
        }
      </div>
    </div>
  )
}

// ─── Sous-composants ──────────────────────────────────────────────────────────

function EtapeCard({ titre, sousTitre, children }: { titre: string; sousTitre: string; children: React.ReactNode }) {
  return (
    <div style={{ background: 'var(--color-bg-card)', border: '1.5px solid var(--color-border)', borderRadius: 16, padding: '28px 28px 24px' }}>
      <h2 style={{ margin: '0 0 6px', fontSize: '1.15rem' }}>{titre}</h2>
      <p style={{ margin: '0 0 22px', color: 'var(--color-text-muted)', fontSize: '0.88rem' }}>{sousTitre}</p>
      {children}
    </div>
  )
}

function Label({ children }: { children: React.ReactNode }) {
  return <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', fontWeight: 600, marginBottom: 10 }}>{children}</div>
}

function CompteurPassagers({ value, min, max, onChange }: { value: number; min: number; max: number; onChange: (v: number) => void }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <button onClick={() => onChange(Math.max(min, value - 1))} style={{ width: 36, height: 36, borderRadius: '50%', border: '1.5px solid var(--color-border)', background: 'var(--color-bg-card)', cursor: 'pointer', fontSize: '1.2rem', color: 'var(--color-text)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>−</button>
      <span style={{ fontWeight: 700, fontSize: '1.35rem', minWidth: 28, textAlign: 'center' }}>{value}</span>
      <button onClick={() => onChange(Math.min(max, value + 1))} style={{ width: 36, height: 36, borderRadius: '50%', border: '1.5px solid var(--color-border)', background: 'var(--color-bg-card)', cursor: 'pointer', fontSize: '1.2rem', color: 'var(--color-text)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
    </div>
  )
}

const tabBtnStyle = (actif: boolean): React.CSSProperties => ({
  padding: '10px 18px', borderRadius: 10, cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem',
  background: actif ? 'var(--color-primary)' : 'var(--color-bg-card)',
  color: actif ? '#0a1628' : 'var(--color-text)',
  border: actif ? '2px solid var(--color-primary)' : '1.5px solid var(--color-border)',
  transition: 'all .15s',
})

const selectBtnStyle = (actif: boolean): React.CSSProperties => ({
  padding: '10px 16px', borderRadius: 10, cursor: 'pointer', fontWeight: 600, fontSize: '0.86rem',
  background: actif ? 'rgba(122,240,194,0.1)' : 'var(--color-bg-card)',
  color: 'var(--color-text)',
  border: actif ? '2px solid var(--color-primary)' : '1.5px solid var(--color-border)',
  transition: 'all .15s',
})

const navBtnStyle = (primaire: boolean, enabled = true): React.CSSProperties => ({
  padding: '12px 28px', borderRadius: 10, cursor: enabled ? 'pointer' : 'not-allowed',
  fontWeight: 700, fontSize: '0.95rem', transition: 'all .15s',
  background: primaire ? (enabled ? 'var(--color-primary)' : 'var(--color-border)') : 'var(--color-bg-card)',
  color: primaire ? (enabled ? '#0a1628' : 'var(--color-text-muted)') : 'var(--color-text)',
  border: primaire ? 'none' : '1.5px solid var(--color-border)',
})

const inputStyle: React.CSSProperties = {
  width: '100%', boxSizing: 'border-box', padding: '10px 12px', borderRadius: 8, fontSize: '0.9rem',
  background: 'var(--color-bg-alt)', color: 'var(--color-text)',
  border: '1.5px solid var(--color-border)', outline: 'none',
}
