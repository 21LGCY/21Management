import { createClient } from '@/lib/supabase/server'
import { requireRole } from '@/lib/auth/server'
import NavbarWrapper from '@/components/NavbarWrapper'
import PlayerScheduleClient from './PlayerScheduleClient'
import BackButton from '@/components/BackButton'

export default async function PlayerSchedulePage() {
  const user = await requireRole(['player'])
  const supabase = await createClient()

  // Get player's team info
  const { data: playerData } = await supabase
    .from('profiles')
    .select('team_id, teams(id, name, game, tag)')
    .eq('id', user.user_id)
    .single()

  const teamId = playerData?.team_id || ''
  const teamName = playerData?.teams?.name || 'Your Team'

  return (
    <div className="min-h-screen bg-dark">
      <NavbarWrapper role={user.role} username={user.username} userId={user.user_id} avatarUrl={user.avatar_url} />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <BackButton fallbackHref="/dashboard/player/teams">
            Back to Team Hub
          </BackButton>
        </div>
        
        <PlayerScheduleClient 
          teamId={teamId}
          teamName={teamName}
        />
      </main>
    </div>
  )
}
