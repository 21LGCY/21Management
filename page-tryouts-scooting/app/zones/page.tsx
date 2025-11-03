'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Globe, Users, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { Player, TeamCategory, ValorantRole, ContactStatus } from '@/types';
import Navigation from '@/components/Navigation';

// VALORANT European Zones mapping (French country names)
const VALORANT_ZONES = {
  'Europe du Nord': ['Danemark', 'Finlande', 'Irlande', 'Islande', 'Norvège', 'Suède', 'Royaume-Uni'],
  'Europe de l\'Est': ['Albanie', 'Arménie', 'Azerbaïdjan', 'Biélorussie', 'Bosnie-Herzégovine', 'Bulgarie', 'Croatie', 'Estonie', 'Géorgie', 'Grèce', 'Hongrie', 'Kazakhstan', 'Kirghizistan', 'Lettonie', 'Lituanie', 'Moldavie', 'Monténégro', 'Pologne', 'Roumanie', 'Russie', 'Serbie', 'Slovaquie', 'Slovénie', 'République tchèque', 'Ukraine', 'Ouzbékistan'],
  'DACH': ['Allemagne', 'Autriche', 'Suisse'],
  'IBIT': ['Espagne', 'Italie', 'Portugal'],
  'France': ['France'],
};

interface ZoneStats {
  zone: string;
  count: number;
  players: Player[];
  percentage: number;
}

