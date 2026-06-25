import { createClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { data: profile, error } = await supabase
      .from('profiles')
      .select(`
        *,
        user_skills (
          id,
          proficiency_level,
          source,
          skills (
            id,
            name,
            category
          )
        )
      `)
      .eq('id', user.id)
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ profile }, { status: 200 })
  } catch {
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}

export async function PUT(request) {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const body = await request.json()

    // Whitelist allowed fields — never let client update id or readiness_score directly
    const allowedFields = [
      'full_name',
      'username',
      'headline',
      'bio',
      'education_level',
      'university',
      'graduation_year',
      'linkedin_url',
      'github_url',
      'portfolio_url',
      'avatar_url',
    ]

    const updates = {}
    allowedFields.forEach(field => {
      if (body[field] !== undefined) updates[field] = body[field]
    })

    if (updates.username) {
      updates.username = updates.username.toLowerCase()
    }

    updates.updated_at = new Date().toISOString()

    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ profile: data }, { status: 200 })
  } catch {
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}