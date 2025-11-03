'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Filter, Plus, Eye, Edit, Trash2, ExternalLink, Users } from 'lucide-react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { Player, ContactStatus, TeamCategory, ValorantRole } from '@/types';
import { formatDate, getStatusColor, getStatusLabel, capitalizeFirst, getRankImage, getRankLabel } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Image from 'next/image';

export default function PlayersContent() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Initialize filters from sessionStorage or use defaults
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<ContactStatus | 'all'>(() => {
    if (typeof window !== 'undefined') {
      return (sessionStorage.getItem('players_statusFilter') as ContactStatus | 'all') || 'tryout';
    }
    return 'tryout';
  });
  const [teamFilter, setTeamFilter] = useState<TeamCategory | 'all'>(() => {
    if (typeof window !== 'undefined') {
      return (sessionStorage.getItem('players_teamFilter') as TeamCategory | 'all') || 'all';
    }
    return 'all';
  });
  const [roleFilter, setRoleFilter] = useState<ValorantRole | 'all'>(() => {
    if (typeof window !== 'undefined') {
      return (sessionStorage.getItem('players_roleFilter') as ValorantRole | 'all') || 'all';
    }
    return 'all';
  });

  // Load search term from sessionStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedSearchTerm = sessionStorage.getItem('players_searchTerm');
      if (savedSearchTerm) setSearchTerm(savedSearchTerm);
    }
  }, []);

  // Save filters to sessionStorage whenever they change
  useEffect(() => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('players_statusFilter', statusFilter);
      sessionStorage.setItem('players_teamFilter', teamFilter);
      sessionStorage.setItem('players_roleFilter', roleFilter);
      sessionStorage.setItem('players_searchTerm', searchTerm);
    }
  }, [statusFilter, teamFilter, roleFilter, searchTerm]);

  // Fetch players from Supabase
  useEffect(() => {
    fetchPlayers();
  }, []);

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

  const deletePlayer = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce joueur ?')) return;

    try {
      const { error } = await supabase
        .from('players')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setPlayers(players.filter(p => p.id !== id));
    } catch (error) {
      console.error('Error deleting player:', error);
    }
  };

  // Filter players based on search and filters
  const filteredPlayers = players.filter(player => {
    const matchesSearch = player.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         player.team_category.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         player.role.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || player.contact_status === statusFilter;
    const matchesTeam = teamFilter === 'all' || player.team_category === teamFilter;
    const matchesRole = roleFilter === 'all' || player.role === roleFilter;
    
    return matchesSearch && matchesStatus && matchesTeam && matchesRole;
  });

  // Get team categories for display
  const teamCategoryLabels = {
    'mens': '21L',
    'gc': '21GC',
    'academy': '21 ACA'
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold gradient-text">Recrutement VALORANT</h1>
          <p className="text-gray-400 mt-1">
            Gestion de [ {filteredPlayers.length} joueurs ]
          </p>
        </div>
        <div className="flex gap-3">
          <Link href="/players/new">
            <Button className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Ajouter un Joueur
            </Button>
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="glass-card p-6">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Rechercher joueurs, équipes ou rôles..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as ContactStatus | 'all')}
            className="select-glass rounded-lg px-3 py-2 min-w-[150px]"
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

          {/* Team Filter */}
          <select
            value={teamFilter}
            onChange={(e) => setTeamFilter(e.target.value as TeamCategory | 'all')}
            className="select-glass rounded-lg px-3 py-2 min-w-[150px]"
          >
            <option value="all">Toutes les Équipes</option>
            <option value="mens">21L</option>
            <option value="gc">21GC</option>
            <option value="academy">21 ACA</option>
          </select>

          {/* Role Filter */}
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as ValorantRole | 'all')}
            className="select-glass rounded-lg px-3 py-2 min-w-[150px]"
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

      {/* Players Grid */}
      {filteredPlayers.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <div className="text-gray-400 mb-4">
            {players.length === 0 ? 'Aucun joueur trouvé' : 'Aucun joueur ne correspond à vos filtres'}
          </div>
          <Link href="/players/new">
            <Button>Ajouter votre premier joueur</Button>
          </Link>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredPlayers.map((player, index) => (
            <motion.div
              key={player.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="glass-card p-6 card-hover flex flex-col"
            >
              {/* Content wrapper that grows to push buttons down */}
              <div className="flex-1">
                {/* Player Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="text-xl font-semibold text-white">
                        {player.username}
                      </h3>
                      {player.rank && (
                        <Image 
                          src={getRankImage(player.rank)} 
                          alt={getRankLabel(player.rank)}
                          width={40}
                          height={40}
                          className="object-contain"
                          title={getRankLabel(player.rank)}
                        />
                      )}
                    </div>
                    <p className="text-gray-400 text-sm">
                      {teamCategoryLabels[player.team_category]} • {capitalizeFirst(player.role)}
                    </p>
                    {player.nationality && (
                      <p className="text-gray-500 text-xs mt-1">{player.nationality}</p>
                    )}
                  </div>
                  <div className={`status-badge ${getStatusColor(player.contact_status)}`}>
                    {getStatusLabel(player.contact_status)}
                  </div>
                </div>

                {/* Last Contact */}
                <div className="text-sm text-gray-400 mb-4">
                  Dernier contact : {player.contact_status === 'not_contacted' 
                    ? <span className="italic text-gray-500">Pas encore contacté</span>
                    : formatDate(player.last_contact)}
                </div>

                {/* Staff Assignments */}
                {(player.managed_by || player.contacted_by) && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {player.managed_by && (
                      <span className="inline-flex items-center px-2 py-1 rounded text-xs bg-primary-500/10 text-primary-300 border border-primary-500/20">
                        Ajouté : {player.managed_by}
                      </span>
                    )}
                    {player.contacted_by && (
                      <span className="inline-flex items-center px-2 py-1 rounded text-xs bg-secondary-500/10 text-secondary-300 border border-secondary-500/20">
                        Contact : {player.contacted_by}
                      </span>
                    )}
                  </div>
                )}

                {/* Notes Preview */}
                {player.notes && (
                  <div className="text-sm text-gray-300 mb-4 line-clamp-2">
                    {player.notes}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-4 border-t border-white/10">
                {/* Tracker.gg Link Button */}
                {player.links && player.links.includes('tracker.gg') && (
                  <a
                    href={player.links.split('\n').find(link => link.includes('tracker.gg'))?.trim().startsWith('http') 
                      ? player.links.split('\n').find(link => link.includes('tracker.gg'))?.trim() 
                      : `https://${player.links.split('\n').find(link => link.includes('tracker.gg'))?.trim()}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Button variant="outline" size="sm" className="w-full">
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Stats
                    </Button>
                  </a>
                )}
                
                <Link href={`/players/${player.id}`} className="flex-1">
                  <Button variant="outline" size="sm" className="w-full">
                    <Eye className="w-4 h-4 mr-2" />
                    Voir
                  </Button>
                </Link>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => deletePlayer(player.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}