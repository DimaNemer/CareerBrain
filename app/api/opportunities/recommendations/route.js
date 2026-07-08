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

    const { limited } = rateLimit(`recs:${user.id}`, 15, 60000)
    if (limited) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
    }

    const { searchParams } = new URL(request.url)
    const source = searchParams.get('source') || null
    const limit = Math.min(parseInt(searchParams.get('limit') || '5'), 20)

    const validSources = ['Adzuna', 'Remotive']
    if (source && !validSources.includes(source)) {
      return NextResponse.json(
        { error: `Invalid source. Must be one of: ${validSources.join(', ')}` },
        { status: 400 }
      )
    }

    let query = supabase
      .from('match_results')
      .select(`
        match_score,
        estimated_time_to_close,
        missing_skills (
          id,
          skills (
            id,
            name
          )
        ),
        opportunities!inner (
          id,
          title,
          company,
          location,
          opportunity_type,
          description,
          application_url,
          source,
          posted_at,
          created_at,
          opportunity_skills (
            importance_weight,
            is_mandatory,
            skills (
              id,
              name
            )
          )
        )
      `)
      .eq('user_id', user.id)
      .order('match_score', { ascending: false })
      .limit(limit)

    if (source) {
      query = query.eq('opportunities.source', source)
    }

    const { data, error: queryError } = await query

    if (queryError) {
      console.error('Recommendations Query Error:', queryError.message)
      return NextResponse.json(
        { error: 'Internal server query processing failure' }, 
        { status: 500 }
      )
    }

    const opportunities = (data || []).map(item => ({
      ...item.opportunities,
      match_results: [{
        match_score: item.match_score,
        estimated_time_to_close: item.estimated_time_to_close,
        missing_skills: item.missing_skills,
      }]
    }))

    return NextResponse.json({ opportunities, count: opportunities.length, source, limit }, { status: 200 })

  } catch (err) {
    console.error('Recommendations API Error:', err)
    return NextResponse.json(
      { error: 'Internal Server Error' }, 
      { status: 500 }
    )
  }   
}
