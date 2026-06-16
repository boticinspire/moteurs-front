import createNextIntlPlugin from 'next-intl/plugin'

const withNextIntl = createNextIntlPlugin('./i18n/request.ts')

/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'www.moteurs.com' }],
        destination: 'https://moteurs.com/:path*',
        permanent: true,
      },
      // ── Refonte outils (Phase 2) : consolidation + 301 ──────────────────
      // /simulateur (legacy) → /comparer
      { source: '/simulateur', destination: '/comparer', permanent: true },
      { source: '/:locale(en|nl|de|es|it)/simulateur', destination: '/:locale/comparer', permanent: true },
      // /assistance/couts → onglet "Le coût de mon véhicule"
      { source: '/assistance/couts', destination: '/comparer?mode=mensuel', permanent: true },
      { source: '/:locale(en|nl|de|es|it)/assistance/couts', destination: '/:locale/comparer?mode=mensuel', permanent: true },
      // /outils/tco-particulier → onglet "Rentabilité VE vs thermique"
      { source: '/outils/tco-particulier', destination: '/comparer?mode=rentabilite', permanent: true },
      { source: '/:locale(en|nl|de|es|it)/outils/tco-particulier', destination: '/:locale/comparer?mode=rentabilite', permanent: true },
      // /outils/comparer-modeles → catalogue (specs structurées Open EV Data)
      { source: '/outils/comparer-modeles', destination: '/outils/catalogue-electriques', permanent: true },
      { source: '/:locale(en|nl|de|es|it)/outils/comparer-modeles', destination: '/:locale/outils/catalogue-electriques', permanent: true },
    ]
  },
  async headers() {
    return [
      {
        // Pages embed : autorise l'iframing depuis n'importe quel domaine
        source: '/embed/:path*',
        headers: [
          { key: 'Content-Security-Policy', value: 'frame-ancestors *' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'no-referrer-when-downgrade' },
        ],
      },
      {
        // Loader script : cache court + CORS ouvert
        source: '/embed/loader.js',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=300, s-maxage=3600' },
          { key: 'Access-Control-Allow-Origin', value: '*' },
        ],
      },
    ]
  },
}

export default withNextIntl(nextConfig)
