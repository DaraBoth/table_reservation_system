import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refresh session — IMPORTANT: do not add any logic between createServerClient and auth.getUser()
  const { data: { user } } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  // Public routes — always allow
  if (pathname === '/login' || pathname === '/') {
    if (user) {
      // Logged in — redirect to appropriate dashboard
      const { data: membership } = await supabase
        .from('account_memberships')
        .select('role')
        .eq('user_id', user.id)
        .single()

      if (membership?.role === 'superadmin') {
        return NextResponse.redirect(new URL('/superadmin', request.url))
      }
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
    return supabaseResponse
  }

  // All other routes require authentication
  if (!user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Fetch membership once for protected routes
  const { data: membership } = await supabase
    .from('account_memberships')
    .select('role, restaurant_id, is_active')
    .eq('user_id', user.id)
    .single()

  if (!membership || !membership.is_active) {
    return NextResponse.redirect(new URL('/login?error=account_disabled', request.url))
  }

  // Superadmin routes protection
  if (pathname.startsWith('/superadmin') && membership.role !== 'superadmin') {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // Dashboard routes — admin and staff only
  if (pathname.startsWith('/dashboard') && membership.role === 'superadmin') {
    return NextResponse.redirect(new URL('/superadmin', request.url))
  }

  // Check subscription for restaurant users
  if (membership.role !== 'superadmin' && membership.restaurant_id) {
    const { data: restaurant } = await supabase
      .from('restaurants')
      .select('is_active, subscription_expires_at')
      .eq('id', membership.restaurant_id)
      .single()

    if (!restaurant?.is_active) {
      return NextResponse.redirect(new URL('/login?error=restaurant_suspended', request.url))
    }

    if (restaurant.subscription_expires_at && new Date(restaurant.subscription_expires_at) < new Date()) {
      return NextResponse.redirect(new URL('/login?error=subscription_expired', request.url))
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
