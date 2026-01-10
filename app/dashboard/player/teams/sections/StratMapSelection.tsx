'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Map as MapIcon } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { GameType, getMapsForGame, getGameConfig } from '@/lib/types/games'

interface StratMapSelectionProps {
  teamId: string
  gameType?: GameType
}

export default function StratMapSelection({ teamId, gameType = 'valorant' }: StratMapSelectionProps) {
  const t = useTranslations('stratMaps')
  const gameConfig = getGameConfig(gameType)
  const maps = getMapsForGame(gameType)

  return (
    <div className="space-y-6">
      <div className="bg-dark-card border border-gray-800 rounded-lg p-6">
        <div className="flex items-center gap-3 mb-6">
          <MapIcon className="w-6 h-6 text-primary" />
          <div>
            <h2 className="text-2xl font-bold text-white">{t('title')}</h2>
            <p className="text-gray-400 text-sm">{t('description')}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {maps.map((map) => (
            <Link
              key={map}
              href={`/dashboard/player/teams/strat-map/${map.toLowerCase()}`}
              className="group relative overflow-hidden rounded-lg border border-gray-800 bg-dark hover:border-primary transition-all duration-300 hover:scale-105"
            >
              <div className="aspect-video relative">
                <Image
                  src={`/images/${gameType}/${gameType === 'cs2' ? map : map.toLowerCase()}.webp`}
                  alt={map}
                  fill
                  className="object-cover opacity-60 group-hover:opacity-80 transition-opacity"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                  onError={(e) => {
                    // Fallback if image not found
                    const target = e.target as HTMLImageElement
                    target.style.display = 'none'
                  }}
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
