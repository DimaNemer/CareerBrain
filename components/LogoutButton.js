'use client'

import { theme } from '@/constants/colors'

export default function LogoutButton() {
  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    window.location.replace('/login')
  }

  return (
    <button
      onClick={handleLogout}
      style={{
        fontSize: '14px',
        color: theme.text.secondary,
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        padding: '6px 12px',
        borderRadius: '8px',
        transition: 'color 0.15s, background 0.15s',
      }}
      onMouseEnter={e => {
        e.target.style.color = theme.text.primary
        e.target.style.background = theme.bg.hover
      }}
      onMouseLeave={e => {
        e.target.style.color = theme.text.secondary
        e.target.style.background = 'none'
      }}
    >
      Log out
    </button>
  )
}
