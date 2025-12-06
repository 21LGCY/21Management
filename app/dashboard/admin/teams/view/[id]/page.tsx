import { requireRole } from '@/lib/auth/server'
import NavbarWrapper from '@/components/NavbarWrapper'
import TeamViewClient from '@/app/dashboard/admin/teams/view/[id]/TeamViewClient'

export default async function TeamViewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await requireRole(['admin', 'manager'])

  return (
    <div className="min-h-screen bg-dark">
      <NavbarWrapper role={user.role} username={user.username} userId={user.user_id} avatarUrl={user.avatar_url} />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <TeamViewClient 
          teamId={id} 
          userId={user.user_id}
          userName={user.username}
          userRole={user.role}
        />
      </main>
    </div>
  )
}
