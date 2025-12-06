'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ProfileTryout, TryoutStatus, ValorantRole, TeamCategory } from '@/lib/types/database'
import { Globe, Users, TrendingUp } from 'lucide-react'
import Link from 'next/link'
import CustomSelect from '@/components/CustomSelect'
import { useTranslations } from 'next-intl'

// VALORANT European Zones mapping
const VALORANT_ZONES: Record<string, string[]> = {
  'Europe du Nord': ['Denmark', 'Finland', 'Ireland', 'Iceland', 'Norway', 'Sweden', 'United Kingdom', 'GB', 'UK', 'DK', 'FI', 'IE', 'IS', 'NO', 'SE'],
  'Europe de l\'Est': ['Albania', 'Armenia', 'Azerbaijan', 'Belarus', 'Bosnia', 'Bulgaria', 'Croatia', 'Estonia', 'Georgia', 'Greece', 'Hungary', 'Kazakhstan', 'Latvia', 'Lithuania', 'Moldova', 'Montenegro', 'Poland', 'Romania', 'Russia', 'Serbia', 'Slovakia', 'Slovenia', 'Czechia', 'Czech Republic', 'Ukraine', 'Uzbekistan', 'AL', 'AM', 'AZ', 'BY', 'BA', 'BG', 'HR', 'EE', 'GE', 'GR', 'HU', 'KZ', 'LV', 'LT', 'MD', 'ME', 'PL', 'RO', 'RU', 'RS', 'SK', 'SI', 'CZ', 'UA', 'UZ'],
  'DACH': ['Germany', 'Austria', 'Switzerland', 'DE', 'AT', 'CH'],
  'IBIT': ['Spain', 'Italy', 'Portugal', 'ES', 'IT', 'PT'],
  'France': ['France', 'FR'],
}

interface ZoneStats {
  zone: string
  count: number
  players: ProfileTryout[]
  percentage: number
}

export default function ZonesInterface() {
  const [tryouts, setTryouts] = useState<ProfileTryout[]>([])
  const [loading, setLoading] = useState(true)
  
  const [teamFilter, setTeamFilter] = useState<TeamCategory | 'all'>('all')
  const [statusFilter, setStatusFilter] = useState<TryoutStatus | 'all'>('all')
  const [roleFilter, setRoleFilter] = useState<ValorantRole | 'all'>('all')

  const supabase = createClient()
  const t = useTranslations('tryouts')
  const tRoles = useTranslations('roles')

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
    
    for (const [zone, countries] of Object.entries(VALORANT_ZONES)) {
      if (countries.some(country => 
        nationality.toLowerCase().includes(country.toLowerCase()) ||
        country.toLowerCase().includes(nationality.toLowerCase())
      )) {
        return zone
      }
    }
    return 'Autre'
  }

  // Compute zone stats inline based on current filters
  const zoneStats: ZoneStats[] = (() => {
    let filtered = tryouts
    
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
    
    playersWithNationality.forEach(tryout => {
      const zone = getZoneForNationality(tryout.nationality || '')
      if (zone) {
        if (!zoneMap.has(zone)) {
          zoneMap.set(zone, [])
        }
        zoneMap.get(zone)?.push(tryout)
      }
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
    const colors: Record<string, string> = {
      'Europe du Nord': 'from-green-500 to-emerald-600',
      'Europe de l\'Est': 'from-purple-500 to-violet-600',
      'DACH': 'from-yellow-500 to-orange-500',
      'IBIT': 'from-red-500 to-pink-500',
      'France': 'from-blue-500 to-indigo-600',
      'Autre': 'from-gray-500 to-gray-600'
    }
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
            <Globe className="w-7 h-7 text-primary" />
            {t('valorantZones')}
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
              { value: '21ACA', label: '21 ACA' }
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

          {/* Role Filter */}
          <CustomSelect
            value={roleFilter}
            onChange={(value) => setRoleFilter(value as ValorantRole | 'all')}
            options={[
              { value: 'all', label: t('allRoles') },
              { value: 'Duelist', label: tRoles('duelist') },
              { value: 'Initiator', label: tRoles('initiator') },
              { value: 'Controller', label: tRoles('controller') },
              { value: 'Sentinel', label: tRoles('sentinel') },
              { value: 'Flex', label: tRoles('flex') }
            ]}
            className="min-w-[140px]"
          />
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
      <div className="bg-gradient-to-br from-dark-card via-dark-card to-primary/5 border border-gray-800 rounded-xl p-6 shadow-xl">
        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <div className="w-1 h-6 bg-gradient-to-b from-primary to-primary-dark rounded-full"></div>
          {t('zoneDefinitions')}
        </h3>
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


