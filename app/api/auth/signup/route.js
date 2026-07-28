
// import { createClient } from '@/lib/supabase-server'
// import { NextResponse } from 'next/server'
// import { rateLimit } from '@/lib/rate-limit'

// export async function POST(request) {
//   try {
//     // Rate limit: max 5 signups per IP per hour
//     const ip = request.headers.get('x-forwarded-for') ?? 'unknown'
//     const { limited } = rateLimit(`signup:${ip}`, 5, 60 * 60 * 1000)

//     if (limited) {
//       return NextResponse.json(
//         { error: 'Too many signup attempts. Please try again later.' },
//         { status: 429 }
//       )
//     }

//     const body = await request.json()
//     const { full_name, username, email, password } = body

//     // Validate all fields exist
//     if (!full_name || !username || !email || !password) {
//       return NextResponse.json(
//         { error: 'All fields are required' },
//         { status: 400 }
//       )
//     }

//     // Validate types are strings
//     if (
//       typeof full_name !== 'string' ||
//       typeof username !== 'string' ||
//       typeof email !== 'string' ||
//       typeof password !== 'string'
//     ) {
//       return NextResponse.json(
//         { error: 'Invalid input' },
//         { status: 400 }
//       )
//     }

//     // Sanitize
//     const sanitizedEmail = email.trim().toLowerCase()
//     const sanitizedUsername = username.trim().toLowerCase()
//     const sanitizedName = full_name.trim()

//     // Password strength
//     if (password.length < 8) {
//       return NextResponse.json(
//         { error: 'Password must be at least 8 characters' },
//         { status: 400 }
//       )
//     }

//     if (!/\d/.test(password)) {
//       return NextResponse.json(
//         { error: 'Password must contain at least one number' },
//         { status: 400 }
//       )
//     }

//     // Username format: 3-30 chars, letters/numbers/underscores only
//     const usernameRegex = /^[a-zA-Z0-9_]{3,30}$/
//     if (!usernameRegex.test(sanitizedUsername)) {
//       return NextResponse.json(
//         { error: 'Username must be 3–30 characters, letters/numbers/underscores only' },
//         { status: 400 }
//       )
//     }

//     // Full name length
//     if (sanitizedName.length < 2 || sanitizedName.length > 100) {
//       return NextResponse.json(
//         { error: 'Full name must be between 2 and 100 characters' },
//         { status: 400 }
//       )
//     }

//     const supabase = await createClient()

//     // Check username is not taken
//     const { data: existingUsername } = await supabase
//       .from('profiles')
//       .select('id')
//       .eq('username', sanitizedUsername)
//       .maybeSingle()

//     if (existingUsername) {
//       return NextResponse.json(
//         { error: 'Username is already taken' },
//         { status: 409 }
//       )
//     }

//     // Create the auth user
//     // The database trigger automatically creates the profile row
//     const { data: authData, error: authError } = await supabase.auth.signUp({
//       email: sanitizedEmail,
//       password,
//       options: {
//         data: {
//           full_name: sanitizedName,
//           username: sanitizedUsername,
//         },
//         // Where Supabase redirects after email confirmation
//         emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/login`,
//       },
//     })

//     if (authError) {
//       // Don't expose internal Supabase errors directly
//       if (authError.message.includes('already registered')) {
//         return NextResponse.json(
//           { error: 'An account with this email already exists' },
//           { status: 409 }
//         )
//       }
//       return NextResponse.json(
//         { error: authError.message },
//         { status: 400 }
//       )
//     }

//     return NextResponse.json(
//       {
//         message: 'Account created successfully',
//         requiresConfirmation: !authData.session,
//         email: sanitizedEmail,
//       },
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

const VALID_ROLES = ['job_seeker', 'employer']

const VALID_COMPANY_SIZES = [
  '1-10',
  '11-50',
  '51-200',
  '201-500',
  '500+',
]

function cleanOptionalString(value) {
  if (typeof value !== 'string') return null

  const cleaned = value.trim()
  return cleaned || null
}

