'use client'

import { useState } from 'react'
import { theme } from '@/constants/colors'

export default function MarkCompleteButton({ projectId }) {
  const [loading, setLoading] = useState(false)

  async function handleClick() {
    if (!confirm('Mark this project as complete? This will notify all team members to confirm.')) return
    setLoading(true)
    try {
      const res = await fetch(`/api/projects/${projectId}/complete`, {
        method: 'POST',
      })
      const data = await res.json()
      if (res.ok) {
        alert(data.message)
        window.location.reload()
      } else {
        alert(data.error || 'Something went wrong')
      }
    } catch {
      alert('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      style={{
        padding: '10px 20px',
        background: theme.score.high,
        color: '#fff',
        border: 'none',
        borderRadius: '10px',
        fontSize: '14px',
        fontWeight: 600,
        cursor: loading ? 'not-allowed' : 'pointer',
      }}
    >
      {loading ? 'Processing...' : '✅ Mark as complete'}
    </button>
  )
}