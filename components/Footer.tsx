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
              Le media editorial de la transition energetique des transports routiers.
            </p>
          </div>
          <div>
            <h4>Espaces</h4>
            <ul>
              <li><Link href="/b2b">PME &amp; Artisans</Link></li>
              <li><Link href="/particulier">Particuliers</Link></li>
              <li><Link href="/articles">Decryptages</Link></li>
              <li><Link href="/assistance">Hub Assistance</Link></li>
              <li><Link href="/assistant-vacances">Assistant vacances</Link></li>
              <li><Link href="/comparer-trajet">Comparateur trajet</Link></li>
              <li><Link href="/recharge-electrique">Recharge electrique</Link></li>
              <li><Link href="/trajet">Trajets vacances</Link></li>
              <li><Link href="/vacances-voiture">Vacances en voiture</Link></li>
              <li><Link href="/outils">Tous les calculateurs</Link></li>
            </ul>
          </div>
          <div>
            <h4>Pays</h4>
            <ul>
              <li><Link href="/articles?pays=FR">France</Link></li>
              <li><Link href="/articles?pays=BE">Belgique</Link></li>
              <li><Link href="/articles?pays=CH">Suisse</Link></li>
              <li><Link href="/articles?pays=CA">Canada</Link></li>
              <li><Link href="/articles?pays=LU">Luxembourg</Link></li>
            </ul>
          </div>
          <div>
            <h4>Mentions</h4>
            <ul>
              <li><Link href="/mentions-legales">Mentions legales</Link></li>
              <li><Link href="/a-propos">A propos</Link></li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          <p>(c) 2026 Moteurs.com - Media independant de la transition energetique des transports routiers</p>
        </div>
      </div>
    </footer>
  )
}
