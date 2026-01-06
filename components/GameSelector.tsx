'use client'

import { GameType, GAME_CONFIGS, getGameConfig } from '@/lib/types/games'
import { useTranslations } from 'next-intl'
import CustomSelect from '@/components/CustomSelect'

interface GameSelectorProps {
  value: GameType
  onChange: (game: GameType) => void
  disabled?: boolean
  showLabel?: boolean
  className?: string
}

/**
 * A reusable game selector component for choosing between Valorant and CS2
 */
export default function GameSelector({ 
  value, 
  onChange, 
  disabled = false,
  showLabel = true,
  className = ''
}: GameSelectorProps) {
  const t = useTranslations('forms')
  const tGames = useTranslations('games')

  const gameOptions = Object.values(GAME_CONFIGS).map(config => ({
    value: config.id,
    label: config.name
  }))

  return (
    <div className={className}>
      {showLabel && (
        <label className="block text-sm font-medium text-gray-300 mb-2">
          {t('game')}
        </label>
      )}
      <CustomSelect
        value={value}
        onChange={(val) => onChange(val as GameType)}
        options={gameOptions}
        disabled={disabled}
      />
    </div>
  )
}

/**
 * Game badge component to display the current game
 */
export function GameBadge({ game, size = 'sm' }: { game: GameType; size?: 'sm' | 'md' | 'lg' }) {
  const config = getGameConfig(game)
  
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-1.5 text-base'
  }

  const colorClasses = game === 'valorant' 
    ? 'bg-red-500/20 text-red-400 border-red-500/30' 
    : 'bg-orange-500/20 text-orange-400 border-orange-500/30'

  return (
    <span className={`${sizeClasses[size]} ${colorClasses} rounded-full font-medium border`}>
      {config.shortName}
    </span>
  )
}

/**
 * Game icon component
 */
export function GameIcon({ game, className = 'w-5 h-5' }: { game: GameType; className?: string }) {
  const config = getGameConfig(game)
  
  // Simple text-based icon for now - can be replaced with actual icons
  if (game === 'valorant') {
    return (
      <div className={`${className} flex items-center justify-center bg-red-500/20 text-red-400 rounded font-bold text-xs`}>
        V
      </div>
    )
  }
  
  return (
    <div className={`${className} flex items-center justify-center bg-orange-500/20 text-orange-400 rounded font-bold text-xs`}>
      CS
    </div>
  )
}
