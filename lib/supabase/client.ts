import { createBrowserClient } from '@supabase/ssr'

/**
 * Browser client: persists session in cookies so Next.js middleware can read the same session.
 * (Plain createClient uses localStorage by default — middleware would not see the user → login loop.)
 */
export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)