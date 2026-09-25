import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function EmployerProfilePage() {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    redirect('/login')
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
    redirect('/dashboard')
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
  redirect('/employer/dashboard')
}

const company = Array.isArray(membership.companies)
  ? membership.companies[0]
  : membership.companies

if (!company) {
  redirect('/employer/dashboard')
}
  const {
    data: jobs,
    error: jobsError,
  } = await supabase
    .from('job_postings')
    .select(`
      id,
      title,
      location,
      employment_type,
      experience_level,
      is_active,
      created_at
    `)
   .eq('company_id', company.id)
    .order('created_at', {
      ascending: false,
    })

  if (jobsError) {
    console.error(
      'Employer profile jobs error:',
      jobsError.message
    )
  }

  const safeJobs = jobsError ? [] : jobs || []

  const totalJobs = safeJobs.length

  const activeJobs = safeJobs.filter(
    job => job.is_active
  ).length

  const inactiveJobs = safeJobs.filter(
    job => !job.is_active
  ).length
const safeWebsite = getSafeWebsite(
  company.website
)

const companyInitials =
  company.name
    ?.split(/\s+/)
    .filter(Boolean)
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'CO'

  return (
  <main
    className="employer-profile-page"
    style={pageStyle}
  >
    <style>{`
      @media screen and (max-width: 768px) {
        .employer-profile-page {
          padding: 30px 18px 50px !important;
        }

        /* TOP ACTIONS */

        .profile-top-actions {
          flex-direction: column !important;
          align-items: stretch !important;
          gap: 14px !important;
        }

        .profile-action-buttons {
          display: grid !important;
          grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
          width: 100% !important;
          gap: 10px !important;
        }

        .profile-action-buttons a {
          width: 100% !important;
          box-sizing: border-box !important;
          text-align: center !important;
        }

        .profile-create-job {
          grid-column: 1 / -1;
        }

        /* HERO */

        .profile-hero {
          padding: 22px !important;
          border-radius: 20px !important;
        }

        .profile-hero-content {
          gap: 15px !important;
        }

        .profile-logo {
          width: 62px !important;
          height: 62px !important;
          border-radius: 18px !important;
          font-size: 20px !important;
        }

        .profile-company-title {
          font-size: 27px !important;
          overflow-wrap: break-word !important;
          word-break: normal !important;
        }

        .profile-hero-stats {
          margin-top: 22px !important;
        }

        .profile-hero-stat {
          padding: 14px 8px !important;
        }

        /* MAIN PAGE LAYOUT */

        .profile-content-grid {
          display: flex !important;
          flex-direction: column !important;
          width: 100% !important;
          gap: 20px !important;
        }

        .profile-main-column,
        .profile-side-column {
          width: 100% !important;
          max-width: 100% !important;
          min-width: 0 !important;
          gap: 20px !important;
        }

        /* CARDS */

        .profile-card,
        .profile-highlight-card {
          width: 100% !important;
          max-width: 100% !important;
          min-width: 0 !important;
          box-sizing: border-box !important;
          padding: 18px !important;
          border-radius: 16px !important;
        }

        /* COMPANY DETAILS */

        .profile-details-grid {
          grid-template-columns:
            repeat(2, minmax(0, 1fr)) !important;
          gap: 10px !important;
        }

        .profile-detail-card {
          padding: 14px !important;
          min-width: 0 !important;
        }

        .profile-detail-value {
          overflow-wrap: break-word !important;
          word-break: normal !important;
        }

        .profile-website-link {
          overflow-wrap: break-word !important;
          word-break: normal !important;
        }

       /* JOBS */

.profile-job-card {
  padding: 14px !important;
  gap: 12px !important;
}

.profile-job-main {
  width: 100% !important;
  flex: 1 1 100% !important;
  min-width: 0 !important;
  align-items: flex-start !important;
}

.profile-job-info {
  flex: 1 !important;
  width: auto !important;
  min-width: 0 !important;
}

.profile-job-title {
  margin-bottom: 5px !important;
  overflow-wrap: break-word !important;
  word-break: normal !important;
}

.profile-job-meta {
  overflow-wrap: break-word !important;
  word-break: normal !important;
  line-height: 1.5 !important;
}

.profile-job-right {
  width: 100% !important;
  justify-content: space-between !important;
}

        /* EMPLOYER ACCOUNT */

        .profile-account-row {
          gap: 12px !important;
        }

        .profile-account-label {
          flex: 1 1 45%;
          min-width: 0 !important;
        }

        .profile-account-value {
          flex: 1 1 55%;
          min-width: 0 !important;
          overflow-wrap: break-word !important;
          word-break: normal !important;
        }
      }


      @media screen and (max-width: 480px) {
        .employer-profile-page {
          padding: 24px 14px 40px !important;
        }

        .profile-action-buttons {
          grid-template-columns: 1fr !important;
        }

        .profile-create-job {
          grid-column: auto;
        }

        .profile-hero {
          padding: 18px !important;
        }

        .profile-hero-content {
          align-items: flex-start !important;
        }

        .profile-logo {
          width: 56px !important;
          height: 56px !important;
          font-size: 18px !important;
        }

        .profile-company-title {
          font-size: 24px !important;
        }

        .profile-hero-stat {
          padding: 12px 5px !important;
        }

        .profile-hero-stat-value {
          font-size: 20px !important;
        }

        .profile-hero-stat-label {
          font-size: 9px !important;
          letter-spacing: 0 !important;
        }

        .profile-card,
        .profile-highlight-card {
          padding: 16px !important;
        }

        .profile-details-grid {
          gap: 8px !important;
        }

        .profile-detail-card {
          padding: 12px !important;
        }

        .profile-detail-label {
          font-size: 9px !important;
        }

        .profile-detail-value {
          font-size: 12px !important;
        }

     .profile-job-icon {
  width: 38px !important;
  height: 38px !important;
  border-radius: 10px !important;
}
      }
    `}</style>

    <div style={containerStyle}>
      <div
  className="profile-top-actions"
  style={topActionsStyle}
>
          <Link
            href="/employer/dashboard"
            style={backLinkStyle}
          >
            ← Back to employer dashboard
          </Link>

 <div
  className="profile-action-buttons"
  style={{
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    flexWrap: 'wrap',
  }}
>
  <Link
    href={`/profile/${user.id}?from=${encodeURIComponent(
      '/employer/profile'
    )}`}
    style={secondaryButtonStyle}
  >
    My profile
  </Link>

  <Link
    href={`/company/${company.id}?from=${encodeURIComponent(
      '/employer/profile'
    )}`}
    style={secondaryButtonStyle}
  >
    View company
  </Link>

  <Link
    href="/employer/profile/edit"
    style={secondaryButtonStyle}
  >
    Edit company
  </Link>

  <Link
    href="/employer/jobs/new"
    style={primaryButtonStyle}
    className="profile-create-job"
  >
    + Create job
  </Link>
</div>
        </div>

       <section
  className="profile-hero"
  style={heroStyle}
>
          <div style={heroPatternStyle} />

         <div
  className="profile-hero-content"
  style={heroContentStyle}
>
           <div
  className="profile-logo"
  style={logoStyle}
>
              {companyInitials}
            </div>

            <div style={companyHeadingStyle}>
            <p style={eyebrowStyle}>
  Company workspace
</p>

              <h1
  className="profile-company-title"
  style={titleStyle}
>
               {company.name || 'Your company'}
              </h1>

              <p style={subtitleStyle}>
              {company.industry ||
  'Industry not specified'}
              </p>
            </div>
          </div>

         <div
  className="profile-hero-stats"
  style={heroStatsStyle}
>
            <HeroStat
              label="Total jobs"
              value={totalJobs}
            />

            <HeroStat
              label="Active jobs"
              value={activeJobs}
            />

            <HeroStat
              label="Inactive jobs"
              value={inactiveJobs}
              last
            />
          </div>
        </section>

       <section
  className="profile-content-grid"
  style={contentGridStyle}
>
        <div
  className="profile-main-column"
  style={mainColumnStyle}
>
          <section
  className="profile-card"
  style={cardStyle}
>
              <div style={sectionHeaderStyle}>
                <div>
                  <h2 style={sectionTitleStyle}>
                    Company information
                  </h2>

               <p style={sectionDescriptionStyle}>
  Information about {company.name}.
</p>
                </div>
              </div>

             <div
  className="profile-details-grid"
  style={detailsGridStyle}
>
                <CompanyDetail
  label="Company name"
  value={company.name || 'Not provided'}
/>

<CompanyDetail
  label="Industry"
  value={company.industry || 'Not provided'}
/>

<CompanyDetail
  label="Company size"
  value={company.company_size || 'Not provided'}
/>

<CompanyDetail
  label="Location"
  value={company.location || 'Not provided'}
/>
              </div>

              <div style={websiteSectionStyle}>
                <p style={detailLabelStyle}>
                  Company website
                </p>

                {safeWebsite ? (
                  <a
  href={safeWebsite}
  target="_blank"
  rel="noopener noreferrer"
  className="profile-website-link"
  style={websiteLinkStyle}
>
                   {company.website} ↗
                  </a>
                ) : (
                  <p style={missingValueStyle}>
                    Not provided
                  </p>
                )}
              </div>
            </section>

          <section
  className="profile-card"
  style={cardStyle}
>
              <div style={sectionHeaderStyle}>
                <div>
                  <h2 style={sectionTitleStyle}>
                    Posted jobs
                  </h2>

                 <p style={sectionDescriptionStyle}>
  Jobs posted by {company.name}.
</p>
                </div>

                <Link
                  href="/employer/dashboard"
                  style={secondaryLinkStyle}
                >
                  Manage all jobs →
                </Link>
              </div>

              {safeJobs.length === 0 ? (
                <div style={emptyStateStyle}>
                  <div style={emptyIconStyle}>
                    💼
                  </div>

                  <h3 style={emptyTitleStyle}>
                    No jobs posted yet
                  </h3>

                  <p style={emptyTextStyle}>
                    Create your first job to start
                    receiving applications.
                  </p>

                  <Link
                    href="/employer/jobs/new"
                    style={emptyButtonStyle}
                  >
                    Create a job
                  </Link>
                </div>
              ) : (
                <div style={jobsListStyle}>
                  {safeJobs.map(job => (
                   <Link
  key={job.id}
  href={`/employer/jobs/${job.id}`}
  className="profile-job-card"
  style={jobCardStyle}
>
                      <div
  className="profile-job-main"
  style={jobMainStyle}
>
                    <div
  className="profile-job-info"
  style={jobInfoStyle}
>
  <h3
    className="profile-job-title"
    style={jobTitleStyle}
  >
    {job.title}
  </h3>

  <p
    className="profile-job-meta"
    style={jobMetaStyle}
  >
    {job.location || 'Location not specified'}

    {job.employment_type
      ? ` · ${formatLabel(job.employment_type)}`
      : ''}

    {job.experience_level
      ? ` · ${formatLabel(job.experience_level)}`
      : ''}
  </p>
</div>
                      </div>

                      <div
  className="profile-job-right"
  style={jobRightStyle}
>
                        <span
                          style={{
                            ...statusBadgeStyle,
                            color: job.is_active
                              ? '#6EE7B7'
                              : '#FCA5A5',
                            background:
                              job.is_active
                                ? 'rgba(16,185,129,0.12)'
                                : 'rgba(239,68,68,0.12)',
                            border:
                              job.is_active
                                ? '1px solid rgba(16,185,129,0.25)'
                                : '1px solid rgba(239,68,68,0.25)',
                          }}
                        >
                          {job.is_active
                            ? 'Active'
                            : 'Inactive'}
                        </span>

                        <span style={openTextStyle}>
                          Open →
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </section>
          </div>

          <aside
  className="profile-side-column"
  style={sideColumnStyle}
>
            <section
  className="profile-card"
  style={cardStyle}
>
              <h2 style={sectionTitleStyle}>
                Employer account
              </h2>

              <div style={accountListStyle}>
             <AccountRow
  label="Account owner"
  value={profile.full_name || 'Not provided'}
/>

<AccountRow
  label="Username"
  value={
    profile.username
      ? `@${profile.username}`
      : 'Not provided'
  }
/>

<AccountRow
  label="Job title"
  value={
    membership.job_title || 'Not provided'
  }
/>

<AccountRow
  label="Company role"
  value={formatLabel(membership.role)}
/>
              </div>
              <div
  style={{
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    marginTop: '18px',
  }}
>
  <Link
    href={`/profile/${user.id}?from=${encodeURIComponent(
      '/employer/profile'
    )}`}
    style={primaryButtonStyle}
  >
    View my professional profile
  </Link>

  <Link
    href="/profile/edit"
    style={secondaryButtonStyle}
  >
    Edit my professional profile
  </Link>
</div>
            </section>

          <section
  className="profile-highlight-card"
  style={highlightCardStyle}
>
              <p style={highlightEyebrowStyle}>
                Hiring workspace
              </p>

              <h2 style={highlightTitleStyle}>
                Manage your recruitment activity
              </h2>

              <p style={highlightTextStyle}>
                Create job posts, review
                applicants, update application
                statuses, and manage active
                opportunities.
              </p>

              <Link
                href="/employer/dashboard"
                style={highlightButtonStyle}
              >
                Open employer dashboard
              </Link>
            </section>
          </aside>
        </section>
      </div>
    </main>
  )
}

function HeroStat({
  label,
  value,
  last = false,
}) {
  return (
    <div
      className="profile-hero-stat"
      style={{
        ...heroStatStyle,
        borderRight: last
          ? 'none'
          : '1px solid rgba(255,255,255,0.08)',
      }}
    >
      <p
        className="profile-hero-stat-value"
        style={heroStatValueStyle}
      >
        {value}
      </p>

      <p
        className="profile-hero-stat-label"
        style={heroStatLabelStyle}
      >
        {label}
      </p>
    </div>
  )
}
function CompanyDetail({ label, value }) {
  return (
    <div
      className="profile-detail-card"
      style={detailCardStyle}
    >
      <p
        className="profile-detail-label"
        style={detailLabelStyle}
      >
        {label}
      </p>

      <p
        className="profile-detail-value"
        style={detailValueStyle}
      >
        {value}
      </p>
    </div>
  )
}

function AccountRow({ label, value }) {
  return (
    <div
      className="profile-account-row"
      style={accountRowStyle}
    >
      <span
        className="profile-account-label"
        style={accountLabelStyle}
      >
        {label}
      </span>

      <span
        className="profile-account-value"
        style={accountValueStyle}
      >
        {value}
      </span>
    </div>
  )
}

function formatLabel(value) {
  if (!value) return ''

  if (value === 'mid') {
    return 'Mid-level'
  }

  return value
    .split('-')
    .map(
      word =>
        word.charAt(0).toUpperCase() +
        word.slice(1)
    )
    .join(' ')
}

function getSafeWebsite(value) {
  if (!value || typeof value !== 'string') {
    return null
  }

  try {
    const url = new URL(value)

    if (
      url.protocol !== 'http:' &&
      url.protocol !== 'https:'
    ) {
      return null
    }

    return url.toString()
  } catch {
    return null
  }
}

const pageStyle = {
  minHeight: '100vh',
  background:
    'linear-gradient(135deg, #0A0F1E 0%, #0D1528 50%, #0A0F1E 100%)',
  color: '#FFFFFF',
  padding: '40px 24px 60px',
  fontFamily: 'Inter, system-ui, sans-serif',
}

const containerStyle = {
  width: '100%',
  maxWidth: '1100px',
  margin: '0 auto',
}

const topActionsStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: '16px',
  marginBottom: '24px',
  flexWrap: 'wrap',
}

const backLinkStyle = {
  color: 'rgba(255,255,255,0.55)',
  textDecoration: 'none',
  fontSize: '14px',
  fontWeight: 600,
}

const primaryButtonStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '12px 18px',
  borderRadius: '11px',
  background:
    'linear-gradient(135deg, #5B4FE8, #7C3AED)',
  color: '#FFFFFF',
  textDecoration: 'none',
  fontSize: '14px',
  fontWeight: 700,
  boxShadow:
    '0 4px 16px rgba(91,79,232,0.35)',
}
const secondaryButtonStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '12px 18px',
  borderRadius: '11px',
  background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.10)',
  color: '#FFFFFF',
  textDecoration: 'none',
  fontSize: '14px',
  fontWeight: 700,
}

