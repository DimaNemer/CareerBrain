'use client'

import { useState } from 'react'
import { theme } from '@/constants/colors'

export default function ConfirmCompleteButton({ projectId }) {
  const [loading, setLoading] = useState(false)

  async function handleConfirm() {
    setLoading(true)
    try {
      const res = await fetch(`/api/projects/${projectId}/complete`, {
        method: 'PUT',
      })
      const data = await res.json()
      alert(data.message)
      window.location.reload()
    } catch {
      alert('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      padding: '12px 16px',
      background: theme.bg.amberSoft,
      border: `1px solid ${theme.border.light}`,
      borderRadius: '12px',
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
    }}>
      <span style={{ fontSize: '13px', color: theme.text.amber }}>
        ⏳ Completion requested — waiting for team confirmation
      </span>
      <button
        onClick={handleConfirm}
        disabled={loading}
        style={{
          padding: '7px 14px',
          background: theme.score.medium,
          color: '#fff',
          border: 'none',
          borderRadius: '8px',
          fontSize: '13px',
          fontWeight: 500,
          cursor: 'pointer',
          whiteSpace: 'nowrap',
        }}
      >
        {loading ? '...' : 'Confirm'}
      </button>
    </div>
  )
}