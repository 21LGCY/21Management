import { type NextRequest, NextResponse } from 'next/server'

export async function proxy(request: NextRequest) {
  const sessionCookie = request.cookies.get('esports_session')
  const userCookie = request.cookies.get('esports_user')
  
  const isAuthenticated = sessionCookie?.value === 'true' && userCookie?.value
  const isLoginPage = request.nextUrl.pathname === '/login'
  const isDashboard = request.nextUrl.pathname.startsWith('/dashboard')

  // Redirect to login if accessing dashboard without auth
  if (isDashboard && !isAuthenticated) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Redirect to dashboard if accessing login while authenticated
  if (isLoginPage && isAuthenticated) {
    try {
      const user = JSON.parse(userCookie.value)
      return NextResponse.redirect(new URL(`/dashboard/${user.role}`, request.url))
    } catch {
      // Invalid cookie, continue to login
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
