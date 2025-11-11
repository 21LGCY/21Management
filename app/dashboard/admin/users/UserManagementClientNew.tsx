'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { UserProfile, UserRole, ValorantRank } from '@/lib/types/database'
import { Plus, Search, Users, User as UserIcon, Shield, Crown, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

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
      <div className="flex items-center justify-between">
        <p className="text-gray-400 text-sm">
          Showing {filteredUsers.length} of {users.length} users
        </p>
        <Link
          href="/dashboard/admin/users/new"
          className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg transition"
        >
          <Plus className="w-4 h-4" />
          Add User
        </Link>
      </div>

      {/* Search and Filters */}
      <div className="bg-dark-card border border-gray-800 rounded-lg p-6">
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

          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as UserRole | 'all')}
            className="px-4 py-2 bg-dark border border-gray-700 rounded-lg text-white focus:border-primary focus:outline-none font-sans"
          >
            <option value="all">All Account Types</option>
            <option value="admin">Admin</option>
            <option value="manager">Manager</option>
            <option value="player">Player</option>
          </select>

          <select
            value={teamFilter}
            onChange={(e) => setTeamFilter(e.target.value)}
            className="px-4 py-2 bg-dark border border-gray-700 rounded-lg text-white focus:border-primary focus:outline-none font-sans"
          >
            <option value="all">All Teams</option>
            <option value="none">No Team</option>
            {teams.map((team) => (
              <option key={team.id} value={team.id}>
                {team.name}
              </option>
            ))}
          </select>

          <select
            value={positionFilter}
            onChange={(e) => setPositionFilter(e.target.value)}
            className="px-4 py-2 bg-dark border border-gray-700 rounded-lg text-white focus:border-primary focus:outline-none font-sans"
          >
            <option value="all">All Roles</option>
            {roles.map((role) => (
              <option key={role} value={role}>{role}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Users Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredUsers.length > 0 ? (
          filteredUsers.map((user) => {
            const rankImage = getRankImage(user.rank)
            const teamTag = (user as any).teams?.tag || null
            
            return (
              <Link
                key={user.id}
                href={`/dashboard/admin/users/view/${user.id}`}
                className="block bg-dark-card border border-gray-800 rounded-lg hover:border-gray-700 transition"
              >
                <div className="p-4 flex flex-col h-full">
                  <div className="space-y-2 flex-1">
                    {/* Header: Avatar + Name/IGN (left) + Team|Role Badge & Rank (right) */}
                    <div className="flex items-start justify-between gap-3">
                      {/* Left: Avatar + Name & IGN */}
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        {/* Avatar */}
                        <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0">
                          {user.avatar_url ? (
                            <Image
                              src={user.avatar_url}
                              alt={user.username}
                              width={48}
                              height={48}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <UserIcon className="w-6 h-6 text-primary" />
                          )}
                        </div>
                        
                        {/* Name & IGN */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <h3 className="text-lg font-bold text-white truncate">
                              {user.in_game_name || user.username}
                            </h3>
                            {user.nationality && (
                              <Image
                                src={`https://flagcdn.com/${user.nationality.toLowerCase()}.svg`}
                                alt={user.nationality}
                                width={20}
                                height={15}
                                className="object-contain flex-shrink-0"
                              />
                            )}
                          </div>
                          {user.in_game_name && (
                            <p className="text-sm text-gray-400">@{user.username}</p>
                          )}
                        </div>
                      </div>

                      {/* Right: Team|Role Badge & Rank */}
                      <div className="flex flex-col items-end gap-3 flex-shrink-0">
                        {/* Team | Role Badge */}
                        <span className={`px-2 py-1 text-xs border rounded whitespace-nowrap ${getRoleColor(user.role)}`}>
                          {teamTag || 'No Team'} | {getRoleLabel(user.role)}
                        </span>
                        
                        {/* Rank Image */}
                        {user.rank && rankImage && (
                          <div className="relative group/rank">
                            <Image
                              src={rankImage}
                              alt={user.rank}
                              width={40}
                              height={40}
                              className="object-contain"
                            />
                            <div className="absolute bottom-full right-0 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover/rank:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                              {user.rank}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Player-specific Info */}
                    {user.role === 'player' && (
                      <div className="space-y-2">
                        {/* Role and Status Badges */}
                        <div className="flex items-center gap-1 flex-wrap">
                          {user.position && (
                            <span className={`px-2 py-0.5 text-xs border rounded ${getPositionColor(user.position)}`}>
                              {user.position}
                            </span>
                          )}
                          {user.is_igl && (
                            <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-400 text-xs rounded border border-yellow-500/30">
                              IGL
                            </span>
                          )}
                          {user.is_substitute && (
                            <span className="px-2 py-0.5 bg-orange-500/20 text-orange-400 text-xs rounded border border-orange-500/30">
                              SUB
                            </span>
                          )}
                        </div>

                        {/* Agent Pool */}
                        {user.champion_pool && user.champion_pool.length > 0 && (
                          <div>
                            <p className="text-xs text-gray-400 mb-1">Main Agents</p>
                            <p className="text-xs text-gray-300">
                              {user.champion_pool.slice(0, 2).join(', ')}
                              {user.champion_pool.length > 2 && ` +${user.champion_pool.length - 2}`}
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Manager-specific Info */}
                    {user.role === 'manager' && user.staff_role && (
                      <div>
                        <p className="text-xs text-gray-400">Role</p>
                        <p className="text-sm text-white font-medium">{user.staff_role}</p>
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
