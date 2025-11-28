'use client'

import { useState, useEffect, useCallback, useMemo, memo } from 'react'
import { CheckCircle, XCircle, HelpCircle, Users, Calendar } from 'lucide-react'
import { ScheduleActivity, ScheduleActivityResponse } from '@/lib/types/database'
import Image from 'next/image'
import { optimizeAvatar } from '@/lib/cloudinary/optimize'

interface ActivityResponsesModalProps {
  activity: ScheduleActivity
  onClose: () => void
  currentUserId?: string
}

// Status helper functions moved outside component
const getStatusColor = (status: string) => {
  switch (status) {
    case 'available':
      return 'text-green-400 bg-green-500/20 border-green-500/30'
    case 'unavailable':
      return 'text-red-400 bg-red-500/20 border-red-500/30'
    case 'maybe':
      return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30'
    default:
      return 'text-gray-400 bg-gray-500/20 border-gray-500/30'
  }
}

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'available':
      return <CheckCircle className="w-4 h-4" />
    case 'unavailable':
      return <XCircle className="w-4 h-4" />
    case 'maybe':
      return <HelpCircle className="w-4 h-4" />
    default:
      return null
  }
}

// Memoized response item component
const ResponseItem = memo(function ResponseItem({ 
  response 
}: { 
  response: ScheduleActivityResponse 
}) {
  const player = (response as { player?: { avatar_url?: string; username?: string; in_game_name?: string } }).player
  
  return (
    <div className="flex items-center justify-between p-3 bg-dark rounded-lg border border-gray-800">
      <div className="flex items-center gap-3">
        {player?.avatar_url ? (
          <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-gray-700">
            <Image
              src={optimizeAvatar(player.avatar_url)}
              alt={player.username || 'Player'}
              width={40}
              height={40}
              className="w-full h-full object-cover"
            />
          </div>
        ) : (
          <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center">
            <Users className="w-5 h-5 text-gray-400" />
          </div>
        )}
        <div>
          <p className="font-medium text-white">{player?.username || 'Unknown'}</p>
          {player?.in_game_name && (
            <p className="text-xs text-gray-400">{player.in_game_name}</p>
          )}
        </div>
      </div>
      <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border ${getStatusColor(response.status)}`}>
        {getStatusIcon(response.status)}
        <span className="text-sm font-medium capitalize">{response.status}</span>
      </div>
    </div>
  )
})

function ActivityResponsesModal({ activity, onClose, currentUserId }: ActivityResponsesModalProps) {
  const [responses, setResponses] = useState<ScheduleActivityResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [userResponse, setUserResponse] = useState<'available' | 'unavailable' | 'maybe' | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const fetchResponses = useCallback(async () => {
    try {
      const response = await fetch(`/api/schedule-responses?activity_id=${activity.id}`)
      if (response.ok) {
        const { responses: data } = await response.json()
        setResponses(data || [])
        
        // Find current user's response if they have one
        const currentResponse = data.find((r: ScheduleActivityResponse) => r.player_id === currentUserId)
        if (currentResponse) {
          setUserResponse(currentResponse.status)
        }
      }
    } catch (error) {
      console.error('Error fetching responses:', error instanceof Error ? error.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [activity.id, currentUserId])

  useEffect(() => {
    fetchResponses()
  }, [fetchResponses])

  // Handle keyboard events for modal
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [onClose])

  const handleResponseChange = useCallback(async (status: 'available' | 'unavailable' | 'maybe') => {
    if (!currentUserId) return
    
    setSubmitting(true)
    try {
      const response = await fetch('/api/schedule-responses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          activity_id: activity.id,
          player_id: currentUserId,
          status,
        }),
      })

      if (response.ok) {
        setUserResponse(status)
        await fetchResponses()
      }
    } catch (error) {
      console.error('Error saving response:', error instanceof Error ? error.message : 'Unknown error')
    } finally {
      setSubmitting(false)
    }
  }, [currentUserId, activity.id, fetchResponses])

  // Memoize counts to avoid recalculating on every render
  const { availableCount, unavailableCount, maybeCount } = useMemo(() => ({
    availableCount: responses.filter(r => r.status === 'available').length,
    unavailableCount: responses.filter(r => r.status === 'unavailable').length,
    maybeCount: responses.filter(r => r.status === 'maybe').length,
  }), [responses])

  return (
    <div 
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div className="bg-dark-card border border-gray-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-800">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 id="modal-title" className="text-2xl font-bold text-white mb-2">{activity.title}</h2>
              <div className="flex items-center gap-4 text-sm text-gray-400">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>{activity.time_slot}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  <span>{responses.length} responses</span>
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition"
              aria-label="Close modal"
            >
              ✕
            </button>
          </div>

          {/* Response Stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3">
              <div className="flex items-center gap-2 text-green-400 mb-1">
                <CheckCircle className="w-4 h-4" />
                <span className="text-xs font-medium">Available</span>
              </div>
              <p className="text-2xl font-bold text-green-400">{availableCount}</p>
            </div>
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
              <div className="flex items-center gap-2 text-red-400 mb-1">
                <XCircle className="w-4 h-4" />
                <span className="text-xs font-medium">Unavailable</span>
              </div>
              <p className="text-2xl font-bold text-red-400">{unavailableCount}</p>
            </div>
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3">
              <div className="flex items-center gap-2 text-yellow-400 mb-1">
                <HelpCircle className="w-4 h-4" />
                <span className="text-xs font-medium">Maybe</span>
              </div>
              <p className="text-2xl font-bold text-yellow-400">{maybeCount}</p>
            </div>
          </div>
        </div>

        {/* User Response Section (if user is a player) */}
        {currentUserId && (
          <div className="p-6 border-b border-gray-800 bg-gray-900/30">
            <p className="text-sm font-medium text-gray-300 mb-3">Your Availability</p>
            <div className="flex gap-3">
              <button
                onClick={() => handleResponseChange('available')}
                disabled={submitting}
                className={`flex-1 px-4 py-3 rounded-lg border-2 transition-all ${
                  userResponse === 'available'
                    ? 'bg-green-500/20 border-green-500 text-green-400'
                    : 'bg-dark border-gray-700 text-gray-400 hover:border-green-500/50'
                }`}
              >
                <CheckCircle className="w-5 h-5 mx-auto mb-1" />
                <span className="text-sm font-medium">Available</span>
              </button>
              <button
                onClick={() => handleResponseChange('maybe')}
                disabled={submitting}
                className={`flex-1 px-4 py-3 rounded-lg border-2 transition-all ${
                  userResponse === 'maybe'
                    ? 'bg-yellow-500/20 border-yellow-500 text-yellow-400'
                    : 'bg-dark border-gray-700 text-gray-400 hover:border-yellow-500/50'
                }`}
              >
                <HelpCircle className="w-5 h-5 mx-auto mb-1" />
                <span className="text-sm font-medium">Maybe</span>
              </button>
              <button
                onClick={() => handleResponseChange('unavailable')}
                disabled={submitting}
                className={`flex-1 px-4 py-3 rounded-lg border-2 transition-all ${
                  userResponse === 'unavailable'
                    ? 'bg-red-500/20 border-red-500 text-red-400'
                    : 'bg-dark border-gray-700 text-gray-400 hover:border-red-500/50'
                }`}
              >
                <XCircle className="w-5 h-5 mx-auto mb-1" />
                <span className="text-sm font-medium">Unavailable</span>
              </button>
            </div>
          </div>
        )}

        {/* Responses List */}
        <div className="flex-1 overflow-y-auto p-6">
          <h3 className="text-sm font-medium text-gray-300 mb-4">Player Responses</h3>
          
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : responses.length === 0 ? (
            <p className="text-gray-400 text-center py-8">No responses yet</p>
          ) : (
            <div className="space-y-2">
              {responses.map((response) => (
                <ResponseItem key={response.id} response={response} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default memo(ActivityResponsesModal)
