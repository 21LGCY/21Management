'use client'

import { useState } from 'react'
import { RefreshCw, TrendingUp, Users, Trophy, Target, Loader2 } from 'lucide-react'
import { useTranslations } from 'next-intl'

interface TeamFaceitStatsProps {
  teamId: string
  teamName: string
  initialPlayerCount?: number
}

interface TeamStats {
  avgElo: number
  avgLevel: number
  playerCount: number
  totalMatches: number
  totalWins: number
  avgWinRate: number
}

export default function FaceitTeamStats({ teamId, teamName, initialPlayerCount = 0 }: TeamFaceitStatsProps) {
  const [syncing, setSyncing] = useState(false)
  const [teamStats, setTeamStats] = useState<TeamStats | null>(null)
  const [lastSync, setLastSync] = useState<string | null>(null)
  const [syncResults, setSyncResults] = useState<{ synced: number; failed: number } | null>(null)
  const t = useTranslations('faceit')
  const tStats = useTranslations('stats')

  const handleSync = async () => {
    setSyncing(true)
    try {
      const response = await fetch('/api/faceit/team/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teamId })
      })

      const data = await response.json()

      if (data.success) {
        setTeamStats(data.teamStats)
        setLastSync(data.timestamp)
        setSyncResults({ synced: data.synced, failed: data.failed })
      } else {
        console.error('Sync failed:', data.error)
        alert(data.error || 'Failed to sync team FACEIT stats')
      }
    } catch (error) {
      console.error('Error syncing team:', error)
      alert('Failed to sync team FACEIT stats')
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

  return (
    <div className="bg-gradient-to-br from-dark-card to-gray-900/50 border border-gray-800 rounded-2xl p-6 shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <img src="/images/faceit.svg" alt="FACEIT" className="w-6 h-6" />
            {t('teamStats')}
          </h2>
          <p className="text-sm text-gray-400 mt-1">
            {teamStats ? `${teamStats.playerCount} ${t('linkedPlayers')}` : `${initialPlayerCount} ${t('playersInTeam')}`}
          </p>
        </div>
        
        <button
          onClick={handleSync}
          disabled={syncing}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-orange-500/25"
        >
          <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
          {syncing ? t('syncing') : t('syncTeam')}
        </button>
      </div>

      {/* Sync Results Banner */}
      {syncResults && !syncing && (
        <div className="mb-6 p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
          <p className="text-sm text-green-400">
            ✓ {t('syncComplete')}: {syncResults.synced} {t('playersUpdated')}
            {syncResults.failed > 0 && ` • ${syncResults.failed} ${t('failed')}`}
          </p>
          {lastSync && (
            <p className="text-xs text-gray-400 mt-1">
              {t('lastSync')}: {new Date(lastSync).toLocaleString()}
            </p>
          )}
        </div>
      )}

      {/* Team Stats Grid */}
      {teamStats ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Average ELO */}
          <div className="bg-dark/50 border border-gray-800 rounded-xl p-4 hover:border-orange-500/30 transition-all">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-400 uppercase tracking-wider">{t('avgElo')}</span>
              <TrendingUp className="w-4 h-4 text-orange-400" />
            </div>
            <p className="text-3xl font-bold text-orange-400">{teamStats.avgElo}</p>
          </div>

          {/* Average Level */}
          <div className={`bg-gradient-to-br ${getLevelColor(teamStats.avgLevel)} bg-opacity-10 border border-gray-800 rounded-xl p-4 hover:border-opacity-50 transition-all`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-400 uppercase tracking-wider">{t('avgLevel')}</span>
              <Trophy className="w-4 h-4 text-yellow-400" />
            </div>
            <p className="text-3xl font-bold text-white">{teamStats.avgLevel}</p>
          </div>

          {/* Total Matches */}
          <div className="bg-dark/50 border border-gray-800 rounded-xl p-4 hover:border-blue-500/30 transition-all">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-400 uppercase tracking-wider">{tStats('totalMatches')}</span>
              <Target className="w-4 h-4 text-blue-400" />
            </div>
            <p className="text-3xl font-bold text-blue-400">{teamStats.totalMatches}</p>
          </div>

          {/* Win Rate */}
          <div className="bg-dark/50 border border-gray-800 rounded-xl p-4 hover:border-green-500/30 transition-all">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-400 uppercase tracking-wider">{t('avgWinRate')}</span>
              <Trophy className="w-4 h-4 text-green-400" />
            </div>
            <p className="text-3xl font-bold text-green-400">{teamStats.avgWinRate.toFixed(1)}%</p>
            <p className="text-xs text-gray-500 mt-1">{teamStats.totalWins} {tStats('wins')}</p>
          </div>
        </div>
      ) : (
        <div className="text-center py-12">
          <Users className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400 mb-4">{t('noTeamStats')}</p>
          <p className="text-sm text-gray-500 mb-6">
            {t('syncTeamToSeeStats')}
          </p>
        </div>
      )}
    </div>
  )
}
