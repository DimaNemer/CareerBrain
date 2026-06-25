// import { createClient } from '@/lib/supabase-server'
// import { NextResponse } from 'next/server'

// export async function POST(request) {
//   try {
//     const { full_name, username, email, password } = await request.json()

//     // Validation
//     if (!full_name || !username || !email || !password) {
//       return NextResponse.json(
//         { error: 'All fields are required' },
//         { status: 400 }
//       )
//     }

//     if (password.length < 8) {
//       return NextResponse.json(
//         { error: 'Password must be at least 8 characters' },
//         { status: 400 }
//       )
//     }

//     // Username: only letters, numbers, underscores
//     const usernameRegex = /^[a-zA-Z0-9_]{3,30}$/
//     if (!usernameRegex.test(username)) {
//       return NextResponse.json(
//         { error: 'Username must be 3–30 characters, letters/numbers/underscores only' },
//         { status: 400 }
//       )
//     }

//     const supabase = await createClient()

//     // Check username is not already taken
//     const { data: existingUsername } = await supabase
//       .from('profiles')
//       .select('id')
//       .eq('username', username.toLowerCase())
//       .single()

//     if (existingUsername) {
//       return NextResponse.json(
//         { error: 'Username is already taken' },
//         { status: 409 }
//       )
//     }

//     // Create auth user — Supabase handles password hashing
//     const { data: authData, error: authError } = await supabase.auth.signUp({
//       email,
//       password,
//       options: {
//         data: {
//           full_name,
//           username: username.toLowerCase(),
//         },
//       },
//     })

//     if (authError) {
//       return NextResponse.json(
//         { error: authError.message },
//         { status: 400 }
//       )
//     }

//     // Create profile row linked to the auth user
//     const { error: profileError } = await supabase
//       .from('profiles')
//       .insert({
//         id: authData.user.id,
//         full_name,
//         username: username.toLowerCase(),
//         readiness_score: 0,
//       })

//     if (profileError) {
//       return NextResponse.json(
//         { error: 'Account created but profile setup failed' },
//         { status: 500 }
//       )
//     }

//     return NextResponse.json(
//       { message: 'Account created successfully' },
//       { status: 201 }
//     )
//   } catch {
//     return NextResponse.json(
//       { error: 'Something went wrong' },
//       { status: 500 }
//     )
//   }
// }
// app/api/auth/signup/route.js
import { createClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export async function POST(request) {
  try {
    const { full_name, username, email, password } = await request.json()

    // Validation
    if (!full_name || !username || !email || !password) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      )
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters' },
        { status: 400 }
      )
    }

    const usernameRegex = /^[a-zA-Z0-9_]{3,30}$/
    if (!usernameRegex.test(username)) {
      return NextResponse.json(
        { error: 'Username must be 3–30 characters, letters/numbers/underscores only' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Check username not already taken
    const { data: existingUsername } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', username.toLowerCase())
      .maybeSingle()

    if (existingUsername) {
      return NextResponse.json(
        { error: 'Username is already taken' },
        { status: 409 }
      )
    }

    // Create auth user — trigger automatically creates the profile row
    const { error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name,
          username: username.toLowerCase(),
        },
      },
    })

    if (authError) {
      return NextResponse.json(
        { error: authError.message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { message: 'Account created successfully' },
      { status: 201 }
    )
  } catch {
    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 }
    )
  }
}