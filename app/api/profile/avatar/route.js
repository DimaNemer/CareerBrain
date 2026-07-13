// import { createClient } from '@/lib/supabase-server'
// import { NextResponse } from 'next/server'

// export async function POST(request) {
//   try {
//     const supabase = await createClient()
//     const { data: { user }, error: authError } = await supabase.auth.getUser()
//     if (authError || !user) {
//       return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
//     }

//     const formData = await request.formData()
//     const file = formData.get('avatar')

//     if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })
//     if (!file.type.startsWith('image/')) return NextResponse.json({ error: 'File must be an image' }, { status: 400 })
//     if (file.size > 2 * 1024 * 1024) return NextResponse.json({ error: 'Image must be under 2MB' }, { status: 400 })

//     const fileExt = file.name.split('.').pop()
//     const fileName = `${user.id}/avatar.${fileExt}`

//     await supabase.storage.from('avatars').remove([
//       `${user.id}/avatar.jpg`,
//       `${user.id}/avatar.jpeg`,
//       `${user.id}/avatar.png`,
//       `${user.id}/avatar.webp`,
//     ])

//     const { error: uploadError } = await supabase.storage
//       .from('avatars')
//       .upload(fileName, file, { contentType: file.type, upsert: true })

//     if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 })

//     const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(fileName)

//     await supabase.from('profiles')
//       .update({ avatar_url: publicUrl, updated_at: new Date().toISOString() })
//       .eq('id', user.id)

//     return NextResponse.json({ avatar_url: publicUrl }, { status: 200 })
//   } catch {
//     return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
//   }
// }

import { createClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

const MAX_FILE_SIZE = 2 * 1024 * 1024

const ALLOWED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
]

const EXTENSION_BY_TYPE = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
}

export async function POST(request) {
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

    const formData = await request.formData()
    const file = formData.get('avatar')

    if (!file || typeof file === 'string') {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        {
          error:
            'Avatar must be a JPG, PNG, or WebP image',
        },
        { status: 400 }
      )
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'Image must be under 2MB' },
        { status: 400 }
      )
    }

    const extension = EXTENSION_BY_TYPE[file.type]
    const fileName = `${user.id}/avatar.${extension}`

    await supabase
      .storage
      .from('avatars')
      .remove([
        `${user.id}/avatar.jpg`,
        `${user.id}/avatar.jpeg`,
        `${user.id}/avatar.png`,
        `${user.id}/avatar.webp`,
      ])

    const { error: uploadError } = await supabase
      .storage
      .from('avatars')
      .upload(fileName, file, {
        contentType: file.type,
        upsert: true,
        cacheControl: '3600',
      })

    if (uploadError) {
      return NextResponse.json(
        { error: uploadError.message },
        { status: 500 }
      )
    }

    const {
      data: { publicUrl },
    } = supabase
      .storage
      .from('avatars')
      .getPublicUrl(fileName)

    const { error: profileUpdateError } = await supabase
      .from('profiles')
      .update({
        avatar_url: publicUrl,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id)

    if (profileUpdateError) {
      await supabase
        .storage
        .from('avatars')
        .remove([fileName])

      return NextResponse.json(
        { error: profileUpdateError.message },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { avatar_url: publicUrl },
      { status: 200 }
    )
  } catch {
    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 }
    )
  }
}