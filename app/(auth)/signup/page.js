
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function SignupPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [form, setForm] = useState({
    full_name: '', username: '', email: '', password: '', confirm_password: '', role: 'job_seeker',
company_name: '',
company_size: '',
company_industry: '',
company_location: '',
company_website: '',
  })

  function handleChange(e) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
    setError('')
  }

  function selectRole(role) {
  setForm(prev => ({
    ...prev,
    role,
    ...(role === 'job_seeker'
      ? {
          company_name: '',
          company_size: '',
          company_industry: '',
          company_location: '',
          company_website: '',
        }
      : {}),
  }))

  setError('')
}

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (form.password !== form.confirm_password) { setError('Passwords do not match'); return }
    if (form.password.length < 8) { setError('Password must be at least 8 characters'); return }
    if (!/\d/.test(form.password)) { setError('Password must contain at least one number'); return }

    if (form.role === 'employer' && !form.company_name.trim()) {
  setError('Company name is required for employer accounts')
  return
}

if (form.role === 'employer' && form.company_website.trim()) {
  try {
    const website = new URL(form.company_website.trim())

    if (
      website.protocol !== 'http:' &&
      website.protocol !== 'https:'
    ) {
      setError('Company website must start with http:// or https://')
      return
    }
  } catch {
    setError('Please enter a valid company website')
    return
  }
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
  role: form.role,

  company_name:
    form.role === 'employer'
      ? form.company_name.trim()
      : null,

  company_size:
    form.role === 'employer'
      ? form.company_size
      : null,

  company_industry:
    form.role === 'employer'
      ? form.company_industry.trim()
      : null,

  company_location:
    form.role === 'employer'
      ? form.company_location.trim()
      : null,

  company_website:
    form.role === 'employer'
      ? form.company_website.trim()
      : null,
}),
      })

      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Signup failed'); return }

      if (data.requiresConfirmation) {
        router.push(`/confirm?email=${encodeURIComponent(data.email)}`)
        return
      }

      router.push('/dashboard')
      router.refresh()
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Password strength
  function getStrength(pwd) {
    if (!pwd) return null
    if (pwd.length < 6) return { label: 'Too short', color: '#EF4444', width: '20%' }
    if (pwd.length < 8 || !/\d/.test(pwd)) return { label: 'Weak', color: '#F59E0B', width: '45%' }
    if (pwd.length >= 8 && /\d/.test(pwd) && /[A-Z]/.test(pwd)) return { label: 'Strong', color: '#10B981', width: '100%' }
    return { label: 'Good', color: '#0BAD72', width: '75%' }
  }

  const strength = getStrength(form.password)

  const inputStyle = {
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
  }

  function onFocus(e) {
    e.target.style.borderColor = 'rgba(91,79,232,0.6)'
    e.target.style.background = 'rgba(255,255,255,0.08)'
  }

  function onBlur(e) {
    e.target.style.borderColor = 'rgba(255,255,255,0.1)'
    e.target.style.background = 'rgba(255,255,255,0.06)'
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

      <div style={{ width: '100%', maxWidth: '480px', position: 'relative', zIndex: 1 }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
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
            Create your account
          </h1>
          <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.45)', margin: 0 }}>
            Already have an account?{' '}
            <Link href="/login" style={{ color: '#818CF8', textDecoration: 'none', fontWeight: 600 }}>
              Log in
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

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
{/* Account type */}
<div>
  <label style={labelStyle}>Account type</label>

  <div style={{ display: 'flex', gap: '12px' }}>
    <button
      type="button"
      onClick={() => selectRole('job_seeker')}
      aria-pressed={form.role === 'job_seeker'}
      style={roleCardStyle(form.role === 'job_seeker')}
    >
      <span style={{ fontSize: '22px' }}>👤</span>

      <span style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '3px',
      }}>
        <span style={{
          color: '#fff',
          fontSize: '14px',
          fontWeight: 700,
        }}>
          Job Seeker
        </span>

        <span style={{
          color: 'rgba(255,255,255,0.42)',
          fontSize: '11px',
          lineHeight: 1.4,
        }}>
          Build your profile
        </span>
      </span>

      <span style={roleIndicatorStyle(form.role === 'job_seeker')}>
        {form.role === 'job_seeker' ? '✓' : ''}
      </span>
    </button>

    <button
      type="button"
      onClick={() => selectRole('employer')}
      aria-pressed={form.role === 'employer'}
      style={roleCardStyle(form.role === 'employer')}
    >
      <span style={{ fontSize: '22px' }}>🏢</span>

      <span style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '3px',
      }}>
        <span style={{
          color: '#fff',
          fontSize: '14px',
          fontWeight: 700,
        }}>
          Employer
        </span>

        <span style={{
          color: 'rgba(255,255,255,0.42)',
          fontSize: '11px',
          lineHeight: 1.4,
        }}>
          Post jobs and hire
        </span>
      </span>

      <span style={roleIndicatorStyle(form.role === 'employer')}>
        {form.role === 'employer' ? '✓' : ''}
      </span>
    </button>
  </div>
