import { createClient } from '@/lib/supabase-server'
import { sendProjectNotification } from '@/lib/project-notifications'
import { NextResponse } from 'next/server'

export async function GET(request) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('project_id')

    if (!projectId) {
      return NextResponse.json({ error: 'project_id is required' }, { status: 400 })
    }

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id, owner_id')
      .eq('id', projectId)
      .is('deleted_at', null)
      .single()

    if (projectError || !project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    if (project.owner_id !== user.id) {
      return NextResponse.json(
        { error: 'Only the project owner can view requests' },
        { status: 403 }
      )
    }

    const { data: requests, error } = await supabase
      .from('join_requests')
      .select(`
        *,
        profiles (
          id,
          username,
          full_name,
          avatar_url
        ),
        project_roles (
          id,
          role_title,
          skills (
            id,
            name,
            category
          )
        )
      `)
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ requests }, { status: 200 })
  } catch {
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const body = await request.json()

    const projectId = body.project_id
    const projectRoleId = body.project_role_id
    const message = body.message?.trim() || null

    if (!projectId || !projectRoleId) {
      return NextResponse.json(
        { error: 'project_id and project_role_id are required' },
        { status: 400 }
      )
    }

    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id, owner_id, title, status, deleted_at')
      .eq('id', projectId)
      .is('deleted_at', null)
      .single()

    if (projectError || !project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    if (project.owner_id === user.id) {
      return NextResponse.json(
        { error: 'Project owner cannot request to join their own project' },
        { status: 400 }
      )
    }

    if (project.status !== 'open') {
      return NextResponse.json(
        { error: 'You can only request to join open projects' },
        { status: 400 }
      )
    }

    const { data: role, error: roleError } = await supabase
      .from('project_roles')
      .select('id, project_id, role_title, quantity_needed')
      .eq('id', projectRoleId)
      .eq('project_id', projectId)
      .single()

    if (roleError || !role) {
      return NextResponse.json({ error: 'Role not found' }, { status: 404 })
    }

    if (role.quantity_needed < 1) {
      return NextResponse.json({ error: 'This role is already full' }, { status: 400 })
    }

    const { data: existingRequest } = await supabase
      .from('join_requests')
      .select('id, status')
      .eq('project_id', projectId)
      .eq('project_role_id', projectRoleId)
      .eq('user_id', user.id)
      .in('status', ['pending', 'accepted'])
      .maybeSingle()

    if (existingRequest) {
      return NextResponse.json(
        { error: 'You already have a pending or accepted request for this role' },
        { status: 400 }
      )
    }

    const { data: requestRow, error } = await supabase
      .from('join_requests')
      .insert({
        project_id: projectId,
        project_role_id: projectRoleId,
        user_id: user.id,
        message,
        status: 'pending',
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const { data: requesterProfile } = await supabase
      .from('profiles')
      .select('full_name, username')
      .eq('id', user.id)
      .maybeSingle()

    const requesterName = requesterProfile?.full_name || requesterProfile?.username || 'A user'
    await sendProjectNotification({
      recipientId: project.owner_id,
      type: 'project_join_request',
      title: `New join request for ${project.title}`,
      message: `${requesterName} requested to join your project as ${role.role_title}.`,
      projectId,
      data: {
        join_request_id: requestRow.id,
        requester_id: user.id,
        project_role_id: projectRoleId,
      },
    })

    return NextResponse.json({ request: requestRow }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
