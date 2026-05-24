'use client'

/**
 * Catalogue des voyants du tableau de bord — 75 témoins.
 *
 * Affichage et recherche visuelle des voyants. Cliquer sur un voyant ouvre
 * un panneau avec sa signification, le niveau d'urgence et les codes OBD-II
 * typiques. Fallback automatique vers FR pour les locales sans traduction.
 *
 * Source des données : DATS 24 + norme SAE J2012 (codes OBD).
 * Icônes : Material Design Icons (Apache 2.0).
 */

import { useState, useMemo, useCallback, useEffect } from 'react'
import { Link } from '@/i18n/navigation'
import type {
  Voyant,
  VoyantColor,
  VoyantUrgency,
  VoyantCategory,
  VoyantsData,
  VoyantsIcons,
} from './types'

interface Props {
  locale: string
  data: VoyantsData
  icons: VoyantsIcons
}

const COLOR_HEX: Record<VoyantColor, string> = {
  red: '#ef4444',
  yellow: '#eab308',
  green: '#10b981',
  white: '#9ca3af',
  blue: '#3b82f6',
}

const URGENCY_BG: Record<VoyantUrgency, string> = {
  critical: 'rgba(239,68,68,0.10)',
  high: 'rgba(245,158,11,0.10)',
  medium: 'rgba(234,179,8,0.10)',
  low: 'rgba(59,130,246,0.10)',
  info: 'rgba(156,163,175,0.10)',
}

const URGENCY_TEXT: Record<VoyantUrgency, string> = {
  critical: '#b91c1c',
  high: '#b45309',
  medium: '#a16207',
  low: '#1d4ed8',
  info: '#4b5563',
}

