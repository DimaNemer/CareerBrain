'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { theme } from '@/constants/colors'

export default function ResetPasswordPage() {
  const router = useRouter()
  const [status, setStatus] = useState('loading') 
  // loading → ready → success → error
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    password: '',
    confirm_password: '',
  })

  useEffect(() => {
    // Supabase puts the token in the URL hash after the user clicks the email link
    // We need to listen for the AUTH_CHANGE event which fires automatically
    // when Supabase detects a recovery token in the URL hash
    const supabase = createClient()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'PASSWORD_RECOVERY') {
          // Token is valid — user is now in a temporary session
          // Show the new password form
          setStatus('ready')
        } else if (event === 'SIGNED_IN' && session) {
          // Already signed in normally — redirect to dashboard
          router.push('/dashboard')
        }
      }
    )

    // Timeout — if no recovery event fires in 5 seconds, token is invalid
    const timeout = setTimeout(() => {
      setStatus(prev => prev === 'loading' ? 'error' : prev)
    }, 5000)

    return () => {
      subscription.unsubscribe()
      clearTimeout(timeout)
    }
  }, [router])

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
      const supabase = createClient()

      // Update the password — user is already in a temporary recovery session
      const { error: updateError } = await supabase.auth.updateUser({
        password: form.password,
      })

      if (updateError) {
        setError(updateError.message)
        return
      }

      // Sign out all other sessions for security
      await supabase.auth.signOut({ scope: 'others' })

      setStatus('success')
      setTimeout(() => router.push('/login'), 2500)
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // ── Render states ─────────────────────────────

  if (status === 'loading') {
    return (
      <PageShell>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '40px', marginBottom: '16px' }}>⏳</div>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '14px' }}>
            Verifying your reset link...
          </p>
        </div>
      </PageShell>
    )
  }

  if (status === 'error') {
    return (
      <PageShell>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
          <h1 style={{
            fontSize: '22px',
            fontWeight: 700,
            color: '#fff',
            margin: '0 0 12px',
          }}>
            Link expired or invalid
          </h1>
          <p style={{
            fontSize: '14px',
            color: 'rgba(255,255,255,0.5)',
            margin: '0 0 24px',
            lineHeight: 1.6,
          }}>
            This reset link has expired or already been used.
            Reset links are valid for 1 hour only.
          </p>
          <a href="/forgot-password" style={{
            display: 'inline-block',
            padding: '12px 24px',
            background: theme.action.primary,
            color: '#fff',
            borderRadius: '10px',
            fontSize: '14px',
            fontWeight: 600,
            textDecoration: 'none',
          }}>
            Request a new link
          </a>
        </div>
      </PageShell>
    )
  }

  if (status === 'success') {
    return (
      <PageShell>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>✅</div>
          <h1 style={{
            fontSize: '22px',
            fontWeight: 700,
            color: '#fff',
            margin: '0 0 8px',
          }}>
            Password updated
          </h1>
          <p style={{
            fontSize: '14px',
            color: 'rgba(255,255,255,0.5)',
          }}>
            Redirecting you to login...
          </p>
        </div>
      </PageShell>
    )
  }

  // status === 'ready' — show the form
  return (
    <PageShell>
      <div style={{ textAlign: 'center', marginBottom: '28px' }}>
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
          🔒
        </div>
        <h1 style={{
          fontSize: '24px',
          fontWeight: 700,
          color: '#fff',
          margin: '0 0 6px',
          letterSpacing: '-0.4px',
        }}>
          Set new password
        </h1>
        <p style={{
          fontSize: '14px',
          color: 'rgba(255,255,255,0.45)',
          margin: 0,
        }}>
          Choose a strong password for your account.
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
          gap: '16px',
        }}>
          <InputField
            label="New password"
            name="password"
            value={form.password}
            onChange={handleChange}
            placeholder="Min. 8 characters, at least 1 number"
          />
          <InputField
            label="Confirm new password"
            name="confirm_password"
            value={form.confirm_password}
            onChange={handleChange}
            placeholder="Repeat your new password"
          />

          <p style={{
            fontSize: '12px',
            color: 'rgba(255,255,255,0.3)',
            margin: 0,
            lineHeight: 1.6,
          }}>
            Must be at least 8 characters and contain at least one number.
          </p>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '12px',
              background: loading
                ? 'rgba(255,255,255,0.1)'
                : theme.action.primary,
              border: 'none',
              borderRadius: '10px',
              fontSize: '15px',
              fontWeight: 600,
              color: '#fff',
              cursor: loading ? 'not-allowed' : 'pointer',
            }}
          >
            {loading ? 'Updating...' : 'Update password'}
          </button>
        </form>
      </div>
    </PageShell>
  )
}

// ── Shared page shell ─────────────────────────────

function PageShell({ children }) {
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
        maxWidth: '400px',
        position: 'relative',
        zIndex: 1,
      }}>
        {children}
      </div>
    </div>
  )
}

function InputField({ label, name, value, onChange, placeholder }) {
  return (
    <div>
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
        type="password"
        required
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        autoComplete="new-password"
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