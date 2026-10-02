import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { createServiceClient } from '@/lib/supabase-service'

export const dynamic = 'force-dynamic'

/**
 * DEV ONLY. Fires the same notification an employer triggers when they accept
 * an applicant, so the bell can be verified without standing up a second
 * account and a live employer session.
 *
 * The production path is the inline insert in
 * app/api/employer/applications/[applicationId]/route.js. This mirrors its
 * shape deliberately: same columns, same `action_url`, same `data` payload.
 * If you change one, change both, or the test stops proving anything.
 *
 * Sends to a target supplied in the request body so you can point it at a
 * specific person while testing. That is the one thing this route does that
 * production must never do, which is why it is hard-blocked in production.
 */
export async function POST(request) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 404 })
  }

  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))

    // Default to self so the endpoint works with no body at all.
    const targetUserId = body.user_id || user.id
    const jobTitle = body.job_title || 'Senior Product Manager'
    const status = body.status || 'accepted'

    const STATUS_COPY = {
      shortlisted: {
        type: 'applicant',
        title: 'You have been shortlisted',
        message: 'Great news - the employer shortlisted you. Keep an eye on your profile and CV.',
      },
      rejected: {
        type: 'applicant',
        title: 'Update on your application',
        message: 'The employer has decided not to move forward with your application right now. Keep applying - your next role is out there.',
      },
      accepted: {
        type: 'application',
        title: 'Your application was accepted',
        message: 'Congratulations! The employer accepted your application. They will be in touch with the next steps.',
      },
    }

    const copy = STATUS_COPY[status]

    if (!copy) {
      return NextResponse.json(
        { error: `status must be one of: ${Object.keys(STATUS_COPY).join(', ')}` },
        { status: 400 }
      )
    }

    const serviceSupabase = createServiceClient()

    /*
     * Mirrors the production insert, including destructuring `error`.
     * supabase-js resolves rather than throws, so an unchecked insert reports
     * success even when it wrote nothing.
     */
    const { data, error } = await serviceSupabase
      .from('notifications')
      .insert({
        user_id: targetUserId,
        type: copy.type,
        title: copy.title,
        message: `${copy.message} (${jobTitle})`,
        is_read: false,
        is_emailed: false,
        action_url: '/dashboard',
        data: {
          application_id: body.application_id || null,
          job_id: body.job_id || null,
          status,
          company_id: body.company_id || null,
          _test: true,
        },
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json(
        { error: `Insert failed: ${error.message}` },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      sentTo: targetUserId,
      notification: data,
      note: targetUserId === user.id
        ? 'Delivered to you. The bell should update immediately over realtime, or within 30s via polling.'
        : 'Delivered to another user. They need this tab open to see it arrive live.',
    })
  } catch (err) {
    console.error('[Notification test] Error:', err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}