export default function ZonesPage() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [zoneStats, setZoneStats] = useState<ZoneStats[]>([]);
  
  // Initialize filters from sessionStorage or use defaults
  const [teamFilter, setTeamFilter] = useState<TeamCategory | 'all'>(() => {
    if (typeof window !== 'undefined') {
      return (sessionStorage.getItem('zones_teamFilter') as TeamCategory | 'all') || 'all';
    }
    return 'all';
  });
  const [statusFilter, setStatusFilter] = useState<ContactStatus | 'all'>(() => {
    if (typeof window !== 'undefined') {
      return (sessionStorage.getItem('zones_statusFilter') as ContactStatus | 'all') || 'tryout';
    }
    return 'tryout';
  });
  const [roleFilter, setRoleFilter] = useState<ValorantRole | 'all'>(() => {
    if (typeof window !== 'undefined') {
      return (sessionStorage.getItem('zones_roleFilter') as ValorantRole | 'all') || 'all';
    }
    return 'all';
  });

  // Save filters to sessionStorage whenever they change
  useEffect(() => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('zones_teamFilter', teamFilter);
      sessionStorage.setItem('zones_statusFilter', statusFilter);
      sessionStorage.setItem('zones_roleFilter', roleFilter);
    }
  }, [teamFilter, statusFilter, roleFilter]);

  useEffect(() => {
    fetchPlayers();
  }, []);

  useEffect(() => {
    calculateZoneStats();
  }, [players, teamFilter, statusFilter, roleFilter]);

  const fetchPlayers = async () => {
    try {
      const { data, error } = await supabase
        .from('players')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPlayers(data || []);
    } catch (error) {
      console.error('Error fetching players:', error);
    } finally {
      setLoading(false);
    }
  };

  const getZoneForNationality = (nationality: string): string | null => {
    if (!nationality) return null;
    
    for (const [zone, countries] of Object.entries(VALORANT_ZONES)) {
      if (countries.some(country => 
        nationality.toLowerCase().includes(country.toLowerCase()) ||
        country.toLowerCase().includes(nationality.toLowerCase())
      )) {
        return zone;
      }
    }
    return 'Autre';
  };

  const calculateZoneStats = () => {
    let filteredPlayers = players;
    
    // Apply team filter
    if (teamFilter !== 'all') {
      filteredPlayers = filteredPlayers.filter(p => p.team_category === teamFilter);
    }
    
    // Apply status filter
    if (statusFilter !== 'all') {
      filteredPlayers = filteredPlayers.filter(p => p.contact_status === statusFilter);
    }
    
    // Apply role filter
    if (roleFilter !== 'all') {
      filteredPlayers = filteredPlayers.filter(p => p.role === roleFilter);
    }

    // Exclude players without nationality and rejected/left players (unless specifically filtered for)
    const playersWithNationality = filteredPlayers.filter(p => 
      p.nationality && 
      (statusFilter === 'rejected' || statusFilter === 'left' || 
       (p.contact_status !== 'rejected' && p.contact_status !== 'left'))
    );
    
    const zoneMap = new Map<string, Player[]>();
    
    playersWithNationality.forEach(player => {
      const zone = getZoneForNationality(player.nationality || '');
      if (zone) {
        if (!zoneMap.has(zone)) {
          zoneMap.set(zone, []);
        }
        zoneMap.get(zone)?.push(player);
      }
    });

    const total = playersWithNationality.length;
    const stats: ZoneStats[] = Array.from(zoneMap.entries())
      .map(([zone, zonePlayers]) => ({
        zone,
        count: zonePlayers.length,
        players: zonePlayers,
        percentage: total > 0 ? (zonePlayers.length / total) * 100 : 0
      }))
      .sort((a, b) => b.count - a.count);

    setZoneStats(stats);
  };

  const getZoneColor = (zone: string): string => {
    const colors: Record<string, string> = {
      'Europe du Nord': 'from-green-500 to-emerald-600',
      'Europe de l\'Est': 'from-purple-500 to-violet-600',
      'DACH': 'from-yellow-500 to-orange-500',
      'IBIT': 'from-red-500 to-pink-500',
      'France': 'from-blue-500 to-indigo-600',
      'Autre': 'from-gray-500 to-gray-600'
    };
    return colors[zone] || 'from-gray-500 to-gray-600';
  };

  const teamCategoryLabels = {
    'mens': '21L',
    'gc': '21GC',
    'academy': '21 ACA'
  };

  const totalPlayersWithNationality = (() => {
    let filtered = players;
    
    if (teamFilter !== 'all') {
      filtered = filtered.filter(p => p.team_category === teamFilter);
    }
    
    if (statusFilter !== 'all') {
      filtered = filtered.filter(p => p.contact_status === statusFilter);
    }
    
    if (roleFilter !== 'all') {
      filtered = filtered.filter(p => p.role === roleFilter);
    }
    
    return filtered.filter(p => 
      p.nationality && 
      (statusFilter === 'rejected' || statusFilter === 'left' || 
       (p.contact_status !== 'rejected' && p.contact_status !== 'left'))
    ).length;
  })();

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-900">
        <Navigation />
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-900">
      <Navigation />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link 
                href="/players"
                className="flex items-center space-x-2 text-gray-300 hover:text-white transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>Retour aux Joueurs</span>
              </Link>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold gradient-text flex items-center gap-3">
                <Globe className="w-8 h-8" />
                VALORANT ZONES
              </h1>
              <p className="text-gray-400 mt-1">
                Répartition géographique de tous les joueurs : [ {totalPlayersWithNationality} avec une nationalité ]
              </p>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-3">
              {/* Team Filter */}
              <select
                value={teamFilter}
                onChange={(e) => setTeamFilter(e.target.value as TeamCategory | 'all')}
                className="select-glass rounded-lg px-4 py-2 min-w-[150px]"
              >
                <option value="all">Toutes les Équipes</option>
                <option value="mens">21L</option>
                <option value="gc">21GC</option>
                <option value="academy">21 ACA</option>
              </select>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as ContactStatus | 'all')}
                className="select-glass rounded-lg px-4 py-2 min-w-[150px]"
              >
                <option value="all">Tous les Status</option>
                <option value="not_contacted">Non Contacté</option>
                <option value="contacted">Contacté / En Attente</option>
                <option value="tryout">En Tryouts</option>
                <option value="accepted">Joueur</option>
                <option value="subs">Remplaçant</option>
                <option value="rejected">Refusé</option>
                <option value="left">Quitté</option>
              </select>

              {/* Role Filter */}
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value as ValorantRole | 'all')}
                className="select-glass rounded-lg px-4 py-2 min-w-[150px]"
              >
                <option value="all">Tous les Rôles</option>
                <option value="duelist">Duelist</option>
                <option value="initiator">Initiator</option>
                <option value="controller">Controller</option>
                <option value="sentinel">Sentinel</option>
                <option value="flex">Flex</option>
              </select>
            </div>
          </div>

          {/* Zone Statistics */}
          {zoneStats.length === 0 ? (
            <div className="glass-card p-12 text-center">
              <Globe className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <div className="text-gray-400 mb-2">Aucune nationalité disponible</div>
              <p className="text-gray-500 text-sm">
                Ajoutez des nationalités aux profils des joueurs pour voir la répartition par zone
              </p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {zoneStats.map((stat, index) => (
                <motion.div
                  key={stat.zone}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                  className="glass-card p-6 card-hover"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className={`inline-block px-3 py-1 rounded-lg bg-gradient-to-r ${getZoneColor(stat.zone)} text-white font-bold text-sm mb-2`}>
                        {stat.zone}
                      </div>
                      <div className="flex items-center gap-2 text-gray-400">
                        <Users className="w-4 h-4" />
                        <span className="text-2xl font-bold text-white">{stat.count}</span>
                        <span className="text-sm">Joueurs</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-1 text-primary-400">
                        <TrendingUp className="w-4 h-4" />
                        <span className="text-xl font-bold">{stat.percentage.toFixed(1)}%</span>
                      </div>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-gray-800 rounded-full h-2 mb-4">
                    <div
                      className={`h-2 rounded-full bg-gradient-to-r ${getZoneColor(stat.zone)} transition-all duration-500`}
                      style={{ width: `${stat.percentage}%` }}
                    />
                  </div>

                  {/* Player List */}
                  <div className="space-y-2">
                    <div className="text-xs text-gray-500 mb-2">Joueurs :</div>
                    {stat.players.slice(0, 5).map(player => (
                      <Link
                        key={player.id}
                        href={`/players/${player.id}`}
                        className="block p-2 rounded hover:bg-white/5 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="text-sm text-white font-medium">
                              {player.username}
                            </div>
                            <div className="text-xs text-gray-500 mt-0.5">
                              {player.nationality}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 ml-3">
                            <span className="text-xs px-2 py-1 rounded bg-white/10 text-gray-300">
                              {player.role.charAt(0).toUpperCase() + player.role.slice(1)}
                            </span>
                            <span className={`text-xs px-2 py-1 rounded ${
                              player.contact_status === 'accepted' ? 'bg-green-500/20 text-green-300' :
                              player.contact_status === 'subs' ? 'bg-purple-500/20 text-purple-300' :
                              player.contact_status === 'tryout' ? 'bg-blue-500/20 text-blue-300' :
                              player.contact_status === 'contacted' ? 'bg-yellow-500/20 text-yellow-300' :
                              player.contact_status === 'not_contacted' ? 'bg-slate-500/20 text-slate-300' :
                              player.contact_status === 'rejected' ? 'bg-red-500/20 text-red-300' :
                              'bg-gray-500/20 text-gray-300'
                            }`}>
                              {player.contact_status === 'accepted' ? 'Joueur' :
                               player.contact_status === 'subs' ? 'Remplaçant' :
                               player.contact_status === 'tryout' ? 'Tryout' :
                               player.contact_status === 'contacted' ? 'Contacté' :
                               player.contact_status === 'not_contacted' ? 'Non Contacté' :
                               player.contact_status === 'rejected' ? 'Refusé' :
                               player.contact_status === 'left' ? 'Quitté' : 'Unknown'}
                            </span>
                          </div>
                        </div>
                      </Link>
                    ))}
                    {stat.players.length > 5 && (
                      <div className="text-xs text-gray-500 mt-1 pl-2">
                        +{stat.players.length - 5} de plus
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {/* Zone Legend */}
          <div className="glass-card p-6">
            <h2 className="text-xl font-bold text-white mb-4">DÉFINITIONS DES ZONES VALORANT</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
              {Object.entries(VALORANT_ZONES).map(([zone, countries]) => (
                <div key={zone} className="text-gray-400">
                  <span className={`inline-block px-2 py-1 rounded bg-gradient-to-r ${getZoneColor(zone)} text-white text-xs font-bold mr-2`}>
                    {zone}
                  </span>
                  <div className="mt-1 text-xs text-gray-500">
                    {countries.slice(0, 3).join(', ')}
                    {countries.length > 3 && ` +${countries.length - 3} de plus`}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
