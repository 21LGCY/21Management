'use client'

import { useState, useEffect } from 'react'
import { Globe, Users, TrendingUp } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { ProfileTryout, TeamCategory, TryoutStatus, ValorantRole } from '@/lib/types/database'
import Link from 'next/link'
import CustomSelect from '@/components/CustomSelect'
import { useTranslations } from 'next-intl'

// VALORANT EMEA Competitive Zones mapping (same as admin)
const VALORANT_ZONES: Record<string, string[]> = {
  'Northern Europe': ['Denmark', 'Finland', 'Ireland', 'Iceland', 'Norway', 'Sweden', 'United Kingdom', 'GB', 'UK', 'DK', 'FI', 'IE', 'IS', 'NO', 'SE'],
  'Eastern Europe': ['Albania', 'Armenia', 'Azerbaijan', 'Belarus', 'Bosnia', 'Bulgaria', 'Croatia', 'Estonia', 'Georgia', 'Greece', 'Hungary', 'Kazakhstan', 'Latvia', 'Lithuania', 'Moldova', 'Montenegro', 'Poland', 'Romania', 'Russia', 'Serbia', 'Slovakia', 'Slovenia', 'Czechia', 'Czech Republic', 'Ukraine', 'Uzbekistan', 'AL', 'AM', 'AZ', 'BY', 'BA', 'BG', 'HR', 'EE', 'GE', 'GR', 'HU', 'KZ', 'LV', 'LT', 'MD', 'ME', 'PL', 'RO', 'RU', 'RS', 'SK', 'SI', 'CZ', 'UA', 'UZ'],
  'DACH': ['Germany', 'Austria', 'Switzerland', 'DE', 'AT', 'CH'],
  'BENELUX': ['Belgium', 'Netherlands', 'Luxembourg', 'BE', 'NL', 'LU'],
  'France': ['France', 'FR'],
  'IBIT': ['Spain', 'Portugal', 'Italy', 'ES', 'PT', 'IT'],
  'Turkey & MENA': ['Turkey', 'TR', 'Middle East', 'North Africa'],
}

interface ZoneStats {
  zone: string
  count: number
  percentage: number
  players: ProfileTryout[]
}

interface ZonesInterfaceManagerProps {
  teamId: string | null
  team: any | null
  teamCategory: TeamCategory | null
}

