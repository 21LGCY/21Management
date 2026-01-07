'use client'

import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ProfileTryout, TryoutStatus, TeamCategory } from '@/lib/types/database'
import { GameType, GAME_CONFIGS } from '@/lib/types/games'
import { Globe, Users, TrendingUp } from 'lucide-react'
import Link from 'next/link'
import CustomSelect from '@/components/CustomSelect'
import { useTranslations } from 'next-intl'

// VALORANT EMEA Competitive Zones mapping
const VALORANT_ZONES: Record<string, string[]> = {
  'Northern Europe': ['Denmark', 'Finland', 'Ireland', 'Iceland', 'Norway', 'Sweden', 'United Kingdom', 'GB', 'UK', 'DK', 'FI', 'IE', 'IS', 'NO', 'SE'],
  'Eastern Europe': ['Albania', 'Armenia', 'Azerbaijan', 'Belarus', 'Bosnia', 'Bulgaria', 'Croatia', 'Estonia', 'Georgia', 'Greece', 'Hungary', 'Kazakhstan', 'Latvia', 'Lithuania', 'Moldova', 'Montenegro', 'Poland', 'Romania', 'Russia', 'Serbia', 'Slovakia', 'Slovenia', 'Czechia', 'Czech Republic', 'Ukraine', 'Uzbekistan', 'AL', 'AM', 'AZ', 'BY', 'BA', 'BG', 'HR', 'EE', 'GE', 'GR', 'HU', 'KZ', 'LV', 'LT', 'MD', 'ME', 'PL', 'RO', 'RU', 'RS', 'SK', 'SI', 'CZ', 'UA', 'UZ'],
  'DACH': ['Germany', 'Austria', 'Switzerland', 'DE', 'AT', 'CH'],
  'BENELUX': ['Belgium', 'Netherlands', 'Luxembourg', 'BE', 'NL', 'LU'],
  'France': ['France', 'FR'],
  'IBIT': ['Spain', 'Portugal', 'Italy', 'ES', 'PT', 'IT'],
  'Turkey & MENA': ['Turkey', 'TR', 'Middle East', 'North Africa'],
}

// CS2 FACEIT/ESL Competitive Zones mapping
const CS2_ZONES: Record<string, string[]> = {
  'EU West': ['France', 'FR', 'United Kingdom', 'GB', 'UK', 'Ireland', 'IE', 'Spain', 'ES', 'Portugal', 'PT', 'Belgium', 'BE', 'Netherlands', 'NL', 'Luxembourg', 'LU'],
  'EU North': ['Denmark', 'DK', 'Finland', 'FI', 'Sweden', 'SE', 'Norway', 'NO', 'Iceland', 'IS', 'Estonia', 'EE', 'Latvia', 'LV', 'Lithuania', 'LT'],
  'EU Central': ['Germany', 'DE', 'Austria', 'AT', 'Switzerland', 'CH', 'Poland', 'PL', 'Czech Republic', 'Czechia', 'CZ', 'Hungary', 'HU', 'Slovakia', 'SK'],
  'EU South': ['Italy', 'IT', 'Greece', 'GR', 'Croatia', 'HR', 'Slovenia', 'SI', 'Serbia', 'RS', 'Bosnia', 'BA', 'Montenegro', 'ME', 'Albania', 'AL', 'North Macedonia', 'MK'],
  'CIS': ['Russia', 'RU', 'Ukraine', 'UA', 'Belarus', 'BY', 'Kazakhstan', 'KZ', 'Uzbekistan', 'UZ', 'Armenia', 'AM', 'Azerbaijan', 'AZ', 'Georgia', 'GE', 'Moldova', 'MD'],
  'Turkey': ['Turkey', 'TR'],
}

// Helper to determine if team is CS2
const isCS2Team = (teamCategory: TeamCategory | 'all'): boolean => {
  return teamCategory === '21CS2'
}

interface ZoneStats {
  zone: string
  count: number
  players: ProfileTryout[]
  percentage: number
}

interface ZonesInterfaceProps {
  gameFilter: GameType | 'all'
  onGameFilterChange: (game: GameType | 'all') => void
}

