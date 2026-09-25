import { createClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

async function getAuthenticatedUser(supabase) {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return {
      user: null,
      error: 'Not authenticated',
      status: 401,
    }
  }

  return {
    user,
    error: null,
    status: 200,
  }
}

// GET /api/profile/experience
export async function GET() {
  try {
    const supabase = await createClient()

    const {
      user,
      error,
      status,
    } = await getAuthenticatedUser(supabase)

    if (!user) {
      return NextResponse.json(
        { error },
        { status }
      )
    }

    const {
      data: experiences,
      error: experiencesError,
    } = await supabase
      .from('profile_experience')
      .select(`
        id,
        user_id,
        company_id,
        company_name,
        job_title,
        location,
        start_date,
        end_date,
        is_current,
        description,
        created_at,
        updated_at,
        companies (
          id,
          name,
          logo_url
        )
      `)
      .eq('user_id', user.id)
      .order('is_current', {
        ascending: false,
      })
      .order('start_date', {
        ascending: false,
      })

    if (experiencesError) {
      console.error(
        'Experience GET error:',
        experiencesError.message
      )

      return NextResponse.json(
        {
          error:
            'Unable to load work experience',
        },
        { status: 500 }
      )
    }

    return NextResponse.json(
      {
        experiences: experiences || [],
      },
      { status: 200 }
    )
  } catch (error) {
    console.error(
      'Experience GET unexpected error:',
      error
    )

    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 }
    )
  }
}

// POST /api/profile/experience
export async function POST(request) {
  try {
    const supabase = await createClient()

    const {
      user,
      error,
      status,
    } = await getAuthenticatedUser(supabase)

    if (!user) {
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

    const jobTitle =
      typeof body.job_title === 'string'
        ? body.job_title.trim()
        : ''

    const companyName =
      typeof body.company_name === 'string'
        ? body.company_name.trim()
        : ''

    const location =
      typeof body.location === 'string'
        ? body.location.trim()
        : ''

    const startDate =
      typeof body.start_date === 'string'
        ? body.start_date
        : ''

    const endDate =
      typeof body.end_date === 'string'
        ? body.end_date
        : ''

    const description =
      typeof body.description === 'string'
        ? body.description.trim()
        : ''

    const isCurrent =
      body.is_current === true

    if (!jobTitle) {
      return NextResponse.json(
        { error: 'Job title is required' },
        { status: 400 }
      )
    }

    if (!companyName) {
      return NextResponse.json(
        { error: 'Company name is required' },
        { status: 400 }
      )
    }

    if (!startDate) {
      return NextResponse.json(
        { error: 'Start date is required' },
        { status: 400 }
      )
    }

    if (
      !isCurrent &&
      endDate &&
      new Date(endDate) < new Date(startDate)
    ) {
      return NextResponse.json(
        {
          error:
            'End date cannot be before start date',
        },
        { status: 400 }
      )
    }

    let companyId = null

    const {
      data: companyMatch,
      error: companyMatchError,
    } = await supabase
      .from('companies')
      .select('id, name')
      .ilike('name', companyName)
      .maybeSingle()

    if (companyMatchError) {
      console.error(
        'Company match error:',
        companyMatchError.message
      )
    }

    if (companyMatch) {
      companyId = companyMatch.id
    }

    const {
      data: experience,
      error: insertError,
    } = await supabase
      .from('profile_experience')
      .insert({
        user_id: user.id,
        company_id: companyId,
        company_name: companyName,
        job_title: jobTitle,
        location: location || null,
        start_date: startDate,
        end_date:
          isCurrent || !endDate
            ? null
            : endDate,
        is_current: isCurrent,
        description:
          description || null,
      })
      .select(`
        id,
        user_id,
        company_id,
        company_name,
        job_title,
        location,
        start_date,
        end_date,
        is_current,
        description,
        created_at,
        updated_at,
        companies (
          id,
          name,
          logo_url
        )
      `)
      .single()

    if (insertError) {
      console.error(
        'Experience insert error:',
        insertError.message
      )

      return NextResponse.json(
        {
          error:
            insertError.message ||
            'Unable to add work experience',
        },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { experience },
      { status: 201 }
    )
  } catch (error) {
    console.error(
      'Experience POST unexpected error:',
      error
    )

    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 }
    )
  }
}

