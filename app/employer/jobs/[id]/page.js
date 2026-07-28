import { createClient } from '@/lib/supabase-server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'

export default async function EmployerJobDetailsPage({
  params,
}) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile, error: profileError } =
    await supabase
      .from('profiles')
      .select('id, role, company_name')
      .eq('id', user.id)
      .single()

  if (
    profileError ||
    !profile ||
    profile.role !== 'employer'
  ) {
    redirect('/dashboard')
  }

  const { id } = await params

  const { data: job, error: jobError } =
    await supabase
      .from('job_postings')
      .select(`
        id,
        employer_id,
        title,
        company_name,
        location,
        employment_type,
        experience_level,
        description,
        requirements,
        salary_min,
        salary_max,
        is_active,
        require_resume,
        cover_letter_requirement,
        share_profile,
        share_match_score,
        created_at,
        updated_at
      `)
      .eq('id', id)
      .eq('employer_id', user.id)
      .single()

  if (jobError || !job) {
    notFound()
  }

  const {
    count: applicantCount,
    error: applicantCountError,
  } = await supabase
    .from('job_applications')
    .select('id', {
      count: 'exact',
      head: true,
    })
    .eq('job_id', job.id)

  const safeApplicantCount =
    applicantCountError ? 0 : applicantCount || 0

  const formatEmploymentType = value => {
    if (!value) return 'Not specified'

    return value
      .split('-')
      .map(
        word =>
          word.charAt(0).toUpperCase() +
          word.slice(1)
      )
      .join(' ')
  }

  const formatExperienceLevel = value => {
    if (!value) return 'Not specified'

    if (value === 'mid') {
      return 'Mid-level'
    }

    return (
      value.charAt(0).toUpperCase() +
      value.slice(1)
    )
  }

  const formatCoverLetterRequirement = value => {
    if (value === 'required') return 'Required'
    if (value === 'not_requested') {
      return 'Not requested'
    }

    return 'Optional'
  }

  const formatSalary = value => {
    if (
      value === null ||
      value === undefined ||
      value === ''
    ) {
      return null
    }

    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(value)
  }

  const minimumSalary = formatSalary(job.salary_min)
  const maximumSalary = formatSalary(job.salary_max)

  let salaryText = 'Not specified'

  if (minimumSalary && maximumSalary) {
    salaryText = `${minimumSalary} – ${maximumSalary}`
  } else if (minimumSalary) {
    salaryText = `From ${minimumSalary}`
  } else if (maximumSalary) {
    salaryText = `Up to ${maximumSalary}`
  }

  return (
    <main style={pageStyle}>
      <div style={containerStyle}>
        <Link
          href="/employer/dashboard"
          style={backLinkStyle}
        >
          ← Back to employer dashboard
        </Link>

        <section style={headerStyle}>
          <div>
            <div style={statusRowStyle}>
              <span
                style={{
                  ...statusBadgeStyle,
                  color: job.is_active
                    ? '#6EE7B7'
                    : '#FCA5A5',
                  background: job.is_active
                    ? 'rgba(16,185,129,0.12)'
                    : 'rgba(239,68,68,0.12)',
                  border: job.is_active
                    ? '1px solid rgba(16,185,129,0.25)'
                    : '1px solid rgba(239,68,68,0.25)',
                }}
              >
                {job.is_active ? 'Active' : 'Inactive'}
              </span>

              <span style={applicantBadgeStyle}>
                {safeApplicantCount}{' '}
                {safeApplicantCount === 1
                  ? 'applicant'
                  : 'applicants'}
              </span>
            </div>

            <h1 style={headingStyle}>{job.title}</h1>

            <p style={subtitleStyle}>
              {job.company_name ||
                profile.company_name ||
                'Your company'}
            </p>
          </div>

          <div style={actionsStyle}>
            <Link
              href={`/employer/jobs/${job.id}/applicants`}
              style={secondaryButtonStyle}
            >
              View applicants
            </Link>

            <Link
              href={`/employer/jobs/${job.id}/edit`}
              style={primaryButtonStyle}
            >
              Edit job
            </Link>
          </div>
        </section>

        <section style={summaryGridStyle}>
          <SummaryCard
            label="Location"
            value={
              job.location || 'Not specified'
            }
          />

          <SummaryCard
            label="Employment type"
            value={formatEmploymentType(
              job.employment_type
            )}
          />

          <SummaryCard
            label="Experience level"
            value={formatExperienceLevel(
              job.experience_level
            )}
          />

          <SummaryCard
            label="Salary"
            value={salaryText}
          />
        </section>

        <section style={contentGridStyle}>
          <div style={mainColumnStyle}>
            <section style={cardStyle}>
              <h2 style={sectionTitleStyle}>
                Job description
              </h2>

              <div style={contentTextStyle}>
                {job.description ||
                  'No job description was provided.'}
              </div>
            </section>

            <section style={cardStyle}>
              <h2 style={sectionTitleStyle}>
                Requirements
              </h2>

              <div style={contentTextStyle}>
                {job.requirements ||
                  'No requirements were provided.'}
              </div>
            </section>
          </div>

          <aside style={sideColumnStyle}>
            <section style={cardStyle}>
              <h2 style={sectionTitleStyle}>
                Application settings
              </h2>

              <div style={settingsListStyle}>
                <SettingRow
                  label="Resume"
                  value={
                    job.require_resume !== false
                      ? 'Required'
                      : 'Not required'
                  }
                />

                <SettingRow
                  label="Cover letter"
                  value={formatCoverLetterRequirement(
                    job.cover_letter_requirement
                  )}
                />

                <SettingRow
                  label="Share profile"
                  value={
                    job.share_profile !== false
                      ? 'Yes'
                      : 'No'
                  }
                />

                <SettingRow
                  label="Share match score"
                  value={
                    job.share_match_score !== false
                      ? 'Yes'
                      : 'No'
                  }
                />
              </div>
            </section>

            <section style={cardStyle}>
              <h2 style={sectionTitleStyle}>
                Job activity
              </h2>

              <div style={settingsListStyle}>
                <SettingRow
                  label="Created"
                  value={new Date(
                    job.created_at
                  ).toLocaleDateString('en-US')}
                />

                <SettingRow
                  label="Last updated"
                  value={new Date(
                    job.updated_at || job.created_at
                  ).toLocaleDateString('en-US')}
                />
              </div>
            </section>
          </aside>
        </section>
      </div>
    </main>
  )
}

