import { createServiceClient } from '@/lib/supabase-service'
import { autoMatchAndNotify } from '@/lib/auto-match-notify'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

export async function GET(request) {
  try {
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createServiceClient()

    const { data: usersData, error: usersError } = await supabase.auth.admin.listUsers()
    if (usersError) {
      throw new Error(`Failed to list users: ${usersError.message}`)
    }

    const users = usersData?.users || []
    let totalNotifications = 0
    let totalEmails = 0
    const perUser = []

    for (const user of users) {
      try {
        const result = await autoMatchAndNotify(user.id)
        totalNotifications += result.notifications || 0
        totalEmails += result.emails || 0
        if (result.notifications > 0 || result.emails > 0) {
          perUser.push({ email: user.email, ...result })
        }
      } catch (err) {
        console.error(`[Cron Notify] Error processing ${user.email}:`, err.message)
      }
    }

    return NextResponse.json({
      message: 'Notification cycle completed',
      usersProcessed: users.length,
      notifications: totalNotifications,
      emails: totalEmails,
      perUser,
      timestamp: new Date().toISOString(),
    })
  } catch (err) {
    console.error('[Cron Notify] Error:', err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
