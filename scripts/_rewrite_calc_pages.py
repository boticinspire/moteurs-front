"""
Réécrit les 3 page.tsx wrappers (comparer, comparer-trajet, simulateur) avec
useTranslations + i18n metadata. Les composants ComparateurTCO et
ComparateurTrajet restent inchangés (Phase B vague 2).

Le simulateur garde dangerouslySetInnerHTML pour le formulaire FR
(piloté par simulateur.js externe) mais affiche un embed_note traduit
+ hero + FAQ + disclaimer traduits.
"""
import os
import tempfile


def atomic_write(target: str, content: str) -> str:
    target_dir = os.path.dirname(target) or "."
    fd, tmp = tempfile.mkstemp(prefix=".atomic_", dir=target_dir)
    try:
        with os.fdopen(fd, "w", encoding="utf-8") as f:
            f.write(content)
            f.flush()
            os.fsync(f.fileno())
        os.replace(tmp, target)
    except Exception:
        try:
            os.unlink(tmp)
        except FileNotFoundError:
            pass
        raise
    data = open(target, "rb").read()
    return "size=" + str(len(data)) + " nulls=" + str(b"\x00" in data) + " nl=" + str(data.count(b"\n"))


# =========================================================================
# /comparer/page.tsx
# =========================================================================
COMPARER_PAGE = r"""import type { Metadata } from 'next'
import { useTranslations } from 'next-intl'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import ComparateurTCO from './ComparateurTCO'
import FaqAccordion from '@/components/FaqAccordion'
import { routing } from '@/i18n/routing'

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'Comparer' })
  return {
    title: t('meta_title'),
    description: t('meta_desc'),
  }
}

export default async function ComparerPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)
  return <ComparerContent />
}

function ComparerContent() {
  const t = useTranslations('Comparer')

  const faq = [
    { question: t('faq_q1'), answer: t('faq_a1') },
    { question: t('faq_q2'), answer: t('faq_a2') },
    { question: t('faq_q3'), answer: t('faq_a3') },
    { question: t('faq_q4'), answer: t('faq_a4') },
    { question: t('faq_q5'), answer: t('faq_a5') },
    { question: t('faq_q6'), answer: t('faq_a6') },
  ]

  return (
    <>
      <section className="page-hero">
        <div className="container">
          <h1>{t('h1')}</h1>
          <p>{t('lead')}</p>
        </div>
      </section>

      <section style={{ padding: '32px 0 80px' }}>
        <div className="container">
          <ComparateurTCO />
          <FaqAccordion items={faq} />
        </div>
      </section>
    </>
  )
}
"""

