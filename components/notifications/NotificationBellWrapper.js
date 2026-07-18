'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import NotificationBell from './NotificationBell'

export default function NotificationBellWrapper() {
  const [userId, setUserId] = useState(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setUserId(user.id)
    })
  }, [])

  if (!userId) return null

  return <NotificationBell userId={userId} />
}
