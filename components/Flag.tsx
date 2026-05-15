/**
 * Flag — affiche le drapeau d'un pays via SVG local (public/flags/)
 * Compatible tous navigateurs et réseaux filtrés (Norton, proxies…).
 * Codes supportés : fr, be, ch, ca (minuscules ISO 3166-1)
 */
export default function Flag({ code, size = 16 }: { code: string; size?: number }) {
  const iso = code.toLowerCase()
  const h = Math.round(size * 0.667)
  return (
    <img
      src={`/flags/${iso}.svg`}
      width={size}
      height={h}
      alt={iso.toUpperCase()}
      style={{ display: 'inline-block', verticalAlign: 'middle', borderRadius: 2 }}
    />
  )
}
