import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer-grid">
          <div>
            <div className="logo" style={{ color: 'white', marginBottom: 12 }}>
              <span className="logo-dot" /><span>Moteurs<span style={{ color: '#7af0c2' }}>.com</span></span>
            </div>
            <p style={{ color: '#b8c5d6', fontSize: '0.88rem' }}>
              Le média éditorial de la transition énergétique des transports routiers.
            </p>
          </div>
          <div>
            <h4>Espaces</h4>
            <ul>
              <li><Link href="/b2b">PME &amp; Artisans</Link></li>
              <li><Link href="/particulier">Particuliers</Link></li>
              <li><Link href="/articles">Décryptages</Link></li>
              <li><Link href="/comparer-trajet">🏖️ Trajet vacances</Link></li>
              <li><Link href="/outils">⚡ Tous les calculateurs</Link></li>
            </ul>
          </div>
          <div>
            <h4>Pays</h4>
            <ul>
              <li><Link href="/articles?pays=FR">🇫🇷 France</Link></li>
              <li><Link href="/articles?pays=BE">🇧🇪 Belgique</Link></li>
              <li><Link href="/articles?pays=CH">🇨🇭 Suisse</Link></li>
              <li><Link href="/articles?pays=CA">🇨🇦 Canada</Link></li>
              <li><Link href="/articles?pays=LU">🇱🇺 Luxembourg</Link></li>
            </ul>
          </div>
          <div>
            <h4>Mentions</h4>
            <ul>
              <li><Link href="/mentions-legales">Mentions légales</Link></li>
              <li><Link href="/a-propos">À propos</Link></li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© 2026 Moteurs.com</span>
          <span>Système éditorial v7.0 — Next.js</span>
        </div>
      </div>
    </footer>
  )
}
