import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      // Règles générales
      {
        userAgent: '*',
        allow: ['/', '/articles', '/recharge-electrique', '/vacances-voiture', '/cout-voiture', '/depannage', '/documents-auto', '/outils'],
        disallow: [
          '/simulateur',
          '/espace-membres',
        