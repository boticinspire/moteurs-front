'use client'

/**
 * Moteurs.com — Widget CTA LeadInstallateur
 *
 * Bloc réutilisable à insérer dans les pages recharge, simulateur, ATN, articles…
 * Redirige vers /installateurs (avec type_projet pré-sélectionné via query param).
 *
 * Usage :
 *   <LeadInstallateur />
 *   <LeadInstallateur typeProjet="panneaux" titre="Installez des panneaux solaires" />
 *   <LeadInstallateur variant="compact" />
 */

import { Link } from '@/i18n/navigation'

// ─── Types ────────────────────────────────────────────────────────────────────

type TypeProjet = 'borne_maison' | 'borne_entreprise' | 'panneaux' | 'batterie' | 'audit'

interface LeadInstallateurProps {
  /** Type de projet pré-sélectionné dans le formulaire (optionnel) */
  typeProjet?: TypeProjet
  /** Titre personnalisé (override le titre par défaut) */
  titre?: string
  /** Description personnalisée */
  description?: string
  /** Texte du bouton */
  cta?: string
  /**
   * Variante d'affichage :
   * - "default"  : carte pleine largeur avec fond coloré (sections de page)
   * - "compact"  : bloc horizontal plus discret (fin d'article, sidebar)
   * - "inline"   : bandeau mince (entre deux sections)
   */
  variant?: 'default' | 'compact' | 'inline'
}

// ─── Contenu par type de projet ───────────────────────────────────────────────

const CONTENT: Record<
  TypeProjet,
  { icon: string; titre: string; desc: string; cta: string }
> = {
  borne_maison: {
    icon:  '🔌',
    titre: 'Faites installer votre borne de recharge à domicile',
    desc:  'Comparez les devis d\'installateurs IRVE certifiés et bénéficiez des aides disponibles (CEE, ADVENIR).',
    cta:   'Obtenir des devis gratuits →',
  },
  borne_entreprise: {
    icon:  '⚡',
    titre: 'Équipez votre entreprise en bornes de recharge',
    desc:  'Infrastructure IRVE pour flotte, parking, copropriété — installateurs RGE certifiés, devis sous 24h.',
    cta:   'Demander un devis pro →',
  },
  panneaux: {
    icon:  '☀️',
    titre: 'Installez des panneaux solaires',
    desc:  'Réduisez votre facture et rechargez votre véhicule avec de l\'énergie propre. Installateurs QualiPV.',
    cta:   'Comparer les devis →',
  },
  batterie: {
    icon:  '🔋',
    titre: 'Ajoutez une batterie de stockage',
    desc:  'Stockez votre production solaire et rechargez la nuit. Installateurs certifiés, devis gratuit.',
    cta:   'Trouver un installateur →',
  },
  audit: {
    icon:  '📋',
    titre: 'Demandez un audit énergétique',
    desc:  'Évaluez les économies possibles sur votre consommation et vos déplacements. Auditeurs certifiés.',
    cta:   'Prendre rendez-vous →',
  },
}

const DEFAULT_TYPE: TypeProjet = 'borne_maison'

// ─── Composant ────────────────────────────────────────────────────────────────

