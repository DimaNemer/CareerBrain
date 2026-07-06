'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Trash2 } from 'lucide-react'

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
      className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-2.5 text-sm font-semibold text-red-600 shadow-sm transition hover:bg-red-50 disabled:opacity-60"
    >
      <Trash2 size={16} />
      {loading ? 'Deleting...' : 'Delete Project'}
    </button>
  )
}
