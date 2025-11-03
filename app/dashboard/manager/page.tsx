import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { requireRole } from '@/lib/auth/server'
import Navbar from '@/components/Navbar'
import StatCard from '@/components/StatCard'
import { Users, Calendar, Trophy, Clock, Target, Award } from 'lucide-react'

export default async function ManagerDashboard() {
  // Require manager role
  const user = await requireRole(['manager'])
  
  const supabase = await createClient()

  // Get statistics
  const { count: teamCount } = await supabase
    .from('teams')
    .select('*', { count: 'exact', head: true })

  const { count: playerCount } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .eq('role', 'player')

  const { data: upcomingMatches } = await supabase
    .from('matches')
    .select('*, teams(name)')
    .gte('scheduled_at', new Date().toISOString())
    .order('scheduled_at', { ascending: true })
    .limit(5)

  const { data: tournaments } = await supabase
    .from('tournaments')
    .select('*')
    .order('start_date', { ascending: false })
    .limit(5)

  const { data: teams } = await supabase
    .from('teams')
    .select('*')
    .order('created_at', { ascending: false })

  const { data: players } = await supabase
    .from('profiles')
    .select('*, teams(name)')
    .eq('role', 'player')
    .order('created_at', { ascending: false })
    .limit(10)

  return (
    <div className="min-h-screen bg-dark">
      <Navbar role={user.role} username={user.username} />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            Welcome back, <span className="text-gradient">{user.username}</span>
          </h1>
          <p className="text-gray-400">Manager Dashboard - Team and player management</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Teams"
            value={teamCount || 0}
            icon={<Users className="w-6 h-6" />}
          />
          <StatCard
            title="Players"
            value={playerCount || 0}
            icon={<Users className="w-6 h-6" />}
          />
          <StatCard
            title="Upcoming Matches"
            value={upcomingMatches?.length || 0}
            icon={<Calendar className="w-6 h-6" />}
          />
          <StatCard
            title="Active Tournaments"
            value={tournaments?.filter(t => t.status === 'ongoing').length || 0}
            icon={<Trophy className="w-6 h-6" />}
          />
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Upcoming Matches */}
          <div className="bg-dark-card border border-gray-800 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-white">Upcoming Matches</h2>
              <button className="px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg transition text-sm">
                Schedule Match
              </button>
            </div>
            <div className="space-y-3">
              {upcomingMatches && upcomingMatches.length > 0 ? (
                upcomingMatches.map((match) => (
                  <div
                    key={match.id}
                    className="p-3 bg-dark rounded-lg border border-gray-800 hover:border-primary/50 transition"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-medium text-white">
                          {match.teams?.name} vs {match.opponent}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <Clock className="w-3 h-3 text-gray-400" />
                          <p className="text-sm text-gray-400">
                            {new Date(match.scheduled_at).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <button className="text-primary hover:text-primary-light text-sm">
                        Details
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-400 text-center py-4">No upcoming matches</p>
              )}
            </div>
          </div>

          {/* Players List */}
          <div className="bg-dark-card border border-gray-800 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-white">Players</h2>
              <button className="px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg transition text-sm">
                Add Player
              </button>
            </div>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {players && players.length > 0 ? (
                players.map((player) => (
                  <div
                    key={player.id}
                    className="flex items-center justify-between p-3 bg-dark rounded-lg border border-gray-800 hover:border-primary/50 transition"
                  >
                    <div>
                      <p className="font-medium text-white">{player.in_game_name || player.username}</p>
                      <p className="text-sm text-gray-400">
                        {player.full_name} • {player.teams?.name || 'No team'}
                      </p>
                    </div>
                    <button className="text-primary hover:text-primary-light text-sm">
                      Edit
                    </button>
                  </div>
                ))
              ) : (
                <p className="text-gray-400 text-center py-4">No players yet</p>
              )}
            </div>
          </div>
        </div>

        {/* Teams Section */}
        <div className="bg-dark-card border border-gray-800 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-white">Teams Overview</h2>
            <button className="px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg transition text-sm">
              Create Team
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {teams && teams.length > 0 ? (
              teams.map((team) => (
                <div
                  key={team.id}
                  className="p-4 bg-dark border border-gray-800 rounded-lg hover:border-primary/50 transition"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-white">{team.name}</h3>
                    <span className="px-2 py-1 bg-primary/20 text-primary text-xs rounded">
                      {team.game}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-3">
                    <p className="text-sm text-gray-400">
                      Created {new Date(team.created_at).toLocaleDateString()}
                    </p>
                    <button className="text-primary hover:text-primary-light text-sm">
                      Manage →
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-400 text-center py-4 col-span-full">No teams yet</p>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
