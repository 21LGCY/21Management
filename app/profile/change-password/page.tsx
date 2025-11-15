import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/auth/server'
import ChangePasswordClient from './ChangePasswordClient'

export default async function ChangePasswordPage() {
  const user = await requireAuth()
  
  return <ChangePasswordClient userId={user.user_id} role={user.role} />
}
