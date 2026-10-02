import { createClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'
import {
  requireEmployer,
  canManagePipeline,
} from '@/lib/employer-auth'
import {
  createServiceClient,
} from '@/lib/supabase-service'

const VALID_STATUSES = [
  'submitted',
  'reviewing',
  'shortlisted',
  'rejected',
  'accepted',
]

const STATUS_COPY = {
  reviewing: {
    title: 'Your application is being reviewed',
    message:
      'The employer is reviewing your application. We will let you know as soon as there is news.',
  },
  shortlisted: {
    title: 'You have been shortlisted',
    message:
      'Great news - the employer shortlisted you. Keep an eye on your profile and CV.',
  },
  rejected: {
    title: 'Update on your application',
    message:
      'The employer has decided not to move forward with your application right now. Keep applying - your next role is out there.',
  },
  accepted: {
    title: 'Your application was accepted',
    message:
      'Congratulations! The employer accepted your application. They will be in touch with the next steps.',
  },
}
// GET /api/employer/applications/[applicationId]
export async function GET(request, { params }) {
  try {
    const supabase = await createClient()

    const guard = await requireEmployer(supabase)

    if (!guard.authorized) {
      return NextResponse.json(
        { error: guard.error },
        { status: guard.status }
      )
    }

    const { company } = guard

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
  const serviceSupabase =
    createServiceClient()

  const {
    data: signedResume,
    error: signedResumeError,
  } = await serviceSupabase.storage
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
    resumeUrl =
      signedResume?.signedUrl || null
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

    const guard = await requireEmployer(supabase)

    if (!guard.authorized) {
      return NextResponse.json(
        { error: guard.error },
        { status: guard.status }
      )
    }

    const { membership, company } = guard

    if (!canManagePipeline(membership)) {
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
    applicant_id,
    status,
    job_postings!inner (
      company_id,
      title
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
      .eq('job_id', existingApplication.job_id)
      .select(`
        id,
        job_id,
        applicant_id,
        status,
        updated_at
      `)
      .single()

if (updateError) {
  console.error(
    'Application status update failed:',
    updateError.message
  )

  return NextResponse.json(
    { error: 'Unable to update that application' },
    { status: 500 }
  )
}

    // Tell the applicant when their stage actually changes. The recipient is
    // the applicant_id read from the application row that we already proved
    // belongs to this company - it is never taken from the request body.
    const statusChanged =
      existingApplication.status !== application.status

    if (statusChanged && STATUS_COPY[newStatus]) {
      const jobTitle = existingApplication.job_postings?.title

      try {
        const serviceSupabase = createServiceClient()

        await serviceSupabase.from('notifications').insert({
          user_id: existingApplication.applicant_id,
          type: newStatus === 'accepted' ? 'application' : 'applicant',
          title: STATUS_COPY[newStatus].title,
          message: jobTitle
            ? `${STATUS_COPY[newStatus].message} (${jobTitle})`
            : STATUS_COPY[newStatus].message,
          is_read: false,
          is_emailed: false,
          action_url: '/my-applications',
          data: {
            application_id: application.id,
            job_id: application.job_id,
            status: newStatus,
            company_id: company.id,
          },
        })
      } catch (notifyError) {
        // Notification delivery must never fail the status update.
        console.error(
          'Applicant status notification failed:',
          notifyError.message
        )
      }
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