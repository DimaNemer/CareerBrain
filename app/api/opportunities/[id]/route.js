import { createClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'
import { rateLimit } from '@/lib/rate-limit'

export const dynamic = 'force-dynamic'

export async function GET(request, { params }) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { limited } = rateLimit(`detail:${user.id}`, 30, 60000)
    if (limited) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
    }

    const { id } = await params
    if (!id) {
      return NextResponse.json({ error: 'Missing opportunity ID' }, { status: 400 })
    }

    const { data: opportunity, error: queryError } = await supabase
      .from('opportunities')
      .select(`
        id, title, company, location, opportunity_type, description,
        application_url, source, posted_at, created_at,
        opportunity_skills (
          importance_weight, is_mandatory,
          skills ( id, name )
        ),
        match_results (
          match_score, estimated_time_to_close,
          missing_skills ( id, skills ( id, name ) )
        )
      `)
      .eq('id', id)
      .single()

    if (queryError) {
      return NextResponse.json({ error: 'Opportunity not found' }, { status: 404 })
    }

    return NextResponse.json({ opportunity }, { status: 200 })
  } catch (err) {
    console.error('Single opportunity fetch error:', err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
