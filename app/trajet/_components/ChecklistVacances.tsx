/**
 * Checklist départ vacances par catégorie pour les pages /trajet/[slug].
 * Server component — contenu statique, généré côté serveur, indexable.
 * L'utilisateur peut cocher (état local non persistant — server-side).
 */

import type { PaysCode } from '@/lib/trajets-seo'
import { PAYS_LEGAL } from '@/lib/legal-pays'

interface Props {
  paysTraverses: PaysCode[]
  /** Indique si la variante VE est active (ajoute la section recharge). */
  electrique?: boolean
  /** Variante famille → ajoute la section enfants. */
  famille?: boolean
  /** Variante camping-car → ajoute hauteurs / aires. */
  campingCar?: boolean
}

interface Categorie {
  titre: string
  icone: string
  items: string[]
}

export default function ChecklistVacances({ paysTraverses, electrique, famille, campingCar }: Props) {
  // Vignettes à acheter
  const vignettes = paysTraverses
    .map(c => PAYS_LEGAL[c])
    .filter(p => p.vignette.required)
    .map(p => `Vignette ${p.nom} (${p.vignette.prix_courte ?? p.vignette.prix_annuelle} €)`)

  // Équipements consolidés (sans doublons triviaux)
  const equipementsCommuns = [
    'Gilet fluorescent (au moins 1)',
    'Triangle de signalisation',
    'Trousse de premiers secours',
    'Ampoules de rechange (recommandé)',
    'Constat amiable européen',
  ]

  const categories: Categorie[] = [
    {
      titre: 'Documents',
      icone: '📄',
      items: [
        'Permis de conduire (et permis international si hors UE)',
        'Carte grise / certificat d\'immatriculation',
        'Attestation d\'assurance + carte verte',
        'Carte d\'identité ou passeport pour chaque occupant',
        'Carte européenne d\'assurance maladie',
        'Numéro d\'assistance véhicule + coordonnées assurance',
      ],
    },
    {
      titre: 'Vignettes & péages',
      icone: '🎫',
      items: vignettes.length > 0
        ? [...vignettes, 'Badge télépéage (si traversée FR/IT/ES/PT)']
        : ['Badge télépéage (si traversée FR/IT/ES/PT)', 'Cash + carte bancaire pour péages ponctuels'],
    },
    {
      titre: 'Équipement véhicule',
      icone: '🧰',
      items: equipementsCommuns,
    },
  ]

  if (electrique) {
    categories.push({
      titre: 'Recharge VE',
      icone: '⚡',
      items: [
        'Câble Mode 3 (Type 2) à bord',
        'Carte ou app de recharge multi-opérateurs (Chargemap, Plugsurfing, Shell Recharge…)',
        'Application planificateur (ABRP, Plugshare) avec batterie de départ renseignée',
        'Repérer 2-3 stations de secours par étape (si station principale en panne)',
        'Charger à 100 % la veille du départ',
      ],
    })
  }

  if (famille) {
    categories.push({
      titre: 'Enfants',
      icone: '👨‍👩‍👧',
      items: [
        'Sièges auto homologués (groupe adapté à l\'âge)',
        'Trousse de toilette + lingettes + sacs poubelle',
        'Tablettes / écrans + câbles + casques audio',
        'Snacks, eau, bouteilles vides pour pause pipi',
        'Jouet doudou pour chaque enfant',
        'Médicaments (mal des transports, paracétamol)',
        'Pause toutes les 2 h ou 200 km',
      ],
    })
  }

  if (campingCar) {
    categories.push({
      titre: 'Camping-car spécifique',
      icone: '🚐',
      items: [
        'Carte des aires de stationnement (Park4Night, CamperContact)',
        'Vérifier la hauteur (3,10 m typique) pour parkings et tunnels',
        'Niveau eau propre + cassette WC vidée',
        'Tension pneus (charge pleine)',
        'Vignettes spécifiques : certains pays surtaxent les +3,5 t',
      ],
    })
  }

  categories.push({
    titre: 'Avant de partir',
    icone: '🔧',
    items: [
      'Niveaux : huile, liquide de refroidissement, lave-glace',
      'Pression des pneus (avec charge maximale)',
      'Essuie-glaces fonctionnels',
      'Feux et clignotants (faire vérifier)',
      'Pleins (carburant ou batterie) à 100 %',
      'Photos du véhicule (état avant départ — utile en cas de litige)',
    ],
  })

  return (
    <section style={{ marginTop: 48, marginBottom: 36 }}>
      <h2 style={{ fontSize: '1.2rem', marginBottom: 8 }}>
        Checklist avant de partir
      </h2>
      <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', marginBottom: 22, lineHeight: 1.5 }}>
        Tout ce qu\'il faut prévoir avant de prendre la route, adapté à ce trajet.
      </p>

      <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))' }}>
        {categories.map(cat => (
          <article key={cat.titre} style={{
            background: 'var(--color-bg-card)',
            border: '1px solid var(--color-border)',
            borderRadius: 12,
            padding: 16,
          }}>
            <h3 style={{ fontSize: '0.95rem', margin: 0, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: '1.1rem' }}>{cat.icone}</span> {cat.titre}
            </h3>
            <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
              {cat.items.map((item, i) => (
                <li key={i} style={{
                  display: 'flex', gap: 8, padding: '6px 0',
                  fontSize: '0.85rem', lineHeight: 1.45,
                  borderTop: i > 0 ? '1px solid var(--color-border)' : 'none',
                }}>
                  <span style={{ color: 'var(--color-primary)', flexShrink: 0 }}>▢</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>

      <p style={{ marginTop: 18, fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
        💡 Voir aussi notre <a href="/checklist-depart" style={{ color: 'var(--color-primary)' }}>checklist complète</a> et notre <a href="/constat" style={{ color: 'var(--color-primary)' }}>constat amiable européen prêt à imprimer</a>.
      </p>
    </section>
  )
}
