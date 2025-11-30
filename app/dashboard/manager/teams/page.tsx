import { createClient } from '@/lib/supabase/server'
import { requireManagerTeamAccess } from '@/lib/auth/team-access'
import NavbarWrapper from '@/components/NavbarWrapper'
import ManagerTeamsClient from './ManagerTeamsClient'
import { TimezoneOffset, DEFAULT_TIMEZONE } from '@/lib/utils/timezone'

export default async function ManagerTeamsPage() {
  // Require manager role and get team access
  const { user, teamId, team, teamCategory } = await requireManagerTeamAccess()
  
  const supabase = await createClient()

  // Get user's timezone
  const { data: userProfile } = await supabase
    .from('profiles')
    .select('timezone')
    .eq('id', user.user_id)
    .single()
  
  const userTimezone = (userProfile?.timezone as TimezoneOffset) || DEFAULT_TIMEZONE

  // Get player count for manager's team
  const { count: playerCount } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .eq('role', 'player')
    .eq('team_id', teamId)

  // Get tryouts (if team-specific tryouts exist, otherwise general tryouts)
  const { data: tryouts } = await supabase
    .from('tryouts')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5)

  return (
    <div className="min-h-screen bg-dark">
      <NavbarWrapper role={user.role} username={user.username} userId={user.user_id} avatarUrl={user.avatar_url} />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ManagerTeamsClient 
          teamId={teamId || ''} 
          teamName={team?.name || ''}
          teamCategory={teamCategory || '21GC'}
          playerCount={playerCount || 0}
          tryouts={tryouts || []}
          userTimezone={userTimezone}
        />
      </main>
    </div>
  )
}