'use client'

import { Users, Shield, Star, Trophy } from 'lucide-react'
import { useTranslations } from 'next-intl'

interface Player {
  id: string
  username: string
  in_game_name?: string
  full_name?: string
  position?: string
  is_igl?: boolean
  is_substitute?: boolean
  avatar_url?: string
  rank?: string
}

interface TeamRosterCardProps {
  players: Player[]
  currentPlayerId: string
  teamName: string
}

export default function TeamRosterCard({ 
  players, 
  currentPlayerId,
  teamName 
}: TeamRosterCardProps) {
  const t = useTranslations('teamRoster')
  const mainRoster = players.filter(p => !p.is_substitute)
  const substitutes = players.filter(p => p.is_substitute)

  const PlayerCard = ({ player, isCurrentPlayer }: { player: Player, isCurrentPlayer: boolean }) => (
    <div 
      className={`flex items-center justify-between p-3 rounded-lg border transition-all ${
        isCurrentPlayer 
          ? 'bg-gradient-to-br from-primary/20 to-primary/5 border-primary/50 shadow-lg shadow-primary/10' 
          : 'bg-dark border-gray-800 hover:border-gray-700'
      }`}
    >
      <div className="flex items-center gap-3">
        <div className="relative">
          {player.avatar_url ? (
            <img 
              src={player.avatar_url} 
              alt={player.in_game_name || player.username}
              className="w-10 h-10 rounded-full object-cover"
            />
          ) : (
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
              isCurrentPlayer ? 'bg-primary/30' : 'bg-gray-700'
            }`}>
              <Users className={`w-5 h-5 ${isCurrentPlayer ? 'text-primary' : 'text-gray-400'}`} />
            </div>
          )}
          {isCurrentPlayer && (
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-primary rounded-full flex items-center justify-center">
              <Star className="w-3 h-3 text-white" fill="currentColor" />
            </div>
          )}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <p className={`font-medium ${isCurrentPlayer ? 'text-primary' : 'text-white'}`}>
              {player.in_game_name || player.username}
            </p>
            {player.is_igl && (
              <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-400 text-xs rounded font-medium">
                {t('igl')}
              </span>
            )}
            {isCurrentPlayer && (
              <span className="px-2 py-0.5 bg-primary/30 text-primary text-xs rounded font-medium">
                {t('you')}
              </span>
            )}
          </div>
          <p className="text-sm text-gray-400">{player.full_name}</p>
        </div>
      </div>
      <div className="text-right">
        {player.position && (
          <span className={`px-3 py-1 rounded-lg text-xs font-medium ${
            isCurrentPlayer 
              ? 'bg-primary/20 text-primary' 
              : 'bg-gray-700 text-gray-300'
          }`}>
            {player.position}
          </span>
        )}
        {player.rank && (
          <p className="text-xs text-gray-400 mt-1">{player.rank}</p>
        )}
      </div>
    </div>
  )

  return (
    <div className="bg-gradient-to-br from-dark-card to-dark border border-gray-800 rounded-xl p-6 hover:border-gray-700 transition-all">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-white mb-1">{t('title')}</h2>
          <p className="text-sm text-gray-400">{teamName} - {t('playersCount', { count: players.length })}</p>
        </div>
        <div className="p-3 bg-gradient-to-br from-blue-500/20 to-blue-500/10 rounded-lg">
          <Users className="w-6 h-6 text-blue-400" />
        </div>
      </div>

      {/* Roster Statistics */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-gradient-to-br from-green-500/10 to-dark border border-green-500/30 rounded-lg p-3 text-center">
          <Shield className="w-5 h-5 text-green-400 mx-auto mb-1" />
          <p className="text-xl font-bold text-green-400">{mainRoster.length}</p>
          <p className="text-xs text-green-300/70">{t('mainRoster')}</p>
        </div>
        <div className="bg-gradient-to-br from-orange-500/10 to-dark border border-orange-500/30 rounded-lg p-3 text-center">
          <Users className="w-5 h-5 text-orange-400 mx-auto mb-1" />
          <p className="text-xl font-bold text-orange-400">{substitutes.length}</p>
          <p className="text-xs text-orange-300/70">{t('substitutes')}</p>
        </div>
        <div className="bg-gradient-to-br from-yellow-500/10 to-dark border border-yellow-500/30 rounded-lg p-3 text-center">
          <Trophy className="w-5 h-5 text-yellow-400 mx-auto mb-1" />
          <p className="text-xl font-bold text-yellow-400">{players.filter(p => p.is_igl).length}</p>
          <p className="text-xs text-yellow-300/70">{t('iglCount', { count: players.filter(p => p.is_igl).length })}</p>
        </div>
      </div>

      {/* Main Roster */}
      {mainRoster.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Shield className="w-4 h-4 text-green-400" />
            <h3 className="text-sm font-semibold text-white">{t('mainRoster')}</h3>
            <span className="text-xs text-gray-500">({mainRoster.length})</span>
          </div>
          <div className="space-y-2 max-h-80 overflow-y-auto pr-2">
            {mainRoster.map(player => (
              <PlayerCard 
                key={player.id} 
                player={player} 
                isCurrentPlayer={player.id === currentPlayerId}
              />
            ))}
          </div>
        </div>
      )}

      {/* Substitutes */}
      {substitutes.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Users className="w-4 h-4 text-orange-400" />
            <h3 className="text-sm font-semibold text-white">{t('substitutes')}</h3>
            <span className="text-xs text-gray-500">({substitutes.length})</span>
          </div>
          <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
            {substitutes.map(player => (
              <PlayerCard 
                key={player.id} 
                player={player} 
                isCurrentPlayer={player.id === currentPlayerId}
              />
            ))}
          </div>
        </div>
      )}

      {players.length === 0 && (
        <div className="text-center py-8">
          <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-400">{t('noPlayersYet')}</p>
          <p className="text-sm text-gray-500 mt-1">{t('contactManager')}</p>
        </div>
      )}
    </div>
  )
}