# =========================================================================
# /comparer-trajet/page.tsx
# =========================================================================
COMPARER_TRAJET_PAGE = r"""import type { Metadata } from 'next'
import { useTranslations } from 'next-intl'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import ComparateurTrajet from './ComparateurTrajet'
import FaqAccordion from '@/components/FaqAccordion'
import { routing } from '@/i18n/routing'

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'ComparerTrajet' })
  return {
    title: t('meta_title'),
    description: t('meta_desc'),
    openGraph: {
      title: t('og_title'),
      description: t('og_desc'),
    },
  }
}

export default async function PageComparateurTrajet({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)
  return <ComparerTrajetContent />
}

function ComparerTrajetContent() {
  const t = useTranslations('ComparerTrajet')

  const badges = [
    t('badge_routes'),
    t('badge_stops'),
    t('badge_tolls'),
    t('badge_free'),
  ]

  const ped = [
    { icon: '⛽', titre: t('ped_1_title'), desc: t('ped_1_desc') },
    { icon: '🛣️', titre: t('ped_2_title'), desc: t('ped_2_desc') },
    { icon: '⚡', titre: t('ped_3_title'), desc: t('ped_3_desc') },
    { icon: '🔋', titre: t('ped_4_title'), desc: t('ped_4_desc') },
  ]

  const seoTrips = [
    { slug: 'belgique-cote-azur',    label: "🇧🇪 → 🇫🇷 Côte d'Azur" },
    { slug: 'belgique-toscane',      label: '🇧🇪 → 🇮🇹 Toscane' },
    { slug: 'pays-bas-lac-garde',    label: '🇳🇱 → 🇮🇹 Lac de Garde' },
    { slug: 'france-costa-brava',    label: '🇫🇷 → 🇪🇸 Costa Brava' },
    { slug: 'allemagne-algarve',     label: '🇩🇪 → 🇵🇹 Algarve' },
    { slug: 'pays-bas-dalmatie',     label: '🇳🇱 → 🇭🇷 Dalmatie' },
    { slug: 'danemark-norvege',      label: '🇩🇰 → 🇳🇴 Fjords' },
  ]

  const faq = [
    { question: t('faq_q1'), answer: t('faq_a1') },
    { question: t('faq_q2'), answer: t('faq_a2') },
    { question: t('faq_q3'), answer: t('faq_a3') },
    { question: t('faq_q4'), answer: t('faq_a4') },
    { question: t('faq_q5'), answer: t('faq_a5') },
    { question: t('faq_q6'), answer: t('faq_a6') },
  ]

  return (
    <main className="container" style={{ paddingTop: 40, paddingBottom: 64 }}>
      {/* Hero */}
      <div style={{ textAlign: 'center', marginBottom: 40 }}>
        <div style={{ fontSize: '0.85rem', color: 'var(--color-primary)', fontWeight: 600, marginBottom: 10, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
          {t('eyebrow')}
        </div>
        <h1 style={{ fontSize: 'clamp(1.6rem, 4vw, 2.4rem)', marginBottom: 14, lineHeight: 1.2 }}>
          {t('h1_a')}<br />
          <span style={{ color: 'var(--color-primary)' }}>{t('h1_b')}</span>
        </h1>
        <p style={{ maxWidth: 560, margin: '0 auto', color: 'var(--color-text-muted)', fontSize: '1rem', lineHeight: 1.6 }}>
          {t('lead')}
        </p>

        <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: 10, marginTop: 20 }}>
          {badges.map(b => (
            <span key={b} style={{
              padding: '5px 14px', borderRadius: 20, fontSize: '0.8rem',
              background: 'rgba(122,240,194,0.08)', border: '1px solid rgba(122,240,194,0.2)',
              color: 'var(--color-primary)',
            }}>
              {b}
            </span>
          ))}
        </div>
      </div>

      <ComparateurTrajet />

      {/* Section pédagogique */}
      <section style={{ marginTop: 64, borderTop: '1px solid var(--color-border)', paddingTop: 40 }}>
        <h2 style={{ textAlign: 'center', marginBottom: 32, fontSize: '1.3rem' }}>
          {t('ped_h2')}
        </h2>
        <div style={{ display: 'grid', gap: 20, gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
          {ped.map(item => (
            <div key={item.titre} style={{
              background: 'var(--color-bg-card)', borderRadius: 12,
              border: '1px solid var(--color-border)', padding: '20px 18px',
            }}>
              <div style={{ fontSize: '1.6rem', marginBottom: 10 }}>{item.icon}</div>
              <div style={{ fontWeight: 700, marginBottom: 6 }}>{item.titre}</div>
              <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', margin: 0, lineHeight: 1.5 }}>
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Section trajets SEO */}
      <section style={{ marginTop: 56, borderTop: '1px solid var(--color-border)', paddingTop: 32 }}>
        <h2 style={{ marginBottom: 8, fontSize: '1.2rem' }}>
          {t('seo_h2')}
        </h2>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', marginBottom: 18, lineHeight: 1.5 }}>
          {t('seo_lead')}
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {seoTrips.map(trip => (
            <a key={trip.slug} href={`/trajet/${trip.slug}`} style={{
              padding: '8px 14px', borderRadius: 20, fontSize: '0.85rem',
              background: 'rgba(122,240,194,0.06)', border: '1px solid rgba(122,240,194,0.2)',
              color: 'var(--color-primary)', textDecoration: 'none',
            }}>
              {trip.label}
            </a>
          ))}
          <a href="/trajet" style={{
            padding: '8px 14px', borderRadius: 20, fontSize: '0.85rem',
            background: 'transparent', border: '1px solid var(--color-border)',
            color: 'var(--color-text)', textDecoration: 'none',
          }}>
            {t('seo_all')}
          </a>
        </div>
      </section>

      {/* CTA */}
      <section style={{ marginTop: 48, textAlign: 'center' }}>
        <p style={{ color: 'var(--color-text-muted)', marginBottom: 16 }}>
          {t('cta_intro')}
        </p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 12, flexWrap: 'wrap' }}>
          <a href="/comparer" className="btn btn-secondary">
            {t('cta_tco')}
          </a>
          <a href="/simulateur" className="btn btn-secondary">
            {t('cta_simulator')}
          </a>
        </div>
      </section>

      <FaqAccordion items={faq} />
    </main>
  )
}
"""

# =========================================================================
# /simulateur/page.tsx
# =========================================================================
# Le formulaire reste en FR (dangerouslySetInnerHTML, piloté par simulateur.js)
# mais on traduit le hero, le FAQ, le disclaimer et un bandeau d'avertissement
SIMULATEUR_PAGE = r"""'use client'

import { useEffect } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import FaqAccordion from '@/components/FaqAccordion'
import { useUserContext } from '@/context/UserContextProvider'
import { routing } from '@/i18n/routing'

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
<option value="FR">France</option>
<option value="BE">Belgique</option>
<option value="CH">Suisse</option>
<option value="CA">Canada</option>
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

export default function SimulateurPage() {
  const t = useTranslations('Simulateur')
  const locale = useLocale()
  const { context, isReady } = useUserContext()

  useEffect(() => {
    const script = document.createElement('script')
    script.src = '/simulateur.js'
    script.async = true
    document.body.appendChild(script)
    return () => {
      if (document.body.contains(script)) document.body.removeChild(script)
    }
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

      <div dangerouslySetInnerHTML={{ __html: FORM_HTML }} />

      <div className="container" style={{ paddingTop: 24 }}>
        <div className="disclaimer">
          <strong>{t('disclaimer').split(' — ')[0]} —</strong>
          {' ' + t('disclaimer').split(' — ').slice(1).join(' — ')}
        </div>
      </div>

      <div className="container" style={{ paddingBottom: 80, paddingTop: 24 }}>
        <FaqAccordion items={faq} />
      </div>
    </>
  )
}
"""

print(atomic_write("app/[locale]/comparer/page.tsx", COMPARER_PAGE))
print(atomic_write("app/[locale]/comparer-trajet/page.tsx", COMPARER_TRAJET_PAGE))
print(atomic_write("app/[locale]/simulateur/page.tsx", SIMULATEUR_PAGE))
