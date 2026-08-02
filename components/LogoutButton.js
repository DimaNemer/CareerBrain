'use client'

import { useRouter } from 'next/navigation'
import { LogOut } from 'lucide-react'
import { theme } from '@/constants/colors'

export default function LogoutButton({ variant = 'default' }) {
  const router = useRouter()

  async function handleLogout() {
    const response = await fetch('/api/auth/logout', { method: 'POST' })

    if (!response.ok) {
      return
    }

    router.replace('/')
    router.refresh()
  }

  if (variant === 'mobile') {
    return (
      <button
        onClick={handleLogout}
        className="flex w-full items-center gap-2 rounded-lg px-4 py-3 text-sm font-medium text-slate-600 transition-all duration-150 hover:bg-purple-50 active:scale-[0.97]"
      >
        <LogOut className="size-4 flex-shrink-0" />
        Log out
      </button>
    )
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
