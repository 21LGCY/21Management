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
      .select('id, name')
      .order('name')
    setTeams(data || [])
  }

  const fetchUsers = async () => {
    try {
      let query = supabase
        .from('profiles')
        .select('*, teams(name)')
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
            className="px-4 py-2 bg-dark border border-gray-700 rounded-lg text-white focus:border-primary focus:outline-none"
          >
            <option value="all">All Account Types</option>
            <option value="admin">Admin</option>
            <option value="manager">Manager</option>
            <option value="player">Player</option>
          </select>

          <select
            value={teamFilter}
            onChange={(e) => setTeamFilter(e.target.value)}
            className="px-4 py-2 bg-dark border border-gray-700 rounded-lg text-white focus:border-primary focus:outline-none"
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
            className="px-4 py-2 bg-dark border border-gray-700 rounded-lg text-white focus:border-primary focus:outline-none"
          >
            <option value="all">All Roles</option>
            {roles.map((role) => (
              <option key={role} value={role}>{role}</option>
            ))}
          </select>
        </div>
      </div>

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

      {/* Users Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredUsers.length > 0 ? (
          filteredUsers.map((user) => (
            <div
              key={user.id}
              className="bg-dark-card border border-gray-800 rounded-lg p-6 hover:border-primary/50 transition flex flex-col"
            >
              {/* User Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3 flex-1">
                  <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center overflow-hidden">
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
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-white truncate">
                        {user.in_game_name || user.username}
                      </h3>
                      {user.nationality && (
                        <Image
                          src={`https://flagcdn.com/16x12/${user.nationality.toLowerCase()}.png`}
                          alt={user.nationality}
                          width={24}
                          height={18}
                          className="object-contain flex-shrink-0"
                          title={user.nationality}
                        />
                      )}
                    </div>
                    <p className="text-sm text-gray-400 truncate">{user.username}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2 ml-2">
                  <Link href={`/dashboard/admin/users/view/${user.id}`}>
                    <button className="text-primary hover:text-primary-light text-sm font-medium whitespace-nowrap">
                      View
                    </button>
                  </Link>
                </div>
              </div>

              {/* Account Type Badge and Rank */}
              <div className="flex items-center justify-between mb-4">
                <span className={`px-2 py-1 text-xs rounded-lg font-medium flex items-center gap-1 ${
                  user.role === 'admin' 
                    ? 'bg-red-500/20 text-red-400' 
                    : user.role === 'manager' 
                    ? 'bg-blue-500/20 text-blue-400' 
                    : 'bg-green-500/20 text-green-400'
                }`}>
                  {user.role === 'admin' && <Shield className="w-3 h-3" />}
                  {user.role === 'manager' && <Crown className="w-3 h-3" />}
                  {user.role === 'player' && <Users className="w-3 h-3" />}
                  {user.role.toUpperCase()}
                </span>
                {user.rank && getRankImage(user.rank) && (
                  <div className="relative group">
                    <Image
                      src={getRankImage(user.rank)!}
                      alt={user.rank}
                      width={48}
                      height={48}
                      className="object-contain"
                    />
                    <div className="absolute bottom-full right-0 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                      {user.rank}
                    </div>
                  </div>
                )}
              </div>

              {/* Player-specific Info */}
              {user.role === 'player' && (
                <div className="space-y-3">
                  {/* Role and Status Badges */}
                  <div className="flex items-center gap-2 flex-wrap">
                    {user.position && (
                      <span className="px-2 py-1 bg-primary/20 text-primary text-xs rounded-lg font-medium">
                        {user.position}
                      </span>
                    )}
                    {user.is_igl && (
                      <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 text-xs rounded-lg font-medium">
                        IGL
                      </span>
                    )}
                    {user.is_substitute && (
                      <span className="px-2 py-1 bg-orange-500/20 text-orange-400 text-xs rounded-lg font-medium">
                        SUB
                      </span>
                    )}
                  </div>

                  {/* Agent Pool */}
                  {user.champion_pool && user.champion_pool.length > 0 && (
                    <div>
                      <p className="text-gray-400 text-xs mb-1">Main Agents</p>
                      <div className="flex flex-wrap gap-1">
                        {user.champion_pool.slice(0, 3).map((agent: string) => (
                          <span key={agent} className="px-2 py-1 bg-gray-700 text-gray-300 text-xs rounded">
                            {agent}
                          </span>
                        ))}
                        {user.champion_pool.length > 3 && (
                          <span className="px-2 py-1 bg-gray-700 text-gray-300 text-xs rounded">
                            +{user.champion_pool.length - 3}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Manager-specific Info */}
              {user.role === 'manager' && (
                <div className="space-y-3">
                  {user.staff_role && (
                    <div>
                      <p className="text-gray-400 text-sm">Role</p>
                      <p className="text-white font-medium">{user.staff_role}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Spacer to push content to bottom */}
              <div className="flex-grow"></div>

              {/* Team Info */}
              <div className="mt-4">
                <p className="text-gray-400 text-sm mb-1">Team</p>
                {user.team_id ? (
                  <Link 
                    href={`/dashboard/admin/teams/view/${user.team_id}`}
                    className="inline-flex items-center gap-1.5 text-primary hover:text-primary-light font-medium transition"
                  >
                    <span>{(user as any).teams?.name || 'Unknown Team'}</span>
                    <ExternalLink className="w-3.5 h-3.5 flex-shrink-0" />
                  </Link>
                ) : (
                  <p className="text-white font-medium">No Team</p>
                )}
              </div>

              {/* Join Date - Always at bottom */}
              <div className="mt-4 pt-4 border-t border-gray-800">
                <div className="flex justify-between text-xs text-gray-400">
                  <span>Joined</span>
                  <span>{new Date(user.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          ))
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
