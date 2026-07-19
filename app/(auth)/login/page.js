// 'use client'

// import { useState } from 'react'
// import { useRouter } from 'next/navigation'
// import Link from 'next/link'
// import { theme } from '@/constants/colors'

// export default function LoginPage() {
//   const router = useRouter()
//   const [loading, setLoading] = useState(false)
//   const [error, setError] = useState('')
//   const [form, setForm] = useState({ email: '', password: '' })

//   function handleChange(e) {
//     setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
//     setError('')
//   }

//   async function handleSubmit(e) {
//     e.preventDefault()
//     setLoading(true)
//     setError('')

//     try {
//       const res = await fetch('/api/auth/login', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify(form),
//       })

//       const data = await res.json()
//       if (!res.ok) {
//         setError(data.error || 'Login failed')
//         return
//       }

//       router.push('/dashboard')
//       router.refresh()
//     } catch {
//       setError('Something went wrong. Please try again.')
//     } finally {
//       setLoading(false)
//     }
//   }

//   return (
//     <div style={{
//       minHeight: '100vh',
//       background: theme.bg.primary,
//       display: 'flex',
//       alignItems: 'center',
//       justifyContent: 'center',
//       padding: '24px',
//       position: 'relative',
//       overflow: 'hidden',
//     }}>
//       <div className="orb orb-indigo" />
//       <div className="orb orb-emerald" />

//       <div style={{
//         width: '100%',
//         maxWidth: '400px',
//         position: 'relative',
//         zIndex: 1,
//       }}>
//         {/* Header */}
//         <div style={{ textAlign: 'center', marginBottom: '32px' }}>
//           <div style={{
//             width: '48px',
//             height: '48px',
//             background: theme.action.primary,
//             borderRadius: '12px',
//             display: 'flex',
//             alignItems: 'center',
//             justifyContent: 'center',
//             fontSize: '24px',
//             margin: '0 auto 16px',
//           }}>
//             🧠
//           </div>
//           <h1 style={{
//             fontSize: '24px',
//             fontWeight: 700,
//             color: theme.text.inverse,
//             margin: '0 0 8px',
//             letterSpacing: '-0.4px',
//           }}>
//             Welcome back
//           </h1>
//           <p style={{
//             fontSize: '14px',
//             color: theme.text.tertiary,
//             margin: 0,
//           }}>
//             Dont have an account?{' '}
//             <Link href="/signup" style={{
//               color: '#818CF8',
//               textDecoration: 'none',
//               fontWeight: 500,
//             }}>
//               Sign up free
//             </Link>
//           </p>
//         </div>

//         {/* Card */}
//         <div style={{
//           background: 'rgba(255,255,255,0.05)',
//           backdropFilter: 'blur(12px)',
//           border: '1px solid rgba(255,255,255,0.1)',
//           borderRadius: '20px',
//           padding: '32px',
//         }}>
//           {error && (
//             <div style={{
//               background: 'rgba(239,68,68,0.1)',
//               border: '1px solid rgba(239,68,68,0.2)',
//               color: '#FCA5A5',
//               padding: '12px 16px',
//               borderRadius: '10px',
//               fontSize: '14px',
//               marginBottom: '20px',
//             }}>
//               {error}
//             </div>
//           )}

//           <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
//             <div>
//               <label style={{
//                 display: 'block',
//                 fontSize: '13px',
//                 fontWeight: 500,
//                 color: 'rgba(255,255,255,0.7)',
//                 marginBottom: '6px',
//               }}>
//                 Email
//               </label>
//               <input
//                 name="email"
//                 type="email"
//                 required
//                 value={form.email}
//                 onChange={handleChange}
//                 placeholder="you@example.com"
//                 style={{
//                   width: '100%',
//                   padding: '10px 14px',
//                   background: 'rgba(255,255,255,0.07)',
//                   border: '1px solid rgba(255,255,255,0.12)',
//                   borderRadius: '10px',
//                   fontSize: '14px',
//                   color: theme.text.inverse,
//                   outline: 'none',
//                   boxSizing: 'border-box',
//                 }}
//                 onFocus={e => e.target.style.borderColor = 'rgba(99,102,241,0.6)'}
//                 onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.12)'}
//               />
//             </div>

//             <div>
//               <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
//                 <label style={{
//                   fontSize: '13px',
//                   fontWeight: 500,
//                   color: 'rgba(255,255,255,0.7)',
//                 }}>
//                   Password
//                 </label>
//                 <Link href="/forgot-password" style={{
//                   fontSize: '13px',
//                   color: '#818CF8',
//                   textDecoration: 'none',
//                 }}>
//                   Forgot password?
//                 </Link>
//               </div>
//               <input
//                 name="password"
//                 type="password"
//                 required
//                 value={form.password}
//                 onChange={handleChange}
//                 placeholder="Your password"
//                 style={{
//                   width: '100%',
//                   padding: '10px 14px',
//                   background: 'rgba(255,255,255,0.07)',
//                   border: '1px solid rgba(255,255,255,0.12)',
//                   borderRadius: '10px',
//                   fontSize: '14px',
//                   color: theme.text.inverse,
//                   outline: 'none',
//                   boxSizing: 'border-box',
//                 }}
//                 onFocus={e => e.target.style.borderColor = 'rgba(99,102,241,0.6)'}
//                 onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.12)'}
//               />
//             </div>

