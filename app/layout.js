import './globals.css'
import { createClient } from '@/lib/supabase-server'
import Navbar from '@/components/Navbar'

export const metadata = {
  title: 'Career Brain',
  description: 'Know where you stand. Close the gap. Build with a team.',
}

export default async function RootLayout({ children }) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

<<<<<<< HEAD
  return (
    <html lang="en">
      <body>
        <Navbar isLoggedIn={Boolean(user)} />
=======
  let profile = null

  if (user) {
    const { data } = await supabase
      .from('profiles')
      .select(`
        id,
        full_name,
        username,
        readiness_score,
        role
      `)
      .eq('id', user.id)
      .single()

    profile = data
  }

  return (
    <html lang="en">
      <body>
        <nav
          style={{
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
          }}
        >
          {/* Logo */}
          <Link
            href={user ? '/dashboard' : '/'}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              textDecoration: 'none',
            }}
          >
            <div
              style={{
                width: '32px',
                height: '32px',
                background: theme.action.primary,
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '16px',
              }}
            >
              🧠
            </div>

            <span
              style={{
                fontWeight: 700,
                fontSize: '16px',
                color: theme.text.primary,
                letterSpacing: '-0.3px',
              }}
            >
              Career Brain
            </span>
          </Link>

          {/* Navigation */}
          {user ? (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
             {profile?.role !== 'employer' && (
  <NavLink href="/upload-cv">
    Upload CV
  </NavLink>
)}

              <NavLink href="/opportunities">
                Jobs
              </NavLink>

              <NavLink href="/projects">
                Projects
              </NavLink>

              {/* Opens the private profile */}
            <NavLink
  href={
    profile?.role === 'employer'
      ? '/employer/profile'
      : '/profile'
  }
>
  Profile
</NavLink>


              <div style={{ marginLeft: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <UserSearch />
                <NotificationBellWrapper />
                <LogoutButton />
              </div>
            </div>
          ) : (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <NavLink href="/login">
                Log in
              </NavLink>

              <Link
                href="/signup"
                style={{
                  background: theme.action.primary,
                  color: theme.action.primaryText,
                  padding: '8px 16px',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: 500,
                  textDecoration: 'none',
                  transition: 'opacity 0.15s',
                }}
              >
                Get started
              </Link>
            </div>
          )}
        </nav>

>>>>>>> 787505fce08ba35df6157ae19c322a0181cf80e2
        {children}
      </body>
    </html>
  )
}
