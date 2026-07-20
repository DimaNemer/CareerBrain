// 'use client'

// import { theme } from '@/constants/colors'

// export default function CopyButton({ text }) {
//   return (
//     <button
//       onClick={() => navigator.clipboard.writeText(text)}
//       style={{
//         fontSize: '11px',
//         padding: '2px 8px',
//         background: theme.action.primary,
//         color: '#fff',
//         border: 'none',
//         borderRadius: '4px',
//         cursor: 'pointer',
//       }}
//     >
//       Copy
//     </button>
//   )
// }

'use client'

import { useState } from 'react'
import { theme } from '@/constants/colors'

export default function CopyButton({ text }) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text)

      setCopied(true)

      window.setTimeout(() => {
        setCopied(false)
      }, 1500)
    } catch {
      setCopied(false)
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      style={{
        fontSize: '11px',
        padding: '5px 9px',
        background: copied
          ? '#059669'
          : theme.action.primary,
        color: '#FFFFFF',
        border: 'none',
        borderRadius: '6px',
        cursor: 'pointer',
        fontWeight: 600,
        whiteSpace: 'nowrap',
      }}
    >
      {copied ? 'Copied' : 'Copy'}
    </button>
  )
}