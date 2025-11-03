'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, Calendar as CalendarIcon } from 'lucide-react';
import { TimeSlots, DayOfWeek, HourSlot } from '@/types';

interface AvailabilityCalendarProps {
  weekStart: Date;
  timeSlots: TimeSlots;
  onChange: (timeSlots: TimeSlots) => void;
  readOnly?: boolean;
}

const DAYS: DayOfWeek[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const HOURS: HourSlot[] = [15, 16, 17, 18, 19, 20, 21, 22, 23];

const DAY_LABELS: Record<DayOfWeek, string> = {
  monday: 'Mon',
  tuesday: 'Tue',
  wednesday: 'Wed',
  thursday: 'Thu',
  friday: 'Fri',
  saturday: 'Sat',
  sunday: 'Sun',
};

const formatHourSlot = (hour: number): string => {
  if (hour === 12) return '12 PM';
  if (hour < 12) return `${hour} AM`;
  if (hour === 24 || hour === 0) return '12 AM';
  return `${hour - 12} PM`;
};

const formatTimeRange = (hour: number): string => {
  const start = formatHourSlot(hour);
  const end = hour === 23 ? '12 AM' : formatHourSlot(hour + 1);
  return `${start} - ${end}`;
};

const getDateForDay = (weekStart: Date, dayIndex: number): string => {
  const date = new Date(weekStart);
  date.setDate(date.getDate() + dayIndex);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

export default function AvailabilityCalendar({ weekStart, timeSlots, onChange, readOnly = false }: AvailabilityCalendarProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [dragValue, setDragValue] = useState<boolean | null>(null);

  const toggleSlot = (day: DayOfWeek, hour: number) => {
    if (readOnly) return;

    const newTimeSlots = { ...timeSlots };
    if (!newTimeSlots[day]) {
      newTimeSlots[day] = {};
    }
    
    const currentValue = newTimeSlots[day]![hour];
    newTimeSlots[day]![hour] = !currentValue;
    
    onChange(newTimeSlots);
  };

  const handleMouseDown = (day: DayOfWeek, hour: number) => {
    if (readOnly) return;
    
    const currentValue = timeSlots[day]?.[hour] || false;
    setDragValue(!currentValue);
    setIsDragging(true);
    
    // Toggle the initial cell
    toggleSlot(day, hour);
  };

  const handleMouseEnter = (day: DayOfWeek, hour: number) => {
    if (!isDragging || readOnly || dragValue === null) return;
    
    const newTimeSlots = { ...timeSlots };
    if (!newTimeSlots[day]) {
      newTimeSlots[day] = {};
    }
    newTimeSlots[day]![hour] = dragValue;
    onChange(newTimeSlots);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setDragValue(null);
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mouseup', handleMouseUp);
      return () => window.removeEventListener('mouseup', handleMouseUp);
    }
  }, [isDragging]);

  const isSlotAvailable = (day: DayOfWeek, hour: number): boolean => {
    return timeSlots[day]?.[hour] || false;
  };

  const getSlotClass = (day: DayOfWeek, hour: number): string => {
    const available = isSlotAvailable(day, hour);
    
    if (readOnly) {
      return available
        ? 'bg-green-500/30 border-green-500/50 cursor-default'
        : 'bg-white/5 border-white/10 cursor-default';
    }
    
    return available
      ? 'bg-green-500/20 border-green-500/50 hover:bg-green-500/30 cursor-pointer'
      : 'bg-white/5 border-white/10 hover:bg-white/10 cursor-pointer';
  };

  return (
    <div className="w-full overflow-x-auto custom-scrollbar">
      <div className="min-w-[800px] pr-2">
        {/* Header with Days */}
        <div className="grid grid-cols-8 gap-2 mb-2">
          <div className="text-sm font-medium text-gray-400 flex items-center justify-center">
            Time
          </div>
          {DAYS.map((day, index) => (
            <div key={day} className="text-center">
              <div className="text-sm font-semibold text-white">
                {DAY_LABELS[day]}
              </div>
              <div className="text-xs text-gray-500">
                {getDateForDay(weekStart, index)}
              </div>
            </div>
          ))}
        </div>

        {/* Time Slots Grid */}
        <div className="space-y-2">
          {HOURS.map((hour) => (
            <div key={hour} className="grid grid-cols-8 gap-2">
              {/* Time Label */}
              <div className="flex items-center justify-center text-xs text-gray-400 font-medium">
                {formatTimeRange(hour)}
              </div>

              {/* Day Slots */}
              {DAYS.map((day, dayIndex) => {
                const available = isSlotAvailable(day, hour);
                const isRightmost = dayIndex === DAYS.length - 1;
                
                return (
                  <motion.div
                    key={`${day}-${hour}`}
                    className={`
                      relative h-12 rounded-lg border-2 transition-all select-none
                      ${getSlotClass(day, hour)}
                    `}
                    onMouseDown={() => handleMouseDown(day, hour)}
                    onMouseEnter={() => handleMouseEnter(day, hour)}
                    whileHover={!readOnly && !isRightmost ? { scale: 1.05 } : {}}
                    whileTap={!readOnly ? { scale: 0.95 } : {}}
                  >
                    <div className="absolute inset-0 flex items-center justify-center">
                      {available ? (
                        <CheckCircle className="w-5 h-5 text-green-400" />
                      ) : (
                        <XCircle className="w-4 h-4 text-gray-600 opacity-0 group-hover:opacity-100" />
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-6 mt-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-green-500/20 border-2 border-green-500/50"></div>
            <span className="text-gray-400">Available</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-white/5 border-2 border-white/10"></div>
            <span className="text-gray-400">Not Available</span>
          </div>
          {!readOnly && (
            <div className="flex items-center gap-2 text-gray-500">
              <CalendarIcon className="w-4 h-4" />
              <span>Click to toggle • Drag to select multiple</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