//             <button
//               type="submit"
//               disabled={loading}
//               style={{
//                 marginTop: '4px',
//                 width: '100%',
//                 padding: '12px',
//                 background: loading ? theme.border.medium : theme.action.primary,
//                 color: theme.action.primaryText,
//                 border: 'none',
//                 borderRadius: '10px',
//                 fontSize: '15px',
//                 fontWeight: 600,
//                 cursor: loading ? 'not-allowed' : 'pointer',
//                 letterSpacing: '-0.1px',
//               }}
//             >
//               {loading ? 'Logging in...' : 'Log in'}
//             </button>
//           </form>
//         </div>
//       </div>
//     </div>
//   )
// }
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function LoginPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [form, setForm] = useState({ email: '', password: '' })

  function handleChange(e) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
    setError('')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })

      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Login failed'); return }

      router.push('/dashboard')
      router.refresh()
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0A0F1E 0%, #0D1528 50%, #0A0F1E 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      position: 'relative',
      overflow: 'hidden',
      fontFamily: 'Inter, system-ui, sans-serif',
    }}>
      {/* Background orbs */}
      <div style={{
        position: 'absolute', width: '600px', height: '600px',
        borderRadius: '50%', background: 'rgba(91,79,232,0.08)',
        filter: 'blur(80px)', top: '-200px', right: '-100px',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', width: '400px', height: '400px',
        borderRadius: '50%', background: 'rgba(11,173,114,0.05)',
        filter: 'blur(80px)', bottom: '-100px', left: '-100px',
        pointerEvents: 'none',
      }} />

      <div style={{ width: '100%', maxWidth: '420px', position: 'relative', zIndex: 1 }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '36px' }}>
          <div style={{
            width: '56px', height: '56px',
            background: 'linear-gradient(135deg, #5B4FE8, #818CF8)',
            borderRadius: '16px',
            display: 'flex', alignItems: 'center',
            justifyContent: 'center',
            fontSize: '28px', margin: '0 auto 20px',
            boxShadow: '0 8px 24px rgba(91,79,232,0.4)',
          }}>
            🧠
          </div>
          <h1 style={{
            fontSize: '28px', fontWeight: 800,
            color: '#fff', margin: '0 0 8px',
            letterSpacing: '-0.5px',
          }}>
            Welcome back
          </h1>
          <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.45)', margin: 0 }}>
            Do not have an account?{' '}
            <Link href="/signup" style={{ color: '#818CF8', textDecoration: 'none', fontWeight: 600 }}>
              Sign up free
            </Link>
          </p>
        </div>

        {/* Card */}
        <div style={{
          background: 'rgba(255,255,255,0.04)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '24px',
          padding: '32px',
        }}>

          {error && (
            <div style={{
              background: 'rgba(239,68,68,0.12)',
              border: '1px solid rgba(239,68,68,0.25)',
              color: '#FCA5A5',
              padding: '12px 16px',
              borderRadius: '12px',
              fontSize: '14px',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}>
              ⚠️ {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>

            {/* Email */}
            <div>
              <label style={{
                display: 'block', fontSize: '13px', fontWeight: 600,
                color: 'rgba(255,255,255,0.7)', marginBottom: '8px',
                letterSpacing: '0.2px',
              }}>
                Email
              </label>
              <input
                name="email"
                type="email"
                required
                value={form.email}
                onChange={handleChange}
                placeholder="you@example.com"
                autoComplete="email"
                style={{
                  width: '100%',
                  padding: '13px 16px',
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '12px',
                  fontSize: '15px',
                  color: '#fff',
                  outline: 'none',
                  boxSizing: 'border-box',
                  fontFamily: 'inherit',
                  transition: 'border-color 0.2s, background 0.2s',
                }}
                onFocus={e => {
                  e.target.style.borderColor = 'rgba(91,79,232,0.6)'
                  e.target.style.background = 'rgba(255,255,255,0.08)'
                }}
                onBlur={e => {
                  e.target.style.borderColor = 'rgba(255,255,255,0.1)'
                  e.target.style.background = 'rgba(255,255,255,0.06)'
                }}
              />
            </div>

            {/* Password */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <label style={{
                  fontSize: '13px', fontWeight: 600,
                  color: 'rgba(255,255,255,0.7)',
                  letterSpacing: '0.2px',
                }}>
                  Password
                </label>
                <Link href="/forgot-password" style={{
                  fontSize: '13px', color: '#818CF8',
                  textDecoration: 'none', fontWeight: 500,
                }}>
                  Forgot password?
                </Link>
              </div>
              <div style={{ position: 'relative' }}>
                <input
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Your password"
                  autoComplete="current-password"
                  style={{
                    width: '100%',
                    padding: '13px 48px 13px 16px',
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '12px',
                    fontSize: '15px',
                    color: '#fff',
                    outline: 'none',
                    boxSizing: 'border-box',
                    fontFamily: 'inherit',
                  }}
                  onFocus={e => {
                    e.target.style.borderColor = 'rgba(91,79,232,0.6)'
                    e.target.style.background = 'rgba(255,255,255,0.08)'
                  }}
                  onBlur={e => {
                    e.target.style.borderColor = 'rgba(255,255,255,0.1)'
                    e.target.style.background = 'rgba(255,255,255,0.06)'
                  }}
                />
                {/* Show/hide toggle */}
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '14px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '18px',
                    color: 'rgba(255,255,255,0.4)',
                    padding: '0',
                    lineHeight: 1,
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                marginTop: '4px',
                width: '100%',
                padding: '14px',
                background: loading
                  ? 'rgba(91,79,232,0.4)'
                  : 'linear-gradient(135deg, #5B4FE8, #7C3AED)',
                border: 'none',
                borderRadius: '12px',
                fontSize: '15px',
                fontWeight: 700,
                color: '#fff',
                cursor: loading ? 'not-allowed' : 'pointer',
                letterSpacing: '0.1px',
                boxShadow: loading ? 'none' : '0 4px 16px rgba(91,79,232,0.4)',
                transition: 'opacity 0.15s',
                fontFamily: 'inherit',
              }}
            >
              {loading ? 'Logging in...' : 'Log in'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}