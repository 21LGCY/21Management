'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, Calendar, Copy, CheckCircle, User, Trash2, BarChart3, Clock, RefreshCw, UserPlus, Edit2, Save, X, Search } from 'lucide-react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { TryoutWeek, PlayerAvailability } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Navigation from '@/components/Navigation';
import AvailabilityHeatmap from '@/components/AvailabilityHeatmap';
import AvailabilityCalendar from '@/components/AvailabilityCalendar';
import { getStatusColor, getStatusLabel } from '@/lib/utils';

export default function TryoutWeekDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [week, setWeek] = useState<TryoutWeek | null>(null);
  const [availabilities, setAvailabilities] = useState<PlayerAvailability[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'heatmap' | 'individual'>('heatmap');
  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null);
  const [showAddPlayersModal, setShowAddPlayersModal] = useState(false);
  const [availablePlayers, setAvailablePlayers] = useState<any[]>([]);
  const [selectedPlayersToAdd, setSelectedPlayersToAdd] = useState<string[]>([]);
  const [addingPlayers, setAddingPlayers] = useState(false);
  const [playerSearchTerm, setPlayerSearchTerm] = useState('');
  const [isEditingInfo, setIsEditingInfo] = useState(false);
  const [editedTitle, setEditedTitle] = useState('');
  const [editedNotes, setEditedNotes] = useState('');
  const [savingInfo, setSavingInfo] = useState(false);

  // Filter players in Add Players modal based on search
  const filteredAvailablePlayers = useMemo(() => {
    if (!playerSearchTerm) return availablePlayers;
    
    const search = playerSearchTerm.toLowerCase();
    return availablePlayers.filter(player => 
      player.username.toLowerCase().includes(search) ||
      player.role?.toLowerCase().includes(search) ||
      player.nationality?.toLowerCase().includes(search)
    );
  }, [availablePlayers, playerSearchTerm]);

  useEffect(() => {
    if (params.id) {
      fetchTryoutWeek();
    }
  }, [params.id]);

  // Cleanup: restore body scroll when component unmounts or modal state changes
  useEffect(() => {
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  // Handle escape key to close modal
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showAddPlayersModal) {
        handleCloseAddPlayersModal();
      }
    };

    if (showAddPlayersModal) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [showAddPlayersModal]);

  const fetchTryoutWeek = async () => {
    try {
      // @ts-ignore
      const { data: weekData, error: weekError } = await supabase
        .from('tryout_weeks')
        .select('*')
        .eq('id', params.id)
        .single();

      if (weekError) throw weekError;

      // @ts-ignore
      const { data: availData, error: availError } = await supabase
        .from('player_availabilities')
        .select(`
          *,
          player:players(*)
        `)
        .eq('tryout_week_id', params.id);

      if (availError) throw availError;

      setWeek({
        ...(weekData as any),
        week_start: new Date((weekData as any).week_start),
        week_end: new Date((weekData as any).week_end),
        created_at: new Date((weekData as any).created_at),
        updated_at: new Date((weekData as any).updated_at),
      });

      setAvailabilities((availData || []).map((a: any) => ({
        ...a,
        created_at: new Date(a.created_at),
        updated_at: new Date(a.updated_at),
        submitted_at: a.submitted_at ? new Date(a.submitted_at) : null,
      })));
    } catch (error) {
      console.error('Error fetching tryout week:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailablePlayers = async () => {
    if (!week) return;
    
    try {
      // Get all players from the same team category who aren't already in this tryout
      const currentPlayerIds = availabilities.map(a => a.player_id);
      
      let query = supabase
        .from('players')
        .select('*')
        .eq('team_category', week.team_category)
        .in('contact_status', ['not_contacted', 'contacted', 'tryout', 'subs'])
        .order('username');
        
      // Only add the exclusion filter if there are existing players
      if (currentPlayerIds.length > 0) {
        query = query.not('id', 'in', `(${currentPlayerIds.join(',')})`);
      }

      // @ts-ignore
      const { data: players, error } = await query;

      if (error) throw error;
      setAvailablePlayers(players || []);
    } catch (error) {
      console.error('Error fetching available players:', error);
    }
  };

  const handleAddPlayers = async () => {
    if (selectedPlayersToAdd.length === 0 || !week) return;
    
    setAddingPlayers(true);
    try {
      // Create player availability records for selected players
      const playerAvailabilities = selectedPlayersToAdd.map(playerId => ({
        tryout_week_id: week.id,
        player_id: playerId,
        token: crypto.randomUUID(),
        time_slots: {},
        submitted_at: null,
      }));

      // @ts-ignore - Supabase type inference issue
      const { error } = await supabase
        .from('player_availabilities')
        .insert(playerAvailabilities);

      if (error) throw error;

      // Refresh the data
      await fetchTryoutWeek();
      
      // Get added player names for confirmation
      const addedPlayerNames = availablePlayers
        .filter(p => selectedPlayersToAdd.includes(p.id))
        .map(p => p.username)
        .join(', ');
      
      // Reset modal state
      setSelectedPlayersToAdd([]);
      setPlayerSearchTerm('');
      setShowAddPlayersModal(false);
      document.body.style.overflow = 'unset'; // Restore background scrolling
      
      // Success notification
      const count = selectedPlayersToAdd.length;
      alert(`✅ ${count} joueur${count > 1 ? 's' : ''} ajouté${count > 1 ? 's' : ''} avec succès!\n\n${addedPlayerNames}`);
    } catch (error) {
      console.error('Error adding players:', error);
      alert('❌ Erreur lors de l\'ajout des joueurs. Veuillez réessayer.');
    } finally {
      setAddingPlayers(false);
    }
  };

  const handleShowAddPlayersModal = async () => {
    setShowAddPlayersModal(true);
    setPlayerSearchTerm(''); // Reset search when opening modal
    document.body.style.overflow = 'hidden'; // Prevent background scrolling
    await fetchAvailablePlayers();
  };

  const handleCloseAddPlayersModal = () => {
    setShowAddPlayersModal(false);
    setPlayerSearchTerm(''); // Clear search on close
    setSelectedPlayersToAdd([]); // Clear selections on close
    document.body.style.overflow = 'unset'; // Restore background scrolling
  };

  const handleStartEdit = () => {
    if (week) {
      setEditedTitle(week.week_label || '');
      setEditedNotes(week.notes || '');
      setIsEditingInfo(true);
    }
  };

  const handleCancelEdit = () => {
    setIsEditingInfo(false);
    setEditedTitle('');
    setEditedNotes('');
  };

  const handleSaveInfo = async () => {
    if (!week) return;
    
    setSavingInfo(true);
    try {
      // @ts-ignore - Supabase type inference issue
      const { error } = await supabase
        .from('tryout_weeks')
        .update({
          week_label: editedTitle || null,
          notes: editedNotes || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', week.id);

      if (error) throw error;

      // Update local state
      setWeek({
        ...week,
        week_label: editedTitle,
        notes: editedNotes,
        updated_at: new Date(),
      });

      setIsEditingInfo(false);
      alert('Informations mises à jour avec succès!');
    } catch (error) {
      console.error('Error updating tryout info:', error);
      alert('Erreur lors de la mise à jour des informations');
    } finally {
      setSavingInfo(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchTryoutWeek();
    } finally {
      setRefreshing(false);
    }
  };

  const copyTokenLink = (token: string) => {
    const link = `${window.location.origin}/availability?token=${token}`;
    navigator.clipboard.writeText(link);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  const hasResponded = (availability: PlayerAvailability): boolean => {
    const slots = availability.time_slots || {};
    return Object.keys(slots).length > 0 && 
           Object.values(slots).some(day => Object.values(day || {}).length > 0);
  };

  const countAvailableSlots = (availability: PlayerAvailability): number => {
    const slots = availability.time_slots || {};
    let count = 0;
    Object.values(slots).forEach(day => {
      if (day) {
        Object.values(day).forEach(available => {
          if (available) count++;
        });
      }
    });
    return count;
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('fr-FR', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      timeZone: 'Europe/Paris'
    });
  };

  const formatDateTime = (date: Date) => {
    return date.toLocaleString('fr-FR', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: false,
      timeZone: 'Europe/Paris'
    });
  };

  const handleDelete = async () => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette semaine de tryout? Cela supprimera également toutes les disponibilités des joueurs.')) {
      return;
    }

    try {
      // @ts-ignore
      const { error } = await supabase
        .from('tryout_weeks')
        .delete()
        .eq('id', params.id);

      if (error) throw error;

      router.push('/tryouts');
    } catch (error) {
      console.error('Error deleting tryout week:', error);
      alert('Échec de la suppression de la semaine de tryout');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-900">
        <Navigation />
        <div className="flex items-center justify-center py-12">
          <div className="text-white">Chargement...</div>
        </div>
      </div>
    );
  }

  if (!week) {
    return (
      <div className="min-h-screen bg-dark-900">
        <Navigation />
        <div className="flex items-center justify-center py-12">
          <div className="text-white">Semaine de tryout introuvable</div>
        </div>
      </div>
    );
  }

  const stats = {
    total: availabilities.length,
    responded: availabilities.filter(a => hasResponded(a)).length,
    pending: availabilities.filter(a => !hasResponded(a)).length,
  };

  return (
    <div className="min-h-screen bg-dark-900">
      <Navigation />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
            
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                {isEditingInfo ? (
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm text-gray-400 mb-2 block">Titre de la session</label>
                      <input
                        type="text"
                        value={editedTitle}
                        onChange={(e) => setEditedTitle(e.target.value)}
                        placeholder="Ex: Tryouts Janvier 2025"
                        className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-gray-400 mb-2 block">Description / Notes</label>
                      <textarea
                        value={editedNotes}
                        onChange={(e) => setEditedNotes(e.target.value)}
                        placeholder="Notes ou instructions pour cette session..."
                        rows={3}
                        className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={handleSaveInfo}
                        disabled={savingInfo}
                        className="flex items-center gap-2"
                      >
                        <Save className="w-4 h-4" />
                        {savingInfo ? 'Enregistrement...' : 'Enregistrer'}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={handleCancelEdit}
                        disabled={savingInfo}
                      >
                        <X className="w-4 h-4 mr-2" />
                        Annuler
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-3">
                      <h1 className="flex items-center gap-3 text-3xl font-bold text-white">
                        <Calendar className="w-8 h-8 text-primary-400" />
                        {week.week_label || `Session ${formatDate(week.week_start)} - ${formatDate(week.week_end)}`}
                      </h1>
                      <button
                        onClick={handleStartEdit}
                        className="text-gray-400 hover:text-primary-400 transition-colors p-2 rounded-lg hover:bg-white/5"
                        title="Modifier les informations"
                      >
                        <Edit2 className="w-5 h-5" />
                      </button>
                    </div>
                    <p className="text-gray-400 mt-2">
                      {formatDate(week.week_start)} - {formatDate(week.week_end)} · {week.team_category.toUpperCase()} · Paris Time (UTC+2)
                    </p>
                    {week.notes && (
                      <p className="text-gray-300 mt-2 text-sm bg-gray-800/50 px-4 py-2 rounded-lg">
                        {week.notes}
                      </p>
                    )}
                  </>
                )}
              </div>
              <div className="flex items-center gap-3">{!isEditingInfo && (
                <>
                <Button
                  variant="outline"
                  onClick={handleShowAddPlayersModal}
                  className="flex items-center gap-2 text-green-400 border-green-500/30 hover:bg-green-500/20"
                >
                  <UserPlus className="w-4 h-4" />
                  Ajouter des Joueurs
                </Button>
                <Button
                  variant="outline"
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className="flex items-center gap-2"
                >
                  <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                  {refreshing ? 'Actualisation...' : 'Actualiser'}
                </Button>
                <Button
                  variant="outline"
                  onClick={handleDelete}
                  className="text-red-400 border-red-500/30 hover:bg-red-500/20"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Supprimer la Semaine
                </Button>
                </>
              )}
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="glass-card p-6">
              <div className="flex items-center gap-3 mb-2">
                <CheckCircle className="w-6 h-6 text-green-400" />
                <div className="text-3xl font-bold text-green-400">{stats.responded}</div>
              </div>
              <div className="text-sm text-gray-400">Répondu</div>
            </div>
            <div className="glass-card p-6">
              <div className="flex items-center gap-3 mb-2">
                <Clock className="w-6 h-6 text-yellow-400" />
                <div className="text-3xl font-bold text-yellow-400">{stats.pending}</div>
              </div>
              <div className="text-sm text-gray-400">En Attente</div>
            </div>
            <div className="glass-card p-6">
              <div className="flex items-center gap-3 mb-2">
                <Calendar className="w-6 h-6 text-blue-400" />
                <div className="text-3xl font-bold text-blue-400">{stats.responded}/{stats.total}</div>
              </div>
              <div className="text-sm text-gray-400">Taux de Réponse</div>
            </div>
          </div>

          {/* View Mode Toggle */}
          <div className="glass-card p-4 mb-6">
            <div className="flex items-center gap-3">
              <Button
                variant={viewMode === 'heatmap' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('heatmap')}
                className="flex items-center gap-2"
              >
                <BarChart3 className="w-4 h-4" />
                Vue Heatmap
              </Button>
              <Button
                variant={viewMode === 'individual' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('individual')}
                className="flex items-center gap-2"
              >
                <User className="w-4 h-4" />
                Joueurs Individuels
              </Button>
            </div>
          </div>

          {/* Heatmap View */}
          {viewMode === 'heatmap' && week && (
            <div>
              <AvailabilityHeatmap availabilities={availabilities} weekStart={new Date(week.week_start)} />
            </div>
          )}

          {/* Individual Players View */}
          {viewMode === 'individual' && week && (
            <div className="glass-card p-8">
              <h2 className="text-xl font-semibold text-white mb-6">Disponibilité Individuelle des Joueurs</h2>
              
              <div className="space-y-6">
                {availabilities.map((availability) => {
                  const player = (availability as any).player;
                  const responded = hasResponded(availability);
                  const slotsCount = countAvailableSlots(availability);
                  
                  return (
                    <div key={availability.id} className="glass-card p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-4">
                          <User className="w-5 h-5 text-purple-400" />
                          <div>
                            <div className="flex items-center gap-3">
                              <div className="text-white font-medium">{player?.username || 'Unknown Player'}</div>
                              <span className={`px-2 py-0.5 rounded-full text-xs border ${
                                responded 
                                  ? 'border-green-400 text-green-400' 
                                  : 'border-yellow-400 text-yellow-400'
                              }`}>
                                {responded ? 'Répondu' : 'En Attente'}
                              </span>
                            </div>
                            {responded && (
                              <div className="text-sm text-gray-400 mt-1">
                                {slotsCount} créneau{slotsCount !== 1 ? 'x' : ''} sélectionné{slotsCount !== 1 ? 's' : ''}
                              </div>
                            )}
                            {availability.submitted_at && (
                              <div className="text-xs text-gray-500 mt-1">
                                Soumis le: {formatDateTime(availability.submitted_at)}
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyTokenLink(availability.token)}
                          className="flex items-center gap-2"
                        >
                          {copiedToken === availability.token ? (
                            <>
                              <CheckCircle className="w-4 h-4" />
                              Copié!
                            </>
                          ) : (
                            <>
                              <Copy className="w-4 h-4" />
                              Copier le Lien
                            </>
                          )}
                        </Button>
                      </div>

                      {responded && availability.time_slots && (
                        <div className="mt-4">
                          <AvailabilityCalendar
                            weekStart={new Date(week.week_start)}
                            timeSlots={availability.time_slots}
                            onChange={() => {}} // Read-only
                            readOnly={true}
                          />
                        </div>
                      )}

                      {!responded && (
                        <div className="mt-4 text-center py-8 text-gray-400">
                          Le joueur n'a pas encore soumis ses disponibilités
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </motion.div>
      </main>

      {/* Add Players Modal */}
      {showAddPlayersModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gray-900/95 backdrop-blur-xl rounded-2xl border border-white/10 p-8 max-w-3xl w-full max-h-[85vh] overflow-hidden flex flex-col shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-2xl font-bold text-white mb-1">Ajouter des Joueurs</h3>
                <p className="text-sm text-gray-400">
                  Session: {week?.week_label || 'Sans titre'} • {week?.team_category === 'mens' ? '21L' : week?.team_category === 'gc' ? '21GC' : '21 ACA'}
                </p>
              </div>
              <button
                onClick={handleCloseAddPlayersModal}
                className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-white/5 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {availablePlayers.length === 0 ? (
              <div className="flex-1 flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="w-16 h-16 rounded-full bg-gray-800/50 flex items-center justify-center mx-auto mb-4">
                    <User className="w-8 h-8 text-gray-600" />
                  </div>
                  <p className="text-gray-300 font-medium mb-2">Aucun joueur disponible</p>
                  <p className="text-sm text-gray-500 max-w-sm mx-auto">
                    Tous les joueurs éligibles de cette équipe sont déjà dans cette session de tryout.
                  </p>
                </div>
              </div>
            ) : (
              <>
                {/* Search Bar */}
                <div className="mb-6">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <Input
                      type="text"
                      value={playerSearchTerm}
                      onChange={(e) => setPlayerSearchTerm(e.target.value)}
                      placeholder="Rechercher par nom, rôle ou nationalité..."
                      className="pl-11 bg-gray-800/50 border-gray-700 focus:border-primary-500 text-white placeholder-gray-500"
                    />
                  </div>
                  
                  {/* Results Counter */}
                  {playerSearchTerm && (
                    <div className="mt-2 text-sm text-gray-400">
                      {filteredAvailablePlayers.length} joueur{filteredAvailablePlayers.length !== 1 ? 's' : ''} trouvé{filteredAvailablePlayers.length !== 1 ? 's' : ''}
                    </div>
                  )}
                </div>

                {/* Player List */}
                {filteredAvailablePlayers.length === 0 ? (
                  <div className="flex-1 flex items-center justify-center py-12">
                    <div className="text-center">
                      <div className="w-16 h-16 rounded-full bg-gray-800/50 flex items-center justify-center mx-auto mb-4">
                        <Search className="w-8 h-8 text-gray-600" />
                      </div>
                      <p className="text-gray-300 font-medium mb-2">Aucun résultat</p>
                      <p className="text-sm text-gray-500">
                        Aucun joueur ne correspond à votre recherche
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 -mr-2">
                    <div className="space-y-3 px-1 py-1">
                      {filteredAvailablePlayers.map((player) => {
                        const isSelected = selectedPlayersToAdd.includes(player.id);
                        
                        return (
                          <motion.div
                            key={player.id}
                            whileHover={{ y: -2 }}
                            className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                              isSelected
                                ? 'border-primary-500/70 bg-primary-500/10 shadow-lg shadow-primary-500/20'
                                : 'border-gray-700/50 bg-gray-800/30 hover:border-gray-600 hover:bg-gray-800/50 hover:shadow-md'
                            }`}
                            onClick={() => {
                              setSelectedPlayersToAdd(prev =>
                                prev.includes(player.id)
                                  ? prev.filter(id => id !== player.id)
                                  : [...prev, player.id]
                              );
                            }}
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-2">
                                  <h4 className="font-semibold text-white text-lg truncate">
                                    {player.username}
                                  </h4>
                                  {isSelected && (
                                    <CheckCircle className="w-5 h-5 text-primary-400 flex-shrink-0" />
                                  )}
                                </div>
                                
                                <div className="flex flex-wrap items-center gap-2 text-sm">
                                  <span className="text-gray-400 capitalize">
                                    {player.role || 'Non défini'}
                                  </span>
                                  {player.nationality && (
                                    <>
                                      <span className="text-gray-600">•</span>
                                      <span className="text-gray-400">{player.nationality}</span>
                                    </>
                                  )}
                                </div>
                              </div>
                              
                              <div className="flex-shrink-0">
                                <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium border ${getStatusColor(player.contact_status)}`}>
                                  {getStatusLabel(player.contact_status)}
                                </span>
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Footer Actions */}
                <div className="flex items-center justify-between pt-6 mt-6 border-t border-gray-700/50">
                  <div className="text-sm">
                    <span className="text-gray-400">Sélection: </span>
                    <span className="text-white font-semibold">
                      {selectedPlayersToAdd.length} joueur{selectedPlayersToAdd.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                  
                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      onClick={handleCloseAddPlayersModal}
                      disabled={addingPlayers}
                      className="border-gray-700 hover:bg-gray-800"
                    >
                      Annuler
                    </Button>
                    <Button
                      onClick={handleAddPlayers}
                      disabled={selectedPlayersToAdd.length === 0 || addingPlayers}
                      className="bg-primary-500 hover:bg-primary-600 text-white disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      <UserPlus className="w-4 h-4" />
                      {addingPlayers ? 'Ajout en cours...' : `Ajouter (${selectedPlayersToAdd.length})`}
                    </Button>
                  </div>
                </div>
              </>
            )}
          </motion.div>
        </div>
      )}
    </div>
  );
}
