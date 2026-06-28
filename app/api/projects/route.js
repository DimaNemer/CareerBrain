import { createClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = await createClient()

    const { data: projects, error } = await supabase
      .from('projects')
      .select(`
        *,
        profiles (
          id,
          username,
          full_name,
          avatar_url
        )
      `)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ projects }, { status: 200 })
  } catch {
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const body = await request.json()

    const title = body.title?.trim()
    const description = body.description?.trim() || null
    const status = body.status || 'open'

    const allowedStatuses = ['open', 'active', 'completed', 'archived']

    if (!title) {
      return NextResponse.json({ error: 'Project title is required' }, { status: 400 })
    }

    if (!allowedStatuses.includes(status)) {
      return NextResponse.json({ error: 'Invalid project status' }, { status: 400 })
    }

    const { data: project, error } = await supabase
      .from('projects')
      .insert({
        owner_id: user.id,
        title,
        description,
        status,
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ project }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}