import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// user_type values: 0 = admin, 1 = regular user, 2 = team member
const USER_TYPE_TEAM = 2;

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refresh session if expired
  const { data: { user } } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname
  const isAuthPage = pathname.startsWith('/login') ||
                     pathname.startsWith('/register') ||
                     pathname.startsWith('/forgot-password') ||
                     pathname.startsWith('/update-password')
  const isPublicSharedPage = pathname.startsWith('/p/')
  const isWebhook = pathname.startsWith('/api/quickbooks/webhook')
  const isPublicFile = pathname === '/robots.txt' || pathname === '/sitemap.xml'
  const isMarketing = pathname === '/' || pathname.startsWith('/landing')

  // Not logged in → send to login
  if (!user && !isAuthPage && !isPublicSharedPage && !isWebhook && !isPublicFile && !isMarketing) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Logged in → resolve their user_type from DB
  if (user) {
    // If going to an auth page, redirect to the correct home
    if (isAuthPage) {
      const { data: profile } = await supabase
        .from('users')
        .select('user_type')
        .eq('id', user.id)
        .single()

      const url = request.nextUrl.clone()
      url.pathname = profile?.user_type === USER_TYPE_TEAM ? '/team' : '/'
      return NextResponse.redirect(url)
    }

    // Restrict team members from accessing admin routes
    const isTeamRoute = pathname.startsWith('/team')
    if (!isTeamRoute && !isPublicSharedPage && !isWebhook && !isPublicFile) {
      // Only query DB if the user is accessing a non-team route
      const { data: profile } = await supabase
        .from('users')
        .select('user_type')
        .eq('id', user.id)
        .single()

      if (profile?.user_type === USER_TYPE_TEAM) {
        const url = request.nextUrl.clone()
        url.pathname = '/team'
        return NextResponse.redirect(url)
      }
    }
  }

  return supabaseResponse
}
