'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { RefreshCw, ExternalLink, Trophy, Target, Crosshair, TrendingUp, Flame, Loader2, Clock } from 'lucide-react'
import { FormattedFaceitStats } from '@/lib/types/faceit'

interface FaceitStatsCardProps {
  stats: FormattedFaceitStats
  playerId: string
  showSyncButton?: boolean
  compact?: boolean
}

// FACEIT level colors
const LEVEL_COLORS: Record<number, { bg: string; border: string; text: string }> = {
  1: { bg: 'bg-gray-500/20', border: 'border-gray-500/40', text: 'text-gray-400' },
  2: { bg: 'bg-green-500/20', border: 'border-green-500/40', text: 'text-green-400' },
  3: { bg: 'bg-green-500/20', border: 'border-green-500/40', text: 'text-green-400' },
  4: { bg: 'bg-yellow-500/20', border: 'border-yellow-500/40', text: 'text-yellow-400' },
  5: { bg: 'bg-yellow-500/20', border: 'border-yellow-500/40', text: 'text-yellow-400' },
  6: { bg: 'bg-orange-500/20', border: 'border-orange-500/40', text: 'text-orange-400' },
  7: { bg: 'bg-orange-500/20', border: 'border-orange-500/40', text: 'text-orange-400' },
  8: { bg: 'bg-orange-600/20', border: 'border-orange-600/40', text: 'text-orange-300' },
  9: { bg: 'bg-red-500/20', border: 'border-red-500/40', text: 'text-red-400' },
  10: { bg: 'bg-red-600/20', border: 'border-red-600/40', text: 'text-red-300' },
}

