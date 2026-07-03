import { createClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export async function POST(request, { params }) {
  try {
    const supabase = await createClient()
    const { id: projectId } = await params

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { data: project } = await supabase
      .from('projects')
      .select('id, owner_id, status, title')
      .eq('id', projectId)
      .is('deleted_at', null)
      .single()

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    if (project.owner_id !== user.id) {
      return NextResponse.json(
        { error: 'Only the project owner can mark the project as complete' },
        { status: 403 }
      )
    }

    if (project.status === 'completed') {
      return NextResponse.json(
        { error: 'Project is already marked as complete' },
        { status: 400 }
      )
    }

    const { data: existingRequest } = await supabase
      .from('completion_requests')
      .select('id, status')
      .eq('project_id', projectId)
      .eq('status', 'pending')
      .maybeSingle()

    if (existingRequest) {
      return NextResponse.json(
        { error: 'A completion request is already pending' },
        { status: 400 }
      )
    }

    const { data: members } = await supabase
      .from('project_members')
      .select('user_id')
      .eq('project_id', projectId)
      .is('left_at', null)

    const memberCount = members?.length || 0
    const requiredConfirmations = Math.min(Math.max(Math.ceil(memberCount / 2), 1), 5)

    const { data: completionRequest, error: requestError } = await supabase
      .from('completion_requests')
      .insert({
        project_id: projectId,
        requested_by: user.id,
        status: 'pending',
        required_confirmations: requiredConfirmations,
      })
      .select()
      .single()

    if (requestError) {
      return NextResponse.json({ error: requestError.message }, { status: 500 })
    }

    await supabase
      .from('completion_confirmations')
      .insert({
        request_id: completionRequest.id,
        user_id: user.id,
        confirmed: true,
        confirmed_at: new Date().toISOString(),
      })

    if (memberCount === 0) {
      await finalizeCompletion(supabase, projectId, completionRequest.id, user.id)
      return NextResponse.json(
        { message: 'Project marked as complete', status: 'completed' },
        { status: 200 }
      )
    }

    return NextResponse.json(
      {
        message: `Waiting for ${requiredConfirmations - 1} more confirmation(s).`,
        status: 'pending',
        required: requiredConfirmations,
        confirmed: 1,
      },
      { status: 200 }
    )
  } catch {
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}

export async function PUT(request, { params }) {
  try {
    const supabase = await createClient()
    const { id: projectId } = await params

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { data: member } = await supabase
      .from('project_members')
      .select('id')
      .eq('project_id', projectId)
      .eq('user_id', user.id)
      .is('left_at', null)
      .maybeSingle()

    if (!member) {
      return NextResponse.json(
        { error: 'Only project members can confirm completion' },
        { status: 403 }
      )
    }

    const { data: completionRequest } = await supabase
      .from('completion_requests')
      .select('id, required_confirmations, status')
      .eq('project_id', projectId)
      .eq('status', 'pending')
      .single()

    if (!completionRequest) {
      return NextResponse.json(
        { error: 'No pending completion request found' },
        { status: 404 }
      )
    }

    const { data: alreadyConfirmed } = await supabase
      .from('completion_confirmations')
      .select('id')
      .eq('request_id', completionRequest.id)
      .eq('user_id', user.id)
      .maybeSingle()

    if (alreadyConfirmed) {
      return NextResponse.json(
        { error: 'You have already confirmed this completion request' },
        { status: 400 }
      )
    }

    await supabase
      .from('completion_confirmations')
      .insert({
        request_id: completionRequest.id,
        user_id: user.id,
        confirmed: true,
        confirmed_at: new Date().toISOString(),
      })

    const { count: confirmationCount } = await supabase
      .from('completion_confirmations')
      .select('id', { count: 'exact' })
      .eq('request_id', completionRequest.id)
      .eq('confirmed', true)

    if (confirmationCount >= completionRequest.required_confirmations) {
      await finalizeCompletion(supabase, projectId, completionRequest.id, user.id)
      return NextResponse.json(
        { message: 'Project is now complete', status: 'completed' },
        { status: 200 }
      )
    }

    const remaining = completionRequest.required_confirmations - confirmationCount
    return NextResponse.json(
      {
        message: `${remaining} more confirmation(s) needed.`,
        status: 'pending',
        confirmed: confirmationCount,
        required: completionRequest.required_confirmations,
      },
      { status: 200 }
    )
  } catch {
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}

async function finalizeCompletion(supabase, projectId, requestId, verifiedBy) {
  await supabase
    .from('projects')
    .update({ status: 'completed' })
    .eq('id', projectId)

  await supabase
    .from('completion_requests')
    .update({ status: 'approved' })
    .eq('id', requestId)

  await supabase
    .from('completed_projects')
    .insert({
      project_id: projectId,
      verified_by: verifiedBy,
      completed_at: new Date().toISOString(),
    })

  const { data: projectRoles } = await supabase
    .from('project_roles')
    .select('skill_id')
    .eq('project_id', projectId)
    .not('skill_id', 'is', null)

  const skillIds = projectRoles?.map(r => r.skill_id) || []
  if (skillIds.length === 0) return

  const { data: members } = await supabase
    .from('project_members')
    .select('user_id')
    .eq('project_id', projectId)

  const { data: project } = await supabase
    .from('projects')
    .select('owner_id')
    .eq('id', projectId)
    .single()

  const allUserIds = [
    ...new Set([
      ...(members?.map(m => m.user_id) || []),
      project?.owner_id,
    ].filter(Boolean))
  ]

  for (const userId of allUserIds) {
    for (const skillId of skillIds) {
      await supabase
        .from('user_skills')
        .upsert(
          {
            user_id: userId,
            skill_id: skillId,
            source: 'Project',
            proficiency_level: 2,
          },
          { onConflict: 'user_id,skill_id' }
        )
    }
  }
}