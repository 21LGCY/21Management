import { requireManagerTeamAccess } from '@/lib/auth/team-access'
import Navbar from '@/components/Navbar'
import BackButton from '@/components/BackButton'
import TryoutsManagerClient from './TryoutsManagerClient'

export default async function ManagerTryoutsPage() {
  const { user, teamId, team, teamCategory } = await requireManagerTeamAccess()

  return (
    <div className="min-h-screen bg-dark">
      <Navbar role={user.role} username={user.username} />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="mb-4">
            <BackButton fallbackHref="/dashboard/manager/teams/roster">
              Back to Roster Management
            </BackButton>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">
            Tryouts & Scouting
          </h1>
          <p className="text-gray-400">Manage tryouts and scout players for {team?.name || 'your team'}</p>
        </div>
        
        <TryoutsManagerClient teamId={teamId} team={team} teamCategory={teamCategory} />
      </main>
    </div>
  )
}