const heroStyle = {
  position: 'relative',
  overflow: 'hidden',
  padding: '30px',
  marginBottom: '24px',
  borderRadius: '24px',
  background:
    'linear-gradient(135deg, rgba(33,29,89,0.96), rgba(55,49,154,0.94), rgba(17,25,54,0.98))',
  border: '1px solid rgba(129,140,248,0.2)',
  boxShadow: '0 16px 40px rgba(0,0,0,0.2)',
}

const heroPatternStyle = {
  position: 'absolute',
  inset: 0,
  backgroundImage:
    'radial-gradient(rgba(255,255,255,0.06) 1px, transparent 1px)',
  backgroundSize: '26px 26px',
  pointerEvents: 'none',
}

const heroContentStyle = {
  position: 'relative',
  zIndex: 1,
  display: 'flex',
  alignItems: 'center',
  gap: '20px',
  flexWrap: 'wrap',
}

const logoStyle = {
  width: '78px',
  height: '78px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
  borderRadius: '22px',
  background:
    'linear-gradient(135deg, #5B4FE8, #818CF8)',
  border: '2px solid rgba(255,255,255,0.18)',
  color: '#FFFFFF',
  fontSize: '24px',
  fontWeight: 800,
  boxShadow:
    '0 8px 24px rgba(0,0,0,0.25)',
}

