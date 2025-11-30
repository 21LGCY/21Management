// Timezone utility for 21Management
// All activities are stored in ORG_TIMEZONE (Paris/CET)
// Display is converted to user's timezone

import { DayOfWeek, HourSlot } from '@/lib/types/database'

export type TimezoneOffset = 'UTC+0' | 'UTC+1' | 'UTC+2' | 'UTC+3'

// ============================================
// SHARED CONSTANTS
// ============================================

export const TIMEZONE_OPTIONS: { value: TimezoneOffset; label: string; regions: string }[] = [
  { value: 'UTC+0', label: 'UTC+0 (GMT)', regions: 'UK, Ireland, Portugal' },
  { value: 'UTC+1', label: 'UTC+1 (CET)', regions: 'France, Germany, Spain, Italy, Belgium, Netherlands, Poland, etc.' },
  { value: 'UTC+2', label: 'UTC+2 (EET)', regions: 'Finland, Greece, Romania, Bulgaria, Ukraine' },
  { value: 'UTC+3', label: 'UTC+3 (MSK)', regions: 'Russia, Belarus' },
]

// Organization's reference timezone (all activities stored in this timezone)
export const ORG_TIMEZONE: TimezoneOffset = 'UTC+1'

// Default timezone for new users
export const DEFAULT_TIMEZONE: TimezoneOffset = 'UTC+1'

// Days of week (shared across availability components)
export const DAYS: DayOfWeek[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']

// Day labels for display
export const DAY_LABELS: Record<DayOfWeek, string> = {
  monday: 'Mon',
  tuesday: 'Tue',
  wednesday: 'Wed',
  thursday: 'Thu',
  friday: 'Fri',
  saturday: 'Sat',
  sunday: 'Sun',
}

// Base hours in ORG timezone (CET): 15-23 (3PM-11PM)
export const ORG_HOURS: HourSlot[] = [15, 16, 17, 18, 19, 20, 21, 22, 23]

// ============================================
// TIMEZONE OFFSET FUNCTIONS
// ============================================

// Get the hour offset relative to ORG_TIMEZONE (UTC+1)
export function getHourOffset(userTimezone: TimezoneOffset): number {
  const offsets: Record<TimezoneOffset, number> = {
    'UTC+0': -1,  // 1 hour behind Paris
    'UTC+1': 0,   // Same as Paris (org timezone)
    'UTC+2': +1,  // 1 hour ahead of Paris
    'UTC+3': +2,  // 2 hours ahead of Paris
  }
  return offsets[userTimezone] || 0
}

// Convert an hour from org timezone to user timezone
export function convertHourToUserTimezone(hour: number, userTimezone: TimezoneOffset): number {
  const offset = getHourOffset(userTimezone)
  return ((hour + offset) % 24 + 24) % 24
}

// Convert an hour from user timezone to org timezone (for saving)
export function convertHourToOrgTimezone(hour: number, userTimezone: TimezoneOffset): number {
  const offset = getHourOffset(userTimezone)
  return ((hour - offset) % 24 + 24) % 24
}

// ============================================
// FORMATTING FUNCTIONS
// ============================================

// Format hour (0-23) to "X:00 AM/PM" string
export function formatHour(hour: number): string {
  if (hour === 0 || hour === 24) return '12:00 AM'
  if (hour === 12) return '12:00 PM'
  if (hour < 12) return `${hour}:00 AM`
  return `${hour - 12}:00 PM`
}

// Format hour to short label (e.g., "3 PM")
export function formatHourShort(hour: number): string {
  if (hour === 0 || hour === 24) return '12 AM'
  if (hour === 12) return '12 PM'
  if (hour < 12) return `${hour} AM`
  return `${hour - 12} PM`
}

// Format hour range (e.g., "3 PM - 4 PM")
export function formatHourRange(hour: number): string {
  const start = formatHourShort(hour)
  const endHour = (hour + 1) % 24
  const end = formatHourShort(endHour)
  return `${start} - ${end}`
}

// Get short timezone label
export function getTimezoneShort(timezone: TimezoneOffset): string {
  const shorts: Record<TimezoneOffset, string> = {
    'UTC+0': 'GMT',
    'UTC+1': 'CET',
    'UTC+2': 'EET',
    'UTC+3': 'MSK',
  }
  return shorts[timezone] || timezone
}

// ============================================
// TIME SLOT CONVERSION
// ============================================

// Convert a time slot string with timezone conversion
// Input: "3:00 PM" (org timezone), userTimezone: "UTC+0"
// Output: "2:00 PM"
export function convertTimeSlotToUserTimezone(timeSlot: string, userTimezone: TimezoneOffset): string {
  const match = timeSlot.match(/(\d+):00 (AM|PM)/)
  if (!match) return timeSlot
  
  let hour = parseInt(match[1])
  const period = match[2]
  
  // Convert to 24-hour format
  if (period === 'AM' && hour === 12) hour = 0
  else if (period === 'PM' && hour !== 12) hour += 12
  
  // Apply timezone offset and format
  return formatHour(convertHourToUserTimezone(hour, userTimezone))
}

// ============================================
// DATE HELPERS
// ============================================

// Get formatted date for a day in the week
export function getDateForDay(weekStart: string, dayIndex: number): string {
  const [year, month, day] = weekStart.split('-').map(Number)
  const date = new Date(Date.UTC(year, month - 1, day))
  date.setUTCDate(date.getUTCDate() + dayIndex)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })
}
