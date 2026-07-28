import { createClient } from '@/lib/supabase-server'
import { syncProjectStatusWithRoles } from '@/lib/project-status-server'
import { sendProjectNotification } from '@/lib/project-notifications'
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

    if (!['accept', 'reject'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    const { data: joinRequest, error: requestError } = await supabase
      .from('join_requests')
      .select(`
        *,
        projects (
          id,
          owner_id,
          title,
          deleted_at
        ),
        project_roles (
          id,
          role_title,
          quantity_needed
        )
      `)
      .eq('id', id)
      .single()

    if (requestError || !joinRequest || joinRequest.projects?.deleted_at) {
      return NextResponse.json({ error: 'Join request not found' }, { status: 404 })
    }

    if (joinRequest.projects.owner_id !== user.id) {
      return NextResponse.json(
        { error: 'Only the project owner can manage this request' },
        { status: 403 }
      )
    }

    if (joinRequest.status !== 'pending') {
      return NextResponse.json(
        { error: 'Only pending requests can be updated' },
        { status: 400 }
      )
    }

    if (action === 'reject') {
      const { data, error } = await supabase
        .from('join_requests')
        .update({ status: 'rejected' })
        .eq('id', id)
        .select()
        .single()

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      await sendProjectNotification({
        recipientId: joinRequest.user_id,
        type: 'project_join_rejected',
        title: `Join request rejected for ${joinRequest.projects.title}`,
        message: `Your request to join ${joinRequest.projects.title} as ${joinRequest.project_roles.role_title} was rejected.`,
        projectId: joinRequest.project_id,
        data: { join_request_id: joinRequest.id },
      })

      return NextResponse.json({ request: data }, { status: 200 })
    }

    if (joinRequest.project_roles.quantity_needed < 1) {
      return NextResponse.json({ error: 'This role is already full' }, { status: 400 })
    }

    const { error: memberError } = await supabase
      .from('project_members')
      .insert({
        project_id: joinRequest.project_id,
        user_id: joinRequest.user_id,
        role_in_project: joinRequest.project_roles.role_title,
      })

    if (memberError) {
      return NextResponse.json({ error: memberError.message }, { status: 500 })
    }

    const { error: updateRequestError } = await supabase
      .from('join_requests')
      .update({ status: 'accepted' })
      .eq('id', id)

    if (updateRequestError) {
      return NextResponse.json({ error: updateRequestError.message }, { status: 500 })
    }

    const { error: updateRoleError } = await supabase
      .from('project_roles')
      .update({
        quantity_needed: joinRequest.project_roles.quantity_needed - 1,
      })
      .eq('id', joinRequest.project_role_id)

    if (updateRoleError) {
      return NextResponse.json({ error: updateRoleError.message }, { status: 500 })
    }

    const { error: projectStatusError } =
      await syncProjectStatusWithRoles(supabase, joinRequest.project_id)

    if (projectStatusError) {
      return NextResponse.json({ error: projectStatusError.message }, { status: 500 })
    }

    await sendProjectNotification({
      recipientId: joinRequest.user_id,
      type: 'project_join_accepted',
      title: `Welcome to ${joinRequest.projects.title}`,
      message: `Your request to join ${joinRequest.projects.title} as ${joinRequest.project_roles.role_title} was accepted.`,
      projectId: joinRequest.project_id,
      data: { join_request_id: joinRequest.id },
    })

    return NextResponse.json(
      { message: 'Join request accepted successfully' },
      { status: 200 }
    )
  } catch {
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
