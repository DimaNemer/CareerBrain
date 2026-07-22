import { createClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'
import { rateLimit } from '@/lib/rate-limit'

export const dynamic = 'force-dynamic'

export async function GET(request) {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized access denied' }, 
        { status: 401 }
      )
    }

    const { limited } = rateLimit(`list:${user.id}`, 30, 60000)
    if (limited) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
    }

    const { searchParams } = new URL(request.url)
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 200)
    const offset = parseInt(searchParams.get('offset') || '0')
    const sortBy = searchParams.get('sort') || 'created_at'
    const sortDir = searchParams.get('dir') === 'asc' ? 'asc' : 'desc'
    const sortMap = { created_at: 'created_at', company: 'company', title: 'title' }
    const orderCol = sortMap[sortBy] || 'created_at'

    const { data: opportunities, count, error: queryError } = await supabase
      .from('opportunities')
      .select(`
        id, title, company, location, opportunity_type, description,
        application_url, source, posted_at, created_at,
        opportunity_skills ( importance_weight, is_mandatory, skills ( id, name ) ),
        match_results ( match_score, estimated_time_to_close,
          missing_skills ( id, skills ( id, name ) )
        )
      `, { count: 'estimated' })
      .order(orderCol, { ascending: sortDir === 'asc', nullsFirst: false })
      .range(offset, offset + limit - 1)

    if (queryError) {
      console.error('Database Retrieval Query Error:', queryError.message)
      return NextResponse.json(
        { error: 'Internal server query processing failure' }, 
        { status: 500 }
      )
    }

    return NextResponse.json({ opportunities, count, limit, offset }, { status: 200 })

  } catch (err) {
    console.error('Unexpected Global Data Fetch API Error:', err)
    return NextResponse.json(
      { error: 'Internal Server Error' }, 
      { status: 500 }
    )
  }   
}