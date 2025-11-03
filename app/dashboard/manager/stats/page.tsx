import { createClient } from '@/lib/supabase/server'
import { requireManagerTeamAccess } from '@/lib/auth/team-access'
import Navbar from '@/components/Navbar'
import { TrendingUp, Target, Award, BarChart3, Plus, Filter, Download, Users, Trophy, Calendar } from 'lucide-react'
import Link from 'next/link'

export default async function ManagerStatsPage() {
  // Require manager role and get team access
  const { user, teamId, team } = await requireManagerTeamAccess()
  
  const supabase = await createClient()

  // Get match statistics for manager's team only
  const { data: matches } = await supabase
    .from('matches')
    .select('*, teams(name)')
    .eq('team_id', teamId)
    .order('scheduled_at', { ascending: false })
    .limit(20)

  // Get player statistics for manager's team only
  const { data: players } = await supabase
    .from('profiles')
    .select('*, teams(name)')
    .eq('role', 'player')
    .eq('team_id', teamId)
    .order('created_at', { ascending: false })

  // Calculate some basic stats
  const totalMatches = matches?.length || 0
  const wins = matches?.filter(m => m.result === 'win').length || 0
  const losses = matches?.filter(m => m.result === 'loss').length || 0
  const winRate = totalMatches > 0 ? Math.round((wins / totalMatches) * 100) : 0

  return (
    <div className="min-h-screen bg-dark">
      <Navbar role={user.role} username={user.username} />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            Statistics Management
          </h1>
          <p className="text-gray-400">Track and manage {team?.name || 'your team'} performance data</p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Link href="/dashboard/manager/stats/game/new">
            <button className="w-full p-4 bg-dark-card border border-gray-800 hover:border-primary rounded-lg text-left transition group">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/20 rounded-lg group-hover:bg-primary/30 transition">
                  <Plus className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-white">Add Game Stats</p>
                  <p className="text-sm text-gray-400">Record match results</p>
                </div>
              </div>
            </button>
          </Link>
          
          <Link href="/dashboard/manager/stats/player/new">
            <button className="w-full p-4 bg-dark-card border border-gray-800 hover:border-primary rounded-lg text-left transition group">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/20 rounded-lg group-hover:bg-primary/30 transition">
                  <Target className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-white">Add Player Stats</p>
                  <p className="text-sm text-gray-400">Track individual performance</p>
                </div>
              </div>
            </button>
          </Link>

          <button className="w-full p-4 bg-dark-card border border-gray-800 hover:border-primary rounded-lg text-left transition group">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/20 rounded-lg group-hover:bg-primary/30 transition">
                <BarChart3 className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-medium text-white">Generate Report</p>
                <p className="text-sm text-gray-400">Create analytics report</p>
              </div>
            </div>
          </button>

          <button className="w-full p-4 bg-dark-card border border-gray-800 hover:border-primary rounded-lg text-left transition group">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/20 rounded-lg group-hover:bg-primary/30 transition">
                <Download className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-medium text-white">Export Data</p>
                <p className="text-sm text-gray-400">Download statistics</p>
              </div>
            </div>
          </button>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-dark-card border border-gray-800 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-2">
              <Trophy className="w-6 h-6 text-primary" />
              <h3 className="font-semibold text-white">Win Rate</h3>
            </div>
            <p className="text-3xl font-bold text-green-400">{winRate}%</p>
            <p className="text-sm text-gray-400">{wins}W - {losses}L</p>
          </div>

          <div className="bg-dark-card border border-gray-800 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-2">
              <Calendar className="w-6 h-6 text-primary" />
              <h3 className="font-semibold text-white">Total Matches</h3>
            </div>
            <p className="text-3xl font-bold text-white">{totalMatches}</p>
            <p className="text-sm text-gray-400">This season</p>
          </div>

          <div className="bg-dark-card border border-gray-800 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-2">
              <Users className="w-6 h-6 text-primary" />
              <h3 className="font-semibold text-white">Active Players</h3>
            </div>
            <p className="text-3xl font-bold text-white">{players?.length || 0}</p>
            <p className="text-sm text-gray-400">Tracked players</p>
          </div>

          <div className="bg-dark-card border border-gray-800 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-2">
              <TrendingUp className="w-6 h-6 text-primary" />
              <h3 className="font-semibold text-white">Performance</h3>
            </div>
            <p className="text-3xl font-bold text-blue-400">↗ 12%</p>
            <p className="text-sm text-gray-400">vs last month</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Game Statistics */}
          <div className="bg-dark-card border border-gray-800 rounded-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-white">Recent Game Statistics</h2>
              <div className="flex gap-2">
                <button className="px-3 py-1 bg-dark border border-gray-700 rounded text-sm text-gray-400 hover:text-white">
                  <Filter className="w-4 h-4" />
                </button>
                <Link href="/dashboard/manager/stats/game/new">
                  <button className="px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg transition text-sm">
                    Add Game
                  </button>
                </Link>
              </div>
            </div>
            
            <div className="space-y-4">
              {matches && matches.length > 0 ? (
                matches.slice(0, 10).map((match) => (
                  <div
                    key={match.id}
                    className="p-4 bg-dark rounded-lg border border-gray-800"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <h3 className="font-medium text-white">
                          {match.teams?.name} vs {match.opponent}
                        </h3>
                        <p className="text-sm text-gray-400">{match.tournament}</p>
                      </div>
                      <div className="text-right">
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            match.result === 'win'
                              ? 'bg-green-500/20 text-green-400'
                              : match.result === 'loss'
                              ? 'bg-red-500/20 text-red-400'
                              : 'bg-gray-500/20 text-gray-400'
                          }`}
                        >
                          {match.result || 'TBD'}
                        </span>
                        <p className="text-xs text-gray-400 mt-1">
                          {new Date(match.scheduled_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    {match.score && (
                      <p className="text-sm text-gray-300">Score: {match.score}</p>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <Trophy className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-400 mb-4">No game statistics recorded</p>
                  <Link href="/dashboard/manager/stats/game/new">
                    <button className="px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg transition">
                      Record First Game
                    </button>
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Player Performance */}
          <div className="bg-dark-card border border-gray-800 rounded-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-white">Player Performance</h2>
              <div className="flex gap-2">
                <div className="flex items-center gap-2 px-3 py-1 bg-dark border border-gray-700 rounded text-sm text-gray-400">
                  <Users className="w-4 h-4" />
                  <span>{team?.name || 'Your Team'}</span>
                </div>
                <Link href="/dashboard/manager/stats/player/new">
                  <button className="px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg transition text-sm">
                    Add Stats
                  </button>
                </Link>
              </div>
            </div>
            
            <div className="space-y-4">
              {players && players.length > 0 ? (
                players.slice(0, 8).map((player) => (
                  <div
                    key={player.id}
                    className="p-4 bg-dark rounded-lg border border-gray-800"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center">
                          <Users className="w-4 h-4 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-white">{player.username}</p>
                          <p className="text-sm text-gray-400">{player.teams?.name}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex gap-4 text-sm">
                          <div>
                            <p className="text-gray-400">KDA</p>
                            <p className="text-white font-medium">2.4</p>
                          </div>
                          <div>
                            <p className="text-gray-400">Avg Score</p>
                            <p className="text-white font-medium">1450</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-400 mb-4">No player statistics recorded</p>
                  <Link href="/dashboard/manager/stats/player/new">
                    <button className="px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg transition">
                      Add Player Stats
                    </button>
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Performance Analytics */}
          <div className="bg-dark-card border border-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-white mb-6">Performance Analytics</h2>
            
            <div className="space-y-4">
              <div className="p-4 bg-dark rounded-lg border border-gray-800">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-400">Team Average KDA</span>
                  <span className="text-green-400 font-medium">2.1</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div className="bg-green-400 h-2 rounded-full" style={{ width: '70%' }}></div>
                </div>
              </div>

              <div className="p-4 bg-dark rounded-lg border border-gray-800">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-400">Objective Control</span>
                  <span className="text-blue-400 font-medium">68%</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div className="bg-blue-400 h-2 rounded-full" style={{ width: '68%' }}></div>
                </div>
              </div>

              <div className="p-4 bg-dark rounded-lg border border-gray-800">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-400">First Blood Rate</span>
                  <span className="text-yellow-400 font-medium">45%</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div className="bg-yellow-400 h-2 rounded-full" style={{ width: '45%' }}></div>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Activities */}
          <div className="bg-dark-card border border-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-white mb-6">Recent Activities</h2>
            
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-green-400 rounded-full mt-2"></div>
                <div>
                  <p className="text-white text-sm">Game statistics updated for Team Alpha vs Beta</p>
                  <p className="text-gray-400 text-xs">2 hours ago</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-blue-400 rounded-full mt-2"></div>
                <div>
                  <p className="text-white text-sm">Player performance data added for 5 players</p>
                  <p className="text-gray-400 text-xs">5 hours ago</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-yellow-400 rounded-full mt-2"></div>
                <div>
                  <p className="text-white text-sm">Monthly report generated</p>
                  <p className="text-gray-400 text-xs">1 day ago</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-purple-400 rounded-full mt-2"></div>
                <div>
                  <p className="text-white text-sm">Tournament stats compiled</p>
                  <p className="text-gray-400 text-xs">2 days ago</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}