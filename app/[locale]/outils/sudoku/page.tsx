import { setRequestLocale } from 'next-intl/server'
import { redirect } from '@/i18n/navigation'
import { routing } from '@/i18n/routing'

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }))
}

// Le Sudoku a été déplacé dans la section « Jeux gratuits ».
// On conserve l'ancienne URL avec une redirection locale-aware vers /jeux/sudoku.
export default async function SudokuRedirect({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)
  redirect({ href: '/jeux/sudoku', locale })
}
