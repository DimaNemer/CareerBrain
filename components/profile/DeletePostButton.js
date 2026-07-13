'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function DeletePostButton({
  postId,
}) {
  const router = useRouter()

  const [deleting, setDeleting] =
    useState(false)

  const [error, setError] = useState('')

  async function handleDelete() {
    const confirmed = window.confirm(
      'Are you sure you want to delete this post?'
    )

    if (!confirmed) return

    setDeleting(true)
    setError('')

    try {
      const response = await fetch(
        `/api/profile/posts?postId=${encodeURIComponent(postId)}`,
        {
          method: 'DELETE',
        }
      )

      const data = await response.json()

      if (!response.ok) {
        setError(
          data.error ||
            'Failed to delete post'
        )
        return
      }

      router.refresh()
    } catch {
      setError('Failed to delete post')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div style={{ textAlign: 'right' }}>
      <button
        type="button"
        onClick={handleDelete}
        disabled={deleting}
        style={{
          border: 'none',
          background: 'transparent',
          color: '#DC2626',
          cursor: deleting
            ? 'not-allowed'
            : 'pointer',
          fontSize: '11px',
          padding: '4px 6px',
          opacity: deleting ? 0.6 : 1,
        }}
      >
        {deleting
          ? 'Deleting...'
          : 'Delete'}
      </button>

      {error && (
        <div
          style={{
            color: '#DC2626',
            fontSize: '10px',
            marginTop: '3px',
          }}
        >
          {error}
        </div>
      )}
    </div>
  )
}