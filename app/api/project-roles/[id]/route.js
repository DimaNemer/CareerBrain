import { createClient } from '@/lib/supabase-server'
import { syncProjectStatusWithRoles } from '@/lib/project-status-server'
import { NextResponse } from 'next/server'

async function getRoleWithProject(supabase, roleId) {
  const { data: role, error } = await supabase
    .from('project_roles')
    .select(`
      id,
      project_id,
      role_title,
      skill_id,
      quantity_needed,
      projects!project_roles_project_id_fkey (
        id,
        owner_id,
        deleted_at
      )
    `)
    .eq('id', roleId)
    .maybeSingle()

  return { role, error }
}

export async function PUT(request, { params }) {
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

    const { role, error: roleError } = await getRoleWithProject(supabase, id)

    if (roleError || !role || role.projects?.deleted_at) {
      return NextResponse.json({ error: 'Role not found' }, { status: 404 })
    }

    if (role.projects.owner_id !== user.id) {
      return NextResponse.json(
        { error: 'Only the project owner can update this role' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const updates = {}

    if (body.role_title !== undefined) {
      const roleTitle = body.role_title.trim()

      if (!roleTitle) {
        return NextResponse.json({ error: 'Role title is required' }, { status: 400 })
      }

      updates.role_title = roleTitle
    }

    if (body.skill_id !== undefined) {
      updates.skill_id = body.skill_id || null
    }

    if (body.quantity_needed !== undefined) {
      const quantityNeeded = Number(body.quantity_needed)

      if (quantityNeeded < 0) {
        return NextResponse.json({ error: 'Quantity cannot be negative' }, { status: 400 })
      }

      updates.quantity_needed = quantityNeeded
    }

    const { error } = await supabase
      .from('project_roles')
      .update(updates)
      .eq('id', id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const { error: projectStatusError } =
      await syncProjectStatusWithRoles(supabase, role.project_id)

    if (projectStatusError) {
      return NextResponse.json({ error: projectStatusError.message }, { status: 500 })
    }

    const { data: updatedRole, error: fetchError } = await supabase
      .from('project_roles')
      .select(`
        *,
        skills (
          id,
          name,
          category
        )
      `)
      .eq('id', id)
      .maybeSingle()

    if (fetchError) {
      return NextResponse.json({ error: fetchError.message }, { status: 500 })
    }

    return NextResponse.json({ role: updatedRole }, { status: 200 })
  } catch {
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}

export async function DELETE(request, { params }) {
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

    const { role, error: roleError } = await getRoleWithProject(supabase, id)

    if (roleError || !role || role.projects?.deleted_at) {
      return NextResponse.json({ error: 'Role not found' }, { status: 404 })
    }

    if (role.projects.owner_id !== user.id) {
      return NextResponse.json(
        { error: 'Only the project owner can delete this role' },
        { status: 403 }
      )
    }

    const { data: activeRequests, error: activeRequestsError } = await supabase
      .from('join_requests')
      .select('id')
      .eq('project_role_id', id)
      .in('status', ['pending', 'accepted'])
      .limit(1)

    if (activeRequestsError) {
      return NextResponse.json({ error: activeRequestsError.message }, { status: 500 })
    }

    if (activeRequests && activeRequests.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete this role because it has pending or accepted requests.' },
        { status: 400 }
      )
    }

    // Delete all old/inactive requests connected to this role
    const { error: oldRequestsError } = await supabase
      .from('join_requests')
      .delete()
      .eq('project_role_id', id)

    if (oldRequestsError) {
      return NextResponse.json({ error: oldRequestsError.message }, { status: 500 })
    }

    const { error } = await supabase
      .from('project_roles')
      .delete()
      .eq('id', id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const { error: projectStatusError } =
      await syncProjectStatusWithRoles(supabase, role.project_id)

    if (projectStatusError) {
      return NextResponse.json({ error: projectStatusError.message }, { status: 500 })
    }

    return NextResponse.json({ message: 'Role deleted successfully' }, { status: 200 })
  } catch {
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
