// 'use client'

// import { useState, useEffect } from 'react'
// import { useRouter } from 'next/navigation'
// import { theme } from '@/constants/colors'

// export default function ProfileEditPage() {
//   const router = useRouter()
//   const [loading, setLoading] = useState(true)
//   const [saving, setSaving] = useState(false)
//   const [error, setError] = useState('')
//   const [success, setSuccess] = useState('')
//   const [form, setForm] = useState({
//     full_name: '',
//     username: '',
//     headline: '',
//     bio: '',
//     education_level: '',
//     university: '',
//     graduation_year: '',
//     github_url: '',
//     linkedin_url: '',
//     portfolio_url: '',
//   })

//   useEffect(() => {
//     async function fetchProfile() {
//       const res = await fetch('/api/profile')
//       const data = await res.json()
//       if (data.profile) {
//         setForm({
//           full_name: data.profile.full_name || '',
//           username: data.profile.username || '',
//           headline: data.profile.headline || '',
//           bio: data.profile.bio || '',
//           education_level: data.profile.education_level || '',
//           university: data.profile.university || '',
//           graduation_year: data.profile.graduation_year || '',
//           github_url: data.profile.github_url || '',
//           linkedin_url: data.profile.linkedin_url || '',
//           portfolio_url: data.profile.portfolio_url || '',
//         })
//       }
//       setLoading(false)
//     }
//     fetchProfile()
//   }, [])

//   function handleChange(e) {
//     setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
//     setError('')
//     setSuccess('')
//   }

//   async function handleSubmit(e) {
//     e.preventDefault()
//     setSaving(true)
//     setError('')
//     setSuccess('')

//     try {
//       const res = await fetch('/api/profile', {
//         method: 'PUT',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify(form),
//       })

//       const data = await res.json()
//       if (!res.ok) {
//         setError(data.error || 'Failed to save')
//         return
//       }

//       setSuccess('Profile saved successfully')
//       setTimeout(() => router.push('/profile'), 1200)
//     } catch {
//       setError('Something went wrong. Please try again.')
//     } finally {
//       setSaving(false)
//     }
//   }

//   if (loading) {
//     return (
//       <div style={{
//         minHeight: '60vh',
//         display: 'flex',
//         alignItems: 'center',
//         justifyContent: 'center',
//         color: theme.text.secondary,
//         fontSize: '14px',
//       }}>
//         Loading your profile...
//       </div>
//     )
//   }

//   return (
//     <main style={{
//       maxWidth: '680px',
//       margin: '0 auto',
//       padding: '48px 24px',
//     }}>
//       {/* Header */}
//       <div style={{ marginBottom: '32px' }}>
//         <h1 style={{
//           fontSize: '24px',
//           fontWeight: 700,
//           color: theme.text.primary,
//           margin: '0 0 6px',
//           letterSpacing: '-0.4px',
//         }}>
//           Edit profile
//         </h1>
//         <p style={{
//           fontSize: '14px',
//           color: theme.text.secondary,
//           margin: 0,
//         }}>
//           Keep your profile accurate so your match scores stay correct.
//         </p>
//       </div>

//       {error && (
//         <div style={{
//           background: theme.bg.redSoft,
//           border: `1px solid ${theme.border.light}`,
//           color: theme.text.red,
//           padding: '12px 16px',
//           borderRadius: '10px',
//           fontSize: '14px',
//           marginBottom: '20px',
//         }}>
//           {error}
//         </div>
//       )}

//       {success && (
//         <div style={{
//           background: theme.bg.emeraldSoft,
//           border: `1px solid ${theme.border.light}`,
//           color: theme.text.emerald,
//           padding: '12px 16px',
//           borderRadius: '10px',
//           fontSize: '14px',
//           marginBottom: '20px',
//         }}>
//           {success}
//         </div>
//       )}

//       <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

//         {/* Basic info */}
//         <Section title="Basic info">
//           <Row>
//             <Field label="Full name" name="full_name" value={form.full_name} onChange={handleChange} placeholder="Dima Nemer" required />
//             <Field label="Username" name="username" value={form.username} onChange={handleChange} placeholder="dimanemer" required />
//           </Row>
//           <Field label="Headline" name="headline" value={form.headline} onChange={handleChange} placeholder="Junior Full-Stack Developer" />
//           <TextArea label="Bio" name="bio" value={form.bio} onChange={handleChange} placeholder="Tell the world a bit about yourself..." rows={3} />
//         </Section>

