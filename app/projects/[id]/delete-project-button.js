'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function DeleteProjectButton({ projectId }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleDelete() {
    const confirmed = window.confirm(
      'Are you sure you want to delete this project?'
    )

    if (!confirmed) return

    setLoading(true)

    const response = await fetch(`/api/projects/${projectId}`, {
      method: 'DELETE',
    })

    const result = await response.json()

    if (!response.ok) {
      alert(result.error || 'Failed to delete project.')
      setLoading(false)
      return
    }

    alert('Project deleted successfully.')

    router.push('/projects')
    router.refresh()
  }

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      className="rounded-lg bg-red-600 px-4 py-2 text-white hover:bg-red-700 disabled:opacity-60"
    >
      {loading ? 'Deleting...' : 'Delete Project'}
    </button>
  )
}