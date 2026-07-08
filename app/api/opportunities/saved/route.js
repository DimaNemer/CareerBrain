import { createClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'
import { rateLimit } from '@/lib/rate-limit'

// Forces Next.js to run this endpoint dynamically on every request to prevent caching stale data
export const dynamic = 'force-dynamic'

/**
 * GET /api/opportunities/saved
 * Retrieves all opportunities bookmarked by the currently authenticated user.
 * Executes an inner join query to pull details from opportunities and match_results.
 */
export async function GET() {
  try {
    const supabase = await createClient()

    // 1. Strict user authentication verification
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized access denied' }, 
        { status: 401 }
      )
    }

    const { limited } = rateLimit(`saved-list:${user.id}`, 20, 60000)
    if (limited) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
    }

    // 2. Perform query retrieving bookmarks with full job details
    const { data: savedItems, error: queryError } = await supabase
      .from('saved_opportunities')
      .select(`
        id,
        opportunity:opportunities!inner (
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
        )
      `)
      .eq('user_id', user.id)
      .order('id', { ascending: false })

    if (queryError) {
      console.error('Failed to retrieve saved opportunities:', queryError.message)
      return NextResponse.json(
        { error: 'Database query processing failure' }, 
        { status: 500 }
      )
    }

    // 3. Format the payload to deliver clean job objects directly to the client
    const opportunities = (savedItems || [])
      .filter(item => item.opportunity)
      .map(item => ({
        ...item.opportunity,
        saved_opportunity_id: item.id,
      }))

    return NextResponse.json({ opportunities }, { status: 200 })
  } catch (err) {
    console.error('Unexpected error in GET /api/opportunities/saved:', err)
    return NextResponse.json(
      { error: 'Internal Server Error' }, 
      { status: 500 }
    )
  }
}

/**
 * POST /api/opportunities/saved
 * Saves/bookmarks a specific opportunity for the authenticated user.
 * Protects against duplicates using ON CONFLICT (user_id, opportunity_id) DO NOTHING logic.
 */
export async function POST(request) {
  try {
    const supabase = await createClient()

    // 1. Authenticate user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized access denied' }, 
        { status: 401 }
      )
    }

    const { limited } = rateLimit(`saved-add:${user.id}`, 10, 60000)
    if (limited) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
    }

    // 2. Parse request body
    let opportunityId
    try {
      const body = await request.json()
      opportunityId = body.opportunity_id
    } catch {
      return NextResponse.json(
        { error: 'Bad Request: Invalid or missing JSON request body' }, 
        { status: 400 }
      )
    }

    if (!opportunityId) {
      return NextResponse.json(
        { error: 'Bad Request: opportunity_id parameter is required' }, 
        { status: 400 }
      )
    }

    // 3. Insert bookmark with conflict resolution
    const { data, error } = await supabase
      .from('saved_opportunities')
      .upsert(
        { 
          user_id: user.id, 
          opportunity_id: opportunityId 
        }, 
        { 
          onConflict: 'user_id,opportunity_id', 
          ignoreDuplicates: true 
        }
      )
      .select()

    if (error) {
      console.error('Failed to save opportunity bookmark:', error.message)
      return NextResponse.json(
        { error: 'Database save operation failed' }, 
        { status: 500 }
      )
    }

    return NextResponse.json(
      { message: 'Opportunity bookmarked successfully', data }, 
      { status: 201 }
    )

  } catch (err) {
    console.error('Unexpected error in POST /api/opportunities/saved:', err)
    return NextResponse.json(
      { error: 'Internal Server Error' }, 
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/opportunities/saved
 * Removes a saved/bookmarked opportunity for the authenticated user.
 */
export async function DELETE(request) {
  try {
    const supabase = await createClient()

    // 1. Authenticate user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized access denied' }, 
        { status: 401 }
      )
    }

    const { limited } = rateLimit(`saved-remove:${user.id}`, 10, 60000)
    if (limited) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
    }

    // 2. Retrieve opportunity_id from URL query parameters or request body
    const { searchParams } = new URL(request.url)
    let opportunityId = searchParams.get('opportunity_id')

    if (!opportunityId) {
      try {
        const body = await request.json()
        opportunityId = body.opportunity_id
      } catch {}
    }

    if (!opportunityId) {
      return NextResponse.json(
        { error: 'Bad Request: opportunity_id query parameter or body key is required' }, 
        { status: 400 }
      )
    }

    if (opportunityId === 'all') {
      const { error: clearError } = await supabase
        .from('saved_opportunities')
        .delete()
        .eq('user_id', user.id)

      if (clearError) {
        return NextResponse.json(
          { error: 'Failed to clear saved opportunities' },
          { status: 500 }
        )
      }

      return NextResponse.json(
        { message: 'All saved opportunities cleared successfully' },
        { status: 200 }
      )
    }

    // 3. Delete bookmark matching user_id and opportunity_id
    const { data, error } = await supabase
      .from('saved_opportunities')
      .delete()
      .eq('user_id', user.id)
      .eq('opportunity_id', opportunityId)
      .select()

    if (error) {
      console.error('Failed to delete bookmark:', error.message)
      return NextResponse.json(
        { error: 'Database delete operation failed' }, 
        { status: 500 }
      )
    }

    if (!data || data.length === 0) {
      return NextResponse.json(
        { message: 'Bookmark not found or already deleted' }, 
        { status: 404 }
      )
    }

    return NextResponse.json(
      { message: 'Bookmark deleted successfully' }, 
      { status: 200 }
    )

  } catch (err) {
    console.error('Unexpected error in DELETE /api/opportunities/saved:', err)
    return NextResponse.json(
      { error: 'Internal Server Error' }, 
      { status: 500 }
    )
  }
}