export default function ZonesInterfaceManager({ teamId, team, teamCategory }: ZonesInterfaceManagerProps) {
  const [tryouts, setTryouts] = useState<ProfileTryout[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<TryoutStatus | 'all'>('all')
  const [roleFilter, setRoleFilter] = useState<ValorantRole | 'all'>('all')
  const supabase = createClient()
  const t = useTranslations('tryouts')

  useEffect(() => {
    fetchTryouts()
  }, [teamCategory])

  const fetchTryouts = async () => {
    if (!teamCategory) {
      setLoading(false)
      return
    }
    
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('profiles_tryouts')
        .select('*')
        .eq('team_category', teamCategory)

      if (error) throw error
      setTryouts(data || [])
    } catch (error) {
      console.error('Error fetching tryouts:', error)
    } finally {
      setLoading(false)
    }
  }

  const getPlayerZone = (nationality: string | null | undefined): string => {
    if (!nationality) return 'Autre'
    
    const normalizedNationality = nationality.toLowerCase().trim()
    const isCountryCode = normalizedNationality.length <= 3
    
    for (const [zone, countries] of Object.entries(VALORANT_ZONES)) {
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
    return 'Autre'
  }

  const zoneStats: ZoneStats[] = (() => {
    let filtered = tryouts
    
    if (statusFilter !== 'all') {
      filtered = filtered.filter(t => t.status === statusFilter)
    }
    
    if (roleFilter !== 'all') {
      filtered = filtered.filter(t => t.position === roleFilter)
    }
    
    const playersWithNationality = filtered.filter(t => t.nationality)
    const zoneMap = new Map<string, ProfileTryout[]>()
    
    playersWithNationality.forEach(player => {
      const zone = getPlayerZone(player.nationality)
      if (!zoneMap.has(zone)) {
        zoneMap.set(zone, [])
      }
      zoneMap.get(zone)!.push(player)
    })
    
    const total = playersWithNationality.length
    
    return Array.from(zoneMap.entries())
      .map(([zone, players]) => ({
        zone,
        count: players.length,
        percentage: total > 0 ? (players.length / total) * 100 : 0,
        players
      }))
      .sort((a, b) => b.count - a.count)
  })()

  const getZoneColor = (zone: string): string => {
    const colors: Record<string, string> = {
      'Northern Europe': 'from-blue-500 to-cyan-600',
      'Eastern Europe': 'from-purple-500 to-violet-600',
      'DACH': 'from-yellow-500 to-orange-500',
      'BENELUX': 'from-orange-500 to-red-500',
      'France': 'from-blue-600 to-indigo-700',
      'IBIT': 'from-red-500 to-pink-500',
      'Turkey & MENA': 'from-red-600 to-orange-600',
      'Autre': 'from-gray-500 to-gray-600'
    }
    return colors[zone] || 'from-gray-500 to-gray-600'
  }

  const getStatusColor = (status: TryoutStatus) => {
    switch (status) {
      case 'not_contacted': return 'bg-gray-500/20 text-gray-300'
      case 'contacted': return 'bg-blue-500/20 text-blue-300'
      case 'in_tryouts': return 'bg-yellow-500/20 text-yellow-300'
      case 'accepted': return 'bg-green-500/20 text-green-300'
      case 'substitute': return 'bg-purple-500/20 text-purple-300'
      case 'rejected': return 'bg-red-500/20 text-red-300'
      case 'left': return 'bg-orange-500/20 text-orange-300'
      default: return 'bg-gray-500/20 text-gray-300'
    }
  }

  const getStatusLabel = (status: TryoutStatus) => {
    switch (status) {
      case 'not_contacted': return t('notContacted')
      case 'contacted': return t('pending')
      case 'in_tryouts': return t('tryingOut')
      case 'accepted': return t('player')
      case 'substitute': return t('sub')
      case 'rejected': return t('rejected')
      case 'left': return t('left')
      default: return status
    }
  }

  const getTeamLabel = (team: TeamCategory) => {
    switch (team) {
      case '21L': return '21L'
      case '21GC': return '21GC'  
      case '21ACA': return '21 ACA'
    }
  }

  const totalPlayersWithNationality = (() => {
    let filtered = tryouts
    
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

  if (!teamCategory) {
    return (
      <div className="bg-yellow-500/20 border border-yellow-500/30 rounded-lg p-6 text-center">
        <Globe className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
        <h3 className="text-lg font-bold text-yellow-300 mb-2">{t('teamCategoryNotFound')}</h3>
        <p className="text-yellow-400">{t('unableToDetermineCategory', { teamName: team?.name })}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with Filters */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            <Globe className="w-7 h-7 text-primary" />
            {t('valorantZonesTitle', { team: getTeamLabel(teamCategory) })}
          </h2>
          <p className="text-gray-400 mt-1">
            {t('geoDistribution', { count: totalPlayersWithNationality })}
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          {/* Status Filter */}
          <CustomSelect
            value={statusFilter}
            onChange={(value) => setStatusFilter(value as TryoutStatus | 'all')}
            options={[
              { value: 'all', label: t('allStatus') },
              { value: 'not_contacted', label: t('notContacted') },
              { value: 'contacted', label: t('contacted') },
              { value: 'in_tryouts', label: t('inTryouts') },
              { value: 'accepted', label: t('player') },
              { value: 'substitute', label: t('substitute') },
              { value: 'rejected', label: t('rejected') },
              { value: 'left', label: t('left') }
            ]}
            className="min-w-[160px]"
          />

          {/* Role Filter */}
          <CustomSelect
            value={roleFilter}
            onChange={(value) => setRoleFilter(value as ValorantRole | 'all')}
            options={[
              { value: 'all', label: t('allRoles') },
              { value: 'Duelist', label: 'Duelist' },
              { value: 'Initiator', label: 'Initiator' },
              { value: 'Controller', label: 'Controller' },
              { value: 'Sentinel', label: 'Sentinel' },
              { value: 'Flex', label: 'Flex' },
              { value: 'Staff', label: 'Staff' }
            ]}
            className="min-w-[140px]"
          />
        </div>
      </div>

      {/* Team Info */}
      <div className="bg-dark-card border border-gray-800 rounded-lg p-4">
        <p className="text-white">
          {t('analyzingZonesFor')} <span className="font-semibold text-primary">{team?.name}</span>
          <span className="ml-2 px-2 py-1 bg-primary/20 text-primary text-sm rounded">
            {teamCategory}
          </span>
        </p>
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
              className="bg-dark-card border border-gray-800 rounded-lg p-6 hover:border-gray-700 transition"
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
                        <div className="text-sm text-white font-medium">
                          {player.username}
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
      <div className="bg-dark-card border border-gray-800 rounded-lg p-6">
        <h3 className="text-xl font-bold text-white mb-4">{t('zoneDefinitions')}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
          {Object.entries(VALORANT_ZONES).map(([zone, countries]) => (
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
    </div>
  )
}