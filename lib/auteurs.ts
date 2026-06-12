/**
 * lib/auteurs.ts — Registre des auteurs / signatures éditoriales.
 *
 * OBJECTIF SEO (E-E-A-T) : Google valorise les contenus signés par des PERSONNES
 * identifiables (expertise, expérience, autorité, confiance). Aujourd'hui les
 * articles sont signés « La Rédaction » (entité éditoriale). Pour le plein bénéfice,
 * ajouter ici de VRAIS journalistes (type: 'Person') avec bio, photo et profils publics.
 *
 * ⚠️ Ne JAMAIS inventer de fausses personnes : c'est contre-productif (et risqué).
 * Tant qu'aucun journaliste réel n'est déclaré, on reste sur l'entité « La Rédaction »
 * (type: 'Organization'), ce qui est honnête.
 *
 * Pour ajouter un auteur réel, dupliquer le bloc TEMPLATE ci-dessous et le décommenter.
 */

export type AuteurType = 'Person' | 'Organization'

export interface Auteur {
  slug: string
  nom: string
  role: string
  type: AuteurType
  bio: string
  /** Chemin d'une photo dans /public (ex: '/auteurs/jean-dupont.jpg'). Optionnel. */
  photo?: string
  /** Profils publics officiels (LinkedIn, X, site perso…) pour le champ sameAs. */
  sameAs?: string[]
  /** Domaines d'expertise (alimente knowsAbout du JSON-LD). */
  expertise: string[]
}

export const AUTEURS: Auteur[] = [
  {
    slug: 'la-redaction',
    nom: 'La Rédaction Moteurs.com',
    role: 'Équipe éditoriale',
    type: 'Organization',
    bio:
      "La Rédaction de Moteurs.com décrypte la transition énergétique des transports routiers pour " +
      "les particuliers, les artisans et les flottes. Chaque information publiée est triangulée à " +
      "partir d'au moins deux sources indépendantes, avec un niveau de confiance affiché et des " +
      "sources officielles citées (DGEC, Commission européenne, ADEME, SPF Finances, OFEN…).",
    expertise: [
      "Coût total de possession (TCO) automobile",
      "Aides à l'achat de véhicules électriques",
      "Zones à faibles émissions (ZFE) et Crit'Air",
      "Recharge électrique et cartes de recharge",
      "Fiscalité des véhicules en France, Belgique, Suisse et Canada",
    ],
  },

  // ── TEMPLATE auteur réel (à remplir puis décommenter) ───────────────────────
  // {
  //   slug: 'prenom-nom',
  //   nom: 'Prénom Nom',
  //   role: 'Journaliste mobilité / Rédacteur en chef',
  //   type: 'Person',
  //   bio: 'Bio factuelle : parcours, années d’expérience, sujets de prédilection.',
  //   photo: '/auteurs/prenom-nom.jpg',
  //   sameAs: ['https://www.linkedin.com/in/...', 'https://x.com/...'],
  //   expertise: ['Voiture électrique', 'Fiscalité auto', 'ZFE'],
  // },
]

export function getAuteur(slug: string): Auteur | undefined {
  return AUTEURS.find((a) => a.slug === slug)
}

export function getAuteurSlugs(): string[] {
  return AUTEURS.map((a) => a.slug)
}
