import { createClient } from '@/lib/supabase/client'
import Cookies from 'js-cookie'

export interface AuthUser {
  user_id: string
  username: string
  role: 'admin' | 'manager' | 'player'
  avatar_url: string | null
}

const SESSION_COOKIE = 'esports_session'
const USER_COOKIE = 'esports_user'

export async function login(username: string, password: string): Promise<AuthUser> {
  const supabase = createClient()
  
  // Call the authenticate_user RPC function
  const { data, error } = await supabase
    .rpc('authenticate_user', {
      p_username: username,
      p_password: password
    })
  
  if (error || !data || data.length === 0) {
    throw new Error('Invalid username or password')
  }
  
  const user = data[0] as AuthUser
  
  // Store session in cookies (7 days expiry)
  Cookies.set(SESSION_COOKIE, 'true', { expires: 7, secure: true, sameSite: 'strict' })
  Cookies.set(USER_COOKIE, JSON.stringify(user), { expires: 7, secure: true, sameSite: 'strict' })
  
  return user
}

export async function logout(): Promise<void> {
  Cookies.remove(SESSION_COOKIE)
  Cookies.remove(USER_COOKIE)
}

export function getCurrentUser(): AuthUser | null {
  const userCookie = Cookies.get(USER_COOKIE)
  if (!userCookie) return null
  
  try {
    return JSON.parse(userCookie) as AuthUser
  } catch {
    return null
  }
}

export function isAuthenticated(): boolean {
  return Cookies.get(SESSION_COOKIE) === 'true' && getCurrentUser() !== null
}

export async function createUser(
  username: string,
  password: string,
  role: 'admin' | 'manager' | 'player' = 'player'
): Promise<string> {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .rpc('create_user', {
      p_username: username,
      p_password: password,
      p_role: role
    })
  
  if (error) {
    throw new Error(error.message)
  }
  
  return data as string
}

export async function updatePassword(
  userId: string,
  oldPassword: string,
  newPassword: string
): Promise<boolean> {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .rpc('update_password', {
      p_user_id: userId,
      p_old_password: oldPassword,
      p_new_password: newPassword
    })
  
  if (error) {
    throw new Error(error.message)
  }
  
  return data as boolean
}
