'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { LogOut, UserMinus } from 'lucide-react'

export default function MemberActions({
  memberId,
  isOwner,
  isCurrentUser,
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleAction(action) {
    const confirmed = window.confirm(
      action === 'leave'
        ? 'Are you sure you want to leave this project?'
        : 'Are you sure you want to remove this member?'
    )

    if (!confirmed) return

    setLoading(true)

    const response = await fetch(`/api/project-members/${memberId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ action }),
    })

    const result = await response.json()

    if (!response.ok) {
      alert(result.error || 'Something went wrong')
      setLoading(false)
      return
    }

    router.refresh()
  }

  return (
    <div className="mt-4 flex gap-2 border-t border-slate-100 pt-4">
      {isCurrentUser && (
        <button
          onClick={() => handleAction('leave')}
          disabled={loading}
          className="inline-flex items-center gap-1.5 rounded-lg bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700 hover:bg-amber-100 disabled:opacity-60"
        >
          <LogOut size={13} />
          {loading ? 'Leaving...' : 'Leave Project'}
        </button>
      )}

      {isOwner && !isCurrentUser && (
        <button
          onClick={() => handleAction('remove')}
          disabled={loading}
          className="inline-flex items-center gap-1.5 rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-100 disabled:opacity-60"
        >
          <UserMinus size={13} />
          {loading ? 'Removing...' : 'Remove Member'}
        </button>
      )}
    </div>
  )
}
