'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import {
  type UserContext,
  type VoitureCtx,
  type PreferencesCtx,
  type TrajetCtx,
  type SinistreCtx,
  expireContext,
  loadContextLocal,
  saveContextLocal,
  loadContextRemote,
  saveContextRemote,
  mergeContexts,
  isSinistreExpiringSoon,
  getSupabaseClient,
} from '@/lib/user-context'

// ─── Interface publique du contexte ──────────────────────────────────────────

export interface UserContextValue {
  context: UserContext
  isReady: boolean
  userId: string | null

  // Setters
  updateVoiture: (v: VoitureCtx | null) => void
  updatePreferences: (p: PreferencesCtx | null) => void
  setTrajet: (t: TrajetCtx | null) => void
  markSinistre: (s: SinistreCtx | null) => void

  // Resets
  resetTrajet: () => void
  resetSinistre: () => void
  resetAll: () => void

  // Helpers
  sinistreExpireSoon: boolean
}

const UserCtx = createContext<UserContextValue | null>(null)

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useUserContext(): UserContextValue {
  const ctx = useContext(UserCtx)
  if (!ctx) throw new Error('useUserContext must be used inside UserContextProvider')
  return ctx
}

// ─── Provider ────────────────────────────────────────────────────────────────

export default function UserContextProvider({ children }: { children: ReactNode }) {
  const [context, setContextState] = useState<UserContext>({})
  const [isReady, setIsReady] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)

  // Ref pour eviter les sauvegardes distantes en boucle
  const userIdRef = useRef<string | null>(null)

  // ── Persistance ───────────────────────────────────────────────────────────

  const persist = useCallback((ctx: UserContext, uid: string | null) => {
    const fresh = expireContext(ctx)
    saveContextLocal(fresh)
    if (uid) {
      saveContextRemote(uid, fresh).catch(() => {/* silently ignore */})
    }
    return fresh
  }, [])

  const setContext = useCallback(
    (updater: (prev: UserContext) => UserContext) => {
      setContextState(prev => {
        const next = updater(prev)
        const fresh = persist(next, userIdRef.current)
        return fresh
      })
    },
    [persist]
  )

  // ── Initialisation ────────────────────────────────────────────────────────

  useEffect(() => {
    let cancelled = false

    async function init() {
      // 1. Charge localStorage immédiatement
      const local = expireContext(loadContextLocal())

      if (!cancelled) setContextState(local)

      // 2. Vérifie session Supabase
      const supabase = getSupabaseClient()
      const { data: { session } } = await supabase.auth.getSession()

      if (cancelled) return

      if (session?.user) {
        const uid = session.user.id
        userIdRef.current = uid
        setUserId(uid)

        // 3. Charge contexte distant et fusionne
        const remote = await loadContextRemote(uid)
        if (cancelled) return

        const merged = expireContext(
          remote ? mergeContexts(local, remote) : local
        )
        saveContextLocal(merged)
        setContextState(merged)
      }

      if (!cancelled) setIsReady(true)
    }

    init()

    // 4. Écoute les changements d'auth
    const supabase = getSupabaseClient()
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (cancelled) return

        if (event === 'SIGNED_IN' && session?.user) {
          const uid = session.user.id
          userIdRef.current = uid
          setUserId(uid)

          // Sync local → remote au login
          const currentLocal = loadContextLocal()
          const remote = await loadContextRemote(uid)
          const merged = expireContext(
            remote ? mergeContexts(currentLocal, remote) : currentLocal
          )
          saveContextLocal(merged)
          await saveContextRemote(uid, merged)
          setContextState(merged)

        } else if (event === 'SIGNED_OUT') {
          userIdRef.current = null
          setUserId(null)
          // Revient au localStorage uniquement
          const local = expireContext(loadContextLocal())
          setContextState(local)
        }
      }
    )

    return () => {
      cancelled = true
      subscription.unsubscribe()
    }
  }, [persist])

  // ── Actions publiques ─────────────────────────────────────────────────────

  const updateVoiture = useCallback(
    (v: VoitureCtx | null) => setContext(prev => ({ ...prev, voiture: v })),
    [setContext]
  )

  const updatePreferences = useCallback(
    (p: PreferencesCtx | null) => setContext(prev => ({ ...prev, preferences: p })),
    [setContext]
  )

  const setTrajet = useCallback(
    (t: TrajetCtx | null) => setContext(prev => ({ ...prev, trajet: t })),
    [setContext]
  )

  const markSinistre = useCallback(
    (s: SinistreCtx | null) => setContext(prev => ({ ...prev, sinistre: s })),
    [setContext]
  )

  const resetTrajet = useCallback(
    () => setContext(prev => ({ ...prev, trajet: null })),
    [setContext]
  )

  const resetSinistre = useCallback(
    () => setContext(prev => ({ ...prev, sinistre: null })),
    [setContext]
  )

  const resetAll = useCallback(() => {
    setContext(() => ({}))
  }, [setContext])

  // ── Valeur exposée ────────────────────────────────────────────────────────

  const value: UserContextValue = {
    context,
    isReady,
    userId,
    updateVoiture,
    updatePreferences,
    setTrajet,
    markSinistre,
    resetTrajet,
    resetSinistre,
    resetAll,
    sinistreExpireSoon: isSinistreExpiringSoon(context),
  }

  return <UserCtx.Provider value={value}>{children}</UserCtx.Provider>
}
