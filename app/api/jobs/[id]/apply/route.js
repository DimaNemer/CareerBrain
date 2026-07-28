import { createClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

const MAX_COVER_LETTER_LENGTH = 5000
const MAX_CV_URL_LENGTH = 2048

function cleanOptionalString(value) {
  if (typeof value !== 'string') return null

  const cleaned = value.trim()
  return cleaned || null
}



async function verifyJobSeeker(supabase) {
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
    data: profile,
    error: profileError,
  } = await supabase
    .from('profiles')
    .select('id, role, full_name')
    .eq('id', user.id)
    .single()

  if (profileError || !profile) {
    return {
      authorized: false,
      status: 403,
      error: 'User profile was not found',
    }
  }

  if (profile.role !== 'job_seeker') {
    return {
      authorized: false,
      status: 403,
      error: 'Only job seekers can apply for jobs',
    }
  }

  return {
    authorized: true,
    user,
    profile,
  }
}

// GET /api/jobs/[id]/apply
// Check whether the current candidate has already applied
export async function GET(request, { params }) {
  try {
    const supabase = await createClient()

    const {
      authorized,
      status,
      error,
      user,
    } = await verifyJobSeeker(supabase)

    if (!authorized) {
      return NextResponse.json(
        { error },
        { status }
      )
    }

    const { id } = await params

    if (!id || typeof id !== 'string') {
      return NextResponse.json(
        { error: 'Invalid job ID' },
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
        status,
        created_at
      `)
      .eq('job_id', id)
      .eq('applicant_id', user.id)
      .maybeSingle()

    if (applicationError) {
      console.error(
        'Application status check failed:',
        applicationError.message
      )

      return NextResponse.json(
        {
          error:
            'Unable to check application status',
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      has_applied: Boolean(application),
      application: application || null,
    })
  } catch (error) {
    console.error(
      'Application status route error:',
      error
    )

    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 }
    )
  }
}

// POST /api/jobs/[id]/apply
export async function POST(request, { params }) {
  try {
    const supabase = await createClient()

    const {
      authorized,
      status,
      error,
      user,
    } = await verifyJobSeeker(supabase)

    if (!authorized) {
      return NextResponse.json(
        { error },
        { status }
      )
    }

    const { id } = await params

    if (!id || typeof id !== 'string') {
      return NextResponse.json(
        { error: 'Invalid job ID' },
        { status: 400 }
      )
    }

  const {
  data: job,
  error: jobError,
} = await supabase
  .from('job_postings')
  .select(`
    id,
    employer_id,
    title,
    company_name,
    is_active,
    require_resume,
    cover_letter_requirement,
    share_profile,
    share_match_score,
    job_application_questions (
      id,
      question_text,
      question_type,
      is_required,
      options,
      display_order
    )
  `)
  .eq('id', id)
  .single()

    if (jobError || !job) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      )
    }

    if (!job.is_active) {
      return NextResponse.json(
        {
          error:
            'This job is no longer accepting applications',
        },
        { status: 400 }
      )
    }

    /*
     * Prevent an employer from applying to their own job.
     * The role check already blocks employers, but this is an
     * additional ownership protection.
     */
    if (job.employer_id === user.id) {
      return NextResponse.json(
        {
          error:
            'You cannot apply to your own job posting',
        },
        { status: 403 }
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

    let coverLetter =
      cleanOptionalString(body.cover_letter)

  const cvUrl =
  cleanOptionalString(body.cv_url)

const submittedAnswers =
  Array.isArray(body.answers)
    ? body.answers
    : []

if (
      coverLetter &&
      coverLetter.length > MAX_COVER_LETTER_LENGTH
    ) {
      return NextResponse.json(
        {
          error:
            'Cover letter must not exceed 5000 characters',
        },
        { status: 400 }
      )
    }

    if (
      cvUrl &&
      cvUrl.length > MAX_CV_URL_LENGTH
    ) {
      return NextResponse.json(
      { error: 'Resume storage path is too long' },
        { status: 400 }
      )
    }


    /*
     * Require at least a CV URL for now.
     * Later, when Supabase Storage upload is added, this field
     * will contain the uploaded CV's secure storage URL.
     */
const requireResume = job.require_resume !== false

if (requireResume && !cvUrl) {
  return NextResponse.json(
    {
      error: 'A resume is required for this job',
    },
    { status: 400 }
  )
}


const jobQuestions = Array.isArray(
  job.job_application_questions
)
  ? job.job_application_questions
  : []

const allowedQuestions = new Map(
  jobQuestions.map((question) => [
    question.id,
    question,
  ])
)

const answerMap = new Map()

for (const answer of submittedAnswers) {
  if (
    !answer ||
    typeof answer.question_id !== 'string'
  ) {
    continue
  }

  const question = allowedQuestions.get(
    answer.question_id
  )

  /*
   * Prevent answers from another job being submitted.
   */
  if (!question) {
    return NextResponse.json(
      {
        error:
          'One or more screening answers are invalid',
      },
      { status: 400 }
    )
  }

  const cleanedAnswer =
    cleanOptionalString(answer.answer_text)

  if (
    cleanedAnswer &&
    cleanedAnswer.length > 2000
  ) {
    return NextResponse.json(
      {
        error:
          'Screening answers must not exceed 2000 characters',
      },
      { status: 400 }
    )
  }

  if (cleanedAnswer) {
    answerMap.set(
      question.id,
      cleanedAnswer
    )
  }
}

for (const question of jobQuestions) {
  if (
    question.is_required &&
    !answerMap.has(question.id)
  ) {
    return NextResponse.json(
      {
        error:
          `Please answer: ${question.question_text}`,
      },
      { status: 400 }
    )
  }
}
    /*
     * Check for an existing application before inserting.
     * The database UNIQUE constraint provides a second layer
     * of protection against duplicate applications.
     */
    const {
      data: existingApplication,
      error: duplicateCheckError,
    } = await supabase
      .from('job_applications')
      .select('id, status')
      .eq('job_id', id)
      .eq('applicant_id', user.id)
      .maybeSingle()

    if (duplicateCheckError) {
      console.error(
        'Application duplicate check failed:',
        duplicateCheckError.message
      )

      return NextResponse.json(
        {
          error:
            'Unable to verify your application status',
        },
        { status: 500 }
      )
    }

    if (existingApplication) {
      return NextResponse.json(
        {
          error:
            'You have already applied for this job',
          application:
            existingApplication,
        },
        { status: 409 }
      )
    }

    const coverLetterRequirement =
  job.cover_letter_requirement || 'optional'

if (
  coverLetterRequirement === 'required' &&
  !coverLetter
) {
  return NextResponse.json(
    {
      error:
        'A cover letter is required for this job',
    },
    { status: 400 }
  )
}

if (coverLetterRequirement === 'not_requested') {
  /*
   * Ignore a cover letter sent by a modified client.
   */
  coverLetter = null
}

 const {
  data: application,
  error: insertError,
} = await supabase
  .from('job_applications')
  .insert({
    job_id: id,
    applicant_id: user.id,
    cv_url: cvUrl,
    cover_letter: coverLetter,
    status: 'submitted',
  })
  .select(`
    id,
    job_id,
    applicant_id,
    cv_url,
    cover_letter,
    status,
    created_at
  `)
  .single()

if (insertError) {
  console.error(
    'Application insert failed:',
    insertError.message
  )

  if (insertError.code === '23505') {
    return NextResponse.json(
      {
        error:
          'You have already applied for this job',
      },
      { status: 409 }
    )
  }

  return NextResponse.json(
    {
      error:
        'Unable to submit your application. Please try again.',
    },
    { status: 500 }
  )
}

const answerRows = Array.from(
  answerMap.entries()
).map(([questionId, answerText]) => ({
  application_id: application.id,
  question_id: questionId,
  answer_text: answerText,
}))

if (answerRows.length > 0) {
  const { error: answersError } = await supabase
    .from('job_application_answers')
    .insert(answerRows)

  if (answersError) {
    console.error(
      'Application answers insert failed:',
      answersError.message
    )

    return NextResponse.json(
      {
        error:
          'Your application was created, but its screening answers could not be saved',
      },
      { status: 500 }
    )
  }
}

    return NextResponse.json(
      {
        message:
          'Application submitted successfully',
        application,
        job: {
          id: job.id,
          title: job.title,
          company_name: job.company_name,
        },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error(
      'Job application route error:',
      error
    )

    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 }
    )
  }
}