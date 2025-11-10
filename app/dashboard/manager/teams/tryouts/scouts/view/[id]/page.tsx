import { requireManagerTeamAccess } from '@/lib/auth/team-access'
import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import Navbar from '@/components/Navbar'
import BackButton from '@/components/BackButton'
import ScoutViewManager from './ScoutViewManager'

interface ScoutViewPageProps {
  params: {
    id: string
  }
}

export default async function ScoutViewManagerPage({ params }: ScoutViewPageProps) {
  const { user, teamId, team, teamCategory } = await requireManagerTeamAccess()
  const supabase = await createClient()

  // Get the scout profile
  const { data: scout, error } = await supabase
    .from('profiles_tryouts')
    .select('*')
    .eq('id', params.id)
    .single()

  if (error || !scout) {
    notFound()
  }

  // Check if this scout belongs to the manager's team category
  if (teamCategory && scout.team_category !== teamCategory) {
    redirect('/dashboard/manager/teams/tryouts')
  }

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
          <h1 className="text-3xl font-bold text-white mb-2">
            Scout Profile: {scout.in_game_name || scout.username}
          </h1>
          <p className="text-gray-400">View and manage scout profile for {team?.name || 'your team'}</p>
        </div>
        
        <div className="max-w-4xl mx-auto">
          <ScoutViewManager 
            scout={scout} 
            teamId={teamId} 
            team={team}
            managerId={user.user_id}
          />
        </div>
      </main>
    </div>
  )
}