import { createClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

const VALID_STATUSES = ['todo', 'in_progress', 'done']

async function checkWorkspaceAccess(supabase, projectId, userId) {
  const { data: project } = await supabase
    .from('projects')
    .select('id, owner_id')
    .eq('id', projectId)
    .is('deleted_at', null)
    .single()

  if (!project) return { access: false, reason: 'Project not found', status: 404 }

  const isOwner = project.owner_id === userId

  const { data: member } = await supabase
    .from('project_members')
    .select('id')
    .eq('project_id', projectId)
    .eq('user_id', userId)
    .is('left_at', null)
    .maybeSingle()

  if (!isOwner && !member) {
    return { access: false, reason: 'Not a project member', status: 403 }
  }

  return { access: true, isOwner, project }
}

export async function PATCH(request, { params }) {
  try {
    const supabase = await createClient()
    const { id: projectId, taskId } = await params

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { access, reason, status, isOwner } = await checkWorkspaceAccess(
      supabase, projectId, user.id
    )
    if (!access) return NextResponse.json({ error: reason }, { status })

    const { data: existingTask } = await supabase
      .from('tasks')
      .select('id, assigned_to, status')
      .eq('id', taskId)
      .eq('project_id', projectId)
      .single()

    if (!existingTask) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    const body = await request.json()
    const updates = {}

    if (body.status !== undefined) {
      if (!VALID_STATUSES.includes(body.status)) {
        return NextResponse.json(
          { error: `Status must be one of: ${VALID_STATUSES.join(', ')}` },
          { status: 400 }
        )
      }
      updates.status = body.status
    }

    if (body.title !== undefined) {
      if (typeof body.title !== 'string' || body.title.trim().length === 0) {
        return NextResponse.json({ error: 'Title cannot be empty' }, { status: 400 })
      }
      updates.title = body.title.trim()
    }

    if (body.description !== undefined) {
      updates.description = body.description?.trim() || null
    }

    if (body.due_date !== undefined) {
      updates.due_date = body.due_date || null
    }

    if (body.assigned_to !== undefined) {
      if (!isOwner && body.assigned_to !== user.id) {
        return NextResponse.json(
          { error: 'Only the project owner can reassign tasks to others' },
          { status: 403 }
        )
      }
      updates.assigned_to = body.assigned_to || null
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
    }

    const { data: task, error } = await supabase
      .from('tasks')
      .update(updates)
      .eq('id', taskId)
      .eq('project_id', projectId)
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

    return NextResponse.json({ task }, { status: 200 })
  } catch {
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}

export async function DELETE(request, { params }) {
  try {
    const supabase = await createClient()
    const { id: projectId, taskId } = await params

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { access, reason, status, isOwner } = await checkWorkspaceAccess(
      supabase, projectId, user.id
    )
    if (!access) return NextResponse.json({ error: reason }, { status })

    const { data: existingTask } = await supabase
      .from('tasks')
      .select('id, assigned_to')
      .eq('id', taskId)
      .eq('project_id', projectId)
      .single()

    if (!existingTask) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    const isAssigned = existingTask.assigned_to === user.id
    if (!isOwner && !isAssigned) {
      return NextResponse.json(
        { error: 'Only the project owner or assigned member can delete this task' },
        { status: 403 }
      )
    }

    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', taskId)
      .eq('project_id', projectId)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ message: 'Task deleted' }, { status: 200 })
  } catch {
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}