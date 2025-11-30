'use client'

import { useState, useEffect } from 'react'
import { Calendar, Clock, ChevronLeft, ChevronRight, Users, Target, Trophy, Dumbbell, BookOpen, Edit, Trash2, Plus, Save, Globe } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { TimezoneOffset } from '@/lib/types/database'
import { convertTimeSlotToUserTimezone, getTimezoneShort, ORG_TIMEZONE, getDayNumber, getDayName } from '@/lib/utils/timezone'

// Activity types with colors and icons (matching player schedule)
const activityTypes: { [key: string]: { icon: any; color: string; name: string } } = {
  practice: {
    name: 'Practice',
    icon: Dumbbell,
    color: 'bg-blue-500/30 text-blue-300 border-blue-400/50'
  },
  individual_training: {
    name: 'Individual Training',
    icon: Target,
    color: 'bg-green-500/30 text-green-300 border-green-400/50'
  },
  group_training: {
    name: 'Group Training',
    icon: Users,
    color: 'bg-purple-500/30 text-purple-300 border-purple-400/50'
  },
  official_match: {
    name: 'Official Match',
    icon: Trophy,
    color: 'bg-yellow-500/30 text-yellow-300 border-yellow-400/50'
  },
  tournament: {
    name: 'Tournament',
    icon: Trophy,
    color: 'bg-red-500/30 text-red-300 border-red-400/50'
  },
  meeting: {
    name: 'Team Meeting',
    icon: BookOpen,
    color: 'bg-indigo-500/30 text-indigo-300 border-indigo-400/50'
  }
}

// Generate time slots from 3:00 PM to 11:00 PM (matching player availability)
// These are stored in ORG_TIMEZONE (CET/Paris) - admin creates in CET
const generateTimeSlots = () => {
  const slots = []
  for (let hour = 3; hour < 12; hour++) {
    slots.push(`${hour}:00 PM`)
  }
  return slots
}

// Time slots in ORG_TIMEZONE (CET) - always used for storage
const orgTimeSlots = generateTimeSlots()
const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

interface ScheduleActivity {
  id: string
  team_id: string
  type: string
  title: string
  description?: string | null
  day_of_week: number
  time_slot: string
  duration: number
  activity_date?: string | null
  created_by: string
  created_at: string
  updated_at: string
}

// Helper functions for date calculations
const getMondayOfWeek = (weekOffset: number = 0): Date => {
  const now = new Date()
  
  // Get the date parts in Europe/Paris timezone
  const formatter = new Intl.DateTimeFormat('en-CA', { 
    timeZone: 'Europe/Paris',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
  const parts = formatter.format(now).split('-') // YYYY-MM-DD
  
  // Create date in UTC to avoid timezone shifts
  const parisDate = new Date(Date.UTC(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2])))
  
  const day = parisDate.getUTCDay()
  const diff = day === 0 ? -6 : 1 - day // Calculate days to subtract to get to Monday
  const monday = new Date(parisDate)
  monday.setUTCDate(parisDate.getUTCDate() + diff + (weekOffset * 7))
  
  return monday
}

const formatDateShort = (date: Date): string => {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })
}

