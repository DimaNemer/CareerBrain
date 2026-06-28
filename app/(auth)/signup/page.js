// 'use client'

// import { useState } from 'react'
// import { useRouter } from 'next/navigation'
// import Link from 'next/link'
// import { theme } from '@/constants/colors'

// export default function SignupPage() {
//   const router = useRouter()
//   const [loading, setLoading] = useState(false)
//   const [error, setError] = useState('')
//   const [form, setForm] = useState({
//     full_name: '',
//     username: '',
//     email: '',
//     password: '',
//     confirm_password: '',
//   })

//   function handleChange(e) {
//     setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
//     setError('')
//   }

//   async function handleSubmit(e) {
//     e.preventDefault()
//     setError('')

//     if (form.password !== form.confirm_password) {
//       setError('Passwords do not match')
//       return
//     }
//     if (form.password.length < 8) {
//       setError('Password must be at least 8 characters')
//       return
//     }

//     setLoading(true)
//     try {
//       const res = await fetch('/api/auth/signup', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({
//           full_name: form.full_name,
//           username: form.username,
//           email: form.email,
//           password: form.password,
//         }),
//       })

//       const data = await res.json()
//       if (!res.ok) {
//         setError(data.error || 'Signup failed')
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
//       {/* Atmospheric orbs */}
//       <div className="orb orb-indigo" />
//       <div className="orb orb-emerald" />

//       <div style={{
//         width: '100%',
//         maxWidth: '440px',
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
//             Create your account
//           </h1>
//           <p style={{
//             fontSize: '14px',
//             color: theme.text.tertiary,
//             margin: 0,
//           }}>
//             Already have an account?{' '}
//             <Link href="/login" style={{
//               color: theme.indigo?.[400] || '#818CF8',
//               textDecoration: 'none',
//               fontWeight: 500,
//             }}>
//               Log in
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
//               background: theme.bg.redSoft,
//               border: `1px solid ${theme.border.light}`,
//               color: theme.text.red,
//               padding: '12px 16px',
//               borderRadius: '10px',
//               fontSize: '14px',
//               marginBottom: '20px',
//             }}>
//               {error}
//             </div>
//           )}

//           <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
//             {/* Full name + username row */}
//             <div style={{ display: 'flex', gap: '12px' }}>
//               <Field
//                 label="Full name"
//                 name="full_name"
//                 type="text"
//                 value={form.full_name}
//                 onChange={handleChange}
//                 placeholder="Dima Nemer"
//                 required
//               />
//               <Field
//                 label="Username"
//                 name="username"
//                 type="text"
//                 value={form.username}
//                 onChange={handleChange}
//                 placeholder="dimanemer"
//                 required
//               />
//             </div>

//             <Field
//               label="Email"
//               name="email"
//               type="email"
//               value={form.email}
//               onChange={handleChange}
//               placeholder="dima@example.com"
//               required
//             />

//             <Field
//               label="Password"
//               name="password"
//               type="password"
//               value={form.password}
//               onChange={handleChange}
//               placeholder="Min. 8 characters"
//               required
//             />

//             <Field
//               label="Confirm password"
//               name="confirm_password"
//               type="password"
//               value={form.confirm_password}
//               onChange={handleChange}
//               placeholder="Repeat password"
//               required
//             />

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
//                 transition: 'opacity 0.15s',
//                 letterSpacing: '-0.1px',
//               }}
//             >
//               {loading ? 'Creating account...' : 'Create account'}
//             </button>
//           </form>

//           <p style={{
//             fontSize: '12px',
//             color: theme.text.tertiary,
//             textAlign: 'center',
//             marginTop: '20px',
//             marginBottom: 0,
//             lineHeight: 1.6,
//           }}>
//             By creating an account you agree to our{' '}
//             <span style={{ color: theme.text.secondary }}>Terms of Service</span>
//             {' '}and{' '}
//             <span style={{ color: theme.text.secondary }}>Privacy Policy</span>
//           </p>
//         </div>
//       </div>
//     </div>
//   )
// }

// function Field({ label, name, type, value, onChange, placeholder, required }) {
//   return (
//     <div style={{ flex: 1 }}>
//       <label style={{
//         display: 'block',
//         fontSize: '13px',
//         fontWeight: 500,
//         color: 'rgba(255,255,255,0.7)',
//         marginBottom: '6px',
//       }}>
//         {label}
//       </label>
//       <input
//         name={name}
//         type={type}
//         value={value}
//         onChange={onChange}
//         placeholder={placeholder}
//         required={required}
//         style={{
//           width: '100%',
//           padding: '10px 14px',
//           background: 'rgba(255,255,255,0.07)',
//           border: '1px solid rgba(255,255,255,0.12)',
//           borderRadius: '10px',
//           fontSize: '14px',
//           color: theme.text.inverse,
//           outline: 'none',
//           transition: 'border-color 0.15s',
//           boxSizing: 'border-box',
//         }}
//         onFocus={e => e.target.style.borderColor = 'rgba(99,102,241,0.6)'}
//         onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.12)'}
//       />
//     </div>
//   )
// }

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { theme } from '@/constants/colors'

