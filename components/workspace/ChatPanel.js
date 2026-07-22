'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase'
import { theme } from '@/constants/colors'

export default function ChatPanel({ projectId, currentUserId }) {
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const bottomRef = useRef(null)
  const inputRef = useRef(null)
  const lastMessageIdRef = useRef(null)

  // Load message history
 useEffect(() => {
  async function loadMessages() {
    try {
      const res = await fetch(`/api/projects/${projectId}/messages`)
      const data = await res.json()
      if (res.ok && data.messages) {
        setMessages(data.messages)
        if (data.messages.length > 0) {
          lastMessageIdRef.current = data.messages[data.messages.length - 1].id
        }
      }
    } catch {
      setError('Failed to load messages')
    } finally {
      setLoading(false)
    }
  }

  loadMessages()
}, [projectId])

 

  // Realtime subscription
  useEffect(() => {
    const supabase = createClient()

    const channel = supabase
      .channel(`chat-${projectId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `project_id=eq.${projectId}`,
        },
        async (payload) => {
          const { data: fullMessage } = await supabase
            .from('messages')
            .select(`
              id,
              content,
              created_at,
              sender_id,
              profiles!messages_sender_id_fkey (
                id,
                full_name,
                username,
                avatar_url
              )
            `)
            .eq('id', payload.new.id)
            .single()

          if (fullMessage) {
            setMessages(prev => {
              if (prev.some(m => m.id === fullMessage.id)) return prev
              return [...prev, fullMessage]
            })
          }
        }
      )
      .subscribe((status) => {
        console.log('Realtime status:', status)
      })

    // Polling fallback — every 3 seconds check for new messages
    // This ensures messages appear even if realtime fails
    const pollInterval = setInterval(async () => {
      try {
        const res = await fetch(`/api/projects/${projectId}/messages`)
        const data = await res.json()
        if (res.ok && data.messages) {
          setMessages(prev => {
            const existingIds = new Set(prev.map(m => m.id))
            const newMessages = data.messages.filter(m => !existingIds.has(m.id))
            if (newMessages.length === 0) return prev
            return [...prev, ...newMessages]
          })
        }
      } catch {
        // Silent fail for polling
      }
    }, 3000)

    return () => {
      supabase.removeChannel(channel)
      clearInterval(pollInterval)
    }
  }, [projectId])

  // Auto scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function handleSend(e) {
    e.preventDefault()
    if (!newMessage.trim() || sending) return

    const messageText = newMessage.trim()
    setSending(true)
    setError('')
    setNewMessage('') // Clear immediately for better UX

    try {
      const res = await fetch(`/api/projects/${projectId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: messageText }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Failed to send')
        setNewMessage(messageText) // Restore message on error
        return
      }

      // Immediately add the sent message to state
      // This makes it appear instantly without waiting for realtime
      if (data.message) {
        setMessages(prev => {
          if (prev.some(m => m.id === data.message.id)) return prev
          return [...prev, data.message]
        })
      }

      inputRef.current?.focus()
    } catch {
      setError('Failed to send message')
      setNewMessage(messageText)
    } finally {
      setSending(false)
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend(e)
    }
  }

  function formatTime(ts) {
    return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  function formatDate(ts) {
    const date = new Date(ts)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    if (date.toDateString() === today.toDateString()) return 'Today'
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday'
    return date.toLocaleDateString()
  }

  const groupedMessages = messages.reduce((groups, message) => {
    const date = formatDate(message.created_at)
    if (!groups[date]) groups[date] = []
    groups[date].push(message)
    return groups
  }, {})

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      background: theme.bg.card,
      border: `1px solid ${theme.border.light}`,
      borderRadius: '16px',
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        padding: '16px 20px',
        borderBottom: `1px solid ${theme.border.light}`,
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        flexShrink: 0,
      }}>
        <span style={{ fontSize: '16px' }}>💬</span>
        <h2 style={{ fontSize: '15px', fontWeight: 600, color: theme.text.primary, margin: 0 }}>
          Team chat
        </h2>
        <span style={{
          marginLeft: 'auto',
          fontSize: '11px',
          color: theme.text.tertiary,
        }}>
          {messages.length} messages
        </span>
      </div>

      {/* Messages */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '16px 20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '2px',
      }}>
        {loading ? (
          <div style={{ textAlign: 'center', color: theme.text.tertiary, fontSize: '13px', padding: '40px 0' }}>
            Loading messages...
          </div>
        ) : messages.length === 0 ? (
          <div style={{ textAlign: 'center', color: theme.text.tertiary, fontSize: '13px', padding: '40px 0' }}>
            No messages yet. Say hello 👋
          </div>
        ) : (
          Object.entries(groupedMessages).map(([date, dateMessages]) => (
            <div key={date}>
              {/* Date separator */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '12px 0' }}>
                <div style={{ flex: 1, height: '1px', background: theme.border.light }} />
                <span style={{ fontSize: '11px', color: theme.text.tertiary, fontWeight: 500 }}>{date}</span>
                <div style={{ flex: 1, height: '1px', background: theme.border.light }} />
              </div>

              {dateMessages.map((message, i) => {
                const isOwn = message.sender_id === currentUserId
                const prevMessage = dateMessages[i - 1]
                const showAvatar = prevMessage?.sender_id !== message.sender_id

                return (
                  <div key={message.id} style={{
                    display: 'flex',
                    flexDirection: isOwn ? 'row-reverse' : 'row',
                    gap: '8px',
                    alignItems: 'flex-end',
                    marginBottom: '4px',
                  }}>
                    <div style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '50%',
                      background: isOwn ? theme.action.primary : theme.border.medium,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '11px',
                      fontWeight: 600,
                      color: '#fff',
                      flexShrink: 0,
                      visibility: showAvatar ? 'visible' : 'hidden',
                    }}>
                      {message.profiles?.full_name?.[0]?.toUpperCase() || '?'}
                    </div>

                    <div style={{ maxWidth: '72%' }}>
                      {showAvatar && !isOwn && (
                        <div style={{
                          fontSize: '11px',
                          fontWeight: 500,
                          color: theme.text.secondary,
                          marginBottom: '3px',
                          paddingLeft: '2px',
                        }}>
                          {message.profiles?.full_name}
                        </div>
                      )}
                      <div style={{
                        padding: '8px 12px',
                        background: isOwn ? theme.action.primary : theme.bg.secondary,
                        color: isOwn ? '#fff' : theme.text.primary,
                        borderRadius: isOwn ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                        fontSize: '14px',
                        lineHeight: 1.5,
                        wordBreak: 'break-word',
                        whiteSpace: 'pre-wrap',
                      }}>
                        {message.content}
                      </div>
                      <div style={{
                        fontSize: '10px',
                        color: theme.text.tertiary,
                        marginTop: '3px',
                        textAlign: isOwn ? 'right' : 'left',
                      }}>
                        {formatTime(message.created_at)}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* Error */}
      {error && (
        <div style={{ padding: '8px 20px', background: '#FEF2F2', color: '#DC2626', fontSize: '13px', flexShrink: 0 }}>
          {error}
        </div>
      )}

      {/* Input */}
      <div style={{ padding: '12px 16px', borderTop: `1px solid ${theme.border.light}`, flexShrink: 0 }}>
        <form onSubmit={handleSend} style={{ display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
          <textarea
            ref={inputRef}
            value={newMessage}
            onChange={e => setNewMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            rows={1}
            style={{
              flex: 1,
              padding: '10px 14px',
              background: theme.bg.secondary,
              border: `1px solid ${theme.border.light}`,
              borderRadius: '12px',
              fontSize: '14px',
              color: theme.text.primary,
              outline: 'none',
              resize: 'none',
              fontFamily: 'inherit',
              lineHeight: 1.5,
            }}
            onFocus={e => e.target.style.borderColor = theme.border.focus}
            onBlur={e => e.target.style.borderColor = theme.border.light}
          />
          <button
            type="submit"
            disabled={sending || !newMessage.trim()}
            style={{
              padding: '10px 16px',
              background: newMessage.trim() ? theme.action.primary : theme.border.light,
              color: newMessage.trim() ? '#fff' : theme.text.tertiary,
              border: 'none',
              borderRadius: '12px',
              fontSize: '18px',
              cursor: newMessage.trim() ? 'pointer' : 'not-allowed',
              flexShrink: 0,
            }}
          >
            {sending ? '...' : '→'}
          </button>
        </form>
      </div>
    </div>
  )
}