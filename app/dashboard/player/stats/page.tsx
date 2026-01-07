import { createClient } from '@/lib/supabase/server'
import { requireRole } from '@/lib/auth/server'
import NavbarWrapper from '@/components/NavbarWrapper'
import { Trophy, Target, Crosshair, Shield, Zap, Award, TrendingUp, BarChart3 } from 'lucide-react'
import { getTranslations } from 'next-intl/server'
import FaceitSection from './FaceitSection'

export default async function PlayerStatsPage() {
  const user = await requireRole(['player'])
  const supabase = await createClient()
  const t = await getTranslations('stats')
  const tMatches = await getTranslations('matches')

  // Get player data with FACEIT fields
  const { data: playerData } = await supabase
    .from('profiles')
    .select('*, teams(name, game)')
    .eq('id', user.user_id)
    .single()

  const isCS2Player = playerData?.teams?.game === 'cs2'

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
            {t('playerStatistics')}
          </h1>
          <p className="text-gray-400 text-lg">{t('trackPerformance')}</p>
        </div>

        {/* FACEIT Stats Section for CS2 Players */}
        {isCS2Player && (
          <FaceitSection 
            isLinked={!!playerData?.faceit_player_id}
            faceitNickname={playerData?.faceit_nickname}
            faceitElo={playerData?.faceit_elo}
            faceitLevel={playerData?.faceit_level}
            faceitAvatar={playerData?.faceit_avatar}
            faceitStats={playerData?.faceit_stats}
            faceitLastSync={playerData?.faceit_last_sync}
          />
        )}

        {/* Detailed Stats Grid */}
        <div className={`grid gap-6 mb-8 ${isCS2Player ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-2'}`}>
          {/* Role/Agent Performance - Only for Valorant */}
          {!isCS2Player && (
          <div className="bg-gradient-to-br from-dark-card to-gray-900/50 border border-gray-800 rounded-2xl p-8 shadow-xl">
            <div className="flex items-center gap-3 mb-8">
              <div className="p-3 bg-primary/10 rounded-xl">
                <Trophy className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">
                  {t('topAgents')}
                </h2>
                <p className="text-sm text-gray-500">
                  {t('mostPlayedChampions')}
                </p>
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
                          <p className="text-sm text-gray-500">{agent.games} {t('matchesPlayed')}</p>
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="bg-blue-500/5 border border-blue-500/20 rounded-lg p-3 text-center">
                        <p className="text-xl font-bold text-blue-400">{agent.avgKills}</p>
                        <p className="text-xs text-gray-500 uppercase tracking-wider mt-1">{t('kills')}</p>
                      </div>
                      <div className="bg-red-500/5 border border-red-500/20 rounded-lg p-3 text-center">
                        <p className="text-xl font-bold text-red-400">{agent.avgDeaths}</p>
                        <p className="text-xs text-gray-500 uppercase tracking-wider mt-1">{t('deaths')}</p>
                      </div>
                      <div className="bg-purple-500/5 border border-purple-500/20 rounded-lg p-3 text-center">
                        <p className="text-xl font-bold text-purple-400">{agent.avgACS}</p>
                        <p className="text-xs text-gray-500 uppercase tracking-wider mt-1">{t('acs')}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <Trophy className="w-16 h-16 text-gray-600 mx-auto mb-4 opacity-50" />
                <p className="text-gray-500 text-lg">
                  {t('noAgentData')}
                </p>
                <p className="text-gray-600 text-sm mt-2">
                  {t('playMatchesToSeeAgents')}
                </p>
              </div>
            )}
          </div>
          )}

          {/* Match Performance Breakdown */}
          <div className="bg-gradient-to-br from-dark-card to-gray-900/50 border border-gray-800 rounded-2xl shadow-xl overflow-hidden">
            <div className="bg-dark/30 border-b border-gray-800 p-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-primary/10 rounded-xl">
                  <BarChart3 className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">{t('performanceBreakdown')}</h2>
                  <p className="text-sm text-gray-500">{t('avgStatsPerMatch')}</p>
                </div>
              </div>
            </div>

            <div className="p-6">
              {totalMatches > 0 ? (
                <div className="grid grid-cols-2 gap-4">
                  {/* Kills */}
                  <div className="bg-gradient-to-br from-blue-500/10 to-transparent border border-blue-500/30 rounded-xl p-5">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs text-gray-400 uppercase tracking-wider">{t('kills')}</span>
                      <Crosshair className="w-4 h-4 text-blue-400" />
                    </div>
                    <p className="text-3xl font-bold text-blue-400 mb-2">{avgKills.toFixed(1)}</p>
                    <div className="w-full bg-gray-900/50 rounded-full h-2 overflow-hidden">
                      <div 
                        className="bg-gradient-to-r from-blue-600 to-blue-400 h-2 rounded-full transition-all duration-700 ease-out"
                        style={{ width: `${Math.min((avgKills / 25) * 100, 100)}%` }}
                      />
                    </div>
                  </div>

                  {/* Deaths */}
                  <div className="bg-gradient-to-br from-red-500/10 to-transparent border border-red-500/30 rounded-xl p-5">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs text-gray-400 uppercase tracking-wider">{t('deaths')}</span>
                      <Crosshair className="w-4 h-4 text-red-400" />
                    </div>
                    <p className="text-3xl font-bold text-red-400 mb-2">{avgDeaths.toFixed(1)}</p>
                    <div className="w-full bg-gray-900/50 rounded-full h-2 overflow-hidden">
                      <div 
                        className="bg-gradient-to-r from-red-600 to-red-400 h-2 rounded-full transition-all duration-700 ease-out"
                        style={{ width: `${Math.min((avgDeaths / 25) * 100, 100)}%` }}
                      />
                    </div>
                  </div>

                  {/* Assists */}
                  <div className="bg-gradient-to-br from-green-500/10 to-transparent border border-green-500/30 rounded-xl p-5">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs text-gray-400 uppercase tracking-wider">{t('assists')}</span>
                      <Shield className="w-4 h-4 text-green-400" />
                    </div>
                    <p className="text-3xl font-bold text-green-400 mb-2">{avgAssists.toFixed(1)}</p>
                    <div className="w-full bg-gray-900/50 rounded-full h-2 overflow-hidden">
                      <div 
                        className="bg-gradient-to-r from-green-600 to-green-400 h-2 rounded-full transition-all duration-700 ease-out"
                        style={{ width: `${Math.min((avgAssists / 15) * 100, 100)}%` }}
                      />
                    </div>
                  </div>

                  {/* Combat Score */}
                  <div className="bg-gradient-to-br from-purple-500/10 to-transparent border border-purple-500/30 rounded-xl p-5">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs text-gray-400 uppercase tracking-wider">{t('combatScore')}</span>
                      <Award className="w-4 h-4 text-purple-400" />
                    </div>
                    <p className="text-3xl font-bold text-purple-400 mb-2">{Math.round(avgACS)}</p>
                    <div className="w-full bg-gray-900/50 rounded-full h-2 overflow-hidden">
                      <div 
                        className="bg-gradient-to-r from-purple-600 to-purple-400 h-2 rounded-full transition-all duration-700 ease-out"
                        style={{ width: `${Math.min((avgACS / 300) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <Target className="w-12 h-12 text-gray-600 mx-auto mb-3 opacity-50" />
                  <p className="text-gray-500 font-medium">No practice matches recorded yet</p>
                  <p className="text-gray-600 text-sm mt-1">Your practice stats will appear here once matches are logged</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Recent Match History */}
        <div className="bg-gradient-to-br from-dark-card to-gray-900/50 border border-gray-800 rounded-2xl shadow-xl overflow-hidden">
          <div className="bg-dark/30 border-b border-gray-800 p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-primary/10 rounded-xl">
                  <Target className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">{t('recentMatchPerformance')}</h2>
                  <p className="text-sm text-gray-500">{t('lastNMatches', { count: Math.min(playerMatchStats?.length || 0, 10) })}</p>
                </div>
              </div>
              
              {/* Summary Stats */}
              {totalMatches > 0 && (
                <div className="flex items-center gap-3">
                  <div className="text-center px-5 py-3 bg-gradient-to-br from-green-500/10 to-transparent border border-green-500/30 rounded-xl">
                    <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">{t('winRate')}</p>
                    <p className="text-2xl font-bold text-green-400">{winRate}%</p>
                  </div>
                  <div className="text-center px-5 py-3 bg-gradient-to-br from-blue-500/10 to-transparent border border-blue-500/30 rounded-xl">
                    <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">{t('overallKDA')}</p>
                    <p className="text-2xl font-bold text-blue-400">{overallKDA}</p>
                  </div>
                  <div className="text-center px-5 py-3 bg-gradient-to-br from-purple-500/10 to-transparent border border-purple-500/30 rounded-xl">
                    <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">{t('avgACS')}</p>
                    <p className="text-2xl font-bold text-purple-400">{Math.round(avgACS)}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {playerMatchStats && playerMatchStats.length > 0 ? (
            <div className="p-6">
              <div className="space-y-3">
                {playerMatchStats.slice(0, 10).map((stat, index) => {
                  const isWin = stat.match_history?.result === 'win'
                  const kdRatio = stat.deaths > 0 ? (stat.kills / stat.deaths).toFixed(2) : stat.kills.toFixed(2)
                  
                  return (
                    <div 
                      key={stat.id}
                      className={`group bg-dark/30 border rounded-xl p-4 transition-all duration-200 ${
                        isWin 
                          ? 'border-green-500/30 hover:border-green-500/50 hover:bg-green-500/5' 
                          : 'border-red-500/30 hover:border-red-500/50 hover:bg-red-500/5'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        {/* Left: Date & Opponent */}
                        <div className="flex items-center gap-4 flex-1">
                          <div className={`w-1 h-16 rounded-full ${isWin ? 'bg-green-500' : 'bg-red-500'}`}></div>
                          <div>
                            <p className="text-sm text-gray-500 mb-1">
                              {stat.match_history?.match_date 
                                ? new Date(stat.match_history.match_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                                : '-'}
                            </p>
                            <p className="text-lg font-bold text-white">
                              {stat.match_history?.opponent_name || 'Unknown Opponent'}
                            </p>
                          </div>
                        </div>

                        {/* Center: Stats */}
                        <div className="flex items-center gap-6">
                          {/* K/D/A */}
                          <div className="text-center">
                            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">K/D/A</p>
                            <p className="text-lg font-bold text-white">
                              <span className="text-blue-400">{stat.kills}</span>
                              <span className="text-gray-600 mx-1">/</span>
                              <span className="text-red-400">{stat.deaths}</span>
                              <span className="text-gray-600 mx-1">/</span>
                              <span className="text-green-400">{stat.assists}</span>
                            </p>
                          </div>

                          {/* K/D Ratio */}
                          <div className="text-center">
                            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">K/D</p>
                            <p className="text-lg font-bold text-white">{kdRatio}</p>
                          </div>

                          {/* ACS */}
                          <div className="text-center">
                            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">ACS</p>
                            <p className="text-lg font-bold text-purple-400">{stat.acs}</p>
                          </div>

                          {/* Agent */}
                          {stat.agent_played && stat.agent_played !== '-' && (
                            <div className="text-center">
                              <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Agent</p>
                              <div className="bg-dark/70 border border-gray-700 px-3 py-1 rounded-lg">
                                <p className="text-sm font-medium text-gray-300">{stat.agent_played}</p>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Right: Result Badge */}
                        <div className="ml-6">
                          <div className={`px-6 py-3 rounded-xl text-center font-bold uppercase tracking-wider ${
                            isWin
                              ? 'bg-green-500/20 text-green-400 border-2 border-green-500/40'
                              : 'bg-red-500/20 text-red-400 border-2 border-red-500/40'
                          }`}>
                            {isWin ? '✓ WIN' : '✗ LOSS'}
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ) : (
            <div className="text-center py-16">
              <Target className="w-16 h-16 text-gray-600 mx-auto mb-4 opacity-50" />
              <p className="text-gray-500 text-lg font-medium">{t('noMatchStats')}</p>
              <p className="text-gray-600 text-sm mt-2">{t('statsWillAppear')}</p>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
