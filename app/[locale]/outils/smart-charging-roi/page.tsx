import { getStaticMetadata } from '@/lib/seo-keywords'
import SmartChargingROIContent from './SmartChargingROIContent'

export const metadata = getStaticMetadata('/outils/smart-charging-roi')

export default function SmartChargingROIPage() {
  return <SmartChargingROIContent />
}
