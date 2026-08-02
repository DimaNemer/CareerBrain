import './globals.css'
import { createClient } from '@/lib/supabase-server'
import Navbar from '@/components/Navbar'

export const metadata = {
  title: 'Career Brain',
  description:
    'Know where you stand. Close the gap. Build with a team.',
}

export default async function RootLayout({
  children,
}) {
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
    <html lang="en">
      <body>
        <Navbar
          isLoggedIn={Boolean(user)}
          role={profile?.role || null}
        />

        {children}
      </body>
    </html>
  )
}