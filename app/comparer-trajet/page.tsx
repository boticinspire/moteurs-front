import type { Metadata } from 'next'
import ComparateurTrajet from './ComparateurTrajet'
import FaqAccordion from '@/components/FaqAccordion'

const FAQ_TRAJET = [
  {
    question: "Comment le coût de recharge sur autoroute est-il calculé ?",
    answer:
      "Le comparateur utilise le tarif de recharge rapide (DC ≥ 50 kW) en station publique autoroute, soit environ 0,55–0,65 €/kWh en France en 2026. Ce tarif est nettement plus élevé que la recharge à domicile (~0,20 €/kWh). Si vous avez accès à un abonnement opérateur ou rechargez principalement chez vous avant de partir, le coût réel peut être inférieur. Modifiez le pays pour adapter les tarifs.",
  },
  {
    question: "Combien d'arrêts de recharge faut-il prévoir Paris–Marseille en électrique ?",
    answer:
      "Pour un trajet d'environ 780 km, avec une autonomie autoroute réaliste d'environ 270 km, il faut prévoir 2 à 3 arrêts de recharge selon le niveau de charge de départ. Le comparateur calcule automatiquement le nombre d'arrêts et ajoute le temps de recharge (~25 min par arrêt en recharge rapide) à la durée totale du trajet.",
  },
  {
    question: "Les péages sont-ils inclus dans le coût total ?",
    answer:
      "Oui, pour les 25 trajets pré-renseignés, les montants de péage sont intégrés au coût total (tarif standard 2026, sans abonnement télépéage). Les péages s'appliquent de la même façon à toutes les motorisations, donc ils influencent le classement uniquement si une motorisation bénéficie d'une exonération partielle ou totale (certains péages européens exonèrent les VE).",
  },
  {
    question: "Un PHEV (hybride rechargeable) est-il vraiment avantageux sur autoroute ?",
    answer:
      "Sur autoroute, les PHEV perdent leur avantage électrique rapidement : après 50 km environ, le moteur thermique prend le relais avec une consommation souvent supérieure à un diesel équivalent (5–7 L/100 km). L'avantage du PHEV est surtout visible sur des trajets mixtes (ville + route). Le comparateur le modélise honnêtement : les 50 premiers km en électrique, puis thermique.",
  },
  {
    question: "Puis-je saisir un trajet qui n'est pas dans la liste ?",
    answer:
      "Oui. En plus des 25 trajets populaires pré-renseignés, vous pouvez saisir librement une adresse de départ et d'arrivée. Le comparateur géocode les adresses, calcule la distance réelle via l'API OpenRouteService et estime les coûts. La distance est une estimation (itinéraire routier recommandé) et les péages sont calculés approximativement pour les trajets libres.",
  },
  {
    question: "Les prix de l'énergie sont-ils à jour ?",
    answer:
      "Les prix sont mis à jour régulièrement par l'Agent Simulateur de Moteurs.com à partir des sources officielles (DGEC France, Commission Européenne). Ils reflètent les moyennes nationales 2026 pour l'essence, le diesel, l'électricité (recharge rapide publique) et le GNV. Les prix réels peuvent varier selon les enseignes et les régions.",
  },
]

export const metadata: Metadata = {
  title: 'Comparateur coût trajet vacances — Diesel, Électrique, Hybride | Moteurs.com',
  description:
    'Calculez et comparez le coût réel de votre trajet vacances selon la motorisation : diesel, essence, électrique, hybride rechargeable. Péages, énergie, arrêts de recharge — tout inclus.',
  openGraph: {
    title: 'Combien coûte votre trajet vacances selon la motorisation ?',
    description: 'Comparateur gratuit : diesel vs électrique vs hybride pour vos trajets en voiture.',
  },
}

