import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { requireRole } from '@/lib/auth/server'
import NavbarWrapper from '@/components/NavbarWrapper'
import StatCard from '@/components/StatCard'
import { Trophy, Calendar, Target, TrendingUp, Users, Activity, Clock } from 'lucide-react'
import Link from 'next/link'

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
    { data: teamPlayers },
    { data: upcomingMatches },
    { data: recentMatches }
  ] = await Promise.all([
    // Get all team players for roster display
    supabase
      .from('profiles')
      .select('*')
      .eq('role', 'player')
      .eq('team_id', teamId)
      .order('is_substitute', { ascending: true })
      .order('created_at', { ascending: true }),
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
    <div className="min-h-screen bg-dark">
      <NavbarWrapper role={user.role} username={user.username} userId={user.user_id} avatarUrl={user.avatar_url} />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            Welcome back, <span className="bg-gradient-to-r from-primary to-primary-dark bg-clip-text text-transparent">{playerData?.full_name || user.username}</span>
          </h1>
          <p className="text-lg text-gray-400">Player Dashboard • {playerData?.teams?.name || 'Your Team'}</p>
        </div>

        {/* Stats Grid with Gradients */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-gradient-to-br from-primary/20 to-dark border border-primary/40 rounded-xl p-6 hover:border-primary/60 transition-all hover:shadow-lg hover:shadow-primary/20">
            <div className="flex items-start justify-between mb-3">
              <div className="p-3 bg-primary/30 rounded-lg">
                <Trophy className="w-6 h-6 text-primary" />
              </div>
            </div>
            <p className="text-sm text-primary/70 mb-1">Your Team</p>
            <p className="text-2xl font-bold text-primary truncate">{playerData?.teams?.name || 'Not Assigned'}</p>
          </div>

          <div className="bg-gradient-to-br from-green-500/10 to-dark border border-green-500/30 rounded-xl p-6 hover:border-green-500/50 transition-all hover:shadow-lg hover:shadow-green-500/10">
            <div className="flex items-start justify-between mb-3">
              <div className="p-3 bg-green-500/20 rounded-lg">
                <TrendingUp className="w-6 h-6 text-green-400" />
              </div>
            </div>
            <p className="text-sm text-green-300/70 mb-1">Win Rate</p>
            <p className="text-2xl font-bold text-green-400">{winRate}%</p>
          </div>

          <div className="bg-gradient-to-br from-blue-500/10 to-dark border border-blue-500/30 rounded-xl p-6 hover:border-blue-500/50 transition-all hover:shadow-lg hover:shadow-blue-500/10">
            <div className="flex items-start justify-between mb-3">
              <div className="p-3 bg-blue-500/20 rounded-lg">
                <Target className="w-6 h-6 text-blue-400" />
              </div>
            </div>
            <p className="text-sm text-blue-300/70 mb-1">Matches Played</p>
            <p className="text-2xl font-bold text-blue-400">{totalMatches}</p>
          </div>

          <div className="bg-gradient-to-br from-yellow-500/10 to-dark border border-yellow-500/30 rounded-xl p-6 hover:border-yellow-500/50 transition-all hover:shadow-lg hover:shadow-yellow-500/10">
            <div className="flex items-start justify-between mb-3">
              <div className="p-3 bg-yellow-500/20 rounded-lg">
                <Calendar className="w-6 h-6 text-yellow-400" />
              </div>
            </div>
            <p className="text-sm text-yellow-300/70 mb-1">Upcoming Matches</p>
            <p className="text-2xl font-bold text-yellow-400">{upcomingMatches?.length || 0}</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Link href="/dashboard/player/stats">
            <button className="w-full p-4 bg-gradient-to-br from-dark-card via-dark-card to-purple-500/5 border border-gray-800 hover:border-purple-500/50 rounded-xl text-left transition-all group hover:shadow-lg hover:shadow-purple-500/10">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-500/20 rounded-lg group-hover:bg-purple-500/30 transition border border-purple-500/30">
                  <Activity className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <p className="font-semibold text-white group-hover:text-purple-300 transition">View Statistics</p>
                  <p className="text-sm text-gray-400">Performance metrics and analytics</p>
                </div>
              </div>
            </button>
          </Link>

          <Link href="/dashboard/player/teams">
            <button className="w-full p-4 bg-gradient-to-br from-dark-card via-dark-card to-blue-500/5 border border-gray-800 hover:border-blue-500/50 rounded-xl text-left transition-all group hover:shadow-lg hover:shadow-blue-500/10">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/20 rounded-lg group-hover:bg-blue-500/30 transition border border-blue-500/30">
                  <Users className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <p className="font-semibold text-white group-hover:text-blue-300 transition">Team Hub</p>
                  <p className="text-sm text-gray-400">Roster, schedule & strategies</p>
                </div>
              </div>
            </button>
          </Link>

          <Link href="/dashboard/player/availability">
            <button className="w-full p-4 bg-gradient-to-br from-dark-card via-dark-card to-green-500/5 border border-gray-800 hover:border-green-500/50 rounded-xl text-left transition-all group hover:shadow-lg hover:shadow-green-500/10">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-500/20 rounded-lg group-hover:bg-green-500/30 transition border border-green-500/30">
                  <Clock className="w-5 h-5 text-green-400" />
                </div>
                <div>
                  <p className="font-semibold text-white group-hover:text-green-300 transition">My Availability</p>
                  <p className="text-sm text-gray-400">Manage weekly schedule</p>
                </div>
              </div>
            </button>
          </Link>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Upcoming Matches */}
          <div className="bg-dark-card border border-gray-800 rounded-xl p-6 hover:border-gray-700 transition-all">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold text-white mb-1">Upcoming Matches</h2>
                <p className="text-sm text-gray-400">Your scheduled games</p>
              </div>
              <Calendar className="w-5 h-5 text-gray-400" />
            </div>
            <div className="space-y-3">
              {upcomingMatches && upcomingMatches.length > 0 ? (
                upcomingMatches.map((match) => (
                  <div
                    key={match.id}
                    className="p-4 bg-gradient-to-br from-dark to-dark-card rounded-xl border border-gray-800 hover:border-primary transition-all group hover:shadow-lg"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <p className="font-semibold text-white group-hover:text-primary transition">
                          {match.teams?.name} vs {match.opponent}
                        </p>
                        {match.tournaments && (
                          <p className="text-sm text-primary mt-1">
                            {match.tournaments.name}
                          </p>
                        )}
                      </div>
                      <span className="px-3 py-1 bg-primary/20 text-primary text-xs rounded-lg font-medium">
                        Scheduled
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <p className="text-sm text-gray-400">
                        {new Date(match.scheduled_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-400">No upcoming matches</p>
                  <p className="text-sm text-gray-500 mt-1">Schedule your next game</p>
                </div>
              )}
            </div>
          </div>

          {/* Recent Matches */}
          <div className="bg-dark-card border border-gray-800 rounded-xl p-6 hover:border-gray-700 transition-all">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold text-white mb-1">Recent Results</h2>
                <p className="text-sm text-gray-400">Last 5 matches</p>
              </div>
              <Trophy className="w-5 h-5 text-gray-400" />
            </div>
            <div className="space-y-3">
              {recentMatches && recentMatches.length > 0 ? (
                recentMatches.map((match) => (
                  <div
                    key={match.id}
                    className="p-4 bg-gradient-to-br from-dark to-dark-card rounded-xl border border-gray-800 hover:border-gray-700 transition-all"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-semibold text-white">
                        {match.teams?.name} vs {match.opponent}
                      </p>
                      {match.result && (
                        <span
                          className={`px-3 py-1 rounded-lg text-xs font-medium ${
                            match.result === 'win'
                              ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                              : match.result === 'loss'
                              ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                              : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
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
                        <p className="text-sm font-medium text-gray-300">{match.score}</p>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <Trophy className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-400">No match history yet</p>
                  <p className="text-sm text-gray-500 mt-1">Results will appear here</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
