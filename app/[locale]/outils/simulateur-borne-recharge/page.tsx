import { getStaticMetadata } from '@/lib/seo-keywords'
import SimulateurBorneContent from './SimulateurBorneContent'

export const metadata = getStaticMetadata('/outils/simulateur-borne-recharge')

export default function SimulateurBornePage() {
  return <SimulateurBorneContent />
}
