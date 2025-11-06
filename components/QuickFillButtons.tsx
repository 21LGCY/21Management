'use client'

import { CheckSquare, XSquare, Moon, Calendar } from 'lucide-react'
import { TimeSlots, DayOfWeek, HourSlot } from '@/lib/types/database'

interface QuickFillButtonsProps {
  onFill: (timeSlots: TimeSlots) => void
}

const DAYS: DayOfWeek[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
const HOURS: HourSlot[] = [15, 16, 17, 18, 19, 20, 21, 22, 23]
const WEEKDAYS: DayOfWeek[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']
const WEEKEND: DayOfWeek[] = ['saturday', 'sunday']
const EVENING_HOURS: HourSlot[] = [18, 19, 20, 21, 22, 23] // 6 PM onwards

export default function QuickFillButtons({ onFill }: QuickFillButtonsProps) {
  const fillAll = () => {
    const slots: TimeSlots = {}
    DAYS.forEach(day => {
      slots[day] = {}
      HOURS.forEach(hour => {
        slots[day]![hour] = true
      })
    })
    onFill(slots)
  }

  const clearAll = () => {
    const slots: TimeSlots = {}
    DAYS.forEach(day => {
      slots[day] = {}
      HOURS.forEach(hour => {
        slots[day]![hour] = false
      })
    })
    onFill(slots)
  }

  const fillEvenings = () => {
    const slots: TimeSlots = {}
    DAYS.forEach(day => {
      slots[day] = {}
      HOURS.forEach(hour => {
        slots[day]![hour] = EVENING_HOURS.includes(hour)
      })
    })
    onFill(slots)
  }

  const fillWeekends = () => {
    const slots: TimeSlots = {}
    DAYS.forEach(day => {
      slots[day] = {}
      HOURS.forEach(hour => {
        slots[day]![hour] = WEEKEND.includes(day)
      })
    })
    onFill(slots)
  }

  const fillWeekdays = () => {
    const slots: TimeSlots = {}
    DAYS.forEach(day => {
      slots[day] = {}
      HOURS.forEach(hour => {
        slots[day]![hour] = WEEKDAYS.includes(day)
      })
    })
    onFill(slots)
  }

  return (
    <div className="flex flex-wrap gap-3 mb-6">
      <button
        type="button"
        onClick={fillAll}
        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-500/10 border border-green-500/30 text-green-400 hover:bg-green-500/20 transition"
      >
        <CheckSquare className="w-4 h-4" />
        Select All Available
      </button>
      
      <button
        type="button"
        onClick={clearAll}
        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 transition"
      >
        <XSquare className="w-4 h-4" />
        Clear All
      </button>

      <button
        type="button"
        onClick={fillEvenings}
        className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-700 text-gray-300 hover:bg-dark-hover transition"
      >
        <Moon className="w-4 h-4" />
        Evenings Only (6 PM+)
      </button>

      <button
        type="button"
        onClick={fillWeekends}
        className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-700 text-gray-300 hover:bg-dark-hover transition"
      >
        <Calendar className="w-4 h-4" />
        Weekends Only
      </button>

      <button
        type="button"
        onClick={fillWeekdays}
        className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-700 text-gray-300 hover:bg-dark-hover transition"
      >
        <Calendar className="w-4 h-4" />
        Weekdays Only
      </button>
    </div>
  )
}
