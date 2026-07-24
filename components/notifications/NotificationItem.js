'use client'

import { useRouter } from 'next/navigation'
import { theme } from '@/constants/colors'

const typeColors = {
  job_match: { bg: theme.bg.indigoSoft, border: theme.border.indigo, icon: '🚀', accent: theme.text.indigo },
  application: { bg: theme.bg.emeraldSoft, border: '#D1FAE5', icon: '📋', accent: theme.text.emerald },
  skill_gap: { bg: theme.bg.amberSoft, border: '#FEF3C7', icon: '🎯', accent: theme.text.amber },
  profile_view: { bg: '#F0F9FF', border: '#BAE6FD', icon: '👁', accent: '#0284C7' },
  general: { bg: theme.bg.card, border: theme.border.light, icon: '🔔', accent: theme.text.secondary },
}

function timeAgo(dateStr) {
  const now = Date.now()
  const then = new Date(dateStr).getTime()
  const diff = Math.floor((now - then) / 1000)
  if (diff < 60) return 'Just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`
  return new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

export default function NotificationItem({ notification, onRead, onDelete }) {
  const router = useRouter()
  const typeStyle = typeColors[notification.type] || typeColors.general
  const isUnread = !notification.is_read

  function handleClick() {
    if (isUnread && onRead) onRead(notification.id)
    if (notification.action_url) {
      router.push(notification.action_url)
    }
  }

  return (
    <div
      onClick={handleClick}
      role="link"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleClick() } }}
      style={{
        padding: '14px 16px',
        borderBottom: `1px solid ${theme.border.light}`,
        background: isUnread ? typeStyle.bg : theme.bg.card,
        cursor: 'pointer',
        transition: 'background 0.15s ease, transform 0.15s ease',
        display: 'flex',
        gap: '12px',
        alignItems: 'flex-start',
        transformOrigin: 'center',
      }}
      onMouseEnter={e => { e.currentTarget.style.background = theme.bg.hover; e.currentTarget.style.transform = 'scale(1.005)' }}
      onMouseLeave={e => { e.currentTarget.style.background = isUnread ? typeStyle.bg : theme.bg.card; e.currentTarget.style.transform = 'scale(1)' }}
    >
      <div style={{
        width: '36px',
        height: '36px',
        borderRadius: '10px',
        background: isUnread ? typeStyle.accent : theme.bg.hover,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '16px',
        flexShrink: 0,
        transition: 'background 0.15s',
      }}>
        {typeStyle.icon}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
          <span style={{
            fontSize: '13px',
            fontWeight: isUnread ? 600 : 500,
            color: theme.text.primary,
            lineHeight: '1.3',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            flex: 1,
          }}>
            {notification.title}
          </span>
          {isUnread && (
            <div style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: theme.action.primary,
              flexShrink: 0,
            }} />
          )}
        </div>
        <p style={{
          fontSize: '12px',
          color: theme.text.secondary,
          margin: 0,
          lineHeight: '1.4',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
        }}>
          {notification.message}
        </p>
        <span style={{
          fontSize: '11px',
          color: theme.text.tertiary,
          marginTop: '4px',
          display: 'block',
        }}>
          {timeAgo(notification.created_at)}
        </span>
      </div>

      {onDelete && (
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(notification.id) }}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: theme.text.tertiary,
            fontSize: '14px',
            padding: '4px',
            borderRadius: '4px',
            lineHeight: 1,
            flexShrink: 0,
            transition: 'color 0.15s, background 0.15s',
          }}
          onMouseEnter={e => { e.target.style.color = theme.text.red; e.target.style.background = 'rgba(239,68,68,0.08)' }}
          onMouseLeave={e => { e.target.style.color = theme.text.tertiary; e.target.style.background = 'none' }}
          title="Dismiss"
        >
          ✕
        </button>
      )}
    </div>
  )
}
