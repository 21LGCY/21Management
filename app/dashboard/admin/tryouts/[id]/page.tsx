import { requireRole } from '@/lib/auth/server'
import Navbar from '@/components/Navbar'
import TryoutForm from '@/components/TryoutForm'

export default async function EditTryoutPage({ params }: { params: { id: string } }) {
  const user = await requireRole(['admin'])

  return (
    <div className="min-h-screen bg-dark">
      <Navbar role={user.role} username={user.username} />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            Edit Scouting Profile
          </h1>
          <p className="text-gray-400">Update player scouting information</p>
        </div>
        
        <div className="bg-dark-card border border-gray-800 rounded-lg p-6">
          <TryoutForm tryoutId={params.id} />
        </div>
      </main>
    </div>
  )
}
