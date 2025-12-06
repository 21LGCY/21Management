'use client'

import { TrendingUp, Target, Award, Trophy, BarChart3, Star } from 'lucide-react'
import { useTranslations } from 'next-intl'

interface PlayerStats {
  kills?: number
  deaths?: number
  assists?: number
  acs?: number
  kd_ratio?: number
  headshot_percentage?: number
}

interface PlayerProgressionProps {
  playerData: {
    in_game_name?: string
    position?: string
    rank?: string
    is_igl?: boolean
    is_substitute?: boolean
    stats?: PlayerStats
  }
  matchesPlayed: number
  winRate: number
  winCount: number
}

export default function PlayerProgressionCard({ 
  playerData, 
  matchesPlayed, 
  winRate,
  winCount 
}: PlayerProgressionProps) {
  const t = useTranslations('playerProgression')
  const kd = playerData.stats?.kd_ratio || 0
  const acs = playerData.stats?.acs || 0
  const hsPercentage = playerData.stats?.headshot_percentage || 0

  // Calculate progression level based on matches played
  const level = Math.floor(matchesPlayed / 5) + 1
  const progressToNextLevel = (matchesPlayed % 5) * 20

  return (
    <div className="bg-gradient-to-br from-dark-card to-dark border border-gray-800 rounded-xl p-6 hover:border-gray-700 transition-all">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-white mb-1">{t('title')}</h2>
          <p className="text-sm text-gray-400">{t('subtitle')}</p>
        </div>
        <div className="p-3 bg-gradient-to-br from-primary/20 to-primary/10 rounded-lg">
          <TrendingUp className="w-6 h-6 text-primary" />
        </div>
      </div>

      {/* Player Level & Progress */}
      <div className="bg-gradient-to-br from-primary/10 to-dark border border-primary/30 rounded-xl p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center">
              <Star className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-gray-400">{t('playerLevel')}</p>
              <p className="text-3xl font-bold text-primary">{level}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-400">{t('matchesPlayed')}</p>
            <p className="text-2xl font-bold text-white">{matchesPlayed}</p>
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-400">{t('progressToLevel', { level: level + 1 })}</span>
            <span className="text-primary font-medium">{progressToNextLevel}%</span>
          </div>
          <div className="w-full bg-dark rounded-full h-3 overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-primary to-primary-dark transition-all duration-500 ease-out"
              style={{ width: `${progressToNextLevel}%` }}
            />
          </div>
          <p className="text-xs text-gray-500">{t('playMoreMatches', { count: 5 - (matchesPlayed % 5) })}</p>
        </div>
      </div>

      {/* Performance Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-dark border border-gray-800 rounded-lg p-4 hover:border-green-500/50 transition-all group">
          <div className="flex items-center gap-2 mb-2">
            <Trophy className="w-4 h-4 text-green-400 group-hover:scale-110 transition" />
            <p className="text-xs text-gray-400">{t('winRate')}</p>
          </div>
          <p className="text-2xl font-bold text-green-400">{winRate}%</p>
          <p className="text-xs text-gray-500 mt-1">{winCount}W / {matchesPlayed - winCount}L</p>
        </div>

        <div className="bg-dark border border-gray-800 rounded-lg p-4 hover:border-blue-500/50 transition-all group">
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-4 h-4 text-blue-400 group-hover:scale-110 transition" />
            <p className="text-xs text-gray-400">{t('kdRatio')}</p>
          </div>
          <p className="text-2xl font-bold text-blue-400">{kd.toFixed(2)}</p>
          <p className="text-xs text-gray-500 mt-1">{t('average')}</p>
        </div>

        <div className="bg-dark border border-gray-800 rounded-lg p-4 hover:border-purple-500/50 transition-all group">
          <div className="flex items-center gap-2 mb-2">
            <BarChart3 className="w-4 h-4 text-purple-400 group-hover:scale-110 transition" />
            <p className="text-xs text-gray-400">{t('acs')}</p>
          </div>
          <p className="text-2xl font-bold text-purple-400">{Math.round(acs)}</p>
          <p className="text-xs text-gray-500 mt-1">{t('combatScore')}</p>
        </div>

        <div className="bg-dark border border-gray-800 rounded-lg p-4 hover:border-orange-500/50 transition-all group">
          <div className="flex items-center gap-2 mb-2">
            <Award className="w-4 h-4 text-orange-400 group-hover:scale-110 transition" />
            <p className="text-xs text-gray-400">{t('hsPercent')}</p>
          </div>
          <p className="text-2xl font-bold text-orange-400">{Math.round(hsPercentage)}%</p>
          <p className="text-xs text-gray-500 mt-1">{t('headshots')}</p>
        </div>
      </div>

      {/* Role & Rank Information */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gradient-to-br from-blue-500/10 to-dark border border-blue-500/30 rounded-lg p-4">
          <p className="text-xs text-blue-300/70 mb-2">{t('currentRole')}</p>
          <div className="flex items-center gap-2">
            <p className="text-lg font-bold text-blue-400">
              {playerData.position || t('notSet')}
            </p>
            {playerData.is_igl && (
              <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-400 text-xs rounded font-medium">
                {t('igl')}
              </span>
            )}
          </div>
          {playerData.is_substitute && (
            <span className="inline-block mt-2 px-2 py-0.5 bg-orange-500/20 text-orange-400 text-xs rounded">
              {t('substitute')}
            </span>
          )}
        </div>

        <div className="bg-gradient-to-br from-purple-500/10 to-dark border border-purple-500/30 rounded-lg p-4">
          <p className="text-xs text-purple-300/70 mb-2">{t('currentRank')}</p>
          <p className="text-lg font-bold text-purple-400">
            {playerData.rank || t('unranked')}
          </p>
        </div>
      </div>

      {/* Achievements Preview */}
      <div className="mt-6 pt-6 border-t border-gray-800">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-white">{t('recentAchievements')}</h3>
          <Trophy className="w-4 h-4 text-yellow-400" />
        </div>
        <div className="grid grid-cols-3 gap-2">
          {winCount >= 5 && (
            <div className="bg-gradient-to-br from-yellow-500/10 to-dark border border-yellow-500/30 rounded-lg p-3 text-center">
              <Trophy className="w-5 h-5 text-yellow-400 mx-auto mb-1" />
              <p className="text-xs text-yellow-400 font-medium">{t('achievement5Wins')}</p>
            </div>
          )}
          {matchesPlayed >= 10 && (
            <div className="bg-gradient-to-br from-blue-500/10 to-dark border border-blue-500/30 rounded-lg p-3 text-center">
              <Target className="w-5 h-5 text-blue-400 mx-auto mb-1" />
              <p className="text-xs text-blue-400 font-medium">{t('achievement10Matches')}</p>
            </div>
          )}
          {winRate >= 60 && matchesPlayed >= 5 && (
            <div className="bg-gradient-to-br from-green-500/10 to-dark border border-green-500/30 rounded-lg p-3 text-center">
              <Award className="w-5 h-5 text-green-400 mx-auto mb-1" />
              <p className="text-xs text-green-400 font-medium">{t('achievementHighWR')}</p>
            </div>
          )}
        </div>
        {winCount < 5 && matchesPlayed < 10 && (winRate < 60 || matchesPlayed < 5) && (
          <p className="text-center text-gray-500 text-sm py-4">
            {t('keepPlaying')}
          </p>
        )}
      </div>
    </div>
  )
}
