import { createClient } from '@/lib/supabase-server'
import { CV_UPLOAD_STATUS } from '@/lib/cv-upload'
import { NextResponse } from 'next/server'

export async function POST(request) {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const body = await request.json()
    const fileUrl = body.file_url?.trim()

    if (!fileUrl) {
      return NextResponse.json({ error: 'File URL is required' }, { status: 400 })
    }

    const expectedPrefix = `cvs/${user.id}/`
    if (!fileUrl.startsWith(expectedPrefix)) {
      return NextResponse.json({ error: 'Invalid file path' }, { status: 400 })
    }

    const { data: cvUpload, error } = await supabase
      .from('cv_uploads')
      .insert({
        user_id: user.id,
        file_url: fileUrl,
        status: CV_UPLOAD_STATUS,
        uploaded_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json(
        { error: 'Failed to save your upload. Please try again.' },
        { status: 500 }
      )
    }

    return NextResponse.json({ cvUpload }, { status: 201 })
  } catch {
    return NextResponse.json(
      { error: 'Network error. Please check your connection and try again.' },
      { status: 500 }
    )
  }
}
