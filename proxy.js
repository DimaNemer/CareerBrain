
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

// getClaims() verifies the JWT locally against the project's signing keys, so
  // it costs no network round trip. getUser() calls the Auth server on every
  // single request, which added ~800ms to each one. Only `sub` is needed here.
  // `data` is null when there is no session, so it cannot be destructured.
  const { data: claimsData, error: claimsError } =
    await supabase.auth.getClaims()

  if (claimsError) {
    console.error('Unable to read auth claims:', claimsError.message)
  }

  const user = claimsData?.claims?.sub
    ? { id: claimsData.claims.sub }
    : null

  const isProtectedRoute = PROTECTED_ROUTES.some(route =>
    pathname.startsWith(route)
  )

  const isAuthRoute = AUTH_ROUTES.some(route =>
    pathname.startsWith(route)
  )

  const isHomeRoute = pathname === '/'

  const isEmployerRoute = pathname.startsWith('/employer')

  // User is not logged in and tries to open a protected page.
  if (!user && isProtectedRoute) {
    return NextResponse.redirect(
      new URL('/login', request.url)
    )
  }
if (user) {
  // The role only steers redirects and employer-route authorization. Reading it
  // costs a database round trip, so skip it for every other route (including
  // all /api/* calls), which only needs to know whether a user exists.
  const needsRole =
    isHomeRoute || isAuthRoute || pathname === '/dashboard' || isEmployerRoute

  let role = null

  if (needsRole) {
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

    role = profile?.role
  }

 let companyMembership = null

if (isEmployerRoute) {
  const {
    data: membership,
    error: membershipError,
  } = await supabase
    .from('company_members')
    .select(`
      id,
      role
    `)
    .eq('user_id', user.id)
    .eq('is_current', true)
    .maybeSingle()

  if (membershipError) {
    console.error(
      'Unable to read company membership:',
      membershipError.message
    )
  }

  companyMembership = membership || null
}
  // Persisted sessions go to their default dashboard.
  if (isHomeRoute || isAuthRoute) {
    const destination =
      role === 'employer'
        ? '/employer/dashboard'
        : '/dashboard'

    return NextResponse.redirect(
      new URL(destination, request.url)
    )
  }

  // Employer account's default dashboard remains employer dashboard.
  if (
    role === 'employer' &&
    pathname === '/dashboard'
  ) {
    return NextResponse.redirect(
      new URL('/employer/dashboard', request.url)
    )
  }

  // Employer/company routes require either:
  // 1. employer account role, or
  // 2. an active company membership.
  if (
    isEmployerRoute &&
    role !== 'employer' &&
   !companyMembership
  ) {
    return NextResponse.redirect(
      new URL('/dashboard', request.url)
    )
  }
  if (isEmployerRoute && companyMembership) {
  const companyRole = companyMembership.role

  const canManageTeam =
    companyRole === 'owner' ||
    companyRole === 'admin'

  const canManageJobs =
    companyRole === 'owner' ||
    companyRole === 'admin' ||
    companyRole === 'recruiter'

  // Team management
  if (
    pathname.startsWith('/employer/team') &&
    !canManageTeam
  ) {
    return NextResponse.redirect(
      new URL('/employer/dashboard', request.url)
    )
  }

  // Create jobs
  if (
    pathname === '/employer/jobs/new' &&
    !canManageJobs
  ) {
    return NextResponse.redirect(
      new URL('/employer/dashboard', request.url)
    )
  }
}
}

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
