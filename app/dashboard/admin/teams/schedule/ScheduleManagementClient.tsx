'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Team, ScheduleActivity } from '@/lib/types/database'
import { Calendar, Clock, Users, Target, Trophy, Dumbbell, BookOpen, Plus, Edit, Trash2, Info } from 'lucide-react'

// Activity types with colors and icons
const defaultActivityTypes = [
  {
    id: 'practice',
    name: 'Practice',
    icon: Dumbbell,
    color: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  },
  {
    id: 'individual_training',
    name: 'Individual Training',
    icon: Target,
    color: 'bg-green-500/20 text-green-400 border-green-500/30',
  },
  {
    id: 'group_training',
    name: 'Group Training',
    icon: Users,
    color: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  },
  {
    id: 'official_match',
    name: 'Official Match',
    icon: Trophy,
    color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  },
  {
    id: 'tournament',
    name: 'Tournament',
    icon: Trophy,
    color: 'bg-red-500/20 text-red-400 border-red-500/30',
  },
  {
    id: 'meeting',
    name: 'Team Meeting',
    icon: BookOpen,
    color: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
  }
]

// Generate time slots from 1:00 PM to 12:00 AM
const generateTimeSlots = () => {
  const slots = []
  for (let hour = 1; hour < 12; hour++) {
    slots.push(`${hour}:00 PM`)
  }
  slots.push('12:00 AM')
  return slots
}

const timeSlots = generateTimeSlots()
const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

interface ScheduleManagementClientProps {
  teams: Team[]
}

