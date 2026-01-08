'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { TeamMessage, CommunicationSection, UserRole, StratType } from '@/lib/types/database'
import { Send, Image as ImageIcon, Link as LinkIcon, Trash2, Loader2, Save } from 'lucide-react'
import Image from 'next/image'
import { deleteTeamMessageImage } from '@/lib/cloudinary/delete'
import { optimizeChatImage } from '@/lib/cloudinary/optimize'
import { useTranslations } from 'next-intl'

interface TeamCommunicationProps {
  teamId: string
  section: CommunicationSection
  userId: string
  userName: string
  userRole: UserRole
  mapName?: string // Optional: only for strat_map section (accepts ValorantMap or CS2Map)
  matchId?: string // Optional: only for review_praccs section
  stratTypeFilter?: StratType // Optional: filter by strategy type
  compositionFilter?: string // Optional: filter by team composition
  onSaveComposition?: () => void // Optional: callback to trigger composition save
}

export default function TeamCommunication({ 
  teamId, 
  section, 
  userId, 
  userName, 
  userRole,
  mapName,
  matchId,
  stratTypeFilter,
  compositionFilter = '',
  onSaveComposition
}: TeamCommunicationProps) {
  const [messages, setMessages] = useState<TeamMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [uploading, setUploading] = useState(false)
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const t = useTranslations('communication')
  const tCommon = useTranslations('common')
  
  const supabase = createClient()

  useEffect(() => {
    fetchMessages()
    
    // Subscribe to real-time updates
    const channel = supabase
      .channel(`team_messages_${teamId}_${section}_${mapName || 'all'}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'team_messages',
        },
        (payload) => {
          // Filter for this team, section, and map
          const message = payload.new as TeamMessage
          const matchesFilter = 
            message.team_id === teamId && 
            message.section === section &&
            (section === 'strat_map' ? message.map_name === mapName : message.map_name === null)
          
          if (payload.eventType === 'INSERT' && matchesFilter) {
            setMessages(prev => [...prev, message])
          } else if (payload.eventType === 'DELETE') {
            setMessages(prev => prev.filter(m => m.id !== payload.old.id))
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [teamId, section, mapName, stratTypeFilter, compositionFilter])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const fetchMessages = async () => {
    try {
      let query = supabase
        .from('team_messages')
        .select('*')
        .eq('team_id', teamId)
        .eq('section', section)

      // Filter by map if in strat_map section
      if (section === 'strat_map' && mapName) {
        query = query.eq('map_name', mapName)
      } else if (section === 'review_praccs' && matchId) {
        query = query.eq('match_id', matchId)
      }

      const { data, error } = await query.order('created_at', { ascending: true })

      if (error) {
        console.error('Supabase error details:', {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint
        })
        throw error
      }
      
      // Apply client-side filters
      let filteredData = data || []
      
      if (stratTypeFilter) {
        // Filter by strategy type: show messages with matching strat_type OR messages with no strat_type set
        filteredData = filteredData.filter(msg => 
          msg.strat_type === stratTypeFilter || 
          !msg.strat_type
        )
      }
      
      setMessages(filteredData)
    } catch (error: any) {
      console.error('Error fetching messages:', {
        error,
        teamId,
        section,
        mapName,
        errorMessage: error?.message || 'No message',
        errorCode: error?.code || 'No code'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!message.trim() || sending) return

    setSending(true)
    try {
      const { error } = await supabase
        .from('team_messages')
        .insert({
          team_id: teamId,
          section,
          message_type: 'text',
          content: message.trim(),
          map_name: section === 'strat_map' ? mapName : null,
          match_id: section === 'review_praccs' ? matchId : null,
          strat_type: section === 'strat_map' && stratTypeFilter ? stratTypeFilter : null,
          composition: section === 'strat_map' && compositionFilter ? compositionFilter : null,
          author_id: userId,
          author_name: userName,
          author_role: userRole
        })

      if (error) {
        console.error('Error inserting message:', {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint
        })
        throw error
      }
      setMessage('')
      
      // Refetch messages to ensure UI updates
      await fetchMessages()
    } catch (error: any) {
      console.error('Error sending message:', error)
      alert(`Failed to send message: ${error?.message || 'Unknown error'}`)
    } finally {
      setSending(false)
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert('Image must be smaller than 10MB')
      return
    }

    // Check file type
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file')
      return
    }

    setUploading(true)
    try {
      // Create FormData for Cloudinary upload
      const formData = new FormData()
      formData.append('file', file)
      formData.append('upload_preset', process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!)

      // Upload to Cloudinary
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
        {
          method: 'POST',
          body: formData,
        }
      )

      const result = await response.json()

      if (!response.ok) {
        console.error('Cloudinary error:', result)
        throw new Error(result.error?.message || JSON.stringify(result))
      }

      const imageUrl = result.secure_url

      // Save message with image
      const { error } = await supabase
        .from('team_messages')
        .insert({
          team_id: teamId,
          section,
          message_type: 'image',
          content: file.name,
          image_url: imageUrl,
          map_name: section === 'strat_map' ? mapName : null,
          match_id: section === 'review_praccs' ? matchId : null,
          strat_type: section === 'strat_map' && stratTypeFilter ? stratTypeFilter : null,
          composition: section === 'strat_map' && compositionFilter ? compositionFilter : null,
          author_id: userId,
          author_name: userName,
          author_role: userRole
        })

      if (error) throw error
      
      // Refetch messages to ensure UI updates
      await fetchMessages()
    } catch (error) {
      console.error('Error uploading image:', error)
      alert('Failed to upload image')
    } finally {
      setUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleDeleteMessage = async (messageId: string) => {
    if (!confirm('Delete this message?')) return

    try {
      // Get message first to check for image
      const { data: message } = await supabase
        .from('team_messages')
        .select('image_url, author_id')
        .eq('id', messageId)
        .single()

      // Delete from database directly (using client, not server action)
      const { data: deleteData, error: deleteError } = await supabase
        .from('team_messages')
        .delete()
        .eq('id', messageId)

      if (deleteError) {
        console.error('Error deleting message:', deleteError)
        throw deleteError
      }

      // Immediately remove from local state for instant feedback
      setMessages(prev => prev.filter(m => m.id !== messageId))

      // Delete from Cloudinary if it has an image (optional, non-blocking)
      if (message?.image_url) {
        deleteTeamMessageImage(messageId, userId).catch(err => 
          console.warn('Failed to delete Cloudinary image:', err)
        )
      }
    } catch (error: any) {
      console.error('Error deleting message:', error)
      alert(`Failed to delete message: ${error?.message || 'Unknown error'}`)
      // Refetch to restore correct state
      await fetchMessages()
    }
  }

  const getRoleColor = (role: UserRole) => {
    switch (role) {
      case 'admin': return 'text-red-400'
      case 'manager': return 'text-blue-400'
      case 'player': return 'text-green-400'
      default: return 'text-gray-400'
    }
  }

  const isUrl = (text: string) => {
    try {
      new URL(text)
      return true
    } catch {
      return false
    }
  }

  const renderFormattedText = (text: string) => {
    // Split by lines first
    const lines = text.split('\n')
    
    return lines.map((line, lineIndex) => {
      // Handle bold text **text**
      const parts = line.split(/(\*\*.*?\*\*)/)
      
      return (
        <span key={lineIndex}>
          {parts.map((part, partIndex) => {
            if (part.startsWith('**') && part.endsWith('**')) {
              return (
                <strong key={partIndex} className="font-bold text-white">
                  {part.slice(2, -2)}
                </strong>
              )
            }
            return <span key={partIndex}>{part}</span>
          })}
          {lineIndex < lines.length - 1 && <br />}
        </span>
      )
    })
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="bg-dark-card border border-gray-800 rounded-lg flex flex-col h-[600px]">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-400">{t('noMessagesYet')}</p>
          </div>
        ) : (
          messages.map((msg) => {
            // Determine if current user can delete this message
            const canDelete = 
              userRole === 'admin' || // Admin can delete all
              msg.author_id === userId || // User can delete their own
              (userRole === 'manager' && msg.author_role === 'player') // Manager can delete player messages only
            
            return (
              <div key={msg.id} className="flex gap-3 group">
                <div className="flex-1">
                  <div className="flex items-baseline gap-2 mb-1 flex-wrap">
                    <span className={`font-medium ${getRoleColor(msg.author_role)}`}>
                      {msg.author_name}
                    </span>
                    <span className="text-xs text-gray-500">
                      {new Date(msg.created_at).toLocaleString()}
                    </span>
                  </div>
                  
                  {msg.message_type === 'text' ? (
                    <div className="bg-dark border border-gray-800 rounded-lg p-3">
                      {isUrl(msg.content) ? (
                        <a 
                          href={msg.content} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-primary hover:underline flex items-center gap-2"
                        >
                          <LinkIcon className="w-4 h-4" />
                          {msg.content}
                        </a>
                      ) : (
                        <div className="text-gray-300 break-words">
                          {renderFormattedText(msg.content)}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="bg-dark border border-gray-800 rounded-lg p-3">
                      <p className="text-sm text-gray-400 mb-2">{msg.content}</p>
                      {msg.image_url && (
                        <a href={msg.image_url} target="_blank" rel="noopener noreferrer">
                          <Image
                            src={optimizeChatImage(msg.image_url)}
                            alt={msg.content}
                            width={400}
                            height={300}
                            className="rounded-lg max-w-full h-auto cursor-pointer hover:opacity-90 transition"
                            unoptimized
                          />
                        </a>
                      )}
                    </div>
                  )}
                </div>
                
                {canDelete && (
                  <button
                    onClick={() => handleDeleteMessage(msg.id)}
                    className="opacity-0 group-hover:opacity-100 transition text-red-400 hover:text-red-300 self-start mt-6"
                    title="Delete message"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            )
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t border-gray-800 p-4">
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageUpload}
            accept="image/*"
            className="hidden"
          />
          
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="px-4 py-2 bg-dark border border-gray-800 hover:border-gray-700 text-gray-300 rounded-lg transition disabled:opacity-50"
            title="Upload image"
          >
            {uploading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <ImageIcon className="w-5 h-5" />
            )}
          </button>

          {/* Save Composition Button - only show for strat_map section */}
          {section === 'strat_map' && onSaveComposition && compositionFilter && (
            <button
              type="button"
              onClick={onSaveComposition}
              className="px-4 py-2 bg-green-500/20 border border-green-500 hover:bg-green-500/30 text-green-400 rounded-lg transition flex items-center gap-2"
              title="Save composition to chat"
            >
              <Save className="w-5 h-5" />
              <span className="hidden sm:inline">Save Comp</span>
            </button>
          )}
          
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={t('typeMessagePlaceholder')}
            disabled={sending}
            className="flex-1 px-4 py-2 bg-dark border border-gray-800 rounded-lg text-white focus:outline-none focus:border-primary font-sans disabled:opacity-50"
          />
          
          <button
            type="submit"
            disabled={!message.trim() || sending}
            className="px-6 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {sending ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <Send className="w-5 h-5" />
                {tCommon('send')}
              </>
            )}
          </button>
        </form>
        <p className="text-xs text-gray-500 mt-2">
          {t('sendMessagesInfo')}
        </p>
      </div>
    </div>
  )
}
