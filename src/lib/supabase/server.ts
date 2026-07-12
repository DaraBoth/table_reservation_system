import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { cache } from 'react'
import type { Database } from '@/lib/types/database'
import type { User } from '@supabase/supabase-js'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Called from a Server Component — safe to ignore
          }
        },
      },
    }
  )
}

/**
 * Request-memoized auth.getUser() lookup.
 *
 * Layouts and the pages nested under them each independently need the
 * current user, and previously each called `supabase.auth.getUser()` on its
 * own — multiple redundant network round-trips per navigation. Wrapping in
 * React's `cache()` scopes the memoization to a single request/render pass,
 * so repeated calls anywhere in the tree resolve from the same in-flight
 * promise instead of hitting Supabase again.
 */
export const getCachedUser = cache(async (): Promise<User | null> => {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
})
