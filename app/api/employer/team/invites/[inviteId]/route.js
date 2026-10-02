import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { createServiceClient } from '@/lib/supabase-service'
import {
  requireEmployer,
  isCompanyAdmin,
} from '@/lib/employer-auth'
import { sendCompanyNotificationToMembers } from '@/lib/company-notifications'

// Maps the database function's error messages to safe client responses. The
// raw message is never returned, because it can contain internal detail.
const ACCEPT_ERRORS = {
  'Invite is not available': { status: 404, error: 'That invite no longer exists' },
  'Invite has expired': { status: 410, error: 'That invite has expired' },
  'Only employer accounts can join a company team': {
    status: 403,
    error: 'Only employer accounts can join a company team',
  },
  'You already belong to a company': {
    status: 409,
    error: 'Leave your current company workspace before joining another',
  },
  'Not authenticated': { status: 401, error: 'Not authenticated' },
}

/**
 * POST /api/employer/team/invites/[inviteId]  body: { action: 'accept' | 'decline' }
 *
 * Acceptance is delegated to the `accept_company_invite` database function,
 * which validates the caller, locks the invite row, and performs the
 * membership insert and status flip in a single transaction. Doing it in app
 * code is racy: a partial failure leaves a membership with a still-pending
 * invite, and concurrent accepts can create duplicate current memberships.
 *
 * The RPC derives the user from auth.uid() and requires the invite to be
 * addressed to that user's email, so a caller cannot accept an invite meant
 * for someone else, nor choose an identity or company.
 */
export async function POST(request, { params }) {
  try {
    const { inviteId } = await params

    if (!inviteId) {
      return NextResponse.json({ error: 'Invalid invite ID' }, { status: 400 })
    }

    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    let body
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
    }

    const action = body?.action

    if (action !== 'accept' && action !== 'decline') {
      return NextResponse.json(
        { error: 'Action must be accept or decline' },
        { status: 400 }
      )
    }

    const serviceSupabase = createServiceClient()

    if (action === 'decline') {
      // Scoped to this user's own email so a decline cannot be aimed at
      // someone else's invite.
      const userEmail = user.email?.trim().toLowerCase()

      const { error: declineError } = await serviceSupabase
        .from('company_invites')
        .update({ status: 'declined', responded_at: new Date().toISOString() })
        .eq('id', inviteId)
        .eq('status', 'pending')
        .eq('email', userEmail)

      if (declineError) {
        console.error('[Team invite] Decline failed:', declineError.message)
        return NextResponse.json(
          { error: 'Unable to decline that invite' },
          { status: 500 }
        )
      }

      return NextResponse.json({ message: 'Invite declined' }, { status: 200 })
    }

    const { data: membership, error: acceptError } = await supabase.rpc(
      'accept_company_invite',
      { p_invite_id: inviteId }
    )

    if (acceptError) {
      const mapped = ACCEPT_ERRORS[acceptError.message]

      if (mapped) {
        return NextResponse.json({ error: mapped.error }, { status: mapped.status })
      }

      console.error('[Team invite] Accept failed:', acceptError.message)
      return NextResponse.json(
        { error: 'Unable to join that company' },
        { status: 500 }
      )
    }

    const acceptedMembership = Array.isArray(membership)
      ? membership[0]
      : membership

    if (acceptedMembership?.company_id) {
      await sendCompanyNotificationToMembers({
        companyId: acceptedMembership.company_id,
        type: 'team',
        title: 'New teammate joined',
        message: `${user.email} accepted your invite and joined as ${acceptedMembership.role}.`,
        actionUrl: '/employer/dashboard',
        data: {
          joined_email: user.email,
          joined_role: acceptedMembership.role,
        },
        excludeUserIds: [user.id],
      })
    }

    return NextResponse.json(
      { message: 'You have joined the company' },
      { status: 200 }
    )
  } catch (error) {
    console.error('[Team invite] POST error:', error)
    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/employer/team/invites/[inviteId]
 * Revokes a pending invite. Owner/admin only.
 *
 * Scoped to the caller's own company, so an id from another tenant does not
 * match. Only `pending` invites can be revoked, so an accepted invite cannot
 * be retroactively undone.
 */
export async function DELETE(request, { params }) {
  try {
    const supabase = await createClient()
    const guard = await requireEmployer(supabase)

    if (!guard.authorized) {
      return NextResponse.json({ error: guard.error }, { status: guard.status })
    }

    if (!isCompanyAdmin(guard.membership)) {
      return NextResponse.json(
        { error: 'Only company owners and admins can revoke invites' },
        { status: 403 }
      )
    }

    const { inviteId } = await params

    if (!inviteId) {
      return NextResponse.json({ error: 'Invalid invite ID' }, { status: 400 })
    }

    const serviceSupabase = createServiceClient()

    const { data: revoked, error: revokeError } = await serviceSupabase
      .from('company_invites')
      .update({ status: 'revoked', responded_at: new Date().toISOString() })
      .eq('id', inviteId)
      .eq('company_id', guard.company.id)
      .eq('status', 'pending')
      .select('id')
      .maybeSingle()

    if (revokeError) {
      console.error('[Team invite] Revoke failed:', revokeError.message)
      return NextResponse.json(
        { error: 'Unable to revoke that invite' },
        { status: 500 }
      )
    }

    if (!revoked) {
      return NextResponse.json({ error: 'Invite not found' }, { status: 404 })
    }

    return NextResponse.json({ message: 'Invite revoked' }, { status: 200 })
  } catch (error) {
    console.error('[Team invite] DELETE error:', error)
    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 }
    )
  }
}
