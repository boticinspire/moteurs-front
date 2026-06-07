'use client'

import { useEffect, useRef } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import FaqAccordion from '@/components/FaqAccordion'
import { useUserContext } from '@/context/UserContextProvider'
import { routing } from '@/i18n/routing'
import LeadInstallateur from '@/components/LeadInstallateur'

// HTML statique du formulaire — reste en FR pour cette vague ; les ids sont
// utilises par simulateur.js externe.
const FORM_HTML = `<section style="padding: 0;">
<div class="container">
<div class="simulator-grid">
<aside class="simulator-controls">
<h3>Profil</h3>
<div class="toggle-group" data-group="profil" style="margin-bottom:18px;">
<button class="active" data-value="B2B">B2B</button>
<button data-value="Particulier">Particulier</button>
</div>
<div class="form-group">
<label for="pays">Pays</label>
<select id="pays">
<option value="FR">🇫🇷 France</option>
<option value="BE">🇧🇪 Belgique</option>
<option value="CH">🇨🇭 Suisse</option>
<option value="CA">🇨🇦 Canada</option>
<option value="DE">🇩🇪 Allemagne</option>
<option value="ES">🇪🇸 Espagne</option>
<option value="IT">🇮🇹 Italie</option>
<option value="NL">🇳🇱 Pays-Bas</option>
<option value="AT">🇦🇹 Autriche</option>
<option value="PT">🇵🇹 Portugal</option>
<option value="PL">🇵🇱 Pologne</option>
<option value="SE">🇸🇪 Suède</option>
<option value="DK">🇩🇰 Danemark</option>
<option value="IE">🇮🇪 Irlande</option>
<option value="FI">🇫🇮 Finlande</option>
<option value="LU">🇱🇺 Luxembourg</option>
</select>
</div>
<div class="form-group">
<label for="segment">Segment</label>
<select id="segment">
<option value="vul_petit">Petit VUL</option>
<option selected="" value="vul_moyen">Fourgon moyen</option>
<option value="vul_grand">Grand fourgon</option>
<option value="camion">Camion 3,5–7,5 t</option>
<option value="poids_lourd">Poids-lourd</option>
</select>
</div>
<h3>Durée d'exploitation</h3>
<div class="toggle-group" data-group="duree" style="margin-bottom:18px;">
<button data-value="36">36 mois</button>
<button class="active" data-value="48">48 mois</button>
<button data-value="60">60 mois</button>
</div>
<div class="form-group">
<label for="km_an">Kilométrage annuel</label>
<input id="km_an" min="1000" step="1000" type="number" value="25000"/>
</div>
<h3>Profil d'usage</h3>
<div class="form-group">
<label for="profil_conduite">Profil de conduite</label>
<select id="profil_conduite">
<option value="urbain">Urbain pur</option>
<option selected="" value="mixte">Mixte (référence)</option>
<option value="route">Route</option>
<option value="autoroute">Autoroute</option>
</select>
</div>
<div class="form-group">
<label for="charge">Charge utile</label>
<select id="charge">
<option value="vide">Vide (&lt; 20 %)</option>
<option selected="" value="standard">Standard (50 %)</option>
<option value="pleine">Pleine (&gt; 80 %)</option>
</select>
</div>
<div class="form-group">
<label for="pct_hiver">Roulage hivernal : <span id="pct_hiver_val">25 %</span></label>
<input id="pct_hiver" max="100" min="0" step="5" style="width:100%;" type="range" value="25"/>
</div>
<div class="form-group">
<label for="taux_recharge_phev">Taux de recharge PHEV : <span id="taux_recharge_phev_val">50 %</span></label>
<input id="taux_recharge_phev" max="100" min="0" step="5" style="width:100%;" type="range" value="50"/>
</div>
<h3>Prix d'achat réel</h3>
<p style="font-size:0.78rem; color:var(--color-text-soft); margin-bottom:12px;">Modifiez le prix réel après remise concessionnaire. Laissez vide pour utiliser le prix catalogue de référence.</p>
<div id="prix-customs"></div>
<div class="form-group" style="margin-top:14px;">
<label for="prix_remise">Remise globale uniforme (€)</label>
<input id="prix_remise" min="0" placeholder="0" step="500" type="number" value="0"/>
<span style="font-size:0.75rem; color:var(--color-text-soft);">Appliquée à toutes les motorisations en plus des prix individuels.</span>
</div>
<div style="margin-top:18px; font-size:0.78rem; color:var(--color-text-soft); padding:10px; background:var(--color-bg-alt); border-radius:6px;">
💡 <strong>Astuce :</strong> changez le pays dans le menu Pays ci-dessus pour adapter automatiquement les aides, la TVA et les prix de l'énergie.
</div>
</aside>
<main class="simulator-results">
<div id="results-content">
<p style="color: var(--color-text-soft);">Calcul en cours…</p>
</div>
</main>
</div>
</div>
</section>`

