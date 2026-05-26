import { getStaticMetadata } from '@/lib/seo-keywords'
import SimulateurContent from './SimulateurContent'

export const metadata = getStaticMetadata('/simulateur')

export default function SimulateurPage() {
  return <SimulateurContent />
}
