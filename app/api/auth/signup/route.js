// // import { createClient } from '@/lib/supabase-server'
// // import { NextResponse } from 'next/server'

// // export async function POST(request) {
// //   try {
// //     const { full_name, username, email, password } = await request.json()

// //     // Validation
// //     if (!full_name || !username || !email || !password) {
// //       return NextResponse.json(
// //         { error: 'All fields are required' },
// //         { status: 400 }
// //       )
// //     }

// //     if (password.length < 8) {
// //       return NextResponse.json(
// //         { error: 'Password must be at least 8 characters' },
// //         { status: 400 }
// //       )
// //     }

// //     // Username: only letters, numbers, underscores
// //     const usernameRegex = /^[a-zA-Z0-9_]{3,30}$/
// //     if (!usernameRegex.test(username)) {
// //       return NextResponse.json(
// //         { error: 'Username must be 3–30 characters, letters/numbers/underscores only' },
// //         { status: 400 }
// //       )
// //     }

// //     const supabase = await createClient()

// //     // Check username is not already taken
// //     const { data: existingUsername } = await supabase
// //       .from('profiles')
// //       .select('id')
// //       .eq('username', username.toLowerCase())
// //       .single()

// //     if (existingUsername) {
// //       return NextResponse.json(
// //         { error: 'Username is already taken' },
// //         { status: 409 }
// //       )
// //     }

// //     // Create auth user — Supabase handles password hashing
// //     const { data: authData, error: authError } = await supabase.auth.signUp({
// //       email,
// //       password,
// //       options: {
// //         data: {
// //           full_name,
// //           username: username.toLowerCase(),
// //         },
// //       },
// //     })

// //     if (authError) {
// //       return NextResponse.json(
// //         { error: authError.message },
// //         { status: 400 }
// //       )
// //     }

// //     // Create profile row linked to the auth user
// //     const { error: profileError } = await supabase
// //       .from('profiles')
// //       .insert({
// //         id: authData.user.id,
// //         full_name,
// //         username: username.toLowerCase(),
// //         readiness_score: 0,
// //       })

// //     if (profileError) {
// //       return NextResponse.json(
// //         { error: 'Account created but profile setup failed' },
// //         { status: 500 }
// //       )
// //     }

// //     return NextResponse.json(
// //       { message: 'Account created successfully' },
// //       { status: 201 }
// //     )
// //   } catch {
// //     return NextResponse.json(
// //       { error: 'Something went wrong' },
// //       { status: 500 }
// //     )
// //   }
// // }
// // app/api/auth/signup/route.js
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

//     const usernameRegex = /^[a-zA-Z0-9_]{3,30}$/
//     if (!usernameRegex.test(username)) {
//       return NextResponse.json(
//         { error: 'Username must be 3–30 characters, letters/numbers/underscores only' },
//         { status: 400 }
//       )
//     }

//     const supabase = await createClient()

//     // Check username not already taken
//     const { data: existingUsername } = await supabase
//       .from('profiles')
//       .select('id')
//       .eq('username', username.toLowerCase())
//       .maybeSingle()

//     if (existingUsername) {
//       return NextResponse.json(
//         { error: 'Username is already taken' },
//         { status: 409 }
//       )
//     }

//     // Create auth user — trigger automatically creates the profile row
//     const { error: authError } = await supabase.auth.signUp({
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
import { createClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'
import { rateLimit } from '@/lib/rate-limit'

export async function POST(request) {
  try {
    // Rate limit: max 5 signups per IP per hour
    const ip = request.headers.get('x-forwarded-for') ?? 'unknown'
    const { limited } = rateLimit(`signup:${ip}`, 5, 60 * 60 * 1000)

    if (limited) {
      return NextResponse.json(
        { error: 'Too many signup attempts. Please try again later.' },
        { status: 429 }
      )
    }

    const body = await request.json()
    const { full_name, username, email, password } = body

    // Validate all fields exist
    if (!full_name || !username || !email || !password) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      )
    }

    // Validate types are strings
    if (
      typeof full_name !== 'string' ||
      typeof username !== 'string' ||
      typeof email !== 'string' ||
      typeof password !== 'string'
    ) {
      return NextResponse.json(
        { error: 'Invalid input' },
        { status: 400 }
      )
    }

    // Sanitize
    const sanitizedEmail = email.trim().toLowerCase()
    const sanitizedUsername = username.trim().toLowerCase()
    const sanitizedName = full_name.trim()

    // Password strength
    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters' },
        { status: 400 }
      )
    }

    if (!/\d/.test(password)) {
      return NextResponse.json(
        { error: 'Password must contain at least one number' },
        { status: 400 }
      )
    }

    // Username format: 3-30 chars, letters/numbers/underscores only
    const usernameRegex = /^[a-zA-Z0-9_]{3,30}$/
    if (!usernameRegex.test(sanitizedUsername)) {
      return NextResponse.json(
        { error: 'Username must be 3–30 characters, letters/numbers/underscores only' },
        { status: 400 }
      )
    }

    // Full name length
    if (sanitizedName.length < 2 || sanitizedName.length > 100) {
      return NextResponse.json(
        { error: 'Full name must be between 2 and 100 characters' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Check username is not taken
    const { data: existingUsername } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', sanitizedUsername)
      .maybeSingle()

    if (existingUsername) {
      return NextResponse.json(
        { error: 'Username is already taken' },
        { status: 409 }
      )
    }

    // Create the auth user
    // The database trigger automatically creates the profile row
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: sanitizedEmail,
      password,
      options: {
        data: {
          full_name: sanitizedName,
          username: sanitizedUsername,
        },
        // Where Supabase redirects after email confirmation
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/login`,
      },
    })

    if (authError) {
      // Don't expose internal Supabase errors directly
      if (authError.message.includes('already registered')) {
        return NextResponse.json(
          { error: 'An account with this email already exists' },
          { status: 409 }
        )
      }
      return NextResponse.json(
        { error: authError.message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      {
        message: 'Account created successfully',
        requiresConfirmation: !authData.session,
        email: sanitizedEmail,
      },
      { status: 201 }
    )
  } catch {
    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 }
    )
  }
}