export default function FaceitStatsCard({
  stats,
  playerId,
  showSyncButton = true,
  compact = false,
}: FaceitStatsCardProps) {
  const t = useTranslations('faceit')
  const tCommon = useTranslations('common')

  const [isLoading, setIsLoading] = useState(false)
  const [currentStats, setCurrentStats] = useState(stats)
  const [lastSync, setLastSync] = useState(stats.lastSync)
  const [error, setError] = useState<string | null>(null)

  const levelColor = LEVEL_COLORS[currentStats.level] || LEVEL_COLORS[1]

  const handleSync = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/faceit/sync', {
        method: 'POST',
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.message || t('syncError'))
        return
      }

      if (data.stats) {
        setCurrentStats(data.stats)
        setLastSync(data.lastSync)
      }
    } catch (err) {
      setError(t('syncError'))
    } finally {
      setIsLoading(false)
    }
  }

  const formatLastSync = (dateStr?: string) => {
    if (!dateStr) return t('never')
    const date = new Date(dateStr)
    const now = new Date()
    const diffMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
    
    if (diffMinutes < 1) return t('justNow')
    if (diffMinutes < 60) return t('minutesAgo', { count: diffMinutes })
    
    const diffHours = Math.floor(diffMinutes / 60)
    if (diffHours < 24) return t('hoursAgo', { count: diffHours })
    
    return date.toLocaleDateString()
  }

  // Compact view for lists
  if (compact) {
    return (
      <div className="flex items-center gap-3 p-3 bg-orange-500/10 border border-orange-500/30 rounded-lg">
        <div className={`flex items-center justify-center w-10 h-10 rounded-lg ${levelColor.bg} ${levelColor.border} border`}>
          <span className={`text-lg font-bold ${levelColor.text}`}>{currentStats.level}</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-white truncate">{currentStats.nickname}</span>
            <a
              href={currentStats.faceitUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-orange-400 hover:text-orange-300"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
          <div className="flex items-center gap-3 text-xs text-gray-400">
            <span>{currentStats.elo} ELO</span>
            <span>{currentStats.winRate}% {tCommon('winRate')}</span>
            <span>{currentStats.kdRatio} K/D</span>
          </div>
        </div>
      </div>
    )
  }

  // Full card view
  return (
    <div className="bg-gradient-to-br from-orange-500/10 to-dark border border-orange-500/30 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-orange-500/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Avatar */}
            <div className="relative">
              <img
                src={currentStats.avatar || '/images/faceit.svg'}
                alt={currentStats.nickname}
                className="w-16 h-16 rounded-xl object-cover border-2 border-orange-500/40"
              />
              {currentStats.verified && (
                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center border-2 border-dark">
                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" />
                  </svg>
                </div>
              )}
            </div>

            {/* Info */}
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-bold text-white">{currentStats.nickname}</h3>
                <a
                  href={currentStats.faceitUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-orange-400 hover:text-orange-300 transition"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-sm text-gray-400">{currentStats.region?.toUpperCase()}</span>
                {currentStats.country && (
                  <>
                    <span className="text-gray-600">•</span>
                    <span className="text-sm text-gray-400">{currentStats.country.toUpperCase()}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Level Badge */}
          <div className={`flex flex-col items-center justify-center w-20 h-20 rounded-xl ${levelColor.bg} ${levelColor.border} border-2`}>
            <span className={`text-3xl font-bold ${levelColor.text}`}>{currentStats.level}</span>
            <span className="text-xs text-gray-400">{t('level')}</span>
          </div>
        </div>

        {/* ELO Bar */}
        <div className="mt-4">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm text-gray-400">FACEIT ELO</span>
            <span className={`text-lg font-bold ${levelColor.text}`}>{currentStats.elo}</span>
          </div>
          <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
            <div 
              className={`h-full ${levelColor.bg.replace('/20', '')} transition-all`}
              style={{ width: `${Math.min((currentStats.elo / 3000) * 100, 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="p-6 grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="text-center p-3 bg-dark/50 rounded-lg">
          <Trophy className="w-5 h-5 text-yellow-400 mx-auto mb-2" />
          <p className="text-2xl font-bold text-white">{currentStats.wins}</p>
          <p className="text-xs text-gray-400">{tCommon('wins')}</p>
        </div>

        <div className="text-center p-3 bg-dark/50 rounded-lg">
          <TrendingUp className="w-5 h-5 text-green-400 mx-auto mb-2" />
          <p className="text-2xl font-bold text-white">{currentStats.winRate}%</p>
          <p className="text-xs text-gray-400">{tCommon('winRate')}</p>
        </div>

        <div className="text-center p-3 bg-dark/50 rounded-lg">
          <Target className="w-5 h-5 text-blue-400 mx-auto mb-2" />
          <p className="text-2xl font-bold text-white">{currentStats.kdRatio}</p>
          <p className="text-xs text-gray-400">K/D Ratio</p>
        </div>

        <div className="text-center p-3 bg-dark/50 rounded-lg">
          <Crosshair className="w-5 h-5 text-red-400 mx-auto mb-2" />
          <p className="text-2xl font-bold text-white">{currentStats.headshotPercentage}%</p>
          <p className="text-xs text-gray-400">{t('headshots')}</p>
        </div>
      </div>

      {/* Additional Stats */}
      <div className="px-6 pb-4 grid grid-cols-3 gap-4">
        <div className="text-center">
          <p className="text-lg font-semibold text-white">{currentStats.matches}</p>
          <p className="text-xs text-gray-400">{tCommon('totalMatches')}</p>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center gap-1">
            <Flame className="w-4 h-4 text-orange-400" />
            <p className="text-lg font-semibold text-white">{currentStats.currentStreak}</p>
          </div>
          <p className="text-xs text-gray-400">{t('currentStreak')}</p>
        </div>
        <div className="text-center">
          <p className="text-lg font-semibold text-white">{currentStats.longestWinStreak}</p>
          <p className="text-xs text-gray-400">{t('bestStreak')}</p>
        </div>
      </div>

      {/* Footer */}
      {showSyncButton && (
        <div className="px-6 py-4 border-t border-orange-500/20 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Clock className="w-3.5 h-3.5" />
            <span>{t('lastSync')}: {formatLastSync(lastSync)}</span>
          </div>

          <button
            onClick={handleSync}
            disabled={isLoading}
            className="flex items-center gap-2 px-3 py-1.5 text-sm text-orange-400 hover:text-orange-300 hover:bg-orange-500/10 rounded-lg transition disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                {t('syncing')}
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4" />
                {t('sync')}
              </>
            )}
          </button>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="px-6 pb-4">
          <div className="p-2 bg-red-500/10 border border-red-500/30 rounded-lg">
            <span className="text-sm text-red-400">{error}</span>
          </div>
        </div>
      )}
    </div>
  )
}
