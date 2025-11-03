import { requireManagerTeamAccess } from '@/lib/auth/team-access'
import PlayerForm from '@/components/PlayerForm'
import BackButton from '@/components/BackButton'

export default async function NewPlayerPage() {
  const { user, teamId, team } = await requireManagerTeamAccess()

  return (
    <div className="min-h-screen bg-dark">
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="mb-4">
            <BackButton fallbackHref="/dashboard/manager/players">
              Back to Players
            </BackButton>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">
            Add New Player
          </h1>
          <p className="text-gray-400">Add a new player to {team?.name || 'your team'}</p>
        </div>
        
        <div className="bg-dark-card border border-gray-800 rounded-lg p-6">
          <PlayerForm teamId={teamId!} teamName={team?.name || 'your team'} />
        </div>
      </main>
    </div>
  )
}