/**
 * Flag — affiche le drapeau d'un pays via SVG local (public/flags/)
 * Compatible tous navigateurs et réseaux filtrés (Norton, proxies…).
 * Codes pays   : fr, be, ch, ca, lu (ISO 3166-1)
 * Codes langue : fr, gb (EN), nl, de, es, it — pour le drapeau par langue d'article
 * (minuscules ; un fichier public/flags/<code>.svg doit exister)
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
