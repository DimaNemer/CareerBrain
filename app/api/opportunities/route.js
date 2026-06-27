import { createClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = await createClient()

    // 1. Strict Server-Side Auth Check
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized access denied' },
        { status: 401 }
      )
    }

    // 2. Fetch data using explicit columns matching your schema
    const { data: opportunities, error } = await supabase
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
        created_at
      `)
      .order('created_at', { ascending: false })

    // 3. Secure Error Handling (Don't leak raw database errors to the public)
    if (error) {
      console.error('Database Error:', error.message) // Logs safely on your server console
      return NextResponse.json(
        { error: 'Internal Server Error' }, 
        { status: 500 }
      )
    }

    // 4. Safe Response
    return NextResponse.json(
      { opportunities },
      { status: 200 }
    )
  } catch (err) {
    console.error('Unexpected API Error:', err)
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}