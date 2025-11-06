import { requireRole } from '@/lib/auth/server'
import Navbar from '@/components/Navbar'
import TryoutWeekDetail from './TryoutWeekDetail'

export default async function TryoutWeekDetailPage({ params }: { params: { id: string } }) {
  const user = await requireRole(['admin'])

  return (
    <div className="min-h-screen bg-dark">
      <Navbar role={user.role} username={user.username} />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <TryoutWeekDetail weekId={params.id} />
      </main>
    </div>
  )
}
