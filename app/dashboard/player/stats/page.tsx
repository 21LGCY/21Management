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

  // Calculate totals and averages
  const totalKills = playerMatchStats?.reduce((sum, s) => sum + (s.kills || 0), 0) || 0
  const totalDeaths = playerMatchStats?.reduce((sum, s) => sum + (s.deaths || 0), 0) || 0
  const totalAssists = playerMatchStats?.reduce((sum, s) => sum + (s.assists || 0), 0) || 0
  
  const avgKills = totalMatches > 0 ? totalKills / totalMatches : 0
  const avgDeaths = totalMatches > 0 ? totalDeaths / totalMatches : 0
  const avgAssists = totalMatches > 0 ? totalAssists / totalMatches : 0
  const avgACS = totalMatches > 0 
    ? (playerMatchStats?.reduce((sum, s) => sum + (s.acs || 0), 0) || 0) / totalMatches 
    : 0
  const avgHS = totalMatches > 0 
    ? (playerMatchStats?.reduce((sum, s) => sum + (s.headshot_percentage || 0), 0) || 0) / totalMatches 
    : 0
  const avgFirstKills = totalMatches > 0 
    ? (playerMatchStats?.reduce((sum, s) => sum + (s.first_kills || 0), 0) || 0) / totalMatches 
    : 0
  
  // Calculate overall KDA
  const overallKDA = totalDeaths > 0 ? ((totalKills + totalAssists) / totalDeaths).toFixed(2) : (totalKills + totalAssists).toFixed(2)
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
        <div className="mb-10">
          <h1 className="text-4xl font-bold text-white mb-3">
            Player Statistics
          </h1>
          <p className="text-gray-400 text-lg">Track your performance and improvement over time</p>
        </div>

        {/* Detailed Stats Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Agent Performance */}
          <div className="bg-gradient-to-br from-dark-card to-gray-900/50 border border-gray-800 rounded-2xl p-8 shadow-xl">
            <div className="flex items-center gap-3 mb-8">
              <div className="p-3 bg-primary/10 rounded-xl">
                <Trophy className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Top Agents</h2>
                <p className="text-sm text-gray-500">Most played champions</p>
              </div>
            </div>
            
            {topAgents.length > 0 ? (
              <div className="space-y-4">
                {topAgents.map((agent, index) => (
                  <div 
                    key={agent.agent}
                    className="group bg-dark/50 border border-gray-800 rounded-xl p-5 hover:border-primary/30 hover:bg-dark/70 transition-all duration-300"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-gradient-to-br from-primary/20 to-primary/5 rounded-lg flex items-center justify-center group-hover:from-primary/30 group-hover:to-primary/10 transition-all">
                          <span className="text-primary font-bold text-lg">#{index + 1}</span>
                        </div>
                        <div>
                          <p className="font-semibold text-white text-lg">{agent.agent}</p>
                          <p className="text-sm text-gray-500">{agent.games} matches played</p>
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="bg-blue-500/5 border border-blue-500/20 rounded-lg p-3 text-center">
                        <p className="text-xl font-bold text-blue-400">{agent.avgKills}</p>
                        <p className="text-xs text-gray-500 uppercase tracking-wider mt-1">Kills</p>
                      </div>
                      <div className="bg-red-500/5 border border-red-500/20 rounded-lg p-3 text-center">
                        <p className="text-xl font-bold text-red-400">{agent.avgDeaths}</p>
                        <p className="text-xs text-gray-500 uppercase tracking-wider mt-1">Deaths</p>
                      </div>
                      <div className="bg-purple-500/5 border border-purple-500/20 rounded-lg p-3 text-center">
                        <p className="text-xl font-bold text-purple-400">{agent.avgACS}</p>
                        <p className="text-xs text-gray-500 uppercase tracking-wider mt-1">ACS</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <Trophy className="w-16 h-16 text-gray-600 mx-auto mb-4 opacity-50" />
                <p className="text-gray-500 text-lg">No agent data available</p>
                <p className="text-gray-600 text-sm mt-2">Play matches to see your agent statistics</p>
              </div>
            )}
          </div>

          {/* Match Performance Breakdown */}
          <div className="bg-gradient-to-br from-dark-card to-gray-900/50 border border-gray-800 rounded-2xl p-8 shadow-xl">
            <div className="flex items-center gap-3 mb-8">
              <div className="p-3 bg-primary/10 rounded-xl">
                <BarChart3 className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Performance Breakdown</h2>
                <p className="text-sm text-gray-500">Average stats per match</p>
              </div>
            </div>

            <div className="space-y-5">
              <div className="bg-dark/50 border border-gray-800 rounded-xl p-5 hover:border-blue-500/30 hover:bg-dark/70 transition-all duration-300">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-gray-400 uppercase tracking-wider">Kills</span>
                  <span className="text-2xl font-bold text-blue-400">{avgKills.toFixed(1)}</span>
                </div>
                <div className="w-full bg-gray-900 rounded-full h-2.5 overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-blue-600 to-blue-400 h-2.5 rounded-full transition-all duration-700 ease-out"
                    style={{ width: `${Math.min((avgKills / 25) * 100, 100)}%` }}
                  />
                </div>
              </div>

              <div className="bg-dark/50 border border-gray-800 rounded-xl p-5 hover:border-red-500/30 hover:bg-dark/70 transition-all duration-300">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-gray-400 uppercase tracking-wider">Deaths</span>
                  <span className="text-2xl font-bold text-red-400">{avgDeaths.toFixed(1)}</span>
                </div>
                <div className="w-full bg-gray-900 rounded-full h-2.5 overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-red-600 to-red-400 h-2.5 rounded-full transition-all duration-700 ease-out"
                    style={{ width: `${Math.min((avgDeaths / 25) * 100, 100)}%` }}
                  />
                </div>
              </div>

              <div className="bg-dark/50 border border-gray-800 rounded-xl p-5 hover:border-green-500/30 hover:bg-dark/70 transition-all duration-300">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-gray-400 uppercase tracking-wider">Assists</span>
                  <span className="text-2xl font-bold text-green-400">{avgAssists.toFixed(1)}</span>
                </div>
                <div className="w-full bg-gray-900 rounded-full h-2.5 overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-green-600 to-green-400 h-2.5 rounded-full transition-all duration-700 ease-out"
                    style={{ width: `${Math.min((avgAssists / 15) * 100, 100)}%` }}
                  />
                </div>
              </div>

              <div className="bg-dark/50 border border-gray-800 rounded-xl p-5 hover:border-purple-500/30 hover:bg-dark/70 transition-all duration-300">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-gray-400 uppercase tracking-wider">Combat Score</span>
                  <span className="text-2xl font-bold text-purple-400">{Math.round(avgACS)}</span>
                </div>
                <div className="w-full bg-gray-900 rounded-full h-2.5 overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-purple-600 to-purple-400 h-2.5 rounded-full transition-all duration-700 ease-out"
                    style={{ width: `${Math.min((avgACS / 300) * 100, 100)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Match History */}
        <div className="bg-gradient-to-br from-dark-card to-gray-900/50 border border-gray-800 rounded-2xl shadow-xl overflow-hidden">
          <div className="bg-dark/30 border-b border-gray-800 p-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-primary/10 rounded-xl">
                  <Target className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">Recent Match Performance</h2>
                  <p className="text-sm text-gray-500">Last {Math.min(playerMatchStats?.length || 0, 10)} matches</p>
                </div>
              </div>
              
              {/* Summary Stats */}
              <div className="flex items-center gap-4">
                <div className="text-center px-6 py-3 bg-dark/70 border border-gray-800 rounded-xl hover:border-gray-700 transition-colors">
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-1.5">Win Rate</p>
                  <p className="text-2xl font-bold text-white">{winRate}%</p>
                </div>
                <div className="text-center px-6 py-3 bg-dark/70 border border-gray-800 rounded-xl hover:border-gray-700 transition-colors">
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-1.5">Overall KDA</p>
                  <p className="text-2xl font-bold text-white">{overallKDA}</p>
                </div>
                <div className="text-center px-6 py-3 bg-dark/70 border border-gray-800 rounded-xl hover:border-gray-700 transition-colors">
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-1.5">Avg ACS</p>
                  <p className="text-2xl font-bold text-white">{Math.round(avgACS)}</p>
                </div>
              </div>
            </div>
          </div>

          {playerMatchStats && playerMatchStats.length > 0 ? (
            <div className="p-8">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b-2 border-gray-800">
                      <th className="text-left text-xs font-bold text-gray-400 uppercase tracking-wider pb-4 pl-2">Date</th>
                      <th className="text-left text-xs font-bold text-gray-400 uppercase tracking-wider pb-4">Opponent</th>
                      <th className="text-center text-xs font-bold text-gray-400 uppercase tracking-wider pb-4">Agent</th>
                      <th className="text-center text-xs font-bold text-gray-400 uppercase tracking-wider pb-4">K/D/A</th>
                      <th className="text-center text-xs font-bold text-gray-400 uppercase tracking-wider pb-4">ACS</th>
                      <th className="text-center text-xs font-bold text-gray-400 uppercase tracking-wider pb-4 pr-2">Result</th>
                    </tr>
                  </thead>
                  <tbody>
                    {playerMatchStats.slice(0, 10).map((stat, index) => (
                      <tr 
                        key={stat.id} 
                        className={`border-b border-gray-800/50 hover:bg-dark/50 transition-all duration-200 group ${
                          index === playerMatchStats.slice(0, 10).length - 1 ? 'border-b-0' : ''
                        }`}
                      >
                        <td className="py-4 pl-2">
                          <div className="flex items-center gap-3">
                            <div className="w-1 h-8 bg-primary/30 rounded-full group-hover:bg-primary/50 transition-colors"></div>
                            <span className="text-sm text-gray-400 font-medium">
                              {stat.match_history?.match_date 
                                ? new Date(stat.match_history.match_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                                : '-'}
                            </span>
                          </div>
                        </td>
                        <td className="py-4">
                          <span className="text-sm text-white font-semibold">
                            {stat.match_history?.opponent_name || 'Unknown'}
                          </span>
                        </td>
                        <td className="py-4 text-center">
                          <span className="inline-block text-sm text-gray-300 bg-dark/70 border border-gray-800 px-3 py-1.5 rounded-lg font-medium">
                            {stat.agent_played || '-'}
                          </span>
                        </td>
                        <td className="py-4 text-center">
                          <span className="text-sm font-semibold text-white">
                            {stat.kills}
                            <span className="text-gray-600 mx-1">/</span>
                            {stat.deaths}
                            <span className="text-gray-600 mx-1">/</span>
                            {stat.assists}
                          </span>
                        </td>
                        <td className="py-4 text-center">
                          <span className="text-sm font-bold text-white">
                            {stat.acs}
                          </span>
                        </td>
                        <td className="py-4 text-center pr-2">
                          <span className={`inline-block px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider ${
                            stat.match_history?.result === 'win'
                              ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                              : stat.match_history?.result === 'loss'
                              ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                              : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
                          }`}>
                            {stat.match_history?.result || 'N/A'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="text-center py-20">
              <Target className="w-16 h-16 text-gray-600 mx-auto mb-4 opacity-50" />
              <p className="text-gray-500 text-lg font-medium">No match statistics available</p>
              <p className="text-gray-600 text-sm mt-2">Stats will appear once matches are recorded</p>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