//         {/* Education */}
//         <Section title="Education">
//           <Row>
//             <Field label="University" name="university" value={form.university} onChange={handleChange} placeholder="e.g. Lebanese University" />
//             <Field label="Graduation year" name="graduation_year" type="number" value={form.graduation_year} onChange={handleChange} placeholder="2024" />
//           </Row>
//           <div>
//             <label style={labelStyle}>Education level</label>
//             <select
//               name="education_level"
//               value={form.education_level}
//               onChange={handleChange}
//               style={{ ...inputStyle, cursor: 'pointer' }}
//             >
//               <option value="">Select level</option>
//               <option value="High School">High School</option>
//               <option value="Bachelor">Bachelor</option>
//               <option value="Master">Master</option>
//               <option value="PhD">PhD</option>
//               <option value="Bootcamp">Bootcamp</option>
//               <option value="Self-taught">Self-taught</option>
//             </select>
//           </div>
//         </Section>

//         {/* Links */}
//         <Section title="Links">
//           <Field label="GitHub URL" name="github_url" type="url" value={form.github_url} onChange={handleChange} placeholder="https://github.com/username" />
//           <Field label="LinkedIn URL" name="linkedin_url" type="url" value={form.linkedin_url} onChange={handleChange} placeholder="https://linkedin.com/in/username" />
//           <Field label="Portfolio URL" name="portfolio_url" type="url" value={form.portfolio_url} onChange={handleChange} placeholder="https://yoursite.com" />
//         </Section>

//         {/* Actions */}
//         <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
//           <button
//             type="button"
//             onClick={() => router.push('/profile')}
//             style={{
//               padding: '10px 20px',
//               background: 'none',
//               border: `1px solid ${theme.border.light}`,
//               borderRadius: '10px',
//               fontSize: '14px',
//               fontWeight: 500,
//               color: theme.text.secondary,
//               cursor: 'pointer',
//             }}
//           >
//             Cancel
//           </button>
//           <button
//             type="submit"
//             disabled={saving}
//             style={{
//               padding: '10px 24px',
//               background: saving ? theme.border.medium : theme.action.primary,
//               border: 'none',
//               borderRadius: '10px',
//               fontSize: '14px',
//               fontWeight: 600,
//               color: theme.action.primaryText,
//               cursor: saving ? 'not-allowed' : 'pointer',
//             }}
//           >
//             {saving ? 'Saving...' : 'Save changes'}
//           </button>
//         </div>
//       </form>
//     </main>
//   )
// }

// // ── Sub-components ───────────────────────────────

// const labelStyle = {
//   display: 'block',
//   fontSize: '13px',
//   fontWeight: 500,
//   color: theme.text.primary,
//   marginBottom: '6px',
// }

// const inputStyle = {
//   width: '100%',
//   padding: '10px 14px',
//   background: theme.bg.card,
//   border: `1px solid ${theme.border.light}`,
//   borderRadius: '10px',
//   fontSize: '14px',
//   color: theme.text.primary,
//   outline: 'none',
//   boxSizing: 'border-box',
//   fontFamily: 'inherit',
// }

// function Section({ title, children }) {
//   return (
//     <div style={{
//       background: theme.bg.card,
//       border: `1px solid ${theme.border.light}`,
//       borderRadius: '16px',
//       padding: '24px',
//       display: 'flex',
//       flexDirection: 'column',
//       gap: '14px',
//     }}>
//       <h2 style={{
//         fontSize: '14px',
//         fontWeight: 600,
//         color: theme.text.primary,
//         margin: '0 0 4px',
//         textTransform: 'uppercase',
//         letterSpacing: '0.5px',
//       }}>
//         {title}
//       </h2>
//       {children}
//     </div>
//   )
// }

// function Row({ children }) {
//   return (
//     <div style={{ display: 'flex', gap: '12px' }}>
//       {children}
//     </div>
//   )
// }

