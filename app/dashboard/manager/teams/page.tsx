import { createClient } from '@/lib/supabase/server'
import { requireRole } from '@/lib/auth/server'
import Navbar from '@/components/Navbar'
import { Shield, Users, Calendar, Clock, Plus, Search, Trophy } from 'lucide-react'
import Link from 'next/link'

export default async function ManagerTeamsPage() {
  // Require manager role
  const user = await requireRole(['manager'])
  
  const supabase = await createClient()

  // Get all teams with player counts
  const { data: teams } = await supabase
    .from('teams')
    .select(`
      *,
      profiles(id)
    `)
    .order('created_at', { ascending: false })

  // Get upcoming matches for scheduling overview
  const { data: upcomingMatches } = await supabase
    .from('matches')
    .select('*, teams(name)')
    .gte('scheduled_at', new Date().toISOString())
    .order('scheduled_at', { ascending: true })
    .limit(10)

  // Get tryouts
  const { data: tryouts } = await supabase
    .from('tryouts')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5)

  return (
    <div className="min-h-screen bg-dark">
      <Navbar role={user.role} username={user.username} />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            Team & Roster Management
          </h1>
          <p className="text-gray-400">Manage teams, schedules, and tryouts</p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Link href="/dashboard/manager/teams/new">
            <button className="w-full p-4 bg-dark-card border border-gray-800 hover:border-primary rounded-lg text-left transition group">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/20 rounded-lg group-hover:bg-primary/30 transition">
                  <Shield className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-white">Create Team</p>
                  <p className="text-sm text-gray-400">Add a new team</p>
                </div>
              </div>
            </button>
          </Link>
          
          <Link href="/dashboard/manager/teams/schedule">
            <button className="w-full p-4 bg-dark-card border border-gray-800 hover:border-primary rounded-lg text-left transition group">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/20 rounded-lg group-hover:bg-primary/30 transition">
                  <Calendar className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-white">Schedule Match</p>
                  <p className="text-sm text-gray-400">Plan upcoming games</p>
                </div>
              </div>
            </button>
          </Link>

          <Link href="/dashboard/manager/teams/tryouts">
            <button className="w-full p-4 bg-dark-card border border-gray-800 hover:border-primary rounded-lg text-left transition group">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/20 rounded-lg group-hover:bg-primary/30 transition">
                  <Search className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-white">Manage Tryouts</p>
                  <p className="text-sm text-gray-400">Scout new talent</p>
                </div>
              </div>
            </button>
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Teams Overview */}
          <div className="bg-dark-card border border-gray-800 rounded-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-white">Teams</h2>
              <Link href="/dashboard/manager/teams/new">
                <button className="px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg transition text-sm">
                  Add Team
                </button>
              </Link>
            </div>
            
            <div className="space-y-4">
              {teams && teams.length > 0 ? (
                teams.map((team) => (
                  <div
                    key={team.id}
                    className="p-4 bg-dark rounded-lg border border-gray-800 hover:border-primary/50 transition"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center">
                          <Shield className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-medium text-white">{team.name}</h3>
                          <p className="text-sm text-gray-400">{team.game}</p>
                        </div>
                      </div>
                      <Link href={`/dashboard/manager/teams/${team.id}`}>
                        <button className="text-primary hover:text-primary-light text-sm">
                          Manage
                        </button>
                      </Link>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2 text-gray-400">
                        <Users className="w-4 h-4" />
                        <span>{team.profiles?.length || 0} players</span>
                      </div>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        team.status === 'active' 
                          ? 'bg-green-500/20 text-green-400'
                          : 'bg-gray-500/20 text-gray-400'
                      }`}>
                        {team.status || 'active'}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <Shield className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-400 mb-4">No teams created yet</p>
                  <Link href="/dashboard/manager/teams/new">
                    <button className="px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg transition">
                      Create First Team
                    </button>
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Upcoming Matches */}
          <div className="bg-dark-card border border-gray-800 rounded-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-white">Upcoming Matches</h2>
              <Link href="/dashboard/manager/teams/schedule">
                <button className="px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg transition text-sm">
                  Schedule Match
                </button>
              </Link>
            </div>
            
            <div className="space-y-4">
              {upcomingMatches && upcomingMatches.length > 0 ? (
                upcomingMatches.map((match) => (
                  <div
                    key={match.id}
                    className="p-4 bg-dark rounded-lg border border-gray-800"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium text-white">
                        {match.teams?.name} vs {match.opponent}
                      </h3>
                      <div className="flex items-center gap-1 text-gray-400 text-sm">
                        <Clock className="w-4 h-4" />
                        <span>{new Date(match.scheduled_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <p className="text-sm text-gray-400">{match.tournament}</p>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-400 mb-4">No upcoming matches</p>
                  <Link href="/dashboard/manager/teams/schedule">
                    <button className="px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg transition">
                      Schedule Match
                    </button>
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Recent Tryouts */}
          <div className="bg-dark-card border border-gray-800 rounded-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-white">Recent Tryouts</h2>
              <Link href="/dashboard/manager/teams/tryouts">
                <button className="px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg transition text-sm">
                  Manage Tryouts
                </button>
              </Link>
            </div>
            
            <div className="space-y-4">
              {tryouts && tryouts.length > 0 ? (
                tryouts.map((tryout) => (
                  <div
                    key={tryout.id}
                    className="p-4 bg-dark rounded-lg border border-gray-800"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium text-white">{tryout.title}</h3>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        tryout.status === 'open' 
                          ? 'bg-green-500/20 text-green-400'
                          : tryout.status === 'in_progress'
                          ? 'bg-yellow-500/20 text-yellow-400'
                          : 'bg-gray-500/20 text-gray-400'
                      }`}>
                        {tryout.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-400">{tryout.description}</p>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-400 mb-4">No tryouts scheduled</p>
                  <Link href="/dashboard/manager/teams/tryouts">
                    <button className="px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg transition">
                      Create Tryout
                    </button>
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Team Performance Overview */}
          <div className="bg-dark-card border border-gray-800 rounded-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-white">Performance Overview</h2>
              <Link href="/dashboard/manager/stats">
                <button className="px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg transition text-sm">
                  View Details
                </button>
              </Link>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-dark rounded-lg border border-gray-800">
                <div className="flex items-center gap-3">
                  <Trophy className="w-5 h-5 text-primary" />
                  <span className="text-white">Win Rate</span>
                </div>
                <span className="text-green-400 font-medium">75%</span>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-dark rounded-lg border border-gray-800">
                <div className="flex items-center gap-3">
                  <Users className="w-5 h-5 text-primary" />
                  <span className="text-white">Active Players</span>
                </div>
                <span className="text-blue-400 font-medium">{teams?.reduce((acc, team) => acc + (team.profiles?.length || 0), 0) || 0}</span>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-dark rounded-lg border border-gray-800">
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-primary" />
                  <span className="text-white">Matches This Month</span>
                </div>
                <span className="text-yellow-400 font-medium">{upcomingMatches?.length || 0}</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}