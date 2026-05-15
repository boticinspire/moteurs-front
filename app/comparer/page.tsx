import type { Metadata } from 'next'
import ComparateurTCO from './ComparateurTCO'

export const metadata: Metadata = {
  title: 'Comparateur TCO',
  description: 'Comparez le coût total de possession (TCO) de toutes les motorisations sur votre segment : diesel, électrique, hydrogène, GNV, PHEV, e-fuel. Aides, énergie et entretien inclus.',
}

export default function ComparerPage() {
  return (
    <>
      <section className="page-hero">
        <div className="container">
          <h1>Comparateur TCO</h1>
          <p>
            Toutes les motorisations côte à côte — achat net, énergie, entretien, aides comprises.
            Ajustez vos paramètres et le tableau se recalcule instantanément.
          </p>
        </div>
      </section>

      <section style={{ padding: '32px 0 80px' }}>
        <div className="container">
          <ComparateurTCO />
        </div>
      </section>
    </>
  )
}