const companyHeadingStyle = {
  minWidth: 0,
}

const eyebrowStyle = {
  margin: '0 0 7px',
  color: '#A5B4FC',
  fontSize: '13px',
  fontWeight: 700,
}

const titleStyle = {
  margin: '0 0 8px',
  color: '#FFFFFF',
  fontSize: '32px',
  lineHeight: 1.2,
}

const subtitleStyle = {
  margin: 0,
  color: 'rgba(255,255,255,0.55)',
  fontSize: '14px',
}

const heroStatsStyle = {
  position: 'relative',
  zIndex: 1,
  display: 'grid',
  gridTemplateColumns:
    'repeat(3, minmax(0, 1fr))',
  marginTop: '28px',
  borderRadius: '15px',
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.08)',
  overflow: 'hidden',
}

const heroStatStyle = {
  padding: '17px 12px',
  textAlign: 'center',
}

const heroStatValueStyle = {
  margin: '0 0 4px',
  color: '#FFFFFF',
  fontSize: '24px',
  fontWeight: 800,
}

const heroStatLabelStyle = {
  margin: 0,
  color: 'rgba(255,255,255,0.4)',
  fontSize: '11px',
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
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
  borderRadius: '20px',
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.08)',
}

const sectionHeaderStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  gap: '16px',
  marginBottom: '20px',
  flexWrap: 'wrap',
}