export default function ZonesInterface({ gameFilter, onGameFilterChange }: ZonesInterfaceProps) {
  const [tryouts, setTryouts] = useState<ProfileTryout[]>([])
  const [loading, setLoading] = useState(true)
  
  const [teamFilter, setTeamFilter] = useState<TeamCategory | 'all'>('all')
  const [statusFilter, setStatusFilter] = useState<TryoutStatus | 'all'>('all')
  const [roleFilter, setRoleFilter] = useState<string | 'all'>('all')

  const supabase = createClient()
  const t = useTranslations('tryouts')
  const tRoles = useTranslations('roles')

  // Determine current game based on gameFilter prop
  const currentGame: GameType = useMemo(() => {
    if (gameFilter === 'all') {
      // If 'all', use team filter to determine game, or default to valorant
      return isCS2Team(teamFilter) ? 'cs2' : 'valorant'
    }
    return gameFilter
  }, [gameFilter, teamFilter])

  // Get current zones based on game
  const currentZones = useMemo(() => {
    return currentGame === 'cs2' ? CS2_ZONES : VALORANT_ZONES
  }, [currentGame])

  // Get available roles based on current game
  const getAvailableRoles = () => {
    return currentGame === 'cs2' ? GAME_CONFIGS.cs2.roles : GAME_CONFIGS.valorant.roles
  }

  // Reset role filter when game changes if the current role isn't available
  useEffect(() => {
    const availableRoles = getAvailableRoles()
    if (roleFilter !== 'all' && !availableRoles.includes(roleFilter)) {
      setRoleFilter('all')
    }
  }, [currentGame])

  useEffect(() => {
    fetchTryouts()
  }, [])

  const fetchTryouts = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('profiles_tryouts')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setTryouts(data || [])
    } catch (error) {
      console.error('Error fetching tryouts:', error)
    } finally {
      setLoading(false)
    }
  }

  const getZoneForNationality = (nationality: string): string | null => {
    if (!nationality) return null
    
    const normalizedNationality = nationality.toLowerCase().trim()
    const isCountryCode = normalizedNationality.length <= 3
    
    for (const [zone, countries] of Object.entries(currentZones)) {
      if (countries.some(country => {
        const normalizedCountry = country.toLowerCase().trim()
        const isCountryCodeInList = normalizedCountry.length <= 3
        
        // Match codes with codes, and names with names
        if (isCountryCode && isCountryCodeInList) {
          return normalizedNationality === normalizedCountry
        } else if (!isCountryCode && !isCountryCodeInList) {
          return normalizedNationality.includes(normalizedCountry) || normalizedCountry.includes(normalizedNationality)
        }
        return false
      })) {
        return zone
      }
    }
    return 'Other'
  }

  // Compute zone stats inline based on current filters
  const zoneStats: ZoneStats[] = (() => {
    let filtered = tryouts
    
    // Apply game filter
    if (gameFilter !== 'all') {
      filtered = filtered.filter(t => (t.game || 'valorant') === gameFilter)
    }
    
    // Apply filters
    if (teamFilter !== 'all') {
      filtered = filtered.filter(t => t.team_category === teamFilter)
    }
    
    if (statusFilter !== 'all') {
      filtered = filtered.filter(t => t.status === statusFilter)
    }
    
    if (roleFilter !== 'all') {
      filtered = filtered.filter(t => t.position === roleFilter)
    }

    // Exclude players without nationality
    const playersWithNationality = filtered.filter(t => t.nationality)
    
    const zoneMap = new Map<string, ProfileTryout[]>()
    
    // When "all" games: categorize by the player's game to get the correct zones
    playersWithNationality.forEach(tryout => {
      const playerGame = (tryout.game || 'valorant') as GameType
      const zones = playerGame === 'cs2' ? CS2_ZONES : VALORANT_ZONES
      
      // Find zone for this player based on their game's zone system
      let foundZone: string | null = null
      if (tryout.nationality) {
        const normalizedNationality = tryout.nationality.toLowerCase().trim()
        const isCountryCode = normalizedNationality.length <= 3
        
        for (const [zone, countries] of Object.entries(zones)) {
          if (countries.some(country => {
            const normalizedCountry = country.toLowerCase().trim()
            const isCountryCodeInList = normalizedCountry.length <= 3
            
            if (isCountryCode && isCountryCodeInList) {
              return normalizedNationality === normalizedCountry
            } else if (!isCountryCode && !isCountryCodeInList) {
              return normalizedNationality.includes(normalizedCountry) || normalizedCountry.includes(normalizedNationality)
            }
            return false
          })) {
            foundZone = zone
            break
          }
        }
      }
      
      const zone = foundZone || 'Other'
      if (!zoneMap.has(zone)) {
        zoneMap.set(zone, [])
      }
      zoneMap.get(zone)?.push(tryout)
    })

    const total = playersWithNationality.length
    return Array.from(zoneMap.entries())
      .map(([zone, zonePlayers]) => ({
        zone,
        count: zonePlayers.length,
        players: zonePlayers,
        percentage: total > 0 ? (zonePlayers.length / total) * 100 : 0
      }))
      .sort((a, b) => b.count - a.count)
  })()

  const getZoneColor = (zone: string): string => {
    // Valorant zone colors
    const valorantColors: Record<string, string> = {
      'Northern Europe': 'from-blue-500 to-cyan-600',
      'Eastern Europe': 'from-purple-500 to-violet-600',
      'DACH': 'from-yellow-500 to-orange-500',
      'BENELUX': 'from-orange-500 to-red-500',
      'France': 'from-blue-600 to-indigo-700',
      'IBIT': 'from-red-500 to-pink-500',
      'Turkey & MENA': 'from-red-600 to-orange-600',
      'Other': 'from-gray-500 to-gray-600'
    }
    
    // CS2 zone colors
    const cs2Colors: Record<string, string> = {
      'EU West': 'from-blue-500 to-cyan-600',
      'EU North': 'from-cyan-500 to-teal-600',
      'EU Central': 'from-yellow-500 to-orange-500',
      'EU South': 'from-red-500 to-pink-500',
      'CIS': 'from-purple-500 to-violet-600',
      'Turkey': 'from-red-600 to-orange-600',
      'Other': 'from-gray-500 to-gray-600'
    }
    
    const colors = currentGame === 'cs2' ? cs2Colors : valorantColors
    return colors[zone] || 'from-gray-500 to-gray-600'
  }

  const getStatusColor = (status: TryoutStatus) => {
    switch (status) {
      case 'substitute': return 'bg-purple-500/20 text-purple-300'
      case 'in_tryouts': return 'bg-blue-500/20 text-blue-300'
      case 'contacted': return 'bg-yellow-500/20 text-yellow-300'
      case 'not_contacted': return 'bg-slate-500/20 text-slate-300'
      case 'rejected': return 'bg-red-500/20 text-red-300'
      case 'left': return 'bg-gray-500/20 text-gray-300'
      case 'accepted': return 'bg-green-500/20 text-green-300'
    }
  }

  const getStatusLabel = (status: TryoutStatus) => {
    switch (status) {
      case 'substitute': return t('substitute')
      case 'in_tryouts': return t('inTryouts')
      case 'contacted': return t('contacted')
      case 'not_contacted': return t('notContacted')
      case 'rejected': return t('rejected')
      case 'left': return t('left')
      case 'accepted': return t('player')
    }
  }

  const totalPlayersWithNationality = (() => {
    let filtered = tryouts
    
    if (gameFilter !== 'all') {
      filtered = filtered.filter(t => (t.game || 'valorant') === gameFilter)
    }
    
    if (teamFilter !== 'all') {
      filtered = filtered.filter(t => t.team_category === teamFilter)
    }
    
    if (statusFilter !== 'all') {
      filtered = filtered.filter(t => t.status === statusFilter)
    }
    
    if (roleFilter !== 'all') {
      filtered = filtered.filter(t => t.position === roleFilter)
    }
    
    return filtered.filter(t => t.nationality).length
  })()

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with Filters */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            <Globe className={`w-7 h-7 ${
              gameFilter === 'all' ? 'text-gray-400' : 
              currentGame === 'cs2' ? 'text-[#de9b35]' : 'text-primary'
            }`} />
            {gameFilter === 'all' ? t('geographicZones') : 
             currentGame === 'cs2' ? 'Zones CS2 (FACEIT/ESL)' : 'Zones VALORANT (EMEA)'}
          </h2>
          <p className="text-gray-400 mt-1">
            {t('geoDistribution', { count: totalPlayersWithNationality })}
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          {/* Team Filter */}
          <CustomSelect
            value={teamFilter}
            onChange={(value) => setTeamFilter(value as TeamCategory | 'all')}
            options={[
              { value: 'all', label: t('allCategories') },
              { value: '21L', label: '21L' },
              { value: '21GC', label: '21GC' },
              { value: '21ACA', label: '21 ACA' },
              { value: '21CS2', label: '21 CS2' }
            ]}
            className="min-w-[140px]"
          />

          {/* Status Filter */}
          <CustomSelect
            value={statusFilter}
            onChange={(value) => setStatusFilter(value as TryoutStatus | 'all')}
            options={[
              { value: 'all', label: t('allStatus') },
              { value: 'not_contacted', label: t('notContacted') },
              { value: 'contacted', label: t('contacted') },
              { value: 'in_tryouts', label: t('inTryouts') },
              { value: 'substitute', label: t('substitute') },
              { value: 'rejected', label: t('rejected') },
              { value: 'left', label: t('left') },
              { value: 'accepted', label: t('player') }
            ]}
            className="min-w-[160px]"
          />

          {/* Role Filter - Dynamic based on game */}
          <div className="relative">
            <CustomSelect
              value={roleFilter}
              onChange={(value) => setRoleFilter(value)}
              options={[
                { value: 'all', label: t('allRoles') },
                ...getAvailableRoles().map(role => ({ value: role, label: role }))
              ]}
              className="min-w-[140px]"
            />
            {gameFilter !== 'all' && (
              <div className={`absolute -top-1 -right-1 w-2 h-2 rounded-full ${
                gameFilter === 'cs2' ? 'bg-[#de9b35]' : 'bg-[#ff4655]'
              }`} title={`Filtered for ${gameFilter.toUpperCase()}`}></div>
            )}
          </div>
        </div>
      </div>

      {/* Zone Statistics */}
      {zoneStats.length === 0 ? (
        <div className="bg-dark-card border border-gray-800 rounded-lg p-12 text-center">
          <Globe className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <div className="text-gray-400 mb-2">{t('noNationalityData')}</div>
          <p className="text-gray-500 text-sm">
            {t('addNationalitiesToSeeZones')}
          </p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {zoneStats.map((stat) => (
            <div
              key={stat.zone}
              className="bg-gradient-to-br from-dark-card via-dark-card to-primary/5 border border-gray-800 rounded-xl p-6 hover:border-primary/50 transition-all hover:shadow-lg hover:shadow-primary/10"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className={`inline-block px-3 py-1 rounded-lg bg-gradient-to-r ${getZoneColor(stat.zone)} text-white font-bold text-sm mb-2`}>
                    {stat.zone}
                  </div>
                  <div className="flex items-center gap-2 text-gray-400">
                    <Users className="w-4 h-4" />
                    <span className="text-2xl font-bold text-white">{stat.count}</span>
                    <span className="text-sm">{t('players')}</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1 text-primary">
                    <TrendingUp className="w-4 h-4" />
                    <span className="text-xl font-bold">{stat.percentage.toFixed(1)}%</span>
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-gray-800 rounded-full h-2 mb-4">
                <div
                  className={`h-2 rounded-full bg-gradient-to-r ${getZoneColor(stat.zone)} transition-all duration-500`}
                  style={{ width: `${stat.percentage}%` }}
                />
              </div>

              {/* Player List */}
              <div className="space-y-2">
                <div className="text-xs text-gray-500 mb-2">{t('playersLabel')}</div>
                {stat.players.slice(0, 5).map(player => (
                  <div
                    key={player.id}
                    className="block p-2 rounded bg-dark/50 hover:bg-dark transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <div className="text-sm text-white font-medium">
                            {player.username}
                          </div>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                            (player.game || 'valorant') === 'valorant' 
                              ? 'bg-[#ff4655]/20 text-[#ff4655] border border-[#ff4655]/30' 
                              : 'bg-[#de9b35]/20 text-[#de9b35] border border-[#de9b35]/30'
                          }`}>
                            {(player.game || 'valorant').toUpperCase()}
                          </span>
                        </div>
                        <div className="text-xs text-gray-500 mt-0.5">
                          {player.nationality}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-3">
                        <span className="text-xs px-2 py-1 rounded bg-white/10 text-gray-300">
                          {player.position || 'N/A'}
                        </span>
                        <span className={`text-xs px-2 py-1 rounded ${getStatusColor(player.status)}`}>
                          {getStatusLabel(player.status)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
                {stat.players.length > 5 && (
                  <div className="text-xs text-gray-500 mt-1 pl-2">
                    {t('more', { count: stat.players.length - 5 })}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Zone Legend */}
      {gameFilter === 'all' ? (
        // Show intelligently combined zones when "all" is selected
        <div className="bg-gradient-to-br from-dark-card via-dark-card to-gray-500/5 border border-gray-800 rounded-xl p-6 shadow-xl">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <div className="w-1 h-6 rounded-full bg-gradient-to-b from-gray-400 to-gray-600"></div>
            Zones actuellement affichées
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
            {/* Show only zones that are actually in use */}
            {zoneStats.map(({ zone }) => {
              // Determine if this zone is from Valorant or CS2
              const isValorantZone = Object.keys(VALORANT_ZONES).includes(zone)
              const isCS2Zone = Object.keys(CS2_ZONES).includes(zone)
              const zones = isCS2Zone ? CS2_ZONES : VALORANT_ZONES
              const countries = zones[zone] || []
              const gameLabel = isCS2Zone ? 'CS2' : isValorantZone ? 'VAL' : ''
              
              return (
                <div key={zone} className="text-gray-400">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`inline-block px-2 py-1 rounded bg-gradient-to-r ${getZoneColor(zone)} text-white text-xs font-bold`}>
                      {zone}
                    </span>
                    {gameLabel && (
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                        isCS2Zone 
                          ? 'bg-[#de9b35]/20 text-[#de9b35] border border-[#de9b35]/30' 
                          : 'bg-[#ff4655]/20 text-[#ff4655] border border-[#ff4655]/30'
                      }`}>
                        {gameLabel}
                      </span>
                    )}
                  </div>
                  <div className="mt-1 text-xs text-gray-500">
                    {countries.filter(c => c.length > 2).slice(0, 3).join(', ')}
                    {countries.filter(c => c.length > 2).length > 3 && ` +${countries.filter(c => c.length > 2).length - 3} more`}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ) : (
        // Show only relevant zone definition when a specific game is selected
        <div className={`bg-gradient-to-br from-dark-card via-dark-card border border-gray-800 rounded-xl p-6 shadow-xl ${
          currentGame === 'cs2' ? 'to-[#de9b35]/5' : 'to-primary/5'
        }`}>
          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <div className={`w-1 h-6 rounded-full ${
              currentGame === 'cs2' 
                ? 'bg-gradient-to-b from-[#de9b35] to-[#b8802a]' 
                : 'bg-gradient-to-b from-primary to-primary-dark'
            }`}></div>
            {currentGame === 'cs2' ? 'Définitions des zones CS2 (FACEIT/ESL)' : 'Définitions des zones VALORANT (EMEA)'}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
            {Object.entries(currentZones).map(([zone, countries]) => (
              <div key={zone} className="text-gray-400">
                <span className={`inline-block px-2 py-1 rounded bg-gradient-to-r ${getZoneColor(zone)} text-white text-xs font-bold mr-2`}>
                  {zone}
                </span>
                <div className="mt-1 text-xs text-gray-500">
                  {countries.filter(c => c.length > 2).slice(0, 3).join(', ')}
                  {countries.filter(c => c.length > 2).length > 3 && ` +${countries.filter(c => c.length > 2).length - 3} more`}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}