const getDateString = (date: Date): string => {
  // Format as YYYY-MM-DD in UTC
  const year = date.getUTCFullYear()
  const month = String(date.getUTCMonth() + 1).padStart(2, '0')
  const day = String(date.getUTCDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const getWeekDates = (weekOffset: number): string[] => {
  const monday = getMondayOfWeek(weekOffset)
  const dates = []
  for (let i = 0; i < 7; i++) {
    const date = new Date(monday)
    date.setUTCDate(monday.getUTCDate() + i)
    dates.push(getDateString(date))
  }
  return dates
}

interface ScheduleManagementProps {
  team: any
  user: any
  userTimezone: TimezoneOffset
}

export default function ScheduleManagementClient({ team, user, userTimezone }: ScheduleManagementProps) {
  const [activities, setActivities] = useState<ScheduleActivity[]>([])
  const [loading, setLoading] = useState(true)
  const [currentWeekOffset, setCurrentWeekOffset] = useState(0)
  const [weekDates, setWeekDates] = useState<string[]>([])
  const [selectedActivity, setSelectedActivity] = useState<ScheduleActivity | null>(null)
  const [showActivityModal, setShowActivityModal] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showBulkModal, setShowBulkModal] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [isDeleteMode, setIsDeleteMode] = useState(false)
  const [selectedActivityType, setSelectedActivityType] = useState<string>('practice')
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState<{day: string, timeSlot: string, date: string} | null>(null)
  const [selectedSlots, setSelectedSlots] = useState<Set<string>>(new Set())
  const [activitiesToDelete, setActivitiesToDelete] = useState<Set<string>>(new Set())
  const [playerAvailabilities, setPlayerAvailabilities] = useState<any[]>([])
  const [totalPlayers, setTotalPlayers] = useState(0)
  const [showAvailabilityDetails, setShowAvailabilityDetails] = useState<{day: string, timeSlot: string} | null>(null)
  const [newActivity, setNewActivity] = useState({
    type: '',
    title: '',
    description: '',
    day: '',
    date: '',
    timeSlot: '',
    duration: 1
  })

  // Convert time slots to user's timezone for display
  const displayTimeSlots = orgTimeSlots.map(slot => ({
    org: slot, // Original CET time (used for matching activities and storage)
    display: convertTimeSlotToUserTimezone(slot, userTimezone) // Converted for display
  }))

  useEffect(() => {
    setWeekDates(getWeekDates(currentWeekOffset))
  }, [currentWeekOffset])

  useEffect(() => {
    fetchActivities()
    fetchTeamPlayers()
  }, [team.id])

  useEffect(() => {
    if (weekDates.length > 0) {
      fetchPlayerAvailabilities()
    }
  }, [weekDates, team.id])

  // Global mouse up listener for drag functionality
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (isDragging) {
        handleMouseUp()
      }
    }

    if (isDragging) {
      document.addEventListener('mouseup', handleGlobalMouseUp)
      return () => document.removeEventListener('mouseup', handleGlobalMouseUp)
    }
  }, [isDragging, selectedSlots, activitiesToDelete])

  const fetchActivities = async () => {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('schedule_activities')
      .select('*')
      .eq('team_id', team.id)
    
    if (error) {
      console.error('Error fetching activities:', error)
    } else if (data) {
      setActivities(data)
    }
    setLoading(false)
  }

  const fetchTeamPlayers = async () => {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('profiles')
      .select('id')
      .eq('team_id', team.id)
      .eq('role', 'player')
    
    if (data) {
      setTotalPlayers(data.length)
    }
  }

  const fetchPlayerAvailabilities = async () => {
    if (weekDates.length === 0) return
    
    const weekStart = weekDates[0]
    const supabase = createClient()
    
    // First, try without the join to see if we get data
    const { data: availData, error: availError } = await supabase
      .from('player_weekly_availability')
      .select('*')
      .eq('team_id', team.id)
      .eq('week_start', weekStart)
    
    if (availError) {
      console.error('Error fetching availabilities:', availError)
      return
    }
    
    if (!availData || availData.length === 0) {
      setPlayerAvailabilities([])
      return
    }
    
    // Now fetch player details separately
    const playerIds = availData.map(a => a.player_id)
    const { data: playerData, error: playerError } = await supabase
      .from('profiles')
      .select('id, username, in_game_name, avatar_url')
      .in('id', playerIds)
    
    // Merge the data
    const mergedData = availData.map(avail => ({
      ...avail,
      player: playerData?.find(p => p.id === avail.player_id)
    }))
    
    setPlayerAvailabilities(mergedData)
  }

  const getAvailablePlayersForSlot = (day: string, timeSlot: string): number => {
    const dayKey = day.toLowerCase() as 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday'
    const timeHour = convertTimeSlotToHour(timeSlot)
    
    if (timeHour === null) return 0
    
    let availableCount = 0
    
    playerAvailabilities.forEach((availability) => {
      const timeSlots = availability.time_slots || {}
      const daySlots = timeSlots[dayKey] || {}
      
      if (daySlots[timeHour] === true) {
        availableCount++
      }
    })
    
    return availableCount
  }

  const getAvailablePlayersDetails = (day: string, timeSlot: string) => {
    const dayKey = day.toLowerCase() as 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday'
    const timeHour = convertTimeSlotToHour(timeSlot)
    
    if (timeHour === null) return []
    
    const available: any[] = []
    
    playerAvailabilities.forEach(availability => {
      const timeSlots = availability.time_slots || {}
      const daySlots = timeSlots[dayKey] || {}
      
      if (daySlots[timeHour] === true && availability.player) {
        available.push(availability.player)
      }
    })
    
    return available
  }

  const convertTimeSlotToHour = (timeSlot: string): number | null => {
    // Convert "1:00 PM" to 13, "12:00 AM" to 0, etc.
    const match = timeSlot.match(/(\d+):00 (AM|PM)/)
    if (!match) return null
    
    let hour = parseInt(match[1])
    const period = match[2]
    
    if (period === 'AM' && hour === 12) hour = 0
    else if (period === 'PM' && hour !== 12) hour += 12
    
    return hour
  }

  const getActivityForSlot = (day: string, timeSlot: string, date: string): ScheduleActivity | undefined => {
    const dayNumber = getDayNumber(day)
    return activities.find(activity => {
      if (activity.activity_date) {
        return activity.activity_date === date && activity.time_slot === timeSlot
      }
      return activity.day_of_week === dayNumber && activity.time_slot === timeSlot
    })
  }

  const getActivityType = (type: string) => {
    return activityTypes[type] || null
  }

  const goToPreviousWeek = () => {
    if (currentWeekOffset > 0) {
      setCurrentWeekOffset(currentWeekOffset - 1)
    }
  }

  const goToNextWeek = () => {
    if (currentWeekOffset < 2) {
      setCurrentWeekOffset(currentWeekOffset + 1)
    }
  }

  const goToCurrentWeek = () => {
    setCurrentWeekOffset(0)
  }

  const getSlotKey = (day: string, timeSlot: string, date: string) => `${date}-${day}-${timeSlot}`

  const handleMouseDown = (day: string, timeSlot: string, date: string, e: React.MouseEvent) => {
    e.preventDefault()
    
    if (!isEditMode) return

    if (isDeleteMode) {
      const activity = getActivityForSlot(day, timeSlot, date)
      if (!activity) return
      
      setIsDragging(true)
      setDragStart({ day, timeSlot, date })
      setActivitiesToDelete(new Set([activity.id]))
    } else {
      const existingActivity = getActivityForSlot(day, timeSlot, date)
      if (existingActivity) return

      setIsDragging(true)
      setDragStart({ day, timeSlot, date })
      setSelectedSlots(new Set([getSlotKey(day, timeSlot, date)]))
    }
  }

  const handleMouseEnter = (day: string, timeSlot: string, date: string) => {
    if (!isDragging || !dragStart || !isEditMode) return

    const dayStartIndex = daysOfWeek.indexOf(dragStart.day)
    const dayEndIndex = daysOfWeek.indexOf(day)
    const timeStartIndex = orgTimeSlots.indexOf(dragStart.timeSlot)
    const timeEndIndex = orgTimeSlots.indexOf(timeSlot)

    const minDay = Math.min(dayStartIndex, dayEndIndex)
    const maxDay = Math.max(dayStartIndex, dayEndIndex)
    const minTime = Math.min(timeStartIndex, timeEndIndex)
    const maxTime = Math.max(timeStartIndex, timeEndIndex)

    if (isDeleteMode) {
      const newActivitiesToDelete = new Set<string>()
      
      for (let d = minDay; d <= maxDay; d++) {
        for (let t = minTime; t <= maxTime; t++) {
          const currentDay = daysOfWeek[d]
          const currentTime = orgTimeSlots[t]
          const currentDate = weekDates[d]
          const activity = getActivityForSlot(currentDay, currentTime, currentDate)
          
          if (activity) {
            newActivitiesToDelete.add(activity.id)
          }
        }
      }
      
      setActivitiesToDelete(newActivitiesToDelete)
    } else {
      const newSelectedSlots = new Set<string>()
      
      for (let d = minDay; d <= maxDay; d++) {
        for (let t = minTime; t <= maxTime; t++) {
          const currentDay = daysOfWeek[d]
          const currentTime = orgTimeSlots[t]
          const currentDate = weekDates[d]
          const activity = getActivityForSlot(currentDay, currentTime, currentDate)
          
          if (!activity) {
            newSelectedSlots.add(getSlotKey(currentDay, currentTime, currentDate))
          }
        }
      }
      
      setSelectedSlots(newSelectedSlots)
    }
  }

  const handleMouseUp = () => {
    if (!isDragging) return

    if (isDeleteMode && activitiesToDelete.size > 0) {
      if (activitiesToDelete.size === 1) {
        const activityId = Array.from(activitiesToDelete)[0]
        const activity = activities.find(a => a.id === activityId)
        if (activity && window.confirm(`Supprimer "${activity.title}" ?`)) {
          bulkDeleteActivities()
        } else {
          setActivitiesToDelete(new Set())
        }
      } else {
        if (window.confirm(`Supprimer ${activitiesToDelete.size} activités ?`)) {
          bulkDeleteActivities()
        } else {
          setActivitiesToDelete(new Set())
        }
      }
    } else if (!isDeleteMode && selectedSlots.size > 0) {
      setShowBulkModal(true)
    }
    
    setIsDragging(false)
    setDragStart(null)
  }

  const bulkDeleteActivities = async () => {
    try {
      const promises = Array.from(activitiesToDelete).map(activityId => 
        fetch(`/api/schedule/${activityId}`, { method: 'DELETE' })
      )

      await Promise.all(promises)
      
      setActivities(activities.filter(a => !activitiesToDelete.has(a.id)))
      setActivitiesToDelete(new Set())
    } catch (error) {
      console.error('Error deleting activities:', error)
    }
  }

  const createBulkActivities = async () => {
    if (!selectedActivityType || selectedSlots.size === 0) return
    
    const title = newActivity.title || activityTypes[selectedActivityType]?.name || 'Activity'
    
    try {
      const promises = Array.from(selectedSlots).map(slotKey => {
        const parts = slotKey.split('-')
        const date = `${parts[0]}-${parts[1]}-${parts[2]}`
        const day = parts[3]
        const timeSlot = parts.slice(4).join('-')
        
        return fetch('/api/schedule', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            team_id: team.id,
            type: selectedActivityType,
            title,
            description: newActivity.description,
            day_of_week: getDayNumber(day),
            time_slot: timeSlot,
            duration: 1,
            activity_date: date
          })
        })
      })

      const responses = await Promise.all(promises)
      const newActivities = []
      
      for (const response of responses) {
        if (response.ok) {
          const data = await response.json()
          newActivities.push(data.activity)
        }
      }
      
      setActivities([...activities, ...newActivities])
      setShowBulkModal(false)
      setSelectedSlots(new Set())
      setNewActivity({ type: '', title: '', description: '', day: '', date: '', timeSlot: '', duration: 1 })
    } catch (error) {
      console.error('Error creating bulk activities:', error)
    }
  }

  const toggleEditMode = () => {
    setIsEditMode(!isEditMode)
    setIsDeleteMode(false)
    setSelectedSlots(new Set())
    setActivitiesToDelete(new Set())
    setIsDragging(false)
    setDragStart(null)
  }

  const toggleDeleteMode = () => {
    setIsDeleteMode(!isDeleteMode)
    if (!isDeleteMode) {
      setIsEditMode(true)
    }
    setSelectedSlots(new Set())
    setActivitiesToDelete(new Set())
    setIsDragging(false)
    setDragStart(null)
  }

  const openActivityDetails = (activity: ScheduleActivity) => {
    setSelectedActivity(activity)
    setShowActivityModal(true)
  }

  const closeActivityModal = () => {
    setShowActivityModal(false)
    setTimeout(() => setSelectedActivity(null), 300)
  }

  const openAddModal = (day: string, timeSlot: string, date: string) => {
    setNewActivity({
      type: 'practice',
      title: '',
      description: '',
      day,
      date,
      timeSlot,
      duration: 1
    })
    setShowAddModal(true)
  }

  const closeAddModal = () => {
    setShowAddModal(false)
    setNewActivity({
      type: '',
      title: '',
      description: '',
      day: '',
      date: '',
      timeSlot: '',
      duration: 1
    })
  }

  const handleAddActivity = async () => {
    if (!newActivity.title || !newActivity.type) return

    const dayNumber = getDayNumber(newActivity.day)
    
    try {
      const response = await fetch('/api/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          team_id: team.id,
          type: newActivity.type,
          title: newActivity.title,
          description: newActivity.description,
          day_of_week: dayNumber,
          time_slot: newActivity.timeSlot,
          duration: newActivity.duration,
          activity_date: newActivity.date
        })
      })

      if (response.ok) {
        const data = await response.json()
        setActivities([...activities, data.activity])
        closeAddModal()
      }
    } catch (error) {
      console.error('Error creating activity:', error)
    }
  }

  const handleUpdateActivity = async () => {
    if (!selectedActivity) return

    try {
      const response = await fetch(`/api/schedule/${selectedActivity.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: selectedActivity.type,
          title: selectedActivity.title,
          description: selectedActivity.description,
          day_of_week: selectedActivity.day_of_week,
          time_slot: selectedActivity.time_slot,
          duration: selectedActivity.duration,
          activity_date: selectedActivity.activity_date
        })
      })

      if (response.ok) {
        const data = await response.json()
        setActivities(activities.map(a => a.id === selectedActivity.id ? data.activity : a))
        closeActivityModal()
      }
    } catch (error) {
      console.error('Error updating activity:', error)
    }
  }

  const handleDeleteActivity = async (id: string) => {
    if (!window.confirm('Delete this activity?')) return

    try {
      const response = await fetch(`/api/schedule/${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setActivities(activities.filter(a => a.id !== id))
        closeActivityModal()
      }
    } catch (error) {
      console.error('Error deleting activity:', error)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-400">Loading schedule...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Edit Mode Controls */}
      {isEditMode && (
        <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl border border-gray-700/50 p-6 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">
              {isDeleteMode ? '🗑️ Delete Mode' : '✏️ Edit Mode'}
            </h3>
            <div className="flex gap-2">
              <button
                onClick={toggleDeleteMode}
                className={`px-4 py-2 rounded-lg transition-all ${
                  isDeleteMode
                    ? 'bg-red-500 hover:bg-red-600 text-white'
                    : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                }`}
              >
                {isDeleteMode ? 'Stop Deleting' : 'Delete'}
              </button>
              <button
                onClick={toggleEditMode}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-all"
              >
                Close Edit Mode
              </button>
            </div>
          </div>

          {!isDeleteMode && (
            <>
              <p className="text-sm text-gray-400 mb-4">
                Select an activity type, then <strong>drag</strong> on the calendar to create multiple activities
              </p>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                {Object.entries(activityTypes).map(([key, { icon: Icon, color, name }]) => (
                  <button
                    key={key}
                    onClick={() => setSelectedActivityType(key)}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      selectedActivityType === key
                        ? `${color} border-current shadow-lg`
                        : 'bg-gray-800/50 text-gray-400 border-gray-700 hover:border-gray-600'
                    }`}
                  >
                    <Icon className="w-5 h-5 mx-auto mb-1" />
                    <p className="text-xs font-medium text-center">{name}</p>
                  </button>
                ))}
              </div>
              {selectedActivityType && (
                <div className="mt-4 p-3 bg-primary/10 border border-primary/30 rounded-lg">
                  <p className="text-primary text-sm">
                    ✓ <strong>{activityTypes[selectedActivityType]?.name}</strong> selected
                    <br />
                    <span className="text-gray-400">Drag on the calendar to select multiple slots</span>
                  </p>
                </div>
              )}
            </>
          )}

          {isDeleteMode && (
            <p className="text-sm text-red-400">
              Click or <strong>drag</strong> on activities to select and delete them
            </p>
          )}
        </div>
      )}

      {/* Edit Mode Toggle Button */}
      {!isEditMode && (
        <div className="flex justify-end">
          <button
            onClick={toggleEditMode}
            className="px-6 py-3 bg-primary hover:bg-primary-dark text-white rounded-lg transition-all shadow-lg hover:shadow-xl flex items-center gap-2"
          >
            <Edit className="w-5 h-5" />
            Enable Edit Mode
          </button>
        </div>
      )}

      {/* Week Navigation */}
      <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-4">
        <div className="flex items-center justify-between">
          <button
            onClick={goToPreviousWeek}
            disabled={currentWeekOffset === 0}
            className={`p-2 rounded-lg transition-all ${
              currentWeekOffset === 0
                ? 'text-gray-600 cursor-not-allowed'
                : 'text-gray-400 hover:bg-white/5 hover:text-white'
            }`}
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-4">
            <div className="text-center">
              <div className="text-sm text-gray-400 mb-1">Current Week</div>
              <div className="text-lg font-semibold text-white">
                {formatDateShort(getMondayOfWeek(currentWeekOffset))} - {formatDateShort(new Date(getMondayOfWeek(currentWeekOffset).getTime() + 6 * 24 * 60 * 60 * 1000))}
              </div>
            </div>
            {currentWeekOffset > 0 && (
              <button
                onClick={goToCurrentWeek}
                className="px-4 py-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-all text-sm font-medium"
              >
                Go to Current Week
              </button>
            )}
            {/* Timezone indicator */}
            <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-800/50 border border-gray-700 rounded-lg">
              <Globe className="w-4 h-4 text-primary" />
              <span className="text-sm text-gray-300">
                {userTimezone !== ORG_TIMEZONE ? (
                  <>Times in <span className="text-primary font-medium">{getTimezoneShort(userTimezone)}</span></>
                ) : (
                  <span className="text-gray-400">CET (Org timezone)</span>
                )}
              </span>
            </div>
          </div>

          <button
            onClick={goToNextWeek}
            disabled={currentWeekOffset === 2}
            className={`p-2 rounded-lg transition-all ${
              currentWeekOffset === 2
                ? 'text-gray-600 cursor-not-allowed'
                : 'text-gray-400 hover:bg-white/5 hover:text-white'
            }`}
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Schedule Grid */}
      <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl border border-gray-700/50 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <div className="inline-block min-w-full">
            {/* Header Row */}
            <div className="grid grid-cols-8 border-b border-gray-700">
              <div className="p-3 bg-gray-800/80 sticky left-0 z-10">
                <div className="flex items-center gap-2 text-gray-300">
                  <Clock className="w-4 h-4" />
                  <span className="text-sm font-semibold">Time</span>
                </div>
              </div>
              {daysOfWeek.map((day, index) => {
                // Parse the date string as UTC to avoid timezone shifts
                const [year, month, dayNum] = weekDates[index].split('-').map(Number)
                const date = new Date(Date.UTC(year, month - 1, dayNum))
                
                return (
                  <div key={day} className="p-3 text-center border-l border-gray-700">
                    <div className="text-sm font-semibold text-white">{day}</div>
                    <div className="text-xs text-gray-300 mt-1">
                      {formatDateShort(date)}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Time Slots */}
            <div>
              {displayTimeSlots.map(({ org: timeSlot, display: displayTime }) => (
                <div key={timeSlot} className="grid grid-cols-8 border-b border-gray-700/50 hover:bg-gray-800/30 transition-colors">
                  <div className="p-3 text-sm font-medium text-gray-300 bg-gray-800/60 sticky left-0 z-10 border-r border-gray-700">
                    {displayTime}
                  </div>
                  {daysOfWeek.map((day, dayIndex) => {
                    const activity = getActivityForSlot(day, timeSlot, weekDates[dayIndex])
                    const activityInfo = activity ? getActivityType(activity.type) : null
                    const slotKey = getSlotKey(day, timeSlot, weekDates[dayIndex])
                    const isSelected = selectedSlots.has(slotKey)
                    const isMarkedForDeletion = activity && activitiesToDelete.has(activity.id)
                    const availablePlayers = getAvailablePlayersForSlot(day, timeSlot)
                    const availabilityPercentage = totalPlayers > 0 ? (availablePlayers / totalPlayers) * 100 : 0

                    return (
                      <div
                        key={`${day}-${timeSlot}`}
                        className="p-2 min-h-[80px] border-l border-gray-700/50 bg-gray-900/20 relative group"
                        onMouseDown={(e) => isEditMode && handleMouseDown(day, timeSlot, weekDates[dayIndex], e)}
                        onMouseEnter={() => isEditMode && handleMouseEnter(day, timeSlot, weekDates[dayIndex])}
                        onMouseLeave={() => setShowAvailabilityDetails(null)}
                        style={{ userSelect: 'none' }}
                      >
                        {/* Player Availability Indicator */}
                        {!isEditMode && totalPlayers > 0 && (
                          <div 
                            className="absolute top-1 right-1 z-20 flex items-center gap-1"
                            onMouseEnter={() => setShowAvailabilityDetails({day, timeSlot})}
                          >
                            <div className={`px-2 py-0.5 rounded text-xs font-semibold flex items-center gap-1 ${
                              availabilityPercentage >= 70 ? 'bg-green-500/30 text-green-300 border border-green-400/50' :
                              availabilityPercentage >= 40 ? 'bg-yellow-500/30 text-yellow-300 border border-yellow-400/50' :
                              availabilityPercentage > 0 ? 'bg-orange-500/30 text-orange-300 border border-orange-400/50' :
                              'bg-gray-700/50 text-gray-400 border border-gray-600/50'
                            }`}>
                              <Users className="w-3 h-3" />
                              <span>{availablePlayers}/{totalPlayers}</span>
                            </div>
                          </div>
                        )}

                        {/* Availability Details Tooltip */}
                        {showAvailabilityDetails?.day === day && showAvailabilityDetails?.timeSlot === timeSlot && (
                          <div className="absolute top-8 right-1 z-30 bg-gray-800 border border-gray-600 rounded-lg shadow-2xl p-3 min-w-[200px] max-w-[280px]">
                            <div className="text-xs font-semibold text-white mb-2 flex items-center gap-2">
                              <Users className="w-4 h-4" />
                              Joueurs disponibles ({availablePlayers}/{totalPlayers})
                            </div>
                            {availablePlayers > 0 ? (
                              <div className="space-y-1 max-h-48 overflow-y-auto">
                                {getAvailablePlayersDetails(day, timeSlot).map((player: any) => (
                                  <div key={player.id} className="flex items-center gap-2 p-1.5 bg-gray-700/50 rounded text-xs text-gray-300">
                                    {player.avatar_url ? (
                                      <img 
                                        src={player.avatar_url} 
                                        alt={player.username}
                                        className="w-5 h-5 rounded-full"
                                      />
                                    ) : (
                                      <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center">
                                        <span className="text-[8px] text-primary font-semibold">
                                          {player.username.substring(0, 2).toUpperCase()}
                                        </span>
                                      </div>
                                    )}
                                    <span className="truncate">{player.in_game_name || player.username}</span>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-xs text-gray-400">Aucun joueur disponible</p>
                            )}
                          </div>
                        )}

                        {activity && activityInfo && (
                          <div
                            onClick={() => !isEditMode && openActivityDetails(activity)}
                            className={`p-3 rounded-lg border-2 h-full flex flex-col justify-between ${
                              isMarkedForDeletion
                                ? 'bg-red-500/30 border-red-500 shadow-xl'
                                : activityInfo.color
                            } shadow-lg hover:shadow-2xl transition-all ${
                              !isEditMode ? 'cursor-pointer hover:scale-105 hover:border-opacity-70' : ''
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-center gap-2 min-w-0">
                                <activityInfo.icon className="w-5 h-5 flex-shrink-0" />
                                <span className="text-sm font-semibold truncate">
                                  {activity.title}
                                </span>
                              </div>
                            </div>
                            {activity.description && (
                              <div className="mt-2 space-y-1">
                                <div className="text-xs opacity-85 line-clamp-2">
                                  {activity.description}
                                </div>
                                {activity.duration > 1 && (
                                  <div className="text-xs font-medium opacity-75">
                                    {activity.duration}h
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                        {!activity && !isEditMode && (
                          <button
                            onClick={() => openAddModal(day, timeSlot, weekDates[dayIndex])}
                            className="w-full h-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-lg hover:bg-gray-800/50"
                          >
                            <Plus className="w-6 h-6 text-gray-500" />
                          </button>
                        )}
                        {!activity && isEditMode && !isDeleteMode && (
                          <div className={`w-full h-full flex items-center justify-center rounded-lg border-2 border-dashed transition-all ${
                            isSelected
                              ? 'bg-primary/30 border-primary'
                              : 'border-gray-700 hover:border-primary/50 hover:bg-gray-800/50'
                          }`}>
                            {isSelected && <Plus className="w-6 h-6 text-primary" />}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl border border-gray-700/50 p-6 shadow-lg">
        <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          Activity Types
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {Object.entries(activityTypes).map(([key, { icon: Icon, color, name }]) => (
            <div key={key} className={`p-3 rounded-lg border-2 ${color} flex items-center gap-2 shadow-md`}>
              <Icon className="w-5 h-5" />
              <span className="text-sm font-semibold">{name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Activity Details Modal */}
      {showActivityModal && selectedActivity && (
        <div 
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={closeActivityModal}
        >
          <div 
            className="bg-dark-card border border-gray-700 rounded-xl max-w-lg w-full shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {(() => {
              const activityInfo = getActivityType(selectedActivity.type)
              if (!activityInfo) return null
              const Icon = activityInfo.icon
              const iconColor = activityInfo.color.includes('text-blue') ? 'text-blue-400' : 
                               activityInfo.color.includes('text-green') ? 'text-green-400' : 
                               activityInfo.color.includes('text-purple') ? 'text-purple-400' : 
                               activityInfo.color.includes('text-yellow') ? 'text-yellow-400' : 
                               activityInfo.color.includes('text-red') ? 'text-red-400' : 'text-indigo-400'
              const bgColor = activityInfo.color.includes('text-blue') ? 'bg-blue-500/20' : 
                             activityInfo.color.includes('text-green') ? 'bg-green-500/20' : 
                             activityInfo.color.includes('text-purple') ? 'bg-purple-500/20' : 
                             activityInfo.color.includes('text-yellow') ? 'bg-yellow-500/20' : 
                             activityInfo.color.includes('text-red') ? 'bg-red-500/20' : 'bg-indigo-500/20'
              
              return (
                <>
                  {/* Modal Header */}
                  <div className="p-6 border-b border-gray-800">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4 flex-1">
                        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${bgColor}`}>
                          <Icon className={`w-6 h-6 ${iconColor}`} />
                        </div>
                        <div className="flex-1">
                          <input
                            type="text"
                            value={selectedActivity.title}
                            onChange={(e) => setSelectedActivity({...selectedActivity, title: e.target.value})}
                            className="text-xl font-semibold text-white mb-2 bg-transparent border-b border-gray-700 focus:border-primary outline-none w-full"
                          />
                          <span className="inline-block px-3 py-1 bg-gray-800 text-gray-300 rounded text-sm">
                            {activityInfo.name}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={closeActivityModal}
                        className="text-gray-400 hover:text-white transition-colors ml-4"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* Modal Body */}
                  <div className="p-6 space-y-4">
                    <div className="flex items-center gap-4 text-sm text-gray-400">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        <span>
                          {selectedActivity.activity_date 
                            ? formatDateShort(new Date(selectedActivity.activity_date))
                            : getDayName(selectedActivity.day_of_week)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        <span>{selectedActivity.time_slot}</span>
                        {selectedActivity.duration > 1 && (
                          <span>({selectedActivity.duration}h)</span>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="text-sm text-gray-400 mb-2 block">Description</label>
                      <textarea
                        value={selectedActivity.description || ''}
                        onChange={(e) => setSelectedActivity({...selectedActivity, description: e.target.value})}
                        className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-white resize-none focus:border-primary outline-none"
                        rows={3}
                        placeholder="Add a description..."
                      />
                    </div>

                    <div>
                      <label className="text-sm text-gray-400 mb-2 block">Duration</label>
                      <select
                        value={selectedActivity.duration}
                        onChange={(e) => setSelectedActivity({...selectedActivity, duration: parseInt(e.target.value)})}
                        className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-primary outline-none"
                      >
                        {[1, 2, 3, 4, 5, 6].map(h => (
                          <option key={h} value={h}>{h} hour{h > 1 ? 's' : ''}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Modal Footer */}
                  <div className="p-6 border-t border-gray-800 flex gap-3">
                    <button
                      onClick={handleUpdateActivity}
                      className="flex-1 px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg transition flex items-center justify-center gap-2"
                    >
                      <Save className="w-4 h-4" />
                      Save Changes
                    </button>
                    <button
                      onClick={() => handleDeleteActivity(selectedActivity.id)}
                      className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition flex items-center gap-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </button>
                  </div>
                </>
              )
            })()}
          </div>
        </div>
      )}

      {/* Add Activity Modal */}
      {showAddModal && (
        <div 
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={closeAddModal}
        >
          <div 
            className="bg-dark-card border border-gray-700 rounded-xl max-w-lg w-full shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-gray-800">
              <h2 className="text-xl font-semibold text-white">Add Activity</h2>
              <p className="text-sm text-gray-400 mt-1">
                {newActivity.day} at {newActivity.timeSlot}
              </p>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="text-sm text-gray-400 mb-2 block">Activity Type</label>
                <select
                  value={newActivity.type}
                  onChange={(e) => setNewActivity({...newActivity, type: e.target.value})}
                  className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-primary outline-none"
                >
                  {Object.entries(activityTypes).map(([key, { name }]) => (
                    <option key={key} value={key}>{name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm text-gray-400 mb-2 block">Title</label>
                <input
                  type="text"
                  value={newActivity.title}
                  onChange={(e) => setNewActivity({...newActivity, title: e.target.value})}
                  className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-primary outline-none"
                  placeholder="e.g., Team Practice, Scrimmage"
                />
              </div>

              <div>
                <label className="text-sm text-gray-400 mb-2 block">Description</label>
                <textarea
                  value={newActivity.description}
                  onChange={(e) => setNewActivity({...newActivity, description: e.target.value})}
                  className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-white resize-none focus:border-primary outline-none"
                  rows={3}
                  placeholder="Add details about this activity..."
                />
              </div>

              <div>
                <label className="text-sm text-gray-400 mb-2 block">Duration</label>
                <select
                  value={newActivity.duration}
                  onChange={(e) => setNewActivity({...newActivity, duration: parseInt(e.target.value)})}
                  className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-primary outline-none"
                >
                  {[1, 2, 3, 4, 5, 6].map(h => (
                    <option key={h} value={h}>{h} hour{h > 1 ? 's' : ''}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="p-6 border-t border-gray-800 flex gap-3">
              <button
                onClick={handleAddActivity}
                disabled={!newActivity.title}
                className="flex-1 px-4 py-2 bg-primary hover:bg-primary-dark disabled:bg-gray-700 disabled:text-gray-400 text-white rounded-lg transition flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Activity
              </button>
              <button
                onClick={closeAddModal}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Create Modal */}
      {showBulkModal && (
        <div 
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setShowBulkModal(false)}
        >
          <div 
            className="bg-dark-card border border-gray-700 rounded-xl max-w-lg w-full shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-gray-800">
              <h2 className="text-xl font-semibold text-white">Créer plusieurs activités</h2>
              <p className="text-sm text-gray-400 mt-1">
                {selectedSlots.size} créneau{selectedSlots.size > 1 ? 'x' : ''} sélectionné{selectedSlots.size > 1 ? 's' : ''}
              </p>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="text-sm text-gray-400 mb-2 block">Type d'activité</label>
                <div className="flex items-center gap-3 p-3 bg-gray-800 rounded-lg border border-gray-700">
                  {(() => {
                    const Icon = activityTypes[selectedActivityType]?.icon
                    const name = activityTypes[selectedActivityType]?.name
                    return Icon && name ? (
                      <>
                        <Icon className="w-5 h-5 text-primary" />
                        <span className="text-white">{name}</span>
                      </>
                    ) : null
                  })()}
                </div>
              </div>

              <div>
                <label className="text-sm text-gray-400 mb-2 block">Titre</label>
                <input
                  type="text"
                  value={newActivity.title}
                  onChange={(e) => setNewActivity({...newActivity, title: e.target.value})}
                  className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-primary outline-none"
                  placeholder={`e.g., ${activityTypes[selectedActivityType]?.name || 'Activité'}`}
                />
              </div>

              <div>
                <label className="text-sm text-gray-400 mb-2 block">Description (optionnel)</label>
                <textarea
                  value={newActivity.description}
                  onChange={(e) => setNewActivity({...newActivity, description: e.target.value})}
                  className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-white resize-none focus:border-primary outline-none"
                  rows={3}
                  placeholder="Description commune pour toutes les activités..."
                />
              </div>
            </div>

            <div className="p-6 border-t border-gray-800 flex gap-3">
              <button
                onClick={createBulkActivities}
                className="flex-1 px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg transition flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" />
                Créer {selectedSlots.size} activité{selectedSlots.size > 1 ? 's' : ''}
              </button>
              <button
                onClick={() => {
                  setShowBulkModal(false)
                  setSelectedSlots(new Set())
                }}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
