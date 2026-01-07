import { requireManagerTeamAccess } from '@/lib/auth/team-access'
import Navbar from '@/components/Navbar'
import StatsManagementClient from './StatsManagementClient'
import { createClient } from '@/lib/supabase/server'

export default async function ManagerStatsPage() {
  // Require manager role and get team access
  const { user, teamId, team } = await requireManagerTeamAccess()

  const supabase = await createClient()

  // Get players with FACEIT data for the team
  const { data: playersWithFaceit } = await supabase
    .from('profiles')
    .select('id, username, in_game_name, faceit_player_id, faceit_nickname, faceit_elo, faceit_level, faceit_stats')
    .eq('team_id', teamId)
    .eq('role', 'player')
    .not('faceit_player_id', 'is', null)

  return (
    <div className="min-h-screen bg-dark">
      <Navbar role={user.role} username={user.username} />
      <StatsManagementClient 
        user={user} 
        teamId={teamId!} 
        teamName={team?.name || 'Your Team'}
        teamGame={team?.game || 'valorant'}
        playersWithFaceit={playersWithFaceit || []}
      />
    </div>
  )
}