// Middleware désactivé — @supabase/supabase-js stocke la session dans localStorage,
// pas dans les cookies. La protection de /admin est assurée côté client dans page.tsx
// (vérification session.user.email === ADMIN_EMAIL).
// Pour une protection serveur complète, migrer vers @supabase/ssr + cookie storage.

export const config = {
  matcher: [],
}
