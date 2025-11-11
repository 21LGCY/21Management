import { requireRole } from '@/lib/auth/server'
import Navbar from '@/components/Navbar'
import { notFound } from 'next/navigation'
import StratMapClient from './StratMapClient'
import { ValorantMap } from '@/lib/types/database'

const VALID_MAPS: ValorantMap[] = [
  'Ascent', 'Bind', 'Haven', 'Split', 'Icebox', 'Breeze',
  'Fracture', 'Pearl', 'Lotus', 'Sunset', 'Abyss', 'Corrode'
]

export default async function StratMapPage({ 
  params 
}: { 
  params: { id: string; map: string } 
}) {
  const user = await requireRole(['admin', 'manager', 'player'])
  
  // Capitalize first letter to match enum
  const mapName = params.map.charAt(0).toUpperCase() + params.map.slice(1) as ValorantMap
  
  // Validate map name
  if (!VALID_MAPS.includes(mapName)) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-dark">
      <Navbar role={user.role} username={user.username} />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <StratMapClient 
          teamId={params.id}
          mapName={mapName}
          userId={user.user_id}
          userName={user.username}
          userRole={user.role}
        />
      </main>
    </div>
  )
}
