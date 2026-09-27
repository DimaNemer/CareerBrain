import { createClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

const VALID_ROLES = [
  'admin',
  'recruiter',
  'viewer',
]

async function getCompanyContext(supabase) {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return {
      authorized: false,
      status: 401,
      error: 'Not authenticated',
    }
  }

  const {
    data: membership,
    error: membershipError,
  } = await supabase
    .from('company_members')
    .select(`
      id,
      company_id,
      user_id,
      role,
      job_title,
      is_current,
      companies (
        id,
        name
      )
    `)
    .eq('user_id', user.id)
    .eq('is_current', true)
    .maybeSingle()

  if (membershipError || !membership) {
    return {
      authorized: false,
      status: 403,
      error: 'No active company membership found',
    }
  }

  const company = Array.isArray(
    membership.companies
  )
    ? membership.companies[0]
    : membership.companies

  if (!company) {
    return {
      authorized: false,
      status: 403,
      error: 'Company not found',
    }
  }

  if (
    !['owner', 'admin'].includes(
      membership.role
    )
  ) {
    return {
      authorized: false,
      status: 403,
      error:
        'You do not have permission to manage team members',
    }
  }

  return {
    authorized: true,
    user,
    membership,
    company,
  }
}

// PUT /api/employer/team/[memberId]
export async function PUT(
  request,
  { params }
) {
  try {
    const supabase = await createClient()

    const {
      authorized,
      status,
      error,
      membership: currentMembership,
      company,
    } = await getCompanyContext(supabase)

    if (!authorized) {
      return NextResponse.json(
        { error },
        { status }
      )
    }

    const { memberId } = await params

    if (!memberId) {
      return NextResponse.json(
        {
          error:
            'Invalid team member ID',
        },
        { status: 400 }
      )
    }

    const {
      data: targetMember,
      error: targetError,
    } = await supabase
      .from('company_members')
      .select(`
        id,
        user_id,
        company_id,
        role,
        job_title,
        is_current
      `)
      .eq('id', memberId)
      .eq('company_id', company.id)
      .eq('is_current', true)
      .maybeSingle()

    if (targetError) {
      console.error(
        'Team member lookup error:',
        targetError.message
      )

      return NextResponse.json(
        {
          error:
            'Unable to load team member',
        },
        { status: 500 }
      )
    }

    if (!targetMember) {
      return NextResponse.json(
        {
          error:
            'Team member not found',
        },
        { status: 404 }
      )
    }

    if (targetMember.role === 'owner') {
      return NextResponse.json(
        {
          error:
            'The company owner cannot be edited here',
        },
        { status: 403 }
      )
    }

    if (
      currentMembership.role === 'admin' &&
      targetMember.role === 'admin'
    ) {
      return NextResponse.json(
        {
          error:
            'Admins cannot manage other admins',
        },
        { status: 403 }
      )
    }

    let body

    try {
      body = await request.json()
    } catch {
      return NextResponse.json(
        {
          error:
            'Invalid request body',
        },
        { status: 400 }
      )
    }

    const jobTitle =
      typeof body.job_title === 'string'
        ? body.job_title.trim()
        : ''

    const role =
      typeof body.role === 'string'
        ? body.role.trim()
        : ''

    if (!jobTitle) {
      return NextResponse.json(
        {
          error:
            'Job title is required',
        },
        { status: 400 }
      )
    }

    if (!VALID_ROLES.includes(role)) {
      return NextResponse.json(
        {
          error:
            'Invalid company role',
        },
        { status: 400 }
      )
    }

    if (
      currentMembership.role === 'admin' &&
      role === 'admin'
    ) {
      return NextResponse.json(
        {
          error:
            'Admins cannot assign the admin role',
        },
        { status: 403 }
      )
    }

    const {
      data: updatedMember,
      error: updateError,
    } = await supabase
      .from('company_members')
      .update({
        job_title: jobTitle,
        role,
        updated_at:
          new Date().toISOString(),
      })
      .eq('id', memberId)
      .eq('company_id', company.id)
      .select(`
        id,
        company_id,
        user_id,
        job_title,
        role,
        is_current,
        started_at,
        ended_at,
        updated_at,
        profiles (
          id,
          full_name,
          username,
          headline,
          avatar_url,
          location
        )
      `)
      .single()

    if (updateError) {
      console.error(
        'Team member update error:',
        updateError.message
      )

      return NextResponse.json(
        {
          error:
            updateError.message ||
            'Unable to update team member',
        },
        { status: 500 }
      )
    }

    return NextResponse.json(
      {
        message:
          'Team member updated successfully',
        member: updatedMember,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error(
      'Team member PUT error:',
      error
    )

    return NextResponse.json(
      {
        error:
          'Something went wrong',
      },
      { status: 500 }
    )
  }
}

// DELETE /api/employer/team/[memberId]
export async function DELETE(
  request,
  { params }
) {
  try {
    const supabase = await createClient()

    const {
      authorized,
      status,
      error,
      membership: currentMembership,
      company,
    } = await getCompanyContext(supabase)

    if (!authorized) {
      return NextResponse.json(
        { error },
        { status }
      )
    }

    const { memberId } = await params

    if (!memberId) {
      return NextResponse.json(
        {
          error:
            'Invalid team member ID',
        },
        { status: 400 }
      )
    }

    const {
      data: targetMember,
      error: targetError,
    } = await supabase
      .from('company_members')
      .select(`
        id,
        user_id,
        role,
        is_current
      `)
      .eq('id', memberId)
      .eq('company_id', company.id)
      .eq('is_current', true)
      .maybeSingle()

    if (targetError) {
      console.error(
        'Team member remove lookup error:',
        targetError.message
      )

      return NextResponse.json(
        {
          error:
            'Unable to load team member',
        },
        { status: 500 }
      )
    }

    if (!targetMember) {
      return NextResponse.json(
        {
          error:
            'Team member not found',
        },
        { status: 404 }
      )
    }

    if (targetMember.role === 'owner') {
      return NextResponse.json(
        {
          error:
            'The company owner cannot be removed',
        },
        { status: 403 }
      )
    }

    if (
      currentMembership.role === 'admin' &&
      targetMember.role === 'admin'
    ) {
      return NextResponse.json(
        {
          error:
            'Admins cannot remove other admins',
        },
        { status: 403 }
      )
    }

    const today =
      new Date()
        .toISOString()
        .slice(0, 10)

    const {
      data: removedMember,
      error: removeError,
    } = await supabase
      .from('company_members')
      .update({
        is_current: false,
        ended_at: today,
        updated_at:
          new Date().toISOString(),
      })
      .eq('id', memberId)
      .eq('company_id', company.id)
      .select()
      .single()

    if (removeError) {
      console.error(
        'Team member remove error:',
        removeError.message
      )

      return NextResponse.json(
        {
          error:
            removeError.message ||
            'Unable to remove team member',
        },
        { status: 500 }
      )
    }

    return NextResponse.json(
      {
        message:
          'Team member removed successfully',
        member: removedMember,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error(
      'Team member DELETE error:',
      error
    )

    return NextResponse.json(
      {
        error:
          'Something went wrong',
      },
      { status: 500 }
    )
  }
}