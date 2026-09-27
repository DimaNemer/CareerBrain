import { createClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

async function getEmployerCompany(supabase) {
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

  return {
    authorized: true,
    user,
    membership,
    company,
  }
}

// GET /api/employer/team
export async function GET() {
  try {
    const supabase = await createClient()

    const {
      authorized,
      status,
      error,
      membership,
      company,
    } = await getEmployerCompany(supabase)

    if (!authorized) {
      return NextResponse.json(
        { error },
        { status }
      )
    }

    if (
      !['owner', 'admin'].includes(
        membership.role
      )
    ) {
      return NextResponse.json(
        {
          error:
            'You do not have permission to manage this team',
        },
        { status: 403 }
      )
    }

    const {
      data: members,
      error: membersError,
    } = await supabase
      .from('company_members')
      .select(`
        id,
        company_id,
        user_id,
        job_title,
        role,
        is_current,
        started_at,
        ended_at,
        created_at,
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
      .eq('company_id', company.id)
      .eq('is_current', true)
      .order('created_at', {
        ascending: true,
      })

    if (membersError) {
      console.error(
        'Team members query failed:',
        membersError.message
      )

      return NextResponse.json(
        {
          error:
            'Unable to load company team',
        },
        { status: 500 }
      )
    }

    return NextResponse.json(
      {
        company,
        currentMembership: {
          role: membership.role,
          job_title:
            membership.job_title,
        },
        members: members || [],
      },
      { status: 200 }
    )
  } catch (error) {
    console.error(
      'Employer team GET error:',
      error
    )

    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 }
    )
  }
}