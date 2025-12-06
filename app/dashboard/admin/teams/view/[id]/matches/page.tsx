import { requireRole } from '@/lib/auth/server'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import NavbarWrapper from '@/components/NavbarWrapper'
import MatchesListClient from './MatchesListClient'

interface MatchesListPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function MatchesListPage({ params }: MatchesListPageProps) {
  const { id } = await params
  const user = await requireRole(['admin'])
  
  const supabase = await createClient()
  
  // Fetch team info
  const { data: team } = await supabase
    .from('teams')
    .select('name')
    .eq('id', id)
    .single()

  if (!team) {
    redirect('/dashboard/admin/teams')
  }

  return (
    <div className="min-h-screen bg-dark">
      <NavbarWrapper role={user.role} username={user.username} userId={user.user_id} avatarUrl={user.avatar_url} />
      
      <main className="py-8">
        <MatchesListClient teamId={id} teamName={team.name} />
      </main>
    </div>
  )
}
