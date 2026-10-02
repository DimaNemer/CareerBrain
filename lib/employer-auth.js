/**
 * Shared employer/company authorization guard.
 *
 * Every employer surface (dashboard, job CRUD, applicant pipeline, team
 * management) must resolve the caller's company through this helper so that
 * authorization lives in exactly one place.
 *
 * Security notes:
 * - Uses `auth.getUser()`, which revalidates the session against Supabase
 *   Auth on the server. Never use `getSession()` here: it trusts cookie
 *   contents without verification and is forgeable.
 * - The company is derived from `company_members` for the *authenticated
 *   user only*. It is never taken from a route param, query string or request
 *   body, which is what prevents cross-tenant access (IDOR).
 * - Callers must additionally scope their own queries by the returned
 *   `company.id`.
 */

export const COMPANY_ROLES = ['owner', 'admin', 'recruiter']

export const COMPANY_ADMIN_ROLES = ['owner', 'admin']

export function isCompanyAdmin(membership) {
  return COMPANY_ADMIN_ROLES.includes(membership?.role)
}

export function canManagePipeline(membership) {
  return COMPANY_ROLES.includes(membership?.role)
}

/**
 * Resolves the authenticated employer and their current company.
 *
 * @returns {Promise<
 *   | { authorized: true, user: object, profile: object, membership: object, company: object }
 *   | { authorized: false, status: number, error: string }
 * >}
 */
export async function requireEmployer(supabase) {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return { authorized: false, status: 401, error: 'Not authenticated' }
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, role, full_name')
    .eq('id', user.id)
    .single()

  if (profileError || !profile || profile.role !== 'employer') {
    return {
      authorized: false,
      status: 403,
      error: 'Employer access required',
    }
  }

  const { data: membership, error: membershipError } = await supabase
    .from('company_members')
    .select(`
      id,
      company_id,
      role,
      job_title,
      companies (
        id,
        name,
        slug,
        logo_url
      )
    `)
    .eq('user_id', user.id)
    .eq('is_current', true)
    .maybeSingle()

  if (membershipError || !membership) {
    return {
      authorized: false,
      status: 403,
      error: 'No active company membership found',
    }
  }

  const company = Array.isArray(membership.companies)
    ? membership.companies[0]
    : membership.companies

  if (!company) {
    return { authorized: false, status: 403, error: 'Company not found' }
  }

  return { authorized: true, user, profile, membership, company }
}
