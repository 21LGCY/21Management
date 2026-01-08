'use client'

import { GameType, GAME_CONFIGS, getGameConfig } from '@/lib/types/games'
import { useTranslations } from 'next-intl'
import CustomSelect from '@/components/CustomSelect'
import Image from 'next/image'

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
        className={disabled ? 'opacity-50 pointer-events-none' : ''}
      />
    </div>
  )
}

/**
 * Game selector with logos - Enhanced version for admin pages
 */
interface GameSelectorWithLogoProps {
  value: GameType | 'all'
  onChange: (game: GameType | 'all') => void
  showAllOption?: boolean
  className?: string
}

export function GameSelectorWithLogo({ 
  value, 
  onChange, 
  showAllOption = true,
  className = ''
}: GameSelectorWithLogoProps) {
  const t = useTranslations('common')

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {showAllOption && (
        <button
          onClick={() => onChange('all')}
          className={`px-4 py-2 rounded-lg font-medium transition-all ${
            value === 'all'
              ? 'bg-primary text-white shadow-lg shadow-primary/20'
              : 'bg-dark-card border border-gray-800 text-gray-400 hover:text-white hover:border-gray-700'
          }`}
        >
          {t('all')}
        </button>
      )}
      
      <button
        onClick={() => onChange('valorant')}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
          value === 'valorant'
            ? 'bg-dark-card border-2 border-red-500 text-white shadow-lg shadow-red-500/30'
            : 'bg-dark-card border border-gray-800 text-gray-400 hover:text-white hover:border-red-500/50'
        }`}
      >
        <div className="w-6 h-6 flex items-center justify-center relative">
          <Image
            src="/images/valorant.svg"
            alt="Valorant"
            width={24}
            height={24}
            className={`object-contain ${value === 'valorant' ? '' : 'brightness-75 opacity-60'}`}
          />
        </div>
        <span>Valorant</span>
      </button>
      
      <button
        onClick={() => onChange('cs2')}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
          value === 'cs2'
            ? 'bg-dark-card border-2 border-orange-500 text-white shadow-lg shadow-orange-500/30'
            : 'bg-dark-card border border-gray-800 text-gray-400 hover:text-white hover:border-orange-500/50'
        }`}
      >
        <div className="w-6 h-6 flex items-center justify-center relative">
          <Image
            src="/images/cs2.svg"
            alt="CS2"
            width={24}
            height={24}
            className={`object-contain ${value === 'cs2' ? '' : 'brightness-75 opacity-60'}`}
          />
        </div>
        <span>CS2</span>
      </button>
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
