'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { theme } from '@/constants/colors'

export default function UserSearch() {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState(-1)
  const inputRef = useRef(null)
  const dropdownRef = useRef(null)
  const abortRef = useRef(null)

  const search = useCallback(async (q) => {
    if (abortRef.current) abortRef.current.abort()
    if (!q || q.length < 2) { setResults([]); return }

    const controller = new AbortController()
    abortRef.current = controller

    setLoading(true)
    try {
      const res = await fetch(`/api/users/search?q=${encodeURIComponent(q)}&limit=8`, { signal: controller.signal })
      if (res.ok) {
        const data = await res.json()
        setResults(data.users || [])
      }
    } catch (err) {
      if (err.name !== 'AbortError') setResults([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => search(query), 300)
    return () => clearTimeout(timer)
  }, [query, search])

  useEffect(() => {
    const handleClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false)
        setSelected(-1)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const navigateTo = (userId) => {
    setOpen(false)
    setQuery('')
    setResults([])
    setSelected(-1)
    router.push(`/profile/${userId}`)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelected(prev => Math.min(prev + 1, results.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelected(prev => Math.max(prev - 1, -1))
    } else if (e.key === 'Enter' && selected >= 0) {
      e.preventDefault()
      navigateTo(results[selected].id)
    } else if (e.key === 'Escape') {
      setOpen(false)
      setSelected(-1)
      inputRef.current?.blur()
    }
  }

  const showDropdown = open && query.length >= 2

  return (
    <div ref={dropdownRef} style={{ position: 'relative' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '6px 12px',
          borderRadius: '8px',
          border: `1.5px solid ${open ? theme.action.primary : theme.border.light}`,
          background: theme.bg.hover,
          transition: 'border-color 0.2s, box-shadow 0.2s',
          boxShadow: open ? `0 0 0 3px rgba(91,79,232,0.1)` : 'none',
        }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={theme.text.tertiary} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); setSelected(-1) }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="Search people..."
          style={{
            border: 'none',
            background: 'transparent',
            outline: 'none',
            fontSize: '13px',
            color: theme.text.primary,
            width: '140px',
            fontWeight: 500,
          }}
        />
        {query && (
          <button
            onClick={() => { setQuery(''); setResults([]); setSelected(-1); inputRef.current?.focus() }}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: theme.text.tertiary,
              padding: '2px',
              lineHeight: 1,
              display: 'flex',
            }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        )}
      </div>

      {showDropdown && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            left: 0,
            right: 0,
            minWidth: '320px',
            background: '#FFFFFF',
            border: `1px solid ${theme.border.light}`,
            borderRadius: '14px',
            boxShadow: '0 20px 50px rgba(0,0,0,0.15)',
            overflow: 'hidden',
            zIndex: 100,
          }}
        >
          {loading && results.length === 0 ? (
            <div style={{ padding: '20px', textAlign: 'center', color: theme.text.tertiary, fontSize: '13px' }}>
              Searching...
            </div>
          ) : results.length === 0 ? (
            <div style={{ padding: '24px', textAlign: 'center' }}>
              <div style={{ fontSize: '28px', marginBottom: '8px' }}>🔍</div>
              <div style={{ color: theme.text.tertiary, fontSize: '13px' }}>No users found for "{query}"</div>
            </div>
          ) : (
            <div style={{ padding: '6px' }}>
              {results.map((user, i) => {
                const initials = user.full_name?.split(' ').filter(Boolean).map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?'
                return (
                  <div
                    key={user.id}
                    onClick={() => navigateTo(user.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '10px 12px',
                      borderRadius: '10px',
                      cursor: 'pointer',
                      background: i === selected ? theme.bg.hover : 'transparent',
                      transition: 'background 0.1s',
                    }}
                    onMouseEnter={() => setSelected(i)}
                    onMouseLeave={() => setSelected(-1)}
                  >
                    <div style={{
                      width: '38px',
                      height: '38px',
                      borderRadius: '50%',
                      overflow: 'hidden',
                      flexShrink: 0,
                      background: user.avatar_url ? 'transparent' : `linear-gradient(135deg, ${theme.action.primary}, #818CF8)`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                      {user.avatar_url ? (
                        <img src={user.avatar_url} alt={user.full_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <span style={{ fontSize: '13px', fontWeight: 700, color: '#fff' }}>{initials}</span>
                      )}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '14px', fontWeight: 600, color: theme.text.primary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {user.full_name || 'Unknown'}
                      </div>
                      <div style={{ fontSize: '12px', color: theme.text.tertiary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {user.headline || `@${user.username || 'user'}`}
                      </div>
                    </div>
                    {user.readiness_score > 0 && (
                      <span style={{
                        fontSize: '11px',
                        fontWeight: 700,
                        color: user.readiness_score >= 70 ? '#059669' : '#D97706',
                        background: user.readiness_score >= 70 ? '#ECFDF5' : '#FFFBEB',
                        padding: '3px 8px',
                        borderRadius: '20px',
                        flexShrink: 0,
                      }}>
                        {user.readiness_score}%
                      </span>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
