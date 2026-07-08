
'use client'

import { useState, useEffect, useRef } from 'react'
import { theme } from '@/constants/colors'

const FILE_ICONS = {
  'image/png': '🖼️',
  'image/jpeg': '🖼️',
  'image/gif': '🖼️',
  'image/webp': '🖼️',
  'application/pdf': '📄',
  'application/zip': '🗜️',
  'text/plain': '📝',
  'application/json': '⚙️',
  'text/markdown': '📝',
}

const CATEGORIES = [
  'General',
  'Documentation',
  'Development',
  'Design',
  'Meeting Notes',
  'Research',
  'Assets',
]
function getCategoryLabel(category) {
  const labels = {
    General: '📌 General',
    Documentation: '📄 Documentation',
    Development: '💻 Development',
    Design: '🎨 Design',
    'Meeting Notes': '📋 Meeting Notes',
    Research: '🔬 Research',
    Assets: '📦 Assets',
  }

  return labels[category] || '📌 General'
}
function getFileIcon(type) {
  return FILE_ICONS[type] || '📎'
}

function formatSize(bytes) {
  if (!bytes) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function isImage(type) {
  return type?.startsWith('image/')
}

export default function FilePanel({ projectId, currentUserId, isOwner }) {
  const [files, setFiles] = useState([])
  const [notes, setNotes] = useState([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [creatingNote, setCreatingNote] = useState(false)
  const [showNoteForm, setShowNoteForm] = useState(false)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('All')
  const [error, setError] = useState('')
  const [selectedNote, setSelectedNote] = useState(null)
const [newNote, setNewNote] = useState({
  title: '',
  content: '',
  category: 'General',
})

  const fileInputRef = useRef(null)

  useEffect(() => {
    async function loadData() {
      try {
        const [filesRes, notesRes] = await Promise.all([
          fetch(`/api/projects/${projectId}/files`),
          fetch(`/api/projects/${projectId}/notes`),
        ])

        const filesData = await filesRes.json()
        const notesData = await notesRes.json()

        if (filesRes.ok) setFiles(filesData.files || [])
        if (notesRes.ok) setNotes(notesData.notes || [])
      } catch {
        setError('Failed to load files and notes')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [projectId])

  async function handleUpload(e) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    setError('')

    const formData = new FormData()
    formData.append('file', file)

    try {
      const res = await fetch(`/api/projects/${projectId}/files`, {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Upload failed')
        return
      }

      setFiles(prev => [data.file, ...prev])
    } catch {
      setError('Upload failed')
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  async function createNote(e) {
    e.preventDefault()

    if (!newNote.title.trim()) return

    setCreatingNote(true)
    setError('')

    try {
      const res = await fetch(`/api/projects/${projectId}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newNote),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Failed to create note')
        return
      }

      setNotes(prev => [data.note, ...prev])
      setNewNote({ title: '', content: '', category: 'General' })
      setShowNoteForm(false)
    } catch {
      setError('Failed to create note')
    } finally {
      setCreatingNote(false)
    }
  }

  async function deleteNote(noteId) {
    if (!confirm('Delete this note?')) return

    setNotes(prev => prev.filter(n => n.id !== noteId))

    try {
      await fetch(`/api/projects/${projectId}/notes?noteId=${noteId}`, {
        method: 'DELETE',
      })
    } catch {
      setError('Failed to delete note')
    }
  }

  async function handleDelete(fileId) {
    if (!confirm('Delete this file?')) return

    setFiles(prev => prev.filter(f => f.id !== fileId))

    try {
      await fetch(`/api/projects/${projectId}/files?fileId=${fileId}`, {
        method: 'DELETE',
      })
    } catch {
      setError('Failed to delete file')
    }
  }

  const filteredNotes = notes.filter(note => {
    const matchesSearch =
      note.title?.toLowerCase().includes(search.toLowerCase()) ||
      note.content?.toLowerCase().includes(search.toLowerCase())

    const matchesCategory = category === 'All' || note.category === category

    return matchesSearch && matchesCategory
  })

  const filteredFiles = files.filter(file => {
    const matchesSearch = file.file_name?.toLowerCase().includes(search.toLowerCase())
    const matchesCategory = category === 'All' || file.category === category

    return matchesSearch && matchesCategory
  })

  const hasContent = filteredFiles.length > 0 || filteredNotes.length > 0

  return (
    <div style={{ padding: '8px 0' }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '18px',
        gap: '16px',
        flexWrap: 'wrap',
      }}>
        <div>
          <h3 style={{ fontSize: '15px', fontWeight: 600, color: theme.text.primary, margin: '0 0 4px' }}>
            Files & Notes
          </h3>
          <p style={{ fontSize: '13px', color: theme.text.secondary, margin: 0 }}>
            Upload assets or create quick notes for your team.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => setShowNoteForm(prev => !prev)}
            style={{
              padding: '8px 14px',
              background: theme.bg.card,
              color: theme.text.primary,
              border: `1px solid ${theme.border.light}`,
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            + Quick note
          </button>

          <input
            ref={fileInputRef}
            type="file"
            onChange={handleUpload}
            style={{ display: 'none' }}
            accept="image/*,.pdf,.zip,.txt,.json,.md"
          />

          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            style={{
              padding: '8px 16px',
              background: theme.action.primary,
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: 500,
              cursor: uploading ? 'not-allowed' : 'pointer',
            }}
          >
            {uploading ? 'Uploading...' : '+ Upload file'}
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap' }}>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search files and notes..."
          style={{
            flex: 1,
            minWidth: '220px',
            padding: '9px 12px',
            border: `1px solid ${theme.border.light}`,
            borderRadius: '8px',
            fontSize: '13px',
            outline: 'none',
          }}
        />

      <select
  value={category}
  onChange={e => setCategory(e.target.value)}
  style={{
    padding: '9px 12px',
    border: `1px solid ${theme.border.light}`,
    borderRadius: '8px',
    fontSize: '13px',
    background: theme.bg.card,
  }}
>
  <option value="All">All</option>
  {CATEGORIES.map(cat => (
    <option key={cat} value={cat}>
      {getCategoryLabel(cat)}
    </option>
  ))}
</select>
      </div>

      {showNoteForm && (
        <form onSubmit={createNote} style={{
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
            value={newNote.title}
            onChange={e => setNewNote(prev => ({ ...prev, title: e.target.value }))}
            placeholder="Note title..."
            required
            style={{
              padding: '9px 12px',
              border: `1px solid ${theme.border.light}`,
              borderRadius: '8px',
              fontSize: '13px',
              outline: 'none',
            }}
          />

          <textarea
            value={newNote.content}
            onChange={e => setNewNote(prev => ({ ...prev, content: e.target.value }))}
            placeholder="Write your note..."
            rows={5}
            style={{
              padding: '9px 12px',
              border: `1px solid ${theme.border.light}`,
              borderRadius: '8px',
              fontSize: '13px',
              outline: 'none',
              resize: 'vertical',
              fontFamily: 'inherit',
            }}
          />

        <select
  value={newNote.category}
  onChange={e => setNewNote(prev => ({ ...prev, category: e.target.value }))}
  style={{
    padding: '9px 12px',
    border: `1px solid ${theme.border.light}`,
    borderRadius: '8px',
    fontSize: '13px',
    background: theme.bg.card,
  }}
>
  {CATEGORIES.map(cat => (
    <option key={cat} value={cat}>
      {getCategoryLabel(cat)}
    </option>
  ))}
</select>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
            <button
              type="button"
              onClick={() => setShowNoteForm(false)}
              style={{
                padding: '8px 14px',
                background: 'none',
                border: `1px solid ${theme.border.light}`,
                borderRadius: '8px',
                fontSize: '13px',
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={creatingNote || !newNote.title.trim()}
              style={{
                padding: '8px 16px',
                background: theme.action.primary,
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 500,
                cursor: creatingNote ? 'not-allowed' : 'pointer',
              }}
            >
              {creatingNote ? 'Saving...' : 'Save note'}
            </button>
          </div>
        </form>
      )}

      {error && (
        <div style={{ padding: '10px 14px', background: '#FEF2F2', color: '#DC2626', borderRadius: '8px', fontSize: '13px', marginBottom: '16px' }}>
          {error}
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', color: theme.text.tertiary, fontSize: '13px', padding: '40px 0' }}>
          Loading files and notes...
        </div>
      ) : !hasContent ? (
        <div style={{ textAlign: 'center', padding: '48px 0', color: theme.text.tertiary }}>
          <div style={{ fontSize: '40px', marginBottom: '12px' }}>📁</div>
          <p style={{ fontSize: '14px', margin: 0 }}>No files or notes yet.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {filteredNotes.map(note => (
            <div key={`note-${note.id}`} style={{
              padding: '14px 16px',
              background: theme.bg.secondary,
              border: `1px solid ${theme.border.light}`,
              borderRadius: '12px',
            }}>
              <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '8px',
                  background: theme.bg.indigoSoft,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '24px',
                  flexShrink: 0,
                }}>
                  📝
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: theme.text.primary, marginBottom: '4px' }}>
                    {note.is_pinned ? '📌 ' : ''}{note.title}
                  </div>

                  {note.content && (
  <p style={{
    fontSize: '13px',
    color: theme.text.secondary,
    margin: '0 0 8px',
    lineHeight: 1.6,
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
  }}>
    {note.content}
  </p>
)}

                  <div style={{ fontSize: '12px', color: theme.text.tertiary }}>
                    {note.profiles?.full_name || 'Unknown'} · {getCategoryLabel(note.category)} · {new Date(note.updated_at || note.created_at).toLocaleDateString()}
                  </div>
                </div>
<button
  onClick={() => setSelectedNote(note)}
  style={{
    padding: '6px 10px',
    background: theme.bg.card,
    border: `1px solid ${theme.border.light}`,
    borderRadius: '8px',
    fontSize: '12px',
    color: theme.text.primary,
    cursor: 'pointer',
  }}
>
  View
</button>
                <button
                  onClick={() => deleteNote(note.id)}
                  style={{
                    padding: '6px 10px',
                    background: 'none',
                    border: `1px solid ${theme.border.light}`,
                    borderRadius: '8px',
                    fontSize: '12px',
                    color: '#DC2626',
                    cursor: 'pointer',
                  }}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}

          {filteredFiles.map(file => (
            <div key={`file-${file.id}`} style={{
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
              padding: '14px 16px',
              background: theme.bg.secondary,
              border: `1px solid ${theme.border.light}`,
              borderRadius: '12px',
            }}>
              {isImage(file.file_type) ? (
                <img
                  src={file.file_url}
                  alt={file.file_name}
                  style={{
                    width: '48px',
                    height: '48px',
                    objectFit: 'cover',
                    borderRadius: '8px',
                    flexShrink: 0,
                    border: `1px solid ${theme.border.light}`,
                  }}
                />
              ) : (
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '8px',
                  background: theme.bg.indigoSoft,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '24px',
                  flexShrink: 0,
                }}>
                  {getFileIcon(file.file_type)}
                </div>
              )}

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: '14px',
                  fontWeight: 500,
                  color: theme.text.primary,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  marginBottom: '3px',
                }}>
                  {file.is_pinned ? '📌 ' : ''}{file.file_name}
                </div>

                <div style={{ fontSize: '12px', color: theme.text.secondary }}>
                  {file.profiles?.full_name} · {file.category || 'Docs'} · {formatSize(file.file_size)} · {new Date(file.uploaded_at).toLocaleDateString()}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                <a
                  href={file.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    padding: '6px 12px',
                    background: theme.bg.card,
                    border: `1px solid ${theme.border.light}`,
                    borderRadius: '8px',
                    fontSize: '12px',
                    color: theme.text.primary,
                    textDecoration: 'none',
                    fontWeight: 500,
                  }}
                >
                  View ↗
                </a>

                {(isOwner || file.profiles?.id === currentUserId) && (
                  <button
                    onClick={() => handleDelete(file.id)}
                    style={{
                      padding: '6px 10px',
                      background: 'none',
                      border: `1px solid ${theme.border.light}`,
                      borderRadius: '8px',
                      fontSize: '12px',
                      color: '#DC2626',
                      cursor: 'pointer',
                    }}
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      {selectedNote && (
  <div style={{
    position: 'fixed',
    inset: 0,
    background: 'rgba(15, 23, 42, 0.45)',
    zIndex: 1000,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px',
  }}>
    <div style={{
      width: '100%',
      maxWidth: '720px',
      maxHeight: '80vh',
      overflow: 'auto',
      background: theme.bg.card,
      borderRadius: '16px',
      padding: '24px',
      border: `1px solid ${theme.border.light}`,
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        gap: '16px',
        marginBottom: '16px',
      }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '18px', color: theme.text.primary }}>
            {selectedNote.title}
          </h3>
          <p style={{ margin: '6px 0 0', fontSize: '12px', color: theme.text.tertiary }}>
            {selectedNote.profiles?.full_name || 'Unknown'} · {selectedNote.category || 'General'}
          </p>
        </div>

        <button
          onClick={() => setSelectedNote(null)}
          style={{
            background: 'none',
            border: `1px solid ${theme.border.light}`,
            borderRadius: '8px',
            padding: '6px 10px',
            cursor: 'pointer',
          }}
        >
          Close
        </button>
      </div>

      <div style={{
        whiteSpace: 'pre-wrap',
        lineHeight: 1.7,
        fontSize: '14px',
        color: theme.text.secondary,
      }}>
        {selectedNote.content || 'No content.'}
      </div>
    </div>
  </div>
)}
    </div>
  )
}