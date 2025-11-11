import { requireRole } from '@/lib/auth/server'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Navbar from '@/components/Navbar'
import AddMatchClient from './AddMatchClient'

interface NewMatchPageProps {
  params: {
    id: string
  }
}

export default async function NewMatchPage({ params }: NewMatchPageProps) {
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
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Record New Match</h1>
            <p className="text-gray-400">Record match results and player statistics for {team.name}</p>
          </div>

          <AddMatchClient teamId={params.id} teamName={team.name} />
        </div>
      </main>
    </div>
  )
}
