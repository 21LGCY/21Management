'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Loader2, RefreshCw, ExternalLink, Target, Trophy, Crosshair, Flame, TrendingUp } from 'lucide-react'
import FaceitLinkButton from '@/components/FaceitLinkButton'
import { getFaceitLevelImage } from '@/lib/types/games'

interface FaceitSectionProps {
  isLinked: boolean
  faceitNickname?: string | null
  faceitElo?: number | null
  faceitLevel?: number | null
  faceitAvatar?: string | null
  faceitStats?: any
  faceitLastSync?: string | null
}

// FACEIT level colors
const LEVEL_COLORS: Record<number, { bg: string; border: string; text: string; gradient: string }> = {
  1: { bg: 'bg-gray-500/20', border: 'border-gray-500/40', text: 'text-gray-400', gradient: 'from-gray-600 to-gray-500' },
  2: { bg: 'bg-green-500/20', border: 'border-green-500/40', text: 'text-green-400', gradient: 'from-green-600 to-green-500' },
  3: { bg: 'bg-green-400/20', border: 'border-green-400/40', text: 'text-green-300', gradient: 'from-green-500 to-green-400' },
  4: { bg: 'bg-yellow-500/20', border: 'border-yellow-500/40', text: 'text-yellow-400', gradient: 'from-yellow-600 to-yellow-500' },
  5: { bg: 'bg-yellow-400/20', border: 'border-yellow-400/40', text: 'text-yellow-300', gradient: 'from-yellow-500 to-yellow-400' },
  6: { bg: 'bg-orange-500/20', border: 'border-orange-500/40', text: 'text-orange-400', gradient: 'from-orange-600 to-orange-500' },
  7: { bg: 'bg-orange-400/20', border: 'border-orange-400/40', text: 'text-orange-300', gradient: 'from-orange-500 to-orange-400' },
  8: { bg: 'bg-red-500/20', border: 'border-red-500/40', text: 'text-red-400', gradient: 'from-red-600 to-red-500' },
  9: { bg: 'bg-purple-500/20', border: 'border-purple-500/40', text: 'text-purple-400', gradient: 'from-purple-600 to-purple-500' },
  10: { bg: 'bg-amber-500/20', border: 'border-amber-500/40', text: 'text-amber-400', gradient: 'from-amber-600 to-amber-500' },
}