const sectionTitleStyle = {
  margin: '0 0 6px',
  color: '#FFFFFF',
  fontSize: '18px',
}

const sectionDescriptionStyle = {
  margin: 0,
  color: 'rgba(255,255,255,0.4)',
  fontSize: '12px',
  lineHeight: 1.5,
}

const detailsGridStyle = {
  display: 'grid',
  gridTemplateColumns:
    'repeat(auto-fit, minmax(190px, 1fr))',
  gap: '14px',
}

const detailCardStyle = {
  padding: '16px',
  borderRadius: '14px',
  background: 'rgba(255,255,255,0.035)',
  border: '1px solid rgba(255,255,255,0.07)',
}

const detailLabelStyle = {
  margin: '0 0 7px',
  color: 'rgba(255,255,255,0.4)',
  fontSize: '11px',
  textTransform: 'uppercase',
  letterSpacing: '0.4px',
}

const detailValueStyle = {
  margin: 0,
  color: 'rgba(255,255,255,0.85)',
  fontSize: '14px',
  fontWeight: 700,
  overflowWrap: 'anywhere',
}

const websiteSectionStyle = {
  marginTop: '14px',
  padding: '16px',
  borderRadius: '14px',
  background: 'rgba(255,255,255,0.035)',
  border: '1px solid rgba(255,255,255,0.07)',
}

