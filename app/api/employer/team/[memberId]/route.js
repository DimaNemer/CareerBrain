import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { createServiceClient } from '@/lib/supabase-service'
import { requireEmployer, isCompanyAdmin } from '@/lib/employer-auth'
import {
  countCompanyOwners,
  sendCompanyNotificationToMembers,
} from '@/lib/company-notifications'

const VALID_ROLES = ['owner', 'admin', 'recruiter']

/**
 * PATCH /api/employer/team/[memberId]  body: { role }
 * DELETE /api/employer/team/[memberId]
 *
 * Security notes:
 * - The target member is loaded with `.eq('company_id', company.id)` where
 *   `company.id` comes from the caller's own membership. A member id from
 *   another tenant therefore simply does not resolve (404), which is what
 *   prevents cross-company tampering.
 * - Owner/admin only. Recruiters cannot change anything.
 * - The last remaining owner cannot be demoted or removed, and nobody can
 *   demote or remove themselves, so a company can never be left ownerless.
 */
async function loadGuard() {
  const supabase = await createClient()
  return { supabase, guard: await requireEmployer(supabase) }
}

export async function PATCH(request, { params }) {
  try {
    const { supabase, guard } = await loadGuard()

    if (!guard.authorized) {
      return NextResponse.json({ error: guard.error }, { status: guard.status })
    }

    if (!isCompanyAdmin(guard.membership)) {
      return NextResponse.json(
        { error: 'Only company owners and admins can change roles' },
        { status: 403 }
      )
    }

    const { memberId } = await params

    if (!memberId) {
      return NextResponse.json({ error: 'Invalid member ID' }, { status: 400 })
    }

    let body
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
    }

    const newRole = body?.role

    if (!VALID_ROLES.includes(newRole)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
    }

    const { company, user } = guard
    const serviceSupabase = createServiceClient()

    // Scoped to the caller's own company - this is the IDOR guard.
    const { data: member, error: memberError } = await serviceSupabase
      .from('company_members')
      .select('id, user_id, role')
      .eq('id', memberId)
      .eq('company_id', company.id)
      .eq('is_current', true)
      .maybeSingle()

    if (memberError) {
      console.error('[Team] Member lookup failed:', memberError.message)
      return NextResponse.json(
        { error: 'Unable to load that teammate' },
        { status: 500 }
      )
    }

    if (!member) {
      return NextResponse.json({ error: 'Teammate not found' }, { status: 404 })
    }

    if (member.user_id === user.id) {
      return NextResponse.json(
        { error: 'You cannot change your own role' },
        { status: 400 }
      )
    }

    // Only an owner may create or remove an owner.
    if (
      (newRole === 'owner' || member.role === 'owner') &&
      guard.membership.role !== 'owner'
    ) {
      return NextResponse.json(
        { error: 'Only a company owner can change owner roles' },
        { status: 403 }
      )
    }

    if (member.role === 'owner' && newRole !== 'owner') {
      const ownerCount = await countCompanyOwners(company.id)

      if (ownerCount <= 1) {
        return NextResponse.json(
          { error: 'A company must keep at least one owner' },
          { status: 400 }
        )
      }
    }

    const { error: updateError } = await serviceSupabase
      .from('company_members')
      .update({ role: newRole })
      .eq('id', memberId)
      .eq('company_id', company.id)

    if (updateError) {
      console.error('[Team] Role update failed:', updateError.message)
      return NextResponse.json(
        { error: 'Unable to update that role' },
        { status: 500 }
      )
    }

    // Tell the affected teammate and the rest of the team about the change.
    await sendCompanyNotificationToMembers({
      companyId: company.id,
      type: 'team',
      title: 'Role changed',
      message: `A teammate's role was updated to ${newRole}.`,
      actionUrl: '/employer/dashboard',
      data: { changed_role: newRole, member_id: memberId },
      excludeUserIds: [user.id],
    })

    return NextResponse.json(
      { message: 'Role updated', member: { id: memberId, role: newRole } },
      { status: 200 }
    )
  } catch (error) {
    console.error('[Team] PATCH error:', error)
    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 }
    )
  }
}

export async function DELETE(request, { params }) {
  try {
    const { supabase, guard } = await loadGuard()

    if (!guard.authorized) {
      return NextResponse.json({ error: guard.error }, { status: guard.status })
    }

    if (!isCompanyAdmin(guard.membership)) {
      return NextResponse.json(
        { error: 'Only company owners and admins can remove teammates' },
        { status: 403 }
      )
    }

    const { memberId } = await params

    if (!memberId) {
      return NextResponse.json({ error: 'Invalid member ID' }, { status: 400 })
    }

    const { company, user, profile } = guard
    const serviceSupabase = createServiceClient()

    const { data: member, error: memberError } = await serviceSupabase
      .from('company_members')
      .select('id, user_id, role')
      .eq('id', memberId)
      .eq('company_id', company.id)
      .eq('is_current', true)
      .maybeSingle()

    if (memberError) {
      console.error('[Team] Member lookup failed:', memberError.message)
      return NextResponse.json(
        { error: 'Unable to load that teammate' },
        { status: 500 }
      )
    }

    if (!member) {
      return NextResponse.json({ error: 'Teammate not found' }, { status: 404 })
    }

    if (member.user_id === user.id) {
      return NextResponse.json(
        { error: 'You cannot remove yourself from the company' },
        { status: 400 }
      )
    }

    if (member.role === 'owner' && guard.membership.role !== 'owner') {
      return NextResponse.json(
        { error: 'Only a company owner can remove another owner' },
        { status: 403 }
      )
    }

    if (member.role === 'owner') {
      const ownerCount = await countCompanyOwners(company.id)

      if (ownerCount <= 1) {
        return NextResponse.json(
          { error: 'A company must keep at least one owner' },
          { status: 400 }
        )
      }
    }

    // Soft remove: keeps historical rows (job ownership, etc.) intact.
    const { error: removeError } = await serviceSupabase
      .from('company_members')
      .update({ is_current: false })
      .eq('id', memberId)
      .eq('company_id', company.id)

    if (removeError) {
      console.error('[Team] Remove failed:', removeError.message)
      return NextResponse.json(
        { error: 'Unable to remove that teammate' },
        { status: 500 }
      )
    }

    await sendCompanyNotificationToMembers({
      companyId: company.id,
      type: 'team',
      title: 'Teammate removed',
      message: `${profile?.full_name || 'An admin'} removed a teammate from the workspace.`,
      actionUrl: '/employer/dashboard',
      excludeUserIds: [user.id, member.user_id],
    })

    return NextResponse.json({ message: 'Teammate removed' }, { status: 200 })
  } catch (error) {
    console.error('[Team] DELETE error:', error)
    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 }
    )
  }
}
