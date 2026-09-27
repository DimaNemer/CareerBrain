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
      company_id,
      role,
      job_title,
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
        'You do not have permission to manage team invitations',
    }
  }

  return {
    authorized: true,
    user,
    membership,
    company,
  }
}

// GET /api/employer/team/invitations
export async function GET() {
  try {
    const supabase = await createClient()

    const {
      authorized,
      status,
      error,
      company,
    } = await getCompanyContext(supabase)

    if (!authorized) {
      return NextResponse.json(
        { error },
        { status }
      )
    }

    const {
      data: invitations,
      error: invitationsError,
    } = await supabase
      .from('company_invitations')
      .select(`
        id,
        company_id,
        invited_user_id,
        invited_by,
        job_title,
        role,
        status,
        created_at,
        responded_at,
        invited_user:profiles!company_invitations_invited_user_id_fkey (
          id,
          full_name,
          username,
          headline,
          avatar_url
        )
      `)
      .eq('company_id', company.id)
      .order('created_at', {
        ascending: false,
      })

    if (invitationsError) {
      console.error(
        'Invitation GET error:',
        invitationsError.message
      )

      return NextResponse.json(
        {
          error:
            'Unable to load invitations',
        },
        { status: 500 }
      )
    }

    return NextResponse.json(
      {
        invitations:
          invitations || [],
      },
      { status: 200 }
    )
  } catch (error) {
    console.error(
      'Invitation GET unexpected error:',
      error
    )

    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 }
    )
  }
}

// POST /api/employer/team/invitations
export async function POST(request) {
  try {
    const supabase = await createClient()

    const {
      authorized,
      status,
      error,
      user,
      company,
    } = await getCompanyContext(supabase)

    if (!authorized) {
      return NextResponse.json(
        { error },
        { status }
      )
    }

    let body

    try {
      body = await request.json()
    } catch {
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      )
    }

    const username =
      typeof body.username === 'string'
        ? body.username.trim().replace(/^@/, '')
        : ''

    const jobTitle =
      typeof body.job_title === 'string'
        ? body.job_title.trim()
        : ''

    const role =
      typeof body.role === 'string'
        ? body.role.trim()
        : ''

    if (!username) {
      return NextResponse.json(
        {
          error:
            'Username is required',
        },
        { status: 400 }
      )
    }

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
            'Invalid team role',
        },
        { status: 400 }
      )
    }

    const {
      data: invitedProfile,
      error: profileError,
    } = await supabase
      .from('profiles')
      .select(`
        id,
        full_name,
        username,
        headline,
        avatar_url
      `)
      .eq('username', username)
      .maybeSingle()

    if (profileError) {
      console.error(
        'Invitation profile lookup error:',
        profileError.message
      )

      return NextResponse.json(
        {
          error:
            'Unable to find user',
        },
        { status: 500 }
      )
    }

    if (!invitedProfile) {
      return NextResponse.json(
        {
          error:
            'No user was found with that username',
        },
        { status: 404 }
      )
    }

    if (invitedProfile.id === user.id) {
      return NextResponse.json(
        {
          error:
            'You are already part of this company',
        },
        { status: 400 }
      )
    }

    const {
      data: existingMembership,
      error: membershipError,
    } = await supabase
      .from('company_members')
      .select('id, is_current')
      .eq('company_id', company.id)
      .eq('user_id', invitedProfile.id)
      .eq('is_current', true)
      .maybeSingle()

    if (membershipError) {
      console.error(
        'Existing membership check error:',
        membershipError.message
      )

      return NextResponse.json(
        {
          error:
            'Unable to verify existing membership',
        },
        { status: 500 }
      )
    }

    if (existingMembership) {
      return NextResponse.json(
        {
          error:
            'This user is already a current member of the company',
        },
        { status: 409 }
      )
    }

    const {
      data: pendingInvitation,
      error: pendingError,
    } = await supabase
      .from('company_invitations')
      .select('id')
      .eq('company_id', company.id)
      .eq(
        'invited_user_id',
        invitedProfile.id
      )
      .eq('status', 'pending')
      .maybeSingle()

    if (pendingError) {
      console.error(
        'Pending invitation check error:',
        pendingError.message
      )

      return NextResponse.json(
        {
          error:
            'Unable to verify existing invitation',
        },
        { status: 500 }
      )
    }

    if (pendingInvitation) {
      return NextResponse.json(
        {
          error:
            'This user already has a pending invitation',
        },
        { status: 409 }
      )
    }

    const {
      data: invitation,
      error: insertError,
    } = await supabase
      .from('company_invitations')
      .insert({
        company_id: company.id,
        invited_user_id:
          invitedProfile.id,
        invited_by: user.id,
        job_title: jobTitle,
        role,
        status: 'pending',
      })
      .select(`
        id,
        company_id,
        invited_user_id,
        invited_by,
        job_title,
        role,
        status,
        created_at,
        responded_at
      `)
      .single()

    if (insertError) {
      console.error(
        'Invitation insert error:',
        insertError.message
      )

      return NextResponse.json(
        {
          error:
            insertError.message ||
            'Unable to create invitation',
        },
        { status: 500 }
      )
    }

    return NextResponse.json(
      {
        message:
          'Invitation sent successfully',
        invitation: {
          ...invitation,
          invited_user:
            invitedProfile,
        },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error(
      'Invitation POST unexpected error:',
      error
    )

    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 }
    )
  }
}