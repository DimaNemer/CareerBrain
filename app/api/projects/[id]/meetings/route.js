import { createClient } from '@/lib/supabase-server'
import {
  getProjectParticipantIds,
  sendProjectNotifications,
} from '@/lib/project-notifications'
import { NextResponse } from 'next/server'

async function checkAccess(supabase, projectId, userId) {
  const { data: project } = await supabase
    .from('projects')
    .select('id, owner_id, title')
    .eq('id', projectId)
    .is('deleted_at', null)
    .single()

  if (!project) return { access: false, status: 404, reason: 'Project not found' }

  const isOwner = project.owner_id === userId

  const { data: member } = await supabase
    .from('project_members')
    .select('id')
    .eq('project_id', projectId)
    .eq('user_id', userId)
    .is('left_at', null)
    .maybeSingle()

  if (!isOwner && !member) return { access: false, status: 403, reason: 'Not a member' }

  return { access: true, isOwner, project }
}

// GET /api/projects/[id]/meetings
export async function GET(request, { params }) {
  try {
    const supabase = await createClient()
    const { id: projectId } = await params

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { access, status, reason } = await checkAccess(supabase, projectId, user.id)
    if (!access) return NextResponse.json({ error: reason }, { status })

    const { data: meetings, error } = await supabase
      .from('project_meetings')
      .select(`
        id,
        title,
        scheduled_at,
        meeting_url,
        description,
        created_at,
        profiles!project_meetings_created_by_fkey (
          id,
          full_name,
          username
        )
      `)
      .eq('project_id', projectId)
      .order('scheduled_at', { ascending: true })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ meetings }, { status: 200 })
  } catch {
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}

// POST /api/projects/[id]/meetings
export async function POST(request, { params }) {
  try {
    const supabase = await createClient()
    const { id: projectId } = await params

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { access, status, reason, project } = await checkAccess(supabase, projectId, user.id)
    if (!access) return NextResponse.json({ error: reason }, { status })

    const body = await request.json()
    const { title, scheduled_at, meeting_url, description } = body

    if (!title || !scheduled_at) {
      return NextResponse.json(
        { error: 'Title and scheduled time are required' },
        { status: 400 }
      )
    }

    if (new Date(scheduled_at) < new Date()) {
      return NextResponse.json(
        { error: 'Meeting must be scheduled in the future' },
        { status: 400 }
      )
    }

    const { data: meeting, error } = await supabase
      .from('project_meetings')
      .insert({
        project_id: projectId,
        created_by: user.id,
        title: title.trim(),
        scheduled_at,
        meeting_url: meeting_url?.trim() || null,
        description: description?.trim() || null,
      })
      .select(`
        id,
        title,
        scheduled_at,
        meeting_url,
        description,
        created_at,
        profiles!project_meetings_created_by_fkey (
          id,
          full_name,
          username
        )
      `)
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    const participantIds = await getProjectParticipantIds(projectId)
    const recipientIds = participantIds.filter((participantId) => participantId !== user.id)
    const creatorName =
      meeting.profiles?.full_name || meeting.profiles?.username || 'A project member'

    await sendProjectNotifications({
      recipientIds,
      type: 'workspace_meeting_scheduled',
      title: `New meeting for ${project.title}`,
      message: `${creatorName} scheduled "${meeting.title}" for ${new Date(meeting.scheduled_at).toLocaleString()}.`,
      projectId,
      actionUrl: `/projects/${projectId}/workspace`,
      data: { meeting_id: meeting.id, created_by: user.id },
    })

    return NextResponse.json({ meeting }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}

// DELETE /api/projects/[id]/meetings?meetingId=xxx
export async function DELETE(request, { params }) {
  try {
    const supabase = await createClient()
    const { id: projectId } = await params
    const { searchParams } = new URL(request.url)
    const meetingId = searchParams.get('meetingId')

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { access, status, reason, isOwner } = await checkAccess(supabase, projectId, user.id)
    if (!access) return NextResponse.json({ error: reason }, { status })

    const { data: meeting } = await supabase
      .from('project_meetings')
      .select('id, created_by')
      .eq('id', meetingId)
      .eq('project_id', projectId)
      .single()

    if (!meeting) return NextResponse.json({ error: 'Meeting not found' }, { status: 404 })

    if (!isOwner && meeting.created_by !== user.id) {
      return NextResponse.json(
        { error: 'You can only delete your own meetings' },
        { status: 403 }
      )
    }

    await supabase.from('project_meetings').delete().eq('id', meetingId)

    return NextResponse.json({ message: 'Meeting deleted' }, { status: 200 })
  } catch {
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
