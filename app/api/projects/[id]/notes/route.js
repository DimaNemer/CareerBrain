import { createClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export async function GET(request, { params }) {
  try {
    const supabase = await createClient()
    const { id: projectId } = await params

    const { data: notes, error } = await supabase
      .from('project_notes')
      .select(`
        id,
        project_id,
        created_by,
        title,
        content,
        category,
        is_pinned,
        created_at,
        updated_at,
        profiles!project_notes_created_by_fkey (
          id,
          full_name,
          username
        )
      `)
      .eq('project_id', projectId)
      .order('is_pinned', { ascending: false })
      .order('updated_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ notes }, { status: 200 })
  } catch {
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}

export async function POST(request, { params }) {
  try {
    const supabase = await createClient()
    const { id: projectId } = await params

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const body = await request.json()

    if (!body.title || !body.title.trim()) {
      return NextResponse.json({ error: 'Note title is required' }, { status: 400 })
    }

    const { data: note, error } = await supabase
      .from('project_notes')
      .insert({
        project_id: projectId,
        created_by: user.id,
        title: body.title.trim(),
        content: body.content?.trim() || null,
        category: body.category || 'General',
      })
      .select(`
        id,
        project_id,
        created_by,
        title,
        content,
        category,
        is_pinned,
        created_at,
        updated_at,
        profiles!project_notes_created_by_fkey (
          id,
          full_name,
          username
        )
      `)
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ note }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}

export async function DELETE(request) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const noteId = searchParams.get('noteId')

    if (!noteId) {
      return NextResponse.json({ error: 'Note ID is required' }, { status: 400 })
    }

    const { error } = await supabase
      .from('project_notes')
      .delete()
      .eq('id', noteId)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true }, { status: 200 })
  } catch {
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}