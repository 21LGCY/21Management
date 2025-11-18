'use client'

import { useState, useCallback, useEffect } from 'react'
import { Calendar, Clock, Users, Target, Trophy, Dumbbell, BookOpen, Gamepad2, Plus, Edit, Trash2, Save, User, ChevronLeft, ChevronRight } from 'lucide-react'
import { ScheduleActivity, PlayerWeeklyAvailability, TimeSlots, DayOfWeek } from '@/lib/types/database'

// Activity types with colors and icons
const activityTypes = [
  {
    id: 'practice',
    name: 'Practice',
    icon: Dumbbell,
    color: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    hoverColor: 'hover:bg-blue-500/30'
  },
  {
    id: 'individual_training',
    name: 'Individual Training',
    icon: Target,
    color: 'bg-green-500/20 text-green-400 border-green-500/30',
    hoverColor: 'hover:bg-green-500/30'
  },
  {
    id: 'group_training',
    name: 'Group Training',
    icon: Users,
    color: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    hoverColor: 'hover:bg-purple-500/30'
  },
  {
    id: 'official_match',
    name: 'Official Match',
    icon: Trophy,
    color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    hoverColor: 'hover:bg-yellow-500/30'
  },
  {
    id: 'tournament',
    name: 'Tournament',
    icon: Trophy,
    color: 'bg-red-500/20 text-red-400 border-red-500/30',
    hoverColor: 'hover:bg-red-500/30'
  },
  {
    id: 'meeting',
    name: 'Team Meeting',
    icon: BookOpen,
    color: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
    hoverColor: 'hover:bg-indigo-500/30'
  }
]

// Generate time slots from 1:00 PM to 12:00 AM (24 hours) - skipping 12pm-1pm
const generateTimeSlots = () => {
  const slots = []
  
  // 1:00 PM to 11:00 PM
  for (let hour = 1; hour < 12; hour++) {
    slots.push(`${hour}:00 PM`)
  }
  
  // 12:00 AM (midnight)
  slots.push('12:00 AM')
  
  return slots
}

const timeSlots = generateTimeSlots()
const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

// Helper to get Monday of a specific week (offset weeks from current week)
const getMondayOfWeek = (weekOffset: number = 0): Date => {
  const today = new Date()
  const dayOfWeek = today.getDay()
  const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1)
  const monday = new Date(today)
  monday.setDate(diff + (weekOffset * 7))
  monday.setHours(0, 0, 0, 0)
  return monday
}

// Helper to format date as "Mon DD"
const formatDateShort = (date: Date): string => {
  const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' }
  return date.toLocaleDateString('en-US', options)
}

// Helper to get date string in YYYY-MM-DD format
const getDateString = (date: Date): string => {
  return date.toISOString().split('T')[0]
}

// Helper to get all dates for a week starting from Monday
const getWeekDates = (mondayDate: Date): Date[] => {
  const dates: Date[] = []
  for (let i = 0; i < 7; i++) {
    const date = new Date(mondayDate)
    date.setDate(mondayDate.getDate() + i)
    dates.push(date)
  }
  return dates
}

// Helper function to convert day name to number
const getDayNumber = (dayName: string): number => {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  return days.indexOf(dayName)
}

// Helper function to convert day number to name
const getDayName = (dayNumber: number): string => {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  return days[dayNumber]
}

interface ScheduleManagementProps {
  team: any
  user: any
}

