import { requireRole } from '@/lib/auth/server'
import NavbarWrapper from '@/components/NavbarWrapper'
import { notFound } from 'next/navigation'
import StratMapClient from './StratMapClient'
import { ValorantMap } from '@/lib/types/database'

const VALID_MAPS: ValorantMap[] = [
  'Ascent', 'Bind', 'Haven', 'Split', 'Icebox', 'Breeze',
  'Fracture', 'Pearl', 'Lotus', 'Sunset', 'Abyss', 'Corrode'
]

export default async function PlayerStratMapPage({ 
  params 
}: { 
  params: Promise<{ map: string }>
}) {
  const { map } = await params
  const user = await requireRole(['player'])
  
  // Capitalize first letter to match enum
  const mapName = map.charAt(0).toUpperCase() + map.slice(1) as ValorantMap
  
  // Validate map name
  if (!VALID_MAPS.includes(mapName)) {
    notFound()
  }

  // Get player's team_id from their profile
  const supabase = await (await import('@/lib/supabase/server')).createClient()
  const { data: playerData } = await supabase
    .from('profiles')
    .select('team_id')
    .eq('id', user.user_id)
    .single()

  if (!playerData?.team_id) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-dark">
      <NavbarWrapper role={user.role} username={user.username} userId={user.user_id} avatarUrl={user.avatar_url} />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <StratMapClient 
          teamId={playerData.team_id}
          mapName={mapName}
          userId={user.user_id}
          userName={user.username}
          userRole={user.role}
        />
      </main>
    </div>
  )
}
