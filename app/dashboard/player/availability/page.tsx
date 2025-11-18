import { createClient } from '@/lib/supabase/server'
import { requireRole } from '@/lib/auth/server'
import NavbarWrapper from '@/components/NavbarWrapper'
import PlayerAvailabilityClient from './PlayerAvailabilityClient'

export default async function PlayerAvailabilityPage() {
  const user = await requireRole(['player'])
  const supabase = await createClient()

  const { data: profile } = await supabase
    .from('profiles')
    .select('*, teams(id, name)')
    .eq('id', user.user_id)
    .single()

  if (!profile.team_id) {
    return (
      <div className="min-h-screen bg-dark">
        <NavbarWrapper role={user.role} username={user.username} userId={user.user_id} avatarUrl={user.avatar_url} />
        <div className="flex items-center justify-center py-20">
          <div className="bg-dark-card border border-gray-800 rounded-lg p-8 max-w-md">
            <h1 className="text-2xl font-bold text-white mb-4">No Team Assignment</h1>
            <p className="text-gray-400">
              You need to be assigned to a team before you can manage your availability.
              Please contact your manager.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-dark">
      <NavbarWrapper role={user.role} username={user.username} userId={user.user_id} avatarUrl={user.avatar_url} />
      <PlayerAvailabilityClient profile={profile} />
    </div>
  )
}
