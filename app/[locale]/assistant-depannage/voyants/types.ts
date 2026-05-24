/**
 * Types partagés pour le module Catalogue des voyants.
 */

export type VoyantColor = 'red' | 'yellow' | 'green' | 'white' | 'blue'

export type VoyantUrgency = 'critical' | 'high' | 'medium' | 'low' | 'info'

export type VoyantCategory =
  | 'freinage'
  | 'moteur'
  | 'electrique'
  | 'securite'
  | 'carburant'
  | 'eclairage'
  | 'roues_chassis'
  | 'climatisation'
  | 'divers'

export interface VoyantObdCode {
  code: string
  description: string
}

export interface VoyantI18n {
  name: string
  signification: string
  action: string
  causes: string
  conseils: string
}

export interface Voyant {
  id: number
  icon: string
  color: VoyantColor
  urgency: VoyantUrgency
  category: VoyantCategory
  obd_codes: VoyantObdCode[]
  i18n: Partial<Record<string, VoyantI18n>>
}

export interface VoyantsMeta {
  version: number
  total: number
  categories: Record<string, Record<VoyantCategory, string>>
  colors: Record<string, Record<VoyantColor, string>>
  urgency: Record<string, Record<VoyantUrgency, string>>
  source: string
  icons_source: string
}

export interface VoyantsData {
  meta: VoyantsMeta
  voyants: Voyant[]
}

export interface VoyantIcon {
  name: string
  body: string
  viewBox: string
}

export type VoyantsIcons = Record<string, VoyantIcon>
