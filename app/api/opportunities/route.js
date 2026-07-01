import { createClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

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

    const { searchParams } = new URL(request.url)
    const limit = Math.min(parseInt(searchParams.get('limit') || '100'), 200)
    const offset = parseInt(searchParams.get('offset') || '0')

    const { data: opportunities, count, error: queryError } = await supabase
      .from('opportunities')
      .select(`
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
        ),
        match_results (
          match_score,
          estimated_time_to_close,
          missing_skills (
            id,
            skills (
              id,
              name
            )
          )
        )
      `, { count: 'estimated' })
      .order('created_at', { ascending: false })
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