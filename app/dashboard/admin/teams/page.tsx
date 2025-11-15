import { requireRole } from '@/lib/auth/server'
import NavbarWrapper from '@/components/NavbarWrapper'
import TeamManagementClient from './TeamManagementClient'

export default async function TeamManagementPage() {
  const user = await requireRole(['admin'])

  return (
    <div className="min-h-screen bg-dark">
      <NavbarWrapper role={user.role} username={user.username} userId={user.user_id} avatarUrl={user.avatar_url} />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            Team Management
          </h1>
          <p className="text-gray-400">Manage teams, schedules, matches, and statistics</p>
        </div>
        
        <TeamManagementClient />
      </main>
    </div>
  )
}
