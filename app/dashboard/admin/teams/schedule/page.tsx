import { createClient } from '@/lib/supabase/server'
import { requireRole } from '@/lib/auth/server'
import BackButton from '@/components/BackButton'
import TeamScheduleSelector from './TeamScheduleSelector'

export default async function AdminTeamSchedulePage() {
  // Require admin role
  const user = await requireRole(['admin'])

  const supabase = await createClient()
  
  // Fetch all teams for the selector
  const { data: teams } = await supabase
    .from('teams')
    .select('*')
    .order('name', { ascending: true })

  return (
    <div className="min-h-screen bg-dark">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="mb-4">
            <BackButton fallbackHref="/dashboard/admin/teams">
              Back to Team Management
            </BackButton>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">
                Team Schedule Management
              </h1>
              <p className="text-gray-400">Select a team to manage its weekly schedule</p>
            </div>
          </div>
        </div>

        {/* Team Selector and Schedule Management Interface */}
        {teams && teams.length > 0 ? (
          <TeamScheduleSelector 
            teams={teams}
            user={user}
          />
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-400">No teams found. Please create a team first.</p>
          </div>
        )}
      </main>
    </div>
  )
}
