'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import NotificationBell from './NotificationBell'

export default function NotificationBellWrapper({ initialUserId = null }) {
  const [userId, setUserId] = useState(initialUserId)

  useEffect(() => {
    const supabase = createClient()

    if (!initialUserId) {
      supabase.auth.getUser().then(({ data: { user } }) => {
        setUserId(user?.id ?? null)
      })
    }

    // Then keep in sync with auth changes (sign-in / sign-out / token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user?.id ?? null)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [initialUserId])

  if (!userId) return null

  return <NotificationBell userId={userId} />
}
