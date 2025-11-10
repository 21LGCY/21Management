import { requireManagerTeamAccess } from '@/lib/auth/team-access'
import Navbar from '@/components/Navbar'
import TryoutWeekDetailManager from './TryoutWeekDetailManager'

export default async function TryoutWeekDetailManagerPage({ params }: { params: { id: string } }) {
  const { user, team, teamCategory } = await requireManagerTeamAccess()

  return (
    <div className="min-h-screen bg-dark">
      <Navbar role={user.role} username={user.username} />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <TryoutWeekDetailManager weekId={params.id} team={team} teamCategory={teamCategory} />
      </main>
    </div>
  )
}
