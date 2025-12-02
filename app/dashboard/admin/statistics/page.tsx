import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { requireRole } from '@/lib/auth/server'
import NavbarWrapper from '@/components/NavbarWrapper'
import StatisticsClient from './StatisticsClient'
import { BarChart3, TrendingUp, Users, Trophy } from 'lucide-react'

interface TopPlayerResult {
  player_id: string
  acs: number
  profiles: {
    username: string
    in_game_name: string | null
  }
}

export default async function StatisticsPage() {
  const user = await requireRole(['admin'])
  const supabase = await createClient()

  // Run all queries in parallel for faster page load
  const [
    { data: teams },
    { count: totalPlayers },
    { data: matchStatsData },
    { data: topPlayerData }
  ] = await Promise.all([
    // Fetch all teams
    supabase
      .from('teams')
      .select('*')
      .order('name'),
    // Fetch quick stats for the overview cards
    supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'player')
      .not('team_id', 'is', null),
    // Count unique matches from player_match_stats
    supabase
      .from('player_match_stats')
      .select('match_id'),
    // Get top player
    supabase
      .from('player_match_stats')
      .select('player_id, acs, profiles!inner(username, in_game_name)')
      .order('acs', { ascending: false })
      .limit(1)
      .single()
  ])

  // Get unique match count
  const uniqueMatchIds = new Set(matchStatsData?.map(s => s.match_id) || [])
  const totalMatches = uniqueMatchIds.size

  // Type the result properly
  const topPlayer = topPlayerData as TopPlayerResult | null

  return (
    <div className="min-h-screen bg-dark">
      <NavbarWrapper role={user.role} username={user.username} userId={user.user_id} avatarUrl={user.avatar_url} />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="mb-8 animate-fade-up">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 bg-gradient-to-br from-primary/20 to-purple-600/20 rounded-xl border border-primary/30">
              <BarChart3 className="w-7 h-7 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">
                Statistics
              </h1>
              <p className="text-gray-400">View player performance statistics across all teams</p>
            </div>
          </div>
        </div>

        {/* Quick Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-gradient-to-br from-dark-card to-dark-card/50 border border-gray-800 rounded-xl p-5 animate-fade-up stagger-1 card-hover">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400 mb-1">Active Players</p>
                <p className="text-3xl font-bold text-white">{totalPlayers || 0}</p>
              </div>
              <div className="p-3 bg-blue-500/10 rounded-xl border border-blue-500/20">
                <Users className="w-6 h-6 text-blue-400" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-dark-card to-dark-card/50 border border-gray-800 rounded-xl p-5 animate-fade-up stagger-2 card-hover">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400 mb-1">Total Matches</p>
                <p className="text-3xl font-bold text-white">{totalMatches}</p>
              </div>
              <div className="p-3 bg-green-500/10 rounded-xl border border-green-500/20">
                <Trophy className="w-6 h-6 text-green-400" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-dark-card to-dark-card/50 border border-gray-800 rounded-xl p-5 animate-fade-up stagger-3 card-hover">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400 mb-1">Top Performer</p>
                <p className="text-lg font-bold text-white truncate">
                  {topPlayer ? (topPlayer.profiles.in_game_name || topPlayer.profiles.username) : 'N/A'}
                </p>
                {topPlayer && (
                  <p className="text-xs text-primary">{topPlayer.acs} ACS (Best)</p>
                )}
              </div>
              <div className="p-3 bg-primary/10 rounded-xl border border-primary/20">
                <TrendingUp className="w-6 h-6 text-primary" />
              </div>
            </div>
          </div>
        </div>

        <StatisticsClient teams={teams || []} />
      </main>
    </div>
  )
}
