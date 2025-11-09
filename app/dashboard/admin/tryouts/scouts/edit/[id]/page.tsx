import { requireRole } from '@/lib/auth/server'
import Navbar from '@/components/Navbar'
import EditScoutForm from './EditScoutForm'

export default async function EditScoutPage({ params }: { params: { id: string } }) {
  const user = await requireRole(['admin', 'manager'])

  return (
    <div className="min-h-screen bg-dark">
      <Navbar role={user.role} username={user.username} />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <EditScoutForm scoutId={params.id} />
      </main>
    </div>
  )
}
