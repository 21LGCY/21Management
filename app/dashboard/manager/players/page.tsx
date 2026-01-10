import { createClient } from '@/lib/supabase/server'
import { requireManagerTeamAccess } from '@/lib/auth/team-access'
import PlayersPageClient from './PlayersPageClient'
import { GameType } from '@/lib/types/games'

// Helper to get current week start (Monday in Paris timezone)
const getCurrentWeekStart = (): string => {
  const now = new Date()
  
  // Get the date in Europe/Paris timezone
  const formatter = new Intl.DateTimeFormat('en-CA', { 
    timeZone: 'Europe/Paris',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
  const parts = formatter.format(now).split('-')
  const parisDate = new Date(Date.UTC(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2])))
  
  const day = parisDate.getUTCDay()
  const diff = day === 0 ? -6 : 1 - day
  const monday = new Date(parisDate)
  monday.setUTCDate(parisDate.getUTCDate() + diff)
  
  const year = monday.getUTCFullYear()
  const month = String(monday.getUTCMonth() + 1).padStart(2, '0')
  const dayNum = String(monday.getUTCDate()).padStart(2, '0')
  return `${year}-${month}-${dayNum}`
}

export default async function ManagerPlayersPage() {
  // Require manager role and get team access
  const { user, teamId, team } = await requireManagerTeamAccess()
  
  const supabase = await createClient()
  const weekStart = getCurrentWeekStart()

  // Get players and their availability in parallel
  const [playersResult, availabilityResult] = await Promise.all([
    supabase
      .from('profiles')
      .select('*, teams(name, game), faceit_stats')
      .eq('role', 'player')
      .eq('team_id', teamId)
      .order('created_at', { ascending: false }),
    supabase
      .from('player_weekly_availability')
      .select('*')
      .eq('team_id', teamId)
      .eq('week_start', weekStart)
  ])

  const gameType = (team?.game as GameType) || 'valorant'

  return (
    <PlayersPageClient 
      players={playersResult.data || []} 
      playerAvailabilities={availabilityResult.data || []}
      user={user} 
      team={team} 
      gameType={gameType} 
    />
  )
}
