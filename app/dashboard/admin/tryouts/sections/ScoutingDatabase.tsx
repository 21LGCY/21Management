'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ProfileTryout, TryoutStatus, ValorantRole } from '@/lib/types/database'
import { Plus, Edit, Trash2, Search, ExternalLink, Filter } from 'lucide-react'
import Link from 'next/link'

export default function ScoutingDatabase() {
  const [tryouts, setTryouts] = useState<ProfileTryout[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<TryoutStatus | 'all'>('all')
  const [roleFilter, setRoleFilter] = useState<ValorantRole | 'all'>('all')
  
  const supabase = createClient()

  useEffect(() => {
    fetchTryouts()
  }, [])

  const fetchTryouts = async () => {
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

  const deleteTryout = async (id: string) => {
    if (!confirm('Are you sure you want to delete this profile?')) return

    try {
      const { error } = await supabase
        .from('profiles_tryouts')
        .delete()
        .eq('id', id)

      if (error) throw error
      setTryouts(tryouts.filter(t => t.id !== id))
    } catch (error) {
      console.error('Error deleting tryout:', error)
    }
  }

  const filteredTryouts = tryouts.filter(tryout => {
    const matchesSearch = 
      tryout.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (tryout.full_name?.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (tryout.in_game_name?.toLowerCase().includes(searchTerm.toLowerCase()))
    
    const matchesStatus = statusFilter === 'all' || tryout.contact_status === statusFilter
    const matchesRole = roleFilter === 'all' || tryout.position === roleFilter
    
    return matchesSearch && matchesStatus && matchesRole
  })

  const getStatusColor = (status: TryoutStatus) => {
    switch (status) {
      case 'Not Contacted': return 'bg-gray-500/20 text-gray-300 border-gray-500/30'
      case 'Contacted/Pending': return 'bg-blue-500/20 text-blue-300 border-blue-500/30'
      case 'In Tryouts': return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30'
      case 'Player': return 'bg-green-500/20 text-green-300 border-green-500/30'
      case 'Substitute': return 'bg-purple-500/20 text-purple-300 border-purple-500/30'
      case 'Rejected': return 'bg-red-500/20 text-red-300 border-red-500/30'
      case 'Left': return 'bg-orange-500/20 text-orange-300 border-orange-500/30'
    }
  }

  const getRoleColor = (role?: ValorantRole) => {
    switch (role) {
      case 'Duelist': return 'bg-red-500/20 text-red-300 border-red-500/30'
      case 'Initiator': return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30'
      case 'Controller': return 'bg-purple-500/20 text-purple-300 border-purple-500/30'
      case 'Sentinel': return 'bg-blue-500/20 text-blue-300 border-blue-500/30'
      case 'Flex': return 'bg-green-500/20 text-green-300 border-green-500/30'
      default: return 'bg-gray-500/20 text-gray-300 border-gray-500/30'
    }
  }

  const getStatusStats = () => {
    return {
      notContacted: tryouts.filter(t => t.contact_status === 'Not Contacted').length,
      contacted: tryouts.filter(t => t.contact_status === 'Contacted/Pending').length,
      inTryouts: tryouts.filter(t => t.contact_status === 'In Tryouts').length,
      accepted: tryouts.filter(t => t.contact_status === 'Player').length,
      substitute: tryouts.filter(t => t.contact_status === 'Substitute').length,
      rejected: tryouts.filter(t => t.contact_status === 'Rejected').length,
    }
  }

  const stats = getStatusStats()

  if (loading) {
    return <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
    </div>
  }

  return (
    <div className="space-y-6">
      {/* Status Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-dark-card border border-gray-800 rounded-lg p-4">
          <p className="text-xs text-gray-400 mb-1 uppercase">Not Contacted</p>
          <p className="text-2xl font-bold text-gray-300">{stats.notContacted}</p>
        </div>
        <div className="bg-dark-card border border-blue-800/50 rounded-lg p-4">
          <p className="text-xs text-gray-400 mb-1 uppercase">Contacted</p>
          <p className="text-2xl font-bold text-blue-300">{stats.contacted}</p>
        </div>
        <div className="bg-dark-card border border-yellow-800/50 rounded-lg p-4">
          <p className="text-xs text-gray-400 mb-1 uppercase">In Tryouts</p>
          <p className="text-2xl font-bold text-yellow-300">{stats.inTryouts}</p>
        </div>
        <div className="bg-dark-card border border-green-800/50 rounded-lg p-4">
          <p className="text-xs text-gray-400 mb-1 uppercase">Players</p>
          <p className="text-2xl font-bold text-green-300">{stats.accepted}</p>
        </div>
        <div className="bg-dark-card border border-purple-800/50 rounded-lg p-4">
          <p className="text-xs text-gray-400 mb-1 uppercase">Substitutes</p>
          <p className="text-2xl font-bold text-purple-300">{stats.substitute}</p>
        </div>
        <div className="bg-dark-card border border-red-800/50 rounded-lg p-4">
          <p className="text-xs text-gray-400 mb-1 uppercase">Rejected</p>
          <p className="text-2xl font-bold text-red-300">{stats.rejected}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-dark-card border border-gray-800 rounded-lg p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by name, username, or IGN..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-dark border border-gray-800 rounded-lg text-white focus:outline-none focus:border-primary"
            />
          </div>
          
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as TryoutStatus | 'all')}
            className="px-4 py-2 bg-dark border border-gray-800 rounded-lg text-white focus:outline-none focus:border-primary"
          >
            <option value="all">All Statuses</option>
            <option value="Not Contacted">Not Contacted</option>
            <option value="Contacted/Pending">Contacted/Pending</option>
            <option value="In Tryouts">In Tryouts</option>
            <option value="Player">Player</option>
            <option value="Substitute">Substitute</option>
            <option value="Rejected">Rejected</option>
            <option value="Left">Left</option>
          </select>

          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as ValorantRole | 'all')}
            className="px-4 py-2 bg-dark border border-gray-800 rounded-lg text-white focus:outline-none focus:border-primary"
          >
            <option value="all">All Roles</option>
            <option value="Duelist">Duelist</option>
            <option value="Initiator">Initiator</option>
            <option value="Controller">Controller</option>
            <option value="Sentinel">Sentinel</option>
            <option value="Flex">Flex</option>
          </select>

          <Link
            href="/dashboard/admin/tryouts/new"
            className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg transition whitespace-nowrap"
          >
            <Plus className="w-5 h-5" />
            Add Scout
          </Link>
        </div>
      </div>

      {/* Players Table */}
      <div className="bg-dark-card border border-gray-800 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-dark border-b border-gray-800">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Player</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Role</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Rank</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Managed By</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Last Contact</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {filteredTryouts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-400">
                    No scouting profiles found. Click "Add Scout" to create one.
                  </td>
                </tr>
              ) : (
                filteredTryouts.map((tryout) => (
                  <tr key={tryout.id} className="hover:bg-dark transition">
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-medium text-white">
                          {tryout.full_name || tryout.username}
                        </div>
                        <div className="text-sm text-gray-400">
                          {tryout.in_game_name && `${tryout.in_game_name} • `}
                          @{tryout.username}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs border rounded whitespace-nowrap ${getStatusColor(tryout.contact_status)}`}>
                        {tryout.contact_status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1">
                        <span className={`px-2 py-1 text-xs border rounded ${getRoleColor(tryout.position)}`}>
                          {tryout.position || 'N/A'}
                        </span>
                        {tryout.is_igl && (
                          <span className="px-2 py-0.5 text-xs bg-secondary/20 text-secondary border border-secondary/30 rounded">
                            IGL
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-300 text-sm">
                      {tryout.rank || '-'}
                    </td>
                    <td className="px-6 py-4 text-gray-300 text-sm">
                      {tryout.managed_by || '-'}
                    </td>
                    <td className="px-6 py-4 text-gray-300 text-sm">
                      {tryout.last_contact_date 
                        ? new Date(tryout.last_contact_date).toLocaleDateString()
                        : '-'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        {tryout.valorant_tracker_url && (
                          <a
                            href={tryout.valorant_tracker_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 text-gray-400 hover:text-primary hover:bg-primary/10 rounded transition"
                            title="View Tracker"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        )}
                        <Link
                          href={`/dashboard/admin/tryouts/${tryout.id}`}
                          className="p-2 text-primary hover:bg-primary/10 rounded transition"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => deleteTryout(tryout.id)}
                          className="p-2 text-red-400 hover:bg-red-400/10 rounded transition"
                          title="Delete"
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

      {/* Footer Stats */}
      <div className="text-sm text-gray-400 text-center">
        Showing {filteredTryouts.length} of {tryouts.length} scouting profiles
      </div>
    </div>
  )
}
