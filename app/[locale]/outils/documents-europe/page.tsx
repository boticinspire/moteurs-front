'use client'

import { useState, useEffect, useMemo } from 'react'

// ─────────────────────────────────────────────────────────────────────────────
//   DOCUMENTS & ÉQUIPEMENTS OBLIGATOIRES DANS LA VOITURE EN EUROPE
//   Outil Moteurs.com — port de la maquette infographique (mai 2026)
// ─────────────────────────────────────────────────────────────────────────────

type Country = {
  code: string
  flag: string
  name: string
  controleTechnique: { value: string; note: string; short: string; style: 'yes' | 'no' }
  vignette: { required: boolean; label: string; short: string }
  equipements: string[]
  autres: string
  speed: { urbain: string; route: string; autoroute: string; autorouteNote?: string }
  alerts: { type: 'warn' | 'info'; title: string; text: string }[]
}

const COUNTRIES: Country[] = [
  { code: 'AL', flag: '🇦🇱', name: 'Albanie',
    controleTechnique: { value: 'Oui, à bord', note: '', short: 'Oui, à bord', style: 'yes' },
    vignette: { required: false, label: 'Non', short: 'Non' },
    equipements: ['Trousse de secours', 'Triangle de présignalisation', 'Gilet réfléchissant'],
    autres: 'Néant',
    speed: { urbain: '40 km/h', route: '80 km/h', autoroute: '110 km/h' },
    alerts: [],
  },
  { code: 'DE', flag: '🇩🇪', name: 'Allemagne',
    controleTechnique: { value: 'Non à bord', note: 'à présenter en cas de contrôle', short: 'Non à bord', style: 'no' },
    vignette: { required: true, label: 'Vignette verte (Umweltplakette) pour certaines zones', short: 'Vignette verte (Umweltplakette)<br/><small>pour certaines zones</small>' },
    equipements: ['Trousse de secours', 'Triangle de présignalisation', 'Gilet jaune'],
    autres: 'Néant',
    speed: { urbain: '50 km/h', route: '100 km/h', autoroute: 'Aucune', autorouteNote: '(recommandé 130)' },
    alerts: [
      { type: 'warn', title: 'Umweltplakette obligatoire', text: 'La vignette verte est exigée dans les Umweltzone des grandes villes (Berlin, Munich, Francfort...).' },
      { type: 'warn', title: 'Pas de limite générale sur autoroute', text: 'Vitesse recommandée 130 km/h, mais des tronçons sont limités.' },
    ],
  },
  { code: 'AD', flag: '🇦🇩', name: 'Andorre',
    controleTechnique: { value: 'Non à bord', note: 'à présenter en cas de contrôle', short: 'Non à bord', style: 'no' },
    vignette: { required: false, label: 'Non', short: 'Non' },
    equipements: ['Gilet réfléchissant'],
    autres: 'Néant',
    speed: { urbain: '50 km/h', route: '90 km/h', autoroute: '90 km/h' },
    alerts: [],
  },
  { code: 'AT', flag: '🇦🇹', name: 'Autriche',
    controleTechnique: { value: 'Non à bord', note: 'à présenter en cas de contrôle', short: 'Non à bord', style: 'no' },
    vignette: { required: true, label: 'Vignette autoroutière (Pickerl)', short: 'Vignette autoroutière (Pickerl)' },
    equipements: ['Trousse de secours', 'Triangle de présignalisation', 'Gilet jaune'],
    autres: 'Néant',
    speed: { urbain: '50 km/h', route: '100 km/h', autoroute: '130 km/h' },
    alerts: [{ type: 'warn', title: 'Pickerl obligatoire', text: 'Vignette autoroutière à coller sur le pare-brise (validité 10 jours, 2 mois ou 1 an).' }],
  },
  { code: 'BE', flag: '🇧🇪', name: 'Belgique',
    controleTechnique: { value: 'Non à bord', note: 'à présenter en cas de contrôle', short: 'Non à bord', style: 'no' },
    vignette: { required: false, label: 'Non', short: 'Non' },
    equipements: ['Trousse de secours', 'Triangle de présignalisation', 'Gilet jaune'],
    autres: 'Néant',
    speed: { urbain: '50 km/h', route: '90 km/h', autoroute: '120 km/h' },
    alerts: [],
  },
  { code: 'BG', flag: '🇧🇬', name: 'Bulgarie',
    controleTechnique: { value: 'Oui, à bord', note: '', short: 'Oui, à bord', style: 'yes' },
    vignette: { required: true, label: 'Vignette électronique (éco) pour certaines zones', short: 'Vignette électronique (éco)<br/><small>pour certaines zones</small>' },
    equipements: ['Trousse de secours', 'Triangle', 'Gilet jaune'],
    autres: 'Néant',
    speed: { urbain: '50 km/h', route: '90 km/h', autoroute: '140 km/h' },
    alerts: [{ type: 'warn', title: 'E-Vignette obligatoire', text: "À acheter en ligne avant d'emprunter le réseau routier principal." }],
  },
  { code: 'HR', flag: '🇭🇷', name: 'Croatie',
    controleTechnique: { value: 'Oui, à bord', note: '', short: 'Oui, à bord', style: 'yes' },
    vignette: { required: true, label: 'Vignette autoroutière', short: 'Vignette autoroutière' },
    equipements: ['Trousse de secours', 'Triangle de présignalisation', 'Gilet réfléchissant'],
    autres: 'Néant',
    speed: { urbain: '50 km/h', route: '90 km/h', autoroute: '130 km/h' },
    alerts: [],
  },
  { code: 'DK', flag: '🇩🇰', name: 'Danemark',
    controleTechnique: { value: 'Oui (si > 4 ans, puis tous les 2 ans)', note: '', short: '(si &gt; 4 ans, puis tous les 2 ans)', style: 'no' },
    vignette: { required: false, label: 'Non', short: 'Non' },
    equipements: ['Trousse de secours'],
    autres: 'Néant',
    speed: { urbain: '50 km/h', route: '80 km/h', autoroute: '130 km/h' },
    alerts: [],
  },
  { code: 'ES', flag: '🇪🇸', name: 'Espagne',
    controleTechnique: { value: 'Non à bord', note: 'à présenter en cas de contrôle', short: 'Non à bord', style: 'no' },
    vignette: { required: false, label: 'Non (sauf Madrid/Barcelone : vignette éco facult.)', short: 'Non <small>(sauf Madrid/Barcelone : vignette éco facult.)</small>' },
    equipements: ['2 triangles de présignalisation', 'Gilet réfléchissant'],
    autres: 'Néant',
    speed: { urbain: '50 km/h', route: '90/100 km/h', autorouteNote: '(selon route)', autoroute: '120 km/h' },
    alerts: [{ type: 'warn', title: 'Deux triangles obligatoires', text: "L'Espagne impose 2 triangles de présignalisation (un devant, un derrière le véhicule)." }],
  },
  { code: 'EE', flag: '🇪🇪', name: 'Estonie',
    controleTechnique: { value: 'Oui, à bord', note: '', short: 'Oui, à bord', style: 'yes' },
    vignette: { required: false, label: 'Non', short: 'Non' },
    equipements: [],
    autres: 'Néant',
    speed: { urbain: '50 km/h', route: '90 km/h', autoroute: '110 km/h' },
    alerts: [],
  },
  { code: 'FI', flag: '🇫🇮', name: 'Finlande',
    controleTechnique: { value: 'Non à bord', note: 'à présenter en cas de contrôle', short: 'Non à bord', style: 'no' },
    vignette: { required: false, label: 'Non', short: 'Non' },
    equipements: ['Trousse de secours'],
    autres: 'Néant',
    speed: { urbain: '50 km/h', route: '100 km/h', autoroute: '120 km/h' },
    alerts: [],
  },
  { code: 'FR', flag: '🇫🇷', name: 'France',
    controleTechnique: { value: 'Non à bord', note: 'à présenter en cas de contrôle', short: 'Non à bord', style: 'no' },
    vignette: { required: false, label: "Non (Crit'Air locale dans certaines ZFE)", short: "Non <small>(Crit'Air dans certaines ZFE)</small>" },
    equipements: ['Gilet réfléchissant', 'Triangle de présignalisation'],
    autres: 'Néant',
    speed: { urbain: '50 km/h', route: '80 km/h', autoroute: '130 km/h' },
    alerts: [{ type: 'info', title: 'Éthylotest plus obligatoire', text: "L'obligation de détenir un éthylotest dans le véhicule a été supprimée par décret en mai 2020." }],
  },
  { code: 'GR', flag: '🇬🇷', name: 'Grèce',
    controleTechnique: { value: 'Non à bord', note: 'à présenter en cas de contrôle', short: 'Non à bord', style: 'no' },
    vignette: { required: false, label: 'Non', short: 'Non' },
    equipements: ['Triangle de présignalisation'],
    autres: 'Néant',
    speed: { urbain: '50 km/h', route: '90 km/h', autoroute: '130 km/h' },
    alerts: [],
  },
  { code: 'HU', flag: '🇭🇺', name: 'Hongrie',
    controleTechnique: { value: 'Oui, à bord', note: '', short: 'Oui, à bord', style: 'yes' },
    vignette: { required: false, label: 'Non (e-vignette pour autoroutes)', short: 'Non' },
    equipements: ['Gilet réfléchissant'],
    autres: 'Néant',
    speed: { urbain: '50 km/h', route: '90 km/h', autoroute: '130 km/h' },
    alerts: [],
  },
  { code: 'IE', flag: '🇮🇪', name: 'Irlande',
    controleTechnique: { value: 'Non à bord', note: 'à présenter en cas de contrôle', short: 'Non à bord', style: 'no' },
    vignette: { required: false, label: 'Non', short: 'Non' },
    equipements: ['Trousse de secours'],
    autres: 'Néant',
    speed: { urbain: '50 km/h', route: '80 km/h', autoroute: '120 km/h' },
    alerts: [{ type: 'warn', title: 'Conduite à gauche', text: "L'Irlande roule à gauche : adaptez vos rétroviseurs." }],
  },
  { code: 'IT', flag: '🇮🇹', name: 'Italie',
    controleTechnique: { value: 'Non à bord', note: 'à présenter en cas de contrôle', short: 'Non à bord', style: 'no' },
    vignette: { required: false, label: 'Non (sauf certaines ZTL en centres-villes)', short: 'Non <small>(sauf certaines ZTL en centres-villes)</small>' },
    equipements: ["Gilet réfléchissant (à porter en cas d'arrêt hors agglo)"],
    autres: 'Néant',
    speed: { urbain: '50 km/h', route: '90/110 km/h', autorouteNote: '(selon route)', autoroute: '130 km/h' },
    alerts: [{ type: 'warn', title: 'ZTL en centre-ville', text: 'Les Zones à Trafic Limité (Rome, Milan, Florence...) sont surveillées par caméras.' }],
  },
  { code: 'NL', flag: '🇳🇱', name: 'Pays-Bas',
    controleTechnique: { value: 'Non à bord', note: 'à présenter en cas de contrôle', short: 'Non à bord', style: 'no' },
    vignette: { required: false, label: 'Non', short: 'Non' },
    equipements: ['Gilet réfléchissant'],
    autres: 'Néant',
    speed: { urbain: '50 km/h', route: '80/100 km/h', autorouteNote: '(selon route)', autoroute: '130 km/h' },
    alerts: [],
  },
  { code: 'PL', flag: '🇵🇱', name: 'Pologne',
    controleTechnique: { value: 'Oui, à bord', note: '', short: 'Oui, à bord', style: 'yes' },
    vignette: { required: false, label: 'Non (e-toll pour autoroutes)', short: 'Non' },
    equipements: ['Trousse de secours'],
    autres: 'Néant',
    speed: { urbain: '50 km/h', route: '90 km/h', autoroute: '140 km/h' },
    alerts: [],
  },
  { code: 'PT', flag: '🇵🇹', name: 'Portugal',
    controleTechnique: { value: 'Non à bord', note: 'à présenter en cas de contrôle', short: 'Non à bord', style: 'no' },
    vignette: { required: false, label: 'Non (sauf ZFE locales à Lisbonne/Porto)', short: 'Non <small>(sauf ZFE locales à Lisbonne/Porto)</small>' },
    equipements: ['Gilet réfléchissant'],
    autres: 'Néant',
    speed: { urbain: '50 km/h', route: '90 km/h', autoroute: '120 km/h' },
    alerts: [],
  },
  { code: 'CZ', flag: '🇨🇿', name: 'République tchèque',
    controleTechnique: { value: 'Oui, à bord', note: '', short: 'Oui, à bord', style: 'yes' },
    vignette: { required: true, label: 'Vignette autoroutière', short: 'Vignette autoroutière' },
    equipements: ['Trousse de secours', 'Triangle de présignalisation', 'Gilet jaune'],
    autres: 'Néant',
    speed: { urbain: '50 km/h', route: '90 km/h', autoroute: '130 km/h' },
    alerts: [],
  },
  { code: 'RO', flag: '🇷🇴', name: 'Roumanie',
    controleTechnique: { value: 'Non à bord', note: 'mais sticker sur pare-brise', short: 'Non à bord<br/><small>(mais sticker sur pare-brise)</small>', style: 'no' },
    vignette: { required: true, label: 'Rovinieta (vignette autoroutière)', short: 'Rovinieta (vignette autoroutière)' },
    equipements: ['Trousse de secours', 'Triangle de présignalisation', 'Gilet jaune'],
    autres: 'Néant',
    speed: { urbain: '50 km/h', route: '90 km/h', autoroute: '130 km/h' },
    alerts: [{ type: 'warn', title: 'Rovinieta obligatoire', text: "Vignette électronique à acheter avant de circuler sur le réseau national." }],
  },
  { code: 'CH', flag: '🇨🇭', name: 'Suisse',
    controleTechnique: { value: 'Non à bord', note: 'à présenter en cas de contrôle', short: 'Non à bord', style: 'no' },
    vignette: { required: true, label: 'Vignette autoroutière (obligatoire)', short: 'Vignette autoroutière (obligatoire)' },
    equipements: ['Trousse de secours', 'Triangle de présignalisation', 'Gilet jaune'],
    autres: 'Néant',
    speed: { urbain: '50 km/h', route: '80 km/h', autoroute: '120 km/h' },
    alerts: [{ type: 'warn', title: 'Vignette suisse obligatoire', text: 'À coller sur le pare-brise dès la frontière. Valable une année civile.' }],
  },
]

