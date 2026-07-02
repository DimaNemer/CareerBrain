'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function JoinRequestActions({ requestId }) {
  const router = useRouter()

  const [loading, setLoading] = useState(false)

  async function updateRequest(action) {
    setLoading(true)

    const response = await fetch(`/api/join-requests/${requestId}`, {
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
      <button
        disabled={loading}
        onClick={() => updateRequest('accept')}
        className="rounded-lg bg-green-600 px-3 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
      >
        Accept
      </button>

      <button
        disabled={loading}
        onClick={() => updateRequest('reject')}
        className="rounded-lg bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
      >
        Reject
      </button>
    </div>
  )
}