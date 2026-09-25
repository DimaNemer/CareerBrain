// import { createClient } from '@/lib/supabase-server'
// import { NextResponse } from 'next/server'

// export async function POST(request) {
//   try {
//     const { email, password } = await request.json()

//     if (!email || !password) {
//       return NextResponse.json(
//         { error: 'Email and password are required' },
//         { status: 400 }
//       )
//     }

//     const supabase = await createClient()

//     const { data, error } = await supabase.auth.signInWithPassword({
//       email,
//       password,
//     })

//     if (error) {
//       // Always return the same message — prevents attackers
//       // from knowing if an email exists in the system
//       return NextResponse.json(
//         { error: 'Invalid email or password' },
//         { status: 401 }
//       )
//     }

//     return NextResponse.json(
//       {
//         message: 'Logged in successfully',
//         user: {
//           id: data.user.id,
//           email: data.user.email,
//           full_name: data.user.user_metadata?.full_name,
//           username: data.user.user_metadata?.username,
//         },
//       },
//       { status: 200 }
//     )
//   } catch {
//     return NextResponse.json(
//       { error: 'Something went wrong' },
//       { status: 500 }
//     )
//   }
// }

// app/api/auth/login/route.js
import { createClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'
import {
  peekRateLimit,
  recordRateLimitFailure,
  clearRateLimit,
  getClientIp,
} from '@/lib/rate-limit'

export async function POST(request) {
  try {
    const ip = getClientIp(request)

    if (peekRateLimit(`login:${ip}`).limited) {
      return NextResponse.json(
        { error: 'Too many failed attempts. Please try again in 15 minutes.' },
        { status: 429 }
      )
    }

    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      recordRateLimitFailure(`login:${ip}`)

      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    clearRateLimit(`login:${ip}`)

    return NextResponse.json(
      {
        message: 'Logged in successfully',
        user: {
          id: data.user.id,
          email: data.user.email,
          full_name: data.user.user_metadata?.full_name,
          username: data.user.user_metadata?.username,
        },
      },
      { status: 200 }
    )
  } catch {
    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 }
    )
  }
}