export default function SimulateurContent() {
  const t = useTranslations('Simulateur')
  const locale = useLocale()
  const { context, isReady } = useUserContext()
  const formRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const script = document.createElement('script')
    // Version forcee pour invalider le cache CDN/navigateur (anti "Calcul en cours" fige)
    script.src = '/simulateur.js?v=20260607b'
    script.async = true
    document.body.appendChild(script)
    return () => {
      if (document.body.contains(script)) document.body.removeChild(script)
    }
  }, [])

  // Auto-réparation : si un re-render React (ex : fin du bootstrap auth) ré-injecte
  // le HTML statique du formulaire, la zone résultats revient à « Calcul en cours… »
  // et les listeners vanille sont perdus. On surveille le conteneur et on relance
  // l'init du simulateur dès qu'on détecte cette réinitialisation.
  useEffect(() => {
    const el = formRef.current
    if (!el) return
    const w = window as unknown as { MoteursSimulateur?: { reinit: () => void } }
    const heal = () => {
      const rc = el.querySelector('#results-content')
      if (rc && /Calcul en cours/.test(rc.textContent || '') && w.MoteursSimulateur) {
        w.MoteursSimulateur.reinit()
      }
    }
    const obs = new MutationObserver(heal)
    obs.observe(el, { childList: true, subtree: true })
    return () => obs.disconnect()
  }, [])

  useEffect(() => {
    if (!isReady) return
    const timer = setTimeout(() => {
      const paysCtx = context.preferences?.pays
      if (paysCtx) {
        const selectPays = document.getElementById('pays') as HTMLSelectElement | null
        if (selectPays && selectPays.value !== paysCtx) {
          selectPays.value = paysCtx
          selectPays.dispatchEvent(new Event('change', { bubbles: true }))
        }
      }
    }, 600)
    return () => clearTimeout(timer)
  }, [isReady, context.preferences?.pays])

  const faq = [
    { question: t('faq_q1'), answer: t('faq_a1') },
    { question: t('faq_q2'), answer: t('faq_a2') },
    { question: t('faq_q3'), answer: t('faq_a3') },
    { question: t('faq_q4'), answer: t('faq_a4') },
    { question: t('faq_q5'), answer: t('faq_a5') },
    { question: t('faq_q6'), answer: t('faq_a6') },
  ]

  const showEmbedNote = locale !== routing.defaultLocale

  return (
    <>
      <section className="page-hero">
        <div className="container">
          <h1>{t('h1')}</h1>
          <p>{t('lead')}</p>
        </div>
      </section>

      {showEmbedNote && (
        <div className="container" style={{ paddingTop: 16 }}>
          <div role="note" style={{
            background: 'rgba(255, 199, 0, 0.08)',
            border: '1px solid rgba(255, 199, 0, 0.25)',
            borderRadius: 8,
            padding: '12px 16px',
            fontSize: '0.88rem',
            color: 'var(--color-text)',
          }}>
            <span aria-hidden="true" style={{ marginRight: 8 }}>ℹ️</span>
            {t('embed_note')}
          </div>
        </div>
      )}

      <div ref={formRef} dangerouslySetInnerHTML={{ __html: FORM_HTML }} />

      <div className="container" style={{ paddingTop: 24 }}>
        <div className="disclaimer">
          <strong>{t('disclaimer').split(' — ')[0]} —</strong>
          {' ' + t('disclaimer').split(' — ').slice(1).join(' — ')}
        </div>
      </div>

      <div className="container" style={{ paddingTop: 40, paddingBottom: 16 }}>
        <LeadInstallateur typeProjet="borne_maison" variant="default" />
      </div>

      <div className="container" style={{ paddingBottom: 80, paddingTop: 24 }}>
        <FaqAccordion items={faq} />
      </div>
    </>
  )
}
