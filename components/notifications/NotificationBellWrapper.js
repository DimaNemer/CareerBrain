'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import NotificationBell from './NotificationBell'

export default function NotificationBellWrapper() {
  const [userId, setUserId] = useState(null)

  useEffect(() => {
    const supabase = createClient()

    // Seed the initial user state immediately
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUserId(user?.id ?? null)
    })

    // Then keep in sync with auth changes (sign-in / sign-out / token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user?.id ?? null)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  if (!userId) return null

  return <NotificationBell userId={userId} />
}
