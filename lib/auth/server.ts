import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'

export interface AuthUser {
  user_id: string
  username: string
  role: 'admin' | 'manager' | 'player'
  full_name: string
  avatar_url: string | null
}

const SESSION_COOKIE = 'esports_session'
const USER_COOKIE = 'esports_user'

export async function getCurrentUser(): Promise<AuthUser | null> {
  const cookieStore = await cookies()
  const userCookie = cookieStore.get(USER_COOKIE)
  
  if (!userCookie) return null
  
  try {
    return JSON.parse(userCookie.value) as AuthUser
  } catch {
    return null
  }
}

export async function isAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies()
  const session = cookieStore.get(SESSION_COOKIE)
  const user = await getCurrentUser()
  
  return session?.value === 'true' && user !== null
}

export async function requireAuth(): Promise<AuthUser> {
  const user = await getCurrentUser()
  
  if (!user) {
    throw new Error('Unauthorized')
  }
  
  return user
}

export async function requireRole(allowedRoles: Array<'admin' | 'manager' | 'player'>): Promise<AuthUser> {
  const user = await requireAuth()
  
  if (!allowedRoles.includes(user.role)) {
    throw new Error('Forbidden')
  }
  
  return user
}
