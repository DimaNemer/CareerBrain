'use client'

import { useState } from 'react'
import { theme } from '@/constants/colors'

const COLUMNS = [
  { key: 'todo', label: 'To Do', color: theme.text.secondary },
  { key: 'in_progress', label: 'In Progress', color: theme.score.medium },
  { key: 'done', label: 'Done', color: theme.score.high },
]

export default function TaskBoard({
  
  tasks: initialTasks,
  projectId,
  currentUserId,
  isOwner,
  teamMembers,
}) {
  const [tasks, setTasks] = useState(initialTasks || [])
  const [creating, setCreating] = useState(false)
  const [newTask, setNewTask] = useState({ title: '', assigned_to: '', due_date: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const tasksByStatus = {
    todo: tasks.filter(t => t.status === 'todo'),
    in_progress: tasks.filter(t => t.status === 'in_progress'),
    done: tasks.filter(t => t.status === 'done'),
  }

  async function updateTaskStatus(taskId, newStatus) {
    setTasks(prev =>
      prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t)
    )
    try {
      const res = await fetch(`/api/projects/${projectId}/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      if (!res.ok) {
        const data = await res.json()
        setError(data.error || 'Failed to update task')
      }
    } catch {
      setError('Failed to update task')
    }
  }

  async function deleteTask(taskId) {
    if (!confirm('Delete this task?')) return
    setTasks(prev => prev.filter(t => t.id !== taskId))
    try {
      await fetch(`/api/projects/${projectId}/tasks/${taskId}`, {
        method: 'DELETE',
      })
    } catch {
      setError('Failed to delete task')
    }
  }

  async function createTask(e) {
    e.preventDefault()
    if (!newTask.title.trim()) return
    setLoading(true)
    setError('')

    try {
      const res = await fetch(`/api/projects/${projectId}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTask.title.trim(),
          assigned_to: newTask.assigned_to || null,
          due_date: newTask.due_date || null,
        }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Failed to create task'); return }
      setTasks(prev => [...prev, data.task])
      setNewTask({ title: '', assigned_to: '', due_date: '' })
      setCreating(false)
    } catch {
      setError('Failed to create task')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <h2 style={{ fontSize: '16px', fontWeight: 600, color: theme.text.primary, margin: 0 }}>Tasks</h2>
        <button onClick={() => setCreating(true)}
          style={{ padding: '7px 14px', background: theme.action.primary, color: '#fff', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 500, cursor: 'pointer' }}>
          + New task
        </button>
      </div>

      {error && (
        <div style={{ padding: '10px 14px', background: '#FEF2F2', color: '#DC2626', borderRadius: '8px', fontSize: '13px', marginBottom: '16px' }}>
          {error}
        </div>
      )}

      {/* New task form */}
      {creating && (
        <form onSubmit={createTask} style={{
          background: theme.bg.secondary,
          border: `1px solid ${theme.border.light}`,
          borderRadius: '12px',
          padding: '16px',
          marginBottom: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
        }}>
          <input
            autoFocus
            value={newTask.title}
            onChange={e => setNewTask(prev => ({ ...prev, title: e.target.value }))}
            placeholder="Task title..."
            required
            style={{ width: '100%', padding: '9px 13px', border: `1px solid ${theme.border.focus}`, borderRadius: '8px', fontSize: '14px', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }}
          />

          <div style={{ display: 'flex', gap: '10px' }}>
            {/* Assign to dropdown */}
            <select
              value={newTask.assigned_to}
              onChange={e => setNewTask(prev => ({ ...prev, assigned_to: e.target.value }))}
              style={{ flex: 1, padding: '9px 13px', border: `1px solid ${theme.border.light}`, borderRadius: '8px', fontSize: '14px', outline: 'none', fontFamily: 'inherit', background: theme.bg.card, color: theme.text.primary, cursor: 'pointer' }}
            >
              <option value="">Assign to... (optional)</option>
              {teamMembers?.map(tm => (
                <option key={tm.profiles?.id} value={tm.profiles?.id}>
                  {tm.profiles?.full_name} {tm.role_in_project ? `· ${tm.role_in_project}` : ''}
                </option>
              ))}
            </select>

            {/* Due date */}
            <input
              type="date"
              value={newTask.due_date}
              onChange={e => setNewTask(prev => ({ ...prev, due_date: e.target.value }))}
              style={{ padding: '9px 13px', border: `1px solid ${theme.border.light}`, borderRadius: '8px', fontSize: '14px', outline: 'none', fontFamily: 'inherit', background: theme.bg.card, color: theme.text.primary }}
            />
          </div>

          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
            <button type="button" onClick={() => { setCreating(false); setNewTask({ title: '', assigned_to: '', due_date: '' }) }}
              style={{ padding: '8px 14px', background: 'none', border: `1px solid ${theme.border.light}`, borderRadius: '8px', fontSize: '13px', cursor: 'pointer', color: theme.text.secondary }}>
              Cancel
            </button>
            <button type="submit" disabled={loading || !newTask.title.trim()}
              style={{ padding: '8px 16px', background: theme.action.primary, color: '#fff', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 500, cursor: 'pointer' }}>
              {loading ? 'Adding...' : 'Add task'}
            </button>
          </div>
        </form>
      )}

      {/* Columns */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
        {COLUMNS.map(col => (
          <div key={col.key} style={{ background: theme.bg.secondary, border: `1px solid ${theme.border.light}`, borderRadius: '14px', padding: '16px', minHeight: '200px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: col.color, flexShrink: 0 }} />
              <span style={{ fontSize: '13px', fontWeight: 600, color: theme.text.primary }}>{col.label}</span>
              <span style={{ marginLeft: 'auto', fontSize: '12px', color: theme.text.tertiary, background: theme.border.light, padding: '1px 7px', borderRadius: '10px' }}>
                {tasksByStatus[col.key].length}
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {tasksByStatus[col.key].length === 0 ? (
                <div style={{ textAlign: 'center', padding: '20px 0', fontSize: '13px', color: theme.text.tertiary }}>No tasks</div>
              ) : (
                tasksByStatus[col.key].map(task => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    currentStatus={col.key}
                    currentUserId={currentUserId}
                    isOwner={isOwner}
                    onStatusChange={updateTaskStatus}
                    onDelete={deleteTask}
                  />
                ))
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function TaskCard({ task, currentStatus, currentUserId, isOwner, onStatusChange, onDelete }) {
  const [showMenu, setShowMenu] = useState(false)
  const canDelete = isOwner || task.assigned_to === currentUserId
  const nextStatuses = COLUMNS.filter(c => c.key !== currentStatus)

  return (
    <div style={{ background: theme.bg.card, border: `1px solid ${theme.border.light}`, borderRadius: '10px', padding: '12px 14px', position: 'relative' }}>
      <p style={{ fontSize: '13px', fontWeight: 500, color: theme.text.primary, margin: '0 0 6px', lineHeight: 1.5, paddingRight: '24px' }}>
        {task.title}
      </p>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center' }}>
        {task.profiles && (
          <span style={{ fontSize: '11px', color: theme.text.secondary, background: theme.bg.indigoSoft, padding: '2px 8px', borderRadius: '6px' }}>
            👤 {task.profiles.full_name}
          </span>
        )}
        {task.due_date && (
          <span style={{ fontSize: '11px', color: theme.text.tertiary, background: theme.bg.hover, padding: '2px 8px', borderRadius: '6px' }}>
            📅 {new Date(task.due_date).toLocaleDateString()}
          </span>
        )}
      </div>

      <button onClick={() => setShowMenu(!showMenu)}
        style={{ position: 'absolute', top: '10px', right: '10px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px', color: theme.text.tertiary, padding: '2px 4px', lineHeight: 1 }}>
        ···
      </button>

      {showMenu && (
        <div style={{ position: 'absolute', top: '32px', right: '8px', background: theme.bg.card, border: `1px solid ${theme.border.light}`, borderRadius: '10px', boxShadow: '0 4px 16px rgba(0,0,0,0.1)', zIndex: 10, minWidth: '150px', overflow: 'hidden' }}>
          {nextStatuses.map(s => (
            <button key={s.key} onClick={() => { onStatusChange(task.id, s.key); setShowMenu(false) }}
              style={{ display: 'block', width: '100%', padding: '9px 14px', background: 'none', border: 'none', textAlign: 'left', fontSize: '13px', color: theme.text.primary, cursor: 'pointer' }}
              onMouseEnter={e => e.target.style.background = theme.bg.hover}
              onMouseLeave={e => e.target.style.background = 'none'}>
              Move to {s.label}
            </button>
          ))}
          {canDelete && (
            <button onClick={() => { onDelete(task.id); setShowMenu(false) }}
              style={{ display: 'block', width: '100%', padding: '9px 14px', background: 'none', border: 'none', borderTop: `1px solid ${theme.border.light}`, textAlign: 'left', fontSize: '13px', color: '#DC2626', cursor: 'pointer' }}
              onMouseEnter={e => e.target.style.background = '#FEF2F2'}
              onMouseLeave={e => e.target.style.background = 'none'}>
              Delete task
            </button>
          )}
        </div>
      )}
    </div>
  )
}