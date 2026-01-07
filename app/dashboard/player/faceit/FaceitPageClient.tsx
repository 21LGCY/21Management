'use client'

import { useTranslations } from 'next-intl'
import NavbarWrapper from '@/components/NavbarWrapper'
import FaceitLinkButton from '@/components/FaceitLinkButton'
import FaceitStatsCard from '@/components/FaceitStatsCard'
import { UserRole } from '@/lib/types/database'
import { FormattedFaceitStats } from '@/lib/types/faceit'
import { ArrowLeft, AlertTriangle } from 'lucide-react'
import Link from 'next/link'

interface PlayerData {
  id: string
  full_name?: string
  faceit_player_id?: string
  faceit_nickname?: string
  faceit_stats?: FormattedFaceitStats
  teams?: { name: string; game: string }
}

interface FaceitPageClientProps {
  user: {
    role: UserRole
    username: string
    user_id: string
    avatar_url?: string | null
  }
  playerData: PlayerData | null
  gameType: string
}

export default function FaceitPageClient({
  user,
  playerData,
  gameType,
}: FaceitPageClientProps) {
  const t = useTranslations('faceit')
  const tNav = useTranslations('nav')

  const isLinked = !!playerData?.faceit_player_id
  const isCS2 = gameType === 'cs2'

  return (
    <div className="min-h-screen bg-dark">
      <NavbarWrapper 
        role={user.role} 
        username={user.username} 
        userId={user.user_id} 
        avatarUrl={user.avatar_url} 
      />
      
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <Link 
          href="/dashboard/player"
          className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          {tNav('backToDashboard')}
        </Link>

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <img 
              src="/images/faceit.svg" 
              alt="FACEIT" 
              className="w-8 h-8"
            />
            <h1 className="text-3xl font-bold text-white">{t('title')}</h1>
          </div>
          <p className="text-gray-400">
            {isLinked 
              ? `Connecté en tant que ${playerData?.faceit_nickname}`
              : t('linkDescription')
            }
          </p>
        </div>

        {/* CS2 Only Warning */}
        {!isCS2 && (
          <div className="mb-8 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl flex items-start gap-3">
            <AlertTriangle className="w-6 h-6 text-yellow-400 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-yellow-400 font-medium mb-1">CS2 Uniquement</h3>
              <p className="text-yellow-300/70 text-sm">{t('cs2Only')}</p>
            </div>
          </div>
        )}

        {/* Link Button Section */}
        {isCS2 && (
          <div className="mb-8">
            <FaceitLinkButton
              isLinked={isLinked}
              faceitNickname={playerData?.faceit_nickname}
            />
          </div>
        )}

        {/* Stats Card */}
        {isLinked && playerData?.faceit_stats && (
          <FaceitStatsCard
            stats={playerData.faceit_stats as FormattedFaceitStats}
            playerId={user.user_id}
            showSyncButton={true}
          />
        )}

        {/* Not Linked State */}
        {isCS2 && !isLinked && (
          <div className="text-center py-16 bg-dark-card border border-gray-800 rounded-xl">
            <div className="w-20 h-20 bg-orange-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <img 
                src="/images/faceit.svg" 
                alt="FACEIT" 
                className="w-10 h-10 opacity-50"
              />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">{t('notLinked')}</h3>
            <p className="text-gray-400 max-w-md mx-auto">{t('notLinkedDescription')}</p>
          </div>
        )}
      </main>
    </div>
  )
}