function SummaryCard({ label, value }) {
  return (
    <div style={summaryCardStyle}>
      <p style={summaryLabelStyle}>{label}</p>
      <p style={summaryValueStyle}>{value}</p>
    </div>
  )
}

function SettingRow({ label, value }) {
  return (
    <div style={settingRowStyle}>
      <span style={settingLabelStyle}>{label}</span>
      <span style={settingValueStyle}>{value}</span>
    </div>
  )
}

const pageStyle = {
  minHeight: '100vh',
  background:
    'linear-gradient(135deg, #0A0F1E 0%, #0D1528 50%, #0A0F1E 100%)',
  color: '#fff',
  padding: '48px 24px',
  fontFamily: 'Inter, system-ui, sans-serif',
}

const containerStyle = {
  width: '100%',
  maxWidth: '1100px',
  margin: '0 auto',
}

const backLinkStyle = {
  display: 'inline-block',
  marginBottom: '28px',
  color: 'rgba(255,255,255,0.55)',
  textDecoration: 'none',
  fontSize: '14px',
  fontWeight: 600,
}

const headerStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  gap: '24px',
  marginBottom: '32px',
  flexWrap: 'wrap',
}

const statusRowStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
  marginBottom: '14px',
  flexWrap: 'wrap',
}

const statusBadgeStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  padding: '6px 11px',
  borderRadius: '999px',
  fontSize: '12px',
  fontWeight: 700,
}

const applicantBadgeStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  padding: '6px 11px',
  borderRadius: '999px',
  color: '#C4B5FD',
  background: 'rgba(124,58,237,0.12)',
  border: '1px solid rgba(124,58,237,0.25)',
  fontSize: '12px',
  fontWeight: 700,
}

const headingStyle = {
  margin: '0 0 10px',
  fontSize: '36px',
  lineHeight: 1.2,
  letterSpacing: '-0.7px',
}

const subtitleStyle = {
  margin: 0,
  color: 'rgba(255,255,255,0.5)',
  fontSize: '15px',
}

const actionsStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  flexWrap: 'wrap',
}

const primaryButtonStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: '46px',
  padding: '0 20px',
  borderRadius: '12px',
  background:
    'linear-gradient(135deg, #5B4FE8, #7C3AED)',
  color: '#fff',
  textDecoration: 'none',
  fontSize: '14px',
  fontWeight: 700,
  boxShadow: '0 4px 16px rgba(91,79,232,0.35)',
}

const secondaryButtonStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: '46px',
  padding: '0 20px',
  borderRadius: '12px',
  background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.1)',
  color: 'rgba(255,255,255,0.82)',
  textDecoration: 'none',
  fontSize: '14px',
  fontWeight: 700,
}

const summaryGridStyle = {
  display: 'grid',
  gridTemplateColumns:
    'repeat(auto-fit, minmax(190px, 1fr))',
  gap: '16px',
  marginBottom: '24px',
}

const summaryCardStyle = {
  padding: '20px',
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: '16px',
}

const summaryLabelStyle = {
  margin: '0 0 8px',
  color: 'rgba(255,255,255,0.42)',
  fontSize: '12px',
  fontWeight: 600,
}

const summaryValueStyle = {
  margin: 0,
  color: '#fff',
  fontSize: '15px',
  fontWeight: 700,
}

const contentGridStyle = {
  display: 'grid',
  gridTemplateColumns:
    'minmax(0, 2fr) minmax(280px, 1fr)',
  gap: '24px',
  alignItems: 'start',
}

const mainColumnStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '24px',
  minWidth: 0,
}

const sideColumnStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '24px',
  minWidth: 0,
}

const cardStyle = {
  padding: '24px',
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: '20px',
}

const sectionTitleStyle = {
  margin: '0 0 18px',
  color: '#fff',
  fontSize: '18px',
}

const contentTextStyle = {
  color: 'rgba(255,255,255,0.68)',
  fontSize: '14px',
  lineHeight: 1.8,
  whiteSpace: 'pre-wrap',
  overflowWrap: 'anywhere',
}

const settingsListStyle = {
  display: 'flex',
  flexDirection: 'column',
}

const settingRowStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  gap: '16px',
  padding: '13px 0',
  borderBottom:
    '1px solid rgba(255,255,255,0.07)',
}

const settingLabelStyle = {
  color: 'rgba(255,255,255,0.45)',
  fontSize: '13px',
}

const settingValueStyle = {
  color: 'rgba(255,255,255,0.82)',
  fontSize: '13px',
  fontWeight: 700,
  textAlign: 'right',
}