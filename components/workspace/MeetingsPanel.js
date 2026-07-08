'use client'

import { useState, useEffect } from 'react'
import { theme } from '@/constants/colors'

export default function MeetingsPanel({ projectId, currentUserId, isOwner }) {
  const [meetings, setMeetings] = useState([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    title: '',
    scheduled_at: '',
    meeting_url: '',
    description: '',
  })

  useEffect(() => {
    async function loadMeetings() {
      try {
        const res = await fetch(`/api/projects/${projectId}/meetings`)
        const data = await res.json()
        if (res.ok) setMeetings(data.meetings || [])
      } catch {
        setError('Failed to load meetings')
      } finally {
        setLoading(false)
      }
    }
    loadMeetings()
  }, [projectId])

  async function handleCreate(e) {
    e.preventDefault()
    setError('')

    try {
      const res = await fetch(`/api/projects/${projectId}/meetings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Failed to create meeting')
        return
      }

      setMeetings(prev => [...prev, data.meeting].sort(
        (a, b) => new Date(a.scheduled_at) - new Date(b.scheduled_at)
      ))
      setForm({ title: '', scheduled_at: '', meeting_url: '', description: '' })
      setCreating(false)
    } catch {
      setError('Something went wrong')
    }
  }

  async function handleDelete(meetingId) {
    if (!confirm('Delete this meeting?')) return
    setMeetings(prev => prev.filter(m => m.id !== meetingId))
    try {
      await fetch(`/api/projects/${projectId}/meetings?meetingId=${meetingId}`, {
        method: 'DELETE',
      })
    } catch {
      setError('Failed to delete meeting')
    }
  }

  function isPast(dateStr) {
    return new Date(dateStr) < new Date()
  }

  function formatMeetingTime(dateStr) {
    return new Date(dateStr).toLocaleString([], {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const upcomingMeetings = meetings.filter(m => !isPast(m.scheduled_at))
  const pastMeetings = meetings.filter(m => isPast(m.scheduled_at))

  return (
    <div style={{ padding: '8px 0' }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '24px',
      }}>
        <div>
          <h3 style={{ fontSize: '15px', fontWeight: 600, color: theme.text.primary, margin: '0 0 4px' }}>
            Meetings
          </h3>
          <p style={{ fontSize: '13px', color: theme.text.secondary, margin: 0 }}>
            Schedule and track team meetings.
          </p>
        </div>
        <button
          onClick={() => setCreating(true)}
          style={{
            padding: '8px 16px',
            background: theme.action.primary,
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            fontSize: '13px',
            fontWeight: 500,
            cursor: 'pointer',
          }}
        >
          + Schedule meeting
        </button>
      </div>

      {error && (
        <div style={{ padding: '10px 14px', background: '#FEF2F2', color: '#DC2626', borderRadius: '8px', fontSize: '13px', marginBottom: '16px' }}>
          {error}
        </div>
      )}

      {/* Create form */}
      {creating && (
        <form onSubmit={handleCreate} style={{
          background: theme.bg.secondary,
          border: `1px solid ${theme.border.focus}`,
          borderRadius: '14px',
          padding: '20px',
          marginBottom: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}>
          <h4 style={{ fontSize: '14px', fontWeight: 600, color: theme.text.primary, margin: 0 }}>
            New meeting
          </h4>

          <input
            required
            placeholder="Meeting title (e.g. Sprint planning, Design review)"
            value={form.title}
            onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
            style={{ padding: '9px 13px', border: `1px solid ${theme.border.light}`, borderRadius: '8px', fontSize: '14px', outline: 'none', fontFamily: 'inherit', background: theme.bg.card }}
            onFocus={e => e.target.style.borderColor = theme.border.focus}
            onBlur={e => e.target.style.borderColor = theme.border.light}
          />

          <div style={{ display: 'flex', gap: '12px' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: '12px', color: theme.text.secondary, marginBottom: '4px', fontWeight: 500 }}>
                Date & time *
              </label>
              <input
                required
                type="datetime-local"
                value={form.scheduled_at}
                onChange={e => setForm(p => ({ ...p, scheduled_at: e.target.value }))}
                style={{ width: '100%', padding: '9px 13px', border: `1px solid ${theme.border.light}`, borderRadius: '8px', fontSize: '14px', outline: 'none', fontFamily: 'inherit', background: theme.bg.card, boxSizing: 'border-box' }}
                onFocus={e => e.target.style.borderColor = theme.border.focus}
                onBlur={e => e.target.style.borderColor = theme.border.light}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: '12px', color: theme.text.secondary, marginBottom: '4px', fontWeight: 500 }}>
                Meeting link (optional)
              </label>
              <input
                type="url"
                placeholder="https://meet.google.com/..."
                value={form.meeting_url}
                onChange={e => setForm(p => ({ ...p, meeting_url: e.target.value }))}
                style={{ width: '100%', padding: '9px 13px', border: `1px solid ${theme.border.light}`, borderRadius: '8px', fontSize: '14px', outline: 'none', fontFamily: 'inherit', background: theme.bg.card, boxSizing: 'border-box' }}
                onFocus={e => e.target.style.borderColor = theme.border.focus}
                onBlur={e => e.target.style.borderColor = theme.border.light}
              />
            </div>
          </div>

          <textarea
            placeholder="Description or agenda (optional)"
            value={form.description}
            onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
            rows={2}
            style={{ padding: '9px 13px', border: `1px solid ${theme.border.light}`, borderRadius: '8px', fontSize: '14px', outline: 'none', fontFamily: 'inherit', resize: 'vertical', background: theme.bg.card }}
            onFocus={e => e.target.style.borderColor = theme.border.focus}
            onBlur={e => e.target.style.borderColor = theme.border.light}
          />

          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
            <button type="button" onClick={() => setCreating(false)}
              style={{ padding: '8px 14px', background: 'none', border: `1px solid ${theme.border.light}`, borderRadius: '8px', fontSize: '13px', cursor: 'pointer', color: theme.text.secondary }}>
              Cancel
            </button>
            <button type="submit"
              style={{ padding: '8px 16px', background: theme.action.primary, color: '#fff', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 500, cursor: 'pointer' }}>
              Schedule
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', color: theme.text.tertiary, fontSize: '13px', padding: '40px 0' }}>
          Loading meetings...
        </div>
      ) : meetings.length === 0 && !creating ? (
        <div style={{ textAlign: 'center', padding: '48px 0', color: theme.text.tertiary }}>
          <div style={{ fontSize: '40px', marginBottom: '12px' }}>📅</div>
          <p style={{ fontSize: '14px', margin: 0 }}>No meetings scheduled. Plan your first one.</p>
        </div>
      ) : (
        <>
          {/* Upcoming */}
          {upcomingMeetings.length > 0 && (
            <div style={{ marginBottom: '28px' }}>
              <div style={{ fontSize: '12px', fontWeight: 600, color: theme.text.secondary, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px' }}>
                Upcoming
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {upcomingMeetings.map(meeting => (
                  <MeetingCard
                    key={meeting.id}
                    meeting={meeting}
                    isPast={false}
                    currentUserId={currentUserId}
                    isOwner={isOwner}
                    onDelete={handleDelete}
                    formatTime={formatMeetingTime}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Past */}
          {pastMeetings.length > 0 && (
            <div>
              <div style={{ fontSize: '12px', fontWeight: 600, color: theme.text.tertiary, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px' }}>
                Past
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', opacity: 0.6 }}>
                {pastMeetings.map(meeting => (
                  <MeetingCard
                    key={meeting.id}
                    meeting={meeting}
                    isPast={true}
                    currentUserId={currentUserId}
                    isOwner={isOwner}
                    onDelete={handleDelete}
                    formatTime={formatMeetingTime}
                  />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

function MeetingCard({ meeting, isPast, currentUserId, isOwner, onDelete, formatTime }) {
  const canDelete = isOwner || meeting.profiles?.id === currentUserId

  return (
    <div style={{
      display: 'flex',
      alignItems: 'flex-start',
      gap: '14px',
      padding: '16px',
      background: isPast ? theme.bg.secondary : theme.bg.card,
      border: `1px solid ${isPast ? theme.border.light : theme.border.indigo}`,
      borderRadius: '12px',
    }}>
      {/* Date block */}
      <div style={{
        width: '52px',
        flexShrink: 0,
        textAlign: 'center',
        background: isPast ? theme.bg.hover : theme.bg.indigoSoft,
        borderRadius: '10px',
        padding: '8px 4px',
      }}>
        <div style={{ fontSize: '11px', fontWeight: 600, color: isPast ? theme.text.tertiary : theme.text.indigo, textTransform: 'uppercase' }}>
          {new Date(meeting.scheduled_at).toLocaleString([], { month: 'short' })}
        </div>
        <div style={{ fontSize: '22px', fontWeight: 700, color: isPast ? theme.text.secondary : theme.text.primary, lineHeight: 1.1 }}>
          {new Date(meeting.scheduled_at).getDate()}
        </div>
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '14px', fontWeight: 600, color: theme.text.primary, marginBottom: '4px' }}>
          {meeting.title}
        </div>
        <div style={{ fontSize: '12px', color: theme.text.secondary, marginBottom: meeting.description ? '6px' : 0 }}>
          🕐 {formatTime(meeting.scheduled_at)} · Scheduled by {meeting.profiles?.full_name}
        </div>
        {meeting.description && (
          <div style={{ fontSize: '13px', color: theme.text.secondary, lineHeight: 1.5 }}>
            {meeting.description}
          </div>
        )}
      </div>

      {/* Actions */}
<div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
  {meeting.meeting_url && !isPast && (
    <a
      href={meeting.meeting_url}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        padding: '6px 14px',
        background: theme.action.primary,
        color: '#fff',
        borderRadius: '8px',
        fontSize: '12px',
        fontWeight: 600,
        textDecoration: 'none',
      }}
    >
      Join →
    </a>
  )}
  {canDelete && (
    <button
      onClick={() => onDelete(meeting.id)}
      style={{
        padding: '6px 10px',
        background: 'none',
        border: `1px solid ${theme.border.light}`,
        borderRadius: '8px',
        fontSize: '12px',
        color: theme.text.secondary,
        cursor: 'pointer',
      }}
    >
      Delete
    </button>
  )}
</div>
    </div>
  )
}