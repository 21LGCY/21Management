'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Plus, Users, Clock, CheckCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { TryoutWeek, PlayerAvailability, TeamCategory, Player } from '@/types';
import { Button } from '@/components/ui/button';
import Navigation from '@/components/Navigation';
import Link from 'next/link';

export default function TryoutsPage() {
  const [tryoutWeeks, setTryoutWeeks] = useState<(TryoutWeek & { availabilities?: PlayerAvailability[] })[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTeam, setSelectedTeam] = useState<TeamCategory>('mens');

  useEffect(() => {
    fetchTryoutWeeks();
  }, [selectedTeam]);

  const fetchTryoutWeeks = async () => {
    try {
      // Fetch tryout weeks for selected team
      // @ts-ignore - Supabase type inference issue
      const { data: weeks, error: weeksError } = await supabase
        .from('tryout_weeks')
        .select('*')
        .eq('team_category', selectedTeam)
        .order('week_start', { ascending: false });

      if (weeksError) throw weeksError;

      // Fetch all availabilities for these weeks
      if (weeks && weeks.length > 0) {
        const weekIds = weeks.map((w: any) => w.id);
        // @ts-ignore - Supabase type inference issue
        const { data: availabilities, error: availError } = await supabase
          .from('player_availabilities')
          .select(`
            *,
            player:players(*)
          `)
          .in('tryout_week_id', weekIds);

        if (availError) throw availError;

        // Combine data
        const weeksWithAvailabilities = weeks.map((week: any) => ({
          ...week,
          week_start: new Date(week.week_start),
          week_end: new Date(week.week_end),
          created_at: new Date(week.created_at),
          updated_at: new Date(week.updated_at),
          availabilities: (availabilities || [])
            .filter((a: any) => a.tryout_week_id === week.id)
            .map((a: any) => ({
              ...a,
              created_at: new Date(a.created_at),
              updated_at: new Date(a.updated_at),
              submitted_at: a.submitted_at ? new Date(a.submitted_at) : null,
            })),
        }));

        setTryoutWeeks(weeksWithAvailabilities);
      } else {
        setTryoutWeeks([]);
      }
    } catch (error) {
      console.error('Error fetching tryout weeks:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTeamLabel = (team: TeamCategory) => {
    switch (team) {
      case 'mens': return '21L';
      case 'gc': return '21GC';
      case 'academy': return '21 ACA';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      case 'in_progress': return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
      case 'completed': return 'bg-green-500/20 text-green-300 border-green-500/30';
      case 'cancelled': return 'bg-red-500/20 text-red-300 border-red-500/30';
      default: return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
    }
  };

  const hasResponded = (availability: PlayerAvailability): boolean => {
    const slots = availability.time_slots || {};
    return Object.keys(slots).length > 0 && 
           Object.values(slots).some(day => Object.values(day || {}).length > 0);
  };

  const getAvailabilityStats = (availabilities: PlayerAvailability[] = []) => {
    const total = availabilities.length;
    const responded = availabilities.filter(a => hasResponded(a)).length;
    const pending = total - responded;

    return { total, responded, pending };
  };

  const formatDateRange = (start: Date, end: Date) => {
    const options: Intl.DateTimeFormatOptions = { 
      month: 'short', 
      day: 'numeric',
      timeZone: 'Europe/Paris'
    };
    return `${start.toLocaleDateString('fr-FR', options)} - ${end.toLocaleDateString('fr-FR', options)}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-900">
        <Navigation />
        <div className="flex items-center justify-center py-12">
          <div className="text-white">Chargement des tryouts...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-900">
      <Navigation />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="flex items-center gap-3 text-3xl font-bold text-white mb-2">
                <Calendar className="w-8 h-8 text-primary-400" />
                Gestion Tryouts
              </h1>
              <p className="text-gray-400">Gérez les sessions de tryout et suivez la disponibilité des joueurs</p>
            </div>
            <Link href="/tryouts/new">
              <Button className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Créer une session
              </Button>
            </Link>
          </div>

          {/* Team Selector */}
          <div className="flex gap-3">
            {(['mens', 'gc', 'academy'] as TeamCategory[]).map((team) => (
              <button
                key={team}
                onClick={() => setSelectedTeam(team)}
                className={`px-6 py-3 rounded-lg font-medium transition-all ${
                  selectedTeam === team
                    ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/50'
                    : 'glass-card text-gray-300 hover:bg-white/10'
                }`}
              >
                {getTeamLabel(team)}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Tryout Weeks Grid */}
        {tryoutWeeks.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="glass-card p-12 text-center"
          >
            <Calendar className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">Aucune session</h3>
            <p className="text-gray-400 mb-6">Créez une session de tryouts pour {getTeamLabel(selectedTeam)}</p>
            <Link href="/tryouts/new">
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Créer
              </Button>
            </Link>
          </motion.div>
        ) : (
          <div className="grid gap-6">
            {tryoutWeeks.map((week, index) => {
              const stats = getAvailabilityStats(week.availabilities);
              
              return (
                <motion.div
                  key={week.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="glass-card p-6 hover:bg-white/10 transition-all cursor-pointer"
                  onClick={() => window.location.href = `/tryouts/${week.id}`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-bold text-white">
                          {week.week_label || `Session ${formatDateRange(week.week_start, week.week_end)}`}
                        </h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(week.status)}`}>
                          {week.status.replace('_', ' ').toUpperCase()}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-400 text-sm">
                        <Clock className="w-4 h-4" />
                        {formatDateRange(week.week_start, week.week_end)}
                      </div>
                      {week.notes && (
                        <p className="text-gray-400 text-sm mt-2">{week.notes}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      <Users className="w-4 h-4" />
                      {stats.total} joueurs
                    </div>
                  </div>

                  {/* Availability Stats */}
                  <div className="grid grid-cols-3 gap-4 pt-4 border-t border-white/10">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-green-400" />
                      <div>
                        <div className="text-2xl font-bold text-green-400">{stats.responded}</div>
                        <div className="text-xs text-gray-400">Répondu</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-5 h-5 text-yellow-400" />
                      <div>
                        <div className="text-2xl font-bold text-yellow-400">{stats.pending}</div>
                        <div className="text-xs text-gray-400">En Attente</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="w-5 h-5 text-blue-400" />
                      <div>
                        <div className="text-2xl font-bold text-blue-400">{stats.responded}/{stats.total}</div>
                        <div className="text-xs text-gray-400">Taux de Réponse</div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
