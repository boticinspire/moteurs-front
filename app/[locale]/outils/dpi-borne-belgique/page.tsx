import { getStaticMetadata } from '@/lib/seo-keywords'
import DPIBorneContent from './DPIBorneContent'

export const metadata = getStaticMetadata('/outils/dpi-borne-belgique')

export default function DPIBornePage() {
  return <DPIBorneContent />
}
