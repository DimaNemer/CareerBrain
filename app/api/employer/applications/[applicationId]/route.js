import { createClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

const VALID_STATUSES = [
  'submitted',
  'reviewing',
  'shortlisted',
  'rejected',
  'accepted',
]

async function verifyEmployer(supabase) {
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
// GET /api/employer/applications/[applicationId]
export async function GET(request, { params }) {
  try {
    const supabase = await createClient()

    const {
  authorized,
  status,
  error,
  membership,
  company,
} = await verifyEmployer(supabase)

    if (!authorized) {
      return NextResponse.json(
        { error },
        { status }
      )
    }
if (
  !['owner', 'admin', 'recruiter'].includes(
    membership.role
  )
) {
  return NextResponse.json(
    {
      error:
        'You do not have permission to view applications for this company',
    },
    { status: 403 }
  )
}
    const { applicationId } = await params

    if (!applicationId) {
      return NextResponse.json(
        { error: 'Invalid application ID' },
        { status: 400 }
      )
    }

    const {
      data: application,
      error: applicationError,
    } = await supabase
      .from('job_applications')
      .select(`
        id,
        job_id,
        applicant_id,
        cv_url,
        cover_letter,
        status,
        created_at,
        updated_at,
     job_postings!inner (
  id,
  company_id,
  title,
  company_name,
  require_resume,
  cover_letter_requirement,
  share_profile,
  share_match_score
)
      `)
      .eq('id', applicationId)
     .eq('job_postings.company_id', company.id)
      .single()

    if (applicationError || !application) {
      return NextResponse.json(
        { error: 'Application not found' },
        { status: 404 }
      )
    }

   const {
  data: applicantProfile,
  error: profileError,
} = await supabase
  .from('profiles')
  .select(`
    id,
    full_name,
    headline
  `)
  .eq('id', application.applicant_id)
  .maybeSingle()

if (profileError) {
  console.error(
    'Applicant profile load failed:',
    profileError.message
  )
}

    const {
      data: answers,
      error: answersError,
    } = await supabase
      .from('job_application_answers')
      .select(`
        id,
        question_id,
        answer_text,
        job_application_questions (
          id,
          question_text,
          question_type,
          display_order
        )
      `)
      .eq('application_id', application.id)

    if (answersError) {
      console.error(
        'Application answers load failed:',
        answersError.message
      )
    }

    const sortedAnswers = (answers || []).sort(
      (firstAnswer, secondAnswer) => {
        const firstOrder =
          firstAnswer.job_application_questions
            ?.display_order ?? 0

        const secondOrder =
          secondAnswer.job_application_questions
            ?.display_order ?? 0

        return firstOrder - secondOrder
      }
    )
    let resumeUrl = null

if (application.cv_url) {
  const {
    data: signedResume,
    error: signedResumeError,
  } = await supabase.storage
    .from('resumes')
    .createSignedUrl(
      application.cv_url,
      60 * 60
    )

  if (signedResumeError) {
    console.error(
      'Resume signed URL generation failed:',
      signedResumeError.message
    )
  } else {
    resumeUrl = signedResume?.signedUrl || null
  }
}

return NextResponse.json(
  {
    application: {
      ...application,
      applicant_profile:
        applicantProfile || null,
      answers: sortedAnswers,
      resume_url: resumeUrl,
    },
  },
  { status: 200 }
)
  } catch (error) {
    console.error(
      'Employer application GET error:',
      error
    )

    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 }
    )
  }
}

// PUT /api/employer/applications/[applicationId]
export async function PUT(request, { params }) {
  try {
    const supabase = await createClient()

  const {
  authorized,
  status,
  error,
  membership,
  company,
} = await verifyEmployer(supabase)

    if (!authorized) {
      return NextResponse.json(
        { error },
        { status }
      )
    }
if (
  !['owner', 'admin', 'recruiter'].includes(
    membership.role
  )
) {
  return NextResponse.json(
    {
      error:
        'You do not have permission to update application statuses for this company',
    },
    { status: 403 }
  )
}
    const { applicationId } = await params

    if (!applicationId) {
      return NextResponse.json(
        { error: 'Invalid application ID' },
        { status: 400 }
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

    const { status: newStatus } = body

    if (!VALID_STATUSES.includes(newStatus)) {
      return NextResponse.json(
        { error: 'Invalid application status' },
        { status: 400 }
      )
    }

const {
  data: existingApplication,
  error: applicationError,
} = await supabase
  .from('job_applications')
  .select(`
    id,
    job_id,
    job_postings!inner (
      company_id
    )
  `)
  .eq('id', applicationId)
  .eq('job_postings.company_id', company.id)
  .single()

    if (
      applicationError ||
      !existingApplication
    ) {
      return NextResponse.json(
        { error: 'Application not found' },
        { status: 404 }
      )
    }

    const {
      data: application,
      error: updateError,
    } = await supabase
      .from('job_applications')
      .update({
        status: newStatus,
      })
      .eq('id', applicationId)
      .select(`
        id,
        job_id,
        applicant_id,
        status,
        updated_at
      `)
      .single()

    if (updateError) {
      return NextResponse.json(
        { error: updateError.message },
        { status: 500 }
      )
    }

    return NextResponse.json(
      {
        message:
          'Application status updated successfully',
        application,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error(
      'Employer application PUT error:',
      error
    )

    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 }
    )
  }
}