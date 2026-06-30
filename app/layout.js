import './globals.css'
import { createClient } from '@/lib/supabase-server'
import Link from 'next/link'
import LogoutButton from '@/components/LogoutButton'
import NavLink from '@/components/NavLink'
import { theme } from '@/constants/colors'

export const metadata = {
  title: 'Career Brain',
  description: 'Know where you stand. Close the gap. Build with a team.',
}

export default async function RootLayout({ children }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let profile = null
  if (user) {
    const { data } = await supabase
      .from('profiles')
      .select('full_name, username, readiness_score')
      .eq('id', user.id)
      .single()
    profile = data
  }

  return (
    <html lang="en">
      <body>
        <nav style={{
          position: 'sticky',
          top: 0,
          zIndex: 50,
          background: theme.bg.card,
          borderBottom: `1px solid ${theme.border.light}`,
          padding: '0 24px',
          height: '60px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          {/* Logo */}
          <Link href={user ? '/dashboard' : '/'} style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            textDecoration: 'none',
          }}>
            <div style={{
              width: '32px',
              height: '32px',
              background: theme.action.primary,
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '16px',
            }}>
              🧠
            </div>
            <span style={{
              fontWeight: 700,
              fontSize: '16px',
              color: theme.text.primary,
              letterSpacing: '-0.3px',
            }}>
              Career Brain
            </span>
          </Link>

          {/* Nav links */}
          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <NavLink href="/upload-cv">Upload CV</NavLink>
              <NavLink href="/opportunities">Jobs</NavLink>
              <NavLink href="/projects">Projects</NavLink>
              <NavLink href="/profile">Profile</NavLink>

              {/* Readiness score pill */}
              {profile?.readiness_score > 0 && (
                <div style={{
                  marginLeft: '8px',
                  padding: '4px 12px',
                  borderRadius: '20px',
                  background: theme.bg.emeraldSoft,
                  color: theme.text.emerald,
                  fontSize: '13px',
                  fontWeight: 600,
                }}>
                  {profile.readiness_score}% match
                </div>
              )}

              <div style={{ marginLeft: '8px' }}>
                <LogoutButton />
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <NavLink href="/login">Log in</NavLink>
              <Link href="/signup" style={{
                background: theme.action.primary,
                color: theme.action.primaryText,
                padding: '8px 16px',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 500,
                textDecoration: 'none',
                transition: 'opacity 0.15s',
              }}>
                Get started
              </Link>
            </div>
          )}
        </nav>

        {children}
      </body>
    </html>
  )
}