</div>
            {/* Name + username row */}
            <div style={{ display: 'flex', gap: '12px' }}>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>Full name</label>
                <input
                  name="full_name" type="text" required
                  value={form.full_name} onChange={handleChange}
                  placeholder="Alex bob"
                  autoComplete="name"
                  style={inputStyle}
                  onFocus={onFocus} onBlur={onBlur}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>Username</label>
                <input
                  name="username" type="text" required
                  value={form.username} onChange={handleChange}
                  placeholder="alexbob"
                  autoComplete="username"
                  style={inputStyle}
                  onFocus={onFocus} onBlur={onBlur}
                />
              </div>
            </div>

{/* Employer company information */}
{form.role === 'employer' && (
  <div style={{
    background: 'rgba(91,79,232,0.07)',
    border: '1px solid rgba(129,140,248,0.18)',
    borderRadius: '16px',
    padding: '18px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  }}>
    <div>
      <div style={{
        color: '#fff',
        fontSize: '15px',
        fontWeight: 700,
        marginBottom: '4px',
      }}>
        Company information
      </div>

      <div style={{
        color: 'rgba(255,255,255,0.42)',
        fontSize: '12px',
        lineHeight: 1.5,
      }}>
        Add the details connected to your employer account.
      </div>
    </div>

    <div>
      <label style={labelStyle}>Company name</label>

      <input
        name="company_name"
        type="text"
        required={form.role === 'employer'}
        maxLength={100}
        value={form.company_name}
        onChange={handleChange}
        placeholder="Company name"
        autoComplete="organization"
        style={inputStyle}
        onFocus={onFocus}
        onBlur={onBlur}
      />
    </div>

    <div style={{ display: 'flex', gap: '12px' }}>
      <div style={{ flex: 1 }}>
        <label style={labelStyle}>Company size</label>

        <select
          name="company_size"
          value={form.company_size}
          onChange={handleChange}
          style={{
            ...inputStyle,
            cursor: 'pointer',
            colorScheme: 'dark',
          }}
          onFocus={onFocus}
          onBlur={onBlur}
        >
          <option value="">Select size</option>
          <option value="1-10">1–10 employees</option>
          <option value="11-50">11–50 employees</option>
          <option value="51-200">51–200 employees</option>
          <option value="201-500">201–500 employees</option>
          <option value="500+">500+ employees</option>
        </select>
      </div>

      <div style={{ flex: 1 }}>
        <label style={labelStyle}>Industry</label>

        <input
          name="company_industry"
          type="text"
          maxLength={100}
          value={form.company_industry}
          onChange={handleChange}
          placeholder="Technology"
          style={inputStyle}
          onFocus={onFocus}
          onBlur={onBlur}
        />
      </div>
    </div>

    <div>
      <label style={labelStyle}>Company location</label>

      <input
        name="company_location"
        type="text"
        maxLength={150}
        value={form.company_location}
        onChange={handleChange}
        placeholder="Beirut, Lebanon"
        style={inputStyle}
        onFocus={onFocus}
        onBlur={onBlur}
      />
    </div>

    <div>
      <label style={labelStyle}>Company website</label>

      <input
        name="company_website"
        type="url"
        maxLength={2048}
        value={form.company_website}
        onChange={handleChange}
        placeholder="https://example.com"
        autoComplete="url"
        style={inputStyle}
        onFocus={onFocus}
        onBlur={onBlur}
      />
    </div>
  </div>
)}

            {/* Email */}
            <div>
              <label style={labelStyle}>Email</label>
              <input
                name="email" type="email" required
                value={form.email} onChange={handleChange}
                placeholder="you@example.com"
                autoComplete="email"
                style={inputStyle}
                onFocus={onFocus} onBlur={onBlur}
              />
            </div>

            {/* Password */}
            <div>
              <label style={labelStyle}>Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Min. 8 chars, at least 1 number"
                  autoComplete="new-password"
                  style={{ ...inputStyle, paddingRight: '48px' }}
                  onFocus={onFocus} onBlur={onBlur}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} style={eyeBtn}>
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
              {/* Strength bar */}
              {form.password && strength && (
                <div style={{ marginTop: '8px' }}>
                  <div style={{ height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', overflow: 'hidden' }}>
                    <div style={{
                      height: '100%',
                      width: strength.width,
                      background: strength.color,
                      borderRadius: '2px',
                      transition: 'width 0.3s ease, background 0.3s ease',
                    }} />
                  </div>
                  <span style={{ fontSize: '11px', color: strength.color, fontWeight: 600, marginTop: '4px', display: 'block' }}>
                    {strength.label}
                  </span>
                </div>
              )}
            </div>

            {/* Confirm password */}
            <div>
              <label style={labelStyle}>Confirm password</label>
              <div style={{ position: 'relative' }}>
                <input
                  name="confirm_password"
                  type={showConfirm ? 'text' : 'password'}
                  required
                  value={form.confirm_password}
                  onChange={handleChange}
                  placeholder="Repeat your password"
                  autoComplete="new-password"
                  style={{
                    ...inputStyle,
                    paddingRight: '48px',
                    borderColor: form.confirm_password && form.confirm_password !== form.password
                      ? 'rgba(239,68,68,0.5)'
                      : form.confirm_password && form.confirm_password === form.password
                      ? 'rgba(16,185,129,0.5)'
                      : 'rgba(255,255,255,0.1)',
                  }}
                  onFocus={onFocus} onBlur={onBlur}
                />
                <button type="button" onClick={() => setShowConfirm(!showConfirm)} style={eyeBtn}>
                  {showConfirm ? '🙈' : '👁️'}
                </button>
              </div>
              {/* Match indicator */}
              {form.confirm_password && (
                <span style={{
                  fontSize: '11px',
                  color: form.confirm_password === form.password ? '#10B981' : '#EF4444',
                  fontWeight: 600,
                  marginTop: '4px',
                  display: 'block',
                }}>
                  {form.confirm_password === form.password ? '✓ Passwords match' : '✗ Passwords do not match'}
                </span>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                marginTop: '8px',
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
                boxShadow: loading ? 'none' : '0 4px 16px rgba(91,79,232,0.4)',
                fontFamily: 'inherit',
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

const labelStyle = {
  display: 'block',
  fontSize: '13px',
  fontWeight: 600,
  color: 'rgba(255,255,255,0.7)',
  marginBottom: '8px',
  letterSpacing: '0.2px',
}

const eyeBtn = {
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
}

function roleCardStyle(selected) {
  return {
    position: 'relative',
    flex: 1,
    display: 'flex',
    alignItems: 'flex-start',
    gap: '10px',
    padding: '14px',
    textAlign: 'left',
    background: selected
      ? 'rgba(91,79,232,0.16)'
      : 'rgba(255,255,255,0.035)',
    border: selected
      ? '1px solid rgba(129,140,248,0.75)'
      : '1px solid rgba(255,255,255,0.1)',
    borderRadius: '12px',
    cursor: 'pointer',
    fontFamily: 'inherit',
    boxShadow: selected
      ? '0 0 0 3px rgba(91,79,232,0.08)'
      : 'none',
    transition:
      'background 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease',
  }
}

function roleIndicatorStyle(selected) {
  return {
    position: 'absolute',
    top: '10px',
    right: '10px',
    width: '18px',
    height: '18px',
    borderRadius: '50%',
    border: selected
      ? '1px solid #818CF8'
      : '1px solid rgba(255,255,255,0.16)',
    background: selected ? '#5B4FE8' : 'transparent',
    color: '#fff',
    fontSize: '11px',
    fontWeight: 700,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  }
}