import { requireRole } from '@/lib/auth/server'
import NavbarWrapper from '@/components/NavbarWrapper'
import TeamForm from '@/components/TeamForm'

export default async function NewTeamPage() {
  const user = await requireRole(['admin'])

  return (
    <div className="min-h-screen bg-dark">
      <NavbarWrapper role={user.role} username={user.username} userId={user.user_id} avatarUrl={user.avatar_url} />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            Add New Team
          </h1>
          <p className="text-gray-400">Create a new team and assign players</p>
        </div>
        
        <div className="bg-dark-card border border-gray-800 rounded-lg p-6">
          <TeamForm />
        </div>
      </main>
    </div>
  )
}
