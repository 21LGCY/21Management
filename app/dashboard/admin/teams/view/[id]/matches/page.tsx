import { requireRole } from '@/lib/auth/server'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import MatchesListClient from './MatchesListClient'

interface MatchesListPageProps {
  params: {
    id: string
  }
}

export default async function MatchesListPage({ params }: MatchesListPageProps) {
  await requireRole(['admin'])
  
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

  return <MatchesListClient teamId={params.id} teamName={team.name} />
}
