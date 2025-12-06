import { createClient } from '@/lib/supabase/server'
import { requireManagerTeamAccess } from '@/lib/auth/team-access'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import BackButton from '@/components/BackButton'
import PlayerForm from '@/components/PlayerForm'
import { getTranslations } from 'next-intl/server'

interface EditPlayerPageProps {
  params: Promise<{ id: string }>
}

export default async function EditPlayerPage({ params }: EditPlayerPageProps) {
  const { id } = await params
  const t = await getTranslations('players')
  
  // Require manager role and get team access
  const { user, teamId, team } = await requireManagerTeamAccess()
  
  const supabase = await createClient()

  // Get player details - ensure they belong to the manager's team
  const { data: player, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', id)
    .eq('role', 'player')
    .eq('team_id', teamId)
    .single()

  if (error || !player) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-dark">
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="mb-4">
            <BackButton fallbackHref={`/dashboard/manager/players/${player.id}`}>
              {t('backToPlayerDetails')}
            </BackButton>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">
            {t('editPlayer')}
          </h1>
          <p className="text-gray-400">{t('updatePlayerInfo', { name: player.in_game_name || player.username })}</p>
        </div>
        
        <div className="bg-dark-card border border-gray-800 rounded-lg p-6">
          <PlayerForm 
            teamId={teamId || ''} 
            teamName={team?.name || 'your team'} 
            playerId={player.id}
          />
        </div>
      </main>
    </div>
  )
}