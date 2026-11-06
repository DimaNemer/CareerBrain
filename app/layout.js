import './globals.css'
import { Suspense } from 'react'
import { createClient } from '@/lib/supabase-server'
import Navbar from '@/components/Navbar'

export const metadata = {
  title: 'Career Brain',
  description:
    'Know where you stand. Close the gap. Build with a team.',
}

async function AuthenticatedNavbar() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  let profile = null

  if (user) {
    const { data } = await supabase
      .from('profiles')
      .select(`
        id,
        role
      `)
      .eq('id', user.id)
      .single()

    profile = data
  }

  return (
    <Navbar
      isLoggedIn={Boolean(user)}
      role={profile?.role || null}
      userId={user?.id || null}
    />
  )
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Suspense
          fallback={
            <div
              className="h-[60px] border-b border-slate-200 bg-white"
              aria-hidden="true"
            />
          }
        >
          <AuthenticatedNavbar />
        </Suspense>
        {children}
      </body>
    </html>
  )
}