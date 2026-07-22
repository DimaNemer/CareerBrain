// 'use client'

// import { useState } from 'react'
// import { theme } from '@/constants/colors'

// export default function MarkCompleteButton({ projectId }) {
//   const [loading, setLoading] = useState(false)

//   async function handleClick() {
//     if (!confirm('Mark this project as complete? This will notify all team members to confirm.')) return
//     setLoading(true)
//     try {
//       const res = await fetch(`/api/projects/${projectId}/complete`, {
//         method: 'POST',
//       })
//       const data = await res.json()
//       if (res.ok) {
//         alert(data.message)
//         window.location.reload()
//       } else {
//         alert(data.error || 'Something went wrong')
//       }
//     } catch {
//       alert('Something went wrong')
//     } finally {
//       setLoading(false)
//     }
//   }

//   return (
//     <button
//       onClick={handleClick}
//       disabled={loading}
//       style={{
//         padding: '10px 20px',
//         background: theme.score.high,
//         color: '#fff',
//         border: 'none',
//         borderRadius: '10px',
//         fontSize: '14px',
//         fontWeight: 600,
//         cursor: loading ? 'not-allowed' : 'pointer',
//       }}
//     >
//       {loading ? 'Processing...' : '✅ Mark as complete'}
//     </button>
//   )
// }
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { theme } from '@/constants/colors'

export default function MarkCompleteButton({
  projectId,
}) {
  const router = useRouter()
  const [loading, setLoading] =
    useState(false)

  async function handleClick() {
    const confirmed = window.confirm(
      'Mark this project as complete? Completed projects will appear on team members’ profiles.'
    )

    if (!confirmed) return

    setLoading(true)

    try {
      const response = await fetch(
        `/api/projects/${projectId}/complete`,
        {
          method: 'POST',
        }
      )

      const data = await response.json()

      if (!response.ok) {
        alert(
          data.error ||
            'Failed to complete project'
        )
        return
      }

      alert(
        data.message ||
          'Project marked as complete'
      )

      router.refresh()

      /*
       * Ensures server data is reloaded immediately.
       */
      window.location.reload()
    } catch (error) {
      console.error(
        'Mark project complete error:',
        error
      )

      alert(
        'Something went wrong while completing the project'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      style={{
        padding: '10px 20px',
        background: loading
          ? '#94A3B8'
          : theme.score.high,
        color: '#FFFFFF',
        border: 'none',
        borderRadius: '10px',
        fontSize: '14px',
        fontWeight: 600,
        cursor: loading
          ? 'not-allowed'
          : 'pointer',
        opacity: loading ? 0.8 : 1,
      }}
    >
      {loading
        ? 'Completing...'
        : '✅ Mark as complete'}
    </button>
  )
}