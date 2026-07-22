import { createClient } from '@/lib/supabase-server'
import { syncProjectStatusWithRoles } from '@/lib/project-status-server'
import { NextResponse } from 'next/server'

async function findOrCreateSkillId(supabase, skillName) {
  const normalizedSkillName = skillName?.trim()

  if (!normalizedSkillName) {
    return { skillId: null, error: null }
  }

  const { data: existingSkill, error: findError } = await supabase
    .from('skills')
    .select('id')
    .ilike('name', normalizedSkillName)
    .limit(1)
    .maybeSingle()

  if (findError) {
    return { skillId: null, error: findError }
  }

  if (existingSkill) {
    return { skillId: existingSkill.id, error: null }
  }

  const { data: newSkill, error: createError } = await supabase
    .from('skills')
    .insert({ name: normalizedSkillName })
    .select('id')
    .single()

  if (createError) {
    return { skillId: null, error: createError }
  }

  return { skillId: newSkill.id, error: null }
}

export async function GET(request) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('project_id')

    if (!projectId) {
      return NextResponse.json({ error: 'project_id is required' }, { status: 400 })
    }

    const { data: roles, error } = await supabase
      .from('project_roles')
      .select(`
        *,
        skills (
          id,
          name,
          category
        )
      `)
      .eq('project_id', projectId)
      .order('role_title', { ascending: true })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ roles }, { status: 200 })
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
    const roleTitle = body.role_title?.trim()
    let skillId = body.skill_id || null
    const skillName = body.skill_name?.trim()
    const quantityNeeded = Number(body.quantity_needed ?? 1)

    if (!projectId) {
      return NextResponse.json({ error: 'project_id is required' }, { status: 400 })
    }

    if (!roleTitle) {
      return NextResponse.json({ error: 'Role title is required' }, { status: 400 })
    }

    if (quantityNeeded < 0) {
      return NextResponse.json({ error: 'Quantity cannot be negative' }, { status: 400 })
    }

    // Check that logged-in user owns the project
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
        { error: 'Only the project owner can add roles' },
        { status: 403 }
      )
    }

    if (!skillId && skillName) {
      const { skillId: resolvedSkillId, error: skillError } =
        await findOrCreateSkillId(supabase, skillName)

      if (skillError) {
        return NextResponse.json({ error: skillError.message }, { status: 500 })
      }

      skillId = resolvedSkillId
    }

    const { data: role, error } = await supabase
      .from('project_roles')
      .insert({
        project_id: projectId,
        role_title: roleTitle,
        skill_id: skillId,
        quantity_needed: quantityNeeded,
      })
      .select(`
        *,
        skills (
          id,
          name,
          category
        )
      `)
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const { error: projectStatusError } =
      await syncProjectStatusWithRoles(supabase, projectId)

    if (projectStatusError) {
      return NextResponse.json({ error: projectStatusError.message }, { status: 500 })
    }

    return NextResponse.json({ role }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
