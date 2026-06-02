import { getStaticMetadata } from '@/lib/seo-keywords'
import TCOPoidslourdsContent from './TCOPoidslourdsContent'

export const metadata = getStaticMetadata('/outils/tco-poids-lourds')

export default function TCOPoidslourdsPage() {
  return <TCOPoidslourdsContent />
}