// function Field({ label, name, type = 'text', value, onChange, placeholder, required }) {
//   return (
//     <div style={{ flex: 1 }}>
//       <label style={labelStyle}>{label}</label>
//       <input
//         name={name}
//         type={type}
//         value={value}
//         onChange={onChange}
//         placeholder={placeholder}
//         required={required}
//         style={inputStyle}
//         onFocus={e => e.target.style.borderColor = theme.border.focus}
//         onBlur={e => e.target.style.borderColor = theme.border.light}
//       />
//     </div>
//   )
// }

// function TextArea({ label, name, value, onChange, placeholder, rows }) {
//   return (
//     <div>
//       <label style={labelStyle}>{label}</label>
//       <textarea
//         name={name}
//         value={value}
//         onChange={onChange}
//         placeholder={placeholder}
//         rows={rows}
//         style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6 }}
//         onFocus={e => e.target.style.borderColor = theme.border.focus}
//         onBlur={e => e.target.style.borderColor = theme.border.light}
//       />
//     </div>
//   )
// }

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { theme } from '@/constants/colors'

export default function ProfileEditPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [form, setForm] = useState({
    full_name: '',
    username: '',
    headline: '',
    bio: '',
    education_level: '',
    university: '',
    graduation_year: '',
    github_url: '',
    linkedin_url: '',
    portfolio_url: '',
  })

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/profile')
        if (!res.ok) {
          router.push('/login')
          return
        }
        const data = await res.json()
        if (data.profile) {
          setForm({
            full_name: data.profile.full_name || '',
            username: data.profile.username || '',
            headline: data.profile.headline || '',
            bio: data.profile.bio || '',
            education_level: data.profile.education_level || '',
            university: data.profile.university || '',
            graduation_year: data.profile.graduation_year || '',
            github_url: data.profile.github_url || '',
            linkedin_url: data.profile.linkedin_url || '',
            portfolio_url: data.profile.portfolio_url || '',
          })
        }
      } catch {
        setError('Failed to load profile')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [router])

  function handleChange(e) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
    setError('')
    setSuccess('')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSuccess('')

    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Failed to save')
        return
      }

      setSuccess('Profile saved')
      setTimeout(() => router.push('/profile'), 1000)
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div style={{
        minHeight: '60vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '14px',
        color: theme.text.secondary,
      }}>
        Loading...
      </div>
    )
  }

  return (
    <main style={{
      maxWidth: '640px',
      margin: '0 auto',
      padding: '48px 24px',
    }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{
          fontSize: '24px',
          fontWeight: 700,
          color: theme.text.primary,
          margin: '0 0 6px',
          letterSpacing: '-0.4px',
        }}>
          Edit profile
        </h1>
        <p style={{
          fontSize: '14px',
          color: theme.text.secondary,
          margin: 0,
        }}>
          Keep your profile accurate so your match scores stay correct.
        </p>
      </div>

      {error && <Alert type="error" message={error} />}
      {success && <Alert type="success" message={success} />}

      <form onSubmit={handleSubmit} style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
      }}>
        {/* Basic */}
        <Card title="Basic info">
          <Row>
            <Field label="Full name" name="full_name" value={form.full_name} onChange={handleChange} placeholder="Dima Nemer" required autoComplete="name" />
            <Field label="Username" name="username" value={form.username} onChange={handleChange} placeholder="dimanemer" required autoComplete="username" />
          </Row>
          <Field label="Headline" name="headline" value={form.headline} onChange={handleChange} placeholder="Junior Full-Stack Developer" />
          <TextareaField label="Bio" name="bio" value={form.bio} onChange={handleChange} placeholder="A short intro about yourself..." />
        </Card>

        {/* Education */}
        <Card title="Education">
          <Row>
            <Field label="University" name="university" value={form.university} onChange={handleChange} placeholder="Lebanese University" />
            <Field label="Graduation year" name="graduation_year" type="number" value={form.graduation_year} onChange={handleChange} placeholder="2024" />
          </Row>
          <SelectField
            label="Education level"
            name="education_level"
            value={form.education_level}
            onChange={handleChange}
            options={['Bachelor', 'Master', 'PhD', 'Bootcamp', 'Self-taught', 'High School']}
          />
        </Card>

        {/* Links */}
        <Card title="Links">
          <Field label="GitHub" name="github_url" type="url" value={form.github_url} onChange={handleChange} placeholder="https://github.com/username" />
          <Field label="LinkedIn" name="linkedin_url" type="url" value={form.linkedin_url} onChange={handleChange} placeholder="https://linkedin.com/in/username" />
          <Field label="Portfolio" name="portfolio_url" type="url" value={form.portfolio_url} onChange={handleChange} placeholder="https://yoursite.com" />
        </Card>

        {/* Actions */}
        <div style={{
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '12px',
        }}>
          <button
            type="button"
            onClick={() => router.push('/profile')}
            style={{
              padding: '10px 20px',
              background: 'none',
              border: `1px solid ${theme.border.light}`,
              borderRadius: '10px',
              fontSize: '14px',
              fontWeight: 500,
              color: theme.text.secondary,
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            style={{
              padding: '10px 24px',
              background: saving ? theme.border.medium : theme.action.primary,
              border: 'none',
              borderRadius: '10px',
              fontSize: '14px',
              fontWeight: 600,
              color: '#fff',
              cursor: saving ? 'not-allowed' : 'pointer',
            }}
          >
            {saving ? 'Saving...' : 'Save changes'}
          </button>
        </div>
      </form>
    </main>
  )
}

