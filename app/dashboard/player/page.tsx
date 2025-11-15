import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { requireRole } from '@/lib/auth/server'
import NavbarWrapper from '@/components/NavbarWrapper'
import StatCard from '@/components/StatCard'
import { Trophy, Calendar, Target, TrendingUp } from 'lucide-react'

export default async function PlayerDashboard() {
  // Require player role
  const user = await requireRole(['player'])
  
  const supabase = await createClient()

  // Get player data (now directly from profiles)
  const { data: playerData } = await supabase
    .from('profiles')
    .select('*, teams(name, game)')
    .eq('id', user.user_id)
    .single()

  // Get upcoming matches for player's team
  const { data: upcomingMatches } = await supabase
    .from('matches')
    .select('*, teams(name), tournaments(name)')
    .eq('team_id', playerData?.team_id || '')
    .gte('scheduled_at', new Date().toISOString())
    .order('scheduled_at', { ascending: true })
    .limit(5)

  // Get recent matches
  const { data: recentMatches } = await supabase
    .from('matches')
    .select('*, teams(name)')
    .eq('team_id', playerData?.team_id || '')
    .lte('scheduled_at', new Date().toISOString())
    .order('scheduled_at', { ascending: false })
    .limit(5)

  const winCount = recentMatches?.filter(m => m.result === 'win').length || 0
  const totalMatches = recentMatches?.length || 0
  const winRate = totalMatches > 0 ? Math.round((winCount / totalMatches) * 100) : 0

  return (
    <div className="min-h-screen bg-dark">
      <NavbarWrapper role={user.role} username={user.username} userId={user.user_id} avatarUrl={user.avatar_url} />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            Welcome back, <span className="text-gradient">{user.full_name}</span>
          </h1>
          <p className="text-gray-400">Player Dashboard - Your performance and schedule</p>
        </div>

        {/* Player Info Card */}
        {playerData && (
          <div className="bg-dark-card border border-gray-800 rounded-lg p-6 mb-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">
                  {playerData.in_game_name}
                </h2>
                <div className="flex flex-wrap gap-3">
                  {playerData.teams && (
                    <span className="px-3 py-1 bg-primary/20 text-primary rounded-lg text-sm">
                      {playerData.teams.name}
                    </span>
                  )}
                  {playerData.teams?.game && (
                    <span className="px-3 py-1 bg-secondary/20 text-secondary rounded-lg text-sm">
                      {playerData.teams.game}
                    </span>
                  )}
                  {playerData.position && (
                    <span className="px-3 py-1 bg-gray-700 text-gray-300 rounded-lg text-sm">
                      {playerData.position}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Win Rate"
            value={`${winRate}%`}
            icon={<TrendingUp className="w-6 h-6" />}
          />
          <StatCard
            title="Matches Played"
            value={totalMatches}
            icon={<Trophy className="w-6 h-6" />}
          />
          <StatCard
            title="Wins"
            value={winCount}
            icon={<Target className="w-6 h-6" />}
          />
          <StatCard
            title="Upcoming"
            value={upcomingMatches?.length || 0}
            icon={<Calendar className="w-6 h-6" />}
          />
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Upcoming Matches */}
          <div className="bg-dark-card border border-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Upcoming Matches</h2>
            <div className="space-y-3">
              {upcomingMatches && upcomingMatches.length > 0 ? (
                upcomingMatches.map((match) => (
                  <div
                    key={match.id}
                    className="p-4 bg-dark rounded-lg border border-gray-800"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-medium text-white">
                          {match.teams?.name} vs {match.opponent}
                        </p>
                        {match.tournaments && (
                          <p className="text-sm text-primary mt-1">
                            {match.tournaments.name}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-3">
                      <p className="text-sm text-gray-400">
                        {new Date(match.scheduled_at).toLocaleString()}
                      </p>
                      <span className="px-2 py-1 bg-primary/20 text-primary text-xs rounded">
                        Scheduled
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <Calendar className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-400">No upcoming matches</p>
                </div>
              )}
            </div>
          </div>

          {/* Recent Matches */}
          <div className="bg-dark-card border border-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Recent Results</h2>
            <div className="space-y-3">
              {recentMatches && recentMatches.length > 0 ? (
                recentMatches.map((match) => (
                  <div
                    key={match.id}
                    className="p-4 bg-dark rounded-lg border border-gray-800"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-medium text-white">
                        {match.teams?.name} vs {match.opponent}
                      </p>
                      {match.result && (
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            match.result === 'win'
                              ? 'bg-green-500/20 text-green-400'
                              : match.result === 'loss'
                              ? 'bg-red-500/20 text-red-400'
                              : 'bg-gray-500/20 text-gray-400'
                          }`}
                        >
                          {match.result.toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-gray-400">
                        {new Date(match.scheduled_at).toLocaleDateString()}
                      </p>
                      {match.score && (
                        <p className="text-sm text-gray-300">{match.score}</p>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <Trophy className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-400">No match history yet</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Performance Note */}
        {!playerData && (
          <div className="mt-8 bg-yellow-500/10 border border-yellow-500/50 rounded-lg p-4">
            <p className="text-yellow-400 text-sm">
              Your player profile is not set up yet. Please contact your manager to complete your profile.
            </p>
          </div>
        )}
      </main>
    </div>
  )
}
