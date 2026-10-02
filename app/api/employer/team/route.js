import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { createServiceClient } from '@/lib/supabase-service'
import { requireEmployer, isCompanyAdmin } from '@/lib/employer-auth'
import { sendCompanyNotificationToMembers } from '@/lib/company-notifications'

const VALID_ROLES = ['owner', 'admin', 'recruiter']
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const MAX_PENDING_INVITES = 25

function normalizeEmail(value) {
  return typeof value === 'string' ? value.trim().toLowerCase() : ''
}

/**
 * GET /api/employer/team
 * Lists the current company's members and its pending invites.
 */
export async function GET() {
  try {
    const supabase = await createClient()
    const guard = await requireEmployer(supabase)

    if (!guard.authorized) {
      return NextResponse.json({ error: guard.error }, { status: guard.status })
    }

    const { company } = guard

    const { data: members, error: membersError } = await supabase
      .from('company_members')
      .select(`
        id,
        user_id,
        role,
        job_title,
        created_at,
        profiles (
          id,
          full_name,
          username,
          headline
        )
      `)
      .eq('company_id', company.id)
      .eq('is_current', true)
      .order('created_at', { ascending: true })

    if (membersError) {
      console.error('[Team] Member list failed:', membersError.message)
      return NextResponse.json(
        { error: 'Unable to load your team' },
        { status: 500 }
      )
    }

    // Invites are only meaningful to admins. Reading them via the service
    // client bypasses RLS, so we gate on canManage before exposing invitee
    // email addresses to a recruiter.
    const serviceSupabase = createServiceClient()

    let invites = []

    if (isCompanyAdmin(guard.membership)) {
      const { data: inviteRows, error: invitesError } = await serviceSupabase
        .from('company_invites')
        .select('id, email, role, job_title, status, created_at')
        .eq('company_id', company.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })

      if (invitesError) {
        console.error('[Team] Invite list failed:', invitesError.message)
      }

      invites = inviteRows || []
    }

    return NextResponse.json(
      {
        members: members || [],
        invites,
        canManage: isCompanyAdmin(guard.membership),
        currentRole: guard.membership.role,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('[Team] GET error:', error)
    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/employer/team
 * Invites someone to the company. Owner/admin only.
 */
export async function POST(request) {
  try {
    const supabase = await createClient()
    const guard = await requireEmployer(supabase)

    if (!guard.authorized) {
      return NextResponse.json({ error: guard.error }, { status: guard.status })
    }

    if (!isCompanyAdmin(guard.membership)) {
      return NextResponse.json(
        { error: 'Only company owners and admins can invite teammates' },
        { status: 403 }
      )
    }

    let body
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
    }

    const email = normalizeEmail(body?.email)
    const jobTitle =
      typeof body?.job_title === 'string' ? body.job_title.trim().slice(0, 120) : null

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    if (!EMAIL_PATTERN.test(email) || email.length > 254) {
      return NextResponse.json(
        { error: 'Enter a valid email address' },
        { status: 400 }
      )
    }

    if (body?.role !== undefined && !VALID_ROLES.includes(body.role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
    }

    const role = VALID_ROLES.includes(body?.role) ? body.role : 'recruiter'

    // Owners are precious: only an owner may mint another owner.
    if (role === 'owner' && guard.membership.role !== 'owner') {
      return NextResponse.json(
        { error: 'Only a company owner can invite another owner' },
        { status: 403 }
      )
    }

    const { company, user, profile } = guard
    const serviceSupabase = createServiceClient()

    const { count: pendingCount } = await serviceSupabase
      .from('company_invites')
      .select('id', { count: 'exact', head: true })
      .eq('company_id', company.id)
      .eq('status', 'pending')

    if ((pendingCount || 0) >= MAX_PENDING_INVITES) {
      return NextResponse.json(
        { error: 'You have too many pending invites. Revoke one first.' },
        { status: 429 }
      )
    }

    const { data: invite, error: inviteError } = await serviceSupabase
      .from('company_invites')
      .insert({
        company_id: company.id,
        email,
        role,
        job_title: jobTitle,
        invited_by: user.id,
        status: 'pending',
      })
      .select('id, email, role, job_title, status, created_at')
      .single()

    if (inviteError) {
      if (inviteError.code === '23505') {
        return NextResponse.json(
          { error: 'That person already has a pending invite' },
          { status: 409 }
        )
      }
      console.error('[Team] Invite insert failed:', inviteError.message)
      return NextResponse.json(
        { error: 'Unable to send that invite' },
        { status: 500 }
      )
    }

    // Let the current team know someone was invited.
    await sendCompanyNotificationToMembers({
      companyId: company.id,
      type: 'team',
      title: 'New teammate invited',
      message: `${profile?.full_name || 'An admin'} invited ${email} to join as ${role}.`,
      actionUrl: '/employer/dashboard',
      data: { invited_email: email, invited_role: role },
      excludeUserIds: [user.id],
    })

    return NextResponse.json({ invite }, { status: 201 })
  } catch (error) {
    console.error('[Team] POST error:', error)
    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 }
    )
  }
}
