import { requireRole } from '@/lib/auth/server'
import Navbar from '@/components/Navbar'
import TeamViewClient from '@/app/dashboard/admin/teams/view/[id]/TeamViewClient'

export default async function TeamViewPage({ params }: { params: { id: string } }) {
  const user = await requireRole(['admin', 'manager'])

  return (
    <div className="min-h-screen bg-dark">
      <Navbar role={user.role} username={user.username} />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <TeamViewClient 
          teamId={params.id} 
          userId={user.user_id}
          userName={user.username}
          userRole={user.role}
        />
      </main>
    </div>
  )
}
