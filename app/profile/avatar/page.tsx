import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/auth/server'
import AvatarClient from './AvatarClient'

export default async function AvatarPage() {
  const user = await requireAuth()
  const supabase = await createClient()

  // Fetch current avatar
  const { data: profile } = await supabase
    .from('profiles')
    .select('avatar_url')
    .eq('id', user.user_id)
    .single()

  return <AvatarClient userId={user.user_id} currentAvatar={profile?.avatar_url || null} role={user.role} />
}
