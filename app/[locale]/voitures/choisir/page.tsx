import type { Metadata } from 'next'
import { Link } from '@/i18n/navigation'
import RecommandeurVE from './RecommandeurVE'

export const metadata: Metadata = {
  title: { absolute: 'Quelle voiture électrique choisir ? Le guide selon vos besoins | Moteurs.com' },
  description:
    'Trouvez la voiture électrique faite pour vous : indiquez autonomie, places et usage, on vous recommande les meilleurs modèles du catalogue.',
  alternates: { canonical: 'https://moteurs.com/voitures/choisir' },
}

export default function ChoisirPage() {
  return (
    <main style={{ maxWidth: 820, margin: '0 auto', padding: '28px 20px 64px' }}>
      <nav style={{ fontSize: 13, color: 'var(--color-text-muted)', marginBottom: 12 }}>
        <Link href="/voitures" style={{ color: 'var(--color-text-muted)' }}>← Catalogue des voitures électriques</Link>
      </nav>
      <h1 style={{ fontSize: '1.8rem', lineHeight: 1.2, marginBottom: 8 }}>
        Quelle voiture électrique choisir ?
      </h1>
      <p style={{ color: 'var(--color-text-muted)', maxWidth: 700, marginBottom: 24 }}>
        Réglez vos besoins — autonomie, places, usage — et obtenez instantanément les modèles les
        plus adaptés, classés par pertinence à partir des données techniques réelles.
      </p>
      <RecommandeurVE />
    </main>
  )
}
