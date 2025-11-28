import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'

export interface AuthUser {
  user_id: string
  username: string
  role: 'admin' | 'manager' | 'player'
  avatar_url: string | null
}

const SESSION_COOKIE = 'esports_session'
const USER_COOKIE = 'esports_user'

/**
 * Get current user from cookie.
 * Note: For critical operations, use getVerifiedUser() instead which validates against the database.
 */
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

/**
 * Get and verify user from the database.
 * This should be used for sensitive operations to prevent cookie tampering.
 */
export async function getVerifiedUser(): Promise<AuthUser | null> {
  const cookieStore = await cookies()
  const sessionCookie = cookieStore.get(SESSION_COOKIE)
  const userCookie = cookieStore.get(USER_COOKIE)
  
  if (!sessionCookie || sessionCookie.value !== 'true' || !userCookie) {
    return null
  }

  try {
    const cookieUser = JSON.parse(userCookie.value) as AuthUser
    
    // Verify user exists and role matches in database
    const supabase = await createClient()
    const { data: dbUser, error } = await supabase
      .from('profiles')
      .select('id, username, role, avatar_url')
      .eq('id', cookieUser.user_id)
      .single()

    if (error || !dbUser) {
      return null
    }

    // Return the database-verified user data
    return {
      user_id: dbUser.id,
      username: dbUser.username,
      role: dbUser.role as 'admin' | 'manager' | 'player',
      avatar_url: dbUser.avatar_url
    }
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

/**
 * Require authentication with database verification.
 * Use this for sensitive operations.
 */
export async function requireVerifiedAuth(): Promise<AuthUser> {
  const user = await getVerifiedUser()
  
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

/**
 * Require role with database verification.
 * Use this for sensitive operations.
 */
export async function requireVerifiedRole(allowedRoles: Array<'admin' | 'manager' | 'player'>): Promise<AuthUser> {
  const user = await requireVerifiedAuth()
  
  if (!allowedRoles.includes(user.role)) {
    throw new Error('Forbidden')
  }
  
  return user
}
