import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { createServiceClient } from '@/lib/supabase-service'
import { requireEmployer } from '@/lib/employer-auth'
import {
  countCompanyOwners,
  sendCompanyNotificationToMembers,
} from '@/lib/company-notifications'

/**
 * DELETE /api/employer/team/me
 * Leaves the current company workspace.
 *
 * Security notes:
 * - The company and the caller's membership are both derived from the session,
 *   so this route can never be aimed at another user's membership.
 * - The database trigger `company_members_guard_last_owner` rejects the write
 *   if it would remove the final active owner. That check is repeated here so
 *   the user gets a useful message instead of a generic database error.
 */
export async function DELETE() {
  try {
    const supabase = await createClient()
    const guard = await requireEmployer(supabase)

    if (!guard.authorized) {
      return NextResponse.json({ error: guard.error }, { status: guard.status })
    }

    const { company, membership, user, profile } = guard

    if (membership.role === 'owner') {
      const ownerCount = await countCompanyOwners(company.id)

      if (ownerCount <= 1) {
        return NextResponse.json(
          {
            error:
              'You are the only owner. Promote another owner or ask an admin to remove you first.',
          },
          { status: 400 }
        )
      }
    }

    // Scoped by both membership id and user id, both taken from the session.
    const serviceSupabase = createServiceClient()

    const { error: leaveError } = await serviceSupabase
      .from('company_members')
      .update({ is_current: false })
      .eq('id', membership.id)
      .eq('user_id', user.id)
      .eq('is_current', true)

    if (leaveError) {
      console.error('[Team] Leave failed:', leaveError.message)
      return NextResponse.json(
        { error: 'Unable to leave this workspace' },
        { status: 500 }
      )
    }

    await sendCompanyNotificationToMembers({
      companyId: company.id,
      type: 'team',
      title: 'Teammate left',
      message: `${
        profile?.full_name || 'A teammate'
      } left your company workspace.`,
      actionUrl: '/employer/team',
      excludeUserIds: [user.id],
    })

    return NextResponse.json({ message: 'You have left the workspace' }, { status: 200 })
  } catch (error) {
    console.error('[Team] Leave error:', error)
    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 }
    )
  }
}