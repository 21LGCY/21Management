'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ProfileTryout, TryoutStatus } from '@/lib/types/database'
import { GameType, getGameConfig, DEFAULT_GAME } from '@/lib/types/games'
import { useRouter } from 'next/navigation'
import { Edit, Trash2, UserPlus, Calendar, ExternalLink, User as UserIcon, ArrowLeft, Gamepad2 } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { getNationalityDisplay } from '@/lib/utils/nationality'
import { useTranslations } from 'next-intl'

interface ScoutViewManagerProps {
  scout: ProfileTryout
  teamId: string | null
  team: any | null
  managerId: string
}

export default function ScoutViewManager({ scout, teamId, team, managerId }: ScoutViewManagerProps) {
  const [currentScout, setCurrentScout] = useState(scout)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()
  const t = useTranslations('tryouts')
  const tForm = useTranslations('tryouts.form')
  const tCommon = useTranslations('common')

  const promoteToPlayer = async () => {
    if (!teamId) {
      alert(tForm('teamNotAvailable'))
      return
    }

    if (!confirm(tForm('confirmPromote', { name: scout.in_game_name || scout.username }))) return

    setLoading(true)
    try {
      // Create a user profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .insert({
          username: scout.username,
          role: 'player',
          full_name: scout.full_name,
          in_game_name: scout.in_game_name,
          position: scout.position,
          is_igl: scout.is_igl,
          nationality: scout.nationality,
          champion_pool: scout.champion_pool,
          rank: scout.rank,
          valorant_tracker_url: scout.valorant_tracker_url,
          twitter_url: scout.twitter_url,
          team_id: teamId
        })
        .select()
        .single()

      if (profileError) throw profileError

      // Update the tryout status
      const { error: tryoutError } = await supabase
        .from('profiles_tryouts')
        .update({ status: 'accepted' })
        .eq('id', scout.id)

      if (tryoutError) throw tryoutError

      setCurrentScout({ ...currentScout, status: 'accepted' })
      alert(tForm('playerAddedToTeam'))
      router.push('/dashboard/manager/teams/roster')

    } catch (error) {
      console.error('Error promoting player:', error)
      alert(tForm('failedPromote'))
    } finally {
      setLoading(false)
    }
  }

  const deleteScout = async () => {
    if (!confirm(tForm('confirmDeleteScout'))) return

    setLoading(true)
    try {
      const { error } = await supabase
        .from('profiles_tryouts')
        .delete()
        .eq('id', scout.id)

      if (error) throw error

      router.push('/dashboard/manager/teams/tryouts')
      router.refresh()
    } catch (error) {
      console.error('Error deleting scout:', error)
      alert(tForm('failedDeleteScout'))
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: TryoutStatus) => {
    switch (status) {
      case 'not_contacted': return 'bg-gray-500/20 text-gray-300 border-gray-500/30'
      case 'contacted': return 'bg-blue-500/20 text-blue-300 border-blue-500/30'
      case 'in_tryouts': return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30'
      case 'substitute': return 'bg-purple-500/20 text-purple-300 border-purple-500/30'
      case 'rejected': return 'bg-red-500/20 text-red-300 border-red-500/30'
      case 'left': return 'bg-orange-500/20 text-orange-300 border-orange-500/30'
      case 'accepted': return 'bg-primary/20 text-primary border-primary/30'
    }
  }

  const getRoleColor = (role?: string) => {
    if (!role) return 'bg-gray-500/20 text-gray-300 border-gray-500/30'
    
    switch (role) {
      // Valorant roles
      case 'Duelist': return 'bg-red-500/20 text-red-300 border-red-500/30'
      case 'Initiator': return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30'
      case 'Controller': return 'bg-purple-500/20 text-purple-300 border-purple-500/30'
      case 'Sentinel': return 'bg-blue-500/20 text-blue-300 border-blue-500/30'
      // CS2 roles
      case 'Entry Fragger': return 'bg-red-500/20 text-red-300 border-red-500/30'
      case 'AWPer': return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30'
      case 'Support': return 'bg-blue-500/20 text-blue-300 border-blue-500/30'
      case 'Lurker': return 'bg-purple-500/20 text-purple-300 border-purple-500/30'
      case 'IGL': return 'bg-orange-500/20 text-orange-300 border-orange-500/30'
      // Shared
      case 'Flex': return 'bg-green-500/20 text-green-300 border-green-500/30'
      case 'Staff': return 'bg-orange-500/20 text-orange-300 border-orange-500/30'
      default: return 'bg-gray-500/20 text-gray-300 border-gray-500/30'
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

  const getStatusLabel = (status: TryoutStatus) => {
    switch (status) {
      case 'not_contacted': return t('notContacted')
      case 'contacted': return t('contacted')
      case 'in_tryouts': return t('inTryouts')
      case 'substitute': return t('substitute')
      case 'rejected': return t('rejected')
      case 'left': return t('left')
      case 'accepted': return t('player')
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!currentScout) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400 mb-4">{t('scoutNotFound')}</p>
        <Link href="/dashboard/manager/teams/tryouts" className="text-primary hover:underline">
          {t('backToTryouts')}
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-8">
        <div className="mb-4">
          <Link
            href="/dashboard/manager/teams/tryouts"
            className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span>{tCommon('back')}</span>
          </Link>
        </div>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent mb-2">
              {currentScout.in_game_name || currentScout.username}
            </h1>
            <p className="text-gray-400">
              {currentScout.username} • {currentScout.team_category}
            </p>
          </div>
          <div className="flex gap-3">
            <Link href={`/dashboard/manager/teams/tryouts/scouts/edit/${currentScout.id}`}>
              <button className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-primary to-primary-dark hover:from-primary-dark hover:to-primary text-white rounded-lg transition-all shadow-lg hover:shadow-primary/20">
                <Edit className="w-4 h-4" />
                <span>{tCommon('edit')}</span>
              </button>
            </Link>
            <button
              onClick={deleteScout}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-red-900/20 to-red-800/20 hover:from-red-800/30 hover:to-red-700/30 text-red-400 hover:text-red-300 rounded-lg transition-all border border-red-800/50 hover:border-red-700/50"
            >
              <Trash2 className="w-4 h-4" />
              <span>{tCommon('delete')}</span>
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info Card */}
        <div className="lg:col-span-2 space-y-6">
          {/* Profile Overview */}
          <div className="bg-gradient-to-br from-dark-card via-dark-card to-primary/5 border border-gray-800 rounded-xl p-6 shadow-xl">
            <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
              <div className="w-1 h-6 bg-gradient-to-b from-primary to-primary-dark rounded-full"></div>
              {tForm('basicInfo')}
            </h2>
            
            <div className="flex items-start gap-6 mb-6">
              <div className="w-24 h-24 bg-gradient-to-br from-primary/20 to-primary-dark/20 rounded-2xl flex items-center justify-center border-2 border-primary/30 shadow-lg">
                <UserIcon className="w-12 h-12 text-primary" />
              </div>
              <div className="flex-1">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-gray-500 text-sm mb-1">{tForm('username')}</p>
                    <p className="text-white font-semibold text-lg">{currentScout.username}</p>
                  </div>
                  {currentScout.in_game_name && (
                    <div>
                      <p className="text-gray-500 text-sm mb-1">{tForm('inGameName')}</p>
                      <p className="text-white font-semibold text-lg">{currentScout.in_game_name}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Position and IGL */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-gray-800/30 rounded-lg p-4 border border-gray-800/50">
                <p className="text-gray-500 text-sm mb-2">{tForm('position')}</p>
                {currentScout.position ? (
                  <span className={`inline-block px-3 py-1.5 text-sm font-medium border rounded-lg ${getRoleColor(currentScout.position)}`}>
                    {currentScout.position}
                  </span>
                ) : (
                  <p className="text-white font-semibold">Not set</p>
                )}
              </div>
              <div className="bg-gray-800/30 rounded-lg p-4 border border-gray-800/50">
                <p className="text-gray-500 text-sm mb-2">{t('status')}</p>
                <div className="flex flex-wrap gap-2">
                  <span className={`inline-block px-3 py-1.5 text-sm font-medium border rounded-lg ${getStatusColor(currentScout.status)}`}>
                    {getStatusLabel(currentScout.status)}
                  </span>
                  {currentScout.is_igl && (
                    <span className="inline-block px-3 py-1.5 bg-yellow-500/20 text-yellow-400 text-sm rounded-lg font-semibold border border-yellow-500/30">
                      IGL
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Rank and Nationality */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-gray-800/30 rounded-lg p-4 border border-gray-800/50">
                <p className="text-gray-500 text-sm mb-2">{tForm('rank')}</p>
                <div className="flex items-center gap-3">
                  {getRankImage(currentScout.rank) && (
                    <Image
                      src={getRankImage(currentScout.rank)!}
                      alt={currentScout.rank || ''}
                      width={28}
                      height={28}
                      className="object-contain"
                    />
                  )}
                  <p className="text-white font-semibold">{currentScout.rank || 'Unranked'}</p>
                </div>
              </div>
              <div className="bg-gray-800/30 rounded-lg p-4 border border-gray-800/50">
                <p className="text-gray-500 text-sm mb-2">{tForm('nationality')}</p>
                {(() => {
                  const nationality = getNationalityDisplay(currentScout.nationality)
                  return nationality ? (
                    <div className="flex items-center gap-3">
                      <Image
                        src={nationality.flagUrl}
                        alt={nationality.code}
                        width={28}
                        height={21}
                        className="object-contain rounded-sm"
                      />
                      <p className="text-white font-semibold">{nationality.name}</p>
                    </div>
                  ) : (
                    <p className="text-white font-semibold">Not set</p>
                  )
                })()}
              </div>
            </div>

            {/* Agent Pool */}
            {currentScout.champion_pool && currentScout.champion_pool.length > 0 && (
              <div className="bg-gray-800/30 rounded-lg p-4 border border-gray-800/50">
                <p className="text-gray-500 text-sm mb-3">{tForm('agentPool')}</p>
                <div className="flex flex-wrap gap-2">
                  {currentScout.champion_pool.map((agent: string) => (
                    <span key={agent} className="px-3 py-1.5 bg-gradient-to-r from-primary/20 to-primary-dark/20 text-primary text-sm rounded-lg font-medium border border-primary/30">
                      {agent}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Management Info */}
          <div className="bg-gradient-to-br from-dark-card via-dark-card to-primary/5 border border-gray-800 rounded-xl p-6 shadow-xl">
            <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
              <div className="w-1 h-6 bg-gradient-to-b from-primary to-primary-dark rounded-full"></div>
              {tForm('management')}
            </h2>
            <div className="space-y-4">
              {/* Notes First */}
              {currentScout.notes && (
                <div className="bg-gray-800/30 rounded-lg p-4 border border-gray-800/50">
                  <p className="text-gray-500 text-sm mb-2">{t('notes')}</p>
                  <p className="text-white text-sm">
                    {currentScout.notes}
                  </p>
                </div>
              )}
              
              {/* Added By and Contacted By on same line */}
              <div className="grid grid-cols-2 gap-4">
                {currentScout.managed_by && (
                  <div className="bg-gray-800/30 rounded-lg p-4 border border-gray-800/50">
                    <p className="text-gray-500 text-sm mb-1">{tForm('addedBy')}</p>
                    <p className="text-white font-semibold">{currentScout.managed_by}</p>
                  </div>
                )}
                
                {/* Contact Information */}
                {(currentScout.contacted_by || currentScout.last_contact_date) && (
                  <div className="bg-gray-800/30 rounded-lg p-4 border border-gray-800/50">
                    <p className="text-gray-500 text-sm mb-3">Contact Information</p>
                    <div className="space-y-2">
                      {currentScout.contacted_by && (
                        <div className="flex justify-between items-center">
                          <span className="text-gray-400 text-xs">Contacted By:</span>
                          <span className="text-white text-sm font-semibold">{currentScout.contacted_by}</span>
                        </div>
                      )}
                      {currentScout.last_contact_date && (
                        <div className="flex justify-between items-center">
                          <span className="text-gray-400 text-xs">Date:</span>
                          <div className="flex items-center gap-2 text-white text-sm font-semibold">
                            <Calendar className="w-3.5 h-3.5" />
                            {new Date(currentScout.last_contact_date).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Team Info */}
          <div className="bg-gradient-to-br from-dark-card via-dark-card to-primary/5 border border-gray-800 rounded-xl p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <div className="w-1 h-5 bg-gradient-to-b from-primary to-primary-dark rounded-full"></div>
              {tForm('team')}
            </h3>
            <div className="flex items-center gap-3 p-4 bg-gray-800/30 rounded-lg border border-gray-800/50">
              <div className="w-12 h-12 bg-gradient-to-br from-primary/20 to-primary-dark/20 rounded-lg flex items-center justify-center border border-primary/30">
                <UserIcon className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-white font-semibold">{currentScout.team_category}</p>
                <p className="text-gray-400 text-sm">Tryout Candidate</p>
              </div>
            </div>
          </div>

          {/* Account Info */}
          <div className="bg-gradient-to-br from-dark-card via-dark-card to-primary/5 border border-gray-800 rounded-xl p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <div className="w-1 h-5 bg-gradient-to-b from-primary to-primary-dark rounded-full"></div>
              {tForm('basicInfo')}
            </h3>
            <div className="space-y-4">
              <div className="p-4 bg-gray-800/30 rounded-lg border border-gray-800/50">
                <p className="text-gray-500 text-sm mb-1">Created</p>
                <p className="text-white font-semibold">
                  {new Date(currentScout.created_at).toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </p>
              </div>
              <div className="p-4 bg-gray-800/30 rounded-lg border border-gray-800/50">
                <p className="text-gray-500 text-sm mb-1">Scout ID</p>
                <p className="text-white font-mono text-xs break-all">{currentScout.id}</p>
              </div>
            </div>
          </div>

          {/* External Links */}
          {(currentScout.valorant_tracker_url || currentScout.twitter_url || currentScout.links) && (
            <div className="bg-gradient-to-br from-dark-card via-dark-card to-primary/5 border border-gray-800 rounded-xl p-6 shadow-xl">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <div className="w-1 h-5 bg-gradient-to-b from-primary to-primary-dark rounded-full"></div>
                {tForm('contactLinks')}
              </h3>
              <div className="space-y-3">
                {currentScout.valorant_tracker_url && (
                  <a
                    href={currentScout.valorant_tracker_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 bg-gray-800/30 hover:bg-gray-800/50 rounded-lg border border-gray-800/50 hover:border-primary/50 transition-all group"
                  >
                    <ExternalLink className="w-4 h-4 text-primary group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                    <span className="text-gray-300 group-hover:text-white transition">Valorant Tracker</span>
                  </a>
                )}
                {currentScout.twitter_url && (
                  <a
                    href={currentScout.twitter_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 bg-gray-800/30 hover:bg-gray-800/50 rounded-lg border border-gray-800/50 hover:border-primary/50 transition-all group"
                  >
                    <ExternalLink className="w-4 h-4 text-primary group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                    <span className="text-gray-300 group-hover:text-white transition">Twitter</span>
                  </a>
                )}
                {currentScout.links && (
                  <div className="p-3 bg-gray-800/30 rounded-lg border border-gray-800/50">
                    <p className="text-gray-500 text-sm mb-1">{tForm('otherLinks')}</p>
                    <p className="text-white text-sm">{currentScout.links}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}