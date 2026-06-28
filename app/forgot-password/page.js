'use client'

import { useState } from 'react'
import Link from 'next/link'
import { theme } from '@/constants/colors'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      })

      const data = await res.json()

      if (res.status === 429) {
        setError(data.error)
        return
      }

      // Always show success — never reveal if email exists
      setSubmitted(true)
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
        maxWidth: '400px',
        position: 'relative',
        zIndex: 1,
      }}>
        {/* Header */}
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
            🔑
          </div>
          <h1 style={{
            fontSize: '24px',
            fontWeight: 700,
            color: theme.text.inverse,
            margin: '0 0 8px',
            letterSpacing: '-0.4px',
          }}>
            {submitted ? 'Check your email' : 'Forgot password?'}
          </h1>
          <p style={{
            fontSize: '14px',
            color: theme.text.tertiary,
            margin: 0,
            lineHeight: 1.6,
          }}>
            {submitted
              ? `We sent a reset link to ${email}. Check your inbox and spam folder.`
              : "Enter your email and we'll send you a reset link."}
          </p>
        </div>

        <div style={{
          background: 'rgba(255,255,255,0.05)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '20px',
          padding: '32px',
        }}>
          {submitted ? (
            // Success state
            <div style={{ textAlign: 'center' }}>
              <div style={{
                fontSize: '48px',
                marginBottom: '16px',
              }}>
                📬
              </div>
              <p style={{
                fontSize: '14px',
                color: 'rgba(255,255,255,0.6)',
                marginBottom: '24px',
                lineHeight: 1.7,
              }}>
                The link expires in 1 hour. If you do not see it, check your spam folder.
              </p>
              <button
                onClick={() => {
                  setSubmitted(false)
                  setEmail('')
                }}
                style={{
                  width: '100%',
                  padding: '11px',
                  background: 'rgba(255,255,255,0.08)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  borderRadius: '10px',
                  fontSize: '14px',
                  fontWeight: 500,
                  color: 'rgba(255,255,255,0.8)',
                  cursor: 'pointer',
                  marginBottom: '12px',
                }}
              >
                Try a different email
              </button>
              <Link href="/login" style={{
                display: 'block',
                textAlign: 'center',
                fontSize: '14px',
                color: '#818CF8',
                textDecoration: 'none',
                fontWeight: 500,
              }}>
                Back to login
              </Link>
            </div>
          ) : (
            // Form state
            <>
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
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '13px',
                    fontWeight: 500,
                    color: 'rgba(255,255,255,0.7)',
                    marginBottom: '6px',
                  }}>
                    Email address
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => {
                      setEmail(e.target.value)
                      setError('')
                    }}
                    placeholder="you@example.com"
                    autoComplete="email"
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
                    }}
                    onFocus={e => e.target.style.borderColor = 'rgba(99,102,241,0.6)'}
                    onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.12)'}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  style={{
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
                  {loading ? 'Sending...' : 'Send reset link'}
                </button>

                <Link href="/login" style={{
                  display: 'block',
                  textAlign: 'center',
                  fontSize: '14px',
                  color: '#818CF8',
                  textDecoration: 'none',
                  fontWeight: 500,
                }}>
                  Back to login
                </Link>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}