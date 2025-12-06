import { requireManagerTeamAccess } from '@/lib/auth/team-access'
import EditScoutManagerForm from './EditScoutManagerForm'

export default async function EditScoutManagerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { user, teamId, team, teamCategory } = await requireManagerTeamAccess()

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <EditScoutManagerForm 
        scoutId={id} 
        teamId={teamId}
        team={team}
        teamCategory={teamCategory}
        managerId={user.id}
      />
    </div>
  )
}
