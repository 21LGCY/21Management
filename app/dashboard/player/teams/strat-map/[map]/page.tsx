import { requireRole } from '@/lib/auth/server'
import NavbarWrapper from '@/components/NavbarWrapper'
import { notFound } from 'next/navigation'
import StratMapClient from './StratMapClient'
import { GameType, GAME_CONFIGS } from '@/lib/types/games'

export default async function PlayerStratMapPage({ 
  params 
}: { 
  params: Promise<{ map: string }>
}) {
  const { map } = await params
  const user = await requireRole(['player'])

  // Get player's team_id and game from their profile
  const supabase = await (await import('@/lib/supabase/server')).createClient()
  const { data: playerData } = await supabase
    .from('profiles')
    .select('team_id, game')
    .eq('id', user.user_id)
    .single()

  if (!playerData?.team_id) {
    notFound()
  }

  // Get team's game to validate map
  const { data: teamData } = await supabase
    .from('teams')
    .select('game')
    .eq('id', playerData.team_id)
    .single()

  const teamGame = (teamData?.game || 'valorant') as GameType
  
  // Capitalize first letter to match enum
  const mapName = map.charAt(0).toUpperCase() + map.slice(1)
  
  // Validate map name for the team's game
  const validMaps = GAME_CONFIGS[teamGame].maps
  if (!validMaps.includes(mapName)) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-dark">
      <NavbarWrapper role={user.role} username={user.username} userId={user.user_id} avatarUrl={user.avatar_url} />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <StratMapClient 
          teamId={playerData.team_id}
          mapName={mapName}
          gameType={teamGame}
          userId={user.user_id}
          userName={user.username}
          userRole={user.role}
        />
      </main>
    </div>
  )
}
