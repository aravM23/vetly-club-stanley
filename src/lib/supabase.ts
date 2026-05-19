import { createClient } from '@supabase/supabase-js'

// Allow the app to boot without Supabase env vars so the local Discovery demo
// (which talks to the FastAPI backend at /api) works out of the box. The
// Vetly auth/import/digest pages still require real Supabase credentials to
// function — they'll just show their normal "not signed in" UI without them.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'http://localhost:54321'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'public-anon-key-placeholder'

if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
  // eslint-disable-next-line no-console
  console.info(
    '[supabase] Running without env credentials. /discover works; /auth, /import, /digest, /settings need real keys.'
  )
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
})
