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

    const body = await request.json()
    const { status } = body

    const allowedStatuses = ['todo', 'in_progress', 'done']

    if (!allowedStatuses.includes(status)) {
      return NextResponse.json({ error: 'Invalid task status' }, { status: 400 })
    }

    const { data: task, error } = await supabase
      .from('tasks')
      .update({ status })
      .eq('id', taskId)
      .eq('project_id', projectId)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

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


