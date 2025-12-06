import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { requireRole } from '@/lib/auth/server'
import PlayerDashboardClient from '@/components/PlayerDashboardClient'

export default async function PlayerDashboard() {
  // Require player role
  const user = await requireRole(['player'])
  
  const supabase = await createClient()

  // Get player data first (needed for team_id)
  const { data: playerData } = await supabase
    .from('profiles')
    .select('*, teams(name, game)')
    .eq('id', user.user_id)
    .single()

  const teamId = playerData?.team_id || ''

  // Run remaining queries in parallel for faster page load
  const [
    { data: upcomingMatches },
    { data: recentMatches }
  ] = await Promise.all([
    // Get upcoming matches for player's team
    supabase
      .from('matches')
      .select('*, teams(name), tournaments(name)')
      .eq('team_id', teamId)
      .gte('scheduled_at', new Date().toISOString())
      .order('scheduled_at', { ascending: true })
      .limit(5),
    // Get recent matches
    supabase
      .from('matches')
      .select('*, teams(name)')
      .eq('team_id', teamId)
      .lte('scheduled_at', new Date().toISOString())
      .order('scheduled_at', { ascending: false })
      .limit(5)
  ])

  const winCount = recentMatches?.filter(m => m.result === 'win').length || 0
  const totalMatches = recentMatches?.length || 0
  const winRate = totalMatches > 0 ? Math.round((winCount / totalMatches) * 100) : 0

  return (
    <PlayerDashboardClient
      user={user}
      playerData={playerData}
      upcomingMatches={upcomingMatches || []}
      recentMatches={recentMatches || []}
      winRate={winRate}
      totalMatches={totalMatches}
    />
  )
}
