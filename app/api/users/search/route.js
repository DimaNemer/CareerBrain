import { createClient } from '@/lib/supabase-server'
import { createServiceClient } from '@/lib/supabase-service'
import { NextResponse } from 'next/server'

export async function GET(request) {
  try {
    const authSupabase = await createClient()
    const { data: { user } } = await authSupabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const query = (searchParams.get('q') || '').trim()
    const limit = Math.min(Number(searchParams.get('limit')) || 10, 20)

    if (!query || query.length < 2) {
      return NextResponse.json({ users: [] }, { status: 200 })
    }

    const supabase = createServiceClient()

    const { data: users, error } = await supabase
      .from('profiles')
      .select('id, full_name, username, headline, avatar_url, readiness_score')
      .or(`full_name.ilike.%${query}%,username.ilike.%${query}%,headline.ilike.%${query}%`)
      .or('profile_visibility.is.null,profile_visibility.eq.public')
      .neq('id', user.id)
      .limit(limit)

    if (error) throw error

    return NextResponse.json({ users: users || [] }, { status: 200 })
  } catch (err) {
    console.error('User search error:', err)
    return NextResponse.json({ error: 'Search failed' }, { status: 500 })
  }
}
