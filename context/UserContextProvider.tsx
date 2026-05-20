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
  type ConducteurCtx,
  type AssuranceCtx,
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

// Interface publique du contexte

export interface UserContextValue {
  context: UserContext
  isReady: boolean
  userId: string | null
  userEmail: string | null

  updateVoiture: (v: VoitureCtx | null) => void
  updateConducteur: (c: ConducteurCtx | null) => void
  updateAssurance: (a: AssuranceCtx | null) => void
  updatePreferences: (p: PreferencesCtx | null) => void
  setTrajet: (t: TrajetCtx | null) => void
  markSinistre: (s: SinistreCtx | null) => void

  resetTrajet: () => void
  resetSinistre: () => void
  resetAll: () => void

  signOut: () => Promise<void>

  sinistreExpireSoon: boolean
}

const UserCtx = createContext<UserContextValue | null>(null)

export function useUserContext(): UserContextValue {
  const ctx = useContext(UserCtx)
  if (!ctx) throw new Error('useUserContext must be used inside UserContextProvider')
  return ctx
}

export default function UserContextProvider({ children }: { children: ReactNode }) {
  const [context, setContextState] = useState<UserContext>({})
  const [isReady, setIsReady] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [userEmail, setUserEmail] = useState<string | null>(null)

  const userIdRef = useRef<string | null>(null)
  const localRef = useRef<UserContext>({})

  const persist = useCallback((ctx: UserContext, uid: string | null) => {
    const fresh = expireContext(ctx)
    saveContextLocal(fresh)
    if (uid) {
      saveContextRemote(uid, fresh).catch(() => {})
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

  const hydrateFromSession = useCallback(
    async (
      session: { user?: { id: string; email?: string | null } } | null,
      cancelled: { v: boolean }
    ) => {
      if (session?.user) {
        const uid = session.user.id
        const email = session.user.email ?? null
        userIdRef.current = uid
        setUserId(uid)
        setUserEmail(email)

        try {
          const remote = await loadContextRemote(uid)
          if (cancelled.v) return
          const merged = expireContext(
            remote ? mergeContexts(localRef.current, remote) : localRef.current
          )
          saveContextLocal(merged)
          localRef.current = merged
          setContextState(merged)
        } catch {
          // reseau indisponible
        }
      } else {
        userIdRef.current = null
        setUserId(null)
        setUserEmail(null)
      }
    },
    []
  )

  // Initialisation : isReady=true immediat + bootstrap auth en background
  // 1) isReady=true tout de suite -> la page affiche login form ou dashboard
  // 2) En background : exchange PKCE manuel si ?code= dans l'URL, puis getSession()
  // 3) onAuthStateChange gere les evenements FUTURS (SIGNED_IN/OUT/REFRESH)

  useEffect(() => {
    const flag = { v: false }

    const local = expireContext(loadContextLocal())
    localRef.current = local
    setContextState(local)

    const supabase = getSupabaseClient()

    // isReady=true MAINTENANT - la page ne reste jamais bloquee
    setIsReady(true)

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (flag.v) return
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
          await hydrateFromSession(session, flag)
        } else if (event === 'SIGNED_OUT') {
          await hydrateFromSession(null, flag)
          const freshLocal = expireContext(loadContextLocal())
          localRef.current = freshLocal
          setContextState(freshLocal)
        }
      }
    )

    ;(async () => {
      try {
        if (typeof window !== 'undefined') {
          const params = new URLSearchParams(window.location.search)
          const code = params.get('code')
          if (code) {
            try {
              await supabase.auth.exchangeCodeForSession(code)
            } catch (e) {
              console.warn('[auth] exchangeCodeForSession failed:', e)
            }
            params.delete('code')
            const newSearch = params.toString()
            const newUrl =
              window.location.pathname +
              (newSearch ? '?' + newSearch : '') +
              window.location.hash
            window.history.replaceState({}, '', newUrl)
          }
        }

        const { data: { session } } = await supabase.auth.getSession()
        if (flag.v) return
        await hydrateFromSession(session, flag)
      } catch (e) {
        console.warn('[auth] bootstrap failed:', e)
      }
    })()

    return () => {
      flag.v = true
      subscription.unsubscribe()
    }
  }, [hydrateFromSession])

  const updateVoiture = useCallback(
    (v: VoitureCtx | null) => setContext(prev => ({ ...prev, voiture: v })),
    [setContext]
  )

  const updateConducteur = useCallback(
    (c: ConducteurCtx | null) => setContext(prev => ({ ...prev, conducteur: c })),
    [setContext]
  )

  const updateAssurance = useCallback(
    (a: AssuranceCtx | null) => setContext(prev => ({ ...prev, assurance: a })),
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

  const signOut = useCallback(async () => {
    await getSupabaseClient().auth.signOut()
  }, [])

  const value: UserContextValue = {
    context,
    isReady,
    userId,
    userEmail,
    updateVoiture,
    updateConducteur,
    updateAssurance,
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
