import { createClient } from '@/lib/supabase-server'
import { sendProjectNotification } from '@/lib/project-notifications'
import { NextResponse } from 'next/server'

async function checkWorkspaceAccess(supabase, projectId, userId) {
  const { data: project } = await supabase
    .from('projects')
    .select('id, owner_id, title, status')
    .eq('id', projectId)
    .is('deleted_at', null)
    .single()

  if (!project) return { access: false, reason: 'Project not found', status: 404 }

  const isOwner = project.owner_id === userId

  const { data: member } = await supabase
    .from('project_members')
    .select('id, role_in_project')
    .eq('project_id', projectId)
    .eq('user_id', userId)
    .is('left_at', null)
    .maybeSingle()

  if (!isOwner && !member) {
    return { access: false, reason: 'Not a project member', status: 403 }
  }

  return { access: true, isOwner, member, project }
}

export async function GET(request, { params }) {
  try {
    const supabase = await createClient()
    const { id: projectId } = await params

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { access, reason, status } = await checkWorkspaceAccess(supabase, projectId, user.id)
    if (!access) return NextResponse.json({ error: reason }, { status })

    const { data: tasks, error } = await supabase
      .from('tasks')
      .select(`
        id,
        title,
        description,
        status,
        due_date,
        created_at,
        assigned_to,
        profiles!tasks_assigned_to_fkey (
          id,
          full_name,
          username,
          avatar_url
        )
      `)
      .eq('project_id', projectId)
      .order('created_at', { ascending: true })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ tasks }, { status: 200 })
  } catch {
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}

export async function POST(request, { params }) {
  try {
    const supabase = await createClient()
    const { id: projectId } = await params

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { access, reason, status, project } = await checkWorkspaceAccess(supabase, projectId, user.id)
    if (!access) return NextResponse.json({ error: reason }, { status })

    const body = await request.json()
    const { title, description, assigned_to, due_date } = body

    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return NextResponse.json({ error: 'Task title is required' }, { status: 400 })
    }

    if (title.trim().length > 200) {
      return NextResponse.json({ error: 'Title must be under 200 characters' }, { status: 400 })
    }

    if (assigned_to) {
      const { data: assigneeMember } = await supabase
        .from('project_members')
        .select('id')
        .eq('project_id', projectId)
        .eq('user_id', assigned_to)
        .is('left_at', null)
        .maybeSingle()

      const { data: proj } = await supabase
        .from('projects')
        .select('owner_id')
        .eq('id', projectId)
        .single()

      const isAssigneeOwner = proj?.owner_id === assigned_to

      if (!assigneeMember && !isAssigneeOwner) {
        return NextResponse.json(
          { error: 'Cannot assign task to someone who is not a project member' },
          { status: 400 }
        )
      }
    }

    const { data: task, error } = await supabase
      .from('tasks')
      .insert({
        project_id: projectId,
        title: title.trim(),
        description: description?.trim() || null,
        assigned_to: assigned_to || null,
        due_date: due_date || null,
        status: 'todo',
      })
      .select(`
        id,
        title,
        description,
        status,
        due_date,
        created_at,
        assigned_to,
        profiles!tasks_assigned_to_fkey (
          id,
          full_name,
          username,
          avatar_url
        )
      `)
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    if (assigned_to) {
      const { data: assignerProfile } = await supabase
        .from('profiles')
        .select('full_name, username')
        .eq('id', user.id)
        .maybeSingle()

      const assignerName = assignerProfile?.full_name || assignerProfile?.username || 'A project member'
      await sendProjectNotification({
        recipientId: assigned_to,
        type: 'workspace_task_assigned',
        title: `New task in ${project.title}`,
        message: `${assignerName} assigned you the task "${task.title}".`,
        projectId,
        actionUrl: `/projects/${projectId}/workspace`,
        data: { task_id: task.id, assigned_by: user.id },
      })
    }

    return NextResponse.json({ task }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
