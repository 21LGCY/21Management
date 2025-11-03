'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Calendar, CheckCircle, Send, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import AvailabilityCalendar from '@/components/AvailabilityCalendar';
import QuickFillButtons from '@/components/QuickFillButtons';
import { TimeSlots } from '@/types';

const getTeamLabel = (teamCategory: string): string => {
  switch (teamCategory) {
    case 'mens': return '21L';
    case 'gc': return '21GC';
    case 'academy': return '21 ACA';
    default: return teamCategory.toUpperCase();
  }
};

function AvailabilityFormContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [availability, setAvailability] = useState<any>(null);
  const [tryoutWeek, setTryoutWeek] = useState<any>(null);
  const [player, setPlayer] = useState<any>(null);
  
  const [timeSlots, setTimeSlots] = useState<TimeSlots>({});

  useEffect(() => {
    if (token) {
      fetchAvailabilityData();
    } else {
      setError('No token provided');
      setLoading(false);
    }
  }, [token]);

  const fetchAvailabilityData = async () => {
    try {
      // Fetch availability by token
      // @ts-ignore
      const { data: availData, error: availError } = await supabase
        .from('player_availabilities')
        .select(`
          *,
          player:players(*),
          tryout_week:tryout_weeks(*)
        `)
        .eq('token', token!)
        .single();

      if (availError) {
        setError('Invalid or expired token');
        setLoading(false);
        return;
      }

      setAvailability(availData);
      setPlayer((availData as any).player);
      setTryoutWeek((availData as any).tryout_week);
      
      // Pre-fill form if already responded
      if ((availData as any).time_slots && Object.keys((availData as any).time_slots).length > 0) {
        setTimeSlots((availData as any).time_slots);
        setSubmitted(true);
      }
    } catch (error) {
      console.error('Error fetching availability:', error);
      setError('Failed to load tryout information');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check if at least one slot is selected
    const hasSlots = Object.values(timeSlots).some(day => 
      Object.values(day || {}).some(available => available === true)
    );

    if (!hasSlots) {
      alert('Please select at least one time slot when you are available');
      return;
    }

    setSubmitting(true);

    try {
      // @ts-ignore - Supabase type inference issue
      const { error: updateError } = await supabase
        .from('player_availabilities')
        // @ts-ignore - Supabase type inference issue
        .update({
          time_slots: timeSlots,
          submitted_at: new Date().toISOString(),
        })
        .eq('token', token!);

      if (updateError) throw updateError;

      setSubmitted(true);
    } catch (error) {
      console.error('Error submitting availability:', error);
      alert('Failed to submit availability');
    } finally {
      setSubmitting(false);
    }
  };

  const formatDateRange = (start: string, end: string) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      timeZone: 'Europe/Paris'
    };
    return `${startDate.toLocaleDateString('en-US', options)} - ${endDate.toLocaleDateString('en-US', options)}`;
  };

  const countAvailableSlots = (slots: TimeSlots): number => {
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#180E2A] via-[#0F0A1A] to-[#180E2A] flex items-center justify-center">
        <div className="text-white text-lg">Loading...</div>
      </div>
    );
  }

  if (error || !availability || !tryoutWeek || !player) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#180E2A] via-[#0F0A1A] to-[#180E2A] flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-8 max-w-md text-center"
        >
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Invalid Link</h1>
          <p className="text-gray-400">{error || 'This tryout link is invalid or has expired.'}</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#180E2A] via-[#0F0A1A] to-[#180E2A] py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-block p-4 rounded-full bg-primary-500/20 mb-4">
              <Calendar className="w-12 h-12 text-primary-400" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">21 Legacy Tryouts</h1>
            <p className="text-gray-400">VALORANT</p>
          </div>

          {/* Tryout Info Card */}
          <div className="glass-card p-8 mb-6">
            <h2 className="text-xl font-semibold text-white mb-4">Tryout Information</h2>
            
            {/* Session Title */}
            {tryoutWeek.week_label && (
              <div className="mb-4 pb-4 border-b border-white/10">
                <div className="text-sm text-gray-400 mb-1">Session:</div>
                <div className="text-2xl font-bold text-white">{tryoutWeek.week_label}</div>
              </div>
            )}
            
            {/* Session Description/Notes */}
            {tryoutWeek.notes && (
              <div className="mb-4 pb-4 border-b border-white/10">
                <div className="text-sm text-gray-400 mb-2">Description / Instructions:</div>
                <div className="text-gray-300 bg-gray-800/50 px-4 py-3 rounded-lg text-sm">
                  {tryoutWeek.notes}
                </div>
              </div>
            )}
            
            <div className="space-y-2 text-gray-300">
              <div>
                <span className="text-gray-400">Player : </span>
                <span className="font-medium text-white">{player.username}</span>
              </div>
              <div>
                <span className="text-gray-400">Role : </span>
                <span className="font-medium text-white">{player.role ? player.role.charAt(0).toUpperCase() + player.role.slice(1) : 'Not specified'}</span>
              </div>
              <div>
                <span className="text-gray-400">Team : </span>
                <span className="font-medium text-white">{getTeamLabel(tryoutWeek.team_category)}</span>
              </div>
              <div className="border-t border-white/10 pt-3 mt-3">
                <div className="text-sm text-gray-400 mb-1">Dates:</div>
                <div className="font-medium">{formatDateRange(tryoutWeek.week_start, tryoutWeek.week_end)}</div>
                <div className="text-xs text-gray-500 mt-1">Paris Time (UTC+2)</div>
              </div>
            </div>
          </div>

          {/* Availability Form */}
          {submitted ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="glass-card p-8 text-center"
            >
              <div className="inline-block p-4 rounded-full bg-green-500/20 mb-4">
                <CheckCircle className="w-12 h-12 text-green-400" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Availability Submitted!</h2>
              <p className="text-gray-400 mb-6">
                Thank you for providing your availability. Our staff will review your schedule and contact you with more details soon.
              </p>
              
              <div className="bg-white/5 rounded-lg p-6 mb-6">
                <div className="text-sm text-gray-400 mb-3">Your Available Slots:</div>
                <div className="text-4xl font-bold text-green-400 mb-2">
                  {countAvailableSlots(timeSlots)}
                </div>
                <div className="text-sm text-gray-400">time slots selected</div>
              </div>

              <p className="text-sm text-gray-500 mb-4">
                You can update your availability below if your schedule changes.
              </p>
              
              <Button
                onClick={() => setSubmitted(false)}
                variant="outline"
              >
                Update Availability
              </Button>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="glass-card p-8">
              <h2 className="text-xl font-semibold text-white mb-2">Select Your Availability</h2>
              <p className="text-gray-400 mb-6">
                Click on the time slots when you're available. You can click and drag to select multiple slots at once.
              </p>
              
              {/* Quick Fill Buttons */}
              <QuickFillButtons onFill={setTimeSlots} />

              {/* Calendar Grid */}
              <AvailabilityCalendar
                weekStart={new Date(tryoutWeek.week_start)}
                timeSlots={timeSlots}
                onChange={setTimeSlots}
              />

              {/* Submit Button */}
              <div className="mt-8">
                <Button
                  type="submit"
                  disabled={submitting}
                  className="w-full flex items-center justify-center gap-2 py-6 text-lg"
                >
                  <Send className="w-5 h-5" />
                  {submitting ? 'Submitting...' : 'Submit Availability'}
                </Button>
                <p className="text-xs text-gray-500 text-center mt-3">
                  Selected: {countAvailableSlots(timeSlots)} time slots
                </p>
              </div>
            </form>
          )}

          {/* Footer */}
          <div className="text-center mt-8 text-sm text-gray-500">
            <p>21 Legacy</p>
            <p className="mt-1">Questions? Contact our staff on Discord</p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default function AvailabilityPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-[#180E2A] via-[#0F0A1A] to-[#180E2A] flex items-center justify-center">
        <div className="text-white text-lg">Loading...</div>
      </div>
    }>
      <AvailabilityFormContent />
    </Suspense>
  );
}
