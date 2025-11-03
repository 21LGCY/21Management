'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Team, UserProfile } from '@/lib/types/database'
import { ArrowLeft, Users, Shield, User as UserIcon, Edit, Trash2 } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'

interface TeamViewClientProps {
  teamId: string
}

export default function TeamViewClient({ teamId }: TeamViewClientProps) {
  const [team, setTeam] = useState<Team | null>(null)
  const [players, setPlayers] = useState<UserProfile[]>([])
  const [substitutes, setSubstitutes] = useState<UserProfile[]>([])
  const [staff, setStaff] = useState<UserProfile[]>([])
  const [loading, setLoading] = useState(true)
  
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    fetchTeamData()
  }, [teamId])

  const fetchTeamData = async () => {
    try {
      // Fetch team info
      const { data: teamData, error: teamError } = await supabase
        .from('teams')
        .select('*')
        .eq('id', teamId)
        .single()

      if (teamError) throw teamError
      setTeam(teamData)

      // Fetch all members of this team
      const { data: membersData, error: membersError } = await supabase
        .from('profiles')
        .select('*')
        .eq('team_id', teamId)
        .order('role')
        .order('username')

      if (membersError) throw membersError

      // Separate members by type
      const playersList = membersData.filter(m => m.role === 'player' && !m.is_substitute)
      const substitutesList = membersData.filter(m => m.role === 'player' && m.is_substitute)
      const staffList = membersData.filter(m => m.role === 'manager')

      setPlayers(playersList)
      setSubstitutes(substitutesList)
      setStaff(staffList)
    } catch (error) {
      console.error('Error fetching team data:', error)
    } finally {
      setLoading(false)
    }
  }

  const deleteTeam = async () => {
    if (!confirm(`Are you sure you want to delete ${team?.name}? All associated matches will also be deleted.`)) return

    try {
      const { error } = await supabase
        .from('teams')
        .delete()
        .eq('id', teamId)

      if (error) throw error
      
      router.push('/dashboard/admin/teams')
      router.refresh()
    } catch (error) {
      console.error('Error deleting team:', error)
      alert('Failed to delete team')
    }
  }

  const getRankImage = (rank: string | null | undefined): string | null => {
    if (!rank) return null
    const rankMap: Record<string, string> = {
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

  const renderMemberCard = (member: UserProfile, showSubBadge: boolean = false) => {
    const rankImage = getRankImage(member.rank)
    
    return (
      <div key={member.id} className="bg-dark border border-gray-800 rounded-lg p-4 hover:border-gray-700 transition">
        <div className="flex flex-col items-center text-center">
          {/* Avatar */}
          <div className="mb-3">
            {member.avatar_url ? (
              <Image
                src={member.avatar_url}
                alt={member.username}
                width={48}
                height={48}
                className="rounded-full object-cover"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-gray-700 flex items-center justify-center">
                <UserIcon className="w-6 h-6 text-gray-400" />
              </div>
            )}
          </div>

          {/* Username and IGN */}
          <h3 className="font-semibold text-white mb-1">
            {member.in_game_name || member.username}
          </h3>
          <p className="text-xs text-gray-400 mb-2">{member.username}</p>
          
          {/* Badges - Role/Position */}
          <div className="flex flex-wrap gap-1 justify-center mb-2">
            {member.role === 'player' && member.position && (
              <span className="px-2 py-0.5 text-xs rounded bg-primary/20 text-primary border border-primary/30">
                {member.position}
              </span>
            )}
            {showSubBadge && (
              <span className="px-2 py-0.5 text-xs rounded bg-orange-500/20 text-orange-300 border border-orange-500/30">
                SUB
              </span>
            )}
            {member.role === 'manager' && member.staff_role && (
              <span className="px-2 py-0.5 text-xs rounded bg-primary/20 text-primary border border-primary/30">
                {member.staff_role}
              </span>
            )}
          </div>

          {/* Additional Info */}
          <div className="w-full space-y-2 text-sm">
            {/* Rank */}
            {member.rank && (
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Rank</span>
                <div className="flex items-center gap-1">
                  {rankImage && (
                    <Image
                      src={rankImage}
                      alt={member.rank}
                      width={16}
                      height={16}
                      className="object-contain"
                    />
                  )}
                  <span className="text-white">{member.rank}</span>
                </div>
              </div>
            )}
            
            {/* Nationality */}
            {member.nationality && (
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Nationality</span>
                <span className="text-white">{member.nationality}</span>
              </div>
            )}
          </div>

          {/* Joined Date */}
          {member.created_at && (
            <div className="w-full mt-3 pt-3 border-t border-gray-800 text-xs text-gray-500 flex items-center justify-between">
              <span>Joined</span>
              <span>{new Date(member.created_at).toLocaleDateString()}</span>
            </div>
          )}
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!team) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400 mb-4">Team not found</p>
        <Link
          href="/dashboard/admin/teams"
          className="text-primary hover:underline"
        >
          Back to Teams
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-4 mb-2">
            <Link
              href="/dashboard/admin/teams"
              className="text-gray-400 hover:text-white transition"
            >
              <ArrowLeft className="w-6 h-6" />
            </Link>
            <h1 className="text-3xl font-bold text-white">{team.name}</h1>
          </div>
          <p className="text-gray-400 ml-10">{team.game}</p>
        </div>
        
        <div className="flex gap-2">
          <Link
            href={`/dashboard/admin/teams/${teamId}`}
            className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg transition"
          >
            <Edit className="w-4 h-4" />
            Edit
          </Link>
          <button
            onClick={deleteTeam}
            className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition"
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </button>
        </div>
      </div>

      {/* Team Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-dark-card border border-gray-800 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/20 rounded-lg">
              <Users className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-gray-400">Players</p>
              <p className="text-2xl font-bold text-white">{players.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-dark-card border border-gray-800 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-500/20 rounded-lg">
              <Users className="w-6 h-6 text-yellow-400" />
            </div>
            <div>
              <p className="text-sm text-gray-400">Substitutes</p>
              <p className="text-2xl font-bold text-white">{substitutes.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-dark-card border border-gray-800 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <Shield className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-gray-400">Staff</p>
              <p className="text-2xl font-bold text-white">{staff.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Players Section */}
      <div className="bg-dark-card border border-gray-800 rounded-lg p-6">
        <div className="flex items-center gap-2 mb-4">
          <Users className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-semibold text-white">Main Roster</h2>
        </div>
        
        {players.length === 0 ? (
          <p className="text-gray-400 text-center py-8">No players assigned yet</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {players.map((player) => renderMemberCard(player))}
          </div>
        )}
      </div>

      {/* Substitutes Section */}
      {substitutes.length > 0 && (
        <div className="bg-dark-card border border-gray-800 rounded-lg p-6">
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-5 h-5 text-yellow-400" />
            <h2 className="text-xl font-semibold text-white">Substitutes</h2>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {substitutes.map((sub) => renderMemberCard(sub, true))}
          </div>
        </div>
      )}

      {/* Staff Section */}
      {staff.length > 0 && (
        <div className="bg-dark-card border border-gray-800 rounded-lg p-6">
          <div className="flex items-center gap-2 mb-4">
            <Shield className="w-5 h-5 text-blue-400" />
            <h2 className="text-xl font-semibold text-white">Staff</h2>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {staff.map((member) => renderMemberCard(member))}
          </div>
        </div>
      )}
    </div>
  )
}