const COMMON_CODES = ['BE', 'FR', 'DE', 'NL', 'IT', 'CH', 'ES']

// ─────────────────────────────────────────────────────────────────────────────
//   COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export default function DocumentsEuropePage() {
  const [selectedCodes, setSelectedCodes] = useState<Set<string>>(() => new Set(COMMON_CODES))
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [dropdownSearch, setDropdownSearch] = useState('')
  const [modalCountry, setModalCountry] = useState<Country | null>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!dropdownOpen) return
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (!target.closest('.add-country-wrapper')) setDropdownOpen(false)
    }
    document.addEventListener('click', handler)
    return () => document.removeEventListener('click', handler)
  }, [dropdownOpen])

  const selectedCountries = useMemo(
    () => COUNTRIES.filter(c => selectedCodes.has(c.code)),
    [selectedCodes],
  )

  const availableCountries = useMemo(
    () => COUNTRIES.filter(c => !selectedCodes.has(c.code) && c.name.toLowerCase().includes(dropdownSearch.toLowerCase())),
    [selectedCodes, dropdownSearch],
  )

  const toggleCode = (code: string, on: boolean) => {
    setSelectedCodes(prev => {
      const next = new Set(prev)
      if (on) next.add(code); else next.delete(code)
      return next
    })
  }

  const selectDefault = () => setSelectedCodes(new Set(COMMON_CODES))
  const selectAll = () => setSelectedCodes(new Set(COUNTRIES.map(c => c.code)))

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: PAGE_CSS }} />

      {/* SVG sprite */}
      <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true">
        <defs>
          <symbol id="dec-permis" viewBox="0 0 24 24"><path d="M21 4H3a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h18a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2zm0 14H3V6h18v12zM5 9h6v2H5V9zm0 4h4v2H5v-2zm9-3.5a2 2 0 1 1 4 0 2 2 0 0 1-4 0zm-1 6c0-1.3 2-2 3-2s3 .7 3 2v.5h-6V15.5z"/></symbol>
          <symbol id="dec-cartegrise" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm4 18H6V4h7v5h5v11zM8 12h8v2H8v-2zm0 4h8v2H8v-2zm0-8h3v2H8V8z"/></symbol>
          <symbol id="dec-assurance" viewBox="0 0 24 24"><path d="M12 1L3 5v6c0 5.5 3.8 10.7 9 12 5.2-1.3 9-6.5 9-12V5l-9-4zm-1 17l-5-5 1.4-1.4L11 15.2l6.6-6.6L19 10l-8 8z"/></symbol>
          <symbol id="dec-ct" viewBox="0 0 24 24"><path d="M22.7 19l-9.1-9.1c.9-2.3.4-5-1.5-6.9-2-2-5-2.4-7.4-1.3L9 6 6 9 1.6 4.7C.4 7.1.9 10.1 2.9 12.1c1.9 1.9 4.6 2.4 6.9 1.5l9.1 9.1c.4.4 1 .4 1.4 0l2.3-2.3c.5-.4.5-1.1.1-1.4z"/></symbol>
          <symbol id="dec-vignette" viewBox="0 0 24 24"><path d="M17 8C8 10 5.9 16.17 3.82 21.34l1.89.66.95-2.3c.48.17.98.3 1.34.3C19 20 22 3 22 3c-1 2-8 2.25-13 3.25S2 11.5 2 13.5s1.75 3.75 1.75 3.75C7 8 17 8 17 8z"/></symbol>
          <symbol id="dec-equip" viewBox="0 0 24 24"><path d="M20 6h-3V4a2 2 0 0 0-2-2H9a2 2 0 0 0-2 2v2H4a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2zM9 4h6v2H9V4zm7 11h-3v3h-2v-3H8v-2h3v-3h2v3h3v2z"/></symbol>
          <symbol id="dec-autres" viewBox="0 0 24 24"><path d="M10 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-8l-2-2z"/></symbol>
          <symbol id="dec-urbain" viewBox="0 0 24 24"><path d="M15 11V5l-3-3-3 3v2H3v14h18V11h-6zm-8 8H5v-2h2v2zm0-4H5v-2h2v2zm0-4H5V9h2v2zm6 8h-2v-2h2v2zm0-4h-2v-2h2v2zm0-4h-2V9h2v2zm0-4h-2V5h2v2zm6 12h-2v-2h2v2zm0-4h-2v-2h2v2z"/></symbol>
          <symbol id="dec-route" viewBox="0 0 24 24"><path d="M18.4 3H15v3h2.4l1 4H14V8h-4v2H5.6l1-4H9V3H5.6c-.9 0-1.7.6-1.9 1.5l-2 8.5V21h2v-1h16v1h2v-8l-2-8.5c-.2-.9-1-1.5-1.9-1.5zM4 18v-5h16v5H4zm6-7h4v-2h-4v2z"/></symbol>
          <symbol id="dec-autoroute" viewBox="0 0 24 24"><path d="M3 21h18v-2H3v2zM12 2L5 7l2 8h10l2-8-7-5zm0 3.4L15.5 8h-7L12 5.4zM8.4 10h7.2l-1 4H9.4l-1-4z"/></symbol>
          <symbol id="dec-print" viewBox="0 0 24 24"><path d="M19 8H5a3 3 0 0 0-3 3v6h4v4h12v-4h4v-6a3 3 0 0 0-3-3zM8 19v-5h8v5H8zm11-6a1 1 0 1 1 0-2 1 1 0 0 1 0 2zM18 3H6v4h12V3z"/></symbol>
          <symbol id="dec-globe" viewBox="0 0 24 24"><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1a2 2 0 0 0 2 2v1.93zM17.9 17.39c-.26-.81-1-1.39-1.9-1.39h-1v-3a1 1 0 0 0-1-1H8v-2h2a1 1 0 0 0 1-1V7h2a2 2 0 0 0 2-2v-.41a7.98 7.98 0 0 1 2.9 12.8z"/></symbol>
        </defs>
      </svg>

      {/* PRINT-ONLY HEADER */}
      <div className="print-only print-header">
        <div className="print-brand">
          <div className="print-brand-name">Moteurs<span>.com</span></div>
        </div>
        <div className="print-header-title">
          <div className="print-edition">Guide pratique — Édition 2026</div>
          <h1>Documents &amp; équipements obligatoires dans la voiture en Europe</h1>
          <p>Règles applicables pour circuler sur la voie publique (voiture particulière) — Informations à jour : mai 2026.</p>
        </div>
      </div>

      {/* PAGE HERO (réutilise la classe globale .page-hero) */}
      <section className="page-hero no-print">
        <div className="container">
          <div className="docs-eyebrow">Guide pratique — Édition 2026</div>
          <h1>Documents &amp; équipements obligatoires dans la voiture en Europe</h1>
          <p style={{ maxWidth: 760, margin: '0 auto' }}>
            Règles applicables pour circuler sur la voie publique (voiture particulière).
            Sélectionnez les pays à afficher, ouvrez le détail ou imprimez votre tableau.
          </p>
          <span className="docs-meta-pill">Informations à jour : mai 2026</span>
        </div>
      </section>

      <section className="docs-europe-tool" style={{ padding: '32px 0 60px' }}>
        <div className="container">

          {/* COUNTRY SELECTOR */}
          <div className="country-selector no-print">
            <div className="selector-header">
              <div className="selector-title">
                Pays affichés <span className="count-badge">{selectedCodes.size}</span>
              </div>
              <div className="selector-actions">
                <button type="button" className="btn-pill btn-ghost" onClick={selectDefault}>Pays courants</button>
                <button type="button" className="btn-pill btn-ghost" onClick={selectAll}>Tout sélectionner</button>
                <button type="button" className="btn-pill btn-primary" onClick={() => window.print()}>
                  <svg width="14" height="14"><use href="#dec-print"/></svg>
                  Imprimer
                </button>
              </div>
            </div>
            <div className="chips-container">
              <div className="selected-chips">
                {selectedCountries.map(c => (
                  <span key={c.code} className="country-chip">
                    <span className="flag">{c.flag}</span> {c.name}
                    <button type="button" className="chip-remove" aria-label="Retirer" onClick={() => toggleCode(c.code, false)}>✕</button>
                  </span>
                ))}
              </div>
              <div className="add-country-wrapper">
                <button
                  type="button"
                  className="add-country-btn"
                  onClick={e => { e.stopPropagation(); setDropdownOpen(o => !o); setDropdownSearch('') }}
                >
                  <span className="plus">+</span> Ajouter un pays
                </button>
                {dropdownOpen && (
                  <div className="add-country-dropdown">
                    <input
                      type="text"
                      className="dropdown-search"
                      placeholder="🔎 Rechercher…"
                      value={dropdownSearch}
                      onChange={e => setDropdownSearch(e.target.value)}
                      autoFocus
                    />
                    {availableCountries.length === 0 ? (
                      <div className="dropdown-empty">{dropdownSearch ? 'Aucun résultat' : 'Tous les pays sont sélectionnés'}</div>
                    ) : (
                      availableCountries.map(c => (
                        <button key={c.code} type="button" className="dropdown-item" onClick={() => toggleCode(c.code, true)}>
                          <span className="flag">{c.flag}</span> {c.name}
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* INFOGRAPHIC TABLE */}
          <div className="infographic">
            <div className="infographic-table-wrap">
              <table className="infographic-table">
                <thead>
                  <tr>
                    <th><span className="col-ico"><svg><use href="#dec-globe"/></svg></span><span className="col-title">Pays</span></th>
                    <th><span className="col-ico"><svg><use href="#dec-permis"/></svg></span><span className="col-title">Permis de<br/>conduire</span></th>
                    <th><span className="col-ico"><svg><use href="#dec-cartegrise"/></svg></span><span className="col-title">Certificat<br/>d'immatric.</span><span className="col-sub">(carte grise)</span></th>
                    <th><span className="col-ico"><svg><use href="#dec-assurance"/></svg></span><span className="col-title">Attestation<br/>d'assurance</span></th>
                    <th><span className="col-ico"><svg><use href="#dec-ct"/></svg></span><span className="col-title">Contrôle<br/>technique</span></th>
                    <th><span className="col-ico"><svg><use href="#dec-vignette"/></svg></span><span className="col-title">Vignette</span><span className="col-sub">(environnement / centres-villes)</span></th>
                    <th><span className="col-ico"><svg><use href="#dec-equip"/></svg></span><span className="col-title">Équipements<br/>obligatoires</span></th>
                    <th><span className="col-ico"><svg><use href="#dec-autres"/></svg></span><span className="col-title">Autres doc. /<br/>éléments oblig.</span></th>
                    <th className="speed-group"><span className="col-ico"><svg><use href="#dec-urbain"/></svg></span><span className="col-title">Urbain</span></th>
                    <th className="speed-group"><span className="col-ico"><svg><use href="#dec-route"/></svg></span><span className="col-title">Route</span></th>
                    <th className="speed-group"><span className="col-ico"><svg><use href="#dec-autoroute"/></svg></span><span className="col-title">Autoroute</span></th>
                  </tr>
                </thead>
                <tbody>
                  {selectedCountries.length === 0 ? (
                    <tr><td colSpan={11} className="empty-table">Aucun pays sélectionné. Ajoutez un pays via le bouton ci-dessus.</td></tr>
                  ) : selectedCountries.map(c => (
                    <tr key={c.code} onClick={() => setModalCountry(c)}>
                      <td className="country-cell"><span className="flag">{c.flag}</span><span className="name">{c.name}</span></td>
                      <td><span className="check-yes">✓</span></td>
                      <td><span className="check-yes">✓</span></td>
                      <td><span className="check-yes">✓</span></td>
                      <td><span className={c.controleTechnique.style === 'yes' ? 'ct-yes' : 'ct-no'} dangerouslySetInnerHTML={{ __html: c.controleTechnique.short + (c.controleTechnique.note && c.controleTechnique.style !== 'yes' ? `<small>(${c.controleTechnique.note})</small>` : '') }} /></td>
                      <td><span className={c.vignette.required ? 'vignette-yes' : 'vignette-no'} dangerouslySetInnerHTML={{ __html: c.vignette.short }} /></td>
                      <td className="equip-cell">{c.equipements.length ? c.equipements.join(', ') : 'Aucun équipement obligatoire'}</td>
                      <td>{c.autres}</td>
                      <td><span className="speed-val">{c.speed.urbain}</span></td>
                      <td><span className="speed-val" dangerouslySetInnerHTML={{ __html: c.speed.route + (c.speed.autorouteNote && c.speed.route.includes('/') ? `<small>${c.speed.autorouteNote}</small>` : '') }} /></td>
                      <td><span className="speed-val" dangerouslySetInnerHTML={{ __html: c.speed.autoroute + (c.speed.autorouteNote && !c.speed.route.includes('/') ? `<small>${c.speed.autorouteNote}</small>` : '') }} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* GALLERY */}
          <div className="gallery">
            <h3>Vignettes et équipements spécifiques — à quoi ça ressemble ?</h3>
            <div className="gallery-grid">
              <GalleryItem title={<>Vignette verte<br/>(Allemagne)</>} caption="Obligatoire pour circuler dans certaines zones à faibles émissions.">
                <svg width="90" height="90" viewBox="0 0 90 90">
                  <circle cx="45" cy="45" r="40" fill="#69b243" stroke="#1c1c1c" strokeWidth="2"/>
                  <text x="45" y="56" textAnchor="middle" fontFamily="Arial Black" fontSize="38" fill="#1c1c1c" fontWeight="900">4</text>
                  <rect x="20" y="68" width="50" height="14" fill="#1c1c1c"/>
                  <text x="45" y="79" textAnchor="middle" fontFamily="Arial" fontSize="8" fill="#fff" fontWeight="700" letterSpacing="1">BERLIN</text>
                </svg>
              </GalleryItem>
              <GalleryItem title={<>Vignette autoroutière<br/>(Autriche)</>} caption="À coller sur le pare-brise. Valable 10 jours, 2 mois ou 1 an.">
                <svg width="70" height="100" viewBox="0 0 70 100">
                  <path d="M35 5 L65 30 L60 90 Q35 100 10 90 L5 30 Z" fill="#6a2585" stroke="#1c1c1c" strokeWidth="2"/>
                  <text x="35" y="50" textAnchor="middle" fontFamily="Arial Black" fontSize="28" fill="#fff" fontWeight="900">A</text>
                  <rect x="14" y="60" width="42" height="22" fill="#fff" rx="2"/>
                  <text x="35" y="78" textAnchor="middle" fontFamily="Arial Black" fontSize="18" fill="#1c1c1c" fontWeight="900">26</text>
                </svg>
              </GalleryItem>
              <GalleryItem title={<>Vignette électronique<br/>(Bulgarie)</>} caption="À acheter en ligne. Obligatoire pour certaines zones environnementales.">
                <svg width="110" height="70" viewBox="0 0 110 70">
                  <rect x="2" y="10" width="106" height="50" rx="6" fill="#0fa44a" stroke="#1c1c1c" strokeWidth="2"/>
                  <text x="55" y="32" textAnchor="middle" fontFamily="Arial Black" fontSize="12" fill="#fff" fontWeight="900">E-Vignette</text>
                  <path d="M30 45 L80 45 L78 52 L32 52 Z" fill="#fff"/>
                  <circle cx="38" cy="52" r="3" fill="#1c1c1c"/>
                  <circle cx="72" cy="52" r="3" fill="#1c1c1c"/>
                  <rect x="48" y="40" width="14" height="6" fill="#fff"/>
                </svg>
              </GalleryItem>
              <GalleryItem title={<>Vignette autoroutière<br/>(Suisse)</>} caption="Obligatoire pour circuler sur les autoroutes suisses (validité 14 mois).">
                <svg width="80" height="100" viewBox="0 0 80 100">
                  <rect x="5" y="5" width="70" height="90" fill="#3aaa57" stroke="#1c1c1c" strokeWidth="2"/>
                  <path d="M40 15 L55 35 L25 35 Z" fill="#fff"/>
                  <rect x="33" y="35" width="14" height="20" fill="#fff"/>
                  <text x="40" y="80" textAnchor="middle" fontFamily="Arial Black" fontSize="22" fill="#fff" fontWeight="900">26</text>
                </svg>
              </GalleryItem>
              <GalleryItem title={<>Rovinieta<br/>(Roumanie)</>} caption="Obligatoire sur les routes nationales et autoroutes.">
                <svg width="80" height="100" viewBox="0 0 80 100">
                  <rect x="5" y="5" width="70" height="90" fill="#f5a623" stroke="#1c1c1c" strokeWidth="2" rx="3"/>
                  <rect x="5" y="5" width="70" height="22" fill="#0033a0"/>
                  <text x="40" y="22" textAnchor="middle" fontFamily="Arial Black" fontSize="14" fill="#fff" fontWeight="900">RO</text>
                  <rect x="15" y="35" width="50" height="34" fill="#fff" rx="2"/>
                  <circle cx="40" cy="52" r="10" fill="#f5a623" stroke="#1c1c1c"/>
                  <text x="40" y="84" textAnchor="middle" fontFamily="Arial Black" fontSize="13" fill="#1c1c1c" fontWeight="900">2026</text>
                </svg>
              </GalleryItem>
              <GalleryItem title={<>Triangle de<br/>présignalisation</>} caption="Permet d'indiquer un véhicule à l'arrêt en cas de panne ou d'accident.">
                <svg width="110" height="100" viewBox="0 0 110 100">
                  <polygon points="55,10 100,88 10,88" fill="#e2382e" stroke="#1c1c1c" strokeWidth="2"/>
                  <polygon points="55,25 88,82 22,82" fill="#fff"/>
                  <polygon points="55,38 76,76 34,76" fill="#e2382e"/>
                </svg>
              </GalleryItem>
              <GalleryItem title={<>Gilet<br/>réfléchissant</>} caption="À porter en cas d'arrêt d'urgence ou hors agglomération.">
                <svg width="90" height="100" viewBox="0 0 90 100">
                  <path d="M25 15 L45 5 L65 15 L80 25 L75 90 L15 90 L10 25 Z" fill="#f5e436" stroke="#1c1c1c" strokeWidth="2"/>
                  <path d="M45 5 L45 90" stroke="#1c1c1c" strokeWidth="1.5"/>
                  <rect x="12" y="50" width="66" height="4" fill="#c8c8c8" opacity="0.7"/>
                  <rect x="12" y="60" width="66" height="4" fill="#c8c8c8" opacity="0.7"/>
                  <rect x="12" y="70" width="66" height="4" fill="#c8c8c8" opacity="0.7"/>
                </svg>
              </GalleryItem>
              <GalleryItem title={<>Trousse de<br/>secours</>} caption="Obligatoire dans la majorité des pays européens.">
                <svg width="100" height="80" viewBox="0 0 100 80">
                  <rect x="5" y="20" width="90" height="55" rx="6" fill="#d12525" stroke="#1c1c1c" strokeWidth="2"/>
                  <rect x="35" y="12" width="30" height="12" rx="3" fill="#d12525" stroke="#1c1c1c" strokeWidth="2"/>
                  <rect x="40" y="35" width="20" height="6" fill="#fff"/>
                  <rect x="47" y="28" width="6" height="20" fill="#fff"/>
                </svg>
              </GalleryItem>
            </div>
          </div>

          {/* DISCLAIMER */}
          <div className="disclaimer">
            <div className="disclaimer-item">
              <span className="ico">i</span>
              <div><strong>Renseignez-vous avant de partir :</strong> les règles peuvent évoluer et des spécificités locales (ZFE, péages, etc.) peuvent s'appliquer.</div>
            </div>
            <div className="disclaimer-item warn">
              <span className="ico">!</span>
              <div><strong>Limitations de vitesse :</strong> données par temps sec. En cas de pluie, de neige ou de conditions défavorables, elles peuvent être abaissées.</div>
            </div>
          </div>

          {/* PRINT FOOTER */}
          <div className="print-only print-footer">
            <span className="print-footer-brand">Moteurs<span className="dot">.com</span></span>
            <span className="print-footer-tag">votre allié sur la route</span>
            <span className="print-footer-meta">Document informatif — mai 2026 — © Moteurs.com</span>
          </div>
        </div>
      </section>

      {/* MODAL */}
      {modalCountry && (
        <div className="modal-bg" onClick={e => { if ((e.target as HTMLElement).classList.contains('modal-bg')) setModalCountry(null) }}>
          <div className="modal">
            <div className="modal-header">
              <span className="flag">{modalCountry.flag}</span>
              <h3>{modalCountry.name}</h3>
              <button type="button" className="close-btn" aria-label="Fermer" onClick={() => setModalCountry(null)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="modal-section">
                <h4>Documents obligatoires</h4>
                <div className="field-row"><span className="field-label"><svg><use href="#dec-permis"/></svg> Permis de conduire</span><span><span className="pill pill-yes">Obligatoire</span></span></div>
                <div className="field-row"><span className="field-label"><svg><use href="#dec-cartegrise"/></svg> Certificat d'immatriculation</span><span><span className="pill pill-yes">Obligatoire</span></span></div>
                <div className="field-row"><span className="field-label"><svg><use href="#dec-assurance"/></svg> Attestation d'assurance</span><span><span className="pill pill-yes">Obligatoire</span></span></div>
                <div className="field-row"><span className="field-label"><svg><use href="#dec-ct"/></svg> Contrôle technique</span><span>{modalCountry.controleTechnique.value}{modalCountry.controleTechnique.note && <em style={{ color: 'var(--color-text-muted)' }}> ({modalCountry.controleTechnique.note})</em>}</span></div>
              </div>
              <div className="modal-section">
                <h4>Vignette / Environnement</h4>
                <div className="field-row">
                  <span className="field-label"><svg><use href="#dec-vignette"/></svg> Vignette</span>
                  <span>
                    {modalCountry.vignette.required
                      ? <><span className="pill pill-info">Requise</span> {modalCountry.vignette.label}</>
                      : <><span className="pill pill-no">Non requise</span>{modalCountry.vignette.label !== 'Non' ? ' — ' + modalCountry.vignette.label : ''}</>}
                  </span>
                </div>
              </div>
              <div className="modal-section">
                <h4>Équipements obligatoires</h4>
                <ul style={{ margin: 0, paddingLeft: 18 }}>
                  {modalCountry.equipements.length ? modalCountry.equipements.map(e => <li key={e}>{e}</li>) : <li><em>Aucun équipement spécifique obligatoire</em></li>}
                </ul>
              </div>
              <div className="modal-section">
                <h4>Limitations de vitesse (temps sec)</h4>
                <div className="speed-grid">
                  <div className="speed-card"><div className="speed-ico"><svg><use href="#dec-urbain"/></svg></div><div className="speed-label">Urbain</div><div className="speed-value">{modalCountry.speed.urbain}</div></div>
                  <div className="speed-card"><div className="speed-ico"><svg><use href="#dec-route"/></svg></div><div className="speed-label">Route</div><div className="speed-value">{modalCountry.speed.route}</div></div>
                  <div className="speed-card"><div className="speed-ico"><svg><use href="#dec-autoroute"/></svg></div><div className="speed-label">Autoroute</div><div className="speed-value">{modalCountry.speed.autoroute}</div></div>
                </div>
              </div>
              {modalCountry.alerts.length > 0 && (
                <div className="modal-section">
                  <h4>Points de vigilance</h4>
                  {modalCountry.alerts.map((a, i) => (
                    <div key={i} className={'alert-box ' + (a.type === 'info' ? 'info' : '')}>
                      <span className="alert-title">⚠️ {a.title}</span>{a.text}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function GalleryItem({ children, title, caption }: { children: React.ReactNode; title: React.ReactNode; caption: string }) {
  return (
    <div className="gallery-item">
      <div className="gallery-icon-wrap">{children}</div>
      <h4>{title}</h4>
      <p>{caption}</p>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
//   STYLES (scoped under .docs-europe-tool when relevant)
// ─────────────────────────────────────────────────────────────────────────────

const PAGE_CSS = `
.print-only { display: none; }

.docs-eyebrow {
  color: var(--color-primary);
  font-size: 0.78rem;
  font-weight: 800;
  letter-spacing: 2px;
  text-transform: uppercase;
  margin-bottom: 8px;
}
.docs-meta-pill {
  display: inline-block;
  margin-top: 14px;
  padding: 5px 14px;
  border-radius: 999px;
  background: rgba(239,108,26,0.08);
  border: 1px solid rgba(239,108,26,0.2);
  color: var(--color-primary);
  font-size: 0.78rem;
  font-weight: 600;
}

/* ── COUNTRY SELECTOR ── */
.docs-europe-tool .country-selector {
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 18px 20px;
  margin-bottom: 16px;
}
.docs-europe-tool .selector-header {
  display: flex; justify-content: space-between; align-items: center;
  gap: 12px; flex-wrap: wrap;
  margin-bottom: 14px;
}
.docs-europe-tool .selector-title {
  font-weight: 700; color: var(--color-text); font-size: 0.95rem;
  display: flex; align-items: center; gap: 8px;
}
.docs-europe-tool .count-badge {
  background: var(--color-primary); color: #fff;
  border-radius: 999px; padding: 2px 10px;
  font-size: 0.78rem; font-weight: 700;
}
.docs-europe-tool .selector-actions { display: flex; gap: 8px; flex-wrap: wrap; }
.docs-europe-tool .btn-pill {
  border: 1px solid var(--color-border);
  border-radius: 999px;
  padding: 7px 14px;
  font-size: 0.85rem; font-weight: 600;
  cursor: pointer;
  display: inline-flex; align-items: center; gap: 6px;
  transition: all 0.15s;
  background: var(--color-bg-card);
  color: var(--color-text);
}
.docs-europe-tool .btn-pill:hover { border-color: var(--color-primary); color: var(--color-primary); }
.docs-europe-tool .btn-pill.btn-primary {
  background: var(--color-primary); color: #fff; border-color: var(--color-primary);
}
.docs-europe-tool .btn-pill.btn-primary:hover { background: var(--color-primary-dark); border-color: var(--color-primary-dark); color: #fff; }
.docs-europe-tool .btn-pill.btn-primary svg { fill: currentColor; }
.docs-europe-tool .chips-container {
  display: flex; flex-wrap: wrap; gap: 8px;
  align-items: center;
  padding: 10px 12px;
  background: var(--color-bg-alt);
  border-radius: 8px;
  min-height: 52px;
}
.docs-europe-tool .selected-chips { display: flex; flex-wrap: wrap; gap: 8px; }
.docs-europe-tool .country-chip {
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: 999px;
  padding: 5px 6px 5px 12px;
  font-size: 0.82rem;
  display: inline-flex; align-items: center; gap: 6px;
  color: var(--color-text);
}
.docs-europe-tool .country-chip .flag { font-size: 1rem; }
.docs-europe-tool .country-chip .chip-remove {
  background: var(--color-border); border: 0;
  width: 22px; height: 22px; border-radius: 50%;
  cursor: pointer; color: var(--color-text-muted);
  display: grid; place-items: center;
  font-size: 0.72rem; transition: all 0.15s;
}
.docs-europe-tool .country-chip .chip-remove:hover { background: var(--color-danger); color: #fff; }
.docs-europe-tool .add-country-wrapper { position: relative; }
.docs-europe-tool .add-country-btn {
  background: var(--color-text);
  color: #fff;
  border: 0; border-radius: 999px;
  padding: 7px 14px;
  font-size: 0.82rem; font-weight: 600;
  cursor: pointer;
  display: inline-flex; align-items: center; gap: 6px;
}
.docs-europe-tool .add-country-btn:hover { background: var(--color-text-soft); }
.docs-europe-tool .add-country-btn .plus { font-size: 1rem; font-weight: 700; }
.docs-europe-tool .add-country-dropdown {
  position: absolute;
  top: calc(100% + 8px); left: 0;
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: 10px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.15);
  width: 260px;
  max-height: 320px;
  overflow-y: auto;
  z-index: 50;
  padding: 6px;
}
.docs-europe-tool .dropdown-search {
  width: 100%;
  padding: 8px 10px;
  border: 1px solid var(--color-border);
  border-radius: 6px;
  margin-bottom: 6px;
  font-size: 0.82rem;
  outline: none;
  background: var(--color-bg);
  color: var(--color-text);
}
.docs-europe-tool .dropdown-item {
  display: flex; align-items: center; gap: 8px;
  width: 100%;
  padding: 8px 10px;
  background: transparent;
  border: 0; border-radius: 6px;
  font-size: 0.82rem;
  text-align: left;
  cursor: pointer;
  color: var(--color-text);
}
.docs-europe-tool .dropdown-item:hover { background: var(--color-bg-alt); }
.docs-europe-tool .dropdown-empty { padding: 16px; text-align: center; color: var(--color-text-muted); font-size: 0.82rem; }

/* ── INFOGRAPHIC TABLE ── */
.docs-europe-tool .infographic {
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  overflow: hidden;
  position: relative;
}
/* Visual hint that the table is horizontally scrollable */
.docs-europe-tool .infographic::after {
  content: "";
  position: absolute;
  top: 0;
  right: 0;
  bottom: 12px; /* leave room for scrollbar */
  width: 32px;
  background: linear-gradient(to right, rgba(255,255,255,0) 0%, rgba(0,0,0,0.08) 100%);
  pointer-events: none;
  z-index: 4;
  border-top-right-radius: var(--radius-md);
}
.docs-europe-tool .infographic-table-wrap {
  overflow-x: auto;
  overflow-y: hidden;
  /* Always-visible custom scrollbar so users know they can scroll */
  scrollbar-width: thin;
  scrollbar-color: var(--color-primary) rgba(0,0,0,0.06);
}
.docs-europe-tool .infographic-table-wrap::-webkit-scrollbar {
  height: 10px;
  -webkit-appearance: none;
}
.docs-europe-tool .infographic-table-wrap::-webkit-scrollbar-track {
  background: rgba(0,0,0,0.06);
}
.docs-europe-tool .infographic-table-wrap::-webkit-scrollbar-thumb {
  background: var(--color-primary);
  border-radius: 5px;
}
.docs-europe-tool .infographic-table-wrap::-webkit-scrollbar-thumb:hover {
  background: var(--color-primary-dark);
}
.docs-europe-tool .infographic-table {
  width: 100%;
  border-collapse: separate; /* required so sticky cell background covers row stripes */
  border-spacing: 0;
  font-size: 0.75rem;
  min-width: 1180px;
}
/* Sticky "Pays" column — stays visible while user scrolls horizontally */
.docs-europe-tool .infographic-table thead th:first-child,
.docs-europe-tool .infographic-table tbody td:first-child {
  position: sticky;
  left: 0;
  z-index: 2;
}
.docs-europe-tool .infographic-table thead th:first-child {
  z-index: 3;
  background: var(--color-bg-dark);
}
.docs-europe-tool .infographic-table tbody td:first-child {
  background: var(--color-bg-card);
  box-shadow: 4px 0 6px -4px rgba(0,0,0,0.18);
}
.docs-europe-tool .infographic-table tbody tr:nth-child(even) td:first-child {
  background: #fafbfd;
}
.docs-europe-tool .infographic-table tbody tr:hover td:first-child {
  background: var(--color-bg-alt);
}
.docs-europe-tool .infographic-table thead th {
  background: var(--color-bg-dark);
  color: #fff;
  padding: 14px 8px;
  vertical-align: middle;
  text-align: center;
  font-size: 0.68rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.4px;
  line-height: 1.3;
  border-right: 1px solid rgba(255,255,255,0.08);
}
.docs-europe-tool .infographic-table thead th:last-child { border-right: 0; }
.docs-europe-tool .infographic-table thead th.speed-group { background: #c8323a; }
.docs-europe-tool .infographic-table thead th .col-ico {
  display: flex; align-items: center; justify-content: center;
  margin: 0 auto 6px;
  width: 36px; height: 36px;
  background: rgba(255,255,255,0.1);
  border-radius: 50%;
}
.docs-europe-tool .infographic-table thead th .col-ico svg { width: 22px; height: 22px; fill: #fff; }
.docs-europe-tool .infographic-table thead th .col-title { display: block; font-size: 0.68rem; }
.docs-europe-tool .infographic-table thead th .col-sub { display: block; font-size: 0.58rem; font-weight: 400; opacity: 0.85; margin-top: 2px; text-transform: none; letter-spacing: 0; }
.docs-europe-tool .infographic-table tbody td {
  padding: 12px 10px;
  text-align: center;
  border-bottom: 1px solid var(--color-border);
  vertical-align: middle;
  line-height: 1.4;
}
.docs-europe-tool .infographic-table tbody tr { cursor: pointer; }
.docs-europe-tool .infographic-table tbody tr:hover td { background: var(--color-bg-alt); }
.docs-europe-tool .infographic-table tbody tr:nth-child(even) td { background: rgba(0,0,0,0.015); }
.docs-europe-tool .infographic-table tbody tr:nth-child(even):hover td { background: var(--color-bg-alt); }
.docs-europe-tool .country-cell {
  text-align: left !important;
  font-weight: 700;
  color: var(--color-text);
  white-space: nowrap;
  padding-left: 14px !important;
}
.docs-europe-tool .country-cell .flag { font-size: 1.25rem; margin-right: 8px; vertical-align: middle; }
.docs-europe-tool .country-cell .name { vertical-align: middle; font-size: 0.82rem; }
.docs-europe-tool .check-yes { color: var(--color-success); font-size: 1.15rem; font-weight: 700; }
.docs-europe-tool .ct-yes { color: var(--color-success); font-weight: 700; font-size: 0.72rem; }
.docs-europe-tool .ct-no { color: var(--color-text); font-size: 0.72rem; font-weight: 600; }
.docs-europe-tool .ct-no small,
.docs-europe-tool .vignette-yes small,
.docs-europe-tool .vignette-no small { display: block; font-weight: 400; color: var(--color-text-muted); font-size: 0.62rem; margin-top: 2px; }
.docs-europe-tool .vignette-yes { color: var(--color-success); font-weight: 600; font-size: 0.72rem; }
.docs-europe-tool .vignette-no { color: var(--color-text-muted); font-size: 0.72rem; }
.docs-europe-tool .equip-cell { font-size: 0.72rem; text-align: left !important; color: var(--color-text); padding-left: 12px !important; padding-right: 12px !important; }
.docs-europe-tool .speed-val { font-weight: 700; color: var(--color-text); font-size: 0.78rem; }
.docs-europe-tool .speed-val small { display: block; font-weight: 400; font-size: 0.62rem; color: var(--color-text-muted); }
.docs-europe-tool .empty-table { padding: 40px 20px; text-align: center; color: var(--color-text-muted); font-size: 0.9rem; }

/* ── GALLERY ── */
.docs-europe-tool .gallery {
  margin-top: 24px;
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 28px;
}
.docs-europe-tool .gallery h3 {
  color: var(--color-text);
  text-align: center;
  font-size: 1rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin: 0 0 24px;
  padding-bottom: 8px;
}
.docs-europe-tool .gallery h3::after {
  content: "";
  display: block;
  width: 60px; height: 3px;
  background: var(--color-primary);
  margin: 10px auto 0;
  border-radius: 2px;
}
.docs-europe-tool .gallery-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 18px;
}
.docs-europe-tool .gallery-item { text-align: center; }
.docs-europe-tool .gallery-icon-wrap {
  height: 110px;
  display: flex; align-items: flex-end; justify-content: center;
  margin-bottom: 10px;
}
.docs-europe-tool .gallery-item h4 {
  color: var(--color-text);
  font-size: 0.82rem;
  margin: 0 0 6px;
  font-weight: 700;
}
.docs-europe-tool .gallery-item p {
  color: var(--color-text-muted);
  font-size: 0.72rem;
  margin: 0;
  line-height: 1.4;
}

/* ── DISCLAIMER ── */
.docs-europe-tool .disclaimer {
  margin-top: 16px;
  padding: 16px 20px;
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  font-size: 0.78rem;
  color: var(--color-text-muted);
}
@media (max-width: 700px) { .docs-europe-tool .disclaimer { grid-template-columns: 1fr; } }
.docs-europe-tool .disclaimer-item { display: flex; gap: 10px; }
.docs-europe-tool .disclaimer-item .ico {
  width: 24px; height: 24px; border-radius: 50%;
  background: var(--color-bg-dark); color: #fff;
  display: grid; place-items: center;
  font-size: 0.82rem; font-weight: 700;
  flex-shrink: 0;
}
.docs-europe-tool .disclaimer-item.warn .ico { background: var(--color-warning); color: #fff; }

/* ── MODAL ── */
.modal-bg {
  position: fixed; inset: 0;
  background: rgba(10,22,40,0.55);
  z-index: 200;
  padding: 40px 16px;
  overflow-y: auto;
  display: flex; align-items: flex-start; justify-content: center;
}
.modal-bg .modal {
  background: var(--color-bg-card);
  border-radius: 14px;
  max-width: 760px; width: 100%;
  box-shadow: 0 8px 32px rgba(0,0,0,0.25);
  overflow: hidden;
}
.modal-bg .modal-header {
  background: var(--color-bg-dark); color: #fff;
  padding: 20px 24px;
  display: flex; align-items: center; gap: 14px;
}
.modal-bg .modal-header .flag { font-size: 2.2rem; }
.modal-bg .modal-header h3 { margin: 0; font-size: 1.3rem; font-weight: 800; }
.modal-bg .modal-header .close-btn {
  margin-left: auto;
  background: rgba(255,255,255,0.12);
  border: 0; color: #fff; font-size: 1rem;
  width: 36px; height: 36px;
  border-radius: 50%; cursor: pointer;
}
.modal-bg .modal-body { padding: 24px; }
.modal-bg .modal-section { margin-bottom: 22px; }
.modal-bg .modal-section h4 {
  margin: 0 0 10px;
  color: var(--color-text);
  font-size: 0.78rem; text-transform: uppercase; letter-spacing: 0.5px;
  border-left: 3px solid var(--color-primary);
  padding-left: 8px;
}
.modal-bg .field-row {
  display: grid; grid-template-columns: 220px 1fr; gap: 12px;
  padding: 10px 0;
  border-bottom: 1px dashed var(--color-border);
  font-size: 0.88rem;
}
.modal-bg .field-row:last-child { border-bottom: 0; }
.modal-bg .field-row .field-label { color: var(--color-text-muted); display: flex; align-items: center; gap: 8px; }
.modal-bg .field-row .field-label svg { width: 18px; height: 18px; fill: var(--color-text); flex-shrink: 0; }
.pill { display: inline-block; padding: 3px 10px; border-radius: 999px; font-size: 0.72rem; font-weight: 600; }
.pill-yes { background: rgba(22,163,74,0.12); color: var(--color-success); }
.pill-no { background: rgba(220,38,38,0.1); color: var(--color-danger); }
.pill-info { background: rgba(239,108,26,0.12); color: var(--color-primary); }
.modal-bg .speed-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-top: 6px; }
.modal-bg .speed-card {
  background: var(--color-bg-alt);
  border: 1px solid var(--color-border);
  border-radius: 8px; padding: 12px; text-align: center;
}
.modal-bg .speed-ico {
  width: 32px; height: 32px; margin: 0 auto 6px;
  background: #c8323a; color: #fff; border-radius: 50%;
  display: grid; place-items: center;
}
.modal-bg .speed-ico svg { width: 18px; height: 18px; fill: #fff; }
.modal-bg .speed-label { font-size: 0.62rem; color: var(--color-text-muted); text-transform: uppercase; letter-spacing: 0.5px; }
.modal-bg .speed-value { font-size: 1.1rem; font-weight: 800; color: var(--color-text); margin-top: 4px; }
.modal-bg .alert-box {
  background: rgba(247,209,71,0.12); border-left: 4px solid var(--color-warning);
  padding: 12px 14px; border-radius: 6px;
  font-size: 0.82rem; color: var(--color-text); margin-top: 10px;
}
.modal-bg .alert-box.info { background: rgba(239,108,26,0.08); border-color: var(--color-primary); }
.modal-bg .alert-box .alert-title { font-weight: 700; margin-bottom: 4px; display: block; }

/* ─────────────────────────────────────────────────────────────────────────
   PRINT — Single page A4 landscape, infographic style header
───────────────────────────────────────────────────────────────────────── */
@media print {
  @page { size: A4 landscape; margin: 5mm; }
  * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }

  html, body { background: #fff !important; font-size: 8pt; color: #1a1f33; margin: 0; padding: 0; }
  .container { max-width: 100% !important; padding: 0 !important; margin: 0 !important; }

  .site-header, .site-footer, header.site-header, footer.site-footer,
  header nav, footer, .page-hero, .breadcrumb,
  .docs-europe-tool .country-selector,
  .no-print { display: none !important; }

  .print-only { display: block !important; }

  /* ===== PRINT HEADER ===== */
  .print-header {
    background: #0a1b3d !important;
    color: #fff !important;
    border-bottom: 2px solid #ef6c1a !important;
    padding: 5px 10px !important;
    display: grid !important;
    grid-template-columns: auto 1fr;
    align-items: center;
    gap: 14px;
    margin-bottom: 4px;
  }
  .print-brand {
    display: flex; align-items: center; gap: 7px;
    padding-right: 12px;
    border-right: 1px solid rgba(255,255,255,0.18);
  }
  .print-brand-name {
    font-weight: 800; font-size: 14.4pt;
    color: #fff; letter-spacing: -0.2px;
  }
  .print-brand-name span { color: #8d9ab3; font-weight: 600; }
  .print-edition {
    color: #ef6c1a !important;
    font-size: 6pt; font-weight: 800;
    letter-spacing: 1.8px; text-transform: uppercase;
    margin-bottom: 1px;
  }
  .print-header-title h1 {
    margin: 0; font-size: 10pt; font-weight: 800;
    letter-spacing: -0.1px; color: #fff;
    line-height: 1.1;
  }
  .print-header-title p { margin: 2px 0 0; font-size: 6pt; color: #b8c5e0; }

  /* ===== TABLE (compressed) ===== */
  .docs-europe-tool .infographic {
    box-shadow: none !important;
    border-radius: 0 !important;
    border: 1px solid #d7deeb !important;
    margin-bottom: 4px;
  }
  .docs-europe-tool .infographic-table-wrap { overflow: visible !important; }
  .docs-europe-tool .infographic-table {
    min-width: 0 !important;
    font-size: 6pt !important;
    border-collapse: collapse !important;
  }
  /* Disable sticky + scroll hint in print */
  .docs-europe-tool .infographic::after { display: none !important; }
  .docs-europe-tool .infographic-table thead th:first-child,
  .docs-europe-tool .infographic-table tbody td:first-child {
    position: static !important;
    box-shadow: none !important;
  }
  .docs-europe-tool .infographic-table thead th {
    background: #0a1b3d !important; color: #fff !important;
    padding: 4px 3px !important;
    font-size: 5.5pt !important; letter-spacing: 0.2px !important;
  }
  .docs-europe-tool .infographic-table thead th.speed-group { background: #c8323a !important; }
  .docs-europe-tool .infographic-table thead th .col-ico {
    width: 18px !important; height: 18px !important;
    margin-bottom: 2px !important;
    background: rgba(255,255,255,0.15) !important;
  }
  .docs-europe-tool .infographic-table thead th .col-ico svg { width: 11px !important; height: 11px !important; }
  .docs-europe-tool .infographic-table thead th .col-sub { font-size: 5pt !important; margin-top: 1px !important; }
  .docs-europe-tool .infographic-table tbody td {
    padding: 2.5px 4px !important; font-size: 6pt !important;
    line-height: 1.15 !important;
    border-bottom: 0.5px solid #e6eaf2 !important;
  }
  .docs-europe-tool .infographic-table tbody td.equip-cell {
    font-size: 5.5pt !important;
    padding-left: 6px !important; padding-right: 6px !important;
  }
  .docs-europe-tool .infographic-table tbody tr:nth-child(even) td { background: #fafbfd !important; }
  .docs-europe-tool .country-cell { padding-left: 6px !important; }
  .docs-europe-tool .country-cell .flag { font-size: 9pt !important; margin-right: 3px !important; }
  .docs-europe-tool .country-cell .name { font-size: 6.5pt !important; }
  .docs-europe-tool .check-yes { font-size: 11pt !important; }
  .docs-europe-tool .speed-val { font-size: 7pt !important; }
  .docs-europe-tool .speed-val small { font-size: 5pt !important; }
  .docs-europe-tool .ct-yes, .docs-europe-tool .ct-no { font-size: 6pt !important; }
  .docs-europe-tool .ct-no small, .docs-europe-tool .vignette-yes small, .docs-europe-tool .vignette-no small { font-size: 5pt !important; }

  /* ===== GALLERY (compact) ===== */
  .docs-europe-tool .gallery {
    box-shadow: none !important;
    border: 1px solid #d7deeb !important;
    padding: 4px 6px !important;
    border-radius: 0 !important;
    margin-top: 4px !important;
  }
  .docs-europe-tool .gallery h3 {
    font-size: 7pt !important;
    margin: 0 0 4px !important;
    padding-bottom: 0 !important;
    color: #0a1b3d !important;
    letter-spacing: 0.3px !important;
  }
  .docs-europe-tool .gallery h3::after { display: none !important; }
  .docs-europe-tool .gallery-grid {
    grid-template-columns: repeat(8, 1fr) !important;
    gap: 4px !important;
  }
  .docs-europe-tool .gallery-item h4 { font-size: 5.5pt !important; margin: 1px 0 0 !important; line-height: 1.1; }
  .docs-europe-tool .gallery-item p { display: none !important; }
  .docs-europe-tool .gallery-icon-wrap { height: 32px !important; margin-bottom: 1px !important; }
  .docs-europe-tool .gallery-icon-wrap svg { max-height: 30px !important; max-width: 38px !important; width: auto !important; height: auto !important; }

  /* ===== DISCLAIMER ===== */
  .docs-europe-tool .disclaimer {
    box-shadow: none !important;
    border: 0 !important;
    padding: 4px 0 !important;
    margin-top: 3px !important;
    border-radius: 0 !important;
    grid-template-columns: 1fr 1fr !important;
    gap: 10px !important;
    font-size: 5.5pt !important;
  }
  .docs-europe-tool .disclaimer-item .ico { width: 13px !important; height: 13px !important; font-size: 7pt !important; }

  /* ===== PRINT FOOTER ===== */
  .print-footer {
    margin-top: 4px;
    padding: 4px 10px;
    background: #061026 !important;
    color: #fff !important;
    border-top: 2px solid #ef6c1a !important;
    display: flex !important;
    align-items: center; justify-content: space-between;
    font-size: 6pt;
  }
  .print-footer-brand { font-weight: 800; font-size: 7.5pt; color: #fff; }
  .print-footer-brand .dot { color: #ef6c1a; }
  .print-footer-tag { color: #b8c5e0; font-style: italic; }
  .print-footer-meta { color: #8d9ab3; font-size: 5.5pt; }
}
`