export default function ScheduleManagementClient({ team, user }: ScheduleManagementProps) {
  const [activities, setActivities] = useState<ScheduleActivity[]>([])
  const [playerAvailability, setPlayerAvailability] = useState<PlayerWeeklyAvailability[]>([])
  const [selectedActivityType, setSelectedActivityType] = useState<string | null>(null)
  const [isCreatingActivity, setIsCreatingActivity] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [newActivity, setNewActivity] = useState({
    type: '',
    title: '',
    description: '',
    day: '',
    date: '', // New: specific date
    timeSlot: '',
    duration: 1
  })
  const [editingActivity, setEditingActivity] = useState<ScheduleActivity | null>(null)
  
  // Week navigation state (0 = current week, 1 = next week, 2 = week after)
  const [currentWeekOffset, setCurrentWeekOffset] = useState(0)
  const [weekDates, setWeekDates] = useState<Date[]>([])
  const [mondayDate, setMondayDate] = useState<Date>(getMondayOfWeek(0))
  
  // Drag selection state
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState<{day: string, timeSlot: string, date: string} | null>(null)
  const [dragCurrent, setDragCurrent] = useState<{day: string, timeSlot: string, date: string} | null>(null)
  const [selectedSlots, setSelectedSlots] = useState<Set<string>>(new Set())
  const [showBulkActionModal, setShowBulkActionModal] = useState(false)
  const [isDeleteMode, setIsDeleteMode] = useState(false)
  const [activitiesToDelete, setActivitiesToDelete] = useState<Set<string>>(new Set())

  // Update week dates when offset changes
  useEffect(() => {
    const monday = getMondayOfWeek(currentWeekOffset)
    setMondayDate(monday)
    setWeekDates(getWeekDates(monday))
  }, [currentWeekOffset])

  // Load activities from database
  useEffect(() => {
    const fetchActivities = async () => {
      setIsLoading(true)
      try {
        const response = await fetch(`/api/schedule?team_id=${team.id}`)
        if (response.ok) {
          const data = await response.json()
          setActivities(data.activities || [])
        } else {
          console.error('Failed to fetch activities')
        }
      } catch (error) {
        console.error('Error fetching activities:', error)
      } finally {
        setIsLoading(false)
      }
    }

    if (team.id) {
      fetchActivities()
    }
  }, [team.id])

  // Fetch player availability for current week
  useEffect(() => {
    const fetchPlayerAvailability = async () => {
      try {
        // Get current week's Monday
        const today = new Date()
        const dayOfWeek = today.getDay()
        const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1)
        const monday = new Date(today)
        monday.setDate(diff)
        const weekStart = monday.toISOString().split('T')[0]

        const response = await fetch(`/api/player-availability?team_id=${team.id}&week_start=${weekStart}`)
        if (response.ok) {
          const data = await response.json()
          setPlayerAvailability(data.availabilities || [])
        }
      } catch (error) {
        console.error('Error fetching player availability:', error)
      }
    }

    if (team.id) {
      fetchPlayerAvailability()
    }
  }, [team.id])

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
  }, [isDragging])

  // Helper function to create slot key
  const getSlotKey = (day: string, timeSlot: string, date: string) => `${date}-${day}-${timeSlot}`

  // Drag functionality
  const handleMouseDown = (day: string, timeSlot: string, date: string, e: React.MouseEvent) => {
    e.preventDefault()
    
    if (isDeleteMode) {
      // Delete mode: start selecting activities to delete
      const activity = getActivityForSlot(day, timeSlot, date)
      if (!activity) return
      
      setIsDragging(true)
      setDragStart({ day, timeSlot, date })
      setDragCurrent({ day, timeSlot, date })
      setActivitiesToDelete(new Set([activity.id]))
    } else {
      // Creation mode: start selecting empty slots
      if (!selectedActivityType) return
      
      const existingActivity = getActivityForSlot(day, timeSlot, date)
      if (existingActivity) return

      setIsDragging(true)
      setDragStart({ day, timeSlot, date })
      setDragCurrent({ day, timeSlot, date })
      setSelectedSlots(new Set([getSlotKey(day, timeSlot, date)]))
    }
  }

  const handleMouseEnter = (day: string, timeSlot: string, date: string) => {
    if (!isDragging || !dragStart) return

    setDragCurrent({ day, timeSlot, date })
    
    // Calculate selected area
    const dayStartIndex = daysOfWeek.indexOf(dragStart.day)
    const dayEndIndex = daysOfWeek.indexOf(day)
    const timeStartIndex = timeSlots.indexOf(dragStart.timeSlot)
    const timeEndIndex = timeSlots.indexOf(timeSlot)

    const minDay = Math.min(dayStartIndex, dayEndIndex)
    const maxDay = Math.max(dayStartIndex, dayEndIndex)
    const minTime = Math.min(timeStartIndex, timeEndIndex)
    const maxTime = Math.max(timeStartIndex, timeEndIndex)

    if (isDeleteMode) {
      // Delete mode: select activities to delete (only same week)
      const newActivitiesToDelete = new Set<string>()
      
      for (let d = minDay; d <= maxDay; d++) {
        for (let t = minTime; t <= maxTime; t++) {
          const currentDay = daysOfWeek[d]
          const currentTime = timeSlots[t]
          const currentDate = weekDates[d] ? getDateString(weekDates[d]) : date
          const activity = getActivityForSlot(currentDay, currentTime, currentDate)
          
          if (activity) {
            newActivitiesToDelete.add(activity.id)
          }
        }
      }
      
      setActivitiesToDelete(newActivitiesToDelete)
    } else {
      // Creation mode: select empty slots (only same week)
      if (!selectedActivityType) return
      
      const newSelectedSlots = new Set<string>()
      
      for (let d = minDay; d <= maxDay; d++) {
        for (let t = minTime; t <= maxTime; t++) {
          const currentDay = daysOfWeek[d]
          const currentTime = timeSlots[t]
          const currentDate = weekDates[d] ? getDateString(weekDates[d]) : date
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
    if (isDragging) {
      if (isDeleteMode && activitiesToDelete.size > 0) {
        // Show confirmation for bulk delete
        if (window.confirm(`Delete ${activitiesToDelete.size} activity(s)?`)) {
          bulkDeleteActivities()
        } else {
          setActivitiesToDelete(new Set())
        }
      } else if (!isDeleteMode && selectedSlots.size > 0) {
        setShowBulkActionModal(true)
      }
    }
    
    setIsDragging(false)
    setDragStart(null)
    setDragCurrent(null)
  }

  // Quick delete functionality
  const handleQuickDelete = async (activity: ScheduleActivity, e: React.MouseEvent) => {
    e.stopPropagation()
    
    if (window.confirm(`Delete "${activity.title}"?`)) {
      await deleteActivity(activity.id)
    }
  }

  // Bulk delete activities
  const bulkDeleteActivities = async () => {
    setIsLoading(true)
    try {
      const promises = Array.from(activitiesToDelete).map(activityId => 
        fetch(`/api/schedule/${activityId}`, { method: 'DELETE' })
      )

      await Promise.all(promises)
      
      // Remove deleted activities from state
      setActivities(activities.filter(a => !activitiesToDelete.has(a.id)))
      setActivitiesToDelete(new Set())
      setIsDeleteMode(false)
    } catch (error) {
      console.error('Error deleting activities:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Bulk create activities
  const createBulkActivities = async () => {
    if (!selectedActivityType || selectedSlots.size === 0) return
    
    setIsLoading(true)
    const title = newActivity.title || activityTypes.find(t => t.id === selectedActivityType)?.name || 'Activity'
    
    try {
      const promises = Array.from(selectedSlots).map(slotKey => {
        // Parse slot key: date-day-timeSlot
        const parts = slotKey.split('-')
        const date = `${parts[0]}-${parts[1]}-${parts[2]}` // YYYY-MM-DD
        const day = parts[3]
        const timeSlot = parts.slice(4).join('-') // Handle time slots with colons
        
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
            duration: 1, // Each slot is always 1 hour
            activity_date: date // Include the specific date
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
      resetFormState()
    } catch (error) {
      console.error('Error creating bulk activities:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Helper function to reset form state
  const resetFormState = () => {
    setNewActivity({
      type: '',
      title: '',
      description: '',
      day: '',
      date: '',
      timeSlot: '',
      duration: 1
    })
    setIsCreatingActivity(false)
    setShowBulkActionModal(false)
    setSelectedActivityType(null)
    setSelectedSlots(new Set())
    setActivitiesToDelete(new Set())
    setEditingActivity(null)
  }

  const handleTimeSlotClick = (day: string, timeSlot: string, date: string) => {
    // If dragging, do nothing - handled by mouse events
    if (isDragging) return
    
    if (selectedActivityType) {
      setNewActivity({
        type: selectedActivityType,
        title: '',
        description: '',
        day,
        date,
        timeSlot,
        duration: 1
      })
      setIsCreatingActivity(true)
    }
  }

  const handleEditActivity = (activity: ScheduleActivity) => {
    setEditingActivity(activity)
  }

  const saveActivity = async () => {
    if (newActivity.title && newActivity.type) {
      setIsLoading(true)
      try {
        const response = await fetch('/api/schedule', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            team_id: team.id,
            type: newActivity.type,
            title: newActivity.title,
            description: newActivity.description,
            day_of_week: getDayNumber(newActivity.day),
            time_slot: newActivity.timeSlot,
            duration: newActivity.duration,
            activity_date: newActivity.date // Include the specific date
          })
        })

        if (response.ok) {
          const data = await response.json()
          setActivities([...activities, data.activity])
          resetFormState()
        } else {
          console.error('Failed to create activity')
        }
      } catch (error) {
        console.error('Error creating activity:', error)
      } finally {
        setIsLoading(false)
      }
    }
  }

  const updateActivity = async () => {
    if (editingActivity && editingActivity.title && editingActivity.type) {
      setIsLoading(true)
      try {
        const response = await fetch(`/api/schedule/${editingActivity.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            type: editingActivity.type,
            title: editingActivity.title,
            description: editingActivity.description,
            day_of_week: editingActivity.day_of_week,
            time_slot: editingActivity.time_slot,
            duration: editingActivity.duration,
            activity_date: editingActivity.activity_date
          })
        })

        if (response.ok) {
          const data = await response.json()
          setActivities(activities.map(a => 
            a.id === editingActivity.id ? data.activity : a
          ))
          setEditingActivity(null)
        } else {
          console.error('Failed to update activity')
        }
      } catch (error) {
        console.error('Error updating activity:', error)
      } finally {
        setIsLoading(false)
      }
    }
  }

  const deleteActivity = async (id: string) => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/schedule/${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setActivities(activities.filter(a => a.id !== id))
      } else {
        console.error('Failed to delete activity')
      }
    } catch (error) {
      console.error('Error deleting activity:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getActivityForSlot = (day: string, timeSlot: string, date: string) => {
    const dayNumber = getDayNumber(day)
    // Match by specific date, day of week, and time slot
    return activities.find(a => {
      // If activity has a specific date, match by exact date
      if (a.activity_date) {
        return a.activity_date === date && a.time_slot === timeSlot
      }
      // Otherwise, match by day of week (recurring weekly activity)
      return a.day_of_week === dayNumber && a.time_slot === timeSlot
    })
  }

  const getActivityType = (type: string) => {
    return activityTypes.find(t => t.id === type)
  }

  // Count available players for a specific day and time slot
  const getAvailablePlayersCount = (day: string, timeSlot: string): number => {
    if (playerAvailability.length === 0) return 0
    
    // Convert day name to lowercase to match database format (monday, tuesday, etc.)
    const dayKey = day.toLowerCase() as DayOfWeek
    // Extract hour from time slot (e.g., "15:00" -> "15")
    const hour = parseInt(timeSlot.split(':')[0], 10)
    
    let count = 0
    playerAvailability.forEach(availability => {
      const timeSlots = availability.time_slots as TimeSlots
      const daySlots = timeSlots[dayKey]
      if (daySlots && typeof daySlots === 'object') {
        const hourSlot = (daySlots as any)[hour]
        if (hourSlot === true) {
          count++
        }
      }
    })
    
    return count
  }

  return (
    <div className="space-y-6">
      {/* Activity Type Cards */}
      <div className="bg-dark-card border border-gray-800 rounded-lg p-6">
        <h2 className="text-xl font-semibold text-white mb-4">Activity Types</h2>
        <div className="text-gray-400 text-sm mb-4">
          {isDeleteMode ? (
            <p>
              <strong className="text-red-400">Delete Mode:</strong> Click on activities to delete them individually, or 
              <strong> drag across multiple activities</strong> to delete them in bulk.
            </p>
          ) : (
            <p>
              <strong className="text-primary">Edit Mode:</strong> Select an activity type below, then <strong>click</strong> on a time slot for single activities or 
              <strong> drag across multiple slots</strong> to schedule bulk activities.
            </p>
          )}
        </div>
        
        {!isDeleteMode && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {activityTypes.map((type) => {
              const Icon = type.icon
              const isSelected = selectedActivityType === type.id
              return (
                <button
                  key={type.id}
                  onClick={() => setSelectedActivityType(isSelected ? null : type.id)}
                  disabled={isLoading}
                  className={`p-4 rounded-lg border-2 transition-all disabled:opacity-50 ${
                    isSelected 
                      ? `${type.color} border-current` 
                      : `bg-gray-800/50 text-gray-400 border-gray-700 hover:border-gray-600 ${type.hoverColor}`
                  }`}
                >
                  <Icon className="w-6 h-6 mx-auto mb-2" />
                  <p className="text-sm font-medium text-center">{type.name}</p>
                </button>
              )
            })}
          </div>
        )}

        {!isDeleteMode && selectedActivityType && (
          <div className="mt-4 p-3 bg-primary/10 border border-primary/30 rounded-lg">
            <p className="text-primary text-sm">
              ✓ Selected: <strong>{activityTypes.find(t => t.id === selectedActivityType)?.name}</strong>
              <br />
              <span className="text-gray-400">Click on any time slot in the schedule to add this activity</span>
            </p>
          </div>
        )}
      </div>

      {/* Weekly Schedule Grid */}
      <div className="bg-dark-card border border-gray-800 rounded-lg p-6 relative">
        {isLoading && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-10 rounded-lg">
            <div className="bg-dark-card border border-gray-800 rounded-lg p-4 flex items-center gap-3">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
              <span className="text-white">Loading...</span>
            </div>
          </div>
        )}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-semibold text-white">Weekly Schedule</h2>
            
            {/* Week Navigation */}
            <div className="flex items-center gap-2 bg-gray-800 rounded-lg p-1">
              <button
                onClick={() => setCurrentWeekOffset(Math.max(0, currentWeekOffset - 1))}
                disabled={currentWeekOffset === 0}
                className="p-2 hover:bg-gray-700 rounded disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                title="Previous week"
              >
                <ChevronLeft className="w-4 h-4 text-white" />
              </button>
              
              <div className="px-3 py-1 min-w-[200px] text-center">
                <p className="text-sm font-medium text-white">
                  {currentWeekOffset === 0 ? 'Current Week' : 
                   currentWeekOffset === 1 ? 'Next Week' : 
                   `Week ${currentWeekOffset + 1}`}
                </p>
                <p className="text-xs text-gray-400">
                  {formatDateShort(mondayDate)} - {formatDateShort(new Date(mondayDate.getTime() + 6 * 24 * 60 * 60 * 1000))}
                </p>
              </div>
              
              <button
                onClick={() => setCurrentWeekOffset(Math.min(2, currentWeekOffset + 1))}
                disabled={currentWeekOffset >= 2}
                className="p-2 hover:bg-gray-700 rounded disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                title="Next week"
              >
                <ChevronRight className="w-4 h-4 text-white" />
              </button>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <Clock className="w-4 h-4" />
              <span>Time slots: 1:00 PM - 12:00 AM (1-hour slots)</span>
            </div>
            
            {/* Mode Toggle */}
            <button
              onClick={() => {
                setIsDeleteMode(!isDeleteMode)
                setSelectedActivityType(null)
                setSelectedSlots(new Set())
                setActivitiesToDelete(new Set())
              }}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                isDeleteMode
                  ? 'bg-red-500 hover:bg-red-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {isDeleteMode ? '🗑️ Delete Mode' : '✏️ Edit Mode'}
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <div className="min-w-[800px]">
            {/* Header with dates */}
            <div className="grid grid-cols-8 gap-1 mb-2">
              <div className="p-2"></div>
              {daysOfWeek.map((day, index) => {
                const date = weekDates[index]
                return (
                  <div key={day} className="p-2 text-center">
                    <p className="font-medium text-white text-sm">{day}</p>
                    {date && (
                      <p className="text-xs text-gray-400 mt-1">{formatDateShort(date)}</p>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Time slots */}
            <div className="space-y-1">
              {timeSlots.map((timeSlot, timeIndex) => (
                <div key={timeSlot} className="grid grid-cols-8 gap-1">
                  {/* Time label */}
                  <div className="p-3 text-right">
                    <span className="text-xs text-gray-400 font-medium">{timeSlot}</span>
                  </div>
                  
                  {/* Day slots */}
                  {daysOfWeek.map((day, dayIndex) => {
                    const date = weekDates[dayIndex]
                    const dateStr = date ? getDateString(date) : ''
                    const activity = getActivityForSlot(day, timeSlot, dateStr)
                    const activityType = activity ? getActivityType(activity.type) : null
                    const slotKey = getSlotKey(day, timeSlot, dateStr)
                    const isSelected = selectedSlots.has(slotKey)
                    const isMarkedForDeletion = activity && activitiesToDelete.has(activity.id)
                    
                    return (
                      <div
                        key={`${day}-${timeSlot}-${dateStr}`}
                        onMouseDown={(e) => handleMouseDown(day, timeSlot, dateStr, e)}
                        onMouseEnter={() => handleMouseEnter(day, timeSlot, dateStr)}
                        onMouseUp={handleMouseUp}
                        onClick={() => !activity && !isDeleteMode && handleTimeSlotClick(day, timeSlot, dateStr)}
                        className={`p-3 min-h-[80px] border rounded cursor-pointer transition-all group relative ${
                          activity
                            ? isMarkedForDeletion
                              ? 'bg-red-500/30 border-red-500 border-2'
                              : `${activityType?.color || 'bg-gray-600'} border-gray-600`
                            : isSelected
                            ? 'bg-primary/30 border-primary border-2'
                            : selectedActivityType && !isDeleteMode
                            ? 'bg-gray-800/50 hover:bg-gray-700 border-dashed border-primary/50 border-gray-700'
                            : 'bg-gray-800/30 hover:bg-gray-800/50 border-gray-700'
                        }`}
                        style={{
                          userSelect: 'none'
                        }}
                      >
                        {activity && (
                          <div className="h-full relative">
                            {/* Single action button */}
                            <div className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              {isDeleteMode ? (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    if (window.confirm(`Delete "${activity.title}"?`)) {
                                      deleteActivity(activity.id)
                                    }
                                  }}
                                  className="w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center text-xs font-bold z-10"
                                  title="Delete activity"
                                >
                                  ×
                                </button>
                              ) : (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleEditActivity(activity)
                                  }}
                                  className="w-6 h-6 bg-blue-500 hover:bg-blue-600 text-white rounded-full flex items-center justify-center text-xs z-10"
                                  title="Edit activity"
                                >
                                  <Edit className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                            
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">
                                  {activity.title}
                                </p>
                                {activity.description && (
                                  <p className="text-xs opacity-75 truncate mt-1">
                                    {activity.description}
                                  </p>
                                )}
                              </div>
                            </div>
                            
                            {activityType && (
                              <div className="flex items-center gap-1 mt-auto">
                                <activityType.icon className="w-3 h-3" />
                                <span className="text-xs">{activityType.name}</span>
                              </div>
                            )}
                            
                            {activity.duration > 1 && (
                              <div className="absolute top-1 right-1">
                                <span className="text-xs bg-black/30 px-1 rounded">
                                  {activity.duration}h
                                </span>
                              </div>
                            )}
                          </div>
                        )}
                        
                        {!activity && selectedActivityType && (
                          <div className="h-full flex items-center justify-center">
                            <Plus className="w-6 h-6 text-primary/50" />
                          </div>
                        )}

                        {/* Player availability indicator */}
                        {(() => {
                          const availableCount = getAvailablePlayersCount(day, timeSlot)
                          if (availableCount > 0) {
                            return (
                              <div className="absolute bottom-1 left-1 flex items-center gap-1 bg-blue-500/80 text-white px-1.5 py-0.5 rounded text-xs font-medium"
                                   title={`${availableCount} player${availableCount > 1 ? 's' : ''} available`}>
                                <User className="w-3 h-3" />
                                <span>{availableCount}</span>
                              </div>
                            )
                          }
                          return null
                        })()}
                      </div>
                    )
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Create Activity Modal */}
      {isCreatingActivity && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-dark-card border border-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-white mb-4">
              Add Activity - {newActivity.day} at {newActivity.timeSlot}
            </h3>
            {newActivity.date && (
              <p className="text-sm text-gray-400 mb-4">
                Date: {formatDateShort(new Date(newActivity.date))}
              </p>
            )}
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">Activity Type</label>
                <div className="flex items-center gap-3 p-3 bg-gray-800 rounded-lg">
                  {(() => {
                    const type = getActivityType(newActivity.type)
                    if (type) {
                      const Icon = type.icon
                      return (
                        <>
                          <Icon className="w-5 h-5 text-primary" />
                          <span className="text-white">{type.name}</span>
                        </>
                      )
                    }
                    return null
                  })()}
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">Title *</label>
                <input
                  type="text"
                  value={newActivity.title}
                  onChange={(e) => setNewActivity({...newActivity, title: e.target.value})}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-primary focus:outline-none"
                  placeholder="e.g., Aim Training, Scrim vs Team X"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">Description</label>
                <textarea
                  value={newActivity.description}
                  onChange={(e) => setNewActivity({...newActivity, description: e.target.value})}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-primary focus:outline-none resize-none"
                  rows={3}
                  placeholder="Optional description of the activity..."
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">Duration</label>
                <select
                  value={newActivity.duration}
                  onChange={(e) => setNewActivity({...newActivity, duration: parseInt(e.target.value)})}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-primary focus:outline-none"
                >
                  <option value={1}>1 hour</option>
                  <option value={2}>2 hours</option>
                  <option value={3}>3 hours</option>
                  <option value={4}>4 hours</option>
                  <option value={5}>5 hours</option>
                  <option value={6}>6 hours</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={saveActivity}
                disabled={!newActivity.title || isLoading}
                className="flex-1 px-4 py-2 bg-primary hover:bg-primary-dark disabled:bg-gray-700 disabled:text-gray-400 text-white rounded-lg transition flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <Save className="w-4 h-4" />
                )}
                {isLoading ? 'Saving...' : 'Save Activity'}
              </button>
              <button
                onClick={resetFormState}
                disabled={isLoading}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 text-white rounded-lg transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Activity Modal */}
      {editingActivity && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-dark-card border border-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-white mb-4">
              Edit Activity - {getDayName(editingActivity.day_of_week)} at {editingActivity.time_slot}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">Activity Type</label>
                <div className="flex items-center gap-3 p-3 bg-gray-800 rounded-lg">
                  {(() => {
                    const type = getActivityType(editingActivity.type)
                    if (type) {
                      const Icon = type.icon
                      return (
                        <>
                          <Icon className="w-5 h-5 text-primary" />
                          <span className="text-white">{type.name}</span>
                        </>
                      )
                    }
                    return null
                  })()}
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">Title *</label>
                <input
                  type="text"
                  value={editingActivity.title}
                  onChange={(e) => setEditingActivity({...editingActivity, title: e.target.value})}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-primary focus:outline-none"
                  placeholder="e.g., Aim Training, Scrim vs Team X"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">Description</label>
                <textarea
                  value={editingActivity.description || ''}
                  onChange={(e) => setEditingActivity({...editingActivity, description: e.target.value})}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-primary focus:outline-none resize-none"
                  rows={3}
                  placeholder="Optional description of the activity..."
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">Duration</label>
                <select
                  value={editingActivity.duration}
                  onChange={(e) => setEditingActivity({...editingActivity, duration: parseInt(e.target.value)})}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-primary focus:outline-none"
                >
                  <option value={1}>1 hour</option>
                  <option value={2}>2 hours</option>
                  <option value={3}>3 hours</option>
                  <option value={4}>4 hours</option>
                  <option value={5}>5 hours</option>
                  <option value={6}>6 hours</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={updateActivity}
                disabled={!editingActivity.title || isLoading}
                className="flex-1 px-4 py-2 bg-primary hover:bg-primary-dark disabled:bg-gray-700 disabled:text-gray-400 text-white rounded-lg transition flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <Save className="w-4 h-4" />
                )}
                {isLoading ? 'Updating...' : 'Update Activity'}
              </button>
              <button
                onClick={() => setEditingActivity(null)}
                disabled={isLoading}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 text-white rounded-lg transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Action Modal */}
      {showBulkActionModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-dark-card border border-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-white mb-4">
              Create Bulk Activities
            </h3>
            
            <div className="mb-4">
              <p className="text-sm text-gray-400 mb-2">
                Creating activities in <strong>{selectedSlots.size}</strong> time slots
              </p>
              
              <div className="flex items-center gap-3 p-3 bg-gray-800 rounded-lg mb-4">
                {(() => {
                  const type = getActivityType(selectedActivityType || '')
                  if (type) {
                    const Icon = type.icon
                    return (
                      <>
                        <Icon className="w-5 h-5 text-primary" />
                        <span className="text-white">{type.name}</span>
                      </>
                    )
                  }
                  return null
                })()}
              </div>

              {/* Preview of selected slots */}
              <div className="mb-4">
                <label className="block text-sm text-gray-400 mb-2">Selected Time Slots:</label>
                <div className="max-h-32 overflow-y-auto p-3 bg-gray-800 rounded-lg border border-gray-700">
                  <div className="grid grid-cols-1 gap-1 text-sm">
                    {Array.from(selectedSlots)
                      .map(slotKey => {
                        // Parse: date-day-timeSlot
                        const parts = slotKey.split('-')
                        const date = `${parts[0]}-${parts[1]}-${parts[2]}` // YYYY-MM-DD
                        const day = parts[3]
                        const timeSlot = parts.slice(4).join('-')
                        const dateObj = new Date(date)
                        return { day, timeSlot, date: dateObj, key: slotKey }
                      })
                      .sort((a, b) => {
                        const dateCompare = a.date.getTime() - b.date.getTime()
                        if (dateCompare !== 0) return dateCompare
                        const dayCompare = daysOfWeek.indexOf(a.day) - daysOfWeek.indexOf(b.day)
                        if (dayCompare !== 0) return dayCompare
                        return timeSlots.indexOf(a.timeSlot) - timeSlots.indexOf(b.timeSlot)
                      })
                      .map(({ day, timeSlot, date, key }) => (
                        <div key={key} className="flex justify-between items-center p-2 bg-gray-700 rounded">
                          <div className="flex items-center gap-2">
                            <span className="text-white font-medium">{day}</span>
                            <span className="text-xs text-gray-400">({formatDateShort(date)})</span>
                          </div>
                          <span className="text-gray-300">{timeSlot}</span>
                        </div>
                      ))
                    }
                  </div>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">Title *</label>
                <input
                  type="text"
                  value={newActivity.title}
                  onChange={(e) => setNewActivity({...newActivity, title: e.target.value})}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-primary focus:outline-none"
                  placeholder={`e.g., ${activityTypes.find(t => t.id === selectedActivityType)?.name || 'Activity'}`}
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">Description</label>
                <textarea
                  value={newActivity.description}
                  onChange={(e) => setNewActivity({...newActivity, description: e.target.value})}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-primary focus:outline-none resize-none"
                  rows={3}
                  placeholder="Optional description for all activities..."
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={createBulkActivities}
                disabled={isLoading}
                className="flex-1 px-4 py-2 bg-primary hover:bg-primary-dark disabled:bg-gray-700 disabled:text-gray-400 text-white rounded-lg transition flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <Save className="w-4 h-4" />
                )}
                {isLoading ? 'Creating...' : `Create ${selectedSlots.size} Activities`}
              </button>
              <button
                onClick={resetFormState}
                disabled={isLoading}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 text-white rounded-lg transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Schedule Summary */}
      <div className="bg-dark-card border border-gray-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Schedule Summary</h3>
        
        {activities.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activityTypes.map(type => {
              const typeActivities = activities.filter(a => a.type === type.id)
              if (typeActivities.length === 0) return null
              
              const Icon = type.icon
              return (
                <div key={type.id} className={`p-4 rounded-lg border ${type.color}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{type.name}</span>
                  </div>
                  <p className="text-sm opacity-75">{typeActivities.length} scheduled</p>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-8">
            <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-400">No activities scheduled yet</p>
            <p className="text-gray-500 text-sm">Select an activity type and click on time slots to get started</p>
          </div>
        )}
      </div>
    </div>
  )
}