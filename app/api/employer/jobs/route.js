
import { createClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

const VALID_EMPLOYMENT_TYPES = ['full-time', 'part-time', 'contract', 'internship', 'freelance']
const VALID_EXPERIENCE_LEVELS = ['entry', 'junior', 'mid', 'senior', 'lead']
const VALID_COVER_LETTER_REQUIREMENTS = [
  'not_requested',
  'optional',
  'required',
]

const VALID_QUESTION_TYPES = [
  'yes_no',
  'short_text',
  'long_text',
  'number',
  'single_choice',
]


// ── Verify user is an employer ────────────────────────────────────────────────
async function verifyEmployer(supabase) {
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { authorized: false, status: 401, error: 'Not authenticated' }
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, role, company_name')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'employer') {
    return { authorized: false, status: 403, error: 'Employer access required' }
  }

  return { authorized: true, user, profile }
}

// ── GET /api/employer/jobs ────────────────────────────────────────────────────
export async function GET(request) {
  try {
    const supabase = await createClient()
    const { authorized, status, error, user } = await verifyEmployer(supabase)
    if (!authorized) return NextResponse.json({ error }, { status })

    const { searchParams } = new URL(request.url)
    const filter = searchParams.get('filter') || 'all' // all | active | inactive

    let query = supabase
      .from('job_postings')
      .select('*')
      .eq('employer_id', user.id)
      .order('created_at', { ascending: false })

    if (filter === 'active') query = query.eq('is_active', true)
    if (filter === 'inactive') query = query.eq('is_active', false)

    const { data: jobs, error: fetchError } = await query

    if (fetchError) {
      return NextResponse.json({ error: fetchError.message }, { status: 500 })
    }

    return NextResponse.json({ jobs }, { status: 200 })
  } catch {
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}

// ── POST /api/employer/jobs ───────────────────────────────────────────────────
export async function POST(request) {
  try {
    const supabase = await createClient()
    const { authorized, status, error, user, profile } = await verifyEmployer(supabase)
    if (!authorized) return NextResponse.json({ error }, { status })

    const body = await request.json()
  const {
  title,
  location,
  employment_type,
  experience_level,
  description,
  requirements,
  salary_min,
  salary_max,
  is_active,

  require_resume = true,
  cover_letter_requirement = 'optional',
  share_profile = true,
  share_match_score = true,
  questions = [],
} = body

    // ── Validation ────────────────────────────────────────────────────────────
    if (!title?.trim()) {
      return NextResponse.json({ error: 'Job title is required' }, { status: 400 })
    }
    if (title.trim().length > 150) {
      return NextResponse.json({ error: 'Title must be under 150 characters' }, { status: 400 })
    }
    if (!description?.trim()) {
      return NextResponse.json({ error: 'Job description is required' }, { status: 400 })
    }
    if (description.trim().length < 50) {
      return NextResponse.json({ error: 'Description must be at least 50 characters' }, { status: 400 })
    }
    if (employment_type && !VALID_EMPLOYMENT_TYPES.includes(employment_type)) {
      return NextResponse.json({ error: 'Invalid employment type' }, { status: 400 })
    }
    if (experience_level && !VALID_EXPERIENCE_LEVELS.includes(experience_level)) {
      return NextResponse.json({ error: 'Invalid experience level' }, { status: 400 })
    }
    if (salary_min !== undefined && salary_max !== undefined) {
      if (typeof salary_min !== 'number' || typeof salary_max !== 'number') {
        return NextResponse.json({ error: 'Salary must be a number' }, { status: 400 })
      }
      if (salary_min < 0 || salary_max < 0) {
        return NextResponse.json({ error: 'Salary cannot be negative' }, { status: 400 })
      }
      if (salary_min > salary_max) {
        return NextResponse.json({ error: 'Minimum salary cannot exceed maximum salary' }, { status: 400 })
      }
    }
    if (
  !VALID_COVER_LETTER_REQUIREMENTS.includes(
    cover_letter_requirement
  )
) {
  return NextResponse.json(
    { error: 'Invalid cover letter requirement' },
    { status: 400 }
  )
}

if (typeof require_resume !== 'boolean') {
  return NextResponse.json(
    { error: 'Resume requirement must be true or false' },
    { status: 400 }
  )
}

if (typeof share_profile !== 'boolean') {
  return NextResponse.json(
    { error: 'Share profile must be true or false' },
    { status: 400 }
  )
}

if (typeof share_match_score !== 'boolean') {
  return NextResponse.json(
    { error: 'Share match score must be true or false' },
    { status: 400 }
  )
}

if (!Array.isArray(questions)) {
  return NextResponse.json(
    { error: 'Questions must be an array' },
    { status: 400 }
  )
}

if (questions.length > 20) {
  return NextResponse.json(
    { error: 'A job can have a maximum of 20 questions' },
    { status: 400 }
  )
}

for (const question of questions) {
  if (!question?.question_text?.trim()) {
    return NextResponse.json(
      { error: 'Every screening question must include text' },
      { status: 400 }
    )
  }

  if (question.question_text.trim().length > 500) {
    return NextResponse.json(
      {
        error:
          'Screening questions must be under 500 characters',
      },
      { status: 400 }
    )
  }

  if (
    !VALID_QUESTION_TYPES.includes(
      question.question_type
    )
  ) {
    return NextResponse.json(
      { error: 'Invalid screening question type' },
      { status: 400 }
    )
  }

  if (
    question.question_type === 'single_choice' &&
    (
      !Array.isArray(question.options) ||
      question.options.length < 2
    )
  ) {
    return NextResponse.json(
      {
        error:
          'Single-choice questions require at least two options',
      },
      { status: 400 }
    )
  }
}

    const { data: job, error: insertError } = await supabase
      .from('job_postings')
      .insert({
        employer_id: user.id,
        title: title.trim(),
        company_name: profile.company_name || 'Company',
        location: location?.trim() || null,
        employment_type: employment_type || null,
        experience_level: experience_level || null,
        description: description.trim(),
        requirements: requirements?.trim() || null,
        salary_min: salary_min || null,
        salary_max: salary_max || null,
        is_active: is_active !== false,
        require_resume,
cover_letter_requirement,
share_profile,
share_match_score,
      })
      .select()
      .single()

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }
let createdQuestions = []

if (questions.length > 0) {
  const questionRows = questions.map(
    (question, index) => ({
      job_id: job.id,
      question_text:
        question.question_text.trim(),

      question_type:
        question.question_type,

      is_required:
        question.is_required === true,

      options:
        question.question_type === 'single_choice'
          ? question.options
              .map((option) =>
                typeof option === 'string'
                  ? option.trim()
                  : ''
              )
              .filter(Boolean)
          : null,

      display_order: index,
    })
  )

  const {
    data: insertedQuestions,
    error: questionsError,
  } = await supabase
    .from('job_application_questions')
    .insert(questionRows)
    .select()

  if (questionsError) {
    console.error(
      'Question insert failed:',
      questionsError.message
    )

    return NextResponse.json(
      {
        error:
          'The job was created, but its screening questions could not be saved',
      },
      { status: 500 }
    )
  }

  createdQuestions = insertedQuestions || []
}
   return NextResponse.json(
  {
    job: {
      ...job,
      job_application_questions: createdQuestions,
    },
  },
  { status: 201 }
)
  } catch {
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}