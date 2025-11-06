import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { requireRole } from '@/lib/auth/server'
import Navbar from '@/components/Navbar'
import StatCard from '@/components/StatCard'
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
      <Navbar role={user.role} username={user.username} />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            Welcome back, <span className="text-gradient">{user.username}</span>
          </h1>
          <p className="text-gray-400">Administrator Dashboard - System Overview</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Teams"
            value={teamCount || 0}
            icon={<Users className="w-6 h-6" />}
          />
          <StatCard
            title="Active Players"
            value={playerCount || 0}
            icon={<Users className="w-6 h-6" />}
          />
          <StatCard
            title="Tournaments"
            value={tournamentCount || 0}
            icon={<Trophy className="w-6 h-6" />}
          />
          <StatCard
            title="Matches"
            value={matchCount || 0}
            icon={<Calendar className="w-6 h-6" />}
          />
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
