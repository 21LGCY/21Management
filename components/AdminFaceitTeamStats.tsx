'use client'

import { useState } from 'react'
import { RefreshCw, Users, Trophy, Target, TrendingUp } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { getFaceitLevelImage } from '@/lib/types/games'

interface AdminFaceitTeamStatsProps {
  teamId: string
  teamName: string
  players: any[]
}

export default function AdminFaceitTeamStats({ teamId, teamName, players }: AdminFaceitTeamStatsProps) {
  const [syncing, setSyncing] = useState(false)
  const [syncMessage, setSyncMessage] = useState<string | null>(null)
  const tFaceit = useTranslations('faceit')
  const tCommon = useTranslations('common')

  const playersWithFaceit = players.filter(p => p.faceit_player_id)

  const handleSync = async () => {
    setSyncing(true)
    setSyncMessage(null)
    
    try {
      const response = await fetch('/api/faceit/team/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teamId })
      })

      const data = await response.json()

      if (data.success) {
        setSyncMessage(`✓ ${tFaceit('syncComplete')}: ${data.synced} ${tFaceit('playersUpdated')}`)
        setTimeout(() => {
          window.location.reload()
        }, 1500)
      } else {
        setSyncMessage(`✗ ${data.error || 'Failed to sync team'}`)
      }
    } catch (error) {
      console.error('Error syncing team:', error)
      setSyncMessage('✗ Failed to sync team')
    } finally {
      setSyncing(false)
    }
  }

  const getLevelColor = (level: number) => {
    if (level >= 8) return 'from-red-600 to-orange-500'
    if (level >= 5) return 'from-orange-500 to-yellow-500'
    if (level >= 3) return 'from-yellow-500 to-green-500'
    return 'from-green-500 to-blue-500'
  }

  if (playersWithFaceit.length === 0) {
    return (
      <div className="bg-gradient-to-br from-orange-500/5 to-dark border border-orange-500/20 rounded-xl p-8 text-center">
        <img src="/images/faceit.svg" alt="FACEIT" className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p className="text-gray-400 mb-2">{tFaceit('noLinkedPlayers')}</p>
        <p className="text-sm text-gray-500">{tFaceit('linkFaceitToViewStats')}</p>
      </div>
    )
  }

  return (
    <div className="bg-gradient-to-br from-orange-500/5 to-dark border border-orange-500/20 rounded-xl p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <img src="/images/faceit.svg" alt="FACEIT" className="w-8 h-8" />
          <div>
            <h3 className="text-xl font-bold text-white">{teamName} - {tFaceit('teamStats')}</h3>
            <p className="text-sm text-gray-400">{playersWithFaceit.length} {tFaceit('linkedPlayers')} / {players.length} total players</p>
          </div>
        </div>
        
        <button
          onClick={handleSync}
          disabled={syncing}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-lg font-medium transition-all disabled:opacity-50 shadow-lg hover:shadow-orange-500/25"
        >
          <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
          {syncing ? tFaceit('syncing') : tFaceit('syncTeam')}
        </button>
      </div>

      {/* Sync Message */}
      {syncMessage && (
        <div className={`mb-4 p-3 rounded-lg ${
          syncMessage.startsWith('✓') 
            ? 'bg-green-500/10 border border-green-500/30 text-green-400' 
            : 'bg-red-500/10 border border-red-500/30 text-red-400'
        }`}>
          {syncMessage}
        </div>
      )}

      {/* Team Aggregate Stats */}
      <div className="mb-6 grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-dark/50 border border-gray-800 rounded-lg p-4 text-center hover:border-orange-500/30 transition-all">
          <div className="flex items-center justify-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-orange-400" />
            <p className="text-xs text-gray-400 uppercase tracking-wider">{tFaceit('avgElo')}</p>
          </div>
          <p className="text-3xl font-bold text-orange-400">
            {Math.round(playersWithFaceit.reduce((sum, p) => sum + (p.faceit_elo || 0), 0) / playersWithFaceit.length)}
          </p>
        </div>
        
        <div className="bg-dark/50 border border-gray-800 rounded-lg p-4 text-center hover:border-yellow-500/30 transition-all">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Trophy className="w-4 h-4 text-yellow-400" />
            <p className="text-xs text-gray-400 uppercase tracking-wider">{tFaceit('avgLevel')}</p>
          </div>
          <p className="text-3xl font-bold text-yellow-400">
            {(playersWithFaceit.reduce((sum, p) => sum + (p.faceit_level || 0), 0) / playersWithFaceit.length).toFixed(1)}
          </p>
        </div>
        
        <div className="bg-dark/50 border border-gray-800 rounded-lg p-4 text-center hover:border-green-500/30 transition-all">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Target className="w-4 h-4 text-green-400" />
            <p className="text-xs text-gray-400 uppercase tracking-wider">{tFaceit('avgWinRate')}</p>
          </div>
          <p className="text-3xl font-bold text-green-400">
            {(playersWithFaceit.reduce((sum, p) => sum + (p.faceit_stats?.winRate || 0), 0) / playersWithFaceit.length).toFixed(1)}%
          </p>
        </div>
        
        <div className="bg-dark/50 border border-gray-800 rounded-lg p-4 text-center hover:border-blue-500/30 transition-all">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Trophy className="w-4 h-4 text-blue-400" />
            <p className="text-xs text-gray-400 uppercase tracking-wider">{tFaceit('totalMatches')}</p>
          </div>
          <p className="text-3xl font-bold text-blue-400">
            {playersWithFaceit.reduce((sum, p) => sum + (p.faceit_stats?.matches || 0), 0)}
          </p>
        </div>
      </div>

      {/* All Players with FACEIT */}
      <div className="space-y-3">
        <h4 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
          <Users className="w-4 h-4 text-orange-400" />
          All Players FACEIT Statistics
        </h4>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {playersWithFaceit
            .sort((a, b) => (b.faceit_elo || 0) - (a.faceit_elo || 0))
            .map((player, index) => {
              const stats = player.faceit_stats
              const levelColor = getLevelColor(player.faceit_level || 1)
              
              return (
                <div 
                  key={player.id}
                  className="group bg-gradient-to-br from-dark-card to-dark border border-gray-800 rounded-xl p-4 hover:border-orange-500/50 transition-all hover:shadow-lg hover:shadow-orange-500/10"
                >
                  {/* Player Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      {/* Rank Badge for Top 3 */}
                      {index < 3 && (
                        <div className="flex-shrink-0">
                          {index === 0 && <span className="text-2xl">🥇</span>}
                          {index === 1 && <span className="text-2xl">🥈</span>}
                          {index === 2 && <span className="text-2xl">🥉</span>}
                        </div>
                      )}
                      
                      {/* Player Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-white truncate">{player.username}</p>
                          {player.faceit_stats?.verified && (
                            <svg className="w-4 h-4 text-blue-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" />
                            </svg>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <p className="text-xs text-gray-400 truncate">{player.faceit_nickname || player.in_game_name}</p>
                          {player.faceit_stats?.country && (
                            <>
                              <span className="text-gray-600">•</span>
                              <p className="text-xs text-gray-500">{player.faceit_stats.country.toUpperCase()}</p>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {/* Level Badge */}
                    <div className="flex-shrink-0 w-14 h-14 rounded-lg flex items-center justify-center">
                      <img 
                        src={getFaceitLevelImage(player.faceit_level || 1)} 
                        alt={`Level ${player.faceit_level}`}
                        className="w-full h-full"
                      />
                    </div>
                  </div>

                  {/* ELO Progress Bar */}
                  <div className="mb-4">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-400">FACEIT ELO</span>
                      <span className="text-orange-400 font-bold">{player.faceit_elo}</span>
                    </div>
                    <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-orange-500 to-orange-400 transition-all duration-500"
                        style={{ width: `${Math.min((player.faceit_elo || 0) / 3000 * 100, 100)}%` }}
                      />
                    </div>
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-4 gap-2">
                    <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-2 text-center">
                      <p className="text-[10px] text-gray-400 uppercase mb-1">Win Rate</p>
                      <p className="text-sm font-bold text-green-400">{stats?.winRate?.toFixed(0) || 0}%</p>
                    </div>
                    <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-2 text-center">
                      <p className="text-[10px] text-gray-400 uppercase mb-1">K/D</p>
                      <p className="text-sm font-bold text-blue-400">{stats?.avgKdRatio?.toFixed(2) || '-'}</p>
                    </div>
                    <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-2 text-center">
                      <p className="text-[10px] text-gray-400 uppercase mb-1">HS%</p>
                      <p className="text-sm font-bold text-purple-400">{stats?.headshotPercentage?.toFixed(0) || 0}%</p>
                    </div>
                    <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-2 text-center">
                      <p className="text-[10px] text-gray-400 uppercase mb-1">Matches</p>
                      <p className="text-sm font-bold text-yellow-400">{stats?.matches || 0}</p>
                    </div>
                  </div>

                  {/* Additional Stats */}
                  {stats && (
                    <div className="mt-3 pt-3 border-t border-gray-800 grid grid-cols-3 gap-2 text-center text-xs">
                      <div>
                        <p className="text-gray-500">Wins</p>
                        <p className="text-white font-medium">{stats.wins || 0}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Win Streak</p>
                        <p className="text-white font-medium">{stats.currentStreak || 0}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Best Streak</p>
                        <p className="text-white font-medium">{stats.longestWinStreak || 0}</p>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
        </div>
      </div>

      {/* Players without FACEIT */}
      {players.filter(p => !p.faceit_player_id).length > 0 && (
        <div className="mt-6 pt-6 border-t border-gray-800">
          <h4 className="text-sm font-semibold text-gray-400 mb-3 flex items-center gap-2">
            <Users className="w-4 h-4" />
            Players Without FACEIT ({players.filter(p => !p.faceit_player_id).length})
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {players.filter(p => !p.faceit_player_id).map((player) => (
              <div 
                key={player.id}
                className="bg-gray-800/30 border border-gray-700 rounded-lg p-3 hover:border-gray-600 transition-all"
              >
                <p className="text-sm font-medium text-white">{player.username}</p>
                <p className="text-xs text-gray-500">{player.in_game_name || 'No IGN'}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
