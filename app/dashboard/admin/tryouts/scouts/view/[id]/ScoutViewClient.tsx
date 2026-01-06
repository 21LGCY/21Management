'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ProfileTryout, TryoutStatus, TeamCategory } from '@/lib/types/database'
import { GameType, getGameConfig, DEFAULT_GAME, getFaceitLevelImage } from '@/lib/types/games'
import { ArrowLeft, Edit, Trash2, User as UserIcon, ExternalLink, Calendar, Gamepad2 } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { getNationalityDisplay } from '@/lib/utils/nationality'
import { useTranslations } from 'next-intl'

interface ScoutViewClientProps {
  scoutId: string
}

// Utility function to get rank image - supports both Valorant and CS2
const getRankImage = (rank: string | undefined | null, game: GameType = 'valorant'): string | null => {
  if (!rank) return null
  
  // Valorant ranks
  const valorantRankMap: { [key: string]: string } = {
    'Ascendant 1': '/images/asc_1_rank.webp',
    'Ascendant 2': '/images/asc_2_rank.webp',
    'Ascendant 3': '/images/asc_3_rank.webp',
    'Immortal 1': '/images/immo_1_rank.webp',
    'Immortal 2': '/images/immo_2_rank.webp',
    'Immortal 3': '/images/immo_3_rank.webp',
    'Radiant': '/images/rad_rank.webp'
  }
  
  // CS2 ranks (placeholder - add actual images when available)
  const cs2RankMap: { [key: string]: string } = {
    'Global Elite': '/images/ranks/cs2/global_elite.webp',
    'Supreme Master First Class': '/images/ranks/cs2/supreme.webp',
    // Add more CS2 rank images as needed
  }
  
  return game === 'valorant' ? valorantRankMap[rank] : cs2RankMap[rank] || null
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

export default function ScoutViewClient({ scoutId }: ScoutViewClientProps) {
  const [scout, setScout] = useState<ProfileTryout | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()
  const t = useTranslations('tryouts')
  const tForm = useTranslations('tryouts.form')
  const tCommon = useTranslations('common')

  const getStatusLabel = (status: TryoutStatus) => {
    switch (status) {
      case 'not_contacted': return t('notContacted')
      case 'contacted': return t('contacted')
      case 'in_tryouts': return t('inTryouts')
      case 'substitute': return t('substitute')
      case 'rejected': return t('rejected')
      case 'left': return t('left')
      case 'accepted': return t('accepted')
    }
  }

  useEffect(() => {
    fetchScout()
  }, [scoutId])

  const fetchScout = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles_tryouts')
        .select('*')
        .eq('id', scoutId)
        .single()

      if (error) throw error
      setScout(data)
    } catch (error) {
      console.error('Error fetching scout:', error)
    } finally {
      setLoading(false)
    }
  }

  const deleteScout = async () => {
    if (!confirm(tForm('confirmDeleteScout'))) return

    try {
      const { error } = await supabase
        .from('profiles_tryouts')
        .delete()
        .eq('id', scoutId)

      if (error) throw error
      
      router.push('/dashboard/admin/tryouts')
      router.refresh()
    } catch (error) {
      console.error('Error deleting scout:', error)
      alert(tForm('failedDeleteScout'))
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!scout) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400 mb-4">{t('scoutNotFound')}</p>
        <Link href="/dashboard/admin/tryouts" className="text-primary hover:underline">
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
            href="/dashboard/admin/tryouts"
            className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span>{t('backToTryouts')}</span>
          </Link>
        </div>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent mb-2">
              {scout.in_game_name || scout.username}
            </h1>
            <p className="text-gray-400">
              {scout.username} • {scout.team_category}
            </p>
          </div>
          <div className="flex gap-3">
            <Link href={`/dashboard/admin/tryouts/scouts/edit/${scoutId}`}>
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
              {t('profileOverview')}
            </h2>
            
            <div className="flex items-start gap-6 mb-6">
              <div className="w-24 h-24 bg-gradient-to-br from-primary/20 to-primary-dark/20 rounded-2xl flex items-center justify-center border-2 border-primary/30 shadow-lg">
                <UserIcon className="w-12 h-12 text-primary" />
              </div>
              <div className="flex-1">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-gray-500 text-sm mb-1">{tForm('username')}</p>
                    <p className="text-white font-semibold text-lg">{scout.username}</p>
                  </div>
                  {scout.in_game_name && (
                    <div>
                      <p className="text-gray-500 text-sm mb-1">{tForm('inGameName')}</p>
                      <p className="text-white font-semibold text-lg">{scout.in_game_name}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Position and IGL */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-gray-800/30 rounded-lg p-4 border border-gray-800/50">
                <p className="text-gray-500 text-sm mb-2">{tForm('position')}</p>
                {scout.position ? (
                  <span className={`inline-block px-3 py-1.5 text-sm font-medium border rounded-lg ${getRoleColor(scout.position)}`}>
                    {scout.position}
                  </span>
                ) : (
                  <p className="text-white font-semibold">{t('notSet')}</p>
                )}
              </div>
              <div className="bg-gray-800/30 rounded-lg p-4 border border-gray-800/50">
                <p className="text-gray-500 text-sm mb-2">{t('status')}</p>
                <div className="flex flex-wrap gap-2">
                  <span className={`inline-block px-3 py-1.5 text-sm font-medium border rounded-lg ${getStatusColor(scout.status)}`}>
                    {getStatusLabel(scout.status)}
                  </span>
                  {scout.is_igl && (
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
                <p className="text-gray-500 text-sm mb-2">
                  {((scout.game as GameType) || DEFAULT_GAME) === 'cs2' ? 'Faceit Level' : tForm('rank')}
                </p>
                {((scout.game as GameType) || DEFAULT_GAME) === 'cs2' ? (
                  <div className="flex items-center gap-3">
                    {scout.faceit_level && (
                      <Image
                        src={getFaceitLevelImage(scout.faceit_level)}
                        alt={`Faceit Level ${scout.faceit_level}`}
                        width={48}
                        height={48}
                        className="object-contain"
                      />
                    )}
                    <p className="text-white font-semibold">Level {scout.faceit_level || 'Not set'}</p>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    {getRankImage(scout.rank) && (
                      <Image
                        src={getRankImage(scout.rank)!}
                        alt={scout.rank || ''}
                        width={28}
                        height={28}
                        className="object-contain"
                      />
                    )}
                    <p className="text-white font-semibold">{scout.rank || t('unranked')}</p>
                  </div>
                )}
              </div>
              <div className="bg-gray-800/30 rounded-lg p-4 border border-gray-800/50">
                <p className="text-gray-500 text-sm mb-2">{tForm('nationality')}</p>
                {(() => {
                  const nationality = getNationalityDisplay(scout.nationality)
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
                    <p className="text-white font-semibold">{t('notSet')}</p>
                  )
                })()}
              </div>
            </div>

            {/* Agent Pool */}
            {scout.champion_pool && scout.champion_pool.length > 0 && (
              <div className="bg-gray-800/30 rounded-lg p-4 border border-gray-800/50">
                <p className="text-gray-500 text-sm mb-3">{tForm('agentPool')}</p>
                <div className="flex flex-wrap gap-2">
                  {scout.champion_pool.map((agent: string) => (
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
              {scout.notes && (
                <div className="bg-gray-800/30 rounded-lg p-4 border border-gray-800/50">
                  <p className="text-gray-500 text-sm mb-2">{t('notes')}</p>
                  <p className="text-white text-sm">
                    {scout.notes}
                  </p>
                </div>
              )}
              
              {/* Added By and Contacted By on same line */}
              <div className="grid grid-cols-2 gap-4">
                {scout.managed_by && (
                  <div className="bg-gray-800/30 rounded-lg p-4 border border-gray-800/50">
                    <p className="text-gray-500 text-sm mb-1">{tForm('addedBy')}</p>
                    <p className="text-white font-semibold">{scout.managed_by}</p>
                  </div>
                )}
                
                {/* Contact Information */}
                {(scout.contacted_by || scout.last_contact_date) && (
                  <div className="bg-gray-800/30 rounded-lg p-4 border border-gray-800/50">
                    <p className="text-gray-500 text-sm mb-3">{t('contactInfo')}</p>
                    <div className="space-y-2">
                      {scout.contacted_by && (
                        <div className="flex justify-between items-center">
                          <span className="text-gray-400 text-xs">{t('contactedByLabel')}</span>
                          <span className="text-white text-sm font-semibold">{scout.contacted_by}</span>
                        </div>
                      )}
                      {scout.last_contact_date && (
                        <div className="flex justify-between items-center">
                          <span className="text-gray-400 text-xs">{t('dateLabel')}</span>
                          <div className="flex items-center gap-2 text-white text-sm font-semibold">
                            <Calendar className="w-3.5 h-3.5" />
                            {new Date(scout.last_contact_date).toLocaleDateString('en-US', {
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
                <p className="text-white font-semibold">{scout.team_category}</p>
                <p className="text-gray-400 text-sm">{t('tryoutCandidate')}</p>
              </div>
            </div>
          </div>

          {/* Account Info */}
          <div className="bg-gradient-to-br from-dark-card via-dark-card to-primary/5 border border-gray-800 rounded-xl p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <div className="w-1 h-5 bg-gradient-to-b from-primary to-primary-dark rounded-full"></div>
              {t('accountInfo')}
            </h3>
            <div className="space-y-4">
              <div className="p-4 bg-gray-800/30 rounded-lg border border-gray-800/50">
                <p className="text-gray-500 text-sm mb-1">{t('created')}</p>
                <p className="text-white font-semibold">
                  {new Date(scout.created_at).toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </p>
              </div>
              <div className="p-4 bg-gray-800/30 rounded-lg border border-gray-800/50">
                <p className="text-gray-500 text-sm mb-1">{t('scoutId')}</p>
                <p className="text-white font-mono text-xs break-all">{scout.id}</p>
              </div>
            </div>
          </div>

          {/* External Links */}
          {(scout.valorant_tracker_url || scout.steam_url || scout.faceit_url || scout.twitter_url || scout.links) && (
            <div className="bg-gradient-to-br from-dark-card via-dark-card to-primary/5 border border-gray-800 rounded-xl p-6 shadow-xl">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <div className="w-1 h-5 bg-gradient-to-b from-primary to-primary-dark rounded-full"></div>
                {t('externalLinks')}
              </h3>
              <div className="space-y-3">
                {/* Valorant Tracker */}
                {scout.valorant_tracker_url && (
                  <a
                    href={scout.valorant_tracker_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 bg-gray-800/30 hover:bg-gray-800/50 rounded-lg border border-gray-800/50 hover:border-[#ff4655]/50 transition-all group"
                  >
                    <ExternalLink className="w-4 h-4 text-[#ff4655] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                    <span className="text-gray-300 group-hover:text-white transition">{t('valorantTracker')}</span>
                  </a>
                )}
                {/* Steam Profile - CS2 */}
                {scout.steam_url && (
                  <a
                    href={scout.steam_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 bg-gray-800/30 hover:bg-gray-800/50 rounded-lg border border-gray-800/50 hover:border-[#1b2838]/50 transition-all group"
                  >
                    <Gamepad2 className="w-4 h-4 text-white group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                    <span className="text-gray-300 group-hover:text-white transition">Steam Profile</span>
                  </a>
                )}
                {/* Faceit Profile - CS2 */}
                {scout.faceit_url && (
                  <a
                    href={scout.faceit_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 bg-gray-800/30 hover:bg-gray-800/50 rounded-lg border border-gray-800/50 hover:border-[#de9b35]/50 transition-all group"
                  >
                    <ExternalLink className="w-4 h-4 text-[#de9b35] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                    <span className="text-gray-300 group-hover:text-white transition">Faceit Profile</span>
                  </a>
                )}
                {scout.twitter_url && (
                  <a
                    href={scout.twitter_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 bg-gray-800/30 hover:bg-gray-800/50 rounded-lg border border-gray-800/50 hover:border-blue-500/50 transition-all group"
                  >
                    <ExternalLink className="w-4 h-4 text-blue-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                    <span className="text-gray-300 group-hover:text-white transition">Twitter / X</span>
                  </a>
                )}
                {scout.links && (
                  <div className="p-3 bg-gray-800/30 rounded-lg border border-gray-800/50">
                    <p className="text-gray-500 text-sm mb-1">{tForm('otherLinks')}</p>
                    <p className="text-white text-sm">{scout.links}</p>
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
