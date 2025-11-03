import { requireRole } from '@/lib/auth/server'
import Navbar from '@/components/Navbar'
import TryoutForm from '@/components/TryoutForm'

export default async function NewTryoutPage() {
  const user = await requireRole(['admin'])

  return (
    <div className="min-h-screen bg-dark">
      <Navbar role={user.role} username={user.username} />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            Add Scouting Profile
          </h1>
          <p className="text-gray-400">Create a new player scouting profile</p>
        </div>
        
        <div className="bg-dark-card border border-gray-800 rounded-lg p-6">
          <TryoutForm />
        </div>
      </main>
    </div>
  )
}