export default function FaceitSection({
  isLinked,
  faceitNickname,
  faceitElo,
  faceitLevel,
  faceitAvatar,
  faceitStats,
  faceitLastSync,
}: FaceitSectionProps) {
  const t = useTranslations('faceit')
  const tStats = useTranslations('stats')
  const [syncing, setSyncing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const levelColors = LEVEL_COLORS[faceitLevel || 1] || LEVEL_COLORS[1]

  const handleSync = async () => {
    setSyncing(true)
    setError(null)

    try {
      const response = await fetch('/api/faceit/sync', { method: 'POST' })
      const data = await response.json()

      if (!response.ok) {
        setError(data.message || t('syncError'))
        return
      }

      window.location.reload()
    } catch (err) {
      setError(t('syncError'))
    } finally {
      setSyncing(false)
    }
  }

  const formatLastSync = (date: string | null | undefined) => {
    if (!date) return t('never')
    const diff = Date.now() - new Date(date).getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    
    if (minutes < 1) return t('justNow')
    if (minutes < 60) return t('minutesAgo', { count: minutes })
    return t('hoursAgo', { count: hours })
  }

  // Not linked state
  if (!isLinked) {
    return (
      <div className="mb-8 bg-gradient-to-br from-orange-500/10 to-dark-card border border-orange-500/30 rounded-2xl p-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-orange-500/20 rounded-xl">
              <img 
                src="/images/faceit.svg" 
                alt="FACEIT" 
                className="w-8 h-8"
              />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">{t('notLinked')}</h2>
              <p className="text-gray-400">{t('notLinkedDescription')}</p>
            </div>
          </div>
          <FaceitLinkButton isLinked={false} />
        </div>
      </div>
    )
  }

  // Linked state with stats
  return (
    <div className="mb-8 bg-gradient-to-br from-orange-500/10 to-dark-card border border-orange-500/30 rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="bg-dark/30 border-b border-orange-500/20 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="relative">
              {faceitAvatar ? (
                <img 
                  src={faceitAvatar} 
                  alt={faceitNickname || 'FACEIT'}
                  className="w-16 h-16 rounded-xl object-cover border-2 border-orange-500/40"
                />
              ) : (
                <div className="w-16 h-16 rounded-xl bg-orange-500/20 flex items-center justify-center border-2 border-orange-500/40">
                  <img 
                    src="/images/faceit.svg" 
                    alt="FACEIT" 
                    className="w-8 h-8"
                  />
                </div>
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-bold text-white">{t('title')}</h2>
                <a 
                  href={`https://www.faceit.com/en/players/${faceitNickname}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-orange-400 hover:text-orange-300 transition"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
              <p className="text-orange-300 font-medium">{faceitNickname}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="text-right text-sm text-gray-500">
              <span>{t('lastSync')}: {formatLastSync(faceitLastSync)}</span>
            </div>
            <button
              onClick={handleSync}
              disabled={syncing}
              className="p-2 bg-orange-500/20 hover:bg-orange-500/30 rounded-lg transition disabled:opacity-50"
              title={t('sync')}
            >
              {syncing ? (
                <Loader2 className="w-5 h-5 text-orange-400 animate-spin" />
              ) : (
                <RefreshCw className="w-5 h-5 text-orange-400" />
              )}
            </button>
            <FaceitLinkButton isLinked={true} faceitNickname={faceitNickname} />
          </div>
        </div>
        {error && (
          <p className="mt-3 text-sm text-red-400">{error}</p>
        )}
      </div>

      {/* Stats Grid */}
      <div className="p-6">
        {/* Main Stats - 3 columns */}
        <div className="grid grid-cols-3 gap-4 mb-4">
          {/* Level */}
          <div className={`${levelColors.bg} border ${levelColors.border} rounded-xl p-6 text-center flex flex-col items-center justify-center`}>
            <img 
              src={getFaceitLevelImage(faceitLevel || 1)} 
              alt={`Level ${faceitLevel}`}
              className="w-16 h-16 mb-2"
            />
            <p className="text-xs text-gray-500 uppercase tracking-wider">{t('level')}</p>
          </div>

          {/* ELO */}
          <div className="bg-gradient-to-br from-blue-500/20 to-blue-500/5 border border-blue-500/30 rounded-xl p-6 text-center">
            <TrendingUp className="w-6 h-6 text-blue-400 mx-auto mb-2" />
            <p className="text-4xl font-bold text-blue-400 mb-1">{faceitElo || '-'}</p>
            <p className="text-xs text-gray-500 uppercase tracking-wider">ELO</p>
          </div>

          {/* Win Rate */}
          <div className="bg-gradient-to-br from-green-500/20 to-green-500/5 border border-green-500/30 rounded-xl p-6 text-center">
            <Trophy className="w-6 h-6 text-green-400 mx-auto mb-2" />
            <p className="text-4xl font-bold text-green-400 mb-1">{faceitStats?.winRate || '-'}%</p>
            <p className="text-xs text-gray-500 uppercase tracking-wider">{tStats('winRate')}</p>
          </div>
        </div>

        {/* Secondary Stats - 3 columns */}
        <div className="grid grid-cols-3 gap-4">
          {/* Matches */}
          <div className="bg-dark/50 border border-gray-800 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">{tStats('matches')}</span>
              <Target className="w-4 h-4 text-purple-400" />
            </div>
            <p className="text-2xl font-bold text-white mt-2">{faceitStats?.matches || '-'}</p>
          </div>

          {/* K/D */}
          <div className="bg-dark/50 border border-gray-800 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">K/D Ratio</span>
              <Crosshair className="w-4 h-4 text-red-400" />
            </div>
            <p className="text-2xl font-bold text-white mt-2">
              {faceitStats?.avgKdRatio ? faceitStats.avgKdRatio.toFixed(2) : '-'}
            </p>
          </div>

          {/* Headshot % */}
          <div className="bg-dark/50 border border-gray-800 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">{t('headshots')}</span>
              <Crosshair className="w-4 h-4 text-yellow-400" />
            </div>
            <p className="text-2xl font-bold text-white mt-2">{faceitStats?.headshotPercentage || '-'}%</p>
          </div>
        </div>

        {/* Additional Stats Row */}
        {faceitStats && (
          <div className="mt-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {/* Wins */}
              <div className="bg-gradient-to-br from-green-500/10 to-transparent border border-green-500/30 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400 uppercase tracking-wider">{tStats('wins')}</span>
                  <Trophy className="w-3 h-3 text-green-400" />
                </div>
                <p className="text-xl font-bold text-green-400 mt-1">{faceitStats.wins || 0}</p>
              </div>

              {/* Total Kills - only show if available */}
              {faceitStats.totalKills > 0 ? (
                <div className="bg-gradient-to-br from-blue-500/10 to-transparent border border-blue-500/30 rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400 uppercase tracking-wider">{tStats('kills')}</span>
                    <Crosshair className="w-3 h-3 text-blue-400" />
                  </div>
                  <p className="text-xl font-bold text-blue-400 mt-1">{faceitStats.totalKills}</p>
                </div>
              ) : (
                /* Show Matches instead when Kills not available */
                <div className="bg-gradient-to-br from-blue-500/10 to-transparent border border-blue-500/30 rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400 uppercase tracking-wider">{tStats('matches')}</span>
                    <Target className="w-3 h-3 text-blue-400" />
                  </div>
                  <p className="text-xl font-bold text-blue-400 mt-1">{faceitStats.matches || 0}</p>
                </div>
              )}

              {/* Current Streak */}
              {faceitStats.currentStreak !== undefined && (
                <div className={`bg-gradient-to-br ${faceitStats.currentStreak >= 0 ? 'from-green-500/10' : 'from-red-500/10'} to-transparent border ${faceitStats.currentStreak >= 0 ? 'border-green-500/30' : 'border-red-500/30'} rounded-lg p-3`}>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400 uppercase tracking-wider">{t('currentStreak')}</span>
                    <TrendingUp className={`w-3 h-3 ${faceitStats.currentStreak >= 0 ? 'text-green-400' : 'text-red-400'}`} />
                  </div>
                  <p className={`text-xl font-bold mt-1 ${faceitStats.currentStreak >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {faceitStats.currentStreak >= 0 ? '+' : ''}{faceitStats.currentStreak}
                  </p>
                </div>
              )}

              {/* Best Streak */}
              {faceitStats.longestWinStreak !== undefined && (
                <div className="bg-gradient-to-br from-amber-500/10 to-transparent border border-amber-500/30 rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400 uppercase tracking-wider">{t('bestStreak')}</span>
                    <Flame className="w-3 h-3 text-amber-400" />
                  </div>
                  <p className="text-xl font-bold text-amber-400 mt-1 flex items-center gap-1">
                    {faceitStats.longestWinStreak}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Map Statistics */}
        {faceitStats && faceitStats.segments && faceitStats.segments.length > 0 && (
          <div className="mt-6 pt-6 border-t border-orange-500/20">
            <div className="mb-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Target className="w-5 h-5 text-orange-400" />
                Map Statistics
              </h3>
              <p className="text-xs text-gray-400 mt-1">Your performance on different maps</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {faceitStats.segments.slice(0, 6).map((segment: any) => {
                const winRate = parseFloat(segment.stats['Win Rate %'] || '0')
                const matches = parseInt(segment.stats['Matches'] || '0', 10)
                const wins = parseInt(segment.stats['Wins'] || '0', 10)
                
                return (
                  <div 
                    key={segment.label}
                    className="bg-dark/50 border border-gray-800 rounded-xl p-4 hover:border-orange-500/30 transition-all"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h4 className="text-sm font-bold text-white">{segment.label}</h4>
                        <p className="text-xs text-gray-500">{matches} matches</p>
                      </div>
                      <img 
                        src={segment.img_regular} 
                        alt={segment.label}
                        className="w-12 h-12 rounded-lg object-cover"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-2">
                        <p className="text-xs text-gray-400">Matches</p>
                        <p className="text-lg font-bold text-purple-400">{matches}</p>
                      </div>
                      <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-2">
                        <p className="text-xs text-gray-400">Wins</p>
                        <p className="text-lg font-bold text-blue-400">{wins}</p>
                      </div>
                      <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-2">
                        <p className="text-xs text-gray-400">WR</p>
                        <p className="text-lg font-bold text-green-400">{winRate.toFixed(0)}%</p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
