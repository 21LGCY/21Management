import { createClient } from '@/lib/supabase/server'
import { requireRole } from '@/lib/auth/server'
import NavbarWrapper from '@/components/NavbarWrapper'
import PlayerTeamsClient from './PlayerTeamsClient'
import { TimezoneOffset, DEFAULT_TIMEZONE } from '@/lib/utils/timezone'
import { GameType, DEFAULT_GAME } from '@/lib/types/games'

export default async function PlayerTeamsPage() {
  const user = await requireRole(['player'])
  const supabase = await createClient()

  // Get player data with team info and timezone
  const { data: playerData } = await supabase
    .from('profiles')
    .select('*, teams(id, name, game, tag)')
    .eq('id', user.user_id)
    .single()

  const userTimezone = (playerData?.timezone as TimezoneOffset) || DEFAULT_TIMEZONE

  // Get all team players for roster display
  const { data: teamPlayers, error: teamPlayersError } = await supabase
    .from('profiles')
    .select('id, username, in_game_name, position, is_igl, is_substitute, avatar_url, rank, staff_role, faceit_level, role')
    .eq('team_id', playerData?.team_id || '')
    .in('role', ['player', 'manager'])
    .order('is_substitute', { ascending: true })
    .order('created_at', { ascending: true })

  // Filter players from the results
  const actualPlayers = teamPlayers?.filter(p => p.role === 'player') || []
  const actualStaff = teamPlayers?.filter(p => p.role === 'manager') || []

  return (
    <div className="min-h-screen bg-dark">
      <NavbarWrapper role={user.role} username={user.username} userId={user.user_id} avatarUrl={user.avatar_url} />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <PlayerTeamsClient 
          teamId={playerData?.team_id || ''}
          teamName={playerData?.teams?.name || ''}
          teamGame={(playerData?.teams?.game as GameType) || DEFAULT_GAME}
          currentPlayerId={user.user_id}
          teamPlayers={actualPlayers}
          staffMembers={actualStaff}
          userTimezone={userTimezone}
        />
      </main>
    </div>
  )
}