export default function SignupPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    full_name: '',
    username: '',
    email: '',
    password: '',
    confirm_password: '',
  })

  function handleChange(e) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
    setError('')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (form.password !== form.confirm_password) {
      setError('Passwords do not match')
      return
    }
    if (form.password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }
    if (!/\d/.test(form.password)) {
      setError('Password must contain at least one number')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: form.full_name.trim(),
          username: form.username.trim().toLowerCase(),
          email: form.email.trim().toLowerCase(),
          password: form.password,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Signup failed')
        return
      }

      // If email confirmation is required → go to confirm page
      if (data.requiresConfirmation) {
        router.push(`/confirm?email=${encodeURIComponent(data.email)}`)
        return
      }

      // If email confirmation is disabled → go straight to dashboard
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
      background: theme.bg.primary,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      position: 'relative',
      overflow: 'hidden',
    }}>
      <div className="orb orb-indigo" />
      <div className="orb orb-emerald" />

      <div style={{
        width: '100%',
        maxWidth: '440px',
        position: 'relative',
        zIndex: 1,
      }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{
            width: '48px',
            height: '48px',
            background: theme.action.primary,
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '24px',
            margin: '0 auto 16px',
          }}>
            🧠
          </div>
          <h1 style={{
            fontSize: '24px',
            fontWeight: 700,
            color: '#fff',
            margin: '0 0 8px',
            letterSpacing: '-0.4px',
          }}>
            Create your account
          </h1>
          <p style={{
            fontSize: '14px',
            color: 'rgba(255,255,255,0.45)',
            margin: 0,
          }}>
            Already have an account?{' '}
            <Link href="/login" style={{
              color: '#818CF8',
              textDecoration: 'none',
              fontWeight: 500,
            }}>
              Log in
            </Link>
          </p>
        </div>

        <div style={{
          background: 'rgba(255,255,255,0.05)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '20px',
          padding: '32px',
        }}>
          {error && (
            <div style={{
              background: 'rgba(239,68,68,0.1)',
              border: '1px solid rgba(239,68,68,0.2)',
              color: '#FCA5A5',
              padding: '12px 16px',
              borderRadius: '10px',
              fontSize: '14px',
              marginBottom: '20px',
            }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
          }}>
            <div style={{ display: 'flex', gap: '12px' }}>
              <InputField
                label="Full name"
                name="full_name"
                type="text"
                value={form.full_name}
                onChange={handleChange}
                placeholder="Dima Nemer"
                autoComplete="name"
                required
              />
              <InputField
                label="Username"
                name="username"
                type="text"
                value={form.username}
                onChange={handleChange}
                placeholder="dimanemer"
                autoComplete="username"
                required
              />
            </div>

            <InputField
              label="Email"
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              placeholder="you@example.com"
              autoComplete="email"
              required
            />

            <InputField
              label="Password"
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              placeholder="Min. 8 chars, at least 1 number"
              autoComplete="new-password"
              required
            />

            <InputField
              label="Confirm password"
              name="confirm_password"
              type="password"
              value={form.confirm_password}
              onChange={handleChange}
              placeholder="Repeat your password"
              autoComplete="new-password"
              required
            />

            <button
              type="submit"
              disabled={loading}
              style={{
                marginTop: '6px',
                width: '100%',
                padding: '12px',
                background: loading ? 'rgba(255,255,255,0.1)' : theme.action.primary,
                border: 'none',
                borderRadius: '10px',
                fontSize: '15px',
                fontWeight: 600,
                color: '#fff',
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
            >
              {loading ? 'Creating account...' : 'Create account'}
            </button>
          </form>

          <p style={{
            fontSize: '12px',
            color: 'rgba(255,255,255,0.25)',
            textAlign: 'center',
            marginTop: '20px',
            marginBottom: 0,
            lineHeight: 1.6,
          }}>
            By signing up you agree to our Terms of Service and Privacy Policy.
          </p>
        </div>
      </div>
    </div>
  )
}

function InputField({ label, name, type, value, onChange, placeholder, autoComplete, required }) {
  return (
    <div style={{ flex: 1 }}>
      <label style={{
        display: 'block',
        fontSize: '13px',
        fontWeight: 500,
        color: 'rgba(255,255,255,0.7)',
        marginBottom: '6px',
      }}>
        {label}
      </label>
      <input
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        autoComplete={autoComplete}
        required={required}
        style={{
          width: '100%',
          padding: '10px 14px',
          background: 'rgba(255,255,255,0.07)',
          border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: '10px',
          fontSize: '14px',
          color: '#fff',
          outline: 'none',
          boxSizing: 'border-box',
          fontFamily: 'inherit',
        }}
        onFocus={e => e.target.style.borderColor = 'rgba(99,102,241,0.6)'}
        onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.12)'}
      />
    </div>
  )
}