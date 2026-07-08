'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Check, X } from 'lucide-react'

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
    <div className="mt-4 flex gap-2 border-t border-slate-100 pt-4">
      <button
        disabled={loading}
        onClick={() => updateRequest('accept')}
        className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
      >
        <Check size={14} />
        Accept
      </button>

      <button
        disabled={loading}
        onClick={() => updateRequest('reject')}
        className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
      >
        <X size={14} />
        Reject
      </button>
    </div>
  )
}
