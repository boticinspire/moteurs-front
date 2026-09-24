/**
 * Pré-rendu « allégé » pour l'hébergement Node.js (Behostings / VPS).
 *
 * En mode standalone (`NEXT_OUTPUT=standalone`), les routes à fort volume
 * (comparer-trajet/[slug], trajet/[slug]) ne sont PAS pré-rendues au build :
 * elles sont générées à la première visite puis mises en cache sur disque (ISR).
 * → paquet de déploiement ~3× plus léger, sans changement fonctionnel.
 *
 * Sur Vercel (variable absente), le comportement reste inchangé : tout est pré-rendu.
 */
export const LEAN_PRERENDER = process.env.NEXT_OUTPUT === 'standalone'
