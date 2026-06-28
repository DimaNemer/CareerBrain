import Link from 'next/link'
import { theme } from '@/constants/colors'

export default function ConfirmPage({ searchParams }) {
  const email = searchParams?.email || ''

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
        maxWidth: '420px',
        position: 'relative',
        zIndex: 1,
        textAlign: 'center',
      }}>
        <div style={{
          fontSize: '64px',
          marginBottom: '24px',
          lineHeight: 1,
        }}>
          📬
        </div>

        <h1 style={{
          fontSize: '26px',
          fontWeight: 700,
          color: '#fff',
          margin: '0 0 12px',
          letterSpacing: '-0.4px',
        }}>
          Check your email
        </h1>

        <p style={{
          fontSize: '15px',
          color: 'rgba(255,255,255,0.55)',
          margin: '0 0 8px',
          lineHeight: 1.7,
        }}>
          We sent a confirmation link to
        </p>

        {email && (
          <p style={{
            fontSize: '15px',
            fontWeight: 600,
            color: '#818CF8',
            margin: '0 0 24px',
          }}>
            {email}
          </p>
        )}

        <div style={{
          background: 'rgba(255,255,255,0.05)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '20px',
          padding: '28px 32px',
          marginBottom: '24px',
          textAlign: 'left',
        }}>
          <p style={{
            fontSize: '13px',
            fontWeight: 600,
            color: 'rgba(255,255,255,0.7)',
            margin: '0 0 16px',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
          }}>
            Next steps
          </p>

          {[
            { icon: '1️⃣', text: 'Open the email we sent you' },
            { icon: '2️⃣', text: 'Click the confirmation link' },
            { icon: '3️⃣', text: 'You\'ll be redirected to log in' },
          ].map((step, i) => (
            <div key={i} style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              marginBottom: i < 2 ? '12px' : 0,
            }}>
              <span style={{ fontSize: '18px' }}>{step.icon}</span>
              <span style={{
                fontSize: '14px',
                color: 'rgba(255,255,255,0.6)',
              }}>
                {step.text}
              </span>
            </div>
          ))}
        </div>

        <p style={{
          fontSize: '13px',
          color: 'rgba(255,255,255,0.35)',
          margin: '0 0 20px',
          lineHeight: 1.6,
        }}>
          Ca not find the email? Check your spam folder. The link expires in 24 hours.
        </p>

        <Link href="/login" style={{
          fontSize: '14px',
          color: '#818CF8',
          textDecoration: 'none',
          fontWeight: 500,
        }}>
          Back to login
        </Link>
      </div>
    </div>
  )
}