import { getStaticMetadata } from '@/lib/seo-keywords'
import ImmatriculationBelgiqueContent from './ImmatriculationBelgiqueContent'

export const metadata = getStaticMetadata('/outils/immatriculation-belgique')

export default function ImmatriculationBelgiquePage() {
  return <ImmatriculationBelgiqueContent />
}
