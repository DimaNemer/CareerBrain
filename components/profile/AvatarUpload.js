// 'use client'

// import { useState, useRef } from 'react'
// import { theme } from '@/constants/colors'

// export default function AvatarUpload({ currentAvatarUrl, fullName }) {
//   const [avatarUrl, setAvatarUrl] = useState(currentAvatarUrl)
//   const [uploading, setUploading] = useState(false)
//   const [error, setError] = useState('')
//   const fileInputRef = useRef(null)

//   async function handleUpload(e) {
//     const file = e.target.files?.[0]
//     if (!file) return

//     setUploading(true)
//     setError('')

//     const formData = new FormData()
//     formData.append('avatar', file)

//     try {
//       const res = await fetch('/api/profile/avatar', {
//         method: 'POST',
//         body: formData,
//       })

//       const data = await res.json()

//       if (!res.ok) {
//         setError(data.error || 'Upload failed')
//         return
//       }

//       setAvatarUrl(data.avatar_url + '?t=' + Date.now())
//     } catch {
//       setError('Upload failed')
//     } finally {
//       setUploading(false)
//       if (fileInputRef.current) fileInputRef.current.value = ''
//     }
//   }

//   const initials = fullName?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?'

//   return (
//     <div style={{ position: 'relative', width: '88px', height: '88px' }}>
//       {/* Avatar */}
//       <div style={{
//         width: '88px',
//         height: '88px',
//         borderRadius: '50%',
//         border: '4px solid #fff',
//         overflow: 'hidden',
//         background: avatarUrl ? 'transparent' : `linear-gradient(135deg, ${theme.action.primary}, #818CF8)`,
//         display: 'flex',
//         alignItems: 'center',
//         justifyContent: 'center',
//         boxShadow: '0 2px 12px rgba(0,0,0,0.12)',
//       }}>
//         {avatarUrl ? (
//           <img
//             src={avatarUrl}
//             alt={fullName}
//             style={{ width: '100%', height: '100%', objectFit: 'cover' }}
//           />
//         ) : (
//           <span style={{ fontSize: '28px', fontWeight: 700, color: '#fff' }}>
//             {initials}
//           </span>
//         )}
//       </div>

//       {/* Upload button overlay */}
//       <button
//         onClick={() => fileInputRef.current?.click()}
//         disabled={uploading}
//         style={{
//           position: 'absolute',
//           bottom: '0',
//           right: '0',
//           width: '28px',
//           height: '28px',
//           borderRadius: '50%',
//           background: theme.action.primary,
//           border: '2px solid #fff',
//           display: 'flex',
//           alignItems: 'center',
//           justifyContent: 'center',
//           cursor: 'pointer',
//           fontSize: '14px',
//           boxShadow: '0 1px 4px rgba(0,0,0,0.15)',
//         }}
//       >
//         {uploading ? '⏳' : '📷'}
//       </button>

//       <input
//         ref={fileInputRef}
//         type="file"
//         accept="image/*"
//         onChange={handleUpload}
//         style={{ display: 'none' }}
//       />

//       {error && (
//         <div style={{
//           position: 'absolute',
//           top: '100%',
//           left: 0,
//           marginTop: '6px',
//           fontSize: '11px',
//           color: '#DC2626',
//           whiteSpace: 'nowrap',
//         }}>
//           {error}
//         </div>
//       )}
//     </div>
//   )
// }

'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { theme } from '@/constants/colors'

export default function AvatarUpload({
  currentAvatarUrl,
  fullName,
}) {
  const router = useRouter()

  const [avatarUrl, setAvatarUrl] =
    useState(currentAvatarUrl)

  const [uploading, setUploading] =
    useState(false)

  const [error, setError] = useState('')

  const fileInputRef = useRef(null)

  async function handleUpload(event) {
    const file = event.target.files?.[0]

    if (!file) return

    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/webp',
    ]

    if (!allowedTypes.includes(file.type)) {
      setError(
        'Please select a JPG, PNG, or WebP image'
      )
      event.target.value = ''
      return
    }

    if (file.size > 2 * 1024 * 1024) {
      setError('Image must be under 2MB')
      event.target.value = ''
      return
    }

    setUploading(true)
    setError('')

    const formData = new FormData()
    formData.append('avatar', file)

    try {
      const response = await fetch(
        '/api/profile/avatar',
        {
          method: 'POST',
          body: formData,
        }
      )

      const data = await response.json()

      if (!response.ok) {
        setError(
          data.error || 'Upload failed'
        )
        return
      }

      setAvatarUrl(
        `${data.avatar_url}?t=${Date.now()}`
      )

      router.refresh()
    } catch {
      setError('Upload failed')
    } finally {
      setUploading(false)

      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const initials =
    fullName
      ?.split(' ')
      .filter(Boolean)
      .map(name => name[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || '?'

  return (
    <div
      style={{
        position: 'relative',
        width: '104px',
      }}
    >
      <div
        style={{
          width: '104px',
          height: '104px',
          borderRadius: '24px',
          border:
            '4px solid rgba(255,255,255,0.16)',
          overflow: 'hidden',
          background: avatarUrl
            ? 'transparent'
            : `linear-gradient(135deg, ${theme.action.primary}, #818CF8)`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow:
            '0 8px 24px rgba(0,0,0,0.22)',
        }}
      >
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={fullName || 'Profile avatar'}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          />
        ) : (
          <span
            style={{
              fontSize: '31px',
              fontWeight: 800,
              color: '#FFFFFF',
            }}
          >
            {initials}
          </span>
        )}
      </div>

      <button
        type="button"
        aria-label="Upload profile image"
        onClick={() =>
          fileInputRef.current?.click()
        }
        disabled={uploading}
        style={{
          position: 'absolute',
          right: '-3px',
          bottom: '-3px',
          width: '32px',
          height: '32px',
          borderRadius: '50%',
          background: theme.action.primary,
          border: '3px solid #0A0F1E',
          color: '#FFFFFF',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: uploading
            ? 'not-allowed'
            : 'pointer',
          opacity: uploading ? 0.7 : 1,
          fontSize: '14px',
        }}
      >
        {uploading ? '…' : '📷'}
      </button>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleUpload}
        style={{ display: 'none' }}
      />

      {error && (
        <div
          style={{
            marginTop: '8px',
            fontSize: '11px',
            lineHeight: 1.4,
            color: '#FCA5A5',
            width: '180px',
          }}
        >
          {error}
        </div>
      )}
    </div>
  )
}