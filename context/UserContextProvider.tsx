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
  userEmail: string | null

  // Setters
  updateVoiture: (v: VoitureCtx | null) => void
  updatePreferences: (p: PreferencesCtx | null) => void
  setTrajet: (t: TrajetCtx | null) => void
  markSinistre: (s: SinistreCtx | null) => void

  // Resets
  resetTrajet: () => void
  resetSinistre: () => void
  resetAll: () => void

  // Auth
  signOut: () => Promise<void>

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
  const [userEmail, setUserEmail] = useState<string | null>(null)

  const userIdRef = useRef<string | null>(null)
  // Garde la valeur locale pour la fusion (stable, ref)
  const localRef = useRef<UserContext>({})

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

  // ── Initialisation via onAuthStateChange uniquement ───────────────────────
  // onAuthStateChange déclenche INITIAL_SESSION immédiatement — pas besoin
  // d'un getSession() séparé qui créerait une contention sur le verrou auth.

  useEffect(() => {
    let cancelled = false

    // 1. Charge localStorage immédiatement (synchrone, pas de réseau)
    const local = expireContext(loadContextLocal())
    localRef.current = local
    setContextState(local)

    // 2. S'abonne aux événements auth — INITIAL_SESSION arrive en premier
    const supabase = getSupabaseClient()
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (cancelled) return

        if (event === 'INITIAL_SESSION' || event === 'SIGNED_IN') {
          if (session?.user) {
            const uid = session.user.id
            const email = session.user.email ?? null
            userIdRef.current = uid
            setUserId(uid)
            setUserEmail(email)

            // Fusion localStorage ↔ Supabase
            try {
              const remote = await loadContextRemote(uid)
              if (cancelled) return
              const merged = expireContext(
                remote ? mergeContexts(localRef.current, remote) : localRef.current
              )
              saveContextLocal(merged)
              localRef.current = merged
              setContextState(merged)
            } catch {
              // Réseau indisponible — on reste sur le localStorage
            }
          } else {
            // Pas de session → utilisateur non connecté
            userIdRef.current = null
            setUserId(null)
            setUserEmail(null)
          }
          if (!cancelled) setIsReady(true)

        } else if (event === 'SIGNED_OUT') {
          userIdRef.current = null
          setUserId(null)
          setUserEmail(null)
          const freshLocal = expireContext(loadContextLocal())
          localRef.current = freshLocal
          setContextState(freshLocal)
          if (!cancelled) setIsReady(true)
        }
      }
    )

    return () => {
      cancelled = true
      subscription.unsubscribe()
    }
  }, []) // [] — ne tourne qu'une fois au montage

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

  const signOut = useCallback(async () => {
    await getSupabaseClient().auth.signOut()
  }, [])

  const value: UserContextValue = {
    context,
    isReady,
    userId,
    userEmail,
    updateVoiture,
    updatePreferences,
    setTrajet,
    markSinistre,
    resetTrajet,
    resetSinistre,
    resetAll,
    signOut,
    sinistreExpireSoon: isSinistreExpiringSoon(context),
  }

  return <UserCtx.Provider value={value}>{children}</UserCtx.Provider>
}
