import { createClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

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
    const skillId = body.skill_id || null
    const quantityNeeded = Number(body.quantity_needed || 1)

    if (!projectId) {
      return NextResponse.json({ error: 'project_id is required' }, { status: 400 })
    }

    if (!roleTitle) {
      return NextResponse.json({ error: 'Role title is required' }, { status: 400 })
    }

    if (quantityNeeded < 1) {
      return NextResponse.json({ error: 'Quantity must be at least 1' }, { status: 400 })
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

    return NextResponse.json({ role }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}