'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { UserProfile, UserRole, ValorantRank } from '@/lib/types/database'
import { Plus, Search, Users, User as UserIcon, Shield, Crown, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { optimizeAvatar } from '@/lib/cloudinary/optimize'
import { getNationalityDisplay } from '@/lib/utils/nationality'
import { getTeamColors } from '@/lib/utils/teamColors'
import CustomSelect from '@/components/CustomSelect'

// Utility function to get rank image
const getRankImage = (rank: string | undefined | null): string | null => {
  if (!rank) return null
  
  const rankMap: { [key: string]: string } = {
    'Ascendant 1': '/images/asc_1_rank.webp',
    'Ascendant 2': '/images/asc_2_rank.webp',
    'Ascendant 3': '/images/asc_3_rank.webp',
    'Immortal 1': '/images/immo_1_rank.webp',
    'Immortal 2': '/images/immo_2_rank.webp',
    'Immortal 3': '/images/immo_3_rank.webp',
    'Radiant': '/images/rad_rank.webp'
  }
  
  return rankMap[rank] || null
}

// Get role color for badge
const getRoleColor = (role: UserRole) => {
  switch (role) {
    case 'admin': return 'bg-red-500/20 text-red-300 border-red-500/30'
    case 'manager': return 'bg-blue-500/20 text-blue-300 border-blue-500/30'
    case 'player': return 'bg-green-500/20 text-green-300 border-green-500/30'
  }
}

// Get role label
const getRoleLabel = (role: UserRole) => {
  switch (role) {
    case 'admin': return 'Admin'
    case 'manager': return 'Manager'
    case 'player': return 'Player'
  }
}

// Get position color
const getPositionColor = (position?: string) => {
  switch (position) {
    case 'Duelist': return 'bg-red-500/20 text-red-300 border-red-500/30'
    case 'Initiator': return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30'
    case 'Controller': return 'bg-purple-500/20 text-purple-300 border-purple-500/30'
    case 'Sentinel': return 'bg-blue-500/20 text-blue-300 border-blue-500/30'
    case 'Flex': return 'bg-green-500/20 text-green-300 border-green-500/30'
    default: return 'bg-gray-500/20 text-gray-300 border-gray-500/30'
  }
}

export default function UserManagementClient() {
  const [users, setUsers] = useState<UserProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState<UserRole | 'all'>('all')
  const [teamFilter, setTeamFilter] = useState<string>('all')
  const [positionFilter, setPositionFilter] = useState<string>('all')
  const [teams, setTeams] = useState<any[]>([])
  
  const supabase = createClient()

  useEffect(() => {
    fetchUsers()
    fetchTeams()
  }, [])

  const fetchTeams = async () => {
    const { data } = await supabase
      .from('teams')
      .select('id, name, tag')
      .order('name')
    setTeams(data || [])
  }

  const fetchUsers = async () => {
    try {
      let query = supabase
        .from('profiles')
        .select('*, teams(name, tag)')
        .order('created_at', { ascending: false })

      const { data, error } = await query

      if (error) {
        console.error('Error fetching users:', error)
        throw error
      }
      
      setUsers(data || [])
    } catch (error) {
      console.error('Error fetching users:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.in_game_name?.toLowerCase().includes(searchTerm.toLowerCase()))
    
    const matchesRole = roleFilter === 'all' || user.role === roleFilter
    const matchesTeam = teamFilter === 'all' || user.team_id === teamFilter || (teamFilter === 'none' && !user.team_id)
    const matchesPosition = positionFilter === 'all' || user.position === positionFilter
    
    return matchesSearch && matchesRole && matchesTeam && matchesPosition
  })

  const roles = [...new Set(users.filter(u => u.role === 'player').map(u => u.position).filter(Boolean))]

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Add User Button and Count */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <p className="text-gray-400 text-sm font-semibold">
          Showing {filteredUsers.length} of {users.length} users
        </p>
        <Link
          href="/dashboard/admin/users/new"
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-primary to-primary-dark hover:from-primary-dark hover:to-primary text-white rounded-lg transition-all shadow-lg hover:shadow-primary/20"
        >
          <Plus className="w-4 h-4" />
          <span>Add User</span>
        </Link>
      </div>

      {/* Search and Filters */}
      <div className="bg-gradient-to-br from-dark-card via-dark-card to-primary/5 border border-gray-800 rounded-xl p-6 shadow-xl">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-1 h-5 bg-gradient-to-b from-primary to-primary-dark rounded-full"></div>
          <h3 className="text-lg font-semibold text-white">Search & Filter</h3>
        </div>
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search by username or IGN..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-dark border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:border-primary focus:outline-none"
            />
          </div>

          <CustomSelect
            value={roleFilter}
            onChange={(value) => setRoleFilter(value as UserRole | 'all')}
            options={[
              { value: 'all', label: 'All Account Types' },
              { value: 'admin', label: 'Admin' },
              { value: 'manager', label: 'Manager' },
              { value: 'player', label: 'Player' }
            ]}
            className=""
          />

          <CustomSelect
            value={teamFilter}
            onChange={(value) => setTeamFilter(value)}
            options={[
              { value: 'all', label: 'All Teams' },
              { value: 'none', label: 'No Team' },
              ...teams.map(team => ({
                value: team.id,
                label: team.name
              }))
            ]}
            className="min-w-[200px]"
          />

          <CustomSelect
            value={positionFilter}
            onChange={(value) => setPositionFilter(value)}
            options={[
              { value: 'all', label: 'All Roles' },
              ...roles.map(role => ({
                value: role as string,
                label: role as string
              }))
            ]}
            className=""
          />
        </div>
      </div>

      {/* Users Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredUsers.length > 0 ? (
          filteredUsers.map((user) => {
            const rankImage = getRankImage(user.rank)
            const teamTag = (user as any).teams?.tag || null
            const nationality = getNationalityDisplay(user.nationality)
            const teamColors = getTeamColors(teamTag)
            
            // Adjust opacity for team borders - reduce from /50 to /30
            const adjustedBorder = teamTag 
              ? teamColors.border.replace('/50', '/30')
              : 'border-gray-800'
            const adjustedHoverBorder = teamTag 
              ? teamColors.hoverBorder.replace('/70', '/50')
              : 'hover:border-primary'
            
            return (
              <Link
                key={user.id}
                href={`/dashboard/admin/users/view/${user.id}`}
                className={`block bg-gradient-to-br ${teamColors.gradient} border ${adjustedBorder} rounded-xl ${adjustedHoverBorder} transition-all group`}
                style={{
                  ...teamColors.style,
                  boxShadow: '0 0 0 0 transparent',
                  transition: 'all 0.3s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = `0 10px 25px -5px ${teamColors.hoverShadow}, 0 8px 10px -6px ${teamColors.hoverShadow}`
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = '0 0 0 0 transparent'
                }}
              >
                <div className="p-6">
                  {/* Player Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      {/* Avatar */}
                      <div className="w-14 h-14 bg-gradient-to-br from-primary/30 to-primary/10 rounded-full flex items-center justify-center overflow-hidden ring-2 ring-primary/20 flex-shrink-0">
                        {user.avatar_url ? (
                          <Image
                            src={optimizeAvatar(user.avatar_url)}
                            alt={user.username}
                            width={56}
                            height={56}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <UserIcon className="w-7 h-7 text-primary" />
                        )}
                      </div>
                      
                      {/* Name & IGN */}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-white text-lg group-hover:text-primary transition truncate">
                          {user.in_game_name || user.username}
                        </h3>
                        {user.in_game_name && (
                          <p className="text-sm text-gray-400">@{user.username}</p>
                        )}
                      </div>
                    </div>

                    {/* Team|Role Badge - Top Right */}
                    <div className="flex-shrink-0">
                      {user.role === 'admin' ? (
                        <span className="px-3 py-1.5 text-xs border rounded-lg whitespace-nowrap font-semibold bg-red-500/20 text-red-300 border-red-500/30 flex items-center gap-1.5">
                          <Shield className="w-3.5 h-3.5" />
                          Admin
                        </span>
                      ) : (
                        <span 
                          className={`px-3 py-1.5 text-xs border rounded-lg whitespace-nowrap font-semibold ${teamColors.badgeColors}`}
                          style={teamColors.badgeStyle}
                        >
                          {teamTag || 'No Team'} | {getRoleLabel(user.role)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Player Info */}
                  <div className="space-y-4">

                    {/* Role and Status Badges */}
                    {user.role === 'player' && (
                      <div className="flex items-center gap-2 flex-wrap">
                        {user.position && (
                          <span className={`px-3 py-1.5 text-xs font-semibold border rounded-lg ${getPositionColor(user.position)}`}>
                            {user.position}
                          </span>
                        )}
                        {user.is_igl && (
                          <span className="px-3 py-1.5 bg-gradient-to-r from-yellow-500/20 to-yellow-600/20 text-yellow-400 text-xs rounded-lg font-semibold border border-yellow-500/30">
                            IGL
                          </span>
                        )}
                        {user.is_substitute && (
                          <span className="px-3 py-1.5 bg-gradient-to-r from-orange-500/20 to-orange-600/20 text-orange-400 text-xs rounded-lg font-semibold border border-orange-500/30">
                            SUB
                          </span>
                        )}
                      </div>
                    )}

                    {/* Rank and Nationality Grid */}
                    {user.role === 'player' && (
                      <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 bg-dark/50 rounded-lg border border-gray-800 flex items-center justify-center group/rank relative">
                          {rankImage ? (
                            <>
                              <Image
                                src={rankImage}
                                alt={user.rank || 'Unranked'}
                                width={32}
                                height={32}
                                className="object-contain"
                              />
                              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover/rank:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                                {user.rank}
                              </div>
                            </>
                          ) : (
                            <span className="text-gray-500 text-xs">N/A</span>
                          )}
                        </div>
                        <div className="p-3 bg-dark/50 rounded-lg border border-gray-800 flex items-center justify-center group/nation relative">
                          {nationality ? (
                            <>
                              <Image
                                src={nationality.flagUrl}
                                alt={nationality.code}
                                width={32}
                                height={24}
                                className="rounded object-cover"
                              />
                              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover/nation:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                                {nationality.name}
                              </div>
                            </>
                          ) : (
                            <span className="text-gray-500 text-xs">N/A</span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Agent Pool */}
                    {user.role === 'player' && user.champion_pool && user.champion_pool.length > 0 && (
                      <div className="p-3 bg-dark/50 rounded-lg border border-gray-800">
                        <p className="text-gray-400 text-xs mb-2 font-medium">Main Agents</p>
                        <div className="flex flex-wrap gap-1.5">
                          {user.champion_pool.slice(0, 3).map((agent: string) => (
                            <span key={agent} className="px-2.5 py-1 bg-gradient-to-r from-gray-700 to-gray-800 text-gray-200 text-xs rounded-md font-medium border border-gray-700">
                              {agent}
                            </span>
                          ))}
                          {user.champion_pool.length > 3 && (
                            <span className="px-2.5 py-1 bg-primary/20 text-primary text-xs rounded-md font-medium border border-primary/30">
                              +{user.champion_pool.length - 3}
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Manager-specific Info */}
                    {user.role === 'manager' && user.staff_role && (
                      <div className="p-3 bg-dark/50 rounded-lg border border-gray-800">
                        <p className="text-gray-400 text-xs mb-1.5 font-medium">Staff Role</p>
                        <p className="text-sm text-white font-semibold">{user.staff_role}</p>
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            )
          })
        ) : (
          <div className="col-span-full text-center py-12">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-400 text-lg mb-2">
              {users.length === 0 ? 'No users yet' : 'No users match your search'}
            </p>
            <p className="text-gray-500 mb-4">
              {users.length === 0 
                ? 'Get started by creating your first user'
                : 'Try adjusting your search criteria'
              }
            </p>
            {users.length === 0 && (
              <Link
                href="/dashboard/admin/users/new"
                className="inline-flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg transition text-sm"
              >
                <Plus className="w-4 h-4" />
                Create First User
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
