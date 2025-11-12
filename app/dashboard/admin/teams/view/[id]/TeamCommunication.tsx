'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { TeamMessage, CommunicationSection, UserRole, ValorantMap } from '@/lib/types/database'
import { Send, Image as ImageIcon, Link as LinkIcon, Trash2, Loader2 } from 'lucide-react'
import Image from 'next/image'

interface TeamCommunicationProps {
  teamId: string
  section: CommunicationSection
  userId: string
  userName: string
  userRole: UserRole
  mapName?: ValorantMap // Optional: only for strat_map section
  matchId?: string // Optional: only for review_praccs section
}

export default function TeamCommunication({ 
  teamId, 
  section, 
  userId, 
  userName, 
  userRole,
  mapName,
  matchId
}: TeamCommunicationProps) {
  const [messages, setMessages] = useState<TeamMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [uploading, setUploading] = useState(false)
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
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
          console.log('Real-time update:', payload) // Debug log
          
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
  }, [teamId, section, mapName])

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

      if (error) throw error
      setMessages(data || [])
    } catch (error) {
      console.error('Error fetching messages:', error)
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
          author_id: userId,
          author_name: userName,
          author_role: userRole
        })

      if (error) throw error
      setMessage('')
      
      // Refetch messages to ensure UI updates
      await fetchMessages()
    } catch (error) {
      console.error('Error sending message:', error)
      alert('Failed to send message')
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

      console.log('Cloudinary response:', result) // Debug log

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
      const { error } = await supabase
        .from('team_messages')
        .delete()
        .eq('id', messageId)

      if (error) throw error
      
      // Refetch messages to ensure UI updates
      await fetchMessages()
    } catch (error) {
      console.error('Error deleting message:', error)
      alert('Failed to delete message')
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
            <p className="text-gray-400">No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} className="flex gap-3 group">
              <div className="flex-1">
                <div className="flex items-baseline gap-2 mb-1">
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
                      <p className="text-gray-300 whitespace-pre-wrap break-words">{msg.content}</p>
                    )}
                  </div>
                ) : (
                  <div className="bg-dark border border-gray-800 rounded-lg p-3">
                    <p className="text-sm text-gray-400 mb-2">{msg.content}</p>
                    {msg.image_url && (
                      <a href={msg.image_url} target="_blank" rel="noopener noreferrer">
                        <Image
                          src={msg.image_url}
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
              
              {(msg.author_id === userId || userRole === 'admin') && (
                <button
                  onClick={() => handleDeleteMessage(msg.id)}
                  className="opacity-0 group-hover:opacity-100 transition text-red-400 hover:text-red-300 self-start mt-6"
                  title="Delete message"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          ))
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
          
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type a message or paste a link..."
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
                Send
              </>
            )}
          </button>
        </form>
        <p className="text-xs text-gray-500 mt-2">
          Send messages, paste links, or upload images (max 10MB)
        </p>
      </div>
    </div>
  )
}
