import { requireManagerTeamAccess } from '@/lib/auth/team-access'
import Navbar from '@/components/Navbar'
import BackButton from '@/components/BackButton'
import NewScoutManagerForm from './NewScoutManagerForm'

export default async function NewScoutManagerPage() {
  const { user, teamId, team } = await requireManagerTeamAccess()

  // Determine team category from team name with more precise mapping
  const teamCategory = team?.name ? (
    team.name.toLowerCase().includes('legacy gc') || team.name.toLowerCase().includes('21gc') ? '21GC' :
    team.name.toLowerCase().includes('academy') || team.name.toLowerCase().includes('21aca') ? '21ACA' :
    team.name.toLowerCase().includes('21 legacy') || team.name.toLowerCase().includes('21l') || 
    (team.name.toLowerCase().includes('legacy') && !team.name.toLowerCase().includes('gc') && !team.name.toLowerCase().includes('academy')) ? '21L' :
    null
  ) : null

  return (
    <div className="min-h-screen bg-dark">
      <Navbar role={user.role} username={user.username} />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="mb-4">
            <BackButton fallbackHref="/dashboard/manager/teams/tryouts">
              Back to Tryouts
            </BackButton>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Add New Scout Profile</h1>
          <p className="text-gray-400">Add a potential player to the scouting database for {team?.name || 'your team'}</p>
        </div>
        
        <div className="max-w-4xl mx-auto">
          <NewScoutManagerForm 
            teamId={teamId} 
            team={team} 
            teamCategory={teamCategory} 
            managerId={user.user_id}
          />
        </div>
      </main>
    </div>
  )
}