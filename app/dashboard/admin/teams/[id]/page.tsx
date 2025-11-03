import { requireRole } from '@/lib/auth/server'
import Navbar from '@/components/Navbar'
import TeamForm from '@/components/TeamForm'

export default async function EditTeamPage({ params }: { params: { id: string } }) {
  const user = await requireRole(['admin'])

  return (
    <div className="min-h-screen bg-dark">
      <Navbar role={user.role} username={user.username} />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            Edit Team
          </h1>
          <p className="text-gray-400">Update team information and members</p>
        </div>
        
        <div className="bg-dark-card border border-gray-800 rounded-lg p-6">
          <TeamForm teamId={params.id} />
        </div>
      </main>
    </div>
  )
}
