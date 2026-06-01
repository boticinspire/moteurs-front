import { getStaticMetadata } from '@/lib/seo-keywords'
import RechargeDomicileContent from './RechargeDomicileContent'

export const metadata = getStaticMetadata('/outils/recharge-domicile-voiture-societe-belgique')

export default function RechargeDomicilePage() {
  return <RechargeDomicileContent />
}