const UI: Record<string, Record<string, string | ((n: number) => string)>> = {
  fr: {
    title: 'Identifier mon voyant',
    lead: "Cliquez sur le voyant qui correspond à votre tableau de bord pour obtenir sa signification, le niveau d'urgence et les codes OBD-II associés.",
    backLink: "← Retour à l'Assistant",
    searchPlaceholder: 'Recherchez : batterie, ABS, moteur, pneu…',
    colorLabel: 'Couleur',
    catLabel: 'Catégorie',
    all: 'Toutes',
    nResults: (n) => `${n} voyant${n > 1 ? 's' : ''}`,
    clear: '✕ Effacer les filtres',
    empty: 'Aucun voyant ne correspond à votre recherche',
    reset: 'Réinitialiser',
    guidedTitle: 'Parcours guidé',
    guidedRed: 'Rouge = urgent',
    guidedYellow: 'Jaune = à contrôler',
    guidedInfo: 'Vert / Blanc / Bleu = info',
    secSignif: 'Signification',
    secAction: 'Action recommandée',
    secCauses: 'Causes possibles',
    secConseils: 'Conseils de dépannage',
    secObd: 'Codes OBD-II typiques',
    obdNote: 'Pour un diagnostic précis, branchez une valise OBD-II : un même voyant peut être déclenché par de nombreux codes différents.',
    close: 'Fermer',
    fallbackTitle: 'Vous ne trouvez pas votre voyant ?',
    fallbackDesc: 'Décrivez votre problème en quelques questions, notre diagnostic IA vous guidera vers la panne probable.',
    fallbackCta: 'Lancer le diagnostic guidé',
  },
  it: {
    title: 'Identifica la mia spia',
    lead: "Clicca sulla spia che corrisponde al tuo cruscotto per scoprirne il significato, l'urgenza e i codici OBD-II associati.",
    backLink: "← Torna all'Assistente",
    searchPlaceholder: 'Cerca: batteria, ABS, motore, pneumatico…',
    colorLabel: 'Colore',
    catLabel: 'Categoria',
    all: 'Tutte',
    nResults: (n) => `${n} spi${n > 1 ? 'e' : 'a'}`,
    clear: '✕ Cancella i filtri',
    empty: 'Nessuna spia corrisponde alla tua ricerca',
    reset: 'Reimposta',
    guidedTitle: 'Percorso guidato',
    guidedRed: 'Rosso = urgente',
    guidedYellow: 'Giallo = da controllare',
    guidedInfo: 'Verde / Bianco / Blu = info',
    secSignif: 'Significato',
    secAction: 'Azione consigliata',
    secCauses: 'Possibili cause',
    secConseils: 'Consigli di riparazione',
    secObd: 'Codici OBD-II tipici',
    obdNote: "Per una diagnosi precisa, collega uno scanner OBD-II: una stessa spia può essere attivata da molti codici diversi.",
    close: 'Chiudi',
    fallbackTitle: 'Non trovi la tua spia?',
    fallbackDesc: 'Descrivi il problema in poche domande: la nostra diagnosi IA ti guiderà verso il guasto probabile.',
    fallbackCta: 'Avvia la diagnosi guidata',
  },
  en: {
    title: 'Identify my warning light',
    lead: 'Click the light that matches your dashboard to see its meaning, urgency level and related OBD-II codes.',
    backLink: '← Back to Assistant',
    searchPlaceholder: 'Search: battery, ABS, engine, tire…',
    colorLabel: 'Color',
    catLabel: 'Category',
    all: 'All',
    nResults: (n) => `${n} light${n > 1 ? 's' : ''}`,
    clear: '✕ Clear filters',
    empty: 'No warning light matches your search',
    reset: 'Reset',
    guidedTitle: 'Guided path',
    guidedRed: 'Red = urgent',
    guidedYellow: 'Yellow = check soon',
    guidedInfo: 'Green / White / Blue = info',
    secSignif: 'Meaning',
    secAction: 'Recommended action',
    secCauses: 'Possible causes',
    secConseils: 'Troubleshooting tips',
    secObd: 'Typical OBD-II codes',
    obdNote: 'For an accurate diagnosis, plug an OBD-II scanner: a single warning light can be triggered by many different codes.',
    close: 'Close',
    fallbackTitle: "Can't find your warning light?",
    fallbackDesc: 'Describe your problem in a few questions, our AI diagnosis will guide you to the likely fault.',
    fallbackCta: 'Start guided diagnosis',
  },
  nl: {
    title: 'Mijn waarschuwingslampje identificeren',
    lead: 'Klik op het lampje dat overeenkomt met uw dashboard om de betekenis, urgentie en bijbehorende OBD-II-codes te zien.',
    backLink: '← Terug naar Assistent',
    searchPlaceholder: 'Zoek: accu, ABS, motor, band…',
    colorLabel: 'Kleur',
    catLabel: 'Categorie',
    all: 'Alle',
    nResults: (n) => `${n} lampje${n > 1 ? 's' : ''}`,
    clear: '✕ Filters wissen',
    empty: 'Geen lampje gevonden voor uw zoekopdracht',
    reset: 'Resetten',
    guidedTitle: 'Begeleide route',
    guidedRed: 'Rood = dringend',
    guidedYellow: 'Geel = controleer snel',
    guidedInfo: 'Groen / Wit / Blauw = info',
    secSignif: 'Betekenis',
    secAction: 'Aanbevolen actie',
    secCauses: 'Mogelijke oorzaken',
    secConseils: 'Reparatietips',
    secObd: 'Typische OBD-II-codes',
    obdNote: 'Voor een nauwkeurige diagnose, sluit een OBD-II-scanner aan: één lampje kan door veel verschillende codes worden geactiveerd.',
    close: 'Sluiten',
    fallbackTitle: 'Vindt u uw lampje niet?',
    fallbackDesc: 'Beschrijf uw probleem in een paar vragen, onze AI-diagnose leidt u naar de waarschijnlijke storing.',
    fallbackCta: 'Begeleide diagnose starten',
  },
  de: {
    title: 'Meine Warnleuchte identifizieren',
    lead: 'Klicken Sie auf die Leuchte, die zu Ihrem Armaturenbrett passt, um Bedeutung, Dringlichkeit und zugehörige OBD-II-Codes anzuzeigen.',
    backLink: '← Zurück zum Assistenten',
    searchPlaceholder: 'Suche: Batterie, ABS, Motor, Reifen…',
    colorLabel: 'Farbe',
    catLabel: 'Kategorie',
    all: 'Alle',
    nResults: (n) => `${n} Leuchte${n > 1 ? 'n' : ''}`,
    clear: '✕ Filter löschen',
    empty: 'Keine Warnleuchte entspricht Ihrer Suche',
    reset: 'Zurücksetzen',
    guidedTitle: 'Geführter Pfad',
    guidedRed: 'Rot = dringend',
    guidedYellow: 'Gelb = bald prüfen',
    guidedInfo: 'Grün / Weiß / Blau = Info',
    secSignif: 'Bedeutung',
    secAction: 'Empfohlene Aktion',
    secCauses: 'Mögliche Ursachen',
    secConseils: 'Tipps zur Fehlerbehebung',
    secObd: 'Typische OBD-II-Codes',
    obdNote: 'Für eine präzise Diagnose ein OBD-II-Diagnosegerät anschließen: Eine einzelne Leuchte kann durch viele unterschiedliche Codes ausgelöst werden.',
    close: 'Schließen',
    fallbackTitle: 'Finden Sie Ihre Leuchte nicht?',
    fallbackDesc: 'Beschreiben Sie Ihr Problem in wenigen Fragen, unsere KI-Diagnose leitet Sie zur wahrscheinlichen Störung.',
    fallbackCta: 'Geführte Diagnose starten',
  },
  es: {
    title: 'Identificar mi testigo',
    lead: 'Haz clic en el testigo que corresponde a tu cuadro de mandos para ver su significado, urgencia y los códigos OBD-II asociados.',
    backLink: '← Volver al Asistente',
    searchPlaceholder: 'Buscar: batería, ABS, motor, neumático…',
    colorLabel: 'Color',
    catLabel: 'Categoría',
    all: 'Todas',
    nResults: (n) => `${n} testigo${n > 1 ? 's' : ''}`,
    clear: '✕ Borrar filtros',
    empty: 'Ningún testigo corresponde a tu búsqueda',
    reset: 'Restablecer',
    guidedTitle: 'Recorrido guiado',
    guidedRed: 'Rojo = urgente',
    guidedYellow: 'Amarillo = revisar pronto',
    guidedInfo: 'Verde / Blanco / Azul = info',
    secSignif: 'Significado',
    secAction: 'Acción recomendada',
    secCauses: 'Causas posibles',
    secConseils: 'Consejos de reparación',
    secObd: 'Códigos OBD-II típicos',
    obdNote: 'Para un diagnóstico preciso, conecta un escáner OBD-II: un mismo testigo puede activarse por muchos códigos diferentes.',
    close: 'Cerrar',
    fallbackTitle: '¿No encuentras tu testigo?',
    fallbackDesc: 'Describe tu problema en pocas preguntas, nuestro diagnóstico IA te guiará a la avería probable.',
    fallbackCta: 'Iniciar diagnóstico guiado',
  },
}

