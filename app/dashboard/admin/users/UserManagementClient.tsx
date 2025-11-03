'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { UserProfile, UserRole, ValorantRank } from '@/lib/types/database'
import { Plus, Edit, Trash2, Search, User as UserIcon } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

export default function UserManagementClient() {
  const [users, setUsers] = useState<UserProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState<UserRole | 'all'>('all')
  const [teamFilter, setTeamFilter] = useState<string>('all')
  const [positionFilter, setPositionFilter] = useState<string>('all')
  const [teams, setTeams] = useState<any[]>([])
  
  const supabase = createClient()

  // Helper function to get rank image path
  const getRankImage = (rank: ValorantRank | null | undefined): string | null => {
    if (!rank) return null
    const rankMap: Record<ValorantRank, string> = {
      'Ascendant 1': '/images/asc_1_rank.webp',
      'Ascendant 2': '/images/asc_2_rank.webp',
      'Ascendant 3': '/images/asc_3_rank.webp',
      'Immortal 1': '/images/immo_1_rank.webp',
      'Immortal 2': '/images/immo_2_rank.webp',
      'Immortal 3': '/images/immo_3_rank.webp',
      'Radiant': '/images/rad_rank.webp',
    }
    return rankMap[rank] || null
  }

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
      
      console.log('Fetched users:', data)
      setUsers(data || [])
    } catch (error) {
      console.error('Error fetching users:', error)
    } finally {
      setLoading(false)
    }
  }

  const deleteUser = async (id: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return

    try {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', id)

      if (error) throw error
      setUsers(users.filter(u => u.id !== id))
    } catch (error) {
      console.error('Error deleting user:', error)
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

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return 'bg-red-500/20 text-red-300 border-red-500/30'
      case 'manager':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/30'
      case 'player':
        return 'bg-green-500/20 text-green-300 border-green-500/30'
      default:
        return 'bg-gray-500/20 text-gray-300 border-gray-500/30'
    }
  }

  if (loading) {
    return <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
    </div>
  }

  return (
    <div>
      {/* Header with search and filters */}
      <div className="mb-6 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div className="flex-1 flex flex-wrap gap-4">
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-dark-card border border-gray-800 rounded-lg text-white focus:outline-none focus:border-primary"
            />
          </div>
          
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as UserRole | 'all')}
            className="px-4 py-2 bg-dark-card border border-gray-800 rounded-lg text-white focus:outline-none focus:border-primary"
          >
            <option value="all">All Account Types</option>
            <option value="admin">Admin</option>
            <option value="manager">Manager</option>
            <option value="player">Player</option>
          </select>

          <select
            value={teamFilter}
            onChange={(e) => setTeamFilter(e.target.value)}
            className="px-4 py-2 bg-dark-card border border-gray-800 rounded-lg text-white focus:outline-none focus:border-primary"
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

        <Link
          href="/dashboard/admin/users/new"
          className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg transition"
        >
          <Plus className="w-5 h-5" />
          Add User
        </Link>
      </div>

      {/* Users Table */}
      <div className="bg-dark-card border border-gray-800 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-dark border-b border-gray-800">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Avatar
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Account Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Team
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Rank
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="text-gray-400 text-lg">
                        {users.length === 0 ? 'No users yet' : 'No users found matching your filters'}
                      </div>
                      {users.length === 0 && (
                        <Link
                          href="/dashboard/admin/users/new"
                          className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg transition text-sm"
                        >
                          <Plus className="w-4 h-4" />
                          Create First User
                        </Link>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-dark transition">
                    {/* Avatar */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {user.avatar_url ? (
                          <Image
                            src={user.avatar_url}
                            alt={user.username}
                            width={32}
                            height={32}
                            className="rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center">
                            <UserIcon className="w-4 h-4 text-gray-400" />
                          </div>
                        )}
                      </div>
                    </td>
                    
                    {/* User */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="font-medium text-white">{user.username}</div>
                        <div className="text-sm text-gray-400">
                          {user.role === 'player' && user.in_game_name ? `@${user.in_game_name}` : 
                           user.role === 'manager' && user.staff_role ? user.staff_role : '-'}
                        </div>
                      </div>
                    </td>
                    
                    {/* Account Type */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs border rounded uppercase ${getRoleBadge(user.role)}`}>
                        {user.role}
                      </span>
                    </td>
                    
                    {/* Role - show staff_role for managers, position for players */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-white">
                        {user.role === 'manager' ? (user.staff_role || '-') : 
                         user.role === 'player' ? (user.position || '-') : '-'}
                      </span>
                      {user.is_igl && (
                        <span className="ml-2 px-2 py-0.5 text-xs bg-secondary/20 text-secondary border border-secondary/30 rounded">
                          IGL
                        </span>
                      )}
                    </td>
                    
                    {/* Team */}
                    <td className="px-6 py-4 whitespace-nowrap text-gray-300">
                      {(user as any).teams?.name || '-'}
                    </td>
                    
                    {/* Rank - show image with tooltip */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      {user.rank && getRankImage(user.rank) ? (
                        <div className="relative group inline-block">
                          <Image
                            src={getRankImage(user.rank)!}
                            alt={user.rank}
                            width={32}
                            height={32}
                            className="rounded"
                          />
                          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                            {user.rank}
                          </div>
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    
                    {/* Actions */}
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end gap-2">
                        <Link
                          href={`/dashboard/admin/users/${user.id}`}
                          className="p-2 text-primary hover:bg-primary/10 rounded transition"
                        >
                          <Edit className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => deleteUser(user.id)}
                          className="p-2 text-red-400 hover:bg-red-400/10 rounded transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Stats */}
      <div className="mt-4 text-sm text-gray-400">
        Showing {filteredUsers.length} of {users.length} users
      </div>
    </div>
  )
}
