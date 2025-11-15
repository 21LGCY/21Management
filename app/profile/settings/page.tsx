import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/auth/server'
import SettingsClient from './SettingsClient'

export default async function SettingsPage() {
  const user = await requireAuth()
  const supabase = await createClient()

  // Fetch user profile data
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.user_id)
    .single()

  return <SettingsClient profile={profile} userId={user.user_id} />
}
