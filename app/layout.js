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

  return (
    <html lang="en">
      <body>
        <Navbar isLoggedIn={Boolean(user)} />
        {children}
      </body>
    </html>
  )
}
