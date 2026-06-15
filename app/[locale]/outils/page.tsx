import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import { routing } from '@/i18n/routing'
import { buildAlternates } from '@/lib/seo-utils'

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'Outils' })
  return {
    title: t('meta_title'),
    description: t('meta_desc'),
    alternates: buildAlternates(locale, '/outils'),
  }
}

export default async function OutilsPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations('Outils')

  const OUTILS_PHARES = [
    {
      href: '/outils/facture-recharge',
      icon: '🔥',
      titre: 'Avez-vous payé trop cher ?',
      desc: 'Entrez votre dernière recharge (kWh + montant) : on vous dit en 10 s combien vous auriez pu économiser avec la bonne carte.',
      tags: ['Recharge', '€/kWh', 'Partageable', 'FR · BE · CH'],
      cta: 'Vérifier ma recharge',
      badge: t('badge_new'),
    },
    {
      href: '/outils/cartes-recharge',
      icon: '⚡',
      titre: t('cartes_titre'),
      desc: t('cartes_desc'),
      tags: [t('cartes_tag1'), t('cartes_tag2'), t('cartes_tag3'), 'FR & BE'],
      cta: t('cartes_cta'),
      badge: t('badge_new'),
    },
    {
      href: '/assistant-vacances',
      icon: '🏖️',
      titre: t('vacances_titre'),
      desc: t('vacances_desc'),
      tags: [t('vacances_tag1'), t('vacances_tag2'), t('vacances_tag3'), t('vacances_tag4')],
      cta: t('vacances_cta'),
      badge: t('badge_new'),
    },
    {
      href: '/assistance/couts',
      icon: '💰',
      titre: t('couts_titre'),
      desc: t('couts_desc'),
      tags: [t('couts_tag1'), '€/km', t('couts_tag2'), t('couts_tag3')],
      cta: t('couts_cta'),
      badge: null,
    },
    {
      href: '/comparer-trajet',
      icon: '📊',
      titre: t('trajet_titre'),
      desc: t('trajet_desc'),
      tags: [t('trajet_tag1'), t('trajet_tag2'), t('trajet_tag3')],
      cta: t('trajet_cta'),
      badge: null,
    },
    {
      href: '/simulateur',
      icon: '🧮',
      titre: t('simulateur_titre'),
      desc: t('simulateur_desc'),
      tags: [t('simulateur_tag1'), t('simulateur_tag2'), t('simulateur_tag3'), t('simulateur_tag4')],
      cta: t('simulateur_cta'),
      badge: null,
    },
    {
      href: '/outils/tco-poids-lourds',
      icon: '🚛',
      titre: t('pl_titre'),
      desc: t('pl_desc'),
      tags: [t('pl_tag1'), t('pl_tag2'), t('pl_tag3'), t('pl_tag4'), 'EU'],
      cta: t('pl_cta'),
      badge: t('badge_new'),
    },
    {
      href: '/outils/amende-pv',
      icon: '⚖️',
      titre: t('amende_titre'),
      desc: t('amende_desc'),
      tags: ['FR', 'BE', 'CH', 'CA', 'DE', 'ES', 'IT', 'NL'],
      cta: t('amende_cta'),
      badge: t('badge_new'),
    },
    {
      href: '/comparer',
      icon: '📊',
      titre: t('comparer_titre'),
      desc: t('comparer_desc'),
      tags: ['FR', 'BE', 'CH', 'CA'],
      cta: t('comparer_cta'),
      badge: null,
    },
  ]

  const OUTILS_COMPLEMENTAIRES = [
    {
      href: '/checklist-depart',
      icon: '✅',
      titre: t('checklist_titre'),
      desc: t('checklist_desc'),
      tags: [t('checklist_tag1'), t('checklist_tag2'), t('checklist_tag3'), t('checklist_tag4')],
      cta: t('checklist_cta'),
    },
    {
      href: '/tco',
      icon: '📈',
      titre: t('tco_profil_titre'),
      desc: t('tco_profil_desc'),
      tags: [t('tco_profil_tag1'), t('tco_profil_tag2'), t('tco_profil_tag3')],
      cta: t('tco_profil_cta'),
    },
    {
      href: '/assistance/admin',
      icon: '📋',
      titre: t('admin_titre'),
      desc: t('admin_desc'),
      tags: [t('admin_tag1'), t('admin_tag2'), t('admin_tag3')],
      cta: t('admin_cta'),
    },
    {
      href: '/assistance/panne',
      icon: '🚨',
      titre: t('panne_titre'),
      desc: t('panne_desc'),
      tags: [t('panne_tag1'), t('panne_tag2'), t('panne_tag3')],
      cta: t('panne_cta'),
    },
    {
      href: '/assistance/achat',
      icon: '🚗',
      titre: t('achat_titre'),
      desc: t('achat_desc'),
      tags: [t('achat_tag1'), t('achat_tag2'), t('achat_tag3')],
      cta: t('achat_cta'),
    },
    {
      href: '/assistance/recharge',
      icon: '⚡',
      titre: t('recharge_veh_titre'),
      desc: t('recharge_veh_desc'),
      tags: [t('recharge_veh_tag1'), t('recharge_veh_tag2'), t('recharge_veh_tag3')],
      cta: t('recharge_veh_cta'),
    },
    {
      href: '/outils/immatriculation-france',
      icon: '🇫🇷',
      titre: t('immat_fr_titre'),
      desc: t('immat_fr_desc'),
      tags: [t('immat_fr_tag1'), t('immat_fr_tag2'), t('immat_fr_tag3')],
      cta: t('immat_fr_cta'),
    },
    {
      href: '/outils/immatriculation-belgique',
      icon: '🇧🇪',
      titre: t('immat_be_titre'),
      desc: t('immat_be_desc'),
      tags: [t('immat_be_tag1'), t('immat_be_tag2'), t('immat_be_tag3')],
      cta: t('immat_be_cta'),
    },
    {
      href: '/outils/recharge-domicile-voiture-societe-belgique',
      icon: '🔌',
      titre: t('atn_titre'),
      desc: t('atn_desc'),
      tags: [t('atn_tag1'), t('atn_tag2'), t('atn_tag3'), t('atn_tag4')],
      cta: t('atn_cta'),
    },
    {
      href: '/outils/comparateur-voiture-societe-belgique',
      icon: '🚗',
      titre: 'Comparateur voiture de société',
      desc: 'Classez les voitures de la Carlist (cat. A, B, C) selon vos priorités : autonomie réelle été/hiver, confort, ATN et coût de recharge selon votre installation.',
      tags: ['Belgique', 'Autonomie', 'ATN', 'Membres'],
      cta: 'Comparer les véhicules',
      badge: t('badge_new'),
    },
    {
      href: '/outils/comparateur-financement-voiture',
      icon: '💶',
      titre: 'LOA, LLD, crédit ou comptant',
      desc: "Calculez le vrai coût de votre voiture selon le mode de financement et identifiez l'option la plus avantageuse : coût réel actualisé, revente et coût d'opportunité du capital.",
      tags: ['Comptant', 'Crédit', 'LOA', 'LLD'],
      cta: 'Comparer les financements',
      badge: t('badge_new'),
    },
    {
      href: '/outils/simulateur-borne-recharge',
      icon: '🔌',
      titre: t('borne_budget_titre'),
      desc: t('borne_budget_desc'),
      tags: [t('borne_budget_tag1'), t('borne_budget_tag2'), t('borne_budget_tag3'), t('borne_budget_tag4')],
      cta: t('borne_budget_cta'),
    },
    {
      href: '/outils/smart-charging-roi',
      icon: '☀️',
      titre: t('smart_titre'),
      desc: t('smart_desc'),
      tags: [t('smart_tag1'), t('smart_tag2'), t('smart_tag3'), t('smart_tag4')],
      cta: t('smart_cta'),
    },
    {
      href: '/outils/dpi-borne-belgique',
      icon: '💼',
      titre: t('dpi_titre'),
      desc: t('dpi_desc'),
      tags: [t('dpi_tag1'), t('dpi_tag2'), t('dpi_tag3'), t('dpi_tag4')],
      cta: t('dpi_cta'),
    },
    {
      href: '/outils/convertisseur',
      icon: '⚡',
      titre: t('convertisseur_titre'),
      desc: t('convertisseur_desc'),
      tags: [t('convertisseur_tag1'), t('convertisseur_tag2')],
      cta: t('convertisseur_cta'),
    },
    {
      href: '/outils/documents-europe',
      icon: '🇪🇺',
      titre: t('docs_titre'),
      desc: t('docs_desc'),
      tags: [t('docs_tag1'), t('docs_tag2'), t('docs_tag3'), t('docs_tag4')],
      cta: t('docs_cta'),
    },
  ]

  return (
    <>
      {/* ── Hero ── */}
      <section className="page-hero">
        <div className="container">
          <div style={{ fontSize: '0.82rem', color: 'var(--color-primary)', fontWeight: 600, marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {t('hero_chip')}
          </div>
          <h1>{t('hero_h1')}</h1>
          <p style={{ maxWidth: 540, margin: '0 auto' }}>
            {t('hero_lead')}
          </p>
        </div>
      </section>

      {/* ── Outils phares ── */}
      <section style={{ padding: '48px 0 0' }}>
        <div className="container">
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 20, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {t('section_essentials')}
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20, marginBottom: 48 }}>
            {OUTILS_PHARES.map((o) => (
              <Link key={o.href} href={o.href} style={{ textDecoration: 'none' }}>
                <div style={{
                  background: 'var(--color-bg-card)',
                  border: '1.5px solid var(--color-border)',
                  borderRadius: 14, padding: 28, height: '100%',
                  display: 'flex', flexDirection: 'column', gap: 14,
                  cursor: 'pointer', transition: 'border-color .15s, transform .15s',
                  position: 'relative',
                }}>
                  {o.badge && (
                    <div style={{
                      position: 'absolute', top: -12, right: 16,
                      background: 'var(--color-primary)', color: '#0a1628',
                      borderRadius: 20, padding: '3px 12px',
                      fontSize: '0.72rem', fontWeight: 800, letterSpacing: '0.05em',
                    }}>
                      {o.badge}
                    </div>
                  )}
                  <div style={{ fontSize: '2.4rem' }}>{o.icon}</div>
                  <div>
                    <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 8, color: 'var(--color-text)' }}>
                      {o.titre}
                    </h2>
                    <p style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', lineHeight: 1.6, margin: 0 }}>
                      {o.desc}
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {o.tags.map((tag) => (
                      <span key={tag} style={{
                        fontSize: '0.72rem', fontWeight: 600, padding: '3px 8px',
                        background: 'rgba(122,240,194,0.12)', color: 'var(--color-primary)',
                        border: '1px solid rgba(122,240,194,0.25)',
                        borderRadius: 4,
                      }}>{tag}</span>
                    ))}
                  </div>
                  <div style={{ marginTop: 'auto', paddingTop: 8 }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: '0.9rem', fontWeight: 700, color: 'var(--color-primary)' }}>
                      {o.cta} →
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* ── Outils complémentaires ── */}
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 20, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {t('section_complementary')}
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16, marginBottom: 64 }}>
            {OUTILS_COMPLEMENTAIRES.map((o) => (
              <Link key={o.href} href={o.href} style={{ textDecoration: 'none' }}>
                <div style={{
                  background: 'var(--color-bg-card)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 12, padding: '20px 20px',
                  display: 'flex', flexDirection: 'column', gap: 10,
                  cursor: 'pointer', transition: 'border-color .15s',
                }}>
                  <div style={{ fontSize: '1.8rem' }}>{o.icon}</div>
                  <div>
                    <h3 style={{ fontSize: '0.97rem', fontWeight: 700, marginBottom: 6, color: 'var(--color-text)' }}>
                      {o.titre}
                    </h3>
                    <p style={{ fontSize: '0.84rem', color: 'var(--color-text-muted)', lineHeight: 1.5, margin: 0 }}>
                      {o.desc}
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                    {o.tags.map((tag) => (
                      <span key={tag} style={{
                        fontSize: '0.7rem', fontWeight: 600, padding: '2px 7px',
                        background: 'rgba(255,255,255,0.05)', color: 'var(--color-text-muted)',
                        border: '1px solid var(--color-border)', borderRadius: 4,
                      }}>{tag}</span>
                    ))}
                  </div>
                  <span style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--color-primary)', marginTop: 4 }}>
                    {o.cta} →
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
