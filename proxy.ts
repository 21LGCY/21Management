import { type NextRequest, NextResponse } from 'next/server'

export async function proxy(request: NextRequest) {
  const sessionCookie = request.cookies.get('esports_session')
  const userCookie = request.cookies.get('esports_user')
  
  const isAuthenticated = sessionCookie?.value === 'true' && userCookie?.value
  const isLoginPage = request.nextUrl.pathname === '/login'
  const isDashboard = request.nextUrl.pathname.startsWith('/dashboard')

  // Redirect to login if accessing dashboard without auth
  if (isDashboard && !isAuthenticated) {
    // Save the intended destination as callbackUrl
    const callbackUrl = request.nextUrl.pathname + request.nextUrl.search
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('callbackUrl', callbackUrl)
    return NextResponse.redirect(loginUrl)
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

  // Track user activity (non-blocking, for Discord daily summaries)
  if (isAuthenticated && userCookie?.value) {
    trackUserActivity(request, userCookie.value).catch(() => {
      // Silent fail - don't break page loads
    })
  }

  return NextResponse.next()
}

/**
 * Track user activity for Discord daily summaries
 * Updates user_sessions table with latest activity
 */
async function trackUserActivity(request: NextRequest, userCookieValue: string) {
  try {
    const user = JSON.parse(userCookieValue)
    if (!user?.user_id) return

    // Determine if this is a login
    const isLogin = request.nextUrl.pathname === '/login' || 
                    request.headers.get('referer')?.includes('/login')

    // Call internal API to update activity
    const apiUrl = new URL('/api/activity/track', request.url)
    await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': user.user_id,
        'x-is-login': isLogin ? 'true' : 'false',
      },
    })
  } catch {
    // Silent fail
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - api/activity/track (avoid double tracking)
     * - api/cron (skip cron endpoints)
     * - static assets
     */
    '/((?!_next/static|_next/image|favicon.ico|api/activity|api/cron|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