// ── Sub-components ─────────────────────────────────

function Alert({ type, message }) {
  const isError = type === 'error'
  return (
    <div style={{
      padding: '12px 16px',
      borderRadius: '10px',
      fontSize: '14px',
      marginBottom: '16px',
      background: isError ? '#FEF2F2' : '#ECFDF5',
      color: isError ? '#DC2626' : '#059669',
      border: `1px solid ${isError ? '#FEE2E2' : '#D1FAE5'}`,
    }}>
      {message}
    </div>
  )
}

function Card({ title, children }) {
  return (
    <div style={{
      background: theme.bg.card,
      border: `1px solid ${theme.border.light}`,
      borderRadius: '16px',
      padding: '24px',
      display: 'flex',
      flexDirection: 'column',
      gap: '14px',
    }}>
      <h2 style={{
        fontSize: '12px',
        fontWeight: 600,
        color: theme.text.secondary,
        margin: 0,
        textTransform: 'uppercase',
        letterSpacing: '0.6px',
      }}>
        {title}
      </h2>
      {children}
    </div>
  )
}

function Row({ children }) {
  return (
    <div style={{ display: 'flex', gap: '12px' }}>
      {children}
    </div>
  )
}

const labelStyle = {
  display: 'block',
  fontSize: '13px',
  fontWeight: 500,
  color: '#334155',
  marginBottom: '6px',
}

const inputStyle = {
  width: '100%',
  padding: '9px 13px',
  background: '#F8FAFC',
  border: '1px solid #E2E8F0',
  borderRadius: '10px',
  fontSize: '14px',
  color: '#0F172A',
  outline: 'none',
  boxSizing: 'border-box',
  fontFamily: 'inherit',
  transition: 'border-color 0.15s',
}

function Field({ label, name, type = 'text', value, onChange, placeholder, required, autoComplete }) {
  return (
    <div style={{ flex: 1 }}>
      <label style={labelStyle}>{label}</label>
      <input
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        autoComplete={autoComplete}
        style={inputStyle}
        onFocus={e => e.target.style.borderColor = '#6366F1'}
        onBlur={e => e.target.style.borderColor = '#E2E8F0'}
      />
    </div>
  )
}

function TextareaField({ label, name, value, onChange, placeholder }) {
  return (
    <div>
      <label style={labelStyle}>{label}</label>
      <textarea
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        rows={3}
        style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6 }}
        onFocus={e => e.target.style.borderColor = '#6366F1'}
        onBlur={e => e.target.style.borderColor = '#E2E8F0'}
      />
    </div>
  )
}

function SelectField({ label, name, value, onChange, options }) {
  return (
    <div>
      <label style={labelStyle}>{label}</label>
      <select
        name={name}
        value={value}
        onChange={onChange}
        style={{ ...inputStyle, cursor: 'pointer' }}
        onFocus={e => e.target.style.borderColor = '#6366F1'}
        onBlur={e => e.target.style.borderColor = '#E2E8F0'}
      >
        <option value="">Select level</option>
        {options.map(opt => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
    </div>
  )
}