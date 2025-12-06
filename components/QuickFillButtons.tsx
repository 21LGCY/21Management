'use client'

import { CheckSquare, XSquare, Moon, Calendar, Save } from 'lucide-react'
import { TimeSlots, DayOfWeek, HourSlot } from '@/lib/types/database'
import { DAYS, ORG_HOURS } from '@/lib/utils/timezone'
import { useTranslations } from 'next-intl'

interface QuickFillButtonsProps {
  onFill: (timeSlots: TimeSlots) => void
  onSave?: () => void
  saving?: boolean
}

const WEEKDAYS: DayOfWeek[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']
const WEEKEND: DayOfWeek[] = ['saturday', 'sunday']
const EVENING_HOURS: HourSlot[] = [18, 19, 20, 21, 22, 23] // 6 PM onwards

export default function QuickFillButtons({ onFill, onSave, saving = false }: QuickFillButtonsProps) {
  const t = useTranslations('availability')
  const tCommon = useTranslations('common')
  
  const fillAll = () => {
    const slots: TimeSlots = {}
    DAYS.forEach(day => {
      slots[day] = {}
      ORG_HOURS.forEach(hour => {
        slots[day]![hour] = true
      })
    })
    onFill(slots)
  }

  const clearAll = () => {
    const slots: TimeSlots = {}
    DAYS.forEach(day => {
      slots[day] = {}
      ORG_HOURS.forEach(hour => {
        slots[day]![hour] = false
      })
    })
    onFill(slots)
  }

  const fillEvenings = () => {
    const slots: TimeSlots = {}
    DAYS.forEach(day => {
      slots[day] = {}
      ORG_HOURS.forEach(hour => {
        slots[day]![hour] = EVENING_HOURS.includes(hour)
      })
    })
    onFill(slots)
  }

  const fillWeekends = () => {
    const slots: TimeSlots = {}
    DAYS.forEach(day => {
      slots[day] = {}
      ORG_HOURS.forEach(hour => {
        slots[day]![hour] = WEEKEND.includes(day)
      })
    })
    onFill(slots)
  }

  const fillWeekdays = () => {
    const slots: TimeSlots = {}
    DAYS.forEach(day => {
      slots[day] = {}
      ORG_HOURS.forEach(hour => {
        slots[day]![hour] = WEEKDAYS.includes(day)
      })
    })
    onFill(slots)
  }

  return (
    <div className="flex flex-wrap gap-3 mb-6 items-center justify-between">
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={fillAll}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-500/10 border border-green-500/30 text-green-400 hover:bg-green-500/20 transition"
        >
          <CheckSquare className="w-4 h-4" />
          {t('selectAll')}
        </button>
        
        <button
          type="button"
          onClick={clearAll}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 transition"
        >
          <XSquare className="w-4 h-4" />
          {t('clearAll')}
        </button>

        <button
          type="button"
          onClick={fillEvenings}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-700 text-gray-300 hover:bg-dark-hover transition"
        >
          <Moon className="w-4 h-4" />
          {t('evenings')}
        </button>

        <button
          type="button"
          onClick={fillWeekdays}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-700 text-gray-300 hover:bg-dark-hover transition"
        >
          <Calendar className="w-4 h-4" />
          {t('weekdays')}
        </button>
      </div>

      {onSave && (
        <button
          onClick={onSave}
          disabled={saving}
          className="px-6 py-2 bg-gradient-to-r from-primary via-purple-600 to-primary-dark hover:shadow-lg hover:shadow-primary/50 text-white rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {saving ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              {tCommon('saving')}
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              {t('submitAvailability')}
            </>
          )}
        </button>
      )}
    </div>
  )
}
