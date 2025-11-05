import { requireRole } from '@/lib/auth/server'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Navbar from '@/components/Navbar'
import MatchesListClient from './MatchesListClient'

interface MatchesListPageProps {
  params: {
    id: string
  }
}

export default async function MatchesListPage({ params }: MatchesListPageProps) {
  const user = await requireRole(['admin'])
  
  const supabase = await createClient()
  
  // Fetch team info
  const { data: team } = await supabase
    .from('teams')
    .select('name')
    .eq('id', params.id)
    .single()

  if (!team) {
    redirect('/dashboard/admin/teams')
  }

  return (
    <div className="min-h-screen bg-dark">
      <Navbar role={user.role} username={user.username} />
      
      <main className="py-8">
        <MatchesListClient teamId={params.id} teamName={team.name} />
      </main>
    </div>
  )
}
