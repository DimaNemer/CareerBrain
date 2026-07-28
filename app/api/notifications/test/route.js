import { createClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'
import { sendJobMatchEmail } from '@/lib/email'
import { rateLimit } from '@/lib/rate-limit'

export const dynamic = 'force-dynamic'

export async function POST(request) {
  try {
    // Only allow in development
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json({ error: 'Not available in production' }, { status: 404 })
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Rate limit: 5 per 15 min per user
    const rl = rateLimit(`notif-test:${user.id}`, 5, 15 * 60 * 1000)
    if (rl.limited) {
      return NextResponse.json({ error: 'Too many requests. Try again later.' }, { status: 429 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', user.id)
      .single()

    const body = await request.json().catch(() => ({}))
    const jobId = body.job_id || '00000000-0000-0000-0000-000000000000'
    const jobTitle = body.job_title || 'Senior Product Manager'
    const company = body.company || 'TechCorp'
    const location = body.location || 'Remote'
    const jobType = body.job_type || 'Full-time'
    const matchScore = body.match_score || 0.82
    const matchedSkills = body.matched_skills || ['Product Management', 'Sales']

    const title = `🚀 New Match: ${jobTitle} at ${company}`
    const message = `We found a new opportunity matching your skills in **${matchedSkills.join('** & **')}**. Tap to view details and apply!`

    const { data: notif, error: notifErr } = await supabase
      .from('notifications')
      .insert({
        user_id: user.id,
        type: 'job_match',
        title,
        message,
        is_read: false,
        action_url: `/opportunities/${jobId}`,
        data: {
          job_id: jobId,
          job_title: jobTitle,
          company,
          location,
          job_type: jobType,
          match_score: matchScore,
          matched_skills: matchedSkills,
        },
      })
      .select()
      .single()

    if (notifErr) {
      return NextResponse.json({ error: `Notification insert failed: ${notifErr.message}` }, { status: 500 })
    }

    const emailResult = await sendJobMatchEmail({
      to: user.email,
      userName: profile?.full_name || 'there',
      jobTitle,
      company,
      location,
      jobType,
      matchScore,
      matchedSkills,
      jobId,
    })

    return NextResponse.json({
      success: true,
      notification: notif,
      email: emailResult,
    })
  } catch (err) {
    console.error('[Test API] Error:', err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
