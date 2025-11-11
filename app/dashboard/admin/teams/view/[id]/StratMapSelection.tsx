'use client'

import { ValorantMap } from '@/lib/types/database'
import Link from 'next/link'
import Image from 'next/image'
import { Map as MapIcon } from 'lucide-react'

interface StratMapSelectionProps {
  teamId: string
}

const VALORANT_MAPS: ValorantMap[] = [
  'Ascent',
  'Bind',
  'Haven',
  'Split',
  'Icebox',
  'Breeze',
  'Fracture',
  'Pearl',
  'Lotus',
  'Sunset',
  'Abyss',
  'Corrode'
]

export default function StratMapSelection({ teamId }: StratMapSelectionProps) {
  return (
    <div className="space-y-6">
      <div className="bg-dark-card border border-gray-800 rounded-lg p-6">
        <div className="flex items-center gap-3 mb-6">
          <MapIcon className="w-6 h-6 text-primary" />
          <div>
            <h2 className="text-2xl font-bold text-white">Strat Maps</h2>
            <p className="text-gray-400 text-sm">Select a map to view and discuss strategies</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {VALORANT_MAPS.map((map) => (
            <Link
              key={map}
              href={`/dashboard/admin/teams/view/${teamId}/strat-map/${map.toLowerCase()}`}
              className="group relative overflow-hidden rounded-lg border border-gray-800 bg-dark hover:border-primary transition-all duration-300 hover:scale-105"
            >
              <div className="aspect-video relative">
                <Image
                  src={`/images/${map.toLowerCase()}.webp`}
                  alt={map}
                  fill
                  className="object-cover opacity-60 group-hover:opacity-80 transition-opacity"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-dark via-dark/60 to-transparent" />
                
                <div className="absolute inset-0 flex items-end p-4">
                  <h3 className="text-xl font-bold text-white group-hover:text-primary transition">
                    {map}
                  </h3>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
