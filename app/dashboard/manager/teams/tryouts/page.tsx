import { requireManagerTeamAccess } from '@/lib/auth/team-access'
import Navbar from '@/components/Navbar'
import BackButton from '@/components/BackButton'
import TryoutsManagerClient from './TryoutsManagerClient'
import { getTranslations } from 'next-intl/server'

export default async function ManagerTryoutsPage() {
  const { user, teamId, team, teamCategory } = await requireManagerTeamAccess()
  const t = await getTranslations('tryouts')
  const tNav = await getTranslations('nav')

  return (
    <div className="min-h-screen bg-dark">
      <Navbar role={user.role} username={user.username} />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="mb-4">
            <BackButton fallbackHref="/dashboard/manager/teams/roster">
              {t('backToRoster')}
            </BackButton>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">
            {t('tryoutsAndScouting')}
          </h1>
          <p className="text-gray-400">{t('manageScouts', { team: team?.name || tNav('team') })}</p>
        </div>
        
        <TryoutsManagerClient teamId={teamId} team={team} teamCategory={teamCategory} />
      </main>
    </div>
  )
}