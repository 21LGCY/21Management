'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, Save, Calendar, Users, Plus, Search, Filter } from 'lucide-react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { TeamCategory, StaffMember, Player, ContactStatus } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Navigation from '@/components/Navigation';
import { getStatusColor, getStatusLabel } from '@/lib/utils';

export default function NewTryoutWeekPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [players, setPlayers] = useState<Player[]>([]);
  const [selectedPlayers, setSelectedPlayers] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<ContactStatus | 'all'>('all');
  const [formData, setFormData] = useState({
    team_category: 'mens' as TeamCategory,
    week_label: '',
    week_start: '',
    week_end: '',
    notes: '',
    created_by: '' as StaffMember | '',
  });

  useEffect(() => {
    fetchPlayers();
    // Reset search and filter when team changes
    setSearchTerm('');
    setStatusFilter('all');
  }, [formData.team_category]);

  // Filter and search players
  const filteredPlayers = useMemo(() => {
    return players.filter(player => {
      const matchesSearch = player.username.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || player.contact_status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [players, searchTerm, statusFilter]);

  const fetchPlayers = async () => {
    try {
      // @ts-ignore - Supabase type inference issue
      const { data, error } = await supabase
        .from('players')
        .select('*')
        .eq('team_category', formData.team_category)
        .not('contact_status', 'in', '(rejected,left)')
        .order('username');

      if (error) throw error;

      setPlayers((data || []).map((p: any) => ({
        ...p,
        created_at: new Date(p.created_at),
        updated_at: new Date(p.updated_at),
        last_contact: p.last_contact ? new Date(p.last_contact) : null,
      })));
    } catch (error) {
      console.error('Error fetching players:', error);
    }
  };

  const handleInputChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }));
  };

  const togglePlayer = (playerId: string) => {
    const newSet = new Set(selectedPlayers);
    if (newSet.has(playerId)) {
      newSet.delete(playerId);
    } else {
      newSet.add(playerId);
    }
    setSelectedPlayers(newSet);
  };

  const selectAllPlayers = () => {
    if (selectedPlayers.size === filteredPlayers.length && filteredPlayers.length > 0) {
      // Remove all filtered players from selection
      const newSet = new Set(selectedPlayers);
      filteredPlayers.forEach(p => newSet.delete(p.id));
      setSelectedPlayers(newSet);
    } else {
      // Add all filtered players to selection
      const newSet = new Set(selectedPlayers);
      filteredPlayers.forEach(p => newSet.add(p.id));
      setSelectedPlayers(newSet);
    }
  };

  const generateToken = () => {
    return crypto.randomUUID().replace(/-/g, '');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (selectedPlayers.size === 0) {
      alert('Veuillez sélectionner au moins un joueur');
      return;
    }

    if (!formData.week_start || !formData.week_end) {
      alert('Veuillez sélectionner les dates de début et de fin de semaine');
      return;
    }

    setLoading(true);

    try {
      // Create tryout week
      // @ts-ignore - Supabase type inference issue
      const { data: week, error: weekError } = await supabase
        .from('tryout_weeks')
        .insert([{
          team_category: formData.team_category,
          week_label: formData.week_label,
          week_start: formData.week_start,
          week_end: formData.week_end,
          notes: formData.notes,
          created_by: formData.created_by || null,
          status: 'scheduled',
        }])
        .select()
        .single();

      if (weekError) throw weekError;

      // Create player availabilities with unique tokens
      const availabilities = Array.from(selectedPlayers).map(playerId => ({
        tryout_week_id: (week as any).id,
        player_id: playerId,
        token: generateToken(),
        time_slots: {},
      }));

      // @ts-ignore - Supabase type inference issue
      const { error: availError } = await supabase
        .from('player_availabilities')
        .insert(availabilities);

      if (availError) throw availError;

      router.push(`/tryouts/${(week as any).id}`);
    } catch (error) {
      console.error('Error creating tryout week:', error);
      alert('Échec de la création de la semaine de tryout');
    } finally {
      setLoading(false);
    }
  };

  // Auto-calculate week end (6 days after start)
  useEffect(() => {
    if (formData.week_start) {
      const startDate = new Date(formData.week_start);
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 6);
      
      const endString = endDate.toISOString().split('T')[0];
      setFormData(prev => ({ ...prev, week_end: endString }));
    }
  }, [formData.week_start]);

  return (
    <div className="min-h-screen bg-dark-900">
      <Navigation />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {/* Header */}
          <div className="mb-8">
            <Link href="/tryouts">
              <Button variant="ghost" className="mb-4">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Retour aux Tryouts
              </Button>
            </Link>
            <h1 className="flex items-center gap-3 text-3xl font-bold text-white">
              <Calendar className="w-8 h-8 text-primary-400" />
              Créer une session
            </h1>
            <p className="text-gray-400 mt-2">Planifiez une semaine complète de tryouts pour votre équipe</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Info Card */}
            <div className="glass-card p-8">
              <h2 className="text-xl font-semibold text-white mb-6">Informations sur la Semaine</h2>
              
              <div className="space-y-4">
                {/* Team Category */}
                <div>
                  <label className="text-sm font-medium text-gray-300 mb-2 block">
                    Équipe
                  </label>
                  <select
                    value={formData.team_category}
                    onChange={handleInputChange('team_category')}
                    className="select-glass w-full rounded-lg px-3 py-2"
                    required
                  >
                    <option value="mens">21L</option>
                    <option value="gc">21GC</option>
                    <option value="academy">21 ACA</option>
                  </select>
                </div>

                {/* Week Label */}
                <div>
                  <label className="text-sm font-medium text-gray-300 mb-2 block">
                    Titre (visibilité : staff et joueurs)
                  </label>
                  <Input
                    type="text"
                    value={formData.week_label}
                    onChange={handleInputChange('week_label')}
                    placeholder="ex : Semaine 1, Tryouts Janvier"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Facultatif - Permet d'identifier facilement cette session
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-300 mb-2 block">
                    Description (visibilité : staff et joueurs)
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={handleInputChange('notes')}
                    className="input-glass w-full rounded-lg px-3 py-2 min-h-[100px]"
                    placeholder="ex : Joueurs présents dans la session avec rôles"
                  />
                </div>

                {/* Date Range */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-300 mb-2 block">
                      Début de session
                    </label>
                    <Input
                      type="date"
                      value={formData.week_start}
                      onChange={handleInputChange('week_start')}
                      required
                      style={{ 
                        colorScheme: 'dark',
                        color: 'white',
                        WebkitTextFillColor: 'white'
                      } as React.CSSProperties}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-300 mb-2 block">
                      Fin de session (semaine automatique)
                    </label>
                    <Input
                      type="date"
                      value={formData.week_end}
                      onChange={handleInputChange('week_end')}
                      required
                      readOnly
                      style={{ 
                        colorScheme: 'dark',
                        color: 'white',
                        WebkitTextFillColor: 'white'
                      } as React.CSSProperties}
                    />
                  </div>
                </div>

                {/* Created By */}
                <div>
                  <label className="text-sm font-medium text-gray-300 mb-2 block">
                    Créé par
                  </label>
                  <select
                    value={formData.created_by}
                    onChange={handleInputChange('created_by')}
                    className="select-glass w-full rounded-lg px-3 py-2"
                  >
                    <option value="">Sélectionner un membre du staff</option>
                    <option value="Dexter">Dexter</option>
                    <option value="Zarqx">Zarqx</option>
                    <option value="Zazu">Zazu</option>
                    <option value="Honox">Honox</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Player Selection Card */}
            <div className="glass-card p-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="flex items-center gap-2 text-xl font-semibold text-white">
                  <Users className="w-5 h-5" />
                  Sélectionner les Joueurs ({selectedPlayers.size} sélectionné{selectedPlayers.size !== 1 ? 's' : ''})
                </h2>
                <Button
                  type="button"
                  variant="outline"
                  onClick={selectAllPlayers}
                  className="text-sm"
                  disabled={filteredPlayers.length === 0}
                >
                  {selectedPlayers.size === filteredPlayers.length && filteredPlayers.length > 0 ? 'Tout Désélectionner' : 'Tout Sélectionner'}
                </Button>
              </div>

              {/* Search and Filter */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {/* Search Bar */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Rechercher un joueur..."
                    className="pl-10"
                  />
                </div>

                {/* Status Filter */}
                <div className="relative">
                  <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as ContactStatus | 'all')}
                    className="select-glass w-full rounded-lg pl-10 pr-3 py-2"
                  >
                    <option value="all">Tous les statuts</option>
                    <option value="tryout">En Tryouts</option>
                    <option value="contacted">Contacté</option>
                    <option value="not_contacted">Non Contacté</option>
                    <option value="subs">Remplaçant</option>
                    <option value="accepted">Joueur</option>
                  </select>
                </div>
              </div>

              {/* Results Summary */}
              {(searchTerm || statusFilter !== 'all') && (
                <div className="mb-4 text-sm text-gray-400">
                  {filteredPlayers.length} joueur{filteredPlayers.length !== 1 ? 's' : ''} trouvé{filteredPlayers.length !== 1 ? 's' : ''}
                  {searchTerm && ` pour "${searchTerm}"`}
                  {statusFilter !== 'all' && ` avec le statut "${getStatusLabel(statusFilter)}"`}
                </div>
              )}

              {filteredPlayers.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  {players.length === 0 ? (
                    <>
                      <p>Aucun joueur disponible pour cette équipe</p>
                      <p className="text-sm mt-1">Les joueurs avec les statuts "Refusé" ou "Quitté" sont exclus</p>
                    </>
                  ) : (
                    <>
                      <p>Aucun joueur trouvé</p>
                      <p className="text-sm mt-1">Essayez de modifier vos critères de recherche</p>
                    </>
                  )}
                </div>
              ) : (
                <div className="grid gap-3 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
                  {filteredPlayers.map((player) => (
                    <div
                      key={player.id}
                      onClick={() => togglePlayer(player.id)}
                      className={`p-4 rounded-lg border cursor-pointer transition-all ${
                        selectedPlayers.has(player.id)
                          ? 'bg-primary-500/20 border-primary-500/50'
                          : 'bg-white/5 border-white/10 hover:bg-white/10'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={selectedPlayers.has(player.id)}
                          onChange={() => {}}
                          className="w-5 h-5 rounded border-white/20 bg-white/5 text-primary-500"
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-white font-medium">{player.username}</span>
                            <span className={`text-xs px-2 py-0.5 rounded-full border ${getStatusColor(player.contact_status)}`}>
                              {getStatusLabel(player.contact_status)}
                            </span>
                          </div>
                          <div className="text-sm text-gray-400 capitalize">{player.role}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Submit Button */}
            <div className="flex gap-4">
              <Button
                type="submit"
                disabled={loading || selectedPlayers.size === 0}
                className="flex-1 flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" />
                {loading ? 'Création...' : 'Créer la Semaine de Tryout'}
              </Button>
              <Link href="/tryouts">
                <Button type="button" variant="outline">
                  Annuler
                </Button>
              </Link>
            </div>
          </form>
        </motion.div>
      </main>
    </div>
  );
}