const websiteLinkStyle = {
  color: '#A5B4FC',
  textDecoration: 'none',
  fontSize: '14px',
  fontWeight: 700,
  overflowWrap: 'anywhere',
}

const missingValueStyle = {
  margin: 0,
  color: 'rgba(255,255,255,0.35)',
  fontSize: '13px',
}

const secondaryLinkStyle = {
  color: '#A5B4FC',
  textDecoration: 'none',
  fontSize: '12px',
  fontWeight: 700,
}

const jobsListStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '12px',
}

const jobCardStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: '18px',
  padding: '16px',
  borderRadius: '15px',
  background: 'rgba(255,255,255,0.035)',
  border: '1px solid rgba(255,255,255,0.075)',
  color: '#FFFFFF',
  textDecoration: 'none',
  flexWrap: 'wrap',
}

const jobMainStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '13px',
  minWidth: 0,
  flex: '1 1 400px',
}

const jobIconStyle = {
  width: '42px',
  height: '42px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
  borderRadius: '12px',
  background: 'rgba(129,140,248,0.12)',
  fontSize: '18px',
}

const jobInfoStyle = {
  minWidth: 0,
}

const jobTitleStyle = {
  margin: '0 0 5px',
  color: '#FFFFFF',
  fontSize: '15px',
}

