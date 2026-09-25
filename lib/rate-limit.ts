/**
 * Limiteur de débit en mémoire (par process Node) — suffisant pour un seul serveur
 * Passenger. Empêche l'usage des formulaires comme relais de spam.
 */
const hits = new Map<string, number[]>()

/** true si la requête est autorisée (max `limit` appels par `windowMs` pour `key`). */
export function allow(key: string, limit = 5, windowMs = 60 * 60 * 1000): boolean {
  const now = Date.now()
  const arr = (hits.get(key) ?? []).filter((t) => now - t < windowMs)
  if (arr.length >= limit) {
    hits.set(key, arr)
    return false
  }
  arr.push(now)
  hits.set(key, arr)
  if (hits.size > 5000) {
    for (const [k, v] of hits) if (!v.some((t) => now - t < windowMs)) hits.delete(k)
  }
  return true
}

export function clientIp(headers: Headers): string {
  return (
    headers.get('cf-connecting-ip') ||
    headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    headers.get('x-real-ip') ||
    'unknown'
  )
}
