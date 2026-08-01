import { createClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

const MAX_COMPANY_NAME_LENGTH = 100
const MAX_COMPANY_SIZE_LENGTH = 50
const MAX_COMPANY_INDUSTRY_LENGTH = 100
const MAX_COMPANY_LOCATION_LENGTH = 150
const MAX_COMPANY_WEBSITE_LENGTH = 2048
const MAX_COMPANY_DESCRIPTION_LENGTH = 5000
const MAX_EMPLOYER_HEADLINE_LENGTH = 200
const MAX_EMPLOYER_EXPERIENCE_LENGTH = 5000
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

  return {
    authorized: true,
    user,
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
      user,
    } = await verifyEmployer(supabase)

    if (!authorized) {
      return NextResponse.json(
        { error },
        { status }
      )
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
        role,
        company_name,
        company_size,
        company_industry,
        company_location,
        company_website,
        company_description,
        company_logo_url,
        employer_headline,
        employer_experience,
        company_values,
        company_benefits
      `)
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      console.error(
        'Employer profile load failed:',
        profileError?.message
      )

      return NextResponse.json(
        {
          error:
            'Unable to load employer profile',
        },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { profile },
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
      user,
    } = await verifyEmployer(supabase)

    if (!authorized) {
      return NextResponse.json(
        { error },
        { status }
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

    const employerHeadline =
      cleanOptionalString(
        body.employer_headline
      )

    const employerExperience =
      cleanOptionalString(
        body.employer_experience
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
      employerHeadline &&
      employerHeadline.length >
        MAX_EMPLOYER_HEADLINE_LENGTH
    ) {
      return NextResponse.json(
        {
          error:
            'Employer headline must not exceed 200 characters',
        },
        { status: 400 }
      )
    }

    if (
      employerExperience &&
      employerExperience.length >
        MAX_EMPLOYER_EXPERIENCE_LENGTH
    ) {
      return NextResponse.json(
        {
          error:
            'Employer experience must not exceed 5000 characters',
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

    const updates = {
      company_name: companyName,
      company_size: companySize,
      company_industry: companyIndustry,
      company_location: companyLocation,
      company_website: companyWebsite,
      company_description:
        companyDescription,
      employer_headline: employerHeadline,
      employer_experience:
        employerExperience,
      company_values: companyValues,
      company_benefits: companyBenefits,
    }

    const {
      data: profile,
      error: updateError,
    } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id)
      .eq('role', 'employer')
      .select(`
        id,
        full_name,
        username,
        role,
        company_name,
        company_size,
        company_industry,
        company_location,
        company_website,
        company_description,
        company_logo_url,
        employer_headline,
        employer_experience,
        company_values,
        company_benefits
      `)
      .single()

    if (updateError || !profile) {
      console.error(
        'Employer profile update failed:',
        updateError?.message
      )

      return NextResponse.json(
        {
          error:
            updateError?.message ||
            'Unable to update employer profile',
        },
        { status: 500 }
      )
    }

    return NextResponse.json(
      {
        message:
          'Employer profile updated successfully',
        profile,
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