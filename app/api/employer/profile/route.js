import { createClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

const MAX_COMPANY_NAME_LENGTH = 100
const MAX_COMPANY_SIZE_LENGTH = 50
const MAX_COMPANY_INDUSTRY_LENGTH = 100
const MAX_COMPANY_LOCATION_LENGTH = 150
const MAX_COMPANY_WEBSITE_LENGTH = 2048
const MAX_COMPANY_DESCRIPTION_LENGTH = 5000
const MAX_COMPANY_VALUES_LENGTH = 3000
const MAX_COMPANY_BENEFITS_LENGTH = 3000

const VALID_COMPANY_SIZES = [
  '1-10',
  '11-50',
  '51-200',
  '201-500',
  '500+',
]

function cleanRequiredString(value) {
  if (typeof value !== 'string') return ''

  return value.trim()
}

function cleanOptionalString(value) {
  if (typeof value !== 'string') return null

  const cleaned = value.trim()

  return cleaned || null
}

function isValidHttpUrl(value) {
  if (!value) return true

  try {
    const url = new URL(value)

    return (
      url.protocol === 'http:' ||
      url.protocol === 'https:'
    )
  } catch {
    return false
  }
}

async function verifyEmployer(supabase) {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return {
      authorized: false,
      status: 401,
      error: 'Not authenticated',
    }
  }

 const {
  data: profile,
  error: profileError,
} = await supabase
  .from('profiles')
  .select(`
    id,
    full_name,
    username,
    role
  `)
  .eq('id', user.id)
  .single()

  if (
    profileError ||
    !profile ||
    profile.role !== 'employer'
  ) {
    return {
      authorized: false,
      status: 403,
      error: 'Employer access required',
    }
  }

  const {
    data: membership,
    error: membershipError,
  } = await supabase
    .from('company_members')
    .select(`
      company_id,
      role,
      job_title,
      companies (
        id,
        name,
        slug,
        logo_url,
        description,
        industry,
        company_size,
        location,
        website,
        company_values,
        company_benefits
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
    return {
      authorized: false,
      status: 403,
      error: 'Company not found',
    }
  }

  return {
    authorized: true,
    user,
    profile,
    membership,
    company,
  }
}

// GET /api/employer/profile
export async function GET() {
  try {
    const supabase = await createClient()

    const {
      authorized,
      status,
      error,
      profile,
      membership,
      company,
    } = await verifyEmployer(supabase)

    if (!authorized) {
      return NextResponse.json(
        { error },
        { status }
      )
    }

    return NextResponse.json(
      {
        profile,
        membership: {
          company_id: membership.company_id,
          role: membership.role,
          job_title: membership.job_title,
        },
        company,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error(
      'Employer profile GET error:',
      error
    )

    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 }
    )
  }
}

// PUT /api/employer/profile
export async function PUT(request) {
  try {
    const supabase = await createClient()

   const {
  authorized,
  status,
  error,
  membership,
  company,
} = await verifyEmployer(supabase)

    if (!authorized) {
      return NextResponse.json(
        { error },
        { status }
      )
    }
if (
  !['owner', 'admin'].includes(membership.role)
) {
  return NextResponse.json(
    {
      error:
        'You do not have permission to edit company information',
    },
    { status: 403 }
  )
}
    let body

    try {
      body = await request.json()
    } catch {
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      )
    }

    const companyName =
      cleanRequiredString(body.company_name)

    const companySize =
      cleanOptionalString(body.company_size)

    const companyIndustry =
      cleanOptionalString(
        body.company_industry
      )

    const companyLocation =
      cleanOptionalString(
        body.company_location
      )

    const companyWebsite =
      cleanOptionalString(
        body.company_website
      )

    const companyDescription =
      cleanOptionalString(
        body.company_description
      )

  

    const companyValues =
      cleanOptionalString(
        body.company_values
      )

    const companyBenefits =
      cleanOptionalString(
        body.company_benefits
      )

    if (!companyName) {
      return NextResponse.json(
        { error: 'Company name is required' },
        { status: 400 }
      )
    }

    if (
      companyName.length >
      MAX_COMPANY_NAME_LENGTH
    ) {
      return NextResponse.json(
        {
          error:
            'Company name must not exceed 100 characters',
        },
        { status: 400 }
      )
    }

    if (
      companySize &&
      !VALID_COMPANY_SIZES.includes(
        companySize
      )
    ) {
      return NextResponse.json(
        { error: 'Invalid company size' },
        { status: 400 }
      )
    }

    if (
      companySize &&
      companySize.length >
        MAX_COMPANY_SIZE_LENGTH
    ) {
      return NextResponse.json(
        { error: 'Company size is too long' },
        { status: 400 }
      )
    }

    if (
      companyIndustry &&
      companyIndustry.length >
        MAX_COMPANY_INDUSTRY_LENGTH
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
      companyLocation &&
      companyLocation.length >
        MAX_COMPANY_LOCATION_LENGTH
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
      companyWebsite &&
      companyWebsite.length >
        MAX_COMPANY_WEBSITE_LENGTH
    ) {
      return NextResponse.json(
        {
          error:
            'Company website URL is too long',
        },
        { status: 400 }
      )
    }

    if (
      companyWebsite &&
      !isValidHttpUrl(companyWebsite)
    ) {
      return NextResponse.json(
        {
          error:
            'Company website must be a valid HTTP or HTTPS URL',
        },
        { status: 400 }
      )
    }

    if (
      companyDescription &&
      companyDescription.length >
        MAX_COMPANY_DESCRIPTION_LENGTH
    ) {
      return NextResponse.json(
        {
          error:
            'Company description must not exceed 5000 characters',
        },
        { status: 400 }
      )
    }



    if (
      companyValues &&
      companyValues.length >
        MAX_COMPANY_VALUES_LENGTH
    ) {
      return NextResponse.json(
        {
          error:
            'Company values must not exceed 3000 characters',
        },
        { status: 400 }
      )
    }

    if (
      companyBenefits &&
      companyBenefits.length >
        MAX_COMPANY_BENEFITS_LENGTH
    ) {
      return NextResponse.json(
        {
          error:
            'Company benefits must not exceed 3000 characters',
        },
        { status: 400 }
      )
    }

   const companyUpdates = {
  name: companyName,
  company_size: companySize,
  industry: companyIndustry,
  location: companyLocation,
  website: companyWebsite,
  description: companyDescription,
  company_values: companyValues,
  company_benefits: companyBenefits,
  updated_at: new Date().toISOString(),
}

const {
  data: updatedCompany,
  error: updateError,
} = await supabase
  .from('companies')
  .update(companyUpdates)
  .eq('id', company.id)
  .select(`
    id,
    name,
    slug,
    logo_url,
    description,
    industry,
    company_size,
    location,
    website,
    company_values,
    company_benefits,
    created_by,
    created_at,
    updated_at
  `)
  .single()

if (updateError || !updatedCompany) {
  console.error(
    'Company profile update failed:',
    updateError?.message
  )

  return NextResponse.json(
    {
      error:
        updateError?.message ||
        'Unable to update company profile',
    },
    { status: 500 }
  )
}

return NextResponse.json(
  {
    message:
      'Company profile updated successfully',
    company: updatedCompany,
  },
  { status: 200 }
)
  } catch (error) {
    console.error(
      'Employer profile PUT error:',
      error
    )

    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 }
    )
  }
}