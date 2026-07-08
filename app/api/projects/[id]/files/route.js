import { createClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

async function checkAccess(supabase, projectId, userId) {
  const { data: project } = await supabase
    .from('projects')
    .select('id, owner_id')
    .eq('id', projectId)
    .is('deleted_at', null)
    .single()

  if (!project) return { access: false, status: 404, reason: 'Project not found' }

  const isOwner = project.owner_id === userId

  const { data: member } = await supabase
    .from('project_members')
    .select('id')
    .eq('project_id', projectId)
    .eq('user_id', userId)
    .is('left_at', null)
    .maybeSingle()

  if (!isOwner && !member) return { access: false, status: 403, reason: 'Not a member' }

  return { access: true, isOwner, project }
}

// GET /api/projects/[id]/files
export async function GET(request, { params }) {
  try {
    const supabase = await createClient()
    const { id: projectId } = await params

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { access, status, reason } = await checkAccess(supabase, projectId, user.id)
    if (!access) return NextResponse.json({ error: reason }, { status })

    const { data: files, error } = await supabase
      .from('file_attachments')
      .select(`
        id,
        file_name,
        file_url,
        file_type,
        file_size,
        uploaded_at,
        profiles!file_attachments_uploaded_by_fkey (
          id,
          full_name,
          username
        )
      `)
      .eq('project_id', projectId)
      .order('uploaded_at', { ascending: false })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ files }, { status: 200 })
  } catch {
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}

// POST /api/projects/[id]/files
export async function POST(request, { params }) {
  try {
    const supabase = await createClient()
    const { id: projectId } = await params

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { access, status, reason } = await checkAccess(supabase, projectId, user.id)
    if (!access) return NextResponse.json({ error: reason }, { status })

    const formData = await request.formData()
    const file = formData.get('file')

    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'File must be under 10MB' }, { status: 400 })
    }

    const fileExt = file.name.split('.').pop()
    const fileName = `${projectId}/${user.id}/${Date.now()}.${fileExt}`

    const { error: uploadError } = await supabase.storage
      .from('project-files')
      .upload(fileName, file, {
        contentType: file.type,
        upsert: false,
      })

    if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 })

    const { data: { publicUrl } } = supabase.storage
      .from('project-files')
      .getPublicUrl(fileName)

    const { data: attachment, error: dbError } = await supabase
      .from('file_attachments')
      .insert({
        project_id: projectId,
        uploaded_by: user.id,
        file_name: file.name,
        file_url: publicUrl,
        file_type: file.type,
        file_size: file.size,
      })
      .select(`
        id,
        file_name,
        file_url,
        file_type,
        file_size,
        uploaded_at,
        profiles!file_attachments_uploaded_by_fkey (
          id,
          full_name,
          username
        )
      `)
      .single()

    if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 })

    return NextResponse.json({ file: attachment }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}

// DELETE /api/projects/[id]/files?fileId=xxx
export async function DELETE(request, { params }) {
  try {
    const supabase = await createClient()
    const { id: projectId } = await params
    const { searchParams } = new URL(request.url)
    const fileId = searchParams.get('fileId')

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { access, status, reason, isOwner } = await checkAccess(supabase, projectId, user.id)
    if (!access) return NextResponse.json({ error: reason }, { status })

    const { data: file } = await supabase
      .from('file_attachments')
      .select('id, uploaded_by, file_url')
      .eq('id', fileId)
      .eq('project_id', projectId)
      .single()

    if (!file) return NextResponse.json({ error: 'File not found' }, { status: 404 })

    if (!isOwner && file.uploaded_by !== user.id) {
      return NextResponse.json({ error: 'You can only delete your own files' }, { status: 403 })
    }

    await supabase.from('file_attachments').delete().eq('id', fileId)

    return NextResponse.json({ message: 'File deleted' }, { status: 200 })
  } catch {
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}