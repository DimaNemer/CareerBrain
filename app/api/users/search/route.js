
import { createClient } from '@/lib/supabase-server'
import { createServiceClient } from '@/lib/supabase-service'
import { NextResponse } from 'next/server'

export async function GET(request) {
  try {
    const authSupabase = await createClient()

    const {
      data: { user },
    } = await authSupabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const query = (searchParams.get('q') || '').trim()
    const limit = Math.min(
      Math.max(Number(searchParams.get('limit')) || 10, 1),
      20
    )

    if (query.length < 2) {
      return NextResponse.json({
        users: [],
        companies: [],
      })
    }

    const supabase = createServiceClient()

    // Escape characters that have special meaning in LIKE.
    const searchTerm = query
      .replace(/[%_\\]/g, '\\$&')
      .replace(/[(),."]/g, ' ')
      .trim()

    if (searchTerm.length < 2) {
      return NextResponse.json({
        users: [],
        companies: [],
      })
    }

    const [usersResult, companiesResult] = await Promise.all([
      supabase
        .from('profiles')
        .select(`
          id,
          full_name,
          username,
          role,
          headline,
          avatar_url,
          company_name,
          employer_headline
        `)
        .or(
  [
    `full_name.ilike.%${searchTerm}%`,
    `username.ilike.%${searchTerm}%`,
    `headline.ilike.%${searchTerm}%`,
    `employer_headline.ilike.%${searchTerm}%`,
    `company_name.ilike.%${searchTerm}%`,
  ].join(',')
)
        .or(
          'profile_visibility.is.null,profile_visibility.eq.public'
        )
        .neq('id', user.id)
        .limit(limit),

      supabase
        .from('companies')
        .select(`
          id,
          name,
          logo_url,
          industry,
          location
        `)
        .or(
          [
            `name.ilike.%${searchTerm}%`,
            `industry.ilike.%${searchTerm}%`,
            `location.ilike.%${searchTerm}%`,
          ].join(',')
        )
        .limit(limit),
    ])

    if (usersResult.error) throw usersResult.error
    if (companiesResult.error) throw companiesResult.error

    return NextResponse.json({
      users: usersResult.data || [],
      companies: companiesResult.data || [],
    })
  } catch (error) {
    console.error('Search error:', error)

    return NextResponse.json(
      { error: 'Search failed' },
      { status: 500 }
    )
  }
}
