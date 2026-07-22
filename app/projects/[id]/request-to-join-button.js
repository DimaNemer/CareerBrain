'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Send, UserPlus, X } from 'lucide-react'

export default function RequestToJoinButton({ projectId, roleId }) {
  const router = useRouter()

  const [message, setMessage] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    const response = await fetch('/api/join-requests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        project_id: projectId,
        project_role_id: roleId,
        message,
      }),
    })

    const result = await response.json()

    if (!response.ok) {
      setError(result.error || 'Failed to send request')
      setLoading(false)
      return
    }

    setSuccess('Request sent successfully.')
    setMessage('')
    setShowForm(false)
    setLoading(false)
    router.refresh()
  }

  if (!showForm) {
    return (
      <button
        onClick={() => setShowForm(true)}
        className="mt-4 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"
      >
        <UserPlus size={16} />
        Request to Join
      </button>
    )
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-4 space-y-3 rounded-xl border border-emerald-100 bg-white p-4"
    >
      {error && (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {success && (
        <div className="rounded-md bg-green-50 p-3 text-sm text-green-600">
          {success}
        </div>
      )}

      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Write a short message to the project owner..."
        rows="3"
        className="w-full resize-none rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
      />

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
        >
          <Send size={14} />
          {loading ? 'Sending...' : 'Send Request'}
        </button>

        <button
          type="button"
          onClick={() => setShowForm(false)}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
        >
          <X size={14} />
          Cancel
        </button>
      </div>
    </form>
  )
}