function isValidWebsite(value) {
  if (!value) return true

  try {
    const url = new URL(value)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

export async function POST(request) {
  try {
    // Rate limit: maximum 5 signup attempts per IP per hour.
    const forwardedFor = request.headers.get('x-forwarded-for')
    const ip =
      forwardedFor?.split(',')[0]?.trim() ||
      request.headers.get('x-real-ip') ||
      'unknown'

    const { limited } = rateLimit(
      `signup:${ip}`,
      5,
      60 * 60 * 1000
    )

    if (limited) {
      return NextResponse.json(
        {
          error:
            'Too many signup attempts. Please try again later.',
        },
        { status: 429 }
      )
    }

    const body = await request.json()

    const {
      full_name,
      username,
      email,
      password,
      role,

      // Employer fields
      company_name,
      company_size,
      company_industry,
      company_location,
      company_website,
    } = body

    // Validate required base fields.
    if (!full_name || !username || !email || !password || !role) {
      return NextResponse.json(
        { error: 'All required fields must be completed' },
        { status: 400 }
      )
    }

    // Validate base input types.
    if (
      typeof full_name !== 'string' ||
      typeof username !== 'string' ||
      typeof email !== 'string' ||
      typeof password !== 'string' ||
      typeof role !== 'string'
    ) {
      return NextResponse.json(
        { error: 'Invalid input' },
        { status: 400 }
      )
    }

    // Validate account role.
    if (!VALID_ROLES.includes(role)) {
      return NextResponse.json(
        { error: 'Invalid account type selected' },
        { status: 400 }
      )
    }

    // Sanitize base values.
    const sanitizedEmail = email.trim().toLowerCase()
    const sanitizedUsername = username.trim().toLowerCase()
    const sanitizedName = full_name.trim()

    // Sanitize employer values.
    const sanitizedCompanyName = cleanOptionalString(company_name)
    const sanitizedCompanySize = cleanOptionalString(company_size)
    const sanitizedCompanyIndustry =
      cleanOptionalString(company_industry)
    const sanitizedCompanyLocation =
      cleanOptionalString(company_location)
    const sanitizedCompanyWebsite =
      cleanOptionalString(company_website)

    // Password strength.
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

    // Username format: 3–30 lowercase letters, numbers or underscores.
    const usernameRegex = /^[a-z0-9_]{3,30}$/

    if (!usernameRegex.test(sanitizedUsername)) {
      return NextResponse.json(
        {
          error:
            'Username must be 3–30 characters and contain only letters, numbers, or underscores',
        },
        { status: 400 }
      )
    }

    // Full-name length.
    if (
      sanitizedName.length < 2 ||
      sanitizedName.length > 100
    ) {
      return NextResponse.json(
        {
          error:
            'Full name must be between 2 and 100 characters',
        },
        { status: 400 }
      )
    }

    // Basic email-length protection.
    if (
      sanitizedEmail.length > 254 ||
      !sanitizedEmail.includes('@')
    ) {
      return NextResponse.json(
        { error: 'Please enter a valid email address' },
        { status: 400 }
      )
    }

    // Employer-specific validation.
    if (role === 'employer') {
      if (!sanitizedCompanyName) {
        return NextResponse.json(
          {
            error:
              'Company name is required for employer accounts',
          },
          { status: 400 }
        )
      }

      if (sanitizedCompanyName.length > 100) {
        return NextResponse.json(
          {
            error:
              'Company name must not exceed 100 characters',
          },
          { status: 400 }
        )
      }

      if (
        sanitizedCompanySize &&
        !VALID_COMPANY_SIZES.includes(sanitizedCompanySize)
      ) {
        return NextResponse.json(
          { error: 'Invalid company size selected' },
          { status: 400 }
        )
      }

      if (
        sanitizedCompanyIndustry &&
        sanitizedCompanyIndustry.length > 100
      ) {
        return NextResponse.json(
          {
            error:
              'Company industry must not exceed 100 characters',
          },
          { status: 400 }
        )
      }

      if (
        sanitizedCompanyLocation &&
        sanitizedCompanyLocation.length > 150
      ) {
        return NextResponse.json(
          {
            error:
              'Company location must not exceed 150 characters',
          },
          { status: 400 }
        )
      }

      if (
        sanitizedCompanyWebsite &&
        sanitizedCompanyWebsite.length > 2048
      ) {
        return NextResponse.json(
          { error: 'Company website is too long' },
          { status: 400 }
        )
      }

      if (!isValidWebsite(sanitizedCompanyWebsite)) {
        return NextResponse.json(
          {
            error:
              'Company website must be a valid HTTP or HTTPS address',
          },
          { status: 400 }
        )
      }
    }

    const supabase = await createClient()

    // Check whether the username is already used.
    const {
      data: existingUsername,
      error: usernameCheckError,
    } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', sanitizedUsername)
      .maybeSingle()

    if (usernameCheckError) {
      console.error(
        'Username availability check failed:',
        usernameCheckError.message
      )

      return NextResponse.json(
        {
          error:
            'Unable to validate the username. Please try again.',
        },
        { status: 500 }
      )
    }

    if (existingUsername) {
      return NextResponse.json(
        { error: 'Username is already taken' },
        { status: 409 }
      )
    }

    /*
     * Create the Supabase Auth user.
     *
     * handle_new_user() reads these metadata fields and creates
     * the matching profiles row.
     */
    const { data: authData, error: authError } =
      await supabase.auth.signUp({
        email: sanitizedEmail,
        password,
        options: {
          data: {
            full_name: sanitizedName,
            username: sanitizedUsername,
            role,

            // Store company values only for employer accounts.
            company_name:
              role === 'employer'
                ? sanitizedCompanyName
                : null,

            company_size:
              role === 'employer'
                ? sanitizedCompanySize
                : null,

            company_industry:
              role === 'employer'
                ? sanitizedCompanyIndustry
                : null,

            company_location:
              role === 'employer'
                ? sanitizedCompanyLocation
                : null,

            company_website:
              role === 'employer'
                ? sanitizedCompanyWebsite
                : null,
          },

          emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/login`,
        },
      })

    if (authError) {
      console.error('Signup error:', authError.message)

      const normalizedMessage = authError.message.toLowerCase()

      if (
        normalizedMessage.includes('already registered') ||
        normalizedMessage.includes('already exists')
      ) {
        return NextResponse.json(
          {
            error:
              'An account with this email already exists',
          },
          { status: 409 }
        )
      }

      return NextResponse.json(
        {
          error:
            'Unable to create your account. Please check your information and try again.',
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      {
        message: 'Account created successfully',
        requiresConfirmation: !authData.session,
        email: sanitizedEmail,
        role,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Signup route error:', error)

    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 }
    )
  }
}