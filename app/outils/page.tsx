import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Calculateurs & Outils gratuits — Moteurs.com',
  description: 'Tous les outils pour maîtriser le coût de votre voiture : comparateur trajet vacances, simulateur TCO, carte grise, immatriculation, convertisseur technique.',
}

const OUTILS_PHARES = [
  {
    href: '/assistant-vacances',
    icon: '🏖️',
    titre: 'Assistant Vacances Auto',
    desc: 'Budget total voyage, itinéraire économique, stratégie recharge VE, alertes trafic, bagages — votre copilote économique complet en 3 étapes.',
    tags: ['Budget hébergement', 'Trafic', 'Recharge VE', 'Bagages'],
    cta: 'Planifier mon voyage',
    badge: 'Nouveau',
  },
  {
    href: '/assistance/couts',
    icon: '💰',
    titre: 'Assistance Coûts',
    desc: 'Votre voiture vous coûte combien par mois vraiment ? Financement, carburant, assurance, entretien, dépréciation — plus le comparatif VE.',
    tags: ['Coût mensuel réel', '€/km', 'Comparatif VE', 'Aides'],
    cta: 'Calculer mon coût réel',
    badge: null,
  },
  {
    href: '/comparer-trajet',
    icon: '📊',
    titre: 'Comparateur trajet vacances',
    desc: 'Comparez diesel, essence, électrique et hybride sur 25 trajets populaires — péages, énergie et location de véhicule inclus.',
    tags: ['25 trajets', 'Péages', 'Location'],
    cta: 'Comparer les motorisations',
    badge: null,
  },
  {
    href: '/simulateur',
    icon: '🧮',
    titre: 'Simulateur TCO complet',
    desc: 'Calculez le coût total de possession sur mesure : km/an, durée, profil de conduite, hiver, charge utile — toutes motorisations.',
    tags: ['Voiture', 'VUL', 'Camion', 'VAE'],
    cta: 'Lancer le simulateur',
    badge: null,
  },
  {
    href: '/comparer',
    icon: '📊',
    titre: 'Comparateur TCO motorisations',
    desc: 'Visualisez côte à côte le TCO sur 3 à 5 ans : diesel, essence, électrique, hydrogène, GNV. Badge gagnant automatique.',
    tags: ['FR', 'BE', 'CH', 'CA'],
    cta: 'Comparer les motorisations',
    badge: null,
  },
]

const OUTILS_COMPLEMENTAIRES = [
  {
    href: '/tco',
    icon: '📈',
    titre: 'Comparatifs TCO par profil',
    desc: 'TCO pré-calculés par segment et pays — artisan, flotte, particulier. Référence rapide sans paramétrage.',
    tags: ['B2B', 'Particuliers', 'Multi-pays'],
    cta: 'Voir les comparatifs',
  },
  {
    href: '/assistance/panne',
    icon: '🚨',
    titre: 'Assistance Panne',
    desc: 'Protocole urgence personnalisé : panne sèche, crevaison, accident, surchauffe. Spécificités VE + contacts par pays.',
    tags: ['Urgence', 'VE', 'Contacts'],
    cta: 'Guide urgence',
  },
  {
    href: '/assistance/achat',
    icon: '🚗',
    titre: 'Assistance Achat',
    desc: 'Quelle motorisation selon votre budget, usage et km ? Recommandation personnalisée + modèles + aides.',
    tags: ['VE', 'Hybride', 'Aides'],
    cta: 'Trouver mon véhicule',
  },
  {
    href: '/assistance/recharge',
    icon: '⚡',
    titre: 'Assistance Recharge VE',
    desc: 'Coût annuel recharge (domicile vs public), borne à installer, autonomie réelle été/hiver, réseaux par pays.',
    tags: ['Borne', 'Autonomie', 'Aides'],
    cta: 'Calculer',
  },
  {
    href: '/outils/immatriculation-france',
    icon: '🇫🇷',
    titre: 'Carte grise — France',
    desc: 'Estimez vos frais d\'immatriculation : taxe régionale, malus CO₂ 2026, exonération VE.',
    tags: ['13 régions', 'Malus CO₂', 'VE exonérés'],
    cta: 'Calculer',
  },
  {
    href: '/outils/immatriculation-belgique',
    icon: '🇧🇪',
    titre: 'Frais d\'immatriculation — Belgique',
    desc: 'Calculez la TMC selon votre région : Wallonie, Bruxelles ou Flandre.',
    tags: ['Wallonie', 'Bruxelles', 'Flandre'],
    cta: 'Calculer',
  },
  {
    href: '/outils/convertisseur',
    icon: '⚡',
    titre: 'Convertisseur technique',
    desc: 'kW ↔ ch, Nm ↔ lb-ft, autonomie batterie selon poids et consommation.',
    tags: ['Technique', 'Ingénieurs'],
    cta: 'Convertir',
  },
]

export default function OutilsPage() {
  return (
    <>
      {/* ── Hero ── */}
      <section className="page-hero">
        <div className="container">
          <div style={{ fontSize: '0.82rem', color: 'var(--color-primary)', fontWeight: 600, marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Tous gratuits · Mis à jour 2026
          </div>
          <h1>Calculateurs & Outils</h1>
          <p style={{ maxWidth: 540, margin: '0 auto' }}>
            Des outils concrets pour savoir exactement ce que vous coûte votre voiture —
            et combien vous pouvez économiser en changeant de motorisation.
          </p>
        </div>
      </section>

      {/* ── Outils phares ── */}
      <section style={{ padding: '48px 0 0' }}>
        <div className="container">
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 20, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Les essentiels
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
                    {o.tags.map((t) => (
                      <span key={t} style={{
                        fontSize: '0.72rem', fontWeight: 600, padding: '3px 8px',
                        background: 'rgba(122,240,194,0.12)', color: 'var(--color-primary)',
                        border: '1px solid rgba(122,240,194,0.25)',
                        borderRadius: 4,
                      }}>{t}</span>
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
            Outils complémentaires
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
                    {o.tags.map((t) => (
                      <span key={t} style={{
                        fontSize: '0.7rem', fontWeight: 600, padding: '2px 7px',
                        background: 'rgba(255,255,255,0.05)', color: 'var(--color-text-muted)',
                        border: '1px solid var(--color-border)', borderRadius: 4,
                      }}>{t}</span>
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
