import { getStaticMetadata } from '@/lib/seo-keywords'
import ImmatriculationFranceContent from './ImmatriculationFranceContent'

export const metadata = getStaticMetadata('/outils/immatriculation-france')

export default function ImmatriculationFrancePage() {
  return <ImmatriculationFranceContent />
}