export default function LeadInstallateur({
  typeProjet = DEFAULT_TYPE,
  titre,
  description,
  cta,
  variant = 'default',
}: LeadInstallateurProps) {
  const content = CONTENT[typeProjet]
  const finalTitre = titre       ?? content.titre
  const finalDesc  = description ?? content.desc
  const finalCta   = cta         ?? content.cta

  // URL vers la page installateurs avec type pré-sélectionné
  const href = `/installateurs?type=${typeProjet}`

  // ── Variante inline ──────────────────────────────────────────────────────
  if (variant === 'inline') {
    return (
      <div
        style={{
          display:        'flex',
          alignItems:     'center',
          gap:             16,
          padding:        '16px 24px',
          background:     'var(--color-bg-alt)',
          border:         '1px solid var(--color-border)',
          borderRadius:   'var(--radius-lg)',
          flexWrap:       'wrap',
        }}
      >
        <span style={{ fontSize: '1.6rem', flexShrink: 0 }}>{content.icon}</span>
        <div style={{ flex: 1, minWidth: 200 }}>
          <strong style={{ fontSize: '0.95rem', color: 'var(--color-text)' }}>
            {finalTitre}
          </strong>
        </div>
        <Link href={href} className="btn btn-primary btn-sm" style={{ flexShrink: 0 }}>
          {finalCta}
        </Link>
      </div>
    )
  }

  // ── Variante compact ─────────────────────────────────────────────────────
  if (variant === 'compact') {
    return (
      <div
        style={{
          display:      'flex',
          alignItems:   'flex-start',
          gap:           16,
          padding:      '20px 24px',
          background:   'var(--color-bg-alt)',
          border:       '1.5px solid var(--color-border)',
          borderRadius: 'var(--radius-lg)',
        }}
      >
        <span
          style={{
            fontSize:     '2rem',
            flexShrink:    0,
            lineHeight:    1,
            marginTop:     2,
          }}
        >
          {content.icon}
        </span>
        <div style={{ flex: 1 }}>
          <p
            style={{
              fontWeight:   700,
              fontSize:     '0.95rem',
              margin:       '0 0 6px',
              color:        'var(--color-text)',
            }}
          >
            {finalTitre}
          </p>
          <p
            style={{
              fontSize:     '0.85rem',
              color:        'var(--color-text-soft)',
              margin:       '0 0 14px',
              lineHeight:   1.5,
            }}
          >
            {finalDesc}
          </p>
          <Link href={href} className="btn btn-primary btn-sm">
            {finalCta}
          </Link>
        </div>
      </div>
    )
  }

  // ── Variante default (carte pleine) ──────────────────────────────────────
  return (
    <div
      style={{
        background:   'linear-gradient(135deg, var(--color-primary) 0%, #059669 100%)',
        borderRadius: 'var(--radius-lg)',
        padding:      '40px 36px',
        color:        '#fff',
        display:      'flex',
        alignItems:   'center',
        gap:           32,
        flexWrap:     'wrap',
      }}
    >
      {/* Icône */}
      <div
        style={{
          fontSize:     '3.5rem',
          flexShrink:    0,
          background:   'rgba(255,255,255,0.15)',
          borderRadius: '50%',
          width:         72,
          height:        72,
          display:      'flex',
          alignItems:   'center',
          justifyContent: 'center',
          lineHeight:    1,
        }}
      >
        {content.icon}
      </div>

      {/* Texte */}
      <div style={{ flex: 1, minWidth: 220 }}>
        <h3
          style={{
            fontSize:   '1.25rem',
            fontWeight:  800,
            margin:     '0 0 8px',
            color:      '#fff',
          }}
        >
          {finalTitre}
        </h3>
        <p
          style={{
            fontSize:   '0.95rem',
            color:      'rgba(255,255,255,0.88)',
            margin:      0,
            lineHeight:  1.6,
          }}
        >
          {finalDesc}
        </p>
        <div
          style={{
            display:    'flex',
            gap:         12,
            marginTop:   20,
            flexWrap:   'wrap',
            alignItems: 'center',
          }}
        >
          <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.75)' }}>
            ✅ Certifiés IRVE / RGE &nbsp;·&nbsp; ⚡ Réponse 24h &nbsp;·&nbsp; 💶 Devis gratuit
          </span>
        </div>
      </div>

      {/* CTA */}
      <div style={{ flexShrink: 0 }}>
        <Link
          href={href}
          style={{
            display:        'inline-block',
            padding:        '14px 28px',
            background:     '#fff',
            color:          'var(--color-primary)',
            borderRadius:   'var(--radius)',
            fontWeight:      700,
            fontSize:       '0.95rem',
            textDecoration: 'none',
            whiteSpace:     'nowrap',
            boxShadow:      '0 4px 16px rgba(0,0,0,0.15)',
            transition:     'transform 0.15s, box-shadow 0.15s',
          }}
          onMouseEnter={(e) => {
            const el = e.currentTarget as HTMLAnchorElement
            el.style.transform  = 'translateY(-2px)'
            el.style.boxShadow  = '0 6px 20px rgba(0,0,0,0.2)'
          }}
          onMouseLeave={(e) => {
            const el = e.currentTarget as HTMLAnchorElement
            el.style.transform  = ''
            el.style.boxShadow  = '0 4px 16px rgba(0,0,0,0.15)'
          }}
        >
          {finalCta}
        </Link>
      </div>
    </div>
  )
}
