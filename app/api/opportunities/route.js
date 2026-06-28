import { createClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

/**
 * GET Handler - Retrieves all opportunities with linked semantic skill badges.
 * Securely enforces server-side authentication gates.
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

    // 2. Fetch all jobs and join relational skill badges through the bridge table
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