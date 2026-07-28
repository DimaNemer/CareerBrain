import { createClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

const VALID_EMPLOYMENT_TYPES = ['full-time', 'part-time', 'contract', 'internship', 'freelance']
const VALID_EXPERIENCE_LEVELS = ['entry', 'junior', 'mid', 'senior', 'lead']

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

// ── GET /api/employer/jobs/[id] ───────────────────────────────────────────────
export async function GET(request, { params }) {
  try {
    const supabase = await createClient()
    const { authorized, status, error, user } = await verifyEmployer(supabase)
    if (!authorized) return NextResponse.json({ error }, { status })

    const { id } = await params

    const { data: job, error: fetchError } = await supabase
      .from('job_postings')
      .select('*')
      .eq('id', id)
      .eq('employer_id', user.id)
      .single()

    if (fetchError || !job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 })
    }

    return NextResponse.json({ job }, { status: 200 })
  } catch {
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}

// ── PUT /api/employer/jobs/[id] ───────────────────────────────────────────────
export async function PUT(request, { params }) {
  try {
    const supabase = await createClient()
    const { authorized, status, error, user } = await verifyEmployer(supabase)
    if (!authorized) return NextResponse.json({ error }, { status })

    const { id } = await params

    // Verify ownership first
    const { data: existing } = await supabase
      .from('job_postings')
      .select('id, employer_id')
      .eq('id', id)
      .eq('employer_id', user.id)
      .single()

    if (!existing) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 })
    }

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
  require_resume,
  cover_letter_requirement,
  share_profile,
  share_match_score,
} = body

    // ── Validation ────────────────────────────────────────────────────────────
    if (title !== undefined) {
      if (!title.trim()) return NextResponse.json({ error: 'Title cannot be empty' }, { status: 400 })
      if (title.trim().length > 150) return NextResponse.json({ error: 'Title must be under 150 characters' }, { status: 400 })
    }
    if (description !== undefined) {
      if (!description.trim()) return NextResponse.json({ error: 'Description cannot be empty' }, { status: 400 })
      if (description.trim().length < 50) return NextResponse.json({ error: 'Description must be at least 50 characters' }, { status: 400 })
    }
    if (employment_type && !VALID_EMPLOYMENT_TYPES.includes(employment_type)) {
      return NextResponse.json({ error: 'Invalid employment type' }, { status: 400 })
    }
    if (experience_level && !VALID_EXPERIENCE_LEVELS.includes(experience_level)) {
      return NextResponse.json({ error: 'Invalid experience level' }, { status: 400 })
    }
    if (salary_min !== undefined && salary_max !== undefined) {
      if (salary_min > salary_max) {
        return NextResponse.json({ error: 'Minimum salary cannot exceed maximum' }, { status: 400 })
      }
    }

    // Build updates object — only include fields that were sent
    const updates = {}
    if (title !== undefined) updates.title = title.trim()
    if (location !== undefined) updates.location = location?.trim() || null
    if (employment_type !== undefined) updates.employment_type = employment_type || null
    if (experience_level !== undefined) updates.experience_level = experience_level || null
    if (description !== undefined) updates.description = description.trim()
    if (requirements !== undefined) updates.requirements = requirements?.trim() || null
    if (salary_min !== undefined) updates.salary_min = salary_min || null
    if (salary_max !== undefined) updates.salary_max = salary_max || null
    if (is_active !== undefined) updates.is_active = is_active
    if (require_resume !== undefined) {
  updates.require_resume = require_resume
}

if (cover_letter_requirement !== undefined) {
  if (
    ![
      'not_requested',
      'optional',
      'required',
    ].includes(cover_letter_requirement)
  ) {
    return NextResponse.json(
      {
        error:
          'Invalid cover letter requirement',
      },
      { status: 400 }
    )
  }

  updates.cover_letter_requirement =
    cover_letter_requirement
}

if (share_profile !== undefined) {
  updates.share_profile = share_profile
}

if (share_match_score !== undefined) {
  updates.share_match_score =
    share_match_score
}

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
    }

    const { data: job, error: updateError } = await supabase
      .from('job_postings')
      .update(updates)
      .eq('id', id)
      .eq('employer_id', user.id)
      .select()
      .single()

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    return NextResponse.json({ job }, { status: 200 })
  } catch {
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}

// ── DELETE /api/employer/jobs/[id] ────────────────────────────────────────────
export async function DELETE(request, { params }) {
  try {
    const supabase = await createClient()
    const { authorized, status, error, user } = await verifyEmployer(supabase)
    if (!authorized) return NextResponse.json({ error }, { status })

    const { id } = await params

    // Verify ownership before deleting
    const { data: existing } = await supabase
      .from('job_postings')
      .select('id, employer_id')
      .eq('id', id)
      .eq('employer_id', user.id)
      .single()

    if (!existing) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 })
    }

    const { error: deleteError } = await supabase
      .from('job_postings')
      .delete()
      .eq('id', id)
      .eq('employer_id', user.id)

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 })
    }

    return NextResponse.json({ message: 'Job deleted successfully' }, { status: 200 })
  } catch {
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}