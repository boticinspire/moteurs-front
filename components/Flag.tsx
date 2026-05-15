/**
 * Flag — affiche le drapeau d'un pays via flagcdn.com
 * Compatible tous navigateurs, y compris Windows (pas d'emoji).
 * Codes supportés : fr, be, ch, ca (minuscules ISO 3166-1)
 */
export default function Flag({ code, size = 16 }: { code: string; size?: number }) {
  const iso = code.toLowerCase()
  const h = Math.round(size * 0.75)
  return (
    <img
      src={`https://flagcdn.com/${size}x${h}/${iso}.png`}
      srcSet={`https://flagcdn.com/${size * 2}x${h * 2}/${iso}.png 2x`}
      width={size}
      height={h}
      alt={iso.toUpperCase()}
      style={{ display: 'inline-block', verticalAlign: 'middle', borderRadius: 2 }}
    />
  )
}
