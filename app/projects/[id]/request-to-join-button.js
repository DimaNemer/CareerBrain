'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

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
        className="mt-4 rounded-lg bg-green-600 px-3 py-2 text-sm text-white hover:bg-green-700"
      >
        Request to Join
      </button>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4 space-y-3">
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
        className="w-full rounded-lg border border-gray-300 px-3 py-2"
      />

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-green-600 px-3 py-2 text-sm text-white hover:bg-green-700 disabled:opacity-60"
        >
          {loading ? 'Sending...' : 'Send Request'}
        </button>

        <button
          type="button"
          onClick={() => setShowForm(false)}
          className="rounded-lg bg-gray-200 px-3 py-2 text-sm text-gray-800 hover:bg-gray-300"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}