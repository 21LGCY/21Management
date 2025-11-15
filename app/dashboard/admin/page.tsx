import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { requireRole } from '@/lib/auth/server'
import NavbarWrapper from '@/components/NavbarWrapper'
import { Users, Trophy, Calendar } from 'lucide-react'

export default async function AdminDashboard() {
  // Require admin role
  const user = await requireRole(['admin'])
  
  const supabase = await createClient()

  // Get statistics
  const { count: teamCount } = await supabase
    .from('teams')
    .select('*', { count: 'exact', head: true })

  const { count: playerCount } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .eq('role', 'player')

  const { count: tournamentCount } = await supabase
    .from('tournaments')
    .select('*', { count: 'exact', head: true })

  const { count: matchCount } = await supabase
    .from('matches')
    .select('*', { count: 'exact', head: true })

  // Get recent activity
  const { data: recentMatches } = await supabase
    .from('matches')
    .select('*, teams(name)')
    .order('scheduled_at', { ascending: false })
    .limit(5)

  const { data: teams } = await supabase
    .from('teams')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div className="min-h-screen bg-dark">
      <NavbarWrapper role={user.role} username={user.username} userId={user.user_id} avatarUrl={user.avatar_url} />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            Welcome back, <span className="bg-gradient-to-r from-primary to-primary-dark bg-clip-text text-transparent">{user.username}</span>
          </h1>
          <p className="text-lg text-gray-400">Administrator Dashboard • System Overview</p>
        </div>

        {/* Stats Grid with Gradients */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-gradient-to-br from-primary/20 to-dark border border-primary/40 rounded-xl p-6 hover:border-primary/60 transition-all hover:shadow-lg hover:shadow-primary/20">
            <div className="flex items-start justify-between mb-3">
              <div className="p-3 bg-primary/30 rounded-lg">
                <Users className="w-6 h-6 text-primary" />
              </div>
            </div>
            <p className="text-sm text-primary/70 mb-1">Total Teams</p>
            <p className="text-2xl font-bold text-primary">{teamCount || 0}</p>
          </div>

          <div className="bg-gradient-to-br from-blue-500/10 to-dark border border-blue-500/30 rounded-xl p-6 hover:border-blue-500/50 transition-all hover:shadow-lg hover:shadow-blue-500/10">
            <div className="flex items-start justify-between mb-3">
              <div className="p-3 bg-blue-500/20 rounded-lg">
                <Users className="w-6 h-6 text-blue-400" />
              </div>
            </div>
            <p className="text-sm text-blue-300/70 mb-1">Active Players</p>
            <p className="text-2xl font-bold text-blue-400">{playerCount || 0}</p>
          </div>

          <div className="bg-gradient-to-br from-yellow-500/10 to-dark border border-yellow-500/30 rounded-xl p-6 hover:border-yellow-500/50 transition-all hover:shadow-lg hover:shadow-yellow-500/10">
            <div className="flex items-start justify-between mb-3">
              <div className="p-3 bg-yellow-500/20 rounded-lg">
                <Trophy className="w-6 h-6 text-yellow-400" />
              </div>
            </div>
            <p className="text-sm text-yellow-300/70 mb-1">Tournaments</p>
            <p className="text-2xl font-bold text-yellow-400">{tournamentCount || 0}</p>
          </div>

          <div className="bg-gradient-to-br from-green-500/10 to-dark border border-green-500/30 rounded-xl p-6 hover:border-green-500/50 transition-all hover:shadow-lg hover:shadow-green-500/10">
            <div className="flex items-start justify-between mb-3">
              <div className="p-3 bg-green-500/20 rounded-lg">
                <Calendar className="w-6 h-6 text-green-400" />
              </div>
            </div>
            <p className="text-sm text-green-300/70 mb-1">Matches</p>
            <p className="text-2xl font-bold text-green-400">{matchCount || 0}</p>
          </div>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Teams List */}
          <div className="bg-dark-card border border-gray-800 rounded-lg p-6">
            <div className="mb-4">
              <h2 className="text-xl font-semibold text-white">Teams</h2>
            </div>
            <div className="space-y-3">
              {teams && teams.length > 0 ? (
                teams.map((team) => (
                  <div
                    key={team.id}
                    className="flex items-center justify-between p-3 bg-dark rounded-lg border border-gray-800"
                  >
                    <div>
                      <p className="font-medium text-white">{team.name}</p>
                      <p className="text-sm text-gray-400">{team.game}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-400 text-center py-4">No teams yet</p>
              )}
            </div>
          </div>

          {/* Recent Matches */}
          <div className="bg-dark-card border border-gray-800 rounded-lg p-6">
            <div className="mb-4">
              <h2 className="text-xl font-semibold text-white">Recent Matches</h2>
            </div>
            <div className="space-y-3">
              {recentMatches && recentMatches.length > 0 ? (
                recentMatches.map((match) => (
                  <div
                    key={match.id}
                    className="p-3 bg-dark rounded-lg border border-gray-800"
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
                          {match.result}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-400">
                      {new Date(match.scheduled_at).toLocaleDateString()}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-gray-400 text-center py-4">No matches yet</p>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
