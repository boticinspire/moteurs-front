'use client'

import { useEffect, useState } from 'react'
import { Link, useRouter } from '@/i18n/navigation'
import { useTranslations } from 'next-intl'
import NewsletterForm from '@/components/NewsletterForm'
import villesData from '@/data/villes.json'

type Theme = 'light' | 'dark'

// Détection saison été : par défaut light tant qu'on est < 1er septembre 2026
function detectSeasonTheme(): Theme {
  const now = new Date()
  const switchDate = new Date('2026-09-01T00:00:00')
  return now < switchDate ? 'light' : 'dark'
}

export default function HomePage() {
  const t = useTranslations('Home')
  const router = useRouter()
  const [theme, setTheme] = useState<Theme>('light')
  const [activeTab, setActiveTab] = useState<'trip' | 'tco' | 'fleet'>('trip')
  const [depart, setDepart] = useState('Paris')
  const [destination, setDestination] = useState('Nice')
  const [allerRetour, setAllerRetour] = useState<'yes' | 'no'>('yes')
  const [personnes, setPersonnes] = useState('2 adults')
  const [pays, setPays] = useState<'FR' | 'BE' | 'CH' | 'CA'>('FR')

  const paysLabel: Record<'FR' | 'BE' | 'CH' | 'CA', string> = {
    FR: 'France',
    BE: 'Belgique',
    CH: 'Suisse',
    CA: 'Canada',
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (activeTab === 'tco') { router.push('/comparer'); return }
    if (activeTab === 'fleet') { router.push('/b2b'); return }
    // Trip : passe les valeurs via sessionStorage
    try {
      sessionStorage.setItem('home-trajet', JSON.stringify({
        depart: depart.trim(),
        arrivee: destination.trim(),
        allerRetour: allerRetour === 'yes',
        personnes,
        pays,
      }))
    } catch {}
    router.push('/comparer-trajet')
  }

  useEffect(() => {
    const stored = typeof window !== 'undefined' ? localStorage.getItem('moteurs-theme') : null
    if (stored === 'light' || stored === 'dark') setTheme(stored)
    else setTheme(detectSeasonTheme())
  }, [])

  function applyTheme(t: Theme) {
    setTheme(t)
    try { localStorage.setItem('moteurs-theme', t) } catch {}
  }

  return (
    <main className="home-v2" data-theme={theme}>
      <div className="v2-grain" aria-hidden="true" />

      {/* ===== Lucide icon defs ===== */}
      <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true">
        <defs>
          <symbol id="i-arrow-right" viewBox="0 0 24 24"><path d="M5 12h14M12 5l7 7-7 7" /></symbol>
          <symbol id="i-arrow-up-right" viewBox="0 0 24 24"><path d="M7 17 17 7M7 7h10v10" /></symbol>
          <symbol id="i-map-pin" viewBox="0 0 24 24"><path d="M20 10c0 7-8 13-8 13s-8-6-8-13a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="3" /></symbol>
          <symbol id="i-route" viewBox="0 0 24 24"><circle cx="6" cy="19" r="3" /><path d="M9 19h8.5a3.5 3.5 0 0 0 0-7h-11a3.5 3.5 0 0 1 0-7H15" /><circle cx="18" cy="5" r="3" /></symbol>
          <symbol id="i-zap" viewBox="0 0 24 24"><path d="M13 2 3 14h9l-1 8 10-12h-9l1-8Z" /></symbol>
          <symbol id="i-fuel" viewBox="0 0 24 24"><line x1="3" x2="15" y1="22" y2="22" /><line x1="4" x2="14" y1="9" y2="9" /><path d="M14 22V4a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v18" /><path d="M14 13h2a2 2 0 0 1 2 2v2a2 2 0 0 0 2 2a2 2 0 0 0 2-2V9.83a2 2 0 0 0-.59-1.42L18 5" /></symbol>
          <symbol id="i-battery-charging" viewBox="0 0 24 24"><path d="M14.5 5H17a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-2.5" /><path d="M9.5 19H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h4.5" /><line x1="23" x2="23" y1="13" y2="11" /><polyline points="11 7 8 12 12 12 9 17" /></symbol>
          <symbol id="i-leaf" viewBox="0 0 24 24"><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19.2 2.96a1 1 0 0 1 1.8.5c0 8-3.78 16-12 16Z" /><path d="M2 21c0-3 1.85-5.36 5.08-6" /></symbol>
          <symbol id="i-check" viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5" /></symbol>
          <symbol id="i-shield-check" viewBox="0 0 24 24"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" /><path d="m9 12 2 2 4-4" /></symbol>
          <symbol id="i-credit-card" viewBox="0 0 24 24"><rect width="20" height="14" x="2" y="5" rx="2" /><line x1="2" x2="22" y1="10" y2="10" /></symbol>
          <symbol id="i-calculator" viewBox="0 0 24 24"><rect width="16" height="20" x="4" y="2" rx="2" /><line x1="8" x2="16" y1="6" y2="6" /><line x1="16" x2="16" y1="14" y2="18" /><path d="M8 10h.01M12 10h.01M16 10h.01M8 14h.01M12 14h.01M8 18h.01M12 18h.01" /></symbol>
          <symbol id="i-bar-chart" viewBox="0 0 24 24"><line x1="12" x2="12" y1="20" y2="10" /><line x1="18" x2="18" y1="20" y2="4" /><line x1="6" x2="6" y1="20" y2="16" /></symbol>
          <symbol id="i-trending-down" viewBox="0 0 24 24"><path d="m22 17-8.5-8.5-5 5L2 7" /><path d="M16 17h6v-6" /></symbol>
          <symbol id="i-calendar" viewBox="0 0 24 24"><rect width="18" height="18" x="3" y="4" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></symbol>
          <symbol id="i-globe" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" /></symbol>
          <symbol id="i-sun" viewBox="0 0 24 24"><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" /></symbol>
          <symbol id="i-moon" viewBox="0 0 24 24"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" /></symbol>
          <symbol id="i-umbrella" viewBox="0 0 24 24"><path d="M22 12a10 10 0 0 0-20 0Z" /><path d="M12 12v8a2 2 0 0 0 4 0" /><path d="M12 2v2" /></symbol>
          <symbol id="i-flame" viewBox="0 0 24 24"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5" /></symbol>
          <symbol id="i-briefcase" viewBox="0 0 24 24"><rect width="20" height="14" x="2" y="7" rx="2" /><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" /></symbol>
          <symbol id="i-camera" viewBox="0 0 24 24"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" /><circle cx="12" cy="13" r="3" /></symbol>
          <symbol id="i-file-text" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" x2="8" y1="13" y2="13" /><line x1="16" x2="8" y1="17" y2="17" /></symbol>
          <symbol id="i-wrench" viewBox="0 0 24 24"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" /></symbol>
          <symbol id="i-life-buoy" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="4" /><line x1="4.93" x2="9.17" y1="4.93" y2="9.17" /><line x1="14.83" x2="19.07" y1="14.83" y2="19.07" /><line x1="14.83" x2="19.07" y1="9.17" y2="4.93" /><line x1="14.83" x2="18.36" y1="9.17" y2="5.64" /><line x1="4.93" x2="9.17" y1="19.07" y2="14.83" /></symbol>
        </defs>
      </svg>

      {/* ===== HERO ===== */}
      <section className="v2-hero">
        <div className="v2-mesh">
          <div className="v2-orb o1" />
          <div className="v2-orb o2" />
          <div className="v2-orb o3" />
          <div className="v2-orb o4" />
        </div>
        <div className="v2-container">
          <div className="v2-hero-eyebrow">
            {theme === 'light' ? (
              <>
                <span className="chip">
                  <svg className="v2-ic" style={{ width: 11, height: 11, color: '#fff' }}><use href="#i-sun" /></svg>
                  &nbsp;{t('chip_summer_label')}
                </span>
                <span>{t('chip_summer_subtitle')}</span>
                <span className="sep">·</span>
                <span className="v2-mono" style={{ fontSize: '.72rem' }}>{t('chip_summer_meta')}</span>
              </>
            ) : (
              <>
                <span className="chip">{t('chip_live_label')}</span>
                <span>{t('chip_live_subtitle')}</span>
                <span className="sep">·</span>
                <span className="v2-mono" style={{ fontSize: '.72rem' }}>{t('chip_live_meta')}</span>
              </>
            )}
          </div>

          {theme === 'light' ? (
            <h1>
              {t('hero_h1_summer_a')} <span className="glow">{t('hero_h1_summer_glow')}</span><br />
              {t('hero_h1_summer_b')}
            </h1>
          ) : (
            <h1>
              {t('hero_h1_default_a')} <span className="glow">{t('hero_h1_default_glow')}</span><br />
              {t('hero_h1_default_b')}
            </h1>
          )}

          <p className="v2-lead">
            {t('hero_lead_a')}{' '}
            {t('hero_lead_b')} <em>{t('hero_lead_em')}</em> {t('hero_lead_c')}
          </p>

          <div className="v2-profile-tabs" role="tablist">
            <button className={activeTab === 'trip' ? 'active' : ''} onClick={() => setActiveTab('trip')}>
              <svg className="v2-ic"><use href={theme === 'light' ? '#i-umbrella' : '#i-route'} /></svg>
              {theme === 'light' ? t('tab_trip_summer') : t('tab_trip_default')}
            </button>
            <button className={activeTab === 'tco' ? 'active' : ''} onClick={() => setActiveTab('tco')}>
              <svg className="v2-ic"><use href="#i-bar-chart" /></svg>{t('tab_tco')}
            </button>
            <button className={activeTab === 'fleet' ? 'active' : ''} onClick={() => setActiveTab('fleet')}>
              <svg className="v2-ic"><use href="#i-briefcase" /></svg>{t('tab_fleet')}
            </button>
          </div>

          <div className="v2-tool-shell">
            <form className="v2-tool" onSubmit={handleSubmit}>
              {activeTab === 'trip' && (
                <>
                  <div className="field">
                    <label><svg className="v2-ic"><use href="#i-map-pin" /></svg>{t('form_departure')}</label>
                    <input
                      type="text"
                      list="v2-villes"
                      value={depart}
                      onChange={(e) => setDepart(e.target.value)}
                      placeholder="Paris"
                      required
                    />
                  </div>
                  <div className="field">
                    <label><svg className="v2-ic"><use href="#i-map-pin" /></svg>{theme === 'light' ? t('form_destination_light') : t('form_destination_dark')}</label>
                    <input
                      type="text"
                      list="v2-villes"
                      value={destination}
                      onChange={(e) => setDestination(e.target.value)}
                      placeholder="Nice"
                      required
                    />
                  </div>
                  <div className="field">
                    <label><svg className="v2-ic"><use href="#i-calendar" /></svg>{t('form_round_trip')}</label>
                    <select value={allerRetour} onChange={(e) => setAllerRetour(e.target.value as 'yes' | 'no')}>
                      <option value="yes">{t('form_yes')}</option>
                      <option value="no">{t('form_no')}</option>
                    </select>
                  </div>
                  <div className="field">
                    <label><svg className="v2-ic"><use href="#i-briefcase" /></svg>{t('form_people')}</label>
                    <select value={personnes} onChange={(e) => setPersonnes(e.target.value)}>
                      <option value="2 adults">{t('form_2_adults')}</option>
                      <option value="1">1</option>
                      <option value="3">3</option>
                      <option value="4">4</option>
                      <option value="5+">5+</option>
                    </select>
                  </div>
                </>
              )}
              {activeTab === 'tco' && (
                <div className="field" style={{ flex: 4 }}>
                  <label><svg className="v2-ic"><use href="#i-bar-chart" /></svg>{t('tco_inner_label')}</label>
                  <div style={{ padding: '12px 14px', color: 'var(--color-text-muted)', fontSize: '.9rem' }}>
                    {t('tco_inner_body')}
                  </div>
                </div>
              )}
              {activeTab === 'fleet' && (
                <div className="field" style={{ flex: 4 }}>
                  <label><svg className="v2-ic"><use href="#i-briefcase" /></svg>{t('fleet_inner_label')}</label>
                  <div style={{ padding: '12px 14px', color: 'var(--color-text-muted)', fontSize: '.9rem' }}>
                    {t('fleet_inner_body')}
                  </div>
                </div>
              )}
              <div className="field">
                <label><svg className="v2-ic"><use href="#i-globe" /></svg>{t('form_country')}</label>
                <select value={pays} onChange={(e) => setPays(e.target.value as 'FR' | 'BE' | 'CH' | 'CA')}>
                  <option value="FR">{paysLabel.FR}</option>
                  <option value="BE">{paysLabel.BE}</option>
                  <option value="CH">{paysLabel.CH}</option>
                  <option value="CA">{paysLabel.CA}</option>
                </select>
              </div>
              <div className="go">
                <button type="submit">
                  {activeTab === 'tco' ? t('cta_calculate') : activeTab === 'fleet' ? t('cta_discover') : t('cta_compare')}
                  <svg className="v2-ic"><use href="#i-arrow-right" /></svg>
                </button>
              </div>
            </form>
            <datalist id="v2-villes">
              {villesData.map((v) => (
                <option
                  key={`${v.nom}-${v.pays_code}`}
                  value={v.nom}
                  label={v.region ? `${v.nom} · ${v.region}` : `${v.nom} · ${v.pays}`}
                >
                  {v.region ? `${v.nom} · ${v.region}` : `${v.nom} · ${v.pays}`}
                </option>
              ))}
            </datalist>
          </div>

          {/* ===== Live result ===== */}
          <div className="v2-live">
            <div className="cell">
              <div className="moto"><svg className="v2-ic"><use href="#i-fuel" /></svg>{t('live_petrol')}</div>
              <div className="val">156<span className="cur">€</span></div>
              <div className="sub">{t('live_round_trip_with_tolls')}</div>
            </div>
            <div className="cell">
              <div className="moto"><svg className="v2-ic"><use href="#i-fuel" /></svg>{t('live_diesel')}</div>
              <div className="val">138<span className="cur">€</span></div>
              <div className="sub">{t('live_round_trip_with_tolls')}</div>
            </div>
            <div className="cell win">
              <span className="badge"><svg className="v2-ic"><use href="#i-trending-down" /></svg>{t('live_cheapest')}</span>
              <div className="moto"><svg className="v2-ic"><use href="#i-zap" /></svg>{t('live_electric')}</div>
              <div className="val">70<span className="cur">€</span></div>
              <div className="sub">{t('live_with_fast_charge')}</div>
            </div>
            <div className="cell">
              <div className="moto"><svg className="v2-ic"><use href="#i-battery-charging" /></svg>{t('live_phev')}</div>
              <div className="val">112<span className="cur">€</span></div>
              <div className="sub">{t('live_mix_elec_petrol')}</div>
            </div>
          </div>

          <div className="v2-proof-row">
            <span className="item"><svg className="v2-ic"><use href="#i-check" /></svg><strong>{t('proof_routes_strong')}</strong>&nbsp;{t('proof_routes_rest')}</span>
            <span className="item"><svg className="v2-ic"><use href="#i-check" /></svg><strong>{t('proof_sources_strong')}</strong>&nbsp;{t('proof_sources_rest')}</span>
            <span className="item"><svg className="v2-ic"><use href="#i-check" /></svg><strong>{t('proof_free_strong')}</strong>&nbsp;{t('proof_free_rest')}</span>
            <span className="item"><svg className="v2-ic"><use href="#i-check" /></svg><strong>{t('proof_gdpr_strong')}</strong>&nbsp;{t('proof_gdpr_rest')}</span>
          </div>
        </div>
      </section>

      {/* ===== 3 outils pour gérer une panne ===== */}
      <section className="v2-section v2-section-tight">
        <div className="v2-container">
          <div className="v2-section-head">
            <div className="left">
              <div className="v2-eyebrow">{t('panne_eyebrow')}</div>
              <h2>{t('panne_title_a')} <span className="grad">{t('panne_title_glow')}</span></h2>
            </div>
            <Link className="v2-btn v2-btn-ghost" href="/depannage">
              {t('panne_cta_hub')} <svg className="v2-ic"><use href="#i-arrow-right" /></svg>
            </Link>
          </div>
          <div className="v2-tools-grid v2-tools-grid-3">
            <Link className="v2-tcard c-orange v2-tcard-urgent" href="/assistant-depannage">
              <div className="icbox"><svg className="v2-ic"><use href="#i-camera" /></svg></div>
              <h3>{t('panne_card1_title')}</h3>
              <p>{t('panne_card1_desc')}</p>
              <span className="open">{t('panne_card1_cta')} <svg className="v2-ic"><use href="#i-arrow-right" /></svg></span>
            </Link>
            <Link className="v2-tcard c-amber" href="/constat">
              <div className="icbox"><svg className="v2-ic"><use href="#i-file-text" /></svg></div>
              <h3>{t('panne_card2_title')}</h3>
              <p>{t('panne_card2_desc')}</p>
              <span className="open">{t('panne_card2_cta')} <svg className="v2-ic"><use href="#i-arrow-right" /></svg></span>
            </Link>
            <Link className="v2-tcard c-blue" href="/assistance/panne">
              <div className="icbox"><svg className="v2-ic"><use href="#i-life-buoy" /></svg></div>
              <h3>{t('panne_card3_title')}</h3>
              <p>{t('panne_card3_desc')}</p>
              <span className="open">{t('panne_card3_cta')} <svg className="v2-ic"><use href="#i-arrow-right" /></svg></span>
            </Link>
          </div>
        </div>
      </section>

      {/* ===== Metrics ===== */}
      <section className="v2-metrics">
        <div className="v2-container">
          <div className="grid">
            <div className="cell">
              <div className="ic-wrap"><svg className="v2-ic"><use href="#i-trending-down" /></svg></div>
              <div className="num"><span className="accent">{t('metric_1_value')}</span>{t('metric_1_unit')}</div>
              <div className="lbl">{t('metric_1_label')}</div>
            </div>
            <div className="cell">
              <div className="ic-wrap"><svg className="v2-ic"><use href="#i-route" /></svg></div>
              <div className="num">{t('metric_2_value')}</div>
              <div className="lbl">{t('metric_2_label')}</div>
            </div>
            <div className="cell">
              <div className="ic-wrap"><svg className="v2-ic"><use href="#i-briefcase" /></svg></div>
              <div className="num"><span className="accent">{t('metric_3_value')}</span>{t('metric_3_unit')}</div>
              <div className="lbl">{t('metric_3_label')}</div>
            </div>
            <div className="cell">
              <div className="ic-wrap"><svg className="v2-ic"><use href="#i-flame" /></svg></div>
              <div className="num">{t('metric_4_value')}</div>
              <div className="lbl">{t('metric_4_label')}</div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== Itinéraires été (light only) ===== */}
      {theme === 'light' && (
        <section className="v2-section alt">
          <div className="v2-container">
            <div className="v2-section-head">
              <div className="left">
                <div className="v2-eyebrow">{t('summer_eyebrow')}</div>
                <h2>{t('summer_title_a')} <span className="grad">{t('summer_title_glow')}</span></h2>
              </div>
              <Link className="v2-btn v2-btn-ghost" href="/vacances-voiture">
                {t('summer_cta_all')} <svg className="v2-ic"><use href="#i-arrow-right" /></svg>
              </Link>
            </div>
            <div className="v2-iti-grid">
              {[
                { key: '1', titre: t('summer_trip_1_title'), sub: t('summer_trip_1_sub'), km: t('summer_trip_1_km'), diesel: 138, elec: 70, ess: 156, save: 68, bg: 'linear-gradient(180deg,#f59e0b,#ef6c1a)' },
                { key: '2', titre: t('summer_trip_2_title'), sub: t('summer_trip_2_sub'), km: t('summer_trip_2_km'), diesel: 186, elec: 112, ess: 210, save: 74, bg: 'linear-gradient(180deg,#10b981,#0a8a5e)' },
                { key: '3', titre: t('summer_trip_3_title'), sub: t('summer_trip_3_sub'), km: t('summer_trip_3_km'), diesel: 164, elec: 95, ess: 183, save: 69, bg: 'linear-gradient(180deg,#38bdf8,#0c4a6e)' },
              ].map((trip) => (
                <Link key={trip.key} className="v2-iti" href="/comparer-trajet">
                  <div className="scene">
                    <div className="bg" style={{ background: trip.bg }} />
                    <div className="row">
                      <div className="city">{trip.titre}<span>{trip.sub}</span></div>
                      <span className="km"><svg className="v2-ic"><use href="#i-route" /></svg>{trip.km}</span>
                    </div>
                  </div>
                  <div className="body">
                    <div className="compare">
                      <div className="c"><div className="l"><svg className="v2-ic"><use href="#i-fuel" /></svg>{t('summer_card_diesel')}</div><div className="v">{trip.diesel}€</div></div>
                      <div className="c w"><div className="l"><svg className="v2-ic"><use href="#i-zap" /></svg>{t('summer_card_electric')}</div><div className="v">{trip.elec}€</div></div>
                      <div className="c"><div className="l"><svg className="v2-ic"><use href="#i-fuel" /></svg>{t('summer_card_petrol')}</div><div className="v">{trip.ess}€</div></div>
                    </div>
                    <div className="open">
                      <span className="save"><svg className="v2-ic"><use href="#i-trending-down" /></svg>&minus;{trip.save}€</span>
                      <span className="arr">{t('summer_card_detail')} <svg className="v2-ic"><use href="#i-arrow-right" /></svg></span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ===== Tools grid ===== */}
      <section className="v2-section">
        <div className="v2-container">
          <div className="v2-section-head">
            <div className="left">
              <div className="v2-eyebrow">{t('tools_eyebrow')}</div>
              <h2>{t('tools_title_a')} <span className="grad">{t('tools_title_glow')}</span></h2>
            </div>
            <Link className="v2-btn v2-btn-ghost" href="/outils">
              {t('tools_cta_all')} <svg className="v2-ic"><use href="#i-arrow-right" /></svg>
            </Link>
          </div>
          <div className="v2-tools-grid">
            <Link className="v2-tcard c-blue" href="/comparer-trajet">
              <div className="icbox"><svg className="v2-ic"><use href="#i-route" /></svg></div>
              <h3>{t('tool1_title')}</h3>
              <p>{t('tool1_desc')}</p>
              <span className="open">{t('tool1_cta')} <svg className="v2-ic"><use href="#i-arrow-right" /></svg></span>
            </Link>
            <Link className="v2-tcard c-green" href="/comparer">
              <div className="icbox"><svg className="v2-ic"><use href="#i-bar-chart" /></svg></div>
              <h3>{t('tool2_title')}</h3>
              <p>{t('tool2_desc')}</p>
              <span className="open">{t('tool2_cta')} <svg className="v2-ic"><use href="#i-arrow-right" /></svg></span>
            </Link>
            <Link className="v2-tcard c-amber" href="/simulateur">
              <div className="icbox"><svg className="v2-ic"><use href="#i-calculator" /></svg></div>
              <h3>{t('tool3_title')}</h3>
              <p>{t('tool3_desc')}</p>
              <span className="open">{t('tool3_cta')} <svg className="v2-ic"><use href="#i-arrow-right" /></svg></span>
            </Link>
            <Link className="v2-tcard c-pink" href="/outils/cartes-recharge">
              <div className="icbox"><svg className="v2-ic"><use href="#i-credit-card" /></svg></div>
              <h3>{t('tool4_title')}</h3>
              <p>{t('tool4_desc')}</p>
              <span className="open">{t('tool4_cta')} <svg className="v2-ic"><use href="#i-arrow-right" /></svg></span>
            </Link>
            <Link className="v2-tcard c-violet" href="/assistant-depannage">
              <div className="icbox"><svg className="v2-ic"><use href="#i-camera" /></svg></div>
              <h3>{t('tool5_title')}</h3>
              <p>{t('tool5_desc')}</p>
              <span className="open">{t('tool5_cta')} <svg className="v2-ic"><use href="#i-arrow-right" /></svg></span>
            </Link>
            <Link className="v2-tcard c-orange" href="/constat">
              <div className="icbox"><svg className="v2-ic"><use href="#i-file-text" /></svg></div>
              <h3>{t('tool6_title')}</h3>
              <p>{t('tool6_desc')}</p>
              <span className="open">{t('tool6_cta')} <svg className="v2-ic"><use href="#i-arrow-right" /></svg></span>
            </Link>
            <Link className="v2-tcard c-blue" href="/depannage">
              <div className="icbox"><svg className="v2-ic"><use href="#i-wrench" /></svg></div>
              <h3>{t('tool7_title')}</h3>
              <p>{t('tool7_desc')}</p>
              <span className="open">{t('tool7_cta')} <svg className="v2-ic"><use href="#i-arrow-right" /></svg></span>
            </Link>
            <Link className="v2-tcard c-green" href="/assistance">
              <div className="icbox"><svg className="v2-ic"><use href="#i-life-buoy" /></svg></div>
              <h3>{t('tool8_title')}</h3>
              <p>{t('tool8_desc')}</p>
              <span className="open">{t('tool8_cta')} <svg className="v2-ic"><use href="#i-arrow-right" /></svg></span>
            </Link>
          </div>
        </div>
      </section>

      {/* ===== Pourquoi nous croire ===== */}
      <section className="v2-section alt">
        <div className="v2-container">
          <div className="v2-section-head">
            <div className="left">
              <div className="v2-eyebrow">{t('why_eyebrow')}</div>
              <h2>{t('why_title_a')} <span className="grad">{t('why_title_glow')}</span></h2>
            </div>
          </div>
          <div className="v2-tools-grid">
            <div className="v2-tcard c-blue"><div className="icbox"><svg className="v2-ic"><use href="#i-bar-chart" /></svg></div><h3>{t('why_1_title')}</h3><p>{t('why_1_desc')}</p></div>
            <div className="v2-tcard c-green"><div className="icbox"><svg className="v2-ic"><use href="#i-shield-check" /></svg></div><h3>{t('why_2_title')}</h3><p>{t('why_2_desc')}</p></div>
            <div className="v2-tcard c-violet"><div className="icbox"><svg className="v2-ic"><use href="#i-globe" /></svg></div><h3>{t('why_3_title')}</h3><p>{t('why_3_desc')}</p></div>
            <div className="v2-tcard c-orange"><div className="icbox"><svg className="v2-ic"><use href="#i-leaf" /></svg></div><h3>{t('why_4_title')}</h3><p>{t('why_4_desc')}</p></div>
          </div>
        </div>
      </section>

      {/* ===== Logos sources ===== */}
      <div className="v2-logos">
        <div className="v2-container">
          <span className="lab"><svg className="v2-ic"><use href="#i-shield-check" /></svg>{t('sources_label')}</span>
          <div className="row">
            <span>DGEC</span><span className="dot" />
            <span>Commission Européenne</span><span className="dot" />
            <span>ACEA</span><span className="dot" />
            <span>OpenChargeMap</span><span className="dot" />
            <span>ADEME</span><span className="dot" />
            <span>SPF Finances BE</span><span className="dot" />
            <span>OFEN CH</span>
          </div>
        </div>
      </div>

      {/* ===== Newsletter CTA ===== */}
      <section className="v2-section">
        <div className="v2-container">
          <div className="v2-cta-block">
            <div>
              <h2>{t('newsletter_title_a')} <span className="grad">{t('newsletter_title_glow')}</span></h2>
              <p>{t('newsletter_subtitle')}</p>
            </div>
            <div>
              <NewsletterForm />
            </div>
          </div>
        </div>
      </section>

      {/* ===== Toggle thème flottant ===== */}
      <div className="v2-theme-toggle" role="group" aria-label={t('theme_group_label')}>
        <button
          type="button"
          className={theme === 'light' ? 'active' : ''}
          onClick={() => applyTheme('light')}
          aria-label={t('theme_aria_light')}
        >
          <svg className="v2-ic"><use href="#i-sun" /></svg>{t('theme_label_light')}
        </button>
        <button
          type="button"
          className={theme === 'dark' ? 'active' : ''}
          onClick={() => applyTheme('dark')}
          aria-label={t('theme_aria_dark')}
        >
          <svg className="v2-ic"><use href="#i-moon" /></svg>{t('theme_label_dark')}
        </button>
      </div>
    </main>
  )
}
