// Fichier créé par erreur sous [locale]/api (non supprimable via le mount FUSE).
// Neutralisé : ré-exporte le handler de la route canonique app/api/tarifs-recharge.
// `revalidate` doit être déclaré localement (Next interdit de le ré-exporter).
// À supprimer côté Windows quand possible.
export { GET } from '@/app/api/tarifs-recharge/route'
export const revalidate = 3600
