import { createClient } from '@/lib/supabase-server'
import { syncProjectStatusWithRoles } from '@/lib/project-status-server'
import { NextResponse } from 'next/server'

export async function PATCH(request, { params }) {
  try {
    const supabase = await createClient()
    const { id } = await params

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const body = await request.json()
    const action = body.action

    if (!['leave', 'remove'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    const { data: member, error: memberError } = await supabase
      .from('project_members')
      .select(`
        *,
        projects (
          id,
          owner_id,
          deleted_at
        )
      `)
      .eq('id', id)
      .maybeSingle()

    if (memberError || !member || member.projects?.deleted_at) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 })
    }

    const isOwner = member.projects.owner_id === user.id
    const isMember = member.user_id === user.id

    if (action === 'leave' && !isMember) {
      return NextResponse.json({ error: 'Only the member can leave the project' }, { status: 403 })
    }

    if (action === 'remove' && !isOwner) {
      return NextResponse.json({ error: 'Only the project owner can remove members' }, { status: 403 })
    }

    const { data: joinRequest, error: joinRequestError } = await supabase
      .from('join_requests')
      .select('id, project_role_id, status, created_at')
      .eq('project_id', member.project_id)
      .eq('user_id', member.user_id)
      .eq('status', 'accepted')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (joinRequestError) {
      return NextResponse.json({ error: joinRequestError.message }, { status: 500 })
    }

    if (!joinRequest) {
      return NextResponse.json({ error: 'Accepted join request not found' }, { status: 404 })
    }

    const { data: role, error: roleFetchError } = await supabase
      .from('project_roles')
      .select('quantity_needed')
      .eq('id', joinRequest.project_role_id)
      .maybeSingle()

    if (roleFetchError) {
      return NextResponse.json({ error: roleFetchError.message }, { status: 500 })
    }

    if (role) {
      const { error: roleUpdateError } = await supabase
        .from('project_roles')
        .update({
          quantity_needed: role.quantity_needed + 1,
        })
        .eq('id', joinRequest.project_role_id)

        

      if (roleUpdateError) {
        return NextResponse.json({ error: roleUpdateError.message }, { status: 500 })
      }
    }

    const { error: requestUpdateError } = await supabase
      .from('join_requests')
      .update({
        status: action === 'leave' ? 'left' : 'removed',
      })
      .eq('id', joinRequest.id)

    if (requestUpdateError) {
      return NextResponse.json({ error: requestUpdateError.message }, { status: 500 })
    }

    const { error: deleteError } = await supabase
      .from('project_members')
      .delete()
      .eq('id', id)

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 })
    }

    const { error: projectStatusError } =
      await syncProjectStatusWithRoles(supabase, member.project_id)

    if (projectStatusError) {
      return NextResponse.json({ error: projectStatusError.message }, { status: 500 })
    }

    return NextResponse.json(
      {
        message:
          action === 'leave'
            ? 'Left project successfully'
            : 'Member removed successfully',
      },
      { status: 200 }
    )
  } catch {
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