export default function PageComparateurTrajet() {
  return (
    <main className="container" style={{ paddingTop: 40, paddingBottom: 64 }}>
      {/* ── Hero ── */}
      <div style={{ textAlign: 'center', marginBottom: 40 }}>
        <div style={{ fontSize: '0.85rem', color: 'var(--color-primary)', fontWeight: 600, marginBottom: 10, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
          Outil gratuit · Mis à jour 2026
        </div>
        <h1 style={{ fontSize: 'clamp(1.6rem, 4vw, 2.4rem)', marginBottom: 14, lineHeight: 1.2 }}>
          Combien va coûter votre trajet<br />
          <span style={{ color: 'var(--color-primary)' }}>selon votre motorisation ?</span>
        </h1>
        <p style={{ maxWidth: 560, margin: '0 auto', color: 'var(--color-text-muted)', fontSize: '1rem', lineHeight: 1.6 }}>
          Carburant, péages, arrêts de recharge — comparez le vrai coût de vos vacances en diesel, essence, électrique ou hybride.
        </p>

        {/* Badges clés */}
        <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: 10, marginTop: 20 }}>
          {[
            '🗺️ 25 trajets populaires',
            '⚡ Arrêts de recharge calculés',
            '🛣️ Péages inclus',
            '✏️ Saisie libre',
          ].map(b => (
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

      {/* ── Comparateur ── */}
      <ComparateurTrajet />

      {/* ── Section pédagogique ── */}
      <section style={{ marginTop: 64, borderTop: '1px solid var(--color-border)', paddingTop: 40 }}>
        <h2 style={{ textAlign: 'center', marginBottom: 32, fontSize: '1.3rem' }}>
          Ce que ce comparateur prend en compte
        </h2>
        <div style={{ display: 'grid', gap: 20, gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
          {[
            {
              icon: '⛽',
              titre: 'Coût énergie réel',
              desc: 'Consommations autoroute (plus élevées qu\'en ville). Prix carburant et électricité actualisés 2026.',
            },
            {
              icon: '🛣️',
              titre: 'Péages précis',
              desc: 'Montants réels pour chaque trajet pré-renseigné. Tarifs standard 2026, hors abonnement télépéage.',
            },
            {
              icon: '⚡',
              titre: 'Arrêts de recharge VE',
              desc: 'Nombre d\'arrêts calculé selon l\'autonomie réelle autoroute (~270 km). Durée de recharge ajoutée au temps de trajet.',
            },
            {
              icon: '🔋',
              titre: 'PHEV bien calculé',
              desc: 'Les 50 premiers km en électrique, puis thermique. Pas de tromperie sur la consommation réelle.',
            },
          ].map(item => (
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

      {/* ── Trajets vacances décryptés (SEO landing pages) ── */}
      <section style={{ marginTop: 56, borderTop: '1px solid var(--color-border)', paddingTop: 32 }}>
        <h2 style={{ marginBottom: 8, fontSize: '1.2rem' }}>
          Grands trajets vacances décryptés
        </h2>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', marginBottom: 18, lineHeight: 1.5 }}>
          Coût par motorisation, vignettes, ZFE, recharge et checklist pour les itinéraires européens les plus populaires.
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {[
            { slug: 'belgique-cote-azur',    label: "🇧🇪 → 🇫🇷 Côte d'Azur" },
            { slug: 'belgique-toscane',      label: '🇧🇪 → 🇮🇹 Toscane' },
            { slug: 'pays-bas-lac-garde',    label: '🇳🇱 → 🇮🇹 Lac de Garde' },
            { slug: 'france-costa-brava',    label: '🇫🇷 → 🇪🇸 Costa Brava' },
            { slug: 'allemagne-algarve',     label: '🇩🇪 → 🇵🇹 Algarve' },
            { slug: 'pays-bas-dalmatie',     label: '🇳🇱 → 🇭🇷 Dalmatie' },
            { slug: 'danemark-norvege',      label: '🇩🇰 → 🇳🇴 Fjords' },
          ].map(t => (
            <a key={t.slug} href={`/trajet/${t.slug}`} style={{
              padding: '8px 14px', borderRadius: 20, fontSize: '0.85rem',
              background: 'rgba(122,240,194,0.06)', border: '1px solid rgba(122,240,194,0.2)',
              color: 'var(--color-primary)', textDecoration: 'none',
            }}>
              {t.label}
            </a>
          ))}
          <a href="/trajet" style={{
            padding: '8px 14px', borderRadius: 20, fontSize: '0.85rem',
            background: 'transparent', border: '1px solid var(--color-border)',
            color: 'var(--color-text)', textDecoration: 'none',
          }}>
            Voir les 15 trajets →
          </a>
        </div>
      </section>

      {/* ── CTA outils complémentaires ── */}
      <section style={{ marginTop: 48, textAlign: 'center' }}>
        <p style={{ color: 'var(--color-text-muted)', marginBottom: 16 }}>
          Vous envisagez de changer de véhicule ? Allez plus loin :
        </p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 12, flexWrap: 'wrap' }}>
          <a href="/comparer" className="btn btn-secondary">
            📊 Comparateur TCO complet
          </a>
          <a href="/simulateur" className="btn btn-secondary">
            🧮 Simulateur personnalisé
          </a>
        </div>
      </section>

      {/* ── FAQ ── */}
      <FaqAccordion items={FAQ_TRAJET} />
    </main>
  )
}
