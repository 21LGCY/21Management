import { createClient } from '@/lib/supabase/server'
import { requireRole } from '@/lib/auth/server'
import NavbarWrapper from '@/components/NavbarWrapper'
import { Trophy, Target, Crosshair, Shield, Zap, Award, TrendingUp, BarChart3 } from 'lucide-react'

export default async function PlayerStatsPage() {
  const user = await requireRole(['player'])
  const supabase = await createClient()

  // Get player data
  const { data: playerData } = await supabase
    .from('profiles')
    .select('*, teams(name, game)')
    .eq('id', user.user_id)
    .single()

  // Get all matches for player's team
  const { data: allMatches } = await supabase
    .from('matches')
    .select('*, teams(name)')
    .eq('team_id', playerData?.team_id || '')
    .order('scheduled_at', { ascending: false })

  // Get player match stats
  const { data: playerMatchStats } = await supabase
    .from('player_match_stats')
    .select('*, match_history(match_date, opponent_name, result)')
    .eq('player_id', user.user_id)
    .order('match_history(match_date)', { ascending: false })
    .limit(20)

  // Calculate statistics
  const totalMatches = playerMatchStats?.length || 0
  const wins = playerMatchStats?.filter(s => s.match_history?.result === 'win').length || 0
  const winRate = totalMatches > 0 ? Math.round((wins / totalMatches) * 100) : 0

  // Calculate averages
  const avgKills = totalMatches > 0 
    ? (playerMatchStats?.reduce((sum, s) => sum + (s.kills || 0), 0) || 0) / totalMatches 
    : 0
  const avgDeaths = totalMatches > 0 
    ? (playerMatchStats?.reduce((sum, s) => sum + (s.deaths || 0), 0) || 0) / totalMatches 
    : 0
  const avgAssists = totalMatches > 0 
    ? (playerMatchStats?.reduce((sum, s) => sum + (s.assists || 0), 0) || 0) / totalMatches 
    : 0
  const avgACS = totalMatches > 0 
    ? (playerMatchStats?.reduce((sum, s) => sum + (s.acs || 0), 0) || 0) / totalMatches 
    : 0
  const avgHS = totalMatches > 0 
    ? (playerMatchStats?.reduce((sum, s) => sum + (s.headshot_percentage || 0), 0) || 0) / totalMatches 
    : 0
  const avgFirstKills = totalMatches > 0 
    ? (playerMatchStats?.reduce((sum, s) => sum + (s.first_kills || 0), 0) || 0) / totalMatches 
    : 0
  const kd = avgDeaths > 0 ? avgKills / avgDeaths : avgKills

  // Get most played agents
  const agentStats = playerMatchStats?.reduce((acc: any, stat) => {
    const agent = stat.agent_played || 'Unknown'
    if (!acc[agent]) {
      acc[agent] = { count: 0, kills: 0, deaths: 0, acs: 0 }
    }
    acc[agent].count++
    acc[agent].kills += stat.kills || 0
    acc[agent].deaths += stat.deaths || 0
    acc[agent].acs += stat.acs || 0
    return acc
  }, {})

  const topAgents = Object.entries(agentStats || {})
    .map(([agent, data]: [string, any]) => ({
      agent,
      games: data.count,
      avgKills: (data.kills / data.count).toFixed(1),
      avgDeaths: (data.deaths / data.count).toFixed(1),
      avgACS: Math.round(data.acs / data.count)
    }))
    .sort((a, b) => b.games - a.games)
    .slice(0, 5)

  return (
    <div className="min-h-screen bg-dark">
      <NavbarWrapper role={user.role} username={user.username} userId={user.user_id} avatarUrl={user.avatar_url} />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            <span className="text-gradient">Player Statistics</span>
          </h1>
          <p className="text-gray-400">Detailed performance metrics and analytics</p>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-gradient-to-br from-green-500/10 to-dark border border-green-500/30 rounded-xl p-8 hover:border-green-500/50 transition-all hover:shadow-lg hover:shadow-green-500/20">
            <div className="flex items-center justify-between mb-4">
              <div className="p-4 bg-green-500/20 rounded-xl">
                <Trophy className="w-8 h-8 text-green-400" />
              </div>
              <div className="text-right">
                <p className="text-sm text-green-300/70 mb-1">Total Matches</p>
                <p className="text-lg font-bold text-green-400">{totalMatches}</p>
              </div>
            </div>
            <p className="text-5xl font-bold text-green-400 mb-2">{winRate}%</p>
            <p className="text-sm text-green-300/70 mb-3">Win Rate</p>
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-400"></div>
                <span className="text-gray-300">{wins} Wins</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-400"></div>
                <span className="text-gray-300">{totalMatches - wins} Losses</span>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-500/10 to-dark border border-blue-500/30 rounded-xl p-8 hover:border-blue-500/50 transition-all hover:shadow-lg hover:shadow-blue-500/20">
            <div className="flex items-center justify-between mb-4">
              <div className="p-4 bg-blue-500/20 rounded-xl">
                <Target className="w-8 h-8 text-blue-400" />
              </div>
              <div className="text-right">
                <p className="text-sm text-blue-300/70 mb-1">Performance</p>
                <p className="text-lg font-bold text-blue-400">Rating</p>
              </div>
            </div>
            <p className="text-5xl font-bold text-blue-400 mb-2">{kd.toFixed(2)}</p>
            <p className="text-sm text-blue-300/70 mb-3">K/D Ratio</p>
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-400"></div>
                <span className="text-gray-300">{avgKills.toFixed(1)} Avg Kills</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-400"></div>
                <span className="text-gray-300">{avgDeaths.toFixed(1)} Avg Deaths</span>
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Stats Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Agent Performance */}
          <div className="bg-dark-card border border-gray-800 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <Shield className="w-6 h-6 text-primary" />
              <div>
                <h2 className="text-xl font-semibold text-white">Top Agents</h2>
                <p className="text-sm text-gray-400">Most played agents and performance</p>
              </div>
            </div>
            
            {topAgents.length > 0 ? (
              <div className="space-y-3">
                {topAgents.map((agent, index) => (
                  <div 
                    key={agent.agent}
                    className="bg-dark border border-gray-800 rounded-lg p-4 hover:border-primary/50 transition-all"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center">
                          <span className="text-primary font-bold text-sm">#{index + 1}</span>
                        </div>
                        <div>
                          <p className="font-medium text-white">{agent.agent}</p>
                          <p className="text-xs text-gray-400">{agent.games} games</p>
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-3 mt-3">
                      <div className="text-center">
                        <p className="text-sm font-bold text-blue-400">{agent.avgKills}</p>
                        <p className="text-xs text-gray-500">K</p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-bold text-red-400">{agent.avgDeaths}</p>
                        <p className="text-xs text-gray-500">D</p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-bold text-purple-400">{agent.avgACS}</p>
                        <p className="text-xs text-gray-500">ACS</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Shield className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-400">No agent data available</p>
              </div>
            )}
          </div>

          {/* Match Performance Breakdown */}
          <div className="bg-dark-card border border-gray-800 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <TrendingUp className="w-6 h-6 text-primary" />
              <div>
                <h2 className="text-xl font-semibold text-white">Performance Breakdown</h2>
                <p className="text-sm text-gray-400">Average stats per match</p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-gradient-to-br from-blue-500/5 to-dark border border-blue-500/20 rounded-xl p-5 hover:border-blue-500/40 transition-all">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-500/20 rounded-lg">
                      <Target className="w-5 h-5 text-blue-400" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Kills</p>
                      <p className="text-2xl font-bold text-blue-400">{avgKills.toFixed(1)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">Per Match</p>
                    <p className="text-sm text-blue-300">{Math.round((avgKills / 25) * 100)}%</p>
                  </div>
                </div>
                <div className="w-full bg-dark rounded-full h-3 overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-blue-600 via-blue-500 to-blue-400 h-3 rounded-full transition-all duration-500 shadow-lg shadow-blue-500/50"
                    style={{ width: `${Math.min((avgKills / 25) * 100, 100)}%` }}
                  />
                </div>
              </div>

              <div className="bg-gradient-to-br from-red-500/5 to-dark border border-red-500/20 rounded-xl p-5 hover:border-red-500/40 transition-all">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-red-500/20 rounded-lg">
                      <Shield className="w-5 h-5 text-red-400" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Deaths</p>
                      <p className="text-2xl font-bold text-red-400">{avgDeaths.toFixed(1)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">Per Match</p>
                    <p className="text-sm text-red-300">{Math.round((avgDeaths / 25) * 100)}%</p>
                  </div>
                </div>
                <div className="w-full bg-dark rounded-full h-3 overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-red-600 via-red-500 to-red-400 h-3 rounded-full transition-all duration-500 shadow-lg shadow-red-500/50"
                    style={{ width: `${Math.min((avgDeaths / 25) * 100, 100)}%` }}
                  />
                </div>
              </div>

              <div className="bg-gradient-to-br from-green-500/5 to-dark border border-green-500/20 rounded-xl p-5 hover:border-green-500/40 transition-all">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-500/20 rounded-lg">
                      <Award className="w-5 h-5 text-green-400" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Assists</p>
                      <p className="text-2xl font-bold text-green-400">{avgAssists.toFixed(1)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">Per Match</p>
                    <p className="text-sm text-green-300">{Math.round((avgAssists / 15) * 100)}%</p>
                  </div>
                </div>
                <div className="w-full bg-dark rounded-full h-3 overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-green-600 via-green-500 to-green-400 h-3 rounded-full transition-all duration-500 shadow-lg shadow-green-500/50"
                    style={{ width: `${Math.min((avgAssists / 15) * 100, 100)}%` }}
                  />
                </div>
              </div>

              <div className="bg-gradient-to-br from-purple-500/5 to-dark border border-purple-500/20 rounded-xl p-5 hover:border-purple-500/40 transition-all">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-500/20 rounded-lg">
                      <BarChart3 className="w-5 h-5 text-purple-400" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Combat Score</p>
                      <p className="text-2xl font-bold text-purple-400">{Math.round(avgACS)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">ACS Rating</p>
                    <p className="text-sm text-purple-300">{Math.round((avgACS / 300) * 100)}%</p>
                  </div>
                </div>
                <div className="w-full bg-dark rounded-full h-3 overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-purple-600 via-purple-500 to-purple-400 h-3 rounded-full transition-all duration-500 shadow-lg shadow-purple-500/50"
                    style={{ width: `${Math.min((avgACS / 300) * 100, 100)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Match History */}
        <div className="bg-dark-card border border-gray-800 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <Trophy className="w-6 h-6 text-primary" />
            <div>
              <h2 className="text-xl font-semibold text-white">Recent Match Performance</h2>
              <p className="text-sm text-gray-400">Last {Math.min(playerMatchStats?.length || 0, 10)} matches</p>
            </div>
          </div>

          {playerMatchStats && playerMatchStats.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-800">
                    <th className="text-left text-xs font-medium text-gray-400 pb-3">Date</th>
                    <th className="text-left text-xs font-medium text-gray-400 pb-3">Opponent</th>
                    <th className="text-center text-xs font-medium text-gray-400 pb-3">Agent</th>
                    <th className="text-center text-xs font-medium text-gray-400 pb-3">K/D/A</th>
                    <th className="text-center text-xs font-medium text-gray-400 pb-3">ACS</th>
                    <th className="text-center text-xs font-medium text-gray-400 pb-3">Result</th>
                  </tr>
                </thead>
                <tbody>
                  {playerMatchStats.slice(0, 10).map((stat) => (
                    <tr key={stat.id} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition">
                      <td className="py-3 text-sm text-gray-300">
                        {stat.match_history?.match_date 
                          ? new Date(stat.match_history.match_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                          : '-'}
                      </td>
                      <td className="py-3 text-sm text-white">
                        {stat.match_history?.opponent_name || 'Unknown'}
                      </td>
                      <td className="py-3 text-sm text-center text-gray-300">
                        {stat.agent_played || '-'}
                      </td>
                      <td className="py-3 text-sm text-center font-medium text-white">
                        <span className="text-blue-400">{stat.kills}</span>/
                        <span className="text-red-400">{stat.deaths}</span>/
                        <span className="text-green-400">{stat.assists}</span>
                      </td>
                      <td className="py-3 text-sm text-center font-bold text-purple-400">
                        {stat.acs}
                      </td>
                      <td className="py-3 text-center">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          stat.match_history?.result === 'win'
                            ? 'bg-green-500/20 text-green-400'
                            : stat.match_history?.result === 'loss'
                            ? 'bg-red-500/20 text-red-400'
                            : 'bg-gray-500/20 text-gray-400'
                        }`}>
                          {stat.match_history?.result?.toUpperCase() || 'N/A'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <Trophy className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-400">No match statistics available</p>
              <p className="text-sm text-gray-500 mt-1">Stats will appear once matches are recorded</p>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
