import { createClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

// 🔥 THE UI FIX: Forces Next.js to fetch live data instead of showing a frozen cache
export const dynamic = 'force-dynamic'

/**
 * GET Handler - Retrieves all opportunities with match scores and skill gaps.
 */
export async function GET() {
  try {
    const supabase = await createClient()

    // 1. Strict Server-Side Authentication Guard
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized access denied' }, 
        { status: 401 }
      )
    }

    // 2. 🔥 UPDATED QUERY: Added match_results and missing_skills back into the selector
    const { data: opportunities, error: queryError } = await supabase
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
            name
          )
        ),
        match_results (
          match_score,
          estimated_time_to_close,
          missing_skills (
            id,
            skills (
              name
            )
          )
        )
      `)
      .order('created_at', { ascending: false })

    // 3. Secure Database Error Interception
    if (queryError) {
      console.error('Database Retrieval Query Error:', queryError.message)
      return NextResponse.json(
        { error: 'Internal server query processing failure' }, 
        { status: 500 }
      )
    }

    // 4. Safe Payload API Response Delivery
    return NextResponse.json({ opportunities }, { status: 200 })

  } catch (err) {
    console.error('Unexpected Global Data Fetch API Error:', err)
    return NextResponse.json(
      { error: 'Internal Server Error' }, 
      { status: 500 }
    )
  }   
}