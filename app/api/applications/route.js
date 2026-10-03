import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

/**
 * GET /api/applications
 *
 * The applicant's own applications, newest first, with the job each one is
 * for embedded. Scoped to the caller by `.eq('applicant_id', user.id)`, so
 * this can never return somebody else's applications.
 *
 * Backs /my-applications, which is what the acceptance/rejection
 * notifications point at.
 */
export async function GET(request) {
  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)

    // Lets the notification deep-link straight to one application instead of
    // dumping the applicant at the top of an unordered-looking list.
    const highlight = searchParams.get('application')

    const { data, error } = await supabase
      .from('job_applications')
      .select(`
        id,
        status,
        created_at,
        updated_at,
        cv_url,
        cover_letter,
        job_id,
        job_postings (
          id,
          title,
          company_name,
          location,
          employment_type,
          is_active
        )
      `)
      .eq('applicant_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error(
        '[Applications API] Query failed:',
        error.message
      )

      return NextResponse.json(
        { error: 'Unable to load your applications' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      applications: data || [],
      total: data?.length || 0,
      highlight: highlight || null,
    })
  } catch (err) {
    console.error('[Applications API] Error:', err)
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}