import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // This will refresh session if expired
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Proteger rutas privadas
  const isAuthPage = request.nextUrl.pathname.startsWith('/login') || request.nextUrl.pathname.startsWith('/register')
  const isPublicSharedPage = request.nextUrl.pathname.startsWith('/p/')
  const isWebhook = request.nextUrl.pathname.startsWith('/api/quickbooks/webhook')
  const isPublicFile = request.nextUrl.pathname === '/robots.txt' || request.nextUrl.pathname === '/sitemap.xml'
  
  // Si no está logueado y no está en la página de login o vista pública, redirigir a login
  if (!user && !isAuthPage && !isPublicSharedPage && !isWebhook && !isPublicFile) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Si está logueado e intenta ir a login, enviarlo al home
  if (user && isAuthPage) {
    const url = request.nextUrl.clone()
    const isTeamRole = user.user_metadata?.role === 'team';
    url.pathname = isTeamRole ? '/team' : '/'
    return NextResponse.redirect(url)
  }

  // Restringir accesos para los miembros del equipo
  if (user) {
    const isTeamRole = user.user_metadata?.role === 'team';
    const isTeamRoute = request.nextUrl.pathname.startsWith('/team');
    
    // Si es un team member y asiste a una ruta que no es de equipo, redirigir a /team
    if (isTeamRole && !isTeamRoute && !isPublicSharedPage && !isWebhook && !isPublicFile && request.nextUrl.pathname !== '/logout') {
      const url = request.nextUrl.clone()
      url.pathname = '/team'
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}
