import { createClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

const MAX_IMAGE_SIZE = 5 * 1024 * 1024

const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
]

const EXTENSION_BY_TYPE = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
}

// GET /api/profile/posts?user_id=xxx
export async function GET(request) {
  try {
    const supabase = await createClient()

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('user_id')

    if (!userId) {
      return NextResponse.json(
        { error: 'user_id is required' },
        { status: 400 }
      )
    }

    const { data: posts, error } = await supabase
      .from('project_posts')
      .select(`
        id,
        user_id,
        title,
        content,
        project_id,
        skills_highlighted,
        image_url,
        image_path,
        created_at,
        projects (
          id,
          title,
          status
        )
      `)
      .eq('user_id', userId)
      .order('created_at', {
        ascending: false,
      })

    if (error) {
      console.error('GET profile posts error:', error)

      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { posts: posts || [] },
      { status: 200 }
    )
  } catch (error) {
    console.error('GET profile posts unexpected error:', error)

    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 }
    )
  }
}

// POST /api/profile/posts
export async function POST(request) {
  let uploadedImagePath = null

  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    /*
     * The form now sends multipart/form-data because
     * it may include an image.
     */
    const formData = await request.formData()

    const title = formData.get('title')
    const content = formData.get('content')
    const projectId = formData.get('project_id')
    const skillsValue = formData.get('skills_highlighted')
    const image = formData.get('image')

    const cleanTitle =
      typeof title === 'string'
        ? title.trim()
        : ''

    const cleanContent =
      typeof content === 'string'
        ? content.trim()
        : ''

    const cleanProjectId =
      typeof projectId === 'string' &&
      projectId.trim()
        ? projectId.trim()
        : null

    if (!cleanTitle || !cleanContent) {
      return NextResponse.json(
        {
          error: 'Title and content are required',
        },
        { status: 400 }
      )
    }

    if (cleanTitle.length > 150) {
      return NextResponse.json(
        {
          error:
            'Title must be under 150 characters',
        },
        { status: 400 }
      )
    }

    if (cleanContent.length > 2000) {
      return NextResponse.json(
        {
          error:
            'Content must be under 2000 characters',
        },
        { status: 400 }
      )
    }

    let skillsHighlighted = []

    if (
      typeof skillsValue === 'string' &&
      skillsValue.trim()
    ) {
      try {
        const parsedSkills =
          JSON.parse(skillsValue)

        if (Array.isArray(parsedSkills)) {
          skillsHighlighted = parsedSkills
            .filter(
              skill =>
                typeof skill === 'string'
            )
            .map(skill => skill.trim())
            .filter(Boolean)
            .slice(0, 20)
        }
      } catch {
        return NextResponse.json(
          {
            error:
              'Invalid skills format',
          },
          { status: 400 }
        )
      }
    }

    /*
     * A user can only link a completed project that
     * they own or have joined.
     */
    if (cleanProjectId) {
      const { data: ownedProject } =
        await supabase
          .from('projects')
          .select('id, status')
          .eq('id', cleanProjectId)
          .eq('owner_id', user.id)
          .is('deleted_at', null)
          .maybeSingle()

      let connectedProject = ownedProject

      if (!connectedProject) {
        const { data: membership } =
          await supabase
            .from('project_members')
            .select(`
              project_id,
              projects (
                id,
                status
              )
            `)
            .eq(
              'project_id',
              cleanProjectId
            )
            .eq('user_id', user.id)
            .is('left_at', null)
            .maybeSingle()

        connectedProject =
          membership?.projects || null
      }

      if (!connectedProject) {
        return NextResponse.json(
          {
            error:
              'You are not part of this project',
          },
          { status: 403 }
        )
      }

      if (
        connectedProject.status !==
        'completed'
      ) {
        return NextResponse.json(
          {
            error:
              'Only completed projects can be linked to a post',
          },
          { status: 400 }
        )
      }
    }

    let imageUrl = null
    let imagePath = null

    const hasImage =
      image &&
      typeof image !== 'string' &&
      image.size > 0

    if (hasImage) {
      if (
        !ALLOWED_IMAGE_TYPES.includes(
          image.type
        )
      ) {
        return NextResponse.json(
          {
            error:
              'Post image must be a JPG, PNG, or WebP file',
          },
          { status: 400 }
        )
      }

      if (image.size > MAX_IMAGE_SIZE) {
        return NextResponse.json(
          {
            error:
              'Post image must be under 5MB',
          },
          { status: 400 }
        )
      }

      const extension =
        EXTENSION_BY_TYPE[image.type]

      const uniqueName =
        typeof crypto !== 'undefined' &&
        crypto.randomUUID
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random()
              .toString(36)
              .slice(2)}`

      imagePath =
        `${user.id}/${uniqueName}.${extension}`

      uploadedImagePath = imagePath

      const { error: uploadError } =
        await supabase.storage
          .from('post-images')
          .upload(imagePath, image, {
            contentType: image.type,
            cacheControl: '3600',
            upsert: false,
          })

      if (uploadError) {
        console.error(
          'Post image upload error:',
          uploadError
        )

        return NextResponse.json(
          {
            error: uploadError.message,
          },
          { status: 500 }
        )
      }

      const {
        data: { publicUrl },
      } = supabase.storage
        .from('post-images')
        .getPublicUrl(imagePath)

      imageUrl = publicUrl
    }

    const { data: post, error: insertError } =
      await supabase
        .from('project_posts')
        .insert({
          user_id: user.id,
          title: cleanTitle,
          content: cleanContent,
          project_id: cleanProjectId,
          skills_highlighted:
            skillsHighlighted,
          image_url: imageUrl,
          image_path: imagePath,
        })
        .select(`
          id,
          user_id,
          title,
          content,
          project_id,
          skills_highlighted,
          image_url,
          image_path,
          created_at,
          projects (
            id,
            title,
            status
          )
        `)
        .single()

    if (insertError) {
      console.error(
        'Create profile post error:',
        insertError
      )

      /*
       * Remove the uploaded image if database
       * insertion failed.
       */
      if (uploadedImagePath) {
        await supabase.storage
          .from('post-images')
          .remove([uploadedImagePath])
      }

      return NextResponse.json(
        { error: insertError.message },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { post },
      { status: 201 }
    )
  } catch (error) {
    console.error(
      'POST profile post unexpected error:',
      error
    )

    return NextResponse.json(
      {
        error:
          error?.message ||
          'Something went wrong',
      },
      { status: 500 }
    )
  }
}

// DELETE /api/profile/posts?postId=xxx
export async function DELETE(request) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    const { searchParams } =
      new URL(request.url)

    const postId =
      searchParams.get('postId')

    if (!postId) {
      return NextResponse.json(
        { error: 'postId is required' },
        { status: 400 }
      )
    }

    const {
      data: post,
      error: postError,
    } = await supabase
      .from('project_posts')
      .select(`
        id,
        user_id,
        image_path
      `)
      .eq('id', postId)
      .maybeSingle()

    if (postError) {
      console.error(
        'Find post error:',
        postError
      )

      return NextResponse.json(
        { error: postError.message },
        { status: 500 }
      )
    }

    if (!post) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      )
    }

    if (post.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Not authorized' },
        { status: 403 }
      )
    }

    const { error: deleteError } =
      await supabase
        .from('project_posts')
        .delete()
        .eq('id', postId)
        .eq('user_id', user.id)

    if (deleteError) {
      console.error(
        'Delete post error:',
        deleteError
      )

      return NextResponse.json(
        { error: deleteError.message },
        { status: 500 }
      )
    }

    if (post.image_path) {
      const { error: storageError } =
        await supabase.storage
          .from('post-images')
          .remove([post.image_path])

      if (storageError) {
        console.error(
          'Delete post image error:',
          storageError
        )
      }
    }

    return NextResponse.json(
      { message: 'Post deleted' },
      { status: 200 }
    )
  } catch (error) {
    console.error(
      'DELETE profile post unexpected error:',
      error
    )

    return NextResponse.json(
      {
        error:
          error?.message ||
          'Something went wrong',
      },
      { status: 500 }
    )
  }
}