function t(locale: string, key: string, ...args: number[]): string {
  const dict = UI[locale] || UI.fr
  const val = dict[key] ?? UI.fr[key]
  return typeof val === 'function' ? val(args[0] as number) : (val as string)
}

function VoyantSvg({ id, icons, color, size = 48 }: { id: number; icons: VoyantsIcons; color: VoyantColor; size?: number }) {
  const ic = icons[String(id)]
  if (!ic) return null
  return (
    <svg
      viewBox={ic.viewBox}
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      style={{ color: COLOR_HEX[color] }}
      fill="currentColor"
      dangerouslySetInnerHTML={{ __html: ic.body }}
    />
  )
}

function getI18n(v: Voyant, locale: string) {
  return v.i18n[locale] ?? v.i18n.fr!
}

export default function VoyantsCatalogue({ locale, data, icons }: Props) {
  const [activeColor, setActiveColor] = useState<VoyantColor | 'all'>('all')
  const [activeCat, setActiveCat] = useState<VoyantCategory | 'all'>('all')
  const [search, setSearch] = useState('')
  const [openId, setOpenId] = useState<number | null>(null)

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    return data.voyants.filter((v) => {
      if (activeColor !== 'all' && v.color !== activeColor) return false
      if (activeCat !== 'all' && v.category !== activeCat) return false
      if (q) {
        const i = getI18n(v, locale)
        const txt = [i.name, i.signification, ...v.obd_codes.map((c) => c.code)].join(' ').toLowerCase()
        if (!txt.includes(q)) return false
      }
      return true
    })
  }, [data.voyants, locale, activeColor, activeCat, search])

  const reset = useCallback(() => {
    setActiveColor('all')
    setActiveCat('all')
    setSearch('')
  }, [])

  useEffect(() => {
    if (openId === null) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpenId(null)
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [openId])

  const categories = data.meta.categories[locale] ?? data.meta.categories.fr
  const colorLabels = data.meta.colors[locale] ?? data.meta.colors.fr
  const urgencyLabels = data.meta.urgency[locale] ?? data.meta.urgency.fr

  const catCounts: Record<string, number> = useMemo(() => {
    const c: Record<string, number> = {}
    for (const v of data.voyants) c[v.category] = (c[v.category] || 0) + 1
    return c
  }, [data.voyants])

  const orderedCats = (Object.keys(categories) as VoyantCategory[]).sort((a, b) => (catCounts[b] || 0) - (catCounts[a] || 0))

  const openVoyant = openId != null ? data.voyants.find((v) => v.id === openId) ?? null : null

  const anyFilter = activeColor !== 'all' || activeCat !== 'all' || search

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto' }}>
      <Link href="/assistant-depannage" style={{ display: 'inline-block', fontSize: '0.85rem', color: 'var(--color-text-muted)', textDecoration: 'none', marginBottom: 16 }}>
        {t(locale, 'backLink')}
      </Link>

      <header style={{ marginBottom: 24 }}>
        <h1 style={{ margin: '0 0 8px', fontSize: '1.75rem', lineHeight: 1.25 }}>{t(locale, 'title')}</h1>
        <p style={{ margin: 0, color: 'var(--color-text-muted)', fontSize: '0.95rem', lineHeight: 1.6, maxWidth: 700 }}>{t(locale, 'lead')}</p>
      </header>

      <div style={{ position: 'relative', marginBottom: 16 }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }}>
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.3-4.3" />
        </svg>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t(locale, 'searchPlaceholder')}
          autoComplete="off"
          style={{ width: '100%', padding: '12px 14px 12px 44px', borderRadius: 12, border: '1.5px solid var(--color-border)', background: 'var(--color-bg-card)', color: 'var(--color-text)', fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box' }}
        />
      </div>

      <FilterRow label={t(locale, 'colorLabel')}>
        <Pill active={activeColor === 'all'} onClick={() => setActiveColor('all')}>{t(locale, 'all')}</Pill>
        {(Object.keys(colorLabels) as VoyantColor[]).map((key) => (
          <Pill key={key} active={activeColor === key} onClick={() => setActiveColor(key)}>
            <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: COLOR_HEX[key], marginRight: 6, verticalAlign: 'middle' }} />
            {colorLabels[key]}
          </Pill>
        ))}
      </FilterRow>

      <FilterRow label={t(locale, 'catLabel')}>
        <Pill active={activeCat === 'all'} onClick={() => setActiveCat('all')}>{t(locale, 'all')}</Pill>
        {orderedCats.map((key) => (
          <Pill key={key} active={activeCat === key} onClick={() => setActiveCat(key)}>
            {categories[key]} ({catCounts[key] || 0})
          </Pill>
        ))}
      </FilterRow>

      <div style={{ background: 'var(--color-bg-alt)', border: '1.5px solid var(--color-border)', borderRadius: 12, padding: '14px 18px', margin: '16px 0' }}>
        <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', marginBottom: 8, fontWeight: 600 }}>🧭 {t(locale, 'guidedTitle')}</div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <GuidedStep onClick={() => setActiveColor('red')}>⚠️ {t(locale, 'guidedRed')}</GuidedStep>
          <span style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>→</span>
          <GuidedStep onClick={() => setActiveColor('yellow')}>🟠 {t(locale, 'guidedYellow')}</GuidedStep>
          <span style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>→</span>
          <GuidedStep onClick={() => setActiveColor('green')}>🟢 {t(locale, 'guidedInfo')}</GuidedStep>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', margin: '20px 0 12px', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
        <span>{t(locale, 'nResults', filtered.length)}</span>
        {anyFilter && (
          <button onClick={reset} style={{ background: 'none', border: 'none', color: 'var(--color-primary)', cursor: 'pointer', fontSize: '0.85rem', padding: 0, fontFamily: 'inherit' }}>{t(locale, 'clear')}</button>
        )}
      </div>

      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--color-text-muted)' }}>
          <div style={{ fontSize: 40, marginBottom: 10 }}>🔍</div>
          <div>{t(locale, 'empty')}</div>
          <button onClick={reset} style={{ marginTop: 12, background: 'none', border: 'none', color: 'var(--color-primary)', cursor: 'pointer', fontFamily: 'inherit' }}>{t(locale, 'reset')}</button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(135px, 1fr))', gap: 10 }}>
          {filtered.map((v) => {
            const i = getI18n(v, locale)
            return (
              <button
                key={v.id}
                onClick={() => setOpenId(v.id)}
                style={{ position: 'relative', background: 'var(--color-bg-card)', border: '1.5px solid var(--color-border)', borderRadius: 12, padding: '14px 10px', cursor: 'pointer', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, minHeight: 124, transition: 'all .15s', fontFamily: 'inherit', color: 'var(--color-text)' }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = COLOR_HEX[v.color]; e.currentTarget.style.transform = 'translateY(-2px)' }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.transform = 'translateY(0)' }}
              >
                <span style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: COLOR_HEX[v.color], borderRadius: '12px 12px 0 0' }} />
                <span style={{ width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <VoyantSvg id={v.id} icons={icons} color={v.color} size={44} />
                </span>
                <span style={{ fontSize: '0.78rem', lineHeight: 1.25, fontWeight: 500 }}>{i.name}</span>
              </button>
            )
          })}
        </div>
      )}

      {openVoyant && (
        <VoyantModal
          voyant={openVoyant}
          icons={icons}
          locale={locale}
          colorLabel={colorLabels[openVoyant.color]}
          urgencyLabel={urgencyLabels[openVoyant.urgency]}
          onClose={() => setOpenId(null)}
        />
      )}

      <div style={{ marginTop: 32, padding: '20px 22px', background: 'var(--color-bg-alt)', border: '1.5px dashed var(--color-border)', borderRadius: 12, textAlign: 'center' }}>
        <div style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: 6 }}>{t(locale, 'fallbackTitle')}</div>
        <div style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', marginBottom: 14 }}>{t(locale, 'fallbackDesc')}</div>
        <Link
          href="/assistant-depannage?wizard=voyant"
          style={{ display: 'inline-block', padding: '10px 20px', background: 'var(--color-primary)', color: '#fff', borderRadius: 10, fontWeight: 600, fontSize: '0.88rem', textDecoration: 'none' }}
        >
          🤖 {t(locale, 'fallbackCta')}
        </Link>
      </div>

      <footer style={{ marginTop: 40, paddingTop: 20, borderTop: '1px solid var(--color-border)', fontSize: '0.75rem', color: 'var(--color-text-muted)', textAlign: 'center' }}>
        {data.meta.icons_source}
      </footer>
    </div>
  )
}

function FilterRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center', marginBottom: 8 }}>
      <span style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', marginRight: 4, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</span>
      {children}
    </div>
  )
}

function Pill({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{ padding: '6px 12px', borderRadius: 999, border: active ? '1.5px solid var(--color-primary)' : '1.5px solid var(--color-border)', background: active ? 'var(--color-primary)' : 'var(--color-bg-card)', color: active ? '#fff' : 'var(--color-text)', fontSize: '0.82rem', cursor: 'pointer', fontFamily: 'inherit', fontWeight: active ? 600 : 500, transition: 'all .12s' }}
    >
      {children}
    </button>
  )
}

function GuidedStep({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{ padding: '6px 10px', background: 'var(--color-bg-card)', borderRadius: 8, border: '1px solid var(--color-border)', color: 'var(--color-text)', fontSize: '0.8rem', cursor: 'pointer', fontFamily: 'inherit' }}
    >
      {children}
    </button>
  )
}

function VoyantModal({
  voyant,
  icons,
  locale,
  colorLabel,
  urgencyLabel,
  onClose,
}: {
  voyant: Voyant
  icons: VoyantsIcons
  locale: string
  colorLabel: string
  urgencyLabel: string
  onClose: () => void
}) {
  const i = getI18n(voyant, locale)
  return (
    <div
      onClick={(e) => e.target === e.currentTarget && onClose()}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
    >
      <div
        role="dialog"
        aria-modal="true"
        style={{ background: 'var(--color-bg-card)', border: '1.5px solid var(--color-border)', borderRadius: 16, maxWidth: 680, width: '100%', maxHeight: '90vh', overflowY: 'auto' }}
      >
        <div style={{ padding: '20px 22px 14px', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'flex-start', gap: 14, position: 'relative' }}>
          <div style={{ width: 60, height: 60, minWidth: 60, background: 'var(--color-bg-alt)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 8 }}>
            <VoyantSvg id={voyant.id} icons={icons} color={voyant.color} size={44} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '0 0 6px', paddingRight: 32 }}>{i.name}</h2>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              <Chip bg={`${COLOR_HEX[voyant.color]}22`} fg={COLOR_HEX[voyant.color]}>{colorLabel}</Chip>
              <Chip bg={URGENCY_BG[voyant.urgency]} fg={URGENCY_TEXT[voyant.urgency]}>{urgencyLabel}</Chip>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label={t(locale, 'close')}
            style={{ position: 'absolute', top: 14, right: 14, width: 30, height: 30, borderRadius: 8, border: '1px solid var(--color-border)', background: 'var(--color-bg-card)', color: 'var(--color-text-muted)', cursor: 'pointer', fontSize: 16, lineHeight: 1 }}
          >
            ✕
          </button>
        </div>
        <div style={{ padding: '18px 22px 22px' }}>
          <div
            style={{ padding: '12px 14px', borderRadius: 8, marginBottom: 16, background: URGENCY_BG[voyant.urgency], color: URGENCY_TEXT[voyant.urgency], borderLeft: `3px solid ${URGENCY_TEXT[voyant.urgency]}`, fontWeight: 500, fontSize: '0.9rem' }}
          >
            {i.action}
          </div>

          <Section title={t(locale, 'secSignif')}>{i.signification}</Section>
          <Section title={t(locale, 'secCauses')}>{i.causes}</Section>
          <Section title={t(locale, 'secConseils')}>{i.conseils}</Section>

          <div style={{ marginBottom: 4 }}>
            <h3 style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-text-muted)', margin: '0 0 8px', fontWeight: 700 }}>
              {t(locale, 'secObd')} ({voyant.obd_codes.length})
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {voyant.obd_codes.map((c, idx) => (
                <div key={idx} style={{ display: 'flex', gap: 12, padding: '8px 12px', background: 'var(--color-bg-alt)', borderRadius: 8, border: '1px solid var(--color-border)', alignItems: 'center' }}>
                  <span style={{ fontFamily: 'monospace', fontSize: '0.82rem', fontWeight: 600, color: 'var(--color-primary)', minWidth: 78 }}>{c.code}</span>
                  <span style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>{c.description}</span>
                </div>
              ))}
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', marginTop: 8, fontStyle: 'italic' }}>{t(locale, 'obdNote')}</div>
          </div>
        </div>
      </div>
    </div>
  )
}

function Chip({ bg, fg, children }: { bg: string; fg: string; children: React.ReactNode }) {
  return <span style={{ background: bg, color: fg, fontSize: '0.72rem', padding: '3px 10px', borderRadius: 999, fontWeight: 600 }}>{children}</span>
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <h3 style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-text-muted)', margin: '0 0 6px', fontWeight: 700 }}>{title}</h3>
      <p style={{ margin: 0, lineHeight: 1.55, color: 'var(--color-text)', fontSize: '0.92rem' }}>{children}</p>
    </div>
  )
}