export default function ScheduleManagementClient({ teams }: ScheduleManagementClientProps) {
  const [selectedTeamId, setSelectedTeamId] = useState<string>('')
  const [activities, setActivities] = useState<ScheduleActivity[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedActivityType, setSelectedActivityType] = useState<string | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [editingActivity, setEditingActivity] = useState<ScheduleActivity | null>(null)
  const [activityForm, setActivityForm] = useState({
    type: '',
    title: '',
    description: '',
    day: '',
    timeSlot: '',
    duration: 1
  })

  const supabase = createClient()

  useEffect(() => {
    if (selectedTeamId) {
      fetchActivities()
    }
  }, [selectedTeamId])

  const fetchActivities = async () => {
    if (!selectedTeamId) return
    
    setLoading(true)
    try {
      const response = await fetch(`/api/schedule?team_id=${selectedTeamId}`)
      if (response.ok) {
        const data = await response.json()
        setActivities(data.activities || [])
      }
    } catch (error) {
      console.error('Error fetching activities:', error)
    } finally {
      setLoading(false)
    }
  }

  const getActivityForSlot = (day: string, timeSlot: string) => {
    const dayNumber = daysOfWeek.indexOf(day)
    return activities.find(
      activity => activity.day_of_week === dayNumber && activity.time_slot === timeSlot
    )
  }

  const getActivityType = (typeId: string) => {
    return defaultActivityTypes.find(t => t.id === typeId) || defaultActivityTypes[0]
  }

  const handleCreateActivity = () => {
    if (!activityForm.type || !activityForm.title || !activityForm.day || !activityForm.timeSlot) {
      alert('Please fill in all required fields')
      return
    }

    const dayNumber = daysOfWeek.indexOf(activityForm.day)
    
    const activity = {
      team_id: selectedTeamId,
      type: activityForm.type,
      title: activityForm.title,
      description: activityForm.description || undefined,
      day_of_week: dayNumber,
      time_slot: activityForm.timeSlot,
      duration: activityForm.duration
    }

    createActivity(activity)
  }

  const createActivity = async (activityData: any) => {
    try {
      const response = await fetch('/api/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(activityData)
      })

      if (response.ok) {
        await fetchActivities()
        resetForm()
      } else {
        alert('Failed to create activity')
      }
    } catch (error) {
      console.error('Error creating activity:', error)
      alert('An error occurred')
    }
  }

  const handleUpdateActivity = async () => {
    if (!editingActivity) return

    try {
      const dayNumber = daysOfWeek.indexOf(activityForm.day)
      
      const response = await fetch(`/api/schedule/${editingActivity.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: activityForm.type,
          title: activityForm.title,
          description: activityForm.description,
          day_of_week: dayNumber,
          time_slot: activityForm.timeSlot,
          duration: activityForm.duration
        })
      })

      if (response.ok) {
        await fetchActivities()
        resetForm()
      } else {
        alert('Failed to update activity')
      }
    } catch (error) {
      console.error('Error updating activity:', error)
      alert('An error occurred')
    }
  }

  const handleDeleteActivity = async (activityId: string) => {
    if (!confirm('Are you sure you want to delete this activity?')) return

    try {
      const response = await fetch(`/api/schedule/${activityId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        await fetchActivities()
      } else {
        alert('Failed to delete activity')
      }
    } catch (error) {
      console.error('Error deleting activity:', error)
      alert('An error occurred')
    }
  }

  const startEditActivity = (activity: ScheduleActivity) => {
    setEditingActivity(activity)
    setActivityForm({
      type: activity.type,
      title: activity.title,
      description: activity.description || '',
      day: daysOfWeek[activity.day_of_week],
      timeSlot: activity.time_slot,
      duration: activity.duration
    })
    setIsCreating(true)
  }

  const resetForm = () => {
    setActivityForm({
      type: '',
      title: '',
      description: '',
      day: '',
      timeSlot: '',
      duration: 1
    })
    setIsCreating(false)
    setEditingActivity(null)
    setSelectedActivityType(null)
  }

  // ----- Drag / Bulk selection states (match manager behavior) -----
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState<{ day: string; timeSlot: string } | null>(null)
  const [dragCurrent, setDragCurrent] = useState<{ day: string; timeSlot: string } | null>(null)
  const [selectedSlots, setSelectedSlots] = useState<Set<string>>(new Set())
  const [showBulkActionModal, setShowBulkActionModal] = useState(false)
  const [isDeleteMode, setIsDeleteMode] = useState(false)
  const [activitiesToDelete, setActivitiesToDelete] = useState<Set<string>>(new Set())
  const [newBulk, setNewBulk] = useState({ title: '', description: '' })

  // Add global mouseup listener while dragging
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (isDragging) handleMouseUp()
    }

    if (isDragging) {
      document.addEventListener('mouseup', handleGlobalMouseUp)
      return () => document.removeEventListener('mouseup', handleGlobalMouseUp)
    }
  }, [isDragging, dragStart, dragCurrent, selectedSlots])

  const getSlotKey = (day: string, timeSlot: string) => `${day}-${timeSlot}`

  const handleMouseDown = (day: string, timeSlot: string, e: React.MouseEvent) => {
    e.preventDefault()

    if (isDeleteMode) {
      const activity = getActivityForSlot(day, timeSlot)
      if (!activity) return
      setIsDragging(true)
      setDragStart({ day, timeSlot })
      setDragCurrent({ day, timeSlot })
      setActivitiesToDelete(new Set([activity.id]))
    } else {
      if (!selectedActivityType) return
      const existing = getActivityForSlot(day, timeSlot)
      if (existing) return
      setIsDragging(true)
      setDragStart({ day, timeSlot })
      setDragCurrent({ day, timeSlot })
      setSelectedSlots(new Set([getSlotKey(day, timeSlot)]))
    }
  }

  const handleMouseEnter = (day: string, timeSlot: string) => {
    if (!isDragging || !dragStart) return
    setDragCurrent({ day, timeSlot })

    const dayStartIndex = daysOfWeek.indexOf(dragStart.day)
    const dayEndIndex = daysOfWeek.indexOf(day)
    const timeStartIndex = timeSlots.indexOf(dragStart.timeSlot)
    const timeEndIndex = timeSlots.indexOf(timeSlot)

    const minDay = Math.min(dayStartIndex, dayEndIndex)
    const maxDay = Math.max(dayStartIndex, dayEndIndex)
    const minTime = Math.min(timeStartIndex, timeEndIndex)
    const maxTime = Math.max(timeStartIndex, timeEndIndex)

    if (isDeleteMode) {
      const newActivitiesToDelete = new Set<string>()
      for (let d = minDay; d <= maxDay; d++) {
        for (let t = minTime; t <= maxTime; t++) {
          const currentDay = daysOfWeek[d]
          const currentTime = timeSlots[t]
          const activity = getActivityForSlot(currentDay, currentTime)
          if (activity) newActivitiesToDelete.add(activity.id)
        }
      }
      setActivitiesToDelete(newActivitiesToDelete)
    } else {
      if (!selectedActivityType) return
      const newSelected = new Set<string>()
      for (let d = minDay; d <= maxDay; d++) {
        for (let t = minTime; t <= maxTime; t++) {
          const currentDay = daysOfWeek[d]
          const currentTime = timeSlots[t]
          const activity = getActivityForSlot(currentDay, currentTime)
          if (!activity) newSelected.add(getSlotKey(currentDay, currentTime))
        }
      }
      setSelectedSlots(newSelected)
    }
  }

  const handleMouseUp = () => {
    if (isDragging) {
      if (isDeleteMode && activitiesToDelete.size > 0) {
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

  const bulkDeleteActivities = async () => {
    try {
      const promises = Array.from(activitiesToDelete).map(id => fetch(`/api/schedule/${id}`, { method: 'DELETE' }))
      await Promise.all(promises)
      setActivities(activities.filter(a => !activitiesToDelete.has(a.id)))
      setActivitiesToDelete(new Set())
      setIsDeleteMode(false)
    } catch (error) {
      console.error('Error bulk deleting:', error)
    }
  }

  const createBulkActivities = async () => {
    if (!selectedActivityType || selectedSlots.size === 0 || !selectedTeamId) return
    const title = newBulk.title || defaultActivityTypes.find(t => t.id === selectedActivityType)?.name || 'Activity'
    try {
      const promises = Array.from(selectedSlots).map(slotKey => {
        const [day, timeSlot] = slotKey.split('-')
        return fetch('/api/schedule', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            team_id: selectedTeamId,
            type: selectedActivityType,
            title,
            description: newBulk.description,
            day_of_week: daysOfWeek.indexOf(day),
            time_slot: timeSlot,
            duration: 1
          })
        })
      })

      const responses = await Promise.all(promises)
      const created: ScheduleActivity[] = []
      for (const res of responses) {
        if (res.ok) {
          const data = await res.json()
          created.push(data.activity)
        }
      }
      setActivities([...activities, ...created])
      // reset bulk state
      setSelectedSlots(new Set())
      setShowBulkActionModal(false)
      setNewBulk({ title: '', description: '' })
    } catch (error) {
      console.error('Error creating bulk activities:', error)
    }
  }

  return (
    <div className="space-y-6">
      {/* Team Selector */}
      <div className="bg-dark-card border border-gray-800 rounded-lg p-6">
        <label className="block text-sm font-medium text-gray-400 mb-2">
          Select Team
        </label>
        <select
          value={selectedTeamId}
          onChange={(e) => {
            setSelectedTeamId(e.target.value)
            resetForm()
          }}
          className="w-full px-4 py-2 bg-dark border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="">Choose a team...</option>
          {teams.map((team) => (
            <option key={team.id} value={team.id}>
              {team.name}
            </option>
          ))}
        </select>
      </div>

      {!selectedTeamId ? (
        <div className="bg-dark-card border border-gray-800 rounded-lg p-12">
          <div className="text-center text-gray-400">
            <Calendar className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p className="text-lg">Select a team to view and manage their schedule</p>
          </div>

          {/* Bulk Action Modal */}
          {showBulkActionModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center">
              <div className="absolute inset-0 bg-black opacity-50" onClick={() => { setShowBulkActionModal(false); setSelectedSlots(new Set()) }} />
              <div className="relative bg-dark-card border border-gray-800 rounded-lg p-6 w-full max-w-lg z-10">
                <h3 className="text-lg font-semibold text-white mb-3">Create {Array.from(selectedSlots).length} activities</h3>
                <div className="mb-3">
                  <label className="block text-sm text-gray-400 mb-1">Title (optional)</label>
                  <input value={newBulk.title} onChange={(e) => setNewBulk({ ...newBulk, title: e.target.value })} className="w-full px-3 py-2 bg-dark border border-gray-700 rounded text-white" placeholder="e.g., Practice" />
                </div>
                <div className="mb-4">
                  <label className="block text-sm text-gray-400 mb-1">Description (optional)</label>
                  <input value={newBulk.description} onChange={(e) => setNewBulk({ ...newBulk, description: e.target.value })} className="w-full px-3 py-2 bg-dark border border-gray-700 rounded text-white" placeholder="Optional details" />
                </div>
                <div className="flex justify-end gap-2">
                  <button onClick={() => { setShowBulkActionModal(false); setSelectedSlots(new Set()) }} className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded text-white">Cancel</button>
                  <button onClick={createBulkActivities} className="px-4 py-2 bg-primary hover:bg-primary-dark rounded text-white">Create</button>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : (
        <>
          {/* Activity Type Selector */}
          <div className="bg-dark-card border border-gray-800 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold text-white">Activity Types</h3>
                <div className="group relative">
                  <Info className="w-4 h-4 text-gray-400 hover:text-primary cursor-help transition" />
                  <div className="absolute left-0 top-6 hidden group-hover:block z-10 w-64 p-2 bg-dark-card border border-gray-700 rounded-lg shadow-lg text-xs text-gray-300">
                    Select an activity and click or drag on the grid to place
                  </div>
                </div>
              </div>
              <button
                onClick={() => setIsDeleteMode(!isDeleteMode)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg transition ${isDeleteMode ? 'bg-red-600 text-white' : 'bg-gray-700 text-white hover:bg-gray-600'}`}
                title="Toggle delete mode (drag to remove)"
              >
                <Trash2 className="w-4 h-4" />
                <span className="text-sm">{isDeleteMode ? 'Delete Mode' : 'Remove'}</span>
              </button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {defaultActivityTypes.map((type) => {
                const Icon = type.icon
                return (
                  <button
                    key={type.id}
                    onClick={() => {
                      setSelectedActivityType(type.id)
                      setActivityForm({ ...activityForm, type: type.id })
                    }}
                    className={`p-3 border rounded-lg transition ${type.color} ${
                      selectedActivityType === type.id ? 'ring-2 ring-primary' : ''
                    }`}
                  >
                    <Icon className="w-5 h-5 mx-auto mb-1" />
                    <p className="text-xs font-medium text-center">{type.name}</p>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Activity Form */}
          {isCreating && (
            <div className="bg-dark-card border border-gray-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-4">
                {editingActivity ? 'Edit Activity' : 'Create Activity'}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Activity Type *
                  </label>
                  <select
                    value={activityForm.type}
                    onChange={(e) => setActivityForm({ ...activityForm, type: e.target.value })}
                    className="w-full px-4 py-2 bg-dark border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                  >
                    <option value="">Select type...</option>
                    {defaultActivityTypes.map((type) => (
                      <option key={type.id} value={type.id}>
                        {type.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Title *
                  </label>
                  <input
                    type="text"
                    value={activityForm.title}
                    onChange={(e) => setActivityForm({ ...activityForm, title: e.target.value })}
                    className="w-full px-4 py-2 bg-dark border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="e.g., Team Practice Session"
                    required
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Description
                  </label>
                  <textarea
                    value={activityForm.description}
                    onChange={(e) => setActivityForm({ ...activityForm, description: e.target.value })}
                    className="w-full px-4 py-2 bg-dark border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary"
                    rows={2}
                    placeholder="Optional details about the activity"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Day *
                  </label>
                  <select
                    value={activityForm.day}
                    onChange={(e) => setActivityForm({ ...activityForm, day: e.target.value })}
                    className="w-full px-4 py-2 bg-dark border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                  >
                    <option value="">Select day...</option>
                    {daysOfWeek.map((day) => (
                      <option key={day} value={day}>
                        {day}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Time Slot *
                  </label>
                  <select
                    value={activityForm.timeSlot}
                    onChange={(e) => setActivityForm({ ...activityForm, timeSlot: e.target.value })}
                    className="w-full px-4 py-2 bg-dark border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                  >
                    <option value="">Select time...</option>
                    {timeSlots.map((slot) => (
                      <option key={slot} value={slot}>
                        {slot}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Duration (hours) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="12"
                    value={activityForm.duration}
                    onChange={(e) => setActivityForm({ ...activityForm, duration: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 bg-dark border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                  />
                </div>
              </div>

              <div className="flex gap-2 mt-4">
                {editingActivity ? (
                  <button
                    onClick={handleUpdateActivity}
                    className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg transition"
                  >
                    <Edit className="w-4 h-4" />
                    Update Activity
                  </button>
                ) : (
                  <button
                    onClick={handleCreateActivity}
                    className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg transition"
                  >
                    <Plus className="w-4 h-4" />
                    Create Activity
                  </button>
                )}
                <button
                  onClick={resetForm}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Schedule Grid */}
          <div className="bg-dark-card border border-gray-800 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Weekly Schedule</h3>
            <div>
              <div style={{ gridTemplateColumns: '140px repeat(7, minmax(0, 1fr))' }} className="grid gap-2">
                  {/* Time column header */}
                  <div className="text-center py-2 font-medium text-gray-400">Time</div>
                  
                  {/* Day headers */}
                  {daysOfWeek.map((day) => (
                    <div key={day} className="text-center py-2 font-medium text-white">
                      {day}
                    </div>
                  ))}

                  {/* Time slots */}
                  {timeSlots.map((timeSlot) => (
                    <div key={timeSlot} className="contents">
                      {/* Time label */}
                      <div className="text-center py-3 text-sm text-gray-400 bg-dark border border-gray-800 rounded">
                        {timeSlot}
                      </div>

                      {/* Day cells */}
                      {daysOfWeek.map((day) => {
                        const activity = getActivityForSlot(day, timeSlot)
                        const slotKey = getSlotKey(day, timeSlot)
                        
                        if (activity) {
                          const typeConfig = getActivityType(activity.type)
                          const Icon = typeConfig.icon
                          
                          const selectedDelete = activitiesToDelete.has(activity.id)
                          return (
                            <div
                              key={`${day}-${timeSlot}`}
                              onMouseDown={(e) => handleMouseDown(day, timeSlot, e)}
                              onMouseEnter={() => handleMouseEnter(day, timeSlot)}
                              className={`relative p-2 border rounded-lg ${typeConfig.color} cursor-pointer transition group ${selectedDelete ? 'ring-2 ring-red-500' : ''}`}
                            >
                              <div className="flex items-start justify-between gap-1">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-1 mb-1">
                                    <Icon className="w-3 h-3 flex-shrink-0" />
                                    <p className="text-xs font-bold truncate">{activity.title}</p>
                                  </div>
                                  {activity.description && (
                                    <p className="text-xs opacity-90 line-clamp-2">{activity.description}</p>
                                  )}
                                  <p className="text-xs opacity-75 mt-1">{activity.duration}h</p>
                                </div>
                                
                                <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition">
                                  <button
                                    onClick={() => startEditActivity(activity)}
                                    className="p-1 bg-primary/20 hover:bg-primary/30 rounded"
                                    title="Edit"
                                  >
                                    <Edit className="w-3 h-3" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteActivity(activity.id)}
                                    className="p-1 bg-red-500/20 hover:bg-red-500/30 rounded"
                                    title="Delete"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          )
                        }

                        const isSelected = selectedSlots.has(slotKey)
                        return (
                          <div
                            key={`${day}-${timeSlot}`}
                            onMouseDown={(e) => handleMouseDown(day, timeSlot, e)}
                            onMouseEnter={() => handleMouseEnter(day, timeSlot)}
                            className={`p-2 bg-dark border border-gray-800 rounded-lg transition cursor-pointer ${isSelected ? 'ring-2 ring-primary' : ''}`}
                          >
                            <div className="h-full flex items-center justify-center text-gray-600 opacity-0 hover:opacity-100">
                              <Plus className="w-4 h-4" />
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  ))}
                </div>
              </div>
            </div>

          {/* Bulk Action Modal */}
          {showBulkActionModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center">
              <div className="absolute inset-0 bg-black opacity-50" onClick={() => { setShowBulkActionModal(false); setSelectedSlots(new Set()) }} />
              <div className="relative bg-dark-card border border-gray-800 rounded-lg p-6 w-full max-w-lg z-10">
                <h3 className="text-lg font-semibold text-white mb-3">Create {Array.from(selectedSlots).length} activities</h3>
                <div className="mb-3">
                  <label className="block text-sm text-gray-400 mb-1">Title (optional)</label>
                  <input value={newBulk.title} onChange={(e) => setNewBulk({ ...newBulk, title: e.target.value })} className="w-full px-3 py-2 bg-dark border border-gray-700 rounded text-white" placeholder="e.g., Practice" />
                </div>
                <div className="mb-4">
                  <label className="block text-sm text-gray-400 mb-1">Description (optional)</label>
                  <input value={newBulk.description} onChange={(e) => setNewBulk({ ...newBulk, description: e.target.value })} className="w-full px-3 py-2 bg-dark border border-gray-700 rounded text-white" placeholder="Optional details" />
                </div>
                <div className="flex justify-end gap-2">
                  <button onClick={() => { setShowBulkActionModal(false); setSelectedSlots(new Set()) }} className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded text-white">Cancel</button>
                  <button onClick={createBulkActivities} className="px-4 py-2 bg-primary hover:bg-primary-dark rounded text-white">Create</button>
                </div>
              </div>
            </div>
          )}

          {/* Stats Summary */}
          {activities.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-dark-card border border-gray-800 rounded-lg p-4">
                <p className="text-gray-400 text-sm">Total Activities</p>
                <p className="text-2xl font-bold text-white">{activities.length}</p>
              </div>
              {defaultActivityTypes.slice(0, 3).map((type) => {
                const count = activities.filter(a => a.type === type.id).length
                const Icon = type.icon
                return (
                  <div key={type.id} className="bg-dark-card border border-gray-800 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <Icon className="w-4 h-4 text-gray-400" />
                      <p className="text-gray-400 text-sm">{type.name}</p>
                    </div>
                    <p className="text-2xl font-bold text-white">{count}</p>
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}
    </div>
  )
}
