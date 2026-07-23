import { createClient } from '@/lib/supabase-server'
import {
  getProjectParticipantIds,
  sendProjectNotifications,
} from '@/lib/project-notifications'
import { NextResponse } from 'next/server'

async function checkWorkspaceAccess(supabase, projectId, userId) {
  const { data: project } = await supabase
    .from('projects')
    .select('id, owner_id, title')
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

    const { searchParams } = new URL(request.url)
    const before = searchParams.get('before')
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)

    let query = supabase
      .from('messages')
      .select(`
        id,
        content,
        created_at,
        sender_id,
        profiles!messages_sender_id_fkey (
          id,
          full_name,
          username,
          avatar_url
        )
      `)
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (before) {
      query = query.lt('created_at', before)
    }

    const { data: messages, error } = await query

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ messages: messages.reverse() }, { status: 200 })
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
    const { content } = body

    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return NextResponse.json({ error: 'Message content is required' }, { status: 400 })
    }

    if (content.trim().length > 2000) {
      return NextResponse.json(
        { error: 'Message must be under 2000 characters' },
        { status: 400 }
      )
    }

    const { data: message, error } = await supabase
      .from('messages')
      .insert({
        project_id: projectId,
        sender_id: user.id,
        content: content.trim(),
      })
      .select(`
        id,
        content,
        created_at,
        sender_id,
        profiles!messages_sender_id_fkey (
          id,
          full_name,
          username,
          avatar_url
        )
      `)
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    const participantIds = await getProjectParticipantIds(projectId)
    const recipientIds = participantIds.filter((participantId) => participantId !== user.id)
    const senderName =
      message.profiles?.full_name || message.profiles?.username || 'A project member'

    await sendProjectNotifications({
      recipientIds,
      type: 'workspace_chat_message',
      title: `New message in ${project.title}`,
      message: `${senderName}: ${message.content}`,
      projectId,
      actionUrl: `/projects/${projectId}/workspace`,
      data: { message_id: message.id, sender_id: user.id },
    })

    return NextResponse.json({ message }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
