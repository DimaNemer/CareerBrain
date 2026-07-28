import { createClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

// GET /api/jobs/[id]
export async function GET(request, { params }) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
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
  location,
  employment_type,
  experience_level,
  description,
  requirements,
  salary_min,
  salary_max,
  is_active,
  created_at,
  updated_at,

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
.maybeSingle()

    if (jobError) {
      console.error('Internal job query failed:', {
        code: jobError.code,
        message: jobError.message,
        details: jobError.details,
        hint: jobError.hint,
      })

      return NextResponse.json(
        {
          error: 'Unable to load job',
          details:
            process.env.NODE_ENV === 'development'
              ? jobError.message
              : undefined,
        },
        { status: 500 }
      )
    }

    if (!job) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      )
    }

    const formattedJob = {
      id: job.id,
      employer_id: job.employer_id,
      title: job.title,
      company: job.company_name,
      company_name: job.company_name,
      location: job.location,

      // Keep this name because the opportunities page expects it
      opportunity_type: job.employment_type,
      employment_type: job.employment_type,

      experience_level: job.experience_level,
      description: job.description,
      requirements: job.requirements,
      salary_min: job.salary_min,
      salary_max: job.salary_max,
      is_active: job.is_active,

      application_url: null,
      source: 'Employer',
      posted_at: job.created_at,
      created_at: job.created_at,
      updated_at: job.updated_at,
      is_employer_job: true,
      opportunity_skills: [],
      match_results: [],
    }

    return NextResponse.json({
      job: formattedJob,
    })
  } catch (error) {
    console.error('Get internal job error:', error)

    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 }
    )
  }
}