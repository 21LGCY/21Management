import { requireManagerTeamAccess } from '@/lib/auth/team-access'
import { notFound } from 'next/navigation'
import Navbar from '@/components/Navbar'
import EditMatchClient from './EditMatchClient'

interface PageProps {
  params: Promise<{
    id: string
  }>
}

export default async function EditMatchPage({ params }: PageProps) {
  const { id } = await params
  const { user, teamId } = await requireManagerTeamAccess()

  if (!teamId) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-dark">
      <Navbar role={user.role} username={user.username} />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <EditMatchClient matchId={id} teamId={teamId} />
      </main>
    </div>
  )
}
