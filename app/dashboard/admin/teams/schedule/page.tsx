import { requireRole } from '@/lib/auth/server'
import { createClient } from '@/lib/supabase/server'
import Navbar from '@/components/Navbar'
import ScheduleManagementClient from './ScheduleManagementClient'

export default async function AdminSchedulePage() {
  const user = await requireRole(['admin'])
  
  const supabase = await createClient()
  
  // Fetch all teams
  const { data: teams } = await supabase
    .from('teams')
    .select('*')
    .order('name', { ascending: true })

  return (
    <div className="min-h-screen bg-dark">
      <Navbar role={user.role} username={user.username} />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            Schedule Management
          </h1>
          <p className="text-gray-400">Manage team schedules and weekly activities for all teams</p>
        </div>

        {/* Schedule Management Interface */}
        <ScheduleManagementClient teams={teams || []} />
      </main>
    </div>
  )
}
