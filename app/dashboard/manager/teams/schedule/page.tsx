import { createClient } from '@/lib/supabase/server'
import { requireManagerTeamAccess } from '@/lib/auth/team-access'
import BackButton from '@/components/BackButton'
import { Calendar, Clock, Users, Target, Trophy, Dumbbell, BookOpen, Gamepad2 } from 'lucide-react'
import ScheduleManagementClient from './ScheduleManagementClient'

export default async function TeamSchedulePage() {
  // Require manager role and get team access
  const { user, teamId, team } = await requireManagerTeamAccess()

  return (
    <div className="min-h-screen bg-dark">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="mb-4">
            <BackButton fallbackHref="/dashboard/manager/teams">
              Back to Team Management
            </BackButton>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">
                Team Schedule Management
              </h1>
              <p className="text-gray-400">Plan and organize your team's weekly activities</p>
            </div>
          </div>
        </div>

        {/* Schedule Management Interface */}
        <ScheduleManagementClient 
          team={team}
          user={user}
        />
      </main>
    </div>
  )
}