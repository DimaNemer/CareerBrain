import { createClient } from '@/lib/supabase-server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'

export default async function JobApplicantsPage({
  params,
}) {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
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

  /*
   * The employer can only access applicants
   * for a job that belongs to their account.
   */
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
        is_active
      `)
      .eq('id', id)
      .eq('employer_id', user.id)
      .single()

  if (jobError || !job) {
    notFound()
  }

  const {
    data: applications,
    error: applicationsError,
  } = await supabase
    .from('job_applications')
    .select(`
      id,
      applicant_id,
      status,
      cv_url,
      cover_letter,
      created_at,
      updated_at
    `)
    .eq('job_id', job.id)
    .order('created_at', {
      ascending: false,
    })

  const safeApplications =
    applicationsError ? [] : applications || []

  /*
   * Load the applicants' profile information separately.
   * This avoids depending on a particular Supabase
   * relationship name between applications and profiles.
   */
  const applicantIds = [
    ...new Set(
      safeApplications
        .map(application => application.applicant_id)
        .filter(Boolean)
    ),
  ]

  let applicantProfiles = []

  if (applicantIds.length > 0) {
    const {
      data: profiles,
      error: applicantsProfileError,
    } = await supabase
      .from('profiles')
      .select(`
        id,
        full_name,
        username,
        headline,
        readiness_score
      `)
      .in('id', applicantIds)

    if (!applicantsProfileError) {
      applicantProfiles = profiles || []
    }
  }

  const profilesById = new Map(
    applicantProfiles.map(applicantProfile => [
      applicantProfile.id,
      applicantProfile,
    ])
  )

  const applicants = safeApplications.map(
    application => ({
      ...application,
      profile:
        profilesById.get(application.applicant_id) ||
        null,
    })
  )

  const submittedCount = applicants.filter(
    application =>
      application.status === 'submitted'
  ).length

  const reviewingCount = applicants.filter(
    application =>
      application.status === 'reviewing'
  ).length

  const shortlistedCount = applicants.filter(
    application =>
      application.status === 'shortlisted'
  ).length

  const acceptedCount = applicants.filter(
    application =>
      application.status === 'accepted'
  ).length

  const rejectedCount = applicants.filter(
    application =>
      application.status === 'rejected'
  ).length

  return (
    <main style={pageStyle}>
      <div style={containerStyle}>
        <Link
          href={`/employer/jobs/${job.id}`}
          style={backLinkStyle}
        >
          ← Back to job details
        </Link>

        <section style={headerStyle}>
          <div>
            <p style={eyebrowStyle}>
              Employer workspace
            </p>

            <h1 style={headingStyle}>
              Applicants
            </h1>

            <p style={descriptionStyle}>
              Review candidates who applied for{' '}
              <strong style={jobTitleStyle}>
                {job.title}
              </strong>
              .
            </p>
          </div>

          <span style={totalBadgeStyle}>
            {applicants.length}{' '}
            {applicants.length === 1
              ? 'applicant'
              : 'applicants'}
          </span>
        </section>

        <section style={statsGridStyle}>
          <StatCard
            label="Submitted"
            value={submittedCount}
          />

          <StatCard
            label="Reviewing"
            value={reviewingCount}
          />

          <StatCard
            label="Shortlisted"
            value={shortlistedCount}
          />

          <StatCard
            label="Accepted"
            value={acceptedCount}
          />

          <StatCard
            label="Rejected"
            value={rejectedCount}
          />
        </section>

        {applicationsError && (
          <div style={errorStyle}>
            Unable to load the applicants. Please
            try again.
          </div>
        )}

        <section style={cardStyle}>
          <div style={cardHeaderStyle}>
            <div>
              <h2 style={sectionTitleStyle}>
                Candidate applications
              </h2>

              <p style={sectionDescriptionStyle}>
                Select an applicant to review their
                resume, profile, cover letter and
                screening answers.
              </p>
            </div>
          </div>

          {applicants.length === 0 ? (
            <div style={emptyStateStyle}>
              <div style={emptyIconStyle}>
                👤
              </div>

              <h3 style={emptyTitleStyle}>
                No applicants yet
              </h3>

              <p style={emptyDescriptionStyle}>
                Applications submitted for this job
                will appear here.
              </p>
            </div>
          ) : (
            <div style={applicantsListStyle}>
              {applicants.map(application => {
                const applicantProfile =
                  application.profile

                const applicantName =
                  applicantProfile?.full_name ||
                  applicantProfile?.username ||
                  'Candidate'

                return (
                  <Link
                    key={application.id}
                    href={`/employer/jobs/${job.id}/applicants/${application.id}`}
                    style={applicantCardStyle}
                  >
                    <div style={candidateSectionStyle}>
                      <div style={avatarStyle}>
                        {getInitials(applicantName)}
                      </div>

                      <div style={candidateInfoStyle}>
                        <h3 style={candidateNameStyle}>
                          {applicantName}
                        </h3>

                        <p style={headlineStyle}>
                          {applicantProfile?.headline ||
                            'CareerBrain candidate'}
                        </p>

                        <div style={metadataRowStyle}>
                          <span>
                            Applied{' '}
                            {formatApplicationDate(
                              application.created_at
                            )}
                          </span>

                          {application.cv_url && (
                            <span>• Resume included</span>
                          )}

                          {application.cover_letter && (
                            <span>
                              • Cover letter included
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div style={rightSectionStyle}>
                      <span
                        style={getStatusStyle(
                          application.status
                        )}
                      >
                        {formatStatus(
                          application.status
                        )}
                      </span>

                      <span style={viewTextStyle}>
                        View application →
                      </span>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  )
}

function StatCard({ label, value }) {
  return (
    <div style={statCardStyle}>
      <p style={statLabelStyle}>{label}</p>

      <p style={statValueStyle}>{value}</p>
    </div>
  )
}

function getInitials(name) {
  const words = String(name)
    .trim()
    .split(/\s+/)
    .filter(Boolean)

  if (words.length === 0) {
    return 'C'
  }

  if (words.length === 1) {
    return words[0].charAt(0).toUpperCase()
  }

  return (
    words[0].charAt(0) +
    words[words.length - 1].charAt(0)
  ).toUpperCase()
}

function formatApplicationDate(value) {
  if (!value) {
    return 'recently'
  }

  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(value))
}

function formatStatus(status) {
  if (!status) {
    return 'Submitted'
  }

  return status
    .split('_')
    .map(
      word =>
        word.charAt(0).toUpperCase() +
        word.slice(1)
    )
    .join(' ')
}

function getStatusStyle(status) {
  const baseStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '6px 11px',
    borderRadius: '999px',
    fontSize: '12px',
    fontWeight: 700,
    textTransform: 'capitalize',
  }

  if (status === 'reviewing') {
    return {
      ...baseStyle,
      color: '#93C5FD',
      background: 'rgba(59,130,246,0.12)',
      border:
        '1px solid rgba(59,130,246,0.25)',
    }
  }

  if (status === 'shortlisted') {
    return {
      ...baseStyle,
      color: '#C4B5FD',
      background: 'rgba(139,92,246,0.12)',
      border:
        '1px solid rgba(139,92,246,0.25)',
    }
  }

  if (status === 'accepted') {
    return {
      ...baseStyle,
      color: '#6EE7B7',
      background: 'rgba(16,185,129,0.12)',
      border:
        '1px solid rgba(16,185,129,0.25)',
    }
  }

  if (status === 'rejected') {
    return {
      ...baseStyle,
      color: '#FCA5A5',
      background: 'rgba(239,68,68,0.12)',
      border:
        '1px solid rgba(239,68,68,0.25)',
    }
  }

  return {
    ...baseStyle,
    color: '#FCD34D',
    background: 'rgba(245,158,11,0.12)',
    border:
      '1px solid rgba(245,158,11,0.25)',
  }
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
  marginBottom: '28px',
  flexWrap: 'wrap',
}

const eyebrowStyle = {
  margin: '0 0 8px',
  color: '#818CF8',
  fontSize: '14px',
  fontWeight: 700,
}

const headingStyle = {
  margin: '0 0 10px',
  fontSize: '34px',
  lineHeight: 1.2,
  letterSpacing: '-0.6px',
}

const descriptionStyle = {
  margin: 0,
  color: 'rgba(255,255,255,0.5)',
  fontSize: '15px',
  lineHeight: 1.6,
}

const jobTitleStyle = {
  color: 'rgba(255,255,255,0.78)',
}

const totalBadgeStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  padding: '8px 13px',
  borderRadius: '999px',
  color: '#C4B5FD',
  background: 'rgba(124,58,237,0.12)',
  border: '1px solid rgba(124,58,237,0.25)',
  fontSize: '13px',
  fontWeight: 700,
}

const statsGridStyle = {
  display: 'grid',
  gridTemplateColumns:
    'repeat(auto-fit, minmax(140px, 1fr))',
  gap: '14px',
  marginBottom: '24px',
}

const statCardStyle = {
  padding: '17px',
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: '15px',
}

const statLabelStyle = {
  margin: '0 0 7px',
  color: 'rgba(255,255,255,0.42)',
  fontSize: '12px',
}

const statValueStyle = {
  margin: 0,
  color: '#fff',
  fontSize: '24px',
  fontWeight: 800,
}

const errorStyle = {
  marginBottom: '20px',
  padding: '14px 16px',
  background: 'rgba(239,68,68,0.12)',
  border: '1px solid rgba(239,68,68,0.25)',
  borderRadius: '12px',
  color: '#FCA5A5',
  fontSize: '14px',
}

const cardStyle = {
  padding: '24px',
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: '20px',
}

const cardHeaderStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: '16px',
  marginBottom: '20px',
}

const sectionTitleStyle = {
  margin: '0 0 6px',
  fontSize: '19px',
}

const sectionDescriptionStyle = {
  margin: 0,
  color: 'rgba(255,255,255,0.42)',
  fontSize: '13px',
  lineHeight: 1.5,
}

const applicantsListStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '12px',
}

const applicantCardStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: '20px',
  padding: '17px',
  background: 'rgba(255,255,255,0.035)',
  border: '1px solid rgba(255,255,255,0.075)',
  borderRadius: '15px',
  color: '#fff',
  textDecoration: 'none',
  flexWrap: 'wrap',
}

const candidateSectionStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '14px',
  minWidth: 0,
  flex: '1 1 420px',
}

const avatarStyle = {
  width: '48px',
  height: '48px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
  borderRadius: '14px',
  background:
    'linear-gradient(135deg, #5B4FE8, #7C3AED)',
  color: '#fff',
  fontSize: '16px',
  fontWeight: 800,
}

const candidateInfoStyle = {
  minWidth: 0,
}

const candidateNameStyle = {
  margin: '0 0 5px',
  fontSize: '16px',
}

const headlineStyle = {
  margin: '0 0 7px',
  color: 'rgba(255,255,255,0.5)',
  fontSize: '13px',
}

const metadataRowStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '7px',
  flexWrap: 'wrap',
  color: 'rgba(255,255,255,0.33)',
  fontSize: '11px',
}

const rightSectionStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'flex-end',
  gap: '14px',
  flexWrap: 'wrap',
}

const viewTextStyle = {
  color: '#A5B4FC',
  fontSize: '12px',
  fontWeight: 700,
}

const emptyStateStyle = {
  padding: '54px 20px',
  textAlign: 'center',
  border: '1px dashed rgba(255,255,255,0.12)',
  borderRadius: '16px',
}

const emptyIconStyle = {
  width: '54px',
  height: '54px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  margin: '0 auto 15px',
  borderRadius: '16px',
  background: 'rgba(129,140,248,0.1)',
  fontSize: '24px',
}

const emptyTitleStyle = {
  margin: '0 0 8px',
  fontSize: '17px',
}

const emptyDescriptionStyle = {
  margin: 0,
  color: 'rgba(255,255,255,0.42)',
  fontSize: '13px',
}