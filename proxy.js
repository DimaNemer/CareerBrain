// import { createServerClient } from '@supabase/ssr'
// import { NextResponse } from 'next/server'

// const PROTECTED_ROUTES = [
//   '/dashboard',
//   '/opportunities',
//   '/projects',
//   '/profile',
//   '/saved',
// ]

// const AUTH_ROUTES = ['/login', '/signup']

// export async function middleware(request) {
//   const { pathname } = request.nextUrl
//   let supabaseResponse = NextResponse.next({ request })

//   const supabase = createServerClient(
//     process.env.NEXT_PUBLIC_SUPABASE_URL,
//     process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
//     {
//       cookies: {
//         getAll() {
//           return request.cookies.getAll()
//         },
//         setAll(cookiesToSet) {
//           cookiesToSet.forEach(({ name, value }) =>
//             request.cookies.set(name, value)
//           )
//           supabaseResponse = NextResponse.next({ request })
//           cookiesToSet.forEach(({ name, value, options }) =>
//             supabaseResponse.cookies.set(name, value, options)
//           )
//         },
//       },
//     }
//   )

//   const { data: { user } } = await supabase.auth.getUser()

//   if (!user && PROTECTED_ROUTES.some(r => pathname.startsWith(r))) {
//     return NextResponse.redirect(new URL('/login', request.url))
//   }

//   if (user && AUTH_ROUTES.some(r => pathname.startsWith(r))) {
//     return NextResponse.redirect(new URL('/dashboard', request.url))
//   }

//   return supabaseResponse
// }

// export const config = {
//   matcher: [
//     '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
//   ],
// }
import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'

const PROTECTED_ROUTES = [
  '/dashboard',
  '/opportunities',
  '/projects',
  '/profile',
  '/saved',
  '/employer',
]

const AUTH_ROUTES = ['/login', '/signup']

export async function proxy(request) {
  const { pathname } = request.nextUrl

  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },

        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value)
          })

          supabaseResponse = NextResponse.next({
            request,
          })

          cookiesToSet.forEach(
            ({ name, value, options }) => {
              supabaseResponse.cookies.set(
                name,
                value,
                options
              )
            }
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const isProtectedRoute = PROTECTED_ROUTES.some(route =>
    pathname.startsWith(route)
  )

  const isAuthRoute = AUTH_ROUTES.some(route =>
    pathname.startsWith(route)
  )

  const isEmployerRoute = pathname.startsWith('/employer')

  // User is not logged in and tries to open a protected page.
  if (!user && isProtectedRoute) {
    return NextResponse.redirect(
      new URL('/login', request.url)
    )
  }

  if (user) {
    const { data: profile, error: profileError } =
      await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .maybeSingle()

    if (profileError) {
      console.error(
        'Unable to read user role:',
        profileError.message
      )
    }

    const role = profile?.role

    // Logged-in users should not return to login or signup.
    if (isAuthRoute) {
      const destination =
        role === 'employer'
          ? '/employer/dashboard'
          : '/dashboard'

      return NextResponse.redirect(
        new URL(destination, request.url)
      )
    }

    // Employers opening the normal dashboard go to their dashboard.
    if (
      role === 'employer' &&
      pathname === '/dashboard'
    ) {
      return NextResponse.redirect(
        new URL('/employer/dashboard', request.url)
      )
    }

    // Job seekers cannot open employer pages.
    if (
      isEmployerRoute &&
      role !== 'employer'
    ) {
      return NextResponse.redirect(
        new URL('/dashboard', request.url)
      )
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}