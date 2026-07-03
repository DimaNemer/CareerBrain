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

  useEffect(() => {
    async function loadMessages() {
      try {
        const res = await fetch(`/api/projects/${projectId}/messages`)
        const data = await res.json()
        if (res.ok) setMessages(data.messages || [])
      } catch {
        setError('Failed to load messages')
      } finally {
        setLoading(false)
      }
    }
    loadMessages()
  }, [projectId])

useEffect(() => {
  const supabase = createClient()

  const channel = supabase
    .channel(`project-chat-${projectId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `project_id=eq.${projectId}`,
      },
      async (payload) => {
        // Fetch full message with profile
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

  return () => {
    supabase.removeChannel(channel)
  }
}, [projectId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function handleSend(e) {
    e.preventDefault()
    if (!newMessage.trim() || sending) return
    setSending(true)
    setError('')
    try {
      const res = await fetch(`/api/projects/${projectId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newMessage.trim() }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Failed to send'); return }
      setNewMessage('')
      inputRef.current?.focus()
    } catch {
      setError('Failed to send message')
    } finally {
      setSending(false)
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(e) }
  }

  function formatTime(ts) {
    return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: theme.bg.card, border: `1px solid ${theme.border.light}`, borderRadius: '16px', overflow: 'hidden' }}>
      <div style={{ padding: '16px 20px', borderBottom: `1px solid ${theme.border.light}`, display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ fontSize: '16px' }}>💬</span>
        <h2 style={{ fontSize: '15px', fontWeight: 600, color: theme.text.primary, margin: 0 }}>Team chat</h2>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', color: theme.text.tertiary, fontSize: '13px', padding: '40px 0' }}>Loading messages...</div>
        ) : messages.length === 0 ? (
          <div style={{ textAlign: 'center', color: theme.text.tertiary, fontSize: '13px', padding: '40px 0' }}>No messages yet. Say hello 👋</div>
        ) : (
          messages.map((message, i) => {
            const isOwn = message.sender_id === currentUserId
            const prevMessage = messages[i - 1]
            const showAvatar = prevMessage?.sender_id !== message.sender_id
            return (
              <div key={message.id} style={{ display: 'flex', flexDirection: isOwn ? 'row-reverse' : 'row', gap: '8px', alignItems: 'flex-end', marginBottom: '4px' }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: isOwn ? theme.action.primary : theme.border.medium, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 600, color: '#fff', flexShrink: 0, visibility: showAvatar ? 'visible' : 'hidden' }}>
                  {message.profiles?.full_name?.[0]?.toUpperCase() || '?'}
                </div>
                <div style={{ maxWidth: '72%' }}>
                  {showAvatar && !isOwn && (
                    <div style={{ fontSize: '11px', fontWeight: 500, color: theme.text.secondary, marginBottom: '3px', paddingLeft: '2px' }}>
                      {message.profiles?.full_name}
                    </div>
                  )}
                  <div style={{ padding: '8px 12px', background: isOwn ? theme.action.primary : theme.bg.secondary, color: isOwn ? '#fff' : theme.text.primary, borderRadius: isOwn ? '14px 14px 4px 14px' : '14px 14px 14px 4px', fontSize: '14px', lineHeight: 1.5, wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}>
                    {message.content}
                  </div>
                  <div style={{ fontSize: '10px', color: theme.text.tertiary, marginTop: '3px', textAlign: isOwn ? 'right' : 'left' }}>
                    {formatTime(message.created_at)}
                  </div>
                </div>
              </div>
            )
          })
        )}
        <div ref={bottomRef} />
      </div>

      {error && <div style={{ padding: '8px 20px', background: '#FEF2F2', color: '#DC2626', fontSize: '13px' }}>{error}</div>}

      <div style={{ padding: '12px 16px', borderTop: `1px solid ${theme.border.light}` }}>
        <form onSubmit={handleSend} style={{ display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
          <textarea
            ref={inputRef}
            value={newMessage}
            onChange={e => setNewMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message... (Enter to send)"
            rows={1}
            style={{ flex: 1, padding: '10px 14px', background: theme.bg.secondary, border: `1px solid ${theme.border.light}`, borderRadius: '12px', fontSize: '14px', color: theme.text.primary, outline: 'none', resize: 'none', fontFamily: 'inherit', lineHeight: 1.5 }}
            onFocus={e => e.target.style.borderColor = theme.border.focus}
            onBlur={e => e.target.style.borderColor = theme.border.light}
          />
          <button type="submit" disabled={sending || !newMessage.trim()}
            style={{ padding: '10px 16px', background: newMessage.trim() ? theme.action.primary : theme.border.light, color: newMessage.trim() ? '#fff' : theme.text.tertiary, border: 'none', borderRadius: '12px', fontSize: '14px', cursor: newMessage.trim() ? 'pointer' : 'not-allowed' }}>
            {sending ? '...' : '→'}
          </button>
        </form>
      </div>
    </div>
  )
}