'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

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
    <div className="mt-3 flex gap-2">
      {isCurrentUser && (
        <button
          onClick={() => handleAction('leave')}
          disabled={loading}
          className="rounded-lg bg-yellow-600 px-3 py-2 text-sm text-white hover:bg-yellow-700 disabled:opacity-60"
        >
          {loading ? 'Leaving...' : 'Leave Project'}
        </button>
      )}

      {isOwner && !isCurrentUser && (
        <button
          onClick={() => handleAction('remove')}
          disabled={loading}
          className="rounded-lg bg-red-600 px-3 py-2 text-sm text-white hover:bg-red-700 disabled:opacity-60"
        >
          {loading ? 'Removing...' : 'Remove Member'}
        </button>
      )}
    </div>
  )
}