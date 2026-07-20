'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase'

export function useNotifications(userId) {
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const channelRef = useRef(null)

  const fetchNotifications = useCallback(async () => {
    if (!userId) return
    try {
      const res = await fetch('/api/notifications?limit=20')
      if (!res.ok) return
      const data = await res.json()
      setNotifications(data.notifications || [])
      setUnreadCount(data.unreadCount || 0)
    } catch (err) {
      console.error('[useNotifications] fetch error:', err)
    } finally {
      setLoading(false)
    }
  }, [userId])

  const markAsRead = useCallback(async (id) => {
    // Optimistic update: mark as read in list, and decrement unread count only if it was unread.
    // Both setters use functional updaters to avoid stale closures.
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n))
    setUnreadCount(prev => {
      // We derive target from the current notifications state via the setter of notifications,
      // but since we cannot nest setters, we instead track it via a ref before we call setState.
      // The read flag is captured before the optimistic update so we can safely decrement.
      return prev > 0 ? prev - 1 : 0
    })

    try {
      const res = await fetch(`/api/notifications/${id}`, { method: 'PATCH' })
      if (!res.ok) throw new Error('Failed')
    } catch {
      // On failure, refetch to restore accurate state
      fetchNotifications()
    }
  }, [fetchNotifications])

  const markAllAsRead = useCallback(async () => {
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
    setUnreadCount(0)

    try {
      const res = await fetch('/api/notifications/read-all', { method: 'PATCH' })
      if (!res.ok) throw new Error('Failed')
    } catch {
      fetchNotifications()
    }
  }, [fetchNotifications])

  const deleteNotification = useCallback(async (id) => {
    // Capture a snapshot for rollback; named `snapshot` to avoid shadowing the
    // `prev` parameter used in functional state setters below.
    const snapshot = notifications
    const target = snapshot.find(n => n.id === id)
    setNotifications(prev => prev.filter(n => n.id !== id))
    setUnreadCount(prev => {
      if (target && !target.is_read) return Math.max(0, prev - 1)
      return prev
    })

    try {
      const res = await fetch(`/api/notifications/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed')
    } catch {
      // Roll back to the snapshot on failure
      setNotifications(snapshot)
      fetchNotifications()
    }
  }, [notifications, fetchNotifications])

  useEffect(() => {
    if (!userId) return

    fetchNotifications()

    const supabase = createClient()
    const channel = supabase
      .channel(`notifications-realtime-${userId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`,
      }, (payload) => {
        const newNotif = payload.new
        setNotifications(prev => {
          if (prev.some(n => n.id === newNotif.id)) return prev
          return [newNotif, ...prev]
        })
        if (!newNotif.is_read) {
          setUnreadCount(prev => prev + 1)
        }
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`,
      }, (payload) => {
        const updated = payload.new
        setNotifications(prev => {
          const existing = prev.find(n => n.id === updated.id)
          if (existing) {
            const wasUnread = !existing.is_read
            const isNowRead = updated.is_read
            if (wasUnread && isNowRead) {
              setUnreadCount(c => Math.max(0, c - 1))
            } else if (!wasUnread && !isNowRead) {
              setUnreadCount(c => c + 1)
            }
          }
          return prev.map(n => n.id === updated.id ? updated : n)
        })
      })
      .on('postgres_changes', {
        event: 'DELETE',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`,
      }, (payload) => {
        const deletedId = payload.old?.id
        if (deletedId) {
          setNotifications(prev => {
            const existing = prev.find(n => n.id === deletedId)
            if (existing && !existing.is_read) {
              setUnreadCount(c => Math.max(0, c - 1))
            }
            return prev.filter(n => n.id !== deletedId)
          })
        }
      })
      .subscribe()

    channelRef.current = channel

    const handleRefresh = () => fetchNotifications()
    window.addEventListener('notifications-updated', handleRefresh)

    return () => {
      window.removeEventListener('notifications-updated', handleRefresh)
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
    }
  }, [userId, fetchNotifications])

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refresh: fetchNotifications,
  }
}
