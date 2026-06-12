import type { Metadata } from 'next'
import VoyantsCatalogue from './VoyantsCatalogue'
import voyantsData from './voyants-data.json'
import voyantsIcons from './voyants-icons.json'
import type { VoyantsData, VoyantsIcons } from './types'

const META: Record<string, { title: string; description: string }> = {
  fr: {
    title: 'Identifier un voyant du tableau de bord — Assistant Dépannage — Moteurs.com',
    description: '75 témoins lumineux décryptés : signification, niveau d\'urgence, action recommandée et codes OBD-II associés. Identifier votre voyant en un clic.',
  },
  it: {
    title: 'Identifica una spia sul cruscotto — Assistente Guasti — Moteurs.com',
    description: '75 spie del cruscotto: significato, urgenza, azione consigliata e codici OBD-II. Identifica la tua spia con un clic.',
  },
  en: {
    title: 'Identify a dashboard warning light — Diagnostic Assistant — Moteurs.com',
    description: '75 dashboard warning lights explained: meaning, urgency, recommended action and related OBD-II codes. Identify your light in one click.',
  },
  nl: {
    title: 'Dashboardlampje identificeren — Pechhulp Assistent — Moteurs.com',
    description: '75 dashboardlampjes uitgelegd: betekenis, urgentie, aanbevolen actie en OBD-II-codes. Identificeer uw lampje met één klik.',
  },
  de: {
    title: 'Armaturenbrett-Warnleuchte erkennen — Pannenhilfe-Assistent — Moteurs.com',
    description: '75 Armaturenbrettleuchten erklärt: Bedeutung, Dringlichkeit, empfohlene Aktion und OBD-II-Codes. Identifizieren Sie Ihre Leuchte mit einem Klick.',
  },
  es: {
    title: 'Identifica un testigo del cuadro de mandos — Asistente de Averías — Moteurs.com',
    description: '75 testigos luminosos del cuadro: significado, urgencia, acción recomendada y códigos OBD-II. Identifica tu testigo con un clic.',
  },
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const m = META[locale] ?? META.fr
  return {
    title: m.title,
    description: m.description,
    alternates: { canonical: 'https://moteurs.com/assistant-depannage/voyants' },
  }
}

export default async function PageVoyants({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  return (
    <main style={{ padding: '40px 20px 80px' }}>
      <VoyantsCatalogue
        locale={locale}
        data={voyantsData as VoyantsData}
        icons={voyantsIcons as VoyantsIcons}
      />
    </main>
  )
}
