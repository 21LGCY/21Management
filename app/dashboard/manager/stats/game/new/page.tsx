import { requireManagerTeamAccess } from '@/lib/auth/team-access'
import Navbar from '@/components/Navbar'
import RecordMatchClient from './RecordMatchClient'

export default async function RecordMatchPage() {
  const { user, teamId, team } = await requireManagerTeamAccess()

  return (
    <div className="min-h-screen bg-dark">
      <Navbar role={user.role} username={user.username} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <RecordMatchClient 
          teamId={teamId!} 
          teamName={team?.name || 'Your Team'} 
        />
      </div>
    </div>
  )
}