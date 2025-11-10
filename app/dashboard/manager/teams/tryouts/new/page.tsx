import { requireManagerTeamAccess } from '@/lib/auth/team-access'
import Navbar from '@/components/Navbar'
import NewTryoutWeekFormManager from './NewTryoutWeekFormManager'

export default async function NewTryoutWeekManagerPage() {
  const { user, team } = await requireManagerTeamAccess()

  return (
    <div className="min-h-screen bg-dark">
      <Navbar role={user.role} username={user.username} />
      
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <NewTryoutWeekFormManager team={team} />
      </main>
    </div>
  )
}
