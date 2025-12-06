import { requireManagerTeamAccess } from '@/lib/auth/team-access'
import { redirect } from 'next/navigation'
import Navbar from '@/components/Navbar'
import PraccsReviewClient from './PraccsReviewClient'

export default async function ManagerPraccsReviewPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const { user, teamId } = await requireManagerTeamAccess()
  const matchId = id

  // Redirect if no team assigned
  if (!teamId) {
    redirect('/dashboard/manager')
  }

  return (
    <div className="min-h-screen bg-dark">
      <Navbar role={user.role} username={user.username} />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <PraccsReviewClient
          teamId={teamId}
          matchId={matchId}
          userId={user.user_id}
          userName={user.username}
          userRole="manager"
        />
      </main>
    </div>
  )
}