const jobMetaStyle = {
  margin: 0,
  color: 'rgba(255,255,255,0.42)',
  fontSize: '12px',
  lineHeight: 1.5,
}

const jobRightStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
}

const statusBadgeStyle = {
  padding: '6px 10px',
  borderRadius: '999px',
  fontSize: '11px',
  fontWeight: 700,
}

const openTextStyle = {
  color: '#A5B4FC',
  fontSize: '11px',
  fontWeight: 700,
}

const emptyStateStyle = {
  padding: '38px 20px',
  borderRadius: '16px',
  border: '1px dashed rgba(255,255,255,0.12)',
  textAlign: 'center',
}

const emptyIconStyle = {
  fontSize: '28px',
  marginBottom: '12px',
}

const emptyTitleStyle = {
  margin: '0 0 7px',
  color: '#FFFFFF',
  fontSize: '16px',
}

const emptyTextStyle = {
  margin: '0 0 16px',
  color: 'rgba(255,255,255,0.4)',
  fontSize: '12px',
}

const emptyButtonStyle = {
  display: 'inline-flex',
  padding: '10px 16px',
  borderRadius: '10px',
  background:
    'linear-gradient(135deg, #5B4FE8, #7C3AED)',
  color: '#FFFFFF',
  textDecoration: 'none',
  fontSize: '12px',
  fontWeight: 700,
}

const accountListStyle = {
  display: 'flex',
  flexDirection: 'column',
}

const accountRowStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  gap: '14px',
  padding: '12px 0',
  borderBottom:
    '1px solid rgba(255,255,255,0.07)',
}

const accountLabelStyle = {
  color: 'rgba(255,255,255,0.4)',
  fontSize: '12px',
}

const accountValueStyle = {
  color: 'rgba(255,255,255,0.8)',
  fontSize: '12px',
  fontWeight: 700,
  textAlign: 'right',
  overflowWrap: 'anywhere',
}

const highlightCardStyle = {
  padding: '24px',
  borderRadius: '20px',
  background:
    'linear-gradient(145deg, rgba(91,79,232,0.18), rgba(124,58,237,0.08))',
  border: '1px solid rgba(129,140,248,0.2)',
}

const highlightEyebrowStyle = {
  margin: '0 0 8px',
  color: '#A5B4FC',
  fontSize: '11px',
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
}

const highlightTitleStyle = {
  margin: '0 0 10px',
  color: '#FFFFFF',
  fontSize: '18px',
  lineHeight: 1.4,
}

const highlightTextStyle = {
  margin: '0 0 18px',
  color: 'rgba(255,255,255,0.48)',
  fontSize: '12px',
  lineHeight: 1.7,
}

const highlightButtonStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '100%',
  boxSizing: 'border-box',
  padding: '11px 14px',
  borderRadius: '11px',
  background: '#FFFFFF',
  color: '#37319A',
  textDecoration: 'none',
  fontSize: '12px',
  fontWeight: 800,
}