// PUT /api/profile/experience
export async function PUT(request) {
  try {
    const supabase = await createClient()

    const {
      user,
      error,
      status,
    } = await getAuthenticatedUser(supabase)

    if (!user) {
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

    const experienceId = body.id

    if (!experienceId) {
      return NextResponse.json(
        {
          error:
            'Experience ID is required',
        },
        { status: 400 }
      )
    }

    const jobTitle =
      typeof body.job_title === 'string'
        ? body.job_title.trim()
        : ''

    const companyName =
      typeof body.company_name === 'string'
        ? body.company_name.trim()
        : ''

    const location =
      typeof body.location === 'string'
        ? body.location.trim()
        : ''

    const startDate =
      typeof body.start_date === 'string'
        ? body.start_date
        : ''

    const endDate =
      typeof body.end_date === 'string'
        ? body.end_date
        : ''

    const description =
      typeof body.description === 'string'
        ? body.description.trim()
        : ''

    const isCurrent =
      body.is_current === true

    if (!jobTitle) {
      return NextResponse.json(
        { error: 'Job title is required' },
        { status: 400 }
      )
    }

    if (!companyName) {
      return NextResponse.json(
        { error: 'Company name is required' },
        { status: 400 }
      )
    }

    if (!startDate) {
      return NextResponse.json(
        { error: 'Start date is required' },
        { status: 400 }
      )
    }

    if (
      !isCurrent &&
      endDate &&
      new Date(endDate) < new Date(startDate)
    ) {
      return NextResponse.json(
        {
          error:
            'End date cannot be before start date',
        },
        { status: 400 }
      )
    }

    const {
      data: existing,
      error: existingError,
    } = await supabase
      .from('profile_experience')
      .select('id')
      .eq('id', experienceId)
      .eq('user_id', user.id)
      .maybeSingle()

    if (existingError) {
      console.error(
        'Experience ownership check error:',
        existingError.message
      )

      return NextResponse.json(
        {
          error:
            'Unable to verify work experience',
        },
        { status: 500 }
      )
    }

    if (!existing) {
      return NextResponse.json(
        {
          error:
            'Work experience not found',
        },
        { status: 404 }
      )
    }

    let companyId = null

    const {
      data: companyMatch,
      error: companyMatchError,
    } = await supabase
      .from('companies')
      .select('id, name')
      .ilike('name', companyName)
      .maybeSingle()

    if (companyMatchError) {
      console.error(
        'Company match error:',
        companyMatchError.message
      )
    }

    if (companyMatch) {
      companyId = companyMatch.id
    }

    const {
      data: experience,
      error: updateError,
    } = await supabase
      .from('profile_experience')
      .update({
        company_id: companyId,
        company_name: companyName,
        job_title: jobTitle,
        location: location || null,
        start_date: startDate,
        end_date:
          isCurrent || !endDate
            ? null
            : endDate,
        is_current: isCurrent,
        description:
          description || null,
        updated_at:
          new Date().toISOString(),
      })
      .eq('id', experienceId)
      .eq('user_id', user.id)
      .select(`
        id,
        user_id,
        company_id,
        company_name,
        job_title,
        location,
        start_date,
        end_date,
        is_current,
        description,
        created_at,
        updated_at,
        companies (
          id,
          name,
          logo_url
        )
      `)
      .single()

    if (updateError) {
      console.error(
        'Experience update error:',
        updateError.message
      )

      return NextResponse.json(
        {
          error:
            updateError.message ||
            'Unable to update work experience',
        },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { experience },
      { status: 200 }
    )
  } catch (error) {
    console.error(
      'Experience PUT unexpected error:',
      error
    )

    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 }
    )
  }
}

// DELETE /api/profile/experience?experienceId=...
export async function DELETE(request) {
  try {
    const supabase = await createClient()

    const {
      user,
      error,
      status,
    } = await getAuthenticatedUser(supabase)

    if (!user) {
      return NextResponse.json(
        { error },
        { status }
      )
    }

    const { searchParams } =
      new URL(request.url)

    const experienceId =
      searchParams.get('experienceId')

    if (!experienceId) {
      return NextResponse.json(
        {
          error:
            'Experience ID is required',
        },
        { status: 400 }
      )
    }

    const {
      data: existing,
      error: existingError,
    } = await supabase
      .from('profile_experience')
      .select('id')
      .eq('id', experienceId)
      .eq('user_id', user.id)
      .maybeSingle()

    if (existingError) {
      console.error(
        'Experience delete check error:',
        existingError.message
      )

      return NextResponse.json(
        {
          error:
            'Unable to verify work experience',
        },
        { status: 500 }
      )
    }

    if (!existing) {
      return NextResponse.json(
        {
          error:
            'Work experience not found',
        },
        { status: 404 }
      )
    }

    const { error: deleteError } =
      await supabase
        .from('profile_experience')
        .delete()
        .eq('id', experienceId)
        .eq('user_id', user.id)

    if (deleteError) {
      console.error(
        'Experience delete error:',
        deleteError.message
      )

      return NextResponse.json(
        {
          error:
            deleteError.message ||
            'Unable to delete work experience',
        },
        { status: 500 }
      )
    }

    return NextResponse.json(
      {
        message:
          'Work experience deleted successfully',
      },
      { status: 200 }
    )
  } catch (error) {
    console.error(
      'Experience DELETE unexpected error:',
      error
    )

    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 }
    )
  }
}