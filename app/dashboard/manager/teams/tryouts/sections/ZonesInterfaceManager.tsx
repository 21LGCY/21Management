'use client'

import { useState, useEffect } from 'react'
import { Globe, Users, TrendingUp } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { ProfileTryout, TeamCategory, TryoutStatus, ValorantRole } from '@/lib/types/database'

// VALORANT Zone mapping (same as admin)
const VALORANT_ZONES: { [key: string]: string[] } = {
  'EMEA': [
    'AT', 'Austria',
    'BE', 'Belgium', 
    'BG', 'Bulgaria',
    'HR', 'Croatia',
    'CY', 'Cyprus',
    'CZ', 'Czech Republic',
    'DK', 'Denmark',
    'EE', 'Estonia',
    'FI', 'Finland',
    'FR', 'France',
    'DE', 'Germany',
    'GR', 'Greece',
    'HU', 'Hungary',
    'IS', 'Iceland',
    'IE', 'Ireland',
    'IT', 'Italy',
    'LV', 'Latvia',
    'LI', 'Liechtenstein',
    'LT', 'Lithuania',
    'LU', 'Luxembourg',
    'MT', 'Malta',
    'NL', 'Netherlands',
    'NO', 'Norway',
    'PL', 'Poland',
    'PT', 'Portugal',
    'RO', 'Romania',
    'SK', 'Slovakia',
    'SI', 'Slovenia',
    'ES', 'Spain',
    'SE', 'Sweden',
    'CH', 'Switzerland',
    'GB', 'United Kingdom', 'UK',
    'TR', 'Turkey',
    'RU', 'Russia',
    'UA', 'Ukraine',
    'BY', 'Belarus',
    'MD', 'Moldova',
    'RS', 'Serbia',
    'BA', 'Bosnia and Herzegovina',
    'ME', 'Montenegro',
    'MK', 'North Macedonia',
    'AL', 'Albania',
    'XK', 'Kosovo',
    'GE', 'Georgia',
    'AM', 'Armenia',
    'AZ', 'Azerbaijan'
  ],
  'Americas': [
    'US', 'United States',
    'CA', 'Canada',
    'MX', 'Mexico',
    'BR', 'Brazil',
    'AR', 'Argentina',
    'CL', 'Chile',
    'PE', 'Peru',
    'CO', 'Colombia',
    'VE', 'Venezuela',
    'UY', 'Uruguay',
    'PY', 'Paraguay',
    'BO', 'Bolivia',
    'EC', 'Ecuador',
    'GY', 'Guyana',
    'SR', 'Suriname',
    'GF', 'French Guiana',
    'CR', 'Costa Rica',
    'PA', 'Panama',
    'NI', 'Nicaragua',
    'HN', 'Honduras',
    'GT', 'Guatemala',
    'BZ', 'Belize',
    'SV', 'El Salvador',
    'CU', 'Cuba',
    'DO', 'Dominican Republic',
    'HT', 'Haiti',
    'JM', 'Jamaica',
    'TT', 'Trinidad and Tobago'
  ],
  'APAC': [
    'AU', 'Australia',
    'NZ', 'New Zealand',
    'JP', 'Japan',
    'KR', 'Korea', 'South Korea',
    'CN', 'China',
    'TW', 'Taiwan',
    'HK', 'Hong Kong',
    'MO', 'Macau',
    'SG', 'Singapore',
    'MY', 'Malaysia',
    'TH', 'Thailand',
    'VN', 'Vietnam',
    'PH', 'Philippines',
    'ID', 'Indonesia',
    'BN', 'Brunei',
    'KH', 'Cambodia',
    'LA', 'Laos',
    'MM', 'Myanmar',
    'IN', 'India',
    'PK', 'Pakistan',
    'BD', 'Bangladesh',
    'LK', 'Sri Lanka',
    'MV', 'Maldives',
    'NP', 'Nepal',
    'BT', 'Bhutan',
    'MN', 'Mongolia'
  ]
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

  useEffect(() => {
    if (teamCategory) {
      fetchTryouts()
    }
  }, [teamCategory])

  const fetchTryouts = async () => {
    if (!teamCategory) return
    
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
    if (!nationality) return 'Unknown'
    
    for (const [zone, countries] of Object.entries(VALORANT_ZONES)) {
      if (countries.some(country => 
        country.toLowerCase() === nationality.toLowerCase() ||
        (country.length === 2 && country.toLowerCase() === nationality.toLowerCase())
      )) {
        return zone
      }
    }
    return 'Other'
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

  const getZoneColor = (zone: string) => {
    switch (zone) {
      case 'EMEA': return 'from-blue-500 to-purple-600'
      case 'Americas': return 'from-green-500 to-blue-500'
      case 'APAC': return 'from-orange-500 to-red-500'
      case 'Other': return 'from-gray-500 to-gray-600'
      default: return 'from-gray-500 to-gray-600'
    }
  }

  const getStatusColor = (status: TryoutStatus) => {
    switch (status) {
      case 'not_contacted': return 'bg-gray-500/20 text-gray-300'
      case 'contacted': return 'bg-blue-500/20 text-blue-300'
      case 'in_tryouts': return 'bg-yellow-500/20 text-yellow-300'
      case 'player': return 'bg-green-500/20 text-green-300'
      case 'accepted': return 'bg-green-500/20 text-green-300'
      case 'substitute': return 'bg-purple-500/20 text-purple-300'
      case 'rejected': return 'bg-red-500/20 text-red-300'
      case 'left': return 'bg-orange-500/20 text-orange-300'
      default: return 'bg-gray-500/20 text-gray-300'
    }
  }

  const getStatusLabel = (status: TryoutStatus) => {
    switch (status) {
      case 'not_contacted': return 'Not Contacted'
      case 'contacted': return 'Pending'
      case 'in_tryouts': return 'Trying Out'
      case 'player': return 'Player'
      case 'accepted': return 'Accepted'
      case 'substitute': return 'Sub'
      case 'rejected': return 'Rejected'
      case 'left': return 'Left'
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
        <h3 className="text-lg font-bold text-yellow-300 mb-2">Team Category Not Found</h3>
        <p className="text-yellow-400">Unable to determine team category for "{team?.name}". Contact an administrator.</p>
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
            VALORANT Zones - {getTeamLabel(teamCategory)}
          </h2>
          <p className="text-gray-400 mt-1">
            Geographic distribution: [ {totalPlayersWithNationality} players with nationality ]
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as TryoutStatus | 'all')}
            className="px-4 py-2 bg-dark-card border border-gray-800 rounded-lg text-white focus:outline-none focus:border-primary"
          >
            <option value="all">All Status</option>
            <option value="not_contacted">Not Contacted</option>
            <option value="contacted">Contacted</option>
            <option value="in_tryouts">In Tryouts</option>
            <option value="player">Player</option>
            <option value="accepted">Accepted</option>
            <option value="substitute">Substitute</option>
            <option value="rejected">Rejected</option>
            <option value="left">Left</option>
          </select>

          {/* Role Filter */}
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as ValorantRole | 'all')}
            className="px-4 py-2 bg-dark-card border border-gray-800 rounded-lg text-white focus:outline-none focus:border-primary"
          >
            <option value="all">All Roles</option>
            <option value="Duelist">Duelist</option>
            <option value="Initiator">Initiator</option>
            <option value="Controller">Controller</option>
            <option value="Sentinel">Sentinel</option>
            <option value="Flex">Flex</option>
          </select>
        </div>
      </div>

      {/* Team Info */}
      <div className="bg-dark-card border border-gray-800 rounded-lg p-4">
        <p className="text-white">
          Analyzing geographic zones for: <span className="font-semibold text-primary">{team?.name}</span>
          <span className="ml-2 px-2 py-1 bg-primary/20 text-primary text-sm rounded">
            {teamCategory}
          </span>
        </p>
      </div>

      {/* Zone Statistics */}
      {zoneStats.length === 0 ? (
        <div className="bg-dark-card border border-gray-800 rounded-lg p-12 text-center">
          <Globe className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <div className="text-gray-400 mb-2">No nationality data available</div>
          <p className="text-gray-500 text-sm">
            Add nationalities to player profiles to see zone distribution
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
                    <span className="text-sm">Players</span>
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
                <div className="text-xs text-gray-500 mb-2">Players:</div>
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
                    +{stat.players.length - 5} more
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Zone Legend */}
      <div className="bg-dark-card border border-gray-800 rounded-lg p-6">
        <h3 className="text-xl font-bold text-white mb-4">VALORANT Zone Definitions</h3>
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