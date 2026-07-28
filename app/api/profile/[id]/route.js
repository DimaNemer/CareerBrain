
import { createClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export async function GET(request, { params }) {
  try {
    const supabase = await createClient()
    const { id } = await params

    if (!id) {
      return NextResponse.json(
        { error: 'Profile id is required' },
        { status: 400 }
      )
    }

    const { data: profile, error } = await supabase
      .from('profiles')
      .select(`
        id,
        username,
        full_name,
        headline,
        avatar_url,
        cover_url,
        bio,
        location,
        availability_status,
        preferred_role,
        education_level,
        university,
        graduation_year,
        linkedin_url,
        github_url,
        portfolio_url,
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
      .eq('id', id)
      .single()

    if (error || !profile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { profile },
      { status: 200 }
    )
  } catch {
    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 }
    )
  }
}